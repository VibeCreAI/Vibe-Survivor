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
     * Fires a weapon, creating projectiles based on weapon type
     * @param {Object} weapon - Weapon to fire
     * @param {Object} context - Game context with required callbacks and data
     * @param {Object} context.player - Player object with x, y position
     * @param {Array} context.enemies - Array of enemy objects
     * @param {Function} context.getPooledProjectile - Function to get pooled projectile
     * @param {Function} context.addProjectile - Function to add projectile to game (projectile) => void
     * @param {Function} context.cachedSqrt - Cached sqrt function
     * @param {Function} context.fastCos - Fast cosine function
     * @param {Function} context.fastSin - Fast sine function
     * @param {Function} context.recordDamage - Optional damage tracking callback
     */
    fireWeapon(weapon, context) {
        const { player, enemies, cachedSqrt } = context;

        // Find nearest enemy within range
        let nearestEnemy = null;
        let nearestDistance = Infinity;

        enemies.forEach(enemy => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = cachedSqrt(dx * dx + dy * dy);

            if (distance < nearestDistance && distance <= weapon.range) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        });

        if (!nearestEnemy) return;

        const dx = nearestEnemy.x - player.x;
        const dy = nearestEnemy.y - player.y;
        const distance = cachedSqrt(dx * dx + dy * dy);

        // Fire multiple projectiles if weapon has been upgraded
        const projectileCount = weapon.projectileCount || 1;

        for (let i = 0; i < projectileCount; i++) {
            // Add slight angle variation for multiple projectiles
            let adjustedDx = dx;
            let adjustedDy = dy;

            if (projectileCount > 1) {
                const angleOffset = (i - (projectileCount - 1) / 2) * 0.2; // Small spread
                const angle = Math.atan2(dy, dx) + angleOffset;
                adjustedDx = context.fastCos(angle) * distance;
                adjustedDy = context.fastSin(angle) * distance;
            }

            switch (weapon.type) {
                case 'basic':
                case 'rapid':
                    this.createBasicProjectile(weapon, adjustedDx, adjustedDy, distance, context);
                    break;
                case 'spread':
                case 'spread_shot':
                    this.createSpreadProjectiles(weapon, adjustedDx, adjustedDy, distance, context);
                    break;
                case 'laser':
                    this.createLaserBeam(weapon, adjustedDx, adjustedDy, distance, context);
                    break;
                case 'plasma':
                    this.createPlasmaProjectile(weapon, adjustedDx, adjustedDy, distance, context);
                    break;
                case 'shotgun':
                    this.createShotgunBlast(weapon, adjustedDx, adjustedDy, distance, context);
                    break;
                case 'lightning':
                    // Lightning handles its own target distribution, only call once
                    if (i === 0) {
                        this.createLightningBolt(weapon, nearestEnemy, context);
                    }
                    break;
                case 'flamethrower':
                    this.createFlameStream(weapon, adjustedDx, adjustedDy, distance, context);
                    break;
                case 'railgun':
                    this.createRailgunBeam(weapon, adjustedDx, adjustedDy, distance, context);
                    break;
                case 'missiles':
                    this.createHomingMissile(weapon, nearestEnemy, context);
                    break;
                case 'homing_laser':
                    this.createHomingLaserBeam(weapon, nearestEnemy, context);
                    break;
                case 'shockburst':
                    // Shockburst handles its own target distribution, only call once
                    if (i === 0) {
                        this.createShockburst(weapon, nearestEnemy, context);
                    }
                    break;
                case 'gatling_gun':
                    // Separate barrel firing system
                    this.fireGatlingBarrels(weapon, nearestEnemy, context);
                    break;
            }
        }
    }

    /**
     * Creates a basic projectile
     * @private
     */
    createBasicProjectile(weapon, dx, dy, distance, context) {
        const { player, fastCos, fastSin, getPooledProjectile, addProjectile } = context;
        const angle = Math.atan2(dy, dx);
        const projectile = getPooledProjectile();

        const scaledSpeed = weapon.projectileSpeed;

        projectile.x = player.x;
        projectile.y = player.y;
        projectile.vx = fastCos(angle) * scaledSpeed;
        projectile.vy = fastSin(angle) * scaledSpeed;
        projectile.baseSpeed = weapon.projectileSpeed;
        projectile.damage = weapon.damage;
        projectile.life = 120;
        projectile.type = 'basic';
        projectile.color = '#9B59B6';
        projectile.size = 3;
        projectile.sourceType = weapon.type;

        addProjectile(projectile);
    }

    /**
     * Creates spread projectiles
     * @private
     */
    createSpreadProjectiles(weapon, dx, dy, distance, context) {
        const { player, fastCos, fastSin, getPooledProjectile, addProjectile } = context;
        const angle = Math.atan2(dy, dx);
        const spreadCount = 3 + Math.floor(weapon.level / 3);
        const spreadAngle = Math.PI / 6; // 30 degrees

        const scaledSpeed = weapon.projectileSpeed;

        for (let i = 0; i < spreadCount; i++) {
            const offsetAngle = angle + (i - Math.floor(spreadCount / 2)) * (spreadAngle / spreadCount);
            const projectile = getPooledProjectile();

            projectile.x = player.x;
            projectile.y = player.y;
            projectile.vx = fastCos(offsetAngle) * scaledSpeed;
            projectile.vy = fastSin(offsetAngle) * scaledSpeed;
            projectile.baseSpeed = weapon.projectileSpeed;
            projectile.damage = weapon.damage * 0.8;
            projectile.life = 100;
            projectile.type = 'spread';
            projectile.color = '#E67E22';
            projectile.size = 2.5;
            projectile.sourceType = weapon.type;

            addProjectile(projectile);
        }
    }

    /**
     * Creates a laser beam
     * @private
     */
    createLaserBeam(weapon, dx, dy, distance, context) {
        const { player, fastCos, fastSin, getPooledProjectile, addProjectile } = context;
        const angle = Math.atan2(dy, dx);
        const projectile = getPooledProjectile();

        projectile.x = player.x;
        projectile.y = player.y;
        projectile.vx = fastCos(angle) * weapon.projectileSpeed * 2;
        projectile.vy = fastSin(angle) * weapon.projectileSpeed * 2;
        projectile.damage = weapon.damage;
        projectile.life = 60;
        projectile.type = 'laser';
        projectile.color = '#E74C3C';
        projectile.size = 3;
        projectile.piercing = 999;
        projectile.sourceType = weapon.type;

        addProjectile(projectile);
    }

    /**
     * Creates a plasma projectile
     * @private
     */
    createPlasmaProjectile(weapon, dx, dy, distance, context) {
        const { player, fastCos, fastSin, getPooledProjectile, addProjectile } = context;
        const angle = Math.atan2(dy, dx);
        const projectile = getPooledProjectile();

        projectile.x = player.x;
        projectile.y = player.y;
        projectile.vx = fastCos(angle) * weapon.projectileSpeed;
        projectile.vy = fastSin(angle) * weapon.projectileSpeed;
        projectile.damage = weapon.damage;
        projectile.life = 150;
        projectile.type = 'plasma';
        projectile.color = '#3498DB';
        projectile.size = 4;
        projectile.explosionRadius = 50;
        projectile.sourceType = weapon.type;

        addProjectile(projectile);
    }

    /**
     * Creates a shotgun blast
     * @private
     */
    createShotgunBlast(weapon, dx, dy, distance, context) {
        const { player, fastCos, fastSin, getPooledProjectile, addProjectile } = context;
        const angle = Math.atan2(dy, dx);
        const pelletCount = 5 + Math.floor(weapon.level / 2);

        for (let i = 0; i < pelletCount; i++) {
            const spreadAngle = (Math.random() - 0.5) * Math.PI / 4; // Random spread
            const shotAngle = angle + spreadAngle;
            const speed = weapon.projectileSpeed * (0.8 + Math.random() * 0.4);

            const projectile = getPooledProjectile();

            projectile.x = player.x;
            projectile.y = player.y;
            projectile.vx = fastCos(shotAngle) * speed;
            projectile.vy = fastSin(shotAngle) * speed;
            projectile.damage = weapon.damage * 0.6;
            projectile.life = 80;
            projectile.type = 'shotgun';
            projectile.color = '#F39C12';
            projectile.size = 2;
            projectile.sourceType = weapon.type;

            addProjectile(projectile);
        }
    }

    /**
     * Creates lightning bolt with chain effect
     * @private
     */
    createLightningBolt(weapon, targetEnemy, context) {
        const { player, enemies, cachedSqrt, getPooledProjectile, addProjectile, recordDamage } = context;
        const projectileCount = weapon.projectileCount || 1;

        // Get multiple different targets for each lightning bolt
        const availableTargets = enemies.slice().sort((a, b) => {
            const distA = cachedSqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
            const distB = cachedSqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
            return distA - distB;
        }).slice(0, Math.max(projectileCount, 8));

        for (let i = 0; i < projectileCount; i++) {
            const assignedTarget = availableTargets[i % availableTargets.length] || targetEnemy;

            const hitEnemies = new Set();
            let currentTarget = assignedTarget;
            let chainCount = 0;
            const maxChains = 2 + Math.floor(weapon.level / 2);
            const chainTargets = [];

            while (currentTarget && chainCount < maxChains) {
                hitEnemies.add(currentTarget);
                currentTarget.health -= weapon.damage;
                if (recordDamage) {
                    recordDamage(weapon.type, weapon.damage, currentTarget);
                }

                chainTargets.push({
                    x: currentTarget.x,
                    y: currentTarget.y
                });

                // Find next target for chain
                let nextTarget = null;
                let nearestDistance = Infinity;

                enemies.forEach(enemy => {
                    if (!hitEnemies.has(enemy)) {
                        const dx = enemy.x - currentTarget.x;
                        const dy = enemy.y - currentTarget.y;
                        const distance = cachedSqrt(dx * dx + dy * dy);
                        if (distance < nearestDistance && distance <= 150) {
                            nearestDistance = distance;
                            nextTarget = enemy;
                        }
                    }
                });

                currentTarget = nextTarget;
                chainCount++;
            }

            const projectile = getPooledProjectile();
            projectile.x = player.x;
            projectile.y = player.y;
            projectile.targetX = assignedTarget.x;
            projectile.targetY = assignedTarget.y;
            projectile.chainTargets = chainTargets;
            projectile.damage = weapon.damage;
            projectile.life = 30;
            projectile.type = 'lightning';
            projectile.color = '#F1C40F';
            projectile.chainCount = chainCount;
            projectile.sourceType = weapon.type;

            addProjectile(projectile);
        }
    }

    /**
     * Creates a flame stream
     * @private
     */
    createFlameStream(weapon, dx, dy, distance, context) {
        const { player, fastCos, fastSin, getPooledProjectile, addProjectile } = context;
        const angle = Math.atan2(dy, dx);
        const flameCount = 3;

        for (let i = 0; i < flameCount; i++) {
            const offsetAngle = angle + (Math.random() - 0.5) * 0.3;
            const speed = weapon.projectileSpeed * (0.7 + Math.random() * 0.6);

            const projectile = getPooledProjectile();

            projectile.x = player.x;
            projectile.y = player.y;
            projectile.vx = fastCos(offsetAngle) * speed;
            projectile.vy = fastSin(offsetAngle) * speed;
            projectile.damage = weapon.damage * 0.4;
            projectile.life = 90;
            projectile.type = 'flame';
            projectile.color = '#E74C3C';
            projectile.size = 3 + Math.random() * 2;
            projectile.dotDamage = weapon.damage * 0.1;
            projectile.sourceType = weapon.type;

            addProjectile(projectile);
        }
    }

    /**
     * Creates a railgun beam
     * @private
     */
    createRailgunBeam(weapon, dx, dy, distance, context) {
        const { player, fastCos, fastSin, getPooledProjectile, addProjectile } = context;
        const angle = Math.atan2(dy, dx);
        const projectile = getPooledProjectile();

        projectile.x = player.x;
        projectile.y = player.y;
        projectile.vx = fastCos(angle) * weapon.projectileSpeed * 2;
        projectile.vy = fastSin(angle) * weapon.projectileSpeed * 2;
        projectile.damage = weapon.damage;
        projectile.life = 60;
        projectile.type = 'railgun';
        projectile.color = '#9B59B6';
        projectile.size = 3;
        projectile.piercing = 999;
        projectile.sourceType = weapon.type;

        addProjectile(projectile);
    }

    /**
     * Creates homing missiles
     * @private
     */
    createHomingMissile(weapon, targetEnemy, context) {
        const { player, enemies, cachedSqrt, getPooledProjectile, addProjectile } = context;
        const projectileCount = weapon.projectileCount || 1;

        const availableTargets = enemies.slice().sort((a, b) => {
            const distA = cachedSqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
            const distB = cachedSqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
            return distA - distB;
        }).slice(0, Math.max(projectileCount, 8));

        for (let i = 0; i < projectileCount; i++) {
            const projectile = getPooledProjectile();
            const assignedTarget = availableTargets[i % availableTargets.length] || targetEnemy;

            projectile.x = player.x;
            projectile.y = player.y;
            projectile.vx = 0;
            projectile.vy = 0;
            projectile.targetEnemy = assignedTarget;
            projectile.targetX = assignedTarget.x;
            projectile.targetY = assignedTarget.y;
            projectile.damage = weapon.damage;
            projectile.life = 180;
            projectile.type = 'missile';
            projectile.color = '#E67E22';
            projectile.size = 3;
            projectile.homing = true;
            projectile.explosionRadius = 60;
            projectile.speed = weapon.projectileSpeed || 6;
            projectile.baseSpeed = weapon.projectileSpeed || 3;
            projectile.sourceType = weapon.type;

            addProjectile(projectile);
        }
    }

    /**
     * Creates homing laser beams
     * @private
     */
    createHomingLaserBeam(weapon, nearestEnemy, context) {
        if (!nearestEnemy) return;

        const { player, enemies, cachedSqrt, fastCos, fastSin, getPooledProjectile, addProjectile } = context;
        const projectileCount = weapon.projectileCount || 4;

        const availableTargets = enemies.slice().sort((a, b) => {
            const distA = cachedSqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
            const distB = cachedSqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
            return distA - distB;
        }).slice(0, Math.max(projectileCount, 8));

        for (let i = 0; i < projectileCount; i++) {
            const projectile = getPooledProjectile();
            const targetEnemy = availableTargets[i % availableTargets.length] || nearestEnemy;

            const spreadAngle = (projectileCount > 1) ? (i / (projectileCount - 1) - 0.5) * 1.2 : 0;
            const baseAngle = Math.atan2(targetEnemy.y - player.y, targetEnemy.x - player.x);
            const angle = baseAngle + spreadAngle;

            projectile.x = player.x;
            projectile.y = player.y;
            projectile.vx = fastCos(angle) * weapon.projectileSpeed * 0.7;
            projectile.vy = fastSin(angle) * weapon.projectileSpeed * 0.7;
            projectile.damage = weapon.damage;
            projectile.life = 160;
            projectile.type = 'homing_laser';
            projectile.color = '#FFD700';
            projectile.size = 5;
            projectile.homing = true;
            projectile.piercing = true;
            projectile.hitCount = 0;
            projectile.maxHits = 10;
            projectile.targetEnemy = targetEnemy;
            projectile.speed = weapon.projectileSpeed;
            projectile.sourceType = weapon.type;

            addProjectile(projectile);
        }
    }

    /**
     * Creates shockburst explosion
     * @private
     */
    createShockburst(weapon, targetEnemy, context) {
        if (!targetEnemy) return;

        const { player, enemies, cachedSqrt, getPooledProjectile, addProjectile, recordDamage, createHitParticles } = context;
        const projectileCount = weapon.projectileCount || 4;

        // Get multiple different targets for each shockburst bolt (same as lightning)
        const availableTargets = enemies.slice().sort((a, b) => {
            const distA = cachedSqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
            const distB = cachedSqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
            return distA - distB;
        }).slice(0, Math.max(projectileCount, 8));

        for (let i = 0; i < projectileCount; i++) {
            // Assign different targets to each shockburst bolt (cycle through available targets)
            const assignedTarget = availableTargets[i % availableTargets.length] || targetEnemy;

            const hitEnemies = new Set();
            let currentTarget = assignedTarget;
            let chainCount = 0;
            const maxChains = 2 + Math.floor(weapon.level / 2);
            const chainTargets = []; // Store all chain targets for rendering

            while (currentTarget && chainCount < maxChains) {
                hitEnemies.add(currentTarget);

                // Deal lightning damage
                currentTarget.health -= weapon.damage;
                if (recordDamage) {
                    recordDamage(weapon.type, weapon.damage, currentTarget);
                }

                // Store target position for rendering
                chainTargets.push({
                    x: currentTarget.x,
                    y: currentTarget.y
                });

                // ADD EXPLOSION EFFECT: Apply explosion damage to nearby enemies
                const explosionRadius = weapon.explosionRadius || 100;
                enemies.forEach(enemy => {
                    if (enemy !== currentTarget) {
                        const dx = enemy.x - currentTarget.x;
                        const dy = enemy.y - currentTarget.y;
                        const distance = cachedSqrt(dx * dx + dy * dy);
                        if (distance <= explosionRadius) {
                            enemy.health -= weapon.damage * 1.0; // FIXED: Explosion at full damage
                            if (recordDamage) {
                                recordDamage(weapon.type, weapon.damage, enemy);
                            }
                            if (createHitParticles) {
                                createHitParticles(enemy.x, enemy.y, '#00FFFF'); // Cyan particles
                            }
                        }
                    }
                });

                // Find next target for chain (same as lightning)
                let nextTarget = null;
                let nearestDistance = Infinity;

                enemies.forEach(enemy => {
                    if (!hitEnemies.has(enemy)) {
                        const dx = enemy.x - currentTarget.x;
                        const dy = enemy.y - currentTarget.y;
                        const distance = cachedSqrt(dx * dx + dy * dy);
                        if (distance < nearestDistance && distance <= 150) {
                            nearestDistance = distance;
                            nextTarget = enemy;
                        }
                    }
                });

                currentTarget = nextTarget;
                chainCount++;
            }

            // Create projectile (same as lightning but cyan color)
            const projectile = getPooledProjectile();
            projectile.x = player.x;
            projectile.y = player.y;
            projectile.targetX = assignedTarget.x;
            projectile.targetY = assignedTarget.y;
            projectile.chainTargets = chainTargets;
            projectile.damage = weapon.damage;
            projectile.life = 30;
            projectile.type = 'shockburst';
            projectile.color = '#00FFFF'; // CYAN COLOR (main difference from lightning)
            projectile.chainCount = chainCount;
            projectile.sourceType = weapon.type;

            addProjectile(projectile);
        }
    }

    /**
     * Fires gatling gun barrels
     * @private
     */
    fireGatlingBarrels(weapon, targetEnemy, context) {
        const { player, enemies, cachedSqrt } = context;

        // Number of barrels = weapon level
        const numBarrels = weapon.level;
        const maxRange = 450;

        // Find available targets (up to numBarrels)
        const availableTargets = enemies
            .map(enemy => {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const distance = cachedSqrt(dx * dx + dy * dy);
                return { enemy, distance };
            })
            .filter(target => target.distance <= maxRange)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, numBarrels)
            .map(target => target.enemy);

        if (availableTargets.length === 0) return;

        // Fire all barrels simultaneously - one projectile per target
        for (let barrelIndex = 0; barrelIndex < numBarrels && barrelIndex < availableTargets.length; barrelIndex++) {
            this.fireSingleBarrel(weapon, availableTargets[barrelIndex], barrelIndex, numBarrels, context);
        }
    }

    /**
     * Fires a single gatling barrel
     * @private
     */
    fireSingleBarrel(weapon, target, barrelIndex, totalBarrels, context) {
        const { player, getPooledProjectile, addProjectile, createHitParticles } = context;

        // Enhanced damage scaling
        const baseDamage = 35;
        const damagePerLevel = 8;
        const actualDamage = baseDamage + (damagePerLevel * (weapon.level - 1));

        // Calculate angle to target
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const angle = Math.atan2(dy, dx);

        // Create projectile for this barrel
        const projectile = getPooledProjectile();
        if (!projectile) return;

        // Slight offset for multiple barrels visual effect
        const barrelOffset = (barrelIndex - (totalBarrels - 1) / 2) * 8;
        const offsetX = Math.cos(angle + Math.PI/2) * barrelOffset;
        const offsetY = Math.sin(angle + Math.PI/2) * barrelOffset;

        projectile.x = player.x + offsetX;
        projectile.y = player.y + offsetY;
        projectile.vx = Math.cos(angle) * (weapon.projectileSpeed || 10);
        projectile.vy = Math.sin(angle) * (weapon.projectileSpeed || 10);
        projectile.damage = actualDamage;
        projectile.range = weapon.range || 450;
        projectile.life = 60;
        projectile.type = 'gatling_gun';
        projectile.color = '#FFD700';
        projectile.active = true;
        projectile.sourceType = weapon.type;

        addProjectile(projectile);

        // Create muzzle flash for this barrel
        if (createHitParticles) {
            createHitParticles(
                player.x + offsetX + Math.cos(angle) * 20,
                player.y + offsetY + Math.sin(angle) * 20,
                '#FFD700'
            );
        }
    }

    /**
     * Resets weapon system state
     */
    reset() {
        // No internal state to reset
    }
}
