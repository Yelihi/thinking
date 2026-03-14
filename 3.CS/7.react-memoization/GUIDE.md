---
date: 2026-03-11
dow: Wed
session: CS
topic: React Memoization (memo/useCallback/useMemo)
duration_target: "2h"
evidence_required: ["React Profiler screenshot", "console render logs"]
---

# React Memoization

## 목표
- 불필요한 리렌더를 관측하고 제거
- memo/useCallback/useMemo의 “언제 쓰는지”를 증거로 정리

## 실험 A (Basic) — React.memo 효과
- 부모 state 변경 시 자식 1000개가 리렌더되는지 확인
- React.memo 적용 후 렌더 감소 확인

## 실험 B (Advanced) — 함수 props로 memo가 깨지는 케이스
- inline onClick 전달 → memo 무효화
- useCallback으로 참조 안정화
- Profiler로 commit duration 비교

## 필수 증거 2개
1) React Profiler 캡처 (memo 전/후)
2) 콘솔 렌더 로그(전/후)

## 네트워크 루틴(10분)
- curl -v 일부 출력 기록

## 결과/회고
- memo가 유효했던 조건:
- 과도한 memo 위험: