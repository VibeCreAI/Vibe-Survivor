/**
 * Options Menu Modal - Option B: Proper Encapsulation
 * The modal owns all its behavior including keyboard handling and scrolling
 * Phase 12c.5 - Refactored from inline implementation
 */

export class OptionsMenu {
    constructor() {
        this.element = null;
        this.contentElement = null;

        // Button references
        this.languageSelect = null;
        this.muteButton = null;
        this.dashPositionButton = null;
        this.closeButton = null;

        // Keyboard navigation state
        this.keyboardHandler = null;
        this.selectedIndex = 0;
        this.navigableElements = [];
        this.keyboardUsed = false;

        // Callbacks
        this.onCloseCallback = null;
        this.onLanguageChangeCallback = null;
        this.onMuteCallback = null;
        this.onDashPositionCallback = null;

        // Overlay lock callbacks
        this.incrementOverlayLockCallback = null;
        this.decrementOverlayLockCallback = null;

        // Game state callbacks for dynamic button labels
        this.getAudioMutedState = null;
        this.getDashPositionState = null;
        this.getLanguageState = null;
        this.getTranslation = null;

        // Parent keyboard management (for nested modals)
        this.disableParentKeyboardCallback = null;
        this.enableParentKeyboardCallback = null;

        // Previous navigation state (for restoring when closing)
        this.previousNavigationState = null;
    }

    /**
     * Initialize the options menu
     */
    init() {
        this.element = document.getElementById('options-menu');
        if (!this.element) {
            console.error('Options menu element not found');
            return false;
        }

        this.contentElement = this.element.querySelector('.options-content');

        // Get button references
        this.languageSelect = document.getElementById('language-select');
        this.muteButton = document.getElementById('options-mute-btn');
        this.dashPositionButton = document.getElementById('options-dash-position-btn');
        this.closeButton = document.getElementById('close-options-btn');

        // Set up button click handlers
        this.setupButtonHandlers();

        return true;
    }

