# 학습 하위 작업 이슈

## 부모 토픽 가이드

`docs/learning-agent/topic-guide-react-map-100k-markers.md`

## 문제

benchmark 결과는 Google Map, Naver Map, Kakao Map 구현 선택으로 번역될 수 있어야 실제로 가치가 있다.

## 핵심 질문

benchmark 결과를 실제 map SDK integration 의사결정에 어떻게 적용해야 하는가?

## 작업 목표

DOM, Canvas, WebGL, filtering, clustering, tile 기반 접근을 Google, Naver, Kakao map 사용 방식에 연결하는 decision guide를 작성한다.

## 범위

- benchmark 결과를 요약한다.
- SDK marker의 한계를 설명한다.
- custom overlay 또는 canvas overlay integration path를 설명한다.
- 사용 가능한 경우 WebGL integration path를 설명한다.
- marker count와 interaction requirement별 추천 접근을 제시한다.
- hit testing, accessibility, label, clustering, memory 관련 risk를 정리한다.

## 범위 밖

- 세 SDK 전체에 대한 완성된 production implementation.
- API key setup guide.
- vendor별 billing 분석.

## 수동 구현

- benchmark evidence를 해석한다.
- 최종 decision matrix를 만든다.
- 어떤 상황에서 어떤 전략을 선택해야 하는지 설명한다.

## AI scaffold

- report outline.
- table formatting.
- comparison section 초안 문장.

## 제안 파일 또는 컴포넌트 경계

- `docs/results/react-map-100k-marker-benchmark-report.md`
- `docs/results/sdk-applicability-matrix.md`

## 체크포인트

- [ ] report가 측정된 benchmark evidence를 참조한다.
- [ ] 각 SDK에 practical integration note가 있다.
- [ ] decision matrix가 구체적인 threshold와 caveat를 포함한다.

## 수락 기준

- [ ] report가 10만 dense point에서 SDK marker만으로 부족한 이유를 설명한다.
- [ ] report가 DOM, Canvas, WebGL을 evidence와 함께 비교한다.
- [ ] report가 추천 production architecture를 제시한다.

## 측정 증거

최종 benchmark result table과 SDK applicability matrix.

## 완료 질문

1. 무엇을 직접 구현했는가?
2. AI는 무엇을 scaffold하거나 제안했는가?
3. 작동한다는 증거는 무엇인가?
4. 어떤 실수 또는 trade-off를 발견했는가?
5. 재사용할 수 있는 규칙은 무엇인가?
