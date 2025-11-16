/**
 * Sprite loading and management system
 */

/**
 * Sprite manager for loading and accessing game sprites
 */
export class SpriteManager {
    constructor() {
        // Player sprites (5 directional sprites)
        this.playerSprites = {
            idle: new Image(),
            up: new Image(),
            down: new Image(),
            left: new Image(),
            right: new Image(),
            loaded: 0,
            total: 5
        };

        // Item pickup icons
        this.itemIcons = {
            health: new Image(),
            magnet: new Image(),
            upgradeBox: new Image()
        };

        // Sprite sheet configuration (3 columns x 4 rows = 12 frames)
        this.spriteConfig = {
            frameWidth: 0,   // Will be calculated when image loads
            frameHeight: 0,  // Will be calculated when image loads
            cols: 3,
            rows: 4,
            totalFrames: 12,
            frameRate: 8     // 8 FPS for animation
        };

        // Loading state
        this.allLoaded = false;
    }

    /**
     * Load all sprites with callback
     * @param {Function} onProgress - Optional callback for load progress
     * @returns {Promise} Resolves when all sprites loaded
     */
    async loadSprites(onProgress = null) {
        return new Promise((resolve) => {
            // Track sprite loading
            const onSpriteLoad = () => {
                this.playerSprites.loaded++;

                // Calculate frame dimensions from first loaded sprite
                if (this.spriteConfig.frameWidth === 0 && this.playerSprites.idle.complete) {
                    this.spriteConfig.frameWidth = Math.floor(
                        this.playerSprites.idle.width / this.spriteConfig.cols
                    );
                    this.spriteConfig.frameHeight = Math.floor(
                        this.playerSprites.idle.height / this.spriteConfig.rows
                    );
                    console.log('Sprite dimensions calculated:',
                        this.spriteConfig.frameWidth, 'x', this.spriteConfig.frameHeight);
                }

                // Call progress callback
                if (onProgress) {
                    onProgress(this.playerSprites.loaded, this.playerSprites.total);
                }

                // Check if all loaded
                if (this.playerSprites.loaded === this.playerSprites.total) {
                    this.allLoaded = true;
                    resolve();
                }
            };

            // Set up load handlers
            this.playerSprites.idle.onload = onSpriteLoad;
            this.playerSprites.up.onload = onSpriteLoad;
            this.playerSprites.down.onload = onSpriteLoad;
            this.playerSprites.left.onload = onSpriteLoad;
            this.playerSprites.right.onload = onSpriteLoad;

            // Start loading sprites
            this.playerSprites.idle.src = 'images/AI BOT-IDLE.png';
            this.playerSprites.up.src = 'images/AI BOT-UP.png';
            this.playerSprites.down.src = 'images/AI BOT-DOWN.png';
            this.playerSprites.left.src = 'images/AI BOT-LEFT.png';
            this.playerSprites.right.src = 'images/AI BOT-RIGHT.png';
        });
    }

    /**
     * Load item icons
     */
    loadItemIcons() {
        this.itemIcons.health.src = 'images/passives/healthBoost.png';
        this.itemIcons.magnet.src = 'images/passives/magnet.png';
        this.itemIcons.upgradeBox.src = 'images/passives/upgradeBox.png';
    }

    /**
     * Get player sprite for direction
     * @param {string} direction - Direction (idle, up, down, left, right)
     * @returns {Image} Sprite image
     */
    getPlayerSprite(direction) {
        return this.playerSprites[direction] || this.playerSprites.idle;
    }

    /**
     * Get item icon
     * @param {string} type - Icon type (health, magnet)
     * @returns {Image} Icon image
     */
    getItemIcon(type) {
        return this.itemIcons[type];
    }

    /**
     * Get sprite config
     * @returns {Object} Sprite configuration
     */
    getSpriteConfig() {
        return this.spriteConfig;
    }

    /**
     * Check if all sprites are loaded
     * @returns {boolean} True if all loaded
     */
    isLoaded() {
        return this.allLoaded;
    }

    /**
     * Get loading progress
     * @returns {Object} {loaded, total, percentage}
     */
    getLoadingProgress() {
        return {
            loaded: this.playerSprites.loaded,
            total: this.playerSprites.total,
            percentage: (this.playerSprites.loaded / this.playerSprites.total) * 100
        };
    }

    /**
     * Draw sprite frame
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} direction - Sprite direction
     * @param {number} frame - Frame number (0-11)
     * @param {number} x - World X position
     * @param {number} y - World Y position
     */
    drawSprite(ctx, direction, frame, x, y) {
        const sprite = this.getPlayerSprite(direction);

        if (!sprite.complete) {
            // Draw placeholder if sprite not loaded
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(
                x - this.spriteConfig.frameWidth / 2,
                y - this.spriteConfig.frameHeight / 2,
                this.spriteConfig.frameWidth,
                this.spriteConfig.frameHeight
            );
            return;
        }

        const { frameWidth, frameHeight, cols } = this.spriteConfig;

        // Calculate frame position in sprite sheet
        const col = frame % cols;
        const row = Math.floor(frame / cols);

        // Draw sprite frame
        ctx.drawImage(
            sprite,
            col * frameWidth,      // Source X
            row * frameHeight,     // Source Y
            frameWidth,            // Source width
            frameHeight,           // Source height
            x - frameWidth / 2,    // Dest X (centered)
            y - frameHeight / 2,   // Dest Y (centered)
            frameWidth,            // Dest width
            frameHeight            // Dest height
        );
    }
}
