/**
 * Chest Modal
 * Displays passive upgrade choices when player collects upgrade chest
 * Magenta themed with guide/status tabs similar to level-up modal
 */

import { Modal } from './modal-base.js';
import { PASSIVES } from '../../../config/constants.js';

const PASSIVE_TRANSLATION_KEY_MAP = {
    'health_boost': 'healthBoost',
    'speed_boost': 'speedBoost',
    'regeneration': 'regeneration',
    'magnet': 'magnet',
    'armor': 'armor',
    'critical': 'criticalStrike',
    'dash_boost': 'dashBoost',
    'turbo_flux_cycler': 'turboFlux',
    'aegis_impact_core': 'aegisCore',
    'splitstream_matrix': 'splitstreamMatrix',
    'macro_charge_amplifier': 'macroCharge',
    'mod_bay_expander': 'modBay'
};

/**
 * ChestModal - Displays passive upgrade choices from collected chest
 */
export class ChestModal extends Modal {
    constructor(id = 'chest-modal') {
        super(id, { closeOnEscape: false, closeOnBackdropClick: false });
        this.upgradeChoices = [];
        this.onUpgradeSelectedCallback = null;

        // Tab + layout state
        this.activeTab = 'upgrades';
        this.tabs = ['upgrades', 'guide', 'status'];

        // Keyboard navigation state
        this.keyboardHandler = null;
        this.selectedIndex = 0;
        this.navigableButtons = [];
        this.keyboardUsed = false;

        // Touch scrolling state
        this.scrollHandler = null;
        this.scrollContainers = [];

        // Translation + render callbacks (set externally)
        this.getTranslation = null;
        this.getWeaponsSection = null;
        this.getPassivesSection = null;
        this.getPlayerStatsSection = null;

        // Overlay lock callbacks (for pausing game)
        this.incrementOverlayLockCallback = null;
        this.decrementOverlayLockCallback = null;
    }

    /**
     * Sets callback for when upgrade is selected
     * @param {Function} callback - Callback(choice, choiceIndex)
     */
    onUpgradeSelected(callback) {
        this.onUpgradeSelectedCallback = callback;
    }

    /**
     * Sets translation function
     * @param {Function} t - Translation function
     */
    setTranslationFunction(t) {
        this.getTranslation = t;
    }

    /**
     * Sets render callbacks for guide/status panes
     * @param {Object} callbacks - Rendering callbacks
     */
    setRenderCallbacks(callbacks = {}) {
        this.getWeaponsSection = callbacks.generateWeaponsSection || null;
        this.getPassivesSection = callbacks.generatePassivesSection || null;
        this.getPlayerStatsSection = callbacks.generatePlayerStatsSection || null;
    }

    /**
     * Sets overlay lock callbacks for pausing game
     * @param {Function} incrementFn - Function to call when modal shows
     * @param {Function} decrementFn - Function to call when modal hides
     */
    setOverlayLockCallbacks(incrementFn, decrementFn) {
        this.incrementOverlayLockCallback = incrementFn;
        this.decrementOverlayLockCallback = decrementFn;
    }

    /**
     * Updates modal with passive upgrade choices
     * @param {Object} data - Upgrade data
     * @param {Array} data.choices - Array of passive upgrade choice objects
     */
    update(data) {
        if (!data || !data.choices) {
            console.error('ChestModal.update() called without choices data');
            return;
        }

        this.upgradeChoices = data.choices;
        this.renderUpgradeChoices();
        this.switchTab(this.activeTab || 'upgrades');
    }

    /**
     * Shows modal with upgrade choices
     * @param {Array} choices - Array of passive upgrade choice objects
     */
    show(choices) {
        if (!this.element) {
            console.error('ChestModal element not found');
            return;
        }

        this.upgradeChoices = choices || [];
        this.keyboardUsed = false;
        this.selectedIndex = 0;
        this.activeTab = 'upgrades';
        this.renderUpgradeChoices();
        this.switchTab('upgrades');
        super.show();
    }

