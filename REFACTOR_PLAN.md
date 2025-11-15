# Incremental Refactoring Plan

## Overview

This plan refactors Vibe Survivor from a monolithic structure to a clean modular architecture **incrementally**, with testing after each phase. If any phase fails, you can roll back to the previous working state.

**Strategy**: Bottom-up refactoring
- Start with lowest-level dependencies (utilities, config)
- Work upward through the dependency chain
- Test thoroughly after each phase before proceeding
- Each phase is independently testable
- Test and git actions will be done by human unless asked to AI to test.

**Total Phases**: 14 phases (includes validation, splits, and checkpoints) over ~2-3 days
**Estimated Implementation Time**: ~9.5 hours
**Estimated Testing Time**: ~3.5 hours
**Total Estimated Time**: ~13 hours


---

## Master Progress Checklist

Track your progress through the refactoring. Check off each phase as you complete it:

### Pre-Work
- [x] **Phase 0**: Pre-Refactor Validation (15 min) - Verify baseline
- [x] **Phase 1**: Setup Directory Structure (5 min) - Create empty folders

### Foundation Layer (Phases 2-3) - ~80 min
- [x] **Phase 2**: Extract Utilities (40 min) - Vector2, Math, Performance ✅
- [x] **Phase 3**: Extract Configuration (40 min) - Constants, Assets ✅

### Core Layer (Phases 4-6) - ~200 min + Checkpoint #1
- [x] **Phase 4a**: State Management Part 1 (40 min) - Player & Camera ✅
- [x] **Phase 4b**: State Management Part 2 (40 min) - Enemies, Weapons, Pickups ✅
- [x] **Checkpoint #1**: Integration Test (15 min) - Core systems working ✅
- [x] **Phase 5**: Input Handling (60 min) - Keyboard, Mouse, Touch ✅
- [x] **Phase 6**: Physics System (60 min) - Collision, Movement ✅

### Rendering Layer (Phases 7a-7b) - ~115 min + Checkpoint #2
- [x] **Phase 7a**: Rendering Core (55 min) - Canvas, Camera, Sprites ✅
- [x] **Phase 7b**: Rendering Effects (60 min) - Animation, Particles, Effects ✅
- [x] **Checkpoint #2**: Integration Test (15 min) - Rendering working ✅

### Gameplay Layer (Phases 8-10) - ~245 min + Checkpoint #3
- [x] **Phase 8**: Gameplay Entities (80 min) - Player, Enemies, Pickups ✅
- [x] **Phase 9**: Weapons & Progression (80 min) - Weapons, XP, Upgrades ✅
- [x] **Phase 10**: UI Systems (85 min) - HUD, Modals (10 types), Touch Controls ✅
- [x] **Checkpoint #3**: Integration Test (15 min) - Full game working ✅

### Final Integration (Phase 11) - ~75 min
- [x] **Phase 11**: Game Engine & Audio (75 min) - Final orchestration ✅

### Code Replacement Phases (12a-12d) - ~200 min
**CRITICAL**: Phases 8-10 created new systems but didn't replace old code. These phases actually integrate them.

- [x] **Phase 12a**: Replace Phase 8 Code (50 min) - Integrate Player, Enemy, Pickup Systems ✅ (Already done!)
- [x] **Phase 12b**: Replace Phase 9 Code (50 min) - Integrate Weapon, Projectile, XP, Upgrade Systems ✅
- [x] **Phase 12c**: Replace Phase 10 Code (70 min) - Integrate HUD, Modals, Touch Controls ✅ (12/12 sub-tasks complete: HUD ✅, Game Over ✅, Level Up ✅, Pause ✅, Confirmations ✅, Options ✅, Help ✅, Victory ✅, Start Screen ✅, Loading ✅, About ✅, Touch Controls ✅)
- [x] **Phase 12d**: Replace Phase 11 Code (30 min) - Integrate Game Loop Utilities
- [ ] **Checkpoint #4**: Integration Test (15 min) - All new systems fully integrated

### Post-Refactoring
- [ ] **Cleanup**: Remove old monolith code and dead imports
- [ ] **Documentation**: Update README, ARCHITECTURE
- [ ] **Final Testing**: Complete smoke test on multiple browsers
- [ ] **Git**: Commit final state and tag release

**Progress Tracking:**
- Phases Completed: 15 / 18 (83%)
- Checkpoints Passed: 3 / 4 ✅
- Estimated Time Remaining: ~2.75 hours (~165 min)
- Actual Time Spent: ~11.66 hours (~700 min)

---

## Phase 0: Pre-Refactor Validation

**Goal**: Verify current codebase structure and create baseline

**Time**: 15 minutes (10 min implementation + 5 min testing)

**Risk Level**: 🟢 Low (just validation)

### Steps

1. **Run the game and complete smoke test**
   - Load index.html in browser
   - Click "Press Start" button
   - Verify game loads and player can move
   - Play for 1-2 minutes to ensure core systems work

2. **Inspect the monolith**
   - Open `js/vibe-survivor-game.js`
   - Count actual lines (should be ~9300+)
   - Identify Vector2 class location
   - Locate constants/config sections
   - Find state management code

3. **Browser Console Check**
   - Open DevTools (F12)
   - Verify no errors in Console tab
   - Check Network tab for asset loading

4. **Take baseline screenshots**
   - Game running normally
   - Player movement
   - Enemy spawning
   - HUD display

5. **Document current structure**
   - List global variables/classes to be extracted
   - Note any unusual dependencies
   - Check for TypeScript or build steps (should be none)

### Testing Checklist ✅ Completed

**STOP - Do NOT proceed to Phase 1 until ALL checks pass:**

- [ ] Game loads without errors in console
- [ ] Player can move with WASD/arrow keys
- [ ] Enemies spawn and move toward player
- [ ] Weapons fire and hit enemies
- [ ] XP orbs drop when enemies die
- [ ] Health bar displays correctly
- [ ] Audio plays (or gracefully fails)
- [ ] No console errors or warnings
- [ ] Screenshots saved for comparison
- [ ] Monolith structure matches expectations (~9300 lines)

### Success Criteria

- [ ] Baseline validated and documented
- [ ] Ready to begin extraction
- [ ] Git tag created (optional, if you want: `pre-refactor-baseline`)


---

## Phase 1: Setup New Directory Structure

**Goal**: Create empty directories without moving any code yet

**Time**: 5 minutes

### Steps

1. Create new directory structure:
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Landing    │  │   Modals     │  │     HUD      │       │
│  │     Page     │  │  (10 types)  │  │   Display    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      SYSTEMS LAYER                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Rendering│ │ Gameplay │ │  Physics │ │   Audio  │        │
│  │ (6 mods) │ │ (9 mods) │ │ (2 mods) │ │ (1 mod)  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       CORE LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Engine    │  │    State     │  │    Events    │       │
│  │ (Game Loop)  │  │ (Centralized)│  │   (Input)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    UTILITY LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Vector2    │  │     Math     │  │ Performance  │       │
│  │ (2D Vector)  │  │  (Utilities) │  │  (Monitor)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CONFIGURATION LAYER                       │
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
├── systems/            # Game systems (43 modules)
│   ├── physics/        # Physics and collision (2 modules)
│   ├── rendering/      # Rendering pipeline (6 modules)
│   ├── gameplay/       # Game logic (9 modules)
│   ├── ui/             # User interface (14 modules)
│   └── audio/          # Audio management (1 module)
│
├── main.js             # Landing page controller
├── start-screen-bot.js # Animated bot on start screen
└── vibe-survivor-game.js # Main game export wrapper


## Phase 2: Extract Utility Layer

**Goal**: Extract standalone utility modules (no dependencies)

**Time**: 40 minutes (30 min implementation + 10 min testing)

**Risk Level**: 🟢 Low (utilities have no dependencies)

### Files to Create

#### 2.1 Create `js/utils/vector2.js`

Extract Vector2 class from monolith:
- `Vector2` class
- All vector math operations
- Static helper methods

**Test**: Import in browser console and verify vector operations work

#### 2.2 Create `js/utils/math.js`

Extract math utilities:
- `distance(x1, y1, x2, y2)`
- `clamp(value, min, max)`
- `lerp(start, end, t)`
- Trigonometry lookup tables (if any)
- Random number utilities

**Test**: Verify math functions return correct values

#### 2.3 Create `js/utils/performance.js`

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

**STOP - Do NOT proceed to Phase 3 until ALL checks pass:**

- [ ] Game loads without errors
- [ ] Player movement works (uses Vector2)
- [ ] Enemies move correctly (uses Vector2)
- [ ] Distance calculations work (collision detection)
- [ ] FPS counter displays and updates
- [ ] No console errors
- [ ] Browser console shows no warnings about missing modules

**If ANY test fails:**
- Document the failure
- Check import/export syntax
- Verify file paths are correct
- Fix issue before proceeding


---

## Phase 3: Extract Configuration Layer

**Goal**: Extract all configuration and constants

**Time**: 40 minutes (30 min implementation + 10 min testing)

**Risk Level**: 🟢 Low (no logic, just data)

