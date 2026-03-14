---
date: 2026-03-06
dow: Fri
session: CS
topic: Worker Cancel Strategy (stale computation stop)
duration_target: "2h"
evidence_required: ["console logs", "React Profiler screenshot"]
---

# Worker Cancel Strategy

## 목표
- stale 결과 무시(requestId gate) + stale 계산 자체 중단(worker cancel)
- 빠른 타이핑에서도 최신 query만 “계산/반영”

## 실험 A (Basic) — stale result ignore
- 메인: latestRequestId만 반영
- 오래된 RESULT는 ignore

## 실험 B (Advanced) — worker 내부 cancel
- worker 내부 latestRequestId 유지
- 루프 내부에서 requestId !== latestRequestId이면 즉시 return

## 필수 증거 2개
1) 콘솔 로그: send/recv + ignored/applied
2) React Profiler: cancel 전/후 commit duration 비교(가능하면)

## 네트워크 루틴(10분)
- curl -v 출력 일부 붙여넣기 (DNS/TLS/TTFB 구간 확인)

## 결과/회고
- cancel 효과:
- 남는 병목(전송/렌더 등):