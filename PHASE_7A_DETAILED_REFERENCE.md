# Phase 7a: Rendering Core Extraction Analysis

## COMPREHENSIVE RENDERING ARCHITECTURE SUMMARY

### 1. CANVAS INITIALIZATION AND SETUP

Location: Constructor (35-36), initialize() (457-493), resizeCanvas() (3268-3343)

Properties to Extract:
- this.canvas = null  (Canvas DOM element)
- this.ctx = null     (2D context)

Context Creation (lines 463-472):
- alpha: false (no transparency)
- desynchronized: true (browser optimization)
- willReadFrequently: false (GPU acceleration)
- imageSmoothingEnabled = false (pixel art)
- globalCompositeOperation = 'source-over' (fastest)

Sizing Logic (lines 3268-3315):
- Gets dimensions from getBoundingClientRect()
- Falls back to modal-based sizing
- Sets canvas.width and canvas.height (internal resolution)
- Initializes canvas layers after resize

Extraction Candidate: CanvasManager class


### 2. CAMERA IMPLEMENTATION

Location: updateCamera() (8375-8391), isInViewport() (8395-8426), shouldRender() (8430-8482)

State (from state.js createCameraState):
- x: 0 (World X coordinate)
- y: 0 (World Y coordinate)

Camera Following (lines 8377-8390):
- Target: player.x - canvas.width/2, player.y - canvas.height/2
- Lerp factor: 0.1 (normal), 0.2 (during dash)
- Smooth movement: camera.x += (targetX - camera.x) * lerpFactor

Viewport Culling (lines 8395-8426):
- AABB check with configurable buffers
- Buffers: aggressive(50), tight(75), normal(100), loose(150)
- Used for rendering optimization

LOD System (lines 8430-8482):
- Always render: player, boss
- Distance-based culling for other entities
- Different strategies per entity type

Extraction Candidate: CameraManager class


### 3. SPRITE LOADING AND MANAGEMENT

Location: Constructor (96-145), loading callbacks (122-135)

Sprite Object:
- idle, up, down, left, right (5 Image objects)
- loaded: 0 (Progress counter)
- total: 5 (Total to load)

Sprite Config:
- frameWidth: 0 (Calculated ~64)
- frameHeight: 0 (Calculated ~64)
- cols: 3
- rows: 4
- totalFrames: 12
- frameRate: 8 (Animation speed)

Asset Paths (from assets.js):
- playerIdle: 'images/AI BOT-IDLE.png'
- playerUp, Down, Left, Right (similar)
- itemIcons.health: 'images/passives/healthBoost.png'
- itemIcons.magnet: 'images/passives/magnet.png'

Loading Callback (lines 122-130):
Increments counter and calculates frame dimensions when images load.

Extraction Candidate: SpriteManager class


### 4. COORDINATE TRANSFORMATIONS

World-to-Screen: Using ctx.translate(-camera.x + shakeX, -camera.y + shakeY)
- All draws use world coordinates
- Context translation handles conversion

Formula: screenX = worldX - camera.x + shakeX, screenY = worldY - camera.y + shakeY

Screen Shake: shakeX/shakeY offsets applied to camera translation

No explicit screenToWorld in current code.

Extraction Candidate: CoordinateTransformer utility


### 5. MAIN RENDERING PIPELINE

Game Loop (3811-3845):
1. Performance monitor update
2. Fixed timestep: while accumulator >= frameInterval: update()
3. Call draw() for rendering
4. Call updateUI() for DOM
5. Schedule next frame

Update (3847-3889):
- Updates effects and game logic
- Calls updateCamera() at end

Draw (9732-9737): Delegates to drawTraditional()

drawTraditional (9839-9870):
1. Clear to black
2. Save and translate context
3. Draw grid, player, enemies, projectiles, pickups, effects
4. Restore context
5. Draw red flash (screen-space)

Render Order:
Background -> Grid -> Player -> Enemies -> Projectiles -> Pickups -> Explosions -> Particles -> Notifications -> Red Flash


### 6. CANVAS LAYERS SYSTEM

Structure (lines 9051-9067):
- background (layer 0)
- grid (layer 1)
- entities (layer 2)
- effects (layer 3)
- ui (layer 4)

Each layer is separate canvas with own context, positioned absolutely.

drawToLayer (9127-9143): Routes drawing to correct layer

Grid Optimization: Grid only redrawn when camera moves


### 7. CLASSES TO CREATE

CanvasManager: Canvas lifecycle, sizing, layers
CameraManager: Camera following, viewport culling, LOD
SpriteManager: Sprite/icon loading, access
CoordinateTransformer: Coordinate math utilities
RenderingManager: Rendering orchestration


