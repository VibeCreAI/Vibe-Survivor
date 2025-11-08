/**
 * Modal Base Class
 * Base class for all modal/overlay components
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

/**
 * Modal - Base class for all modal dialogs and overlays
 */
export class Modal {
    constructor(id, options = {}) {
        this.id = id;
        this.element = null;
        this.visible = false;
        this.options = {
            closeOnEscape: options.closeOnEscape ?? true,
            closeOnBackdropClick: options.closeOnBackdropClick ?? false,
            ...options
        };
    }

    /**
     * Initializes the modal by finding its DOM element
     */
    init() {
        this.element = document.getElementById(this.id);
        if (!this.element) {
            console.warn(`Modal element with id "${this.id}" not found`);
            return false;
        }

        // Set up event listeners if needed
        this.setupEventListeners();
        return true;
    }

    /**
     * Sets up default event listeners
     */
    setupEventListeners() {
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.visible) {
                    this.hide();
                }
            });
        }

        if (this.options.closeOnBackdropClick && this.element) {
            this.element.addEventListener('click', (e) => {
                if (e.target === this.element) {
                    this.hide();
                }
            });
        }
    }

    /**
     * Shows the modal
     */
    show() {
        if (!this.element) {
            console.warn(`Cannot show modal "${this.id}" - element not found`);
            return;
        }

        this.visible = true;
        this.element.style.display = 'block';
        this.onShow();
    }

    /**
     * Hides the modal
     */
    hide() {
        if (!this.element) {
            console.warn(`Cannot hide modal "${this.id}" - element not found`);
            return;
        }

        this.visible = false;
        this.element.style.display = 'none';
        this.onHide();
    }

    /**
     * Toggles modal visibility
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Checks if modal is currently visible
     * @returns {boolean}
     */
    isVisible() {
        return this.visible;
    }

    /**
     * Updates modal content
     * Override in subclasses to update specific content
     * @param {Object} data - Data to update modal with
     */
    update(data) {
        // Override in subclasses
    }

    /**
     * Hook called when modal is shown
     * Override in subclasses for custom behavior
     */
    onShow() {
        // Override in subclasses
    }

    /**
     * Hook called when modal is hidden
     * Override in subclasses for custom behavior
     */
    onHide() {
        // Override in subclasses
    }

    /**
     * Cleans up event listeners and resources
     */
    destroy() {
        this.hide();
        // Subclasses can override to clean up additional resources
    }
}

/**
 * ModalManager - Manages multiple modals and ensures only one is active
 */
export class ModalManager {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
    }

    /**
     * Registers a modal with the manager
     * @param {string} name - Modal identifier
     * @param {Modal} modal - Modal instance
     */
    register(name, modal) {
        this.modals.set(name, modal);
    }

    /**
     * Shows a specific modal (hides others)
     * @param {string} name - Modal identifier
     * @param {Object} data - Optional data to pass to modal
     */
    show(name, data = null) {
        const modal = this.modals.get(name);
        if (!modal) {
            console.warn(`Modal "${name}" not found in manager`);
            return;
        }

        // Hide current active modal
        if (this.activeModal && this.activeModal !== modal) {
            this.activeModal.hide();
        }

        // Show requested modal
        this.activeModal = modal;
        if (data) {
            modal.update(data);
        }
        modal.show();
    }

    /**
     * Hides a specific modal
     * @param {string} name - Modal identifier
     */
    hide(name) {
        const modal = this.modals.get(name);
        if (modal) {
            modal.hide();
            if (this.activeModal === modal) {
                this.activeModal = null;
            }
        }
    }

    /**
     * Hides all modals
     */
    hideAll() {
        this.modals.forEach(modal => modal.hide());
        this.activeModal = null;
    }

    /**
     * Gets a modal by name
     * @param {string} name - Modal identifier
     * @returns {Modal|undefined}
     */
    get(name) {
        return this.modals.get(name);
    }

    /**
     * Checks if any modal is currently active
     * @returns {boolean}
     */
    hasActiveModal() {
        return this.activeModal !== null && this.activeModal.isVisible();
    }
}
