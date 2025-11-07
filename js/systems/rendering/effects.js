/**
 * Effects Manager
 * Manages screen-level visual effects like screen shake and red flash
 */

export class EffectsManager {
    constructor() {
        // Screen shake state
        this.screenShake = null;

        // Red flash state
        this.redFlash = {
            active: false,
            intensity: 0,
            duration: 0,
            maxIntensity: 0.6,
            decay: 0.9
        };

        // Quality settings (injected later)
        this.qualitySettings = null;
    }

    /**
     * Sets quality settings reference
     * @param {Object} qualitySettings - Quality settings object
     */
    setQualitySettings(qualitySettings) {
        this.qualitySettings = qualitySettings;
    }

    /**
     * Creates a screen shake effect
     * @param {number} intensity - Shake intensity (typical: 6-20)
     * @param {number} duration - Shake duration in frames (default: 20)
     */
    createScreenShake(intensity, duration = 20) {
        this.screenShake = {
            x: 0,
            y: 0,
            intensity: intensity,
            duration: duration,
            decay: 0.95
        };
    }

    /**
     * Updates screen shake effect each frame
     */
    updateScreenShake() {
        if (this.screenShake && this.screenShake.duration > 0) {
            // Random shake in all directions
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;

            // Decay the shake over time
            this.screenShake.intensity *= this.screenShake.decay;
            this.screenShake.duration--;

            if (this.screenShake.duration <= 0) {
                this.screenShake = null;
            }
        }
    }

    /**
     * Gets current screen shake offset
     * @returns {Object} Object with x and y shake offsets
     */
    getScreenShake() {
        if (this.screenShake) {
            return {
                x: this.screenShake.x,
                y: this.screenShake.y
            };
        }
        return { x: 0, y: 0 };
    }

    /**
     * Creates a red flash effect
     * @param {number} intensity - Flash intensity (0-1, default: 0.6)
     */
    createRedFlash(intensity = 0.6) {
        this.redFlash = {
            active: true,
            intensity: intensity,
            duration: 15,
            maxIntensity: intensity,
            decay: 0.85
        };
    }

    /**
     * Updates red flash effect each frame
     */
    updateRedFlash() {
        if (this.redFlash && this.redFlash.active) {
            // Decay the flash intensity over time
            this.redFlash.intensity *= this.redFlash.decay;
            this.redFlash.duration--;

            // Deactivate when duration expires or intensity is very low
            if (this.redFlash.duration <= 0 || this.redFlash.intensity < 0.01) {
                this.redFlash.active = false;
                this.redFlash.intensity = 0;
            }
        }
    }

    /**
     * Draws the red flash overlay
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    drawRedFlash(ctx, canvasWidth, canvasHeight) {
        if (!this.redFlash || !this.redFlash.active || this.redFlash.intensity <= 0) {
            return;
        }

        ctx.save();

        // Reset transform to draw in screen space
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Check if glow effects should be used
        const useGlow = this.qualitySettings?.useGlow !== false;

        if (useGlow) {
            // High quality: neon glow effect with shadow
            const glowIntensity = this.redFlash.intensity * 20;
            ctx.shadowBlur = glowIntensity;
            ctx.shadowColor = `rgba(255, 0, 50, ${this.redFlash.intensity})`;

            // Draw red flash overlay with glow
            ctx.fillStyle = `rgba(255, 0, 50, ${this.redFlash.intensity * 0.4})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw again for more intense effect
            ctx.fillStyle = `rgba(255, 0, 50, ${this.redFlash.intensity * 0.3})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        } else {
            // Low quality: simple overlay without glow
            ctx.fillStyle = `rgba(255, 0, 50, ${this.redFlash.intensity * 0.5})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        ctx.restore();
    }

    /**
     * Updates all effects
     */
    update() {
        this.updateScreenShake();
        this.updateRedFlash();
    }

    /**
     * Resets all effects to initial state
     */
    reset() {
        this.screenShake = null;
        this.redFlash = {
            active: false,
            intensity: 0,
            duration: 0,
            maxIntensity: 0.6,
            decay: 0.9
        };
    }

    /**
     * Checks if screen shake is active
     * @returns {boolean} True if screen shake is active
     */
    hasScreenShake() {
        return this.screenShake !== null;
    }

    /**
     * Checks if red flash is active
     * @returns {boolean} True if red flash is active
     */
    hasRedFlash() {
        return this.redFlash && this.redFlash.active;
    }
}
