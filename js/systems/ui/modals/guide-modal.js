import { Modal } from './modal-base.js';
import { WEAPONS, PASSIVES } from '../../../config/constants.js';

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
    RAPID: 'rapid'
};

const PASSIVE_TRANSLATION_KEY_MAP = {
    health_boost: 'healthBoost',
    speed_boost: 'speedBoost',
    regeneration: 'regeneration',
    magnet: 'magnet',
    armor: 'armor',
    critical: 'criticalStrike',
    dash_boost: 'dashBoost',
    turbo_flux_cycler: 'turboFlux',
    aegis_impact_core: 'aegisCore',
    splitstream_matrix: 'splitstreamMatrix',
    macro_charge_amplifier: 'macroCharge',
    mod_bay_expander: 'modBay'
};

export class GuideModal extends Modal {
    constructor(game, id = 'survivor-guide-overlay') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: true });
        this.game = game;
        this.activeTab = 'howto';
        this.tabs = {};
        this.panes = {};
        this.closeButton = null;
        this.onCloseCallback = null;
        this.initialized = false;
        this.keyboardHandler = null;
        this.contentElement = null;
        this.buttonNavigationMode = false;
        this.keyboardUsed = false;
    }

    init() {
        const initialized = super.init();
        if (!initialized) return false;
        this.initialized = true;

        this.tabs = {
            howto: this.element.querySelector('[data-tab="howto"]'),
            passives: this.element.querySelector('[data-tab="passives"]'),
            weapons: this.element.querySelector('[data-tab="weapons"]')
        };

        this.panes = {
            howto: this.element.querySelector('#guide-pane-howto'),
            passives: this.element.querySelector('#guide-pane-passives'),
            weapons: this.element.querySelector('#guide-pane-weapons')
        };

        this.closeButton = this.element.querySelector('#close-guide-btn');
        this.contentElement = this.element.querySelector('.guide-content');

        this.setupTabHandlers();

        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hide());
        }

        this.updateLocalization();
        this.switchTab(this.activeTab);

        return true;
    }

    updateLocalization() {
        if (!this.game?.t) return;

        // Update tab buttons
        if (this.tabs.howto) this.tabs.howto.textContent = this.game.t('howToTab', 'help');
        if (this.tabs.passives) this.tabs.passives.textContent = this.game.t('passivesTab', 'help');
        if (this.tabs.weapons) this.tabs.weapons.textContent = this.game.t('weaponsTab', 'help');

        // Update close button
        if (this.closeButton) this.closeButton.textContent = this.game.t('closeButton', 'help');

        // Update help hint
        const helpHint = this.element?.querySelector('.help-hint');
        if (helpHint) helpHint.textContent = this.game.t('helpHint', 'help');

        // Update How To content
        this.updateHowToContent();

        // Re-populate lists with translated content
        this.populatePassivesList();
        this.populateWeaponsList();
    }

    updateHowToContent() {
        const howToPane = this.panes.howto;
        if (!howToPane || !this.game?.t) return;

        const t = (key) => this.game.t(key, 'help');

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

    onClose(callback) {
        this.onCloseCallback = callback;
    }

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
        });
    }

    switchTab(tab) {
        if (!this.panes[tab] || !this.tabs[tab]) return;

        Object.values(this.panes).forEach((pane) => {
            if (pane) pane.style.display = 'none';
        });
        Object.values(this.tabs).forEach((btn) => {
            if (btn) btn.classList.remove('active');
        });

        this.panes[tab].style.display = 'block';
        this.tabs[tab].classList.add('active');
        this.activeTab = tab;

        const content = this.element?.querySelector('.guide-content');
        if (content) {
            content.scrollTop = 0;
        }
    }

    show() {
        if (!this.element) {
            console.warn('[GuideModal] show called but element missing');
            return;
        }
        console.log('[GuideModal] show');

        // Move overlay to body to avoid parent layout/visibility interference
        if (this.element.parentNode !== document.body) {
            document.body.appendChild(this.element);
        }

        // Force overlay styling inline to avoid CSS collisions
        Object.assign(this.element.style, {
            display: 'flex',
            position: 'fixed',
            inset: '0',
            width: '100vw',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.82)',
            zIndex: '200000',
            pointerEvents: 'auto'
        });
        this.visible = true;
        this.element.classList.add('active');
        this.onShow();
        const rect = this.element.getBoundingClientRect();
        console.log('[GuideModal] rect', rect);
        setTimeout(() => {
            const postRect = this.element.getBoundingClientRect();
            console.log('[GuideModal] rect after reflow', postRect);
        }, 0);
    }

    hide() {
        if (!this.element) {
            console.warn('[GuideModal] hide called but element missing');
            return;
        }
        console.log('[GuideModal] hide');
        this.visible = false;
        this.element.style.display = 'none';
        this.element.style.pointerEvents = 'none';
        this.element.classList.remove('active');
        this.onHide();

        const startOverlay = document.getElementById('survivor-start-overlay');
        if (startOverlay) {
            startOverlay.style.removeProperty('pointer-events');
            startOverlay.style.removeProperty('opacity');
        }
    }

    onShow() {
        this.setupKeyboardHandlers();
        const content = this.element?.querySelector('.guide-content');
        if (content) {
            Object.assign(content.style, {
                display: 'block',
                position: 'relative',
                opacity: '1',
                zIndex: '200001',
                maxHeight: '80vh'
            });
            content.setAttribute('tabindex', '-1');
            content.focus({ preventScroll: true });
            content.scrollTop = 0;
        }
        this.buttonNavigationMode = false;
        this.keyboardUsed = false;
        if (this.closeButton) {
            this.closeButton.classList.remove('menu-selected');
        }
    }

    onHide() {
        this.cleanupKeyboardHandlers();
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    populatePassivesList() {
        const container = this.element?.querySelector('#guide-passives-list');
        if (!container) return;
        container.innerHTML = '';

        this.addSectionHeader(container, 'uniquePassivesHeader');
        this.getOrderedUniquePassives().forEach((passiveId) => {
            const config = PASSIVES[passiveId.toUpperCase()] || {};
            container.appendChild(this.createPassiveItem(passiveId, config));
        });

        this.addSectionHeader(container, 'stackablePassivesHeader');
        this.getOrderedStackablePassives().forEach((passiveId) => {
            const config = PASSIVES[passiveId.toUpperCase()] || {};
            container.appendChild(this.createPassiveItem(passiveId, config));
        });
    }

    populateWeaponsList() {
        const container = this.element?.querySelector('#guide-weapons-list');
        if (!container) return;
        container.innerHTML = '';

        this.addSectionHeader(container, 'mergerWeaponsHeader');
        this.getOrderedMergeWeapons().forEach(({ type, recipe, description }) => {
            container.appendChild(this.createWeaponItem(type, { recipe, description }));
        });

        this.addSectionHeader(container, 'evolutionWeaponsHeader');
        container.appendChild(
            this.createWeaponItem('rapid', {
                description: this.game?.t?.('rapidFireEvolutionDesc', 'help') || 'Basic Missile evolves at level 5 into Rapid Fire with blazing speed.'
            })
        );

        this.addSectionHeader(container, 'baseWeaponsHeader');
        this.getOrderedBaseWeapons().forEach((type) => {
            container.appendChild(this.createWeaponItem(type));
        });
    }

    createPassiveItem(passiveId, config = {}) {
        const item = document.createElement('div');
        item.className = 'passive-item';

        const iconHtml = this.game?.getPassiveIcon?.(passiveId) || '';
        const name = this.getPassiveName(passiveId, config);
        const stackInfo = this.getPassiveStackInfo(passiveId, config);
        if (config.isUnique || this.getOrderedUniquePassives().includes(passiveId)) {
            item.classList.add('unique-passive');
        }

        item.innerHTML = `
            <div class="passive-icon">${iconHtml}</div>
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

        const iconHtml = this.game?.getWeaponIcon?.(type) || '';
        const name = this.game?.getWeaponName?.(type) || this.getWeaponNameFromConfig(type);
        const desc = description || this.game?.getWeaponDescription?.(type) || '';

        const recipeHtml = recipe ? `<div class="weapon-recipe">${recipe}</div>` : '';

        item.innerHTML = `
            <div class="weapon-icon">${iconHtml}</div>
            <div class="weapon-details">
                <div class="weapon-name">${name}</div>
                ${recipeHtml}
                <div class="weapon-desc">${desc}</div>
            </div>
        `;

        return item;
    }

    addSectionHeader(container, translationKey) {
        const header = document.createElement('div');
        header.className = 'section-header';
        header.textContent = this.game?.t?.(translationKey, 'help') || translationKey;
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
        if (!this.game?.t) {
            // Fallback to English
            return [
                { type: 'homing_laser', recipe: 'Laser lvl 3 + Homing Missiles lvl 3', description: 'Heat-seeking laser beams.' },
                { type: 'shockburst', recipe: 'Lightning lvl 3 + Plasma lvl 3', description: 'Explosive energy bursts.' },
                { type: 'gatling_gun', recipe: 'Rapid Fire lvl 5 + Spread Shot lvl 3', description: 'Multi-barrel rapid fire.' }
            ];
        }

        const t = (key) => this.game.t(key, 'help');
        return [
            { type: 'homing_laser', recipe: t('homingLaserRecipe'), description: t('homingLaserDesc') },
            { type: 'shockburst', recipe: t('shockburstRecipe'), description: t('shockburstDesc') },
            { type: 'gatling_gun', recipe: t('gatlingGunRecipe'), description: t('gatlingGunDesc') }
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

    getPassiveName(passiveId, config = {}) {
        const translationKey = PASSIVE_TRANSLATION_KEY_MAP[passiveId] || passiveId;
        if (this.game?.t) {
            const translated = this.game.t(translationKey, 'passives');
            if (translated) return translated;
        }
        return config.name || this.formatTitleCase(passiveId);
    }

    getPassiveDescription(passiveId, config = {}) {
        const translationKey = `${PASSIVE_TRANSLATION_KEY_MAP[passiveId] || passiveId}Desc`;
        if (this.game?.t) {
            const translated = this.game.t(translationKey, 'passives');
            if (translated) return translated;
        }
        return config.description || '';
    }

    getPassiveStackInfo(passiveId, config = {}) {
        if (!this.game?.t) return '';
        const t = (key) => this.game.t(key, 'help');

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

    getWeaponNameFromConfig(type) {
        const key = Object.entries(WEAPON_KEY_TO_TYPE).find(([, value]) => value === type)?.[0];
        const config = key ? WEAPONS[key] : null;
        if (config?.name) return config.name;
        return this.formatTitleCase(type);
    }

    formatTitleCase(text) {
        return text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    setupKeyboardHandlers() {
        this.cleanupKeyboardHandlers();
        this.keyboardHandler = (e) => {
            if (!this.visible) return;
            const key = e.key.toLowerCase();
            if (['arrowleft', 'arrowright'].includes(key)) {
                e.preventDefault();
                const order = ['howto', 'passives', 'weapons'];
                const idx = order.indexOf(this.activeTab);
                const delta = key === 'arrowleft' ? -1 : 1;
                const next = order[(idx + delta + order.length) % order.length];
                this.switchTab(next);
            } else if (['a', 'd'].includes(key)) {
                e.preventDefault();
                const order = ['howto', 'passives', 'weapons'];
                const idx = order.indexOf(this.activeTab);
                const delta = key === 'a' ? -1 : 1;
                const next = order[(idx + delta + order.length) % order.length];
                this.switchTab(next);
            } else if (key === 'escape') {
                e.preventDefault();
                this.hide();
            } else if (key === 'arrowup' || key === 'w') {
                e.preventDefault();
                this.scrollContent('up');
            } else if (key === 'arrowdown' || key === 's') {
                e.preventDefault();
                this.scrollContent('down');
            } else if ((key === 'enter' || key === ' ') && document.activeElement === this.closeButton) {
                e.preventDefault();
                this.hide();
            }
        };
        document.addEventListener('keydown', this.keyboardHandler, { capture: true });
    }

    cleanupKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
            this.keyboardHandler = null;
        }
    }

    scrollContent(direction) {
        if (!this.contentElement) return;

        if (this.buttonNavigationMode) {
            if (direction === 'up') {
                this.buttonNavigationMode = false;
                this.keyboardUsed = false;
                if (this.closeButton) {
                    this.closeButton.classList.remove('menu-selected');
                }
                this.contentElement.focus({ preventScroll: true });
            }
            return;
        }

        const activePane = this.panes[this.activeTab];
        const target = activePane && activePane.scrollHeight > activePane.clientHeight ? activePane : this.contentElement;
        if (!target) return;

        const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 5;
        const isAtTop = target.scrollTop <= 5;

        if (direction === 'down' && isAtBottom) {
            this.buttonNavigationMode = true;
            this.keyboardUsed = true;
            if (this.closeButton) {
                this.closeButton.classList.add('menu-selected');
                this.closeButton.focus({ preventScroll: true });
            }
            return;
        }

        if (direction === 'up' && isAtTop) {
            return;
        }

        const amount = 60;
        target.scrollBy({ top: direction === 'up' ? -amount : amount, behavior: 'smooth' });
    }

    highlightCloseButton() {
        if (!this.closeButton) return;
        this.closeButton.classList.add('menu-selected');
        this.closeButton.focus({ preventScroll: true });
    }

    clearButtonSelection() {
        if (!this.closeButton) return;
        this.closeButton.classList.remove('menu-selected');
    }
}
