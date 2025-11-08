/**
 * Weapon System
 * Manages weapon creation, upgrades, and firing logic
 * Extracted from vibe-survivor-game.js during Phase 9 refactoring
 */

import { WEAPONS, WEAPON_UPGRADES } from '../../../config/constants.js';

/**
 * WeaponSystem - Manages all weapon-related operations
 */
export class WeaponSystem {
    constructor() {
        // No internal state - operates on weapons array passed to methods
    }

    /**
     * Creates a new weapon with default properties
     * @param {string} type - Weapon type (basic, spread, laser, etc.)
     * @returns {Object} Weapon object
     */
    createWeapon(type) {
        const config = WEAPONS[type.toUpperCase()];

        if (!config) {
            console.error(`Unknown weapon type: ${type}`);
            return null;
        }

        return {
            type: type,
            name: config.name,
            level: 1,
            damage: config.damage,
            fireRate: config.fireRate,
            range: config.range,
            projectileSpeed: config.projectileSpeed,
            piercing: config.piercing || 0,
            homing: config.homing || false,
            explosionRadius: config.explosionRadius || 0,
            instant: config.instant || false,
            spreadCount: config.spreadCount || 0,
            spreadAngle: config.spreadAngle || 0,
            pelletCount: config.pelletCount || 0,
            lastFire: 0,
            projectileCount: 1
        };
    }

    /**
     * Upgrades a weapon to the next level
     * @param {Object} weapon - Weapon to upgrade
     */
    upgradeWeapon(weapon) {
        if (weapon.level >= WEAPON_UPGRADES.MAX_LEVEL) {
            console.warn(`Weapon ${weapon.type} is already at max level`);
            return;
        }

        weapon.level++;

        // Increase damage by 30% per level
        weapon.damage = Math.floor(weapon.damage * (1 + WEAPON_UPGRADES.DAMAGE_PER_LEVEL));

        // Some weapons get additional projectiles at higher levels
        if (weapon.level % 2 === 0 && weapon.type !== 'laser' && weapon.type !== 'railgun') {
            weapon.projectileCount++;
        }
    }

    /**
     * Updates all weapons (cooldowns)
     * @param {Array} weapons - Array of weapon objects
     */
    updateWeapons(weapons) {
        weapons.forEach(weapon => {
            weapon.lastFire++;
        });
    }

    /**
     * Checks if weapon can fire
     * @param {Object} weapon - Weapon to check
     * @returns {boolean} True if weapon can fire
     */
    canFire(weapon) {
        return weapon.lastFire >= weapon.fireRate;
    }

    /**
     * Resets weapon fire cooldown
     * @param {Object} weapon - Weapon that fired
     */
    resetFireCooldown(weapon) {
        weapon.lastFire = 0;
    }

    /**
     * Gets weapon display info for UI
     * @param {Object} weapon - Weapon object
     * @returns {Object} Display information
     */
    getWeaponInfo(weapon) {
        return {
            name: weapon.name,
            type: weapon.type,
            level: weapon.level,
            damage: weapon.damage,
            fireRate: weapon.fireRate,
            range: weapon.range,
            isMaxLevel: weapon.level >= WEAPON_UPGRADES.MAX_LEVEL
        };
    }

    /**
     * Checks if weapons can be merged
     * @param {Object} weapon1 - First weapon
     * @param {Object} weapon2 - Second weapon
     * @returns {string|null} Merged weapon type or null if can't merge
     */
    canMerge(weapon1, weapon2) {
        // Basic + Laser = Homing Laser
        if ((weapon1.type === 'basic' && weapon2.type === 'laser') ||
            (weapon1.type === 'laser' && weapon2.type === 'basic')) {
            return 'homing_laser';
        }

        // Spread + Plasma = Shockburst
        if ((weapon1.type === 'spread' && weapon2.type === 'plasma') ||
            (weapon1.type === 'plasma' && weapon2.type === 'spread')) {
            return 'shockburst';
        }

        // Basic + Shotgun = Gatling
        if ((weapon1.type === 'basic' && weapon2.type === 'shotgun') ||
            (weapon1.type === 'shotgun' && weapon2.type === 'basic')) {
            return 'gatling';
        }

        return null;
    }

    /**
     * Merges two weapons into a new evolved weapon
     * @param {Array} weapons - Weapons array
     * @param {number} index1 - Index of first weapon
     * @param {number} index2 - Index of second weapon
     * @returns {boolean} True if merge was successful
     */
    mergeWeapons(weapons, index1, index2) {
        const weapon1 = weapons[index1];
        const weapon2 = weapons[index2];

        const mergedType = this.canMerge(weapon1, weapon2);

        if (!mergedType) {
            return false;
        }

        // Create new merged weapon
        const mergedWeapon = this.createWeapon(mergedType);

        // Inherit the higher level
        mergedWeapon.level = Math.max(weapon1.level, weapon2.level);

        // Remove old weapons (remove higher index first to avoid index shift)
        const removeFirst = Math.max(index1, index2);
        const removeSecond = Math.min(index1, index2);
        weapons.splice(removeFirst, 1);
        weapons.splice(removeSecond, 1);

        // Add merged weapon
        weapons.push(mergedWeapon);

        return true;
    }

    /**
     * Resets weapon system state
     */
    reset() {
        // No internal state to reset
    }
}
