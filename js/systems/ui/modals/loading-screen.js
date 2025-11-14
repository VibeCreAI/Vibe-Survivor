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
        this.progressPercent = null;
    }

    /**
     * Initializes loading screen elements
     */
    init() {
        const result = super.init();
        if (result) {
            // Phase 12c.9 - Find progress elements (matching actual HTML structure)
            this.progressBar = this.element.querySelector('.loading-fill');
            this.progressPercent = this.element.querySelector('.loading-percent');
            this.progressText = this.element.querySelector('.loading-text');
            this.phaseLabel = this.element.querySelector('.loading-label');
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
     * Sets loading phase (updates the title in .loading-text)
     * @param {string} phase - Phase name (e.g., 'BOOTING', 'LOADING', 'READY')
     */
    setPhase(phase) {
        // Phase 12c.9 - Update the first child (title text) of .loading-text
        if (this.progressText && this.progressText.firstChild) {
            this.progressText.firstChild.textContent = phase;
        }
    }

    /**
     * Sets progress percentage
     * @param {number} percent - Progress (0-100)
     */
    setProgress(percent) {
        const clampedPercent = Math.min(100, Math.max(0, percent));

        // Update progress bar width
        if (this.progressBar) {
            this.progressBar.style.width = `${clampedPercent}%`;
        }

        // Phase 12c.9 - Update percentage text
        if (this.progressPercent) {
            this.progressPercent.textContent = `${Math.round(clampedPercent)}%`;
        }
    }

    /**
     * Sets progress message (label below the progress bar)
     * @param {string} message - Progress message
     */
    setMessage(message) {
        // Phase 12c.9 - Update .loading-label element
        if (this.phaseLabel) {
            this.phaseLabel.textContent = message;
        }
    }
}
