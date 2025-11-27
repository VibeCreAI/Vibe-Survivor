// Asset paths and preloading configuration
// Extracted from vibe-survivor-game.js during Phase 3 refactoring

/**
 * Asset paths organized by category
 */
export const ASSET_PATHS = {
    sprites: {
        playerIdle: 'images/AI BOT-IDLE.png',
        playerUp: 'images/AI BOT-UP.png',
        playerDown: 'images/AI BOT-DOWN.png',
        playerLeft: 'images/AI BOT-LEFT.png',
        playerRight: 'images/AI BOT-RIGHT.png',
        aiBot: 'images/AI BOT.png'
    },
    weapons: {
        basicMissile: 'images/weapons/basicMissile.png',
        rapidFire: 'images/weapons/rapidFire.png',
        spreadShot: 'images/weapons/spreadShot.png',
        laserBeam: 'images/weapons/laserBeam.png',
        plasmaBolt: 'images/weapons/plasmaBolt.png',
        shotgun: 'images/weapons/shotgun.png',
        lightning: 'images/weapons/lightning.png',
        flamethrower: 'images/weapons/flamethrower.png',
        railgun: 'images/weapons/railgun.png',
        homingMissiles: 'images/weapons/homingMissiles.png',
        homingLaser: 'images/weapons/homingLaser.png',
        shockburst: 'images/weapons/shockburst.png',
        gatlingGun: 'images/weapons/gatlingGun.png',
        napalmBuckshot: 'images/weapons/napalmBuckshot.png'
    },
    passives: {
        healthBoost: 'images/passives/healthBoost.png',
        speedBoost: 'images/passives/speedBoost.png',
        regeneration: 'images/passives/regeneration.png',
        magnet: 'images/passives/magnet.png',
        armor: 'images/passives/armor.png',
        criticalStrike: 'images/passives/criticalStrike.png',
        dashBoost: 'images/passives/dashBoost.png',
        weaponFirerate: 'images/passives/weaponFirerate.png',
        weaponPower: 'images/passives/weaponPower.png',
        weaponProjectile: 'images/passives/weaponProjectile.png',
        weaponSize: 'images/passives/weaponSize.png',
        weaponSlot: 'images/passives/weaponSlot.png',
        upgrade: 'images/passives/upgrade.png',
        evolution: 'images/passives/evolution.png',
        passive: 'images/passives/passive.png',
        stats: 'images/passives/stats.png',
        upgradeBox: 'images/passives/upgradeBox.png'
    },
    ui: {
        title: 'images/Title.png',
        background: 'images/background.png',
        logo: 'images/VibeCreAI_Logo.png'
    },
    audio: {
        bgMusic: 'sound/Vibe_Survivor.mp3?v=2',
        startMenu: 'sound/startMenu.mp3?v=2',
        chromaAwardsTheme: 'sound/ChromaAwards.mp3?v=2',
        bossAlert: 'sound/bossAlert.mp3?v=2',
        bossDefeat: 'sound/bossDefeat.mp3?v=2',
        gameOver: 'sound/gameOver.mp3?v=2',
        upgrade: 'sound/upgrade.mp3?v=2',
        dash: 'sound/dash.mp3?v=2',
        upgradeBox: 'sound/upgradeBox.mp3?v=2',
        mergerWeapon: 'sound/mergerWeapon.mp3?v=2',
        nextStage: 'sound/nextStage.mp3?v=2',
        // Weapon sounds
        weaponBasicMissile: 'sound/weapon/basicMissile.mp3?v=2',
        weaponSpreadShot: 'sound/weapon/spreadShot.mp3?v=2',
        weaponLaserBeam: 'sound/weapon/laserBeam.mp3?v=2',
        weaponPlasmaBolt: 'sound/weapon/plasmaBolt.mp3?v=2',
        weaponShotgun: 'sound/weapon/shotgun.mp3?v=2',
        weaponLightningBolt: 'sound/weapon/lightningBolt.mp3?v=2',
        weaponFlameThrower: 'sound/weapon/flameThrower.mp3?v=2',
        weaponRailgun: 'sound/weapon/railgun.mp3?v=2',
        weaponHomingMissile: 'sound/weapon/homingMissile.mp3?v=2',
        weaponHomingLaser: 'sound/weapon/homingLaser.mp3?v=2',
        weaponShockBurst: 'sound/weapon/shockBurst.mp3?v=2',
        weaponGatlingGun: 'sound/weapon/gatlingGun.mp3?v=2',
        weaponNapalmBuckshot: 'sound/weapon/napalmBuckshot.mp3?v=2'
    }
};

/**
 * Sprite configuration
 */
