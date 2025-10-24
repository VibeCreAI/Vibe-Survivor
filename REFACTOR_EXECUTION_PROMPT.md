# Complete Refactoring Execution Prompt

**CRITICAL INSTRUCTIONS FOR CLAUDE:**

Execute the complete refactoring plan outlined in `refector.md` autonomously through all 10 phases. Use specialized agents strategically throughout the process. Do not stop until all phases are complete and ready for human testing.

---

## EXECUTION STRATEGY

### Agent Utilization Plan:

1. **Phase 0 (Analysis)**: Use `search-specialist` + `context-manager` to analyze the monolith
2. **Phase 1-2 (Setup & Core)**: Use `architecture-modernizer` + `fullstack-developer` for scaffolding
3. **Phase 3 (Core Migration)**: Use `backend-architect` + `fullstack-developer` for engine extraction
4. **Phase 4 (Rendering)**: Use `fullstack-developer` for rendering system extraction
5. **Phase 5 (Gameplay)**: Use `fullstack-developer` + `architect-review` for gameplay systems
6. **Phase 6 (UI)**: Use `fullstack-developer` + `documentation-expert` for UI/modal extraction
7. **Phase 7 (Audio)**: Use `fullstack-developer` for audio system extraction
8. **Phase 8-9 (Integration)**: Use `architect-review` + `legacy-modernizer` + `code-reviewer` for final integration
9. **Throughout**: Use `context-manager` to maintain context across phases

---

## DETAILED EXECUTION INSTRUCTIONS

### PRE-EXECUTION (Phase 0: Analysis & Preparation)

**Agent: search-specialist + context-manager**

1. Read the complete `refector.md` file thoroughly
2. Read the current `js/vibe-survivor-game.js` monolith (12,990 lines, ~520KB)
3. Analyze `js/start-screen-bot.js` as the reference for proper modular structure
4. Use `search-specialist` to create a comprehensive dependency map:
   - Identify all function calls and their dependencies
   - Map out circular dependencies
   - Document all external references (DOM, audio, canvas)
   - Catalog all global state variables
5. Document sprite animation system (91 references, 5 sprite sheets)
6. Catalog all assets (6 AI bot sprites ~290KB + start screen sprite 217KB + weapon icons + passive icons)
7. Create extraction order based on dependency analysis
8. Set up smoke test baseline (current functionality checklist)

**Deliverable**: Dependency map, extraction order plan, baseline functionality document

---

### PHASE 1: Scaffolding & Module Setup

**Agent: architecture-modernizer + fullstack-developer**

1. **DO NOT modify `index.html` yet** - keep it as-is for now
2. Create complete directory structure:
   ```
   js/
     core/ (engine.js, state.js, events.js)
     systems/
       physics/ (collision.js, movement.js)
       rendering/ (canvas.js, renderer.js, particles.js, effects.js, sprites.js, animation.js)
       gameplay/
         player.js
         enemies/ (enemy-base.js, chase.js, dodge.js, tank.js, fly.js, teleport.js, boss.js)
         weapons/ (weapon-base.js, [all weapon files])
         progression/ (xp-system.js, upgrades.js)
         pickups.js
       ui/
         modals/ (modal-base.js, [all modal files])
         hud.js
         i18n.js
         touch-controls.js
       audio/ (audio-manager.js)
     utils/ (vector2.js, math.js, performance.js)
     config/ (constants.js, assets.js)
   ```
3. Create placeholder ES6 module files with:
   - Export stubs with TODO comments
   - JSDoc type definitions
   - Empty class/function structures matching their intended purpose
4. Keep `js/start-screen-bot.js` untouched (already modular - 284 lines, no extraction needed)
5. Add `// MIGRATION PHASE X - [description]` comments to each file

**Deliverable**: Complete module structure with placeholder files

---

### PHASE 2: Core Infrastructure Extraction

**Agent: fullstack-developer + backend-architect**

Extract in this exact order (to avoid circular dependencies):

