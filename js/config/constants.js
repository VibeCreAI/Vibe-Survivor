// Game configuration constants
// Extracted from vibe-survivor-game.js during Phase 3 refactoring

/**
 * Game version and metadata
 */
export const GAME_INFO = {
    VERSION: '1.0.0',
    MAJOR_VERSION: '1.0',
    BUILD_DATE: '2025-11-16',
    SCOREBOARD_SCHEMA_VERSION: 1
};

/**
 * Player configuration
 */
export const PLAYER = {
    RADIUS: 15,
    SPEED: 2.3,
    MAX_HEALTH: 100,
    STARTING_HEALTH: 100,
    STARTING_LEVEL: 1,
    DASH_DISTANCE: 40,
    DASH_BOOST_PER_STACK: 0.5, // +50% per stack
    TRAIL_MULTIPLIER: 1.0,
    STARTING_XP_ORBS: 3
};

/**
 * Enemy type configurations
 */
export const ENEMIES = {
    BASIC: {
        radius: 10,
        health: 20,
        speed: 0.75,
        damage: 10,
        color: '#ff00ff',
        spawnWeight: 0.35,
        unlockTime: 0
    },
    FAST: {
        radius: 7,
        health: 12,
        speed: 1.85,
        damage: 6,
        color: '#ffff00',
        spawnWeight: 0.25,
        unlockTime: 30
    },
    TANK: {
        radius: 15,
        health: 80,
        speed: 0.5,
        damage: 20,
        color: '#ff0040',
        spawnWeight: 0.15,
        unlockTime: 60
    },
    FLYER: {
        radius: 12,
        health: 25,
        speed: 1.25,
        damage: 12,
        color: '#0080ff',
        spawnWeight: 0.15,
        unlockTime: 120,
        orbitRadius: 100
    },
    PHANTOM: {
        radius: 9,
        health: 15,
        speed: 0.75,
        damage: 2,
        color: '#74EE15',
        spawnWeight: 0.05,
        unlockTime: 180,
        teleportCooldown: 180,
        teleportMinDistance: 250,
        teleportMaxDistance: 400
    },
    BOSS: {
        radius: 40,
        health: 1000,
        speed: 0.75,
        damage: 50,
        color: '#F000FF',
        spawnWeight: 0.05,
        unlockTime: 300, // 5 minutes
        spawnDistance: 250,
        respawnDelay: 30,
        // Boss phases
        phase1Threshold: 0.7,  // >70% health
        phase1SpeedMultiplier: 1.5,
        phase2Threshold: 0.3,  // 30-70% health
        phase2SpeedMultiplier: 1.8,
        phase3SpeedMultiplier: 2.2  // <30% health - aggressive
    }
};

/**
 * Boss variant definitions for staged encounters
 */
export const BOSS_VARIANTS = [
    {
        id: 'pulse_hunter',
        name: 'Pulse Hunter',
        nameKo: '펄스 헌터',
        color: '#F000FF',
        behavior: 'pulse',
        attackPattern: 'pulse',
        missileInterval: 200,
        sizeMultiplier: 1.0,
        shape: 'octagon',
        description: 'Classic homing missile barrages with dash finishers.'
    },
    {
        id: 'shock_sentinel',
        name: 'Shock Sentinel',
        nameKo: '쇼크 센티넬',
        color: '#00E5FF',
        behavior: 'shock',
        attackPattern: 'shock',
        missileInterval: 170,
        sizeMultiplier: 1.05,
        shape: 'square',
        description: 'Orbits the player while unleashing beam sweeps and shock mines.'
    },
    {
        id: 'rift_reaver',
        name: 'Rift Reaver',
        nameKo: '균열의 약탈자',
        color: '#FF8A00',
        behavior: 'rift',
        attackPattern: 'rift',
        missileInterval: 150,
        sizeMultiplier: 1.1,
        shape: 'diamond',
        description: 'Relentless dash assassin that rains void shards.'
    },
    {
        id: 'nightfall_carrier',
        name: 'Nightfall Carrier',
        nameKo: '밤의 운반자',
        color: '#7D5BFF',
        behavior: 'carrier',
        attackPattern: 'carrier',
        missileInterval: 140,
        sizeMultiplier: 1.2,
        shape: 'hexagon',
        description: 'Launches drone waves and heavy ordinance.'
    },
    {
        id: 'singularity_titan',
        name: 'Singularity Titan',
        nameKo: '특이점 타이탄',
        color: '#FFE34D',
        behavior: 'titan',
        attackPattern: 'titan',
        missileInterval: 130,
        sizeMultiplier: 1.3,
        shape: 'circle',
        description: 'Final form wielding gravity wells and radiant bursts.'
    },
    {
        id: 'solar_warden',
        name: 'Solar Warden',
        nameKo: '태양의 수호자',
        color: '#FFB347',
        behavior: 'solar',
        attackPattern: 'solar',
        missileInterval: 140,
        sizeMultiplier: 1.25,
        shape: 'pentagon',
        description: 'Radiant guardian that floods the arena with solar flares.'
    },
    {
        id: 'prism_seraph',
        name: 'Prism Seraph',
        nameKo: '프리즘 세라핌',
        color: '#7CFFE8',
        behavior: 'prism',
        attackPattern: 'prism',
        missileInterval: 135,
        sizeMultiplier: 1.2,
        shape: 'triangle',
        description: 'Shifts angles constantly while firing prismatic shards.'
    },
    {
        id: 'void_architect',
        name: 'Void Architect',
        nameKo: '공허의 설계자',
        color: '#AA66FF',
        behavior: 'rift',
        attackPattern: 'rift',
        missileInterval: 145,
        sizeMultiplier: 1.15,
        shape: 'star',
        description: 'A crystalline vortex that warps space with mirror shards.'
    },
    {
        id: 'vortex_spectre',
        name: 'Vortex Spectre',
        nameKo: '소용돌이 유령',
        color: '#9D00FF',
        behavior: 'vortex',
        attackPattern: 'vortex',
        missileInterval: 160,
        sizeMultiplier: 1.1,
        shape: 'spiral',
        description: 'Orbiting phantom that conjures spiral vortexes and stationary mines.'
    },
    {
        id: 'crimson_reaper',
        name: 'Crimson Reaper',
        nameKo: '진홍의 사신',
        color: '#FF1744',
        behavior: 'reaper',
        attackPattern: 'reaper',
        missileInterval: 150,
        sizeMultiplier: 1.15,
        shape: 'cross',
        description: 'Death incarnate wielding cross-slash beams in alternating patterns.'
    },
    {
        id: 'frost_colossus',
        name: 'Frost Colossus',
        nameKo: '서리 거신',
        color: '#00D4FF',
        behavior: 'colossus',
        attackPattern: 'colossus',
        missileInterval: 180,
        sizeMultiplier: 1.35,
        shape: 'octagon',
        description: 'Glacial titan that floods the battlefield with massive ice novas.'
    }
];

/**
 * Weapon configurations
 */
export const WEAPONS = {
    BASIC: {
        name: 'Basic Missile',
        damage: 15,
        fireRate: 20,
        range: 250,
        projectileSpeed: 4,
        piercing: 0
    },
    SPREAD: {
        name: 'Spread Shot',
        damage: 12,
        fireRate: 40,
        range: 200,
        projectileSpeed: 6,
        piercing: 0,
        spreadCount: 3,
        spreadAngle: 15
    },
    LASER: {
        name: 'Laser Beam',
        damage: 25,
        fireRate: 60,
        range: 350,
        projectileSpeed: 12,
        piercing: 999
    },
    PLASMA: {
        name: 'Plasma Cannon',
        damage: 30,
        fireRate: 80,
        range: 300,
        projectileSpeed: 7,
        piercing: 0
    },
    SHOTGUN: {
        name: 'Shotgun',
        damage: 8,
        fireRate: 45,
        range: 150,
        projectileSpeed: 10,
        piercing: 0,
        pelletCount: 5
    },
    LIGHTNING: {
        name: 'Lightning Strike',
        damage: 20,
        fireRate: 100,
        range: 250,
        projectileSpeed: 0,
        piercing: 0,
        instant: true
    },
    FLAMETHROWER: {
        name: 'Flamethrower',
        damage: 6,
        fireRate: 15,
        range: 120,
        projectileSpeed: 4,
        piercing: 0
    },
    RAILGUN: {
        name: 'Railgun',
        damage: 50,
        fireRate: 120,
        range: 500,
        projectileSpeed: 12,
        piercing: 999
    },
    MISSILES: {
        name: 'Homing Missiles',
        damage: 35,
        fireRate: 120,
        range: 400,
        projectileSpeed: 5,
        piercing: 0,
        homing: true,
        explosionRadius: 60
    },
    HOMING_LASER: {
        name: 'Homing Laser',
        damage: 12,
        fireRate: 200,
        range: 400,
        projectileSpeed: 7,
        piercing: 999,
        homing: true,
        isMergeWeapon: true
    },
    SHOCKBURST: {
        name: 'Shockburst',
        damage: 50,
        fireRate: 80,
        range: 300,
        projectileSpeed: 0,
        piercing: 0,
        explosionRadius: 100,
        isMergeWeapon: true
    },
    GATLING_GUN: {
        name: 'Gatling Gun',
        damage: 35,
        fireRate: 4,
        range: 450,
        projectileSpeed: 10,
        piercing: 0,
        isMergeWeapon: true
    },
    NAPALM_BUCKSHOT: {
        name: 'Napalm Buckshot',
        damage: 12,              // Base pellet impact damage
        fireRate: 55,            // ~0.9 seconds between shots (slower than shotgun)
        range: 320,              // Long range for safe boss fighting while dodging
        projectileSpeed: 10,     // Same as shotgun
        piercing: 0,
        pelletCount: 6,          // Base pellet count (fewer for accuracy)
        isMergeWeapon: true,
        burnDamage: 12,          // Damage per burn tick (every 20 frames) - increased for better visibility
        burnDuration: 240,       // 4 seconds at 60 FPS
        maxBurnStacks: 6         // Maximum burn stacks per enemy (72 dmg/tick at max = 216 DPS)
    }
};

/**
 * Weapon upgrade configuration
 */
export const WEAPON_UPGRADES = {
    DAMAGE_PER_LEVEL: 0.3, // +30% per level
    MAX_LEVEL: Infinity,
    MAX_WEAPONS: 4,
    MAX_PROJECTILES: 6
};

/**
 * Passive ability configurations
 */
export const PASSIVES = {
    HEALTH_BOOST: {
        name: 'Health Boost',
        description: '+25 Max Health',
        value: 25,
        stackable: true,
        maxStacks: Infinity
    },
    SPEED_BOOST: {
        name: 'Speed Boost',
        description: '+10% Movement Speed',
        value: 0.1,
        stackable: true,
        maxStacks: 3
    },
    REGENERATION: {
        name: 'Regeneration',
        description: 'Auto-heal over time',
        stackable: false,
        isUnique: true
    },
    MAGNET: {
        name: 'Magnet',
        description: 'Attract XP orbs',
        range: 1000,
        stackable: true,
        maxStacks: 3,
        rangePerStack: 40,
        baseRange: 80
    },
    ARMOR: {
        name: 'Armor',
        description: '15% Damage Reduction',
        reductionPerStack: 0.15,
        maxReduction: 0.9, // 90% cap
        stackable: true,
        maxStacks: Infinity
    },
    CRITICAL: {
        name: 'Critical Hit',
        description: '15% Crit Chance, 2x Damage',
        chancePerStack: 0.15,
        damageMultiplier: 2,
        stackable: true,
        maxStacks: 3
    },
    DASH_BOOST: {
        name: 'Dash Boost',
        description: '+50% Dash Distance',
        value: 0.5,
        stackable: true,
        maxStacks: 3
    },
    TURBO_FLUX_CYCLER: {
        name: 'Turbo-Flux Cycler',
        description: 'Increase fire rate of all weapons by 25%',
        stackable: false,
        isUnique: true
    },
    AEGIS_IMPACT_CORE: {
        name: 'Aegis Impact Core',
        description: 'Increase damage of all weapons by 50%',
        stackable: false,
        isUnique: true
    },
    SPLITSTREAM_MATRIX: {
        name: 'Splitstream Matrix',
        description: 'Weapons fire +1 projectile',
        stackable: false,
        isUnique: true
    },
    MACRO_CHARGE_AMPLIFIER: {
        name: 'Macro-Charge Amplifier',
        description: 'Increase explosion radius of weapons by 50%',
        stackable: false,
        isUnique: true
    },
    MOD_BAY_EXPANDER: {
        name: 'Mod-Bay Expander',
        description: 'Increase max weapon slots to 5',
        stackable: false,
        isUnique: true
    }
};

/**
 * XP and leveling configuration
 */
export const XP_SYSTEM = {
    XP_PER_ORB: 1,
    XP_FORMULA_MULTIPLIER: 5,
    XP_FORMULA_BASE: 10,
    // XP required = level * 5 + 10
    getXPForLevel: (level) => level * 5 + 10
};

/**
 * Spawn configuration
 */
export const SPAWN_CONFIG = {
    BASE_SPAWN_RATE: 120, // frames (2 seconds at 60fps)
    SPAWN_DISTANCE: 500,
    MIN_SPAWN_RATE: 30,
    SPAWN_RATE_DECREASE_PER_10_SECONDS: 5,
    BOSS_SPAWN_DISTANCE: 250,
    BOSS_RESPAWN_DELAY: 30, // seconds
    FIRST_BOSS_TIME: 180 // 3 minutes
};

/**
 * Pickup/item spawn configuration
 */
