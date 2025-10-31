# Incremental Refactoring Plan

## Overview

This plan refactors Vibe Survivor from a monolithic structure to a clean modular architecture **incrementally**, with testing after each phase. If any phase fails, you can roll back to the previous working state.

**Strategy**: Bottom-up refactoring
- Start with lowest-level dependencies (utilities, config)
- Work upward through the dependency chain
- Test thoroughly after each phase before proceeding
- Each phase is independently testable
- Test and git actions will be done by human unless asked to AI to test.

**Total Phases**: 10 phases over ~2-3 days
**Estimated Time per Phase**: 30-60 minutes
**Testing Time per Phase**: 10-15 minutes


---

## Phase 0: Setup New Directory Structure

**Goal**: Create empty directories without moving any code yet

**Time**: 5 minutes

### Steps

1. Create new directory structure:
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Landing    │  │   Modals     │  │     HUD      │      │
│  │     Page     │  │   (9 types)  │  │   Display    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      SYSTEMS LAYER                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Rendering│ │ Gameplay │ │  Physics │ │   Audio  │      │
│  │ (6 mods) │ │ (9 mods) │ │ (2 mods) │ │ (1 mod)  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       CORE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Engine    │  │    State     │  │    Events    │      │
│  │ (Game Loop)  │  │ (Centralized)│  │   (Input)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    UTILITY LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Vector2    │  │     Math     │  │ Performance  │      │
│  │ (2D Vector)  │  │  (Utilities) │  │  (Monitor)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONFIGURATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Constants   │  │    Assets    │                         │
│  │  (Tuning)    │  │   (Paths)    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Module Organization

```
js/
├── core/               # Game engine and orchestration (3 modules)
│   ├── engine.js       # Main game loop, system initialization
│   ├── state.js        # Centralized state management
│   └── events.js       # Input handling (keyboard, mouse, touch)
│
├── config/             # Configuration and constants (2 modules)
│   ├── constants.js    # Game tuning values, entity configs
│   └── assets.js       # Asset paths, sprite configs, preloading
│
├── utils/              # Shared utilities (3 modules)
│   ├── vector2.js      # 2D vector mathematics
│   ├── math.js         # Math utilities, lookup tables
│   └── performance.js  # FPS monitoring, adaptive quality
│
├── systems/            # Game systems (42 modules)
│   ├── physics/        # Physics and collision (2 modules)
│   ├── rendering/      # Rendering pipeline (6 modules)
│   ├── gameplay/       # Game logic (9 modules)
│   ├── ui/             # User interface (13 modules)
│   └── audio/          # Audio management (1 module)
│
├── main.js             # Landing page controller
├── start-screen-bot.js # Animated bot on start screen
└── vibe-survivor-game.js # Main game export wrapper


## Phase 1: Extract Utility Layer

**Goal**: Extract standalone utility modules (no dependencies)

**Time**: 30 minutes

**Risk Level**: 🟢 Low (utilities have no dependencies)

### Files to Create

#### 1.1 Create `js/utils/vector2.js`

Extract Vector2 class from monolith:
- `Vector2` class
- All vector math operations
- Static helper methods

**Test**: Import in browser console and verify vector operations work

#### 1.2 Create `js/utils/math.js`

Extract math utilities:
- `distance(x1, y1, x2, y2)`
- `clamp(value, min, max)`
- `lerp(start, end, t)`
- Trigonometry lookup tables (if any)
- Random number utilities

**Test**: Verify math functions return correct values

#### 1.3 Create `js/utils/performance.js`

Extract performance monitoring:
- FPS counter logic
- Performance tracking
- Adaptive quality system
- Memory monitoring (if any)

**Test**: Verify FPS counter still displays

### Integration

1. Update monolith to import utilities:
```javascript
import { Vector2 } from './utils/vector2.js';
import { distance, clamp, lerp } from './utils/math.js';
import { PerformanceMonitor } from './utils/performance.js';
```

2. Replace all inline vector/math operations with utility calls

### Testing Checklist
- [ ] Game loads without errors
- [ ] Player movement works (uses Vector2)
- [ ] Enemies move correctly (uses Vector2)
- [ ] Distance calculations work (collision detection)
- [ ] FPS counter displays and updates
- [ ] No console errors



---

## Phase 2: Extract Configuration Layer

**Goal**: Extract all configuration and constants

**Time**: 30 minutes

**Risk Level**: 🟢 Low (no logic, just data)

**Dependencies**: None

### Files to Create

#### 2.1 Create `js/config/constants.js`

Extract all game constants:
- `PLAYER` config (speed, size, health, etc.)
- `ENEMIES` config (all enemy types)
- `WEAPONS` config (all weapon types)
- `PASSIVES` config (all passive abilities)
- `GAME_CONFIG` (canvas size, spawn rates, etc.)
- Color constants
- UI constants

**Structure**:
```javascript
export const PLAYER = {
    SIZE: 20,
    SPEED: 200,
    MAX_HEALTH: 100,
    // ...
};

export const ENEMIES = {
    CHASER: { /* ... */ },
    DODGER: { /* ... */ },
    // ...
};

export const WEAPONS = {
    BASIC_SHOT: { /* ... */ },
    SPREAD_SHOT: { /* ... */ },
    // ...
};

