# React 지도 10만 Marker 실험 계획

## 목표

10만 개 이상의 지도 point에 대해 세 가지 marker rendering 전략을 비교하는 React 실험 앱을 만든다.

1. SDK 유사 DOM marker.
2. Canvas 2D overlay.
3. WebGL overlay.

이 앱은 Google, Naver, Kakao map SDK 복잡도를 도입하기 전에 성능 차이를 측정 가능하게 만드는 것을 목표로 한다.

## 구현 순서

1. React, TypeScript, Vite를 scaffold한다.
2. benchmark shell과 renderer host를 만든다.
3. 결정론적 marker dataset generator를 추가한다.
4. DOM marker baseline을 구현한다.
5. Canvas overlay renderer를 구현한다.
6. WebGL overlay renderer를 구현한다.
7. scripted pan과 zoom benchmark를 추가한다.
8. 최종 SDK 적용성 report를 작성한다.

## 수동 학습 경계

학습자가 직접 구현해야 하는 영역:

- marker generation과 deterministic distribution.
- viewport transform math.
- visible marker filtering.
- Canvas drawing loop.
- WebGL buffer와 shader 기본 구조.
- benchmark 결과 해석.

AI가 scaffold할 수 있는 영역:

- project file.
- UI layout.
- type definition.
- placeholder component.
- documentation skeleton.
- test harness wiring.

## 제안 앱 구조

```text
src/
  app/
    App.tsx
  benchmark/
    BenchmarkPage.tsx
    types.ts
    data/
      markerGenerator.ts
      random.ts
    metrics/
      scriptedBenchmark.ts
      types.ts
    viewport/
      viewportMath.ts
      filterVisibleMarkers.ts
  renderers/
    RendererHost.tsx
    dom/
      DomMarkerRenderer.tsx
    canvas/
      CanvasMarkerRenderer.tsx
      drawMarkers.ts
    webgl/
      WebGLMarkerRenderer.tsx
      createProgram.ts
      markerShaders.ts
```

## 첫 구현 milestone

첫 milestone은 app shell과 dataset generator까지로 제한한다.

- 앱이 로컬에서 실행된다.
- marker count를 선택할 수 있다.
- dataset generation이 결정론적이다.
- renderer tab은 존재하지만 placeholder여도 된다.
- metric panel이 generation time과 placeholder renderer metric을 표시할 수 있다.

이렇게 하면 성능 민감 renderer 코드를 추가하기 전에 첫 구현을 작게 유지하고 설명 가능하게 검토할 수 있다.
