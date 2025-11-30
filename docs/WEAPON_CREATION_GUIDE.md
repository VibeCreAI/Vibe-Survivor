# Weapon Creation Guide

**Last Updated**: 2025-11-27 (Icon mapping locations update)
**Based On**: Napalm Buckshot implementation experience

This comprehensive guide covers creating both **standalone weapons** and **merge weapons** in Vibe Survivor. Following this guide will help avoid common mistakes and reduce debugging time.

---

## Table of Contents

1. [Weapon Type Overview](#weapon-type-overview)
2. [Standalone Weapon Guide](#standalone-weapon-guide)
3. [Merge Weapon Guide](#merge-weapon-guide)
4. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
5. [Testing Checklist](#testing-checklist)
6. [Reference: File Locations](#reference-file-locations)

---

## Weapon Type Overview

### Standalone Weapons
- Available from the start in level-up choices
- No parent weapons required
- Simpler implementation (no merge recipes)
- Examples: Basic Missile, Shotgun, Laser Beam, Flamethrower

### Merge Weapons
- Created by merging 2 parent weapons at specific levels
- Usually more powerful than standalone weapons
- Require merge recipe implementation
- Examples: Homing Laser, Shockburst, Gatling Gun, Napalm Buckshot

### Key Differences Comparison

| Aspect | Standalone Weapon | Merge Weapon |
|--------|------------------|--------------|
| **Availability** | From game start | After merging 2 parents |
| **Configuration** | No `isMergeWeapon` flag | `isMergeWeapon: true` |
| **Merge Recipe** | Not needed | Required in `checkMerge()` |
| **Modal Placement** | Basic weapons section | Merge weapons section |
| **Recipe Translation** | Not needed | Needs recipe text (EN/KR) |
| **Complexity** | ~24 steps | ~31 steps |
| **Power Level** | Moderate | Usually stronger |

**Quick Decision**: If the weapon should be a combo of two existing weapons with enhanced mechanics, make it a merge weapon. Otherwise, make it standalone.

---

## Standalone Weapon Guide

Creating a standalone weapon is simpler than a merge weapon. Follow these steps:

### Pre-Implementation Checklist

#### Assets Required
- [ ] **Weapon icon** - PNG file at `images/weapons/[WeaponName].png`
- [ ] **Weapon sound** - MP3 file at `sound/weapon/[WeaponName].mp3`
- [ ] **Naming convention**: Use PascalCase for file names (e.g., `FrostRay.png`)

#### Design Decisions
- [ ] **Weapon role**: Single-target? AOE? Crowd control? Sustained DPS?
- [ ] **Special mechanics**: DOT? Piercing? Instant? Chain attacks? Homing?
- [ ] **Balance values**: Damage, fire rate, range, projectile speed, special values
- [ ] **Visual style**: Projectile color, effects, trail, impact

#### Translations Needed
- [ ] **English name** and **description**
- [ ] **Korean name** and **description**

### Implementation Steps

#### Step 1: Add Weapon Configuration

**File**: `js/config/constants.js`

Add weapon stats to the `WEAPONS` object:

```javascript
WEAPON_NAME: {
    name: 'Weapon Display Name',
    damage: 20,              // Base damage per hit
    fireRate: 40,            // Frames between shots (60 = 1 second)
    range: 250,              // Maximum effective range
    projectileSpeed: 6,      // Speed of projectiles
    piercing: 0              // 0 = no pierce, 999 = infinite pierce

    // DO NOT include isMergeWeapon for standalone weapons
}
```

**⚠️ Note**: Do NOT set `isMergeWeapon: true` for standalone weapons.

#### Step 2: Register Assets

**File**: `js/config/assets.js`

Add icon and sound paths exactly like merge weapons:

```javascript
// In ASSET_PATHS.weapons
weaponName: 'images/weapons/WeaponName.png'

// In ASSET_PATHS.audio
weaponWeaponName: 'sound/weapon/WeaponName.mp3?v=2'
```

#### Step 3: Implement Firing Logic

**File**: `js/systems/gameplay/weapons/weapon-base.js`

Add weapon case and firing method (same as merge weapons):

```javascript
// In fireWeapon() method
case 'weapon_name':
    this.createWeaponNameAttack(weapon, dx, dy, nearestDistance, context);
    break;

// Create firing method
createWeaponNameAttack(weapon, dx, dy, distance, context) {
    // Implementation here (same as merge weapons)
}
```

#### Step 4: Add Weapon Sound Mapping

**File**: `js/systems/gameplay/weapons/weapon-base.js`

```javascript
// In getWeaponSound()
case 'weapon_name':
    return 'weaponWeaponName';
```

#### Step 5: Add Projectile Rendering

**File**: `js/vibe-survivor-game.js`

Add rendering case in `drawProjectiles()` method (same as merge weapons).

#### Step 6: Add All UI Integrations

**CRITICAL**: Complete all translation and icon mappings.

**Translations** in `vibe-survivor-game.js`:
```javascript
// English (~line 13728)
weaponName: "Weapon Name",
weaponNameDesc: "Description"

// Korean (~line 13881)
weaponName: "무기 이름",
weaponNameDesc: "설명"

// English help (~line 13969)
weaponNameDesc: "Description for help menu"

// Korean help (~line 14124)
weaponNameDesc: "도움말 설명"
```

**Icon Mappings** in `vibe-survivor-game.js`:
```javascript
// getWeaponName (~line 8634)
'weapon_name': 'weaponName'

// getWeaponIcon (~line 8675)
'weapon_name': 'weaponName'

// getWeaponIconForHeader (~line 8726)
'weapon_name': 'weaponName'
```

**Guide Modal** - `js/systems/ui/modals/guide-modal.js`:

Add to **basic weapons** section instead of merge weapons:

```javascript
// In getOrderedBasicWeapons()
{ type: 'weapon_name', description: 'Description' }
```

**Help Menu** - `js/systems/ui/modals/help-menu.js`:

Add to **basic weapons** section:

```javascript
// In basic weapons list
{ type: 'weapon_name', description: 'Description' }

// Also add name and icon mappings (same as merge weapons)
```

### Standalone Weapon Checklist

```
□ 1.  Created weapon icon at images/weapons/[Name].png
□ 2.  Created weapon sound at sound/weapon/[Name].mp3
□ 3.  Added weapon stats to WEAPONS in constants.js (NO isMergeWeapon!)
□ 4.  Added icon to ASSET_PATHS.weapons in assets.js
□ 5.  Added sound to ASSET_PATHS.audio in assets.js
□ 6.  Added firing case to fireWeapon() in weapon-base.js
□ 7.  Created firing method in weapon-base.js
□ 8.  Added sound mapping to getWeaponSound() in weapon-base.js
□ 9.  Extended projectile properties if needed (projectiles.js)
□ 10. Added hit detection logic if needed (physics.js)
□ 11. Added DOT processing if needed (enemy-system.js)
□ 12. Added special damage scaling if needed (weapon-base.js)
□ 13. Added projectile rendering case (vibe-survivor-game.js)
□ 14. Added enemy visual effects if needed (vibe-survivor-game.js)
□ 15. Added English weapon translations (vibe-survivor-game.js)
□ 16. Added Korean weapon translations (vibe-survivor-game.js)
□ 17. Added English help translations (vibe-survivor-game.js)
□ 18. Added Korean help translations (vibe-survivor-game.js)
□ 19. Added weapon name mapping (vibe-survivor-game.js)
□ 20. Added weapon icon mapping in getWeaponIcon (vibe-survivor-game.js)
□ 21. Added weapon icon mapping in getWeaponIconForHeader (vibe-survivor-game.js)
□ 22. Added weapon icon mapping in generateWeaponsSection (vibe-survivor-game.js)
□ 23. Added weapon icon mapping in score-detail-modal.js
□ 24. Added to BASIC weapons in guide-modal.js
□ 25. Added to BASIC weapons in help-menu.js
□ 26. Added name and icon mappings in help-menu.js
□ 27. Tested all items in Testing Checklist
```

**⚠️ Key Difference from Merge Weapons**:
- Standalone weapons go in **BASIC weapons** arrays
- Merge weapons go in **MERGE weapons** arrays
- No merge recipe code needed
- No `isMergeWeapon: true` flag

---

## Merge Weapon Guide

Creating merge weapons is more complex than standalone weapons due to merge recipe requirements.

### Pre-Implementation Checklist

Before writing any code, prepare these assets and decisions:

### Assets Required
- [ ] **Weapon icon** - PNG file at `images/weapons/[WeaponName].png`
- [ ] **Weapon sound** - MP3 file at `sound/weapon/[WeaponName].mp3`
- [ ] **Naming convention**: Use PascalCase for file names (e.g., `NapalmBuckshot.png`)

### Design Decisions
- [ ] **Parent weapons**: Which 2 weapons merge to create this? (e.g., Shotgun + Flamethrower)
- [ ] **Minimum levels**: What level do parent weapons need? (usually level 3)
- [ ] **Weapon role**: Boss killer? Crowd control? Single-target? AOE?
- [ ] **Special mechanics**: DOT? Explosions? Homing? Chain attacks? Ground effects?
- [ ] **Balance values**: Damage, fire rate, range, projectile speed, special values

### Translations Needed
- [ ] **English name** (e.g., "Napalm Buckshot")
- [ ] **English description** (short, 1 sentence)
- [ ] **Korean name** (e.g., "네이팜 산탄")
- [ ] **Korean description**
- [ ] **Merge recipe text** in both languages

---

## Step-by-Step Implementation

Follow these steps **IN ORDER** to avoid missing critical integrations.

---

### Step 1: Add Weapon Configuration

**File**: `js/config/constants.js`

1. Add weapon stats to the `WEAPONS` object (around line 350):

```javascript
WEAPON_NAME: {
    name: 'Weapon Display Name',
    damage: 15,              // Base damage per hit
    fireRate: 60,            // Frames between shots (60 = 1 second at 60 FPS)
    range: 300,              // Maximum effective range
    projectileSpeed: 8,      // Speed of projectiles
    piercing: 0,             // 0 = no pierce, 999 = infinite pierce
    isMergeWeapon: true,     // CRITICAL: Mark as merge weapon

    // Optional special properties
    pelletCount: 5,          // For shotgun-style weapons
    burnDamage: 10,          // For DOT weapons (damage per tick)
    burnDuration: 180,       // For DOT weapons (frames)
    maxBurnStacks: 5,        // For stacking DOT
    explosionRadius: 80,     // For AOE weapons
    homing: true,            // For homing weapons
    chainCount: 3            // For chain weapons
}
```

**⚠️ Important Notes**:
- Choose `fireRate` carefully: 60 = 1 sec, 30 = 0.5 sec, 120 = 2 sec
- `range` and `projectileSpeed` work together - ensure projectile life can cover the range
- If weapon has special scaling (like burn damage), you'll add scaling logic later

---

### Step 2: Register Assets

**File**: `js/config/assets.js`

1. Add weapon icon to `ASSET_PATHS.weapons` (around line 30):

```javascript
weaponName: 'images/weapons/WeaponName.png'
```

2. Add weapon sound to `ASSET_PATHS.audio` (around line 81):

```javascript
weaponWeaponName: 'sound/weapon/WeaponName.mp3?v=2'
```

**⚠️ Naming Convention**:
- Icon key: camelCase (e.g., `napalmBuckshot`)
- Sound key: `weapon` + PascalCase (e.g., `weaponNapalmBuckshot`)
- The `?v=2` cache buster should match existing entries

---

### Step 3: Add Merge Recipe

**File**: `js/systems/gameplay/weapons/weapon-base.js`

1. Add merge recipe logic to `checkMerge()` method (around line 152):

```javascript
// Check for [Weapon A] + [Weapon B] merge
if ((weapon1.type === 'weapon_a' && weapon2.type === 'weapon_b' &&
     weapon1.level >= 3 && weapon2.level >= 3) ||
    (weapon1.type === 'weapon_b' && weapon2.type === 'weapon_a' &&
     weapon1.level >= 3 && weapon2.level >= 3)) {
    return 'weapon_name';  // Use snake_case here
}
```

**⚠️ Important**:
- Check BOTH orderings (A+B and B+A)
- Use snake_case for weapon type (e.g., `napalm_buckshot`)
- Verify parent weapon types match their actual type strings

---

### Step 4: Implement Firing Logic

**File**: `js/systems/gameplay/weapons/weapon-base.js`

1. Add weapon case to `fireWeapon()` method (around line 300):

```javascript
case 'weapon_name':
    this.createWeaponNameAttack(weapon, dx, dy, nearestDistance, context);
    break;
```

2. Create the weapon firing method (add around line 850):

```javascript
/**
 * Creates [weapon name] attack with [description]
 * @private
 */
createWeaponNameAttack(weapon, dx, dy, distance, context) {
    const { player, fastCos, fastSin, getPooledProjectile, addProjectile } = context;
    const angle = Math.atan2(dy, dx);

    // Your weapon-specific logic here
    const projectile = getPooledProjectile();

    projectile.x = player.x;
    projectile.y = player.y;
    projectile.vx = fastCos(angle) * weapon.projectileSpeed;
    projectile.vy = fastSin(angle) * weapon.projectileSpeed;
    projectile.damage = weapon.damage;
    projectile.life = 120;  // Adjust based on range ÷ speed
    projectile.type = 'weapon_type';  // Custom type for rendering
    projectile.color = '#FF0000';
    projectile.size = 4;
    projectile.sourceType = weapon.type;

    // Add special properties if needed
    projectile.isSpecial = true;
    projectile.specialValue = weapon.specialValue || 10;

    addProjectile(projectile);
}
```

**⚠️ Projectile Life Calculation**:
- Formula: `life = range ÷ projectileSpeed`
- Example: range 320, speed 10 → life = 32 minimum, use ~160 for safety

---

### Step 5: Add Weapon Sound Mapping

**File**: `js/systems/gameplay/weapons/weapon-base.js`

1. Add to `getWeaponSound()` method (around line 911):

```javascript
case 'weapon_name':
    return 'weaponWeaponName';
```

**⚠️ Sound Key Format**: Must match the key in `ASSET_PATHS.audio` (e.g., `weaponNapalmBuckshot`)

---

### Step 6: Extend Projectile System (If Custom Type)

**File**: `js/systems/gameplay/weapons/projectiles.js`

**Only needed if your weapon has special projectile properties.**

1. Add properties to `createProjectileObject()` (around line 52):

```javascript
specialProperty: 0,
isSpecialType: false
```

2. Reset properties in `returnToPool()` (around line 91):

```javascript
projectile.specialProperty = 0;
projectile.isSpecialType = false;
```

---

### Step 7: Add Collision/Hit Detection Logic (If Special Mechanics)

**File**: `js/core/physics.js`

**Only needed for special mechanics like DOT, explosions, debuffs.**

Example for DOT/burn mechanics (around line 223):

```javascript
} else if (projectile.isSpecialType && projectile.specialDamage) {
    // Initialize special effect tracking
    if (!enemy.specialEffects) {
        enemy.specialEffects = [];
    }

    // Apply new effect stack
    const maxStacks = projectile.maxStacks || 5;
    if (enemy.specialEffects.length < maxStacks) {
        enemy.specialEffects.push({
            damage: projectile.specialDamage,
            duration: projectile.effectDuration,
            sourceType: projectile.sourceType
        });
    } else {
        // Refresh oldest stack
        enemy.specialEffects[0].duration = Math.max(
            enemy.specialEffects[0].duration,
            projectile.effectDuration
        );
    }
}
```

---

### Step 8: Add DOT Processing (If Applicable)

**File**: `js/systems/gameplay/enemies/enemy-system.js`

**Only needed for damage-over-time effects.**

Add processing in `updateEnemies()` method (around line 941):

```javascript
// Process special effect stacks
if (enemy.specialEffects && enemy.specialEffects.length > 0) {
    // Apply damage every N frames (e.g., 20 frames = 3 times/second)
    if (frameCount % 20 === 0) {
        let totalDamage = 0;

        for (const effect of enemy.specialEffects) {
            totalDamage += effect.damage;
            if (effect.sourceType && recordWeaponDamage) {
                recordWeaponDamage(effect.sourceType, effect.damage, enemy);
            }
        }

        enemy.health -= totalDamage;

        // Visual feedback
        if (createHitParticles) {
            const color = enemy.specialEffects.length >= 4 ? '#FF0000' : '#FF6347';
            createHitParticles(enemy.x, enemy.y, color);
        }
    }

    // Decrement durations and remove expired effects
    enemy.specialEffects = enemy.specialEffects.filter(effect => {
        effect.duration--;
        return effect.duration > 0;
    });
}
```

---

### Step 9: Add Special Damage Scaling (If Applicable)

**File**: `js/systems/gameplay/weapons/weapon-base.js`

If your weapon has special damage properties (burn, poison, etc.), add scaling to `upgradeWeapon()` (around line 73):

```javascript
// Scale special damage for weapons with DOT/effects (same 30% scaling as base damage)
if (weapon.specialDamage) {
    weapon.specialDamage = Math.floor(weapon.specialDamage * (1 + WEAPON_UPGRADES.DAMAGE_PER_LEVEL));
}
```

**⚠️ Critical**: Without this, your special damage won't scale with weapon level!

---

### Step 10: Add Projectile Rendering

**File**: `js/vibe-survivor-game.js`

Add rendering case in `drawProjectiles()` method (around line 12210):

```javascript
case 'weapon_type':
    // Weapon-specific rendering
    this.ctx.save();
    this.ctx.globalAlpha = 0.8;

    // Example: Projectile with trail
    const trailLength = 5;
    const trailX = projectile.x - projectile.vx * trailLength;
    const trailY = projectile.y - projectile.vy * trailLength;

    const gradient = this.ctx.createLinearGradient(
        trailX, trailY, projectile.x, projectile.y
    );
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.9)');

    this.ctx.beginPath();
    this.ctx.moveTo(trailX, trailY);
    this.ctx.lineTo(projectile.x, projectile.y);
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = projectile.size * 2;
    this.ctx.stroke();

    // Draw projectile
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = projectile.color;
    this.ctx.beginPath();
    this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
    break;
```

---

### Step 11: Add Enemy Visual Effects (If Applicable)

**File**: `js/vibe-survivor-game.js`

**CRITICAL**: Add effects to BOTH basic enemies AND special enemies (bosses/tanks).

#### For Basic Enemies (around line 11718):

```javascript
// Special effect aura (e.g., burning, poison)
if (enemy.specialEffects && enemy.specialEffects.length > 0) {
    const stackCount = enemy.specialEffects.length;
    const pulsePhase = Math.sin(this.frameCount * 0.15);
    const baseSize = 6 + stackCount * 2;
    const pulseSize = baseSize + pulsePhase * 3;

    this.ctx.save();

    // Outer effect ring
    this.ctx.globalAlpha = 0.15 + (stackCount / 40);  // Low opacity to see enemy
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r + pulseSize, 0, Math.PI * 2);
    this.ctx.fillStyle = stackCount >= 4 ? '#FF0000' : '#FF6347';
    this.ctx.fill();

    // Inner effect ring
    this.ctx.globalAlpha = 0.12 + (stackCount / 50);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r + pulseSize * 0.6, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFA500';
    this.ctx.fill();

    this.ctx.restore();

    // Spawn particles for high stacks
    if (this.frameCount % 6 === 0 && stackCount >= 3) {
        for (let p = 0; p < Math.floor(stackCount / 2); p++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = r + Math.random() * 12;
            this.createHitParticles(
                enemy.x + Math.cos(angle) * dist,
                enemy.y + Math.sin(angle) * dist,
                stackCount >= 5 ? '#FF0000' : '#FF6347'
            );
        }
    }
}
```

#### For Special Enemies (Bosses/Tanks) (around line 11869):

**⚠️ CRITICAL**: Copy the same visual effect code but adjust sizing for larger enemies:

```javascript
// Special effect aura for bosses/tanks (larger sizing)
if (enemy.specialEffects && enemy.specialEffects.length > 0) {
    const stackCount = enemy.specialEffects.length;
    const r = enemy.renderRadius || enemy.radius || 20;

    const pulsePhase = Math.sin(this.frameCount * 0.15);
    const baseSize = 8 + stackCount * 3;  // Larger for bosses
    const pulseSize = baseSize + pulsePhase * 4;

    // ... (same rendering code as above, but with larger values)
}
```

---

### Step 12: Add All UI Integrations

**This is where most bugs occur!** Complete ALL of these substeps.

#### 12a. Add Translations (vibe-survivor-game.js)

**English translations** (around line 13728):

```javascript
// In englishTranslations.weapons
weaponName: "Weapon Display Name",
weaponNameDesc: "Short description of weapon mechanics"
```

**Korean translations** (around line 13881):

```javascript
// In koreanTranslations.weapons
weaponName: "무기 이름",
weaponNameDesc: "무기 설명"
```

**English help** (around line 13969):

```javascript
// In englishTranslations.helpWeapons
weaponNameRecipe: "Parent1 lvl 3 + Parent2 lvl 3",
weaponNameDesc: "Description of what it does",
```

**Korean help** (around line 14124):

```javascript
// In koreanTranslations.helpWeapons
weaponNameRecipe: "부모무기1 레벨 3 + 부모무기2 레벨 3",
weaponNameDesc: "무기 설명",
```

#### 12b. Add Weapon Name Mapping (vibe-survivor-game.js)

**Around line 8634** in `getWeaponName()`:

```javascript
const weaponNameMap = {
    // ... existing mappings
    'weapon_name': 'weaponName'  // snake_case → camelCase
};
```

**⚠️ Missing this causes "Unknown Weapon" in level-up modal!**

#### 12c. Add Icon Mappings (Multiple Locations)

**⚠️ CRITICAL**: Icon mappings are needed in FOUR locations for different modals!

**Location 1 - vibe-survivor-game.js (~line 8675)** in `getWeaponIcon()`:

```javascript
const iconMap = {
    // ... existing mappings
    'weapon_name': 'weaponName'  // snake_case → camelCase
};
```

**Location 2 - vibe-survivor-game.js (~line 8726)** in `getWeaponIconForHeader()`:

```javascript
const iconMap = {
    // ... existing mappings
    'weapon_name': 'weaponName'  // snake_case → camelCase
};
```

**Location 3 - vibe-survivor-game.js (~line 12792)** in `generateWeaponsSection()`:

```javascript
const weaponIconMap = {
    // ... existing mappings
    'weapon_name': 'weaponName'  // snake_case → camelCase
};
```

**Location 4 - js/systems/ui/modals/score-detail-modal.js (~line 217)**:

```javascript
const weaponIconMap = {
    // ... existing mappings
    'weapon_name': 'weaponName'  // snake_case → camelCase
};
```

**Where each mapping is used**:
- Location 1: Level-up modal weapon choices
- Location 2: HUD header weapon display
- Location 3: Victory modal, Help modal status tab, Level-up status tab, Chest modal status tab
- Location 4: Game Over modal weapons section

#### 12d. Add to Guide Modal

**File**: `js/systems/ui/modals/guide-modal.js`

**Around line 17**, add weapon key constant:

```javascript
const WEAPON_KEYS = {
    // ... existing keys
    WEAPON_NAME: 'weapon_name'
};
```

**Around line 369**, add to fallback merge weapons array:

```javascript
{
    type: 'weapon_name',
    recipe: 'Parent1 lvl 3 + Parent2 lvl 3',
    description: 'Description of mechanics.'
}
```

**Around line 378**, add to translated merge weapons array:

```javascript
{
    type: 'weapon_name',
    recipe: t('weaponNameRecipe'),
    description: t('weaponNameDesc')
}
```

#### 12e. Add to Help Menu

**File**: `js/systems/ui/modals/help-menu.js`

**Around line 37**, add weapon key constant:

```javascript
const WEAPON_KEYS = {
    // ... existing keys
    WEAPON_NAME: 'weapon_name'
};
```

**Around line 469**, add to merge weapons list:

```javascript
{
    type: 'weapon_name',
    recipe: 'Parent1 lvl 3 + Parent2 lvl 3',
    description: 'Description.'
}
```

**Around line 533**, add to name mapping:

```javascript
'weapon_name': 'weaponName'
```

**Around line 571**, add to icon mapping:

```javascript
'weapon_name': 'weaponName'
```

---

#### 12f. Add to Level-Up Modal Guide Tab

**File**: `js/systems/ui/modals/level-up.js`

**Around the `renderGuidePane()` merger list**, add a new recipe card with icon, name, recipe, and description (reuse the same translation keys used in Help → Weapons tab):

```javascript
const napalmName = t('napalmBuckshot', 'weapons');
const napalmRecipe = t('napalmBuckshotRecipe', 'help');
const napalmDesc = t('napalmBuckshotDesc', 'help');

// In the guidePane markup
<div class="merge-recipe">
    <h3><img src="images/weapons/napalmBuckshot.png" alt="Napalm Buckshot"> ${napalmName}</h3>
    <p>${napalmRecipe}</p>
    <span class="recipe-desc">${napalmDesc}</span>
</div>
```

**Tip**: Keep Level-Up Guide, Help → Weapons tab, and Guide modal merger lists in sync.

---

## Common Pitfalls & Solutions

### Issue: "Unknown Weapon" in Level-Up Modal
**Cause**: Missing entry in `getWeaponName()` weapon name mapping
**Solution**: Add mapping in `js/vibe-survivor-game.js:8634`

### Issue: Missing Weapon Icon in HUD/Modals
**Cause**: Missing icon mappings in one or more of the FOUR required locations
**Solution**: Add mappings in ALL four locations:
- `js/vibe-survivor-game.js:8675` (getWeaponIcon) - Breaks: Level-up modal weapon choices
- `js/vibe-survivor-game.js:8726` (getWeaponIconForHeader) - Breaks: HUD header weapon display
- `js/vibe-survivor-game.js:12792` (generateWeaponsSection) - Breaks: Victory modal, Help modal status tab, Level-up status tab, Chest modal status tab
- `js/systems/ui/modals/score-detail-modal.js:217` (weaponIconMap) - Breaks: Game Over modal weapons section

**⚠️ Critical**: Each location controls different UI elements. Missing even ONE causes icons to fall back to Basic Missile in specific modals!

### Issue: Weapon Missing from Guide/Help Modals
**Cause**: Not added to modal weapon lists
**Solution**: Add to `guide-modal.js`, `help-menu.js`, and Level-Up Guide tab (`js/systems/ui/modals/level-up.js`)

### Issue: Visual Effects Only on Basic Enemies
**Cause**: Only added effects to basic enemy rendering, not special types
**Solution**: Add same effects to BOTH basic AND special enemy rendering sections

### Issue: Assets Not Loading in Incognito Mode
**Cause**: Hardcoded asset paths instead of using ASSET_PATHS
**Solution**: Always use `ASSET_PATHS.weapons[iconName]` and `ASSET_PATHS.audio[soundName]`

### Issue: Special Damage Doesn't Scale
**Cause**: Forgot to add special damage scaling in `upgradeWeapon()`
**Solution**: Add scaling for `burnDamage`, `poisonDamage`, or other special properties

### Issue: Projectiles Disappear Before Reaching Target
**Cause**: Projectile `life` too low for `range`
**Solution**: Calculate life = range ÷ speed, then add 20-30% buffer

### Issue: Weapon Range Feels Wrong
**Cause**: Mismatch between intended role and range/speed values
**Solution**: Compare to similar weapons, consider weapon's role (boss killer needs more range)

### Issue: Burn/DOT Effects Too Weak or Too Strong
**Cause**: Wrong tick rate or damage values
**Solution**:
- Tick every 20 frames (3x/sec) is standard
- Total DPS = tickDamage × ticksPerSecond × maxStacks
- Example: 12 dmg/tick × 3/sec × 6 stacks = 216 DPS

---

## Testing Checklist

After implementation, test these scenarios:

### Basic Functionality
- [ ] Weapon appears in level-up choices after merging parents
- [ ] Weapon icon displays correctly in all modals
- [ ] Weapon name shows correctly (not "Unknown Weapon")
- [ ] Weapon fires when expected (within range, on cooldown)
- [ ] Projectiles render with correct visuals
- [ ] Sound plays when weapon fires
- [ ] Weapon appears in Guide modal with correct recipe
- [ ] Weapon appears in Help modal with correct info

### Progression & Scaling
- [ ] Weapon damage increases with level
- [ ] Special damage (burn/DOT) increases with level
- [ ] Projectile count increases with level (if applicable)
- [ ] Weapon feels appropriately powerful for a merge weapon

### Visual Effects
- [ ] Projectiles render correctly
- [ ] Visual effects appear on basic enemies
- [ ] Visual effects appear on bosses and tank enemies
- [ ] Effect intensity scales with stacks/power
- [ ] Enemies remain visible through effects (not too opaque)

### Special Mechanics
- [ ] DOT/burn damage applies correctly
- [ ] Stacks accumulate properly up to max
- [ ] Effects expire after duration
- [ ] Damage is attributed to correct weapon (for stats)
- [ ] Visual feedback matches effect strength

### Edge Cases
- [ ] Test in incognito mode (asset loading)
- [ ] Test with multiple instances of weapon
- [ ] Test merging at different parent levels
- [ ] Test against all enemy types (basic, tank, boss)
- [ ] Test at very high weapon levels (10+)

### Performance
- [ ] No FPS drops with many projectiles
- [ ] No FPS drops with many enemies with effects
- [ ] Visual effects use appropriate opacity/particle counts

---

## Reference: File Locations

### Core Configuration
- `js/config/constants.js` - Weapon stats, balance values
- `js/config/assets.js` - Asset paths (images, sounds)

### Weapon Logic
- `js/systems/gameplay/weapons/weapon-base.js` - Merge recipes, firing logic, upgrades, sounds
- `js/systems/gameplay/weapons/projectiles.js` - Projectile object pool, properties
- `js/core/physics.js` - Collision detection, hit effects

### Enemy System
- `js/systems/gameplay/enemies/enemy-system.js` - DOT processing, effect updates

### Visual Rendering
- `js/vibe-survivor-game.js` - Projectile rendering, enemy effects, translations, icon mappings

### UI Modals
- `js/systems/ui/modals/guide-modal.js` - Guide modal weapon list
- `js/systems/ui/modals/help-menu.js` - Help menu weapon list

### Assets
- `images/weapons/` - Weapon icons
- `sound/weapon/` - Weapon sound effects

---

## Quick Reference: Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Weapon type (code) | snake_case | `napalm_buckshot` |
| Asset file names | PascalCase | `NapalmBuckshot.png` |
| Translation keys | camelCase | `napalmBuckshot` |
| Sound keys | weapon + PascalCase | `weaponNapalmBuckshot` |
| WEAPON constant | SCREAMING_SNAKE | `NAPALM_BUCKSHOT` |
| Function names | camelCase | `createNapalmBlast()` |

---

## Example: Complete Checklist for New Weapon

Use this checklist when creating a new merge weapon:

```
□ 1.  Created weapon icon at images/weapons/[Name].png
□ 2.  Created weapon sound at sound/weapon/[Name].mp3
□ 3.  Added weapon stats to WEAPONS in constants.js
□ 4.  Added icon to ASSET_PATHS.weapons in assets.js
□ 5.  Added sound to ASSET_PATHS.audio in assets.js
□ 6.  Added merge recipe to checkMerge() in weapon-base.js
□ 7.  Added firing case to fireWeapon() in weapon-base.js
□ 8.  Created firing method (e.g., createNapalmBlast()) in weapon-base.js
□ 9.  Added sound mapping to getWeaponSound() in weapon-base.js
□ 10. Extended projectile properties if needed (projectiles.js)
□ 11. Added hit detection logic if needed (physics.js)
□ 12. Added DOT processing if needed (enemy-system.js)
□ 13. Added special damage scaling if needed (weapon-base.js)
□ 14. Added projectile rendering case (vibe-survivor-game.js)
□ 15. Added enemy visual effects for BASIC enemies (vibe-survivor-game.js)
□ 16. Added enemy visual effects for SPECIAL enemies (vibe-survivor-game.js)
□ 17. Added English weapon translations (vibe-survivor-game.js:~13728)
□ 18. Added Korean weapon translations (vibe-survivor-game.js:~13881)
□ 19. Added English help translations (vibe-survivor-game.js:~13969)
□ 20. Added Korean help translations (vibe-survivor-game.js:~14124)
□ 21. Added weapon name mapping (vibe-survivor-game.js:~8634)
□ 22. Added weapon icon mapping in getWeaponIcon (vibe-survivor-game.js:~8675)
□ 23. Added weapon icon mapping in getWeaponIconForHeader (vibe-survivor-game.js:~8726)
□ 24. Added weapon icon mapping in generateWeaponsSection (vibe-survivor-game.js:~12792)
□ 25. Added weapon icon mapping in score-detail-modal.js:~217
□ 26. Added weapon key constant to guide-modal.js
□ 27. Added weapon to guide modal fallback array (guide-modal.js)
□ 28. Added weapon to guide modal translated array (guide-modal.js)
□ 29. Added weapon key constant to help-menu.js
□ 30. Added weapon to help menu merge weapons list (help-menu.js)
□ 31. Added weapon name mapping in help-menu.js
□ 32. Added weapon icon mapping in help-menu.js
□ 33. Tested all items in Testing Checklist
```

---

## Final Notes

### Key Lessons Learned

**From Napalm Buckshot Implementation**:
1. **Don't forget UI integrations** - This is where 80% of bugs came from
2. **Add icon mappings in ALL FOUR locations** - Missing even one causes icons to break in specific modals
3. **Apply effects to ALL enemy types** - Basic AND special (bosses/tanks)
4. **Scale special damage too** - Don't just scale base damage
5. **Match projectile life to range** - life = range ÷ speed + buffer
6. **Use ASSET_PATHS everywhere** - For proper preloading
7. **Balance for weapon's role** - Boss killer needs range, crowd control needs AOE
8. **Keep effects visible** - Use low opacity so players can see enemies
9. **Test in incognito mode** - Catches asset loading issues

### Universal Tips (Both Weapon Types)

**Configuration**:
- Start with conservative balance values, iterate based on playtesting
- Fire rate sweet spot: 30-60 frames for most weapons
- Range should match weapon role (150 close, 250 medium, 350+ long)

**Visual Design**:
- Use distinct colors for different weapon types
- Trail effects help players track projectiles
- Particle density should scale with weapon power (not spam screen)

**Testing**:
- Always test against bosses, not just basic enemies
- Test at high weapon levels (10+) to catch scaling issues
- Verify translations display correctly in both languages

**Performance**:
- Reuse existing projectile types when possible
- Use object pooling for projectiles (already implemented)
- Keep particle counts reasonable (<50 active particles)

### Quick Reference

**Standalone Weapon**: Use when weapon is simple, available early, or doesn't logically combine two parents
**Merge Weapon**: Use when weapon combines mechanics from two parents, should be more powerful, or requires special unlock

**When in doubt**: Reference existing weapons:
- **Standalone examples**: Shotgun, Laser Beam, Flamethrower
- **Merge weapon example**: Napalm Buckshot (complete implementation)

Good luck creating your next weapon! 🎮🔥
