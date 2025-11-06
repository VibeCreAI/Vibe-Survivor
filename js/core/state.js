// State management for Vibe Survivor
// Extracted from vibe-survivor-game.js during Phase 4a refactoring

import { PLAYER } from '../config/constants.js';

/**
 * Creates initial player state object
 * @param {number} x - Initial X position (default: 0)
 * @param {number} y - Initial Y position (default: 0)
 * @returns {Object} Player state object
 */
export function createPlayerState(x = 0, y = 0) {
    return {
        // Position and physics
        x: x,
        y: y,
        radius: PLAYER.RADIUS,
        speed: PLAYER.SPEED,

        // Health and XP
        health: PLAYER.STARTING_HEALTH,
        maxHealth: PLAYER.MAX_HEALTH,
        xp: 0,
        level: PLAYER.STARTING_LEVEL,

        // Visual and effects
        glow: 0,
        invulnerable: 0,

        // Abilities
        dashCooldown: 0,
        trail: [],

        // Upgrades and passives
        passives: {},
        trailMultiplier: PLAYER.TRAIL_MULTIPLIER,
        magnetBoost: 0,

        // Sprite animation
        spriteFrame: 0,
        spriteTimer: 0,
        spriteDirection: 'idle'
    };
}

/**
 * Creates initial camera state object
 * @param {number} x - Initial camera X position (default: 0)
 * @param {number} y - Initial camera Y position (default: 0)
 * @returns {Object} Camera state object
 */
export function createCameraState(x = 0, y = 0) {
    return {
        x: x,
        y: y
    };
}

/**
 * Creates partial game state for Phase 4a
 * This will be expanded in Phase 4b to include enemies, weapons, pickups, etc.
 * @returns {Object} Partial game state with player and camera
 */
export function createGameState() {
    return {
        player: createPlayerState(),
        camera: createCameraState()
        // NOTE: Phase 4b will add:
        // - enemies: []
        // - weapons: []
        // - projectiles: []
        // - pickups: []
        // - particles: []
        // - ui: { ... }
        // - gameState: { ... }
    };
}

/**
 * Resets player state to initial values
 * @param {Object} player - Player state object to reset
 */
export function resetPlayerState(player) {
    player.x = 0;
    player.y = 0;
    player.radius = PLAYER.RADIUS;
    player.speed = PLAYER.SPEED;
    player.health = PLAYER.STARTING_HEALTH;
    player.maxHealth = PLAYER.MAX_HEALTH;
    player.xp = 0;
    player.level = PLAYER.STARTING_LEVEL;
    player.glow = 0;
    player.invulnerable = 0;
    player.dashCooldown = 0;
    player.trail = [];
    player.passives = {};
    player.trailMultiplier = PLAYER.TRAIL_MULTIPLIER;
    player.magnetBoost = 0;
    player.spriteFrame = 0;
    player.spriteTimer = 0;
    player.spriteDirection = 'idle';
}

/**
 * Resets camera state to initial values
 * @param {Object} camera - Camera state object to reset
 */
export function resetCameraState(camera) {
    camera.x = 0;
    camera.y = 0;
}
