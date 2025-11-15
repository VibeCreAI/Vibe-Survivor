/**
 * Pause Menu Modal
 * Pause overlay displayed when ESC is pressed
 * Refactored to Option B pattern - modal owns all its behavior
 * Phase 12c.4 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * PauseMenu - Game pause screen with full keyboard navigation
 */
export class PauseMenu extends Modal {
    constructor(id = 'pause-menu') {
        super(id, { closeOnEscape: false, closeOnBackdropClick: false });
        this.resumeButton = null;
        this.restartButton = null;
        this.muteButton = null;
        this.dashPositionButton = null;
        this.exitButton = null;

        this.onResumeCallback = null;
        this.onRestartCallback = null;
        this.onMuteCallback = null;
        this.onDashPositionCallback = null;
        this.onExitCallback = null;

        // Keyboard navigation state
        this.keyboardHandler = null;
        this.selectedIndex = 0;
        this.navigableButtons = [];
        this.keyboardUsed = false;

        // Overlay lock callbacks (for disabling pause/help buttons)
        this.incrementOverlayLockCallback = null;
        this.decrementOverlayLockCallback = null;

        // Game state callbacks for dynamic button labels
        this.getAudioMutedState = null;
        this.getDashPositionState = null;
        this.getTranslation = null;
    }

    /**
     * Initializes pause menu elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.resumeButton = this.element.querySelector('#resume-btn');
            this.restartButton = this.element.querySelector('#pause-restart-btn');
            this.muteButton = this.element.querySelector('#mute-btn');
            this.dashPositionButton = this.element.querySelector('#dash-position-btn');
            this.exitButton = this.element.querySelector('#exit-to-menu-btn');

            // Set up button event listeners
            if (this.resumeButton) {
                this.resumeButton.addEventListener('click', () => this.handleResume());
            }
            if (this.restartButton) {
                this.restartButton.addEventListener('click', () => this.handleRestart());
            }
            if (this.muteButton) {
                this.muteButton.addEventListener('click', () => this.handleMute());
            }
            if (this.dashPositionButton) {
                this.dashPositionButton.addEventListener('click', () => this.handleDashPosition());
            }
            if (this.exitButton) {
                this.exitButton.addEventListener('click', () => this.handleExit());
            }

            if (this.getTranslation) {
                this.updateLocalization();
            }
        }
        return result;
    }

    /**
     * Sets callback for resume action
     * @param {Function} callback - Resume callback
     */
    onResume(callback) {
        this.onResumeCallback = callback;
    }

    /**
     * Sets callback for restart action
     * @param {Function} callback - Restart callback
     */
    onRestart(callback) {
        this.onRestartCallback = callback;
    }

    /**
     * Sets callback for mute action
     * @param {Function} callback - Mute callback
     */
    onMute(callback) {
        this.onMuteCallback = callback;
    }

    /**
     * Sets callback for dash position action
     * @param {Function} callback - Dash position callback
     */
    onDashPosition(callback) {
        this.onDashPositionCallback = callback;
    }

    /**
     * Sets callback for exit action
     * @param {Function} callback - Exit callback
     */
    onExit(callback) {
        this.onExitCallback = callback;
    }

    /**
     * Sets overlay lock callbacks for disabling pause/help buttons
     * @param {Function} incrementFn - Function to call when modal shows
     * @param {Function} decrementFn - Function to call when modal hides
     */
    setOverlayLockCallbacks(incrementFn, decrementFn) {
        this.incrementOverlayLockCallback = incrementFn;
        this.decrementOverlayLockCallback = decrementFn;
    }

    /**
     * Sets game state callbacks for dynamic button labels
     * @param {Function} getAudioMutedState - Gets current audio mute state
     * @param {Function} getDashPositionState - Gets current dash button position
     * @param {Function} getTranslation - Translation function
     */
    setGameStateCallbacks(getAudioMutedState, getDashPositionState, getTranslation) {
        this.getAudioMutedState = getAudioMutedState;
        this.getDashPositionState = getDashPositionState;
        this.getTranslation = getTranslation;

        if (this.element) {
            this.updateLocalization();
        }
    }

    /**
     * Handles resume button click
     */
    handleResume() {
        if (this.onResumeCallback) {
            this.onResumeCallback();
        }
        // Don't call this.hide() here - togglePause() will handle it
    }

    /**
     * Handles restart button click
     */
    handleRestart() {
        if (this.onRestartCallback) {
            this.onRestartCallback();
        }
        // Don't hide - restart confirmation might be shown
    }

    /**
     * Handles mute button click
     */
    handleMute() {
        if (this.onMuteCallback) {
            this.onMuteCallback();
        }
        // Update button label
        this.updateButtonLabels();
    }

    /**
     * Handles dash position button click
     */
    handleDashPosition() {
        if (this.onDashPositionCallback) {
            this.onDashPositionCallback();
        }
        // Update button label
        this.updateButtonLabels();
    }

