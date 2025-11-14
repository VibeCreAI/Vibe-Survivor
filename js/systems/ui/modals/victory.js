/**
 * Victory Modal - Option B: Proper Encapsulation
 * The modal owns all its behavior including keyboard handling, scrolling, and button navigation
 * Phase 12c.7 - Refactored from inline implementation
 */

export class VictoryModal {
    constructor() {
        this.element = null;
        this.contentElement = null;
        this.scrollContentElement = null;

        // Button references
        this.continueButton = null;
        this.exitButton = null;

        // Keyboard navigation state
        this.keyboardHandler = null;
        this.selectedIndex = 0;
        this.navigableElements = [];
        this.keyboardUsed = false;
        this.buttonNavigationMode = false; // Track if we're navigating buttons vs scrolling

        // Callbacks
        this.onContinueCallback = null;
        this.onExitCallback = null;

        // Overlay lock callbacks
        this.incrementOverlayLockCallback = null;
        this.decrementOverlayLockCallback = null;

        // Game state callbacks
        this.getTranslations = null;
        this.getTranslation = null;
        this.generateWeaponsSection = null;
        this.generatePassivesSection = null;
        this.generatePlayerStatsSection = null;

        // Touch scroll handler
        this.touchScrollHandler = null;

        // Style element reference for cleanup
        this.styleElement = null;

        // State
        this.isOpen = false;
    }

    /**
     * Set game state callbacks
     */
    setGameStateCallbacks(getTranslations, getTranslation, generateWeaponsSection, generatePassivesSection, generatePlayerStatsSection) {
        this.getTranslations = getTranslations;
        this.getTranslation = getTranslation;
        this.generateWeaponsSection = generateWeaponsSection;
        this.generatePassivesSection = generatePassivesSection;
        this.generatePlayerStatsSection = generatePlayerStatsSection;
    }

    /**
     * Set overlay lock callbacks
     */
    setOverlayLockCallbacks(incrementFn, decrementFn) {
        this.incrementOverlayLockCallback = incrementFn;
        this.decrementOverlayLockCallback = decrementFn;
    }

    /**
     * Set callback functions
     */
    onContinue(callback) {
        this.onContinueCallback = callback;
    }

    onExit(callback) {
        this.onExitCallback = callback;
    }

    /**
     * Show the victory modal with final stats
     */
    show(finalStats, bossesKilled, bossLevel) {
        // Create the victory overlay dynamically
        this.createVictoryOverlay(finalStats, bossesKilled, bossLevel);

        this.isOpen = true;

        // Call lifecycle hook
        this.onShow();
    }

    /**
     * Hide the victory modal
     */
    hide() {
        if (!this.element) return;

        this.isOpen = false;

        // Call lifecycle hook
        this.onHide();

        // Remove the overlay
        if (this.element && this.element.parentNode) {
            this.element.remove();
        }

        // Remove styles
        if (this.styleElement && this.styleElement.parentNode) {
            this.styleElement.remove();
        }

        // Clear references
        this.element = null;
        this.contentElement = null;
        this.scrollContentElement = null;
        this.continueButton = null;
        this.exitButton = null;
        this.styleElement = null;
    }

