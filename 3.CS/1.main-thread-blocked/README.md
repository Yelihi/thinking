# 메인 스레드 블로킹과 I/O 성능 실험 정리

## 📋 목차
1. [실험 개요](#실험-개요)
2. [실험 1: 브라우저 메인 스레드 블로킹](#실험-1-브라우저-메인-스레드-블로킹)
3. [실험 2: Node.js I/O 성능 벤치마크](#실험-2-nodejs-io-성능-벤치마크)
4. [공통 교훈](#공통-교훈)
5. [결론](#결론)

---

## 실험 개요

이 문서는 두 가지 실험을 통해 **블로킹 작업의 문제점**과 **비동기/청크 처리의 중요성**을 보여줍니다:

1. **브라우저 메인 스레드 블로킹**: 동기적 무거운 작업이 UI를 얼리는 문제
2. **Node.js I/O 성능**: 동기 I/O vs 비동기 I/O vs 캐싱의 성능 차이

두 실험 모두 **단일 스레드 이벤트 루프** 환경에서 블로킹 작업의 영향을 보여줍니다.

---

## 실험 1: 브라우저 메인 스레드 블로킹

### 실험 목적

브라우저의 메인 스레드에서 **동기적으로 무거운 작업**을 수행하면 UI가 얼어버리는 문제를 보여주고, **청크 단위 처리**로 이를 해결하는 방법을 제시합니다.

### 코드 설명

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Main thread bottleneck</title>
  <style>
    body { font-family: system-ui; padding: 16px; }
    button { padding: 10px 14px; font-size: 16px; }
    #box { margin-top: 12px; width: 16px; height: 16px; background: #4f46e5; }
  </style>
</head>
<body>
  <h1>Main thread bottleneck demo</h1>
  <button id="btn">Block main thread</button>
  <div id="status"></div>
  <div id="box"></div>

  <script>
    const statusEl = document.querySelector("#status");
    const box = document.querySelector("#box");
    let t = 0;

    // 애니메이션: 계속 움직이는 박스
    function animate() {
      t++;
      box.style.transform = `translateX(${t % 260}px)`;
      requestAnimationFrame(animate);
    }
    animate();

    // ❌ 동기적 무거운 작업 (블로킹)
    function heavyWork() {
      const t0 = performance.now();
      let x = 0;
      for (let i = 0; i < 80_000_000; i++) x += i % 10;
      const t1 = performance.now();
      return (t1 - t0).toFixed(1);
    }

    // ✅ 청크 단위 처리 (논블로킹)
    function heavyWorkChunked(done) {
      const t0 = performance.now();
      let i = 0, x = 0;
      function chunk() {
        const start = performance.now();
        // 12ms 동안만 작업 수행 (한 프레임 시간)
        while (i < 80_000_000 && performance.now() - start < 12) {
          x += i % 10;
          i++;
        }
        if (i < 80_000_000) {
          // 아직 작업이 남았으면 다음 프레임에 계속
          requestAnimationFrame(chunk);
        } else {
          // 작업 완료
          done((performance.now() - t0).toFixed(1));
        }
      }
      requestAnimationFrame(chunk);
    }

    document.querySelector("#btn").addEventListener("click", () => {
      // ❌ 동기 버전: 애니메이션이 멈춤
      // statusEl.textContent = "Running (sync)...";
      // const ms = heavyWork();
      // statusEl.textContent = `Done: ${ms}ms (sync)`;

      // ✅ 청크 버전: 애니메이션이 계속 작동
      statusEl.textContent = "Running (chunked)...";
      heavyWorkChunked((ms) => statusEl.textContent = `Done: ${ms}ms (chunked)`);
    });
  </script>
</body>
</html>
```

### 주요 구성 요소

1. **애니메이션 (`animate` 함수)**
   - `requestAnimationFrame`을 사용해 박스를 계속 움직임
   - 메인 스레드가 블로킹되면 애니메이션이 멈춤

2. **동기적 무거운 작업 (`heavyWork` 함수)**
   - 8천만 번의 반복 계산을 동기적으로 수행
   - 메인 스레드를 완전히 블로킹
   - 실행 중에는 UI가 완전히 멈춤

3. **청크 단위 처리 (`heavyWorkChunked` 함수)**
   - 작업을 작은 단위로 나눠서 처리
   - 각 청크는 최대 12ms 동안만 실행 (한 프레임 시간)
   - `requestAnimationFrame`을 사용해 프레임 사이에 작업 수행
   - 애니메이션이 계속 작동함

### 동작 방식 비교

#### ❌ 동기 버전 (블로킹)

```
0ms:    버튼 클릭
1ms:    heavyWork() 시작
        [메인 스레드 블로킹 시작]
        [애니메이션 멈춤 ❌]
        [UI 완전히 얼음]
        ...
500ms:  작업 완료
501ms:  UI 다시 작동 시작
```

**문제점:**
- 애니메이션이 완전히 멈춤
- 버튼 클릭에 반응하지 않음
- 페이지가 "응답 없음" 상태

#### ✅ 청크 버전 (논블로킹)

```
0ms:    버튼 클릭
1ms:    heavyWorkChunked() 시작
        첫 번째 청크 실행 (12ms)
        [애니메이션 계속 작동 ✅]
13ms:   requestAnimationFrame으로 다음 프레임
        애니메이션 업데이트
        두 번째 청크 실행 (12ms)
25ms:   requestAnimationFrame으로 다음 프레임
        애니메이션 업데이트
        세 번째 청크 실행 (12ms)
...
500ms:  모든 청크 완료
        [애니메이션은 계속 작동했음 ✅]
```

**장점:**
- 애니메이션이 계속 작동
- UI가 반응성 유지
- 사용자 경험이 좋음

### 핵심 개념

1. **메인 스레드 블로킹**
   - 브라우저는 단일 메인 스레드에서 JavaScript 실행
   - 동기 작업이 오래 걸리면 UI 렌더링도 멈춤
   - `requestAnimationFrame`도 실행되지 않음

2. **시간 분할 (Time Slicing)**
   - 긴 작업을 작은 청크로 나눔
   - 각 청크는 짧은 시간(12ms) 동안만 실행
   - 프레임 사이에 작업을 수행해 UI가 계속 업데이트됨

3. **requestAnimationFrame 활용**
   - 브라우저의 다음 리페인트 전에 콜백 실행
   - 약 60fps (16.67ms 간격)로 실행
   - 12ms 제한으로 한 프레임 시간 내에 완료 보장

---

## 실험 2: Node.js I/O 성능 벤치마크

### 실험 목적

Node.js 서버에서 **동기 I/O**, **비동기 I/O**, 그리고 **캐싱**의 성능 차이를 비교하고, 동시 요청 상황에서의 성능을 측정합니다.

### 실험 구성

- **서버**: HTTP 서버로 요청 처리 (`server.js`)
- **벤치마크**: 동시 요청을 보내 성능 측정 (`bench.js`)
- **측정 지표**: p50, p95, p99 백분위수

### server.js

```javascript
import http from "http";
import fs from "fs";

const port = 3000;

// 토글: true=요청마다 sync I/O(느림), false=캐시(개선)
const USE_SLOW = false;

const cached = fs.readFileSync("./server.js", "utf8");

function slow(req, res) {
  const t0 = performance.now();
  // 실제 파일을 읽는 I/O 작업 (비동기)
  fs.readFile("./server.js", "utf8", (err, data) => {
    const t1 = performance.now();
    if (err) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: err.message }));
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, bytes: data.length, io_ms: +(t1 - t0).toFixed(2) }));
  });
}

