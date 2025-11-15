/**
 * Exit Confirmation Modal
 * Confirmation dialog for quitting the game
 * Phase 12c.4b - Option B pattern
 */

import { Modal } from './modal-base.js';

/**
 * ExitConfirmationModal - Asks for confirmation before quitting
 */
export class ExitConfirmationModal extends Modal {
    constructor(id = 'exit-confirmation-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: false });
        this.yesButton = null;
        this.noButton = null;

        this.onConfirmCallback = null;
        this.onCancelCallback = null;

        // Keyboard navigation state
        this.keyboardHandler = null;
        this.selectedIndex = 0;
        this.navigableButtons = [];
        this.keyboardUsed = false;

        // Overlay lock callbacks
        this.incrementOverlayLockCallback = null;
        this.decrementOverlayLockCallback = null;

        // Parent modal keyboard management
        this.disableParentKeyboardCallback = null;
        this.enableParentKeyboardCallback = null;

        this.getTranslation = null;
    }

    /**
     * Initializes exit confirmation modal elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.yesButton = this.element.querySelector('#exit-confirm-yes');
            this.noButton = this.element.querySelector('#exit-confirm-no');

            if (this.yesButton) {
                this.yesButton.addEventListener('click', () => this.handleConfirm());
            }
            if (this.noButton) {
                this.noButton.addEventListener('click', () => this.handleCancel());
            }

            if (this.getTranslation) {
                this.updateLocalization();
            }
        }
        return result;
    }

    /**
     * Sets callback for confirm action
     * @param {Function} callback - Confirm callback
     */
    onConfirm(callback) {
        this.onConfirmCallback = callback;
    }

    /**
     * Sets callback for cancel action
     * @param {Function} callback - Cancel callback
     */
    onCancel(callback) {
        this.onCancelCallback = callback;
    }

    /**
     * Sets overlay lock callbacks
     * @param {Function} incrementFn - Function to call when modal shows
     * @param {Function} decrementFn - Function to call when modal hides
     */
    setOverlayLockCallbacks(incrementFn, decrementFn) {
        this.incrementOverlayLockCallback = incrementFn;
        this.decrementOverlayLockCallback = decrementFn;
    }

    /**
     * Sets translation function
     * @param {Function} getTranslation - Translation lookup
     */
    setTranslationFunction(getTranslation) {
        this.getTranslation = getTranslation;
        this.updateLocalization();
    }

    /**
     * Sets parent modal keyboard management callbacks
     * @param {Function} disableFn - Function to disable parent keyboard handler
     * @param {Function} enableFn - Function to enable parent keyboard handler
     */
    setParentKeyboardCallbacks(disableFn, enableFn) {
        this.disableParentKeyboardCallback = disableFn;
        this.enableParentKeyboardCallback = enableFn;
    }

    /**
     * Handles confirm button click
     */
    handleConfirm() {
        if (this.onConfirmCallback) {
            this.onConfirmCallback();
        }
        // Don't call hide() here - let the callback handle it if needed
        // This prevents re-enabling parent keyboard handler when closing the game
    }

    /**
     * Handles cancel button click
     */
    handleCancel() {
        if (this.onCancelCallback) {
            this.onCancelCallback();
        }
        this.hide();
    }

    /**
     * Navigates through buttons
     * @param {string} direction - 'left' or 'right'
     */
    navigateButtons(direction) {
        if (this.navigableButtons.length === 0) return;

        if (direction === 'left') {
            this.selectedIndex = (this.selectedIndex - 1 + this.navigableButtons.length) % this.navigableButtons.length;
        } else if (direction === 'right') {
            this.selectedIndex = (this.selectedIndex + 1) % this.navigableButtons.length;
        }

        this.updateButtonHighlight();
    }

    /**
     * Updates visual highlight for selected button
     */
    updateButtonHighlight() {
        // Remove previous highlights
        this.navigableButtons.forEach(button => {
            button.classList.remove('menu-selected');
            button.style.boxShadow = '';
            button.style.borderColor = '';
        });

        // Only show highlight if keyboard has been used
        if (this.keyboardUsed && this.navigableButtons[this.selectedIndex]) {
            const selected = this.navigableButtons[this.selectedIndex];
            selected.classList.add('menu-selected');
            selected.style.boxShadow = '0 0 15px rgba(255, 68, 68, 0.8)';
            selected.style.borderColor = '#ff4444';
        }
    }

