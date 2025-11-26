# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vibe Survivor is a standalone JavaScript arcade-style survival game built with HTML5 Canvas. The game features pixel art styling, multiple weapon systems, enemy waves, and progression mechanics. It's designed as a self-contained web application that can be deployed independently.

**Major Refactor Completed**: The game has been refactored from a monolithic ~9300+ line single-file architecture to a modern modular system with separated concerns, improved maintainability, and clearer code organization. See REFACTOR.md and AGENTS.md for detailed documentation.

## Architecture

### Core Structure
- **index.html**: Entry point with pixel-styled landing page and in-page game modal
- **js/main.js**: Landing page controller that handles game initialization and UI wiring
- **js/vibe-survivor-game.js**: Orchestration layer that wires all systems, manages lifecycle, and owns the high-level game loop
- **js/core/**: Core engine pieces (engine, state, input, physics)
- **js/config/**: Configuration files (constants, assets, loading phases)
- **js/utils/**: Shared utilities (Vector2 math, general math helpers, performance monitor)
- **js/systems/**: Modular systems extracted from the original monolith
  - `audio/`: Audio management
  - `gameplay/`: Player, enemies, weapons, pickups, progression
  - `rendering/`: Canvas, sprites, animations, particles, effects
  - `ui/`: HUD, touch controls, modals
- **styles/base.css**: Complete styling for landing page and in-game UI with custom fonts and pixel aesthetic
- **fonts/**: Custom fonts (NeoDunggeunmoPro, etc.) for authentic pixel game styling
- **sound/**: Background music (Vibe_Survivor.mp3) and SFX (weapon sounds, game events)
- **images/**: Title art, backgrounds, weapon/passive icons, sprite sheets

### Game Engine Architecture (Modular)

The game now uses a **modular architecture** with `VibeSurvivor` acting as the high-level coordinator:

1. **Core Engine & Utilities (`js/core/`, `js/utils/`)**
   - `core/engine.js`: GameLoop, EngineTimer, FrameRateCounter - handles fixed-timestep game loop
   - `core/state.js`: State factories and reset helpers for player, enemies, projectiles, pickups, UI
   - `core/input.js`: InputManager - centralized keyboard, mouse, touch, and menu navigation
   - `core/physics.js`: PhysicsManager - movement helpers, cached trig/sqrt for performance
   - `utils/vector2.js`: Vector2 class for optimized 2D vector operations
   - `utils/math.js`: Math utilities (clamp, lerp, distance calculations)
   - `utils/performance.js`: PerformanceMonitor for FPS tracking and diagnostics

2. **Configuration (`js/config/`)**
   - `constants.js`: Game balance values, physics constants, weapon stats, enemy configs
   - `assets.js`: Asset paths, sprite configurations, loading phases

3. **Gameplay Systems (`js/systems/gameplay/`)**
   - `player.js`: PlayerSystem - movement, dash, collision hooks, passive abilities
   - `pickups.js`: PickupSystem - XP/HP/magnet orbs and collection behavior
   - `enemies/enemy-system.js`: EnemySystem - enemy waves, behaviors (chase, dodge, tank, fly, teleport, boss)
   - `weapons/weapon-base.js`: WeaponSystem - weapon creation, merging, upgrades
   - `weapons/projectiles.js`: ProjectileSystem - projectile pooling and updates
   - `progression/xp-system.js`: XPSystem - level progression, XP thresholds, level-ups
   - `progression/upgrades.js`: UpgradeSystem - upgrade choice generation and application

4. **Rendering Systems (`js/systems/rendering/`)**
   - `canvas.js`: Canvas initialization, resize handling, camera abstraction
   - `sprites.js`: SpriteManager - sprite loading and caching
   - `animation.js`: AnimationController - sprite frame timing
   - `particles.js`: ParticleSystem - particle effects and explosions with pooling
   - `effects.js`: EffectsManager - screen shake, flashes, visual overlays

5. **UI Systems (`js/systems/ui/`)**
   - `hud.js`: In-game HUD (HP, XP, time, weapons, boss indicators)
   - `touch-controls.js`: TouchControlsUI - virtual joystick and dash button for mobile
   - `modals/modal-base.js`: Base Modal class and ModalManager for all overlays
   - `modals/`: Pause, Game Over, Level Up, Options, Help, Victory, Loading, Start Screen, About, etc.

6. **Audio System (`js/systems/audio/audio-manager.js`)**
   - Centralized audio management with lazy initialization, mute state, music control, SFX playback

7. **VibeSurvivor Orchestration (`js/vibe-survivor-game.js`)**
   - High-level game coordinator that wires systems together
   - Manages lifecycle: canvas init, asset loading, game loop, modal lifecycle
   - Maintains glue logic and compatibility shims between systems
   - Runs fixed-timestep game loop using EngineTimer + PerformanceMonitor

### Global Leaderboard (Supabase)
- Dual-scoreboard tabs (Local / Global); local runs stay on-device, submissions to global are opt-in.
- Backend: Supabase table + Edge Function `submit-score` (see `supabase/SETUP_INSTRUCTIONS.md` and `supabase/functions/submit-score/index.ts`).
- Frontend config lives in `js/config/supabase-config.js` (`url`, `anonKey`, `edgeFunctionUrl`). If Supabase isn’t reachable, UI degrades to local-only.
- Submission flows: from Game Over modal and Scoreboard modal; we track submitted locals via `scoreboardStorage.markAsSubmitted`.
- Global tab fetches via `supabaseClient.fetchGlobalScores` (100 rows, optional major-version filter) and renders read-only cards.

### Initialization Flow

The game uses a controlled initialization pattern:
1. `window.VIBE_SURVIVOR_AUTO_INIT = false` prevents automatic game start
2. Landing page loads with start button
3. `main.js` wires up event handlers using `data-launch-game` attributes
4. Game instance created on-demand when start button is pressed
5. Game launches in modal overlay, preserving landing page underneath

## Development Commands

### Running the Game
This is a client-side only application. Serve files using any static web server:

```bash
# Python 3
python -m http.server 8000

# Node.js (if http-server is installed)
npx http-server

# PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

### Testing
No automated test suite is currently configured. Manual testing should cover:
- Game controls (WASD movement, mouse aiming, spacebar dash)
- Touch controls on mobile devices
- Audio playback and fallback handling
- Pause/resume functionality
- Level progression and weapon selection
- Performance across different screen sizes

## Important Implementation Notes

### Canvas and Coordinate System
- Game uses world coordinates centered at (0,0) with camera following the player
- Screen coordinates are transformed for rendering via camera offset
- All entities use world positions internally

### Performance Optimizations
- Enemies grouped by behavior type for batch processing
- Vector operations optimized for common use cases
- Particle system with pooling and lifecycle management
- Audio lazy-loading and caching

### Mobile Support
- Touch controls implemented with virtual joystick
- Responsive modal sizing
- Touch-friendly UI elements
- Performance considerations for mobile devices

### File Dependencies
- Game expects background music at `sound/Vibe_Survivor.mp3`
- Additional SFX files in `sound/` directory (weapon sounds, boss alerts, game events)
- Weapon-specific sounds in `sound/weapon/` (basicMissile.mp3, flameThrower.mp3, etc.)
- Fonts loaded from `fonts/` directory via CSS @font-face
- Images and sprite sheets in `images/` directory
- All paths are relative and must be maintained when moving files

## Working with the Modular Architecture

### System Organization
- Each system is self-contained in its own file/directory
- Systems communicate through the main VibeSurvivor orchestrator
- State is managed centrally through `core/state.js` factories
- Systems receive state references and update them directly
- Cross-system dependencies are minimized and clearly documented

### Making Changes
- **Adding new features**: Identify the appropriate system (gameplay, rendering, UI) and add logic there
- **Modifying game balance**: Update values in `js/config/constants.js`
- **Adding new weapons**: Extend weapon definitions in `constants.js` and add logic in `weapons/weapon-base.js`
- **UI changes**: Modal-based UI lives in `systems/ui/modals/`, HUD changes go in `systems/ui/hud.js`
- **Performance tuning**: Check `utils/performance.js` for monitoring and optimization opportunities

### Testing Changes
- Test the specific system you modified
- Verify integration with other systems through the orchestrator
- Check that state management remains consistent
- Test on both desktop (keyboard/mouse) and mobile (touch) inputs

## Code Style and Conventions

- ES6+ JavaScript with class-based architecture
- Modular design with single responsibility principle
- Consistent indentation (4 spaces)
- Descriptive variable and method names
- Inline comments for complex game logic
- Vector operations abstracted through Vector2 utility class
- Event-driven architecture for user interactions
- Systems use dependency injection pattern (state and managers passed in)

## Deployment Notes

- No build process required - direct file deployment
- All assets must maintain relative path structure
- HTTPS required for audio playback on most browsers
- Game is self-contained with no external dependencies