function fast(req, res) {
  const t0 = performance.now();
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, bytes: cached.length, cpu_ms: +(t1 - t0).toFixed(2) }));
}

http.createServer((req, res) => {
  if (req.url === "/health") return res.end("ok");
  return (USE_SLOW ? slow : fast)(req, res);
}).listen(port, () => console.log(`http://localhost:${port} USE_SLOW=${USE_SLOW}`));
```

**주요 구성 요소:**
- `USE_SLOW`: 성능 비교를 위한 토글 변수
- `cached`: 서버 시작 시 한 번만 읽어 메모리에 저장 (캐시)
- `slow()`: 매 요청마다 파일을 읽는 함수 (I/O 작업)
- `fast()`: 캐시된 데이터를 사용하는 함수 (메모리 접근)

### bench.js

```javascript
import { performance } from "perf_hooks";

const URL = "http://localhost:3000/";
const CONCURRENCY = 20;  // 동시 실행 워커 수
const TOTAL = 400;       // 총 요청 수

async function one() {
  const t0 = performance.now();
  const r = await fetch(URL);
  await r.text();
  return performance.now() - t0;
}

function percentile(arr, p) {
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.min(a.length - 1, Math.floor((p / 100) * a.length));
  return a[idx];
}

async function main() {
  const lat = [];
  let i = 0;

  async function worker() {
    while (true) {
      const k = i++;
      if (k >= TOTAL) break;
      lat.push(await one());
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log({
    total: TOTAL,
    concurrency: CONCURRENCY,
    p50_ms: percentile(lat, 50).toFixed(1),
    p95_ms: percentile(lat, 95).toFixed(1),
    p99_ms: percentile(lat, 99).toFixed(1),
  });
}

main();
```

**주요 구성 요소:**
- `CONCURRENCY = 20`: 동시에 실행할 워커 수
- `TOTAL = 400`: 총 요청 수
- `one()`: 단일 HTTP 요청의 지연 시간 측정
- `percentile()`: 백분위수 계산 함수
- `worker()`: 각 워커가 요청을 보내는 함수

### 백분위수(Percentile) 이해

#### 정의

백분위수는 데이터를 크기 순으로 정렬했을 때, 특정 비율의 값이 그보다 작거나 같은 값을 의미합니다.

#### 주요 백분위수

- **p50 (50 백분위수, 중앙값)**: 절반의 요청이 이 값보다 빠르고, 절반이 이보다 느림
- **p95 (95 백분위수)**: 95%의 요청이 이 값보다 빠르고, 5%만 이보다 느림
- **p99 (99 백분위수)**: 99%의 요청이 이 값보다 빠르고, 1%만 이보다 느림

#### 왜 백분위수를 사용하나요?

성능 데이터는 보통 정규분포가 아닙니다. 대부분의 요청은 빠르지만, 일부는 매우 느릴 수 있어서 **오른쪽으로 긴 꼬리(long tail)**를 가집니다.

- **평균값**: 극단적인 값에 영향을 많이 받음
- **백분위수**: 실제 사용자 경험을 더 잘 반영
  - p50: 일반적인 사용자 경험
  - p95: 대부분의 사용자 경험 (상위 5% 제외)
  - p99: 거의 모든 사용자 경험 (상위 1% 제외)

### 실험의 목적

#### 증명하려는 것

1. **동기 I/O의 문제점**
   - 매 요청마다 `fs.readFileSync()`로 파일을 읽음
   - 디스크 I/O는 느리고, 동기 호출은 블로킹됨
   - 동시 요청이 많아질수록 대기 시간이 길어짐

2. **캐시의 효과**
   - 서버 시작 시 한 번만 읽어 메모리에 저장
   - 이후 요청은 메모리에서 즉시 반환
   - 동시 요청이 많아도 성능 저하가 적음

3. **비동기 I/O의 효과**
   - 이벤트 루프를 블로킹하지 않음
   - 여러 요청을 동시에 처리 가능
   - 전체 처리량(throughput) 향상

#### 왜 동시성(Concurrency)이 중요한가?

**워커를 20개로 나눠 동시 실행하는 이유:**

1. **실제 서버 환경 시뮬레이션**
   - 실제로는 여러 클라이언트가 동시에 요청
   - 단일 요청으로는 차이가 크지 않을 수 있음
   - 동시 요청이 많을수록 병목이 명확해짐

2. **동기 I/O의 블로킹 문제 드러내기**
   - `fs.readFileSync()`는 동기 호출로 블로킹됨
   - 요청 1개가 파일 읽는 동안 다른 요청은 대기
   - 동시 요청이 많을수록 대기 시간 누적

3. **리소스 경합(Resource Contention) 재현**
   - 20개 워커가 동시에 요청을 보냄
   - 서버는 동시에 20개 요청을 처리해야 함
   - 동기 I/O 사용 시 디스크 경합으로 대기 시간 증가

### 동기 I/O vs 비동기 I/O

#### Node.js의 동작 방식

Node.js는 **단일 스레드 이벤트 루프**를 사용합니다:

- HTTP 요청 수신은 비동기로 처리됨
- 하지만 요청 핸들러 내부의 **동기 작업**은 블로킹됨
- 한 요청이 동기 I/O를 수행하는 동안, 다른 요청 핸들러는 실행되지 않음

#### 동기 I/O (`fs.readFileSync`)

```javascript
const data = fs.readFileSync("./server.js", "utf8");
```

**특징:**
- 파일 읽기가 끝날 때까지 함수가 반환하지 않음
- 이벤트 루프를 멈춤 (블로킹)
- 다른 JavaScript 코드가 실행되지 않음

**동작 시나리오:**
```
0ms:  요청1, 요청2, ... 요청20 모두 서버에 도착
1ms:  요청1 핸들러 실행 → fs.readFileSync() 호출 → 블로킹 시작
      [요청2~20은 대기 상태 - 이벤트 루프가 블로킹됨]
5ms:  요청1의 파일 읽기 완료 → 응답 전송
6ms:  요청2 핸들러 실행 → fs.readFileSync() 호출 → 블로킹 시작
      [요청3~20은 계속 대기...]
```

**결과:**
- 순차 처리: 요청들이 하나씩 처리됨
- 예측 가능: 각 요청이 비슷한 시간 소요
- 전체 처리 시간: 요청 수 × 파일 읽기 시간

#### 비동기 I/O (`fs.readFile`)

```javascript
fs.readFile("./server.js", "utf8", (err, data) => {
  // 콜백 실행
});
```

**특징:**
- 파일 읽기 시작 후 즉시 반환
- 이벤트 루프가 블로킹되지 않음
- 다른 요청 핸들러도 실행 가능
- 파일 읽기가 완료되면 콜백 실행

**동작 시나리오:**
```
0ms:  요청1, 요청2, ... 요청20 모두 서버에 도착
1ms:  요청1 핸들러 실행 → fs.readFile() 호출 → 즉시 반환
      요청2 핸들러 실행 → fs.readFile() 호출 → 즉시 반환
      ...
      요청20 핸들러 실행 → fs.readFile() 호출 → 즉시 반환
      [모든 요청이 파일 읽기를 시작, 이벤트 루프는 계속 작동]
3ms:  요청1의 파일 읽기 완료 → 콜백 실행 → 응답 전송
4ms:  요청3의 파일 읽기 완료 → 콜백 실행 → 응답 전송
5ms:  요청2의 파일 읽기 완료 → 콜백 실행 → 응답 전송
...
```

**결과:**
- 동시 처리: 여러 요청이 동시에 파일 읽기 시도
- 효율적: Node.js의 libuv가 I/O 작업을 효율적으로 스케줄링
- 전체 처리 시간: 파일 읽기 시간 + 스케줄링 오버헤드

### 성능 비교 결과

#### 1. 동기 I/O (`fs.readFileSync`)

```
p50:  6.2ms
p95:  30.1ms
p99:  36.3ms
```

**특징:**
- 순차 처리로 예측 가능한 성능
- p50과 p99의 차이가 상대적으로 작음 (약 6배)
- 동시 요청이 많을수록 대기 시간 누적

#### 2. 비동기 I/O - 잘못된 구현

```javascript
// ❌ 잘못된 사용법
const data = fs.readFile("./server.js", "utf8");
```

```
p50:  3.7ms  ✅ (개선)
p95:  53.5ms ❌ (악화)
p99:  55.3ms ❌ (악화)
```

**문제점:**
- 비동기 함수를 동기처럼 사용
- 파일 내용을 제대로 읽지 못함
- 디스크 I/O 경합으로 일부 요청이 매우 느려짐

#### 3. 비동기 I/O - 올바른 구현

```javascript
// ✅ 올바른 사용법
fs.readFile("./server.js", "utf8", (err, data) => {
  // 콜백에서 처리
});
```

```
p50:  3.8ms  ✅ (동기 대비 38% 개선)
p95:  18.5ms ✅ (동기 대비 38% 개선)
p99:  23.3ms ✅ (동기 대비 36% 개선)
```

**특징:**
- 모든 백분위수에서 개선
- 동시 처리로 전체 처리량 향상
- 이벤트 루프가 블로킹되지 않아 효율적

#### 4. 캐싱 (예상 결과)

```
p50:  ~1-2ms  ✅✅✅ (매우 빠름)
p95:  ~2-3ms  ✅✅✅ (매우 빠름)
p99:  ~3-5ms  ✅✅✅ (매우 빠름)
```

**특징:**
- 디스크 I/O를 완전히 제거
- 메모리 접근만으로 처리
- 가장 빠르고 일관된 성능

---

## 공통 교훈

### 1. 단일 스레드 환경의 특성

두 실험 모두 **단일 스레드 이벤트 루프** 환경에서 실행됩니다:

- **브라우저**: 메인 스레드에서 JavaScript 실행
- **Node.js**: 이벤트 루프에서 JavaScript 실행

**공통점:**
- 동기 작업이 오래 걸리면 다른 작업이 대기
- 블로킹 작업은 전체 시스템에 영향을 줌
- 비동기/청크 처리가 필수적

### 2. 블로킹 작업의 문제점

#### 브라우저
- UI가 얼어버림
- 애니메이션이 멈춤
- 사용자 인터랙션에 반응하지 않음

#### Node.js 서버
- 다른 요청 처리가 지연됨
- 전체 처리량(throughput) 감소
- 응답 시간 증가

### 3. 해결 방법

#### 브라우저: 시간 분할 (Time Slicing)
- 긴 작업을 작은 청크로 나눔
- `requestAnimationFrame` 활용
- 각 청크는 짧은 시간(12ms) 동안만 실행

#### Node.js: 비동기 I/O
- 비동기 함수 사용 (`fs.readFile` vs `fs.readFileSync`)
- 콜백이나 Promise 활용
- 이벤트 루프를 블로킹하지 않음

### 4. 성능 측정의 중요성

#### 브라우저
- 시각적 피드백 (애니메이션 멈춤 여부)
- 사용자 경험 관찰

#### Node.js
- 백분위수 측정 (p50, p95, p99)
- 동시 요청 상황에서 테스트
- 실제 부하 상황 시뮬레이션

### 5. 최적화 전략

1. **작업 분할**
   - 긴 작업을 작은 단위로 나눔
   - 프레임/이벤트 루프 사이에 처리

2. **비동기 처리**
   - I/O 작업은 비동기로
   - 콜백/Promise/async-await 활용

3. **캐싱**
   - 자주 사용하는 데이터는 메모리에 저장
   - I/O 작업 자체를 피하는 것이 최선

4. **동시성 테스트**
   - 단일 요청 테스트로는 부족
   - 실제 부하 상황에서 측정

---

## 결론

두 실험은 서로 다른 환경(브라우저 vs Node.js)이지만, **동일한 핵심 원칙**을 보여줍니다:

### 공통 원칙

1. **블로킹 작업은 피해야 함**
   - 동기 작업은 전체 시스템에 영향을 줌
   - 사용자 경험과 성능에 직접적인 영향

2. **비동기/청크 처리가 필수**
   - 브라우저: 시간 분할로 UI 반응성 유지
   - Node.js: 비동기 I/O로 처리량 향상

3. **실제 상황에서 테스트**
   - 단일 작업 테스트로는 부족
   - 동시 요청/애니메이션 등 실제 시나리오에서 검증

4. **성능 측정의 중요성**
   - 브라우저: 시각적 피드백
   - Node.js: 백분위수 측정

### 실무 권장사항

#### 프론트엔드
- 무거운 계산은 Web Worker 사용 고려
- 긴 작업은 청크 단위로 분할
- `requestAnimationFrame`으로 시간 분할
- 사용자 경험을 최우선으로

#### 백엔드
- 가능하면 비동기 I/O 사용
- 자주 읽는 데이터는 캐싱
- 성능 측정 시 백분위수 사용
- 실제 부하 상황에서 테스트

---

*이 문서는 브라우저 메인 스레드 블로킹과 Node.js I/O 성능 벤치마크 실험을 통해 학습한 내용을 정리한 것입니다.*
