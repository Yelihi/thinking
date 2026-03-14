---
date: 2026-03-07
dow: Sat
session: CS
topic: Worker Top-N + Progressive Results
duration_target: "3h"
evidence_required: ["worker partial logs", "React Profiler screenshot"]
---

# Worker Top-N + Progressive Results

## 목표
- Worker 결과 payload를 Top-N으로 제한
- Progressive(부분 결과)로 “빠른 피드백” 제공

## 실험 A (Basic) — Top-N 제한
- LIMIT = 100(또는 200)
- worker는 indices를 LIMIT까지만 생성/전송
- UI: “Showing first N” 또는 “N / totalCount”

## 실험 B (Advanced) — Progressive 결과
- CHUNK 단위로 스캔하며 partial count 전송
- 최종 RESULT는 Top-N indices 전송
- 최신 query만 유지(이전 cancel 전략과 결합)

## 필수 증거 2개
1) worker partial 로그 (count 증가 흐름)
2) React Profiler (Top-N 적용 전후 비교 가능하면)

## 네트워크 루틴(10분)
- dig 결과 일부 (ANSWER / Query time / SERVER)

## 결과/회고
- payload 제한 효과:
- progressive UX 체감: