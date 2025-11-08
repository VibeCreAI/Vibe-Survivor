/**
 * Enemy System
 * Manages enemy spawning, behavior, and boss mechanics
 * Handles difficulty scaling, enemy grouping, and AI behaviors
 */

export class EnemySystem {
    constructor() {
        this.frameCount = 0;
        this.lastSpawn = 0;
        this.spawnRate = 120; // Start at 120 frames between spawns
        this.bossSpawned = false;
    }

    /**
     * Main spawn controller with accelerating difficulty
     * Spawns regular enemies and manages boss spawning at key times
     * @param {Object} params - Parameters object
     * @param {Array} params.enemies - Enemy array
     * @param {Object} params.player - Player object
     * @param {number} params.gameTime - Game time in seconds
     * @param {number} params.bossesKilled - Number of bosses defeated
     * @param {boolean} params.bossDefeating - Is boss currently being defeated
     * @param {Function} params.spawnEnemy - Callback to spawn regular enemy
     * @param {Function} params.spawnBoss - Callback to spawn first boss
     */
    spawnEnemies(params) {
        const { enemies, player, gameTime, bossesKilled, bossDefeating, spawnEnemy, spawnBoss } = params;

        // Skip enemy spawning during boss defeat animation for clean victory sequence
        if (bossDefeating) {
            return;
        }

        this.frameCount++;

        // Performance limit: maximum number of enemies on screen
        const maxEnemies = 20;

        if (enemies.length >= maxEnemies) {
            return; // Don't spawn more if at limit
        }

        // Check for first boss spawn at 3 minutes (180 seconds)
        if (gameTime >= 180 && bossesKilled === 0 && !this.bossSpawned && !enemies.some(enemy => enemy.behavior === 'boss')) {
            spawnBoss();
            this.bossSpawned = true;
            return; // Don't spawn regular enemies this frame
        }

        // Increase difficulty over time: spawn rate accelerates from 120 to 30 frames
        this.spawnRate = Math.max(30, 120 - Math.floor(gameTime / 10) * 5);

        if (this.frameCount - this.lastSpawn >= this.spawnRate) {
            const spawnCount = 1 + Math.floor(gameTime / 60);
            // Limit spawn count to not exceed max enemies
            const actualSpawnCount = Math.min(spawnCount, maxEnemies - enemies.length);

            for (let i = 0; i < actualSpawnCount; i++) {
                spawnEnemy();
            }
            this.lastSpawn = this.frameCount;
        }
    }

    /**
     * Create individual enemies with type/stats
     * Applies time and boss-based difficulty scaling
     * @param {Object} params - Parameters object
     * @param {Array} params.enemies - Enemy array to add to
     * @param {Object} params.player - Player object for spawn positioning
     * @param {number} params.gameTime - Game time in seconds
     * @param {number} params.bossesKilled - Number of bosses defeated
     * @param {Function} params.getAvailableEnemyTypes - Get available types
     * @param {Function} params.selectEnemyType - Select random weighted type
     * @param {Function} params.getEnemyConfig - Get enemy configuration
     * @param {Function} params.showBossNotification - Show boss notification
     * @param {Function} params.fastCos - Fast cosine function
     * @param {Function} params.fastSin - Fast sine function
     */
    spawnEnemy(params) {
        const {
            enemies, player, gameTime, bossesKilled,
            getAvailableEnemyTypes, selectEnemyType, getEnemyConfig,
            showBossNotification, fastCos, fastSin
        } = params;

        const side = Math.floor(Math.random() * 4);
        const spawnDistance = 500; // Distance from player to spawn enemies
        let x, y;

        // Spawn enemies around the player's position
        switch (side) {
            case 0: // Top
                x = player.x + (Math.random() - 0.5) * 500;
                y = player.y - spawnDistance;
                break;
            case 1: // Right
                x = player.x + spawnDistance;
                y = player.y + (Math.random() - 0.5) * 500;
                break;
            case 2: // Bottom
                x = player.x + (Math.random() - 0.5) * 500;
                y = player.y + spawnDistance;
                break;
            case 3: // Left
                x = player.x - spawnDistance;
                y = player.y + (Math.random() - 0.5) * 500;
                break;
        }

        const enemyTypes = getAvailableEnemyTypes();
        const type = selectEnemyType(enemyTypes);
        const config = getEnemyConfig(type);

        // Calculate scaled speed - keep enemy speed constant to maintain gameplay feel
        const baseSpeed = config.speed;
        const scaledSpeed = baseSpeed;

        // Calculate enemy scaling: time-based until first boss, then boss-only scaling
        let timeScaling, bossScaling;

        if (bossesKilled === 0) {
            // Before first boss: use time-based scaling only
            timeScaling = 1 + Math.floor(gameTime / 30) * 0.3; // 30% per 30 seconds
            bossScaling = 1.0; // No boss scaling yet
        } else {
            // After first boss defeated: freeze time scaling, use boss scaling only
            timeScaling = 1 + Math.floor(180 / 30) * 0.3; // Freeze at first boss time (180 seconds = 6 intervals = 2.8x)
            bossScaling = 1 + bossesKilled * 0.15; // 15% per boss defeated
        }

        const totalHealthMultiplier = config.health * timeScaling * bossScaling;
        const totalDamageMultiplier = config.contactDamage * (1 + (bossesKilled || 0) * 0.1); // 10% damage per boss

        const enemy = {
            x: x,
            y: y,
            radius: config.radius,
            speed: scaledSpeed,
            baseSpeed: baseSpeed,
            maxHealth: Math.floor(totalHealthMultiplier),
            health: Math.floor(totalHealthMultiplier),
            contactDamage: Math.floor(totalDamageMultiplier),
            color: config.color,
            behavior: config.behavior,
            specialCooldown: 0,
            burning: null,
            spawnedMinions: false
        };

        // Only add rotation properties for tank enemies (boss handled separately)
        if (config.behavior === 'tank') {
            enemy.angle = 0;
            enemy.rotSpeed = 0.05;
        }

        enemies.push(enemy);

        // Show boss notification when boss is spawned
        if (config.behavior === 'boss') {
            showBossNotification();
        }
    }

