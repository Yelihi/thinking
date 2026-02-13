# Image Worker — Web Worker 기반 이미지 전처리

브라우저 메인 스레드를 블로킹하지 않고 이미지를 리사이즈/압축하는 Worker-first 아키텍처 데모입니다.

## 기술 스택

React + Vite + TypeScript + Tailwind CSS v4

---

## 1. 전체 처리 흐름

사용자가 이미지를 선택하고 Process 버튼을 클릭한 시점부터, 처리된 이미지가 화면에 렌더링되기까지의 과정입니다.

### 1-1. 아키텍처 개요

```
┌─ UI Layer ──────────────────────────────────────────────────────┐
│  ImagePrepPanel (상태 소유)                                      │
│    ├─ FileInputSet         ← 파일 선택                          │
│    ├─ FileInformation      ← 원본 파일 정보 표시                  │
│    ├─ ImageResizeProcess   ← 처리 버튼 + 결과 렌더링 (props 기반) │
│    └─ LongTaskList         ← Long Task 모니터링 표시              │
└─────────────────────────────────────────────────────────────────┘
         │ onResize()
         ▼
┌─ Hook Layer ────────────────────────────────────────────────────┐
│  useImageResize                                                 │
│    ├─ UI 상태 관리 (idle / processing / error)                   │
│    ├─ processImage() 호출                                       │
│    └─ try-catch 로 최종 에러 처리                                 │
└─────────────────────────────────────────────────────────────────┘
         │ await processImage(file, opts)
         ▼
┌─ Business Logic Layer ──────────────────────────────────────────┐
│  processImage                                                   │
│    ├─ Worker-first 전략: workerClient.run()                     │
│    ├─ 실패 시 fallback: compressOnMainThread()                   │
│    └─ Blob → URL.createObjectURL() → previewUrl 반환             │
└─────────────────────────────────────────────────────────────────┘
         │ postMessage(req)        │ DOM canvas
         ▼                        ▼
┌─ Worker 스레드 ──────┐  ┌─ Main Thread Fallback ─┐
│  imageWorker.ts      │  │  fallbackMainTread.ts   │
│  OffscreenCanvas     │  │  document.createElement │
│  convertToBlob()     │  │  canvas.toBlob()        │
└──────────────────────┘  └─────────────────────────┘
```

### 1-2. 단계별 상세 흐름

```
[사용자]  파일 선택 (input[type=file])
    │
    ▼
[FileInputSet]  onChange → onFileChange(file) → ImagePrepPanel의 file state 갱신
    │
    ▼
[사용자]  "Process" 버튼 클릭
    │
    ▼
[ImagePrepPanel]  handleResize() → onResize(file, 1600, 0.85)
    │
    ▼
[useImageResize]  상태를 'processing'으로 변경
    │              await processImage(file, { maxDim, quality })
    │
    ▼
[processImage]  ① crypto.randomUUID()로 요청 ID 생성
    │           ② client.run({ id, file, maxDim, quality })
    │
    ▼
[workerClient]  ③ pending Map에 { id → resolve } 저장
    │           ④ worker.postMessage(req) — Worker 스레드로 전송
    │              (메인 스레드는 블로킹되지 않음, await는 함수만 중단)
    │
    ▼
[imageWorker]   ⑤ createImageBitmap(file) — 비동기 비트맵 디코딩
(Worker 스레드)  ⑥ fitMaxDimension() — 비율 유지 축소 계산
                ⑦ new OffscreenCanvas(w, h) — DOM 없이 canvas 생성
                ⑧ ctx.drawImage(bmp, ...) — 리사이즈된 이미지 그리기
                ⑨ canvas.convertToBlob({ type: 'image/jpeg', quality })
                   — JPEG 인코딩 → Blob 생성
                ⑩ self.postMessage({ ok: true, blob, ... })
    │
    ▼
[workerClient]  ⑪ onmessage → pending.get(id)로 resolve 함수 찾기
    │           ⑫ resolve(response) → Promise 완료
    │
    ▼
[processImage]  ⑬ URL.createObjectURL(blob) → previewUrl 생성
    │           ⑭ { processedBlob, previewUrl, meta } 반환
    │
    ▼
[useImageResize]  ⑮ setResizeResult(결과) — React state 갱신
    │              ⑯ 상태를 'idle'로 변경
    │
    ▼
[ImageResizeProcess]  ⑰ <img src={previewUrl} /> 렌더링
                      ⑱ 처리 정보 표시 (크기, 시간, 비율 등)
```

### 1-3. Worker 실패 시 Fallback 흐름

