import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/dom';
import { AccessibleModal } from '../../user-interface/AccessibleModal';

describe("AccessibleModal", () => {
  let modalElement: AccessibleModal;
  let shadowRoot: ShadowRoot;

  beforeEach(() => {
    document.body.innerHTML = '';

    modalElement = new AccessibleModal();
    modalElement.setAttribute('button-text-contents', 'open modal');
    modalElement.setAttribute('modal-title-contents', 'modal title');
    document.body.appendChild(modalElement);
    
    shadowRoot = modalElement.shadowRoot!;
  });

  it('openModal 함수를 호출하면, 화면에 modal 이 렌더링 된다', () => {
    // shadowRoot.querySelector로 직접 접근
    const openButton = shadowRoot.querySelector('#open-modal') as HTMLElement;

    // action
    fireEvent.click(openButton);

    // then
    const modal = shadowRoot.querySelector('#modal');
    const modalTitle = shadowRoot.querySelector('#modal-title');
    
    expect(modal?.classList.contains('hidden')).toBe(false);
    expect(modalTitle?.textContent).toBe('modal title');
  });

  // 모달이 열린 상태에서의 테스트들
  describe('모달이 열린 상태에서', () => {
    let closeButton: HTMLElement;
    let openButton: HTMLElement;

    beforeEach(() => {
      // shadowRoot.querySelector로 직접 접근
      openButton = shadowRoot.querySelector('#open-modal') as HTMLElement;
      closeButton = shadowRoot.querySelector('#close-modal') as HTMLElement;
      
      // fireEvent.click()은 focus를 자동으로 설정하지 않음
      // prevFocused가 올바르게 저장되려면 먼저 focus 설정 필요
      openButton.focus();
      
      // 모달 열기
      fireEvent.click(openButton);
    });

    it('closeModal 함수를 호출하면, 화면에서 modal 이 사라진다.', () => {
      // action
      fireEvent.click(closeButton);

      // then
      const modal = shadowRoot.querySelector('#modal');
      expect(modal?.classList.contains('hidden')).toBe(true);
    });

    it('modal 이 사라질 때, focus 가 open modal 버튼에 위치한다', async () => {
      // action
      fireEvent.click(closeButton);

      // requestAnimationFrame 대기
      await waitFor(() => {
        expect(shadowRoot.activeElement).toBe(openButton);
      }, { timeout: 2000 });
    });
  });
});