    /**
     * Spawn boss at 3 minutes (180 seconds)
     * @param {Object} params - Parameters object
     * @param {Array} params.enemies - Enemy array to add to
     * @param {Object} params.player - Player object for spawn positioning
     * @param {number} params.gameTime - Game time in seconds
     * @param {Function} params.getEnemyConfig - Get enemy configuration
     * @param {Function} params.showBossNotification - Show boss notification
     * @param {Function} params.fastCos - Fast cosine function
     * @param {Function} params.fastSin - Fast sine function
     */
    spawnBoss(params) {
        const { enemies, player, gameTime, getEnemyConfig, showBossNotification, fastCos, fastSin } = params;

        // Spawn boss at a specific distance from player
        const spawnDistance = 250;
        const angle = Math.random() * Math.PI * 2;
        const x = player.x + fastCos(angle) * spawnDistance;
        const y = player.y + fastSin(angle) * spawnDistance;

        const config = getEnemyConfig('boss');
        const scaledSpeed = config.speed;

        enemies.push({
            x: x,
            y: y,
            radius: config.radius,
            speed: scaledSpeed,
            baseSpeed: config.speed,
            maxHealth: config.health * (1 + Math.floor(gameTime / 30) * 0.3),
            health: config.health * (1 + Math.floor(gameTime / 30) * 0.3),
            contactDamage: config.contactDamage,
            color: config.color,
            behavior: config.behavior,
            angle: 0,
            rotSpeed: 0.05,
            specialCooldown: 0,
            burning: null,
            spawnedMinions: false,
            lastMissileFrame: 0,
            dashState: {
                active: false,
                targetX: 0,
                targetY: 0,
                duration: 0,
                maxDuration: 30,
                originalSpeed: 0
            }
        });

        showBossNotification();
    }

    /**
     * Spawn progressively stronger boss after first boss defeat
     * Scales health by 40%, speed by 5%, damage by 15%, size by 5% per boss
     * @param {Object} params - Parameters object
     * @param {Array} params.enemies - Enemy array to add to
     * @param {Object} params.player - Player object for spawn positioning
     * @param {number} params.bossesKilled - Number of bosses defeated
     * @param {number} params.bossLevel - Current boss level
     * @param {Function} params.getEnemyConfig - Get enemy configuration
     * @param {Function} params.showBossNotification - Show boss notification
     * @param {Function} params.fastCos - Fast cosine function
     * @param {Function} params.fastSin - Fast sine function
     * @param {Function} params.fastPow - Fast power function
     */
    spawnScaledBoss(params) {
        const {
            enemies, player, bossesKilled, bossLevel,
            getEnemyConfig, showBossNotification, fastCos, fastSin, fastPow
        } = params;

        // Spawn boss at a specific distance from player
        const spawnDistance = 250;
        const angle = Math.random() * Math.PI * 2;
        const x = player.x + fastCos(angle) * spawnDistance;
        const y = player.y + fastSin(angle) * spawnDistance;

        const baseConfig = getEnemyConfig('boss');

        // Calculate scaled stats based on bosses killed (15% scaling per boss)
        const healthMultiplier = fastPow(1.4, bossesKilled);
        const speedMultiplier = fastPow(1.05, bossesKilled);
        const damageMultiplier = fastPow(1.15, bossesKilled);
        const sizeMultiplier = fastPow(1.05, bossesKilled);

        // Use effective first boss HP (4000) as base instead of config HP (1000)
        const effectiveBaseHP = 4000;
        const scaledHealth = Math.floor(effectiveBaseHP * healthMultiplier);
        const scaledSpeed = baseConfig.speed * speedMultiplier;
        const scaledDamage = Math.floor(baseConfig.contactDamage * damageMultiplier);
        const scaledRadius = Math.floor(baseConfig.radius * sizeMultiplier);

        enemies.push({
            x: x,
            y: y,
            radius: scaledRadius,
            speed: scaledSpeed,
            baseSpeed: scaledSpeed,
            health: scaledHealth,
            maxHealth: scaledHealth,
            contactDamage: scaledDamage,
            color: baseConfig.color,
            behavior: baseConfig.behavior,
            specialCooldown: 0,
            burning: null,
            angle: 0,
            rotSpeed: 0.02,
            lastMissileFrame: 0,
            spawnedMinions: false,
            bossLevel: bossLevel,
            dashState: {
                active: false,
                targetX: 0,
                targetY: 0,
                duration: 0,
                maxDuration: 30,
                originalSpeed: 0
            }
        });

        showBossNotification();
    }

    /**
     * Get available enemy types based on game time
     * Unlocks types progressively: basic, fast (30s), tank (60s), flyer (120s), phantom (180s)
     * @param {number} gameTime - Game time in seconds
     * @returns {Array} Available enemy type names
     */
    getAvailableEnemyTypes(gameTime) {
        const types = ['basic'];

        if (gameTime > 30) types.push('fast');
        if (gameTime > 60) types.push('tank');
        if (gameTime > 120) types.push('flyer');
        if (gameTime > 180) types.push('phantom');

        return types;
    }

    /**
     * Weighted random selection of enemy type
     * Selection based on predefined weights for balance
     * @param {Array} types - Available enemy types
     * @returns {string} Selected enemy type
     */
    selectEnemyType(types) {
        const weights = {
            'basic': 0.35,
            'fast': 0.25,
            'tank': 0.15,
            'flyer': 0.15,
            'phantom': 0.05,
            'boss': 0.05
        };

        // Weighted random selection
        const random = Math.random();
        let cumulative = 0;

        for (const type of types) {
            cumulative += weights[type] || 0;
            if (random <= cumulative) {
                return type;
            }
        }

        return types[0];
    }

    /**
     * Get enemy stat configurations by type
     * Defines radius, health, speed, damage, color, and behavior
     * @param {string} type - Enemy type name
     * @returns {Object} Enemy configuration object
     */
    getEnemyConfig(type) {
        const configs = {
            basic: {
                radius: 10,
                health: 20,
                speed: 0.75,
                contactDamage: 10,
                color: '#ff00ff', // Neon pink
                behavior: 'chase'
            },
            fast: {
                radius: 7,
                health: 12,
                speed: 1.85,
                contactDamage: 6,
                color: '#ffff00', // Neon yellow
                behavior: 'dodge'
            },
            tank: {
                radius: 15,
                health: 80,
                speed: 0.5,
                contactDamage: 20,
                color: '#ff0040', // Neon red
                behavior: 'tank'
            },
            flyer: {
                radius: 12,
                health: 25,
                speed: 1.25,
                contactDamage: 12,
                color: '#0080ff', // Neon blue
                behavior: 'fly'
            },
            phantom: {
                radius: 9,
                health: 15,
                speed: 0.75,
                contactDamage: 2,
                color: '#74EE15', // Neon green
                behavior: 'teleport'
            },
            boss: {
                radius: 40,
                health: 1000,
                speed: 0.75,
                contactDamage: 50,
                color: '#F000FF', // Neon purple
                behavior: 'boss'
            }
        };

        return configs[type] || configs.basic;
    }

