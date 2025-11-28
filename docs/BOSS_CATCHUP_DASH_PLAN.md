# Boss Catch-Up Dash Implementation Plan

## Overview
Replace the boss instant teleport mechanism (when player runs too far) with a high-speed dash that creates a more dynamic and visible chase mechanic. This prevents players from exploiting the boss fight by running away indefinitely while maintaining engaging gameplay.

## Current Behavior (Before Changes)
- Triggers when player is >800 units away from boss
- Boss instantly teleports to 400-500 units behind the player
- Creates particle burst effects at old and new positions
- Uses color #FF0066 (hot pink/magenta) for particles
- Function name: `handleBossTeleport()` in `vibe-survivor-game.js`

## Requirements

### Functional Requirements
1. **Replace teleport with animated dash**: Boss should visibly move from current position to target position over multiple frames
2. **Target distance**: ~100 units from player (much closer than current 400-500 units)
3. **Dash speed**: Very fast (8-10x normal boss speed for "almost instant" feel while remaining visible)
4. **Boss must appear in viewport**: Player should see the boss after dash completes
5. **Resume normal behavior**: After dash, boss should continue with regular AI (not freeze)

### Visual Requirements
1. **Particle burst at start**: 12-15 particles at boss position when dash begins
2. **Particle trail**: Create 3 particles per frame during the dash for high visibility
3. **Particle burst at end**: 15 particles at arrival position
4. **Screen shake**: Strong shake effect (intensity 15-20, duration 15-20 frames) on completion
5. **Color**: Use #FF0066 (hot pink/magenta) for all particles

### Technical Requirements
1. **New state property**: Add `catchUpDashState` to boss entities:
   ```
   catchUpDashState: {
       active: false,           // Whether dash is currently executing
       targetX: 0,             // Destination X coordinate
       targetY: 0,             // Destination Y coordinate
       startX: 0,              // Starting X (optional, for effects)
       startY: 0,              // Starting Y (optional, for effects)
       duration: 0,            // Frames elapsed during dash
       maxDuration: 60,        // Maximum frames for dash (safety timeout)
       lastParticleFrame: 0    // For particle trail timing
   }
   ```

2. **Skip normal AI during dash**: When `catchUpDashState.active` is true, skip all normal boss movement and behavior to prevent conflicts

3. **Initialize on all boss spawns**: Ensure `catchUpDashState` is added to boss objects in all spawn functions

## Implementation Steps

### Step 1: Add State Property to Boss Spawns
Find all functions that create boss enemies and add the `catchUpDashState` property:
- `spawnBossImmediate()`
- `spawnScaledBossImmediate()`
- Any other boss spawn functions in `enemy-system.js`

### Step 2: Modify the Catch-Up Logic
Replace the teleport mechanism with dash logic:

**Initialization (when player is >800 units away and dash not active):**
1. Set `catchUpDashState.active = true`
2. Calculate direction from player TO boss (opposite of movement direction)
3. Calculate target position: `player position + direction * targetDistance`
   - Use `targetDistance` of approximately 80-120 units (randomize for variance)
4. Store target coordinates in `catchUpDashState`
5. Reset duration counter to 0
6. Create initial particle burst (12-15 particles)

**Execution (every frame while dash is active):**
1. Calculate direction from boss current position TO target position
2. Move boss at high speed: `boss.x += dirX * (boss.speed * 9)`
3. Create particle trail (3 particles per frame)
4. Increment duration counter
5. Check if dash is complete:
   - Calculate squared distance to target: `distSq = (boss.x - targetX)² + (boss.y - targetY)²`
   - Complete if: `distSq < 2500` (which is 50² = 50 units threshold) OR `duration >= maxDuration`
6. On completion:
   - Create final particle burst (15 particles)
   - Trigger screen shake effect
   - Set `active = false`
   - Reset duration to 0

