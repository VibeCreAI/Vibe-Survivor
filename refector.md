# Refactor Plan: Vibe Survivor Game Engine

## EXECUTION INSTRUCTIONS FOR LLM
**IMPLEMENT ALL 10 PHASES IN ONE EXECUTION CYCLE**
- Read this entire plan carefully
- Execute all phases sequentially without stopping for testing between phases
- Create all required files and modify existing files as specified
- Preserve all functionality, performance optimizations, and mobile features
- Final human testing will occur after all phases are complete

## Objectives
- Improve maintainability by decomposing the 9k-line `js/vibe-survivor-game.js` monolith into focused modules.
- Clarify system boundaries so future contributors can navigate rendering, gameplay, audio, and UI code quickly.
- Introduce modern ES module structure without breaking the static deploy flow (served via simple http server).
- Prepare groundwork for automated testing and targeted performance profiling.
- Preserve mobile touch controls, audio fallbacks, and performance optimizations.

## Guiding Principles
- Maintain feature parity during refactor; no gameplay changes until modules are stable.
- Favor incremental extraction (one subsystem at a time) to keep diffs reviewable.
- Use ES modules with explicit exports/imports; avoid introducing a bundler in the initial pass.
- Keep shared constants/types in dedicated utility modules to prevent circular dependencies.
- Preserve current asset paths, DOM integration, and initialization pattern (`window.VIBE_SURVIVOR_AUTO_INIT = false`).
- Maintain backwards compatibility during transition with feature flags and fallback mechanisms.

## Enhanced File Structure
```
js/
  core/
    engine.js              // Main game loop and initialization
    state.js               // Centralized game state management
    events.js              // Input handling (keyboard/mouse/touch)
  systems/
    physics/
      collision.js         // Collision detection systems
      movement.js          // Movement and velocity calculations
    rendering/
      canvas.js            // Canvas setup and coordinate transforms
      renderer.js          // Main rendering pipeline
      particles.js         // Particle system & pooling
      effects.js           // Visual effects (screen flash, etc.)
    gameplay/
      player.js            // Player entity and abilities
      enemies/
        enemy-base.js      // Base enemy class
        behaviors.js       // Behavior implementations (chase, dodge, etc.)
        spawning.js        // Wave management and spawn logic
      weapons/
        weapon-base.js     // Base weapon class
        projectiles.js     // Projectile management
      progression/
        xp-system.js       // XP and leveling
        upgrades.js        // Weapon/ability upgrades
      pickups.js           // XP orbs, health, magnet orbs
    ui/
      modals/
        modal-base.js      // Core modal system (create/show/hide/cleanup)
        start-screen.js    // Start screen modal
        pause-modal.js     // Pause menu modal
        levelup-modal.js   // Level-up and weapon selection modal
        help-modal.js      // Help screen with recipes/controls
        gameover-modal.js  // Game over screen modal
      hud.js               // Health/XP/stats display
      touch-controls.js    // Mobile touch interface
    audio/
      audio-manager.js     // Sound and music management
  utils/
    vector2.js             // Vector math (already well-defined)
    math.js                // Other math utilities
    performance.js         // FPS monitoring, optimization helpers
  config/
    constants.js           // Game constants and tuning values
    assets.js              // Asset paths and preloading

js/main.js                 // Landing page wiring (preserve current logic)
js/vibe-survivor-game.js   // Temporary shim that re-exports new engine (migration bridge)
```

## Modal System Architecture Benefits

### Individual Modal Files
Each modal will have its own dedicated file for better organization:

- **`modal-base.js`**: Core modal infrastructure (DOM creation, show/hide logic, cleanup, event handling)
- **`start-screen.js`**: Start screen with "Press Start" button and initial navigation
- **`pause-modal.js`**: Pause menu with resume/restart options and ESC key handling
- **`levelup-modal.js`**: Complex level-up system with weapon selection, upgrade choices, and scrolling
- **`help-modal.js`**: Help screen with game recipes, controls documentation, and scrolling behavior
- **`gameover-modal.js`**: Game over screen with score display and restart functionality

### Benefits of This Structure
1. **Easy Identification**: Each modal's UI, styling, and functionality is contained in its own file
2. **Maintainability**: Changes to one modal don't affect others
3. **Testing**: Individual modals can be tested in isolation
4. **Code Reuse**: `modal-base.js` provides shared functionality (animations, positioning, cleanup)
5. **Feature Development**: New modals can be added without touching existing code
6. **Debugging**: Modal-specific issues are easier to locate and fix

## Refactor Phases

