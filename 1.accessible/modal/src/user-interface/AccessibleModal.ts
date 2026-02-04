import cssContent from "./AccessibleModal.css?inline";
import { initializeFocusTrap } from "../controller/initializeFocusTrap";

class AccessibleModal extends HTMLElement {
  private prevFocused: HTMLElement | null = null;
  private isOpen = false;

  private onRootClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target.id === "open-modal") this.openModal();
    if (target.id === "close-modal") this.closeModal();
    if (target.id === "modal-overlay") this.closeModal(); // 배경 클릭 닫기(선택)
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.isOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeModal();
    }
  };

  static get observedAttributes() {
    return ["button-text-contents", "modal-title-contents"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true });
  }

  connectedCallback() {
    this.render();
    this.shadowRoot!.addEventListener("click", this.onRootClick);
    document.addEventListener("keydown", this.onKeyDown);
  }

  disconnectedCallback() {
    this.shadowRoot?.removeEventListener("click", this.onRootClick);
    document.removeEventListener("keydown", this.onKeyDown);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (oldValue !== newValue) this.render();
  }

  openModal() {
    if (this.isOpen) return;
    this.isOpen = true;

    // 1) 포커스 복원용 저장 (shadow 우선)
    this.prevFocused =
      (this.shadowRoot?.activeElement as HTMLElement | null) ??
      (document.activeElement as HTMLElement | null);

    // 2) 스크롤 락
    document.body.style.overflow = "hidden";

    const overlay = this.shadowRoot!.querySelector("#modal-overlay") as HTMLElement;
    const modal = this.shadowRoot!.querySelector("#modal") as HTMLElement;

    overlay.classList.remove("hidden");
    modal.classList.remove("hidden");

    // 3) DOM 반영 이후 포커스 트랩 + 초기 포커스 이동
    requestAnimationFrame(() => {
      initializeFocusTrap(modal, this.shadowRoot!);
    });
  }

  closeModal() {
    if (!this.isOpen) return;
    this.isOpen = false;

    const overlay = this.shadowRoot!.querySelector("#modal-overlay") as HTMLElement;
    const modal = this.shadowRoot!.querySelector("#modal") as HTMLElement;


    // 2) 숨김
    overlay.classList.add("hidden");
    modal.classList.add("hidden");

    // 3) 스크롤 락 해제
    document.body.style.overflow = "auto";

    // 4) 포커스 복원
    requestAnimationFrame(() => {
      // prevFocused가 host로 잡히는 경우가 있으니, fallback: open 버튼
      const openBtn = this.shadowRoot?.querySelector("#open-modal") as HTMLElement | null;
      (this.prevFocused ?? openBtn)?.focus?.();
      this.prevFocused = null;
    });
  }

  render() {
    const buttonTextContents = this.getAttribute("button-text-contents") || "open modal";
    const modalTitleContents = this.getAttribute("modal-title-contents") || "modal";

    this.shadowRoot!.innerHTML = `
      <style>${cssContent}</style>

      <button id="open-modal" aria-label="open modal" class="base-button ${this.className}">
        ${buttonTextContents}
      </button>

      <div id="modal-overlay" class="overlay hidden"></div>

      <div
        id="modal"
        class="modal hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div id="modal-header">
          <div id="close-modal-section">
            <button id="close-modal" aria-label="close modal" class="base-button">닫기</button>
          </div>
          <h2 id="modal-title">${modalTitleContents}</h2>
        </div>

        <div id="modal-body" class="modal-body">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

if (!customElements.get("accessible-modal")) {
  customElements.define("accessible-modal", AccessibleModal);
}