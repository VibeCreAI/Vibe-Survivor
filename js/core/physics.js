// Physics and collision detection for Vibe Survivor
// Extracted from vibe-survivor-game.js during Phase 6 refactoring

import { COLLISION, PLAYER, SCREEN_EFFECTS } from '../config/constants.js';

/**
 * Manages physics calculations and collision detection
 */
export class PhysicsManager {
    constructor() {
        // Physics cache for optimization
        this.sqrtCache = new Map();
        this.maxCacheSize = 1000;

        // Trigonometric lookup tables for fast calculations
        this.sinTable = null;
        this.cosTable = null;
        this.TRIG_TABLE_SIZE = 3600; // 0.1 degree precision
        this.TRIG_ANGLE_SCALE = this.TRIG_TABLE_SIZE / (2 * Math.PI);

        this.initTrigLookupTables();
    }

    /**
     * Initialize trigonometric lookup tables
     */
    initTrigLookupTables() {
        this.sinTable = new Float32Array(this.TRIG_TABLE_SIZE);
        this.cosTable = new Float32Array(this.TRIG_TABLE_SIZE);

        for (let i = 0; i < this.TRIG_TABLE_SIZE; i++) {
            const angle = (i / this.TRIG_TABLE_SIZE) * 2 * Math.PI;
            this.sinTable[i] = Math.sin(angle);
            this.cosTable[i] = Math.cos(angle);
        }
    }

    /**
     * Fast sine using lookup table
     * @param {number} angle - Angle in radians
     * @returns {number}
     */
    fastSin(angle) {
        // Normalize angle to 0-2π
        angle = angle % (2 * Math.PI);
        if (angle < 0) angle += 2 * Math.PI;

        const index = Math.floor(angle * this.TRIG_ANGLE_SCALE);
        const nextIndex = (index + 1) % this.TRIG_TABLE_SIZE;
        const frac = (angle * this.TRIG_ANGLE_SCALE) - index;

        return this.sinTable[index] + (this.sinTable[nextIndex] - this.sinTable[index]) * frac;
    }

    /**
     * Fast cosine using lookup table
     * @param {number} angle - Angle in radians
     * @returns {number}
     */
    fastCos(angle) {
        // Normalize angle to 0-2π
        angle = angle % (2 * Math.PI);
        if (angle < 0) angle += 2 * Math.PI;

        const index = Math.floor(angle * this.TRIG_ANGLE_SCALE);
        const nextIndex = (index + 1) % this.TRIG_TABLE_SIZE;
        const frac = (angle * this.TRIG_ANGLE_SCALE) - index;

        return this.cosTable[index] + (this.cosTable[nextIndex] - this.cosTable[index]) * frac;
    }

    /**
     * Cached square root with 2-decimal precision
     * @param {number} value
     * @returns {number}
     */
    cachedSqrt(value) {
        if (value < 0) return 0;
        if (value === 0) return 0;
        if (value === 1) return 1;

        // Round to 2 decimal places for cache key
        const rounded = Math.round(value * 100) / 100;

        if (this.sqrtCache.has(rounded)) {
            return this.sqrtCache.get(rounded);
        }

        const result = Math.sqrt(rounded);

        if (this.sqrtCache.size < this.maxCacheSize) {
            this.sqrtCache.set(rounded, result);
        }

        return result;
    }

