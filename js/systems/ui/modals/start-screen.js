/**
 * Start Screen Modal
 * Initial "Press Start" screen before game begins
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * StartScreen - Initial game start screen
 */
export class StartScreen extends Modal {
    constructor(id = 'start-screen') {
        super(id, { closeOnEscape: false, closeOnBackdropClick: false });
        this.startButton = null;
        this.onStartCallback = null;
    }

    /**
     * Initializes start screen elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.startButton = this.element.querySelector('.start-button');
            if (this.startButton) {
                this.startButton.addEventListener('click', () => this.handleStart());
            }
        }
        return result;
    }

    /**
     * Sets callback for when start is clicked
     * @param {Function} callback - Start callback
     */
    onStart(callback) {
        this.onStartCallback = callback;
    }

    /**
     * Handles start button click
     */
    handleStart() {
        if (this.onStartCallback) {
            this.onStartCallback();
        }
        this.hide();
    }

    /**
     * Shows start screen
     */
    onShow() {
        if (this.startButton) {
            this.startButton.focus();
        }
    }
}
