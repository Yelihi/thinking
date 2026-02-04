# Accessible Modal (Web Component)

Accessible Modal을 **Web Component + Shadow DOM** 기반으로 구현한 과제 결과물입니다.  
단순히 모달을 띄우는 것에서 끝나는 것이 아니라, **키보드/포커스/접근성**까지 포함해 “사용자 흐름”이 깨지지 않도록 만드는 것을 목표로 했습니다.

---

## 구현한 기능 (What I built)

- **Open / Close**
  - 버튼 클릭으로 모달 열기/닫기
  - 배경 오버레이 표시/숨김
  - (선택) 오버레이 클릭으로 닫기

- **접근성(A11y)**
  - `role="dialog"`, `aria-modal="true"`, `aria-labelledby` 적용

- **포커스 관리(Focus Management)**
  - 모달 오픈 시: 모달 내부 첫 focusable 요소로 포커스 이동
  - 모달 클로즈 시: 모달 오픈 트리거(이전 포커스)로 포커스 복원
  - 모달 컨테이너에 `tabindex="-1"`를 두어 fallback 포커스 가능

- **키보드 지원**
  - `ESC`로 모달 닫기
  - `Tab / Shift+Tab` 포커스 트랩: 모달 내부에서만 순환

- **스크롤 락**
  - 모달 오픈 시 body 스크롤 잠금
  - 모달 클로즈 시 해제

- **Shadow DOM + Slot 대응**
  - `<slot>`으로 주입되는 light DOM 콘텐츠까지 focusable 탐색에 포함  
    (slot에 할당된 요소는 `assignedElements()` 기반으로 수집)

---

## 실행 방법

- Dev: `pnpm dev`
- Build: `pnpm build`

---

## 참고한 문서

- WAI-ARIA Dialog(Modal) Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- MDN Shadow DOM: https://developer.mozilla.org/docs/Web/API/Web_components/Using_shadow_DOM
- MDN HTMLSlotElement.assignedElements(): https://developer.mozilla.org/docs/Web/API/HTMLSlotElement/assignedElements
- MDN Document.activeElement: https://developer.mozilla.org/docs/Web/API/Document/activeElement

---