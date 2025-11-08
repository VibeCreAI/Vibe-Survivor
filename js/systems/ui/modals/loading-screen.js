/**
 * Loading Screen Modal
 * Manages asset preloading overlay with progress bar
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * LoadingScreen - Displays loading progress during asset preload
 */
export class LoadingScreen extends Modal {
    constructor(id = 'loading-screen') {
        super(id, { closeOnEscape: false, closeOnBackdropClick: false });
        this.progressBar = null;
        this.progressText = null;
        this.phaseLabel = null;
    }

    /**
     * Initializes loading screen elements
     */
    init() {
        const result = super.init();
        if (result) {
            // Find progress elements
            this.progressBar = this.element.querySelector('.loading-progress-bar');
            this.progressText = this.element.querySelector('.loading-progress-text');
            this.phaseLabel = this.element.querySelector('.loading-phase-label');
        }
        return result;
    }

    /**
     * Updates loading progress
     * @param {Object} data - Progress data
     * @param {number} data.progress - Progress percentage (0-100)
     * @param {string} data.phase - Loading phase label
     * @param {string} data.message - Optional progress message
     */
    update(data) {
        if (this.progressBar) {
            this.progressBar.style.width = `${data.progress}%`;
        }

        if (this.progressText && data.message) {
            this.progressText.textContent = data.message;
        }

        if (this.phaseLabel && data.phase) {
            this.phaseLabel.textContent = data.phase;
        }
    }

    /**
     * Sets loading phase
     * @param {string} phase - Phase name (e.g., 'BOOTING', 'LOADING', 'READY')
     */
    setPhase(phase) {
        if (this.phaseLabel) {
            this.phaseLabel.textContent = phase;
        }
    }

    /**
     * Sets progress percentage
     * @param {number} percent - Progress (0-100)
     */
    setProgress(percent) {
        if (this.progressBar) {
            this.progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }

    /**
     * Sets progress message
     * @param {string} message - Progress message
     */
    setMessage(message) {
        if (this.progressText) {
            this.progressText.textContent = message;
        }
    }
}