    /**
     * Organize enemies by behavior type for batch processing
     * Groups enemies for optimized behavior handling
     * @param {Array} enemies - All enemies
     * @param {Object} enemiesByBehavior - Object to populate with grouped enemies
     */
    updateEnemyGroupings(enemies, enemiesByBehavior) {
        // Clear existing groupings
        for (const behavior in enemiesByBehavior) {
            enemiesByBehavior[behavior].length = 0;
        }

        // Re-group enemies by behavior
        for (const enemy of enemies) {
            if (enemiesByBehavior[enemy.behavior]) {
                enemiesByBehavior[enemy.behavior].push(enemy);
            }
        }
    }

    /**
     * Route enemies to appropriate batch processors by behavior
     * Optimized performance through behavior grouping
     * @param {Object} params - Parameters object
     * @param {Object} params.enemiesByBehavior - Grouped enemies
     * @param {Function} params.processBatchChase - Chase processor
     * @param {Function} params.processBatchDodge - Dodge processor
     * @param {Function} params.processBatchTank - Tank processor
     * @param {Function} params.processBatchFly - Fly processor
     * @param {Function} params.processBatchTeleport - Teleport processor
     * @param {Function} params.processBatchBoss - Boss processor
     */
    processBatchedEnemies(params) {
        const {
            enemiesByBehavior,
            processBatchChase, processBatchDodge, processBatchTank,
            processBatchFly, processBatchTeleport, processBatchBoss
        } = params;

        processBatchChase(enemiesByBehavior.chase);
        processBatchDodge(enemiesByBehavior.dodge);
        processBatchTank(enemiesByBehavior.tank);
        processBatchFly(enemiesByBehavior.fly);
        processBatchTeleport(enemiesByBehavior.teleport);
        processBatchBoss(enemiesByBehavior.boss);
    }

    /**
     * Chase behavior: directly move toward player
     * @param {Array} chaseEnemies - Enemies with chase behavior
     * @param {Object} player - Player object
     * @param {Function} direction - Vector2.direction function
     */
    processBatchChase(chaseEnemies, player, direction) {
        if (chaseEnemies.length === 0) return;

        const playerX = player.x;
        const playerY = player.y;

        for (const enemy of chaseEnemies) {
            const [dirX, dirY] = direction(enemy.x, enemy.y, playerX, playerY);
            enemy.x += dirX * enemy.speed;
            enemy.y += dirY * enemy.speed;
        }
    }

    /**
     * Dodge behavior: avoid incoming projectiles while chasing player
     * @param {Array} dodgeEnemies - Enemies with dodge behavior
     * @param {Object} player - Player object
     * @param {Array} projectiles - All projectiles
     * @param {Function} direction - Vector2.direction function
     * @param {Function} normalize - Vector2.normalize function
     * @param {Function} add - Vector2.add function
     * @param {Function} distanceSquared - Vector2.distanceSquared function
     */
    processBatchDodge(dodgeEnemies, player, projectiles, direction, normalize, add, distanceSquared) {
        if (dodgeEnemies.length === 0) return;

        const playerX = player.x;
        const playerY = player.y;
        const dodgeRadius = 50;
        const dodgeRadiusSq = dodgeRadius * dodgeRadius;

        for (const enemy of dodgeEnemies) {
            let dodgeX = 0, dodgeY = 0;

            // Check nearby projectiles for dodge behavior
            for (const projectile of projectiles) {
                const pDistSq = distanceSquared(enemy.x, enemy.y, projectile.x, projectile.y);
                if (pDistSq < dodgeRadiusSq && pDistSq > 0) {
                    const [dodgeDirX, dodgeDirY] = direction(projectile.x, projectile.y, enemy.x, enemy.y);
                    const influence = 1 - (pDistSq / dodgeRadiusSq);
                    dodgeX += dodgeDirX * influence;
                    dodgeY += dodgeDirY * influence;
                }
            }

            // Apply movement
            const [dirX, dirY] = direction(enemy.x, enemy.y, playerX, playerY);
            if (dodgeX !== 0 || dodgeY !== 0) {
                const [normDodgeX, normDodgeY] = normalize(dodgeX, dodgeY);
                const [blendX, blendY] = add(
                    normDodgeX * 0.7, normDodgeY * 0.7,
                    dirX * 0.3, dirY * 0.3
                );
                const [finalDirX, finalDirY] = normalize(blendX, blendY);
                enemy.x += finalDirX * enemy.speed;
                enemy.y += finalDirY * enemy.speed;
            } else {
                enemy.x += dirX * enemy.speed;
                enemy.y += dirY * enemy.speed;
            }
        }
    }

