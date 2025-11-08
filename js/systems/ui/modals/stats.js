/**
 * Stats Modal
 * Player statistics and achievements
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * StatsModal - Displays player statistics
 */
export class StatsModal extends Modal {
    constructor(id = 'stats-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: false });
        this.closeButton = null;
    }

    /**
     * Initializes stats modal elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.closeButton = this.element.querySelector('.stats-close-btn');
            if (this.closeButton) {
                this.closeButton.addEventListener('click', () => this.hide());
            }
        }
        return result;
    }

    /**
     * Updates modal with player statistics
     * @param {Object} data - Stats data
     * @param {number} data.level - Current level
     * @param {number} data.xp - Current XP
     * @param {number} data.health - Current health
     * @param {number} data.maxHealth - Maximum health
     * @param {number} data.enemiesKilled - Total enemies killed
     * @param {number} data.bossesKilled - Total bosses killed
     * @param {number} data.damageDealt - Total damage dealt
     * @param {number} data.damageTaken - Total damage taken
     * @param {number} data.survivalTime - Time survived in seconds
     */
    update(data) {
        if (!data) return;

        // Update basic stats
        this.updateStat('stats-level', data.level);
        this.updateStat('stats-xp', data.xp);
        this.updateStat('stats-health', `${Math.floor(data.health)} / ${data.maxHealth}`);

        // Update combat stats
        this.updateStat('stats-enemies-killed', data.enemiesKilled || 0);
        this.updateStat('stats-bosses-killed', data.bossesKilled || 0);
        this.updateStat('stats-damage-dealt', data.damageDealt || 0);
        this.updateStat('stats-damage-taken', data.damageTaken || 0);

        // Update survival time
        if (data.survivalTime !== undefined) {
            const minutes = Math.floor(data.survivalTime / 60);
            const seconds = Math.floor(data.survivalTime % 60);
            this.updateStat('stats-survival-time', `${minutes}:${seconds.toString().padStart(2, '0')}`);
        }

        // Update weapons acquired
        if (data.weapons) {
            this.updateWeaponsList(data.weapons);
        }

        // Update passives acquired
        if (data.passives) {
            this.updatePassivesList(data.passives);
        }
    }

    /**
     * Updates a stat element
     * @param {string} statId - Stat element ID or class
     * @param {string|number} value - Stat value
     */
    updateStat(statId, value) {
        const element = this.element?.querySelector(`#${statId}, .${statId}`);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Updates weapons list
     * @param {Array} weapons - Weapons array
     */
    updateWeaponsList(weapons) {
        const weaponsContainer = this.element?.querySelector('.stats-weapons-list');
        if (!weaponsContainer) return;

        const weaponsHTML = weapons.map(weapon => `
            <li>${weapon.name} (Lv${weapon.level})</li>
        `).join('');

        weaponsContainer.innerHTML = `<ul>${weaponsHTML}</ul>`;
    }

    /**
     * Updates passives list
     * @param {Object} passives - Passives object
     */
    updatePassivesList(passives) {
        const passivesContainer = this.element?.querySelector('.stats-passives-list');
        if (!passivesContainer) return;

        const passiveEntries = Object.entries(passives);
        const passivesHTML = passiveEntries.map(([key, stacks]) => `
            <li>${this.getPassiveName(key)} x${stacks}</li>
        `).join('');

        passivesContainer.innerHTML = `<ul>${passivesHTML}</ul>`;
    }

    /**
     * Gets display name for passive
     * @param {string} passiveKey - Passive key
     * @returns {string} Display name
     */
    getPassiveName(passiveKey) {
        const names = {
            'health_boost': 'Health Boost',
            'speed_boost': 'Speed Boost',
            'regeneration': 'Regeneration',
            'magnet': 'Magnet',
            'armor': 'Armor',
            'critical': 'Critical Hit',
            'dash_boost': 'Dash Boost'
        };
        return names[passiveKey] || passiveKey;
    }

    /**
     * Shows stats modal
     */
    onShow() {
        // Scroll to top when showing stats
        const scrollContainer = this.element?.querySelector('.stats-scroll-content');
        if (scrollContainer) {
            scrollContainer.scrollTop = 0;
        }
    }
}
