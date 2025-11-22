/**
 * Level Up Modal
 * Level-up upgrade selection screen with full keyboard navigation
 * Refactored to Option B pattern - modal owns all its behavior
 * Phase 12c refactoring
 */

import { Modal } from './modal-base.js';

/**
 * LevelUpModal - Displays upgrade choices on level up with tabs, keyboard navigation, and scrolling
 */
export class LevelUpModal extends Modal {
    constructor(id = 'levelup-modal') {
        super(id, { closeOnEscape: false, closeOnBackdropClick: false });
        this.upgradeChoices = [];
        this.onUpgradeSelectedCallback = null;

        // Tab management
        this.activeTab = 'levelup';
        this.tabs = ['levelup', 'guide', 'status'];

        // Keyboard navigation state
        this.keyboardHandler = null;
        this.selectedIndex = 0;
        this.navigableButtons = [];
        this.keyboardUsed = false;

        // Touch scrolling state
        this.scrollHandler = null;
        this.scrollContainers = [];

        // Game data callbacks for rendering (set externally)
        this.getTranslation = null;
        this.getWeaponsSection = null;
        this.getPassivesSection = null;
        this.getPlayerStatsSection = null;

        // Overlay lock callbacks (for disabling pause/help buttons)
        this.incrementOverlayLockCallback = null;
        this.decrementOverlayLockCallback = null;

        // Input delay state
        this.canAcceptInput = false;
        this.inputDelayTimeout = null;
    }

    /**
     * Sets callback for when upgrade is selected
     * @param {Function} callback - Callback(choice, choiceIndex)
     */
    onUpgradeSelected(callback) {
        this.onUpgradeSelectedCallback = callback;
    }

    /**
     * Sets game data callbacks for rendering guide and status panes
     * @param {Object} callbacks - Rendering callbacks
     * @param {Function} callbacks.t - Translation function
     * @param {Function} callbacks.generateWeaponsSection - Generates weapons HTML
     * @param {Function} callbacks.generatePassivesSection - Generates passives HTML
     * @param {Function} callbacks.generatePlayerStatsSection - Generates player stats HTML
     */
    setRenderCallbacks(callbacks) {
        this.getTranslation = callbacks.t;
        this.getWeaponsSection = callbacks.generateWeaponsSection;
        this.getPassivesSection = callbacks.generatePassivesSection;
        this.getPlayerStatsSection = callbacks.generatePlayerStatsSection;
    }

    /**
     * Sets overlay lock callbacks for disabling pause/help buttons
     * @param {Function} incrementFn - Function to call when modal shows
     * @param {Function} decrementFn - Function to call when modal hides
     */
    setOverlayLockCallbacks(incrementFn, decrementFn) {
        this.incrementOverlayLockCallback = incrementFn;
        this.decrementOverlayLockCallback = decrementFn;
    }

    /**
     * Updates modal with upgrade choices
     * @param {Object} data - Upgrade data
     * @param {Array} data.choices - Array of upgrade choice objects
     * @param {number} data.playerLevel - Current player level
     */
    update(data) {
        if (!data || !data.choices) return;

        this.upgradeChoices = data.choices;
        this.renderUpgradeChoices(data.choices, data.playerLevel);
    }

    /**
     * Renders upgrade choices in the modal
     * @param {Array} choices - Upgrade choice objects
     * @param {number} playerLevel - Current player level
     */
    renderUpgradeChoices(choices, playerLevel) {
        const choicesContainer = this.element?.querySelector('.upgrade-choices');
        if (!choicesContainer) return;

        const choicesHTML = choices.map((choice, index) => {
            const mergeClass = choice.isMergeWeapon ? ' upgrade-choice-merge' : '';
            return `
                <div class="upgrade-choice${mergeClass}" data-choice="${index}">
                    <div class="upgrade-choice-icon">
                        <span class="upgrade-choice-icon-image">${choice.icon || '⚔️'}</span>
                        <span class="upgrade-choice-title">${choice.name}</span>
                    </div>
                    <p>${choice.description}</p>
                    ${choice.level ? `<span class="upgrade-level">Level ${choice.level}</span>` : ''}
                </div>
            `;
        }).join('');

        choicesContainer.innerHTML = choicesHTML;

        // Add click handlers to choices
        const choiceElements = choicesContainer.querySelectorAll('.upgrade-choice');
        choiceElements.forEach((element, index) => {
            element.addEventListener('click', () => this.selectUpgrade(index));
        });
    }

