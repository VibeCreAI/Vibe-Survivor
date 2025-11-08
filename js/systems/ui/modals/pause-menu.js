/**
 * Pause Menu Modal
 * Pause overlay displayed when ESC is pressed
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * PauseMenu - Game pause screen
 */
export class PauseMenu extends Modal {
    constructor(id = 'pause-menu') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: false });
        this.resumeButton = null;
        this.restartButton = null;
        this.settingsButton = null;
        this.exitButton = null;

        this.onResumeCallback = null;
        this.onRestartCallback = null;
        this.onSettingsCallback = null;
        this.onExitCallback = null;
    }

    /**
     * Initializes pause menu elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.resumeButton = this.element.querySelector('.pause-resume-btn');
            this.restartButton = this.element.querySelector('.pause-restart-btn');
            this.settingsButton = this.element.querySelector('.pause-settings-btn');
            this.exitButton = this.element.querySelector('.pause-exit-btn');

            // Set up button event listeners
            if (this.resumeButton) {
                this.resumeButton.addEventListener('click', () => this.handleResume());
            }
            if (this.restartButton) {
                this.restartButton.addEventListener('click', () => this.handleRestart());
            }
            if (this.settingsButton) {
                this.settingsButton.addEventListener('click', () => this.handleSettings());
            }
            if (this.exitButton) {
                this.exitButton.addEventListener('click', () => this.handleExit());
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
     * Sets callback for settings action
     * @param {Function} callback - Settings callback
     */
    onSettings(callback) {
        this.onSettingsCallback = callback;
    }

    /**
     * Sets callback for exit action
     * @param {Function} callback - Exit callback
     */
    onExit(callback) {
        this.onExitCallback = callback;
    }

    /**
     * Handles resume button click
     */
    handleResume() {
        if (this.onResumeCallback) {
            this.onResumeCallback();
        }
        this.hide();
    }

    /**
     * Handles restart button click
     */
    handleRestart() {
        if (this.onRestartCallback) {
            this.onRestartCallback();
        }
    }

    /**
     * Handles settings button click
     */
    handleSettings() {
        if (this.onSettingsCallback) {
            this.onSettingsCallback();
        }
    }

    /**
     * Handles exit button click
     */
    handleExit() {
        if (this.onExitCallback) {
            this.onExitCallback();
        }
    }

    /**
     * Shows pause menu
     */
    onShow() {
        if (this.resumeButton) {
            this.resumeButton.focus();
        }
    }
}