1. **Extract `utils/vector2.js` FIRST**:
   - Find the Vector2 class definition in monolith (search for "class Vector2")
   - Copy entire class with all methods
   - Export as default: `export default class Vector2 { ... }`
   - Test: Verify all Vector2 methods are present

2. **Extract `config/constants.js`**:
   - Extract all game constants (speeds, damages, spawn rates, etc.)
   - Extract color definitions
   - Extract configuration objects
   - Export as named exports: `export const GAME_CONFIG = { ... }`

3. **Extract `config/assets.js`**:
   - Create asset manifest for all image paths
   - Add sprite sheet configurations:
     ```javascript
     export const SPRITE_CONFIGS = {
       player: {
         idle: 'images/AI BOT-IDLE.png',
         up: 'images/AI BOT-UP.png',
         down: 'images/AI BOT-DOWN.png',
         left: 'images/AI BOT-LEFT.png',
         right: 'images/AI BOT-RIGHT.png',
         frameConfig: { cols: 3, rows: 4, totalFrames: 12, frameRate: 8 }
       },
       startScreenBot: {
         sheet: 'images/AI BOT.png',
         frameConfig: { cols: 10, rows: 10, totalFrames: 100, frameSize: 320 }
       }
     };
     ```
   - Add audio paths
   - Add font path: 'fonts/NeoDunggeunmoPro-Regular.ttf'
   - Add weapon icon configurations (13 weapon types with PNG images)
   - Add passive icon configurations (8 passive types with PNG images)
   - Add responsive icon scaling (16px desktop, 14px tablet, 12px mobile)
   - Add preload function

4. **Extract `utils/math.js`**:
   - Extract math helper functions (lerp, clamp, distance, etc.)
   - Export as named functions

5. **Extract `utils/performance.js`**:
   - Extract FPS monitoring code
   - Extract performance tracking utilities
   - Export monitoring functions

6. **Create `core/state.js`**:
   - Define central state structure
   - Create factory functions for initial state
   - Export state management functions
   - Use constants from config/constants.js

**Deliverable**: Complete core infrastructure modules with proper exports

---

### PHASE 3: Core Game Engine Migration

**Agent: backend-architect + fullstack-developer**

1. **Extract `core/events.js`**:
   - Extract all keyboard event handlers (WASD, arrow keys, ESC, etc.)
   - Extract mouse event handlers (mousemove, click)
   - Extract touch event handlers (touchstart, touchmove, touchend)
   - Create EventManager class
   - Import state from core/state.js

2. **Extract `systems/physics/collision.js`**:
   - Extract collision detection functions
   - Extract hitbox/bounding box calculations
   - Export collision functions

3. **Extract `systems/physics/movement.js`**:
   - Extract movement calculations
   - Extract velocity/acceleration logic
   - Extract dash mechanics
   - Import Vector2 from utils

4. **Create `core/engine.js`**:
   - Extract main game loop (requestAnimationFrame)
   - Extract deltaTime calculations
   - Extract update() and render() orchestration
   - Import and initialize all systems
   - Preserve 60 FPS target

**Deliverable**: Core engine modules with proper system integration

---

### PHASE 4: Rendering System Migration

**Agent: fullstack-developer**

1. **Extract `systems/rendering/canvas.js`**:
   - Extract canvas setup and initialization
   - Extract coordinate transformation functions (world-to-screen)
   - Extract camera follow logic
   - Export canvas context and transform functions

2. **Extract `systems/rendering/particles.js`**:
   - Extract particle system class
   - Preserve object pooling mechanism
   - Extract particle types (XP trail, damage numbers, etc.)
   - Export ParticleSystem class

3. **Extract `systems/rendering/effects.js`**:
   - Extract screen flash effects
   - Extract cyan neon trail rendering
   - Extract CSS filter-based cyan tinting:
     ```javascript
     export const CYAN_TINT_FILTER = 'brightness(0) saturate(100%) invert(89%) sepia(100%) saturate(3533%) hue-rotate(140deg) brightness(104%) contrast(105%)';
     ```
   - Export effect functions

