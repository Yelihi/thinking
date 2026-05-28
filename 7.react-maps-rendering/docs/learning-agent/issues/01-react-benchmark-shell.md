# 학습 하위 작업 이슈

## 부모 토픽 가이드

`docs/learning-agent/topic-guide-react-map-100k-markers.md`

## 문제

viewport 상태, dataset 크기, renderer 선택, 성능 측정을 안정적으로 제어하는 shell이 없으면 renderer 성능을 공정하게 비교할 수 없다.

## 핵심 질문

React 앱이 자체적으로 렌더링 병목이 되지 않도록 하면서 렌더링 실험을 호스팅하려면 어떤 구조가 필요한가?

## 작업 목표

renderer tab, marker count control, distribution control, viewport control, metric panel을 가진 benchmark app shell을 만든다.

## 범위

- Vite React TypeScript 앱을 scaffold한다.
- 메인 benchmark page를 만든다.
- DOM, Canvas, WebGL renderer 선택 UI를 만든다.
- marker count와 distribution control을 만든다.
- metric panel placeholder를 만든다.
- pan과 zoom을 위한 mock map viewport state를 만든다.

## 범위 밖

- 실제 map SDK 연동.
- 최종 renderer 구현.
- 고급 측정 자동화.

## 수동 구현

- benchmark state model을 정의한다.
- 어떤 state를 React에 두고 어떤 renderer state를 React 밖에 둘지 결정한다.
- renderer 선택을 공통 renderer boundary에 연결한다.

## AI scaffold

- 프로젝트 scaffold.
- 기본 component layout.
- renderer input과 metric type 정의.
- placeholder renderer component.

## 제안 파일 또는 컴포넌트 경계

- `src/app/App.tsx`
- `src/benchmark/BenchmarkPage.tsx`
- `src/benchmark/types.ts`
- `src/renderers/RendererHost.tsx`

## 체크포인트

- [ ] 앱에서 세 가지 renderer mode를 전환할 수 있다.
- [ ] marker count와 distribution control이 benchmark state를 변경한다.
- [ ] viewport state 변경이 전체 앱 remount를 유발하지 않는다.

## 수락 기준

- [ ] 앱이 Vite로 로컬 실행된다.
- [ ] benchmark page가 계획된 control을 노출한다.
- [ ] renderer 구현체를 하나의 interface를 통해 교체할 수 있다.

## 측정 증거

shell이 mode 전환과 placeholder metric 표시를 수행하는 screenshot 또는 기록.

## 완료 질문

1. 무엇을 직접 구현했는가?
2. AI는 무엇을 scaffold하거나 제안했는가?
3. 작동한다는 증거는 무엇인가?
4. 어떤 실수 또는 trade-off를 발견했는가?
5. 재사용할 수 있는 규칙은 무엇인가?
