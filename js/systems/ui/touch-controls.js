/**
 * Touch Controls UI System
 * Manages visual touch control elements (virtual joystick, touch buttons)
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 * Phase 12c.12: Integrated dash button functionality
 */

/**
 * TouchControlsUI - Manages touch control visual elements
 */
export class TouchControlsUI {
    constructor() {
        this.elements = {
            joystick: null,
            joystickHandle: null,
            dashButton: null,
            mobileControls: null
        };
        this.visible = false;
        this.isMobile = false;

        // Reference to InputManager's touchControls for state management
        this.touchControlsState = null;
        this.getTranslation = null;
    }

    /**
     * Initializes touch controls by finding DOM elements
     * @param {Object} touchControlsState - Reference to InputManager's touchControls
     * @param {boolean} isMobile - Whether device is mobile
     */
    init(touchControlsState = null, isMobile = false) {
        this.touchControlsState = touchControlsState;
        this.isMobile = isMobile;

        // Get all touch control elements
        this.elements.joystick = document.getElementById('virtual-joystick');
        this.elements.joystickHandle = document.getElementById('joystick-handle');
        this.elements.dashButton = document.getElementById('mobile-dash-btn');
        this.elements.mobileControls = document.getElementById('mobile-controls');

        if (!this.elements.joystick || !this.elements.joystickHandle) {
            console.warn('Touch control elements not found');
            return false;
        }

        // Show mobile controls if on mobile device
        if (this.elements.mobileControls && this.isMobile) {
            this.elements.mobileControls.style.display = 'block';
        }

        // Hide joystick by default - it will show only when canvas is touched
        if (this.elements.joystick) {
            this.elements.joystick.style.display = 'none';
        }

        // Setup dash button if available
        if (this.elements.dashButton) {
            this.setupDashButton();
            this.showDashButton();
        }

        return true;
    }

    /**
     * Shows touch controls (typically on mobile)
     */
    show() {
        if (this.elements.joystick) {
            this.elements.joystick.style.display = 'block';
            this.visible = true;
        }
    }

    /**
     * Hides touch controls
     */
    hide() {
        if (this.elements.joystick) {
            this.elements.joystick.style.display = 'none';
            this.visible = false;
        }
    }

    /**
     * Shows virtual joystick only
     */
    showJoystick() {
        if (this.elements.joystick) {
            this.elements.joystick.style.display = 'block';
        }
    }

    /**
     * Hides virtual joystick only
     */
    hideJoystick() {
        if (this.elements.joystick) {
            this.elements.joystick.style.display = 'none';
        }
    }

    /**
     * Positions the joystick at specific screen coordinates
     * @param {number} x - X position on canvas
     * @param {number} y - Y position on canvas
     */
    positionJoystick(x, y) {
        if (!this.elements.joystick) return;

        // Position joystick at touch location (centered on touch point)
        this.elements.joystick.style.left = `${x}px`;
        this.elements.joystick.style.top = `${y}px`;
    }

    /**
     * Updates joystick handle position
     * @param {number} x - X position (-1 to 1, or null to center)
     * @param {number} y - Y position (-1 to 1, or null to center)
     */
    updateJoystick(x, y) {
        if (!this.elements.joystickHandle) return;

        if (x === null || y === null) {
            // Center position (no touch)
            this.elements.joystickHandle.style.left = '50%';
            this.elements.joystickHandle.style.top = '50%';
            this.elements.joystickHandle.classList.remove('moving');
            this.elements.joystick.classList.remove('active');
        } else {
            // Active position
            const maxOffset = 40; // Maximum pixel offset from center
            const offsetX = x * maxOffset;
            const offsetY = y * maxOffset;

            this.elements.joystickHandle.style.left = `calc(50% + ${offsetX}px)`;
            this.elements.joystickHandle.style.top = `calc(50% + ${offsetY}px)`;
            this.elements.joystickHandle.classList.add('moving');
            this.elements.joystick.classList.add('active');
        }
    }

    /**
     * Sets joystick active state
     * @param {boolean} active - Whether joystick is being used
     */
    setActive(active) {
        if (!this.elements.joystick) return;

        if (active) {
            this.elements.joystick.classList.add('active');
        } else {
            this.elements.joystick.classList.remove('active');
            this.updateJoystick(null, null); // Center the handle
        }
    }

    /**
     * Checks if touch controls should be shown (mobile device detection)
     * @returns {boolean}
     */
    static shouldShowTouchControls() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
    }

    /**
     * Auto-detects mobile and shows/hides controls accordingly
     */
    autoDetect() {
        if (TouchControlsUI.shouldShowTouchControls()) {
            this.show();
        } else {
            this.hide();
        }
    }

    /**
     * Resets touch controls to initial state
     */
    reset() {
        this.updateJoystick(null, null);
        this.setActive(false);
    }

    /**
     * Sets translation function for dash button text
     */
    setTranslationFunction(getTranslation) {
        this.getTranslation = getTranslation;
        this.updateLocalization();
    }

    /**
     * Sets up dash button event listeners
     * Phase 12c.12: Moved from main game file
     */
    setupDashButton() {
        if (!this.elements.dashButton || !this.touchControlsState?.dashButton) return;

        const dashBtn = this.elements.dashButton;

        // Click events for desktop
        dashBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.touchControlsState.dashButton.pressed = true;
            dashBtn.classList.add('dash-pressed');
        });

        const endDashClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.touchControlsState.dashButton.pressed = false;
            dashBtn.classList.remove('dash-pressed');
        };

        dashBtn.addEventListener('mouseup', endDashClick);
        dashBtn.addEventListener('mouseleave', endDashClick);

        // Touch events for mobile
        dashBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling to modal
            this.touchControlsState.dashButton.pressed = true;
            // Add visual flash effect for mobile
            dashBtn.classList.add('dash-pressed');
        }, { passive: false });

        const endDashTouch = (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent event from bubbling to modal
            this.touchControlsState.dashButton.pressed = false;
            // Remove visual flash effect for mobile
            dashBtn.classList.remove('dash-pressed');
        };

        dashBtn.addEventListener('touchend', endDashTouch, { passive: false });
        dashBtn.addEventListener('touchcancel', endDashTouch, { passive: false });

        this.updateLocalization();
    }

    /**
     * Sets dash button position (left or right)
     * Phase 12c.12: Moved from main game file (ensureDashButtonInBounds)
     * @param {string} position - 'left' or 'right'
     */
    setDashButtonPosition(position = 'right') {
        if (!this.elements.dashButton) return;

        const dashBtn = this.elements.dashButton;
        dashBtn.style.bottom = '20px';
        dashBtn.classList.remove('mobile-dash-left', 'mobile-dash-right');

        const positionClass = position === 'left' ? 'mobile-dash-left' : 'mobile-dash-right';
        dashBtn.classList.add(positionClass);
    }

    /**
     * Shows dash button
     */
    showDashButton() {
        if (this.elements.dashButton) {
            this.elements.dashButton.style.display = 'flex';
        }
    }

    /**
     * Hides dash button
     */
    hideDashButton() {
        if (this.elements.dashButton) {
            this.elements.dashButton.style.display = 'none';
        }
    }

    /**
     * Updates localized text for dash button
     */
    updateLocalization() {
        if (!this.getTranslation || !this.elements.dashButton) return;

        const label = `${this.getTranslation('dash').toUpperCase()} ${this.getTranslation('button', 'ui').toUpperCase()}`;
        const span = this.elements.dashButton.querySelector('span');
        if (span) {
            span.textContent = label;
        }
    }
}
