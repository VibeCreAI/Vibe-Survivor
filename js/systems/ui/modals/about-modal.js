/**
 * About Modal - Minimal Option B Implementation
 * Only handles close button click event listener
 * Phase 12c.10 - Conservative refactor approach
 *
 * Note: Keyboard navigation, scrolling, and menu state remain in main game file
 */

export class AboutModal {
    constructor() {
        // Button reference
        this.closeButton = null;

        // Callbacks
        this.onCloseCallback = null;

        // Initialization flag
        this.initialized = false;
    }

    /**
     * Initialize button event listener
     */
    init() {
        if (this.initialized) return true;

        // Get close button reference
        this.closeButton = document.getElementById('close-about-btn');

        // Set up close button click handler
        this.setupButtonHandler();

        this.initialized = true;
        return true;
    }

    /**
     * Set up close button click handler
     */
    setupButtonHandler() {
        if (this.closeButton) {
            // Regular click
            this.closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.onCloseCallback) {
                    this.onCloseCallback();
                }
            });

            // Touch support
            this.closeButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.onCloseCallback) {
                    this.onCloseCallback();
                }
            }, { passive: false });
        }
    }

    /**
     * Set callback function for close action
     */
    onClose(callback) {
        this.onCloseCallback = callback;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.closeButton = null;
        this.initialized = false;
    }
}