### 8. DEPENDENCIES

RenderingManager -> CanvasManager, CameraManager, CoordinateTransformer, SpriteManager, Entity methods
CameraManager -> canvas dimensions, player position
CanvasManager -> DOM API, browser context
SpriteManager -> assets.js configs
CoordinateTransformer -> camera state, canvas dimensions


### 9. KEY CODE LOCATIONS

Canvas init: 35-36, 457-493, 3268-3343
Camera update: 8375-8391
Viewport culling: 8395-8426
Sprites: 96-145 (init), 115-119 (paths), ASSET_PATHS in assets.js
Drawing methods: 9732-9870, 10049+
Grid: 9912-9980
Game loop: 3811-3889


### 10. EXTRACTION STRATEGY

Phase 7a will extract rendering into modular managers:

1. CanvasManager handles canvas lifecycle and layers
2. CameraManager handles following and culling
3. SpriteManager handles sprite/icon loading
4. CoordinateTransformer provides coordinate utilities
5. RenderingManager orchestrates all rendering

Each class moves to js/core/rendering/ directory and maintains clear interfaces with VibeSurvivor.


---

## ADDITIONAL TECHNICAL SPECIFICATIONS

### Entity Drawing Methods (Stay in VibeSurvivor)

drawPlayer() - Lines 10049-10132
- Saves context state
- Draws player trail (neon cyan)
- Draws HP bar above player
- Translates to player position
- Calls drawPlayerSprite()
- Restores context

drawPlayerSprite() - Lines 9982-10048
- Checks if sprites are loaded
- Calculates sprite frame position
- Draws from spritesheet at current frame
- Uses spriteFrame and spriteDirection

drawEnemies() - Lines 10134+
- Batches enemies by behavior type
- Applies viewport culling
- Draws health bar and visuals for each

drawGrid() - Lines 9912-9980
- Calculates visible grid bounds
- Draws 60-pixel grid lines
- Uses cyan color with low alpha

drawProjectiles() and similar
- Skip rendering if outside viewport
- Use camera position for coordinate transform

### State Updates (in update() method)

updateCamera() called at line 3885
- Updates camera.x and camera.y
- Uses player position and canvas size
- Implements smooth following

Player sprite direction set by movement
- Based on velocity (which keys pressed)
- Updated each frame in updatePlayer()

Player sprite frame animation
- Incremented based on frameRate timer
- Wraps around at totalFrames

### Screen Effects

Screen shake (screenShake object)
- x, y offsets applied to camera translation
- Decays over time
- Used for impact feedback

Red flash (redFlash object)
- Overlay with fading alpha
- Drawn after context restore (screen-space)
- Used for damage feedback

### Asset Loading

From assets.js:
- ASSET_PATHS: sprite paths
- SPRITE_CONFIGS: animation settings
- preloadAssets(): background loading

Assets referenced:
- images/AI BOT-IDLE.png
- images/AI BOT-UP.png
- images/AI BOT-DOWN.png
- images/AI BOT-LEFT.png
- images/AI BOT-RIGHT.png
- images/passives/healthBoost.png
- images/passives/magnet.png

### Batching System

flushAllBatches() - Line 9392
- Called after all drawing
- Handles accumulated batch operations
- Clears batch state for next frame

Batching with methods:
- drawPlayerWithBatching()
- drawEnemiesWithBatching()
- drawProjectilesWithBatching()
- drawExplosionsWithBatching()
- drawParticlesWithBatching()

Currently these are fallbacks that call non-batched versions.

### Canvas Configuration

Main canvas properties:
- ID: 'survivor-canvas'
- Position: Modal overlay
- Responsive sizing based on modal
- Internal resolution set via canvas.width/height

Context settings:
- No antialiasing (imageSmoothingEnabled = false)
- Source-over compositing (fastest)
- No transparency (alpha = false)
- Desynchronized for optimization

### Viewport Culling Levels

aggressive: 50px buffer
- For small particles and effects
- Tight culling saves render time

tight: 75px buffer
- For small entities
- Tighter than normal

normal: 100px buffer
- Standard entities (projectiles, pickups)
- Default level

loose: 150px buffer
- Important entities (enemies, explosions)
- Extra space for visibility

### Distance-based LOD

Distance calculations used for:
- Deciding if entity should render
- Determining which rendering method to use
- Reducing quality for distant entities

Distances measured from player position using:
dx = entity.x - player.x
dy = entity.y - player.y
distance = sqrt(dx*dx + dy*dy)