    /**
     * Handles upgrade selection
     * @param {number} choiceIndex - Index of selected choice
     */
    selectUpgrade(choiceIndex) {
        if (this.onUpgradeSelectedCallback) {
            const choice = this.upgradeChoices[choiceIndex];
            this.onUpgradeSelectedCallback(choice, choiceIndex);
        }
        this.hide();
    }

    /**
     * Switches to a specific tab
     * @param {string} tab - Tab name ('levelup', 'guide', 'status')
     */
    switchTab(tab) {
        if (!this.tabs.includes(tab)) {
            tab = 'levelup';
        }

        const modal = this.element;
        if (!modal) return;

        const tabButtons = {
            levelup: modal.querySelector('[data-tab="levelup"]'),
            guide: modal.querySelector('[data-tab="guide"]'),
            status: modal.querySelector('[data-tab="status"]')
        };

        const panes = {
            levelup: modal.querySelector('#levelup-pane-levelup'),
            guide: modal.querySelector('#levelup-pane-guide'),
            status: modal.querySelector('#levelup-pane-status')
        };

        // Update active states
        Object.values(tabButtons).forEach(btn => btn && btn.classList.remove('active'));
        Object.values(panes).forEach(pane => pane && pane.classList.remove('active'));

        if (tabButtons[tab]) tabButtons[tab].classList.add('active');
        if (panes[tab]) panes[tab].classList.add('active');

        this.activeTab = tab;

        // Render pane content if needed
        if (tab === 'guide') {
            this.renderGuidePane();
        } else if (tab === 'status') {
            this.renderStatusPane();
        }

        // Update keyboard navigation for new tab
        this.updateNavigationForTab(tab);

        // Setup scrolling for new tab
        this.setupTouchScrolling();
    }

    /**
     * Cycles to the next or previous tab
     * @param {number} direction - 1 for next, -1 for previous
     */
    cycleTab(direction) {
        const currentIndex = this.tabs.indexOf(this.activeTab);
        const nextIndex = (currentIndex + direction + this.tabs.length) % this.tabs.length;
        this.switchTab(this.tabs[nextIndex]);
    }

    /**
     * Updates keyboard navigation for current tab
     * @param {string} tab - Active tab name
     */
    updateNavigationForTab(tab) {
        // Clear previous highlights
        this.navigableButtons.forEach(btn => btn.classList.remove('menu-selected'));

        if (tab === 'levelup') {
            // Set upgrade choices as navigable
            const choiceButtons = Array.from(this.element?.querySelectorAll('.upgrade-choice') || []);
            this.navigableButtons = choiceButtons;
            this.selectedIndex = 0;
        } else {
            // Guide and status tabs have no navigable buttons (scroll-only)
            this.navigableButtons = [];
            this.selectedIndex = 0;
        }

        this.updateMenuHighlight();
    }

    /**
     * Renders the guide pane content
     */
    renderGuidePane() {
        if (!this.getTranslation) return;

        const guidePane = this.element?.querySelector('.levelup-guide-pane');
        if (!guidePane) return;

        const t = this.getTranslation;
        const mergerTitle = t('weaponMergers', 'help');
        const evolutionTitle = t('weaponEvolution', 'help');

        const homingLaserName = t('homingLaser', 'weapons');
        const homingLaserRecipe = t('homingLaserRecipe', 'help');
        const homingLaserDesc = t('homingLaserDesc', 'help');

        const shockburstName = t('shockburst', 'weapons');
        const shockburstRecipe = t('shockburstRecipe', 'help');
        const shockburstDesc = t('shockburstDesc', 'help');

        const gatlingName = t('gatlingGun', 'weapons');
        const gatlingRecipe = t('gatlingGunRecipe', 'help');
        const gatlingDesc = t('gatlingGunDesc', 'help');

        const rapidEvolution = t('rapidFireEvolution', 'help');

        guidePane.innerHTML = `
            <h2 class="levelup-guide-title">${mergerTitle}</h2>
            <div class="help-recipes">
                <div class="merge-recipe">
                    <h3><img src="images/weapons/homingLaser.png" alt="Homing Laser"> ${homingLaserName}</h3>
                    <p>${homingLaserRecipe}</p>
                    <span class="recipe-desc">${homingLaserDesc}</span>
                </div>
                <div class="merge-recipe">
                    <h3><img src="images/weapons/shockburst.png" alt="Shockburst"> ${shockburstName}</h3>
                    <p>${shockburstRecipe}</p>
                    <span class="recipe-desc">${shockburstDesc}</span>
                </div>
                <div class="merge-recipe">
                    <h3><img src="images/weapons/gatlingGun.png" alt="Gatling Gun"> ${gatlingName}</h3>
                    <p>${gatlingRecipe}</p>
                    <span class="recipe-desc">${gatlingDesc}</span>
                </div>
            </div>
            <h2 class="levelup-guide-evolution"><img src="images/passives/evolution.png" alt="Weapon Evolution" class="section-icon"> ${evolutionTitle}</h2>
            <div class="help-section">
                <p>${rapidEvolution}</p>
            </div>
        `;
    }

