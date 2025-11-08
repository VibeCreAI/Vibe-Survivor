/**
 * Game Over Modal
 * Death screen with final stats and retry option
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * GameOverModal - Displays game over screen with stats
 */
export class GameOverModal extends Modal {
    constructor(id = 'game-over-modal') {
        super(id, { closeOnEscape: false, closeOnBackdropClick: false });
        this.restartButton = null;
        this.exitButton = null;
        this.onRestartCallback = null;
        this.onExitCallback = null;
    }

    /**
     * Initializes game over modal elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.restartButton = this.element.querySelector('.gameover-restart-btn');
            this.exitButton = this.element.querySelector('.gameover-exit-btn');

            if (this.restartButton) {
                this.restartButton.addEventListener('click', () => this.handleRestart());
            }
            if (this.exitButton) {
                this.exitButton.addEventListener('click', () => this.handleExit());
            }
        }
        return result;
    }

    /**
     * Sets callback for restart action
     * @param {Function} callback - Restart callback
     */
    onRestart(callback) {
        this.onRestartCallback = callback;
    }

    /**
     * Sets callback for exit action
     * @param {Function} callback - Exit callback
     */
    onExit(callback) {
        this.onExitCallback = callback;
    }

    /**
     * Updates modal with final game stats
     * @param {Object} data - Game over data
     * @param {number} data.level - Final level reached
     * @param {string} data.timeText - Time survived (formatted)
     * @param {number} data.enemiesKilled - Enemies defeated
     * @param {Array} data.weapons - Final weapons
     * @param {Object} data.passives - Final passives
     */
    update(data) {
        if (!data) return;

        // Update basic stats
        this.updateStat('final-level', data.level);
        this.updateStat('final-time', data.timeText);
        this.updateStat('enemies-killed', data.enemiesKilled);

        // Update weapons section
        if (data.weapons) {
            this.updateWeaponsSection(data.weapons);
        }

        // Update passives section
        if (data.passives) {
            this.updatePassivesSection(data.passives);
        }
    }

    /**
     * Updates a specific stat element
     * @param {string} statId - Stat element ID
     * @param {string|number} value - Stat value
     */
    updateStat(statId, value) {
        const element = this.element?.querySelector(`#${statId}, .${statId}`);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Updates weapons section
     * @param {Array} weapons - Final weapons array
     */
    updateWeaponsSection(weapons) {
        const weaponsContainer = this.element?.querySelector('.gameover-weapons');
        if (!weaponsContainer) return;

        const weaponsHTML = weapons.map(weapon => `
            <div class="gameover-weapon-item">
                <span class="weapon-name">${weapon.name}</span>
                <span class="weapon-level">Lv${weapon.level}</span>
            </div>
        `).join('');

        weaponsContainer.innerHTML = weaponsHTML || '<p>No weapons acquired</p>';
    }

    /**
     * Updates passives section
     * @param {Object} passives - Final passives object
     */
    updatePassivesSection(passives) {
        const passivesContainer = this.element?.querySelector('.gameover-passives');
        if (!passivesContainer) return;

        const passiveEntries = Object.entries(passives);
        const passivesHTML = passiveEntries.map(([key, stacks]) => `
            <div class="gameover-passive-item">
                <span class="passive-name">${this.getPassiveName(key)}</span>
                <span class="passive-stacks">x${stacks}</span>
            </div>
        `).join('');

        passivesContainer.innerHTML = passivesHTML || '<p>No passives acquired</p>';
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
     * Handles restart button click
     */
    handleRestart() {
        if (this.onRestartCallback) {
            this.onRestartCallback();
        }
        this.hide();
    }

    /**
     * Handles exit button click
     */
    handleExit() {
        if (this.onExitCallback) {
            this.onExitCallback();
        }
        this.hide();
    }

    /**
     * Shows game over modal
     */
    onShow() {
        if (this.restartButton) {
            this.restartButton.focus();
        }
    }
}
