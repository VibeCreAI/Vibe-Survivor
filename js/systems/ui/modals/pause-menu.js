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
        this.musicMuteButton = null;
        this.sfxMuteButton = null;
        this.musicVolumeSlider = null;
        this.sfxVolumeSlider = null;
        this.dashPositionButton = null;
        this.exitButton = null;

        this.onResumeCallback = null;
        this.onRestartCallback = null;
        this.onMusicMuteCallback = null;
        this.onSfxMuteCallback = null;
        this.onMusicVolumeCallback = null;
        this.onSfxVolumeCallback = null;
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
        this.getMusicMutedState = null;
        this.getSfxMutedState = null;
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
            this.musicMuteButton = this.element.querySelector('#music-mute-btn');
            this.sfxMuteButton = this.element.querySelector('#sfx-mute-btn');
            this.musicVolumeSlider = this.element.querySelector('#pause-music-volume');
            this.sfxVolumeSlider = this.element.querySelector('#pause-sfx-volume');
            this.dashPositionButton = this.element.querySelector('#dash-position-btn');
            this.exitButton = this.element.querySelector('#exit-to-menu-btn');

            // Set up button event listeners
            if (this.resumeButton) {
                this.resumeButton.addEventListener('click', () => this.handleResume());
            }
            if (this.restartButton) {
                this.restartButton.addEventListener('click', () => this.handleRestart());
            }
            if (this.musicMuteButton) {
                this.musicMuteButton.addEventListener('click', () => this.handleMusicMute());
            }
            if (this.sfxMuteButton) {
                this.sfxMuteButton.addEventListener('click', () => this.handleSfxMute());
            }
            if (this.musicVolumeSlider) {
                this.musicVolumeSlider.addEventListener('input', (e) => {
                    const volume = parseFloat(e.target.value);
                    if (this.onMusicVolumeCallback) {
                        this.onMusicVolumeCallback(volume);
                    }
                    // Update percentage display
                    const percentDisplay = document.getElementById('pause-music-percent');
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
                    const percentDisplay = document.getElementById('pause-sfx-percent');
                    if (percentDisplay) {
                        percentDisplay.textContent = `${Math.round(volume * 100)}%`;
                    }
                });
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
     * Sets callback for music mute action
     * @param {Function} callback - Music mute callback
     */
    onMusicMute(callback) {
        this.onMusicMuteCallback = callback;
    }

    /**
     * Sets callback for SFX mute action
     * @param {Function} callback - SFX mute callback
     */
    onSfxMute(callback) {
        this.onSfxMuteCallback = callback;
    }

    /**
     * Sets callback for music volume action
     * @param {Function} callback - Music volume callback
     */
    onMusicVolume(callback) {
        this.onMusicVolumeCallback = callback;
    }

    /**
     * Sets callback for SFX volume action
     * @param {Function} callback - SFX volume callback
     */
    onSfxVolume(callback) {
        this.onSfxVolumeCallback = callback;
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
     * @param {Function} getMusicMutedState - Gets current music mute state
     * @param {Function} getSfxMutedState - Gets current SFX mute state
     * @param {Function} getDashPositionState - Gets current dash button position
     * @param {Function} getTranslation - Translation function
     */
    setGameStateCallbacks(getMusicMutedState, getSfxMutedState, getDashPositionState, getTranslation) {
        this.getMusicMutedState = getMusicMutedState;
        this.getSfxMutedState = getSfxMutedState;
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
     * Handles music mute button click
     */
    handleMusicMute() {
        if (this.onMusicMuteCallback) {
            this.onMusicMuteCallback();
        }
        // Update button label
        this.updateButtonLabels();
    }

    /**
     * Handles SFX mute button click
     */
    handleSfxMute() {
        if (this.onSfxMuteCallback) {
            this.onSfxMuteCallback();
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
        // SVG icons for mute states
        const volumeUpIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-left: 8px;"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        const volumeOffIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-left: 8px;"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';

        // Update music mute button (just icon, since we have label above)
        if (this.musicMuteButton && this.getMusicMutedState) {
            const isMuted = this.getMusicMutedState();
            const icon = isMuted ? volumeOffIcon : volumeUpIcon;
            this.musicMuteButton.innerHTML = icon;
        }

        // Update SFX mute button (just icon, since we have label above)
        if (this.sfxMuteButton && this.getSfxMutedState) {
            const isMuted = this.getSfxMutedState();
            const icon = isMuted ? volumeOffIcon : volumeUpIcon;
            this.sfxMuteButton.innerHTML = icon;
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
     * Update volume slider values and percentages
     * @param {number} musicVolume - Music volume (0-1)
     * @param {number} sfxVolume - SFX volume (0-1)
     */
    updateVolumeSliders(musicVolume, sfxVolume) {
        if (this.musicVolumeSlider && musicVolume !== undefined) {
            this.musicVolumeSlider.value = musicVolume;
            // Update percentage display
            const musicPercentDisplay = document.getElementById('pause-music-percent');
            if (musicPercentDisplay) {
                musicPercentDisplay.textContent = `${Math.round(musicVolume * 100)}%`;
            }
        }
        if (this.sfxVolumeSlider && sfxVolume !== undefined) {
            this.sfxVolumeSlider.value = sfxVolume;
            // Update percentage display
            const sfxPercentDisplay = document.getElementById('pause-sfx-percent');
            if (sfxPercentDisplay) {
                sfxPercentDisplay.textContent = `${Math.round(sfxVolume * 100)}%`;
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

        // Update audio section labels
        const audioSections = this.element?.querySelectorAll('.pause-audio-section label');
        if (audioSections && audioSections.length >= 2) {
            audioSections[0].textContent = t('music');
            audioSections[1].textContent = t('sfx');
        }

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

        // Set up navigable buttons (including volume sliders)
        this.navigableButtons = [
            this.resumeButton,
            this.restartButton,
            this.musicMuteButton,
            this.musicVolumeSlider,
            this.sfxMuteButton,
            this.sfxVolumeSlider,
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