**Dependencies**: None

### Files to Create

#### 3.1 Create `js/config/constants.js`

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

#### 3.2 Create `js/config/assets.js`

Extract asset management:
- Image paths
- Audio paths
- Sprite configurations
- Asset preloading logic with progress tracking
- Loading phase configurations (BOOTING, LOADING, READY states)
- `preloadAssets()` function (replaces `loadAssets()`)

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

export const LOADING_PHASES = [
    { percent: 0, title: 'BOOTING', label: 'Initializing systems…' },
    { percent: 25, title: 'LOADING', label: 'Loading sprites…' },
    { percent: 50, title: 'LOADING', label: 'Loading sounds…' },
    { percent: 75, title: 'LOADING', label: 'Preparing game world…' },
    { percent: 100, title: 'READY', label: 'Ready to survive!' }
];

export async function preloadAssets(progressCallback) {
    // Asset loading logic with progress updates
    // Loads sprites, weapon icons, passive icons, title image
    // Calls progressCallback(percent, phaseIndex) to update loading screen UI
}
```

### Integration

Update monolith to import constants:
```javascript
import { PLAYER, ENEMIES, WEAPONS, PASSIVES, GAME_CONFIG } from './config/constants.js';
import { ASSET_PATHS, SPRITE_CONFIGS, LOADING_PHASES, preloadAssets } from './config/assets.js';
```

Replace all hardcoded values with constant references.

### Testing Checklist

**STOP - Do NOT proceed to Phase 4 until ALL checks pass:**

- [ ] Game loads without errors
- [ ] All constants accessible
- [ ] Player stats correct (speed, health, size)
- [ ] Enemy stats correct (health, damage, speed)
- [ ] Weapon stats correct (damage, cooldown, range)
- [ ] Assets load successfully
- [ ] Sprites render correctly
- [ ] Audio plays correctly (or fails gracefully)
- [ ] No console errors
- [ ] No hardcoded magic numbers remaining in visible gameplay


---

## Phase 4a: Extract Core State Management (Part 1 - Player & Camera)

**Goal**: Centralize player and camera state (smaller, safer scope)

**Time**: 40 minutes (30 min implementation + 10 min testing)

**Risk Level**: 🟡 Medium (core gameplay state)

**Dependencies**: config, utils

### Files to Create

#### 4a.1 Create `js/core/state.js` (Partial - Player & Camera only)

Extract and centralize player and camera state:

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
 * Creates initial camera state
 */
export function createCameraState() {
    return {
        x: 0,
        y: 0,
        zoom: 1
    };
}

/**
 * Creates partial game state (Phase 4a - Player & Camera only)
 */
export function createGameState() {
    return {
        // Player
        player: createPlayerState(),

        // Camera
        camera: createCameraState()

        // NOTE: Enemies, weapons, pickups, etc. will be added in Phase 4b
    };
}
```

### Integration

Update monolith:
```javascript
import { createGameState, createPlayerState, createCameraState } from './core/state.js';

// Replace scattered player and camera variables with centralized state
const state = createGameState();

// Update player-related code to use state.player
// Update camera-related code to use state.camera
```

### Testing Checklist

**STOP - Do NOT proceed to Phase 4b until ALL checks pass:**

- [ ] Game initializes with player state
- [ ] Player properties accessible via `state.player`
- [ ] Player position, health, velocity work correctly
- [ ] Camera properties accessible via `state.camera`
- [ ] Player movement still works
- [ ] Game runs without errors
- [ ] No console errors


---

## Phase 4b: Extract Core State Management (Part 2 - Enemies, Weapons, Pickups)

**Goal**: Add remaining state (enemies, weapons, pickups, UI, game state)

**Time**: 40 minutes (30 min implementation + 10 min testing)

**Risk Level**: 🟡 Medium (completes state system)

**Dependencies**: Phase 4a

### Files to Modify

#### 4b.1 Expand `js/core/state.js`

Add remaining state factory functions and expand `createGameState()`:

**Add these functions**:
```javascript
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
```

**Update createGameState() to include all state**:
```javascript
export function createGameState() {
    return {
        // Player (already exists from 4a)
        player: createPlayerState(),

        // Camera (already exists from 4a)
        camera: createCameraState(),

        // Enemies (NEW)
        enemies: {
            chasers: [],
            dodgers: [],
            tanks: [],
            flyers: [],
            teleporters: [],
            bosses: []
        },

        // Weapons and projectiles (NEW)
        weapons: [],
        projectiles: [],

        // Pickups (NEW)
        pickups: {
            xpOrbs: [],
            healthPacks: [],
            magnets: []
        },

        // Particles (NEW)
        particles: [],

        // UI state (NEW)
        ui: {
            showStartScreen: true,
            showPauseMenu: false,
            showLevelUpModal: false,
            // ... all UI flags
        },

        // Game state (NEW)
        game: {
            score: 0,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            elapsedTime: 0,
            isPaused: false,
            isGameOver: false,
            // ... all game flags
        }
    };
}
```

### Integration

Update monolith to use all state:
```javascript
// All functions now receive state as parameter
function update(deltaTime) {
    updatePlayer(state, deltaTime);
    updateEnemies(state, deltaTime);
    updateWeapons(state, deltaTime);
    updatePickups(state, deltaTime);
    // ...
}
```

### Testing Checklist

**STOP - Do NOT proceed to Phase 5 until ALL checks pass:**

- [ ] Game initializes with complete state structure
- [ ] Enemy arrays accessible via `state.enemies`
- [ ] Weapons accessible via `state.weapons`
- [ ] Pickups accessible via `state.pickups`
- [ ] UI state toggles work (pause, modals)
- [ ] Game state updates correctly (score, XP, level)
- [ ] All game systems still function
- [ ] No console errors


---

## Integration Checkpoint #1

**Goal**: Verify all core systems work together

**Time**: 15 minutes

**Test all core functionality before proceeding:**

- [ ] Game loads and initializes correctly
- [ ] Player can move in all directions
- [ ] Enemies spawn and move toward player
- [ ] Player can take damage
- [ ] Health bar updates
- [ ] XP bar functions
- [ ] State management working correctly
- [ ] No console errors or warnings

**If ANY test fails, go back and fix before proceeding to Phase 5!**


---

## Phase 5: Extract Input Handling (Events)

**Goal**: Centralize all input handling

**Time**: 60 minutes (45 min implementation + 15 min testing)

**Risk Level**: 🟡 Medium (critical for gameplay)

**Dependencies**: core/state, utils

### Files to Create

#### 5.1 Create `js/core/events.js`

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

**STOP - Do NOT proceed to Phase 6 until ALL checks pass:**

- [ ] Keyboard controls work (WASD, arrows)
- [ ] Simultaneous key presses work (W+D for diagonal movement)
- [ ] Rapid key toggling works correctly
- [ ] Mouse movement tracked correctly
- [ ] Mouse clicks registered
- [ ] Focus loss/gain works (click outside game then back)
- [ ] Touch controls work (if implemented)
- [ ] Pause key (ESC) works
- [ ] All keyboard shortcuts work
- [ ] No console errors

**Additional edge case testing:**
- [ ] Holding multiple keys doesn't break movement
- [ ] Releasing one key while holding another works correctly

---

## Phase 6: Extract Physics System

**Goal**: Isolate collision and movement physics

**Time**: 60 minutes (45 min implementation + 15 min testing)

**Risk Level**: 🟡 Medium (affects gameplay feel)

**Dependencies**: utils, core/state

### Files to Create

#### 6.1 Create `js/systems/physics/collision.js`

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

#### 6.2 Create `js/systems/physics/movement.js`

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

**STOP - Do NOT proceed to Phase 7a until ALL checks pass:**

- [ ] Player movement smooth and correct
- [ ] Enemy collisions detected
- [ ] Projectile hits register
- [ ] Pickup collection works
- [ ] Knockback works correctly
- [ ] No jittering or physics bugs
- [ ] No console errors

**Edge case testing:**
- [ ] Projectiles hitting multiple enemies simultaneously
- [ ] Player collision while invulnerable
- [ ] Pickup magnetization near screen edges


---

## Phase 7a: Extract Rendering System (Part 1 - Core Rendering)

**Goal**: Extract canvas, camera, and sprites (foundation for rendering)

**Time**: 55 minutes (45 min implementation + 10 min testing)

**Risk Level**: 🟡 Medium (visual bugs possible)

**Dependencies**: utils, core/state, config

### Files to Create

#### 7a.1 Create `js/systems/rendering/canvas.js`

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

#### 7a.2 Create `js/systems/rendering/sprites.js`

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

### Integration

Update monolith:
```javascript
import { initCanvas, Camera } from './systems/rendering/canvas.js';
import { SpriteManager } from './systems/rendering/sprites.js';

const { canvas, context } = initCanvas('gameCanvas', 1200, 800);
const camera = new Camera();
const spriteManager = new SpriteManager();
await spriteManager.loadAllSprites(assetPaths);

// In game loop
camera.follow(state.player.position);
```

### Testing Checklist

