# 학습 하위 작업 이슈

## 부모 토픽 가이드

`docs/learning-agent/topic-guide-react-map-100k-markers.md`

## 문제

renderer 속도만으로는 충분하지 않다. 큰 dataset은 filtering, indexing, 반복 가능한 benchmark movement도 필요하다.

## 핵심 질문

viewport filtering, spatial indexing, scripted pan 또는 zoom scenario는 성능 결과를 얼마나 바꾸는가?

## 작업 목표

visible marker filtering, 선택적 spatial indexing, scripted benchmark scenario를 추가한다.

## 범위

- viewport bounds 계산.
- linear visible marker filtering.
- 선택적 spatial index 실험.
- scripted pan benchmark.
- scripted zoom benchmark.
- run별 metric aggregation.

## 범위 밖

- 서버 사이드 vector tile.
- 운영용 geospatial indexing.
- distributed benchmark runner.

## 수동 구현

- viewport bounds와 filtering을 구현한다.
- scripted benchmark loop를 구현한다.
- renderer 간 metric 차이를 해석한다.

## AI scaffold

- metric aggregation type.
- result table UI.
- export 가능한 JSON result shape.

## 제안 파일 또는 컴포넌트 경계

- `src/benchmark/viewport/viewportMath.ts`
- `src/benchmark/viewport/filterVisibleMarkers.ts`
- `src/benchmark/metrics/scriptedBenchmark.ts`
- `src/benchmark/metrics/types.ts`

## 체크포인트

- [ ] scripted pan이 반복 가능한 metric result를 만든다.
- [ ] filtering cost가 draw cost와 별도로 측정된다.
- [ ] renderer mode 간 결과를 비교할 수 있다.

## 수락 기준

- [ ] 각 renderer가 동일한 scripted benchmark를 실행할 수 있다.
- [ ] metric에 average FPS, p95 frame time, visible marker count가 포함된다.
- [ ] 결과를 문서화 목적으로 복사하거나 export할 수 있다.

## 측정 증거

모든 renderer에 대해 1만, 5만, 10만 marker 결과를 보여주는 benchmark table output.

## 완료 질문

1. 무엇을 직접 구현했는가?
2. AI는 무엇을 scaffold하거나 제안했는가?
3. 작동한다는 증거는 무엇인가?
4. 어떤 실수 또는 trade-off를 발견했는가?
5. 재사용할 수 있는 규칙은 무엇인가?
