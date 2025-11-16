# Chest Upgrade System Implementation

## Overview
Adds upgrade chest pickups that spawn randomly every ~5 minutes. When collected, opens a modal with 3 passive upgrade choices. Includes gold arrow hints, particle effects, and spawn notifications. Passive upgrades removed from level-up menu (weapons only).

## Design Decisions
- **Passives**: Only in chests (removed from level-up)
- **Game Pause**: Yes, pause game when chest modal opens
- **Death Behavior**: Chest disappears on death
- **Effects**: Spawn notification, collection sound, particle effects

## Assets
- Icon: `images/passives/upgradeBox.png`
- Sound: `sound/upgradeBox.mp3`

---

## Implementation Checklist

### ✅ Phase 1: Configuration (COMPLETE)
- [x] Add `CHEST_ORB` to `PICKUP_SPAWNS` in constants.js
- [x] Add `CHEST_GLOW` to `COLORS` in constants.js
- [x] Spawn rate: 18000 frames (5 minutes)
- [x] Lifetime: 9000 frames (2.5 minutes)
- [x] Spawn distance: 400-1000 units

### ✅ Phase 2: Pickup System (COMPLETE)
- [x] Add chest spawn timer to PickupSystem constructor
- [x] Create `chestOrbPool` (size: 5) in vibe-survivor-game.js
- [x] Inject chest pool into PickupSystem.setPools()
- [x] Add `updateChestOrbs()` method - handles lifetime, collection, hints
- [x] Add `spawnChestOrbs()` method - timer-based spawning
- [x] Add `createChestOrb()` method - spawns at random location
- [x] Reset chest spawn timer in reset() method

### ✅ Phase 3: Modal System (COMPLETE)
- [x] Create `js/systems/ui/modals/chest-modal.js`
  - [x] Extend base Modal class
  - [x] Show 3 passive upgrade choices
  - [x] Keyboard navigation (arrow keys + enter)
  - [x] Scrollable content
  - [x] Pause game overlay
- [ ] Add chest modal HTML to vibe-survivor-game.js
- [ ] Add chest modal CSS styles

### ✅ Phase 4: Upgrade System (COMPLETE)
- [x] Modify `getUpgradeChoices()` in upgrades.js
  - [x] Add `upgradeType` parameter ('all', 'weapons', 'passives')
  - [x] Filter pool based on upgrade type
- [x] Update level-up modal to remove passives (weapons only)

### Phase 5: Rendering
- [ ] Add chest orb rendering in vibe-survivor-game.js
  - [ ] Use `upgradeBox.png` sprite
  - [ ] Gold pulsing glow effect
  - [ ] 30x30 pixel size
  - [ ] Rotation animation
- [ ] Add gold arrow hint in `drawPickupHint()`
  - [ ] Color: `#FFD700` (ACCENT_GOLD)
  - [ ] Same triangle shape as other hints
- [ ] Add spawn notification overlay
  - [ ] Text: "Upgrade Chest has appeared!"
  - [ ] Fade in/out over 3 seconds
  - [ ] Gold text with glow

### Phase 6: Particle Effects
- [ ] Gold sparkles around chest (continuous)
- [ ] Explosion burst on collection (20-30 particles)
- [ ] Use ParticleSystem

### Phase 7: Audio
- [ ] Add `upgradeBox` sound to AudioManager
- [ ] Play on chest spawn (sound/upgradeBox.mp3)
- [ ] Play on chest collection

### Phase 8: Integration
- [ ] Wire chest modal to ModalManager
- [ ] Add chest collection callback in game loop
- [ ] Call `showChestModal()` on collection
- [ ] Trigger spawn effects when chest created
- [ ] Add chest orbs to hint pulse system
- [ ] Handle chest cleanup on death/restart

### Phase 9: State Management
- [ ] Add `chestsCollected: 0` to player state
- [ ] Increment on collection
- [ ] Reset on death/restart
- [ ] Display in stats modal

### Phase 10: Testing
- [ ] Chest spawns after 5 minutes
- [ ] Only 1 chest on map at a time
- [ ] Gold arrow hint appears and pulses
- [ ] Collection opens chest modal
- [ ] Modal shows 3 passive choices
- [ ] Game pauses during modal
- [ ] Selection applies passive upgrade
- [ ] Spawn notification displays
- [ ] Particle effects trigger
- [ ] Sound effects play
- [ ] Level-up only shows weapons
- [ ] Chest disappears on death
- [ ] Chest disappears after 2.5 minutes

---

## Technical Details

### Chest Orb Pool Structure
```javascript
{
    x: 0,
    y: 0,
    life: 0,
    lifetime: 9000,
    glow: 0,
    active: false,
    __hintInitialized: false,
    hintVisible: false,
    hintFramesRemaining: 0
}
```

### Chest Modal HTML Structure
```html
<div id="chest-modal" class="chest-modal" style="display: none;">
    <div class="chest-content">
        <h2>UPGRADE CHEST</h2>
        <p class="chest-subtitle">Choose one passive upgrade</p>
        <div class="chest-scroll">
            <div class="chest-choices-container">
                <!-- 3 upgrade choices -->
            </div>
        </div>
        <p class="chest-hint">↑↓ Navigate • Enter Select</p>
    </div>
</div>
```

### Upgrade Choice Structure
```javascript
{
    type: 'passive',
    id: 'passive_health_boost',
    passiveKey: 'health_boost',
    passiveName: 'Health Boost',
    passiveDescription: '+25 Max Health',
    currentStacks: 2,
    maxStacks: Infinity
}
```

---

## Files Modified

### New Files
- `js/systems/ui/modals/chest-modal.js`

### Modified Files
- `js/config/constants.js` - Chest config & colors
- `js/systems/gameplay/pickups.js` - Chest spawn/collection
- `js/systems/gameplay/progression/upgrades.js` - Upgrade filtering
- `js/systems/ui/modals/level-up.js` - Weapons only
- `js/vibe-survivor-game.js` - Rendering, modal wiring, pool init, styles
- `js/core/state.js` - Chest stats tracking

---

## Progress Log

### 2025-11-15 - Initial Implementation
- ✅ Added chest spawn configuration to constants.js
- ✅ Created chest orb pool (size: 5) in vibe-survivor-game.js
- ✅ Added chest spawn timer and logic to pickups.js
- ✅ Implemented `updateChestOrbs()` for lifetime & collection
- ✅ Implemented `spawnChestOrbs()` for timed spawning
- ✅ Implemented `createChestOrb()` for random positioning
- ✅ Injected chest pool into PickupSystem.setPools()
- ✅ Created ChestModal class in chest-modal.js
- ✅ Modified UpgradeSystem.getUpgradeChoices() to support filtering
- ✅ Removed passives from level-up menu
- ✅ Wired chest modal to game loop
- ✅ Added chest spawn/update/collection logic
- ✅ Added getPooledChestOrb() method
- ✅ Added showChestModal() method
- 🔄 Continuing with rendering, effects, and finalization...

---

## Next Steps
1. Create ChestModal class in chest-modal.js
2. Modify UpgradeSystem.getUpgradeChoices() for filtering
3. Update level-up modal to use weapons only
4. Add chest rendering with upgradeBox.png sprite
5. Add gold arrow hints
6. Implement spawn notification overlay
7. Add particle effects
8. Wire audio with upgradeBox.mp3
9. Integrate modal into game loop
10. Test end-to-end