**STOP - Do NOT proceed to Phase 7b until ALL checks pass:**

- [ ] Game renders correctly
- [ ] Canvas initializes at correct size
- [ ] Camera follows player smoothly
- [ ] Sprites load successfully
- [ ] Player sprite displays (or fallback if sprites not loaded)
- [ ] Enemies render correctly
- [ ] No visual glitches
- [ ] No console errors


---

## Phase 7b: Extract Rendering System (Part 2 - Animation, Particles, Effects)

**Goal**: Add animations, particle system, and visual effects

**Time**: 60 minutes (45 min implementation + 15 min testing)

**Risk Level**: 🟡 Medium (complex visual systems)

**Dependencies**: Phase 7a

### Files to Create

#### 7b.1 Create `js/systems/rendering/animation.js`

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

#### 7b.2 Create `js/systems/rendering/particles.js`

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

#### 7b.3 Create `js/systems/rendering/effects.js`

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

### Integration

Update monolith:
```javascript
import { AnimationController } from './systems/rendering/animation.js';
import { ParticleSystem } from './systems/rendering/particles.js';
import { EffectsManager } from './systems/rendering/effects.js';

const particleSystem = new ParticleSystem();
const effects = new EffectsManager();

// In game loop
particleSystem.update(deltaTime);
effects.update(deltaTime, camera);
particleSystem.render(context, camera, width, height);
effects.renderScreenFlash(context, width, height);
```

### Testing Checklist

**STOP - Do NOT proceed to Integration Checkpoint #2 until ALL checks pass:**

- [ ] Particles spawn and animate correctly
- [ ] Particle object pooling works (no memory leaks)
- [ ] Sprite animations play smoothly
- [ ] Screen flash works when damage taken
- [ ] Camera shake works on impacts
- [ ] Visual effects don't cause lag
- [ ] No visual glitches
- [ ] No console errors


---

## Integration Checkpoint #2

**Goal**: Verify complete rendering pipeline

**Time**: 15 minutes

**Test full rendering system before proceeding:**

- [ ] Game renders at 60 FPS
- [ ] All entities render correctly
- [ ] Camera follows player smoothly
- [ ] Sprites and animations work
- [ ] Particles display correctly
- [ ] Visual effects work (flash, shake)
- [ ] No rendering glitches
- [ ] No console errors or warnings
- [ ] Game still playable and responsive

**If ANY test fails, go back and fix before proceeding to Phase 8!**


---

## Phase 8: Extract Gameplay Systems (Part 1 - Entities)

**Goal**: Extract player and enemy systems

**Time**: 80 minutes (60 min implementation + 20 min testing)

**Risk Level**: 🟠 Medium-High (core gameplay)

**Dependencies**: All previous phases

### Files to Create

#### 8.1 Create `js/systems/gameplay/player.js`

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

#### 8.2 Create `js/systems/gameplay/pickups.js`

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

#### 8.3 Create `js/systems/gameplay/enemies/enemy-base.js`

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

#### 8.4 Create `js/systems/gameplay/enemies/behaviors.js`

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

#### 8.5 Create `js/systems/gameplay/enemies/spawning.js`

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

**STOP - Do NOT proceed to Phase 9 until ALL checks pass:**

- [ ] Player moves and animates correctly
- [ ] Player dash ability works
- [ ] Player can take damage
- [ ] Player invulnerability works after damage
- [ ] Enemies spawn regularly (every 2 seconds)
- [ ] Enemies move toward player
- [ ] Each enemy type behaves correctly:
  - [ ] Chasers move straight toward player
  - [ ] Dodgers attempt to avoid projectiles
  - [ ] Tanks move slowly but have high health
- [ ] Boss spawns at 2-minute mark
- [ ] XP orbs spawn when enemies die
- [ ] XP orbs magnetize toward player
- [ ] Health packs spawn and heal player
- [ ] No console errors

**Edge case testing:**
- [ ] Multiple enemy types in same wave
- [ ] Enemy spawning off-screen
- [ ] XP orb magnetization with many orbs


---

## Phase 9: Extract Gameplay Systems (Part 2 - Weapons & Progression)

**Goal**: Extract weapon and progression systems

**Time**: 80 minutes (60 min implementation + 20 min testing)

**Risk Level**: 🟠 Medium-High (complex systems)

**Dependencies**: Phase 8

### Files to Create

#### 9.1 Create `js/systems/gameplay/weapons/weapon-base.js`

**Structure**:
```javascript
import { WEAPONS } from '../../../config/constants.js';

export class Weapon {
    constructor(type) {
        const config = WEAPONS[type];

        this.type = type;
        this.level = 1;
        this.cooldown = 0;
        this.cooldownMax = config.cooldown;
        this.damage = config.damage;
        this.range = config.range;
        this.projectileSpeed = config.projectileSpeed;
        this.piercing = config.piercing || 0;
    }

    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
    }

    canFire() {
        return this.cooldown <= 0;
    }

    fire(playerPos, targetPos) {
        if (!this.canFire()) return null;

        this.cooldown = this.cooldownMax;
        return this.createProjectile(playerPos, targetPos);
    }

    createProjectile(fromPos, toPos) {
        // Override in specific weapon types
    }

    levelUp() {
        this.level++;
        // Increase stats based on weapon type
    }
}
```

#### 9.2 Create `js/systems/gameplay/weapons/projectiles.js`

**Structure**:
```javascript
export class Projectile {
    constructor(x, y, vx, vy, damage, size = 5, piercing = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.size = size;
        this.piercing = piercing;
        this.piercedEnemies = [];
        this.lifetime = 3; // seconds
        this.age = 0;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.age += deltaTime;
    }

    isExpired() {
        return this.age >= this.lifetime;
    }

    canHit(enemy) {
        return !this.piercedEnemies.includes(enemy);
    }

    hit(enemy) {
        this.piercedEnemies.push(enemy);
        return this.piercedEnemies.length > this.piercing;
    }
}

export class ProjectileManager {
    constructor() {
        this.projectiles = [];
    }

    spawn(projectile) {
        this.projectiles.push(projectile);
    }

    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);

            if (projectile.isExpired()) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    clear() {
        this.projectiles = [];
    }
}
```

#### 9.3 Create `js/systems/gameplay/progression/xp-system.js`

**Structure**:
```javascript
export class XPSystem {
    constructor() {
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
        this.levelUpCallbacks = [];
    }

    addXP(amount) {
        this.xp += amount;

        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

        // Trigger level-up callbacks
        this.levelUpCallbacks.forEach(callback => callback(this.level));
    }

    onLevelUp(callback) {
        this.levelUpCallbacks.push(callback);
    }

    getProgress() {
        return this.xp / this.xpToNextLevel;
    }

    reset() {
        this.xp = 0;
        this.level = 1;
        this.xpToNextLevel = 100;
    }
}
```

#### 9.4 Create `js/systems/gameplay/progression/upgrades.js`

**Structure**:
```javascript
export class UpgradeSystem {
    constructor() {
        this.availableWeapons = [];
        this.availablePassives = [];
        this.selectedWeapons = [];
        this.selectedPassives = [];
    }

    getUpgradeChoices(count = 3) {
        const choices = [];
        const allOptions = [
            ...this.availableWeapons.map(w => ({ type: 'weapon', ...w })),
            ...this.availablePassives.map(p => ({ type: 'passive', ...p }))
        ];

        // Randomly select choices
        while (choices.length < count && allOptions.length > 0) {
            const index = Math.floor(Math.random() * allOptions.length);
            choices.push(allOptions.splice(index, 1)[0]);
        }

        return choices;
    }

    selectUpgrade(choice) {
        if (choice.type === 'weapon') {
            this.selectedWeapons.push(choice);
        } else if (choice.type === 'passive') {
            this.selectedPassives.push(choice);
            this.applyPassive(choice);
        }
    }

    applyPassive(passive) {
        // Apply passive effects to player/game state
    }

    canMergeWeapons(weapon1, weapon2) {
        // Check if weapons can be merged into evolved weapon
        return false; // Implement weapon merging logic
    }
}
```

### Integration

Update monolith:
```javascript
import { Weapon } from './systems/gameplay/weapons/weapon-base.js';
import { ProjectileManager } from './systems/gameplay/weapons/projectiles.js';
import { XPSystem } from './systems/gameplay/progression/xp-system.js';
import { UpgradeSystem } from './systems/gameplay/progression/upgrades.js';

const projectileManager = new ProjectileManager();
const xpSystem = new XPSystem();
const upgradeSystem = new UpgradeSystem();

// Level-up callback
xpSystem.onLevelUp((level) => {
    state.ui.showLevelUpModal = true;
    state.ui.upgradeChoices = upgradeSystem.getUpgradeChoices(3);
});
```

### Testing Checklist

**STOP - Do NOT proceed to Phase 10 until ALL checks pass:**

