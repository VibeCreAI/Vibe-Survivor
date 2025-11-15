/**
 * Player System
 * Manages player movement, abilities, passives, and level progression
 */

export class PlayerSystem {
    constructor() {
        // No internal state - operates on player object passed to methods
    }

    /**
     * Updates player movement, dash mechanics, and animation
     * @param {Object} player - Player state object
     * @param {Object} inputManager - Input manager reference
     * @param {Object} animationController - Animation controller reference
     * @param {Object} spriteConfig - Sprite configuration
     * @param {Function} cachedSqrt - Cached square root function
     * @param {Function} createDashParticles - Dash particle creation callback
     * @param {Object} qualitySettings - Quality settings for trail
     * @param {Object} audioManager - Audio manager for sound effects
     */
    updatePlayer(player, inputManager, animationController, spriteConfig, cachedSqrt, createDashParticles, qualitySettings, audioManager) {
        const keys = inputManager.keys;
        const touchControls = inputManager.touchControls;
        const isMobile = inputManager.isMobile;

        // Calculate movement from keyboard (WASD or Arrow keys)
        let moveX = 0, moveY = 0;

        if (keys['w'] || keys['arrowup']) moveY -= 1;
        if (keys['s'] || keys['arrowdown']) moveY += 1;
        if (keys['a'] || keys['arrowleft']) moveX -= 1;
        if (keys['d'] || keys['arrowright']) moveX += 1;

        // Override with mobile joystick if active (takes priority for mobile)
        if (isMobile && touchControls.joystick.active) {
            moveX = touchControls.joystick.moveX;
            moveY = touchControls.joystick.moveY;
        }

        // Calculate speed with boost passive
        let speed = player.speed;
        if (player.passives.speed_boost) {
            const speedStacks = typeof player.passives.speed_boost === 'number' ? player.passives.speed_boost : 1;
            speed *= (1 + 0.1 * speedStacks); // 10% increase per stack (matches PASSIVES.SPEED_BOOST.value)
        }

        // Normalize diagonal movement
        const magnitude = cachedSqrt(moveX * moveX + moveY * moveY);
        if (magnitude > 0) {
            moveX /= magnitude;
            moveY /= magnitude;
        }

        // Apply movement
        player.x += moveX * speed;
        player.y += moveY * speed;

        // Dash mechanic with Spacebar key or dash button
        const shouldDash = keys[' '] || touchControls.dashButton.pressed;
        if (shouldDash && !player.dashCooldown) {
            let dashDistance = 40;
            // Apply dash boost passive (+50% distance per stack)
            if (player.passives.dash_boost) {
                const dashStacks = typeof player.passives.dash_boost === 'number' ? player.passives.dash_boost : 1;
                dashDistance *= (1 + 0.5 * dashStacks); // 50% increase per stack
            }
            let dashX = 0, dashY = 0;

            // Use current movement direction for dash
            if (moveX !== 0 || moveY !== 0) {
                // Normalize the movement direction for consistent dash distance
                const magnitude = cachedSqrt(moveX * moveX + moveY * moveY);
                dashX = (moveX / magnitude) * dashDistance;
                dashY = (moveY / magnitude) * dashDistance;
            } else {
                // Fallback: check individual keys if moveX/moveY are both 0 (keyboard ghosting issue)
                let fallbackX = 0, fallbackY = 0;

                // Check arrow keys individually first (prone to ghosting with spacebar)
                if (keys['arrowup']) fallbackY -= 1;
                if (keys['arrowdown']) fallbackY += 1;
                if (keys['arrowleft']) fallbackX -= 1;
                if (keys['arrowright']) fallbackX += 1;

                // If no arrow keys detected, try WASD as backup
                if (fallbackX === 0 && fallbackY === 0) {
                    if (keys['w']) fallbackY -= 1;
                    if (keys['s']) fallbackY += 1;
                    if (keys['a']) fallbackX -= 1;
                    if (keys['d']) fallbackX += 1;
                }

                if (fallbackX !== 0 || fallbackY !== 0) {
                    const magnitude = cachedSqrt(fallbackX * fallbackX + fallbackY * fallbackY);
                    dashX = (fallbackX / magnitude) * dashDistance;
                    dashY = (fallbackY / magnitude) * dashDistance;
                } else {
                    // Default forward dash if no direction
                    dashY = -dashDistance;
                }
            }

            player.x += dashX;
            player.y += dashY;
            player.dashCooldown = 30;
            player.invulnerable = 30;
            createDashParticles();

            // Play dash sound effect
            if (audioManager) {
                audioManager.playSound('dash');
            }

            // Reset dash button state after use
            touchControls.dashButton.pressed = false;
        }

        if (player.dashCooldown > 0) {
            player.dashCooldown--;
        }

        if (player.invulnerable > 0) {
            player.invulnerable--;
        }

        // No bounds checking - infinite world!

        // Update trail
        player.trail.push({ x: player.x, y: player.y });
        const baseTrailLength = qualitySettings?.trailLength || 8;
        const maxTrailLength = Math.floor(baseTrailLength * (player.trailMultiplier || 1.0));
        if (player.trail.length > maxTrailLength) {
            player.trail.shift();
        }

        player.glow = (player.glow + 0.1) % (Math.PI * 2);

        // Update sprite direction based on movement (must be in update loop for consistency)
        let movementAngle = player.lastMovementAngle || 0;
        let isMoving = false;

        // Check for joystick movement first (takes priority for mobile)
        if (isMobile && touchControls.joystick.active &&
            (Math.abs(touchControls.joystick.moveX) > 0.1 || Math.abs(touchControls.joystick.moveY) > 0.1)) {
            const joystickAngle = Math.atan2(touchControls.joystick.moveY, touchControls.joystick.moveX);
            movementAngle = (joystickAngle * 180 / Math.PI);
            isMoving = true;
        }
        // Check keyboard controls
        else if (moveX !== 0 || moveY !== 0) {
            movementAngle = Math.atan2(moveY, moveX) * 180 / Math.PI;
            isMoving = true;
        }

        // Update sprite direction
        if (!isMoving) {
            player.spriteDirection = 'idle';
        } else {
            // Determine direction based on angle
            if (movementAngle >= -112.5 && movementAngle < -67.5) {
                player.spriteDirection = 'up';
            } else if (movementAngle >= -67.5 && movementAngle < 67.5) {
                player.spriteDirection = 'right';
            } else if (movementAngle >= 67.5 && movementAngle < 112.5) {
                player.spriteDirection = 'down';
            } else {
                player.spriteDirection = 'left';
            }
        }

        // Update sprite animation (fixed timestep, independent of draw rate)
        animationController.updateFrame(spriteConfig);
    }

    /**
     * Updates player passive abilities
     * @param {Object} player - Player state object
     */
    updatePassives(player) {
        // Regeneration - handle both boolean and object cases
        if (player.passives.regeneration) {
            // Increment regeneration timer
            if (!player.regenerationTimer) player.regenerationTimer = 0;
            player.regenerationTimer++;

            // Heal 1 HP every 60 frames (1 second)
            if (player.regenerationTimer >= 60) {
                player.regenerationTimer = 0;
                if (player.health < player.maxHealth) {
                    player.health = Math.min(player.maxHealth, player.health + 1);
                }
            }
        }
    }

    /**
     * Checks if player should level up
     * @param {Object} player - Player state object
     * @param {boolean} bossDefeating - Defer level ups during boss defeat
     * @param {boolean} bossVictoryInProgress - Defer level ups during victory screen
     * @param {Function} showLevelUpModal - Level up modal callback
     * @returns {boolean} True if level up was deferred (pending)
     */
    checkLevelUp(player, bossDefeating, bossVictoryInProgress, showLevelUpModal) {
        const xpRequired = player.level * 5 + 10;

        if (player.xp >= xpRequired) {
            player.xp -= xpRequired;
            player.level++;

            // Update trail multiplier
            const xpProgress = player.xp / ((player.level) * 5 + 10);
            player.trailMultiplier = 1.0 + (xpProgress * 3.0);

            // Defer level up if boss is being defeated or victory screen is active
            if (bossDefeating || bossVictoryInProgress) {
                return true; // Return true to indicate pending level up
            }

            // Show level up modal
            showLevelUpModal();
        }

        return false;
    }

    /**
     * Processes pending level ups after boss defeat
     * @param {number} pendingLevelUps - Number of pending level ups
     * @param {boolean} bossVictoryInProgress - Whether victory screen is active
     * @param {boolean} bossDefeating - Whether boss is being defeated
     * @param {Function} showLevelUpModal - Level up modal callback
     * @returns {Object} Result with updated pendingLevelUps count and whether modal was shown
     */
    processPendingLevelUps(pendingLevelUps, bossVictoryInProgress, bossDefeating, showLevelUpModal) {
        if (pendingLevelUps > 0 && !bossVictoryInProgress && !bossDefeating) {
            // Process one level up at a time
            showLevelUpModal();
            return {
                pendingLevelUps: pendingLevelUps - 1,
                modalShown: true
            };
        }

        return {
            pendingLevelUps: pendingLevelUps,
            modalShown: false
        };
    }

    /**
     * Applies damage to player with armor reduction
     * @param {Object} player - Player state object
     * @param {number} damage - Raw damage amount
     * @returns {number} Actual damage applied after armor
     */
    applyDamage(player, damage) {
        // Skip if invulnerable
        if (player.invulnerable > 0) return 0;

        // Apply armor damage reduction
        let damageReduction = 0;
        if (player.passives.armor) {
            const armorCount = typeof player.passives.armor === 'number' ? player.passives.armor : 1;
            damageReduction = 1 - Math.pow(0.85, armorCount); // Diminishing returns: 15%, 27.75%, 38.6%, etc.
            damageReduction = Math.min(damageReduction, 0.9); // Cap at 90% reduction
        }

        const actualDamage = damage * (1 - damageReduction);
        player.health -= actualDamage;

        // Set invulnerability frames
        player.invulnerable = 60; // 1 second of invulnerability

        return actualDamage;
    }

    /**
     * Resets player system state
     */
    reset() {
        // No internal state to reset
    }
}
