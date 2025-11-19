/**
 * Projectile Management System
 * Handles projectile pooling, creation, and lifecycle
 * Extracted from vibe-survivor-game.js during Phase 9 refactoring
 */

/**
 * ProjectileSystem - Manages projectile pooling and creation
 */
export class ProjectileSystem {
    constructor(poolSize = 200) {
        this.pool = [];
        this.poolSize = poolSize;

        // Pre-create projectile pool
        for (let i = 0; i < poolSize; i++) {
            this.pool.push(this.createProjectileObject());
        }
    }

    /**
     * Creates a new projectile object
     * @returns {Object} Empty projectile object
     */
    createProjectileObject() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            damage: 0,
            life: 0,
            type: '',
            color: '#ffffff',
            size: 3,
            piercing: 0,
            homing: false,
            explosionRadius: 0,
            sourceType: '',
            targetEnemy: null,
            target: null, // Alias for targetEnemy (used in old code)
            hitCount: 0,
            maxHits: 10,
            speed: 0,
            baseSpeed: 0,
            owner: 'player',
            active: true, // Compatibility flag for old code
            trail: [], // Visual trail for missiles/lasers
            rotation: 0, // Rotation angle for rendering
            isMine: false,
            pulseOffset: 0
        };
    }

    /**
     * Gets a projectile from the pool
     * @returns {Object} Pooled projectile object
     */
    getPooled() {
        if (this.pool.length > 0) {
            return this.pool.pop();
        }
        // If pool is empty, create a new projectile
        return this.createProjectileObject();
    }

    /**
     * Returns a projectile to the pool
     * @param {Object} projectile - Projectile to return
     */
    returnToPool(projectile) {
        // Reset projectile properties
        projectile.x = 0;
        projectile.y = 0;
        projectile.vx = 0;
        projectile.vy = 0;
        projectile.damage = 0;
        projectile.life = 0;
        projectile.targetEnemy = null;
        projectile.target = null;
        projectile.hitCount = 0;
        projectile.owner = 'player'; // CRITICAL: Reset to player to prevent boss missiles from attacking player when reused
        projectile.type = '';
        projectile.homing = false;
        projectile.isMine = false;
        projectile.pulseOffset = 0;

        // Return to pool if not at capacity
        if (this.pool.length < this.poolSize) {
            this.pool.push(projectile);
        }
    }

    /**
     * Creates a basic projectile
     * @param {Object} params - Projectile parameters
     * @returns {Object} Configured projectile
     */
    createBasic(params) {
        const projectile = this.getPooled();

        projectile.x = params.x;
        projectile.y = params.y;
        projectile.vx = params.vx;
        projectile.vy = params.vy;
        projectile.damage = params.damage;
        projectile.life = params.life || 120;
        projectile.type = params.type || 'basic';
        projectile.color = params.color || '#9B59B6';
        projectile.size = params.size || 3;
        projectile.piercing = params.piercing || 0;
        projectile.sourceType = params.sourceType;
        projectile.baseSpeed = params.baseSpeed;

        return projectile;
    }

    /**
     * Creates a homing projectile
     * @param {Object} params - Projectile parameters
     * @returns {Object} Configured homing projectile
     */
    createHoming(params) {
        const projectile = this.createBasic(params);

        projectile.homing = true;
        projectile.targetEnemy = params.targetEnemy;
        projectile.speed = params.speed;
        projectile.hitCount = 0;
        projectile.maxHits = params.maxHits || 10;

        return projectile;
    }

    /**
     * Creates an explosive projectile
     * @param {Object} params - Projectile parameters
     * @returns {Object} Configured explosive projectile
     */
    createExplosive(params) {
        const projectile = this.createBasic(params);

        projectile.explosionRadius = params.explosionRadius || 50;

        return projectile;
    }

    /**
     * Creates a boss missile
     * @param {Object} params - Projectile parameters
     * @returns {Object} Configured boss missile
     */
    createBossMissile(params) {
        const projectile = this.getPooled();

        projectile.x = params.x;
        projectile.y = params.y;
        projectile.vx = params.vx;
        projectile.vy = params.vy;
        projectile.damage = params.damage;
        projectile.life = params.life || 300;
        projectile.type = 'boss-missile';
        projectile.color = params.color || '#FF00FF';
        projectile.size = params.size || 6;
        projectile.homing = params.homing || false;
        projectile.homingStrength = params.homingStrength || 0.05;
        projectile.explosionRadius = params.explosionRadius || 40;
        projectile.speed = params.speed;
        projectile.owner = 'enemy';

        return projectile;
    }

    /**
     * Updates all projectiles (movement, homing, lifetime)
     * @param {Array} projectiles - Array of active projectiles
     * @param {Object} context - Game context with required callbacks
     * @param {Object} context.player - Player object
     * @param {Array} context.enemies - Array of enemies
     * @param {Function} context.cachedSqrt - Cached sqrt function
     * @param {Function} context.findNearestEnemy - Find nearest enemy function
     * @param {Function} context.createExplosion - Explosion creation callback
     */
    updateProjectiles(projectiles, context) {
        const { player, enemies, cachedSqrt, findNearestEnemy, createExplosion } = context;

        // Use reverse iteration for safe removal
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];

            // Update position based on type
            switch (projectile.type) {
                case 'missile':
                    if (projectile.homing && projectile.targetEnemy) {
                        const targetStillExists = enemies.includes(projectile.targetEnemy);

                        if (targetStillExists) {
                            projectile.targetX = projectile.targetEnemy.x;
                            projectile.targetY = projectile.targetEnemy.y;

                            const dx = projectile.targetX - projectile.x;
                            const dy = projectile.targetY - projectile.y;
                            const distance = cachedSqrt(dx * dx + dy * dy);

                            if (distance > 0) {
                                projectile.vx = (dx / distance) * projectile.speed;
                                projectile.vy = (dy / distance) * projectile.speed;
                            }
                        } else {
                            const nearestEnemy = findNearestEnemy(projectile.x, projectile.y, 200);
                            if (nearestEnemy) {
                                projectile.targetEnemy = nearestEnemy;
                            }
                        }
                    }
                    projectile.x += projectile.vx;
                    projectile.y += projectile.vy;
                    break;

                case 'boss-missile':
                    if (projectile.homing) {
                        const dx = player.x - projectile.x;
                        const dy = player.y - projectile.y;
                        const distance = cachedSqrt(dx * dx + dy * dy);

                        if (distance > 0) {
                            const homingStrength = projectile.homingStrength || 0.05;
                            projectile.vx += (dx / distance) * homingStrength;
                            projectile.vy += (dy / distance) * homingStrength;

                            // Limit max speed
                            const currentSpeed = cachedSqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy);
                            if (currentSpeed > projectile.speed) {
                                projectile.vx = (projectile.vx / currentSpeed) * projectile.speed;
                                projectile.vy = (projectile.vy / currentSpeed) * projectile.speed;
                            }
                        }
                    }
                    projectile.x += projectile.vx;
                    projectile.y += projectile.vy;
                    break;

                case 'homing_laser':
                    if (projectile.homing && projectile.targetEnemy) {
                        const targetStillExists = enemies.includes(projectile.targetEnemy);

                        if (targetStillExists) {
                            const dx = projectile.targetEnemy.x - projectile.x;
                            const dy = projectile.targetEnemy.y - projectile.y;
                            const distance = cachedSqrt(dx * dx + dy * dy);

                            if (distance > 0) {
                                const homingStrength = 0.25;

                                const targetVx = (dx / distance) * projectile.speed;
                                const targetVy = (dy / distance) * projectile.speed;

                                projectile.vx += (targetVx - projectile.vx) * homingStrength;
                                projectile.vy += (targetVy - projectile.vy) * homingStrength;

                                const currentSpeed = cachedSqrt(projectile.vx * projectile.vx + projectile.vy * projectile.vy);
                                if (currentSpeed > 0) {
                                    projectile.vx = (projectile.vx / currentSpeed) * projectile.speed;
                                    projectile.vy = (projectile.vy / currentSpeed) * projectile.speed;
                                }
                            }
                        } else {
                            const nearestEnemy = findNearestEnemy(projectile.x, projectile.y, 400);
                            if (nearestEnemy) {
                                projectile.targetEnemy = nearestEnemy;
                            }
                        }
                    }
                    projectile.x += projectile.vx;
                    projectile.y += projectile.vy;
                    break;

                case 'lightning':
                case 'shockburst':
                    // Static projectiles that don't move
                    break;

                default:
                    projectile.x += projectile.vx;
                    projectile.y += projectile.vy;
                    break;
            }

            projectile.life--;

            // Remove expired or far-away projectiles
            const dx = projectile.x - player.x;
            const dy = projectile.y - player.y;
            const distanceFromPlayer = Math.sqrt(dx * dx + dy * dy);

            if (projectile.life <= 0 || (distanceFromPlayer > 800 && projectile.type !== 'boss-missile')) {
                if (projectile.type === 'missile' && projectile.explosionRadius && createExplosion) {
                    createExplosion(projectile.x, projectile.y, projectile.explosionRadius, projectile.damage * 0.7, projectile.sourceType);
                }

                // Return to pool
                this.returnToPool(projectile);
                projectiles.splice(i, 1);
            }
        }
    }

    /**
     * Resets the projectile system
     */
    reset() {
        // Clear and repopulate pool
        this.pool = [];
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(this.createProjectileObject());
        }
    }
}