```
[imageWorker]  convertToBlob 미지원 → throw Error
(Worker 스레드) └─ catch → { ok: false, error: '...' } 로 postMessage
                  (Worker의 throw는 메인 스레드로 전파되지 않음 — 실행 컨텍스트가 다르기 때문)
    │
    ▼
[processImage]  res.ok === false 확인
    │           → compressOnMainThread(file, maxDim, quality) 실행
    │
    ▼
[fallbackMainTread]  document.createElement('canvas') — DOM canvas 사용
(메인 스레드)         canvas.toBlob() — 콜백 기반 API를 Promise로 래핑
                     (이 작업은 메인 스레드를 블로킹하여 Long Task로 기록됨)
```

### 1-4. 에러 처리 전략

```
Worker 성공         → 결과 반환                    → useImageResize의 try 블록에서 처리
Worker 실패         → { ok: false } 반환 (throw X) → processImage 내에서 fallback 실행
Worker + fallback 실패 → throw 전파                → useImageResize의 catch 블록에서 UI에 에러 표시
```

에러 처리는 한 곳(useImageResize)에서 담당하고, processImage는 할 수 있는 것(fallback)은 시도한 후 안 되면 솔직하게 throw 합니다.

---

## 2. 사용된 Browser API

### 2-1. Web Worker (`new Worker()`)

```typescript
const worker = new Worker(new URL('./imageWorker.ts', import.meta.url), { type: 'module' })
```

- **역할**: 메인 스레드와 별도의 스레드에서 JavaScript를 실행
- **특성**: DOM에 접근할 수 없지만, CPU 집약적 작업을 메인 스레드 블로킹 없이 처리 가능
- **통신 방식**: `postMessage()` / `onmessage`로 메시지 기반 통신 (일방향, fire-and-forget)
- **본 프로젝트에서의 활용**: 이미지 디코딩/리사이즈/인코딩을 Worker에서 처리하여 UI 응답성 보장. `pending Map` + `id` 패턴으로 요청-응답을 1:1 매칭하여 Promise 기반 async/await 인터페이스 제공

### 2-2. `createImageBitmap()`

```typescript
const bmp = await createImageBitmap(req.file)
```

- **역할**: File/Blob을 비동기로 디코딩하여 `ImageBitmap` 객체를 생성
- **특성**: Worker와 메인 스레드 모두에서 사용 가능한 전역 API. 비동기로 동작하여 디코딩 중 스레드를 블로킹하지 않음
- **본 프로젝트에서의 활용**: Worker 내에서 이미지 파일을 비트맵으로 변환한 후, `drawImage()`로 canvas에 그릴 때 추가 디코딩 없이 즉시 사용 가능

### 2-3. `OffscreenCanvas`

```typescript
const canvas = new OffscreenCanvas(width, height)
```

- **역할**: DOM과 분리된 canvas — Worker 환경에서도 사용 가능
- **특성**: DOM에 붙지 않으므로 렌더링 파이프라인에 영향을 주지 않음. `convertToBlob()` 메서드로 Promise 기반 Blob 생성 지원
- **Worker에서 이미지 인코딩의 유일한 방법**: Worker에는 DOM이 없으므로 `document.createElement('canvas')`를 사용할 수 없고, OffscreenCanvas가 유일한 대안

### 2-4. `OffscreenCanvas.convertToBlob()`

```typescript
blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
```

- **역할**: canvas 내용을 지정된 포맷/품질로 인코딩하여 Blob을 생성
- **특성**: Promise를 반환하는 최신 API (vs 메인 스레드의 `canvas.toBlob()`은 콜백 기반)
- **본 프로젝트에서의 활용**: Worker에서 리사이즈된 이미지를 JPEG Blob으로 인코딩. 미지원 환경에서는 에러를 throw하여 메인 스레드 fallback으로 전환

### 2-5. `HTMLCanvasElement.toBlob()` (Fallback)

```typescript
canvas.toBlob((b) => b ? resolve(b) : reject(...), 'image/jpeg', quality)
```

- **역할**: `convertToBlob()`과 동일하지만 콜백 기반 API
- **특성**: 오래된 API라 콜백으로 결과를 전달. `async/await`를 사용하려면 Promise로 래핑해야 함
- **본 프로젝트에서의 활용**: Worker 실패 시 메인 스레드에서 `document.createElement('canvas')` + `toBlob()`으로 이미지 처리. 메인 스레드에서 동작하므로 **Long Task로 기록됨**

### 2-6. `URL.createObjectURL()`

```typescript
const previewUrl = URL.createObjectURL(blob)
```