    /**
     * Renders upgrade choice cards
     */
    renderUpgradeChoices() {
        const container = this.element?.querySelector('.chest-choices');
        if (!container) return;

        container.innerHTML = '';

        this.upgradeChoices.forEach((choice, index) => {
            const choiceDiv = document.createElement('div');
            const isUnique = !!choice.isUnique;
            choiceDiv.className = `chest-choice${isUnique ? ' chest-choice-unique' : ''}`;
            choiceDiv.setAttribute('data-choice', index);
            const displayName = this.getLocalizedPassiveName(choice.passiveKey);
            const displayDescription = choice.passiveDescription || this.getLocalizedPassiveDescription(choice.passiveKey);

            // Icon and title
            const iconDiv = document.createElement('div');
            iconDiv.className = 'chest-choice-icon';

            const iconImage = document.createElement('img');
            iconImage.className = 'chest-choice-icon-image';
            iconImage.src = this.getPassiveIconPath(choice);
            iconImage.alt = choice.passiveName || 'Passive';
            iconDiv.appendChild(iconImage);

            const title = document.createElement('span');
            title.className = 'chest-choice-title';
            title.textContent = displayName || choice.passiveName || 'Unknown Passive';
            iconDiv.appendChild(title);

            if (isUnique) {
                const badge = document.createElement('span');
                badge.className = 'chest-choice-badge';
                badge.textContent = this.getTranslation ? (this.getTranslation('uniqueBadgeLabel') || 'Unique') : 'Unique';
                iconDiv.appendChild(badge);
            }

            choiceDiv.appendChild(iconDiv);

            // Description
            const description = document.createElement('p');
            description.textContent = displayDescription || '';
            choiceDiv.appendChild(description);

            // Stack info if stackable
            if (choice.maxStacks && choice.maxStacks !== Infinity) {
                const stackInfo = document.createElement('span');
                stackInfo.className = 'chest-stack-info';
                const current = choice.currentStacks || 0;
                stackInfo.textContent = `Stacks: ${current}/${choice.maxStacks}`;
                choiceDiv.appendChild(stackInfo);
            }

            // Click handler
            choiceDiv.addEventListener('click', () => this.selectUpgrade(index));
            choiceDiv.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectUpgrade(index);
            }, { passive: false });

            container.appendChild(choiceDiv);
        });

        // Update navigable buttons for keyboard
        this.navigableButtons = Array.from(container.querySelectorAll('.chest-choice'));
        if (this.navigableButtons.length > 0) {
            this.selectedIndex = Math.min(this.selectedIndex, this.navigableButtons.length - 1);
        } else {
            this.selectedIndex = 0;
        }
        this.updateChoiceHighlight();
    }

    /**
     * Gets icon path for passive type
     * @param {Object|string} choiceOrKey - Upgrade choice object or passive key
     * @returns {string} Icon path
     */
    getPassiveIconPath(choiceOrKey) {
        const passiveKey = typeof choiceOrKey === 'string' ? choiceOrKey : choiceOrKey?.passiveKey;
        const iconMap = {
            'health_boost': 'images/passives/healthBoost.png',
            'speed_boost': 'images/passives/speedBoost.png',
            'regeneration': 'images/passives/regeneration.png',
            'magnet': 'images/passives/magnet.png',
            'armor': 'images/passives/armor.png',
            'critical': 'images/passives/criticalStrike.png',
            'dash_boost': 'images/passives/dashBoost.png',
            'turbo_flux_cycler': 'images/passives/weaponFirerate.png',
            'aegis_impact_core': 'images/passives/weaponPower.png',
            'splitstream_matrix': 'images/passives/weaponProjectile.png',
            'macro_charge_amplifier': 'images/passives/weaponSize.png',
            'mod_bay_expander': 'images/passives/weaponSlot.png'
        };
        return iconMap[passiveKey] || 'images/passives/passive.png';
    }

    /**
     * Handles upgrade selection
     * @param {number} choiceIndex - Index of selected choice
     */
    selectUpgrade(choiceIndex) {
        if (choiceIndex < 0 || choiceIndex >= this.upgradeChoices.length) {
            return;
        }

        const choice = this.upgradeChoices[choiceIndex];

        // Trigger callback
        if (this.onUpgradeSelectedCallback) {
            this.onUpgradeSelectedCallback(choice, choiceIndex);
        }

        // Hide modal
        this.hide();
    }

    /**
     * Lifecycle: Called when modal is shown
     */
    onShow() {
        if (this.incrementOverlayLockCallback) {
            this.incrementOverlayLockCallback();
        }

        this.setupTabButtons();
        this.setupKeyboardHandlers();
        this.setupTouchScrolling();

        const content = this.element?.querySelector('.chest-content');
        if (content) {
            content.setAttribute('tabindex', '-1');
            content.focus({ preventScroll: true });
        }
    }

    /**
     * Lifecycle: Called when modal is hidden
     */
    onHide() {
        this.cleanupTabButtons();
        this.cleanupKeyboardHandlers();
        this.cleanupTouchScrolling();
        this.navigableButtons = [];
        this.keyboardUsed = false;
        this.activeTab = 'upgrades';

        if (this.decrementOverlayLockCallback) {
            this.decrementOverlayLockCallback();
        }
    }

    /**
     * Sets up tab button click handlers
     */
    setupTabButtons() {
        const tabButtons = this.element?.querySelectorAll('.chest-tab') || [];

        tabButtons.forEach(btn => {
            const targetTab = btn.getAttribute('data-tab');
            const handler = (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.switchTab(targetTab);
            };

            btn._tabClickHandler = handler;
            btn.addEventListener('click', handler);
            btn.addEventListener('touchstart', handler, { passive: false });
        });
    }

    /**
     * Removes tab button click handlers
     */
    cleanupTabButtons() {
        const tabButtons = this.element?.querySelectorAll('.chest-tab') || [];

        tabButtons.forEach(btn => {
            if (btn._tabClickHandler) {
                btn.removeEventListener('click', btn._tabClickHandler);
                btn.removeEventListener('touchstart', btn._tabClickHandler, { passive: false });
                delete btn._tabClickHandler;
            }
        });
    }

    /**
     * Set up keyboard navigation handlers
     */
    setupKeyboardHandlers() {
        this.keyboardHandler = (e) => {
            // Tab key handler removed


            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.activeTab === 'upgrades') {
                        this.keyboardUsed = true;
                        this.navigateChoices('up');
                    } else {
                        this.scrollContent('up');
                    }
                    break;

                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.activeTab === 'upgrades') {
                        this.keyboardUsed = true;
                        this.navigateChoices('down');
                    } else {
                        this.scrollContent('down');
                    }
                    break;

                case 'arrowleft':
                case 'a':
                    e.preventDefault();
                    e.stopPropagation();
                    this.cycleTab(-1);
                    break;

                case 'arrowright':
                case 'd':
                    e.preventDefault();
                    e.stopPropagation();
                    this.cycleTab(1);
                    break;

                case 'enter':
                case ' ':
                case 'spacebar':
                    if (this.activeTab === 'upgrades' && this.keyboardUsed) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.selectUpgrade(this.selectedIndex);
                    }
                    break;
            }
        };

        document.addEventListener('keydown', this.keyboardHandler, { capture: true });
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

        this.navigableButtons.forEach(btn => btn?.classList.remove('menu-selected'));
        this.selectedIndex = 0;
    }

    /**
     * Navigate between upgrade choices
     * @param {string} direction - 'up' or 'down'
     */
    navigateChoices(direction) {
        if (this.navigableButtons.length === 0) return;

        if (direction === 'up') {
            this.selectedIndex = (this.selectedIndex - 1 + this.navigableButtons.length) % this.navigableButtons.length;
        } else if (direction === 'down') {
            this.selectedIndex = (this.selectedIndex + 1) % this.navigableButtons.length;
        }

        this.updateChoiceHighlight();
        this.scrollToSelected();
    }

    /**
     * Updates highlight on currently selected choice
     */
    updateChoiceHighlight() {
        this.navigableButtons.forEach(btn => btn?.classList.remove('menu-selected'));

        if (this.keyboardUsed && this.navigableButtons[this.selectedIndex]) {
            this.navigableButtons[this.selectedIndex].classList.add('menu-selected');
        }
    }

    /**
     * Ensures keyboard-selected option stays visible
     */
    scrollToSelected() {
        const selected = this.navigableButtons[this.selectedIndex];
        if (!selected) return;

        const scrollContainer = this.element?.querySelector('.chest-upgrades-scroll');
        if (!scrollContainer) return;

        const containerRect = scrollContainer.getBoundingClientRect();
        const selectedRect = selected.getBoundingClientRect();
        const padding = 16;

        if (selectedRect.top < containerRect.top + padding) {
            scrollContainer.scrollBy({
                top: selectedRect.top - containerRect.top - padding,
                behavior: 'smooth'
            });
        } else if (selectedRect.bottom > containerRect.bottom - padding) {
            scrollContainer.scrollBy({
                top: selectedRect.bottom - containerRect.bottom + padding,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Add navigation styles to page
     */
    addNavigationStyles() {
        if (document.getElementById('chest-modal-nav-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'chest-modal-nav-styles';
        style.textContent = `
            .chest-choice.menu-selected {
                box-shadow: 0 0 18px rgba(255, 16, 240, 0.45) !important;
                border: 2px solid #ff8eff !important;
                background: rgba(255, 16, 240, 0.18) !important;
            }

            .chest-choice-unique.menu-selected {
                box-shadow: 0 0 22px rgba(255, 215, 0, 0.55) !important;
                border: 2px solid #ffd700 !important;
                background: rgba(255, 215, 0, 0.2) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Switches to a specific tab
     * @param {string} tab - Tab name ('upgrades', 'guide', 'status')
     */
    switchTab(tab) {
        if (!this.tabs.includes(tab)) {
            tab = 'upgrades';
        }

        const modal = this.element;
        if (!modal) return;

        const tabButtons = {
            upgrades: modal.querySelector('[data-tab="upgrades"]'),
            guide: modal.querySelector('[data-tab="guide"]'),
            status: modal.querySelector('[data-tab="status"]')
        };

        const panes = {
            upgrades: modal.querySelector('#chest-pane-upgrades'),
            guide: modal.querySelector('#chest-pane-guide'),
            status: modal.querySelector('#chest-pane-status')
        };

        Object.values(tabButtons).forEach(btn => btn?.classList.remove('active'));
        Object.values(panes).forEach(pane => pane?.classList.remove('active'));

        tabButtons[tab]?.classList.add('active');
        panes[tab]?.classList.add('active');

        this.activeTab = tab;

        if (tab === 'guide') {
            this.renderGuidePane();
        } else if (tab === 'status') {
            this.renderStatusPane();
        }

        this.updateNavigationForTab(tab);
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
     * Updates keyboard navigation target elements for the current tab
     */
    updateNavigationForTab(tab) {
        if (tab === 'upgrades') {
            this.navigableButtons = Array.from(this.element?.querySelectorAll('.chest-choice') || []);
            this.selectedIndex = Math.min(this.selectedIndex, this.navigableButtons.length - 1);
        } else {
            this.navigableButtons = [];
            this.selectedIndex = 0;
        }

        this.updateChoiceHighlight();
    }

    /**
     * Renders the guide pane content
     */
    renderGuidePane() {
        const guidePane = this.element?.querySelector('.chest-guide-pane');
        if (!guidePane) return;

        const uniquePassives = this.getUniquePassivesList();
        const t = this.getTranslation;
        const title = t ? t('uniqueItemsTitle') : 'Unique Items';
        const description = t ? t('uniqueItemsDescription') : 'These rare passives have a lower chance to appear.';

        if (uniquePassives.length === 0) {
            guidePane.innerHTML = `
                <p class="chest-guide-empty">${t ? (t('uniqueItemsEmpty') || 'Unique passives unavailable.') : 'Unique passives unavailable.'}</p>
            `;
            return;
        }

        const guideItems = uniquePassives.map(passive => `
            <div class="chest-guide-item">
                <div class="chest-guide-icon">
                    <img src="${this.getPassiveIconPath(passive.key)}" alt="${this.getLocalizedPassiveName(passive.key)}">
                </div>
                <div class="chest-guide-text">
                    <h3>${this.getLocalizedPassiveName(passive.key)}</h3>
                    <p>${this.getLocalizedPassiveDescription(passive.key)}</p>
                </div>
            </div>
        `).join('');

        guidePane.innerHTML = `
            <h2 class="chest-guide-title">${title}</h2>
            <p class="chest-guide-description">${description}</p>
            <div class="chest-guide-list">${guideItems}</div>
        `;
    }

    /**
     * Renders the status pane content
     */
    renderStatusPane() {
        if (!this.getWeaponsSection || !this.getPassivesSection || !this.getPlayerStatsSection || !this.getTranslation) {
            return;
        }

        const statusPane = this.element?.querySelector('.chest-status-pane');
        if (!statusPane) return;

        const weaponsSection = this.getWeaponsSection();
        const passivesSection = this.getPassivesSection();
        const playerStatsSection = this.getPlayerStatsSection();
        const sections = [weaponsSection, passivesSection, playerStatsSection].filter(Boolean).join('');

        statusPane.innerHTML = `
            <h2 class="chest-status-title">${this.getTranslation('statusTab')}</h2>
            ${sections || `<p class="help-status-empty">${this.getTranslation('statusEmpty')}</p>`}
        `;
    }

    /**
     * Updates localized labels and panes
     */
    updateLocalization() {
        if (!this.getTranslation || !this.element) return;

        const upgradesBtn = this.element.querySelector('[data-tab="upgrades"]');
        const guideBtn = this.element.querySelector('[data-tab="guide"]');
        const statusBtn = this.element.querySelector('[data-tab="status"]');
        const titleEl = this.element.querySelector('.chest-title');
        const subtitleEl = this.element.querySelector('.chest-subtitle');
        const hintEl = this.element.querySelector('.chest-hint');

        if (upgradesBtn) upgradesBtn.textContent = this.getTranslation('chestTabUpgrades');
        if (guideBtn) guideBtn.textContent = this.getTranslation('guideTab');
        if (statusBtn) statusBtn.textContent = this.getTranslation('statusTab');
        if (titleEl) titleEl.textContent = this.getTranslation('chestTitle');
        if (subtitleEl) subtitleEl.textContent = this.getTranslation('chestSubtitle');
        if (hintEl) hintEl.textContent = this.getTranslation('chestHint');

        this.renderGuidePane();
        this.renderStatusPane();
        this.setupTouchScrolling();
    }

    /**
     * Builds list of unique passives from config
     * @returns {Array} Unique passive definitions
     */
    getUniquePassivesList() {
        return Object.entries(PASSIVES)
            .filter(([, passive]) => passive.isUnique)
            .map(([key, passive]) => ({
                key: key.toLowerCase(),
                name: passive.name,
                description: passive.description
            }));
    }

    /**
     * Gets localized passive name
     * @param {string} passiveKey - Passive key (lowercase)
     */
    getLocalizedPassiveName(passiveKey) {
        const translationKey = this.getTranslationKey(passiveKey);
        if (this.getTranslation) {
            const translated = this.getTranslation(translationKey, 'passives');
            if (translated && translated !== translationKey) {
                return translated;
            }
        }

        const passiveConfig = PASSIVES[passiveKey.toUpperCase()];
        return passiveConfig?.name || passiveKey;
    }

    /**
     * Gets localized passive description
     * @param {string} passiveKey - Passive key (lowercase)
     */
    getLocalizedPassiveDescription(passiveKey) {
        const translationKey = `${this.getTranslationKey(passiveKey)}Desc`;
        if (this.getTranslation) {
            const translated = this.getTranslation(translationKey, 'passives');
            if (translated && translated !== translationKey) {
                return translated;
            }
        }

        const passiveConfig = PASSIVES[passiveKey.toUpperCase()];
        return passiveConfig?.description || '';
    }

    /**
     * Maps passive key to translation key
     */
    getTranslationKey(passiveKey) {
        return PASSIVE_TRANSLATION_KEY_MAP[passiveKey] || passiveKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    /**
     * Scrolls the active pane content
     * @param {string} direction - 'up' or 'down'
     */
    scrollContent(direction) {
        const container = this.getActiveScrollContainer();
        if (!container) return;

        const delta = direction === 'up' ? -120 : 120;
        container.scrollBy({
            top: delta,
            behavior: 'smooth'
        });
    }

    /**
     * Gets the currently active scroll container
     */
    getActiveScrollContainer() {
        if (!this.element) return null;

        if (this.activeTab === 'guide') {
            return this.element.querySelector('#chest-pane-guide .chest-scroll');
        }

        if (this.activeTab === 'status') {
            return this.element.querySelector('#chest-pane-status .chest-scroll');
        }

        return this.element.querySelector('.chest-upgrades-scroll');
    }

    /**
     * Set up touch scrolling for mobile
     */
    setupTouchScrolling() {
        this.cleanupTouchScrolling();

        if (!this.element) return;
        this.scrollContainers = Array.from(this.element.querySelectorAll('.chest-scroll'));
        if (this.scrollContainers.length === 0) return;

        this.scrollHandler = {
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

        this.scrollContainers.forEach(container => {
            container.addEventListener('touchstart', this.scrollHandler.start, { passive: true });
            container.addEventListener('touchmove', this.scrollHandler.move, { passive: true });
            container.addEventListener('touchend', this.scrollHandler.end, { passive: true });
        });
    }

    /**
     * Clean up touch scrolling
     */
    cleanupTouchScrolling() {
        if (this.scrollHandler && this.scrollContainers.length > 0) {
            this.scrollContainers.forEach(container => {
                container.removeEventListener('touchstart', this.scrollHandler.start);
                container.removeEventListener('touchmove', this.scrollHandler.move);
                container.removeEventListener('touchend', this.scrollHandler.end);
            });
        }

        this.scrollContainers = [];
        this.scrollHandler = null;
    }
}