export const PASSIVES = {
    SPEED_BOOST: { /* ... */ },
    // ...
};

export const GAME_CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    // ...
};
```

#### 2.2 Create `js/config/assets.js`

Extract asset management:
- Image paths
- Audio paths
- Sprite configurations
- Asset preloading logic
- `loadAssets()` function

**Structure**:
```javascript
export const ASSET_PATHS = {
    sprites: {
        playerIdle: 'images/sprites/player-idle.png',
        // ...
    },
    weapons: {
        basicShot: 'images/weapons/basic-shot.png',
        // ...
    },
    passives: {
        speedBoost: 'images/passives/speed-boost.png',
        // ...
    },
    audio: {
        bgMusic: 'sound/Vibe_Survivor.mp3',
    }
};

export const SPRITE_CONFIGS = {
    player: {
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 12,
        // ...
    }
};

export async function loadAssets() {
    // Asset loading logic
}
```

### Integration

Update monolith to import constants:
```javascript
import { PLAYER, ENEMIES, WEAPONS, PASSIVES, GAME_CONFIG } from './config/constants.js';
import { ASSET_PATHS, SPRITE_CONFIGS, loadAssets } from './config/assets.js';
```

Replace all hardcoded values with constant references.

### Testing Checklist
- [ ] Game loads without errors
- [ ] All constants accessible
- [ ] Player stats correct (speed, health, size)
- [ ] Enemy stats correct
- [ ] Weapon stats correct
- [ ] Assets load successfully
- [ ] Sprites render correctly
- [ ] Audio plays correctly


---

## Phase 3: Extract Core State Management

**Goal**: Centralize all game state

**Time**: 45 minutes

**Risk Level**: 🟡 Medium (touches all game state)

**Dependencies**: config, utils

### Files to Create

#### 3.1 Create `js/core/state.js`

Extract and centralize all game state:

**Structure**:
```javascript
import { PLAYER, ENEMIES, WEAPONS } from '../config/constants.js';
import { Vector2 } from '../utils/vector2.js';

/**
 * Creates initial player state
 */
export function createPlayerState(x = 0, y = 0) {
    return {
        position: new Vector2(x, y),
        velocity: new Vector2(0, 0),
        health: PLAYER.MAX_HEALTH,
        maxHealth: PLAYER.MAX_HEALTH,
        speed: PLAYER.SPEED,
        size: PLAYER.SIZE,
        // ... all player properties
    };
}

/**
 * Creates initial enemy state
 */
export function createEnemyState(type, x, y) {
    const config = ENEMIES[type];
    return {
        type,
        position: new Vector2(x, y),
        velocity: new Vector2(0, 0),
        health: config.health,
        // ... all enemy properties
    };
}

/**
 * Creates initial weapon state
 */
export function createWeaponState(type) {
    const config = WEAPONS[type];
    return {
        type,
        level: 1,
        cooldown: 0,
        // ... all weapon properties
    };
}

/**
 * Creates complete game state
 */
export function createGameState() {
    return {
        // Player
        player: createPlayerState(),

        // Enemies
        enemies: {
            chasers: [],
            dodgers: [],
            tanks: [],
            flyers: [],
            teleporters: [],
            bosses: []
        },

        // Weapons and projectiles
        weapons: [],
        projectiles: [],

        // Pickups
        pickups: {
            xpOrbs: [],
            healthPacks: [],
            magnets: []
        },

        // Particles
        particles: [],

        // UI state
        ui: {
            showStartScreen: true,
            showPauseMenu: false,
            showLevelUpModal: false,
            // ... all UI flags
        },

        // Game state
        game: {
            score: 0,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            elapsedTime: 0,
            isPaused: false,
            isGameOver: false,
            // ... all game flags
        },

        // Camera
        camera: {
            x: 0,
            y: 0,
            zoom: 1,
            // ... camera properties
        }
    };
}
```

### Integration

Update monolith:
```javascript
import { createGameState, createPlayerState, createEnemyState } from './core/state.js';

// Replace scattered state variables with centralized state
const state = createGameState();

// All functions now receive state as parameter
function update(deltaTime) {
    updatePlayer(state, deltaTime);
    updateEnemies(state, deltaTime);
    // ...
}
```

### Testing Checklist
- [ ] Game initializes with correct state
- [ ] Player properties accessible via `state.player`
- [ ] Enemy arrays accessible via `state.enemies`
- [ ] Weapons accessible via `state.weapons`
- [ ] UI state toggles work
- [ ] Game state updates correctly
- [ ] No console errors



---

## Phase 4: Extract Input Handling (Events)

**Goal**: Centralize all input handling

**Time**: 45 minutes

**Risk Level**: 🟡 Medium (critical for gameplay)

**Dependencies**: core/state, utils

### Files to Create

#### 4.1 Create `js/core/events.js`

Extract all input handling:

**Structure**:
```javascript
/**
 * Input state tracking
 */
