# Refactor Plan: Vibe Survivor Game Engine

## Objectives
- Improve maintainability by decomposing the 9k-line `js/vibe-survivor-game.js` monolith into focused modules.
- Clarify system boundaries so future contributors can navigate rendering, gameplay, audio, and UI code quickly.
- Introduce modern ES module structure without breaking the static deploy flow (served via simple http server).
- Prepare groundwork for automated testing and targeted performance profiling.

## Guiding Principles
- Maintain feature parity during refactor; no gameplay changes until modules are stable.
- Favor incremental extraction (one subsystem at a time) to keep diffs reviewable.
- Use ES modules with explicit exports/imports; avoid introducing a bundler in the initial pass.
- Keep shared constants/types in dedicated utility modules to prevent circular dependencies.
- Preserve current asset paths and DOM integration so `index.html` requires minimal updates (only new script tags if needed).

## Proposed File Structure
```
js/
  core/
    vectors.js             // Vector2 and math helpers
    engine.js              // VibeSurvivor bootstrap & main loop wiring
    state.js               // Player/enemy/global state containers
    events.js              // Input mapping & dispatch
  systems/
    rendering/
      renderer.js          // Canvas setup, draw pipeline entry
      layers.js            // Layer/pipeline definitions
      particles.js         // Particle system & pooling
      effects.js           // Screen flashes, post-processing
    gameplay/
      player.js            // Player entity logic
      enemies.js           // Enemy definitions & behaviors
      waves.js             // Wave scheduling / spawn logic
      projectiles.js       // Projectile pool + updates
      pickups.js           // XP orbs, HP orbs, magnet orbs
      bosses.js            // Boss-specific logic
    ui/
      modal.js             // Modal creation/show/hide helpers
      overlays.js          // Start/pause/game-over overlays
      hud.js               // Header stats rendering
      controls.js          // Menu navigation, mobile controls
    audio/
      sound-manager.js     // Music + SFX orchestration
      audio-pool.js        // Audio element pooling utilities
  utils/
    math.js                // Shared math helpers
    formatters.js          // Time/score formatting
    random.js              // RNG helpers and seeds
  config/
    constants.js           // Tunable numbers, screen sizes, spawn rates
    assets.js              // Asset paths & preload manifests

js/main.js                 // Landing page wiring (unchanged, update imports if needed)
js/vibe-survivor-game.js   // Temporary shim that re-exports new engine (short-lived during migration)
```

## Refactor Phases

1. **Scaffolding & Module Setup**
   - Convert `index.html` game script include to use `<script type="module" src="js/vibe-survivor-game.js"></script>`.
   - Create placeholder modules per the structure above with exported stubs and TODO notes.
   - Introduce a lightweight `engine.js` that instantiates the main `VibeSurvivor` class; temporarily import legacy monolith until subsystems migrate.

2. **Core Extraction**
   - Move `Vector2` and math helpers into `core/vectors.js` & `utils/math.js`.
   - Extract engine bootstrap (`constructor`, `initGame`, modal creation, resize hooks) into `core/engine.js`.
   - Split shared state objects (player defaults, pools, flags) into `core/state.js`; expose factory functions to keep initialization centralized.
   - Update imports in remaining monolith sections to use the new modules.

3. **Systems Migration (Iterative)**
   - For each subsystem, cut/paste related methods into the appropriate module, exporting functions or classes:
     - Rendering pipeline (canvas setup, draw loops) → `systems/rendering/*`.
     - Gameplay updates (player tick, enemies, projectiles, pickups, bosses) → `systems/gameplay/*`.
     - UI overlays and modal management → `systems/ui/*`.
     - Audio handling → `systems/audio/*`.
   - Replace inline method references with imported helpers; ensure the main loop in `engine.js` orchestrates update/render order.
   - Maintain consistent method signatures (e.g., pass `state`, `deltaTime`, `context`).

4. **Shared Utilities & Config**
   - Centralize constants (spawn rates, damage values, keycodes) in `config/constants.js`.
   - Create explicit asset manifests for fonts/sounds in `config/assets.js`.
   - Extract repeated helpers (e.g., formatting, randomization) into `utils/`.

5. **Cleanup & Verification**
   - Remove legacy code paths from the original monolith once all functionality lives in modules.
   - Reduce `js/vibe-survivor-game.js` to a thin import/export wrapper and eventually delete it in favor of `core/engine.js` entry.
   - Manually regression test interactive flows (start screen, gameplay, pause, level-up, mobile controls).
   - Document new module map and responsibilities in the README for future contributors.

## Risk Mitigation
- Perform each subsystem extraction behind feature flags or guarded imports while verifying in-browser after each commit.
- Leverage browser dev tools to monitor FPS before/after refactors to catch regressions in rendering performance.
- Add smoke-test scripts (even basic ones) to instantiate modules and ensure imports resolve.
- Maintain consistent ESLint/prettier rules (consider adding config) to keep style aligned after splitting files.

## Follow-Up Enhancements (Post-Refactor)
- Introduce automated tests for math helpers, spawning logic, and UI state machines once modules stabilize.
- Evaluate bundler (Vite/Rollup) introduction for production builds if module count grows and performance warrants.
- Consider TypeScript or JSDoc typing to improve maintainability after structure is modularized.

