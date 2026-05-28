# 학습 하위 작업 이슈

## 부모 토픽 가이드

`docs/learning-agent/topic-guide-react-map-100k-markers.md`

## 문제

각 renderer가 서로 다른 데이터를 받거나 데이터 생성 비용이 렌더링 비용에 섞이면 성능 비교가 유효하지 않다.

## 핵심 질문

대량 marker dataset을 어떻게 결정론적으로 생성하고, 렌더링 비용과 분리해서 측정할 수 있는가?

## 작업 목표

uniform, clustered, hotspot distribution을 지원하는 결정론적 marker dataset generator를 구현한다.

## 범위

- stable id, x, y, latitude-like value, longitude-like value, category를 가진 marker type을 정의한다.
- seeded pseudo-random generator를 구현한다.
- 1만, 5만, 10만, 30만 dataset 크기를 지원한다.
- generation timing을 측정한다.
- renderer 간 dataset을 memoized reuse한다.

## 범위 밖

- 실제 geospatial import.
- 서버 사이드 dataset loading.
- persistent storage.

## 수동 구현

- seeded generator를 구현한다.
- 각 distribution function을 구현한다.
- generation metric과 renderer metric을 분리한다.

## AI scaffold

- type 정의.
- determinism test case.
- distribution 선택 UI wiring.

## 제안 파일 또는 컴포넌트 경계

- `src/benchmark/data/markerGenerator.ts`
- `src/benchmark/data/random.ts`
- `src/benchmark/data/markerGenerator.test.ts`

## 체크포인트

- [ ] 같은 seed와 option은 항상 같은 marker를 만든다.
- [ ] dataset generation 시간이 기록된다.
- [ ] renderer 전환이 불필요한 data regeneration을 일으키지 않는다.

## 수락 기준

- [ ] 1만, 5만, 10만, 30만 dataset을 생성할 수 있다.
- [ ] uniform, clustered, hotspot distribution을 사용할 수 있다.
- [ ] dataset generation이 renderer cost와 독립적으로 측정된다.

## 측정 증거

dataset 크기별 결정론적 출력과 generation timing을 보여주는 console, test, 또는 UI evidence.

## 완료 질문

1. 무엇을 직접 구현했는가?
2. AI는 무엇을 scaffold하거나 제안했는가?
3. 작동한다는 증거는 무엇인가?
4. 어떤 실수 또는 trade-off를 발견했는가?
5. 재사용할 수 있는 규칙은 무엇인가?