export class InputManager {
    constructor() {
        this.keys = new Set();
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            worldX: 0,
            worldY: 0
        };
        this.touch = {
            active: false,
            x: 0,
            y: 0,
            joystickX: 0,
            joystickY: 0
        };
    }

    /**
     * Initialize event listeners
     */
    init(canvas) {
        // Keyboard events
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mouse events
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Touch events
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    }

    handleKeyDown(e) {
        this.keys.add(e.key.toLowerCase());
    }

    handleKeyUp(e) {
        this.keys.delete(e.key.toLowerCase());
    }

    // ... all input handlers

    /**
     * Check if key is pressed
     */
    isKeyDown(key) {
        return this.keys.has(key.toLowerCase());
    }

    /**
     * Get movement input as vector
     */
    getMovementVector() {
        const vector = { x: 0, y: 0 };

        if (this.isKeyDown('w') || this.isKeyDown('arrowup')) vector.y -= 1;
        if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) vector.y += 1;
        if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) vector.x -= 1;
        if (this.isKeyDown('d') || this.isKeyDown('arrowright')) vector.x += 1;

        // Add touch joystick input
        if (this.touch.active) {
            vector.x += this.touch.joystickX;
            vector.y += this.touch.joystickY;
        }

        return vector;
    }
}
```

### Integration

Update monolith:
```javascript
import { InputManager } from './core/events.js';

const inputManager = new InputManager();
inputManager.init(canvas);

// In update loop
function updatePlayer(state, deltaTime) {
    const movement = inputManager.getMovementVector();
    state.player.velocity.x = movement.x * state.player.speed;
    state.player.velocity.y = movement.y * state.player.speed;
    // ...
}
```

### Testing Checklist
- [ ] Keyboard controls work (WASD, arrows)
- [ ] Mouse movement tracked correctly
- [ ] Mouse clicks registered
- [ ] Touch controls work (if implemented)
- [ ] Pause key (ESC) works
- [ ] All keyboard shortcuts work
- [ ] No console errors

---

## Phase 5: Extract Physics System

**Goal**: Isolate collision and movement physics

**Time**: 45 minutes

**Risk Level**: 🟡 Medium (affects gameplay feel)

**Dependencies**: utils, core/state

### Files to Create

#### 5.1 Create `js/systems/physics/collision.js`

Extract collision detection:

**Structure**:
```javascript
import { distance } from '../../utils/math.js';

/**
 * Circle-circle collision detection
 */
export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dist = distance(x1, y1, x2, y2);
    return dist < (r1 + r2);
}

/**
 * Rectangle-circle collision detection
 */
export function checkRectCircleCollision(rectX, rectY, rectW, rectH, circleX, circleY, circleR) {
    // Collision logic
}

/**
 * Check player collision with enemies
 */
export function checkPlayerEnemyCollisions(state) {
    const results = [];
    const player = state.player;

    for (const enemyType in state.enemies) {
        for (const enemy of state.enemies[enemyType]) {
            if (checkCircleCollision(
                player.position.x, player.position.y, player.size,
                enemy.position.x, enemy.position.y, enemy.size
            )) {
                results.push(enemy);
            }
        }
    }

    return results;
}

/**
 * Check projectile collisions with enemies
 */
export function checkProjectileEnemyCollisions(state) {
    const results = [];

    for (const projectile of state.projectiles) {
        for (const enemyType in state.enemies) {
            for (const enemy of state.enemies[enemyType]) {
                if (checkCircleCollision(
                    projectile.x, projectile.y, projectile.size,
                    enemy.position.x, enemy.position.y, enemy.size
                )) {
                    results.push({ projectile, enemy });
                }
            }
        }
    }

    return results;
}

/**
 * Check player collision with pickups
 */
export function checkPlayerPickupCollisions(state) {
    const results = {
        xpOrbs: [],
        healthPacks: [],
        magnets: []
    };

    const player = state.player;

    for (const xpOrb of state.pickups.xpOrbs) {
        if (checkCircleCollision(
            player.position.x, player.position.y, player.size,
            xpOrb.x, xpOrb.y, xpOrb.size
        )) {
            results.xpOrbs.push(xpOrb);
        }
    }

    // Same for health packs and magnets

    return results;
}
```

#### 5.2 Create `js/systems/physics/movement.js`

Extract movement calculations:

**Structure**:
```javascript
import { Vector2 } from '../../utils/vector2.js';
import { clamp } from '../../utils/math.js';

/**
 * Apply velocity to position with delta time
 */
export function applyVelocity(position, velocity, deltaTime) {
    position.x += velocity.x * deltaTime;
    position.y += velocity.y * deltaTime;
}

/**
 * Apply friction to velocity
 */
export function applyFriction(velocity, friction, deltaTime) {
    const frictionAmount = friction * deltaTime;

    if (velocity.x > 0) velocity.x = Math.max(0, velocity.x - frictionAmount);
    else if (velocity.x < 0) velocity.x = Math.min(0, velocity.x + frictionAmount);

    if (velocity.y > 0) velocity.y = Math.max(0, velocity.y - frictionAmount);
    else if (velocity.y < 0) velocity.y = Math.min(0, velocity.y + frictionAmount);
}

/**
 * Calculate knockback velocity
 */
export function calculateKnockback(fromX, fromY, toX, toY, force) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    return new Vector2(
        Math.cos(angle) * force,
        Math.sin(angle) * force
    );
}

/**
 * Clamp position to bounds
 */