    /**
     * Set up button click handlers
     */
    setupButtonHandlers() {
        if (this.languageSelect) {
            this.languageSelect.addEventListener('change', (e) => {
                if (this.onLanguageChangeCallback) {
                    this.onLanguageChangeCallback(e.target.value);
                }
            });

            // Mobile touch support
            this.languageSelect.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { passive: true });

            this.languageSelect.addEventListener('touchend', (e) => {
                e.stopPropagation();
                this.languageSelect.focus();
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        this.languageSelect.click();
                    }, 100);
                }
            }, { passive: true });
        }

        if (this.muteButton) {
            const muteHandler = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (this.onMuteCallback) {
                    this.onMuteCallback();
                    this.updateButtonLabels();
                }
            };

            this.muteButton.addEventListener('click', muteHandler);
            this.muteButton.addEventListener('touchstart', muteHandler, { passive: false });
        }

        if (this.dashPositionButton) {
            const dashHandler = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (this.onDashPositionCallback) {
                    this.onDashPositionCallback();
                    this.updateButtonLabels();
                }
            };

            this.dashPositionButton.addEventListener('click', dashHandler);
            this.dashPositionButton.addEventListener('touchstart', dashHandler, { passive: false });
        }

        if (this.closeButton) {
            const closeHandler = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                this.hide();
            };

            this.closeButton.addEventListener('click', closeHandler);
            this.closeButton.addEventListener('touchstart', closeHandler, { passive: false });
        }
    }

    /**
     * Set game state callbacks for dynamic button labels
     */
    setGameStateCallbacks(getAudioMutedState, getDashPositionState, getLanguageState, getTranslation) {
        this.getAudioMutedState = getAudioMutedState;
        this.getDashPositionState = getDashPositionState;
        this.getLanguageState = getLanguageState;
        this.getTranslation = getTranslation;

        if (this.element) {
            this.updateLocalization();
        }
    }

    /**
     * Set overlay lock callbacks
     */
    setOverlayLockCallbacks(incrementFn, decrementFn) {
        this.incrementOverlayLockCallback = incrementFn;
        this.decrementOverlayLockCallback = decrementFn;
    }

    /**
     * Set parent keyboard callbacks (for disabling parent modal's keyboard handler)
     */
    setParentKeyboardCallbacks(disableFn, enableFn) {
        this.disableParentKeyboardCallback = disableFn;
        this.enableParentKeyboardCallback = enableFn;
    }

    /**
     * Set callback functions
     */
    onClose(callback) {
        this.onCloseCallback = callback;
    }

    onLanguageChange(callback) {
        this.onLanguageChangeCallback = callback;
    }

    onMute(callback) {
        this.onMuteCallback = callback;
    }

    onDashPosition(callback) {
        this.onDashPositionCallback = callback;
    }

    /**
     * Store previous navigation state (for restoring when closing)
     */
    setPreviousNavigationState(state) {
        this.previousNavigationState = state;
    }

    /**
     * Get previous navigation state
     */
    getPreviousNavigationState() {
        return this.previousNavigationState;
    }

    /**
     * Update button labels based on current game state
     */
    updateButtonLabels() {
        // Update mute button
        if (this.muteButton && this.getAudioMutedState) {
            const isMuted = this.getAudioMutedState();
            if (this.getTranslation) {
                this.muteButton.textContent = isMuted ? this.getTranslation('unmute') : this.getTranslation('mute');
            } else {
                this.muteButton.textContent = isMuted ? 'UNMUTE' : 'MUTE';
            }
        }

        // Update dash position button
        if (this.dashPositionButton && this.getDashPositionState) {
            const position = this.getDashPositionState();
            if (position) {
                if (this.getTranslation) {
                    this.dashPositionButton.textContent = this.getTranslation(position).toUpperCase();
                } else {
                    this.dashPositionButton.textContent = position.toUpperCase();
                }
            }
        }

        // Update language select
        if (this.languageSelect && this.getLanguageState) {
            const language = this.getLanguageState();
            if (language) {
                this.languageSelect.value = language;
            }
        }
    }

    /**
     * Updates localized labels/hints
     */
    updateLocalization() {
        if (!this.getTranslation) return;

        const t = this.getTranslation;

        const title = this.element?.querySelector('h2');
        if (title) title.textContent = t('optionsTitle');

        const labels = this.element?.querySelectorAll('.option-item label');
        if (labels && labels.length >= 3) {
            labels[0].textContent = t('language');
            labels[1].textContent = t('audio');
            labels[2].textContent = t('dashPosition');
        }

        const closeBtn = this.closeButton;
        if (closeBtn) closeBtn.textContent = t('close');

        const hint = this.element?.querySelector('.options-hint');
        if (hint) hint.textContent = t('optionsHint');

        this.updateButtonLabels();
    }

    /**
     * Sets language select value
     * @param {string} value - Language code
     */
    setLanguageValue(value) {
        if (this.languageSelect && value) {
            this.languageSelect.value = value;
        }
    }

    /**
     * Show the options menu
     */
    show() {
        if (!this.element) return;

        this.element.style.display = 'flex';

        // Update button labels
        this.updateButtonLabels();

        // Call lifecycle hook
        this.onShow();
    }

    /**
     * Hide the options menu
     */
    hide() {
        if (!this.element) return;

        this.element.style.display = 'none';

        // Call lifecycle hook
        this.onHide();

        // Call close callback
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    /**
     * Lifecycle: Called when menu is shown
     */
    onShow() {
        // Disable parent modal's keyboard handler if set
        if (this.disableParentKeyboardCallback) {
            this.disableParentKeyboardCallback();
        }

        // Increment overlay lock
        if (this.incrementOverlayLockCallback) {
            this.incrementOverlayLockCallback();
        }

        // Set up keyboard handlers
        this.setupKeyboardHandlers();

        // Set up navigable elements
        this.navigableElements = [
            this.languageSelect,
            this.muteButton,
            this.dashPositionButton,
            this.closeButton
        ].filter(Boolean);

        // Initialize selection to first element
        this.selectedIndex = 0;
        this.keyboardUsed = false;

        // Focus the element
        if (this.element) {
            this.element.setAttribute('tabindex', '-1');
            this.element.focus({ preventScroll: true });
        }

        // Hide start screen bot if it exists
        if (window.startScreenBot) {
            window.startScreenBot.hide();
        }
    }

    /**
     * Lifecycle: Called when menu is hidden
     */
    onHide() {
        // Clean up keyboard handlers
        this.cleanupKeyboardHandlers();

        // Decrement overlay lock
        if (this.decrementOverlayLockCallback) {
            this.decrementOverlayLockCallback();
        }

        // Re-enable parent modal's keyboard handler if set
        if (this.enableParentKeyboardCallback) {
            this.enableParentKeyboardCallback();
        }

        // Show start screen bot if it exists
        if (window.startScreenBot) {
            window.startScreenBot.show();
        }
    }

    /**
     * Set up keyboard handlers
     */
    setupKeyboardHandlers() {
        this.keyboardHandler = (e) => {
            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    e.preventDefault();
                    e.stopPropagation();
                    this.keyboardUsed = true;
                    this.navigateElements('up');
                    break;

                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    e.stopPropagation();
                    this.keyboardUsed = true;
                    this.navigateElements('down');
                    break;

                case 'enter':
                case ' ':
                    if (this.keyboardUsed) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.selectCurrentElement();
                    }
                    break;

                case 'escape':
                    e.preventDefault();
                    e.stopPropagation();
                    this.hide();
                    break;
            }
        };

        // Use capture phase to intercept events before other handlers
        document.addEventListener('keydown', this.keyboardHandler, { capture: true });

        // Add navigation styles
        this.addNavigationStyles();
    }

    /**
     * Clean up keyboard handlers
     */
    cleanupKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
            this.keyboardHandler = null;
        }

        // Remove navigation styles from all elements
        this.navigableElements.forEach(el => {
            if (el) {
                el.classList.remove('menu-selected');
                el.style.boxShadow = '';
                el.style.borderColor = '';
            }
        });
    }

    /**
     * Navigate between elements
     */
    navigateElements(direction) {
        if (this.navigableElements.length === 0) return;

        // Remove selection from current element
        const currentElement = this.navigableElements[this.selectedIndex];
        if (currentElement) {
            currentElement.classList.remove('menu-selected');
            currentElement.style.boxShadow = '';
            currentElement.style.borderColor = '';
        }

        // Update selected index
        if (direction === 'up') {
            this.selectedIndex = (this.selectedIndex - 1 + this.navigableElements.length) % this.navigableElements.length;
        } else if (direction === 'down') {
            this.selectedIndex = (this.selectedIndex + 1) % this.navigableElements.length;
        }

        // Add selection to new element
        const newElement = this.navigableElements[this.selectedIndex];
        if (newElement) {
            newElement.classList.add('menu-selected');
            newElement.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8)';
            newElement.style.borderColor = '#00ffff';

            // Scroll into view if needed
            newElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Select the current element (activate it)
     */
    selectCurrentElement() {
        const element = this.navigableElements[this.selectedIndex];
        if (!element) return;

        // If it's the language select, focus it so user can change with arrow keys
        if (element === this.languageSelect) {
            element.focus();
            return;
        }

        // Otherwise, click it
        element.click();
    }

    /**
     * Add navigation styles to the page
     */
    addNavigationStyles() {
        // Check if styles already exist
        if (document.getElementById('options-menu-navigation-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'options-menu-navigation-styles';
        styles.textContent = `
            .options-menu .menu-selected {
                outline: 2px solid #00ffff;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Parent keyboard management methods
     */
    disableKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
        }
    }

    enableKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.addEventListener('keydown', this.keyboardHandler, { capture: true });
        }
    }
}