### Step 3: Skip Normal Boss AI During Dash
In the boss update loop (typically in `processBatchBoss()` or similar):
- After calling the catch-up dash function
- Check if `enemy.catchUpDashState && enemy.catchUpDashState.active`
- If active, use `continue` to skip the rest of the boss AI for this frame
- This prevents normal movement from overriding the dash position

### Step 4: Rename Function (Optional but Recommended)
Rename `handleBossTeleport()` to `handleBossCatchUpDash()` for clarity

## Critical Implementation Notes

### Distance Calculations
- **IMPORTANT**: Most distance checks use squared distance for performance
- When comparing to a threshold like 50 units, compare against 50² = 2500
- Example: `if (distanceSquared < 2500)` means "within 50 units"
- Don't compare squared distance to unsquared thresholds!

### Direction Calculations
- Direction from player to boss creates a vector pointing AWAY from player (behind them)
- Target position = player position + (direction * distance)
- This places boss behind the player at specified distance

### State Management
- Dash must be marked inactive when complete
- Don't re-trigger dash if already active
- Ensure all spawn functions initialize the state

### Performance
- Creating 3 particles per frame during a fast dash is fine (dash is very short)
- Use the existing particle system methods
- Dash typically completes in 10-30 frames

## API Methods Available

### Particle System
- `createHitParticles(x, y, color)` - Creates particle effects at position
- Color parameter: '#FF0066' for hot pink

### Screen Effects
- `createScreenShake(intensity, duration)` - Creates screen shake
- Intensity: 15-20 for strong effect
- Duration: 15-20 frames (~0.25-0.33 seconds at 60fps)

### Vector/Math Utilities
- `Vector2.direction(x1, y1, x2, y2)` - Returns normalized direction vector [dirX, dirY]
- `Vector2.distanceSquared(x1, y1, x2, y2)` - Returns squared distance (faster than sqrt)
- Framework likely provides cached sqrt function for when actual distance needed

## Testing Checklist

- [ ] Boss catch-up dash triggers when player is >800 units away
- [ ] Boss dashes to approximately 100 units from player
- [ ] Boss appears in viewport after dash (not outside screen)
- [ ] Particle trail is clearly visible during dash
- [ ] Screen shake occurs when dash completes
- [ ] Boss resumes normal AI after dash (doesn't freeze)
- [ ] Boss can trigger multiple dashes if player keeps running
- [ ] No interference with Phase 3 aggressive dash behavior
- [ ] Performance remains stable
- [ ] Visual feedback is clear and satisfying

## Files to Modify

### Primary Implementation
- `js/vibe-survivor-game.js`
  - Boss spawn functions: Add `catchUpDashState` property
  - `handleBossTeleport()` function: Replace teleport with dash logic
  - Boss update loop: Add skip logic for normal AI during dash

### Secondary (For Consistency)
- `js/systems/gameplay/enemies/enemy-system.js`
  - May have duplicate boss logic that needs similar updates
  - Check for boss spawn and update functions

## Expected Behavior After Implementation

1. Player runs >800 units from boss
2. Boss displays particle burst at current position
3. Boss rapidly dashes toward calculated target point with visible particle trail
4. Boss arrives at approximately 100 units from player (clearly visible on screen)
5. Particle burst and screen shake effect on arrival
6. Boss resumes normal attack and movement patterns
7. If player runs away again, dash can re-trigger

## Common Pitfalls to Avoid

1. **Boss doesn't move close enough**: Check distance calculations, ensure using correct units
2. **Boss freezes after dash**: Must resume normal AI, check for missing state reset
3. **Boss position gets overridden**: Ensure normal AI is skipped during dash
4. **Dash never completes**: Check completion condition math (squared distance!)
5. **State not initialized**: All boss spawn functions must add the property
6. **Multiple dashes interfere**: Check that dash only initializes when not already active

## Success Criteria

The implementation is successful when:
- Boss visibly dashes (not teleports) when player is too far
- Boss arrives close enough to be on screen (approximately 100 units)
- Visual effects are clear and impactful
- Boss behavior returns to normal after dash
- Game balance is improved (player can't escape indefinitely)
