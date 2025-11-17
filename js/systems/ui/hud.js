/**
 * HUD (Heads-Up Display) System
 * Manages on-screen UI elements like health, XP, time, weapons
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

/**
 * HUDSystem - Manages all HUD elements
 */
export class HUDSystem {
    constructor() {
        // Element references (lazy-loaded)
        this.elements = {
            healthFill: null,
            healthText: null,
            xpFill: null,
            levelText: null,
            timeDisplay: null,
            passiveDisplay: null,
            weaponDisplay: null,
            bossDisplay: null
        };

        this.uniquePassiveKeys = new Set([
            'regeneration',
            'turbo_flux_cycler',
            'aegis_impact_core',
            'splitstream_matrix',
            'macro_charge_amplifier',
            'mod_bay_expander'
        ]);
    }

    /**
     * Initializes HUD by finding DOM elements
     */
    init() {
        this.elements.healthFill = document.getElementById('header-health-fill');
        this.elements.healthText = document.getElementById('header-health-text');
        this.elements.xpFill = document.getElementById('header-xp-fill');
        this.elements.levelText = document.getElementById('header-level-text');
        this.elements.timeDisplay = document.getElementById('header-time-display');
        this.elements.passiveDisplay = document.getElementById('header-passive-display');
        this.elements.weaponDisplay = document.getElementById('header-weapon-display');
        this.elements.bossDisplay = document.getElementById('header-boss-display');
    }

    /**
     * Updates all HUD elements
     * @param {Object} gameState - Current game state
     * @param {Function} getWeaponIconCallback - Callback to get weapon icon
     * @param {Function} getWeaponNameCallback - Callback to get weapon name
     * @param {Function} getPassiveIconCallback - Callback to get passive icon
     */
    updateAll(gameState, getWeaponIconCallback, getWeaponNameCallback, getPassiveIconCallback) {
        this.updateHealth(gameState.player);
        this.updateXP(gameState.player);
        this.updateTime(gameState.game.gameTime);
        const maxWeaponSlots = gameState.game?.maxWeaponSlots;
        this.updateWeapons(gameState.weapons, getWeaponIconCallback, getWeaponNameCallback, maxWeaponSlots);
        this.updatePassives(gameState.player.passives, getPassiveIconCallback);
        this.updateBossCounter(gameState.game.bossesKilled);
    }

    /**
     * Updates health bar and text
     * @param {Object} player - Player state
     */
    updateHealth(player) {
        if (!this.elements.healthFill || !this.elements.healthText) return;

        const healthPercent = (player.health / player.maxHealth) * 100;
        this.elements.healthFill.style.width = `${Math.max(0, healthPercent)}%`;
        this.elements.healthText.textContent = `${Math.max(0, Math.floor(player.health))}`;

        // Color-changing health bar
        const healthRatio = player.health / player.maxHealth;
        const healthColor = healthRatio > 0.5 ? '#00ff00' : healthRatio > 0.25 ? '#ffff00' : '#ff0000';
        this.elements.healthFill.style.backgroundColor = healthColor;
    }

    /**
     * Updates XP bar and level text
     * @param {Object} player - Player state
     */
    updateXP(player) {
        if (!this.elements.xpFill || !this.elements.levelText) return;

        const xpRequired = player.level * 5 + 10;
        const xpPercent = (player.xp / xpRequired) * 100;
        this.elements.xpFill.style.width = `${xpPercent}%`;
        this.elements.levelText.textContent = `Lv${player.level}`;
    }