    /**
     * Renders the status pane content
     */
    renderStatusPane() {
        if (!this.getWeaponsSection || !this.getPassivesSection || !this.getPlayerStatsSection || !this.getTranslation) return;

        const statusPane = this.element?.querySelector('.levelup-status-pane');
        if (!statusPane) return;

        const weaponsSection = this.getWeaponsSection();
        const passivesSection = this.getPassivesSection();
        const playerStatsSection = this.getPlayerStatsSection();
        const sections = [weaponsSection, passivesSection, playerStatsSection].filter(Boolean).join('');

        statusPane.innerHTML = `
            <h2 class="levelup-status-title">${this.getTranslation('statusTab')}</h2>
            ${sections || `<p class="help-status-empty">${this.getTranslation('statusEmpty')}</p>`}
        `;
    }

    /**
     * Updates localized labels and re-renders panes
     */
    updateLocalization() {
        if (!this.getTranslation || !this.element) return;

        const levelupBtn = this.element.querySelector('[data-tab="levelup"]');
        const guideBtn = this.element.querySelector('[data-tab="guide"]');
        const statusBtn = this.element.querySelector('[data-tab="status"]');

        if (levelupBtn) levelupBtn.textContent = this.getTranslation('levelUp');
        if (guideBtn) guideBtn.textContent = this.getTranslation('guideTab');
        if (statusBtn) statusBtn.textContent = this.getTranslation('statusTab');

        this.renderGuidePane();
        this.renderStatusPane();
        this.setupTouchScrolling();
    }

    /**
     * Scrolls the active pane content
     * @param {string} direction - 'up' or 'down'
     */
    scrollContent(direction) {
        const container = this.getActiveScrollContainer();
        if (!container) return;

        const scrollAmount = 120;
        const delta = direction === 'up' ? -scrollAmount : scrollAmount;

        container.scrollBy({
            top: delta,
            behavior: 'smooth'
        });
    }

    /**
     * Gets the currently active scroll container
     * @returns {HTMLElement|null} Active scroll container
     */
    getActiveScrollContainer() {
        if (!this.element) return null;

        if (this.activeTab === 'guide') {
            return this.element.querySelector('#levelup-pane-guide .levelup-scroll');
        }
        if (this.activeTab === 'status') {
            return this.element.querySelector('#levelup-pane-status .levelup-scroll');
        }
        // levelup tab uses the upgrade-choices-container
        return this.element.querySelector('.upgrade-choices-container');
    }

    /**
     * Navigates through upgrade choices
     * @param {string} direction - 'up', 'down', 'left', or 'right'
     */
    navigateMenu(direction) {
        if (this.navigableButtons.length === 0) return;

        const oldIndex = this.selectedIndex;

        if (direction === 'up' || direction === 'left') {
            this.selectedIndex = (this.selectedIndex - 1 + this.navigableButtons.length) % this.navigableButtons.length;
        } else if (direction === 'down' || direction === 'right') {
            this.selectedIndex = (this.selectedIndex + 1) % this.navigableButtons.length;
        }

        this.updateMenuHighlight();
        this.scrollToSelected();
    }