export function clampToBounds(position, minX, minY, maxX, maxY) {
    position.x = clamp(position.x, minX, maxX);
    position.y = clamp(position.y, minY, maxY);
}
```

### Integration

Update monolith:
```javascript
import {
    checkPlayerEnemyCollisions,
    checkProjectileEnemyCollisions,
    checkPlayerPickupCollisions
} from './systems/physics/collision.js';
import {
    applyVelocity,
    applyFriction,
    calculateKnockback
} from './systems/physics/movement.js';

// In update loop
function update(state, deltaTime) {
    // Apply movement
    applyVelocity(state.player.position, state.player.velocity, deltaTime);

    // Check collisions
    const enemyHits = checkPlayerEnemyCollisions(state);
    const projectileHits = checkProjectileEnemyCollisions(state);
    const pickupHits = checkPlayerPickupCollisions(state);

    // Handle collision results
    // ...
}
```

### Testing Checklist
- [ ] Player movement smooth and correct
- [ ] Enemy collisions detected
- [ ] Projectile hits register
- [ ] Pickup collection works
- [ ] Knockback works correctly
- [ ] No jittering or physics bugs
- [ ] No console errors

---

## Phase 6: Extract Rendering System

**Goal**: Isolate all rendering logic

**Time**: 60 minutes

**Risk Level**: 🟡 Medium (visual bugs possible)

**Dependencies**: utils, core/state, config

### Files to Create

#### 6.1 Create `js/systems/rendering/canvas.js`

**Structure**:
```javascript
/**
 * Initialize canvas and context
 */
export function initCanvas(canvasId, width, height) {
    const canvas = document.getElementById(canvasId);
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    return { canvas, context };
}

/**
 * Camera system for world-to-screen transformation
 */
export class Camera {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.zoom = 1;
    }

    follow(target, lerp = 0.1) {
        this.x += (target.x - this.x) * lerp;
        this.y += (target.y - this.y) * lerp;
    }

    worldToScreen(worldX, worldY, canvasWidth, canvasHeight) {
        return {
            x: (worldX - this.x) * this.zoom + canvasWidth / 2,
            y: (worldY - this.y) * this.zoom + canvasHeight / 2
        };
    }

    screenToWorld(screenX, screenY, canvasWidth, canvasHeight) {
        return {
            x: (screenX - canvasWidth / 2) / this.zoom + this.x,
            y: (screenY - canvasHeight / 2) / this.zoom + this.y
        };
    }
}
```

#### 6.2 Create `js/systems/rendering/sprites.js`

**Structure**:
```javascript
import { SPRITE_CONFIGS } from '../../config/assets.js';

/**
 * Sprite manager for loading and rendering sprites
 */
export class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loaded = false;
    }

    async loadSprite(name, path, config) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites.set(name, { image: img, config });
                resolve();
            };
            img.onerror = reject;
            img.src = path;
        });
    }

    async loadAllSprites(assetPaths) {
        const promises = [];
        // Load all sprites
        await Promise.all(promises);
        this.loaded = true;
    }

    drawSprite(context, name, x, y, frame = 0) {
        const sprite = this.sprites.get(name);
        if (!sprite) return;

        const { image, config } = sprite;
        const { frameWidth, frameHeight, framesPerRow } = config;

        const row = Math.floor(frame / framesPerRow);
        const col = frame % framesPerRow;

        context.drawImage(
            image,
            col * frameWidth,
            row * frameHeight,
            frameWidth,
            frameHeight,
            x - frameWidth / 2,
            y - frameHeight / 2,
            frameWidth,
            frameHeight
        );
    }
}
```

#### 6.3 Create `js/systems/rendering/animation.js`

**Structure**:
```javascript
/**
 * Animation controller for sprite animations
 */
export class AnimationController {
    constructor(frameCount, fps = 8) {
        this.frameCount = frameCount;
        this.fps = fps;
        this.currentFrame = 0;
        this.elapsed = 0;
    }

    update(deltaTime) {
        this.elapsed += deltaTime;
        const frameTime = 1 / this.fps;

        if (this.elapsed >= frameTime) {
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            this.elapsed -= frameTime;
        }
    }

    reset() {
        this.currentFrame = 0;
        this.elapsed = 0;
    }

    getCurrentFrame() {
        return this.currentFrame;
    }
}
```

#### 6.4 Create `js/systems/rendering/particles.js`

**Structure**:
```javascript
/**
 * Particle system with object pooling
 */
export class ParticleSystem {
    constructor(poolSize = 200) {
        this.pool = [];
        this.active = [];

        // Pre-create particle pool
        for (let i = 0; i < poolSize; i++) {
            this.pool.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 1,
            size: 3,
            color: '#ffffff',
            alpha: 1
        };
    }

    emit(x, y, count, options = {}) {
        for (let i = 0; i < count; i++) {
            const particle = this.pool.pop() || this.createParticle();

            // Initialize particle
            particle.x = x;
            particle.y = y;
            particle.vx = (Math.random() - 0.5) * (options.spread || 200);
            particle.vy = (Math.random() - 0.5) * (options.spread || 200);
            particle.life = 0;
            particle.maxLife = options.life || 1;
            particle.size = options.size || 3;
            particle.color = options.color || '#ffffff';
            particle.alpha = 1;

            this.active.push(particle);
        }
    }

    update(deltaTime) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const particle = this.active[i];

            particle.life += deltaTime;
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.alpha = 1 - (particle.life / particle.maxLife);

            if (particle.life >= particle.maxLife) {
                this.pool.push(this.active.splice(i, 1)[0]);
            }
        }
    }

    render(context, camera, canvasWidth, canvasHeight) {
        for (const particle of this.active) {
            const screen = camera.worldToScreen(particle.x, particle.y, canvasWidth, canvasHeight);

            context.save();
            context.globalAlpha = particle.alpha;
            context.fillStyle = particle.color;
            context.beginPath();
            context.arc(screen.x, screen.y, particle.size, 0, Math.PI * 2);
            context.fill();
            context.restore();
        }
    }
}
```

#### 6.5 Create `js/systems/rendering/effects.js`

**Structure**:
```javascript
/**
 * Visual effects (screen flash, camera shake, etc.)
 */
export class EffectsManager {
    constructor() {
        this.screenFlash = {
            active: false,
            alpha: 0,
            color: '#ffffff'
        };

        this.cameraShake = {
            active: false,
            intensity: 0,
            duration: 0,
            elapsed: 0
        };
    }

    triggerScreenFlash(color = '#ffffff', duration = 0.2) {
        this.screenFlash.active = true;
        this.screenFlash.alpha = 1;
        this.screenFlash.color = color;
        this.screenFlash.duration = duration;
        this.screenFlash.elapsed = 0;
    }

    triggerCameraShake(intensity = 10, duration = 0.3) {
        this.cameraShake.active = true;
        this.cameraShake.intensity = intensity;
        this.cameraShake.duration = duration;
        this.cameraShake.elapsed = 0;
    }

    update(deltaTime, camera) {
        // Update screen flash
        if (this.screenFlash.active) {
            this.screenFlash.elapsed += deltaTime;
            this.screenFlash.alpha = 1 - (this.screenFlash.elapsed / this.screenFlash.duration);

            if (this.screenFlash.elapsed >= this.screenFlash.duration) {
                this.screenFlash.active = false;
            }
        }

        // Update camera shake
        if (this.cameraShake.active) {
            this.cameraShake.elapsed += deltaTime;

            const progress = this.cameraShake.elapsed / this.cameraShake.duration;
            const intensity = this.cameraShake.intensity * (1 - progress);

            camera.x += (Math.random() - 0.5) * intensity;
            camera.y += (Math.random() - 0.5) * intensity;

            if (this.cameraShake.elapsed >= this.cameraShake.duration) {
                this.cameraShake.active = false;
            }
        }
    }

    renderScreenFlash(context, canvasWidth, canvasHeight) {
        if (!this.screenFlash.active) return;

        context.save();
        context.globalAlpha = this.screenFlash.alpha;
        context.fillStyle = this.screenFlash.color;
        context.fillRect(0, 0, canvasWidth, canvasHeight);
        context.restore();
    }
}
```

#### 6.6 Create `js/systems/rendering/renderer.js`

Main rendering pipeline:

**Structure**:
```javascript
import { Camera } from './canvas.js';
import { SpriteManager } from './sprites.js';
import { ParticleSystem } from './particles.js';
import { EffectsManager } from './effects.js';

/**
 * Main renderer - orchestrates all rendering
 */
export class Renderer {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.camera = new Camera();
        this.sprites = new SpriteManager();
        this.particles = new ParticleSystem();
        this.effects = new EffectsManager();
    }

    async init(assetPaths) {
        await this.sprites.loadAllSprites(assetPaths);
    }

    render(state) {
        const ctx = this.context;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // Update camera to follow player
        this.camera.follow(state.player.position);

        // Render game world
        this.renderBackground(state, ctx, width, height);
        this.renderPickups(state, ctx, width, height);
        this.renderEnemies(state, ctx, width, height);
        this.renderPlayer(state, ctx, width, height);
        this.renderProjectiles(state, ctx, width, height);
        this.particles.render(ctx, this.camera, width, height);

        // Render effects
        this.effects.renderScreenFlash(ctx, width, height);
    }

    renderPlayer(state, ctx, width, height) {
        const player = state.player;
        const screen = this.camera.worldToScreen(player.position.x, player.position.y, width, height);

        // Try to render sprite, fallback to circle
        if (this.sprites.loaded) {
            this.sprites.drawSprite(ctx, 'playerIdle', screen.x, screen.y, player.animationFrame);
        } else {
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, player.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ... other render methods
}
```

### Integration

Update monolith:
```javascript
import { initCanvas } from './systems/rendering/canvas.js';
import { Renderer } from './systems/rendering/renderer.js';

const { canvas, context } = initCanvas('gameCanvas', 1200, 800);
const renderer = new Renderer(canvas, context);
await renderer.init(assetPaths);

// In game loop
function render() {
    renderer.render(state);
}
```

### Testing Checklist
- [ ] Game renders correctly
- [ ] Player sprite displays (or fallback circle)
- [ ] Enemies render correctly
- [ ] Projectiles visible
- [ ] Particles work
- [ ] Camera follows player smoothly
- [ ] Screen flash works
- [ ] Camera shake works
- [ ] No visual glitches
- [ ] No console errors


---

## Phase 7: Extract Gameplay Systems (Part 1 - Entities)

**Goal**: Extract player and enemy systems

**Time**: 60 minutes

**Risk Level**: 🟠 Medium-High (core gameplay)

**Dependencies**: All previous phases

### Files to Create

#### 7.1 Create `js/systems/gameplay/player.js`

**Structure**:
```javascript
import { AnimationController } from '../rendering/animation.js';
import { PLAYER } from '../../config/constants.js';

export class Player {
    constructor(x, y) {
        this.position = { x, y };
        this.velocity = { x: 0, y: 0 };
        this.health = PLAYER.MAX_HEALTH;
        this.maxHealth = PLAYER.MAX_HEALTH;
        this.speed = PLAYER.SPEED;
        this.size = PLAYER.SIZE;

        // Animation
        this.animation = new AnimationController(12, 8);
        this.facing = 'idle';

        // Abilities
        this.dashCooldown = 0;
        this.dashCooldownMax = PLAYER.DASH_COOLDOWN;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
    }

    update(deltaTime, inputManager) {
        // Update animation
        this.animation.update(deltaTime);

        // Update cooldowns
        if (this.dashCooldown > 0) {
            this.dashCooldown -= deltaTime;
        }

        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer -= deltaTime;
            this.isInvulnerable = this.invulnerabilityTimer > 0;
        }

        // Determine facing direction
        if (this.velocity.y < -0.1) this.facing = 'up';
        else if (this.velocity.y > 0.1) this.facing = 'down';
        else if (this.velocity.x < -0.1) this.facing = 'left';
        else if (this.velocity.x > 0.1) this.facing = 'right';
        else this.facing = 'idle';
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return false;

        this.health -= amount;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 0.5;

        return true;
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    dash() {
        if (this.dashCooldown > 0) return false;

        this.dashCooldown = this.dashCooldownMax;
        this.isInvulnerable = true;
        this.invulnerabilityTimer = 0.2;

        // Boost velocity
        const boost = 3;
        this.velocity.x *= boost;
        this.velocity.y *= boost;

        return true;
    }
}
```

#### 7.2 Create `js/systems/gameplay/pickups.js`

**Structure**:
```javascript
export class PickupManager {
    constructor() {
        this.xpOrbs = [];
        this.healthPacks = [];
        this.magnets = [];
    }

    spawnXPOrb(x, y, value) {
        this.xpOrbs.push({
            x, y,
            value,
            size: 5,
            magnetized: false,
            targetX: 0,
            targetY: 0
        });
    }

    spawnHealthPack(x, y, healAmount) {
        this.healthPacks.push({
            x, y,
            healAmount,
            size: 10
        });
    }

    spawnMagnet(x, y, duration) {
        this.magnets.push({
            x, y,
            duration,
            size: 8
        });
    }

    update(state, deltaTime) {
        // Update XP orb magnetization
        for (const orb of this.xpOrbs) {
            if (orb.magnetized) {
                const dx = orb.targetX - orb.x;
                const dy = orb.targetY - orb.y;
                orb.x += dx * 5 * deltaTime;
                orb.y += dy * 5 * deltaTime;
            }
        }
    }

    clear() {
        this.xpOrbs = [];
        this.healthPacks = [];
        this.magnets = [];
    }
}
```

#### 7.3 Create `js/systems/gameplay/enemies/enemy-base.js`

**Structure**:
```javascript
import { ENEMIES } from '../../../config/constants.js';

export class Enemy {
    constructor(type, x, y) {
        const config = ENEMIES[type];

        this.type = type;
        this.position = { x, y };
        this.velocity = { x: 0, y: 0 };
        this.health = config.health;
        this.maxHealth = config.health;
        this.speed = config.speed;
        this.size = config.size;
        this.damage = config.damage;
        this.color = config.color;

        // Behavior state
        this.behaviorState = {};
    }

    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }

    update(deltaTime, playerPos) {
        // Override in behavior-specific update
    }
}
```

#### 7.4 Create `js/systems/gameplay/enemies/behaviors.js`

**Structure**:
```javascript
import { Enemy } from './enemy-base.js';
import { distance } from '../../../utils/math.js';

export class ChaserEnemy extends Enemy {
    constructor(x, y) {
        super('CHASER', x, y);
    }

    update(deltaTime, playerPos) {
        // Move toward player
        const dx = playerPos.x - this.position.x;
        const dy = playerPos.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.velocity.x = (dx / dist) * this.speed;
            this.velocity.y = (dy / dist) * this.speed;
        }
    }
}

export class DodgerEnemy extends Enemy {
    constructor(x, y) {
        super('DODGER', x, y);
        this.behaviorState.dodgeTimer = 0;
        this.behaviorState.dodging = false;
    }

    update(deltaTime, playerPos) {
        // Move toward player but dodge projectiles
        // ... implementation
    }
}

// TankEnemy, FlyerEnemy, TeleporterEnemy, BossEnemy...
```

#### 7.5 Create `js/systems/gameplay/enemies/spawning.js`

**Structure**:
```javascript
import { ChaserEnemy, DodgerEnemy, TankEnemy } from './behaviors.js';

