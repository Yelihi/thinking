---
date: 2026-03-14
dow: Sat
session: CS
topic: Event Loop (Task vs Microtask) + Render Blocking
duration_target: "3h"
evidence_required: ["console output", "Performance screenshot"]
---

# Event Loop: Task vs Microtask + Rendering

## 목표
- microtask가 macrotask보다 먼저 drain되는 규칙을 확인
- microtask 폭주가 렌더링을 어떻게 막는지 증명

## 실험 A (Basic) — 실행 순서 확인
- setTimeout vs Promise.then vs queueMicrotask 출력 순서 예측/검증
- microtask chain이 timeout보다 앞서는지 확인

## 실험 B (Advanced) — microtask 폭주로 render delay 재현
- 많은 microtask 생성
- DOM 업데이트/렌더링이 지연되는지 Performance로 확인
- 대안: rAF / setTimeout으로 분산

## 필수 증거 2개
1) 콘솔 출력(순서 실험 결과)
2) Performance 캡처(Main timeline + microtask activity)

## 네트워크 루틴(10분)
- Network Timing 캡처 1장 + 병목 1줄 요약

## 결과/회고
- microtask drain의 의미:
- 렌더 타이밍과의 관계: