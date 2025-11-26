/**
 * Notification Modal
 * Custom modal for notifications (replaces browser alert)
 */

import { Modal } from './modal-base.js';

export class NotificationModal extends Modal {
    constructor(id = 'notification-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: true });
        this.messageEl = null;
        this.okButton = null;
        this.onOkCallback = null;
        this.getTranslation = null;
        this.currentType = 'info'; // 'success', 'error', 'info'
        this.keyShieldHandler = null;
    }

    init() {
        const result = super.init();
        if (result) {
            this.messageEl = this.element.querySelector('.notification-message');
            this.okButton = this.element.querySelector('.notification-ok-btn');

            if (this.okButton) {
                this.okButton.addEventListener('click', () => this.handleOk());
            }
        }
        return result;
    }

    setTranslationFunction(getTranslation) {
        this.getTranslation = getTranslation;
    }

    /**
     * Show notification with message
     * @param {string} message - Notification message
     * @param {string} type - Notification type: 'success', 'error', 'info'
     * @returns {Promise<void>}
     */
    async notify(message, type = 'info') {
        return new Promise((resolve) => {
            if (this.messageEl) {
                this.messageEl.textContent = message;
            }

            this.currentType = type;

            // Update modal styling based on type
            if (this.element) {
                this.element.classList.remove('notification-success', 'notification-error', 'notification-info');
                this.element.classList.add(`notification-${type}`);
            }

            this.onOkCallback = () => {
                this.hide();
                resolve();
            };

            this.show();

            // Focus OK button after modal is shown
            setTimeout(() => {
                if (this.okButton) {
                    this.okButton.focus();
                }
            }, 100);
        });
    }

    handleOk() {
        if (this.onOkCallback) {
            this.onOkCallback();
        }
    }

    show() {
        super.show();
        if (this.element) {
            this.element.style.display = 'flex';
        }
        this.installKeyShield();
    }

    hide() {
        this.removeKeyShield();
        super.hide();
    }

    installKeyShield() {
        if (this.keyShieldHandler) return;
        this.keyShieldHandler = (e) => {
            // Prevent navigation keys from leaking to underlying modals while allowing typing
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
