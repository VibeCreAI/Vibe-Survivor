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
        this.musicMuteButton = null;
        this.sfxMuteButton = null;
        this.musicVolumeSlider = null;
        this.sfxVolumeSlider = null;
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
        this.onMusicMuteCallback = null;
        this.onSfxMuteCallback = null;
        this.onMusicVolumeCallback = null;
        this.onSfxVolumeCallback = null;
        this.onDashPositionCallback = null;

        // Overlay lock callbacks
        this.incrementOverlayLockCallback = null;
        this.decrementOverlayLockCallback = null;

        // Game state callbacks for dynamic button labels
        this.getMusicMutedState = null;
        this.getSfxMutedState = null;
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
        this.musicMuteButton = document.getElementById('options-music-mute-btn');
        this.sfxMuteButton = document.getElementById('options-sfx-mute-btn');
        this.musicVolumeSlider = document.getElementById('options-music-volume');
        this.sfxVolumeSlider = document.getElementById('options-sfx-volume');
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

        if (this.musicMuteButton) {
            const musicMuteHandler = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (this.onMusicMuteCallback) {
                    this.onMusicMuteCallback();
                    this.updateButtonLabels();
                }
            };

            this.musicMuteButton.addEventListener('click', musicMuteHandler);
            this.musicMuteButton.addEventListener('touchstart', musicMuteHandler, { passive: false });
        }

        if (this.sfxMuteButton) {
            const sfxMuteHandler = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (this.onSfxMuteCallback) {
                    this.onSfxMuteCallback();
                    this.updateButtonLabels();
                }
            };

            this.sfxMuteButton.addEventListener('click', sfxMuteHandler);
            this.sfxMuteButton.addEventListener('touchstart', sfxMuteHandler, { passive: false });
        }

        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                if (this.onMusicVolumeCallback) {
                    this.onMusicVolumeCallback(volume);
                }
                // Update percentage display
                const percentDisplay = document.getElementById('options-music-percent');
                if (percentDisplay) {
                    percentDisplay.textContent = `${Math.round(volume * 100)}%`;
                }
            });
        }

        if (this.sfxVolumeSlider) {
            this.sfxVolumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value);
                if (this.onSfxVolumeCallback) {
                    this.onSfxVolumeCallback(volume);
                }
                // Update percentage display
                const percentDisplay = document.getElementById('options-sfx-percent');
                if (percentDisplay) {
                    percentDisplay.textContent = `${Math.round(volume * 100)}%`;
                }
            });
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
    setGameStateCallbacks(getMusicMutedState, getSfxMutedState, getDashPositionState, getLanguageState, getTranslation) {
        this.getMusicMutedState = getMusicMutedState;
        this.getSfxMutedState = getSfxMutedState;
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

    onMusicMute(callback) {
        this.onMusicMuteCallback = callback;
    }

    onSfxMute(callback) {
        this.onSfxMuteCallback = callback;
    }

    onMusicVolume(callback) {
        this.onMusicVolumeCallback = callback;
    }

    onSfxVolume(callback) {
        this.onSfxVolumeCallback = callback;
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
     * Update button labels and slider values based on current game state
     */
    updateButtonLabels() {
        // SVG icons for mute states
        const volumeUpIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        const volumeOffIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';

        // Update music mute button
        if (this.musicMuteButton && this.getMusicMutedState) {
            const isMuted = this.getMusicMutedState();
            this.musicMuteButton.innerHTML = isMuted ? volumeOffIcon : volumeUpIcon;
        }

        // Update SFX mute button
        if (this.sfxMuteButton && this.getSfxMutedState) {
            const isMuted = this.getSfxMutedState();
            this.sfxMuteButton.innerHTML = isMuted ? volumeOffIcon : volumeUpIcon;
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
     * Update volume slider values from audio manager
     */
    updateVolumeSliders(musicVolume, sfxVolume) {
        if (this.musicVolumeSlider && musicVolume !== undefined) {
            this.musicVolumeSlider.value = musicVolume;
            // Update percentage display
            const musicPercentDisplay = document.getElementById('options-music-percent');
            if (musicPercentDisplay) {
                musicPercentDisplay.textContent = `${Math.round(musicVolume * 100)}%`;
            }
        }
        if (this.sfxVolumeSlider && sfxVolume !== undefined) {
            this.sfxVolumeSlider.value = sfxVolume;
            // Update percentage display
            const sfxPercentDisplay = document.getElementById('options-sfx-percent');
            if (sfxPercentDisplay) {
                sfxPercentDisplay.textContent = `${Math.round(sfxVolume * 100)}%`;
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
        if (labels && labels.length >= 4) {
            labels[0].textContent = t('language');
            labels[1].textContent = t('music');
            labels[2].textContent = t('soundEffects');
            labels[3].textContent = t('dashPosition');
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
            this.musicMuteButton,
            this.musicVolumeSlider,
            this.sfxMuteButton,
            this.sfxVolumeSlider,
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
