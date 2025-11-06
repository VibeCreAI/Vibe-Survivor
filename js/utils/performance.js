// Performance monitoring and adaptive quality management

/**
 * Performance monitor for FPS tracking and adaptive quality control
 */
export class PerformanceMonitor {
    constructor(targetFPS = 60, minFPS = 30) {
        this.targetFPS = targetFPS;
        this.minFPS = minFPS;
        this.currentFPS = 60;
        this.averageFPS = 60;

        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fpsHistory = [];
        this.lastCheck = 0;

        // Adaptive quality settings
        this.adaptiveQuality = {
            particleCount: 1.0,
            effectQuality: 1.0,
            renderDistance: 1.0,
            trailLength: 1.0
        };

        this.performanceMode = false;
    }

    /**
     * Update frame rate monitoring (call once per frame)
     */
    update() {
        const currentTime = performance.now();

        if (this.lastFrameTime > 0) {
            const deltaTime = currentTime - this.lastFrameTime;
            this.currentFPS = Math.round(1000 / deltaTime);

            // Only update history occasionally to reduce overhead
            if (this.frameCount % 5 === 0) {
                this.fpsHistory.push(this.currentFPS);
                if (this.fpsHistory.length > 20) {
                    this.fpsHistory.shift();
                }

                // Calculate average FPS
                const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
                this.averageFPS = sum / this.fpsHistory.length;
            }
        }

        this.lastFrameTime = currentTime;
        this.frameCount++;

        // Check quality less frequently to reduce overhead
        if (this.frameCount % 60 === 0) { // Every 60 frames
            this.adjustQuality();
            this.lastCheck = this.frameCount;
        }
    }

    /**
     * Adjust rendering quality based on current FPS
     */
    adjustQuality() {
        const avgFPS = this.averageFPS;
        const quality = this.adaptiveQuality;

        // Be conservative about enabling performance mode
        // Only enable if FPS is extremely low for extended period
        if (avgFPS < 15 && this.fpsHistory.length >= 30) {
            // Only enable if consistently below 15 FPS
            const recentLowFPS = this.fpsHistory.slice(-10).every(fps => fps < 20);
            if (recentLowFPS) {
                quality.particleCount = Math.max(0.5, quality.particleCount - 0.1);
                quality.effectQuality = Math.max(0.7, quality.effectQuality - 0.1);
                quality.renderDistance = Math.max(0.8, quality.renderDistance - 0.05);
                quality.trailLength = Math.max(0.7, quality.trailLength - 0.1);
                this.performanceMode = true;
                console.log('Performance mode enabled due to consistent low FPS:', avgFPS);
            }
        } else if (avgFPS > 45) {
            // Good performance - restore quality and disable performance mode
            quality.particleCount = Math.min(1.0, quality.particleCount + 0.05);
            quality.effectQuality = Math.min(1.0, quality.effectQuality + 0.05);
            quality.renderDistance = Math.min(1.0, quality.renderDistance + 0.02);
            quality.trailLength = Math.min(1.0, quality.trailLength + 0.05);
            this.performanceMode = false;
        }

        // Never enable performance mode on initial load
        if (this.frameCount < 120) { // First 2 seconds
            this.performanceMode = false;
        }
    }

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getCurrentFPS() {
        return this.currentFPS;
    }

    /**
     * Get average FPS
     * @returns {number} Average FPS over recent history
     */
    getAverageFPS() {
        return this.averageFPS;
    }

    /**
     * Check if performance mode is enabled
     * @returns {boolean} True if in performance mode
     */
    isPerformanceModeEnabled() {
        return this.performanceMode;
    }

    /**
     * Get adaptive quality settings
     * @returns {Object} Quality multipliers for various effects
     */
    getQualitySettings() {
        return { ...this.adaptiveQuality };
    }

    /**
     * Reset performance monitoring
     */
    reset() {
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.fpsHistory = [];
        this.averageFPS = 60;
        this.currentFPS = 60;
        this.lastCheck = 0;
        this.performanceMode = false;

        // Reset adaptive quality to defaults
        this.adaptiveQuality = {
            particleCount: 1.0,
            effectQuality: 1.0,
            renderDistance: 1.0,
            trailLength: 1.0
        };
    }

    /**
     * Force performance mode on or off
     * @param {boolean} enabled - Whether to enable performance mode
     */
    setPerformanceMode(enabled) {
        this.performanceMode = enabled;
        if (!enabled) {
            // Restore quality
            this.adaptiveQuality = {
                particleCount: 1.0,
                effectQuality: 1.0,
                renderDistance: 1.0,
                trailLength: 1.0
            };
        }
    }
}