export const SPRITE_CONFIGS = {
    player: {
        frameWidth: 64,
        frameHeight: 64,
        frameCount: 12,
        framesPerRow: 12,
        animations: {
            idle: { frames: 12, fps: 8 },
            up: { frames: 12, fps: 8 },
            down: { frames: 12, fps: 8 },
            left: { frames: 12, fps: 8 },
            right: { frames: 12, fps: 8 }
        }
    }
};

/**
 * Loading phases for asset preloading
 */
export const LOADING_PHASES = [
    { percent: 0, title: 'BOOTING', label: 'Initializing systems…' },
    { percent: 25, title: 'LOADING', label: 'Loading sprites…' },
    { percent: 50, title: 'LOADING', label: 'Loading sounds…' },
    { percent: 75, title: 'LOADING', label: 'Preparing game world…' },
    { percent: 100, title: 'READY', label: 'Ready to survive!' }
];

/**
 * Preload all game assets with progress tracking
 * @param {Function} progressCallback - Callback function(percent, phaseIndex)
 * @returns {Promise<void>}
 */
export async function preloadAssets(progressCallback) {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingFill = loadingScreen?.querySelector('.loading-fill');
    const loadingPercent = loadingScreen?.querySelector('.loading-percent');
    const loadingLabel = loadingScreen?.querySelector('.loading-label');
    const loadingText = loadingScreen?.querySelector('.loading-text');

    if (!loadingScreen) return;

    const updateProgress = (percent, phaseIndex) => {
        if (loadingFill) loadingFill.style.width = `${percent}%`;
        if (loadingPercent) loadingPercent.textContent = `${Math.round(percent)}%`;

        if (phaseIndex !== undefined && LOADING_PHASES[phaseIndex]) {
            const phase = LOADING_PHASES[phaseIndex];
            if (loadingText && loadingText.firstChild) {
                loadingText.firstChild.textContent = phase.title;
            }
            if (loadingLabel) loadingLabel.textContent = phase.label;
        }

        if (progressCallback) {
            progressCallback(percent, phaseIndex);
        }
    };

    // Phase 0: Booting
    updateProgress(0, 0);
    await new Promise(resolve => setTimeout(resolve, 300));

    // Phase 1: Load sprites and icons (25%)
    updateProgress(25, 1);

    // Get all weapon icon names
    const weaponIcons = Object.keys(ASSET_PATHS.weapons);

    // Get all passive icon names
    const passiveIcons = Object.keys(ASSET_PATHS.passives);

    // Create image preload promises
    const imagePromises = [
        // Player directional sprites (CRITICAL for first play)
        new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
            img.src = ASSET_PATHS.sprites.playerIdle;
        }),
        new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
            img.src = ASSET_PATHS.sprites.playerUp;
        }),
        new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
            img.src = ASSET_PATHS.sprites.playerDown;
        }),
        new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
            img.src = ASSET_PATHS.sprites.playerLeft;
        }),
        new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
            img.src = ASSET_PATHS.sprites.playerRight;
        }),
        // Weapon icons
        ...weaponIcons.map(iconName => {
            const img = new Image();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 2000);
                img.src = ASSET_PATHS.weapons[iconName];
            });
        }),
        // Passive icons
        ...passiveIcons.map(iconName => {
            const img = new Image();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 2000);
                img.src = ASSET_PATHS.passives[iconName];
            });
        }),
        // Title image
        new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
            img.src = ASSET_PATHS.ui.title;
        }),
        // Background image
        new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
            img.src = ASSET_PATHS.ui.background;
        }),
        // Logo
        new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
            img.src = ASSET_PATHS.ui.logo;
        }),
        // AI Bot sprite
        new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            setTimeout(resolve, 2000);
            img.src = ASSET_PATHS.sprites.aiBot;
        })
    ];

    await Promise.all(imagePromises);

    // Phase 2: Load sounds (50%)
    updateProgress(50, 2);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Phase 3: Prepare game world (75%)
    updateProgress(75, 3);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Phase 4: Ready (100%)
    updateProgress(100, 4);
    await new Promise(resolve => setTimeout(resolve, 800));

    // Fade out loading screen
    if (loadingScreen) {
        loadingScreen.style.transition = 'opacity 0.5s';
        loadingScreen.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 500));
        loadingScreen.style.display = 'none';
    }
}

/**
 * Helper to get weapon icon path
 * @param {string} weaponType - Weapon type key
 * @returns {string} Path to weapon icon
 */
export function getWeaponIconPath(weaponType) {
    const iconName = weaponType.toLowerCase().replace(/_/g, '');
    return ASSET_PATHS.weapons[iconName] || ASSET_PATHS.weapons.basicMissile;
}

/**
 * Helper to get passive icon path
 * @param {string} passiveType - Passive type key
 * @returns {string} Path to passive icon
 */
export function getPassiveIconPath(passiveType) {
    const iconName = passiveType.toLowerCase().replace(/_/g, '');
    return ASSET_PATHS.passives[iconName] || ASSET_PATHS.passives.passive;
}
