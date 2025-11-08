/**
 * Help Modal
 * Controls and game help information
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * HelpModal - Game controls and help screen
 */
export class HelpModal extends Modal {
    constructor(id = 'help-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: false });
        this.closeButton = null;
    }

    /**
     * Initializes help modal elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.closeButton = this.element.querySelector('.help-close-btn');
            if (this.closeButton) {
                this.closeButton.addEventListener('click', () => this.hide());
            }
        }
        return result;
    }

    /**
     * Updates help content (e.g., for different languages)
     * @param {Object} data - Help content data
     */
    update(data) {
        if (!data) return;

        // Update controls section
        if (data.controls) {
            this.updateSection('.help-controls', data.controls);
        }

        // Update gameplay tips section
        if (data.tips) {
            this.updateSection('.help-tips', data.tips);
        }

        // Update weapons section
        if (data.weapons) {
            this.updateSection('.help-weapons', data.weapons);
        }
    }

    /**
     * Updates a help section with new content
     * @param {string} selector - Section selector
     * @param {string|Array} content - Content to display
     */
    updateSection(selector, content) {
        const section = this.element?.querySelector(selector);
        if (!section) return;

        if (Array.isArray(content)) {
            section.innerHTML = content.map(item => `<p>${item}</p>`).join('');
        } else {
            section.innerHTML = content;
        }
    }

    /**
     * Shows help modal
     */
    onShow() {
        // Scroll to top when showing help
        const scrollContainer = this.element?.querySelector('.help-scroll-content');
        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        }
    }
}
