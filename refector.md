# Refactor Plan: Vibe Survivor Game Engine

**UPDATED**: Plan updated to include new features added since original creation:
- Complete translation system (English/Korean) with dynamic text switching
- Options modal with language selection, audio controls, and dash button positioning
- Enhanced stackable passive system with multiplicative speed boost
- Expanded help menu with weapon tips and evolution guides
- Weapon balance changes (homing laser damage reduction)
- AI bot character system - player changed from arrow to animated sprite character
- Start screen bot animation system (already modular - serves as extraction template)
- Player sprite animation system with 5 directional sprite sheets (idle, up, down, left, right)
- Exit and restart confirmation modals
- Boss progression system with scheduled spawning
- Magnet boost passive and trail multiplier mechanics
- NeoDunggeunmoPro pixel art font system

## EXECUTION INSTRUCTIONS FOR LLM
**IMPLEMENT ALL 10 PHASES IN ONE EXECUTION CYCLE**
- Read this entire plan carefully
- Execute all phases sequentially without stopping for testing between phases
- Create all required files and modify existing files as specified
- Preserve all functionality, performance optimizations, and mobile features
- Final human testing will occur after all phases are complete

## Objectives
- Improve maintainability by decomposing the **11,335 line (453KB)** `js/vibe-survivor-game.js` monolith into focused modules.
- Clarify system boundaries so future contributors can navigate rendering, gameplay, audio, UI, and i18n code quickly.
- Introduce modern ES module structure without breaking the static deploy flow (served via simple http server).
- Prepare groundwork for automated testing and targeted performance profiling.
- Preserve mobile touch controls, audio fallbacks, translation system (English/Korean), player sprite animation system, and performance optimizations.

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
      effects.js           // Visual effects (screen flash, cyan tinting, etc.)
      sprites.js           // Player sprite rendering and animation system
      animation.js         // Animation frame management and timing
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
        options-modal.js   // Options menu (language, audio, controls)
        pause-modal.js     // Pause menu modal
        levelup-modal.js   // Level-up and weapon selection modal
        help-modal.js      // Help screen with recipes/controls
        gameover-modal.js  // Game over screen modal
        exit-confirm.js    // Exit confirmation modal
        restart-confirm.js // Restart confirmation modal
      hud.js               // Health/XP/stats display
      i18n.js              // Translation system (English/Korean)
      touch-controls.js    // Mobile touch interface
      start-screen-bot.js  // Start screen AI bot animation (ALREADY MODULAR - use as template!)
    audio/
      audio-manager.js     // Sound and music management
  utils/
    vector2.js             // Vector math (already well-defined)
    math.js                // Other math utilities
    performance.js         // FPS monitoring, optimization helpers
  config/
    constants.js           // Game constants and tuning values
    assets.js              // Asset paths, sprite sheet configs, and preloading