**Phase 0: Analysis & Preparation**
   - Create dependency map of the monolith (identify what calls what)
   - Analyze circular dependencies and plan extraction order
   - Set up basic smoke tests and performance benchmarks for baseline measurements
   - Document current touch control behavior and audio fallback mechanisms

1. **Scaffolding & Module Setup**
   - Convert `index.html` to use `<script type="module" src="js/vibe-survivor-game.js"></script>` while preserving `window.VIBE_SURVIVOR_AUTO_INIT = false` pattern
   - Create placeholder modules per the enhanced structure above with exported stubs and TODO notes
   - Implement feature flags system for gradual rollout and fallback capability
   - Create module loader that can fall back to monolith if needed
   - Add ESLint configuration for module imports/exports

2. **Core Infrastructure**
   - Extract `Vector2` class into `utils/vector2.js` (already well-defined in monolith)
   - Create `utils/performance.js` with FPS monitoring and memory tracking
   - Set up `config/constants.js` and `config/assets.js` with current values
   - Establish `core/state.js` with centralized state management and factory functions
   - Create standard interfaces and error handling patterns

**Phase 2.5: Interface Standardization**
   - Define consistent method signatures between systems (state, deltaTime, context patterns)
   - Create shared contracts and JSDoc type definitions
   - Implement standardized communication patterns between modules

3. **Core Systems Extraction**
   - Extract engine bootstrap and main game loop into `core/engine.js`
   - Move input handling (keyboard/mouse/touch) into `core/events.js`
   - Create `systems/physics/collision.js` and `systems/physics/movement.js`
   - Update remaining monolith to use new core modules with feature flags

4. **Rendering System Migration**
   - Extract canvas setup and coordinate transforms into `systems/rendering/canvas.js`
   - Move main rendering pipeline to `systems/rendering/renderer.js`
   - Migrate particle system to `systems/rendering/particles.js` (preserve object pooling)
   - Extract visual effects to `systems/rendering/effects.js`

5. **Gameplay Systems Migration (Iterative)**
   - **Player System**: Move player logic to `systems/gameplay/player.js`
   - **Enemy System**:
     - Create `systems/gameplay/enemies/enemy-base.js`
     - Extract behaviors to `systems/gameplay/enemies/behaviors.js`
     - Move wave/spawn logic to `systems/gameplay/enemies/spawning.js`
   - **Weapons System**:
     - Create `systems/gameplay/weapons/weapon-base.js`
     - Extract projectiles to `systems/gameplay/weapons/projectiles.js`
   - **Progression System**:
     - Move XP system to `systems/gameplay/progression/xp-system.js`
     - Extract upgrades to `systems/gameplay/progression/upgrades.js`
   - **Pickups**: Move to `systems/gameplay/pickups.js`

6. **UI System Migration**
   - **Modal System**:
     - Create `systems/ui/modals/modal-base.js` with core modal functionality (creation, show/hide, cleanup)
     - Extract start screen to `systems/ui/modals/start-screen.js`
     - Move pause menu to `systems/ui/modals/pause-modal.js`
     - Extract level-up system to `systems/ui/modals/levelup-modal.js` (weapon selection, upgrade choices)
     - Move help screen to `systems/ui/modals/help-modal.js` (recipes, controls documentation)
     - Extract game over screen to `systems/ui/modals/gameover-modal.js`
   - Move HUD rendering to `systems/ui/hud.js` (health bar, XP bar, stats display)
   - **Critical**: Extract touch controls to `systems/ui/touch-controls.js` (preserve mobile functionality)

7. **Audio System Migration**
   - Move sound and music management to `systems/audio/audio-manager.js`
   - Preserve current audio fallback mechanisms and lazy loading

8. **Integration & Testing**
   - Wire all systems together in `core/engine.js` with proper orchestration
   - Run comprehensive testing of all game flows (start, gameplay, pause, level-up, mobile)
   - Performance validation against baseline benchmarks
   - Cross-browser compatibility testing

9. **Cleanup & Documentation**
   - Remove legacy code paths and temporary feature flags
   - Reduce `js/vibe-survivor-game.js` to minimal import/export bridge
   - Create architectural decision records (ADRs) for design choices
   - Document module communication patterns and public APIs
   - Update README with new architecture overview

## Enhanced Risk Mitigation

### Testing Strategy
- **Unit Tests**: Start with Vector2 and math utilities (pure functions, easy to test)
- **Integration Tests**: Create tests for critical game flows (game loop, rendering pipeline)
- **Visual Regression Testing**: Set up automated screenshots for UI elements
- **Smoke Tests**: Basic module instantiation and import resolution checks
- **Performance Benchmarks**: Monitor FPS, memory usage, and frame timing