    /**
     * Tank behavior: slow heavy unit, spawns minions at 25% health
     * @param {Array} tankEnemies - Enemies with tank behavior
     * @param {Object} player - Player object
     * @param {Function} direction - Vector2.direction function
     * @param {Function} spawnMinions - Callback to spawn minions
     */
    processBatchTank(tankEnemies, player, direction, spawnMinions) {
        if (tankEnemies.length === 0) return;

        const playerX = player.x;
        const playerY = player.y;

        for (const enemy of tankEnemies) {
            const [dirX, dirY] = direction(enemy.x, enemy.y, playerX, playerY);
            enemy.x += dirX * enemy.speed;
            enemy.y += dirY * enemy.speed;

            // Check for minion spawning
            if (enemy.health < enemy.maxHealth * 0.25 && !enemy.spawnedMinions) {
                spawnMinions(enemy.x, enemy.y, 3);
                enemy.spawnedMinions = true;
            }
        }
    }

    /**
     * Fly behavior: orbit player at fixed distance, approach when far
     * @param {Array} flyEnemies - Enemies with fly behavior
     * @param {Object} player - Player object
     * @param {Function} direction - Vector2.direction function
     * @param {Function} distanceSquared - Vector2.distanceSquared function
     * @param {Function} rotate - Vector2.rotate function
     */
    processBatchFly(flyEnemies, player, direction, distanceSquared, rotate) {
        if (flyEnemies.length === 0) return;

        const playerX = player.x;
        const playerY = player.y;
        const orbitRadius = 100;
        const orbitRadiusSq = orbitRadius * orbitRadius;

        for (const enemy of flyEnemies) {
            const [dirX, dirY] = direction(enemy.x, enemy.y, playerX, playerY);
            const distSq = distanceSquared(enemy.x, enemy.y, playerX, playerY);

            if (distSq > orbitRadiusSq) {
                // Move towards player when far
                enemy.x += dirX * enemy.speed;
                enemy.y += dirY * enemy.speed;
            } else {
                // Orbital movement when close
                const [orbitX, orbitY] = rotate(dirX, dirY, Math.PI / 2);
                enemy.x += orbitX * enemy.speed;
                enemy.y += orbitY * enemy.speed;
            }
        }
    }

    /**
     * Teleport behavior: phase in around player with cooldown
     * @param {Array} teleportEnemies - Enemies with teleport behavior
     * @param {Object} player - Player object
     * @param {Function} direction - Vector2.direction function
     * @param {Function} distanceSquared - Vector2.distanceSquared function
     * @param {Function} rotate - Vector2.rotate function
     * @param {Function} createTeleportParticles - Particle effect callback
     */
    processBatchTeleport(teleportEnemies, player, direction, distanceSquared, rotate, createTeleportParticles) {
        if (teleportEnemies.length === 0) return;

        const playerX = player.x;
        const playerY = player.y;
        const teleportRange = 50;
        const teleportRangeSq = teleportRange * teleportRange;

        for (const enemy of teleportEnemies) {
            const distSq = distanceSquared(enemy.x, enemy.y, playerX, playerY);

            if (enemy.specialCooldown <= 0 && distSq > teleportRangeSq) {
                createTeleportParticles(enemy.x, enemy.y);
                const teleportDistance = 80;
                const angle = Math.random() * Math.PI * 2;
                const [teleportX, teleportY] = rotate(teleportDistance, 0, angle);
                enemy.x = playerX + teleportX;
                enemy.y = playerY + teleportY;
                createTeleportParticles(enemy.x, enemy.y);
                enemy.specialCooldown = 180;
            } else {
                const [dirX, dirY] = direction(enemy.x, enemy.y, playerX, playerY);
                enemy.x += dirX * enemy.speed * 0.5;
                enemy.y += dirY * enemy.speed * 0.5;
            }
        }
    }

    /**
     * Boss behavior: 3-phase AI with health-based transitions
     * Phase 1 (>70%): Direct chase with 1.5x speed
     * Phase 2 (30-70%): Faster movement with 1.8x speed
     * Phase 3 (<30%): Dash attacks with up to 6x speed
     * Teleports if >800 units away, fires phase-based missiles
     * @param {Array} bossEnemies - Enemies with boss behavior
     * @param {Object} player - Player object
     * @param {number} frameCount - Current frame count
     * @param {number} bossesKilled - Number of bosses defeated
     * @param {Function} direction - Vector2.direction function
     * @param {Function} distanceSquared - Vector2.distanceSquared function
     * @param {Function} cachedSqrt - Cached square root function
     * @param {Function} createBossMissile - Boss missile callback
     * @param {Function} createHitParticles - Hit particle callback
     */
    processBatchBoss(bossEnemies, player, frameCount, bossesKilled, direction, distanceSquared, cachedSqrt, createBossMissile, createHitParticles) {
        if (bossEnemies.length === 0) return;

        const playerX = player.x;
        const playerY = player.y;

        for (const enemy of bossEnemies) {
            // Skip if boss is already dead/dying
            if (enemy.health <= 0) {
                continue;
            }

            // Enhanced boss AI with phases based on health
            const bossHealthPercent = enemy.health / enemy.maxHealth;
            const [dirX, dirY] = direction(enemy.x, enemy.y, playerX, playerY);
            const distSq = distanceSquared(enemy.x, enemy.y, playerX, playerY);
            const distance = cachedSqrt(distSq);

            // Boss teleportation - prevent player from escaping boss fight
            const maxBossDistance = 800;
            if (distance > maxBossDistance) {
                // Create burst particles at current position before teleporting
                for (let i = 0; i < 8; i++) {
                    createHitParticles(enemy.x, enemy.y, '#FF0066');
                }

                // Teleport boss in the direction the player ran FROM (behind the player)
                const [teleportDirX, teleportDirY] = direction(playerX, playerY, enemy.x, enemy.y);
                const teleportDistance = 400 + Math.random() * 100;
                enemy.x = playerX + teleportDirX * teleportDistance;
                enemy.y = playerY + teleportDirY * teleportDistance;

                // Create burst particles at new position after teleporting
                for (let i = 0; i < 8; i++) {
                    createHitParticles(enemy.x, enemy.y, '#FF0066');
                }
            }

            // Boss missile firing logic
            const missileInterval = 200;
            if (frameCount - enemy.lastMissileFrame >= missileInterval) {
                createBossMissile(enemy, bossHealthPercent);
                enemy.lastMissileFrame = frameCount;
            }

            // Phase 1: Direct chase (above 70% health)
            if (bossHealthPercent > 0.7) {
                const phaseMultiplier = 1.5;
                enemy.x += dirX * enemy.speed * phaseMultiplier;
                enemy.y += dirY * enemy.speed * phaseMultiplier;
            }
            // Phase 2: Increased aggression - faster movement (30-70% health)
            else if (bossHealthPercent > 0.3) {
                enemy.x += dirX * enemy.speed * 1.8;
                enemy.y += dirY * enemy.speed * 1.8;
            }
            // Phase 3: Dash movement towards player (below 30% health)
            else {
                // Dash state management for aggressive Phase 3 behavior
                if (!enemy.dashState.active) {
                    // Start new dash towards player
                    if (enemy.specialCooldown <= 0) {
                        enemy.dashState.active = true;
                        enemy.dashState.targetX = playerX;
                        enemy.dashState.targetY = playerY;
                        enemy.dashState.duration = 0;
                        enemy.dashState.originalSpeed = enemy.speed;
                        // Decrease dash cooldown by 3 per boss stage, minimum 36 frames
                        const baseCooldown = 90;
                        const cooldownReduction = (bossesKilled || 0) * 3;
                        const minCooldown = 36;
                        enemy.specialCooldown = Math.max(minCooldown, baseCooldown - cooldownReduction);
                    } else {
                        // Faster normal movement while dash is on cooldown
                        enemy.x += dirX * enemy.speed * 2.0;
                        enemy.y += dirY * enemy.speed * 2.0;
                    }
                } else {
                    // Execute dash movement with much higher speed
                    const [dashDirX, dashDirY] = direction(enemy.x, enemy.y, enemy.dashState.targetX, enemy.dashState.targetY);
                    const dashSpeed = enemy.speed * 6;

                    enemy.x += dashDirX * dashSpeed;
                    enemy.y += dashDirY * dashSpeed;

                    enemy.dashState.duration++;

                    // Longer dash distance with faster speed
                    const distToTarget = distanceSquared(enemy.x, enemy.y, enemy.dashState.targetX, enemy.dashState.targetY);
                    if (enemy.dashState.duration >= enemy.dashState.maxDuration || distToTarget < 100) {
                        enemy.dashState.active = false;
                        enemy.dashState.duration = 0;
                    }
                }
            }
        }
    }

