/**
 * Touch Controls UI System
 * Manages visual touch control elements (virtual joystick, touch buttons)
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

/**
 * TouchControlsUI - Manages touch control visual elements
 */
export class TouchControlsUI {
    constructor() {
        this.elements = {
            joystick: null,
            joystickHandle: null
        };
        this.visible = false;
    }

    /**
     * Initializes touch controls by finding DOM elements
     */
    init() {
        this.elements.joystick = document.getElementById('virtual-joystick');
        this.elements.joystickHandle = document.getElementById('joystick-handle');

        if (!this.elements.joystick || !this.elements.joystickHandle) {
            console.warn('Touch control elements not found');
            return false;
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
}
