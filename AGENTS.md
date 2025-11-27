## Project Overview

Vibe Survivor is a standalone JavaScript arcade-style survival game built with HTML5 Canvas. The game features pixel art styling, multiple weapon systems, enemy waves, and progression mechanics. It's designed as a self-contained web application that can be deployed independently.

## Version Number Update Checklist

When updating the game version (e.g., 1.0.0 → 1.0.1), update **ALL 5 files** listed below:

### Files to Update

1. **`js/config/constants.js`**
   - `VERSION: '1.0.X'`
   - `BUILD_DATE: 'YYYY-MM-DD'` (set to current date)

2. **`js/vibe-survivor-game.js`**
   - Search: `<span class="score-detail-version">v1.0.X</span>`

3. **`js/systems/ui/modals/score-detail-modal.js`**
   - Search: `score.version || score.majorVersion || '1.0.X'`

4. **`js/systems/ui/modals/scoreboard-modal.js`**
   - Search: `score.game_version || '1.0.X'`

5. **`js/utils/supabase-client.js`**
   - Search: `@param {string} gameVersion - Full game version (e.g., "1.0.X")`

### Quick Verification

After updating, verify all changes with:
```bash
grep -n "1\.0\.X" js/config/constants.js js/vibe-survivor-game.js js/systems/ui/modals/*.js js/utils/supabase-client.js
```

Replace `1.0.X` with your new version to confirm all 5 files are updated.

## Architecture

