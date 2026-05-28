# 학습 하위 작업 이슈

## 부모 토픽 가이드

`docs/learning-agent/topic-guide-react-map-100k-markers.md`

## 문제

WebGL은 큰 point set을 효율적으로 렌더링할 수 있지만, buffer 관리, shader logic, 복잡한 interaction handling이 필요하다.

## 핵심 질문

대량 지도 marker rendering에서 WebGL은 어느 시점부터 복잡도를 감수할 만한 선택이 되는가?

## 작업 목표

benchmark dataset을 위한 WebGL point renderer를 구현하고 DOM, Canvas renderer와 비교한다.

## 범위

- 하나의 WebGL canvas overlay를 사용한다.
- point position buffer를 만든다.
- 기본 vertex shader와 fragment shader를 작성한다.
- viewport transform uniform을 사용한다.
- point size와 color category를 지원한다.
- draw timing을 측정한다.

## 범위 밖

- 완전한 deck.gl integration.
- 고급 picking engine.
- marker label.
- 실제 basemap synchronization.

## 수동 구현

- buffer creation과 update를 구현한다.
- shader program setup을 구현한다.
- viewport transform uniform을 구현한다.

## AI scaffold

- TypeScript utility wrapper.
- WebGL initialization 실패 error display.
- renderer metric UI wiring.

## 제안 파일 또는 컴포넌트 경계

- `src/renderers/webgl/WebGLMarkerRenderer.tsx`
- `src/renderers/webgl/createProgram.ts`
- `src/renderers/webgl/markerShaders.ts`

## 체크포인트

- [ ] WebGL renderer가 generated dataset을 그린다.
- [ ] marker position이 pan과 zoom에 맞게 갱신된다.
- [ ] buffer creation cost가 draw cost와 별도로 측정된다.

## 수락 기준

- [ ] 일반적인 laptop browser에서 10만 marker가 안정적으로 interaction된다.
- [ ] 30만 marker 동작이 측정된다.
- [ ] WebGL failure state가 명확하게 처리된다.

## 측정 증거

10만, 30만 marker에서 WebGL을 Canvas와 DOM과 비교한 benchmark 기록.

## 완료 질문

1. 무엇을 직접 구현했는가?
2. AI는 무엇을 scaffold하거나 제안했는가?
3. 작동한다는 증거는 무엇인가?
4. 어떤 실수 또는 trade-off를 발견했는가?
5. 재사용할 수 있는 규칙은 무엇인가?
