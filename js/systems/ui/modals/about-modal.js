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

        // Localization
        this.getTranslation = null;
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

        if (this.getTranslation) {
            this.updateLocalization();
        }

        return true;
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
     * Updates localized text in about menu
     */
    updateLocalization() {
        if (!this.getTranslation) return;

        const t = this.getTranslation;

        const title = document.querySelector('#about-menu h2');
        if (title) title.textContent = t('aboutTitle');

        const codingTitle = document.querySelector('.vibe-coding-title');
        if (codingTitle) codingTitle.textContent = t('vibeCodingTitle');

        const codingSubtitle = document.querySelector('.vibe-coding-subtitle');
        if (codingSubtitle) codingSubtitle.textContent = t('vibeCodingSubtitle');

        const creditLabels = document.querySelectorAll('.credit-label');
        const creditValues = document.querySelectorAll('.credit-value');
        if (creditLabels.length >= 4 && creditValues.length >= 4) {
            creditLabels[0].textContent = t('codingLabel');
            creditValues[0].textContent = t('codingValue');
            creditLabels[1].textContent = t('musicLabel');
            creditValues[1].textContent = t('musicValue');
            creditLabels[2].textContent = t('soundEffectsLabel');
            creditValues[2].textContent = t('soundEffectsValue');
            creditLabels[3].textContent = t('artworkLabel');
            creditValues[3].textContent = t('artworkValue');
        }

        const connectHeading = document.querySelector('.social-links h3');
        if (connectHeading) connectHeading.textContent = t('connectWithUs');

        if (this.closeButton) this.closeButton.textContent = t('close');

        const aboutHint = document.querySelector('.about-hint');
        if (aboutHint) aboutHint.textContent = t('aboutHint');
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