    /**
     * Selects the currently highlighted button
     */
    selectCurrentButton() {
        if (this.navigableButtons[this.selectedIndex]) {
            this.navigableButtons[this.selectedIndex].click();
        }
    }

    /**
     * Sets up keyboard event handlers
     */
    setupKeyboardHandlers() {
        this.keyboardHandler = (e) => {
            switch (e.key.toLowerCase()) {
                case 'arrowleft':
                case 'arrowup':
                case 'a':
                case 'w':
                    e.preventDefault();
                    e.stopPropagation();
                    this.keyboardUsed = true;
                    this.navigateButtons('left');
                    break;

                case 'arrowright':
                case 'arrowdown':
                case 'd':
                case 's':
                    e.preventDefault();
                    e.stopPropagation();
                    this.keyboardUsed = true;
                    this.navigateButtons('right');
                    break;

                case 'enter':
                    if (this.keyboardUsed) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.selectCurrentButton();
                    }
                    break;

                case 'escape':
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleCancel(); // ESC cancels
                    break;
            }
        };

        // Use capture phase
        document.addEventListener('keydown', this.keyboardHandler, { capture: true });

        // Add navigation styles
        this.addNavigationStyles();
    }

    /**
     * Removes keyboard event handlers
     */
    cleanupKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
            this.keyboardHandler = null;
        }
        this.selectedIndex = 0;
        this.keyboardUsed = false;
        this.navigableButtons = [];
    }

    /**
     * Adds CSS for keyboard navigation
     */
    addNavigationStyles() {
        if (document.getElementById('exit-confirm-nav-styles')) return;

        const style = document.createElement('style');
        style.id = 'exit-confirm-nav-styles';
        style.textContent = `
            .exit-confirmation-buttons .menu-selected {
                box-shadow: 0 0 15px rgba(255, 68, 68, 0.8) !important;
                border-color: #ff4444 !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Shows exit confirmation modal
     */
    onShow() {
        // Disable parent modal's keyboard handler
        if (this.disableParentKeyboardCallback) {
            this.disableParentKeyboardCallback();
        }

        // Increment overlay lock
        if (this.incrementOverlayLockCallback) {
            this.incrementOverlayLockCallback();
        }

        // Set up keyboard handlers
        this.setupKeyboardHandlers();

        // Set up navigable buttons
        this.navigableButtons = [this.noButton, this.yesButton].filter(Boolean);

        // Initialize selection to No button (safer default)
        this.selectedIndex = 0;
        this.keyboardUsed = false;

        // Focus the content
        if (this.element) {
            this.element.setAttribute('tabindex', '-1');
            this.element.focus({ preventScroll: true });
        }
    }

    /**
     * Hides exit confirmation modal
     */
    onHide() {
        // Re-enable parent modal's keyboard handler
        if (this.enableParentKeyboardCallback) {
            this.enableParentKeyboardCallback();
        }

        // Decrement overlay lock
        if (this.decrementOverlayLockCallback) {
            this.decrementOverlayLockCallback();
        }

        // Clean up keyboard handlers
        this.cleanupKeyboardHandlers();
    }

    /**
     * Updates localized text for exit confirmation modal
     */
    updateLocalization() {
        if (!this.getTranslation || !this.element) return;

        const t = this.getTranslation;

        const title = this.element.querySelector('h2');
        if (title) title.textContent = t('quitConfirm');

        const warning = this.element.querySelector('p');
        if (warning) warning.innerHTML = t('quitWarning');

        const yesButton = this.element.querySelector('#exit-confirm-yes');
        if (yesButton) yesButton.textContent = t('yesQuit');

        const noButton = this.element.querySelector('#exit-confirm-no');
        if (noButton) noButton.textContent = t('noContinue');
    }
}