- [ ] Weapons fire correctly
- [ ] Projectiles spawn and move
- [ ] Projectiles hit enemies and deal damage
- [ ] Projectile lifetime works (despawn after 3 seconds)
- [ ] Piercing projectiles work correctly
- [ ] Weapon cooldowns work
- [ ] Weapon upgrades work
- [ ] Weapon merging works (if implemented)
- [ ] XP collection works
- [ ] XP bar fills correctly
- [ ] Level-up triggers at correct XP threshold
- [ ] Level-up modal appears
- [ ] Upgrade choices display (3 options)
- [ ] Selecting upgrade works
- [ ] Passive abilities apply correctly
- [ ] No console errors

**Edge case testing:**
- [ ] Multiple projectiles from same weapon
- [ ] Projectile hitting multiple enemies
- [ ] Rapid level-ups (multiple in quick succession)


---

## Phase 10: Extract UI Systems

**Goal**: Extract all UI components and modals

**Time**: 85 minutes (65 min implementation + 20 min testing)

**Risk Level**: 🟡 Medium (visual issues possible, many components)

**Dependencies**: All gameplay systems

### Files to Create

#### 10.1 Create `js/systems/ui/hud.js`

HUD (Heads-Up Display) for health, XP, time, etc.

#### 10.2 Create `js/systems/ui/touch-controls.js`

Touch controls and virtual joystick for mobile.

#### 10.3 Create `js/systems/ui/modals/modal-base.js`

Base class for all modals.

#### 10.4 Create all 10 modal implementations:

1. **`js/systems/ui/modals/loading-screen.js`** - Asset preloading overlay with progress bar
2. **`js/systems/ui/modals/start-screen.js`** - Initial "Press Start" screen
3. **`js/systems/ui/modals/pause-menu.js`** - Pause overlay (ESC key)
4. **`js/systems/ui/modals/level-up.js`** - Level-up upgrade selection
5. **`js/systems/ui/modals/game-over.js`** - Death screen with stats
6. **`js/systems/ui/modals/settings.js`** - Settings (audio, controls, etc.)
7. **`js/systems/ui/modals/help.js`** - Controls and game help
8. **`js/systems/ui/modals/weapon-info.js`** - Weapon details and stats
9. **`js/systems/ui/modals/stats.js`** - Player statistics modal
10. **`js/systems/ui/modals/victory.js`** - Victory/boss defeated screen (if applicable)

**Base Modal Structure**:
```javascript
export class Modal {
    constructor(id) {
        this.id = id;
        this.element = document.getElementById(id);
        this.visible = false;
    }

    show() {
        this.visible = true;
        this.element.style.display = 'block';
        this.onShow();
    }

    hide() {
        this.visible = false;
        this.element.style.display = 'none';
        this.onHide();
    }

    onShow() {
        // Override in subclasses
    }

    onHide() {
        // Override in subclasses
    }
}
```

#### 10.5 Create `js/systems/ui/i18n.js` (Optional - if internationalization needed)

Translation system for multiple languages.

### Integration

Update monolith:
```javascript
import { HUD } from './systems/ui/hud.js';
import { TouchControls } from './systems/ui/touch-controls.js';
import { PauseMenu } from './systems/ui/modals/pause-menu.js';
import { LevelUpModal } from './systems/ui/modals/level-up.js';
// ... import all modals

const hud = new HUD();
const touchControls = new TouchControls();
const pauseMenu = new PauseMenu('pause-menu');
const levelUpModal = new LevelUpModal('level-up-modal');

// Wire up modal events
```

### Testing Checklist

**STOP - Do NOT proceed to Integration Checkpoint #3 until ALL checks pass:**

- [ ] HUD displays correctly
- [ ] Health bar updates in real-time
- [ ] XP bar updates and fills correctly
- [ ] Weapon icons display
- [ ] Timer displays elapsed time
- [ ] All 10 modals can be opened
- [ ] All 10 modals can be closed
- [ ] Modal transitions smooth
- [ ] Touch controls work on mobile (test on phone/tablet if available)
- [ ] Virtual joystick functional
- [ ] Language switching works (if i18n implemented)
- [ ] No UI glitches or overlaps
- [ ] No console errors

**Test each modal specifically:**
- [ ] Loading screen shows during asset preload
- [ ] Loading progress bar updates (0% → 25% → 50% → 75% → 100%)
- [ ] Loading phase labels display correctly (BOOTING → LOADING → READY)
- [ ] Start screen appears after loading completes
- [ ] Pause menu (ESC key)
- [ ] Level-up modal shows 3 upgrade choices
- [ ] Game-over modal shows final stats
- [ ] Settings modal allows changes
- [ ] Help modal displays controls
- [ ] Weapon info shows weapon details
- [ ] Stats modal shows player statistics
- [ ] Victory modal (if applicable)


---

## Integration Checkpoint #3

**Goal**: Verify complete game systems integration

**Time**: 15 minutes

**Full game test before final phase:**

- [ ] Game loads and starts correctly
- [ ] All gameplay systems function
- [ ] Combat works (weapons, enemies, damage)
- [ ] Progression works (XP, leveling, upgrades)
- [ ] All UI elements display
- [ ] All modals work
- [ ] Game runs at stable 60 FPS
- [ ] No console errors
- [ ] Game feels complete and playable

**If ANY test fails, go back and fix before proceeding to Phase 11!**


---

## Phase 11: Extract Game Engine & Audio

**Goal**: Create main engine orchestrator and audio system

**Time**: 75 minutes (45 min implementation + 30 min testing)

**Risk Level**: 🟡 Medium (final integration)

**Dependencies**: ALL previous phases

### Files to Create

