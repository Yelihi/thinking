---
date: 2026-03-13
dow: Fri
session: CS
topic: Rendering Pipeline + Layout Thrashing
duration_target: "2h"
evidence_required: ["Performance screenshot", "console time log"]
---

# Rendering Pipeline + Layout Thrashing

## 목표
- forced synchronous layout(레이아웃 스래싱)을 재현하고 해결
- DevTools Performance로 Layout/Recalculate Style 증거 확보

## 실험 A (Basic) — thrashing 재현
- DOM write(style 변경) → DOM read(offsetHeight) 반복
- Performance에서 Layout 이벤트 증가 확인

## 실험 B (Advanced) — batching으로 해결
- write를 먼저 몰아서 수행
- read는 마지막에 한 번만
- 필요시 rAF로 프레임 경계에 반영
- Performance 비교

## 필수 증거 2개
1) Performance 캡처(Layout/Recalc Style 보이게)
2) console.time/timeEnd 결과

## 네트워크 루틴(10분)
- nslookup 출력 일부 기록

## 결과/회고
- thrashing 패턴:
- batching 전략: