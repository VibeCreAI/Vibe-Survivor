/**
 * Pickup System
 * Manages XP orbs, HP orbs, and magnet orbs spawning, collection, and behavior
 */

export class PickupSystem {
    constructor() {
        // Spawn timers and configuration
        this.hpOrbSpawnTimer = 0;
        this.hpOrbSpawnRate = 120; // frames between HP orb spawn chances (2 seconds)
        this.hpOrbSpawnChance = 0.08; // 8% chance per check
        this.maxHpOrbs = 1; // Maximum HP orbs on map

        this.magnetOrbSpawnTimer = 0;
        this.magnetOrbSpawnRate = 120; // frames between magnet orb spawn chances (2 seconds)
        this.magnetOrbSpawnChance = 0.08; // 8% chance per check
        this.maxMagnetOrbs = 1; // Maximum magnet orbs on map

        // Object pools (will be injected)
        this.xpOrbPool = null;
        this.hpOrbPool = null;
        this.magnetOrbPool = null;
    }

    /**
     * Sets object pools for recycling
     * @param {Array} xpOrbPool - XP orb pool
     * @param {Array} hpOrbPool - HP orb pool
     * @param {Array} magnetOrbPool - Magnet orb pool
     */
    setPools(xpOrbPool, hpOrbPool, magnetOrbPool) {
        this.xpOrbPool = xpOrbPool;
        this.hpOrbPool = hpOrbPool;
        this.magnetOrbPool = magnetOrbPool;
    }

    /**
     * Updates XP orbs (magnetization, collection, glow)
     * @param {Array} xpOrbs - XP orb array
     * @param {Object} player - Player object
     * @param {Function} cachedSqrt - Cached square root function
     * @param {boolean} bossDefeating - Skip updates during boss defeat
     */
    updateXPOrbs(xpOrbs, player, cachedSqrt, bossDefeating) {
        // Skip XP orb collection during boss defeat animation for clean victory sequence
        if (bossDefeating) {
            // XP orbs remain visible but are not collectible during boss defeat animation
            // This prevents level up timing conflicts during the cinematic moment
            return;
        }

        // Use reverse iteration for safe and efficient removal
        for (let i = xpOrbs.length - 1; i >= 0; i--) {
            const orb = xpOrbs[i];
            const dx = player.x - orb.x;
            const dy = player.y - orb.y;
            const distanceSquared = dx * dx + dy * dy;

            // Player magnet effect (enhanced when magnetBoost is active)
            let magnetRange = player.passives.magnet ? 80 : 40;

            // Enhanced magnet range and strength when magnetBoost is active
            if (player.magnetBoost > 0) {
                magnetRange = 2000; // Large range when magnet boost is active
            }

            const magnetRangeSquared = magnetRange * magnetRange;
            if (distanceSquared < magnetRangeSquared) {
                const distance = cachedSqrt(distanceSquared); // Only calculate sqrt when needed
                const attractionSpeed = player.magnetBoost > 0 ? 12 : 4; // Triple speed with boost (50% faster than double)
                orb.x += (dx / distance) * attractionSpeed;
                orb.y += (dy / distance) * attractionSpeed;
            }

            orb.glow = (orb.glow + 0.2) % (Math.PI * 2);

            // Collect orb (optimized comparison)
            if (distanceSquared < 225) { // 15 * 15 = 225
                player.xp += orb.value;

                // Update trail multiplier based on XP progress
                const xpRequired = player.level * 5 + 10;
                const xpProgress = player.xp / xpRequired;
                player.trailMultiplier = 1.0 + (xpProgress * 3.0);

                // Return to pool instead of creating garbage
                orb.active = false;
                xpOrbs.splice(i, 1);
            } else if (orb.life-- <= 0) {
                // Return to pool instead of creating garbage
                orb.active = false;
                xpOrbs.splice(i, 1);
            }
        }
    }

    /**
     * Updates HP orbs (magnetization, collection, healing)
     * @param {Array} hpOrbs - HP orb array
     * @param {Object} player - Player object
     * @param {Function} cachedSqrt - Cached square root function
     * @param {Function} showToastNotification - Toast notification callback
     * @param {boolean} bossDefeating - Skip updates during boss defeat
     */
    updateHPOrbs(hpOrbs, player, cachedSqrt, showToastNotification, bossDefeating) {
        // Skip HP orb collection during boss defeat animation
        if (bossDefeating) {
            return;
        }

        // Use reverse iteration for safe and efficient removal
        for (let i = hpOrbs.length - 1; i >= 0; i--) {
            const orb = hpOrbs[i];
            const dx = player.x - orb.x;
            const dy = player.y - orb.y;
            const distanceSquared = dx * dx + dy * dy;

            // Magnet effect - same as XP orbs
            const magnetRange = player.passives.magnet ? 80 : 40;
            const magnetRangeSquared = magnetRange * magnetRange;
            if (distanceSquared < magnetRangeSquared) {
                const distance = cachedSqrt(distanceSquared);
                orb.x += (dx / distance) * 4;
                orb.y += (dy / distance) * 4;
            }

            orb.glow = (orb.glow + 0.2) % (Math.PI * 2);

            // Collect orb
            if (distanceSquared < 225) { // 15 * 15 = 225
                // Heal player
                const healAmount = orb.healAmount;
                const oldHealth = player.health;
                player.health = Math.min(player.maxHealth, player.health + healAmount);
                const actualHeal = player.health - oldHealth;

                // Show healing notification if we actually healed
                if (actualHeal > 0 && showToastNotification) {
                    showToastNotification(`+${actualHeal} HP`, 'heal');
                }

                // Return to pool
                orb.active = false;
                hpOrbs.splice(i, 1);
            } else if (orb.life-- <= 0) {
                // Return to pool when expired
                orb.active = false;
                hpOrbs.splice(i, 1);
            }
        }
    }

    /**
     * Updates magnet orbs (magnetization, collection, activation)
     * @param {Array} magnetOrbs - Magnet orb array
     * @param {Object} player - Player object
     * @param {Function} cachedSqrt - Cached square root function
     * @param {Function} showToastNotification - Toast notification callback
     * @param {boolean} bossDefeating - Skip updates during boss defeat
     */
    updateMagnetOrbs(magnetOrbs, player, cachedSqrt, showToastNotification, bossDefeating) {
        // Skip magnet orb collection during boss defeat animation
        if (bossDefeating) {
            return;
        }

        // Use reverse iteration for safe and efficient removal
        for (let i = magnetOrbs.length - 1; i >= 0; i--) {
            const orb = magnetOrbs[i];
            const dx = player.x - orb.x;
            const dy = player.y - orb.y;
            const distanceSquared = dx * dx + dy * dy;

            // Magnet effect - same as other orbs
            const magnetRange = player.passives.magnet ? 80 : 40;
            const magnetRangeSquared = magnetRange * magnetRange;
            if (distanceSquared < magnetRangeSquared) {
                const distance = cachedSqrt(distanceSquared);
                orb.x += (dx / distance) * 4;
                orb.y += (dy / distance) * 4;
            }

            orb.glow = (orb.glow + 0.2) % (Math.PI * 2);

            // Collect orb
            if (distanceSquared < 225) { // 15 * 15 = 225
                // Activate magnet boost until all XP orbs are absorbed
                player.magnetBoost = 1;

                // Show magnet activation notification
                if (showToastNotification) {
                    showToastNotification(`MAGNET ACTIVATED!`, 'magnet');
                }

                // Return to pool
                orb.active = false;
                magnetOrbs.splice(i, 1);
            } else if (orb.life-- <= 0) {
                // Return to pool when expired
                orb.active = false;
                magnetOrbs.splice(i, 1);
            }
        }
    }

    /**
     * Creates an XP orb at the specified location
     * @param {Array} xpOrbs - XP orb array
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Function} getPooledXPOrb - Object pool getter
     */
    createXPOrb(xpOrbs, x, y, getPooledXPOrb) {
        const orb = getPooledXPOrb();
        if (orb) {
            orb.x = x;
            orb.y = y;
            orb.value = 1;
            xpOrbs.push(orb);
        }
    }

    /**
     * Spawns HP orbs at random intervals
     * @param {Array} hpOrbs - HP orb array
     * @param {boolean} playerDead - Skip spawning if player is dead
     * @param {boolean} isPaused - Skip spawning if paused
     * @param {boolean} bossDefeating - Skip spawning during boss defeat
     */
    spawnHPOrbs(hpOrbs, playerDead, isPaused, bossDefeating) {
        // Only spawn HP orbs during active gameplay
        if (playerDead || isPaused || bossDefeating) {
            return;
        }

        // Check if it's time to attempt HP orb spawn
        this.hpOrbSpawnTimer++;
        if (this.hpOrbSpawnTimer >= this.hpOrbSpawnRate) {
            this.hpOrbSpawnTimer = 0;

            // Don't spawn if we already have maximum HP orbs
            if (hpOrbs.length >= this.maxHpOrbs) {
                return;
            }

            // Random chance to spawn HP orb
            if (Math.random() < this.hpOrbSpawnChance) {
                return true; // Signal to create HP orb
            }
        }
        return false;
    }

    /**
     * Creates an HP orb at a random location
     * @param {Array} hpOrbs - HP orb array
     * @param {Object} player - Player object for positioning
     * @param {Function} getPooledHPOrb - Object pool getter
     * @param {Function} fastCos - Fast cosine function
     * @param {Function} fastSin - Fast sine function
     */
    createHPOrb(hpOrbs, player, getPooledHPOrb, fastCos, fastSin) {
        const orb = getPooledHPOrb();
        if (orb) {
            // Spawn at random angle and distance from player
            const angle = Math.random() * Math.PI * 2;
            const distance = 300 + Math.random() * 500; // 300-800 units away
            orb.x = player.x + fastCos(angle) * distance;
            orb.y = player.y + fastSin(angle) * distance;
            orb.healAmount = 30;
            hpOrbs.push(orb);
        }
    }

    /**
     * Spawns magnet orbs at random intervals
     * @param {Array} magnetOrbs - Magnet orb array
     * @param {boolean} playerDead - Skip spawning if player is dead
     * @param {boolean} isPaused - Skip spawning if paused
     * @param {boolean} bossDefeating - Skip spawning during boss defeat
     */
    spawnMagnetOrbs(magnetOrbs, playerDead, isPaused, bossDefeating) {
        // Only spawn magnet orbs during active gameplay
        if (playerDead || isPaused || bossDefeating) {
            return;
        }

        // Check if it's time to attempt magnet orb spawn
        this.magnetOrbSpawnTimer++;
        if (this.magnetOrbSpawnTimer >= this.magnetOrbSpawnRate) {
            this.magnetOrbSpawnTimer = 0;

            // Don't spawn if we already have maximum magnet orbs
            if (magnetOrbs.length >= this.maxMagnetOrbs) {
                return;
            }

            // Random chance to spawn magnet orb
            if (Math.random() < this.hpOrbSpawnChance) { // Same probability as HP orbs
                return true; // Signal to create magnet orb
            }
        }
        return false;
    }

    /**
     * Creates a magnet orb at a random location
     * @param {Array} magnetOrbs - Magnet orb array
     * @param {Object} player - Player object for positioning
     * @param {Function} getPooledMagnetOrb - Object pool getter
     * @param {Function} fastCos - Fast cosine function
     * @param {Function} fastSin - Fast sine function
     */
    createMagnetOrb(magnetOrbs, player, getPooledMagnetOrb, fastCos, fastSin) {
        const orb = getPooledMagnetOrb();
        if (orb) {
            // Spawn at random angle and distance from player
            const angle = Math.random() * Math.PI * 2;
            const distance = 300 + Math.random() * 500; // 300-800 units away
            orb.x = player.x + fastCos(angle) * distance;
            orb.y = player.y + fastSin(angle) * distance;
            orb.duration = 300; // Last for 5 seconds
            magnetOrbs.push(orb);
        }
    }

    /**
     * Resets pickup system state
     */
    reset() {
        this.hpOrbSpawnTimer = 0;
        this.magnetOrbSpawnTimer = 0;
    }
}