js/main.js                 // Landing page wiring (preserve current logic)
js/start-screen-bot.js     // Start screen bot animation (ALREADY EXTRACTED - keep as is!)
js/vibe-survivor-game.js   // Temporary shim that re-exports new engine (migration bridge)
```

## Modal System Architecture Benefits

### Individual Modal Files
Each modal will have its own dedicated file for better organization:

- **`modal-base.js`**: Core modal infrastructure (DOM creation, show/hide logic, cleanup, event handling)
- **`start-screen.js`**: Start screen with "Press Start" button and initial navigation
- **`options-modal.js`**: Options menu with language selection, audio controls, and dash button positioning
- **`pause-modal.js`**: Pause menu with resume/restart options and ESC key handling
- **`levelup-modal.js`**: Complex level-up system with weapon selection, upgrade choices, and scrolling
- **`help-modal.js`**: Help screen with game recipes, controls documentation, and scrolling behavior
- **`gameover-modal.js`**: Game over screen with score display and restart functionality
- **`exit-confirm.js`**: Exit confirmation modal to prevent accidental game exits
- **`restart-confirm.js`**: Restart confirmation modal for destructive restart actions

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
   - Study `js/start-screen-bot.js` as a reference for proper modular structure
   - Document player sprite animation system (5 sprite sheets, 3×4 frame animation, 8 FPS)
   - Catalog all sprite assets and their loading requirements (~290KB of sprite images)

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
   - Add sprite sheet configurations to `config/assets.js`:
     - Player sprite sheets (idle, up, down, left, right)
     - Start screen bot sprite sheet (10×10, 100 frames)
     - Sprite dimensions, frame counts, and animation speeds
     - NeoDunggeunmoPro font path
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
   - Extract visual effects to `systems/rendering/effects.js` (screen flash, cyan tinting filter)
   - Extract player sprite system to `systems/rendering/sprites.js`:
     - Sprite sheet loading and caching system
     - Direction-based sprite selection logic (5 directions)
     - CSS filter-based cyan color tinting
     - Fallback to cyan circle if sprites not loaded
   - Extract animation frame management to `systems/rendering/animation.js`:
     - Frame timing system (60 FPS game → 8 FPS animation)
     - 3×4 frame sprite sheet handling (12 total frames)
     - Animation state tracking (frame, timer, direction)

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
     - Extract options menu to `systems/ui/modals/options-modal.js` (language selection, audio controls, dash positioning)
     - Move pause menu to `systems/ui/modals/pause-modal.js`
     - Extract level-up system to `systems/ui/modals/levelup-modal.js` (weapon selection, upgrade choices)
     - Move help screen to `systems/ui/modals/help-modal.js` (recipes, controls documentation)
     - Extract game over screen to `systems/ui/modals/gameover-modal.js`
     - Extract exit confirmation to `systems/ui/modals/exit-confirm.js`
     - Extract restart confirmation to `systems/ui/modals/restart-confirm.js`
   - **Translation System**: Extract i18n system to `systems/ui/i18n.js` (English/Korean support, dynamic text updates)
   - Move HUD rendering to `systems/ui/hud.js` (health bar, XP bar, stats display, boss counter)
   - **Critical**: Extract touch controls to `systems/ui/touch-controls.js` (preserve mobile functionality)
   - **SPECIAL NOTE**: `js/start-screen-bot.js` is ALREADY modular and properly extracted!
     - Keep this file as-is in `js/start-screen-bot.js`
     - Use it as a reference/template for other extractions
     - It demonstrates proper: class structure, lifecycle management, cleanup, DOM manipulation

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
    - Options modal (language switching, audio controls, dash button positioning)
    - Pause modal (ESC key, resume/restart functions)
    - Level-up modal (weapon selection, upgrade choices, scrolling)
    - Help modal (scrolling behavior, recipe display, close functionality)
    - Game over modal (score display, restart functionality)
    - Modal navigation (keyboard/controller support)
  - **Translation System Testing**:
    - English/Korean language switching functionality
    - All UI elements update correctly when language changes
    - Stackable passive descriptions display properly in both languages
    - Help menu recipes and tips translate correctly
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
- [ ] Analyze the **11,335-line (453KB)** monolith structure and identify key systems
- [ ] Identify circular dependencies and plan extraction order
- [ ] Note current touch control behavior and audio fallback mechanisms
- [ ] Understand the current module loading and initialization pattern
- [ ] Study `js/start-screen-bot.js` (226 lines) as modular extraction template
- [ ] Document player sprite system (91 references throughout codebase)
- [ ] Catalog sprite assets: 6 AI bot sprites (~290KB) + start screen sprite (217KB)
- [ ] Document boss system, magnet boost passive, and trail multiplier mechanics

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
- [ ] Set up `config/assets.js` with asset paths and preload manifests:
  - [ ] Player sprite sheets (5 files: idle, up, down, left, right)
  - [ ] Start screen bot sprite sheet (10×10 grid, 100 frames)
  - [ ] Sprite configurations (frameWidth, frameHeight, cols, rows, frameRate)
  - [ ] NeoDunggeunmoPro font path
  - [ ] Sprite loading progress tracking system
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
- [ ] Extract visual effects to `systems/rendering/effects.js`:
  - [ ] Screen flash effects
  - [ ] CSS filter-based cyan tinting system
  - [ ] Neon trail/glow effects
- [ ] Extract player sprite rendering to `systems/rendering/sprites.js`:
  - [ ] Sprite sheet loading system with progress tracking
  - [ ] Direction-based sprite selection (idle, up, down, left, right)
  - [ ] Angle-to-direction mapping logic (8 directional angles)
  - [ ] Cyan color filter application
  - [ ] Fallback to cyan circle rendering
  - [ ] Sprite caching and preloading
- [ ] Extract animation system to `systems/rendering/animation.js`:
  - [ ] Frame timing (60 FPS → 8 FPS conversion)
  - [ ] 3×4 sprite sheet frame management (12 total frames)
  - [ ] Animation state (spriteFrame, spriteTimer, spriteDirection)
  - [ ] Frame cycling and direction updates

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
- [ ] Extract options menu to `systems/ui/modals/options-modal.js`
- [ ] Move pause menu to `systems/ui/modals/pause-modal.js`
- [ ] Extract level-up system to `systems/ui/modals/levelup-modal.js`
- [ ] Move help screen to `systems/ui/modals/help-modal.js`
- [ ] Extract game over screen to `systems/ui/modals/gameover-modal.js`
- [ ] Extract exit confirmation to `systems/ui/modals/exit-confirm.js`
- [ ] Extract restart confirmation to `systems/ui/modals/restart-confirm.js`
- [ ] **CRITICAL**: Extract translation system to `systems/ui/i18n.js`
- [ ] Move HUD rendering to `systems/ui/hud.js` (include boss counter display)
- [ ] **CRITICAL**: Extract touch controls to `systems/ui/touch-controls.js`
- [ ] **SPECIAL**: Keep `js/start-screen-bot.js` as-is (already properly modular!)

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





## TESTING AND EVALUATION PROTOCOL

This section contains two evaluation stages:
1. **Human Testing**: Manual verification of all functionality
2. **AI Judge Evaluation**: Objective scoring and comparison by an independent AI

---

## STAGE 1: HUMAN TESTING AFTER IMPLEMENTATION

**Test both implementations and record results:**

### **Test Metrics**

#### **A. Completion Metrics**
- **Total Time Taken**: _____ hours/minutes
- **Human Interventions Required**: _____ times
  - (Count: bug fixes, corrections, clarifications, restarts needed)
- **Completion Status**: One-shot ✅ / Multiple attempts ❌

---

#### **B. Functionality Tests** (Score each: ✅ PASS / ❌ FAIL)

| # | Test Criteria | Implementation A | Implementation B |
|---|---------------|------------------|------------------|
| 1 | **Game Launch & Start Screen** - Game loads, start screen appears with animated bot, responds to "Press Start" | | |
| 2 | **Player System** - Player sprite animates correctly, changes direction (5 directions), cyan tint applied, movement works (WASD/arrows/mouse) | | |
| 3 | **Combat & Gameplay** - Enemies spawn and behave correctly, weapons fire, damage/XP/leveling work, boss system functions | | |
| 4 | **Modal System** - All 9 modals work (start, options, pause, levelup, help, gameover, exit confirm, restart confirm) with proper navigation | | |
| 5 | **Translation System** - English ⟷ Korean switching works, all UI text updates correctly in both languages | | |
| 6 | **Audio System** - Music and sound effects play, audio controls work, fallbacks function | | |
| 7 | **Mobile/Touch** - Touch controls work, virtual joystick responsive, modals work on mobile | | |
| 8 | **Performance** - Game runs at stable FPS (same as original), no memory leaks, smooth animations | | |
| 9 | **Cross-Browser** - Works in Chrome, Firefox, Safari, Edge without issues | | |
| 10 | **Code Quality** - No console errors, clean code structure visible, easy to navigate files | | |

---

### **Human Testing Summary**

**Implementation A (Tool: _____)**
- Time Taken: _____
- Interventions: _____
- Tests Passed: ___/10
- Overall: PASS ✅ / FAIL ❌

**Implementation B (Tool: _____)**
- Time Taken: _____
- Interventions: _____
- Tests Passed: ___/10
- Overall: PASS ✅ / FAIL ❌

**Notes:**
- (Any specific issues, observations, or comments)**

---

## STAGE 2: AI JUDGE EVALUATION AND SCORING

**Instructions for AI Judge:**
You will receive two refactored codebases (Implementation A and Implementation B). Your task is to objectively evaluate and score both implementations based on the criteria below. You should examine the actual code, file structure, and implementation details to provide fair and accurate scoring.

### EVALUATION CATEGORIES AND SCORING

#### **0. COMPLETION EFFICIENCY** (20 points)

**What to evaluate:**
- Time taken to complete refactoring
- Number of human interventions required
- Ability to complete in one shot as requested

**Scoring Rubric:**
- **20 pts**: Completed in one shot, under 2 hours, zero interventions
- **16 pts**: Completed in one shot, 2-4 hours, zero interventions
- **12 pts**: Completed in one shot, 4-8 hours, zero interventions OR 1-2 minor interventions
- **8 pts**: Multiple attempts needed, 3-5 interventions
- **4 pts**: Multiple attempts, many interventions (6-10)
- **0 pts**: Failed to complete or required excessive interventions (10+)

**Evidence to provide:**
- Total time taken
- Count of human interventions with details
- Whether one-shot completion was achieved
- Efficiency comparison between implementations

#### **1. CODE ORGANIZATION & STRUCTURE** (25 points)

**What to evaluate:**
- Adherence to the planned file structure
- Logical separation of concerns
- Proper module boundaries
- Directory organization

**Scoring Rubric:**
- **25 pts**: Perfect adherence to plan, all modules properly separated, excellent organization
- **20 pts**: Strong organization, minor deviations from plan, mostly proper separation
- **15 pts**: Adequate organization, some modules mixed, several deviations
- **10 pts**: Poor organization, many mixed concerns, significant deviations
- **5 pts**: Minimal organization improvement over monolith
- **0 pts**: No improvement or worse than original

**Evidence to provide:**
- Count of files created vs. planned
- Examples of well-organized modules
- Examples of any organizational issues
- File size distribution analysis

---

#### **2. MODULE QUALITY & COHESION** (20 points)

**What to evaluate:**
- Single Responsibility Principle adherence
- Module cohesion (related functionality grouped together)
- Clear module interfaces and exports
- Appropriate abstraction levels

**Scoring Rubric:**
- **20 pts**: Each module has clear single purpose, excellent cohesion, clean interfaces
- **16 pts**: Most modules well-focused, good cohesion, mostly clean interfaces
- **12 pts**: Some modules do too much, adequate cohesion, acceptable interfaces
- **8 pts**: Many modules unfocused, poor cohesion, unclear interfaces
- **4 pts**: Little improvement in module design
- **0 pts**: Modules are poorly designed

**Evidence to provide:**
- Examples of well-designed modules
- Examples of any modules violating SRP
- Interface complexity analysis
- Module size analysis (lines per file)

---

#### **3. CODE MAINTAINABILITY** (20 points)

**What to evaluate:**
- Code readability and clarity
- Naming conventions consistency
- Documentation quality (comments, JSDoc)
- Ease of understanding for new developers

**Scoring Rubric:**
- **20 pts**: Excellent readability, consistent naming, comprehensive documentation
- **16 pts**: Good readability, mostly consistent naming, adequate documentation
- **12 pts**: Acceptable readability, some naming inconsistencies, basic documentation
- **8 pts**: Poor readability, inconsistent naming, minimal documentation
- **4 pts**: Difficult to read, unclear naming, no documentation
- **0 pts**: Unmaintainable code

**Evidence to provide:**
- Examples of well-documented code sections
- Examples of clear vs. unclear naming
- Documentation coverage estimate (% of public functions/classes documented)
- Complexity analysis of key functions

---

#### **4. DEPENDENCY MANAGEMENT** (15 points)

**What to evaluate:**
- Proper ES module imports/exports
- No circular dependencies
- Minimal coupling between modules
- Clear dependency hierarchy

**Scoring Rubric:**
- **15 pts**: Perfect imports/exports, zero circular dependencies, minimal coupling
- **12 pts**: Clean imports/exports, no critical circular deps, low coupling
- **9 pts**: Mostly correct imports/exports, minor circular deps, moderate coupling
- **6 pts**: Some import/export issues, several circular deps, tight coupling
- **3 pts**: Many dependency problems
- **0 pts**: Dependency chaos

**Evidence to provide:**
- Dependency graph analysis (if possible)
- List any circular dependencies found
- Examples of well-managed dependencies
- Import/export pattern consistency

---

#### **5. FEATURE PRESERVATION** (15 points)

**What to evaluate:**
- All original features still work
- No regressions introduced
- Edge cases handled
- Original behavior preserved

**Scoring Rubric:**
- **15 pts**: 100% feature preservation, all systems work perfectly
- **12 pts**: 95%+ features work, minor issues only
- **9 pts**: 90%+ features work, some noticeable issues
- **6 pts**: 80%+ features work, several broken features
- **3 pts**: Major features broken
- **0 pts**: Critical failures, game unplayable

**Evidence to provide:**
- List of features tested and results
- Any bugs or regressions found
- Comparison with original functionality
- Edge case handling assessment

---

#### **6. PERFORMANCE & OPTIMIZATION** (10 points)

**What to evaluate:**
- Performance same or better than original
- Object pooling preserved where applicable
- No memory leaks introduced
- Efficient module loading

**Scoring Rubric:**
- **10 pts**: Performance improved or equal, optimizations preserved
- **8 pts**: Performance equal, optimizations preserved
- **6 pts**: Performance slightly worse, most optimizations preserved
- **4 pts**: Noticeable performance degradation
- **2 pts**: Significant performance problems
- **0 pts**: Unplayable due to performance

**Evidence to provide:**
- Performance metrics comparison (if available)
- Analysis of preserved optimizations
- Any performance issues identified
- Memory usage assessment

---

#### **7. ERROR HANDLING & ROBUSTNESS** (10 points)

**What to evaluate:**
- Proper error handling in modules
- Graceful degradation
- Input validation
- Edge case handling

**Scoring Rubric:**
- **10 pts**: Comprehensive error handling, graceful degradation, robust
- **8 pts**: Good error handling, mostly graceful, handles most edge cases
- **6 pts**: Basic error handling, some graceful degradation
- **4 pts**: Minimal error handling, brittle code
- **2 pts**: Poor error handling, crashes easily
- **0 pts**: No error handling

**Evidence to provide:**
- Examples of good error handling
- Examples of missing error handling
- Error message quality assessment
- Robustness testing results

---

#### **8. CODE CLEANLINESS** (10 points)

**What to evaluate:**
- No dead code or unused imports
- Consistent code style
- No debugging artifacts (console.logs, comments like "TODO")
- Clean git history (if applicable)

**Scoring Rubric:**
- **10 pts**: Spotlessly clean, production-ready code
- **8 pts**: Very clean, minor artifacts only
- **6 pts**: Mostly clean, some dead code or artifacts
- **4 pts**: Noticeable clutter, many artifacts
- **2 pts**: Messy code with significant dead code
- **0 pts**: Code is a mess

**Evidence to provide:**
- Count of unused imports/dead code
- Examples of any artifacts found
- Code style consistency assessment
- Overall cleanliness rating

---

#### **9. TESTING & TESTABILITY** (10 points)

**What to evaluate:**
- Code structure enables easy testing
- Pure functions separated from side effects
- Testable interfaces
- Any tests actually written (bonus points)

**Scoring Rubric:**
- **10 pts**: Highly testable, tests included, excellent separation
- **8 pts**: Very testable, good separation, no tests but easy to add
- **6 pts**: Moderately testable, some separation
- **4 pts**: Difficult to test, poor separation
- **2 pts**: Nearly impossible to test
- **0 pts**: Untestable

**Evidence to provide:**
- Testability analysis of key modules
- Examples of testable vs. untestable code
- Pure function identification
- Any tests present

---

#### **10. BONUS POINTS** (up to +15 points)

**Extra credit for:**
- **+5 pts**: Excellent architectural documentation
- **+5 pts**: Additional improvements beyond plan (if they enhance quality)
- **+3 pts**: Particularly elegant solutions to complex problems
- **+2 pts**: TypeScript types or comprehensive JSDoc
- **Other**: Judge's discretion for exceptional work

**Evidence to provide:**
- Specific examples of bonus-worthy items
- Explanation of why they deserve bonus points

---

### FINAL SCORING SUMMARY

**Implementation A (Tool Name): ____/170 points (+____ bonus)**

**Implementation B (Tool Name): ____/170 points (+____ bonus)**

### SCORING BREAKDOWN TABLE

| Category | Implementation A | Implementation B | Winner |
|----------|------------------|------------------|--------|
| 0. Completion Efficiency (20 pts) | | | |
| 1. Code Organization (25 pts) | | | |
| 2. Module Quality (20 pts) | | | |
| 3. Maintainability (20 pts) | | | |
| 4. Dependency Management (15 pts) | | | |
| 5. Feature Preservation (15 pts) | | | |
| 6. Performance (10 pts) | | | |
| 7. Error Handling (10 pts) | | | |
| 8. Code Cleanliness (10 pts) | | | |
| 9. Testability (10 pts) | | | |
| 10. Bonus Points (15 pts max) | | | |
| **TOTAL** | **/170** | **/170** | |

---

### DETAILED ANALYSIS REPORT

**AI Judge Instructions:** For each implementation, provide:

#### **Implementation A (Tool: _____)**

**Strengths:**
- (List 3-5 major strengths with specific examples)

**Weaknesses:**
- (List 3-5 major weaknesses with specific examples)

**Notable Observations:**
- (Any interesting patterns, decisions, or approaches)

**Code Examples:**
- (1-2 examples of particularly good or bad code)

---

#### **Implementation B (Tool: _____)**

**Strengths:**
- (List 3-5 major strengths with specific examples)

**Weaknesses:**
- (List 3-5 major weaknesses with specific examples)

**Notable Observations:**
- (Any interesting patterns, decisions, or approaches)

**Code Examples:**
- (1-2 examples of particularly good or bad code)

---

### FINAL VERDICT

**Winner: Implementation ____ (Tool: _____)**

**Winning Margin: ____ points**

**Summary:**
(2-3 paragraphs explaining which implementation won and why, highlighting the key differentiators)

**Recommendation:**
(Which refactored codebase should be used going forward and why)

---

### JUDGE'S CERTIFICATION

**I certify that:**
- [ ] I examined both codebases thoroughly
- [ ] I evaluated all criteria objectively
- [ ] I provided specific evidence for all scores
- [ ] My evaluation is fair and unbiased
- [ ] I can defend all scoring decisions

**AI Judge Signature:** _______________
**Date:** _______________

**Success Criteria: The implementation with the highest total score wins the showdown.**

