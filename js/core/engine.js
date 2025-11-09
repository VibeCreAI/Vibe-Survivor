/**
 * Game Engine Utilities
 * Core game loop and timing utilities
 * Extracted from vibe-survivor-game.js during Phase 11 refactoring
 */

/**
 * GameLoop - Manages game loop timing and updates
 */
export class GameLoop {
    constructor() {
        this.running = false;
        this.lastTime = 0;
        this.animationFrameId = null;
        this.updateCallback = null;
        this.renderCallback = null;
    }

    /**
     * Sets the update callback
     * @param {Function} callback - Update function (deltaTime)
     */
    onUpdate(callback) {
        this.updateCallback = callback;
    }

    /**
     * Sets the render callback
     * @param {Function} callback - Render function
     */
    onRender(callback) {
        this.renderCallback = callback;
    }

    /**
     * Starts the game loop
     */
    start() {
        if (this.running) return;

        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    /**
     * Stops the game loop
     */
    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Pauses the game loop (keeps running but skips updates)
     */
    pause() {
        this.running = false;
    }

    /**
     * Resumes the game loop
     */
    resume() {
        if (!this.running) {
            this.running = true;
            this.lastTime = performance.now();
            this.loop();
        }
    }

    /**
     * Main game loop
     */
    loop() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update
        if (this.updateCallback) {
            this.updateCallback(deltaTime);
        }

        // Render
        if (this.renderCallback) {
            this.renderCallback();
        }

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    /**
     * Checks if loop is running
     * @returns {boolean}
     */
    isRunning() {
        return this.running;
    }
}

/**
 * EngineTimer - Tracks game time
 */
export class EngineTimer {
    constructor() {
        this.gameTime = 0;
        this.paused = false;
    }

    /**
     * Updates the timer
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        if (!this.paused) {
            this.gameTime += deltaTime;
        }
    }

    /**
     * Gets current game time
     * @returns {number} Game time in seconds
     */
    getTime() {
        return this.gameTime;
    }

    /**
     * Resets the timer
     */
    reset() {
        this.gameTime = 0;
        this.paused = false;
    }

    /**
     * Pauses the timer
     */
    pause() {
        this.paused = true;
    }

    /**
     * Resumes the timer
     */
    resume() {
        this.paused = false;
    }

    /**
     * Checks if timer is paused
     * @returns {boolean}
     */
    isPaused() {
        return this.paused;
    }
}

/**
 * FrameRateCounter - Tracks FPS
 */
export class FrameRateCounter {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
    }

    /**
     * Updates FPS counter
     * @param {number} currentTime - Current timestamp
     */
    update(currentTime) {
        this.frameCount++;

        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
    }

    /**
     * Gets current FPS
     * @returns {number}
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Resets counter
     */
    reset() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
    }
}