    /**
     * Main update loop for all enemies
     * Processes health effects, rotation, death, and despawn
     * @param {Object} params - Parameters object
     * @param {Array} params.enemies - All enemies
     * @param {number} params.frameCount - Current frame count
     * @param {Object} params.player - Player object
     * @param {boolean} params.bossDefeating - Is boss defeating
     * @param {Function} params.updateEnemyGroupings - Grouping callback
     * @param {Function} params.processBatchedEnemies - Batch processing callback
     * @param {Function} params.createXPOrb - XP orb callback
     * @param {Function} params.createDeathParticles - Death particle callback
     * @param {Function} params.createHitParticles - Hit particle callback
     * @param {Function} params.recordWeaponDamage - Damage record callback
     * @param {Function} params.createBossDefeatAnimation - Boss defeat animation callback
     * @param {Function} params.setBossDefeating - Set boss defeating flag callback
     * @param {Function} params.clearProjectiles - Clear all projectiles callback
     * @param {Function} params.bossDefeated - Boss defeated callback
     * @param {Function} params.cachedSqrt - Cached square root function
     */
    updateEnemies(params) {
        const {
            enemies, frameCount, player, bossDefeating,
            updateEnemyGroupings, processBatchedEnemies,
            createXPOrb, createDeathParticles, createHitParticles,
            recordWeaponDamage, createBossDefeatAnimation, setBossDefeating,
            clearProjectiles, bossDefeated, cachedSqrt
        } = params;

        // Update enemy groupings for optimized batch processing
        updateEnemyGroupings();

        // Process all enemy movements in optimized batches
        processBatchedEnemies();

        // Use reverse iteration for safe and efficient removal
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];

            // Handle burning damage over time
            if (enemy.burning) {
                if (enemy.burning.duration-- <= 0) {
                    enemy.burning = null;
                } else if (frameCount % 20 === 0) { // Damage every 1/3 second
                    enemy.health -= enemy.burning.damage;
                    if (enemy.burning.sourceType) {
                        recordWeaponDamage(enemy.burning.sourceType, enemy.burning.damage, enemy);
                    }
                    createHitParticles(enemy.x, enemy.y, '#ff6348');
                }
            }

            if (enemy.specialCooldown > 0) {
                enemy.specialCooldown--;
            }

            // Only rotate tank and boss enemies for performance
            if (enemy.behavior === 'tank' || enemy.behavior === 'boss') {
                enemy.angle += enemy.rotSpeed;
            }