### Performance Safety
- **Baseline Metrics**: Establish performance benchmarks before starting refactor
- **Object Pooling**: Carefully preserve existing object pooling patterns during migration
- **Memory Monitoring**: Track memory usage during extraction, especially for particle systems
- **Frame Timing**: Monitor frame time distribution, not just average FPS
- **Mobile Performance**: Special attention to touch control responsiveness

### Rollback Strategy
- **Feature Flags**: Implement toggles between old/new implementations
- **Atomic Commits**: Keep each system extraction as a single, revertible commit
- **Fallback Loader**: Module loader that can revert to monolith on import failures
- **Quick Revert Path**: Maintain ability to rollback to working monolith within minutes

### Development Safety
- **ESLint Configuration**: Catch import/export issues early with proper linting
- **Git Hooks**: Run smoke tests before commits to catch broken imports
- **Browser Compatibility**: Test in multiple browsers after each major extraction
- **Mobile Testing**: Verify touch controls work after each UI system change

### Migration Validation
- **Functionality Checklist**:
  - Start screen and game initialization
  - Player movement and controls (keyboard, mouse, touch)
  - Enemy spawning and behaviors
  - Weapon systems and projectiles
  - **Modal System Testing**:
    - Start screen modal (game launch, navigation)
    - Pause modal (ESC key, resume/restart functions)
    - Level-up modal (weapon selection, upgrade choices, scrolling)
    - Help modal (scrolling behavior, recipe display, close functionality)
    - Game over modal (score display, restart functionality)
    - Modal navigation (keyboard/controller support)
  - Audio playback and fallbacks
  - Mobile-specific features (touch controls, responsive modals)
- **Performance Validation**: Compare before/after metrics for each phase
- **Cross-Platform Testing**: Verify desktop and mobile functionality

## Follow-Up Enhancements (Post-Refactor)

### Testing Infrastructure
- **Automated Testing**: Comprehensive test suite for game logic and rendering
- **Performance Testing**: Automated performance regression detection
- **Visual Testing**: Screenshot-based regression testing for UI components

### Development Experience
- **Build Tooling**: Evaluate bundler introduction (Vite/Rollup) for development workflow
- **Type Safety**: Consider TypeScript migration or enhanced JSDoc typing
- **Development Server**: Hot reload capability for faster development iteration

### Architecture Evolution
- **Plugin System**: Consider making weapons/enemies/effects pluggable
- **Save System**: Modular save/load system for game progress
- **Analytics**: Modular telemetry system for gameplay analytics

### Documentation & Onboarding
- **Architecture Guide**: Comprehensive guide to new modular structure
- **Contribution Guidelines**: Clear guidelines for adding new features
- **API Documentation**: Generated documentation for public module interfaces

## IMPLEMENTATION CHECKLIST - EXECUTE ALL PHASES

### Phase 0: Analysis & Preparation
**EXECUTE IMMEDIATELY:**
- [ ] Analyze the 9k-line monolith structure and identify key systems
- [ ] Identify circular dependencies and plan extraction order
- [ ] Note current touch control behavior and audio fallback mechanisms
- [ ] Understand the current module loading and initialization pattern

### Phase 1: Scaffolding & Module Setup
**EXECUTE IMMEDIATELY:**
- [ ] Convert `index.html` to use `<script type="module" src="js/vibe-survivor-game.js"></script>`
- [ ] Preserve `window.VIBE_SURVIVOR_AUTO_INIT = false` pattern
- [ ] Create directory structure: `js/core/`, `js/systems/`, `js/utils/`, `js/config/`
- [ ] Create all required subdirectories per the enhanced file structure

### Phase 2: Core Infrastructure
**EXTRACT CORE UTILITIES:**
- [ ] Extract `Vector2` class to `utils/vector2.js`
- [ ] Create `utils/performance.js` with FPS/memory monitoring utilities
- [ ] Set up `config/constants.js` with all game constants and tuning values
- [ ] Set up `config/assets.js` with asset paths and preload manifests
- [ ] Create `core/state.js` with centralized state management

### Phase 2.5: Interface Standardization
**ESTABLISH PATTERNS:**
- [ ] Define consistent method signatures (state, deltaTime, context patterns)
- [ ] Create shared contracts and JSDoc type definitions
- [ ] Implement standardized communication patterns between modules

### Phase 3: Core Systems Extraction
**EXTRACT ENGINE & PHYSICS:**
- [ ] Extract engine bootstrap and main game loop to `core/engine.js`
- [ ] Move input handling (keyboard/mouse/touch) to `core/events.js`
- [ ] Create `systems/physics/collision.js` for collision detection
- [ ] Create `systems/physics/movement.js` for movement calculations