### Core Structure
- **index.html**: Entry point with pixel-styled landing page and in-page game modal
- **styles/base.css**: Complete styling for landing page and in-game UI (fonts, layout, responsive tweaks)
- **js/main.js**: Landing page controller that wires the "Press Start" button and game modal lifecycle
- **js/vibe-survivor-game.js**: Orchestration layer for the game, responsible for wiring systems, lifecycle, and high-level UI flow
- **js/core/**: Core engine utilities (state, input, physics, engine loop/timing)
- **js/config/**: Game configuration and asset maps (constants, sprite configs, loading phases)
- **js/utils/**: Shared utilities (Vector2 math, general math helpers, performance monitor)
- **js/systems/**: Modular systems extracted from the original monolith
  - **audio/**: `audio-manager.js` – central audio orchestration (music, SFX, mute state)
  - **gameplay/**:
    - `player.js` – PlayerSystem (movement, dash, passives)
    - `pickups.js` – XP/HP/magnet orbs
    - `enemies/` – EnemySystem and behavior groups
    - `weapons/` – WeaponSystem, ProjectileSystem
    - `progression/` – XPSystem, UpgradeSystem
  - **rendering/**: canvas init/resize, sprites, animations, particles, screen effects
  - **ui/**:
    - `hud.js` – in-game HUD (HP/XP/time/weapons)
    - `touch-controls.js` – mobile joystick + dash button
    - `modals/` – Pause, Game Over, Level Up, Options, Help, Victory, Start Screen, Loading, About, etc.
- **fonts/**: Custom fonts (NeoDunggeunmoPro, etc.) for authentic pixel styling
- **sound/**: Contains `Vibe_Survivor.mp3` background music
- **images/**: Title art, background, icons, and sprite sheets (including AI bot and weapon/passive icons)

### Game Engine Architecture (current modular design)

The game now uses a **modular architecture** with `VibeSurvivor` acting as the high-level coordinator:

1. **Core Engine & Utilities**
   - `core/engine.js`: GameLoop, EngineTimer, FrameRateCounter
   - `core/state.js`: State factories and reset helpers for player, enemies, projectiles, pickups, UI, etc.
   - `core/input.js`: InputManager (keyboard, mouse, touch, menu navigation)
   - `core/physics.js`: PhysicsManager (movement helpers, cached trig/sqrt)
   - `utils/vector2.js`, `utils/math.js`, `utils/performance.js`

2. **Gameplay Systems (`systems/gameplay/`)**
   - `player.js`: PlayerSystem – handles movement, dash, collision hooks, passives updates
   - `pickups.js`: PickupSystem – XP/HP/magnet orbs and magnet behavior
   - `enemies/enemy-system.js`: EnemySystem – enemy waves, behaviors, boss hooks
   - `weapons/weapon-base.js`: WeaponSystem – weapon creation/merging/upgrades
   - `weapons/projectiles.js`: ProjectileSystem – projectile pool and updates
   - `progression/xp-system.js`: XPSystem – level, XP thresholds, pending level-ups
   - `progression/upgrades.js`: UpgradeSystem – upgrade choice generation and application

3. **Rendering Systems (`systems/rendering/`)**
   - `canvas.js`: Canvas init/resize, camera abstraction
   - `sprites.js`: SpriteManager – sprite loading/caching
   - `animation.js`: AnimationController – sprite frame timing
   - `particles.js`: ParticleSystem – particles + explosions
   - `effects.js`: EffectsManager – screen shake, flashes, overlays

4. **UI Systems (`systems/ui/`)**
   - `hud.js`: HUD overlay (HP, XP, time, weapons, bosses)
   - `touch-controls.js`: TouchControlsUI – joystick + dash button for mobile
   - `modals/`:
     - `pause-menu.js`: Pause overlay (keyboard navigation, mute, dash position, resume/restart/exit)
     - `game-over.js`: Game Over modal (scrollable stats, weapon/passive summaries)
     - `level-up.js`: Level Up modal (tabs: upgrades/guide/status)
     - `chest-modal.js`: Upgrade chest modal (passive-only rewards, guide/status tabs, unique item guide)
     - `options-menu.js`: Language/audio/dash-position menu
     - `help-menu.js`: In-game help with recipes and status tab
     - `victory.js`, `loading-screen.js`, `start-screen.js`, `start-screen-modal.js`, `about-modal.js`, etc.
   - `modals/modal-base.js`: Base `Modal` and `ModalManager` for all overlays

5. **Audio (`systems/audio/audio-manager.js`)**
   - Centralized audio with lazy init, mute state, music control, and SFX hooks

6. **VibeSurvivor Orchestration (`js/vibe-survivor-game.js`)**
   - Owns the high-level lifecycle:
     - Creates the modal DOM, injects styles, wires InputManager
     - Calls `initializeCanvas()`, preloads assets, shows loading/start screens
     - Wires systems together (player/enemies/weapons/xp/UI/audio)
     - Runs the fixed-timestep game loop (using EngineTimer + PerformanceMonitor)
   - Keeps only glue logic and compatibility shims; individual behaviors live in their modules

### Global Leaderboard (Supabase)
- Opt-in global rankings run alongside the local scoreboard (tabs: Local / Global).
- Backend: Supabase table + Edge Function `submit-score` (see `supabase/SETUP_INSTRUCTIONS.md` and `supabase/functions/submit-score/index.ts`).
- Frontend config: set `url`, `anonKey`, and `edgeFunctionUrl` in `js/config/supabase-config.js`. If Supabase is unreachable, UI falls back to local-only.
- Submission entry points: Game Over modal and Scoreboard modal; local scores are marked via `scoreboardStorage.markAsSubmitted`.
- Global tab renders read-only cards from `supabaseClient.fetchGlobalScores` (with version filtering, 100 rows).

### Initialization Flow

The game uses a controlled initialization pattern:
1. `window.VIBE_SURVIVOR_AUTO_INIT = false` prevents automatic game start
2. Landing page loads with start button
3. `main.js` wires up event handlers using `data-launch-game` attributes
4. Game instance created on-demand when start button is pressed
5. Game launches in modal overlay, preserving landing page underneath

### Upgrade Chest System

- Chest orbs spawn through `PickupSystem` and call `showChestModal()` when collected. The modal pauses the game, locks overlays, and resumes once an upgrade is chosen.
- The chest modal mirrors the level-up modal structure: **Upgrades**, **Guide**, and **Status** tabs with full keyboard/touch navigation and localization support.
- Upgrades are **passive-only** and use weighted selection (unique passives have reduced spawn weight). Unique cards render with gold styling and badges.
- The guide tab lists all unique passives (icon, name, description). Status reuses the existing weapons/passives/player stats render callbacks shared with the level-up modal.
- Unique passives currently available:
  - Regeneration (legacy healing passive).
  - Turbo-Flux Cycler (+25% global fire rate, also increases burn tick speed by 25%).
  - Aegis Impact Core (+50% global weapon damage, also increases burn damage for DOT weapons).
  - Splitstream Matrix (+1 projectile per weapon and raises per-weapon projectile cap).
  - Macro-Charge Amplifier (+50% explosion radius for explosive weapons).
  - Mod-Bay Expander (raises the weapon slot cap to five; HUD displays the extra slot).
- `UpgradeSystem` and `addPassiveAbility()` ensure the corresponding bonuses are applied immediately (e.g., applying retroactive weapon stat adjustments, slot cap changes, etc.).
- **Important**: Passives that affect weapon damage/fire rate also apply to special weapon properties:
  - Aegis Impact Core boosts both `weapon.damage` AND `weapon.burnDamage` (for Napalm Buckshot)
  - Turbo-Flux Cycler reduces `weapon.fireRate` AND burn tick interval (10 frames → 8 frames)

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
- Game expects `sound/Vibe_Survivor.mp3` for background music
- Fonts loaded from `fonts/` directory via CSS @font-face
- All paths are relative and must be maintained when moving files

## Code Style and Conventions

- ES6+ JavaScript with class-based architecture
- Consistent indentation (4 spaces)
- Descriptive variable and method names
- Inline comments for complex game logic
- Vector operations abstracted through Vector2 utility class
- Event-driven architecture for user interactions

## Deployment Notes

- No build process required - direct file deployment
- All assets must maintain relative path structure
- HTTPS required for audio playback on most browsers
- Game is self-contained with no external dependencies