4. **Extract `systems/rendering/sprites.js`**:
   - Extract sprite sheet loading system with progress tracking
   - Extract direction-based sprite selection logic:
     - Angle-to-direction mapping (8 directional angles)
     - Pure up: -90° ± 22.5°
     - Right quadrant: -67.5° to 67.5°
     - Pure down: 90° ± 22.5°
     - Left quadrant: 112.5° to 180° and -180° to -112.5°
   - Extract sprite rendering with cyan filter
   - Extract fallback to cyan circle rendering
   - Import SPRITE_CONFIGS from config/assets.js

5. **Extract `systems/rendering/animation.js`**:
   - Extract animation frame management
   - Extract frame timing (60 FPS game → 8 FPS animation conversion)
   - Extract 3×4 sprite sheet handling (12 total frames)
   - Extract animation state (spriteFrame, spriteTimer, spriteDirection)
   - Export AnimationController class

6. **Extract `systems/rendering/renderer.js`**:
   - Extract main rendering pipeline
   - Orchestrate all rendering subsystems
   - Import and use: canvas, particles, effects, sprites, animation
   - Export main render() function

**Deliverable**: Complete rendering system with sprite animation support

---

### PHASE 5: Gameplay Systems Migration

**Agent: fullstack-developer + architect-review**

Extract in this order to minimize coupling:

1. **Extract `systems/gameplay/player.js`**:
   - Extract player entity and properties
   - Extract player abilities (dash, magnet boost, trail multiplier)
   - Extract player passives system
   - Import from physics/movement.js and rendering/sprites.js

2. **Extract `systems/gameplay/enemies/enemy-base.js`**:
   - Extract base Enemy class with common properties
   - Export as base class for inheritance

3. **Extract enemy behavior files** (one per behavior type):
   - `enemies/chase.js` - Chase behavior enemies
   - `enemies/dodge.js` - Dodge behavior enemies
   - `enemies/tank.js` - Tank behavior enemies
   - `enemies/fly.js` - Fly behavior enemies (ignore terrain)
   - `enemies/teleport.js` - Teleport behavior enemies
   - `enemies/boss.js` - Boss enemies with missile system
   - Each extends EnemyBase

4. **Extract weapon system files**:
   - `weapons/weapon-base.js` - Base weapon class
   - `weapons/arrow.js` - Basic arrow weapon
   - `weapons/spread-shot.js` - Spread shot weapon
   - `weapons/homing-laser.js` - Homing laser weapon
   - `weapons/gatling-gun.js` - Gatling gun weapon
   - [Extract all other weapon types from monolith]
   - Each weapon file handles its own projectile logic

5. **Extract `systems/gameplay/progression/xp-system.js`**:
   - Extract XP collection logic
   - Extract level-up calculations
   - Extract XP orb spawning (including early game spawn around player)
   - Extract XP progress and trail multiplier (1.0 + xpProgress * 3.0)

6. **Extract `systems/gameplay/progression/upgrades.js`**:
   - Extract weapon upgrade system
   - Extract passive upgrade system
   - Extract evolution/recipe system
   - Preserve all upgrade trees and combinations

7. **Extract `systems/gameplay/pickups.js`**:
   - Extract XP orb logic
   - Extract health pickup logic
   - Extract magnet orb logic
   - Extract magnet boost passive (triples attraction speed 4→12)
   - Extract passive item icon system (8 passive types with PNG images)

**Use architect-review agent**: Review for circular dependencies and proper separation of concerns

**Deliverable**: Complete gameplay systems with proper encapsulation

---

### PHASE 6: UI System Migration

**Agent: fullstack-developer + documentation-expert**

1. **Extract `systems/ui/modals/modal-base.js`**:
   - Extract core modal creation logic
   - Extract show/hide/cleanup functions
   - Extract event handling (ESC key, click outside)
   - Extract z-index management
   - Export ModalBase class

