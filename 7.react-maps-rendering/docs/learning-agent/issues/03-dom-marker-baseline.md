# 학습 하위 작업 이슈

## 부모 토픽 가이드

`docs/learning-agent/topic-guide-react-map-100k-markers.md`

## 문제

SDK marker와 DOM marker는 사용하기 쉽지만, 어느 지점에서 한계에 도달하는지는 추정이 아니라 측정으로 확인해야 한다.

## 핵심 질문

SDK 유사 DOM marker rendering은 몇 개의 marker부터 사용할 수 없을 정도로 느려지며, 어떤 비용이 주요 병목인가?

## 작업 목표

SDK marker 동작을 충분히 흉내 내는 DOM marker baseline을 구현해서 object와 DOM scaling cost를 드러낸다.

## 범위

- absolutely positioned marker element를 구현한다.
- viewport filtering을 선택적으로 적용한다.
- event handler mode를 선택적으로 적용한다.
- initial render와 pan measurement를 기록한다.
- 브라우저가 불안정해질 수 있는 경우 warning 또는 guard를 둔다.

## 범위 밖

- 정확한 Google/Naver/Kakao marker 구현.
- 운영용 clustering library.
- marker animation.

## 수동 구현

- visible marker filtering을 구현한다.
- viewport transform 기반 marker positioning을 구현한다.
- pan 중 DOM count와 frame time을 측정한다.

## AI scaffold

- marker visual CSS.
- benchmark metric display wiring.
- safety guard UI.

## 제안 파일 또는 컴포넌트 경계

- `src/renderers/dom/DomMarkerRenderer.tsx`
- `src/renderers/dom/domMarkerRenderer.css`
- `src/benchmark/viewport/filterVisibleMarkers.ts`

## 체크포인트

- [ ] DOM renderer가 최소 1만 marker를 렌더링할 수 있다.
- [ ] viewport filtering을 켜고 끌 수 있다.
- [ ] 성능 저하가 metric에서 확인된다.

## 수락 기준

- [ ] initial render time이 기록된다.
- [ ] pan FPS 또는 frame time이 기록된다.
- [ ] DOM node count가 표시된다.

## 측정 증거

1만, 5만, 10만 marker에서 DOM marker 동작을 비교한 benchmark 기록.

## 완료 질문

1. 무엇을 직접 구현했는가?
2. AI는 무엇을 scaffold하거나 제안했는가?
3. 작동한다는 증거는 무엇인가?
4. 어떤 실수 또는 trade-off를 발견했는가?
5. 재사용할 수 있는 규칙은 무엇인가?