            // Remove dead enemies
            if (enemy.health <= 0) {
                // Check if this was a boss enemy
                if (enemy.behavior === 'boss') {
                    // Prevent multiple boss defeat triggers
                    if (bossDefeating) {
                        return;
                    }

                    // Set boss defeating flag to prevent multiple triggers
                    setBossDefeating(true);

                    // Save boss position and size for animation
                    const bossX = enemy.x;
                    const bossY = enemy.y;
                    const bossRadius = enemy.radius;

                    // Mark boss as defeated so it doesn't render during defeat animation
                    enemy.isDefeated = true;

                    // Clear all normal enemies for clean boss defeat animation
                    for (let j = enemies.length - 1; j >= 0; j--) {
                        if (enemies[j].behavior !== 'boss' && !enemies[j].isDefeated) {
                            enemies.splice(j, 1);
                        }
                    }

                    // Clear all projectiles (including boss missiles) for clean animation
                    clearProjectiles();

                    // Trigger boss defeat animation with saved position/size
                    createBossDefeatAnimation(bossX, bossY, bossRadius);

                    // Remove boss from enemies array after a short delay
                    // This ensures rendering has time to skip it via isDefeated flag
                    setTimeout(() => {
                        const bossIndex = enemies.indexOf(enemy);
                        if (bossIndex !== -1) {
                            enemies.splice(bossIndex, 1);
                        }
                    }, 100); // Remove after 100ms (multiple frames)

                    // Show victory screen after animation delay
                    setTimeout(() => {
                        bossDefeated();
                    }, 2000); // 2 second delay for animation to play

                    return;
                }

                createXPOrb(enemy.x, enemy.y);
                createDeathParticles(enemy.x, enemy.y, enemy.color);
                enemies.splice(i, 1);
            } else {
                // Remove enemies that are too far from player (performance optimization)
                // But NEVER remove bosses - they use teleportation instead
                if (enemy.behavior !== 'boss') {
                    const dx = enemy.x - player.x;
                    const dy = enemy.y - player.y;
                    const distanceFromPlayer = cachedSqrt(dx * dx + dy * dy);

                    if (distanceFromPlayer > 1200) {
                        enemies.splice(i, 1);
                    }
                }
            }
        }
    }

    /**
     * Create boss missile patterns based on phase
     * Phase 1: 3-missile spread, Phase 2: 5-missile spread, Phase 3: 7-missile burst
     * @param {Object} params - Parameters object
     * @param {Object} params.boss - Boss enemy object
     * @param {Object} params.player - Player object
     * @param {Array} params.projectiles - Projectiles array
     * @param {number} params.healthPercent - Boss health percentage (0-1)
     * @param {number} params.bossLevel - Boss level for scaling
     * @param {Function} params.fastCos - Fast cosine function
     * @param {Function} params.fastSin - Fast sine function
     * @param {Function} params.fastPow - Fast power function
     */
    createBossMissile(params) {
        const { boss, player, projectiles, healthPercent = 1.0, bossLevel, fastCos, fastSin, fastPow } = params;

        const angleToPlayer = Math.atan2(player.y - boss.y, player.x - boss.x);
        let spreadAngles, damage, speed, homingStrength, color;

        // Scale missile stats based on boss level
        const level = bossLevel || 1;
        const speedMultiplier = fastPow(1.05, level - 1);
        const damageMultiplier = fastPow(1.15, level - 1);

        // Phase 1: Basic 3-missile spread (above 70% health)
        if (healthPercent > 0.7) {
            spreadAngles = [-0.3, 0, 0.3];
            damage = Math.floor(25 * damageMultiplier);
            speed = 2.5 * speedMultiplier;
            homingStrength = 0.05;
            color = '#FF0066';
        }
        // Phase 2: 5-missile spread with faster speed (30-70% health)
        else if (healthPercent > 0.3) {
            spreadAngles = [-0.6, -0.3, 0, 0.3, 0.6];
            damage = Math.floor(30 * damageMultiplier);
            speed = 2.75 * speedMultiplier;
            homingStrength = 0.07;
            color = '#FF3366';
        }
        // Phase 3: 7-missile burst with high speed and homing (below 30% health)
        else {
            spreadAngles = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9];
            damage = Math.floor(35 * damageMultiplier);
            speed = 3 * speedMultiplier;
            homingStrength = 0.10;
            color = '#FF0033';
        }

        spreadAngles.forEach(angleOffset => {
            const missile = {
                x: boss.x,
                y: boss.y,
                vx: fastCos(angleToPlayer + angleOffset) * speed,
                vy: fastSin(angleToPlayer + angleOffset) * speed,
                damage: damage,
                life: 300,
                type: 'boss-missile',
                color: color,
                size: 4,
                homing: true,
                homingStrength: homingStrength,
                explosionRadius: 40,
                speed: speed,
                owner: 'enemy'
            };
            projectiles.push(missile);
        });
    }

    /**
     * Spawn boss minions when tank enemy reaches 25% health
     * Creates minions in circular pattern around spawn point
     * @param {Object} params - Parameters object
     * @param {Array} params.enemies - Enemies array
     * @param {number} params.x - Spawn position X
     * @param {number} params.y - Spawn position Y
     * @param {number} params.count - Number of minions to spawn
     * @param {Function} params.fastCos - Fast cosine function
     * @param {Function} params.fastSin - Fast sine function
     */
    spawnMinions(params) {
        const { enemies, x, y, count, fastCos, fastSin } = params;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            enemies.push({
                x: x + fastCos(angle) * 30,
                y: y + fastSin(angle) * 30,
                radius: 6,
                speed: 1.5,
                maxHealth: 8,
                health: 8,
                contactDamage: 5,
                color: '#7F8C8D',
                behavior: 'chase',
                specialCooldown: 0,
                burning: null,
                spawnedMinions: false
            });
        }
    }

    /**
     * Resets enemy system state
     */
    reset() {
        this.spawnRate = 120;
        this.lastSpawn = 0;
        this.bossSpawned = false;
        this.nextBossSpawnTime = null;
    }
}
