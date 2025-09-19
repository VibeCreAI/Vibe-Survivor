## Project Overview

Vibe Survivor is a standalone JavaScript arcade-style survival game built with HTML5 Canvas. The game features pixel art styling, multiple weapon systems, enemy waves, and progression mechanics. It's designed as a self-contained web application that can be deployed independently.

## Architecture

### Core Structure
- **index.html**: Entry point with minimal pixel-styled landing page featuring a "Press Start" button
- **js/vibe-survivor-game.js**: Complete game engine (~9300+ lines) containing all game logic, rendering, and systems
- **js/main.js**: Landing page controller that handles game initialization and UI wiring
- **styles/base.css**: Complete styling for landing page with custom fonts and pixel aesthetic
- **fonts/**: Custom fonts (Born2bSporty, Minecraft) for authentic pixel game styling
- **sound/**: Contains Vibe_Survivor.mp3 background music

### Game Engine Architecture (vibe-survivor-game.js)

The game uses a single-file architecture with these key components:

1. **Vector2 Class**: Utility class for optimized 2D vector operations (normalize, distance, direction, etc.)

2. **VibeSurvivor Main Class**: Core game controller with properties for:
   - Player state (position, health, XP, level, abilities)
   - Enemy management with behavior-based grouping (chase, dodge, tank, fly, teleport, boss)
   - Weapon systems and projectiles
   - Particle effects and visual systems
   - Audio management
   - UI overlays and modals

3. **Key Systems**:
   - Canvas-based rendering with world-to-screen coordinate transformation
   - Frame-based game loop with deltaTime calculations
   - Event-driven input handling (keyboard, mouse, touch)
   - Modal system for in-game UI (pause, level-up, death screens)
   - Sound management with fallback handling

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