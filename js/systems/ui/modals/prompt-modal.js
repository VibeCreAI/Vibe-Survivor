/**
 * Prompt Modal
 * Custom modal for text input (replaces browser prompt)
 */

import { Modal } from './modal-base.js';

export class PromptModal extends Modal {
    constructor(id = 'prompt-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: false });
        this.messageEl = null;
        this.inputEl = null;
        this.confirmButton = null;
        this.cancelButton = null;
        this.onConfirmCallback = null;
        this.onCancelCallback = null;
        this.getTranslation = null;
        this.keyShieldHandler = null;
    }

    init() {
        const result = super.init();
        if (result) {
            this.messageEl = this.element.querySelector('.prompt-message');
            this.inputEl = this.element.querySelector('.prompt-input');
            this.confirmButton = this.element.querySelector('.prompt-confirm-btn');
            this.cancelButton = this.element.querySelector('.prompt-cancel-btn');

            if (this.confirmButton) {
                this.confirmButton.addEventListener('click', () => this.handleConfirm());
            }

            if (this.cancelButton) {
                this.cancelButton.addEventListener('click', () => this.handleCancel());
            }

            if (this.inputEl) {
                this.inputEl.addEventListener('keydown', (e) => {
                    // Stop propagation so underlying modals don't treat WASD/Enter as navigation
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleConfirm();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        this.handleCancel();
                    }
                });
            }
        }
        return result;
    }

    setTranslationFunction(getTranslation) {
        this.getTranslation = getTranslation;
    }

    /**
     * Show prompt with message and optional placeholder
     * @param {string} message - Prompt message
     * @param {string} placeholder - Input placeholder
     * @param {string} defaultValue - Default input value
     * @returns {Promise<string|null>} User input or null if cancelled
     */
    async prompt(message, placeholder = '', defaultValue = '') {
        return new Promise((resolve) => {
            if (this.messageEl) {
                this.messageEl.textContent = message;
            }

            if (this.inputEl) {
                this.inputEl.placeholder = placeholder;
                this.inputEl.value = defaultValue;
            }

            this.onConfirmCallback = () => {
                const value = this.inputEl?.value.trim() || null;
                this.hide();
                resolve(value);
            };

            this.onCancelCallback = () => {
                this.hide();
                resolve(null);
            };

            this.show();
            this.installKeyShield();

            // Focus input after modal is shown
            setTimeout(() => {
                if (this.inputEl) {
                    this.inputEl.focus();
                    this.inputEl.select();
                }
            }, 100);
        });
    }

    handleConfirm() {
        if (this.onConfirmCallback) {
            this.onConfirmCallback();
        }
    }

    handleCancel() {
        if (this.onCancelCallback) {
            this.onCancelCallback();
        }
    }

    hide() {
        this.removeKeyShield();
        super.hide();
        // Clear input
        if (this.inputEl) {
            this.inputEl.value = '';
        }
    }

    show() {
        super.show();
        if (this.element) {
            this.element.style.display = 'flex';
        }
        this.installKeyShield();
    }

    installKeyShield() {
        if (this.keyShieldHandler) return;
        this.keyShieldHandler = (e) => {
            // Allow typing but prevent bubbling to other modal hotkeys
            e.stopPropagation();
        };
        window.addEventListener('keydown', this.keyShieldHandler, { capture: true });
    }

    removeKeyShield() {
        if (this.keyShieldHandler) {
            window.removeEventListener('keydown', this.keyShieldHandler, { capture: true });
            this.keyShieldHandler = null;
        }
    }
}