export class EnemySpawner {
    constructor() {
        this.spawnTimer = 0;
        this.spawnInterval = 2; // seconds
        this.bossTimer = 0;
        this.bossInterval = 120; // 2 minutes
    }

    update(state, deltaTime) {
        this.spawnTimer += deltaTime;
        this.bossTimer += deltaTime;

        // Regular spawning
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnWave(state);
        }

        // Boss spawning
        if (this.bossTimer >= this.bossInterval) {
            this.bossTimer = 0;
            this.spawnBoss(state);
        }
    }

    spawnWave(state) {
        // Spawn enemies based on elapsed time
        const count = Math.floor(state.game.elapsedTime / 10) + 1;

        for (let i = 0; i < count; i++) {
            this.spawnRandomEnemy(state);
        }
    }

    spawnRandomEnemy(state) {
        const types = ['CHASER', 'DODGER', 'TANK'];
        const type = types[Math.floor(Math.random() * types.length)];

        // Spawn at random position off-screen
        const angle = Math.random() * Math.PI * 2;
        const distance = 600;
        const x = state.player.position.x + Math.cos(angle) * distance;
        const y = state.player.position.y + Math.sin(angle) * distance;

        let enemy;
        switch(type) {
            case 'CHASER': enemy = new ChaserEnemy(x, y); break;
            case 'DODGER': enemy = new DodgerEnemy(x, y); break;
            case 'TANK': enemy = new TankEnemy(x, y); break;
        }

        state.enemies[type.toLowerCase() + 's'].push(enemy);
    }

    spawnBoss(state) {
        // Boss spawning logic
    }
}
```

### Integration

Update monolith:
```javascript
import { Player } from './systems/gameplay/player.js';
import { PickupManager } from './systems/gameplay/pickups.js';
import { EnemySpawner } from './systems/gameplay/enemies/spawning.js';

const player = new Player(0, 0);
const pickupManager = new PickupManager();
const enemySpawner = new EnemySpawner();

// In game loop
function update(deltaTime) {
    player.update(deltaTime, inputManager);
    pickupManager.update(state, deltaTime);
    enemySpawner.update(state, deltaTime);

    // Update all enemies
    for (const enemyType in state.enemies) {
        for (const enemy of state.enemies[enemyType]) {
            enemy.update(deltaTime, player.position);
        }
    }
}
```

### Testing Checklist
- [ ] Player moves and animates correctly
- [ ] Player dash ability works
- [ ] Player can take damage
- [ ] Enemies spawn regularly
- [ ] Enemies move toward player
- [ ] Enemy behaviors work (chase, dodge, etc.)
- [ ] XP orbs spawn when enemies die
- [ ] XP orbs magnetize toward player
- [ ] Health packs spawn and work
- [ ] No console errors


---

## Phase 8: Extract Gameplay Systems (Part 2 - Weapons & Progression)

**Goal**: Extract weapon and progression systems

**Time**: 60 minutes

**Risk Level**: 🟠 Medium-High (complex systems)

**Dependencies**: Phase 7

### Files to Create

#### 8.1 Create `js/systems/gameplay/weapons/weapon-base.js`
#### 8.2 Create `js/systems/gameplay/weapons/projectiles.js`
#### 8.3 Create `js/systems/gameplay/progression/xp-system.js`
#### 8.4 Create `js/systems/gameplay/progression/upgrades.js`

(Similar detailed structure as Phase 7)

### Testing Checklist
- [ ] Weapons fire correctly
- [ ] Projectiles spawn and move
- [ ] Projectiles hit enemies
- [ ] Weapon upgrades work
- [ ] Weapon merging works
- [ ] XP collection works
- [ ] Level-up triggers correctly
- [ ] Upgrade choices appear
- [ ] Passive abilities work


---

## Phase 9: Extract UI Systems

**Goal**: Extract all UI components

**Time**: 60 minutes

**Risk Level**: 🟡 Medium (visual issues possible)

### Files to Create

#### 9.1 Create `js/systems/ui/i18n.js`
#### 9.2 Create `js/systems/ui/hud.js`
#### 9.3 Create `js/systems/ui/touch-controls.js`
#### 9.4 Create `js/systems/ui/modals/modal-base.js`
#### 9.5 Create all 9 modal implementations

### Testing Checklist
- [ ] HUD displays correctly
- [ ] Health bar updates
- [ ] XP bar updates
- [ ] Weapon icons display
- [ ] All modals open/close
- [ ] Translation system works
- [ ] Touch controls work on mobile
- [ ] Language switching works

---

## Phase 10: Extract Game Engine & Audio

**Goal**: Create main engine orchestrator and audio system

**Time**: 45 minutes

**Risk Level**: 🟡 Medium (final integration)

### Files to Create

#### 10.1 Create `js/core/engine.js`

Main game loop orchestrator:

**Structure**:
```javascript
import { createGameState } from './state.js';
import { InputManager } from './events.js';
import { Renderer } from '../systems/rendering/renderer.js';
import { AudioManager } from '../systems/audio/audio-manager.js';
import { Player } from '../systems/gameplay/player.js';
import { EnemySpawner } from '../systems/gameplay/enemies/spawning.js';
// ... all other imports

