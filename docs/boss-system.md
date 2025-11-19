## Boss System Reference

This document summarizes how bosses are spawned, scaled, and upgraded after the initial 11-variant loop so balance tweaks can be made without digging through multiple files.

### Variant Loop and Cycles
- Boss variants are defined in `js/config/constants.js` (`BOSS_VARIANTS`).
- `getBossVariantForLevel(level)` chooses a variant by taking `(level - 1) % BOSS_VARIANTS.length`, so the 12th boss restarts the lineup.
- `bossLevel` increments each time a boss dies; the helper `getBossCycle(level)` in `js/vibe-survivor-game.js` divides the level by the variant count to figure out which loop (cycle) the player is on.

### Core Stat Scaling
All real scaling happens at spawn time (`spawnScaledBossImmediate`):
- Health multiplies by `1.4^bossesKilled` on top of an effective base HP of `4000 * BOSS_HEALTH_MULTIPLIER`.
- Speed, size, and contact damage multiply by `1.05^bossesKilled`, `1.05^bossesKilled`, and `1.15^bossesKilled` respectively.
- Time-based difficulty stops after the first boss; only boss kill count affects these values in later loops.

### Missile Patterns
`createBossMissile()` dispatches to the correct variant pattern (Pulse Hunter, Shock Sentinel, etc.) and now always calls `applyBossCycleMissileBonus()` afterward.

- `applyBossCycleMissileBonus()` is cycle-aware and only adds extra volleys during cycle ≥ 1 (the second loop).
- For each additional cycle it spawns:
  - Up to four expanding radial rings of non-homing shots whose count, speed, and damage increase with the cycle number.
  - A set of homing “lances” aimed across the player’s position with higher speed and homing strength each cycle.
- Attack pattern selection happens first, so the bonus volleys stack on top of the variant’s native missiles.

### Dash Behavior
Two bosses rely on dash states (Pulse Hunter and Rift Reaver). They call `getBossCycleDashMultiplier()` to increase dash speed by +25 % per cycle beyond the first. Cooldowns still scale with `bossesKilled`, but dash velocity now also reflects how deep into the loop the run is.

### Where to Adjust
- **Cycle math**: `getBossCycle()` and `getBossCycleDashMultiplier()` live near the boss spawn helpers in `js/vibe-survivor-game.js`.
- **Missile bonuses**: `applyBossCycleMissileBonus()` contains the radial-ring math and homing dart counts. Adjust ring counts, speed, or colors there.
- **Dash speed/cooldown**: `updatePulseHunterMovement()` and `updateRiftReaverMovement()` multiply their dash speeds by `getBossCycleDashMultiplier()`. Dash cooldown reduction only applies during the first cycle (driven by `this.bossesKilled`) to keep later loops from chaining unavoidable dashes.
- **Base scaling**: `spawnScaledBossImmediate()` centralizes the exponential stat growth. Tweak the `fastPow` bases (1.4/1.05/1.15) for broad difficulty changes.

Use this reference as a quick map when rebalancing bosses between cycles. Any new behavior that should scale per loop can plug into the cycle helpers rather than duplicating the modulo logic.
