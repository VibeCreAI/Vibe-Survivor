// Input management system for Vibe Survivor
// Extracted from vibe-survivor-game.js during Phase 5 refactoring

/**
 * Manages all input handling: keyboard, mouse, and touch
 */
export class InputManager {
    constructor() {
        // Key state tracking
        this.keys = {};

        // Touch controls state
        this.touchControls = {
            joystick: {
                active: false,
                startX: 0,
                startY: 0,
                moveX: 0,
                moveY: 0,
                floating: true,
                visible: false,
                centerX: 0,
                centerY: 0,
                touchId: null
            },
            dashButton: {
                pressed: false,
                position: 'right'
            }
        };

        // Menu navigation state
        this.menuNavigationState = {
            active: false,
            selectedIndex: 0,
            menuType: null,
            menuButtons: [],
            keyboardUsed: false
        };

        // Settings
        this.settings = null;

        // Mobile detection
        this.isMobile = this.detectMobile();

        // Bound event handlers (for cleanup)
        this.boundHandlers = {
            keydown: null,
            keyup: null,
            resize: null,
            touchstart: null,
            touchmove: null,
            touchend: null,
            touchcancel: null
        };
    }

    /**
     * Detect if device is mobile
     * @returns {boolean}
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Initialize input system
     * @param {Object} game - Reference to game instance
     */
    initialize(game) {
        this.game = game;
        this.loadSettings();
        this.setupKeyboardInput();
        this.setupWindowResize();

        if (this.isMobile) {
            this.setupTouchControls();
        }
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('vibeSurvivorSettings');
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
                if (this.settings.dashButtonPosition) {
                    this.touchControls.dashButton.position = this.settings.dashButtonPosition;
                }
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }

        if (!this.settings) {
            this.settings = {
                dashButtonPosition: 'right'
            };
        }
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('vibeSurvivorSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    /**
     * Toggle dash button position
     */
    toggleDashButtonPosition() {
        const newPosition = this.touchControls.dashButton.position === 'right' ? 'left' : 'right';
        this.touchControls.dashButton.position = newPosition;
        this.settings.dashButtonPosition = newPosition;
        this.saveSettings();

        // Update dash button styling if it exists
        const dashButton = document.querySelector('.dash-button');
        if (dashButton) {
            dashButton.classList.remove('left', 'right');
            dashButton.classList.add(newPosition);
        }
    }

    /**
     * Setup keyboard input handlers
     */
    setupKeyboardInput() {
        this.boundHandlers.keydown = this.handleKeyDown.bind(this);
        this.boundHandlers.keyup = this.handleKeyUp.bind(this);

        window.addEventListener('keydown', this.boundHandlers.keydown);
        window.addEventListener('keyup', this.boundHandlers.keyup);
    }

    /**
     * Setup window resize handler
     */
    setupWindowResize() {
        this.boundHandlers.resize = () => {
            if (this.game && this.game.resizeCanvas) {
                this.game.resizeCanvas();
            }
        };
        window.addEventListener('resize', this.boundHandlers.resize);
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
        if (!this.game) return;

        const key = e.key.toLowerCase();

        // Menu navigation - delegate to game's existing complex navigation system
        // The game handles menu navigation with special features like scrolling and tab cycling
        // InputManager just provides the input state, game handles the logic

        // Escape key handling
        // Note: ESC key for help/pause/menu navigation is handled by the main keydown handler
        // in vibe-survivor-game.js which has more complex logic for menu states
        if (key === 'escape') {
            e.preventDefault();
            // Don't handle ESC here - let the main handler deal with it
            return;
        }

        // Game controls (only when game is running and not paused)
        if (this.game.gameRunning && !this.game.isPaused && !this.game.playerDead) {
            this.keys[key] = true;

            // Prevent spacebar from scrolling
            if (key === ' ') {
                e.preventDefault();
            }
        }
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} e
     */
    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        this.keys[key] = false;
    }

    // NOTE: Menu navigation methods removed - game handles complex menu navigation
    // with scrolling, tab cycling, and special per-menu behaviors

    /**
     * Reset menu navigation
     */
    resetMenuNavigation() {
        const oldIndex = this.menuNavigationState.selectedIndex;
        if (this.menuNavigationState.menuButtons[oldIndex]) {
            this.menuNavigationState.menuButtons[oldIndex].classList.remove('keyboard-selected');
        }

        this.menuNavigationState.active = false;
        this.menuNavigationState.selectedIndex = 0;
        this.menuNavigationState.menuType = null;
        this.menuNavigationState.menuButtons = [];
        this.menuNavigationState.keyboardUsed = false;
    }

    /**
     * Setup touch controls (joystick and dash button)
     */
    setupTouchControls() {
        const canvas = this.game.canvas;
        if (!canvas) return;

        // Bind handlers
        this.boundHandlers.touchstart = this.handleTouchStart.bind(this);
        this.boundHandlers.touchmove = this.handleTouchMove.bind(this);
        this.boundHandlers.touchend = this.handleTouchEnd.bind(this);
        this.boundHandlers.touchcancel = this.handleTouchCancel.bind(this);

        canvas.addEventListener('touchstart', this.boundHandlers.touchstart, { passive: false });
        canvas.addEventListener('touchmove', this.boundHandlers.touchmove, { passive: false });
        canvas.addEventListener('touchend', this.boundHandlers.touchend, { passive: false });
        canvas.addEventListener('touchcancel', this.boundHandlers.touchcancel, { passive: false });
    }