export const PICKUP_SPAWNS = {
    HP_ORB: {
        spawnRate: 120,
        chance: 0.08,
        maxActive: 1,
        healAmount: 30,
        minDistance: 300,
        maxDistance: 800
    },
    MAGNET_ORB: {
        spawnRate: 120,
        chance: 0.08,
        maxActive: 1,
        range: 1000,
        minDistance: 300,
        maxDistance: 800
    },
    CHEST_ORB: {
        spawnRate: 2700,       // 45 seconds at 60 FPS (45s * 60)
        chance: 1.0,           // 100% chance when timer triggers
        maxActive: 1,          // Only 1 chest on map at a time
        lifetime: 9000,        // 2.5 minutes visible (150s * 60)
        minDistance: 400,      // Spawn 400-1000 units away
        maxDistance: 1000,
        collectionRadius: 40,  // Collection radius
        size: 30               // Visual size
    }
};

/**
 * Difficulty scaling
 */
export const DIFFICULTY_SCALING = {
    TIME_HEALTH_INCREASE_PER_30_SECONDS: 0.3,
    MAX_TIME_MULTIPLIER: 4.0, // Frozen after first boss
    BOSS_HEALTH_INCREASE_PER_DEFEAT: 0.15,
    BOSS_CONTACT_DAMAGE_INCREASE: 0.1,
    BOSS_SCALE_MULTIPLIERS: {
        health: 1.4,
        speed: 1.05,
        damage: 1.15,
        size: 1.05
    }
};

/**
 * Game timing and frame configuration
 */
export const GAME_TIMING = {
    FRAME_INTERVAL: 16.67, // ms (60 FPS)
    MAX_ACCUMULATED_TIME: 83.33, // ms
    TARGET_FPS: 60,
    MIN_FPS: 30
};

/**
 * Screen effects configuration
 */
export const SCREEN_EFFECTS = {
    SCREEN_SHAKE: {
        BOSS_SPAWN: 15,
        BOSS_DEFEAT: 20,
        CONTACT_DAMAGE: 6,
        HIT_MIN: 4,
        HIT_MAX: 8,
        DECAY: 0.95,
        DURATION: 20
    },
    RED_FLASH: {
        DEFAULT_INTENSITY: 0.6,
        DURATION: 15,
        DECAY: 0.85
    }
};

/**
 * Particle configuration
 */
export const PARTICLES = {
    EXPLOSION: {
        count: 15,
        minSpeed: 3,
        maxSpeed: 7,
        minSize: 2,
        maxSize: 5,
        minLifetime: 0.8,
        maxLifetime: 1.2
    },
    BOSS_DEFEAT_HIGH: {
        count: 50,
        minSpeed: 4,
        maxSpeed: 10,
        minSize: 3,
        maxSize: 8,
        minLifetime: 1.5,
        maxLifetime: 2.5
    },
    BOSS_DEFEAT_LOW: {
        count: 25,
        minSpeed: 4,
        maxSpeed: 10,
        minSize: 3,
        maxSize: 8,
        minLifetime: 1.5,
        maxLifetime: 2.5
    }
};

/**
 * Collision configuration
 */
export const COLLISION = {
    PRESCREEN_DISTANCE: 100, // Manhattan distance
    ARMOR_REDUCTION_PER_STACK: 0.15,
    MAX_ARMOR_REDUCTION: 0.9
};

/**
 * Special enemy behavior configuration
 */
export const ENEMY_BEHAVIORS = {
    DODGE_RADIUS: 50,
    DODGE_BLEND: 0.7,
    CHASE_BLEND: 0.3,
    FLY_ORBIT_RADIUS: 100,
    TELEPORT_COOLDOWN: 180
};

/**
 * Mobile/Touch configuration
 */
export const MOBILE_CONFIG = {
    JOYSTICK_FLOATING: true,
    DASH_BUTTON_POSITION: 'right',
    BREAKPOINT_WIDTH: 768,
    CAMERA_ZOOM: 0.8 // 20% zoom-out on mobile for better visibility
};

/**
 * Performance configuration
 */
export const PERFORMANCE = {
    CACHE_MAX_SIZE: 1000,
    TARGET_FPS: 60,
    MINIMUM_FPS: 30
};

/**
 * Color palette
 */
export const COLORS = {
    PRIMARY_CYAN: '#00ffff',
    PRIMARY_MAGENTA: '#ff00ff',
    PRIMARY_YELLOW: '#ffff00',
    ACCENT_RED: '#ff0040',
    ACCENT_LIGHT_RED: '#ff4444',
    ACCENT_GOLD: '#FFD700',
    ACCENT_BLUE: '#0080ff',
    ACCENT_GREEN: '#74EE15',
    ACCENT_PURPLE: '#F000FF',
    CHEST_GLOW: 'rgba(255, 215, 0, 0.8)'
};
