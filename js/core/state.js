// State management for Vibe Survivor
// Extracted from vibe-survivor-game.js during Phase 4 refactoring

import { PLAYER, SPAWN_CONFIG, GAME_TIMING, SCREEN_EFFECTS } from '../config/constants.js';

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
 * Creates initial weapons state
 * @returns {Array} Weapons array with basic weapon
 */
export function createWeaponsState() {
    return [{
        type: 'basic',
        level: 1,
        damage: 15,
        fireRate: 20,
        range: 250,
        projectileSpeed: 6,
        lastFire: 0
    }];
}

/**
 * Creates initial weapon stats state
 * @returns {Object} Empty weapon stats object
 */
export function createWeaponStatsState() {
    return {};
}

/**
 * Creates initial enemies state
 * @returns {Object} Enemies arrays
 */
export function createEnemiesState() {
    return {
        enemies: [],
        enemiesByBehavior: {
            chase: [],
            dodge: [],
            tank: [],
            fly: [],
            teleport: [],
            boss: []
        }
    };
}

/**
 * Creates initial projectiles state
 * @returns {Array} Empty projectiles array
 */
export function createProjectilesState() {
    return [];
}

/**
 * Creates initial pickups state
 * @returns {Object} Pickup arrays
 */
export function createPickupsState() {
    return {
        xpOrbs: [],
        hpOrbs: [],
        magnetOrbs: []
    };
}

/**
 * Creates initial particles state
 * @returns {Array} Empty particles array
 */
export function createParticlesState() {
    return [];
}

/**
 * Creates initial UI state
 * @returns {Object} UI state object
 */
export function createUIState() {
    return {
        frameCount: 0,
        lastSpawn: 0,
        notifications: [],
        isPaused: false,
        isHelpOpen: false,
        activeHelpTab: 'controls',
        activeLevelUpTab: 'levelup',
        overlayLocks: 0
    };
}

/**
 * Creates initial game core state
 * @returns {Object} Game core state
 */
export function createGameCoreState() {
    return {
        gameTime: 0,
        gameRunning: false,
        playerDead: false,
        timePaused: false,
        lastTimestamp: null,
        accumulator: 0,
        frameInterval: GAME_TIMING.FRAME_INTERVAL,
        maxAccumulatedTime: GAME_TIMING.MAX_ACCUMULATED_TIME,
        spawnRate: SPAWN_CONFIG.BASE_SPAWN_RATE,
        waveMultiplier: 1
    };
}

/**
 * Creates initial boss state
 * @returns {Object} Boss state
 */
export function createBossState() {
    return {
        bossLevel: 1,
        bossesKilled: 0,
        bossDefeating: false,
        bossSpawned: false,
        nextBossSpawnTime: null,
        bossRespawnDelay: SPAWN_CONFIG.BOSS_RESPAWN_DELAY,
        bossVictoryInProgress: false,
        pendingLevelUps: 0
    };
}

/**
 * Creates initial screen effects state
 * @returns {Object} Screen effects state
 */
export function createScreenEffectsState() {
    return {
        redFlash: {
            active: false,
            intensity: 0,
            duration: 0,
            maxIntensity: SCREEN_EFFECTS.RED_FLASH.DEFAULT_INTENSITY,
            decay: SCREEN_EFFECTS.RED_FLASH.DECAY
        }
    };
}

/**
 * Creates complete game state (Phase 4b - All state included)
 * @returns {Object} Complete game state
 */
export function createGameState() {
    return {
        player: createPlayerState(),
        camera: createCameraState(),
        weapons: createWeaponsState(),
        weaponStats: createWeaponStatsState(),
        enemies: createEnemiesState(),
        projectiles: createProjectilesState(),
        pickups: createPickupsState(),
        particles: createParticlesState(),
        ui: createUIState(),
        gameCore: createGameCoreState(),
        boss: createBossState(),
        screenEffects: createScreenEffectsState()
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

/**
 * Resets weapons state to initial values
 * @param {Array} weapons - Weapons array to reset
 * @returns {Array} New weapons array with basic weapon
 */
export function resetWeaponsState(weapons) {
    weapons.length = 0;
    weapons.push({
        type: 'basic',
        level: 1,
        damage: 15,
        fireRate: 30,
        range: 250,
        projectileSpeed: 6,
        lastFire: 0
    });
    return weapons;
}

/**
 * Resets weapon stats state
 * @param {Object} weaponStats - Weapon stats object to reset
 */
export function resetWeaponStatsState(weaponStats) {
    for (const key in weaponStats) {
        delete weaponStats[key];
    }
}

/**
 * Resets enemies state to initial values
 * @param {Object} enemiesState - Enemies state object to reset
 */
export function resetEnemiesState(enemiesState) {
    enemiesState.enemies.length = 0;
    enemiesState.enemiesByBehavior.chase.length = 0;
    enemiesState.enemiesByBehavior.dodge.length = 0;
    enemiesState.enemiesByBehavior.tank.length = 0;
    enemiesState.enemiesByBehavior.fly.length = 0;
    enemiesState.enemiesByBehavior.teleport.length = 0;
    enemiesState.enemiesByBehavior.boss.length = 0;
}

/**
 * Resets projectiles state
 * @param {Array} projectiles - Projectiles array to reset
 */
export function resetProjectilesState(projectiles) {
    projectiles.length = 0;
}

/**
 * Resets pickups state
 * @param {Object} pickups - Pickups state object to reset
 */
export function resetPickupsState(pickups) {
    pickups.xpOrbs.length = 0;
    pickups.hpOrbs.length = 0;
    pickups.magnetOrbs.length = 0;
}

/**
 * Resets particles state
 * @param {Array} particles - Particles array to reset
 */
export function resetParticlesState(particles) {
    particles.length = 0;
}

/**
 * Resets UI state to initial values
 * @param {Object} ui - UI state object to reset
 */
export function resetUIState(ui) {
    ui.frameCount = 0;
    ui.lastSpawn = 0;
    ui.notifications.length = 0;
    ui.isPaused = false;
    // Keep help and level up tab states
    ui.overlayLocks = 0;
    ui.activeLevelUpTab = 'levelup';
}

/**
 * Resets game core state to initial values
 * @param {Object} gameCore - Game core state object to reset
 */
export function resetGameCoreState(gameCore) {
    gameCore.gameTime = 0;
    gameCore.lastTimestamp = null;
    gameCore.accumulator = 0;
    gameCore.spawnRate = SPAWN_CONFIG.BASE_SPAWN_RATE;
    gameCore.waveMultiplier = 1;
    gameCore.timePaused = false;
    // gameRunning and playerDead are managed separately
}

/**
 * Resets boss state to initial values
 * @param {Object} boss - Boss state object to reset
 */
export function resetBossState(boss) {
    boss.bossLevel = 1;
    boss.bossesKilled = 0;
    boss.bossDefeating = false;
    boss.bossSpawned = false;
    boss.nextBossSpawnTime = null;
    boss.bossVictoryInProgress = false;
    boss.pendingLevelUps = 0;
}

/**
 * Resets screen effects state (typically not needed as effects expire naturally)
 * @param {Object} screenEffects - Screen effects state object to reset
 */
export function resetScreenEffectsState(screenEffects) {
    screenEffects.redFlash.active = false;
    screenEffects.redFlash.intensity = 0;
    screenEffects.redFlash.duration = 0;
}
