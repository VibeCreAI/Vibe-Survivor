# Phase 7a: Rendering Core Extraction - Complete Analysis

This directory contains comprehensive analysis documents for Phase 7a of the Vibe Survivor refactoring project.

## Documents Overview

### 1. PHASE_7A_EXECUTIVE_SUMMARY.txt
**High-level overview** (2.6 KB, quick read)

Quick reference for:
- What rendering systems need extraction
- Which classes to create
- Implementation order
- Expected benefits
- Estimated scope

**Start here** if you're new to this phase.

---

### 2. PHASE_7A_RENDERING_ANALYSIS.md
**Detailed component analysis** (5.2 KB, medium depth)

Comprehensive breakdown of:
- Canvas initialization and setup (lines 35-36, 457-493, 3268-3343)
- Camera implementation (lines 8375-8426, 8430-8482)
- Sprite loading system (lines 96-145, 122-135)
- Coordinate transformations (lines 9850+)
- Main rendering pipeline (lines 3811-3889, 9732-9870)
- Canvas layers system (lines 9045-9100)
- Classes to create (5 managers)
- Dependency relationships
- Key code locations

**Read this** to understand each rendering component.

---

### 3. PHASE_7A_DETAILED_REFERENCE.md
**Technical specifications** (8.6 KB, deep dive)

Complete reference for:
- CanvasManager class specifications
  - Methods: initialize(), resizeCanvas(), initializeCanvasLayers()
  - Context options and performance settings
- CameraManager class specifications
  - Methods: update(), isInViewport(), shouldRender()
  - Culling levels and LOD system
- SpriteManager class specifications
  - Sprite loading, caching, and access
  - Frame dimension calculations
- CoordinateTransformer specifications
  - Transformation formulas
  - Context setup methods
- RenderingManager specifications
  - Render pipeline order (16 draw calls)
  - Entity drawing integration
  - Subsystem coordination
- Integration points with VibeSurvivor
- Performance optimizations
- File structure
- Asset configuration

**Reference this** when implementing the managers.

---

## Key Findings Summary

### Rendering Components to Extract

| Component | Current Location | Lines | Extract To |
|-----------|------------------|-------|-----------|
| Canvas setup | constructor, initialize, resizeCanvas | 35-36, 457-493, 3268-3343 | CanvasManager |
| Camera system | updateCamera, isInViewport, shouldRender | 8375-8426, 8430-8482 | CameraManager |
| Sprite system | constructor, sprite callbacks | 96-145, 122-135 | SpriteManager |
| Coordinate math | drawTraditional, draw methods | 9850+ | CoordinateTransformer |
| Rendering loop | draw, drawTraditional, gameLoop | 3811-3845, 9732-9870 | RenderingManager |

### Classes to Create

1. **CanvasManager** - Canvas lifecycle and layers
2. **CameraManager** - Camera following and culling  
3. **SpriteManager** - Sprite loading and access
4. **CoordinateTransformer** - Coordinate math utilities
5. **RenderingManager** - Rendering orchestration

### Implementation Order

1. CanvasManager (minimal dependencies)
2. CameraManager (uses canvas dimensions)
3. SpriteManager (independent)
4. CoordinateTransformer (uses camera state)
5. RenderingManager (orchestrates all)

---

## Architecture Overview

### Current Monolithic Structure
```
vibe-survivor-game.js (12,920 lines)
├── Canvas management
├── Camera system
├── Sprite loading
├── Coordinate transforms
├── Main rendering loop
└── Entity drawing
```

### Target Modular Structure
```
vibe-survivor-game.js (~11,700 lines)
├── Game logic
├── Entity state
├── Entity drawing methods
└── Uses: RenderingManager

js/core/rendering/
├── canvasManager.js
├── cameraManager.js
├── spriteManager.js
├── coordinateTransformer.js
├── renderingManager.js
└── index.js
```

---

## Key Technical Details

### Camera System
- **Following**: Smooth lerp with factor 0.1 (normal) or 0.2 (during dash)
- **Target**: player.x - canvas.width/2, player.y - canvas.height/2
- **Culling**: AABB with configurable buffers (aggressive:50, tight:75, normal:100, loose:150)
- **LOD**: Distance-based visibility decisions per entity type

### Sprite System
- **Sprites**: 5 directions (idle, up, down, left, right)
- **Icons**: 2 items (health, magnet)
- **Grid**: 3x4 (12 frames per sprite)
- **Rate**: 8 FPS animation
- **Dimensions**: Calculated from loaded image

### Rendering Pipeline
1. Clear background (black)
2. Apply camera transform (translate -camera.x, -camera.y + shake)
3. Draw grid (60px cyan)
4. Draw player + trail
5. Draw enemies (batched by type)
6. Draw projectiles
7. Draw pickups (XP, HP, magnet)
8. Draw explosions
9. Draw particles
10. Draw notifications
11. Restore context
12. Draw red flash (screen-space)

### Coordinate System
- **World**: Center origin (0,0), infinite bounds
- **Screen**: Top-left origin, canvas dimensions
- **Transform**: screenX = worldX - camera.x + shakeX
- **Method**: Context translate() before drawing

---

## Scope Estimation

- **Lines to extract**: ~1,200
- **Current VibeSurvivor**: 12,920 lines
- **Expected result**: ~11,700 lines
- **No performance impact expected**: Same algorithms preserved

---

## Benefits

✓ Clear separation of concerns
✓ Easier testing and debugging
✓ Better code maintainability
✓ Improved code organization
✓ Foundation for future optimizations
✓ Reusable managers for other projects

---

## Next Steps

1. Review these analysis documents
2. Create js/core/rendering/ directory
3. Implement each manager class (in order)
4. Update VibeSurvivor to use managers
5. Test rendering behavior
6. Verify performance is maintained

---

## Document References

- **Code locations**: See PHASE_7A_RENDERING_ANALYSIS.md Section 9
- **Class specifications**: See PHASE_7A_DETAILED_REFERENCE.md
- **Implementation details**: See PHASE_7A_DETAILED_REFERENCE.md
- **Quick overview**: See PHASE_7A_EXECUTIVE_SUMMARY.txt

---

Created: November 7, 2025
Analysis of: vibe-survivor-game.js (12,920 lines)
For: Phase 7a Rendering Core Extraction
