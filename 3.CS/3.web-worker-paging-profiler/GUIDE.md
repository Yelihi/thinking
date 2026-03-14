---
date: 2026-03-04
dow: Wed
session: CS
topic: Worker + Paging + React Profiler
duration_target: "2h"
evidence_required: ["React Profiler screenshot", "requestId logs"]
---

# Worker + Paging + React Profiler

## 목표
- Worker로 필터링 오프로딩 (indices 반환)
- 페이징으로 렌더 비용 통제
- requestId로 최신 요청만 반영(out-of-order 방지)
- React Profiler로 커밋 시간 증명

## 실험 A (Basic) — Worker + indices + Paging
- UI: query input, result count, page/pageSize, prev/next
- Worker: query → indices(Uint32Array, transfer) 반환
- Main: indices를 기준으로 현재 페이지 범위만 렌더

### 체크
- 페이지 렌더 개수(pageSize) 고정 (예: 50)
- 렌더는 items[indices[i]] lookup으로만

## 실험 B (Advanced) — requestId 최신만 반영 + Profiler 비교
### B-1 requestId gate
- send: { type:'QUERY', requestId, query }
- recv: { type:'RESULT', requestId, indices }
- if (recv.requestId !== latest) ignore

### B-2 React Profiler
- 비교군1: 메인 스레드 filter
- 비교군2: worker filter
- 동일 시나리오(타이핑 10회 + 페이지 이동 3회)로 commit duration 비교

## 필수 증거 2개
1) React Profiler 캡처(Commit duration 보이게)
2) requestId 로그
   - send id=…
   - recv id=… ignored/applied

## 네트워크 루틴(10분)
- DevTools Network → 번들 JS → Timing 캡처 1장 + 요약 1줄

## 결과/회고
- 느낀 점:
- 개선 포인트:
- 다음: