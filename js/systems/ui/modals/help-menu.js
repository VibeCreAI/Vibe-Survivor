/**
 * Help Menu Modal - Option B: Proper Encapsulation
 * The modal owns all its behavior including keyboard handling, tab switching, and scrolling
 * Phase 12c.6 - Refactored from inline implementation
 */

import { PASSIVES, WEAPONS } from '../../../config/constants.js';

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

const WEAPON_KEY_TO_TYPE = {
    BASIC: 'basic',
    SPREAD: 'spread',
    LASER: 'laser',
    PLASMA: 'plasma',
    SHOTGUN: 'shotgun',
    LIGHTNING: 'lightning',
    FLAMETHROWER: 'flamethrower',
    RAILGUN: 'railgun',
    MISSILES: 'missiles',
    HOMING_LASER: 'homing_laser',
    SHOCKBURST: 'shockburst',
    GATLING_GUN: 'gatling_gun',
    NAPALM_BUCKSHOT: 'napalm_buckshot',
    RAPID: 'rapid'
};

export class HelpMenu {
    constructor() {
        this.element = null;
        this.contentElement = null;

        // Tab elements
        this.howToTab = null;
        this.passivesTab = null;
        this.weaponsTab = null;
        this.statusTab = null;
        this.panes = {};
        this.tabs = {};
        this.closeButton = null;
        this.passivesList = null;
        this.weaponsList = null;

        // State
        this.activeTab = 'status';
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
        this.statusTab = document.getElementById('help-tab-status');
        this.passivesTab = document.getElementById('help-tab-passives');
        this.weaponsTab = document.getElementById('help-tab-weapons');
        this.howToTab = document.getElementById('help-tab-howto');
        this.panes = {
            status: document.getElementById('help-pane-status'),
            passives: document.getElementById('help-pane-passives'),
            weapons: document.getElementById('help-pane-weapons'),
            howto: document.getElementById('help-pane-howto')
        };
        this.tabs = {
            status: this.statusTab,
            passives: this.passivesTab,
            weapons: this.weaponsTab,
            howto: this.howToTab
        };
        this.passivesList = document.getElementById('help-passives-list');
        this.weaponsList = document.getElementById('help-weapons-list');
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

        this.populatePassivesList();
        this.populateWeaponsList();
        this.switchTab(this.activeTab);

        return true;
    }

    /**
     * Updates localized text for help menu
     */
    updateLocalization() {
        if (!this.getTranslation) return;
        const t = (key) => this.getTranslation(key, 'help');

        // Update tab buttons
        if (this.tabs.howto) this.tabs.howto.textContent = t('howToTab');
        if (this.tabs.passives) this.tabs.passives.textContent = t('passivesTab');
        if (this.tabs.weapons) this.tabs.weapons.textContent = t('weaponsTab');
        if (this.tabs.status) this.tabs.status.textContent = t('statusTab');

        // Update close button
        if (this.closeButton) this.closeButton.textContent = t('closeButton');

        // Update help hint
        const helpHint = this.element?.querySelector('.help-hint');
        if (helpHint) helpHint.textContent = t('helpHint');

        // Update How To content
        this.updateHowToContent();

        // Re-populate lists
        this.populatePassivesList();
        this.populateWeaponsList();

        if (this.renderStatusTab) {
            this.renderStatusTab();
        }
    }

    updateHowToContent() {
        if (!this.getTranslation) return;
        const t = (key) => this.getTranslation(key, 'help');
        const howToPane = this.panes.howto;
        if (!howToPane) return;

        howToPane.innerHTML = `
            <div class="howto-list">
                <div class="howto-item"><span class="howto-label">${t('controlsLabel')}</span> ${t('controlsText')}</div>
                <div class="howto-item"><span class="howto-label">${t('mobileLabel')}</span> ${t('mobileText')}</div>
                <div class="howto-item"><span class="howto-label">${t('objectiveLabel')}</span> ${t('objectiveText')}</div>
                <div class="howto-item"><span class="howto-label">${t('levelingLabel')}</span> ${t('levelingText')}</div>
                <div class="howto-item"><span class="howto-label">${t('evolutionLabel')}</span> ${t('evolutionText')}</div>
                <div class="howto-item"><span class="howto-label">${t('mergersLabel')}</span> ${t('mergersText')}</div>
            </div>
        `;
    }