2. **Extract individual modal files** (each extends ModalBase):
   - `modals/start-screen.js` - Start screen with "Press Start"
   - `modals/options-modal.js` - Options menu (language, audio, dash button positioning)
   - `modals/pause-modal.js` - Pause menu with resume/restart
   - `modals/levelup-modal.js` - Level-up with weapon selection and scrolling
   - `modals/help-modal.js` - Help screen with recipes and controls
   - `modals/gameover-modal.js` - Game over screen with score
   - `modals/exit-confirm.js` - Exit confirmation modal
   - `modals/restart-confirm.js` - Restart confirmation modal

3. **Extract `systems/ui/i18n.js`**:
   - Extract complete English/Korean translation system
   - Extract language switching logic
   - Extract text update functions
   - Export translation functions and language toggle

4. **Extract `systems/ui/hud.js`**:
   - Extract health bar rendering
   - Extract XP bar rendering
   - Extract stats display (wave, kills, time)
   - Extract boss counter display
   - Extract weapon header icon system with `getWeaponIconForHeader()` method
   - Export HUD render functions

5. **Extract `systems/ui/touch-controls.js`**:
   - Extract virtual joystick logic
   - Extract mobile touch detection
   - Extract touch coordinate mapping
   - **CRITICAL**: Test extensively on mobile after extraction

6. **Keep `js/start-screen-bot.js` untouched** - already properly modular! (284 lines, no extraction needed)

**Use documentation-expert agent**: Document each modal's purpose and usage

**Deliverable**: Complete UI system with all modals and i18n support

---

### PHASE 7: Audio System Migration

**Agent: fullstack-developer**

1. **Extract `systems/audio/audio-manager.js`**:
   - Extract audio initialization with fallback handling
   - Extract background music playback (Vibe_Survivor.mp3)
   - Extract sound effect playback
   - Extract volume controls
   - Extract audio lazy-loading and caching
   - Export AudioManager class

**Deliverable**: Complete audio system with fallback support

---

### PHASE 8: Final Integration & Wiring

**Agent: architect-review + legacy-modernizer + fullstack-developer**

1. **Update `js/vibe-survivor-game.js` to become ES6 module orchestrator**:
   - Import all extracted modules
   - Create main VibeSurvivor class that orchestrates everything
   - Wire up all systems in correct initialization order
   - Export VibeSurvivor class as default
   - Add backward compatibility layer if needed

2. **Update `index.html`**:
   - Change script tag to: `<script type="module" src="js/vibe-survivor-game.js"></script>`
   - Preserve `window.VIBE_SURVIVOR_AUTO_INIT = false` pattern
   - Add `<script type="module" src="js/start-screen-bot.js"></script>` if needed

3. **Update `js/main.js`**:
   - Convert to ES6 module
   - Import VibeSurvivor
   - Preserve existing landing page wiring logic

4. **Use architect-review agent**: Review entire module structure for consistency

5. **Use legacy-modernizer agent**: Ensure no functionality was lost in migration

**Deliverable**: Fully integrated modular system

---

### PHASE 9: Testing & Validation

**Agent: code-reviewer + test-engineer + debugger**

1. **Run through the complete testing checklist from refector.md**:
   - Game launches successfully
   - Start screen with animated bot appears
   - Player sprite animates correctly (12 frames, 8 FPS, 5 directions)
   - Player has cyan tint applied
   - All controls work (WASD, mouse, spacebar dash)
   - Enemies spawn with correct behaviors
   - All weapons work and fire correctly
   - XP collection and leveling functions
   - Boss spawning works (first boss at 5 minutes)
   - Magnet boost passive activates/deactivates
   - Trail multiplier scales with XP
   - All modals function (start, options, pause, levelup, help, gameover, exit, restart)
   - English/Korean translation switching works
   - All translations display correctly
   - HUD displays correctly (health, XP, stats, boss counter)
   - NeoDunggeunmoPro font loads
   - Audio plays (music and sound effects)
   - Touch controls work on mobile
   - Performance remains at 60 FPS

2. **Use debugger agent**: Fix any issues found during testing

