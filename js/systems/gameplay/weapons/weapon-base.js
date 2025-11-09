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
            isMergeWeapon: config.isMergeWeapon || false,
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

        // Projectile count increases every level from level 2 onwards
        // Game-specific behavior: more generous than every-other-level
        if (weapon.level === 2 && (!weapon.projectileCount || weapon.projectileCount === 1)) {
            // Double projectile count at level 2
            weapon.projectileCount = 2;
        } else if (weapon.level >= 2 && weapon.projectileCount && weapon.projectileCount < 5) {
            // Increment each level, capped at 5
            weapon.projectileCount = Math.min(weapon.projectileCount + 1, 5);
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
        // Laser + Missiles (both level 3+) = Homing Laser
        if ((weapon1.type === 'laser' && weapon2.type === 'missiles' && weapon1.level >= 3 && weapon2.level >= 3) ||
            (weapon1.type === 'missiles' && weapon2.type === 'laser' && weapon1.level >= 3 && weapon2.level >= 3)) {
            return 'homing_laser';
        }

        // Lightning + Plasma (both level 3+) = Shockburst
        if ((weapon1.type === 'lightning' && weapon2.type === 'plasma' && weapon1.level >= 3 && weapon2.level >= 3) ||
            (weapon1.type === 'plasma' && weapon2.type === 'lightning' && weapon1.level >= 3 && weapon2.level >= 3)) {
            return 'shockburst';
        }

        // Rapid Fire (level 5+) + Spread Shot (level 3+) = Gatling Gun
        if ((weapon1.type === 'rapid' && weapon2.type === 'spread' && weapon1.level >= 5 && weapon2.level >= 3) ||
            (weapon1.type === 'spread' && weapon2.type === 'rapid' && weapon1.level >= 3 && weapon2.level >= 5)) {
            return 'gatling_gun';
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

        // Start at level 1 but with 4 projectiles for power
        mergedWeapon.level = 1;
        mergedWeapon.projectileCount = 4;

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
