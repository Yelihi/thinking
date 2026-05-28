# 학습 하위 작업 이슈

## 부모 토픽 가이드

`docs/learning-agent/topic-guide-react-map-100k-markers.md`

## 문제

Canvas는 더 적은 browser object로 많은 point를 그릴 수 있지만, 불필요한 redraw, React re-render, 비싼 hit test를 피하도록 구현해야 한다.

## 핵심 질문

batched Canvas drawing은 10만 개 이상의 point에서 DOM marker 대비 어느 정도 성능을 회복하는가?

## 작업 목표

visible marker를 batch로 그리는 Canvas 2D renderer를 구현하고, pan과 zoom 중 draw cost를 측정한다.

## 범위

- 하나의 canvas overlay를 사용한다.
- device pixel ratio를 처리한다.
- viewport transform을 screen coordinate로 변환한다.
- point drawing을 batch 처리한다.
- requestAnimationFrame 기반 redraw를 구현한다.
- 간단한 hit test를 선택적으로 구현한다.

## 범위 밖

- 고급 symbol rendering.
- text label.
- 실제 map SDK overlay attachment.

## 수동 구현

- canvas setup과 resize를 구현한다.
- draw loop와 viewport transform을 구현한다.
- imperative drawing을 React reconciliation 밖에 둔다.

## AI scaffold

- hook signature.
- 기본 metric wiring.
- canvas host CSS layout.

## 제안 파일 또는 컴포넌트 경계

- `src/renderers/canvas/CanvasMarkerRenderer.tsx`
- `src/renderers/canvas/drawMarkers.ts`
- `src/renderers/canvas/useCanvasViewport.ts`

## 체크포인트

- [ ] Canvas renderer가 DOM renderer와 동일한 dataset을 그린다.
- [ ] Canvas가 pan과 zoom에 맞춰 redraw된다.
- [ ] draw time이 React render time과 별도로 측정된다.

## 수락 기준

- [ ] 10만 marker를 10만 DOM node 없이 렌더링할 수 있다.
- [ ] scripted pan 중 frame metric을 볼 수 있다.
- [ ] 시각 출력이 viewport state와 계속 정렬된다.

## 측정 증거

5만, 10만, 30만 marker에서 Canvas와 DOM을 비교한 benchmark 기록.

## 완료 질문

1. 무엇을 직접 구현했는가?
2. AI는 무엇을 scaffold하거나 제안했는가?
3. 작동한다는 증거는 무엇인가?
4. 어떤 실수 또는 trade-off를 발견했는가?
5. 재사용할 수 있는 규칙은 무엇인가?
