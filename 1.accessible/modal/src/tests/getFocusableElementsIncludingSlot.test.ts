import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getFocusableElementsIncludingSlot } from '../controller/getFocusableElementsIncludingSlot';


describe('getFocusableElementsIncludingSlot', () => {

  let element: HTMLDivElement;
  let shadowRoot: ShadowRoot | null;

  beforeEach(() => {
      // 부모 요소
      element = document.createElement('div');

      // shadow root 생성
      shadowRoot = element.attachShadow({ mode: 'open', delegatesFocus: true })
  })

  it('해당 element 내 자식들의 focusable 한 요소들을 반환한다.', () => {
      // given
      // 자식 요소 (div 제외 4가지)
      const childElements = ['div', 'button', 'input', 'textarea', 'select'].map((elementType) => document.createElement(elementType));

      childElements.forEach((children) => {
        element.appendChild(children);
      })

    // when
    const focusableElements = getFocusableElementsIncludingSlot(element, shadowRoot as ShadowRoot);

    // then
    expect(focusableElements).toHaveLength(4);
    expect(focusableElements).toContain(childElements[1]);
    expect(focusableElements).toContain(childElements[2]);
    expect(focusableElements).toContain(childElements[3]);
    expect(focusableElements).toContain(childElements[4]);
  })

  it('slot 내부의 focusable 한 요소들을 반환한다.', () => {
    // given
    // shadow DOM에 slot 추가
    const slot = document.createElement('slot');
    shadowRoot!.appendChild(slot);

    // light DOM에 slotted content 추가
    const slottedContainer = document.createElement('div');
    const slottedButton = document.createElement('button');
    const slottedInput = document.createElement('input');
    const slottedDiv = document.createElement('div'); // focusable 아님

    slottedContainer.appendChild(slottedButton);
    slottedContainer.appendChild(slottedInput);
    slottedContainer.appendChild(slottedDiv);
    element.appendChild(slottedContainer);

    // DOM에 연결해야 slot assignment가 작동
    document.body.appendChild(element);

    // when
    const focusableElements = getFocusableElementsIncludingSlot(shadowRoot as unknown as HTMLElement, shadowRoot as ShadowRoot);

    // then
    expect(focusableElements).toContain(slottedButton);
    expect(focusableElements).toContain(slottedInput);
    expect(focusableElements).not.toContain(slottedDiv);
  })

  it('disabled 처리된 요소는 제외한다.', () => {
    // given
    const enabledButton = document.createElement('button');
    const disabledButton = document.createElement('button');
    disabledButton.setAttribute('disabled', '');

    const enabledInput = document.createElement('input');
    const disabledInput = document.createElement('input');
    disabledInput.setAttribute('disabled', '');

    element.appendChild(enabledButton);
    element.appendChild(disabledButton);
    element.appendChild(enabledInput);
    element.appendChild(disabledInput);

    // when
    const focusableElements = getFocusableElementsIncludingSlot(element, shadowRoot as ShadowRoot);

    // then
    expect(focusableElements).toHaveLength(2);
    expect(focusableElements).toContain(enabledButton);
    expect(focusableElements).toContain(enabledInput);
    expect(focusableElements).not.toContain(disabledButton);
    expect(focusableElements).not.toContain(disabledInput);
  })

  it('tabIndex가 -1인 요소는 제외한다.', () => {
    // given
    const normalButton = document.createElement('button');
    const hiddenButton = document.createElement('button');
    hiddenButton.setAttribute('tabindex', '-1');

    const normalInput = document.createElement('input');
    const hiddenInput = document.createElement('input');
    hiddenInput.setAttribute('tabindex', '-1');

    element.appendChild(normalButton);
    element.appendChild(hiddenButton);
    element.appendChild(normalInput);
    element.appendChild(hiddenInput);

    // when
    const focusableElements = getFocusableElementsIncludingSlot(element, shadowRoot as ShadowRoot);

    // then
    expect(focusableElements).toHaveLength(2);
    expect(focusableElements).toContain(normalButton);
    expect(focusableElements).toContain(normalInput);
    expect(focusableElements).not.toContain(hiddenButton);
    expect(focusableElements).not.toContain(hiddenInput);
  })

  afterEach(() => {
    element.remove();
    shadowRoot = null;
  })

})