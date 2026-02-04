import { focusableElementsRef } from "./const";

export const getFocusableElementsIncludingSlot = (modal: HTMLElement, root: ShadowRoot): HTMLElement[] => {
  const selector = focusableElementsRef.join(",");

  // 1) shadow 내부 요소
  const shadowCandidates = Array.from(modal.querySelectorAll<HTMLElement>(selector));

  // 2) slot에 할당된 light DOM 요소(및 그 자식들)
  const slot = modal.querySelector("slot") as HTMLSlotElement | null;
  const assigned = slot ? slot.assignedElements({ flatten: true }) : [];
  const assignedCandidates: HTMLElement[] = [];

  for (const el of assigned) {
    if (el instanceof HTMLElement) {
      // el 자체가 focusable이면 포함
      if (el.matches?.(selector)) assignedCandidates.push(el);
      // 자식 중 focusable도 포함
      assignedCandidates.push(...Array.from(el.querySelectorAll<HTMLElement>(selector)));
    }
  }

  const all = [...shadowCandidates, ...assignedCandidates];

  // 보이는 것만 필터(간단 버전)
  return all.filter((el) => el.tabIndex >= 0 && !el.hasAttribute("disabled"));
}