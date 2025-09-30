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
        this.displaySize = 100; // Display size in pixels
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
            top: 250px;
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

        // Calculate frame position in sprite sheet (10x10 grid)
        const col = this.currentFrame % this.cols;
        const row = Math.floor(this.currentFrame / this.cols);

        // Draw the frame
        this.ctx.drawImage(
            this.spriteSheet,
            col * this.frameWidth,
            row * this.frameHeight,
            this.frameWidth,
            this.frameHeight,
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

            // Watch for start overlay visibility changes
            this.observeStartOverlay(startOverlay);
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