3. **Use code-reviewer agent**: Review final code quality

4. **Create smoke test script** that validates critical functionality

**Deliverable**: Verified working modular game

---

### PHASE 10: Documentation & Cleanup

**Agent: documentation-expert + technical-writer**

1. **Update CLAUDE.md** with new architecture:
   - Document new module structure
   - Update file dependencies section
   - Document initialization flow
   - Add module interaction diagrams

2. **Create ARCHITECTURE.md**:
   - Document design decisions
   - Explain module boundaries
   - Describe system interactions
   - Add dependency graph

3. **Create MIGRATION.md**:
   - Document what was changed
   - List all new files created
   - Explain any breaking changes
   - Add rollback instructions if needed

4. **Update refector.md**:
   - Mark all phases as completed
   - Document any deviations from plan
   - Add "COMPLETED" status at top

5. **Clean up commented code**:
   - Remove old commented sections from original monolith
   - Remove TODO comments that were completed
   - Add final code comments where needed

**Deliverable**: Complete documentation suite

---

## EXECUTION PRINCIPLES

### Throughout All Phases:

1. **Context Management**:
   - Use `context-manager` agent to maintain awareness across phases
   - Keep track of what's been extracted and what remains
   - Document dependencies as they're discovered

2. **Incremental Validation**:
   - After each major extraction, verify imports/exports work
   - Check for syntax errors immediately
   - Don't proceed if critical errors exist

3. **Preserve Functionality**:
   - **ZERO functionality loss** - every feature must work identically
   - Preserve all performance optimizations
   - Maintain mobile touch control compatibility
   - Keep audio fallback mechanisms
   - Preserve translation system completely
   - Keep sprite animation system intact

4. **Error Handling**:
   - If circular dependency found, refactor to break it
   - If extraction fails, analyze dependencies more deeply
   - Use `debugger` agent for any issues that arise

5. **Code Quality**:
   - Use `code-reviewer` agent after each phase
   - Maintain consistent code style
   - Keep clear separation of concerns
   - Add JSDoc comments to public APIs

6. **Git Commits**:
   - **DO NOT commit yet** - wait for human testing
   - Prepare commit messages for each phase
   - Document what was extracted in each commit

---

## FINAL DELIVERABLE

When all 10 phases are complete, provide:

1. **Summary Report**:
   - Total number of files created
   - Total lines of code migrated
   - Remaining monolith size (should be minimal)
   - List of any deviations from plan
   - Known issues or warnings

2. **Testing Checklist**:
   - Copy the complete testing checklist from refector.md
   - Mark items that were auto-validated
   - Highlight items that need human testing

3. **Ready for Human Testing**:
   - Confirm all phases complete
   - Confirm game runs without errors
   - Confirm all systems initialized correctly
   - Request human to test game functionality

---

## CRITICAL REMINDERS

- **NEVER STOP** until all 10 phases are complete
- **USE AGENTS STRATEGICALLY** - invoke them when their expertise is needed
- **PRESERVE EVERYTHING** - this is a refactor, not a rewrite
- **TEST INCREMENTALLY** - don't wait until the end to find issues
- **MAINTAIN CONTEXT** - use context-manager to track progress across phases
- **BE THOROUGH** - better to take time and do it right than rush and break things
- **DOCUMENT AS YOU GO** - don't save documentation for the end

---

## START EXECUTION

To begin the refactor, the human will say: **"Execute the refactor"**

You will then:
1. Acknowledge the command
2. Begin with Phase 0 (Analysis)
3. Use agents as specified in each phase
4. **Mark checkboxes in `refector.md` as you complete tasks** using the Edit tool
5. Work through all 10 phases without stopping
6. Provide progress updates after each phase
7. Provide the final summary and testing checklist
8. Wait for human testing feedback

**Example of updating refector.md:**
```
After completing Phase 0 tasks, use Edit tool on refector.md to change:
- [ ] Analyze the monolith structure
TO:
- [x] Analyze the monolith structure
```

**Do not start until the human gives the execution command.**