export class GameEngine {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.state = null;
        this.lastTime = 0;
        this.running = false;

        // Systems
        this.input = null;
        this.renderer = null;
        this.audio = null;
        this.player = null;
        this.enemySpawner = null;
        // ... all systems
    }

    async init() {
        // Initialize canvas and renderer
        const { canvas, context } = initCanvas(this.canvasId, 1200, 800);
        this.renderer = new Renderer(canvas, context);
        await this.renderer.init();

        // Initialize input
        this.input = new InputManager();
        this.input.init(canvas);

        // Initialize audio
        this.audio = new AudioManager();
        await this.audio.init();

        // Initialize game state
        this.state = createGameState();

        // Initialize gameplay systems
        this.player = new Player(0, 0);
        this.enemySpawner = new EnemySpawner();
        // ... all systems
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    loop() {
        if (!this.running) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(() => this.loop());
    }

    update(deltaTime) {
        if (this.state.game.isPaused) return;

        // Update all systems
        this.player.update(deltaTime, this.input);
        this.enemySpawner.update(this.state, deltaTime);
        // ... update all systems
    }

    render() {
        this.renderer.render(this.state);
    }

    pause() {
        this.state.game.isPaused = true;
    }

    resume() {
        this.state.game.isPaused = false;
    }
}
```

#### 10.2 Create `js/systems/audio/audio-manager.js`

#### 10.3 Update `js/vibe-survivor-game.js`

Simplify to just export GameEngine:

```javascript
export { GameEngine } from './core/engine.js';
```

#### 10.4 Update `js/main.js`

Use new engine:

```javascript
import { GameEngine } from './vibe-survivor-game.js';

const startButton = document.getElementById('start-button');
startButton.addEventListener('click', async () => {
    const engine = new GameEngine('gameCanvas');
    await engine.init();
    engine.start();
});
```

### Testing Checklist
- [ ] Game initializes correctly
- [ ] Game loop runs at 60 FPS
- [ ] All systems work together
- [ ] Audio plays correctly
- [ ] Pause/resume works
- [ ] Game over works
- [ ] Restart works
- [ ] Full smoke test passes


---

## Post-Refactoring Tasks

### 1. Cleanup Old Code

```bash
# Review and delete any unused code from monolith
# Verify all functionality moved to modules
```

### 2. Update Documentation

- [ ] Update README.md with new architecture
- [ ] Update ARCHITECTURE.md
- [ ] Create MIGRATION_GUIDE.md for future reference

### 3. Final Testing

- [ ] Run full SMOKE_TEST.md
- [ ] Run TESTING_CHECKLIST.md
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

### 4. Create Release



---

## Testing Guidelines

### After Each Phase

1. **Quick Smoke Test** (2 minutes):
   - Game loads without errors
   - Player can move
   - Core functionality works

2. **Functionality Test** (5 minutes):
   - Test features affected by this phase
   - Verify no regressions

3. **Console Check**:
   - No errors in browser console
   - No warnings about missing modules

### After Every 2-3 Phases

1. **Extended Test** (10 minutes):
   - Run relevant sections of SMOKE_TEST.md
   - Test all game features
   - Test on different browsers

### After All Phases

1. **Full Test** (30 minutes):
   - Complete SMOKE_TEST.md
   - Complete TESTING_CHECKLIST.md
   - Test on mobile
   - Performance validation

---

## Success Criteria

### Phase Complete When:
- [ ] All code moved to new modules
- [ ] All imports/exports correct
- [ ] Game runs without errors
- [ ] All functionality works
- [ ] Tests pass
- [ ] Committed to git

### Refactor Complete When:
- [ ] All 10 phases complete
- [ ] All tests pass
- [ ] Performance maintained (60 FPS)
- [ ] No console errors
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging

---

## Timeline Estimate

| Phase | Time | Cumulative |
|-------|------|------------|
| Phase 0 | 5 min | 5 min |
| Phase 1 | 30 min | 35 min |
| Phase 2 | 30 min | 65 min |
| Phase 3 | 45 min | 110 min |
| Phase 4 | 45 min | 155 min |
| Phase 5 | 45 min | 200 min |
| Phase 6 | 60 min | 260 min |
| Phase 7 | 60 min | 320 min |
| Phase 8 | 60 min | 380 min |
| Phase 9 | 60 min | 440 min |
| Phase 10 | 45 min | 485 min |
| **Total** | **~8 hours** | **8 hours** |

Add 2-3 hours for testing and documentation = **10-11 hours total**

Can be spread over 2-3 days with breaks.

---

## Key Principles

1. **One Phase at a Time**: Complete and test before moving on
2. **Commit Frequently**: After each successful phase
3. **Test Thoroughly**: No untested code
4. **Rollback Quickly**: If issues arise, don't push forward
5. **Document Changes**: Update docs as you go

---

## Need Help?

If you get stuck on any phase:

1. **Check Console**: Look for import/export errors
2. **Review Phase**: Re-read phase instructions
3. **Test Incrementally**: Test smaller parts first
4. **Rollback**: Go back to last working state. (Must need human confirmation)
5. **Ask for Help**: Document the issue and ask

---