    /**
     * Updates time display
     * @param {number} gameTime - Current game time in seconds
     */
    updateTime(gameTime) {
        if (!this.elements.timeDisplay) return;

        const minutes = Math.floor(gameTime / 60);
        const seconds = Math.floor(gameTime % 60);
        this.elements.timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Updates weapon display (4 slots)
     * @param {Array} weapons - Array of weapon objects
     * @param {Function} getWeaponIconCallback - Callback to get weapon icon URL
     * @param {Function} getWeaponNameCallback - Callback to get weapon display name
     */
    updateWeapons(weapons, getWeaponIconCallback, getWeaponNameCallback, dynamicSlotCount) {
        if (!this.elements.weaponDisplay) return;

        const maxWeaponSlots = Math.max(1, dynamicSlotCount || 4);
        const weaponSlots = [];

        // Fill slots with acquired weapons
        for (let i = 0; i < maxWeaponSlots; i++) {
            if (i < weapons.length) {
                const weapon = weapons[i];
                const isMergeWeapon = weapon.isMergeWeapon || (weapon.type && weapon.type.includes('homing_laser'));
                const mergeClass = isMergeWeapon ? ' header-weapon-merge' : '';
                const weaponIcon = getWeaponIconCallback(weapon.type);
                const weaponName = getWeaponNameCallback(weapon.type);
                const weaponLevel = Math.max(1, weapon.level || 1);

                weaponSlots.push(`
                    <div class="header-weapon-item header-slot${mergeClass}" title="${weaponName} Lv.${weaponLevel}">
                        <img src="${weaponIcon}" alt="${weaponName}" class="header-slot-icon header-weapon-icon">
                        <span class="header-slot-count header-weapon-text">x${weaponLevel}</span>
                    </div>
                `);
            } else {
                // Empty slot
                weaponSlots.push(`
                    <div class="header-slot header-weapon-empty">---</div>
                `);
            }
        }

        this.elements.weaponDisplay.innerHTML = weaponSlots.join('');
    }

    /**
     * Updates passive display chips
     * @param {Object} passives - Player passive state map
     * @param {Function} getPassiveIconCallback - Callback to get passive icon URL
     */
    updatePassives(passives = {}, getPassiveIconCallback) {
        if (!this.elements.passiveDisplay) return;

        const entries = [];
        const orderedKeys = [
            'health_boost',
            'speed_boost',
            'regeneration',
            'magnet',
            'armor',
            'critical',
            'dash_boost',
            'turbo_flux_cycler',
            'aegis_impact_core',
            'splitstream_matrix',
            'macro_charge_amplifier',
            'mod_bay_expander'
        ];

        const collectPassive = (key) => {
            const value = passives[key];
            const stacks = this.getPassiveStacks(value);
            if (stacks > 0) {
                entries.push({ key, stacks });
            }
        };

        orderedKeys.forEach(key => collectPassive(key));
        Object.keys(passives || {}).forEach(key => {
            if (!orderedKeys.includes(key)) {
                collectPassive(key);
            }
        });

        const passiveChips = entries.map(entry => {
            const icon = getPassiveIconCallback ? getPassiveIconCallback(entry.key) : '';
            const displayName = this.formatPassiveName(entry.key);
            const isUnique = this.uniquePassiveKeys.has(entry.key);
            const itemClass = `header-passive-item header-slot${isUnique ? ' header-passive-unique' : ''}`;
            return `
                <div class="${itemClass}" title="${displayName} x${entry.stacks}">
                    ${icon ? `<img src="${icon}" alt="${displayName}" class="header-slot-icon header-passive-icon">` : ''}
                    <span class="header-slot-count">x${entry.stacks}</span>
                </div>
            `;
        });

        this.elements.passiveDisplay.innerHTML = passiveChips.length ? passiveChips.join('') : '<div class="header-slot header-passive-empty">---</div>';
    }

    getPassiveStacks(value) {
        if (typeof value === 'number') return value;
        if (value && typeof value === 'object') {
            if (typeof value.stacks === 'number') return value.stacks;
            return 1;
        }
        if (value === true) return 1;
        return 0;
    }

    formatPassiveName(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    /**
     * Updates boss kill counter
     * @param {number} bossesKilled - Number of bosses defeated
     */
    updateBossCounter(bossesKilled) {
        if (!this.elements.bossDisplay) return;

        if (bossesKilled > 0) {
            this.elements.bossDisplay.style.display = 'block';
            this.elements.bossDisplay.textContent = `Boss x${bossesKilled}`;
        } else {
            this.elements.bossDisplay.style.display = 'none';
        }
    }

    /**
     * Shows the HUD
     */
    show() {
        Object.values(this.elements).forEach(element => {
            if (element && element.parentElement) {
                element.parentElement.style.display = 'block';
            }
        });
    }

    /**
     * Hides the HUD
     */
    hide() {
        Object.values(this.elements).forEach(element => {
            if (element && element.parentElement) {
                element.parentElement.style.display = 'none';
            }
        });
    }

    /**
     * Resets HUD to initial state
     */
    reset() {
        if (this.elements.healthFill) {
            this.elements.healthFill.style.width = '100%';
            this.elements.healthFill.style.backgroundColor = '#00ff00';
        }
        if (this.elements.healthText) {
            this.elements.healthText.textContent = '100';
        }
        if (this.elements.xpFill) {
            this.elements.xpFill.style.width = '0%';
        }
        if (this.elements.levelText) {
            this.elements.levelText.textContent = 'Lv1';
        }
        if (this.elements.timeDisplay) {
            this.elements.timeDisplay.textContent = '0:00';
        }
        if (this.elements.weaponDisplay) {
            this.elements.weaponDisplay.innerHTML = '';
        }
        if (this.elements.passiveDisplay) {
            this.elements.passiveDisplay.innerHTML = '';
        }
        if (this.elements.bossDisplay) {
            this.elements.bossDisplay.style.display = 'none';
        }
    }
}
