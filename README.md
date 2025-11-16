# Vibe Survivor

This folder now contains an operational build of the Vibe Survivor game, detached from the main VibeCreAI site and ready to be pushed to its own repository.

## Structure

- `index.html` – Pixel-styled landing screen and in-page game modal.
- `styles/` – Global styling (`base.css`) including custom pixel fonts and responsive layout.
- `js/main.js` – Landing/host page controller (start button → game modal lifecycle).
- `js/vibe-survivor-game.js` – Orchestration layer that wires all systems, manages lifecycle, and owns the high-level game loop.
- `js/core/` – Core engine pieces:
  - `engine.js` – GameLoop, EngineTimer, FrameRateCounter
  - `state.js` – State factories and reset helpers
  - `input.js` – InputManager (keyboard, mouse, touch, menu navigation)
  - `physics.js` – PhysicsManager (movement, cached trig/sqrt)
- `js/config/` – `constants.js`, `assets.js` – configuration, balance values, asset paths, loading phases.
- `js/utils/` – `vector2.js`, `math.js`, `performance.js` – math & performance utilities.
- `js/systems/` – Modular systems extracted from the original monolith:
  - `audio/audio-manager.js` – music/SFX orchestration.
  - `gameplay/` – `player.js`, `pickups.js`, `enemies/enemy-system.js`, `weapons/weapon-base.js`, `weapons/projectiles.js`, `progression/xp-system.js`, `progression/upgrades.js`.
  - `rendering/` – `canvas.js`, `sprites.js`, `animation.js`, `particles.js`, `effects.js`.
  - `ui/` – `hud.js`, `touch-controls.js`, and `modals/*` (pause, game over, level up, options, help, victory, start screen, loading, about, etc.).
- `sound/` – `Vibe_Survivor.mp3` background track.
- `fonts/` – Pixel fonts (e.g. NeoDunggeunmoPro) used across landing and in-game UI.
- `images/` – Title art, background, weapon/passive icons, AI bot sprite, and other UI assets.

## Upgrade Chest System

- Chest orbs spawn during gameplay and trigger a dedicated **Upgrade Chest** modal that pauses the game and offers three passive-only rewards.
- The modal uses the same Option-B architecture as the level-up screen (magenta theme, keyboard/touch navigation) with tabs for **Upgrades**, **Guide**, and **Status**.
- Unique passives render with gold badges and have reduced spawn weight. Current uniques:
  - Regeneration, Turbo-Flux Cycler, Aegis Impact Core, Splitstream Matrix, Macro-Charge Amplifier, Mod-Bay Expander.
- Guide tab lists every unique passive with icon + localized description; Status tab reuses the dynamic weapons/passives/player stats sections from the level-up modal.
- Game logic applies each passive immediately (e.g., global fire-rate/damage buffs, projectile-cap increases, weapon-slot expansion to five, explosion radius boosts).

## Running Locally

Any static HTTP server will work. From this folder:

```bash
# Python 3
python -m http.server 8000

# or with Node.js (http-server)
npx http-server

# or PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

Auto-initialization is disabled via `window.VIBE_SURVIVOR_AUTO_INIT = false;`, so the landing page shows first and the game modal appears only after pressing **Press Start**.
