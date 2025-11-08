/**
 * Victory Modal
 * Victory/boss defeated celebration screen
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * VictoryModal - Displays victory screen after major achievements
 */
export class VictoryModal extends Modal {
    constructor(id = 'victory-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: false });
        this.continueButton = null;
        this.exitButton = null;
        this.onContinueCallback = null;
        this.onExitCallback = null;
    }

    /**
     * Initializes victory modal elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.continueButton = this.element.querySelector('.victory-continue-btn');
            this.exitButton = this.element.querySelector('.victory-exit-btn');

            if (this.continueButton) {
                this.continueButton.addEventListener('click', () => this.handleContinue());
            }
            if (this.exitButton) {
                this.exitButton.addEventListener('click', () => this.handleExit());
            }
        }
        return result;
    }

    /**
     * Sets callback for continue action
     * @param {Function} callback - Continue callback
     */
    onContinue(callback) {
        this.onContinueCallback = callback;
    }

    /**
     * Sets callback for exit action
     * @param {Function} callback - Exit callback
     */
    onExit(callback) {
        this.onExitCallback = callback;
    }

    /**
     * Updates modal with victory details
     * @param {Object} data - Victory data
     * @param {string} data.title - Victory title (e.g., "Boss Defeated!")
     * @param {string} data.message - Victory message
     * @param {number} data.bossLevel - Boss level defeated
     * @param {Object} data.rewards - Rewards earned
     * @param {Object} data.stats - Achievement stats
     */
    update(data) {
        if (!data) return;

        // Update victory title
        this.updateElement('.victory-title', data.title || 'Victory!');

        // Update victory message
        this.updateElement('.victory-message', data.message || 'Congratulations!');

        // Update boss level
        if (data.bossLevel) {
            this.updateElement('.victory-boss-level', `Boss Level ${data.bossLevel}`);
        }

        // Update rewards
        if (data.rewards) {
            this.updateRewards(data.rewards);
        }

        // Update stats
        if (data.stats) {
            this.updateStats(data.stats);
        }
    }

    /**
     * Updates an element's text content
     * @param {string} selector - Element selector
     * @param {string} text - Text content
     */
    updateElement(selector, text) {
        const element = this.element?.querySelector(selector);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Updates rewards section
     * @param {Object} rewards - Rewards object
     */
    updateRewards(rewards) {
        const rewardsContainer = this.element?.querySelector('.victory-rewards');
        if (!rewardsContainer) return;

        const rewardsHTML = Object.entries(rewards).map(([key, value]) => `
            <div class="victory-reward-item">
                <span class="reward-name">${this.getRewardName(key)}</span>
                <span class="reward-value">+${value}</span>
            </div>
        `).join('');

        rewardsContainer.innerHTML = rewardsHTML || '<p>No rewards</p>';
    }

    /**
     * Gets display name for reward
     * @param {string} rewardKey - Reward key
     * @returns {string} Display name
     */
    getRewardName(rewardKey) {
        const names = {
            'xp': 'Experience',
            'gold': 'Gold',
            'health': 'Health',
            'powerup': 'Power-Up'
        };
        return names[rewardKey] || rewardKey;
    }

    /**
     * Updates stats section
     * @param {Object} stats - Stats object
     */
    updateStats(stats) {
        const statsContainer = this.element?.querySelector('.victory-stats');
        if (!statsContainer) return;

        const statsHTML = Object.entries(stats).map(([key, value]) => `
            <div class="victory-stat-item">
                <span class="stat-name">${this.getStatName(key)}</span>
                <span class="stat-value">${value}</span>
            </div>
        `).join('');

        statsContainer.innerHTML = statsHTML;
    }

    /**
     * Gets display name for stat
     * @param {string} statKey - Stat key
     * @returns {string} Display name
     */
    getStatName(statKey) {
        const names = {
            'timeTaken': 'Time Taken',
            'damageDealt': 'Damage Dealt',
            'hits': 'Hits',
            'accuracy': 'Accuracy'
        };
        return names[statKey] || statKey;
    }

    /**
     * Handles continue button click
     */
    handleContinue() {
        if (this.onContinueCallback) {
            this.onContinueCallback();
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
     * Shows victory modal
     */
    onShow() {
        if (this.continueButton) {
            this.continueButton.focus();
        }
    }
}
