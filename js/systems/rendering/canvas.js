/**
 * Canvas initialization and management
 */

/**
 * Initialize canvas with optimized settings
 * @param {string} canvasId - Canvas element ID
 * @returns {Object} Canvas and context
 */
export function initCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);

    if (!canvas) {
        throw new Error(`Canvas element with id "${canvasId}" not found`);
    }

    // Create 2D context with optimized settings for pixel art games
    const ctx = canvas.getContext('2d', {
        alpha: false,           // No transparency needed
        desynchronized: true,   // Browser optimization hint
        willReadFrequently: false // GPU acceleration
    });

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false;

    // Use fastest composite operation
    ctx.globalCompositeOperation = 'source-over';

    return { canvas, ctx };
}

/**
 * Resize canvas to match container dimensions
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
export function resizeCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width;
        canvas.height = rect.height;
    } else {
        // Fallback to modal-based sizing
        const modal = document.querySelector('.game-modal');
        if (modal) {
            const modalRect = modal.getBoundingClientRect();
            canvas.width = modalRect.width;
            canvas.height = modalRect.height;
        }
    }
}

/**
 * Camera system for smooth player following and viewport culling
 */
export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.zoom = 1;
    }

    /**
     * Update camera to follow target with smooth lerp
     * @param {Object} target - Target object with x, y properties
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @param {number} lerpFactor - Smooth follow factor (0.1 normal, 0.2 dash)
     */
    follow(target, canvasWidth, canvasHeight, lerpFactor = 0.1) {
        const effectiveWidth = canvasWidth / this.zoom;
        const effectiveHeight = canvasHeight / this.zoom;

        // Calculate target camera position (center player on screen)
        const targetX = target.x - effectiveWidth / 2;
        const targetY = target.y - effectiveHeight / 2;

        // Smooth camera movement with lerp
        this.x += (targetX - this.x) * lerpFactor;
        this.y += (targetY - this.y) * lerpFactor;
    }

    /**
     * Check if entity is in viewport (with buffer for culling)
     * @param {number} entityX - Entity world X
     * @param {number} entityY - Entity world Y
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @param {number} buffer - Extra buffer around viewport (default 100)
     * @returns {boolean} True if in viewport
     */
    isInViewport(entityX, entityY, canvasWidth, canvasHeight, buffer = 100) {
        const effectiveWidth = canvasWidth / this.zoom;
        const effectiveHeight = canvasHeight / this.zoom;
        const left = this.x - buffer;
        const right = this.x + effectiveWidth + buffer;
        const top = this.y - buffer;
        const bottom = this.y + effectiveHeight + buffer;

        return entityX >= left && entityX <= right &&
               entityY >= top && entityY <= bottom;
    }

    /**
     * Determine if entity should be rendered based on distance and type
     * @param {Object} entity - Entity to check
     * @param {Object} player - Player object
     * @param {string} entityType - Type of entity (player, boss, enemy, etc.)
     * @returns {boolean} True if should render
     */
    shouldRender(entity, player, entityType) {
        // Always render player and bosses
        if (entityType === 'player' || entityType === 'boss') {
            return true;
        }

        // Distance-based LOD for other entities
        const dx = entity.x - player.x;
        const dy = entity.y - player.y;
        const distanceSquared = dx * dx + dy * dy;

        // Render distance thresholds (squared for performance)
        const renderDistanceSquared = 1000 * 1000; // 1000 pixels

        return distanceSquared < renderDistanceSquared;
    }

    /**
     * Apply camera shake effect
     * @param {number} shakeX - Horizontal shake offset
     * @param {number} shakeY - Vertical shake offset
     */
    applyShake(shakeX, shakeY) {
        this.shakeX = shakeX;
        this.shakeY = shakeY;
    }

    /**
     * Apply camera transformation to context
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    applyTransform(ctx) {
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(
            -this.x + this.shakeX,
            -this.y + this.shakeY
        );
    }

    /**
     * Convert world coordinates to screen coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @returns {Object} Screen coordinates {x, y}
     */
    worldToScreen(worldX, worldY, canvasWidth, canvasHeight) {
        return {
            x: (worldX - this.x + this.shakeX) * this.zoom,
            y: (worldY - this.y + this.shakeY) * this.zoom
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @returns {Object} World coordinates {x, y}
     */
    screenToWorld(screenX, screenY, canvasWidth, canvasHeight) {
        return {
            x: screenX / this.zoom + this.x - this.shakeX,
            y: screenY / this.zoom + this.y - this.shakeY
        };
    }
}