    /**
     * Handles exit button click
     */
    handleExit() {
        if (this.onExitCallback) {
            this.onExitCallback();
        }
        // Don't hide here - let the callback handle modal state
    }

    /**
     * Updates dynamic button labels based on game state
     */
    updateButtonLabels() {
        // Update mute button
        if (this.muteButton && this.getAudioMutedState && this.getTranslation) {
            const isMuted = this.getAudioMutedState();
            this.muteButton.textContent = isMuted ? this.getTranslation('unmute') : this.getTranslation('mute');
        }

        // Update dash position button
        if (this.dashPositionButton && this.getDashPositionState) {
            const position = this.getDashPositionState();
            if (position) {
                if (this.getTranslation) {
                    const key = position === 'left' ? 'dashButtonLeft' : 'dashButtonRight';
                    this.dashPositionButton.textContent = this.getTranslation(key);
                } else {
                    this.dashPositionButton.textContent = `DASH BUTTON: ${position.toUpperCase()}`;
                }
            }
        }
    }

    /**
     * Updates all localized text in the pause menu
     */
    updateLocalization() {
        if (!this.getTranslation) return;

        const t = this.getTranslation;

        const title = this.element?.querySelector('h2');
        if (title) title.textContent = t('gamePaused');

        if (this.resumeButton) this.resumeButton.textContent = t('resume');
        if (this.restartButton) this.restartButton.textContent = t('restart');
        if (this.exitButton) this.exitButton.textContent = t('quitGame');

        const pauseHint = this.element?.querySelector('.pause-hint');
        if (pauseHint) pauseHint.textContent = t('pauseHint');

        this.updateButtonLabels();
    }

    /**
     * Navigates through pause menu buttons
     * @param {string} direction - 'up' or 'down'
     */
    navigateMenu(direction) {
        if (this.navigableButtons.length === 0) return;

        if (direction === 'up') {
            this.selectedIndex = (this.selectedIndex - 1 + this.navigableButtons.length) % this.navigableButtons.length;
        } else if (direction === 'down') {
            this.selectedIndex = (this.selectedIndex + 1) % this.navigableButtons.length;
        }

        this.updateMenuHighlight();
    }

    /**
     * Updates visual highlight for selected button
     */
    updateMenuHighlight() {
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
            selected.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8)';
            selected.style.borderColor = '#00ffff';
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
            // Handle navigation
            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from reaching main game handler
                    this.keyboardUsed = true;
                    this.navigateMenu('up');
                    break;

                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from reaching main game handler
                    this.keyboardUsed = true;
                    this.navigateMenu('down');
                    break;

                case 'enter':
                    if (this.keyboardUsed) {
                        e.preventDefault();
                        e.stopPropagation(); // Stop event from reaching main game handler
                        this.selectCurrentButton();
                    }
                    break;

                case 'escape':
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from reaching main game handler
                    this.handleResume(); // ESC resumes game
                    break;
            }
        };

        // Use capture phase to ensure modal gets events before main game handler
        document.addEventListener('keydown', this.keyboardHandler, { capture: true });

        // Add navigation CSS styles
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
        if (document.getElementById('pause-nav-styles')) return;

        const style = document.createElement('style');
        style.id = 'pause-nav-styles';
        style.textContent = `
            .menu-selected {
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
                border-color: #00ffff !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Temporarily disables keyboard handlers (for when confirmation dialogs are shown)
     */
    disableKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
        }
    }

    /**
     * Re-enables keyboard handlers (after confirmation dialogs are closed)
     */
    enableKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.addEventListener('keydown', this.keyboardHandler, { capture: true });
        }
    }

    /**
     * Shows pause menu
     */
    onShow() {
        // Increment overlay lock to disable pause/help buttons
        if (this.incrementOverlayLockCallback) {
            this.incrementOverlayLockCallback();
        }

        // Update button labels
        this.updateButtonLabels();

        // Set up keyboard handlers
        this.setupKeyboardHandlers();

        // Set up navigable buttons
        this.navigableButtons = [
            this.resumeButton,
            this.restartButton,
            this.muteButton,
            this.dashPositionButton,
            this.exitButton
        ].filter(Boolean);

        // Initialize selection
        this.selectedIndex = 0;
        this.keyboardUsed = false;

        // Focus the pause content
        const pauseContent = this.element?.querySelector('.pause-content');
        if (pauseContent) {
            pauseContent.setAttribute('tabindex', '-1');
            pauseContent.focus({ preventScroll: true });
        }
    }

    /**
     * Hides pause menu
     */
    onHide() {
        // Decrement overlay lock to re-enable pause/help buttons
        if (this.decrementOverlayLockCallback) {
            this.decrementOverlayLockCallback();
        }

        // Clean up keyboard handlers
        this.cleanupKeyboardHandlers();
    }
}
