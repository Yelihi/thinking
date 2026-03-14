---
date: 2026-03-09
dow: Mon
session: CS
topic: Virtualized Rendering (react-window)
duration_target: "2h"
evidence_required: ["React Profiler screenshot", "DOM node count evidence"]
---

# Virtualized Rendering

## 목표
- 대규모 결과 렌더 병목 제거(보이는 것만 렌더)
- commit duration / DOM node 수 비교로 증명

## 실험 A (Basic) — 일반 리스트 vs virtualization
- 20,000 items 렌더
- 비교: 일반 map 렌더 vs react-window FixedSizeList
- Profiler: commit duration 비교

## 실험 B (Advanced) — Worker indices + virtualization 결합
- itemCount = indices.length
- render item = items[indices[index]]
- scroll 성능 체감 + Profiler 측정

## 필수 증거 2개
1) React Profiler 캡처 (전/후)
2) Elements에서 DOM child node 수 비교(수치 또는 캡처)

## 네트워크 루틴(10분)
- Network Timing 캡처 1장

## 결과/회고
- virtualization 효과:
- 실무 적용 포인트: