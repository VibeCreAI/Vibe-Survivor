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
        this.hasFadedIn = false;
        this.initialFadeTimeout = null;
        this.anchorElement = null;
        this.inlineMode = false;

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
            transition: none;
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
            // Don't show immediately - wait for loading screen to finish
            // this.show();
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
        if (!this.container) return;

        // First appearance should fade in
        if (!this.hasFadedIn) {
            // Cancel pending timers to avoid multiple transitions
            if (this.initialFadeTimeout) {
                clearTimeout(this.initialFadeTimeout);
                this.initialFadeTimeout = null;
            }

            this.container.style.transition = 'opacity 0.6s ease-in';

            // Ensure opacity starts at 0 before triggering transition
            this.container.style.opacity = '0';

            requestAnimationFrame(() => {
                this.container.style.opacity = '1';

                // After fade completes, lock state and remove transition for snappy toggles
                this.initialFadeTimeout = setTimeout(() => {
                    this.hasFadedIn = true;
                    this.container.style.transition = 'none';
                    this.initialFadeTimeout = null;
                }, 600);
            });
        } else {
            // Subsequent shows are immediate with no fade
            this.container.style.transition = 'none';
            this.container.style.opacity = '1';
        }
    }

    hide() {
        if (!this.container) return;

        // Hide instantly for menu interactions
        if (this.initialFadeTimeout) {
            clearTimeout(this.initialFadeTimeout);
            this.initialFadeTimeout = null;
        }
        this.container.style.transition = 'none';
        this.container.style.opacity = '0';
    }

    attachToStartScreen() {
        // Find the start overlay
        const startOverlay = document.getElementById('survivor-start-overlay');
        console.log('Start overlay found:', !!startOverlay);
        if (startOverlay && this.container) {
            // Ensure bot starts hidden
            this.hide();

            // Prefer to place inside the start title container so it sits above the logo
            const titleContainer = startOverlay.querySelector('.survivor-title');
            const vibeLogo = startOverlay.querySelector('#vibe-survivor-logo');
            if (titleContainer) {
                this.container.style.position = 'relative';
                this.container.style.left = '0';
                this.container.style.transform = 'none';
                this.container.style.margin = '0 auto 12px';
                this.container.style.zIndex = '2';
                this.inlineMode = true;
                if (vibeLogo && vibeLogo.parentNode === titleContainer) {
                    titleContainer.insertBefore(this.container, vibeLogo);
                } else {
                    titleContainer.insertBefore(this.container, titleContainer.firstChild);
                }
            } else {
                // Fallback: attach to body as before
                document.body.appendChild(this.container);
                this.inlineMode = false;
            }
            console.log('Bot attached', this.inlineMode ? 'inside title container' : 'to body');

            // Store reference to title container for position updates
            this.titleContainer = titleContainer || startOverlay.querySelector('.survivor-title');
            this.anchorElement = startOverlay.querySelector('.chroma-awards-block') || this.titleContainer;

            // Calculate initial size based on modal width
            this.updateSize();

            // Don't auto-update position during init - title is hidden (display: none)
            // The game will call updatePosition() after making title visible
            // updateWithRetry() removed - position will be set when game calls updatePosition()

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
        if (!this.container) return;

        // Update size first
        this.updateSize();

        // If we're inline inside the title container, no need to manually position
        if (this.inlineMode) {
            return;
        }

        // Use Chroma block as anchor if present, otherwise fall back to title
        const anchor = this.anchorElement || this.titleContainer;
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();

        // Safety check - ensure title has valid dimensions
        if (rect.height === 0 || rect.top === 0) {
            // Layout not ready yet, skip this update
            return;
        }

        // Position bot just below the anchor
        const margin = 12; // spacing between Chroma block and bot
        const botTop = rect.bottom + margin;

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
                        // Don't auto-show - let the game control when to show via show() method
                        // this.show();
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

        // Check initial state - but don't show until loading finishes
        if (startOverlay.classList.contains('active')) {
            this.updatePosition();
            // Don't show yet - wait for game to call show() after background loads
            // this.hide(); // Already hidden via opacity: 0
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
