/**
 * Upgrade System
 * Manages weapon and passive ability upgrades
 * Extracted from vibe-survivor-game.js during Phase 9 refactoring
 */

import { WEAPONS, PASSIVES, WEAPON_UPGRADES } from '../../../config/constants.js';

/**
 * UpgradeSystem - Manages upgrade choices and passive abilities
 */
export class UpgradeSystem {
    constructor() {
        // No internal state - operates on data passed to methods
    }

    /**
     * Gets available upgrade choices for level up
     * @param {Array} weapons - Current weapons
     * @param {Object} passives - Current passives
     * @param {number} choiceCount - Number of choices to offer (default: 3)
     * @returns {Array} Array of upgrade choice objects
     */
    getUpgradeChoices(weapons, passives, choiceCount = 3) {
        const choices = [];
        const availableWeapons = Object.keys(WEAPONS);
        const availablePassives = Object.keys(PASSIVES);

        // Build pool of possible upgrades
        const upgradePool = [];

        // Add existing weapon upgrades (if not max level)
        weapons.forEach(weapon => {
            if (weapon.level < WEAPON_UPGRADES.MAX_LEVEL) {
                upgradePool.push({
                    type: 'weapon_upgrade',
                    weaponType: weapon.type,
                    weaponName: weapon.name,
                    currentLevel: weapon.level,
                    id: `upgrade_${weapon.type}`
                });
            }
        });

        // Add new weapons (if not at max weapons and weapon not already owned)
        if (weapons.length < WEAPON_UPGRADES.MAX_WEAPONS) {
            availableWeapons.forEach(weaponKey => {
                const weaponType = weaponKey.toLowerCase();
                const hasWeapon = weapons.some(w => w.type === weaponType);

                if (!hasWeapon) {
                    upgradePool.push({
                        type: 'weapon_new',
                        weaponType: weaponType,
                        weaponName: WEAPONS[weaponKey].name,
                        id: `new_${weaponType}`
                    });
                }
            });
        }

        // Add passives
        availablePassives.forEach(passiveKey => {
            const passive = PASSIVES[passiveKey];
            const passiveId = passiveKey.toLowerCase();
            const currentStacks = passives[passiveId] || 0;

            // Check if passive can be added/stacked
            if (!passive.stackable && currentStacks > 0) {
                return; // Skip non-stackable passives that are already acquired
            }

            if (passive.maxStacks && currentStacks >= passive.maxStacks) {
                return; // Skip passives at max stacks
            }

            upgradePool.push({
                type: 'passive',
                passiveKey: passiveId,
                passiveName: passive.name,
                passiveDescription: passive.description,
                currentStacks: currentStacks,
                maxStacks: passive.maxStacks || Infinity,
                id: `passive_${passiveId}`
            });
        });

        // Randomly select choices from pool
        const poolCopy = [...upgradePool];
        while (choices.length < choiceCount && poolCopy.length > 0) {
            const randomIndex = Math.floor(Math.random() * poolCopy.length);
            choices.push(poolCopy.splice(randomIndex, 1)[0]);
        }

        return choices;
    }

    /**
     * Applies a selected upgrade
     * @param {Object} choice - Selected upgrade choice
     * @param {Array} weapons - Weapons array
     * @param {Object} passives - Passives object
     * @param {Object} player - Player object (for passive effects)
     * @param {Function} createWeaponCallback - Callback to create new weapon
     */
    applyUpgrade(choice, weapons, passives, player, createWeaponCallback) {
        switch (choice.type) {
            case 'weapon_upgrade':
                this.upgradeWeapon(choice.weaponType, weapons);
                break;

            case 'weapon_new':
                this.addNewWeapon(choice.weaponType, weapons, createWeaponCallback);
                break;

            case 'passive':
                this.addPassive(choice.passiveKey, passives, player);
                break;

            default:
                console.warn('Unknown upgrade type:', choice.type);
        }
    }

    /**
     * Upgrades an existing weapon
     * @param {string} weaponType - Type of weapon to upgrade
     * @param {Array} weapons - Weapons array
     */
    upgradeWeapon(weaponType, weapons) {
        const weapon = weapons.find(w => w.type === weaponType);

        if (!weapon) {
            console.error(`Weapon ${weaponType} not found`);
            return;
        }

        if (weapon.level >= WEAPON_UPGRADES.MAX_LEVEL) {
            console.warn(`Weapon ${weaponType} is already at max level`);
            return;
        }

        weapon.level++;
        weapon.damage = Math.floor(weapon.damage * (1 + WEAPON_UPGRADES.DAMAGE_PER_LEVEL));

        // Some weapons get additional projectiles at higher levels
        if (weapon.level % 2 === 0 && weapon.type !== 'laser' && weapon.type !== 'railgun') {
            weapon.projectileCount = (weapon.projectileCount || 1) + 1;
        }
    }

    /**
     * Adds a new weapon
     * @param {string} weaponType - Type of weapon to add
     * @param {Array} weapons - Weapons array
     * @param {Function} createWeaponCallback - Callback to create weapon
     */
    addNewWeapon(weaponType, weapons, createWeaponCallback) {
        if (weapons.length >= WEAPON_UPGRADES.MAX_WEAPONS) {
            console.warn('Max weapons reached');
            return;
        }

        const newWeapon = createWeaponCallback(weaponType);
        weapons.push(newWeapon);
    }

    /**
     * Adds or stacks a passive ability
     * @param {string} passiveKey - Passive key (health_boost, speed_boost, etc.)
     * @param {Object} passives - Passives object
     * @param {Object} player - Player object
     */
    addPassive(passiveKey, passives, player) {
        const passiveConfig = PASSIVES[passiveKey.toUpperCase()];

        if (!passiveConfig) {
            console.error(`Unknown passive: ${passiveKey}`);
            return;
        }

        // Initialize or increment stack count
        if (!passives[passiveKey]) {
            passives[passiveKey] = 1;
        } else if (passiveConfig.stackable) {
            passives[passiveKey]++;
        }

        // Apply passive effects
        this.applyPassiveEffect(passiveKey, passives[passiveKey], player, passiveConfig);
    }

    /**
     * Applies passive ability effects to player
     * @param {string} passiveKey - Passive key
     * @param {number} stacks - Number of stacks
     * @param {Object} player - Player object
     * @param {Object} passiveConfig - Passive configuration
     */
    applyPassiveEffect(passiveKey, stacks, player, passiveConfig) {
        switch (passiveKey) {
            case 'health_boost':
                player.maxHealth += passiveConfig.value;
                player.health += passiveConfig.value; // Also heal
                break;

            case 'speed_boost':
                // Speed is applied dynamically in PlayerSystem.updatePlayer()
                break;

            case 'regeneration':
                // Regeneration is handled in PlayerSystem.updatePassives()
                break;

            case 'magnet':
                // Magnet is handled in PickupSystem
                break;

            case 'armor':
                // Armor is applied in damage calculation
                break;

            case 'critical':
                // Critical hits are handled in collision detection
                break;

            case 'dash_boost':
                // Dash boost is applied in PlayerSystem.updatePlayer()
                break;

            default:
                console.warn('Unknown passive effect:', passiveKey);
        }
    }

    /**
     * Resets upgrade system state
     */
    reset() {
        // No internal state to reset
    }
}
