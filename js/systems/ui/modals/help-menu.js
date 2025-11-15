/**
 * Help Menu Modal - Option B: Proper Encapsulation
 * The modal owns all its behavior including keyboard handling, tab switching, and scrolling
 * Phase 12c.6 - Refactored from inline implementation
 */

export class HelpMenu {
    constructor() {
        this.element = null;
        this.contentElement = null;

        // Tab elements
        this.guideTab = null;
        this.statusTab = null;
        this.guidePane = null;
        this.statusPane = null;
        this.closeButton = null;

        // State
        this.activeTab = 'guide';
        this.isOpen = false;

        // Keyboard navigation state
        this.keyboardHandler = null;
        this.scrollHandler = null;
        this.selectedIndex = 0;
        this.navigableElements = [];
        this.keyboardUsed = false;
        this.buttonNavigationMode = false; // Track if we're navigating buttons vs scrolling

        // Callbacks
        this.onCloseCallback = null;
        this.getTranslation = null;
        this.renderStatusTab = null;

        // Overlay lock callbacks
        this.incrementOverlayLockCallback = null;
        this.decrementOverlayLockCallback = null;

        // Game state callbacks
        this.pauseGameCallback = null;
        this.resumeGameCallback = null;
        this.isPauseMenuOpen = null;

        // Previous navigation state (for restoring when closing)
        this.previousNavigationState = null;

        // Touch scroll handler
        this.touchScrollHandler = null;
    }