### Phase 4: Rendering System Migration
**EXTRACT RENDERING PIPELINE:**
- [ ] Extract canvas setup and coordinate transforms to `systems/rendering/canvas.js`
- [ ] Move main rendering pipeline to `systems/rendering/renderer.js`
- [ ] Migrate particle system to `systems/rendering/particles.js` (preserve object pooling)
- [ ] Extract visual effects to `systems/rendering/effects.js`

### Phase 5: Gameplay Systems Migration
**EXTRACT ALL GAMEPLAY LOGIC:**
- [ ] Move player logic to `systems/gameplay/player.js`
- [ ] Create enemy base class in `systems/gameplay/enemies/enemy-base.js`
- [ ] Extract enemy behaviors to `systems/gameplay/enemies/behaviors.js`
- [ ] Move wave/spawn logic to `systems/gameplay/enemies/spawning.js`
- [ ] Create weapon base class in `systems/gameplay/weapons/weapon-base.js`
- [ ] Extract projectile management to `systems/gameplay/weapons/projectiles.js`
- [ ] Move XP system to `systems/gameplay/progression/xp-system.js`
- [ ] Extract upgrade system to `systems/gameplay/progression/upgrades.js`
- [ ] Move pickups (XP orbs, health, magnet) to `systems/gameplay/pickups.js`

### Phase 6: UI System Migration
**EXTRACT ALL UI AND MODALS:**
- [ ] Create modal base system in `systems/ui/modals/modal-base.js`
- [ ] Extract start screen to `systems/ui/modals/start-screen.js`
- [ ] Move pause menu to `systems/ui/modals/pause-modal.js`
- [ ] Extract level-up system to `systems/ui/modals/levelup-modal.js`
- [ ] Move help screen to `systems/ui/modals/help-modal.js`
- [ ] Extract game over screen to `systems/ui/modals/gameover-modal.js`
- [ ] Move HUD rendering to `systems/ui/hud.js`
- [ ] **CRITICAL**: Extract touch controls to `systems/ui/touch-controls.js`

### Phase 7: Audio System Migration
**EXTRACT AUDIO MANAGEMENT:**
- [ ] Move sound and music management to `systems/audio/audio-manager.js`
- [ ] Preserve all audio fallback mechanisms and lazy loading behavior

### Phase 8: Integration & Wiring
**WIRE ALL SYSTEMS TOGETHER:**
- [ ] Update `core/engine.js` to import and orchestrate all systems
- [ ] Ensure proper initialization order and dependency management
- [ ] Implement the main game loop using all extracted systems
- [ ] Verify all imports/exports are correct

### Phase 9: Cleanup & Final Bridge
**FINALIZE THE REFACTOR:**
- [ ] Remove all legacy code from original monolith
- [ ] Convert `js/vibe-survivor-game.js` to minimal import/export bridge
- [ ] Ensure all functionality is preserved and working
- [ ] Clean up any temporary code or comments

## FINAL HUMAN TESTING AFTER IMPLEMENTATION

**After all 10 phases are complete, the human will test:**

### ✅ **Core Functionality Test**
- [ ] Game launches successfully from index.html
- [ ] Start screen appears and responds to "Press Start"
- [ ] Player can move with WASD/arrow keys
- [ ] Mouse aiming and shooting works
- [ ] Enemies spawn and behave correctly
- [ ] Combat and damage systems work
- [ ] XP collection and leveling up functions
- [ ] Audio plays (music and sound effects)

### ✅ **UI System Test**
- [ ] All modals work correctly:
  - Start screen modal
  - Pause modal (ESC key)
  - Level-up modal with weapon selection
  - Help modal with scrolling
  - Game over modal
- [ ] HUD displays correctly (health, XP, stats)
- [ ] Modal navigation works (keyboard/mouse)

### ✅ **Mobile/Touch Test**
- [ ] Touch controls work on mobile devices
- [ ] Virtual joystick responds correctly
- [ ] Touch-friendly modal interactions
- [ ] Responsive layout on small screens

### ✅ **Performance Test**
- [ ] Game runs at stable FPS (same as original)
- [ ] No memory leaks or performance regressions
- [ ] Smooth animations and transitions
- [ ] Fast loading times

### ✅ **Cross-Platform Test**
- [ ] Works in multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Desktop and mobile compatibility
- [ ] Audio fallbacks function properly

**Success Criteria: All tests must pass for the refactor to be considered successful.**

