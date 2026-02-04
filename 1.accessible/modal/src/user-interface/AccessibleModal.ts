import cssContent from "./AccessibleModal.module.css?inline"


class AccessibleModal extends HTMLElement {
    buttonTextContents: string;
    modalTitleContents: string;
    constructor(
        buttonTextContents: string,
        modalTitmeContents: string,
    ) {
        super();
        this.attachShadow({ mode: 'open' })
        this.buttonTextContents = buttonTextContents;
        this.modalTitleContents = modalTitmeContents;
    }

    // 속성을 감지합니다.
    static get observedAttributes() {
        return ["button-text-contents", "modal-title-contents"];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

    render() {
        // 전달할 속성값을 속성내에서 가져옵니다.
        const buttonTextContents = this.getAttribute("button-text-contents") || "open modal";
        const modalTitleContents = this.getAttribute("modal-title-contents") || "modal";

        this.shadowRoot!.innerHTML = `
            <style>${cssContent}</style>
            <button id="open-modal" aria-label="open modal" class="base-button ${this.className}">${buttonTextContents}</button>
            <div id="modal-overlay" class="overlay hidden"></div>
            <div id="modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
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
        `
    }


}

/**
 * @description AccessibleModal define
 */
customElements.define("accessible-modal", AccessibleModal)