import { getFocusableElementsIncludingSlot } from "./getFocusableElementsIncludingSlot";

export function initializeFocusTrap(modal: HTMLElement, root: ShadowRoot) {
  const focusables = getFocusableElementsIncludingSlot(modal, root);

  // 첫 focusable이 있으면 거기로, 없으면 modal 자체로(그래서 modal tabindex=-1 필수)
  const first = focusables[0] ?? modal;
  first.focus();
}