- **역할**: Blob을 참조하는 `blob:` URL을 생성
- **특성**: Blob 데이터를 복사하지 않고 참조만 생성하므로 매우 빠름. 사용 후 `URL.revokeObjectURL()`로 해제하지 않으면 메모리 누수 발생
- **본 프로젝트에서의 활용**: 처리된 Blob을 `<img src>`에 바로 사용할 수 있는 URL로 변환. `useImageResize`에서 이전 URL을 `revokeObjectURL()`로 해제하여 메모리 관리

### 2-7. `PerformanceObserver` (Long Task API)

```typescript
const obs = new PerformanceObserver((list) => { ... })
obs.observe({ entryTypes: ['longtask'] })
```

- **역할**: 메인 스레드에서 50ms 이상 소요되는 작업을 감지
- **특성**: Chrome 기반 브라우저에서 지원. `entryTypes: ['longtask']`로 구독하면 블로킹 작업 발생 시 콜백으로 알려줌
- **본 프로젝트에서의 활용**: Worker 처리 vs 메인 스레드 fallback 처리의 차이를 수치로 시각화. Worker 사용 시 Long Task 미발생, 메인 스레드 사용 시 Long Task 기록 → UI 응답성 차이를 증명

### 2-8. `crypto.randomUUID()`

```typescript
const id = crypto.randomUUID()
```

- **역할**: RFC 4122 v4 UUID를 생성
- **특성**: Worker와 메인 스레드 모두에서 사용 가능
- **본 프로젝트에서의 활용**: Worker 요청마다 고유 ID를 부여하여, 여러 요청이 동시에 진행될 때 응답을 올바른 Promise에 매칭

---

## 3. 실무 환경에서의 활용

### 3-1. SNS 이미지 업로드 (Instagram, Twitter, Facebook)

사용자가 여러 장의 고해상도 사진(4000×3000, 10MB+)을 선택했을 때:

- **Worker 없이**: 메인 스레드에서 리사이즈/압축 → UI 프리징 → 사용자가 "앱이 멈췄다"고 느낌
- **Worker 사용**: 백그라운드에서 리사이즈/압축 → 업로드 진행률 표시, 텍스트 입력, 필터 선택 등 동시 가능

Instagram처럼 여러 이미지를 한 번에 선택하는 경우, Worker 풀(여러 Worker)을 사용하면 병렬 처리도 가능합니다.

### 3-2. 무한 스크롤 이미지 갤러리

Pinterest, 인스타그램 피드 같은 무한 스크롤에서:

- 서버에서 원본 이미지 대신 작은 썸네일을 보내더라도, 클라이언트에서 추가 최적화가 필요한 경우
- 스크롤 중 이미지를 Worker에서 디코딩/리사이즈하면 **스크롤 버벅임(jank)** 방지
- `createImageBitmap()`으로 이미지를 사전 디코딩해두면, 화면에 진입할 때 즉시 렌더링 가능

### 3-3. 실시간 이미지 편집기 (Canva, Figma)

- 필터 적용, 크롭, 리사이즈 등을 Worker에서 처리
- 사용자가 슬라이더로 밝기를 조절하는 동안에도 UI가 매끄럽게 반응
- `OffscreenCanvas`로 미리보기 렌더링을 Worker에서 처리하고, 완료된 프레임만 메인 스레드에 전달

### 3-4. 채팅 앱 이미지 전송 (KakaoTalk, Slack)

- 사용자가 이미지를 붙여넣으면 즉시 리사이즈/압축
- 채팅 입력, 스크롤, 알림 등 다른 UI 기능에 영향 없음
- 압축된 Blob을 바로 서버에 업로드 가능

### 3-5. E-commerce 상품 등록

판매자가 상품 사진 10~20장을 동시에 업로드할 때:

- Worker에서 일괄 리사이즈/압축 → 업로드 전 파일 크기 대폭 감소
- 메인 스레드는 자유로워 폼 입력, 드래그 정렬 등 가능
- 서버 대역폭/저장 비용 절감 효과

### 3-6. 스레드 비교

| 메인 스레드 처리 | Worker 처리 |
|:---|:---|
| UI 블로킹 (50ms+ → Long Task) | UI 자유로움 |
| 한 번에 하나만 처리 가능 | 메인 스레드와 병렬 처리 |
| 사용자 체감 성능 저하 | 사용자 체감 성능 유지 |
| Long Task 모니터에 기록됨 | Long Task 미발생 |

**Worker-first, Main Thread Fallback** 전략은 최대한 Worker에서 처리하되, 지원하지 않는 환경에서는 메인 스레드로 자연스럽게 전환하는 점진적 향상(Progressive Enhancement) 패턴입니다.
