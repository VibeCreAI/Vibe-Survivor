/**
 * Start Screen AI Bot Animation
 * Displays the 10x10 sprite sheet animation above the VIBE SURVIVOR title
 */

class StartScreenBot {
    constructor() {
        this.spriteSheet = new Image();
        this.canvas = null;
        this.ctx = null;
        this.currentFrame = 0;
        this.totalFrames = 100; // 10 columns × 10 rows
        this.cols = 10;
        this.rows = 10;
        this.frameWidth = 320; // Each frame is 320x320px
        this.frameHeight = 320;
        this.displaySizePercent = 0.12; // Size as percentage of modal width (12%)
        this.minDisplaySize = 60; // Minimum size in pixels
        this.maxDisplaySize = 150; // Maximum size in pixels
        this.displaySize = 100; // Will be calculated based on modal width
        this.animationSpeed = 60; // ms per frame
        this.isLoaded = false;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.container = null;

        this.init();
    }

    init() {
        this.loadSpriteSheet();
        this.createContainer();
        this.setupCanvas();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'start-screen-bot-container';
        this.container.style.cssText = `
            position: fixed;
            left: 50%;
            transform: translateX(-50%);
            width: ${this.displaySize}px;
            height: ${this.displaySize}px;
            opacity: 0;
            z-index: 10001;
            pointer-events: none;
        `;
    }

    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.displaySize;
        this.canvas.height = this.displaySize;
        this.canvas.style.cssText = `
            width: 100%;
            height: 100%;
            image-rendering: pixelated;
        `;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.container.appendChild(this.canvas);
    }

    loadSpriteSheet() {
        this.spriteSheet.onload = () => {
            console.log('Start screen bot sprite loaded successfully');
            this.isLoaded = true;
            this.startAnimation();
            this.show();
        };
        this.spriteSheet.onerror = () => {
            console.error('Failed to load start screen bot sprite');
        };
        this.spriteSheet.src = 'images/AI BOT.png';
        console.log('Loading start screen bot sprite from:', this.spriteSheet.src);
    }

    startAnimation() {
        if (!this.isLoaded) return;

        const animate = (currentTime) => {
            if (currentTime - this.lastFrameTime >= this.animationSpeed) {
                this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
                this.drawCurrentFrame();
                this.lastFrameTime = currentTime;
            }
            this.animationFrameId = requestAnimationFrame(animate);
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    drawCurrentFrame() {
        if (!this.ctx || !this.spriteSheet || !this.isLoaded) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate frame position in sprite sheet (10x10 grid) - use Math.floor to prevent sub-pixel bleeding
        const col = this.currentFrame % this.cols;
        const row = Math.floor(this.currentFrame / this.cols);

        // Aggressive inset to prevent bleeding on high-DPI mobile screens
        // Start 2px inside frame boundary and reduce size by 4px total (2px each side)
        const inset = 2;
        const sx = Math.floor(col * this.frameWidth) + inset;
        const sy = Math.floor(row * this.frameHeight) + inset;
        const safeFrameWidth = this.frameWidth - (inset * 2);
        const safeFrameHeight = this.frameHeight - (inset * 2);

        // Draw the frame
        this.ctx.drawImage(
            this.spriteSheet,
            sx,
            sy,
            safeFrameWidth,
            safeFrameHeight,
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    show() {
        if (this.container) {
            this.container.style.opacity = '1';
        }
    }

    hide() {
        if (this.container) {
            this.container.style.opacity = '0';
        }
    }

    attachToStartScreen() {
        // Find the start overlay
        const startOverlay = document.getElementById('survivor-start-overlay');
        console.log('Start overlay found:', !!startOverlay);
        if (startOverlay && this.container) {
            // Attach directly to body so it won't be clipped by any parent containers
            document.body.appendChild(this.container);
            console.log('Bot attached to body (fixed position)');

            // Store reference to title container for position updates
            this.titleContainer = startOverlay.querySelector('.survivor-title');

            // Calculate initial size based on modal width
            this.updateSize();

            // Update position with multiple attempts to ensure layout is settled
            const updateWithRetry = (attempts = 0) => {
                this.updatePosition();

                // Retry position calculation a few times to handle layout settling
                if (attempts < 5) {
                    requestAnimationFrame(() => updateWithRetry(attempts + 1));
                }
            };

            // Start position updates after a brief delay
            setTimeout(() => updateWithRetry(), 100);

            // Watch for start overlay visibility changes
            this.observeStartOverlay(startOverlay);

            // Watch for title container size/position changes
            if (this.titleContainer) {
                const resizeObserver = new ResizeObserver(() => {
                    this.updatePosition();
                });
                resizeObserver.observe(this.titleContainer);
            }

            // Update position on window resize
            window.addEventListener('resize', () => this.updatePosition());
        }
    }

    calculateDisplaySize() {
        // Get the modal content width to scale relative to it
        const modal = document.querySelector('.vibe-survivor-content');
        if (!modal) return this.displaySize;

        const modalWidth = modal.offsetWidth;

        // Calculate size as percentage of modal width
        let newSize = Math.floor(modalWidth * this.displaySizePercent);

        // Clamp between min and max
        newSize = Math.max(this.minDisplaySize, Math.min(this.maxDisplaySize, newSize));

        return newSize;
    }

    updateSize() {
        const newSize = this.calculateDisplaySize();

        if (newSize !== this.displaySize) {
            this.displaySize = newSize;

            // Update container size
            if (this.container) {
                this.container.style.width = `${this.displaySize}px`;
                this.container.style.height = `${this.displaySize}px`;
            }

            // Update canvas size
            if (this.canvas) {
                this.canvas.width = this.displaySize;
                this.canvas.height = this.displaySize;

                // Redraw current frame at new size
                if (this.isLoaded) {
                    this.drawCurrentFrame();
                }
            }
        }
    }

    updatePosition() {
        if (!this.titleContainer || !this.container) return;

        // Update size first
        this.updateSize();

        // Get the title container's position
        const rect = this.titleContainer.getBoundingClientRect();

        // Safety check - ensure title has valid dimensions
        if (rect.height === 0 || rect.top === 0) {
            // Layout not ready yet, skip this update
            return;
        }

        // Position bot above the title (rect.top - bot height - margin)
        const margin = 10; // 10px margin between bot and title for safety
        const botTop = rect.top - this.displaySize - margin;

        // Only update if position is reasonable (not negative or too far up)
        if (botTop > 0) {
            this.container.style.top = `${botTop}px`;
        }
    }

    observeStartOverlay(startOverlay) {
        // Create a MutationObserver to watch for class changes on the start overlay
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // Check if start overlay is active
                    const isActive = startOverlay.classList.contains('active');
                    if (isActive) {
                        // Update position when showing (in case layout changed)
                        this.updatePosition();
                        this.show();
                    } else {
                        this.hide();
                    }
                }
            });
        });

        // Start observing
        observer.observe(startOverlay, {
            attributes: true,
            attributeFilter: ['class']
        });

        // Check initial state
        if (startOverlay.classList.contains('active')) {
            this.updatePosition();
            this.show();
        } else {
            this.hide();
        }
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Start screen bot script loaded');

    // Function to try attaching the bot
    const tryAttach = () => {
        const startOverlay = document.getElementById('survivor-start-overlay');
        if (startOverlay) {
            console.log('Found start overlay, creating bot');
            window.startScreenBot = new StartScreenBot();
            window.startScreenBot.attachToStartScreen();
        } else {
            console.log('Start overlay not found yet, retrying...');
            setTimeout(tryAttach, 200);
        }
    };

    // Start trying after a short delay
    setTimeout(tryAttach, 100);
});