    /**
     * Create the victory overlay HTML
     */
    createVictoryOverlay(finalStats, bossesKilled, bossLevel) {
        // Create overlay element
        this.element = document.createElement('div');
        this.element.id = 'survivor-victory-overlay';
        this.element.style.cssText = `
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: transparent !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 99999 !important;
            backdrop-filter: blur(5px) !important;
        `;

        const t = this.getTranslations();
        const weaponsSection = this.generateWeaponsSection();
        const passivesSection = this.generatePassivesSection();
        const playerStatsSection = this.generatePlayerStatsSection();
        const bossBanner = bossesKilled === 0
            ? this.getTranslation('bossDefeatedBanner')
            : this.getTranslation('bossLevelDefeated').replace('{level}', bossLevel);
        const nextBossText = bossesKilled >= 1
            ? this.getTranslation('nextBoss').replace('{level}', bossLevel + 1)
            : '';

        // Create victory content with neon theme
        this.element.innerHTML = `
            <div class="victory-content" style="
                background: linear-gradient(135deg, #0a1a0a, #1a2a0a) !important;
                border: 2px solid #00ff00 !important;
                border-radius: 15px !important;
                padding: 30px !important;
                text-align: center !important;
                color: white !important;
                max-width: 550px !important;
                max-height: 80vh !important;
                box-shadow: 0 0 30px rgba(0, 255, 0, 0.5) !important;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif !important;
                display: flex !important;
                flex-direction: column !important;
            ">
                <div style="
                    color: #00ff00 !important;
                    font-size: 36px !important;
                    font-weight: bold !important;
                    margin-bottom: 20px !important;
                    text-shadow: 0 0 15px rgba(0, 255, 0, 0.8) !important;
                ">${this.getTranslation('victoryTitle')}</div>

                <div style="
                    color: #ffff00 !important;
                    font-size: 18px !important;
                    font-weight: bold !important;
                    margin-bottom: 20px !important;
                    text-shadow: 0 0 10px rgba(255, 255, 0, 0.6) !important;
                ">${bossBanner}</div>

                <div class="victory-scroll-content" tabindex="0" style="
                    overflow-y: auto !important;
                    max-height: calc(80vh - 220px) !important;
                    padding-right: 10px !important;
                    margin-bottom: 20px !important;
                    -webkit-overflow-scrolling: touch !important;
                    text-align: left !important;
                    outline: none !important;
                ">
                    <div style="margin-bottom: 20px !important;">
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin: 8px 0;
                            font-size: 18px;
                            color: #00ffff;
                        ">
                            <span>${t.level}</span>
                            <span style="color: #00ff00; font-weight: bold;">${finalStats.level}</span>
                        </div>
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin: 8px 0;
                            font-size: 18px;
                            color: #00ffff;
                        ">
                            <span>${t.time}</span>
                            <span style="color: #00ff00; font-weight: bold;">${finalStats.timeText}</span>
                        </div>
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin: 8px 0;
                            font-size: 18px;
                            color: #00ffff;
                        ">
                            <span>${t.enemies}</span>
                            <span style="color: #00ff00; font-weight: bold;">${finalStats.enemiesKilled}</span>
                        </div>
                        ${bossesKilled >= 1 ? `
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            margin: 8px 0;
                            font-size: 18px;
                            color: #00ffff;
                        ">
                            <span>${t.bossesDefeated}</span>
                            <span style="color: #ff00ff; font-weight: bold;">${bossesKilled}</span>
                        </div>
                        ` : ''}
                        ${nextBossText ? `
                        <div style="
                            margin: 15px 0;
                            font-size: 16px;
                            color: #ffff00;
                            text-align: center;
                            font-weight: bold;
                            text-shadow: 0 0 8px rgba(255, 255, 0, 0.8);
                        ">
                            ${nextBossText}
                        </div>
                        ` : ''}
                    </div>

                    ${weaponsSection}
                    ${passivesSection}
                    ${playerStatsSection}
                </div>

                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: auto;">
                    <button id="victory-continue-btn" style="
                        background: transparent !important;
                        border: 2px solid #ff00ff !important;
                        color: #ff00ff !important;
                        padding: 12px 25px !important;
                        font-size: 16px !important;
                        border-radius: 25px !important;
                        font-weight: bold !important;
                        transition: all 0.3s ease !important;
                        cursor: pointer !important;
                        touch-action: manipulation !important;
                        min-width: 44px !important;
                        min-height: 44px !important;
                        user-select: none !important;
                        -webkit-user-select: none !important;
                        -webkit-tap-highlight-color: transparent !important;
                    ">${this.getTranslation('continueButton')}</button>

                    <button id="victory-exit-btn" style="
                        background: transparent !important;
                        border: 2px solid #ffff00 !important;
                        color: #ffff00 !important;
                        padding: 12px 25px !important;
                        font-size: 16px !important;
                        border-radius: 25px !important;
                        font-weight: bold !important;
                        transition: all 0.3s ease !important;
                        cursor: pointer !important;
                        touch-action: manipulation !important;
                        min-width: 44px !important;
                        min-height: 44px !important;
                        user-select: none !important;
                        -webkit-user-select: none !important;
                        -webkit-tap-highlight-color: transparent !important;
                    ">${t.exit}</button>
                </div>
            </div>
        `;

        // Add hover effects
        this.styleElement = document.createElement('style');
        this.styleElement.textContent = `
            #victory-continue-btn:hover {
                background: rgba(255, 0, 255, 0.1) !important;
                box-shadow: 0 0 15px rgba(255, 0, 255, 0.5) !important;
            }
            #victory-exit-btn:hover {
                background: rgba(255, 255, 0, 0.1) !important;
                box-shadow: 0 0 15px rgba(255, 255, 0, 0.5) !important;
            }
            .victory-menu-selected {
                outline: 2px solid #00ffff;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(this.styleElement);

        // Add overlay to the game container
        let gameContainer = document.getElementById('vibe-survivor-container');
        if (!gameContainer) {
            gameContainer = document.getElementById('vibe-survivor-modal');
        }
        if (!gameContainer) {
            gameContainer = document.getElementById('game-screen');
        }
        if (!gameContainer) {
            gameContainer = document.body; // Fallback to body
        }

        if (gameContainer) {
            gameContainer.appendChild(this.element);
        } else {
            console.error('Could not find container for victory overlay');
        }

        // Get references to elements
        this.contentElement = this.element.querySelector('.victory-content');
        this.scrollContentElement = this.element.querySelector('.victory-scroll-content');
        this.continueButton = document.getElementById('victory-continue-btn');
        this.exitButton = document.getElementById('victory-exit-btn');

        // Set up button handlers
        this.setupButtonHandlers();
    }

    /**
     * Set up button click handlers
     */
    setupButtonHandlers() {
        if (this.continueButton) {
            const continueHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.onContinueCallback) {
                    this.onContinueCallback();
                }
                this.hide();
            };

            this.continueButton.addEventListener('click', continueHandler);
            this.continueButton.addEventListener('touchend', continueHandler);
        }

        if (this.exitButton) {
            const exitHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.onExitCallback) {
                    this.onExitCallback();
                }
                this.hide();
            };

            this.exitButton.addEventListener('click', exitHandler);
            this.exitButton.addEventListener('touchend', exitHandler);
        }
    }

    /**
     * Lifecycle: Called when modal is shown
     */
    onShow() {
        // Increment overlay lock
        if (this.incrementOverlayLockCallback) {
            this.incrementOverlayLockCallback();
        }

        // Set up keyboard handlers
        this.setupKeyboardHandlers();

        // Set up navigable elements
        this.navigableElements = [this.continueButton, this.exitButton].filter(Boolean);

        // Initialize selection
        this.selectedIndex = 0;
        this.keyboardUsed = false;
        this.buttonNavigationMode = false;
        this.clearButtonSelection();

        // Focus the scroll content
        if (this.scrollContentElement) {
            this.scrollContentElement.focus({ preventScroll: true });
        }

        // Enable touch scrolling
        this.enableTouchScrolling();

        // Scroll to top
        if (this.scrollContentElement) {
            this.scrollContentElement.scrollTop = 0;
        }
    }

    /**
     * Lifecycle: Called when modal is hidden
     */
    onHide() {
        // Clean up keyboard handlers
        this.cleanupKeyboardHandlers();

        // Disable touch scrolling
        this.disableTouchScrolling();

        // Reset button navigation state
        this.buttonNavigationMode = false;
        this.keyboardUsed = false;
        this.clearButtonSelection();

        // Decrement overlay lock
        if (this.decrementOverlayLockCallback) {
            this.decrementOverlayLockCallback();
        }
    }

    /**
     * Set up keyboard handlers
     */
    setupKeyboardHandlers() {
        this.keyboardHandler = (e) => {
            if (!this.isOpen) return;

            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleUpDown('up');
                    break;

                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleUpDown('down');
                    break;

                case 'arrowleft':
                case 'a':
                    // Navigate between buttons when in button mode
                    if (this.buttonNavigationMode) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.navigateButtons('left');
                    }
                    break;

                case 'arrowright':
                case 'd':
                    // Navigate between buttons when in button mode
                    if (this.buttonNavigationMode) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.navigateButtons('right');
                    }
                    break;

                case 'enter':
                case ' ':
                    if (this.buttonNavigationMode && this.keyboardUsed) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.selectCurrentButton();
                    }
                    break;

                case 'escape':
                    // Victory modal cannot be escaped - must choose continue or exit
                    e.preventDefault();
                    e.stopPropagation();
                    break;
            }
        };

        // Use capture phase to intercept events before other handlers
        document.addEventListener('keydown', this.keyboardHandler, { capture: true });
    }

    /**
     * Clean up keyboard handlers
     */
    cleanupKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
            this.keyboardHandler = null;
        }
    }

    /**
     * Handle up/down keys - scroll content or navigate to buttons
     */
    handleUpDown(direction) {
        // If in button navigation mode, navigate between scroll area and buttons
        if (this.buttonNavigationMode) {
            if (direction === 'up') {
                // Go back to scroll mode
                this.buttonNavigationMode = false;
                this.keyboardUsed = false;
                this.clearButtonSelection();

                // Scroll to bottom so user knows where they are
                if (this.scrollContentElement) {
                    this.scrollContentElement.scrollTop = this.scrollContentElement.scrollHeight;
                }
            }
            // Down does nothing when already on buttons
            return;
        }

        // Otherwise, scroll content
        this.scrollContent(direction);
    }

    /**
     * Scroll victory content or navigate to buttons
     */
    scrollContent(direction) {
        if (!this.scrollContentElement) return;

        // Check if we're at the bottom and trying to scroll down - navigate to buttons instead
        const isAtBottom = this.scrollContentElement.scrollTop + this.scrollContentElement.clientHeight >= this.scrollContentElement.scrollHeight - 5; // 5px tolerance
        const isAtTop = this.scrollContentElement.scrollTop <= 5; // 5px tolerance

        if (direction === 'down' && isAtBottom) {
            // Transition to button navigation mode
            this.buttonNavigationMode = true;
            this.keyboardUsed = true;
            this.selectedIndex = 0; // Start at first button
            this.highlightButton();
            return;
        }

        if (direction === 'up' && isAtTop) {
            // Already at top
            return;
        }

        // Scroll amount per key press
        const scrollAmount = 60;

        if (direction === 'up') {
            this.scrollContentElement.scrollBy({
                top: -scrollAmount,
                behavior: 'smooth'
            });
        } else if (direction === 'down') {
            this.scrollContentElement.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Navigate between buttons (left/right)
     */
    navigateButtons(direction) {
        if (this.navigableElements.length === 0) return;

        // Remove selection from current button
        this.clearButtonSelection();

        // Update selected index
        if (direction === 'left') {
            this.selectedIndex = (this.selectedIndex - 1 + this.navigableElements.length) % this.navigableElements.length;
        } else if (direction === 'right') {
            this.selectedIndex = (this.selectedIndex + 1) % this.navigableElements.length;
        }

        // Highlight new button
        this.highlightButton();
    }

    /**
     * Highlight the selected button for keyboard navigation
     */
    highlightButton() {
        const button = this.navigableElements[this.selectedIndex];
        if (!button) return;

        button.classList.add('victory-menu-selected');
        button.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8)';
        button.style.borderColor = '#00ffff';

        // Scroll the button into view
        button.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Clear button selection styling
     */
    clearButtonSelection() {
        this.navigableElements.forEach(button => {
            if (button) {
                button.classList.remove('victory-menu-selected');
                button.style.boxShadow = '';
                button.style.borderColor = '';
            }
        });
    }

    /**
     * Select the current button (activate it)
     */
    selectCurrentButton() {
        const button = this.navigableElements[this.selectedIndex];
        if (!button) return;

        button.click();
    }

    /**
     * Parent keyboard management methods
     */
    disableKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
        }
    }

    enableKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.addEventListener('keydown', this.keyboardHandler, { capture: true });
        }
    }

    /**
     * Enable touch scrolling for victory content
     */
    enableTouchScrolling() {
        if (!this.scrollContentElement) return;

        // Remove any existing handlers
        this.disableTouchScrolling();

        // Create touch scroll handlers that allow native scrolling
        this.touchScrollHandler = {
            start: (e) => {
                if (e.target.closest('button')) return;
                e.stopPropagation();
            },
            move: (e) => {
                if (e.target.closest('button')) return;
                e.stopPropagation();
            },
            end: (e) => {
                if (e.target.closest('button')) return;
                e.stopPropagation();
            }
        };

        // Add touch event listeners that explicitly allow scrolling
        this.scrollContentElement.addEventListener('touchstart', this.touchScrollHandler.start, { passive: true });
        this.scrollContentElement.addEventListener('touchmove', this.touchScrollHandler.move, { passive: true });
        this.scrollContentElement.addEventListener('touchend', this.touchScrollHandler.end, { passive: true });
    }

    /**
     * Disable touch scrolling handlers
     */
    disableTouchScrolling() {
        if (!this.scrollContentElement || !this.touchScrollHandler) return;

        // Remove touch event listeners
        this.scrollContentElement.removeEventListener('touchstart', this.touchScrollHandler.start, { passive: true });
        this.scrollContentElement.removeEventListener('touchmove', this.touchScrollHandler.move, { passive: true });
        this.scrollContentElement.removeEventListener('touchend', this.touchScrollHandler.end, { passive: true });

        // Clear the handler reference
        this.touchScrollHandler = null;
    }
}