#### 11.1 Create `js/core/engine.js`

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

        // IMPORTANT: Show loading screen and preload assets BEFORE anything else
        await this.preloadAssets();

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

    async preloadAssets() {
        // Delegates to asset system's preloadAssets()
        // Updates loading screen UI with progress
        // Hides loading screen when complete
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

#### 11.2 Create `js/systems/audio/audio-manager.js`

**Structure**:
```javascript
export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = null;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.muted = false;
    }

    async init() {
        // Load background music
        try {
            this.music = new Audio('sound/Vibe_Survivor.mp3');
            this.music.loop = true;
            this.music.volume = this.musicVolume;
        } catch (error) {
            console.warn('Failed to load background music:', error);
        }
    }

    playMusic() {
        if (this.music && !this.muted) {
            this.music.play().catch(e => console.warn('Music playback failed:', e));
        }
    }

    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    pauseMusic() {
        if (this.music) {
            this.music.pause();
        }
    }

    resumeMusic() {
        if (this.music && !this.muted) {
            this.music.play().catch(e => console.warn('Music resume failed:', e));
        }
    }

    loadSound(name, path) {
        const audio = new Audio(path);
        audio.volume = this.sfxVolume;
        this.sounds.set(name, audio);
    }

    playSound(name) {
        if (this.muted) return;

        const sound = this.sounds.get(name);
        if (sound) {
            // Clone audio for overlapping sounds
            const clone = sound.cloneNode();
            clone.volume = this.sfxVolume;
            clone.play().catch(e => console.warn(`Sound ${name} playback failed:`, e));
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.volume = this.musicVolume;
        }
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach(sound => {
            sound.volume = this.sfxVolume;
        });
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.pauseMusic();
        } else {
            this.resumeMusic();
        }
    }
}
```

#### 11.3 Update `js/vibe-survivor-game.js`

Simplify to just export GameEngine:

```javascript
export { GameEngine } from './core/engine.js';
```

#### 11.4 Update `js/main.js`

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

**CRITICAL - This is the final integration test. Do NOT proceed to Post-Refactoring until ALL checks pass:**

- [ ] Game initializes correctly via main.js
- [ ] Loading screen appears immediately on game start
- [ ] Asset preloading completes with progress bar updates (0% → 100%)
- [ ] Loading screen hides after preload completes
- [ ] Start screen appears after loading finishes
- [ ] Game loop runs at consistent 60 FPS
- [ ] All systems orchestrated correctly by engine
- [ ] Audio system initializes
- [ ] Background music plays (or fails gracefully)
- [ ] Sound effects work
- [ ] Volume controls work
- [ ] Mute toggle works
- [ ] Pause/resume works correctly
- [ ] Game over triggers and displays correctly
- [ ] Restart functionality works
- [ ] Full gameplay session completes without errors
- [ ] Memory usage stable (no leaks)
- [ ] No console errors or warnings

**Complete Smoke Test:**
- [ ] Play game for 5+ minutes
- [ ] Reach level 5
- [ ] Test all weapons
- [ ] Test all enemy types
- [ ] Test death and restart
- [ ] Game remains stable and responsive


---

## Phase 12a: Replace Phase 8 Code - Integrate Gameplay Entities

**Goal**: Replace old player, enemy, and pickup code with Phase 8 systems

**Time**: 50 minutes (35 min implementation + 15 min testing)

**Risk Level**: 🟠 Medium-High (core gameplay logic)

**Dependencies**: Phase 8 systems must exist

**IMPORTANT**: Phase 8 created PlayerSystem, EnemySystem, and PickupSystem but old code still runs. This phase actually uses them.

### Current State Analysis

**PlayerSystem exists but NOT used:**
- Old code: `updatePlayer()`, `checkLevelUp()`, `updatePassives()` methods in main file
- New code: `PlayerSystem` with same methods, sitting unused

**EnemySystem exists but NOT used:**
- Old code: `updateEnemies()`, `spawnEnemy()`, inline enemy update logic
- New code: `EnemySystem.updateEnemy()`, `.spawnEnemy()`, sitting unused

**PickupSystem exists but NOT used:**
- Old code: `updatePickups()`, `spawnPickup()`, inline pickup logic
- New code: `PickupSystem` methods, sitting unused

### Implementation Steps

#### 12a.1: Replace Player Update Logic

Find and replace in `vibe-survivor-game.js`:

**OLD CODE (to remove):**
```javascript
// In gameLoop() or update():
this.updatePlayer();
this.checkLevelUp();
this.updatePassives();
```

**NEW CODE (use existing PlayerSystem):**
```javascript
// In gameLoop() or update():
this.playerSystem.updatePlayer(this.player, this.keys, this.touchControls, deltaTime);
this.playerSystem.checkLevelUp(this.player, this.weapons, this.passives);
this.playerSystem.updatePassives(this.player, this.passives, deltaTime);
```

#### 12a.2: Replace Enemy Update Logic

**OLD CODE (to remove):**
```javascript
updateEnemies() {
    // Inline enemy update logic (~100+ lines)
}
```

**NEW CODE:**
```javascript
updateEnemies() {
    // Delegate to EnemySystem
    for (const enemy of this.enemies) {
        this.enemySystem.updateEnemy(enemy, this.player, deltaTime);
    }
}
```

#### 12a.3: Replace Pickup Logic

**OLD CODE (to remove):**
```javascript
updatePickups() {
    // Inline pickup logic
}
spawnPickup(x, y, type) {
    // Inline spawn logic
}
```

**NEW CODE:**
```javascript
updatePickups() {
    this.pickups = this.pickupSystem.updatePickups(
        this.pickups,
        this.player,
        this.passives,
        deltaTime
    );
}

spawnPickup(x, y, type) {
    return this.pickupSystem.createPickup(x, y, type);
}
```

### Testing Checklist

**STOP - Do NOT proceed until ALL checks pass:**

- [ ] Player movement works (WASD/Arrow keys)
- [ ] Player dash works (Spacebar)
- [ ] Player health updates correctly
- [ ] XP collection works
- [ ] Level up triggers at correct XP
- [ ] Passive abilities apply correctly
- [ ] Enemies spawn correctly
- [ ] Enemies move and attack player
- [ ] Enemy behaviors work (chase, dodge, tank, fly, teleport)
- [ ] Boss enemies work
- [ ] Pickups spawn correctly
- [ ] XP orbs collect when player touches them
- [ ] Health pickups heal player
- [ ] Magnet passive affects pickup range
- [ ] No console errors
- [ ] Game runs smoothly at 60 FPS

**If ANY test fails, rollback and debug before proceeding!**


---

## Phase 12b: Replace Phase 9 Code - Integrate Weapons & Progression

**Goal**: Replace old weapon, projectile, XP, and upgrade code with Phase 9 systems

**Time**: 50 minutes (35 min implementation + 15 min testing)

**Risk Level**: 🟠 Medium-High (combat and progression)

**Dependencies**: Phase 9 systems must exist

**IMPORTANT**: Phase 9 created WeaponSystem, ProjectileSystem, XPSystem, UpgradeSystem but old code still runs.

### Current State Analysis

**Systems exist but NOT used:**
- WeaponSystem: `createWeapon()`, `upgradeWeapon()` exist but old inline code runs
- ProjectileSystem: Object pooling exists but old `getPooledProjectile()` runs
- XPSystem: `getXPForLevel()`, `addXP()` exist but old inline XP logic runs
- UpgradeSystem: `getUpgradeChoices()` exists but old upgrade logic runs

### Implementation Steps

#### 12b.1: Replace Weapon Creation

**OLD CODE:**
```javascript
createWeapon(type) {
    // Inline weapon creation (~30 lines)
    const config = WEAPONS[type.toUpperCase()];
    return { type, level: 1, damage: config.damage, ... };
}
```

**NEW CODE:**
```javascript
createWeapon(type) {
    return this.weaponSystem.createWeapon(type);
}
```

#### 12b.2: Replace Weapon Upgrade Logic

**OLD CODE in upgrade selection:**
```javascript
// In selectUpgrade():
weapon.level++;
weapon.damage = Math.floor(weapon.damage * 1.3);
if (weapon.level % 2 === 0) weapon.projectileCount++;
```

**NEW CODE:**
```javascript
// In selectUpgrade():
this.weaponSystem.upgradeWeapon(weapon);
```

#### 12b.3: Replace Projectile Pooling

**OLD CODE:**
```javascript
getPooledProjectile() {
    // Inline pooling logic
    if (this.projectilePool.length > 0) {
        return this.projectilePool.pop();
    }
    return { x: 0, y: 0, ... };
}
```

**NEW CODE:**
```javascript
getPooledProjectile() {
    return this.projectileSystem.getPooled();
}

returnProjectileToPool(projectile) {
    this.projectileSystem.returnToPool(projectile);
}
```

#### 12b.4: Replace XP Logic

**OLD CODE:**
```javascript
// Inline XP calculation
const xpRequired = this.player.level * 5 + 10;
if (this.player.xp >= xpRequired) {
    this.player.level++;
    this.player.xp -= xpRequired;
}
```

**NEW CODE:**
```javascript
const xpRequired = this.xpSystem.getXPForLevel(this.player.level);
if (this.xpSystem.canLevelUp(this.player)) {
    this.player.level++;
    this.player.xp -= xpRequired;
}
```

#### 12b.5: Replace Upgrade Choice Generation

**OLD CODE:**
```javascript
getUpgradeChoices() {
    // Inline upgrade choice logic (~100 lines)
    const choices = [];
    // Build weapon upgrades
    // Build new weapons
    // Build passives
    return choices;
}
```

**NEW CODE:**
```javascript
getUpgradeChoices() {
    return this.upgradeSystem.getUpgradeChoices(
        this.weapons,
        this.passives,
        3 // choice count
    );
}
```

### Testing Checklist

**STOP - Do NOT proceed until ALL checks pass:**

- [ ] All weapon types fire correctly
- [ ] Weapon damage calculated correctly
- [ ] Weapon fire rate works
- [ ] Projectiles spawn from weapon pool
- [ ] Projectiles return to pool when destroyed
- [ ] No memory leaks (pool doesn't grow infinitely)
- [ ] XP orbs give correct XP amount
- [ ] Level up triggers at correct threshold
- [ ] Level up modal shows 3 upgrade choices
- [ ] Weapon upgrades apply correctly
- [ ] New weapons can be acquired
- [ ] Passive abilities can be selected
- [ ] Max weapons limit respected (4)
- [ ] Max level limit respected (10)
- [ ] No console errors
- [ ] Combat feels responsive

**If ANY test fails, rollback and debug before proceeding!**

### ✅ Phase 12b Completion Notes

**Status**: COMPLETED ✅

**Integration Summary:**
1. ✅ **WeaponSystem** integrated:
   - `weaponSystem.createWeapon()` - Creates weapons from constants
   - `weaponSystem.upgradeWeapon()` - Handles upgrades (damage, projectile count)
   - `weaponSystem.mergeWeapons()` - Automatic weapon merging

2. ✅ **ProjectileSystem** integrated:
   - `projectileSystem.getPooled()` - Projectile pooling
   - `projectileSystem.returnToPool()` - Projectile reuse

3. ✅ **XPSystem** integrated:
   - `xpSystem.addXP()` - XP tracking
   - PlayerSystem handles level up logic

4. ⚠️ **UpgradeSystem** - Deferred:
   - System exists but integration deferred
   - Current upgrade choice generation works well
   - Would require refactoring complex display logic with translations/icons

**Critical Bugs Fixed:**
1. 🐛 **Projectile Owner Bug** (js/systems/gameplay/weapons/projectiles.js:80):
   - Boss missiles were attacking player when reused from pool
   - Fixed by resetting `owner: 'player'` in `returnToPool()`

2. 🐛 **Weapon Upgrade Projectile Count** (js/systems/gameplay/weapons/weapon-base.js:68-74):
   - Projectile count was incrementing only on even levels (2, 4, 6, 8, 10)
   - Fixed to increment every level from level 2 onwards (2, 3, 4, 5, capped at 5)
   - More generous progression matching original game design

3. 🐛 **Speed Boost Double Application** (js/systems/gameplay/player.js:44):
   - Two systems applying speed boost simultaneously causing exponential growth
   - Fixed multiplier from 25% to 10% per stack (matching constants)
   - Removed permanent speed modification from game code

**Files Modified:**
- `js/config/constants.js` - Added `isMergeWeapon` property
- `js/systems/gameplay/weapons/weapon-base.js` - Fixed upgrade logic
- `js/systems/gameplay/weapons/projectiles.js` - Fixed owner reset bug
- `js/systems/gameplay/player.js` - Fixed speed boost multiplier
- `js/vibe-survivor-game.js` - Integrated all Phase 9 systems


---

## Phase 12c: Replace Phase 10 Code - Integrate UI Systems

**Goal**: Replace old HUD, modal, and touch control code with Phase 10 systems

**Time**: 70 minutes (50 min implementation + 20 min testing)

**Risk Level**: 🔴 High (many UI components, visual regression risk)

**Dependencies**: Phase 10 systems must exist

**IMPORTANT**: Phase 10 created HUDSystem and 10 modal classes but old UI code still runs.

### Current State Analysis

**HUDSystem exists but NOT used:**
- Old code: `updateUI()` method updates HUD inline (~80 lines)
- New code: `HUDSystem.updateAll()` exists but never called

**Modal classes exist but NOT used:**
- Old code: `showGameOverModal()` creates HTML dynamically (~300 lines)
- New code: `GameOverModal` class exists but never instantiated with DOM
- Same for all 10 modal types

**TouchControlsUI exists but NOT used:**
- Old code: Touch control logic inline
- New code: `TouchControlsUI` exists but never used

### Implementation Steps

#### 12c.1: Replace HUD Update Logic

**OLD CODE:**
```javascript
updateUI() {
    // 80+ lines of inline HUD updates
    const healthPercent = (this.player.health / this.player.maxHealth) * 100;
    document.getElementById('header-health-fill').style.width = `${healthPercent}%`;
    // ... many more lines
}
```

**NEW CODE:**
```javascript
updateUI() {
    this.hudSystem.updateAll(
        {
            player: this.player,
            weapons: this.weapons,
            game: {
                gameTime: this.gameTime,
                bossesKilled: this.bossesKilled
            }
        },
        this.getWeaponIconForHeader.bind(this),
        this.getWeaponName.bind(this)
    );
}
```

#### 12c.2: Replace Game Over Modal

**CRITICAL CHANGE - This is where your bug fix needs to go!**

**OLD CODE (~300 lines):**
```javascript
showGameOverModal() {
    // Creates entire modal HTML dynamically
    const gameOverOverlay = document.createElement('div');
    gameOverOverlay.innerHTML = `...300 lines...`;
    // Add event listeners inline
    // Manual scroll handling
}
```

**NEW CODE:**
```javascript
showGameOverModal() {
    // Use GameOverModal class
    const finalStats = {
        level: this.player.level,
        timeText: this.formatTime(this.gameTime),
        enemiesKilled: Math.floor(this.gameTime * 1.8),
        weapons: this.weapons,
        passives: this.passives
    };

    this.modals.gameOver.update(finalStats);
    this.modals.gameOver.show();
}
```

**This means you need to update `game-over.js` with your bug fix!**

#### 12c.3: Replace Level Up Modal

**OLD CODE:**
```javascript
showLevelUpScreen() {
    // Creates modal HTML dynamically (~200 lines)
    const choices = this.getUpgradeChoices();
    // Render choices inline
}
```

**NEW CODE:**
```javascript
showLevelUpScreen() {
    const choices = this.upgradeSystem.getUpgradeChoices(
        this.weapons,
        this.passives
    );

    this.modals.levelUp.update({
        choices: choices,
        playerLevel: this.player.level
    });
    this.modals.levelUp.show();
}
```

#### 12c.4: Replace All Other Modals

Similar pattern for:
- Pause menu
- Settings
- Help
- Victory
- etc.

#### 12c.5: Replace Touch Controls

**OLD CODE:**
```javascript
// Inline touch control updates in game loop
if (this.touchControls.active) {
    // Update joystick position
}
```

**NEW CODE:**
```javascript
// In init:
this.touchControlsUI.init();
this.touchControlsUI.autoDetect();

// In game loop:
this.touchControlsUI.updateJoystick(
    this.touchControls.moveX,
    this.touchControls.moveY
);
```

### Detailed Sub-Tasks (Option B Pattern)

**IMPORTANT**: All modals must follow the "Option B" pattern - proper encapsulation where modals own ALL their behavior.

**Reference Code**: Pre-refactor code available at:
`C:\Users\samso\OneDrive\Desktop\Vibe\Web\Temp\Vibe-Survivor_Pre-Refactor\js\vibe-survivor-game.js`

Use this reference to match exact styling, HTML structure, colors, and functionality from the original implementation.

#### Option B Pattern Requirements

Each modal must:
1. **Own all keyboard handling** - Modal sets up keyboard handlers in `onShow()`, cleans up in `onHide()`
2. **Own all scrolling behavior** - Modal handles W/S/arrow key scrolling internally
3. **Own all tab switching** - Modal manages tab state and navigation
4. **Own all touch handling** - Modal sets up touch handlers for mobile
5. **Manage overlay locks** - Modal calls `incrementOverlayLock()` on show, `decrementOverlayLock()` on hide
6. **Use lifecycle hooks** - All setup in `onShow()`, all cleanup in `onHide()`
7. **Event capture phase** - Use `{ capture: true }` for keyboard handlers to get events before main game
8. **Stop propagation** - Call `e.stopPropagation()` after handling events to prevent main game from seeing them

**Main file responsibilities:**
- Provide data to modal via `update(data)`
- Provide callbacks via setter methods
- Show/hide modal
- **NO** keyboard handling for modals
- **NO** direct DOM manipulation for modal content

#### 12c.1: ✅ HUD System Integration (COMPLETED)

- [x] Replace inline HUD updates with `HUDSystem.updateAll()`
- [x] Test health bar, XP bar, level display, weapon icons

#### 12c.2: ✅ Game Over Modal Integration (COMPLETED)

- [x] Use `GameOverModal` class instead of dynamic HTML creation
- [x] Implement Option B pattern (modal owns keyboard/scrolling)
- [x] Add overlay lock integration
- [x] Test with many upgrades (late game scenario)

#### 12c.3: ✅ Level Up Modal Integration (COMPLETED)

- [x] Use `LevelUpModal` class instead of dynamic HTML creation
- [x] Implement Option B pattern with full keyboard navigation
- [x] Add tab management (Level Up, Guide, Status tabs)
- [x] Add keyboard scrolling (W/S, arrows) in Guide/Status tabs
- [x] Add overlay lock to disable pause/help buttons when active
- [x] Match Guide tab styling exactly to pre-refactor (gold cards, weapon PNGs, evolution icon)
- [x] Test keyboard navigation (Tab, W/S, A/D, arrows, Enter)
- [x] Test scrolling in all tabs

#### 12c.4: ✅ Pause Modal Integration (COMPLETED)

**Files**: `js/systems/ui/modals/pause-menu.js`, `js/vibe-survivor-game.js`

**Tasks**:
- [x] Refactor `PauseModal` to Option B pattern
- [x] Add keyboard handler for Resume (ESC), navigation (W/S/arrows), activate (Enter)
- [x] Add overlay lock callbacks
- [x] Extract all keyboard navigation from main file to modal
- [x] Add support for Mute and Dash Position buttons
- [x] Implement dynamic button label updates

**Reference**: Lines ~4217-4305 in pre-refactor code for pause menu behavior

#### 12c.4b: ✅ Restart and Exit Confirmation Modals (COMPLETED)

**Files**: `js/systems/ui/modals/restart-confirmation.js`, `js/systems/ui/modals/exit-confirmation.js`, `js/vibe-survivor-game.js`

**Tasks**:
- [x] Create `RestartConfirmationModal` class following Option B pattern
- [x] Create `ExitConfirmationModal` class following Option B pattern
- [x] Add keyboard navigation (A/D, W/S, arrows) for both modals
- [x] Add overlay lock integration
- [x] Implement parent keyboard handler management (disable pause modal while confirmation shown)
- [x] Wire up confirmation callbacks in main file
- [x] Fix keyboard handler cleanup in `setupEventHandlers()` to prevent handler leaks
- [x] Fix `reopenGame()` to reinitialize keyboard navigation after quit
- [x] Test full flow: pause → exit/restart → confirmation → action

**Reference**: Confirmation modals triggered from pause menu

#### 12c.5: ✅ Options Menu Integration (COMPLETED)

**Files**: `js/systems/ui/modals/options-menu.js`, `js/vibe-survivor-game.js`

**Tasks**:
- [x] Create `OptionsMenu` class following Option B pattern
- [x] Add keyboard navigation for options (W/S, arrows, Enter to select/toggle)
- [x] Add overlay lock integration
- [x] Implement dynamic button label updates (Mute, Dash Position)
- [x] Wire up callbacks for language change, mute, and dash position
- [x] Remove old event listeners from main file
- [x] Add modal cleanup to closeGame()
- [x] Support for previous navigation state restoration (when opened from start screen)
- [x] Test all settings changes (language, audio, dash position)

**Note**: The game uses "options-menu" not "settings-modal". The OptionsMenu class manages language selection, audio mute toggle, and dash button position toggle.

---

### 📋 MODAL INITIALIZATION PATTERN (Option B)

**CRITICAL**: This pattern must be followed for ALL modal refactoring to ensure modals work on initial load AND after game restart.

#### Initialization Flow

The game has multiple initialization paths:

1. **Initial Load (Constructor → initGame)**:
   ```
   Constructor() → initGame() → createGameModal() → setupEventHandlers() → Initialize Modal
   ```

2. **After Restart (launchGame)**:
   ```
   launchGame() → createGameModal() → setupEventHandlers() → (Modal already initialized)
   ```

#### Where to Initialize Modals

**Rule**: Initialize modals in `initGame()`, NOT in `launchGame()` or `openGame()`.

**Why**:
- `initGame()` runs during constructor, ensuring modals are ready on first load
- `launchGame()` is only called when restarting (from landing page), modal already exists
- `openGame()` is called when starting gameplay, too late for start screen modals

#### Modal Initialization Template

```javascript
// In initGame() method (after createGameModal and setupEventHandlers):

// Phase 12c.X - Initialize [ModalName] modal (after modal HTML is created)
if (!this._modalNameInitialized) {
    this.modals.modalName.init();

    // Set up game state callbacks for dynamic labels/content
    this.modals.modalName.setGameStateCallbacks(
        () => this.someState,
        () => this.anotherState
    );

    // Set up overlay lock callbacks
    this.modals.modalName.setOverlayLockCallbacks(
        this.incrementOverlayLock.bind(this),
        this.decrementOverlayLock.bind(this)
    );

    // Set up parent keyboard management (if nested in another modal)
    this.modals.modalName.setParentKeyboardCallbacks(
        this.modals.parentModal.disableKeyboardHandlers.bind(this.modals.parentModal),
        this.modals.parentModal.enableKeyboardHandlers.bind(this.modals.parentModal)
    );

    // Set up button callbacks
    this.modals.modalName.onAction(() => {
        // Handle action
    });

    this._modalNameInitialized = true;
}
```

#### Initialization Guard Flag

Always use a flag to prevent re-initialization:
- `this._pauseModalInitialized`
- `_optionsMenuInitialized`
- `_restartConfirmationModalInitialized`
- etc.

#### Event Listener Placement

- **Modal open/close triggers**: In `setupEventHandlers()` (e.g., `options-btn` click)
- **Modal internal buttons**: In the modal class itself (Option B pattern)
- **Never duplicate**: Remove old event listeners from main file when refactoring

#### Testing Checklist

When refactoring a modal, test:
1. ✅ Modal works on initial page load
2. ✅ Modal works from start screen
3. ✅ Modal works during gameplay (if applicable)
4. ✅ Modal works after restart (quit to start menu)
5. ✅ Keyboard navigation works in all scenarios
6. ✅ Modal cleanup happens on game exit (closeGame)

---

#### 12c.6: ✅ Help Menu Integration (COMPLETED)

**Files**: `js/systems/ui/modals/help-menu.js`, `js/vibe-survivor-game.js`

**Tasks**:
- [x] Create `HelpMenu` class following Option B pattern
- [x] Add keyboard scrolling (W/S, arrows) for long help content
- [x] Add tab switching between Guide and Status tabs (with Tab key)
- [x] Add overlay lock integration
- [x] Add game pause/resume functionality
- [x] Previous navigation state restoration
- [x] F1 key shortcut support (handled internally by modal)
- [x] Touch scrolling support for mobile
- [x] Help button text toggle (? when closed, × when open)
- [x] Remove old event listeners from main file
- [x] Remove help-related code from mainKeyboardHandler
- [x] Add modal cleanup to closeGame()

**Note**: The game uses "help-menu" with two tabs: Guide (controls/tips) and Status (current weapons/passives). The modal pauses the game when opened and resumes when closed (unless pause menu is still open).

#### 12c.7: ✅ Victory Modal Integration (COMPLETED)

**Files**: `js/systems/ui/modals/victory.js`, `js/vibe-survivor-game.js`

**Tasks**:
- [x] Refactor `VictoryModal` to Option B pattern
- [x] Add keyboard scrolling for victory stats (W/S, arrows)
- [x] Add keyboard navigation for Continue/Exit buttons (A/D, left/right arrows)
- [x] Add overlay lock callbacks
- [x] Match styling from pre-refactor
- [x] Remove old victory code from bossDefeated()
- [x] Remove old enableVictoryScrolling, disableVictoryScrolling, scrollVictoryContent methods
- [x] Add modal cleanup to closeGame()

**Note**: The victory modal is dynamically created when a boss is defeated. It shows final stats, weapons, passives, and player stats with scrollable content. Users can navigate to buttons at the bottom using keyboard, then select Continue or Exit. ESC key is disabled in victory modal to prevent accidental exits.

#### 12c.8: ✅ Start Screen Modal Integration (COMPLETED)

**Files**: `js/systems/ui/modals/start-screen-modal.js`, `js/vibe-survivor-game.js`

**Tasks**:
- [x] Create minimal `StartScreenModal` class (Option B pattern - conservative approach)
- [x] Modal handles only button click event listeners
- [x] Set up callbacks for Start, Options, About, Restart, Exit buttons
- [x] Initialize in initGame() with all button callbacks
- [x] Remove old button event listeners from setupEventHandlers()

**Implementation Notes**:
- **Conservative Approach**: Modal only handles button click events
- Keyboard navigation remains in main game file (uses existing menuNavigationState system)
- DOM manipulation (showStartScreen, startGame) remains in main game file
- Rendering and lifecycle management remains in main game file
- This minimal approach preserves all existing functionality and reduces risk

**Reference**: Lines ~3727-3783 (showStartScreen), ~3292 (removed event listeners)

#### 12c.9: ✅ Loading Screen Modal Integration (COMPLETED)

**Files**: `js/systems/ui/modals/loading-screen.js`, `js/vibe-survivor-game.js`

**Tasks**:
- [x] Initialize LoadingScreen modal in initGame()
- [x] Update LoadingScreen class to match actual HTML structure
- [x] Replace direct DOM manipulation in preloadAssets() with modal methods
- [x] Integrate with asset loading progress (show, setProgress, setPhase, setMessage, hide)
- [x] Test loading phases and progress updates

**Implementation Notes**:
- **Conservative Approach**: LoadingScreen modal class already existed but wasn't initialized
- Fixed CSS class mismatches (`.loading-fill`, `.loading-percent`, `.loading-label`, `.loading-text`)
- All loading phase logic remains in `preloadAssets()` method
- Modal provides clean API: `show()`, `setProgress()`, `setPhase()`, `setMessage()`, `hide()`
- Smooth fade-out transition preserved

**Reference**: Lines ~341-517 (preloadAssets method)

#### 12c.10: ✅ About Modal Integration (COMPLETED)

**Files**: `js/systems/ui/modals/about-modal.js`, `js/vibe-survivor-game.js`

**Tasks**:
- [x] Create minimal `AboutModal` class (Option B pattern - conservative approach)
- [x] Modal handles only close button click event listener (click and touchstart)
- [x] Set up close callback
- [x] Initialize in initGame() with close callback
- [x] Remove old close button event listeners from setupEventHandlers()

**Implementation Notes**:
- **Conservative Approach**: Modal only handles close button click events
- Keyboard navigation remains in main game file (uses existing menuNavigationState system)
- Scrolling methods (enableAboutScrolling, disableAboutScrolling) remain in main game file
- Menu state management remains in main game file
- This minimal approach preserves all existing functionality and reduces risk

**Reference**: Lines ~11415-11475 (showAboutMenu, hideAboutMenu), ~3368 (removed event listeners)

#### 12c.11: ✅ Options Modal Integration (COMPLETED - Duplicate of 12c.5)

**Note**: This sub-task is a duplicate of Phase 12c.5 which was already completed. The Options Modal was successfully integrated in Phase 12c.5 with full keyboard navigation, overlay lock callbacks, and all option changes tested.

**Files**: `js/systems/ui/modals/options-menu.js`, `js/vibe-survivor-game.js`

**Completed Tasks**:
- [x] Refactored `OptionsMenu` modal with Option B pattern (completed in 12c.5)
- [x] Added keyboard navigation for option selection (completed in 12c.5)
- [x] Added overlay lock callbacks (completed in 12c.5)
- [x] Tested all option changes (completed in 12c.5)

**Reference**: Phase 12c.5 implementation, Lines ~535-570 (modal initialization in initGame)

#### 12c.12: ✅ Touch Controls Integration (COMPLETED)

**Files**: `js/systems/ui/touch-controls.js`, `js/vibe-survivor-game.js`

**Completed Tasks**:
- [x] Replaced inline touch control logic with `TouchControlsUI`
- [x] Expanded `TouchControlsUI` to handle dash button (positioning, events, show/hide)
- [x] Replaced `setupMobileControls()` with `touchControlsUI.init(touchControls, isMobile)`
- [x] Replaced `ensureDashButtonInBounds()` with `touchControlsUI.setDashButtonPosition()`
- [x] Removed old methods: `setupMobileControls`, `ensureDashButtonInBounds`, `setupDashButton`, `setupVirtualJoystick`, `updateTouchControlsPositioning`
- [ ] Test virtual joystick on mobile/tablet (user testing required)
- [ ] Test dash button (user testing required)
- [ ] Verify touch detection and auto-show/hide (user testing required)

**Changes Made**:
- **TouchControlsUI** now manages both virtual joystick and dash button
- Added `setupDashButton()` method with mouse and touch event handlers
- Added `setDashButtonPosition(position)` for left/right positioning
- Added `showDashButton()` and `hideDashButton()` methods
- Updated `init()` to accept touchControls state reference and isMobile flag
- Removed 100+ lines of duplicate touch control code from main game file

**Reference**: Lines ~3506, ~4137, ~4520, ~5422-5526 (removed methods)

### Special Considerations

**Modal Refactoring Checklist** (Apply to each modal):
1. ✅ Read pre-refactor code to understand original behavior
2. ✅ Add keyboard handler with `{ capture: true }`
3. ✅ Add `e.stopPropagation()` to all handled keys
4. ✅ Add overlay lock callbacks (`setOverlayLockCallbacks`)
5. ✅ Call `incrementOverlayLockCallback()` in `onShow()`
6. ✅ Call `decrementOverlayLockCallback()` in `onHide()`
7. ✅ Set up keyboard handlers in `onShow()`
8. ✅ Clean up keyboard handlers in `onHide()`
9. ✅ Match exact CSS colors/styling from pre-refactor
10. ✅ Match exact HTML structure from pre-refactor
11. ✅ Test keyboard navigation thoroughly
12. ✅ Test with actual game scenarios

**Game Over Modal Bug Fix:**
Since we're replacing the old modal code, we need to implement your sticky button fix in `game-over.js`:

1. Update `game-over.js` modal template to include sticky buttons
2. Add proper focus management for scrolling
3. Add keyboard scroll handling
4. Test with lots of upgrades (late game scenario)

### Testing Checklist

**STOP - Do NOT proceed until ALL checks pass:**

- [ ] HUD displays correctly
- [ ] Health bar updates in real-time
- [ ] XP bar fills correctly
- [ ] Level display updates
- [ ] Time display counts up
- [ ] Weapon icons show correctly (all 4 slots)
- [ ] Boss counter appears after first boss kill
- [ ] Game over modal appears on death
- [ ] Game over modal shows all stats
- [ ] Game over modal scrolls with keyboard (W/S, Arrow keys)
- [ ] Game over buttons work (Retry, Exit)
- [ ] Game over buttons ALWAYS visible (sticky at bottom)
- [ ] **Test with 7+ boss kills and many upgrades** (your bug scenario)
- [ ] Level up modal shows 3 choices
- [ ] Level up choices are clickable
- [ ] Selecting upgrade works
- [ ] Pause menu works (ESC key)
- [ ] Settings modal works
- [ ] Touch controls visible on mobile
- [ ] Touch joystick updates correctly
- [ ] All modals can be opened
- [ ] All modals can be closed
- [ ] No console errors
- [ ] No visual glitches

**If ANY test fails, rollback and debug before proceeding!**


---

## Phase 12d: Replace Phase 11 Code - Integrate Game Loop Utilities

**Goal**: Replace old game loop with GameLoop utility classes

**Time**: 30 minutes (20 min implementation + 10 min testing)

**Risk Level**: 🟡 Medium (game loop is critical but simple)

**Dependencies**: Phase 11 engine.js must exist

**IMPORTANT**: Phase 11 created GameLoop, EngineTimer, FrameRateCounter but old loop still runs.

### Current State Analysis

**Old code:**
- `gameLoop(timestamp)` method runs the game loop inline
- Manual deltaTime calculation
- Inline FPS tracking

**New code:**
- `GameLoopManager` instance exists but not used
- `EngineTimer` instance exists but not used
- `FrameRateCounter` instance exists but not used

### Implementation Steps

#### 12d.1: Optional - Use EngineTimer

**OLD CODE:**
```javascript
this.gameTime += deltaTime;
```

**NEW CODE:**
```javascript
this.engineTimer.update(deltaTime);
this.gameTime = this.engineTimer.getTime();
```

#### 12d.2: Optional - Use FrameRateCounter

**OLD CODE:**
```javascript
// Manual FPS calculation in performanceMonitor
```

**NEW CODE:**
```javascript
this.frameRateCounter.update(performance.now());
const fps = this.frameRateCounter.getFPS();
```

#### 12d.3: Optional - Use GameLoop

This is the most complex change and is **OPTIONAL** since the current loop works well.

**Benefits:**
- Cleaner code
- Reusable game loop utility

**Risks:**
- Game loop is critical
- Current loop is well-tested
- May introduce timing issues

**Recommendation:** Skip this for now, keep existing loop. The utilities are available if needed later.

### Testing Checklist

**STOP - Do NOT proceed until ALL checks pass:**

- [x] Game runs at stable 60 FPS
- [x] No timing issues
- [x] Game time advances correctly
- [x] Pause/resume works
- [x] No console errors
- [x] Game feels responsive

**If ANY test fails, rollback immediately!**


---

## Integration Checkpoint #4

**Goal**: Verify ALL new systems are fully integrated and working

**Time**: 15 minutes

**This is a CRITICAL checkpoint - the game must be fully modular now.**

### Complete Integration Checklist

- [ ] **Phase 8 Integration:**
  - [ ] PlayerSystem fully integrated
  - [ ] EnemySystem fully integrated
  - [ ] PickupSystem fully integrated
  - [ ] Old inline code removed

- [ ] **Phase 9 Integration:**
  - [ ] WeaponSystem fully integrated
  - [ ] ProjectileSystem fully integrated
  - [ ] XPSystem fully integrated
  - [ ] UpgradeSystem fully integrated
  - [ ] Old inline code removed

- [ ] **Phase 10 Integration:**
  - [ ] HUDSystem fully integrated
  - [ ] All 10 modals fully integrated
  - [ ] TouchControlsUI fully integrated
  - [ ] Old UI code removed

- [ ] **Phase 11 Integration:**
  - [ ] AudioManager fully integrated (already done)
  - [ ] Game loop utilities integrated (or documented as skipped)

### Full Game Test

Play a complete game session:

- [ ] Start game → Loading works
- [ ] Gameplay → All systems responsive
- [ ] Level up → Modal works, upgrades apply
- [ ] Combat → Weapons and enemies work
- [ ] Late game → 7+ bosses, many upgrades
- [ ] Death → Game over modal works perfectly
  - [ ] Shows all stats
  - [ ] Scrollable with lots of content
  - [ ] Buttons always visible and working
- [ ] Restart → Game resets properly
- [ ] Exit → Game closes cleanly

### Performance Check

- [ ] FPS stable at 60
- [ ] No memory leaks (play 10+ minutes)
- [ ] No console errors
- [ ] No console warnings

**If ANY check fails, fix before proceeding to cleanup!**


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

| Phase | Description | Implementation | Testing | Total | Cumulative |
|-------|-------------|----------------|---------|-------|------------|
| Phase 0 | Pre-Refactor Validation | 10 min | 5 min | 15 min | 15 min |
| Phase 1 | Setup Directory Structure | 5 min | - | 5 min | 20 min |
| Phase 2 | Extract Utilities | 30 min | 10 min | 40 min | 60 min |
| Phase 3 | Extract Configuration | 30 min | 10 min | 40 min | 100 min |
| Phase 4a | State Management (Player & Camera) | 30 min | 10 min | 40 min | 140 min |
| Phase 4b | State Management (Rest) | 30 min | 10 min | 40 min | 180 min |
| **Checkpoint #1** | **Integration Checkpoint** | - | **15 min** | **15 min** | **195 min** |
| Phase 5 | Extract Input Handling | 45 min | 15 min | 60 min | 255 min |
| Phase 6 | Extract Physics | 45 min | 15 min | 60 min | 315 min |
| Phase 7a | Rendering (Core) | 45 min | 10 min | 55 min | 370 min |
| Phase 7b | Rendering (Particles & Effects) | 45 min | 15 min | 60 min | 430 min |
| **Checkpoint #2** | **Integration Checkpoint** | - | **15 min** | **15 min** | **445 min** |
| Phase 8 | Gameplay (Entities) | 60 min | 20 min | 80 min | 525 min |
| Phase 9 | Gameplay (Weapons & Progression) | 60 min | 20 min | 80 min | 605 min |
| Phase 10 | UI Systems & Modals (10 modals) | 65 min | 20 min | 85 min | 690 min |
| **Checkpoint #3** | **Integration Checkpoint** | - | **15 min** | **15 min** | **705 min** |
| Phase 11 | Game Engine & Audio | 45 min | 30 min | 75 min | 780 min |
| **Total** | **14 phases + 3 checkpoints** | **~9.6 hours** | **~3.5 hours** | **~13 hours** | **~13 hours** |

**Realistic Estimate: 13-14 hours total**

Can be spread over 2-3 days with breaks.

**Time Breakdown:**
- Implementation: ~575 minutes (~9.6 hours)
- Testing: ~205 minutes (~3.5 hours)
- Total: ~780 minutes (~13 hours)

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