    /**
     * Initialize the help menu
     */
    init() {
        this.element = document.getElementById('help-menu');
        if (!this.element) {
            console.error('Help menu element not found');
            return false;
        }

        this.contentElement = this.element.querySelector('.help-content');

        // Get tab references
        this.guideTab = document.getElementById('help-tab-guide');
        this.statusTab = document.getElementById('help-tab-status');
        this.guidePane = document.getElementById('help-guide');
        this.statusPane = document.getElementById('help-status');
        this.closeButton = document.getElementById('close-help-btn');

        // Set up tab handlers
        this.setupTabHandlers();

        // Set up close button handler
        if (this.closeButton) {
            const closeHandler = (e) => {
                if (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                this.hide();
            };

            this.closeButton.addEventListener('click', closeHandler);
            this.closeButton.addEventListener('touchstart', closeHandler, { passive: false });
        }

        return true;
    }

    /**
     * Updates localized text for help menu
     */
    updateLocalization() {
        if (!this.getTranslation) return;

        const t = this.getTranslation;

        if (this.guideTab) this.guideTab.textContent = t('guideTab');
        if (this.statusTab) this.statusTab.textContent = t('statusTab');

        const guideTitle = document.getElementById('help-guide-title');
        if (guideTitle) guideTitle.innerHTML = t('weaponMergers', 'help');

        if (this.closeButton) this.closeButton.textContent = t('close');

        const helpHint = this.element?.querySelector('.help-hint');
        if (helpHint) helpHint.textContent = t('helpHint');

        const homingLaserTitle = document.getElementById('homing-laser-title');
        if (homingLaserTitle) homingLaserTitle.innerHTML = `<img src="images/weapons/homingLaser.png" alt="Homing Laser"> ${t('homingLaser', 'weapons')}`;

        const homingLaserRecipe = document.getElementById('homing-laser-recipe');
        if (homingLaserRecipe) homingLaserRecipe.textContent = t('homingLaserRecipe', 'help');

        const homingLaserDesc = document.getElementById('homing-laser-desc');
        if (homingLaserDesc) homingLaserDesc.textContent = t('homingLaserDesc', 'help');

        const shockburstTitle = document.getElementById('shockburst-title');
        if (shockburstTitle) shockburstTitle.innerHTML = `<img src="images/weapons/shockburst.png" alt="Shockburst"> ${t('shockburst', 'weapons')}`;

        const shockburstRecipe = document.getElementById('shockburst-recipe');
        if (shockburstRecipe) shockburstRecipe.textContent = t('shockburstRecipe', 'help');

        const shockburstDesc = document.getElementById('shockburst-desc');
        if (shockburstDesc) shockburstDesc.textContent = t('shockburstDesc', 'help');

        const gatlingTitle = document.getElementById('gatling-gun-title');
        if (gatlingTitle) gatlingTitle.innerHTML = `<img src="images/weapons/gatlingGun.png" alt="Gatling Gun"> ${t('gatlingGun', 'weapons')}`;

        const gatlingRecipe = document.getElementById('gatling-gun-recipe');
        if (gatlingRecipe) gatlingRecipe.textContent = t('gatlingGunRecipe', 'help');

        const gatlingDesc = document.getElementById('gatling-gun-desc');
        if (gatlingDesc) gatlingDesc.textContent = t('gatlingGunDesc', 'help');

        const weaponTipsTitle = document.getElementById('weapon-tips-title');
        if (weaponTipsTitle) weaponTipsTitle.remove();

        const weaponLimitTip = document.getElementById('weapon-limit-tip');
        if (weaponLimitTip && weaponLimitTip.parentElement) {
            weaponLimitTip.parentElement.removeChild(weaponLimitTip);
        }

        const weaponEvolutionTitle = document.getElementById('weapon-evolution-title');
        if (weaponEvolutionTitle) {
            weaponEvolutionTitle.innerHTML = `<img src="images/passives/evolution.png" alt="${t('weaponEvolution', 'help')}" class="section-icon"> ${t('weaponEvolution', 'help')}`;
        }

        const rapidFireEvolution = document.getElementById('rapid-fire-evolution');
        if (rapidFireEvolution) rapidFireEvolution.textContent = t('rapidFireEvolution', 'help');

        if (this.renderStatusTab) {
            this.renderStatusTab();
        }
    }

    /**
     * Set up tab click handlers
     */
    setupTabHandlers() {
        if (this.guideTab) {
            const guideHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchTab('guide');
            };

            this.guideTab.addEventListener('click', guideHandler);
            this.guideTab.addEventListener('touchstart', guideHandler, { passive: false });
        }

        if (this.statusTab) {
            const statusHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchTab('status');
            };

            this.statusTab.addEventListener('click', statusHandler);
            this.statusTab.addEventListener('touchstart', statusHandler, { passive: false });
        }
    }

    /**
     * Set game state callbacks
     */
    setGameStateCallbacks(pauseGame, resumeGame, isPauseMenuOpen, getTranslation, renderStatusTab) {
        this.pauseGameCallback = pauseGame;
        this.resumeGameCallback = resumeGame;
        this.isPauseMenuOpen = isPauseMenuOpen;
        this.getTranslation = getTranslation;
        this.renderStatusTab = renderStatusTab;

        if (this.element) {
            this.updateLocalization();
        }
    }

    /**
     * Set overlay lock callbacks
     */
    setOverlayLockCallbacks(incrementFn, decrementFn) {
        this.incrementOverlayLockCallback = incrementFn;
        this.decrementOverlayLockCallback = decrementFn;
    }

    /**
     * Set close callback
     */
    onClose(callback) {
        this.onCloseCallback = callback;
    }

    /**
     * Set previous navigation state (for restoring when closing)
     */
    setPreviousNavigationState(state) {
        this.previousNavigationState = state;
    }

    /**
     * Get previous navigation state
     */
    getPreviousNavigationState() {
        return this.previousNavigationState;
    }

    /**
     * Show the help menu
     */
    show() {
        if (!this.element) return;

        this.isOpen = true;
        this.element.style.display = 'flex';

        // Pause the game
        if (this.pauseGameCallback) {
            this.pauseGameCallback();
        }

        // Switch to active tab (or default to guide)
        this.switchTab(this.activeTab || 'guide');

        // Call lifecycle hook
        this.onShow();
    }

    /**
     * Hide the help menu
     */
    hide() {
        if (!this.element) return;

        this.isOpen = false;
        this.element.style.display = 'none';

        // Resume game only if pause menu is not open
        const pauseMenuOpen = this.isPauseMenuOpen ? this.isPauseMenuOpen() : false;
        if (!pauseMenuOpen && this.resumeGameCallback) {
            this.resumeGameCallback();
        }

        // Call lifecycle hook
        this.onHide();

        // Call close callback
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    /**
     * Switch between tabs
     */
    switchTab(tab) {
        if (!this.guidePane || !this.statusPane || !this.guideTab || !this.statusTab) return;

        // Reset button navigation mode when switching tabs
        this.buttonNavigationMode = false;
        this.keyboardUsed = false;
        this.clearButtonSelection();

        if (tab === 'status') {
            this.guidePane.style.display = 'none';
            this.statusPane.style.display = 'block';
            this.statusTab.classList.add('active');
            this.guideTab.classList.remove('active');

            // Render status tab content
            if (this.renderStatusTab) {
                this.renderStatusTab();
            }

            this.activeTab = 'status';
        } else {
            this.guidePane.style.display = 'block';
            this.statusPane.style.display = 'none';
            this.statusTab.classList.remove('active');
            this.guideTab.classList.add('active');
            this.activeTab = 'guide';
        }

        // Scroll to top of new tab
        if (this.contentElement) {
            this.contentElement.scrollTop = 0;
        }
    }

    /**
     * Lifecycle: Called when menu is shown
     */
    onShow() {
        // Increment overlay lock
        if (this.incrementOverlayLockCallback) {
            this.incrementOverlayLockCallback();
        }

        // Set up keyboard handlers
        this.setupKeyboardHandlers();

        // Set up navigable elements (just the close button)
        this.navigableElements = [this.closeButton].filter(Boolean);

        // Initialize selection
        this.selectedIndex = 0;
        this.keyboardUsed = false;
        this.buttonNavigationMode = false;
        this.clearButtonSelection();

        // Focus the content for scrolling
        if (this.contentElement) {
            this.contentElement.setAttribute('tabindex', '-1');
            this.contentElement.focus({ preventScroll: true });
        }

        // Enable touch scrolling
        this.enableTouchScrolling();

        // Scroll to top
        if (this.contentElement) {
            this.contentElement.scrollTop = 0;
        }
    }

    /**
     * Lifecycle: Called when menu is hidden
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
                    this.scrollContent('up');
                    break;

                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    e.stopPropagation();
                    this.scrollContent('down');
                    break;

                case 'tab':
                    e.preventDefault();
                    e.stopPropagation();
                    // Cycle between tabs
                    const tabs = ['guide', 'status'];
                    const currentIndex = tabs.indexOf(this.activeTab);
                    const nextIndex = (currentIndex + 1) % tabs.length;
                    this.switchTab(tabs[nextIndex]);
                    break;

                case 'enter':
                case ' ':
                    // Close button activation (only when in button navigation mode)
                    if (this.buttonNavigationMode && this.keyboardUsed) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.hide();
                    }
                    break;

                case 'escape':
                case 'f1':
                    e.preventDefault();
                    e.stopPropagation();
                    this.hide();
                    break;
            }
        };

        // Use capture phase to intercept events before other handlers
        document.addEventListener('keydown', this.keyboardHandler, { capture: true });

        // Add navigation styles
        this.addNavigationStyles();
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
     * Scroll help content or navigate to close button
     */
    scrollContent(direction) {
        if (!this.contentElement) return;

        // If in button navigation mode, navigate between content and button
        if (this.buttonNavigationMode) {
            if (direction === 'up') {
                // Go back to scroll mode
                this.buttonNavigationMode = false;
                this.keyboardUsed = false;
                this.clearButtonSelection();

                // Scroll to bottom so user knows where they are
                const activePane = this.activeTab === 'status' ? this.statusPane : this.guidePane;
                if (activePane) {
                    const target = (activePane.scrollHeight > activePane.clientHeight) ? activePane : this.contentElement;
                    target.scrollTop = target.scrollHeight;
                }
            }
            // Down does nothing when already on button
            return;
        }

        // Find the active pane
        const activePane = this.activeTab === 'status' ? this.statusPane : this.guidePane;
        if (!activePane) return;

        // Check if the pane is scrollable
        const target = (activePane.scrollHeight > activePane.clientHeight) ? activePane : this.contentElement;

        // Check if we're at the bottom and trying to scroll down - navigate to close button instead
        const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 5; // 5px tolerance
        const isAtTop = target.scrollTop <= 5; // 5px tolerance

        if (direction === 'down' && isAtBottom) {
            // Transition to button navigation mode
            this.buttonNavigationMode = true;
            this.keyboardUsed = true;
            this.highlightCloseButton();
            return;
        }

        if (direction === 'up' && isAtTop) {
            // Already at top
            return;
        }

        // Scroll amount per key press
        const scrollAmount = 60;

        if (direction === 'up') {
            target.scrollBy({
                top: -scrollAmount,
                behavior: 'smooth'
            });
        } else if (direction === 'down') {
            target.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Highlight the close button for keyboard navigation
     */
    highlightCloseButton() {
        if (!this.closeButton) return;

        this.closeButton.classList.add('menu-selected');
        this.closeButton.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8)';
        this.closeButton.style.borderColor = '#00ffff';

        // Scroll the button into view
        this.closeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Clear button selection styling
     */
    clearButtonSelection() {
        if (!this.closeButton) return;

        this.closeButton.classList.remove('menu-selected');
        this.closeButton.style.boxShadow = '';
        this.closeButton.style.borderColor = '';
    }

    /**
     * Add navigation styles to the page
     */
    addNavigationStyles() {
        // Check if styles already exist
        if (document.getElementById('help-menu-navigation-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'help-menu-navigation-styles';
        styles.textContent = `
            .help-menu .menu-selected {
                outline: 2px solid #00ffff;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Enable touch scrolling for help content
     */
    enableTouchScrolling() {
        if (!this.contentElement) return;

        // Remove any existing handlers
        this.disableTouchScrolling();

        // Create touch scroll handlers that allow native scrolling
        this.touchScrollHandler = {
            start: (e) => {
                e.stopPropagation(); // Stop it from bubbling
            },
            move: (e) => {
                e.stopPropagation(); // Stop it from bubbling
            },
            end: (e) => {
                e.stopPropagation(); // Stop it from bubbling
            }
        };

        // Add touch event listeners that explicitly allow scrolling
        this.contentElement.addEventListener('touchstart', this.touchScrollHandler.start, { passive: true });
        this.contentElement.addEventListener('touchmove', this.touchScrollHandler.move, { passive: true });
        this.contentElement.addEventListener('touchend', this.touchScrollHandler.end, { passive: true });
    }

    /**
     * Disable touch scrolling handlers
     */
    disableTouchScrolling() {
        if (!this.contentElement || !this.touchScrollHandler) return;

        // Remove touch event listeners
        this.contentElement.removeEventListener('touchstart', this.touchScrollHandler.start, { passive: true });
        this.contentElement.removeEventListener('touchmove', this.touchScrollHandler.move, { passive: true });
        this.contentElement.removeEventListener('touchend', this.touchScrollHandler.end, { passive: true });

        // Clear the handler reference
        this.touchScrollHandler = null;
    }

    /**
     * Update help button text (? or ×)
     */
    updateHelpButtonText(isOpen) {
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.textContent = isOpen ? '×' : '?';
        }
    }
}
