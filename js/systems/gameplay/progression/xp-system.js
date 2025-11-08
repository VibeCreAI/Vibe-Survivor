/**
 * XP and Leveling System
 * Manages player experience points and level progression
 * Extracted from vibe-survivor-game.js during Phase 9 refactoring
 */

import { XP_SYSTEM, PLAYER } from '../../../config/constants.js';

/**
 * XPSystem - Manages XP collection and level progression
 */
export class XPSystem {
    constructor() {
        // No internal state - operates on player object passed to methods
    }

    /**
     * Calculates XP required for a given level
     * @param {number} level - Current level
     * @returns {number} XP required to reach next level
     */
    getXPForLevel(level) {
        return XP_SYSTEM.getXPForLevel(level);
    }

    /**
     * Adds XP to player
     * @param {Object} player - Player state object
     * @param {number} amount - XP amount to add
     */
    addXP(player, amount) {
        player.xp += amount;
    }

    /**
     * Checks if player should level up
     * NOTE: Level up logic is in PlayerSystem.checkLevelUp()
     * This method just provides helper calculations
     * @param {Object} player - Player state object
     * @returns {boolean} True if player has enough XP to level up
     */
    canLevelUp(player) {
        const xpRequired = this.getXPForLevel(player.level);
        return player.xp >= xpRequired;
    }

    /**
     * Gets level progress as a percentage
     * @param {Object} player - Player state object
     * @returns {number} Progress from 0 to 1
     */
    getLevelProgress(player) {
        const xpRequired = this.getXPForLevel(player.level);
        return Math.min(player.xp / xpRequired, 1.0);
    }

    /**
     * Gets current XP display info
     * @param {Object} player - Player state object
     * @returns {Object} XP display information
     */
    getXPInfo(player) {
        const xpRequired = this.getXPForLevel(player.level);
        const progress = this.getLevelProgress(player);

        return {
            current: player.xp,
            required: xpRequired,
            level: player.level,
            progress: progress,
            progressPercent: Math.floor(progress * 100)
        };
    }

    /**
     * Resets XP system state
     */
    reset() {
        // No internal state to reset
    }
}