    /**
     * Updates visual highlight for selected upgrade choice
     */
    updateMenuHighlight() {
        // Remove previous highlights
        this.navigableButtons.forEach(button => {
            button.classList.remove('menu-selected');
            button.style.boxShadow = '';
            button.style.borderColor = '';
        });

        // Only show highlight if keyboard has been used
        if (this.keyboardUsed && this.navigableButtons[this.selectedIndex]) {
            const selected = this.navigableButtons[this.selectedIndex];
            selected.classList.add('menu-selected');
            selected.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8)';
            selected.style.borderColor = '#00ffff';
        }
    }

    /**
     * Scrolls to keep selected item in view
     */
    scrollToSelected() {
        const selected = this.navigableButtons[this.selectedIndex];
        if (!selected) return;

        const scrollContainer = selected.closest('.upgrade-choices-container');
        if (!scrollContainer) return;

        const containerRect = scrollContainer.getBoundingClientRect();
        const buttonRect = selected.getBoundingClientRect();

        const padding = 20;

        // Check if button is above visible area
        if (buttonRect.top < containerRect.top + padding) {
            const scrollAmount = buttonRect.top - containerRect.top - padding;
            scrollContainer.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
        // Check if button is below visible area
        else if (buttonRect.bottom > containerRect.bottom - padding) {
            const scrollAmount = buttonRect.bottom - containerRect.bottom + padding;
            scrollContainer.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Selects the currently highlighted upgrade choice
     */
    selectCurrentChoice() {
        if (this.navigableButtons[this.selectedIndex]) {
            this.navigableButtons[this.selectedIndex].click();
        }
    }

    /**
     * Sets up keyboard event handlers
     */
    setupKeyboardHandlers() {
        this.keyboardHandler = (e) => {
            if (!this.canAcceptInput) return;

            // Handle navigation based on active tab
            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from reaching main game handler
                    this.keyboardUsed = true;
                    if (this.activeTab !== 'levelup') {
                        this.scrollContent('up');
                    } else {
                        this.navigateMenu('up');
                    }
                    break;

                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from reaching main game handler
                    this.keyboardUsed = true;
                    if (this.activeTab !== 'levelup') {
                        this.scrollContent('down');
                    } else {
                        this.navigateMenu('down');
                    }
                    break;

                case 'arrowleft':
                case 'a':
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from reaching main game handler
                    this.keyboardUsed = true;
                    this.cycleTab(-1);
                    break;

                case 'arrowright':
                case 'd':
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from reaching main game handler
                    this.keyboardUsed = true;
                    this.cycleTab(1);
                    break;

                case 'enter':
                    if (this.activeTab === 'levelup' && this.keyboardUsed) {
                        e.preventDefault();
                        e.stopPropagation(); // Stop event from reaching main game handler
                        this.selectCurrentChoice();
                    }
                    break;

                case 'escape':
                    // Can't escape level up modal
                    e.preventDefault();
                    e.stopPropagation(); // Stop event from reaching main game handler
                    break;
            }
        };

        // Use capture phase to ensure modal gets events before main game handler
        document.addEventListener('keydown', this.keyboardHandler, { capture: true });

        // Add navigation CSS styles
        this.addNavigationStyles();
    }

    /**
     * Removes keyboard event handlers
     */
    cleanupKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
            this.keyboardHandler = null;
        }
        this.selectedIndex = 0;
        this.keyboardUsed = false;
        this.navigableButtons = [];
    }

    /**
     * Adds CSS for keyboard navigation
     */
    addNavigationStyles() {
        if (document.getElementById('levelup-nav-styles')) return;

        const style = document.createElement('style');
        style.id = 'levelup-nav-styles';
        style.textContent = `
            .menu-selected {
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
                border: 2px solid #00ffff !important;
                background: rgba(0, 255, 255, 0.1) !important;
                transition: all 0.2s ease !important;
            }

            .upgrade-choice.menu-selected {
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.4) !important;
                border: 2px solid #FFFFFF !important;
                background: rgba(0, 255, 255, 0.15) !important;
            }

            .upgrade-choice-merge.menu-selected {
                box-shadow: 0 0 25px rgba(255, 215, 0, 0.6) !important;
                border: 2px solid #FFD700 !important;
                background: rgba(255, 215, 0, 0.3) !important;
            }

            .upgrade-choice-merge.menu-selected h3 {
                color: #FFD700 !important;
                text-shadow: 0 0 12px rgba(255, 215, 0, 1) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Sets up touch scrolling handlers
     */
    setupTouchScrolling() {
        const containers = this.element?.querySelectorAll('.levelup-scroll');
        if (!containers || containers.length === 0) return;

        // Clear previous handlers
        this.cleanupTouchScrolling();

        this.scrollContainers = Array.from(containers);

        this.scrollHandler = {
            start: (e) => {
                // Allow button touches to bubble normally
                if (e.target.closest('button')) return;
                // Don't prevent default - allow native touch scrolling
                e.stopPropagation();
            },
            move: (e) => {
                // Allow button touches to bubble normally
                if (e.target.closest('button')) return;
                // Don't prevent default - allow native touch scrolling
                e.stopPropagation();
            },
            end: (e) => {
                // Allow button touches to bubble normally
                if (e.target.closest('button')) return;
                // Don't prevent default - allow native touch scrolling
                e.stopPropagation();
            }
        };

        // Add touch event listeners to each container
        this.scrollContainers.forEach(container => {
            container.addEventListener('touchstart', this.scrollHandler.start, { passive: true });
            container.addEventListener('touchmove', this.scrollHandler.move, { passive: true });
            container.addEventListener('touchend', this.scrollHandler.end, { passive: true });
        });
    }

    /**
     * Removes touch scrolling handlers
     */
    cleanupTouchScrolling() {
        if (this.scrollHandler && this.scrollContainers.length > 0) {
            this.scrollContainers.forEach(container => {
                container.removeEventListener('touchstart', this.scrollHandler.start, { passive: true });
                container.removeEventListener('touchmove', this.scrollHandler.move, { passive: true });
                container.removeEventListener('touchend', this.scrollHandler.end, { passive: true });
            });
        }

        this.scrollContainers = [];
        this.scrollHandler = null;
    }

    /**
     * Sets up tab button click handlers
     */
    setupTabButtons() {
        const tabButtons = this.element?.querySelectorAll('.levelup-tab') || [];

        tabButtons.forEach(btn => {
            const targetTab = btn.getAttribute('data-tab');
            const handler = (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.switchTab(targetTab);
            };

            // Store handler for cleanup
            btn._tabClickHandler = handler;

            btn.addEventListener('click', handler);
            btn.addEventListener('touchstart', handler, { passive: false });
        });
    }

    /**
     * Removes tab button click handlers
     */
    cleanupTabButtons() {
        const tabButtons = this.element?.querySelectorAll('.levelup-tab') || [];

        tabButtons.forEach(btn => {
            if (btn._tabClickHandler) {
                btn.removeEventListener('click', btn._tabClickHandler);
                btn.removeEventListener('touchstart', btn._tabClickHandler, { passive: false });
                delete btn._tabClickHandler;
            }
        });
    }

    /**
     * Shows level up modal
     */
    onShow() {
        // Increment overlay lock to disable pause/help buttons
        if (this.incrementOverlayLockCallback) {
            this.incrementOverlayLockCallback();
        }

        // Set up tab button handlers
        this.setupTabButtons();

        // Set up keyboard handlers
        this.setupKeyboardHandlers();

        // Initialize to levelup tab
        this.switchTab('levelup');

        // Set up touch scrolling
        this.setupTouchScrolling();

        // Focus the modal content
        const levelupContent = this.element?.querySelector('.levelup-content');
        if (levelupContent) {
            levelupContent.setAttribute('tabindex', '-1');
            levelupContent.focus({ preventScroll: true });
        }

        // Add input delay
        this.canAcceptInput = false;
        if (this.inputDelayTimeout) clearTimeout(this.inputDelayTimeout);
        this.inputDelayTimeout = setTimeout(() => {
            this.canAcceptInput = true;
        }, 500);
    }

    /**
     * Hides level up modal
     */
    onHide() {
        // Decrement overlay lock to re-enable pause/help buttons
        if (this.decrementOverlayLockCallback) {
            this.decrementOverlayLockCallback();
        }

        // Clean up tab button handlers
        this.cleanupTabButtons();

        // Clean up keyboard handlers
        this.cleanupKeyboardHandlers();

        // Clean up touch scrolling
        this.cleanupTouchScrolling();

        // Reset state
        this.upgradeChoices = [];
        this.activeTab = 'levelup';

        if (this.inputDelayTimeout) {
            clearTimeout(this.inputDelayTimeout);
            this.inputDelayTimeout = null;
        }
        this.canAcceptInput = false;
    }
}