    /**
     * Get touch position relative to canvas
     * @param {Touch} touch
     * @returns {Object} {x, y}
     */
    getTouchPos(touch) {
        const rect = this.game.canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    /**
     * Check if touch is near dash button
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    isTouchNearDashButton(x, y) {
        const dashButton = document.querySelector('.dash-button');
        if (!dashButton) return false;

        const rect = dashButton.getBoundingClientRect();
        const canvasRect = this.game.canvas.getBoundingClientRect();
        const relX = x + canvasRect.left;
        const relY = y + canvasRect.top;
        const safeZone = 80;

        return relX >= rect.left - safeZone && relX <= rect.right + safeZone &&
               relY >= rect.top - safeZone && relY <= rect.bottom + safeZone;
    }

    /**
     * Handle touch start
     * @param {TouchEvent} e
     */
    handleTouchStart(e) {
        if (!this.game.gameRunning || this.game.isPaused) return;

        e.preventDefault();

        for (let touch of e.changedTouches) {
            const pos = this.getTouchPos(touch);

            // Check if touch is near dash button
            if (this.isTouchNearDashButton(pos.x, pos.y)) {
                continue;
            }

            // Start joystick if not active
            if (!this.touchControls.joystick.active) {
                this.touchControls.joystick.active = true;
                this.touchControls.joystick.visible = true;
                this.touchControls.joystick.touchId = touch.identifier;
                this.touchControls.joystick.centerX = pos.x;
                this.touchControls.joystick.centerY = pos.y;
                this.touchControls.joystick.startX = pos.x;
                this.touchControls.joystick.startY = pos.y;
                this.touchControls.joystick.moveX = 0;
                this.touchControls.joystick.moveY = 0;
            }
        }
    }

    /**
     * Handle touch move
     * @param {TouchEvent} e
     */
    handleTouchMove(e) {
        if (!this.game.gameRunning || this.game.isPaused) return;

        e.preventDefault();

        for (let touch of e.changedTouches) {
            if (this.touchControls.joystick.active && touch.identifier === this.touchControls.joystick.touchId) {
                const pos = this.getTouchPos(touch);
                const dx = pos.x - this.touchControls.joystick.centerX;
                const dy = pos.y - this.touchControls.joystick.centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 50;

                if (distance > maxDistance) {
                    this.touchControls.joystick.moveX = (dx / distance) * maxDistance;
                    this.touchControls.joystick.moveY = (dy / distance) * maxDistance;
                } else {
                    this.touchControls.joystick.moveX = dx;
                    this.touchControls.joystick.moveY = dy;
                }
            }
        }
    }

    /**
     * Handle touch end
     * @param {TouchEvent} e
     */
    handleTouchEnd(e) {
        this.handleTouchEndOrCancel(e);
    }

    /**
     * Handle touch cancel
     * @param {TouchEvent} e
     */
    handleTouchCancel(e) {
        this.handleTouchEndOrCancel(e);
    }

    /**
     * Handle touch end or cancel
     * @param {TouchEvent} e
     */
    handleTouchEndOrCancel(e) {
        for (let touch of e.changedTouches) {
            if (this.touchControls.joystick.active && touch.identifier === this.touchControls.joystick.touchId) {
                this.touchControls.joystick.active = false;
                this.touchControls.joystick.visible = false;
                this.touchControls.joystick.moveX = 0;
                this.touchControls.joystick.moveY = 0;
                this.touchControls.joystick.touchId = null;
            }
        }
    }

    /**
     * Reset touch controls (called on game reset)
     */
    resetTouchControls() {
        if (this.touchControls.joystick) {
            this.touchControls.joystick.active = false;
            this.touchControls.joystick.moveX = 0;
            this.touchControls.joystick.moveY = 0;
            this.touchControls.joystick.visible = false;
            this.touchControls.joystick.touchId = null;
        }
    }

    /**
     * Get movement input (keyboard or touch)
     * @returns {Object} {x, y} normalized movement vector
     */
    getMovementInput() {
        let moveX = 0;
        let moveY = 0;

        // Touch input (mobile)
        if (this.touchControls.joystick.active) {
            const maxDistance = 50;
            moveX = this.touchControls.joystick.moveX / maxDistance;
            moveY = this.touchControls.joystick.moveY / maxDistance;
        }
        // Keyboard input (desktop)
        else {
            if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
            if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
            if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
            if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
        }

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }

        return { x: moveX, y: moveY };
    }

    /**
     * Check if dash is requested
     * @returns {boolean}
     */
    isDashRequested() {
        return this.keys[' '] || this.touchControls.dashButton.pressed;
    }

    /**
     * Cleanup event listeners
     */
    cleanup() {
        if (this.boundHandlers.keydown) {
            window.removeEventListener('keydown', this.boundHandlers.keydown);
        }
        if (this.boundHandlers.keyup) {
            window.removeEventListener('keyup', this.boundHandlers.keyup);
        }
        if (this.boundHandlers.resize) {
            window.removeEventListener('resize', this.boundHandlers.resize);
        }

        if (this.game && this.game.canvas) {
            if (this.boundHandlers.touchstart) {
                this.game.canvas.removeEventListener('touchstart', this.boundHandlers.touchstart);
            }
            if (this.boundHandlers.touchmove) {
                this.game.canvas.removeEventListener('touchmove', this.boundHandlers.touchmove);
            }
            if (this.boundHandlers.touchend) {
                this.game.canvas.removeEventListener('touchend', this.boundHandlers.touchend);
            }
            if (this.boundHandlers.touchcancel) {
                this.game.canvas.removeEventListener('touchcancel', this.boundHandlers.touchcancel);
            }
        }
    }
}
