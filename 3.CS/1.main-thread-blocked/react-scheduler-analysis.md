# React Scheduler 심층 분석

> React 내부의 **협력적 스케줄링(Cooperative Scheduling)** 엔진.
> 브라우저 메인 스레드를 독점하지 않으면서 우선순위 기반으로 작업을 처리하는 핵심 모듈이다.

---

## 목차

1. [핵심 개념](#1-핵심-개념)
2. [자료구조](#2-자료구조)
3. [우선순위 체계](#3-우선순위-체계)
4. [전체 로직 순서도](#4-전체-로직-순서도)
5. [주요 함수 상세 분석](#5-주요-함수-상세-분석)
6. [호스트 환경 연동](#6-호스트-환경-연동)
7. [Yielding 전략 (shouldYieldToHost)](#7-yielding-전략)
8. [유틸리티 함수들](#8-유틸리티-함수들)
9. [전체 흐름 시나리오](#9-전체-흐름-시나리오)

---

## 1. 핵심 개념

React Scheduler는 **하나의 질문**에서 시작한다:

> "브라우저가 60fps를 유지하려면 한 프레임에 ~16ms밖에 없는데,
> React 렌더링이 그보다 오래 걸리면 어떻게 하지?"

**답: 작업을 잘게 쪼개고, 프레임마다 양보(yield)하면서 조금씩 처리한다.**

```
기존 방식 (동기적)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100ms
[        React 렌더링 (메인 스레드 점유)        ]
→ 그동안 사용자 입력, 애니메이션 모두 멈춤 (버벅임)

Scheduler 방식 (협력적)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[React 5ms][양보][React 5ms][양보][React 5ms]...
→ 양보 구간에서 브라우저가 페인팅, 이벤트 처리 가능
```

### 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **우선순위 기반** | 긴급한 작업(클릭)이 덜 긴급한 작업(데이터 fetch)보다 먼저 실행 |
| **시간 분할** | 한 번에 모든 작업을 끝내지 않고, 일정 시간마다 메인 스레드에 양보 |
| **만료 기반 선점** | 우선순위가 낮아도 너무 오래 기다리면 만료되어 강제 실행 |
| **지연 작업 지원** | `delay` 옵션으로 미래 시점에 작업 예약 가능 |

---

## 2. 자료구조

Scheduler는 두 개의 **Min Heap(최소 힙)** 을 사용한다.

```
┌─────────────────────────────────────────────────────────┐
│                    Scheduler 내부 상태                     │
│                                                         │
│  taskQueue (Min Heap)         timerQueue (Min Heap)      │
│  ┌───────────────────┐       ┌───────────────────┐      │
│  │ sortIndex =        │       │ sortIndex =        │      │
│  │  expirationTime    │       │  startTime         │      │
│  │                   │       │                   │      │
│  │ "지금 실행 가능한   │       │ "아직 시작 시간이    │      │
│  │  작업들"           │       │  안 된 작업들"       │      │
│  └───────────────────┘       └───────────────────┘      │
│                                                         │
│  peek() → 만료 시간이          peek() → 시작 시간이       │
│           가장 빠른 작업                 가장 빠른 작업      │
└─────────────────────────────────────────────────────────┘
```

### Task 객체 구조

```js
{
  id: number,              // 고유 식별자 (삽입 순서 유지)
  callback: Function|null, // 실행할 콜백 (null이면 취소된 작업)
  priorityLevel: number,   // 우선순위 레벨
  startTime: number,       // 실행 시작 가능 시점
  expirationTime: number,  // 만료 시점 (startTime + timeout)
  sortIndex: number,       // 힙 정렬 기준
  isQueued: boolean,       // (프로파일링용) 큐에 있는지 여부
}
```

### 두 큐의 관계

```
시간 흐름 →

timerQueue                    taskQueue
[delay된 작업A]  ──시간 도달──→  [작업A] ←── 실행 대기
[delay된 작업B]                 [작업C]
                               [작업D]

advanceTimers() 함수가 timerQueue → taskQueue 이동을 담당
```

---

## 3. 우선순위 체계

```
우선순위 높음 ←──────────────────────────────→ 우선순위 낮음

Immediate    UserBlocking    Normal    Low      Idle
  -1ms          250ms        5000ms   10000ms   ~12.4일
 (즉시)      (0.25초)        (5초)    (10초)   (사실상 ∞)
```

| 우선순위 | timeout 값 | 용도 예시 |
|---------|-----------|----------|
| `ImmediatePriority` | -1ms | 동기적으로 즉시 실행해야 하는 작업 |
| `UserBlockingPriority` | 250ms | 클릭, 키 입력 등 사용자 인터랙션 응답 |
| `NormalPriority` | 5000ms | 일반적인 React 렌더링 업데이트 |
| `LowPriority` | 10000ms | 중요도 낮은 UI 업데이트 |
| `IdlePriority` | ~1073741823ms | 화면에 보이지 않는 작업, 프리페칭 등 |

### expirationTime 계산

```
expirationTime = startTime + timeout

예시: NormalPriority 작업이 현재 시간 1000ms에 등록되면
  expirationTime = 1000 + 5000 = 6000ms

→ 6000ms가 지나면 이 작업은 "만료"되어 다른 작업보다 우선 실행
→ 만료된 작업은 shouldYieldToHost()와 무관하게 계속 실행
```

---

## 4. 전체 로직 순서도

### 4-1. 작업 등록 흐름 (unstable_scheduleCallback)

```
unstable_scheduleCallback(priorityLevel, callback, options)
│
├── currentTime = getCurrentTime()
├── startTime 계산 (delay 옵션 반영)
├── timeout 계산 (우선순위별)
├── expirationTime = startTime + timeout
│
├── Task 객체 생성
│
├─── startTime > currentTime ?  (delay가 있는가?)
│    │
│    ├── YES: 지연 작업
│    │   ├── sortIndex = startTime
│    │   ├── push(timerQueue, newTask)
│    │   │
│    │   └── taskQueue가 비어있고 이 작업이 timerQueue의 첫 번째?
│    │       ├── YES → requestHostTimeout(handleTimeout, delay)
│    │       └── NO  → (이미 더 빠른 타이머가 있으므로 패스)
│    │
│    └── NO: 즉시 실행 가능한 작업
│        ├── sortIndex = expirationTime
│        ├── push(taskQueue, newTask)
│        │
│        └── 현재 작업 실행 중이 아닌가?
│            ├── YES → requestHostCallback(flushWork)
│            └── NO  → (현재 workLoop가 알아서 발견)
│
└── return newTask
```

### 4-2. 작업 실행 흐름 (메인 루프)

```
requestHostCallback(flushWork)
│
└── schedulePerformWorkUntilDeadline()
    │
    └── (MessageChannel / setImmediate / setTimeout)
        │
        └── performWorkUntilDeadline()
            │
            ├── startTime = getCurrentTime()  ← 시간 측정 시작
            │
            └── scheduledHostCallback(true, currentTime)
                │
                └── flushWork(hasTimeRemaining, initialTime)
                    │
                    ├── isPerformingWork = true
                    │
                    └── workLoop(hasTimeRemaining, initialTime)
                        │
                        ├── advanceTimers(currentTime)
                        │   └── timerQueue → taskQueue 이동
                        │
                        ├── currentTask = peek(taskQueue)
                        │
                        └── while (currentTask !== null)
                            │
                            ├── 만료 안 됐고 & 시간 초과?
                            │   └── YES → break (양보)
                            │
                            ├── callback 실행
                            │   └── continuationCallback = callback(didTimeout)
                            │
                            ├── continuation이 함수?
                            │   ├── YES → currentTask.callback = continuation
                            │   │         (다음 루프에서 이어서 실행)
                            │   └── NO  → pop(taskQueue)  (작업 완료)
                            │
                            ├── advanceTimers(currentTime)
                            │
                            └── currentTask = peek(taskQueue)

                        작업이 남아있으면?
                        ├── YES → return true
                        │         → performWorkUntilDeadline에서 재스케줄
                        └── NO  → 타이머 큐 확인 후 return false
```

### 4-3. 지연 작업 → 실행 가능 작업 전환 흐름

```
requestHostTimeout(handleTimeout, delay)
│
└── setTimeout(() => handleTimeout(getCurrentTime()), delay)
    │
    └── handleTimeout(currentTime)
        │
        ├── advanceTimers(currentTime)
        │   │
        │   └── timerQueue에서 startTime ≤ currentTime인 작업들을
        │       taskQueue로 이동
        │
        └── taskQueue에 작업이 있는가?
            ├── YES → requestHostCallback(flushWork)
            │         → workLoop 시작
            └── NO  → timerQueue의 다음 타이머에 대해
                      requestHostTimeout 재설정
```

### 4-4. shouldYieldToHost 결정 흐름

```
shouldYieldToHost()
│
├── timeElapsed = getCurrentTime() - startTime
│
├── timeElapsed < frameInterval (기본 5ms)?
│   └── YES → return false (아직 양보 불필요)
│
├── enableIsInputPending?
│   │
│   ├── needsPaint === true?
│   │   └── YES → return true (페인트 필요, 즉시 양보)
│   │
│   ├── timeElapsed < continuousInputInterval (50ms)?
│   │   └── isInputPending()
│   │       → 이산 입력(클릭 등)이 있으면 양보
│   │
│   ├── timeElapsed < maxInterval (300ms)?
│   │   └── isInputPending({includeContinuous: true})
│   │       → 연속 입력(마우스오버 등)도 체크
│   │
│   └── timeElapsed >= maxInterval?
│       └── return true (무조건 양보)
│
└── isInputPending 미지원?
    └── return true (안전하게 양보)
```

---

## 5. 주요 함수 상세 분석

### 5-1. `unstable_scheduleCallback` — 작업 등록의 시작점

```js
function unstable_scheduleCallback(priorityLevel, callback, options)
```

**역할**: 새로운 작업을 스케줄러에 등록한다. React의 `setState`, `useEffect` 등이 최종적으로 이 함수를 호출한다.

**핵심 로직**:

1. **시작 시간 결정**: `options.delay`가 있으면 현재 시간 + delay, 없으면 현재 시간
2. **만료 시간 계산**: 우선순위별 timeout을 더해 expirationTime 생성
3. **큐 배치**:
   - delay가 있는 작업 → `timerQueue` (sortIndex = startTime)
   - 즉시 실행 가능 → `taskQueue` (sortIndex = expirationTime)
4. **실행 트리거**: 작업 실행 중이 아니면 `requestHostCallback(flushWork)` 호출

```
왜 sortIndex가 다른가?

timerQueue: "누가 가장 먼저 시작할 수 있는가?" → startTime 기준
taskQueue:  "누가 가장 먼저 만료되는가?" → expirationTime 기준

이렇게 하면 긴급한 작업(timeout이 짧은)이 자연스럽게 먼저 실행된다.
```

### 5-2. `workLoop` — 스케줄러의 심장

```js
function workLoop(hasTimeRemaining, initialTime)
```

**역할**: 실제 작업을 하나씩 꺼내 실행하는 메인 루프.

**핵심 판단 로직**:

```
currentTask.expirationTime > currentTime  →  아직 만료 안 됨
&&
(!hasTimeRemaining || shouldYieldToHost())  →  시간 다 씀

두 조건이 모두 참이면 → break (양보)
```

이 의미는:
- **만료된 작업은 무조건 실행** (expirationTime ≤ currentTime이면 첫 조건이 false)
- **만료 안 된 작업은 시간이 남아있을 때만 실행**

**continuation 패턴**:

```js
const continuationCallback = callback(didUserCallbackTimeout);

if (typeof continuationCallback === 'function') {
  // 작업이 덜 끝남 → 콜백을 교체하고 다음 루프에서 이어서
  currentTask.callback = continuationCallback;
} else {
  // 작업 완료 → 큐에서 제거
  pop(taskQueue);
}
```

이것이 React의 **시간 분할(Time Slicing)** 의 핵심이다.
콜백이 함수를 반환하면 "아직 할 일이 남았다"는 의미이고,
스케줄러는 양보 후 다시 돌아와서 그 함수를 실행한다.

### 5-3. `advanceTimers` — 타이머 큐 → 작업 큐 전환

```js
function advanceTimers(currentTime)
```

**역할**: timerQueue에서 시작 시간이 된 작업들을 taskQueue로 옮긴다.

```
timerQueue (시간순 정렬)
[A: startTime=100] [B: startTime=200] [C: startTime=500]

현재 시간 = 250일 때 advanceTimers 호출

→ A(100 ≤ 250) → taskQueue로 이동
→ B(200 ≤ 250) → taskQueue로 이동
→ C(500 > 250) → 남김 (return)
```

취소된 작업(callback === null)은 이 과정에서 조용히 버려진다.

### 5-4. `flushWork` — workLoop의 래퍼

```js
function flushWork(hasTimeRemaining, initialTime)
```

**역할**: workLoop를 실행하기 위한 설정/정리를 담당.

- `isPerformingWork = true` 설정 (재진입 방지)
- 불필요한 timeout 취소
- 에러 발생 시 프로파일링 처리
- 완료 후 상태 복원 (`currentTask`, `currentPriorityLevel`, `isPerformingWork`)

### 5-5. `handleTimeout` — 지연 작업의 알람

```js
function handleTimeout(currentTime)
```

**역할**: setTimeout으로 예약된 콜백. 지연 작업의 시작 시간이 되면 호출된다.

```
handleTimeout이 호출되면:
1. advanceTimers() → 시작 시간 된 작업들을 taskQueue로
2. taskQueue가 비어있지 않으면 → flushWork 시작
3. taskQueue가 비어있으면 → 다음 타이머에 대해 다시 setTimeout
```

---

## 6. 호스트 환경 연동

Scheduler는 **브라우저의 이벤트 루프를 활용**하여 양보를 구현한다.

### 6-1. `schedulePerformWorkUntilDeadline` — 다음 작업 틱 예약

```
우선순위: setImmediate > MessageChannel > setTimeout

┌──────────────────┬─────────────────────────────────────────┐
│ API              │ 선택 이유                                │
├──────────────────┼─────────────────────────────────────────┤
│ setImmediate     │ Node.js에서 프로세스 종료를 방해하지 않음.    │
│                  │ 가장 빠른 비동기 실행.                      │
├──────────────────┼─────────────────────────────────────────┤
│ MessageChannel   │ 브라우저 환경의 기본 선택.                   │
│                  │ setTimeout의 4ms 최소 지연을 회피.          │
├──────────────────┼─────────────────────────────────────────┤
│ setTimeout(0)    │ 최후의 폴백. 4ms 클램핑 때문에 비효율적.     │
└──────────────────┴─────────────────────────────────────────┘
```

### 왜 MessageChannel인가?

```
setTimeout(fn, 0)의 문제:
  → 브라우저가 최소 4ms 지연을 강제 (중첩 호출 시)
  → 1프레임(16ms)에 최대 4번밖에 양보 불가

MessageChannel:
  → 지연 없이 다음 마이크로태스크 이후 실행
  → 훨씬 세밀한 시간 분할 가능
```

### 6-2. `performWorkUntilDeadline` — 실제 실행 진입점

```js
const performWorkUntilDeadline = () => {
  startTime = currentTime;  // 시간 측정 시작
  hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);

  if (hasMoreWork) {
    schedulePerformWorkUntilDeadline();  // 재스케줄
  } else {
    isMessageLoopRunning = false;
    scheduledHostCallback = null;
  }
  needsPaint = false;  // 양보했으므로 페인트 플래그 리셋
};
```

**에러 처리 전략**: try-catch를 의도적으로 사용하지 않는다.
에러가 발생하면 `hasMoreWork`가 true로 남아서 다음 틱에서 재시도된다.
이는 디버깅을 더 쉽게 만들기 위한 의도적 설계이다.

### 6-3. `requestHostCallback` / `requestHostTimeout`

```
requestHostCallback(callback)
  → scheduledHostCallback = callback
  → MessageChannel.postMessage()로 비동기 실행 예약
  → 실행 가능한 작업을 처리하기 위함

requestHostTimeout(callback, ms)
  → setTimeout(callback, ms)
  → 지연 작업의 시작 시간에 맞춰 알람 설정
```

---

## 7. Yielding 전략

### `shouldYieldToHost` — 언제 브라우저에 양보할 것인가

이 함수가 Scheduler의 **반응성(Responsiveness)** 의 핵심이다.

```
시간대별 양보 전략:

0ms ──────── 5ms ──────── 50ms ──────── 300ms ────→
│            │             │              │
│ 양보 안 함  │ 이산 입력    │ 연속 입력     │ 무조건
│            │ 체크         │ 까지 체크      │ 양보
│            │             │              │
│ "아직      │ "클릭 같은    │ "마우스오버   │ "너무 오래
│  안됨"     │  급한 입력    │  도 포함해서  │  걸렸으니
│            │  있나?"      │  체크"        │  무조건"
```

### `isInputPending` API

```js
navigator.scheduling.isInputPending()
```

브라우저가 제공하는 실험적 API로, **대기 중인 사용자 입력이 있는지** 확인한다.

- `isInputPending()`: 이산 입력(클릭, 키 입력) 확인
- `isInputPending({includeContinuous: true})`: 연속 입력(마우스 이동) 포함 확인

이 API가 없는 환경에서는 `frameInterval`(기본 5ms) 초과 시 항상 양보한다.

### `needsPaint` 플래그

`requestPaint()`가 호출되면 `needsPaint = true`가 되고,
다음 `shouldYieldToHost` 호출에서 즉시 양보한다.
`performWorkUntilDeadline`이 끝나면 리셋된다.

---

## 8. 유틸리티 함수들

### `unstable_runWithPriority`

```js
// 특정 우선순위로 동기적으로 코드 실행
unstable_runWithPriority(UserBlockingPriority, () => {
  // 이 안에서 scheduleCallback 호출 시
  // currentPriorityLevel이 UserBlockingPriority
});
```

### `unstable_next`

```js
// 현재 우선순위가 Normal 이상이면 Normal로 낮추어 실행
// Normal 미만이면 현재 우선순위 유지
unstable_next(() => {
  // "이 작업은 현재 컨텍스트보다 덜 긴급해"
});
```

### `unstable_wrapCallback`

```js
// 콜백을 현재 우선순위로 "감싸서" 나중에 실행해도 같은 우선순위 유지
const wrapped = unstable_wrapCallback(myCallback);
// 나중에 wrapped()를 호출하면 감쌀 당시의 우선순위로 실행
```

### `unstable_cancelCallback`

```js
// 작업 취소 — callback을 null로 설정
// 힙에서 임의 노드를 제거할 수 없기 때문에 이 방식 사용
// workLoop나 advanceTimers에서 null callback을 만나면 건너뜀
unstable_cancelCallback(task);
```

### `forceFrameRate`

```js
// 프레임 간격 수동 설정 (0~125 fps)
forceFrameRate(60);  // frameInterval = 16ms
forceFrameRate(0);   // 기본값으로 리셋
```

---

## 9. 전체 흐름 시나리오

### 시나리오: 사용자가 버튼을 클릭하고, 동시에 백그라운드 데이터를 로딩

```
시간 →  0ms      5ms     10ms    15ms    20ms    25ms
        │        │        │       │       │       │
        ▼        ▼        ▼       ▼       ▼       ▼

1) unstable_scheduleCallback(NormalPriority, renderUpdate)
   → taskQueue: [render (exp: 5000ms)]

2) unstable_scheduleCallback(UserBlockingPriority, handleClick)
   → taskQueue: [click (exp: 250ms), render (exp: 5000ms)]
   ※ 클릭의 expirationTime이 더 작으므로 힙의 루트에 위치

3) requestHostCallback(flushWork) → MessageChannel.postMessage()

4) 다음 틱에서 performWorkUntilDeadline() 실행
   │
   └── flushWork → workLoop 시작
       │
       ├── peek(taskQueue) → click 작업 (가장 긴급)
       │   └── handleClick() 실행 → 완료 (continuation 없음)
       │       └── pop(taskQueue)
       │
       ├── peek(taskQueue) → render 작업
       │   └── renderUpdate() 실행 시작
       │       │
       │       ├── 5ms 경과... shouldYieldToHost() 체크
       │       │   └── timeElapsed(5ms) ≥ frameInterval(5ms)
       │       │       → 사용자 입력 있나? → 없음 → 계속
       │       │
       │       ├── 10ms 경과... shouldYieldToHost() 체크
       │       │   └── 사용자 입력 있나? → 없음 → 계속
       │       │
       │       ├── 15ms 경과... 아직 렌더링 중
       │       │   └── return continuationCallback (남은 작업)
       │       │       → currentTask.callback = continuation
       │       │       → break (양보)
       │       │
       │       └── workLoop return true (남은 작업 있음)
       │
       └── performWorkUntilDeadline
           └── hasMoreWork = true
               → schedulePerformWorkUntilDeadline() 호출
               → 다음 틱에서 이어서 실행

5) 브라우저 페인팅 (양보 구간에서)

6) 다음 틱에서 나머지 render 작업 이어서 실행
   └── continuation() 호출 → 완료
       └── pop(taskQueue)
       └── return false (모든 작업 완료)
```

### 시나리오: delay가 있는 작업

```
시간 →  0ms                500ms              510ms
        │                   │                   │

1) unstable_scheduleCallback(NormalPriority, fetchData, {delay: 500})
   → startTime = 500 > currentTime(0)
   → timerQueue: [fetchData (startTime: 500)]
   → requestHostTimeout(handleTimeout, 500)

2) 500ms 후 setTimeout 발화
   └── handleTimeout(500)
       ├── advanceTimers(500)
       │   └── fetchData.startTime(500) ≤ currentTime(500)
       │       → taskQueue로 이동
       └── requestHostCallback(flushWork)

3) 다음 틱에서 fetchData 실행
```

---

## 부록: 상태 변수 요약

| 변수 | 타입 | 설명 |
|------|------|------|
| `taskQueue` | MinHeap | 실행 가능한 작업들 (expirationTime 정렬) |
| `timerQueue` | MinHeap | 지연된 작업들 (startTime 정렬) |
| `taskIdCounter` | number | 작업 ID 자동 증가 카운터 |
| `currentTask` | Task\|null | 현재 실행 중인 작업 |
| `currentPriorityLevel` | number | 현재 우선순위 컨텍스트 |
| `isPerformingWork` | boolean | workLoop 실행 중 여부 (재진입 방지) |
| `isHostCallbackScheduled` | boolean | flushWork가 예약되어 있는지 |
| `isHostTimeoutScheduled` | boolean | handleTimeout이 예약되어 있는지 |
| `isMessageLoopRunning` | boolean | MessageChannel 루프 실행 중 여부 |
| `scheduledHostCallback` | Function\|null | 다음 틱에 실행할 콜백 |
| `startTime` | number | 현재 작업 배치의 시작 시간 (양보 판단용) |
| `frameInterval` | number | 양보 간격 (기본 5ms) |
| `needsPaint` | boolean | 페인트 요청 여부 |
| `isSchedulerPaused` | boolean | 디버깅용 일시정지 |

---

## 부록: 왜 이 설계인가?

### Q: 왜 힙에서 취소된 작업을 바로 제거하지 않나?

힙(배열 기반)에서 **임의 위치의 노드를 제거하면 O(n)** 이 걸린다.
대신 callback을 null로 설정하고 나중에 peek할 때 건너뛰는 것이 더 효율적이다.
이를 **lazy deletion(지연 삭제)** 이라 한다.

### Q: 왜 requestAnimationFrame을 사용하지 않나?

rAF는 **프레임 경계에 맞춰** 실행된다. 하지만 대부분의 React 작업은
프레임 정렬이 필요 없다. MessageChannel은 프레임과 무관하게
가능한 빨리 실행되므로 더 세밀한 스케줄링이 가능하다.

### Q: continuation 패턴의 의미는?

React의 Fiber reconciler가 컴포넌트 트리를 순회하다가
시간이 부족하면 **현재 위치를 기억하는 함수를 반환**한다.
스케줄러는 이 함수를 다시 callback에 넣어두고,
다음 틱에서 중단된 지점부터 이어서 처리한다.
이것이 **Concurrent Mode의 핵심 메커니즘**이다.