    /**
     * Set up tab click handlers
     */
    setupTabHandlers() {
        Object.entries(this.tabs).forEach(([key, button]) => {
            if (!button) return;

            const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchTab(key);
            };

            button.addEventListener('click', handler);
            button.addEventListener('touchstart', handler, { passive: false });
            button.addEventListener('pointerdown', handler);
            button.addEventListener('touchend', handler, { passive: false });
            button.addEventListener('pointerup', handler);
            button.addEventListener('pointercancel', handler);
        });
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

        // Switch to active tab (or default to how-to)
        this.switchTab(this.activeTab || 'status');

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
        if (!this.panes[tab] || !this.tabs[tab]) return;

        // Reset button navigation mode when switching tabs
        this.buttonNavigationMode = false;
        this.keyboardUsed = false;
        this.clearButtonSelection();

        Object.entries(this.panes).forEach(([key, pane]) => {
            if (!pane) return;
            pane.style.display = key === tab ? 'block' : 'none';
        });

        Object.entries(this.tabs).forEach(([key, button]) => {
            if (!button) return;
            if (key === tab) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        if (tab === 'status' && this.renderStatusTab) {
            this.renderStatusTab();
        }

        if (tab === 'passives') {
            this.populatePassivesList();
        } else if (tab === 'weapons') {
            this.populateWeaponsList();
        }

        this.activeTab = tab;

        // Scroll to top of new tab
        if (this.contentElement) {
            this.contentElement.scrollTop = 0;
        }
    }

    populatePassivesList() {
        if (!this.passivesList) return;
        this.passivesList.innerHTML = '';

        this.addSectionHeader(this.passivesList, 'uniquePassivesHeader');
        this.getOrderedUniquePassives().forEach((passiveId) => {
            this.passivesList.appendChild(this.createPassiveItem(passiveId));
        });

        this.addSectionHeader(this.passivesList, 'stackablePassivesHeader');
        this.getOrderedStackablePassives().forEach((passiveId) => {
            this.passivesList.appendChild(this.createPassiveItem(passiveId));
        });
    }

    populateWeaponsList() {
        if (!this.weaponsList) return;
        this.weaponsList.innerHTML = '';

        this.addSectionHeader(this.weaponsList, 'mergerWeaponsHeader');
        this.getOrderedMergeWeapons().forEach(({ type, recipe, description }) => {
            this.weaponsList.appendChild(this.createWeaponItem(type, { recipe, description }));
        });

        this.addSectionHeader(this.weaponsList, 'evolutionWeaponsHeader');
        this.weaponsList.appendChild(
            this.createWeaponItem('rapid', {
                description: this.getTranslation?.('rapidFireEvolutionDesc', 'help') || 'Basic Missile evolves at level 5 into Rapid Fire with blazing speed.'
            })
        );

        this.addSectionHeader(this.weaponsList, 'baseWeaponsHeader');
        this.getOrderedBaseWeapons().forEach((type) => {
            this.weaponsList.appendChild(this.createWeaponItem(type));
        });
    }

    createPassiveItem(passiveId) {
        const item = document.createElement('div');
        item.className = 'passive-item';
        if (this.getOrderedUniquePassives().includes(passiveId)) {
            item.classList.add('unique-passive');
        }

        const name = this.getLocalizedPassiveName(passiveId);
        const stackInfo = this.getPassiveStackInfo(passiveId);

        item.innerHTML = `
            <div class="passive-icon"><img src="${this.getPassiveIconPath(passiveId)}" alt="${name}"></div>
            <div class="passive-details">
                <div class="passive-name">${name}</div>
                <div class="passive-desc">${stackInfo}</div>
            </div>
        `;

        return item;
    }

    createWeaponItem(type, options = {}) {
        const { recipe, description } = options;
        const item = document.createElement('div');
        const isMerge = this.getOrderedMergeWeapons().some(w => w.type === type);
        item.className = `weapon-item ${isMerge ? 'weapon-merge' : 'weapon-standard'}`;

        const name = this.getWeaponName(type);
        const desc = description || this.getWeaponDescription(type);

        item.innerHTML = `
            <div class="weapon-icon">${this.getWeaponIcon(type)}</div>
            <div class="weapon-details">
                <div class="weapon-name">${name}</div>
                ${recipe ? `<div class="weapon-recipe">${recipe}</div>` : ''}
                <div class="weapon-desc">${desc}</div>
            </div>
        `;

        return item;
    }

    addSectionHeader(container, translationKey) {
        const header = document.createElement('div');
        header.className = 'section-header';
        if (this.getTranslation) {
            header.textContent = this.getTranslation(translationKey, 'help');
        } else {
            header.textContent = translationKey;
        }
        container.appendChild(header);
    }

    getOrderedUniquePassives() {
        return [
            'regeneration',
            'turbo_flux_cycler',
            'aegis_impact_core',
            'splitstream_matrix',
            'macro_charge_amplifier',
            'mod_bay_expander'
        ];
    }

    getOrderedStackablePassives() {
        return [
            'health_boost',
            'speed_boost',
            'magnet',
            'armor',
            'critical',
            'dash_boost'
        ];
    }

    getOrderedMergeWeapons() {
        if (!this.getTranslation) {
            return [
                { type: 'homing_laser', recipe: 'Laser lvl 3 + Homing Missiles lvl 3', description: 'Heat-seeking laser beams.' },
                { type: 'shockburst', recipe: 'Lightning lvl 3 + Plasma lvl 3', description: 'Explosive energy bursts.' },
                { type: 'gatling_gun', recipe: 'Rapid Fire lvl 5 + Spread Shot lvl 3', description: 'Multi-barrel rapid fire.' },
                { type: 'napalm_buckshot', recipe: 'Shotgun lvl 3 + Flamethrower lvl 3', description: 'Sticky fire pellets with stacking burn damage.' }
            ];
        }

        const t = (key) => this.getTranslation(key, 'help');
        return [
            { type: 'homing_laser', recipe: t('homingLaserRecipe'), description: t('homingLaserDesc') },
            { type: 'shockburst', recipe: t('shockburstRecipe'), description: t('shockburstDesc') },
            { type: 'gatling_gun', recipe: t('gatlingGunRecipe'), description: t('gatlingGunDesc') },
            { type: 'napalm_buckshot', recipe: t('napalmBuckshotRecipe'), description: t('napalmBuckshotDesc') }
        ];
    }

    getOrderedBaseWeapons() {
        return [
            'basic',
            'spread',
            'laser',
            'plasma',
            'shotgun',
            'lightning',
            'flamethrower',
            'railgun',
            'missiles'
        ];
    }

    getPassiveStackInfo(passiveId) {
        if (!this.getTranslation) return '';
        const t = (key) => this.getTranslation(key, 'help');

        switch (passiveId) {
            case 'health_boost': return t('healthBoostStack');
            case 'speed_boost': return t('speedBoostStack');
            case 'magnet': return t('magnetStack');
            case 'armor': return t('armorStack');
            case 'critical': return t('criticalStack');
            case 'dash_boost': return t('dashBoostStack');
            case 'turbo_flux_cycler': return t('turboFluxStack');
            case 'aegis_impact_core': return t('aegisCoreStack');
            case 'splitstream_matrix': return t('splitstreamMatrixStack');
            case 'macro_charge_amplifier': return t('macroChargeStack');
            case 'mod_bay_expander': return t('modBayStack');
            case 'regeneration': return t('regenerationStack');
            default: return '';
        }
    }

    getWeaponName(type) {
        const weaponNameMap = {
            'basic': 'basicMissile',
            'rapid': 'rapidFire',
            'spread': 'spreadShot',
            'spread_shot': 'spreadShot',
            'laser': 'laserBeam',
            'plasma': 'plasmaBolt',
            'shotgun': 'shotgun',
            'lightning': 'lightning',
            'flamethrower': 'flamethrower',
            'railgun': 'railgun',
            'missiles': 'homingMissiles',
            'homing_laser': 'homingLaser',
            'shockburst': 'shockburst',
            'gatling_gun': 'gatlingGun',
            'napalm_buckshot': 'napalmBuckshot'
        };

        const nameKey = weaponNameMap[type];
        if (this.getTranslation && nameKey) {
            const translated = this.getTranslation(nameKey, 'weapons');
            if (translated) return translated;
        }

        return this.getWeaponNameFromConfig(type);
    }

    getWeaponDescription(type) {
        const descKey = `${type}Desc`;
        if (this.getTranslation) {
            const translated = this.getTranslation(descKey, 'weapons');
            if (translated) return translated;
        }
        const weaponConfig = WEAPONS[type.toUpperCase()];
        return weaponConfig?.description || '';
    }

    getWeaponIcon(type) {
        const weaponIconMap = {
            'basic': 'basicMissile',
            'rapid': 'rapidFire',
            'spread': 'spreadShot',
            'spread_shot': 'spreadShot',
            'laser': 'laserBeam',
            'plasma': 'plasmaBolt',
            'shotgun': 'shotgun',
            'lightning': 'lightning',
            'flamethrower': 'flamethrower',
            'railgun': 'railgun',
            'missiles': 'homingMissiles',
            'homing_laser': 'homingLaser',
            'shockburst': 'shockburst',
            'gatling_gun': 'gatlingGun',
            'napalm_buckshot': 'napalmBuckshot'
        };

        const iconName = weaponIconMap[type] || 'basicMissile';
        return `<img src="images/weapons/${iconName}.png" alt="${type}" style="width: 48px; height: 48px; image-rendering: pixelated; vertical-align: middle; margin-right: 8px;">`;
    }

    getWeaponNameFromConfig(type) {
        const weaponEntry = Object.entries(WEAPON_KEY_TO_TYPE).find(([, value]) => value === type);
        const weaponKey = weaponEntry ? weaponEntry[0] : null;
        const weaponConfig = weaponKey ? WEAPONS[weaponKey] : null;
        if (weaponConfig?.name) {
            return weaponConfig.name;
        }
        return this.formatTitleCase(type);
    }

    formatTitleCase(text) {
        return text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    getLocalizedPassiveName(passiveKey) {
        const translationKey = PASSIVE_TRANSLATION_KEY_MAP[passiveKey] || passiveKey;
        if (this.getTranslation) {
            const translated = this.getTranslation(translationKey, 'passives');
            if (translated && translated !== translationKey) {
                return translated;
            }
        }

        const passiveConfig = PASSIVES[passiveKey.toUpperCase()];
        return passiveConfig?.name || passiveKey;
    }

    getLocalizedPassiveDescription(passiveKey) {
        // Use the Stack translation key from help namespace for detailed descriptions
        const stackKey = this.getPassiveStackInfo(passiveKey);
        if (stackKey) {
            return stackKey;
        }

        // Fallback to config description
        const passiveConfig = PASSIVES[passiveKey.toUpperCase()];
        return passiveConfig?.description || '';
    }

    getPassiveIconPath(passiveKey) {
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

                case 'arrowleft':
                case 'a':
                    e.preventDefault();
                    e.stopPropagation();
                    this.cycleTabs(-1);
                    break;

                case 'arrowright':
                case 'd':
                    e.preventDefault();
                    e.stopPropagation();
                    this.cycleTabs(1);
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
                const activePane = this.panes[this.activeTab];
                if (activePane) {
                    const target = (activePane.scrollHeight > activePane.clientHeight) ? activePane : this.contentElement;
                    target.scrollTop = target.scrollHeight;
                }
            }
            // Down does nothing when already on button
            return;
        }

        // Find the active pane
        const activePane = this.panes[this.activeTab];
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

    cycleTabs(delta) {
        const tabs = ['status', 'passives', 'weapons', 'howto'];
        const currentIndex = tabs.indexOf(this.activeTab);
        const nextIndex = (currentIndex + delta + tabs.length) % tabs.length;
        this.switchTab(tabs[nextIndex]);
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
