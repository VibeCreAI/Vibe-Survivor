/**
 * Animation Controller System
 * Manages frame-based sprite animations with timing decoupled from FPS
 */

export class AnimationController {
    constructor() {
        // Animation timing
        this.spriteFrame = 0;          // Current frame index (0-15)
        this.spriteTimer = 0;          // Animation timing counter
        this.spriteDirection = 'idle'; // Direction: idle/up/down/left/right

        // Trail system for motion blur effect
        this.trail = [];
        this.trailMultiplier = 1.0;    // XP-based scale factor
    }

    /**
     * Updates the sprite frame based on animation timer
     * @param {Object} spriteConfig - Sprite configuration from SpriteManager
     */
    updateFrame(spriteConfig) {
        // Calculate frames per sprite frame based on configured frame rate
        const framesPerSpriteFrame = Math.floor(60 / spriteConfig.frameRate);

        // Increment animation timer
        this.spriteTimer++;

        // Update sprite frame when timer threshold is reached
        if (this.spriteTimer >= framesPerSpriteFrame) {
            this.spriteTimer = 0;
            this.spriteFrame = (this.spriteFrame + 1) % spriteConfig.totalFrames;
        }
    }

    /**
     * Updates the sprite direction based on player movement
     * @param {number} vx - Velocity X
     * @param {number} vy - Velocity Y
     */
    updateDirection(vx, vy) {
        // Only update direction if player is moving (velocity threshold)
        if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
            // Determine primary movement direction
            if (Math.abs(vx) > Math.abs(vy)) {
                // Horizontal movement dominates
                this.spriteDirection = vx > 0 ? 'right' : 'left';
            } else {
                // Vertical movement dominates
                this.spriteDirection = vy > 0 ? 'down' : 'up';
            }
        } else {
            // Player is stationary
            this.spriteDirection = 'idle';
        }
    }

    /**
     * Updates the player trail for motion blur effect
     * @param {number} x - Player X position
     * @param {number} y - Player Y position
     * @param {number} maxTrailLength - Maximum trail length
     */
    updateTrail(x, y, maxTrailLength = 5) {
        // Add current position to trail
        this.trail.push({ x, y });

        // Limit trail length
        if (this.trail.length > maxTrailLength) {
            this.trail.shift();
        }
    }

    /**
     * Draws a sprite with frame-based animation
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} spriteImage - Sprite image to draw
     * @param {Object} spriteConfig - Sprite configuration
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {number} width - Render width
     * @param {number} height - Render height
     */
    drawAnimatedSprite(ctx, spriteImage, spriteConfig, x, y, width, height) {
        if (!spriteImage || !spriteImage.complete) return;

        // Calculate frame dimensions on first render if needed
        if (spriteConfig.frameWidth === 0 || spriteConfig.frameHeight === 0) {
            spriteConfig.frameWidth = spriteImage.width / spriteConfig.cols;
            spriteConfig.frameHeight = spriteImage.height / spriteConfig.rows;
        }

        // Calculate source position in sprite sheet
        const col = this.spriteFrame % spriteConfig.cols;
        const row = Math.floor(this.spriteFrame / spriteConfig.cols);

        // 2px inset for sub-pixel compensation (prevents texture bleeding on high-DPI)
        const inset = 2;
        const sx = col * spriteConfig.frameWidth + inset;
        const sy = row * spriteConfig.frameHeight + inset;
        const sw = spriteConfig.frameWidth - inset * 2;
        const sh = spriteConfig.frameHeight - inset * 2;

        // Save context state
        const oldSmoothing = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = false;

        // Draw the sprite frame
        try {
            ctx.drawImage(
                spriteImage,
                sx, sy, sw, sh,  // Source rectangle
                x, y, width, height  // Destination rectangle
            );
        } catch (e) {
            console.error('Error drawing animated sprite:', e);
        }

        // Restore smoothing setting
        ctx.imageSmoothingEnabled = oldSmoothing;
    }

    /**
     * Draws the player trail effect
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} color - Trail color
     */
    drawTrail(ctx, color = '#00FFFF') {
        if (this.trail.length < 2) return;

        ctx.save();

        // Draw trail with fading alpha
        for (let i = 0; i < this.trail.length - 1; i++) {
            const point = this.trail[i];
            const alpha = (i / this.trail.length) * 0.3;
            const size = 8 * this.trailMultiplier * (i / this.trail.length);

            ctx.fillStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            ctx.fillRect(
                point.x - size / 2,
                point.y - size / 2,
                size,
                size
            );
        }

        ctx.restore();
    }

    /**
     * Resets animation state to initial values
     */
    reset() {
        this.spriteFrame = 0;
        this.spriteTimer = 0;
        this.spriteDirection = 'idle';
        this.trail = [];
        this.trailMultiplier = 1.0;
    }

    /**
     * Gets the current sprite direction
     * @returns {string} Current direction (idle/up/down/left/right)
     */
    getDirection() {
        return this.spriteDirection;
    }

    /**
     * Gets the current frame index
     * @returns {number} Current frame index
     */
    getFrame() {
        return this.spriteFrame;
    }
}