    /**
     * Check collision between two circles
     * @param {number} x1 - First circle X
     * @param {number} y1 - First circle Y
     * @param {number} r1 - First circle radius
     * @param {number} x2 - Second circle X
     * @param {number} y2 - Second circle Y
     * @param {number} r2 - Second circle radius
     * @returns {boolean}
     */
    checkCircleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distanceSquared = dx * dx + dy * dy;
        const collisionRadius = r1 + r2;
        const collisionRadiusSquared = collisionRadius * collisionRadius;
        return distanceSquared < collisionRadiusSquared;
    }

    /**
     * Manhattan distance check (optimization)
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} maxDistance
     * @returns {boolean} - True if within maxDistance
     */
    manhattanDistanceCheck(x1, y1, x2, y2, maxDistance) {
        return Math.abs(x1 - x2) < maxDistance && Math.abs(y1 - y2) < maxDistance;
    }

    /**
     * Check all collisions in the game
     * @param {Object} game - Reference to game instance
     */
    checkCollisions(game) {
        this.checkProjectileEnemyCollisions(game);
        this.checkEnemyPlayerCollisions(game);
        this.checkEnemyProjectilePlayerCollisions(game);
    }

    /**
     * Check projectile vs enemy collisions
     * @param {Object} game
     */
    checkProjectileEnemyCollisions(game) {
        const projectiles = game.projectiles;
        const enemies = game.enemies;
        const player = game.player;

        // Loop backwards to safely remove projectiles during iteration
        for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
            const projectile = projectiles[pIndex];

            // Skip enemy projectiles
            if (projectile.owner === 'enemy') continue;

            let projectileHit = false;
            let hitCount = 0;
            const maxHits = projectile.piercing === true ? 999 : (projectile.piercing || 1);

            // Pre-screen enemies by distance for performance
            const nearbyEnemies = enemies.filter(enemy => {
                return this.manhattanDistanceCheck(
                    projectile.x, projectile.y,
                    enemy.x, enemy.y,
                    COLLISION.PRESCREEN_DISTANCE
                );
            });

            for (let j = nearbyEnemies.length - 1; j >= 0; j--) {
                const enemy = nearbyEnemies[j];

                const dx = projectile.x - enemy.x;
                const dy = projectile.y - enemy.y;
                const distanceSquared = dx * dx + dy * dy;
                const collisionRadius = enemy.radius + (projectile.size || 3);
                const collisionRadiusSquared = collisionRadius * collisionRadius;

                if (distanceSquared < collisionRadiusSquared && hitCount < maxHits) {
                    hitCount++;
                    let damage = projectile.damage;

                    // Track hits for homing lasers
                    if (projectile.type === 'homing_laser') {
                        projectile.hitCount = (projectile.hitCount || 0) + 1;
                    }

                    // Critical hit chance (15% per stack)
                    if (player.passives.critical) {
                        const criticalStacks = typeof player.passives.critical === 'number' ? player.passives.critical : 1;
                        const criticalChance = 0.15 * criticalStacks;
                        if (Math.random() < criticalChance) {
                            damage *= 2;
                            if (game.createCriticalParticles) {
                                game.createCriticalParticles(enemy.x, enemy.y);
                            }
                        }
                    }

                    enemy.health -= damage;

                    // Track weapon damage
                    if (projectile.sourceType && game.recordWeaponDamage) {
                        game.recordWeaponDamage(projectile.sourceType, damage, enemy);
                    }

                    // Create hit particles
                    if (game.createHitParticles) {
                        game.createHitParticles(enemy.x, enemy.y, projectile.color);
                    }

                    // Special projectile effects
                    if (projectile.type === 'plasma' && projectile.explosionRadius && game.createExplosion) {
                        game.createExplosion(enemy.x, enemy.y, projectile.explosionRadius, projectile.damage * 0.5, projectile.sourceType);
                    } else if (projectile.type === 'missile' && projectile.explosionRadius && game.createExplosion) {
                        game.createExplosion(enemy.x, enemy.y, projectile.explosionRadius, projectile.damage * 0.7, projectile.sourceType);
                        projectileHit = true;
                    } else if (projectile.type === 'flame' && projectile.dotDamage) {
                        enemy.burning = {
                            damage: projectile.dotDamage,
                            duration: 180,
                            sourceType: projectile.sourceType
                        };
                    }

                    // Check if projectile should be removed
                    if (projectile.type === 'homing_laser') {
                        if (projectile.hitCount >= (projectile.maxHits || 10)) {
                            projectileHit = true;
                        }
                    } else if (!['laser', 'railgun'].includes(projectile.type) || hitCount >= maxHits) {
                        projectileHit = true;
                    }

                    // Remove enemy if dead
                    if (enemy.health <= 0 && game.handleEnemyDeath) {
                        const enemyIndex = enemies.indexOf(enemy);
                        if (enemyIndex !== -1) {
                            game.handleEnemyDeath(enemy, enemyIndex);
                        }
                    }
                }
            }

            if (projectileHit) {
                // Return projectile to pool if available
                if (game.returnProjectileToPool) {
                    game.returnProjectileToPool(projectile);
                }
                projectiles.splice(pIndex, 1);
            }
        }
    }

    /**
     * Check enemy vs player collisions
     * @param {Object} game
     */
    checkEnemyPlayerCollisions(game) {
        const enemies = game.enemies;
        const player = game.player;

        // Pre-screen enemies for performance
        const nearbyEnemies = enemies.filter(enemy => {
            return this.manhattanDistanceCheck(
                player.x, player.y,
                enemy.x, enemy.y,
                COLLISION.PRESCREEN_DISTANCE
            );
        });

        nearbyEnemies.forEach((enemy) => {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distanceSquared = dx * dx + dy * dy;
            const collisionRadius = player.radius + enemy.radius;
            const collisionRadiusSquared = collisionRadius * collisionRadius;

            if (distanceSquared < collisionRadiusSquared && !player.invulnerable) {
                let damage = enemy.contactDamage;

                // Armor reduction (stacks multiplicatively, capped at 90% reduction)
                if (player.passives.armor) {
                    const armorCount = typeof player.passives.armor === 'number' ? player.passives.armor : 1;
                    const damageReduction = Math.min(0.9, 1 - Math.pow(0.85, armorCount)); // 15% per stack, capped at 90%
                    damage = Math.floor(damage * (1 - damageReduction));
                }

                player.health -= damage;
                player.invulnerable = 60;

                // Create hit particles
                if (game.createHitParticles) {
                    game.createHitParticles(player.x, player.y, '#ff0000');
                }

                // Create screen shake effect
                if (game.createScreenShake) {
                    game.createScreenShake(6);
                }

                // Create red flash effect
                if (game.createRedFlash) {
                    game.createRedFlash(0.5);
                }

                // Check for player death
                if (player.health <= 0 && game.handlePlayerDeath) {
                    game.handlePlayerDeath();
                }
            }
        });
    }

    /**
     * Check enemy projectiles vs player
     * @param {Object} game
     */
    checkEnemyProjectilePlayerCollisions(game) {
        const projectiles = game.projectiles;
        const player = game.player;

        // Collect indices to remove (in reverse order to avoid index shifting)
        const projectilesToRemove = [];

        for (let pIndex = 0; pIndex < projectiles.length; pIndex++) {
            const projectile = projectiles[pIndex];

            // Only check enemy projectiles
            if (projectile.owner !== 'enemy') continue;

            const dx = projectile.x - player.x;
            const dy = projectile.y - player.y;
            const distance = this.cachedSqrt(dx * dx + dy * dy);

            if (distance < player.radius + (projectile.size || 3)) {
                // Player hit by enemy projectile
                player.health -= projectile.damage;

                // Create screen shake effect
                if (game.createScreenShake) {
                    game.createScreenShake(projectile.explosionRadius ? 8 : 4);
                }

                // Create red flash effect
                if (game.createRedFlash) {
                    game.createRedFlash(projectile.explosionRadius ? 0.7 : 0.4);
                }

                // Create explosion if projectile has explosion radius
                if (projectile.explosionRadius && game.createExplosion) {
                    game.createExplosion(projectile.x, projectile.y, projectile.explosionRadius, projectile.damage * 0.5);
                }

                projectilesToRemove.push(pIndex);

                // Check for player death
                if (player.health <= 0 && game.handlePlayerDeath) {
                    game.handlePlayerDeath();
                }
            }
        }

        // Remove projectiles in reverse order to avoid index shifting
        for (let i = projectilesToRemove.length - 1; i >= 0; i--) {
            const index = projectilesToRemove[i];
            const projectile = projectiles[index];
            if (game.returnProjectileToPool) {
                game.returnProjectileToPool(projectile);
            }
            projectiles.splice(index, 1);
        }
    }

    /**
     * Cleanup caches
     */
    cleanup() {
        this.sqrtCache.clear();
    }
}
