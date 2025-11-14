/**
 * Start Screen Modal - Minimal Option B Implementation
 * Only handles button click event listeners
 * Phase 12c.8 - Conservative refactor approach
 *
 * Note: Keyboard navigation, DOM manipulation, and rendering remain in main game file
 */

export class StartScreenModal {
    constructor() {
        // Button references
        this.startButton = null;
        this.optionsButton = null;
        this.aboutButton = null;
        this.restartButton = null;
        this.exitButton = null;

        // Callbacks
        this.onStartCallback = null;
        this.onOptionsCallback = null;
        this.onAboutCallback = null;
        this.onRestartCallback = null;
        this.onExitCallback = null;

        // Initialization flag
        this.initialized = false;
    }

    /**
     * Initialize button event listeners
     */
    init() {
        if (this.initialized) return true;

        // Get button references
        this.startButton = document.getElementById('start-survivor');
        this.optionsButton = document.getElementById('options-btn');
        this.aboutButton = document.getElementById('about-btn');
        this.restartButton = document.getElementById('restart-survivor');
        this.exitButton = document.getElementById('exit-survivor');

        // Set up button click handlers
        this.setupButtonHandlers();

        this.initialized = true;
        return true;
    }

    /**
     * Set up button click handlers
     */
    setupButtonHandlers() {
        if (this.startButton) {
            this.startButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.onStartCallback) {
                    this.onStartCallback();
                }
            });
        }

        if (this.optionsButton) {
            this.optionsButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.onOptionsCallback) {
                    this.onOptionsCallback();
                }
            });
        }

        if (this.aboutButton) {
            this.aboutButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.onAboutCallback) {
                    this.onAboutCallback();
                }
            });
        }

        if (this.restartButton) {
            this.restartButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.onRestartCallback) {
                    this.onRestartCallback();
                }
            });
        }

        if (this.exitButton) {
            this.exitButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.onExitCallback) {
                    this.onExitCallback();
                }
            });
        }
    }

    /**
     * Set callback functions
     */
    onStart(callback) {
        this.onStartCallback = callback;
    }

    onOptions(callback) {
        this.onOptionsCallback = callback;
    }

    onAbout(callback) {
        this.onAboutCallback = callback;
    }

    onRestart(callback) {
        this.onRestartCallback = callback;
    }

    onExit(callback) {
        this.onExitCallback = callback;
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Button references will be cleaned up automatically
        this.startButton = null;
        this.optionsButton = null;
        this.aboutButton = null;
        this.restartButton = null;
        this.exitButton = null;
        this.initialized = false;
    }
}
