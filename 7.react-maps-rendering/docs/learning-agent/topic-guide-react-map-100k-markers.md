# 토픽 가이드 이슈

## 주제

React 지도에서 10만 개 이상 마커를 렌더링하는 성능 벤치마크.

## 문제

Google Map, Naver Map, Kakao Map SDK는 적은 수나 중간 규모의 마커는 무리 없이 렌더링할 수 있다. 하지만 10만 개 이상의 마커를 SDK Marker, DOM 노드, React 컴포넌트, 개별 객체로 표현하면 렌더링 지연과 인터랙션 버벅임이 쉽게 발생한다. 이 실험은 병목이 어디에서 발생하는지 확인하고, 팬/줌/호버/클릭/필터 변경 상황에서도 사용할 수 있는 렌더링 모델을 찾기 위한 것이다.

## 핵심 학습 질문

React에서 10만 개 이상의 지도 포인트를 렌더링할 때 언제 SDK Marker, Canvas overlay, WebGL overlay, viewport filtering, clustering, tile 기반 로딩을 선택해야 하는가?

## 학습 목표

- 대량 지도 포인트 렌더링을 위한 통제된 React 벤치마크 앱을 만든다.
- SDK 또는 DOM marker 렌더링, Canvas 2D overlay 렌더링, WebGL overlay 렌더링을 비교한다.
- 데이터 생성, React 상태 변경, 지도 viewport 변경, hit test 비용을 렌더링 비용과 분리해서 측정한다.
- Google, Naver, Kakao map SDK의 확장 지점이 구현 선택에 어떤 영향을 주는지 이해한다.
- 실제 React 서비스에서 대량 마커 렌더링 전략을 선택할 수 있는 판단 기준을 만든다.

## 대상 스택과 제약

- React와 TypeScript를 사용한다.
- 로컬 개발 환경은 Vite를 사용한다.
- 먼저 mock map viewport로 실험하고, 실제 map SDK adapter는 이후 단계에서 검토한다.
- 벤치마크는 1만, 5만, 10만, 30만 포인트를 지원한다.
- 모든 렌더러는 동일한 생성 데이터셋을 사용한다.
- 핵심 학습 로직은 직접 설명할 수 있을 만큼 명시적으로 유지한다.
- 첫 벤치마크 단계에서는 외부 지도 API key가 필요하지 않아야 한다.

## 아키텍처 방향

### 선택지 A

처음부터 실제 Google, Naver, Kakao map SDK를 사용하고 각 SDK 안에서 세 가지 렌더링 전략을 구현한다.

이 방식은 운영 환경과 가장 가깝지만, API key, SDK 로딩, 좌표 투영, adapter 복잡도가 렌더링 문제를 이해하기 전에 먼저 커진다. 첫 학습 단계로는 적합하지 않다.

### 선택지 B

mock map viewport를 가진 통제된 React 벤치마크 shell을 먼저 만들고, 동일한 viewport 모델 위에서 SDK 유사 DOM marker, Canvas 2D overlay, WebGL overlay를 구현한다.

이 방식은 렌더링 병목을 분리해서 비교하기 쉽고 API key 없이 시작할 수 있다. 이후 SDK별 작업은 벤치마크 구조가 아니라 adapter 경계에 집중할 수 있다.

### 추천 방향

선택지 B를 먼저 진행한다. pan과 zoom을 시뮬레이션하는 benchmark shell을 만들고, 동일한 marker dataset을 세 렌더러로 렌더링하며 객관적인 metric을 수집한다. baseline이 안정화되면 Google, Naver, Kakao map에 붙이는 adapter 검토 또는 작은 integration spike를 진행한다.

## 가설

- SDK 또는 DOM marker는 객체 수, layout, style recalculation, event binding, React reconciliation 비용 때문에 가장 먼저 한계에 도달한다.
- viewport filtering은 실패 시점을 늦추지만, dense viewport에서는 SDK marker 방식이 여전히 과부하될 수 있다.
- Canvas 2D는 draw를 batch 처리하고 React를 render loop에서 분리하며 visible point만 그리면 10만 포인트를 더 안정적으로 처리할 수 있다.
- WebGL은 가장 큰 point count를 처리할 가능성이 높지만 hit testing, styling, zoom scale 처리, SDK integration 난이도가 높다.
- dataset이 main thread에서 저렴하게 filtering할 수 있는 수준을 넘으면 tile 기반 로딩 또는 spatial indexing이 필요해진다.

## 범위

- 결정론적인 point dataset을 생성한다.
- renderer 선택, marker count, distribution type, viewport control, metric panel을 가진 benchmark UI를 구현한다.
- SDK 유사 DOM marker baseline을 구현한다.
- Canvas 2D point renderer를 구현한다.
- WebGL point renderer를 구현한다.
- viewport filtering과 spatial indexing을 명시적인 benchmark variant로 추가한다.
- frame time, FPS, initial render time, 가능한 경우 memory, interaction latency를 측정한다.
- 각 전략이 Google, Naver, Kakao map SDK에 어떻게 대응되는지 문서화한다.

## 범위 밖

- 운영용 API key 관리.
- Google, Naver, Kakao SDK 전체 기능 parity.
- 서버 사이드 tile 생성.
- 실제 geospatial database 연동.
- marker clustering library만으로 문제를 해결하는 방식.
- 픽셀 단위로 완성된 시각 디자인.

## 참고 자료 키워드

- React map 100k markers Canvas overlay
- Google Maps OverlayView canvas markers performance
- Google Maps WebGLOverlayView point rendering
- Kakao Map custom overlay performance
- Naver Maps overlay marker performance
- rbush spatial index viewport filtering
- deck.gl scatterplot layer map overlay
- supercluster marker clustering
- requestAnimationFrame canvas map overlay
- WebGL point sprites instanced rendering

## 측정 계획

- 초기 데이터 생성 시간을 측정한다.
- 첫 renderer mount 시간을 측정한다.
- scripted pan 중 평균 FPS를 측정한다.
- scripted pan 중 p95 frame time을 측정한다.
- zoom update latency를 측정한다.
- viewport filtering 이후 visible marker count를 측정한다.
- hover 또는 click hit-test 시간을 측정한다.
- browser API가 제공하는 경우 memory 사용량을 측정한다.
- 1만, 5만, 10만, 30만 marker 단계별 결과를 기록한다.

## 하위 이슈 분해 기준

각 하위 이슈는 독립적으로 검토 가능한 하나의 학습 결과를 만들어야 한다.

- 작은 benchmark 기능.
- 측정 가능한 renderer 구현.
- 문서화된 비교 결과.
- 명확한 수동 구현 경계.
- 학습자가 trade-off를 설명할 수 있는 checkpoint.

## 제안 하위 이슈

1. React benchmark shell 만들기.
2. 결정론적 marker dataset 생성 구현하기.
3. SDK 유사 DOM marker baseline 구현하기.
4. Canvas overlay renderer 구현하기.
5. WebGL overlay renderer 구현하기.
6. viewport filtering, spatial indexing, scripted benchmark 추가하기.
7. Google/Naver/Kakao map SDK 적용성과 최종 판단 기준 문서화하기.

## 완료 질문

1. 이 토픽은 어떤 문제를 해결했는가?
2. 어떤 아키텍처 또는 접근을 선택했고, 왜 선택했는가?
3. 이 접근이 효과적이라는 증거는 무엇인가?
4. 가장 중요한 수동 구현 영역은 무엇인가?
5. 다음 작업에 재사용할 수 있는 규칙은 무엇인가?
