// Enhanced Vibe Survivor Game with Multiple Weapons and Choice System

// Import utilities
import { Vector2 } from './utils/vector2.js';
import { clamp, lerp, distance, distanceSquared, randomRange, randomInt, degToRad, radToDeg } from './utils/math.js';
import { PerformanceMonitor } from './utils/performance.js';
import { scoreboardStorage } from './utils/scoreboard-storage.js';
import { supabaseClient } from './utils/supabase-client.js';

// Import configuration
import {
    PLAYER, ENEMIES, WEAPONS, WEAPON_UPGRADES, PASSIVES, XP_SYSTEM,
    SPAWN_CONFIG, PICKUP_SPAWNS, DIFFICULTY_SCALING, GAME_TIMING,
    SCREEN_EFFECTS, PARTICLES, COLLISION, ENEMY_BEHAVIORS, MOBILE_CONFIG,
    PERFORMANCE, COLORS, BOSS_VARIANTS, GAME_INFO
} from './config/constants.js';
import { ASSET_PATHS, SPRITE_CONFIGS, LOADING_PHASES, preloadAssets, getWeaponIconPath, getPassiveIconPath } from './config/assets.js';

// Import state management
import {
    createPlayerState, createCameraState, createWeaponsState, createWeaponStatsState,
    createEnemiesState, createProjectilesState, createPickupsState, createParticlesState,
    createUIState, createGameCoreState, createBossState, createScreenEffectsState,
    resetPlayerState, resetCameraState, resetWeaponsState, resetWeaponStatsState,
    resetEnemiesState, resetProjectilesState, resetPickupsState, resetParticlesState,
    resetUIState, resetGameCoreState, resetBossState, resetScreenEffectsState
} from './core/state.js';

// Import input management
import { InputManager } from './core/input.js';

// Import physics management
import { PhysicsManager } from './core/physics.js';

// Import rendering systems
import { initCanvas, resizeCanvas, Camera } from './systems/rendering/canvas.js';
import { SpriteManager } from './systems/rendering/sprites.js';
import { AnimationController } from './systems/rendering/animation.js';
import { ParticleSystem } from './systems/rendering/particles.js';
import { EffectsManager } from './systems/rendering/effects.js';

// Import gameplay systems
import { PlayerSystem } from './systems/gameplay/player.js';
import { PickupSystem } from './systems/gameplay/pickups.js';
import { EnemySystem } from './systems/gameplay/enemies/enemy-system.js';

// Import Phase 9 systems - Weapons & Progression
import { WeaponSystem } from './systems/gameplay/weapons/weapon-base.js';
import { ProjectileSystem } from './systems/gameplay/weapons/projectiles.js';
import { XPSystem } from './systems/gameplay/progression/xp-system.js';
import { UpgradeSystem } from './systems/gameplay/progression/upgrades.js';

// Import Phase 10 systems - UI Components
import { HUDSystem } from './systems/ui/hud.js';
import { TouchControlsUI } from './systems/ui/touch-controls.js';
import { Modal, ModalManager } from './systems/ui/modals/modal-base.js';
import { LoadingScreen } from './systems/ui/modals/loading-screen.js';
import { StartScreen } from './systems/ui/modals/start-screen.js';
import { PauseMenu } from './systems/ui/modals/pause-menu.js';
import { LevelUpModal } from './systems/ui/modals/level-up.js';
import { GameOverModal } from './systems/ui/modals/game-over.js';
import { SettingsModal } from './systems/ui/modals/settings.js';
import { HelpModal } from './systems/ui/modals/help.js';
import { GuideModal } from './systems/ui/modals/guide-modal.js';
import { WeaponInfoModal } from './systems/ui/modals/weapon-info.js';
import { StatsModal } from './systems/ui/modals/stats.js';
import { VictoryModal } from './systems/ui/modals/victory.js';
import { RestartConfirmationModal } from './systems/ui/modals/restart-confirmation.js';
import { ExitConfirmationModal } from './systems/ui/modals/exit-confirmation.js';
import { OptionsMenu } from './systems/ui/modals/options-menu.js';
import { HelpMenu } from './systems/ui/modals/help-menu.js';
import { StartScreenModal } from './systems/ui/modals/start-screen-modal.js';
import { AboutModal } from './systems/ui/modals/about-modal.js';
import { ChestModal } from './systems/ui/modals/chest-modal.js';
import { ScoreboardModal } from './systems/ui/modals/scoreboard-modal.js';
import { ScoreDetailModal } from './systems/ui/modals/score-detail-modal.js';
import { PromptModal } from './systems/ui/modals/prompt-modal.js';
import { NotificationModal } from './systems/ui/modals/notification-modal.js';

// Import Phase 11 systems - Engine & Audio
import { AudioManager } from './systems/audio/audio-manager.js';
import { GameLoop, EngineTimer, FrameRateCounter } from './core/engine.js';

const BOSS_HEALTH_MULTIPLIER = 1.5;

class VibeSurvivor {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameTime = 0;
        this.gameRunning = false;
        this.playerDead = false;
        this.gameOverHandled = false;
        this.gameOverShown = false;
        this.gameFullyInitialized = false; // Track if initGame() completed successfully

        // Initialize input manager
        this.inputManager = new InputManager();

        // Convenience properties (delegate to inputManager)
        this.keys = this.inputManager.keys;
        this.touchControls = this.inputManager.touchControls;
        this.menuNavigationState = this.inputManager.menuNavigationState;
        this.isMobile = this.inputManager.isMobile;
        this.settings = this.inputManager.settings;

        // Initialize physics manager
        this.physicsManager = new PhysicsManager();

        // Convenience methods (delegate to physicsManager)
        this.fastSin = this.physicsManager.fastSin.bind(this.physicsManager);
        this.fastCos = this.physicsManager.fastCos.bind(this.physicsManager);
        this.cachedSqrt = this.physicsManager.cachedSqrt.bind(this.physicsManager);

        // Initialize rendering systems
        this.spriteManager = new SpriteManager();
        this.camera = new Camera();
        this.animationController = new AnimationController();
        this.particleSystem = new ParticleSystem();
        this.effectsManager = new EffectsManager();
        this.applyCameraZoom();

        // Track modal origins
        this.scoreboardLastOrigin = 'start';
        this.scoreDetailReturnContext = null;

        // Initialize gameplay systems
        this.playerSystem = new PlayerSystem();
        this.pickupSystem = new PickupSystem();
        this.enemySystem = new EnemySystem({
            bossVariantCount: Array.isArray(BOSS_VARIANTS) ? BOSS_VARIANTS.length : 11
        });

        // Initialize Phase 9 systems - Weapons & Progression
        this.weaponSystem = new WeaponSystem();
        this.projectileSystem = new ProjectileSystem();
        this.xpSystem = new XPSystem();
        this.upgradeSystem = new UpgradeSystem();

        // Initialize Phase 10 systems - UI Components
        this.hudSystem = new HUDSystem();
        this.touchControlsUI = new TouchControlsUI();
        this.modalManager = new ModalManager();

        // Initialize individual modals (will be set up after DOM is ready)
        this.modals = {
            loading: new LoadingScreen(),
            start: new StartScreen(),
            pause: new PauseMenu(),
            levelUp: new LevelUpModal(),
            gameOver: new GameOverModal(),
            settings: new SettingsModal(),
            help: new HelpModal(),
            guide: new GuideModal(this),
            weaponInfo: new WeaponInfoModal(),
            stats: new StatsModal(),
            victory: new VictoryModal(),
            restartConfirmation: new RestartConfirmationModal(),
            exitConfirmation: new ExitConfirmationModal(),
            options: new OptionsMenu(),
            helpMenu: new HelpMenu(),
            startScreenModal: new StartScreenModal(),
            aboutModal: new AboutModal(),
            chest: new ChestModal(),
            scoreboard: new ScoreboardModal(),
            scoreDetail: new ScoreDetailModal(),
            prompt: new PromptModal(),
            notification: new NotificationModal()
        };
        this._guideModalInitialized = false;

        // Initialize Phase 11 systems - Engine & Audio
        this.audioManager = new AudioManager();
        this.lastStartThemePlay = 0;
        this.gameLoopManager = new GameLoop(); // Renamed to avoid conflict with existing gameLoop() method
        this.engineTimer = new EngineTimer();
        this.frameRateCounter = new FrameRateCounter();

        // Initialize Supabase client for global leaderboard
        supabaseClient.init();

        // Convenience properties (delegate to spriteManager for backward compatibility)
        this.playerSprites = this.spriteManager.playerSprites;
        this.itemIcons = this.spriteManager.itemIcons;
        this.spriteConfig = this.spriteManager.spriteConfig;

        // Player properties - start at world center
        this.player = createPlayerState(0, 0);

        // Delegate player animation properties to AnimationController for backward compatibility
        Object.defineProperty(this.player, 'spriteFrame', {
            get: () => this.animationController.spriteFrame,
            set: (value) => { this.animationController.spriteFrame = value; }
        });
        Object.defineProperty(this.player, 'spriteTimer', {
            get: () => this.animationController.spriteTimer,
            set: (value) => { this.animationController.spriteTimer = value; }
        });
        Object.defineProperty(this.player, 'spriteDirection', {
            get: () => this.animationController.spriteDirection,
            set: (value) => { this.animationController.spriteDirection = value; }
        });
        Object.defineProperty(this.player, 'trail', {
            get: () => this.animationController.trail,
            set: (value) => { this.animationController.trail = value; }
        });
        Object.defineProperty(this.player, 'trailMultiplier', {
            get: () => this.animationController.trailMultiplier,
            set: (value) => { this.animationController.trailMultiplier = value; }
        });

        // Game properties - using state factories
        const enemiesState = createEnemiesState();
        this.enemies = enemiesState.enemies;
        this.enemiesByBehavior = enemiesState.enemiesByBehavior;

        this.projectiles = createProjectilesState();
        this.projectilePool = []; // Object pool for reusing projectile objects

        // NOTE: Particles now handled by ParticleSystem
        // Convenience properties for backward compatibility
        Object.defineProperty(this, 'particles', {
            get: () => this.particleSystem.particles,
            set: (value) => { this.particleSystem.particles = value; }
        });
        Object.defineProperty(this, 'explosions', {
            get: () => this.particleSystem.explosions,
            set: (value) => { this.particleSystem.explosions = value; }
        });

        const pickupsState = createPickupsState();
        this.xpOrbs = pickupsState.xpOrbs;
        this.hpOrbs = pickupsState.hpOrbs;
        this.magnetOrbs = pickupsState.magnetOrbs;
        this.chestOrbs = []; // Chest orbs for passive upgrades

        this.weapons = createWeaponsState();
        this.maxWeaponSlots = WEAPON_UPGRADES.MAX_WEAPONS;

        // Track per-weapon cumulative damage
        this.weaponStats = createWeaponStatsState();

        // Pause functionality
        this.isPaused = false;
        this.isHelpOpen = false;
        this.activeHelpTab = 'howto';
        this.overlayLocks = 0;
        this.lastVictoryPayload = null;
        this.victoryHiddenForExitConfirmation = false;
        this.victoryHiddenForExitConfirmation = false;

        // Background music
        // NOTE: Audio now managed by AudioManager (Phase 11)
        // Audio initialization happens in audioManager.init()
        // Mute state now managed by AudioManager (musicMuted, sfxMuted)

        // NOTE: Sprite loading now handled by SpriteManager
        // this.playerSprites, this.itemIcons, and this.spriteConfig are delegated to spriteManager

        // Touch scrolling handlers for modals
        this.pauseScrollHandler = null;

        // Bind layout helpers that run from event listeners
        this.updateStartOverlayLayout = this.updateStartOverlayLayout.bind(this);


        // Performance monitoring using extracted module
        this.performanceMonitor = new PerformanceMonitor(60, 30);

        // Keep performanceMode as a reference to the monitor's state for backward compatibility
        Object.defineProperty(this, 'performanceMode', {
            get: () => this.performanceMonitor.isPerformanceModeEnabled()
        });

        // Keep frameRateMonitor as a compatibility layer
        Object.defineProperty(this, 'frameRateMonitor', {
            get: () => ({
                currentFPS: this.frameRateCounter
                    ? this.frameRateCounter.getFPS()
                    : this.performanceMonitor.getCurrentFPS(),
                averageFPS: this.performanceMonitor.getAverageFPS(),
                adaptiveQuality: this.performanceMonitor.getQualitySettings(),
                frameCount: this.performanceMonitor.frameCount,
                targetFPS: this.performanceMonitor.targetFPS,
                minFPS: this.performanceMonitor.minFPS,
                fpsHistory: this.performanceMonitor.fpsHistory,
                lastFrameTime: this.performanceMonitor.lastFrameTime,
                lastCheck: this.performanceMonitor.lastCheck
            })
        });

        // Initialize object pools
        this.initializeProjectilePool();

        // Inject pools into PickupSystem (pools are created in initializeProjectilePool)
        // Note: This must be called after initializeProjectilePool()
        this.pickupSystem.setPools(this.xpOrbPool, this.hpOrbPool, this.magnetOrbPool, this.chestOrbPool);

        // Initialize smart garbage collection system
        this.initializeSmartGarbageCollection();

        // Initialize square root cache for performance
        this.sqrtCache = new Map();
        this.maxCacheSize = 1000; // Limit cache size to prevent memory bloat

        // Initialize batch rendering system
        this.initializeBatchRenderer();

        // Initialize canvas layers (will be called after canvas is ready)
        this.canvasLayersInitialized = false;

        // Initialize adaptive quality scaling
        this.initializeAdaptiveQuality();

        // Initialize trigonometric lookup tables
        this.initTrigLookupTables();

        // UI properties
        this.frameCount = 0;
        this.lastSpawn = 0;
        this.notifications = [];
        // NOTE: Camera now initialized earlier as Camera class instance

        // Game loop timing control
        this.gameLoopId = null;
        this.lastTimestamp = null;
        this.accumulator = 0;
        this.frameInterval = 1000 / 60;
        this.maxAccumulatedTime = this.frameInterval * 5;

        this.spawnRate = 120; // frames between spawns
        this.waveMultiplier = 1;

        // HP orb spawn system
        this.hpOrbSpawnTimer = 0;
        this.hpOrbSpawnRate = 120; // frames between HP orb spawn chances (2 seconds)
        this.hpOrbSpawnChance = 0.08; // 8% chance per check (much more frequent)
        this.maxHpOrbs = 1; // Maximum HP orbs on map

        // Magnet orb spawn system (same rarity as HP orbs)
        this.magnetOrbSpawnTimer = 0;
        this.magnetOrbSpawnRate = 120; // frames between magnet orb spawn chances (2 seconds)
        this.magnetOrbSpawnChance = 0.08; // 8% chance per check
        this.maxMagnetOrbs = 1; // Maximum magnet orbs on map

        // Boss progression system (starts after first boss defeat)
        this.bossesKilled = 0;
        this.bossLevel = 1;
        this.bossDefeating = false; // Animation state for boss defeat
        this.nextBossSpawnTime = null;     // Game-time schedule for upcoming boss spawns
        this.bossRespawnDelay = 30;        // Seconds between scaled boss encounters
        this.pendingBossSpawn = null;      // Delayed boss spawn entry created after alert
        this.bossSpawnDelaySeconds = 3;    // Lead time between alert and spawn
        this.bossSpawnDistance = 450;      // Spawn bosses further away from player

        // Level up and timing state management
        this.pendingLevelUps = 0;           // Count of deferred level ups
        this.bossVictoryInProgress = false; // Victory screen active
        this.lastVictoryPayload = null;     // Cached data for restoring victory modal
        this.victoryHiddenForExitConfirmation = false;
        this.timePaused = false;            // Whether game time should pause

        // Backup navigation state for help modal overlay scenarios
        this.previousNavigationState = null;

        // NOTE: Screen effects now handled by EffectsManager
        // Convenience properties for backward compatibility
        Object.defineProperty(this, 'redFlash', {
            get: () => this.effectsManager.redFlash
        });
        Object.defineProperty(this, 'screenShake', {
            get: () => this.effectsManager.screenShake,
            set: (value) => { this.effectsManager.screenShake = value; }
        });

        // Translation system
        this.currentLanguage = 'en';
        this.translations = this.initTranslations();
        this.updateFooterVersion();

        this.initGame();
    }

    async preloadAssets() {
        // Phase 12c.9 - Use LoadingScreen modal instead of direct DOM manipulation
        if (!this.modals.loading.element) return;

        // Show loading screen
        this.modals.loading.show();

        const phases = [
            { percent: 0, title: 'BOOTING', label: 'Initializing systems…' },
            { percent: 25, title: 'LOADING', label: 'Loading sprites…' },
            { percent: 50, title: 'LOADING', label: 'Loading sounds…' },
            { percent: 75, title: 'LOADING', label: 'Preparing game world…' },
            { percent: 100, title: 'READY', label: 'Ready to survive!' }
        ];

        const updateProgress = (percent, phaseIndex) => {
            // Use modal methods to update progress
            this.modals.loading.setProgress(percent);

            if (phaseIndex !== undefined && phases[phaseIndex]) {
                const phase = phases[phaseIndex];
                this.modals.loading.setPhase(phase.title);
                this.modals.loading.setMessage(phase.label);
            }
        };

        // Start with phase 0
        updateProgress(0, 0);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Phase 1: Load sprites and icons (25%)
        updateProgress(25, 1);

        // All weapon icons
        const weaponIcons = [
            'basicMissile', 'rapidFire', 'spreadShot', 'laserBeam', 'plasmaBolt',
            'shotgun', 'lightning', 'flamethrower', 'railgun', 'homingMissiles',
            'homingLaser', 'shockburst', 'gatlingGun'
        ];

        // All passive icons
        const passiveIcons = [
            'healthBoost', 'speedBoost', 'regeneration', 'magnet', 'armor',
            'criticalStrike', 'dashBoost', 'weaponFirerate', 'weaponPower',
            'weaponProjectile', 'weaponSize', 'weaponSlot',
            'upgrade', 'evolution', 'passive', 'stats', 'nextStage'
        ];

        // Create image preload promises
        const imagePromises = [
            // Player sprites
            ...Object.values(this.playerSprites).filter(img => img instanceof Image).map(img => {
                if (!img.complete && img.src) {
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                        setTimeout(resolve, 2000); // Timeout
                    });
                }
                return Promise.resolve();
            }),
            // Item pickup icons
            ...Object.values(this.itemIcons).map(img => {
                if (img instanceof Image && !img.complete) {
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                        setTimeout(resolve, 2000);
                    });
                }
                return Promise.resolve();
            }),
            // Weapon icons
            ...weaponIcons.map(iconName => {
                const img = new Image();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                    setTimeout(resolve, 2000);
                    img.src = `images/weapons/${iconName}.png`;
                });
            }),
            // Passive icons
            ...passiveIcons.map(iconName => {
                const img = new Image();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                    setTimeout(resolve, 2000);
                    img.src = `images/passives/${iconName}.png`;
                });
            }),
            // Title image
            new Promise(resolve => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 2000);
                img.src = 'images/Title.png';
            }),
            // Background image
            new Promise(resolve => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 2000);
                img.src = 'images/background.png';
            }),
            // VibeCreAI Logo
            new Promise(resolve => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 2000);
                img.src = 'images/VibeCreAI_Logo.png';
            }),
            // Start screen bot sprite
            new Promise(resolve => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = resolve;
                setTimeout(resolve, 2000);
                img.src = 'images/AI BOT.png';
            })
        ];

        await Promise.all(imagePromises);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Phase 2: Load sounds (50%)
        updateProgress(50, 2);
        // Initialize audio manager (Phase 11)
        // First, stop ALL audio elements on the page to prevent music from persisting across refreshes
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
            audio.src = '';
        });
        // Then destroy and reinitialize our audio manager
        this.audioManager.destroy();
        await this.audioManager.init();
        // Load game sound effects
        this.audioManager.loadGameSounds(ASSET_PATHS.audio);
        // Load and restore user settings (audio preferences, language, etc.)
        // this.loadUserSettings(); // TODO: Re-enable when method exists
        if (this.audioManager.music && this.audioManager.music.readyState < 2) {
            await new Promise(resolve => {
                this.audioManager.music.addEventListener('canplaythrough', resolve, { once: true });
                this.audioManager.music.addEventListener('error', resolve, { once: true });
                setTimeout(resolve, 1000); // Timeout after 1s
            });
        }
        await new Promise(resolve => setTimeout(resolve, 300));

        // Phase 3: Prepare game world (75%)
        updateProgress(75, 3);
        await new Promise(resolve => setTimeout(resolve, 400));

        // Phase 4: Complete (100%)
        updateProgress(100, 4);
        // Add flash effect to loading track
        const loadingTrack = this.modals.loading.element?.querySelector('.loading-track');
        if (loadingTrack) loadingTrack.classList.add('flash');
        await new Promise(resolve => setTimeout(resolve, 350));

        // Phase 12c.9 - Fade out loading screen using modal
        if (this.modals.loading.element) {
            this.modals.loading.element.style.opacity = '0';
            this.modals.loading.element.style.transition = 'opacity 0.6s ease-out';
        }
        await new Promise(resolve => setTimeout(resolve, 600));
        this.modals.loading.hide();

        // Show footer and background after loading
        const footer = document.querySelector('.footer-bar');
        if (footer) {
            footer.classList.add('loaded');
        }

        // Show background
        document.body.classList.add('loaded');

    }

    initGame() {
        this.createGameModal();
        this.addStyles();
        this.setupEventHandlers();

        // Phase 12c.5 - Initialize options menu modal (after modal HTML is created)
        if (!this._optionsMenuInitialized) {
            this.modals.options.init();

            // Set up game state callbacks for dynamic button labels
            this.modals.options.setGameStateCallbacks(
                () => this.audioManager.isMusicMuted(),
                () => this.audioManager.isSfxMuted(),
                () => this.touchControls?.dashButton?.position || this.dashButtonPosition || 'right',
                () => this.currentLanguage,
                this.t.bind(this)
            );

            // Set up overlay lock callbacks
            this.modals.options.setOverlayLockCallbacks(
                this.incrementOverlayLock.bind(this),
                this.decrementOverlayLock.bind(this)
            );

            // Set up button callbacks
            this.modals.options.onLanguageChange((language) => {
                this.setLanguage(language);
            });

            this.modals.options.onMusicMute(() => {
                this.toggleMusicMute();
            });

            this.modals.options.onSfxMute(() => {
                this.toggleSfxMute();
            });

            this.modals.options.onMusicVolume((volume) => {
                this.setMusicVolume(volume);
            });

            this.modals.options.onSfxVolume((volume) => {
                this.setSfxVolume(volume);
            });

            this.modals.options.onDashPosition(() => {
                this.toggleDashButtonPosition();
            });

            this.modals.options.onClose(() => {
                // Restore previous navigation state if it exists
                const previousState = this.modals.options.getPreviousNavigationState();
                if (previousState) {
                    this.menuNavigationState = previousState;
                    this.updateMenuSelection();
                    this.modals.options.setPreviousNavigationState(null);
                }

                if (!this.gameRunning && window.startScreenBot) {
                    window.startScreenBot.show();
                }
            });

            this._optionsMenuInitialized = true;
        }

        // Phase 12c.6 - Initialize help menu modal (after modal HTML is created)
        if (!this._helpMenuInitialized) {
            this.modals.helpMenu.init();

            // Set up game state callbacks
            this.modals.helpMenu.setGameStateCallbacks(
                () => {
                    // Pause game
                    this.isPaused = true;
                    this.timePaused = true;
                    this.pauseLoopingWeaponSounds();
                },
                () => {
                    // Resume game
                    this.isPaused = false;
                    this.timePaused = false;
                    this.resumeLoopingWeaponSounds();
                },
                () => {
                    // Check if pause menu is open
                    const pauseMenu = document.getElementById('pause-menu');
                    return pauseMenu && pauseMenu.style.display !== 'none';
                },
                this.t.bind(this),
                this.renderHelpStatusTab.bind(this)
            );

            // Set up overlay lock callbacks
            this.modals.helpMenu.setOverlayLockCallbacks(
                this.incrementOverlayLock.bind(this),
                this.decrementOverlayLock.bind(this)
            );

            // Set up close callback
            this.modals.helpMenu.onClose(() => {
                // CRITICAL: Update isHelpOpen state when modal closes itself
                this.isHelpOpen = false;

                // Restore previous navigation state if it exists
                const previousState = this.modals.helpMenu.getPreviousNavigationState();
                if (previousState) {
                    this.menuNavigationState = previousState;
                    this.updateMenuSelection();
                    this.modals.helpMenu.setPreviousNavigationState(null);
                } else {
                    this.resetMenuNavigation();
                }

                // Update help button text
                this.modals.helpMenu.updateHelpButtonText(false);
            });

            this._helpMenuInitialized = true;
        }

        // Initialize start menu guide modal
        if (!this._guideModalInitialized) {
            this.modals.guide.init();
            this.modals.guide.onClose(() => {
                if (!this.gameRunning) {
                    this.showStartScreen();
                }
            });
            this.modalManager.register('guide', this.modals.guide);
            this._guideModalInitialized = true;
        }

        // Phase 12c.8 - Initialize start screen modal (after modal HTML is created)
        if (!this._startScreenModalInitialized) {
            this.modals.startScreenModal.init();

            // Set up button callbacks
            this.modals.startScreenModal.onStart(() => {
                console.log('Start button clicked', {
                    gameFullyInitialized: this.gameFullyInitialized,
                    hasCanvas: !!this.canvas,
                    hasCtx: !!this.ctx,
                    hasTouchControlsUI: !!this.touchControlsUI,
                    touchControlsUIInitialized: this.touchControlsUI?.elements?.dashButton != null
                });

                // Guard: Check if game is ready before doing anything
                if (!this.gameFullyInitialized) {
                    console.warn('Game not ready yet. Please wait for loading to complete.');
                    return;
                }

                // Additional safety check for touchControlsUI
                if (!this.touchControlsUI || !this.touchControlsUI.elements || !this.touchControlsUI.elements.dashButton) {
                    console.error('TouchControlsUI not properly initialized yet. Waiting...');
                    return;
                }

                this.resetMenuNavigation();
                this.startGame();
            });

            this.modals.startScreenModal.onOptions(() => {
                // Guard: Check if game is ready
                if (!this.gameFullyInitialized) {
                    console.warn('Please wait for loading to complete.');
                    return;
                }
                this.showOptionsMenu();
            });

            this.modals.startScreenModal.onAbout(() => {
                // Guard: Check if game is ready
                if (!this.gameFullyInitialized) {
                    console.warn('Please wait for loading to complete.');
                    return;
                }
                this.showAboutMenu();
            });

            this.modals.startScreenModal.onScoreboard(() => {
                if (!this.gameFullyInitialized) {
                    console.warn('Please wait for loading to complete.');
                    return;
                }
                this.showScoreboardModal({ origin: 'start' });
            });

            this.modals.startScreenModal.onRestart(() => {
                // Guard: Check if game is ready
                if (!this.gameFullyInitialized) {
                    console.warn('Please wait for loading to complete.');
                    return;
                }
                this.resetMenuNavigation();
                this.restartGame();
            });

            this.modals.startScreenModal.onExit(() => {
                // Exit is allowed even before game is ready (user might want to close immediately)
                this.resetMenuNavigation();
                this.closeGame();
            });

            this.modals.startScreenModal.setTranslationFunction(this.t.bind(this));

            this._startScreenModalInitialized = true;
        }

        if (!this._scoreboardModalInitialized) {
            this.modals.scoreboard.init();
            this.modals.scoreboard.setTranslationFunction(this.t.bind(this));
            this.modals.scoreboard.onScoreSelected((scoreId) => {
                // If the game over modal is visible, hide it before showing detail
                if (this.modals.gameOver?.isVisible && this.modals.gameOver.isVisible()) {
                    this.modals.gameOver.hide();
                }
                const tab = this.modals.scoreboard?.activeTab || 'local';
                const origin = this.scoreboardLastOrigin || 'start';
                const wasScoreboardVisible = this.modals.scoreboard?.isVisible && this.modals.scoreboard.isVisible();
                if (wasScoreboardVisible) {
                    this.modals.scoreboard.hide();
                }
                this.scoreDetailReturnContext = { origin, tab };
                this.showScoreDetailModal(scoreId);
            });
            this.modals.scoreboard.onClose(() => {
                if (!this.gameRunning) {
                    this.showStartScreen();
                }
            });
            this._scoreboardModalInitialized = true;
        }

        if (!this._scoreDetailModalInitialized) {
            this.modals.scoreDetail.init();
            this.modals.scoreDetail.setTranslationFunction(this.t.bind(this));
            this.modals.scoreDetail.setHelpers({
                getWeaponName: this.getWeaponName.bind(this)
            });
            this.modals.scoreDetail.setModals({
                promptModal: this.modals.prompt,
                notificationModal: this.modals.notification
            });
            this.modals.scoreDetail.onBack(() => this.handleScoreDetailBack());
            this.modals.scoreDetail.onDelete((scoreId) => {
                scoreboardStorage.deleteScore(scoreId);
                this.modals.scoreDetail.hide();
                this.showScoreboardModal({
                    startTab: this.modals.scoreboard?.activeTab || 'local',
                    origin: this.scoreboardLastOrigin || 'start'
                });
            });

            // Setup submission callback for global leaderboard
            this.modals.scoreDetail.onSubmit(async (score, playerName) => {
                const result = await supabaseClient.submitScore(
                    score,
                    playerName,
                    GAME_INFO.VERSION,
                    GAME_INFO.MAJOR_VERSION
                );

                if (result.success) {
                    // Mark as submitted in local storage
                    scoreboardStorage.markAsSubmitted(score.id, result.id, playerName);
                    await this.modals.notification.notify(`Score submitted as ${playerName}!`, 'success');
                    return true;
                } else {
                    await this.modals.notification.notify(`Failed to submit: ${result.error}`, 'error');
                    return false;
                }
            });

            // Setup view global callback
            this.modals.scoreDetail.onViewGlobal(() => {
                this.modals.scoreDetail.hide();
                this.showScoreboardModal({
                    startTab: 'global',
                    origin: this.scoreboardLastOrigin || 'start'
                });
            });

            this._scoreDetailModalInitialized = true;
        }

        // Initialize prompt and notification modals
        if (!this._promptModalInitialized) {
            this.modals.prompt.init();
            this.modals.prompt.setTranslationFunction(this.t.bind(this));
            this._promptModalInitialized = true;
        }

        if (!this._notificationModalInitialized) {
            this.modals.notification.init();
            this.modals.notification.setTranslationFunction(this.t.bind(this));
            this._notificationModalInitialized = true;
        }

        // Wire up GUIDE button on start screen
        const startGuideBtn = document.getElementById('start-btn-guide');
        if (startGuideBtn && !startGuideBtn.dataset.bound) {
            startGuideBtn.dataset.bound = 'true';
            const guideHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!this.gameFullyInitialized) {
                    console.warn('Please wait for loading to complete.');
                    return;
                }

                this.openGuideModalFromStart();
            };
            startGuideBtn.addEventListener('click', guideHandler);
            startGuideBtn.addEventListener('touchstart', guideHandler, { passive: false });
        }

        // Phase 12c.9 - Initialize loading screen modal (after modal HTML is created)
        if (!this._loadingScreenInitialized) {
            this.modals.loading.init();
            this._loadingScreenInitialized = true;
        }

        // Phase 12c.10 - Initialize about modal (after modal HTML is created)
        if (!this._aboutModalInitialized) {
            this.modals.aboutModal.init();

            // Set up close callback
            this.modals.aboutModal.onClose(() => {
                this.hideAboutMenu();
            });

            this.modals.aboutModal.setTranslationFunction(this.t.bind(this));

            this._aboutModalInitialized = true;
        }

        // Initialize canvas first (during loading screen)
        setTimeout(() => {
            this.initializeCanvas().then(() => {
                console.log('[DEBUG] Canvas initialized successfully');
                // Then preload assets
                this.preloadAssets().then(() => {
                    console.log('[DEBUG] Assets preloaded successfully');
                    // Wait for background to start appearing before showing start screen
                    // Background has 0.6s ease-in transition when 'loaded' class is added
                    setTimeout(() => {
                        this.showStartScreen();

                        // Attempt to play start menu sound
                        // Chrome's Media Engagement Index (MEI) allows autoplay for returning users
                        // who have previously interacted with media on this domain.
                        // For new users, this will fail silently (caught below).
                        // For returning users with sufficient MEI, this will play automatically.
                        this.tryAutoplayStartMenuSound();
                    }, 300);
                }).catch(err => {
                    console.error('[ERROR] preloadAssets failed:', err);
                });
            }).catch(err => {
                console.error('[ERROR] initializeCanvas failed:', err);
            });
        }, 100);

        // Initialize the start screen (will be hidden by loading screen initially)
        // this.showStartScreen(); // Moved to after preloadAssets

        // Initialize translations after modal creation
        setTimeout(() => {
            this.updateAllText();
        }, 100);

        // Canvas initialization moved to initializeCanvas() method
        // which is called during loading screen before preloadAssets()
    }

    createGameModal() {
        // Clean up any existing modals
        const allModals = document.querySelectorAll('[id*="vibe-survivor"], [class*="vibe-survivor"], [class*="modal"]');

        // Remove existing vibe-survivor MODAL elements only (preserve buttons)
        const existingModals = document.querySelectorAll('#vibe-survivor-modal, .vibe-survivor-modal');
        // Remove existing modal elements
        existingModals.forEach(modal => modal.remove());

        // Also check for any high z-index elements that might be covering content
        const highZElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const zIndex = parseInt(window.getComputedStyle(el).zIndex);
            return zIndex > 9000;
        });
        // Check for high z-index elements

        const modalHTML = `
            <div id="vibe-survivor-modal" class="vibe-survivor-modal">
                <div class="vibe-survivor-content">
                    <!-- Loading Screen -->
                    <div id="loading-screen" class="loading-screen">
                        <div class="loading-content">
                            <img src="images/VibeCreAI_Logo.png" alt="VibeCreAI" class="loading-logo">
                            <div class="loading-text">BOOTING<span class="loading-cursor">_</span></div>
                            <div class="loading-gauge">
                                <div class="loading-track">
                                    <div class="loading-fill"></div>
                                    <div class="loading-cap"></div>
                                </div>
                                <div class="loading-metrics">
                                    <span class="loading-percent">0%</span>
                                    <span class="loading-label">Initializing systems…</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="vibe-survivor-container" class="vibe-survivor-container">
                        <div class="vibe-survivor-header">
                            <button id="pause-btn" class="pause-btn">||</button>
                            
                            <!-- Game Stats in Header -->
                            <div class="header-stats" id="header-stats" style="display: none;">
                                <div class="header-primary-stats">
                                    <!-- Stacked Vitals (HP/XP) -->
                                    <div class="header-vitals">
                                        <div class="header-health">
                                            <div class="header-health-bar">
                                                <div class="header-health-fill" id="header-health-fill"></div>
                                            </div>
                                            <span class="header-health-text" id="header-health-text">100</span>
                                        </div>
                                        
                                        <div class="header-xp">
                                            <div class="header-xp-bar">
                                                <div class="header-xp-fill" id="header-xp-fill"></div>
                                            </div>
                                            <span class="header-level-text" id="header-level-text">Lv1</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Stacked Timing Info (Time/Boss) -->
                                    <div class="header-timing">
                                        <div class="header-time" id="header-time-display">0:00</div>
                                        <div class="header-bosses" id="header-boss-display" style="display: none;">Boss x0</div>
                                    </div>
                                </div>
                                
                                <div class="header-loadouts">
                                    <div class="header-loadout">
                                        <div class="header-loadout-row header-weapons" id="header-weapon-display"></div>
                                    </div>
                                    <div class="header-loadout">
                                        <div class="header-loadout-row header-passives" id="header-passive-display"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Game Title (shown when not in game) -->
                            <h2 id="game-title">VIBE SURVIVOR</h2>

                            <button id="help-btn" class="header-help-btn">?</button>
                        </div>
                        
                        <!-- Separate Start Screen Overlay -->
                        <div id="survivor-start-overlay" class="survivor-start-overlay active">
                            <div class="chroma-awards-header">
                                <div class="chroma-awards-block">
                                    <img src="images/ChromaAwards.png" alt="Chroma Awards" id="chroma-awards-logo" class="chroma-awards-logo" role="button" tabindex="0" aria-label="Play the Chroma Awards theme">
                                    <p class="chroma-award-text"><a href="https://www.ChromaAwards.com" target="_blank" rel="noopener noreferrer">www.ChromaAwards.com</a></p>
                                </div>
                            </div>
                            <div class="survivor-title" style="display: none;">
                                <img src="images/Title.png" alt="VIBE SURVIVOR" id="vibe-survivor-logo" class="title-logo" role="button" tabindex="0" aria-label="Play the Vibe Survivor theme">
                                <p class="game-tagline">Survive the endless waves!</p>
                                <div class="start-actions">
                                    <button id="start-survivor" class="survivor-btn primary">START</button>
                                    <button id="start-btn-guide" class="survivor-btn">GUIDE</button>
                                    <button id="scoreboard-btn" class="survivor-btn">SCOREBOARD</button>
                                    <button id="options-btn" class="survivor-btn">OPTIONS</button>
                                    <button id="about-btn" class="survivor-btn">ABOUT</button>
                                </div>
                            </div>
                        </div>

                        <!-- Options Menu (at top level for start screen access) -->
                        <div id="options-menu" class="options-menu" style="display: none;">
                            <div class="options-content">
                                <h2>OPTIONS</h2>
                                <div class="options-settings">
                                    <div class="option-item">
                                        <label>Language</label>
                                        <select id="language-select" class="option-select">
                                            <option value="en">English</option>
                                            <option value="ko">한국어</option>
                                        </select>
                                    </div>
                                    <div class="option-item">
                                        <label>Music</label>
                                        <div class="audio-controls">
                                            <button id="options-music-mute-btn" class="survivor-btn small">MUTE</button>
                                            <input type="range" id="options-music-volume" class="volume-slider" min="0" max="1" step="0.01" value="0.3">
                                            <span id="options-music-percent" class="volume-percent">30%</span>
                                        </div>
                                    </div>
                                    <div class="option-item">
                                        <label>Sound Effects</label>
                                        <div class="audio-controls">
                                            <button id="options-sfx-mute-btn" class="survivor-btn small">MUTE</button>
                                            <input type="range" id="options-sfx-volume" class="volume-slider" min="0" max="1" step="0.01" value="0.5">
                                            <span id="options-sfx-percent" class="volume-percent">50%</span>
                                        </div>
                                    </div>
                                    <div class="option-item">
                                        <label>Dash Button Position</label>
                                        <button id="options-dash-position-btn" class="survivor-btn small">RIGHT</button>
                                    </div>
                                </div>
                                <button id="close-options-btn" class="survivor-btn primary">CLOSE</button>
                                <p class="options-hint">WASD/Arrows to navigate, Enter to select, ESC to close</p>
                            </div>
                        </div>

                        <!-- About Menu (at top level for start screen access) -->
                        <div id="about-menu" class="about-menu" style="display: none;">
                                <div class="about-content">
                                    <h2>ABOUT</h2>
                                    <div class="about-description">
                                        <p class="vibe-coding-title">100% Made via Vibe Coding</p>
                                        <div class="about-longform">
                                            <p>Hi!</p>
                                            <p>Thanks for jumping into Vibe Survivor!</p>
                                            <p>This whole adventure started in June 2025, when I decided to learn how to build apps and games using nothing but AI tools. My entire workflow runs on pure AI synergy with Claude Code and Codex CLI powering through Warp Terminal, and VS Code as my command center for reviewing code, refining structure, and keeping the project tight and clean.</p>
                                            <p>Vibe Survivor is written entirely in plain vanilla JavaScript. I came into this with zero background in software development, so every mechanic, upgrade, weapon, and wave of chaos you are playing through was built by collaborating exclusively with AI tools. That is the heart of vibe-coding: I bring the vision, the energy, the direction, and AI brings the technical execution to build something wild together.</p>
                                            <p>All the sounds and music were crafted using ElevenLabs, and every single visual and asset came from PixelLab AI. Bringing all these tools together to bring Vibe Survivor to life has been one of the most exciting and creative journeys I have ever been on. And now I am incredibly hyped to submit this game to the Chroma Awards.</p>
                                            <p>Have fun, survive the chaos, and enjoy the vibe!</p>
                                            <p>Samson<br>VibeCreAI</p>
                                            <div class="about-avatar-wrap">
                                                <img src="images/Samson.png" alt="Samson pixel avatar" class="about-avatar">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="about-credits">
                                    <div class="credit-item">
                                        <span class="credit-label">Coding:</span>
                                        <span class="credit-value">Claude Code & Codex</span>
                                    </div>
                                    <div class="credit-item">
                                        <span class="credit-label">Music:</span>
                                        <span class="credit-value">ElevenLabs</span>
                                    </div>
                                    <div class="credit-item">
                                        <span class="credit-label">Sound Effects:</span>
                                        <span class="credit-value">ElevenLabs</span>
                                    </div>
                                    <div class="credit-item">
                                        <span class="credit-label">Artwork:</span>
                                        <span class="credit-value">PixelLab</span>
                                    </div>
                                </div>
                                <div class="social-links">
                                    <h3>Connect With Us</h3>
                                    <div class="social-items">
                                        <a href="https://www.vibecreai.com/" class="social-item" target="_blank" rel="noopener noreferrer">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: currentColor; vertical-align: middle;">
                                                <path fill="currentColor" d="M22.8 7.381c1.125-2.7 1.2-4.95-.15-6.3c-1.5-1.499-5.1-1.05-8.924.75h-.45c-2.7 0-5.324.976-7.274 2.7c-1.65 1.5-2.85 3.45-3.375 5.625c.375-.45 2.475-2.925 4.875-4.275c.075 0 .675-.375.675-.375c-.075 0-1.2 1.125-1.425 1.35c-5.25 5.4-8.324 13.574-5.924 15.973c1.574 1.575 4.424 1.2 7.724-.6c1.425.675 3 .975 4.724.975c2.25 0 4.35-.6 6.15-1.8c1.874-1.2 3.224-3.074 4.05-5.249h-5.85c-.75 1.425-2.475 2.4-4.275 2.4c-2.55 0-4.65-2.1-4.724-4.5v-.225h15.298v-.225c0-.375.075-.825.075-1.124c0-1.8-.45-3.525-1.2-5.1M2.477 22.38c-1.2-1.2-.824-3.524.6-6.299c.675 1.875 1.8 3.525 3.225 4.725c.45.375.975.75 1.5 1.05c-2.4 1.274-4.35 1.5-5.325.524m15.374-11.398H8.702v-.075c.15-2.325 2.324-4.35 4.874-4.35c2.4 0 4.35 1.875 4.5 4.35v.075zm4.574-4.2a9.2 9.2 0 0 0-1.725-2.1a11.2 11.2 0 0 0-3.6-2.25c2.4-1.124 4.425-1.274 5.475-.224c.825.975.75 2.624-.15 4.574q0 .112 0 0q0 .112 0 0"/>
                                            </svg>
                                            <span>Website</span>
                                        </a>
                                        <a href="https://www.youtube.com/@VibeCreAI" class="social-item" target="_blank" rel="noopener noreferrer">
                                            <img src="https://api.iconify.design/tdesign:logo-youtube-filled.svg?color=white" width="24" height="24" style="vertical-align: middle;" alt="YouTube">
                                            <span>YouTube</span>
                                        </a>
                                        <a href="https://discord.gg/QRd38zsMGw" class="social-item" target="_blank" rel="noopener noreferrer">
                                            <img src="https://api.iconify.design/ic:baseline-discord.svg?color=white" width="24" height="24" style="vertical-align: middle;" alt="Discord">
                                            <span>Discord</span>
                                        </a>
                                        <a href="https://www.twitch.tv/vibecreai" class="social-item" target="_blank" rel="noopener noreferrer">
                                            <img src="https://api.iconify.design/mdi:twitch.svg?color=white" width="24" height="24" style="vertical-align: middle;" alt="Twitch">
                                            <span>Twitch</span>
                                        </a>
                                        <a href="https://x.com/VibeCreAI" class="social-item" target="_blank" rel="noopener noreferrer">
                                            <img src="https://api.iconify.design/ri:twitter-x-fill.svg?color=white" width="24" height="24" style="vertical-align: middle;" alt="X">
                                            <span>Twitter</span>
                                        </a>
                                        <a href="mailto:contact@vibecreai.com" class="social-item" target="_blank" rel="noopener noreferrer">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: currentColor; vertical-align: middle;">
                                                <path fill="currentColor" fill-rule="evenodd" d="M23 20V6l-11 9L1 6v14zm-11-8l10-8H2z"/>
                                            </svg>
                                            <span>Email</span>
                                        </a>
                                    </div>
                                </div>
                                <div class="about-copyright">
                                    <p>&copy; <span id="about-copyright-year"></span> VibeCreAI</p>
                                </div>
                                <button id="close-about-btn" class="survivor-btn primary">CLOSE</button>
                                <p class="about-hint">WASD/Arrows to navigate, Enter to select, ESC to close</p>
                            </div>
                        </div>

                        <div id="game-screen" class="vibe-survivor-screen" style="position: relative;">
                            <canvas id="survivor-canvas"></canvas>
                            
                            <!-- Mobile Dash Button (inside canvas area) -->
                            <div id="mobile-dash-btn" class="mobile-dash-btn mobile-dash-right" style="display: none;">
                                <span>DASH</span>
                            </div>
                            
                            <!-- Pause Menu -->
                            <div id="pause-menu" class="pause-menu" style="display: none;">
                                <div class="pause-content" tabindex="0">
                                    <h2>GAME PAUSED</h2>
                                    <div class="pause-buttons">
                                        <button id="resume-btn" class="survivor-btn primary">RESUME</button>
                                        <button id="pause-restart-btn" class="survivor-btn">RESTART</button>
                                        <div class="pause-audio-section">
                                            <label>Music</label>
                                            <div class="audio-controls">
                                                <button id="music-mute-btn" class="survivor-btn small">MUTE</button>
                                                <input type="range" id="pause-music-volume" class="volume-slider" min="0" max="1" step="0.01" value="0.3">
                                                <span id="pause-music-percent" class="volume-percent">30%</span>
                                            </div>
                                        </div>
                                        <div class="pause-audio-section">
                                            <label>SFX</label>
                                            <div class="audio-controls">
                                                <button id="sfx-mute-btn" class="survivor-btn small">MUTE</button>
                                                <input type="range" id="pause-sfx-volume" class="volume-slider" min="0" max="1" step="0.01" value="0.5">
                                                <span id="pause-sfx-percent" class="volume-percent">50%</span>
                                            </div>
                                        </div>
                                        <button id="dash-position-btn" class="survivor-btn">DASH BUTTON: RIGHT</button>
                                        <button id="exit-to-menu-btn" class="survivor-btn">QUIT GAME</button>
                                    </div>
                                    <p class="pause-hint">Press ESC to resume</p>
                                </div>
                            </div>

                            <!-- Exit Confirmation Modal -->
                            <div id="exit-confirmation-modal" class="exit-confirmation-modal" style="display: none;">
                                <div class="exit-confirmation-content">
                                    <h2>QUIT GAME?</h2>
                                    <p>Are you sure you want to quit?<br>All progress will be lost!</p>
                                    <div class="exit-confirmation-buttons">
                                        <button id="exit-confirm-yes" class="survivor-btn danger">YES, QUIT</button>
                                        <button id="exit-confirm-no" class="survivor-btn primary">NO, CONTINUE</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Restart Confirmation Modal -->
                            <div id="restart-confirmation-modal" class="restart-confirmation-modal" style="display: none;">
                                <div class="restart-confirmation-content">
                                    <h2>RESTART GAME?</h2>
                                    <p>Are you sure you want to restart?<br>All current progress will be lost!</p>
                                    <div class="restart-confirmation-buttons">
                                        <button id="restart-confirm-yes" class="survivor-btn danger">YES, RESTART</button>
                                        <button id="restart-confirm-no" class="survivor-btn primary">NO, CONTINUE</button>
                                    </div>
                                </div>
                            </div>

                            <!-- Help Menu -->
                            <div id="help-menu" class="help-menu" style="display: none;">
                                <div class="help-content" tabindex="0">
                                    <div class="help-tabs">
                                        <button id="help-tab-status" class="help-tab active" data-tab="status">STATUS</button>
                                        <button id="help-tab-passives" class="help-tab" data-tab="passives">PASSIVES</button>
                                        <button id="help-tab-weapons" class="help-tab" data-tab="weapons">WEAPONS</button>
                                        <button id="help-tab-howto" class="help-tab" data-tab="howto">HOW TO</button>
                                    </div>

                                    <div id="help-pane-status" class="help-pane" style="display: block;"></div>

                                    <div id="help-pane-passives" class="help-pane" style="display: none;">
                                        <div id="help-passives-list" class="passive-grid"></div>
                                    </div>

                                    <div id="help-pane-weapons" class="help-pane" style="display: none;">
                                        <div id="help-weapons-list" class="weapon-list"></div>
                                    </div>

                                    <div id="help-pane-howto" class="help-pane" style="display: none;">
                                        <!-- Content will be populated by updateHowToContent() -->
                                    </div>
                                    <button id="close-help-btn" class="survivor-btn">CLOSE</button>
                                    <p class="help-hint">Press ESC to close</p>
                                </div>
                            </div>

                            <!-- Guide Modal -->
                            <div id="survivor-guide-overlay" class="guide-modal" style="display: none;">
                                <div class="guide-content" tabindex="0">
                                    <div class="help-tabs guide-tabs">
                                        <button class="guide-tab active" data-tab="howto">HOW TO</button>
                                        <button class="guide-tab" data-tab="passives">PASSIVES</button>
                                        <button class="guide-tab" data-tab="weapons">WEAPONS</button>
                                    </div>

                                    <div id="guide-pane-howto" class="guide-pane" style="display: block;">
                                        <!-- Content will be populated by updateHowToContent() -->
                                    </div>

                                    <div id="guide-pane-passives" class="guide-pane" style="display: none;">
                                        <div id="guide-passives-list" class="passive-grid"></div>
                                    </div>

                                    <div id="guide-pane-weapons" class="guide-pane" style="display: none;">
                                        <div id="guide-weapons-list" class="weapon-list"></div>
                                    </div>

                                    <button id="close-guide-btn" class="survivor-btn">CLOSE</button>
                                    <p class="help-hint">Press ESC to close</p>
                                </div>
                            </div>

                            <!-- Mobile Touch Controls -->
                            <div id="mobile-controls" class="mobile-controls" style="display: none;">
                                <!-- Virtual Joystick -->
                                <div id="virtual-joystick" class="virtual-joystick">
                                    <div id="joystick-handle" class="joystick-handle"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="survivor-game-over-screen" class="vibe-survivor-screen">
                            <div class="survivor-game-over">
                                <h2>GAME OVER</h2>
                                <div id="final-stats"></div>
                                <div class="survivor-buttons">
                                    <button id="restart-survivor" class="survivor-btn primary">PLAY AGAIN</button>
                                    <button id="exit-survivor" class="survivor-btn">EXIT</button>
                                </div>
                            </div>
                        </div>

                        <!-- Level Up Modal (Phase 12c - Static HTML) -->
                        <div id="levelup-modal" class="levelup-modal levelup-modal-responsive" style="display: none;">
                            <div class="levelup-content" tabindex="-1">
                                <div class="levelup-tabs">
                                    <button id="levelup-tab-main" class="levelup-tab active" data-tab="levelup">LEVEL UP</button>
                                    <button id="levelup-tab-guide" class="levelup-tab" data-tab="guide">GUIDE</button>
                                    <button id="levelup-tab-status" class="levelup-tab" data-tab="status">STATUS</button>
                                </div>
                                <div id="levelup-pane-levelup" class="levelup-pane active">
                                    <div class="levelup-title">LEVEL UP</div>
                                    <div class="levelup-scroll upgrade-choices-container">
                                        <div class="upgrade-choices">
                                            <!-- Upgrade choices will be populated dynamically -->
                                        </div>
                                    </div>
                                </div>
                                <div id="levelup-pane-guide" class="levelup-pane">
                                    <div class="levelup-scroll levelup-guide-pane guide-pane">
                                        <!-- Guide content will be populated by modal -->
                                    </div>
                                </div>
                                <div id="levelup-pane-status" class="levelup-pane">
                                    <div class="levelup-scroll levelup-status-pane help-pane">
                                        <!-- Status content will be populated by modal -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Game Over Modal (Phase 12c - Static HTML) -->
                        <div id="game-over-modal" class="survivor-game-over-overlay" style="display: none; touch-action: auto;">
                            <div class="survivor-game-over-content" style="touch-action: auto;">
                                <div class="gameover-title">GAME OVER</div>

                                <div class="game-over-scroll-content" tabindex="0" style="overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y;">
                                    <!-- Basic Stats Section -->
                                    <div class="gameover-basic-stats">
                                        <div class="gameover-stat-row">
                                            <span class="stat-label" data-i18n="level">Level</span>
                                            <span class="stat-value final-level">--</span>
                                        </div>
                                        <div class="gameover-stat-row">
                                            <span class="stat-label" data-i18n="time">Time</span>
                                            <span class="stat-value final-time">--</span>
                                        </div>
                                        <div class="gameover-stat-row">
                                            <span class="stat-label" data-i18n="enemies">Enemies</span>
                                            <span class="stat-value enemies-killed">--</span>
                                        </div>
                                        <div class="gameover-stat-row gameover-bosses-row" style="display: none;">
                                            <span class="stat-label" data-i18n="bosses">Bosses Defeated</span>
                                            <span class="stat-value bosses-defeated">0</span>
                                        </div>
                                    </div>

                                    <!-- Detailed Stats Sections (will be populated dynamically) -->
                                    <div class="gameover-weapons-section"></div>
                                    <div class="gameover-passives-section"></div>
                                    <div class="gameover-player-stats-section"></div>
                                </div>

                                <!-- Submit to Global Section -->
                                <div class="gameover-submit-section" style="border-top: 2px solid var(--text-primary);">
                                    <button id="gameover-submit-global-btn" class="survivor-btn submit-global" style="width: 100%; margin-bottom: 0.5rem;">
                                        SUBMIT TO GLOBAL
                                    </button>
                                </div>

                                <div class="gameover-buttons">
                                    <button class="gameover-restart-btn survivor-btn primary">RETRY</button>
                                    <button class="gameover-exit-btn survivor-btn">EXIT</button>
                                </div>
                            </div>
                        </div>

                        <!-- Chest Modal (Passive Upgrades) -->
                        <div id="chest-modal" class="chest-modal" style="display: none;">
                            <div class="chest-content" tabindex="-1">
                                <div class="chest-tabs">
                                    <button class="chest-tab active" data-tab="upgrades">CHEST</button>
                                    <button class="chest-tab" data-tab="guide">GUIDE</button>
                                    <button class="chest-tab" data-tab="status">STATUS</button>
                                </div>
                                <div id="chest-pane-upgrades" class="chest-pane active">
                                    <h2 class="chest-title">UPGRADE CHEST</h2>
                                    <p class="chest-subtitle">Choose one passive upgrade</p>
                                    <div class="chest-scroll chest-upgrades-scroll">
                                        <div class="chest-choices">
                                            <!-- Upgrade choices populated dynamically -->
                                        </div>
                                    </div>
                                    <p class="chest-hint">↑↓ Navigate • Enter Select</p>
                                </div>
                                <div id="chest-pane-guide" class="chest-pane">
                                    <div class="chest-scroll">
                                        <div class="chest-guide-pane">
                                            <!-- Guide content populated dynamically -->
                                        </div>
                                    </div>
                                </div>
                                <div id="chest-pane-status" class="chest-pane">
                                    <div class="chest-scroll">
                                        <div class="chest-status-pane help-pane">
                                            <!-- Status content populated dynamically -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                        <!-- Scoreboard Modal -->
                        <div id="scoreboard-modal" class="scoreboard-modal" style="display: none;">
                            <div class="scoreboard-content">
                                <div class="scoreboard-header">
                                    <div class="scoreboard-title">SCOREBOARD</div>
                                    <!-- NEW: Tab buttons -->
                                    <div class="scoreboard-tabs">
                                        <button class="scoreboard-tab active" data-tab="local">LOCAL</button>
                                        <button class="scoreboard-tab" data-tab="global">GLOBAL</button>
                                    </div>
                                    <div class="scoreboard-filter">
                                        <label for="scoreboard-version-filter">Version</label>
                                        <select id="scoreboard-version-filter">
                                            <option value="all">All Versions</option>
                                        </select>
                                    </div>
                                </div>
                                <!-- NEW: Tab content container -->
                                <div class="scoreboard-tabs-content">
                                    <!-- LOCAL TAB -->
                                    <div class="scoreboard-tab-pane active" data-tab-pane="local">
                                        <div class="scoreboard-list-container" tabindex="0">
                                            <div id="scoreboard-list" class="scoreboard-list"></div>
                                            <div class="scoreboard-empty-state" style="display: none;">No scores yet. Play a run to add your first record!</div>
                                        </div>
                                    </div>
                                    <!-- GLOBAL TAB -->
                                    <div class="scoreboard-tab-pane" data-tab-pane="global">
                                        <div class="scoreboard-list-container" tabindex="0">
                                            <div id="global-scoreboard-list" class="scoreboard-list"></div>
                                            <!-- Loading state -->
                                            <div class="global-loading-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; gap: 1rem;">
                                                <div class="spinner"></div>
                                                <p>Loading global scores...</p>
                                            </div>
                                            <!-- Error state -->
                                            <div class="global-error-state" style="display: none; padding: 2rem; text-align: center;">
                                                Failed to load global scores
                                            </div>
                                            <!-- Empty state -->
                                            <div class="global-empty-state" style="display: none; padding: 3rem; text-align: center;">
                                                No global scores yet. Be the first!
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="scoreboard-actions">
                                    <button id="scoreboard-clear-btn" class="survivor-btn small destructive">CLEAR ALL</button>
                                    <button id="scoreboard-close-btn" class="survivor-btn small">CLOSE</button>
                                </div>
                            </div>
                        </div>

                        <!-- Score Detail Modal -->
                        <div id="score-detail-modal" class="score-detail-modal" style="display: none;">
                            <div class="score-detail-content">
                                <div class="score-detail-header">
                                    <div class="score-detail-title">RUN DETAILS</div>
                                    <div class="score-detail-meta">
                                        <span class="score-detail-version">v1.0.0</span>
                                        <span class="score-detail-date">--</span>
                                    </div>
                                </div>
                                <div class="score-detail-summary">
                                    <div class="summary-chip score-detail-level"></div>
                                    <div class="summary-chip score-detail-time"></div>
                                    <div class="summary-chip score-detail-enemies"></div>
                                    <div class="summary-chip score-detail-bosses"></div>
                                    <div class="summary-chip score-detail-chests"></div>
                                </div>
                                <div class="score-detail-scroll" tabindex="0" style="overflow-y: auto; -webkit-overflow-scrolling: touch; touch-action: pan-y;">
                                    <div class="score-detail-section">
                                        <h3 data-heading="weapons">Weapons</h3>
                                        <div class="score-detail-weapons"></div>
                                    </div>
                                    <div class="score-detail-section">
                                        <h3 data-heading="passives">Passives</h3>
                                        <div class="score-detail-passives"></div>
                                    </div>
                                    <div class="score-detail-section">
                                        <h3 data-heading="player">Player Stats</h3>
                                        <div class="score-detail-player"></div>
                                    </div>
                                </div>
                                <!-- NEW: Submission Section -->
                                <div class="score-submission-section">
                                    <!-- Show when NOT submitted -->
                                    <button id="submit-to-global-btn" class="survivor-btn submit-global" style="display: none;">
                                        SUBMIT TO GLOBAL
                                    </button>

                                    <!-- Show when submitted -->
                                    <div id="submission-status" style="display: none;">
                                        <div class="submission-info">
                                            <span class="submission-checkmark">✓</span>
                                            <span class="submission-text">
                                                Submitted as <strong id="submitted-name"></strong>
                                            </span>
                                        </div>
                                        <button id="view-on-global-btn" class="survivor-btn">
                                            VIEW ON GLOBAL BOARD
                                        </button>
                                    </div>
                                </div>
                                <div class="score-detail-actions">
                                    <button id="score-detail-back-btn" class="survivor-btn">BACK TO LIST</button>
                                    <button id="score-detail-delete-btn" class="survivor-btn destructive">DELETE RECORD</button>
                                </div>
                            </div>
                        </div>

                        <!-- Prompt Modal (for name input) -->
                        <div id="prompt-modal" class="prompt-modal" style="display: none;">
                            <div class="prompt-content">
                                <div class="prompt-message">Enter your display name:</div>
                                <input type="text" class="prompt-input" placeholder="Player name" maxlength="20" />
                                <div class="prompt-actions">
                                    <button class="prompt-confirm-btn survivor-btn primary">CONFIRM</button>
                                    <button class="prompt-cancel-btn survivor-btn">CANCEL</button>
                                </div>
                            </div>
                        </div>

                        <!-- Notification Modal (for alerts) -->
                        <div id="notification-modal" class="notification-modal" style="display: none;">
                            <div class="notification-content">
                                <div class="notification-message">Notification message</div>
                                <div class="notification-actions">
                                    <button class="notification-ok-btn survivor-btn primary">OK</button>
                                </div>
                            </div>
                        </div>

                    <!-- Toast Notification Container (at modal level) -->
                    <div id="toast-container" class="toast-container"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        requestAnimationFrame(() => this.updateStartOverlayLayout());

        // Populate copyright year
        const copyrightYearElement = document.getElementById('about-copyright-year');
        if (copyrightYearElement) {
            copyrightYearElement.textContent = new Date().getFullYear();
        }

        // Phase 12c - Add game-over modal styles
        this.addGameOverModalStyles();

        // Add toast notification styles
        this.addToastStyles();

        // Add touch event listeners to prevent background page scrolling
        this.preventBackgroundScrolling();

        // Modal created successfully
    }

    addStyles() {
        if (document.getElementById('vibe-survivor-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'vibe-survivor-styles';
        styles.textContent = `
            :root {
                --header-height: 70px; /* Default header height */
                --canvas-margin: 80px;
                --safe-zone-mobile: 60px;
                --touch-control-size: 100px;
            }
            
            @keyframes neonPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }

            @keyframes blinkCursor {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }

            /* Loading Screen Styles */
            .loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            }

            .loading-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                justify-content: center;
                transform: translateY(0);
                height: 100%;
            }

            .loading-logo {
                max-width: min(50%, 340px);
                width: 100%;
                height: auto;
                margin-bottom: 8px;
                image-rendering: pixelated;
            }

            .loading-text {
                font-family: 'NeoDunggeunmoPro', 'Courier New', monospace;
                font-size: 3rem;
                color: #ffffff;
                text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
                letter-spacing: 0.2em;
            }

            .loading-cursor {
                animation: blinkCursor 1s infinite;
            }

            .loading-gauge {
                width: clamp(240px, 60vw, 420px);
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .loading-track {
                --gauge-height: 20px;
                position: relative;
                height: var(--gauge-height);
                border-radius: calc(var(--gauge-height) / 2);
                background:
                    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 0 12px, transparent 12px) 0 0 / 16px 100%,
                    rgba(255, 255, 255, 0.08);
                box-shadow:
                    inset 0 0 15px rgba(0, 0, 0, 0.8),
                    0 0 12px rgba(0, 255, 255, 0.15);
                overflow: hidden;
            }

            .loading-track.flash {
                box-shadow:
                    inset 0 0 15px rgba(0, 0, 0, 0.8),
                    0 0 16px rgba(0, 255, 255, 0.4),
                    0 0 32px rgba(0, 255, 255, 0.25);
            }

            .loading-fill {
                position: absolute;
                inset: 2px;
                border-radius: calc(var(--gauge-height) / 2);
                background: #00ffff;
                width: 0%;
                transition: width 0.3s ease-out;
            }

            .loading-cap {
                position: absolute;
                top: 50%;
                right: 4px;
                transform: translateY(-50%);
                width: 12px;
                height: calc(var(--gauge-height) - 6px);
                border-radius: 999px;
                opacity: 0.2;
                background: rgba(255, 255, 255, 0.4);
            }

            .loading-metrics {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                font-family: 'NeoDunggeunmoPro', 'Courier New', monospace;
                font-size: 0.8rem;
                letter-spacing: 0.08em;
                color: rgba(255, 255, 255, 0.85);
            }

            .loading-percent {
                font-family: 'NeoDunggeunmoPro', 'Courier New', monospace;
                font-size: 1.3rem;
                color: #00ffff;
            }

            .loading-label {
                opacity: 0.8;
                text-transform: uppercase;
                display: inline-block;
                text-align: right;
                line-height: 1.1;
            }

            @media (max-width: 480px) {
                .loading-text {
                    font-size: 2rem;
                }
                .loading-gauge {
                    width: 80vw;
                }
            }

            @keyframes glowPulse {
                0%, 100% { 
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8),
                               0 0 40px rgba(0, 255, 255, 0.5),
                               0 0 60px rgba(0, 255, 255, 0.3);
                }
                50% { 
                    box-shadow: 0 0 30px rgba(0, 255, 255, 1),
                               0 0 60px rgba(0, 255, 255, 0.7),
                               0 0 90px rgba(0, 255, 255, 0.5);
                }
            }
            
            @keyframes joystickPulse {
                0%, 100% {
                    opacity: 0.6;
                    transform: scale(0.8);
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3),
                               0 0 40px rgba(0, 255, 255, 0.1);
                }
                50% {
                    opacity: 0.8;
                    transform: scale(0.85);
                    box-shadow: 0 0 25px rgba(0, 255, 255, 0.4),
                               0 0 50px rgba(0, 255, 255, 0.15);
                }
            }
            
            .vibe-survivor-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                background: transparent;
                backdrop-filter: none;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease;
                overscroll-behavior: none;
            }

            .vibe-survivor-modal.game-active {
                top: 10px;
                height: calc(100dvh - 40px);
                backdrop-filter: blur(10px);
            }

            .vibe-survivor-content {
                background: transparent;
                border-radius: 0;
                padding: 0;
                width: 100%;
                max-width: none;
                height: 100vh;
                display: flex;
                flex-direction: column;
                border: none;
                box-shadow: none;
                overflow: hidden;
                touch-action: none;
                overscroll-behavior: none;
            }

            .vibe-survivor-content.game-active {
                background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 100%);
                border-radius: 20px;
                width: 95%;
                max-width: 900px;
                height: calc(100dvh - 100px);
                border: 2px solid #00ffff;
                box-shadow: 0 0 40px rgba(0, 255, 255, 0.3),
                           inset 0 0 20px rgba(0, 255, 255, 0.1);
            }

            .vibe-survivor-content.overlay-active .pause-btn,
            .vibe-survivor-content.overlay-active .header-help-btn,
            .vibe-survivor-content.pause-menu-open .pause-btn,
            .vibe-survivor-content.pause-menu-open .header-help-btn {
                opacity: 0;
                pointer-events: none;
                visibility: hidden;
                transition: opacity 0.2s ease;
            }

            .vibe-survivor-header {
                padding: 15px 20px;
                border-bottom: 2px solid rgba(0, 255, 255, 0.3);
                display: none !important;
                justify-content: space-between;
                align-items: center;
                position: relative !important;
                pointer-events: auto !important;
                visibility: hidden !important;
                opacity: 0 !important;
                background: rgba(0, 20, 40, 0.8);
                height: 120px;
                flex-wrap: nowrap;
            }

            .vibe-survivor-content.game-active .vibe-survivor-header {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
            }
            
            .header-stats {
                display: flex !important;
                align-items: center;
                gap: 5px;
                flex: 1;
                justify-content: center;
                margin: 0 60px; /* Reserve 60px each side for buttons */
                overflow: hidden; /* Prevent content overflow */
                flex-wrap: wrap; /* Allow wrapping to multiple rows */
            }
            
            .header-primary-stats {
                display: flex;
                align-items: center;
                gap: 20px;
                flex-shrink: 0; /* Prevent primary stats from shrinking */
            }
            
            .header-vitals {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .header-timing {
                display: flex;
                flex-direction: column;
                gap: 2px;
                align-items: center;
            }

            .header-health, .header-xp {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .header-health-bar, .header-xp-bar {
                width: 100px;
                height: 8px;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .header-health-fill {
                height: 100%;
                background-color: #00ff00; /* Default green, will be overridden by JavaScript */
                transition: width 0.3s ease, background-color 0.3s ease;
                border-radius: 3px;
            }
            
            .header-xp-fill {
                height: 100%;
                background: linear-gradient(90deg, #00ffff, #00cccc);
                transition: width 0.3s ease;
                border-radius: 3px;
                box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
            }
            
            .header-health-text, .header-level-text, .header-time, .header-bosses {
                color: #00ffff;
                font-size: 14px;
                font-weight: bold;
                text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
                min-width: 30px;
            }
            
            .header-bosses {
                color: #ff00ff;
                text-shadow: 0 0 5px rgba(255, 0, 255, 0.5);
            }
            
            .header-time {
                font-size: 16px;
                color: #ffff00;
                margin-right: 10px;
                text-shadow: 0 0 8px rgba(255, 255, 0, 0.6);
            }
            
            .header-loadouts {
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: center;
                justify-content: center;
            }

            .header-loadout {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
                justify-content: center;
            }

            .header-loadout-row,
            .header-weapons,
            .header-passives {
                display: flex;
                gap: 6px;
                align-items: center;
                flex-wrap: wrap;
                justify-content: center;
            }

            .header-weapon-item,
            .header-passive-item,
            .header-slot {
                display: flex;
                align-items: center;
                gap: 4px;
                background: rgba(0, 255, 255, 0.12);
                border: 1px solid rgba(0, 255, 255, 0.35);
                border-radius: 4px;
                padding: 3px 6px;
                font-size: 11px;
                color: #00ffff;
                text-shadow: 0 0 3px rgba(0, 255, 255, 0.8);
            }

            .header-passive-item {
                background: rgba(255, 0, 255, 0.12);
                border-color: rgba(255, 0, 255, 0.35);
                color: #ffb3ff;
            }

            .header-passive-unique {
                background: rgba(255, 215, 0, 0.25) !important;
                border: 1px solid rgba(255, 215, 0, 0.6) !important;
                color: #ffe27a !important;
                text-shadow: 0 0 5px rgba(255, 215, 0, 0.8) !important;
                box-shadow: 0 0 6px rgba(255, 215, 0, 0.4);
                font-weight: bold;
            }

            .header-weapon-merge {
                background: rgba(255, 215, 0, 0.3) !important;
                border: 1px solid rgba(255, 215, 0, 0.6) !important;
                color: #FFD700 !important;
                text-shadow: 0 0 5px rgba(255, 215, 0, 0.8) !important;
                font-weight: bold !important;
            }

            .header-slot-icon {
                width: 16px;
                height: 16px;
                object-fit: contain;
            }

            .header-weapon-icon {
                width: 16px;
                height: 16px;
                object-fit: contain;
            }

            .header-weapon-text,
            .header-slot-count {
                font-size: 11px;
                white-space: nowrap;
            }

            .header-weapon-empty {
                background: rgba(0, 255, 255, 0.05);
                border: 1px dashed rgba(0, 255, 255, 0.2);
                border-radius: 4px;
                padding: 3px 6px;
                font-size: 11px;
                color: rgba(0, 255, 255, 0.3);
                text-shadow: none;
            }

            .header-passive-empty {
                background: rgba(255, 0, 255, 0.05);
                border: 1px dashed rgba(255, 0, 255, 0.2);
                border-radius: 4px;
                padding: 3px 6px;
                font-size: 11px;
                color: rgba(255, 0, 255, 0.3);
                text-shadow: none;
            }

            .header-passive-icon {
                width: 16px;
                height: 16px;
                object-fit: contain;
            }
            
            /* Ultra-narrow mobile screens */
            @media screen and (max-width: 320px) {
                .vibe-survivor-header {
                    padding: 8px 10px;
                    min-height: 70px; /* Increased for two-row layout */
                    flex-direction: row;
                    align-items: center;
                }
                
                .pause-btn, .header-help-btn {
                    width: 32px !important;
                    height: 32px !important;
                    font-size: 16px !important;
                }
                
                .header-stats {
                    gap: 5px;
                    flex: 1;
                    justify-content: center;
                    align-items: center;
                    margin: 0 45px; /* 32px buttons + 13px clearance each side */
                    overflow: visible; /* Allow overflow for wrapped content */
                    flex-direction: column; /* Stack rows vertically */
                }
                
                .header-primary-stats {
                    gap: 8px;
                    justify-content: space-between;
                    width: 100%;
                }
                
                .header-vitals {
                    gap: 2px;
                }
                
                .header-timing {
                    gap: 1px;
                    align-items: center;
                }
                
                .header-health, .header-xp {
                    flex-direction: column;
                    gap: 2px;
                    align-items: center;
                }
                
                .header-health-bar, .header-xp-bar {
                    width: 40px;
                    height: 4px;
                }
                
                .header-health-text, .header-level-text {
                    font-size: 9px;
                    min-width: 20px;
                }
                
                .header-time {
                    font-size: 11px;
                }
                
                .header-loadouts {
                    width: 100%;
                    justify-content: center;
                    gap: 6px;
                }

                .header-loadout-row,
                .header-weapons,
                .header-passives {
                    display: flex; /* Show loadouts below on ultra-narrow screens */
                    width: 100%;
                    justify-content: center;
                    gap: 4px;
                    margin-top: 3px;
                }

                .header-weapon-item,
                .header-passive-item,
                .header-slot {
                    padding: 1px 2px;
                    font-size: 7px;
                }

                .header-slot-icon {
                    width: 10px;
                    height: 10px;
                }

                .header-weapon-text,
                .header-slot-count {
                    font-size: 7px;
                }
            }

            /* Narrow mobile screens */
            @media screen and (min-width: 321px) and (max-width: 400px) {
                .vibe-survivor-header {
                    padding: 8px 12px;
                    min-height: 75px; /* Increased for two-row layout */
                }
                
                .pause-btn, .header-help-btn {
                    width: 35px !important;
                    height: 35px !important;
                    font-size: 17px !important;
                }
                
                .header-stats {
                    gap: 5px;
                    margin: 0 50px; /* 35px buttons + 15px clearance each side */
                    overflow: visible; /* Allow overflow for wrapped content */
                    flex-direction: column; /* Stack rows vertically */
                }
                
                .header-primary-stats {
                    gap: 15px;
                    justify-content: center;
                    width: 100%;
                }
                
                .header-vitals {
                    gap: 3px;
                }
                
                .header-timing {
                    gap: 2px;
                    align-items: center;
                }
                
                .header-loadouts {
                    width: 100%;
                    justify-content: center;
                    gap: 7px;
                }

                .header-loadout-row,
                .header-weapons,
                .header-passives {
                    display: flex; /* Show loadouts below on narrow screens */
                    width: 100%;
                    justify-content: center;
                    gap: 5px;
                    margin-top: 5px;
                }

                .header-health-bar, .header-xp-bar {
                    width: 60px;
                    height: 5px;
                }
                
                .header-health-text, .header-level-text {
                    font-size: 10px;
                    min-width: 22px;
                }
                
                .header-time {
                    font-size: 12px;
                }
                
                .header-weapon-item,
                .header-passive-item,
                .header-slot {
                    padding: 1px 3px;
                    font-size: 8px;
                }

                .header-slot-icon {
                    width: 12px;
                    height: 12px;
                }

                .header-weapon-text,
                .header-slot-count {
                    font-size: 8px;
                }
            }
            
            /* Standard mobile screens */
            @media screen and (min-width: 401px) and (max-width: 640px) {
                .vibe-survivor-header {
                    padding: 10px 15px;
                    min-height: 80px; /* Increased to accommodate weapon wrapping */
                }

                .header-stats {
                    gap: 5px;
                    margin: 0 55px; /* 40px buttons + 15px clearance each side */
                    overflow: visible; /* Allow weapons to wrap */
                    flex-wrap: wrap; /* Allow content to wrap */
                }

                .header-loadouts {
                    width: 100%;
                    justify-content: center;
                }

                .header-primary-stats {
                    gap: 15px;
                }
                
                .header-vitals {
                    gap: 4px;
                }
                
                .header-timing {
                    gap: 2px;
                    align-items: center;
                }
                
                .header-health-bar, .header-xp-bar {
                    width: 80px;
                    height: 6px;
                }
                
                .header-health-text, .header-level-text {
                    font-size: 12px;
                    min-width: 25px;
                }
                
                .header-time {
                    font-size: 14px;
                }
                
                .header-weapon-item,
                .header-passive-item,
                .header-slot {
                    padding: 2px 4px;
                    font-size: 10px;
                }

                .header-slot-icon {
                    width: 14px;
                    height: 14px;
                }

                .header-weapon-text,
                .header-slot-count {
                    font-size: 10px;
                }
            }

            /* Medium screens - ensure weapons can wrap */
            @media screen and (min-width: 641px) and (max-width: 750px) {
                .vibe-survivor-header {
                    min-height: 90px; /* Allow space for potential weapon wrapping */
                }

                .header-stats {
                    overflow: visible; /* Allow weapons to wrap */
                    flex-wrap: wrap; /* Allow content to wrap */
                }

                .header-loadouts,
                .header-loadout-row,
                .header-weapons,
                .header-passives {
                    flex-wrap: wrap; /* Ensure loadouts can wrap */
                    max-width: 100%; /* Don't exceed container width */
                }
            }

            .vibe-survivor-header h2 {
                color: #00ffff;
                margin: 0;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }

            .header-help-btn {
                background: rgba(0, 255, 255, 0.1);
                border: 2px solid #00ffff;
                color: #00ffff;
                width: 40px;
                height: 40px;
                min-width: 40px;
                min-height: 40px;
                flex-shrink: 0;
                border-radius: 50%;
                font-size: 20px;
                font-weight: bold;
                transition: all 0.3s ease;
                position: absolute !important;
                top: 38px !important;
                right: 12px !important;
                z-index: 999999 !important;
                pointer-events: auto !important;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                cursor: pointer;
            }

            .header-help-btn:hover {
                background: rgba(0, 255, 255, 0.3);
                transform: scale(1.1);
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
            }

            .header-help-btn:active {
                background: #00ffff;
                color: #000;
                transform: scale(0.9);
            }

            .header-help-btn:focus {
                outline: none;
                border: 2px solid #00ffff !important;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
            }

            /* Ensure help button maintains cyan border in all states */
            #help-btn {
                border: 2px solid #00ffff !important;
                border-color: #00ffff !important;
            }

            /* Override any menu selection styling that might affect the help button */
            #help-btn:not(.menu-selected) {
                border: 2px solid #00ffff !important;
                border-color: #00ffff !important;
                box-shadow: none !important;
            }
            
            /* Position pause button on left */
            #pause-btn {
                position: absolute !important;
                top: 38px !important;
                left: 12px !important;
                z-index: 999999 !important;
                pointer-events: auto !important;
                min-width: 40px; /* Ensure button maintains size */
                min-height: 40px;
                flex-shrink: 0; /* Prevent button from shrinking */
            }
            
            /* Hide pause button initially */
            #pause-btn {
                display: none;
            }

            .vibe-survivor-screen {
                position: absolute;
                top: 0;
                left: 0;
                width: 100% !important;
                display: none !important;
                align-items: center !important;
                justify-content: center !important;
                flex-direction: column !important;
                z-index: 100 !important;
                background: transparent !important;
                overflow: hidden !important;
            }
            
            /* Separate Start Screen Overlay - Full screen over landing page */
            .survivor-start-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                display: none !important;
                align-items: center !important;
                justify-content: center !important;
                flex-direction: column !important;
                z-index: 150 !important;
                background: transparent;
                overflow: hidden !important;
            }

            .survivor-start-overlay.active {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
            }

            .chroma-awards-header {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 8px 12px;
                z-index: 200;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.4s ease;
            }

            .vibe-survivor-screen {
                position: relative;
                flex: 1;
                display: none !important;
                flex-direction: column;
                overflow: hidden;
            }

            .vibe-survivor-screen.active {
                display: flex !important;
            }

            .vibe-survivor-content.game-active #game-screen {
                display: flex !important;
            }

            .vibe-survivor-screen.active {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
            }

            .survivor-title {
                position: relative;
                padding-top: 0;
                text-align: center;
                margin-bottom: 20px;
                color: white;
                opacity: 0;
                transition: opacity 0.6s ease-in;
            }

            .survivor-title .title-logo {
                max-width: min(80%, 680px);
                width: 100%;
                height: auto;
                image-rendering: pixelated;
                filter: drop-shadow(0 0 5px rgba(0, 255, 255, 0.7))
                        drop-shadow(-2px -2px 3px rgba(0, 0, 0, 0.4));
            }

            .chroma-awards-logo {
                max-width: 420px;
                max-height: 120px;
                height: 120px;
                width: auto;
                object-fit: contain;
                margin: 0;
                border-radius: 12px;
                cursor: pointer;
                box-shadow: none;
                transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
                image-rendering: auto;
                display: block;
            }

            .chroma-awards-logo:hover,
            .chroma-awards-logo:focus-visible,
            .chroma-awards-logo.chroma-active {
                transform: scale(1.02);
                box-shadow: none;
                filter:
                    drop-shadow(0 0 14px rgba(255, 213, 102, 0.55))
                    drop-shadow(0 0 28px rgba(255, 213, 102, 0.45));
                outline: none;
            }

            .title-logo:hover,
            .title-logo:focus-visible,
            .title-logo.vibe-active {
                transform: scale(1.02);
                filter:
                    drop-shadow(0 0 14px rgba(0, 255, 255, 0.6))
                    drop-shadow(0 0 28px rgba(0, 255, 255, 0.4));
                outline: none;
            }

            .survivor-title h1 {
                color: #00ffff;
                font-size: 32px;
                margin-bottom: 20px;
                font-family: 'NeoDunggeunmoPro', 'Arial Black', sans-serif;
                animation: neonPulse 2s ease-in-out infinite;
            }

            .start-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
                align-items: center;
                width: min(280px, 100%);
                margin: 16px auto 0;
            }

            .start-actions .survivor-btn {
                width: 100%;
                max-width: 100%;
                margin: 0;
            }

            .chroma-awards-block {
                display: flex;
                flex-direction: row;
                align-items: center;
                gap: 0px;
                margin-right: 20px;
                line-height: 1.1;
                text-align: center;
                z-index: 2;
                pointer-events: auto;
            }

            .survivor-title p {
                color: rgba(255, 255, 255, 0.95);
                margin-bottom: 10px;
                font-size: 16px;
                font-family: 'NeoDunggeunmoPro', 'Courier New', monospace;
                text-shadow:
                    -2px -2px 0 #000,
                     2px -2px 0 #000,
                    -2px  2px 0 #000,
                     2px  2px 0 #000,
                    0 0 10px rgba(0, 0, 0, 0.8);
            }

            .chroma-award-text {
                font-size: 16px;
                color: #ffe7b8;
                margin: 0;
                display: block;
                line-height: 1.2;
                max-width: 520px;
                font-family: 'NeoDunggeunmoPro', 'Courier New', monospace;
                text-shadow:
                    -2px -2px 0 #000,
                     2px -2px 0 #000,
                    -2px  2px 0 #000,
                     2px  2px 0 #000,
                     0 0 12px rgba(0, 0, 0, 0.8);
            }

            .chroma-award-text a {
                color: #ffd166;
                text-decoration: underline;
            }

            .chroma-award-text a:hover,
            .chroma-award-text a:focus-visible {
                color: #ffffff;
                outline: none;
            }

            .controls-info {
                color: rgba(255, 255, 255, 0.95) !important;
                margin-top: 10px !important;
                margin-left: 20px;
                text-shadow:
                    -2px -2px 0 #000,
                     2px -2px 0 #000,
                    -2px  2px 0 #000,
                     2px  2px 0 #000,
                    0 0 10px rgba(0, 0, 0, 0.8);
                margin-right: 20px;
                padding: 10px;
                font-size: 16px !important;
                font-family: 'NeoDunggeunmoPro', 'Courier New', monospace !important;
            }

            /* Hide mobile controls text on desktop */
            .mobile-only {
                display: none;
            }

            /* Show mobile controls text on mobile devices */
            @media screen and (max-width: 768px) {
                .mobile-only {
                    display: block;
                }
            }

            .survivor-btn {
                padding: 7px 20px;
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid #00ffff;
                color: #00ffff;
                font-weight: bold;
                font-size: 18px;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 2px;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
                border-radius: 30px;
                position: relative;
                overflow: hidden;
                margin: 10px;
            }

            .survivor-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, #00ffff, transparent);
                transition: left 0.5s ease;
            }

            .survivor-btn:hover {
                background: rgba(0, 255, 255, 0.1);
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.8),
                           inset 0 0 20px rgba(0, 255, 255, 0.2);
                transform: translateY(-2px);
            }

            .survivor-btn:hover::before {
                left: 100%;
            }

            .survivor-btn.primary {
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid #ff00ff;
                color: #ff00ff;
                box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
            }

            .survivor-btn.primary:hover {
                background: rgba(255, 0, 255, 0.3);
                box-shadow: 0 0 20px rgba(255, 0, 255, 0.8);
            }

            #survivor-canvas {
                border-radius: 10px;
            }



            
            .pause-btn {
                background: rgba(0, 255, 255, 0.1);
                border: 2px solid #00ffff;
                color: #00ffff;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 999999 !important;
                pointer-events: auto !important;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .pause-btn:hover {
                background: #00ffff;
                color: #000;
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
                transform: scale(1.1);
            }
            

            .help-menu {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.82);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 120000;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                pointer-events: auto;
            }

            .help-content {
                background: linear-gradient(135deg, #0a0a1a, #1a0a2a);
                border: 2px solid #00ffff;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                width: 92%;
                max-width: 550px;
                max-height: 80vh;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                touch-action: pan-y;
                outline: none;
            }

            .help-tabs {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }

            .help-tab {
                background: transparent;
                border: 2px solid #00ffff;
                color: #00ffff;
                padding: 8px 18px;
                border-radius: 999px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s ease;
                text-transform: uppercase;
            }

            .help-tab.active {
                background: #00ffff;
                color: #0a0a1a;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
            }

            .help-tab:not(.active):hover {
                background: rgba(0, 255, 255, 0.1);
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
            }

            .help-pane {
                text-align: left;
            }

            .guide-pane {
                text-align: center;
            }

            .guide-pane .help-section,
            .guide-pane .merge-recipe {
                text-align: center;
            }

            .guide-pane .help-section p,
            .guide-pane .merge-recipe p,
            .guide-pane .merge-recipe span,
            .guide-pane .help-section span {
                max-width: none;
                margin-left: auto;
                margin-right: auto;
                display: block;
            }

            .help-status-empty {
                color: #888;
                text-align: center;
                margin-top: 20px;
                font-size: 14px;
            }

            .help-content h2 {
                color: #00ffff;
                margin-bottom: 16px;
                margin-top: 24px;
                font-size: 20px;
                text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
            }

            .help-pane h2:first-of-type {
                margin-top: 0;
            }

            .help-recipes {
                margin-bottom: 20px;
            }

            .merge-recipe {
                background: linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(255, 215, 0, 0.06));
                border: 1px solid rgba(255, 215, 0, 0.4);
                border-radius: 8px;
                margin-bottom: 12px;
                text-align: center;
                box-shadow: 0 0 14px rgba(255, 200, 0, 0.18);
            }

            .merge-recipe img {
                width: 40px;
                height: 40px;
                margin-right: 0;
                vertical-align: middle;
                image-rendering: pixelated;
            }

            .section-icon {
                width: 40px;
                height: 40px;
                margin-right: 8px;
                vertical-align: middle;
                image-rendering: pixelated;
            }

            .help-section {
                background: rgba(0, 255, 255, 0.04);
                border: 1px solid rgba(0, 255, 255, 0.18);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
                text-align: left;
            }

            .guide-pane .help-section {
                text-align: center !important;
            }

            .guide-pane .help-section p {
                text-align: center;
            }

            .merge-recipe h3 {
                color: #ffdf70;
                margin-bottom: 6px;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }

            .merge-recipe p {
                color: #ffe8b0;
                margin-bottom: 4px;
                font-weight: bold;
                font-size: 14px;
            }

            .recipe-desc {
                color: #f9d97a;
                font-style: italic;
                font-size: 13px;
                margin-bottom: 12px;
            }

            .help-hint {
                color: #888;
                font-size: 14px;
                margin-top: 15px;
            }

            .pause-menu {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.82);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 120000;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
                pointer-events: auto;
            }

            /* When visible, use flex layout for centering */
            .pause-menu[style*="display: block"],
            .pause-menu[style*="display: flex"] {
                display: flex !important;
            }

            .pause-content {
                background: linear-gradient(135deg, #0a0a1a, #1a0a2a);
                border: 2px solid #00ffff;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
                width: 92%;
                max-width: 550px;
                max-height: 80vh;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                touch-action: pan-y;
                outline: none;
            }

            .pause-content h2 {
                color: #00ffff;
                font-size: 2rem;
                margin-bottom: 30px;
                text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
            }

            .pause-buttons {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 20px;
            }

            .pause-hint {
                color: #888;
                font-size: 0.9rem;
                margin: 0;
            }

            /* Exit Confirmation Modal */
            .exit-confirmation-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 140000;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
            }

            /* When visible, use flex layout for centering */
            .exit-confirmation-modal[style*="display: block"],
            .exit-confirmation-modal[style*="display: flex"] {
                display: flex !important;
            }

            .exit-confirmation-content {
                background: linear-gradient(135deg, #1a0a0a, #2a0a1a);
                border: 3px solid #ff4444;
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 0 40px rgba(255, 68, 68, 0.6);
                max-width: 400px;
            }

            .exit-confirmation-content h2 {
                color: #ff6666;
                margin: 0 0 20px 0;
                font-size: 1.8rem;
                text-shadow: 0 0 10px rgba(255, 68, 68, 0.8);
                font-family: 'NeoDunggeunmoPro', 'Arial Black', sans-serif;
            }

            .exit-confirmation-content p {
                color: #cccccc;
                margin: 0 0 30px 0;
                font-size: 1rem;
                line-height: 1.4;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
            }

            .exit-confirmation-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .exit-confirmation-buttons .survivor-btn {
                min-width: 120px;
            }

            .exit-confirmation-buttons .survivor-btn.danger {
                background: linear-gradient(135deg, #ff4444, #cc2222);
                border-color: #ff6666;
                box-shadow: 0 0 15px rgba(255, 68, 68, 0.3);
            }

            .exit-confirmation-buttons .survivor-btn.danger:hover {
                background: linear-gradient(135deg, #ff6666, #dd3333);
                box-shadow: 0 0 25px rgba(255, 68, 68, 0.5);
            }

            /* Restart Confirmation Modal */
            .restart-confirmation-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 140000;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
            }

            /* When visible, use flex layout for centering */
            .restart-confirmation-modal[style*="display: block"],
            .restart-confirmation-modal[style*="display: flex"] {
                display: flex !important;
            }

            .restart-confirmation-content {
                background: linear-gradient(135deg, #1a1a0a, #2a1a0a);
                border: 3px solid #ff8844;
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 0 40px rgba(255, 136, 68, 0.6);
                max-width: 400px;
            }

            .restart-confirmation-content h2 {
                color: #ff9966;
                margin: 0 0 20px 0;
                font-size: 1.8rem;
                text-shadow: 0 0 10px rgba(255, 136, 68, 0.8);
                font-family: 'NeoDunggeunmoPro', 'Arial Black', sans-serif;
            }

            .restart-confirmation-content p {
                color: #cccccc;
                margin: 0 0 30px 0;
                font-size: 1rem;
                line-height: 1.4;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
            }

            .restart-confirmation-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .restart-confirmation-buttons .survivor-btn {
                min-width: 120px;
            }

            .restart-confirmation-buttons .survivor-btn.danger {
                background: linear-gradient(135deg, #ff8844, #cc5522);
                border-color: #ff9966;
                box-shadow: 0 0 15px rgba(255, 136, 68, 0.3);
            }

            .restart-confirmation-buttons .survivor-btn.danger:hover {
                background: linear-gradient(135deg, #ff9966, #dd6633);
                box-shadow: 0 0 25px rgba(255, 136, 68, 0.5);
            }

            /* Options Menu */
            .options-menu {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 30000;
            }

            .options-content {
                background: linear-gradient(135deg, #0a0a1a, #1a0a2a);
                border: 2px solid #00ffff;
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .options-content h2 {
                color: #00ffff;
                font-size: 2rem;
                margin: 0 0 30px 0;
                text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
                font-family: 'NeoDunggeunmoPro', 'Arial Black', sans-serif;
            }

            .options-settings {
                display: flex;
                flex-direction: column;
                gap: 25px;
                margin-bottom: 30px;
            }

            .option-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 0;
                border-bottom: 1px solid rgba(0, 255, 255, 0.2);
            }

            .option-item:last-child {
                border-bottom: none;
            }

            .option-item label {
                color: #ffffff;
                font-size: 1.1rem;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
                text-align: left;
                flex: 1;
            }

            .option-select {
                background: linear-gradient(135deg, #1a1a2a, #2a2a4a);
                border: 2px solid #00ffff;
                border-radius: 8px;
                color: #ffffff;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
                font-size: 1rem;
                padding: 8px 12px;
                outline: none;
                cursor: pointer;
                min-width: 120px;
                -webkit-appearance: none;
                appearance: none;
                touch-action: manipulation;
                user-select: none;
                -webkit-user-select: none;
            }

            .option-select:focus {
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
            }

            .option-select:active,
            .option-select:hover {
                background: linear-gradient(135deg, #2a2a4a, #3a3a6a);
                border-color: #00dddd;
            }

            /* Improve mobile touch targets */
            @media (max-width: 768px) {
                .option-select {
                    font-size: 1.1rem;
                    padding: 12px 16px;
                    min-width: 140px;
                    min-height: 44px;
                }

                .survivor-btn.small {
                    font-size: 1rem;
                    padding: 12px 20px;
                    min-width: 120px;
                    min-height: 44px;
                }

                .option-item {
                    padding: 20px 0;
                }
            }

            .option-select option {
                background: #1a1a2a;
                color: #ffffff;
            }

            .survivor-btn.small {
                font-size: 0.9rem;
                padding: 8px 16px;
                min-width: 100px;
            }

            .options-hint {
                color: #888;
                font-size: 0.9rem;
                margin: 0;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
            }

            /* About Menu */
            .about-menu {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 30000;
            }

            .about-content {
                background: linear-gradient(135deg, #0a0a1a, #1a0a2a);
                border: 2px solid #00ffff;
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }

            .about-content h2 {
                color: #00ffff;
                font-size: 2rem;
                margin: 0 0 20px 0;
                text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
                font-family: 'NeoDunggeunmoPro', 'Arial Black', sans-serif;
            }

            .about-content h3 {
                color: #00ffff;
                font-size: 1.3rem;
                margin: 0 0 15px 0;
                text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
            }

            .about-description {
                margin-bottom: 30px;
                padding: 20px;
                background: rgba(0, 255, 255, 0.05);
                border-radius: 10px;
                border: 1px solid rgba(0, 255, 255, 0.2);
            }

            .vibe-coding-title {
                color: #00ffff;
                font-size: 1.3rem;
                margin: 0 0 10px 0;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }

            .vibe-coding-subtitle {
                color: #cccccc;
                font-size: 1rem;
                margin: 0;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
            }

            .about-credits {
                margin-bottom: 30px;
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
            }

            .credit-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid rgba(0, 255, 255, 0.2);
                gap: 15px;
            }

            .credit-item:last-child {
                border-bottom: none;
            }

            .credit-label {
                color: #00ffff;
                font-size: 1.1rem;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
                text-align: left;
            }

            .credit-value {
                color: #ffffff;
                font-size: 1rem;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
                text-align: right;
            }

            .social-links {
                margin-bottom: 25px;
                padding: 20px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
            }

            .social-items {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-top: 15px;
            }

            .social-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 15px;
                background: rgba(0, 255, 255, 0.1);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 8px;
                color: #ffffff;
                text-decoration: none;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
                font-size: 1rem;
                transition: all 0.3s ease;
            }

            .social-item:hover,
            .social-item:focus {
                background: rgba(0, 255, 255, 0.2);
                border-color: #00ffff;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
                transform: translateX(5px);
            }

            .social-item svg,
            .social-item img {
                flex-shrink: 0;
            }

            .social-item span {
                flex: 1;
                text-align: left;
            }

            .about-copyright {
                margin: 20px 0 15px 0;
                padding: 15px 0;
                border-top: 1px solid rgba(0, 255, 255, 0.2);
            }

            .about-copyright p {
                color: #888;
                font-size: 0.9rem;
                margin: 0;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
            }

            .about-hint {
                color: #888;
                font-size: 0.9rem;
                margin: 15px 0 0 0;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif;
            }

            /* Mobile responsiveness for About Menu */
            @media (max-width: 768px) {
                .about-content {
                    padding: 25px 20px;
                    max-height: 80vh;
                }

                .about-content h2 {
                    font-size: 1.5rem;
                }

                .about-content h3 {
                    font-size: 1.1rem;
                }

                .vibe-coding-title {
                    font-size: 1.1rem;
                }

                .vibe-coding-subtitle {
                    font-size: 0.9rem;
                }

                .credit-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 5px;
                    padding: 15px 0;
                }

                .credit-label,
                .credit-value {
                    text-align: left;
                }

                .social-item {
                    font-size: 0.95rem;
                    padding: 14px;
                }
            }

            .survivor-game-over {
                text-align: center;
                color: white;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 20, 40, 0.95));
                padding: 40px;
                border-radius: 20px;
                border: 2px solid #00ffff;
                box-shadow: 0 0 40px rgba(0, 255, 255, 0.4),
                           inset 0 0 30px rgba(0, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                max-width: 500px;
                margin: 0 auto;
            }

            .survivor-game-over h2 {
                color: #ff0066;
                font-size: 36px;
                margin-bottom: 25px;
                text-shadow: 0 0 20px rgba(255, 0, 102, 0.8),
                            0 0 40px rgba(255, 0, 102, 0.5);
                font-family: 'NeoDunggeunmoPro', 'Arial Black', sans-serif;
                animation: neonPulse 2s ease-in-out infinite;
            }

            .final-stats {
                margin: 20px 0 30px;
                font-family: 'NeoDunggeunmoPro', 'Courier New', monospace;
            }

            .stat-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                font-size: 18px;
                color: #00ffff;
                min-width: 250px;
            }

            .survivor-buttons {
                margin-top: 30px;
                display: flex;
                gap: 15px;
                justify-content: center;
            }

            .levelup-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.82);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 120000;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
            }

            /* When visible, use flex layout for centering */
            .levelup-modal[style*="display: block"],
            .levelup-modal[style*="display: flex"] {
                display: flex !important;
            }

            .levelup-content {
                background: linear-gradient(135deg, #0a0a1a, #1a0a2a);
                border: 2px solid #00ffff;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                width: min(400px, 92vw);
                max-height: 92%;
                overflow-y: auto;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
                backdrop-filter: blur(10px);
                outline: none;
            }

            .levelup-tabs {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-bottom: 18px;
                flex-wrap: wrap;
            }

            .levelup-tab {
                background: transparent;
                border: 2px solid #00ffff;
                color: #00ffff;
                padding: 8px 18px;
                border-radius: 999px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s ease;
                text-transform: uppercase;
            }

            .levelup-tab.active {
                background: #00ffff;
                color: #0a0a1a;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
            }

            .levelup-tab:not(.active):hover {
                background: rgba(0, 255, 255, 0.1);
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
            }

            .levelup-pane {
                display: none;
                text-align: left;
            }

            .levelup-pane.active {
                display: block;
            }

            .levelup-pane .levelup-scroll {
                overflow-y: auto;
                padding: 0 10px;
                margin: 0;
                max-height: 60vh;
                height: auto;
            }

            .levelup-title {
                text-align: center;
                color: #00ffff;
                font-size: 1.5rem;
                margin-bottom: 10px;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }

            .upgrade-choices {
                display: flex;
                flex-direction: column;
                gap: 12px;
                justify-content: center;
            }

            .upgrade-choice {
                background: rgba(0, 255, 255, 0.1);
                border: 2px solid #00ffff;
                border-radius: 10px;
                padding: 12px 16px;
                width: 100%;
                transition: all 0.3s ease;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }

            .upgrade-choice-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                font-size: 24px;
                width: 100%;
            }

            .upgrade-choice-icon-image {
                width: 48px;
                height: 48px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 48px;
            }

            .upgrade-choice-title {
                font-size: 20px;
                font-weight: bold;
                color: #00ffff;
            }

            .upgrade-choice:hover {
                background: rgba(0, 255, 255, 0.2);
                border: 2px solid #FFFFFF;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.4);
            }

            .upgrade-choice h3 {
                color: #00ffff;
                margin: 0 0 10px 0;
                font-size: 1.2rem;
            }

            .upgrade-choice p {
                color: white;
                margin: 0;
                font-size: 0.9rem;
                opacity: 0.9;
            }

            .upgrade-choice-merge {
                background: rgba(255, 215, 0, 0.15) !important;
                border: 2px solid rgba(255, 215, 0, 0.6) !important;
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.3) !important;
            }

            .upgrade-choice-merge:hover {
                background: rgba(255, 215, 0, 0.3) !important;
                border: 2px solid #FFD700 !important;
                box-shadow: 0 0 25px rgba(255, 215, 0, 0.6) !important;
            }

            .upgrade-choice-merge:hover h3 {
                text-shadow: 0 0 12px rgba(255, 215, 0, 1) !important;
            }

            .upgrade-choice-merge h3 {
                color: #FFD700 !important;
                text-shadow: 0 0 8px rgba(255, 215, 0, 0.8) !important;
                font-weight: bold !important;
            }

            /* Guide Pane Styles */
            .guide-pane .merge-recipe {
                text-align: center;
            }

            .guide-pane .help-section p,
            .guide-pane .merge-recipe p,
            .guide-pane .merge-recipe span,
            .guide-pane .help-section span {
                max-width: none;
                margin-left: auto;
                margin-right: auto;
                display: block;
            }

            .levelup-guide-pane h2,
            .levelup-status-pane h2 {
                color: #00ffff;
                margin-bottom: 16px;
                margin-top: 24px;
                font-size: 20px;
                text-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
            }

            .levelup-guide-pane h2:first-of-type,
            .levelup-status-pane h2:first-of-type {
                margin-top: 0;
            }

            .help-recipes {
                margin-bottom: 20px;
            }

            .merge-recipe {
                background: linear-gradient(135deg, rgba(255, 170, 0, 0.2), rgba(255, 215, 0, 0.06));
                border: 1px solid rgba(255, 215, 0, 0.4);
                border-radius: 8px;
                margin-bottom: 12px;
                text-align: center;
                box-shadow: 0 0 14px rgba(255, 200, 0, 0.18);
            }

            .merge-recipe img {
                width: 40px;
                height: 40px;
                margin-right: 0;
                vertical-align: middle;
                image-rendering: pixelated;
            }

            .section-icon {
                width: 40px;
                height: 40px;
                margin-right: 8px;
                vertical-align: middle;
                image-rendering: pixelated;
            }

            .help-section {
                background: rgba(0, 255, 255, 0.04);
                border: 1px solid rgba(0, 255, 255, 0.18);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 16px;
                text-align: left;
            }

            .guide-pane .help-section {
                text-align: center !important;
            }

            .guide-pane .help-section p {
                text-align: center;
            }

            .merge-recipe h3 {
                color: #ffdf70;
                margin-bottom: 6px;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }

            .merge-recipe p {
                color: #ffe8b0;
                margin-bottom: 4px;
                font-weight: bold;
                font-size: 14px;
            }

            .recipe-desc {
                color: #f9d97a;
                font-style: italic;
                font-size: 13px;
                margin-bottom: 12px;
            }

            /* Chest Modal Styles */
            .chest-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.85);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 120000;
                backdrop-filter: blur(6px);
                -webkit-backdrop-filter: blur(6px);
            }

            .help-unique-description {
                text-align: center;
                color: rgba(255, 255, 255, 0.78);
                margin-bottom: 16px;
                font-size: 0.9rem;
            }

            .help-unique-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .help-unique-item {
                display: flex;
                flex-direction: column;
                gap: 10px;
                align-items: center;
                padding: 14px 12px;
                border-radius: 10px;
                background: rgba(255, 16, 240, 0.08);
                border: 1px solid rgba(255, 16, 240, 0.2);
                text-align: center;
            }

            .help-unique-item img {
                width: 40px;
                height: 40px;
                image-rendering: pixelated;
            }

            .help-unique-text h3 {
                margin: 0 0 6px;
                color: #ffb3ff;
                font-size: 1rem;
                text-align: center;
            }

            .help-unique-text p {
                margin: 0;
                font-size: 0.85rem;
                color: rgba(255, 255, 255, 0.82);
                text-align: center;
            }

            .help-unique-empty {
                text-align: center;
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.95rem;
            }

            .chest-modal[style*="display: block"],
            .chest-modal[style*="display: flex"] {
                display: flex !important;
            }

            .chest-content {
                background: linear-gradient(135deg, #2a0035, #15001f);
                border: 2px solid rgba(255, 110, 255, 0.8);
                border-radius: 18px;
                padding: 26px 28px 20px;
                text-align: center;
                width: min(440px, 92vw);
                max-height: 90vh;
                box-shadow: 0 0 40px rgba(255, 16, 240, 0.35);
                backdrop-filter: blur(12px);
                outline: none;
            }

            .chest-tabs {
                display: flex;
                justify-content: center;
                gap: 12px;
                margin-bottom: 18px;
                flex-wrap: wrap;
            }

            .chest-tab {
                background: transparent;
                border: 2px solid rgba(255, 110, 255, 0.8);
                color: #ff8eff;
                padding: 8px 18px;
                border-radius: 999px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.25s ease;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }

            .chest-tab.active {
                background: #ff1ad8;
                border-color: #ff1ad8;
                color: #1b001f;
                box-shadow: 0 0 15px rgba(255, 26, 216, 0.5);
            }

            .chest-tab:not(.active):hover {
                background: rgba(255, 16, 240, 0.12);
                box-shadow: 0 0 10px rgba(255, 16, 240, 0.25);
            }

            .chest-pane {
                display: none;
                text-align: left;
            }

            .chest-pane.active {
                display: block;
            }

            .chest-title {
                color: #ff8eff;
                font-size: 1.6rem;
                margin: 0 0 6px 0;
                text-align: center;
                text-shadow: 0 0 12px rgba(255, 16, 240, 0.45);
                letter-spacing: 0.12em;
            }

            .chest-subtitle {
                color: rgba(255, 255, 255, 0.82);
                font-size: 0.95rem;
                margin: 0 0 18px 0;
                text-align: center;
                letter-spacing: 0.05em;
            }

            .chest-scroll {
                max-height: 60vh;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 0 6px;
                margin-bottom: 12px;
            }

            .chest-choices {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .chest-choice {
                background: rgba(255, 16, 240, 0.08);
                border: 2px solid rgba(255, 16, 240, 0.35);
                border-radius: 12px;
                padding: 14px 16px;
                cursor: pointer;
                transition: all 0.25s ease;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }

            .chest-choice:hover {
                background: rgba(255, 16, 240, 0.18);
                border-color: #ff8eff;
                box-shadow: 0 0 18px rgba(255, 16, 240, 0.35);
            }

            .chest-choice-unique {
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 140, 0, 0.1));
                border: 2px solid rgba(255, 215, 0, 0.55);
                box-shadow: 0 0 18px rgba(255, 215, 0, 0.2);
            }

            .chest-choice-unique:hover {
                background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 165, 0, 0.2));
                border-color: #ffd700;
                box-shadow: 0 0 24px rgba(255, 215, 0, 0.45);
            }

            .chest-choice-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                width: 100%;
                flex-wrap: wrap;
            }

            .chest-choice-icon-image {
                width: 48px;
                height: 48px;
                image-rendering: pixelated;
                object-fit: contain;
            }

            .chest-choice-title {
                font-size: 1.1rem;
                font-weight: bold;
                color: #ffb3ff;
                text-shadow: 0 0 6px rgba(255, 16, 240, 0.35);
            }

            .chest-choice-unique .chest-choice-title {
                color: #ffd700;
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            }

            .chest-choice-badge {
                background: rgba(255, 215, 0, 0.15);
                border: 1px solid rgba(255, 215, 0, 0.8);
                color: #ffd700;
                text-transform: uppercase;
                letter-spacing: 0.12em;
                font-size: 0.65rem;
                padding: 2px 10px;
                border-radius: 999px;
            }

            .chest-choice p {
                color: rgba(255, 255, 255, 0.92);
                margin: 0;
                font-size: 0.95rem;
                line-height: 1.4;
            }

            .chest-stack-info {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.85rem;
                font-style: italic;
            }

            .chest-hint {
                color: rgba(255, 255, 255, 0.65);
                font-size: 0.85rem;
                text-align: center;
                margin: 6px 0 0;
                letter-spacing: 0.15em;
            }

            .chest-guide-title,
            .chest-status-title {
                color: #ff8eff;
                margin-bottom: 10px;
                text-align: center;
                font-size: 1.2rem;
                text-shadow: 0 0 8px rgba(255, 16, 240, 0.4);
            }

            .chest-guide-description {
                color: rgba(255, 255, 255, 0.75);
                text-align: center;
                margin: 0 0 16px 0;
                font-size: 0.9rem;
            }

            .chest-guide-list {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }

            .chest-guide-item {
                display: flex;
                gap: 14px;
                align-items: center;
                padding: 12px;
                border-radius: 12px;
                background: rgba(255, 16, 240, 0.08);
                border: 1px solid rgba(255, 16, 240, 0.2);
            }

            .chest-guide-icon img {
                width: 44px;
                height: 44px;
                image-rendering: pixelated;
            }

            .chest-guide-text h3 {
                margin: 0 0 4px;
                color: #ffb3ff;
                font-size: 1rem;
            }

            .chest-guide-text p {
                margin: 0;
                color: rgba(255, 255, 255, 0.8);
                font-size: 0.9rem;
            }

            .chest-guide-empty {
                text-align: center;
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.95rem;
                margin: 16px 0;
            }

            /* Mobile Touch Controls */
            .mobile-controls {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 15000;
                background: transparent !important;
            }

            .virtual-joystick {
                position: absolute;
                width: 80px;
                height: 80px;
                background: rgba(0, 255, 255, 0.2);
                border: 2px solid rgba(0, 255, 255, 0.6);
                border-radius: 50%;
                pointer-events: none; /* Let touches pass through to canvas */
                touch-action: none;
                backdrop-filter: blur(3px);
                display: none; /* Hidden by default for floating mode */
                opacity: 0;
                transform: translate(-50%, -50%) scale(0.8); /* Center on touch point */
                transform-origin: center;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                z-index: 16000; /* Above other controls */
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.3),
                           0 0 40px rgba(0, 255, 255, 0.1);
                animation: joystickPulse 2s ease-in-out infinite;
            }
            
            .virtual-joystick.active {
                opacity: 0.9;
                transform: translate(-50%, -50%) scale(1); /* Keep centered when active */
                background: rgba(0, 255, 255, 0.4);
                border-color: rgba(0, 255, 255, 0.8);
                box-shadow: 0 0 25px rgba(0, 255, 255, 0.6),
                           0 0 50px rgba(0, 255, 255, 0.2);
                animation: none;
            }

            .joystick-handle {
                position: absolute;
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #00ffff 0%, #00cccc 100%);
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8),
                           inset 0 0 10px rgba(255, 255, 255, 0.2);
                transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                cursor: pointer;
            }
            
            .joystick-handle.moving {
                background: linear-gradient(135deg, #ff00ff 0%, #cc00cc 100%);
                box-shadow: 0 0 20px rgba(255, 0, 255, 0.8),
                           inset 0 0 15px rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%) scale(1.1);
            }

            .mobile-dash-btn {
                position: absolute;
                bottom: 40px;
                width: 100px;
                height: 100px;
                background: rgba(0, 255, 255, 0.3);
                border: 2px solid rgba(0, 255, 255, 0.6);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #00ffff;
                font-weight: bold;
                font-size: 10px;
                pointer-events: auto;
                touch-action: none;
                user-select: none;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
                backdrop-filter: blur(3px);
                z-index: 1000;
            }

            .mobile-dash-right {
                right: 20px;
                left: auto;
            }

            .mobile-dash-left {
                left: 20px;
                right: auto;
            }

            .mobile-dash-btn:active,
            .mobile-dash-btn.dash-pressed {
                background: #00ffff;
                transform: scale(0.9);
                box-shadow: 0 0 25px rgba(0, 255, 255, 1.0);
                border-color: #00ffff;
            }


            .vibe-survivor-hidden {
                display: none !important;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes pulse {
                from { transform: scale(1); }
                to { transform: scale(1.05); }
            }

            .pulse {
                animation: pulse 0.3s ease-in-out;
            }

            /* Mobile responsive positioning */
            @media screen and (max-width: 480px) {
                .vibe-survivor-content {
                    /* Height handled by earlier mobile media query - don't override */
                    border-radius: 10px;
                }
                
                .vibe-survivor-header {
                    position: relative !important;
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    padding: 10px 15px !important;
                    top: auto !important;
                    left: auto !important;
                    right: auto !important;
                    bottom: auto !important;
                }
                
                .header-help-btn {
                    position: absolute !important;
                    top: 38px !important;
                    right: 12px !important;
                    width: 32px;
                    height: 32px;
                    font-size: 16px;
                    margin: 0 !important;
                }
                
                .survivor-ui {
                    /* Keep normal UI layout on mobile - no shrinking */
                    position: fixed !important;
                    bottom: 20px !important;
                    left: 20px !important;
                    right: 20px !important;
                    top: auto !important;
                    margin: 0 !important;
                    display: grid !important;
                    grid-template-columns: 1fr auto 1fr !important;
                    grid-template-areas: "stats time weapon" !important;
                    align-items: center !important;
                    padding: 12px 15px !important;
                    /* Remove max-height restriction */
                    text-align: center !important;
                }
                
                .survivor-stats {
                    grid-area: stats !important;
                    gap: 8px !important;
                    justify-content: center !important;
                }
                
                .time-display {
                    grid-area: time !important;
                    justify-self: center !important;
                    font-size: 14px !important;
                }
                
                .weapon-display {
                    /* Place in safe zone - centered between touch controls */
                    position: static !important;
                    margin: 0 auto !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    max-width: calc(100% - 40px) !important;
                }
                
                .distance-meter, .level-display {
                    font-size: 12px !important;
                }
                
                .distance-value, .level-value {
                    font-size: 18px !important;
                }
            }
                
                /* Duplicate CSS rules removed and consolidated above */
                
                .distance-meter, .level-display {
                    gap: 8px;
                }
                
                .distance-value, .level-value {
                    font-size: 16px;
                    min-width: 60px;
                }

                .survivor-title .title-logo {
                    max-width: min(90%, 680px);
                }

                .survivor-title h1 {
                    font-size: 36px;
                    font-family: 'NeoDunggeunmoPro', 'Arial Black', sans-serif;
                }
                
                /* Duplicate rule removed - weapon display handled in main mobile section */
            }
            
            /* Tablet responsive adjustments */
            @media screen and (min-width: 531px) and (max-width: 1024px) {
                .survivor-ui {
                    bottom: 25px;
                    left: 20px;
                    right: 20px;
                    padding: 10px 12px;
                }
                
                .health-bar, .xp-bar {
                    width: 100px;
                }
                
                .time-display {
                    font-size: 15px;
                }
            }

            /* Show mobile controls only on touch devices */
            @media (hover: none) and (pointer: coarse) {
                .mobile-controls {
                    display: block !important;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    setupEventHandlers() {
        // Phase 12c.4b - Remove old keyboard handler before creating new one (prevent handler leaks)
        if (this.mainKeyboardHandler) {
            document.removeEventListener('keydown', this.mainKeyboardHandler);
            this.mainKeyboardHandler = null;
        }

        // Phase 12c.8 - Start screen button event listeners removed (handled by StartScreenModal - Option B pattern)
        // The modal owns all start screen button behavior now (Start, Options, About, Restart, Exit)

        // Pause button event listener
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });

        // Phase 12c.6 - Help button event listeners
        const helpBtn = document.getElementById('help-btn');
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleHelp();
        });
        helpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleHelp();
        }, { passive: false });

        // Phase 12c.4 - Pause menu event listeners removed (handled by PauseMenu modal - Option B pattern)
        // The modal owns all button behavior now

        // Restart confirmation handlers
        document.getElementById('restart-confirm-yes').addEventListener('click', () => {
            this.hideRestartConfirmation();
            // Close pause menu first, then restart
            this.isPaused = false;
            const pauseMenu = document.getElementById('pause-menu');
            if (pauseMenu) pauseMenu.style.display = 'none';
            this.disablePauseScrolling();
            this.resetMenuNavigation();
            this.restartGame();
        });

        document.getElementById('restart-confirm-no').addEventListener('click', () => {
            this.hideRestartConfirmation();
        });

        // Phase 12c.8 - Options and About button event listeners removed (handled by StartScreenModal - Option B pattern)
        // The StartScreenModal now owns the click behavior for options-btn and about-btn

        // Phase 12c.5 - Close options button event listeners removed (handled by OptionsMenu modal - Option B pattern)

        // Phase 12c.10 - Close about button event listeners removed (handled by AboutModal - Option B pattern)
        // The AboutModal now owns the close button behavior (click and touchstart)

        // Phase 12c.6 - Help menu event listeners removed (handled by HelpMenu modal - Option B pattern)
        // The modal owns all button behavior including close button and tab switching

        if (this.modals.pause) {
            this.modals.pause.updateButtonLabels();
        }

        // Keyboard controls
        // Phase 12c.4b - Store keyboard handler reference for cleanup
        this.mainKeyboardHandler = (e) => {
            // Phase 12c.6 - F1 key opens help menu (works anywhere during gameplay)
            // Only allow if no other modals are currently open (overlayLocks === 0)
            if (e.key === 'F1') {
                e.preventDefault();
                if (!this.isHelpOpen && this.gameRunning && this.overlayLocks === 0) {
                    this.toggleHelp();
                }
                return;
            }

            // Menu navigation takes priority
            if (this.menuNavigationState.active) {
                // Handle menu navigation keys
                switch (e.key.toLowerCase()) {
                    case 'arrowup':
                    case 'w':
                        e.preventDefault();
                        this.menuNavigationState.keyboardUsed = true;
                        // Phase 12c.6 - Help scrolling removed, handled by HelpMenu modal
                        // Phase 12c.7 - Victory scrolling removed, handled by VictoryModal class
                        // Phase 12c - Level up scrolling/navigation removed, handled by LevelUpModal class
                        if (this.menuNavigationState.menuType === 'gameover') {
                            this.modals.gameOver?.scrollContent?.('up');
                        } else {
                            this.navigateMenu('up');
                        }
                        break;
                    case 'arrowdown':
                    case 's':
                        e.preventDefault();
                        this.menuNavigationState.keyboardUsed = true;
                        // Phase 12c.6 - Help scrolling removed, handled by HelpMenu modal
                        // Phase 12c.7 - Victory scrolling removed, handled by VictoryModal class
                        // Phase 12c - Level up scrolling/navigation removed, handled by LevelUpModal class
                        if (this.menuNavigationState.menuType === 'gameover') {
                            this.modals.gameOver?.scrollContent?.('down');
                        } else {
                            this.navigateMenu('down');
                        }
                        break;
                    case 'arrowleft':
                    case 'a':
                        e.preventDefault();
                        this.menuNavigationState.keyboardUsed = true;
                        // Phase 12c - Level up tab cycling removed, handled by LevelUpModal class
                        this.navigateMenu('left');
                        break;
                    case 'arrowright':
                    case 'd':
                        e.preventDefault();
                        this.menuNavigationState.keyboardUsed = true;
                        // Phase 12c - Level up tab cycling removed, handled by LevelUpModal class
                        this.navigateMenu('right');
                        break;
                    case 'enter':
                        e.preventDefault();
                        this.menuNavigationState.keyboardUsed = true;
                        this.selectCurrentMenuItem();
                        break;
                    case 'escape':
                        e.preventDefault();
                        // Close menu or toggle pause based on menu type
                        if (this.menuNavigationState.menuType === 'levelup') {
                            // Can't escape level up menu
                        } else if (this.menuNavigationState.menuType === 'gameover') {
                            // Can't escape game over menu
                        } else if (this.menuNavigationState.menuType === 'pause') {
                            this.togglePause();
                        } else if (this.menuNavigationState.menuType === 'help') {
                            this.toggleHelp();
                        } else if (this.menuNavigationState.menuType === 'options') {
                            this.hideOptionsMenu();
                        } else if (this.menuNavigationState.menuType === 'about') {
                            this.hideAboutMenu();
                        } else if (this.menuNavigationState.menuType === 'start') {
                            // On start screen, ESC does nothing (can't close start screen)
                            // Navigation state remains active for keyboard control
                        }
                        break;
                }
                return;
            }

            // Check if about or options menu is open (works both in-game and on start screen)
            if (e.key.toLowerCase() === 'escape') {
                const aboutMenu = document.getElementById('about-menu');
                if (aboutMenu && aboutMenu.style.display === 'flex') {
                    e.preventDefault();
                    this.hideAboutMenu();
                    return;
                }

                const optionsMenu = document.getElementById('options-menu');
                if (optionsMenu && optionsMenu.style.display === 'flex') {
                    e.preventDefault();
                    this.hideOptionsMenu();
                    return;
                }

                // Handle ESC for help menu during gameplay
                if (this.isHelpOpen) {
                    e.preventDefault();
                    this.toggleHelp();
                    return;
                }

                // Handle ESC for pause toggle during normal gameplay
                // Only allow if no other modals are currently open (overlayLocks === 0)
                if (!this.playerDead && this.gameRunning && !this.isPaused && this.overlayLocks === 0) {
                    e.preventDefault();
                    this.togglePause();
                    return;
                }
            }

            // NOTE: Regular game controls (keydown/keyup) are now handled by InputManager
            // Only special UI cases remain here
        };

        // Phase 12c.4b - Add keyboard handler
        document.addEventListener('keydown', this.mainKeyboardHandler);

        // NOTE: Keyup handler removed - now handled by InputManager

        // NOTE: Resize handler removed - now handled by InputManager

        // Phase 12c.12 - Initialize touch controls UI with dash button
        const touchControlsInitResult = this.touchControlsUI.init(this.touchControls, this.isMobile);
        this.touchControlsUI.setTranslationFunction(this.t.bind(this));
        console.log('TouchControlsUI init result:', touchControlsInitResult, {
            hasDashButton: !!this.touchControlsUI.elements?.dashButton,
            hasJoystick: !!this.touchControlsUI.elements?.joystick
        });
    }

    /**
     * Initialize canvas and related systems (called during loading screen)
     * Returns a Promise that resolves when initialization is complete
     */
    async initializeCanvas() {
        return new Promise((resolve, reject) => {
            try {
                // Initialize canvas using rendering module
                const canvasResult = initCanvas('survivor-canvas');
                this.canvas = canvasResult.canvas;
                this.ctx = canvasResult.ctx;

                if (this.canvas) {
                    // Resize canvas to fit container
                    resizeCanvas(this.canvas);

                    // Load sprites with progress tracking
                    this.spriteManager.loadSprites((loaded, total) => {
                        // Optional: Track sprite loading progress
                        console.log(`Sprites loading: ${loaded}/${total}`);
                    });

                    // Load item icons
                    this.spriteManager.loadItemIcons();

                    // Initialize input manager after canvas is ready
                    this.inputManager.initialize(this);

                    // Ensure canvas gets proper dimensions after CSS settles
                    setTimeout(() => {
                        resizeCanvas(this.canvas);
                        if (!this.gameRunning) {
                            this.renderStartScreenBackground();
                        }
                        // Ensure stats are hidden on start screen
                        this.showModalHeader();

                        // Don't mark as fully initialized yet - wait for background to load
                        console.log('✓ Canvas initialized, waiting for background...');

                        resolve();
                    }, 100);
                } else {
                    reject(new Error('Canvas initialization failed'));
                }
            } catch (e) {
                console.error('Canvas initialization error:', e);
                reject(e);
            }
        });
    }

    launchGame() {
        // Launching game with fresh modal state

        // Always remove existing modal and create fresh one to avoid overlay issues
        const existingModal = document.getElementById('vibe-survivor-modal');
        if (existingModal) {
            // Remove existing modal to prevent overlay issues
            existingModal.remove();
        }

        // Create completely fresh modal
        this.createGameModal();

        // Set up event handlers for the fresh modal
        this.setupEventHandlers();

        // Phase 12c.5 - Initialize options menu modal (already initialized in initGame)
        // Modal initialization happens in initGame(), not here, to ensure it's ready on first load

        // Show modal
        const modal = document.getElementById('vibe-survivor-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Modal ready for display
        } else {
            console.error('Failed to create modal!');
            return;
        }

        // Show fresh start screen
        this.showStartScreen();

    }

    openGame() {
        const modal = document.getElementById('vibe-survivor-modal');
        if (modal) {
            modal.style.display = 'flex';
        }

        // Pause background animations for better game performance
        if (window.PerformanceManager) {
            window.PerformanceManager.pauseBackgroundAnimations();
        }

        try {
            this.canvas = document.getElementById('survivor-canvas');
            // Get browser-specific optimization profile
            const browserProfile = this.getBrowserOptimizationProfile();

            this.ctx = this.canvas.getContext('2d', {
                alpha: false, // No transparency needed - better performance
                desynchronized: true, // Allow browser to optimize rendering
                willReadFrequently: false, // Force GPU acceleration
                ...browserProfile.contextOptions // Apply browser-specific settings
            });
            this.resizeCanvas();

            // Ensure canvas renders initial background for start screen
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                this.renderStartScreenBackground();
            });
        } catch (e) {
            console.error('Canvas initialization error:', e);
        }

        this.showStartScreen();
    }

    applyCameraZoom() {
        const shouldZoomOut = this.isMobile || window.innerWidth <= MOBILE_CONFIG.BREAKPOINT_WIDTH;
        this.camera.zoom = shouldZoomOut ? MOBILE_CONFIG.CAMERA_ZOOM : 1;
    }

    resizeCanvas() {
        this.applyCameraZoom();
        if (this.canvas) {
            // First try to get dimensions from getBoundingClientRect
            const rect = this.canvas.getBoundingClientRect();
            let canvasWidth = Math.round(rect.width);
            let canvasHeight = Math.round(rect.height);

            // If canvas has zero or invalid dimensions, calculate from modal
            if (canvasWidth <= 0 || canvasHeight <= 0) {
                const modal = document.querySelector('.vibe-survivor-modal');
                if (modal) {
                    const modalRect = modal.getBoundingClientRect();
                    canvasWidth = Math.round(modalRect.width - 40); // 20px padding on each side
                    // Calculate available height: modal height minus header height and padding
                    const headerHeight = 60; // Header height
                    const verticalPadding = 60; // Increased padding to show canvas borders (30px top + 30px bottom)
                    canvasHeight = Math.round(modalRect.height - headerHeight - verticalPadding);

                }
            }

            // For better accuracy, always use modal-based sizing if available
            const modal = document.querySelector('.vibe-survivor-modal');
            if (modal) {
                const modalRect = modal.getBoundingClientRect();
                const modalBasedWidth = Math.round(modalRect.width - 40);
                // Calculate dynamic height based on available modal space
                const headerHeight = 100; // Header height
                const verticalPadding = 60; // Increased padding to show canvas borders
                const modalBasedHeight = Math.round(modalRect.height - headerHeight - verticalPadding);

                // Use modal-based sizing if it's different or more accurate
                if (modalBasedWidth > 0 && modalBasedHeight > 0) {
                    canvasWidth = modalBasedWidth;
                    canvasHeight = modalBasedHeight;
                }
            }

            // Only set dimensions if we have valid non-zero values
            if (canvasWidth > 0 && canvasHeight > 0) {
                // Set internal canvas resolution to match calculated dimensions
                this.canvas.width = canvasWidth;
                this.canvas.height = canvasHeight;

            } else {
                console.warn('Canvas has zero dimensions, skipping resize');
                return;
            }

            // Speed scaling removed - game speed should be consistent across all screen sizes

            // Don't override CSS - let responsive breakpoints handle sizing
            // CSS already handles display: block, margins, and positioning

            // Initialize canvas layers (only once)
            if (!this.canvasLayersInitialized) {
                this.initializeCanvasLayers();
                this.canvasLayersInitialized = true;
            } else if (this.canvasLayers) {
                // Resize existing layers
                this.resizeCanvasLayers();
            }

            // Reinitialize offscreen canvases after resize
            if (this.hasOffscreenCanvases) {
                this.initializeOffscreenCanvases();
            }

            // If game isn't running, render start screen background (but avoid infinite loop)
            if (!this.gameRunning && !this._isRenderingBackground) {
                this._isRenderingBackground = true;
                setTimeout(() => {
                    this.renderStartScreenBackground();
                    this._isRenderingBackground = false;
                }, 0);
            }

            // Canvas resized to match CSS responsive dimensions
        }
    }


    // Modal header management methods
    hideModalHeader() {
        const header = document.querySelector('#vibe-survivor-modal .vibe-survivor-header');
        if (header) {
            // Hide title and show stats during gameplay
            const title = document.getElementById('game-title');
            const stats = document.getElementById('header-stats');

            if (title) {
                title.style.display = 'none';
            }
            if (stats) {
                stats.style.display = 'flex';
            }

            // Check if help button should be shown
            this.checkHelpButtonVisibility();

            // Ensure header maintains proper flexbox layout
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';

            // Header configured for gameplay
        } else {
            // Header not found
        }
    }

    showModalHeader() {
        const header = document.querySelector('#vibe-survivor-modal .vibe-survivor-header');
        if (header) {
            // Show title and hide stats during menu screens
            const title = document.getElementById('game-title');
            const stats = document.getElementById('header-stats');
            const helpBtn = document.getElementById('help-btn');

            header.style.display = 'flex';
            if (title) {
                title.style.display = 'block';
            }
            if (stats) {
                stats.style.setProperty('display', 'none', 'important');
            }
            // Hide help button on start screen
            if (helpBtn) {
                helpBtn.style.display = 'none';
            }
            // Header shown for menu screens
        } else {
            // Header not found
        }
    }

    updateStartOverlayLayout() {
        const modal = document.getElementById('vibe-survivor-modal');
        const overlay = document.getElementById('survivor-start-overlay');

        if (!modal || !overlay) {
            return;
        }

        if (!overlay.classList.contains('active')) {
            overlay.style.removeProperty('margin-top');
            overlay.style.removeProperty('margin-bottom');
            return;
        }

        const content = modal.querySelector('.vibe-survivor-content');
        if (!content) {
            return;
        }

        const header = content.querySelector('.vibe-survivor-header');
        const headerHeight = header ? header.offsetHeight : 0;

        overlay.style.removeProperty('margin-top');
        overlay.style.removeProperty('margin-bottom');

        const availableHeight = content.clientHeight - headerHeight;
        const overlayHeight = overlay.offsetHeight || overlay.scrollHeight;

        if (availableHeight <= 0 || overlayHeight <= 0) {
            overlay.style.marginTop = '32px';
            overlay.style.marginBottom = '32px';
            return;
        }

        const marginValue = Math.max((availableHeight - overlayHeight) / 2, 32);
        overlay.style.marginTop = `${marginValue}px`;
        overlay.style.marginBottom = `${marginValue}px`;
    }

    openGuideModalFromStart() {
        // Ensure guide modal is ready
        if (this.modals.guide && !this._guideModalInitialized) {
            console.log('[Guide] init from openGuideModalFromStart');
            this.modals.guide.init();
            this._guideModalInitialized = true;
        }

        const guideModal = this.modals.guide;
        if (!guideModal || !guideModal.element) {
            console.warn('Guide modal not ready');
            return;
        }

        // Keep start overlay active but non-interactive so layout stays intact
        const startOverlay = document.getElementById('survivor-start-overlay');
        if (startOverlay) {
            console.log('[Guide] keeping start overlay while showing guide');
            startOverlay.classList.add('active');
            startOverlay.style.setProperty('display', 'flex', 'important');
            startOverlay.style.setProperty('pointer-events', 'none', 'important');
            startOverlay.style.setProperty('opacity', '1', 'important');
        }

        this.resetMenuNavigation();
        console.log('[Guide] showing modal');
        guideModal.show();
        console.log('[Guide] modal display style:', guideModal.element.style.display);
        console.log('[Guide] modal classes:', guideModal.element.className);
    }

    showScoreboardModal(options = {}) {
        const { startTab = 'local', onClose = null, origin = 'start' } = options;
        if (!this.modals.scoreboard) return;

        if (this.modals.scoreDetail?.isVisible && this.modals.scoreDetail.isVisible()) {
            this.modals.scoreDetail.hide();
        }

        if (!this._scoreboardModalInitialized) {
            this.modals.scoreboard.init();
            this._scoreboardModalInitialized = true;
        }

        this.modals.scoreboard.setTranslationFunction(this.t.bind(this));
        this.modals.scoreboard.populateVersions();
        // Remember origin for return behavior
        this.scoreboardLastOrigin = origin || 'start';

        const closeHandler = onClose
            ? onClose
            : (this.scoreboardLastOrigin === 'gameover'
                ? () => {
                    this.modals.gameOver.show();
                }
                : () => {
                    if (!this.gameRunning) {
                        this.showStartScreen();
                    }
                });

        this.modals.scoreboard.onClose(closeHandler);
        // Ensure correct starting tab before rendering
        if (startTab === 'global') {
            this.modals.scoreboard.switchTab('global');
        } else {
            this.modals.scoreboard.switchTab('local');
        }
        this.modals.scoreboard.show();
    }

    showScoreDetailModal(scoreIdOrData) {
        if (!this.modals.scoreDetail) return;

        let score;
        // Handle both local scores (ID string) and global scores (full object)
        if (typeof scoreIdOrData === 'object' && scoreIdOrData.isGlobal) {
            // Global score - use directly
            score = scoreIdOrData;
        } else {
            // Local score - look up by ID
            score = scoreboardStorage.getScoreById(scoreIdOrData);
            if (!score) {
                console.warn('Score not found for detail view:', scoreIdOrData);
                return;
            }
        }

        if (this.modals.scoreboard?.isVisible && this.modals.scoreboard.isVisible()) {
            this.modals.scoreboard.hide();
        }

        if (!this._scoreDetailModalInitialized) {
            this.modals.scoreDetail.init();
            this._scoreDetailModalInitialized = true;
        }

        this.modals.scoreDetail.setTranslationFunction(this.t.bind(this));
        this.modals.scoreDetail.setHelpers({
            getWeaponName: this.getWeaponName.bind(this)
        });
        this.modals.scoreDetail.showScore(score);
    }

    handleScoreDetailBack() {
        const tab = this.scoreDetailReturnContext?.tab || this.modals.scoreboard?.activeTab || 'local';
        const origin = this.scoreDetailReturnContext?.origin || this.scoreboardLastOrigin || 'start';
        this.scoreDetailReturnContext = null;
        // Hide detail modal before showing scoreboard
        if (this.modals.scoreDetail?.isVisible && this.modals.scoreDetail.isVisible()) {
            this.modals.scoreDetail.hide();
        }
        this.showScoreboardModal({ startTab: tab, origin });
    }

    showStartScreen() {
        // Remove game-active class to show start screen over landing page
        const modal = document.getElementById('vibe-survivor-modal');
        const content = document.querySelector('.vibe-survivor-content');
        if (this.modals.guide?.isVisible && this.modals.guide.isVisible()) {
            this.modals.guide.hide();
        }
        if (modal) {
            modal.classList.remove('game-active');
        }
        if (content) {
            content.classList.remove('game-active');
        }

        // Hide modal header for start screen (minimal overlay look)
        this.hideModalHeader();

        // Ensure game screen (canvas container) is visible behind start screen
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.display = 'flex';
        }

        document.querySelectorAll('.vibe-survivor-screen').forEach(screen => screen.classList.remove('active'));
        const startOverlay = document.getElementById('survivor-start-overlay');
        if (startOverlay) {
            startOverlay.classList.add('active');

            requestAnimationFrame(() => this.updateStartOverlayLayout());

            // Render canvas background now that game screen is visible
            if (this.canvas && this.ctx) {
                requestAnimationFrame(() => {
                    this.renderStartScreenBackground();
                });
            }

            // Add menu navigation styles
            this.addMenuNavigationStyles();

            // Initialize keyboard navigation for start screen buttons
            // Use setTimeout to ensure DOM is fully ready
            setTimeout(() => {
                const startBtn = document.getElementById('start-survivor');
                const guideBtn = document.getElementById('start-btn-guide');
                const scoreboardBtn = document.getElementById('scoreboard-btn');
                const optionsBtn = document.getElementById('options-btn');
                const aboutBtn = document.getElementById('about-btn');
                const restartBtn = document.getElementById('restart-survivor');
                const exitBtn = document.getElementById('exit-survivor');
                const startButtons = [startBtn, guideBtn, scoreboardBtn, optionsBtn, aboutBtn, restartBtn, exitBtn].filter(btn => btn);

                if (startButtons.length > 0) {
                    this.initializeMenuNavigation('start', startButtons);
                }

                this.setupChromaAwardsLogoInteraction();
                this.setupVibeSurvivorLogoInteraction();

                // Title content is hidden in HTML initially (display: none on .survivor-title)
                // Show everything after background loads and mark game as ready
                const allButtons = [startBtn, guideBtn, optionsBtn, aboutBtn, restartBtn, exitBtn];
                const titleContent = document.querySelector('.survivor-title');
                const startScreenBot = window.startScreenBot;
                const chromaHeader = document.querySelector('.chroma-awards-header');

                // Wait for background transition to complete (600ms CSS transition)
                setTimeout(() => {
                    console.log('✓ Background loaded, game fully ready');
                    this.gameFullyInitialized = true;

                    // Prepare title content (make it visible but still transparent)
                    if (titleContent) {
                        titleContent.style.display = '';
                    }

                    // Use double requestAnimationFrame to ensure display is fully processed
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            // Update bot position now that title is in layout
                            if (startScreenBot && typeof startScreenBot.updatePosition === 'function') {
                                startScreenBot.updatePosition();
                            }

                            // Wait one more frame to ensure position is calculated
                            requestAnimationFrame(() => {
                                // Now fade in both elements at exactly the same time
                                if (titleContent) {
                                    titleContent.style.opacity = '1';
                                }

                                if (chromaHeader) {
                                    chromaHeader.style.opacity = '1';
                                }

                                if (startScreenBot && typeof startScreenBot.show === 'function') {
                                    startScreenBot.show();
                                }
                            });
                        });
                    });
                }, 700); // 600ms transition + 100ms safety margin
            }, 100);


        } else {
            console.error('showStartScreen: Start screen element not found');
        }
    }

    setupChromaAwardsLogoInteraction() {
        const chromaLogo = document.getElementById('chroma-awards-logo');
        if (!chromaLogo || chromaLogo.dataset.bound === 'true') {
            return;
        }

        const addActiveState = () => chromaLogo.classList.add('chroma-active');
        const removeActiveState = () => chromaLogo.classList.remove('chroma-active');

        const playChromaSound = () => {
            this.playStartMenuThemes();
        };

        chromaLogo.addEventListener('click', playChromaSound);
        chromaLogo.addEventListener('touchstart', (event) => {
            event.preventDefault();
            addActiveState();
            playChromaSound();
        }, { passive: false });
        chromaLogo.addEventListener('touchend', removeActiveState);
        chromaLogo.addEventListener('touchcancel', removeActiveState);
        chromaLogo.addEventListener('mousedown', addActiveState);
        chromaLogo.addEventListener('mouseup', removeActiveState);
        chromaLogo.addEventListener('mouseleave', removeActiveState);
        chromaLogo.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                addActiveState();
                playChromaSound();
            }
        });
        chromaLogo.addEventListener('keyup', removeActiveState);

        chromaLogo.dataset.bound = 'true';

        const chromaLink = document.querySelector('.chroma-award-text a');
        if (chromaLink && chromaLink.dataset.bound !== 'true') {
            const openAwardsSite = () => {
                window.open(chromaLink.href, '_blank', 'noopener');
            };

            chromaLink.addEventListener('touchstart', (event) => {
                event.preventDefault();
                openAwardsSite();
            }, { passive: false });

            chromaLink.dataset.bound = 'true';
        }
    }

    setupVibeSurvivorLogoInteraction() {
        const vibeLogo = document.getElementById('vibe-survivor-logo');
        if (!vibeLogo || vibeLogo.dataset.bound === 'true') {
            return;
        }

        const playSound = () => {
            this.playStartMenuThemes();
        };

        const addActive = () => vibeLogo.classList.add('vibe-active');
        const removeActive = () => vibeLogo.classList.remove('vibe-active');

        vibeLogo.addEventListener('click', playSound);
        vibeLogo.addEventListener('touchstart', (event) => {
            event.preventDefault();
            addActive();
            playSound();
        }, { passive: false });
        vibeLogo.addEventListener('touchend', removeActive);
        vibeLogo.addEventListener('touchcancel', removeActive);
        vibeLogo.addEventListener('mousedown', addActive);
        vibeLogo.addEventListener('mouseup', removeActive);
        vibeLogo.addEventListener('mouseleave', removeActive);
        vibeLogo.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                addActive();
                playSound();
            }
        });
        vibeLogo.addEventListener('keyup', removeActive);

        vibeLogo.dataset.bound = 'true';
    }

    playStartMenuThemes() {
        if (!this.audioManager) {
            return;
        }

        const now = Date.now();
        if (now - this.lastStartThemePlay < 1200) {
            return; // Prevent rapid double-plays when reopening the start screen
        }
        this.lastStartThemePlay = now;

        this.audioManager.playSound('startMenu');
        this.audioManager.playSound('chromaAwardsTheme');
    }

    startGame() {
        // Starting game with complete reinitialization

        // Guard: Ensure game is fully initialized before starting
        if (!this.gameFullyInitialized) {
            console.warn('Game not fully initialized yet. Please wait for loading to complete.');
            return;
        }

        // Reset death flag
        this.playerDead = false;
        this.gameOverHandled = false;
        this.gameOverShown = false;

        // Add game-active class to show the game container
        const modal = document.getElementById('vibe-survivor-modal');
        const content = document.querySelector('.vibe-survivor-content');
        if (modal) {
            modal.classList.add('game-active');
        }
        if (content) {
            content.classList.add('game-active');
        }

        // Add body class to prevent terminal height changes during gameplay
        document.body.classList.add('game-modal-open');

        // Hide start screen bot when game starts
        if (window.startScreenBot && typeof window.startScreenBot.hide === 'function') {
            window.startScreenBot.hide();
        }

        // Reset pause state and hide pause menu
        this.isPaused = false;
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.style.display = 'none';
        }
        this.disablePauseScrolling();

        // CRITICAL FIX: Hide modal header during gameplay
        this.hideModalHeader();

        // CRITICAL FIX: Explicitly hide start screen by clearing inline styles
        const startScreen = document.getElementById('survivor-start-overlay');
        if (startScreen) {
            startScreen.style.cssText = 'display: none !important;';
            startScreen.classList.remove('active');
            // Start screen hidden
        }

        // Show pause button during gameplay and reset its text
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.style.display = 'flex';
            pauseBtn.textContent = '||'; // Reset to pause symbol
        }

        // Cancel any existing game loop first
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        // Canvas and context are already initialized during loading screen
        // Just verify they exist and are valid
        if (!this.canvas || !this.ctx) {
            console.error('Canvas not initialized! This should not happen.');
            return;
        }

        try {
            // Canvas ready - just resize it
            this.resizeCanvas();

            // Initialize offscreen canvases for performance
            this.initializeOffscreenCanvases();

        } catch (e) {
            console.error('Canvas initialization failed:', e);
            return;
        }

        // BUGFIX: Ensure overlayLocks is reset to 0 before starting game
        // This handles edge cases where options/about menus may have left locks
        this.overlayLocks = 0;

        // BUGFIX: Reset menuNavigationState to restore reference to inputManager's state
        // Options menu breaks the reference when restoring previousState, so we need to re-establish it
        this.menuNavigationState = this.inputManager.menuNavigationState;
        this.inputManager.resetMenuNavigation();

        this.resetGame();

        // Optimize memory before starting intensive gameplay
        if (window.PerformanceManager) {
            window.PerformanceManager.optimizeMemory();
        }

        // Force garbage collection if available for better restart performance
        if (window.gc) {
            window.gc();
        } else if (window.GCController) {
            window.GCController.collect();
        }

        // Clear any remaining cached textures or WebGL resources
        if (this.ctx && typeof this.ctx.clearRect === 'function') {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Auto-detect performance mode based on browser and device
        this.detectPerformanceMode();

        // Make sure game screen exists before trying to activate it
        const screens = document.querySelectorAll('.vibe-survivor-screen');
        screens.forEach(screen => screen.classList.remove('active'));

        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.classList.add('active');
            gameScreen.style.removeProperty('display');
            // Game screen ready
        } else {
            console.error('Game screen not found! Modal structure may be missing.');
            return;
        }

        // Show the canvas (remove any inline display: none !important)
        if (this.canvas) {
            this.canvas.style.removeProperty('display');
        }

        // Show mobile controls
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            mobileControls.style.removeProperty('display');
        }

        // Phase 12c - Initialize HUD system
        this.hudSystem.init();

        // Phase 12c - Initialize game-over modal (if not already initialized)
        if (!this._gameOverModalInitialized) {
            this.modals.gameOver.init();
            this.modals.gameOver.setTranslationFunction(this.t.bind(this));

            // Setup submit to global callback
            this.modals.gameOver.onSubmitGlobal(async (scoreData) => {
                const playerName = await this.modals.prompt.prompt(
                    'Enter your display name (3-20 characters):',
                    'Player name',
                    ''
                );

                if (!playerName) return;

                // Client-side validation
                const trimmed = playerName.trim();
                if (trimmed.length < 3 || trimmed.length > 20) {
                    await this.modals.notification.notify('Player name must be 3-20 characters', 'error');
                    return;
                }

                // Allow any letters (including non-Latin), numbers, spaces, _ and -
                if (!/^[\p{L}\p{N}\s_-]+$/u.test(trimmed)) {
                    await this.modals.notification.notify('Player name can only contain letters, numbers, spaces, _ and -', 'error');
                    return;
                }

                // Submit to Supabase
                const result = await supabaseClient.submitScore(
                    scoreData,
                    trimmed,
                    GAME_INFO.VERSION,
                    GAME_INFO.MAJOR_VERSION
                );

                if (result.success) {
                    // Mark as submitted in local storage
                    if (scoreData.id) {
                        scoreboardStorage.markAsSubmitted(scoreData.id, result.id, trimmed);
                    }
                    this.modals.gameOver.markSubmissionComplete();
                    await this.modals.notification.notify(`Score submitted as ${trimmed}!`, 'success');

                    // Automatically show global leaderboard and return to game over when closed
                    if (this.modals.scoreboard) {
                        this.modals.gameOver.hide();
                        this.showScoreboardModal({
                            startTab: 'global',
                            origin: 'gameover',
                            onClose: () => {
                                this.modals.gameOver.show();
                            }
                        });
                    }
                } else {
                    await this.modals.notification.notify(`Failed to submit: ${result.error}`, 'error');
                }
            });

            // Allow viewing scoreboard directly from the Game Over modal when already submitted
            this.modals.gameOver.onViewScoreboard(() => {
                if (!this.modals.scoreboard) return;
                this.modals.gameOver.hide();
                this.showScoreboardModal({
                    startTab: 'global',
                    origin: 'gameover',
                    onClose: () => {
                        this.modals.gameOver.show();
                    }
                });
            });

            this._gameOverModalInitialized = true;
        }

        // Phase 12c - Initialize level-up modal (if not already initialized)
        if (!this._levelUpModalInitialized) {
            this.modals.levelUp.init();

            // Set up render callbacks for guide and status panes
            this.modals.levelUp.setRenderCallbacks({
                t: this.t.bind(this),
                generateWeaponsSection: this.generateWeaponsSection.bind(this),
                generatePassivesSection: this.generatePassivesSection.bind(this),
                generatePlayerStatsSection: this.generatePlayerStatsSection.bind(this)
            });

            // Set up overlay lock callbacks for disabling pause/help buttons
            this.modals.levelUp.setOverlayLockCallbacks(
                this.incrementOverlayLock.bind(this),
                this.decrementOverlayLock.bind(this)
            );

            // Set up upgrade selection callback
            this.modals.levelUp.onUpgradeSelected((choice, choiceIndex) => {
                this.selectUpgrade(choice);

                // Play upgrade sound
                this.audioManager.playSound('upgrade');

                // Process any remaining deferred level ups, or resume game
                this.processPendingLevelUps();

                // If no more pending level ups, resume game
                if (this.pendingLevelUps === 0) {
                    this.gameRunning = true;
                    this.timePaused = false;
                    this.startAnimationLoop();
                }
            });

            this._levelUpModalInitialized = true;
        }

        // Initialize chest modal (if not already initialized)
        if (!this._chestModalInitialized) {
            this.modals.chest.init();

            // Set up overlay lock callbacks for pausing game
            this.modals.chest.setOverlayLockCallbacks(
                this.incrementOverlayLock.bind(this),
                this.decrementOverlayLock.bind(this)
            );

            // Set up translation function
            this.modals.chest.setTranslationFunction(this.t.bind(this));

            // Share render callbacks for guide/status panes
            this.modals.chest.setRenderCallbacks({
                generateWeaponsSection: this.generateWeaponsSection.bind(this),
                generatePassivesSection: this.generatePassivesSection.bind(this),
                generatePlayerStatsSection: this.generatePlayerStatsSection.bind(this)
            });

            // Set up upgrade selection callback
            this.modals.chest.onUpgradeSelected((choice, choiceIndex) => {
                // Apply passive upgrade
                this.selectUpgrade(choice);

                // Play upgrade sound
                this.audioManager.playSound('upgrade');

                // Resume game
                this.gameRunning = true;
                this.timePaused = false;

                // Restart animation loop if needed
                this.startAnimationLoop();
            });

            this._chestModalInitialized = true;
        }

        // Phase 12c.4 - Initialize pause modal (if not already initialized)
        if (!this._pauseModalInitialized) {
            this.modals.pause.init();

            // Ensure dashButtonPosition is initialized from settings or touchControls
            if (!this.dashButtonPosition) {
                this.dashButtonPosition = this.touchControls?.dashButton?.position || 'right';
            }

            // Set up game state callbacks for dynamic button labels
            this.modals.pause.setGameStateCallbacks(
                () => this.audioManager.isMusicMuted(),
                () => this.audioManager.isSfxMuted(),
                () => this.dashButtonPosition,
                this.t.bind(this)
            );

            // Set up overlay lock callbacks
            this.modals.pause.setOverlayLockCallbacks(
                this.incrementOverlayLock.bind(this),
                this.decrementOverlayLock.bind(this)
            );

            // Set up button callbacks
            this.modals.pause.onResume(() => {
                this.togglePause(); // Resume game
            });

            this.modals.pause.onRestart(() => {
                this.showRestartConfirmation();
            });

            this.modals.pause.onMusicMute(() => {
                this.toggleMusicMute();
            });

            this.modals.pause.onSfxMute(() => {
                this.toggleSfxMute();
            });

            this.modals.pause.onMusicVolume((volume) => {
                this.setMusicVolume(volume);
            });

            this.modals.pause.onSfxVolume((volume) => {
                this.setSfxVolume(volume);
            });

            this.modals.pause.onDashPosition(() => {
                this.toggleDashButtonPosition();
            });

            this.modals.pause.onExit(() => {
                this.showExitConfirmation();
            });

            this._pauseModalInitialized = true;
        }

        // Phase 12c.4b - Initialize restart confirmation modal
        if (!this._restartConfirmationModalInitialized) {
            this.modals.restartConfirmation.init();

            // Set up overlay lock callbacks
            this.modals.restartConfirmation.setOverlayLockCallbacks(
                this.incrementOverlayLock.bind(this),
                this.decrementOverlayLock.bind(this)
            );

            // Set up parent keyboard management (disable pause modal's keyboard handler)
            this.modals.restartConfirmation.setParentKeyboardCallbacks(
                this.modals.pause.disableKeyboardHandlers.bind(this.modals.pause),
                this.modals.pause.enableKeyboardHandlers.bind(this.modals.pause)
            );

            // Set up confirmation callbacks
            this.modals.restartConfirmation.onConfirm(() => {
                // Close pause menu and restart game
                this.isPaused = false;
                this.modals.pause.hide();
                this.setPauseMenuOverlayState(false);
                this.restartGame();
            });

            this.modals.restartConfirmation.onCancel(() => {
                // Just close the confirmation dialog
            });

            this.modals.restartConfirmation.setTranslationFunction(this.t.bind(this));

            this._restartConfirmationModalInitialized = true;
        }

        // Phase 12c.4b - Initialize exit confirmation modal
        if (!this._exitConfirmationModalInitialized) {
            this.modals.exitConfirmation.init();

            // Set up overlay lock callbacks
            this.modals.exitConfirmation.setOverlayLockCallbacks(
                this.incrementOverlayLock.bind(this),
                this.decrementOverlayLock.bind(this)
            );

            // Store default parent keyboard callbacks (pause modal) for later restoration
            this.exitConfirmationDefaultCallbacks = {
                disable: this.modals.pause.disableKeyboardHandlers.bind(this.modals.pause),
                enable: this.modals.pause.enableKeyboardHandlers.bind(this.modals.pause)
            };

            // Set up parent keyboard management (disable pause modal's keyboard handler)
            this.modals.exitConfirmation.setParentKeyboardCallbacks(
                this.exitConfirmationDefaultCallbacks.disable,
                this.exitConfirmationDefaultCallbacks.enable
            );

            // Set up confirmation callbacks
            this.modals.exitConfirmation.onConfirm(() => {
                // Hide confirmation modal first to prevent re-enabling parent keyboard handler
                this.modals.exitConfirmation.hide();

                // Reset parent callbacks back to default (pause modal)
                this.resetExitConfirmationParentCallbacks();
                this.victoryHiddenForExitConfirmation = false;

                // Then close the game
                this.closeGame();
            });

            this.modals.exitConfirmation.onCancel(() => {
                // Reset parent callbacks back to default (pause modal) after cancellation
                setTimeout(() => {
                    this.resetExitConfirmationParentCallbacks();
                    this.ensureVictoryModalVisible();
                }, 0);
            });

            this.modals.exitConfirmation.setTranslationFunction(this.t.bind(this));

            this._exitConfirmationModalInitialized = true;
        }

        // Phase 12c.5 - Options menu modal already initialized in launchGame()
        // (needs to be available on start screen, not just when game starts)

        // Phase 12c.12 - Ensure dash button is shown and positioned correctly when game starts
        setTimeout(() => {
            if (this.touchControlsUI && this.touchControlsUI.showDashButton) {
                const position = this.touchControls?.dashButton?.position || 'right';
                this.touchControlsUI.showDashButton();
                this.touchControlsUI.setDashButtonPosition(position);
            }
        }, 100);

        this.gameRunning = true;

        // Spawn starting XP orbs around player for easier early progression
        const startingOrbCount = 14;
        for (let i = 0; i < startingOrbCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 120; // Random distance between 80-200 pixels (doubled from 40-100)
            const orbX = this.player.x + Math.cos(angle) * distance;
            const orbY = this.player.y + Math.sin(angle) * distance;
            this.createXPOrb(orbX, orbY);
        }

        // Start background music when game actually begins (Phase 11 - AudioManager)
        try {
            this.audioManager.resetMusic();
            this.audioManager.playMusic();
            // Background music started
        } catch (e) {
            console.warn('Could not start background music:', e);
        }

        // Game loop started
        this.startAnimationLoop();
    }

    resetGame() {
        // Reset game core state
        this.gameTime = 0;
        this.lastTimestamp = null;
        this.accumulator = 0;
        this.spawnRate = SPAWN_CONFIG.BASE_SPAWN_RATE;
        this.waveMultiplier = 1;
        this.timePaused = false;
        if (this.engineTimer) {
            this.engineTimer.reset();
        }
        if (this.frameRateCounter) {
            this.frameRateCounter.reset();
        }

        // Reset UI state
        this.frameCount = 0;
        this.lastSpawn = 0;
        this.isPaused = false;
        this.notifications = [];
        this.overlayLocks = 0;

        // Reset boss state
        this.bossLevel = 1;
        this.bossesKilled = 0;
        this.bossDefeating = false;
        this.bossSpawned = false;
        this.nextBossSpawnTime = null;
        this.pendingBossSpawn = null;
        this.bossVictoryInProgress = false;
        this.lastVictoryPayload = null;
        this.pendingLevelUps = 0;

        // Reset touch controls to prevent stuck movement
        this.inputManager.resetTouchControls();

        // Reset player - start at world center
        resetPlayerState(this.player);

        // Reset weapons to single basic weapon
        resetWeaponsState(this.weapons);
        resetWeaponStatsState(this.weaponStats);
        this.updateOverlayLockState();

        // Clear game entity arrays
        this.enemies.length = 0;
        // Clear enemy behavior groups
        this.enemiesByBehavior.chase.length = 0;
        this.enemiesByBehavior.dodge.length = 0;
        this.enemiesByBehavior.tank.length = 0;
        this.enemiesByBehavior.fly.length = 0;
        this.enemiesByBehavior.teleport.length = 0;
        this.enemiesByBehavior.boss.length = 0;

        resetProjectilesState(this.projectiles);
        resetParticlesState(this.particles);

        // Reset rendering systems
        this.animationController.reset();
        this.particleSystem.reset();
        this.effectsManager.reset();

        // Reset gameplay systems
        this.playerSystem.reset();
        this.pickupSystem.reset();
        this.enemySystem.reset();

        this.xpOrbs.length = 0;
        this.hpOrbs.length = 0;
        this.magnetOrbs.length = 0;
        this.maxWeaponSlots = WEAPON_UPGRADES.MAX_WEAPONS;

        // Reset object pools - mark all as inactive
        if (this.projectilePool) {
            this.projectilePool.forEach(projectile => projectile.active = false);
        }
        // Note: particle pool now managed by ParticleSystem
        // Legacy pools kept for backward compatibility during transition
        if (this.enemyPool) {
            this.enemyPool.forEach(enemy => enemy.active = false);
        }
        if (this.xpOrbPool) {
            this.xpOrbPool.forEach(orb => orb.active = false);
        }
        if (this.hpOrbPool) {
            this.hpOrbPool.forEach(orb => orb.active = false);
        }
        if (this.magnetOrbPool) {
            this.magnetOrbPool.forEach(orb => orb.active = false);
        }

        // Reset frame rate monitoring using PerformanceMonitor
        this.performanceMonitor.reset();

        // Reset adaptive quality to optimal starting level
        if (this.adaptiveQuality) {
            this.adaptiveQuality.currentLevel = 3; // Reset to medium quality
            this.adaptiveQuality.frameCount = 0;
            this.adaptiveQuality.lastAdjustment = 0;
        }

        // Initialize dirty rectangle system
        this.dirtyRectangles = [];
        this.lastEntityPositions = new Map();
        this.staticCanvasCache = null;
        this.backgroundCanvasCache = null;

        // Clear grid cache for fresh rendering
        if (this.gridOffscreen) {
            this.gridOffscreen = null;
            this.gridOffscreenCtx = null;
        }

        // Clear canvas layers cache for fresh rendering
        if (this.canvasLayers) {
            this.cleanupCanvasLayers();
            this.canvasLayersInitialized = false;
        }

        this.performanceMonitor.setPerformanceMode(false);

        // Reset camera
        resetCameraState(this.camera);
    }

    // Start or resume the main animation loop with normalized timing
    startAnimationLoop() {
        if (!this.gameRunning || !this.canvas || !this.ctx) {
            return;
        }

        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        this.lastTimestamp = null;
        this.accumulator = 0;
        this.gameLoop(performance.now());
    }

    gameLoop(timestamp) {
        if (!this.gameRunning || !this.canvas || !this.ctx) {
            this.gameLoopId = null;
            this.lastTimestamp = null;
            this.accumulator = 0;
            return;
        }

        if (typeof timestamp !== 'number') {
            timestamp = performance.now();
        }

        // Update frame rate monitoring
        this.performanceMonitor.update();
        if (this.frameRateCounter && typeof timestamp === 'number') {
            this.frameRateCounter.update(timestamp);
        }

        const previousTimestamp = this.lastTimestamp === null ? timestamp : this.lastTimestamp;
        const delta = Math.max(0, timestamp - previousTimestamp);
        this.lastTimestamp = timestamp;

        if (!this.isPaused) {
            this.accumulator = Math.min(this.accumulator + delta, this.maxAccumulatedTime);
            const epsilon = 0.0001;
            while (this.accumulator + epsilon >= this.frameInterval) {
                this.update();
                this.accumulator -= this.frameInterval;
            }
        } else {
            this.accumulator = 0;
        }

        this.draw();
        this.updateUI();

        this.gameLoopId = requestAnimationFrame(nextTimestamp => this.gameLoop(nextTimestamp));
    }

    update() {
        // Always update effects even if player is dead
        this.effectsManager.updateScreenShake();
        this.effectsManager.updateRedFlash();
        this.particleSystem.updateExplosions();
        this.particleSystem.updateParticles();
        this.updateNotifications();

        // Skip game logic if player is dead
        if (this.playerDead) return;

        // Only update time and frame count if not paused (menus, victory screens, etc.)
        if (!this.timePaused) {
            this.frameCount++;

            // Sync main game time with EngineTimer utility
            if (this.engineTimer) {
                const fixedDeltaSeconds = this.frameInterval / 1000;
                this.engineTimer.update(fixedDeltaSeconds);
                this.gameTime = this.engineTimer.getTime();
            } else {
                // Fallback in case timer is unavailable
                this.gameTime = this.frameCount / 60;
            }
        }

        this.updatePlayer();

        // Keep magnet boost active until field is clear of XP orbs
        if (this.player.magnetBoost > 0 && this.xpOrbs.length === 0) {
            this.player.magnetBoost = 0;
        }
        this.updatePassives();
        this.updateWeapons();
        this.spawnEnemies();
        this.updateEnemies();
        this.updateProjectiles();
        this.updateXPOrbs();
        this.spawnHPOrbs();
        this.updateHPOrbs();
        this.spawnMagnetOrbs();
        this.updateMagnetOrbs();
        this.spawnChestOrbs();
        this.updateChestOrbs();

        this.checkScheduledBossSpawn();
        this.processPendingBossSpawn();

        this.checkCollisions();
        this.checkLevelUp();
        this.updateCamera();

        // Update adaptive quality scaling
        this.updateAdaptiveQuality();
    }

    updatePlayer() {
        // Delegate to PlayerSystem
        this.playerSystem.updatePlayer(
            this.player,
            this.inputManager,
            this.animationController,
            this.spriteConfig,
            this.cachedSqrt,
            () => this.createDashParticles(),
            this.qualitySettings,
            this.audioManager
        );
    }

    updatePassives() {
        // Delegate to PlayerSystem
        this.playerSystem.updatePassives(this.player);
    }

    updateWeapons() {
        this.weapons.forEach(weapon => {
            let canFire = true;

            if (weapon.type === 'gatling_gun') {
                const triggerBurstSound = () => {
                    if (this.audioManager) {
                        this.audioManager.playSound('weaponGatlingGun', 0.7);
                    }
                };

                if (!weapon.burstState) {
                    weapon.burstState = 'firing';
                    weapon.burstTimer = weapon.gatlingFireDuration || 60;
                    triggerBurstSound();
                }

                weapon.burstTimer = (weapon.burstTimer ?? 0) - 1;
                if (weapon.burstTimer <= 0) {
                    const nextState = weapon.burstState === 'firing' ? 'break' : 'firing';
                    weapon.burstState = nextState;
                    weapon.burstTimer = nextState === 'firing'
                        ? (weapon.gatlingFireDuration || 60)
                        : (weapon.gatlingBreakDuration || 30);

                    if (nextState === 'firing') {
                        triggerBurstSound();
                    }
                }

                canFire = weapon.burstState === 'firing';
            }

            weapon.lastFire++;
            if (canFire && weapon.lastFire >= weapon.fireRate) {
                this.fireWeapon(weapon);
                weapon.lastFire = 0;
            }
        });
    }

    togglePause() {
        // Phase 12c.4 - Use PauseMenu modal (Option B: Proper Encapsulation)
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pause-btn');

        if (this.isPaused) {
            // Update pause button to show play symbol
            if (pauseBtn) pauseBtn.textContent = '▶';

            // Show pause modal (modal handles all keyboard interaction internally)
            this.modals.pause.show();

            // Sync volume sliders with current audio manager state
            this.modals.pause.updateVolumeSliders(
                this.audioManager.musicVolume,
                this.audioManager.sfxVolume
            );

            this.setPauseMenuOverlayState(true);

            // Pause background music (Phase 11 - AudioManager)
            this.audioManager.pauseMusic();

            // Pause looping weapon sounds (gatling gun, etc.)
            this.pauseLoopingWeaponSounds();
        } else {
            // Update pause button to show pause symbol
            if (pauseBtn) pauseBtn.textContent = '||';

            // Hide pause modal
            this.modals.pause.hide();
            this.setPauseMenuOverlayState(false);

            // Resume background music (Phase 11 - AudioManager)
            this.audioManager.resumeMusic();

            // Resume looping weapon sounds if appropriate
            this.resumeLoopingWeaponSounds();
        }
    }

    pauseLoopingWeaponSounds() { }

    resumeLoopingWeaponSounds() { }

    toggleMusicMute() {
        this.audioManager.toggleMusicMute();

        if (this.modals.pause) {
            this.modals.pause.updateButtonLabels();
        }
        if (this.modals.options) {
            this.modals.options.updateButtonLabels();
        }

        // Save settings
        this.saveUserSettings();
    }

    toggleSfxMute() {
        this.audioManager.toggleSfxMute();

        if (this.modals.pause) {
            this.modals.pause.updateButtonLabels();
        }
        if (this.modals.options) {
            this.modals.options.updateButtonLabels();
        }

        // Save settings
        this.saveUserSettings();
    }

    setMusicVolume(volume) {
        this.audioManager.setMusicVolume(volume);
        // Save settings
        this.saveUserSettings();
    }

    setSfxVolume(volume) {
        this.audioManager.setSFXVolume(volume);
        // Save settings
        this.saveUserSettings();
    }

    showExitConfirmation() {
        // Phase 12c.4b - Use ExitConfirmationModal (Option B pattern)
        this.modals.exitConfirmation.show();
    }

    resetExitConfirmationParentCallbacks() {
        if (!this.exitConfirmationDefaultCallbacks) return;
        this.modals.exitConfirmation.setParentKeyboardCallbacks(
            this.exitConfirmationDefaultCallbacks.disable,
            this.exitConfirmationDefaultCallbacks.enable
        );
    }

    ensureVictoryModalVisible() {
        if (!this.bossVictoryInProgress) return;
        if (!this.modals?.victory) return;
        if (this.modals.victory.isOpen) return;

        if (!this.lastVictoryPayload) {
            console.warn('Victory modal missing while bossVictoryInProgress but no cached payload to restore.');
            return;
        }

        if (this.victoryHiddenForExitConfirmation) {
            console.info('Restoring victory modal after exit confirmation cancellation.');
        } else {
            console.warn('Restoring victory modal after unexpected closure.');
        }
        const { finalStats, bossesKilled, bossLevel } = this.lastVictoryPayload;
        this.modals.victory.show(finalStats, bossesKilled, bossLevel);
        this.victoryHiddenForExitConfirmation = false;
    }

    showRestartConfirmation() {
        // Phase 12c.4b - Use RestartConfirmationModal (Option B pattern)
        this.modals.restartConfirmation.show();
    }

    hideRestartConfirmation() {
        // Phase 12c.4b - Use RestartConfirmationModal (Option B pattern)
        this.modals.restartConfirmation.hide();
    }

    enablePauseScrolling() {
        const pauseContent = document.querySelector('.pause-content');
        if (!pauseContent) return;

        if (this.pauseScrollHandler) {
            pauseContent.removeEventListener('touchstart', this.pauseScrollHandler.start, { passive: false });
            pauseContent.removeEventListener('touchmove', this.pauseScrollHandler.move, { passive: false });
            pauseContent.removeEventListener('touchend', this.pauseScrollHandler.end, { passive: false });
        }

        this.pauseScrollHandler = {
            start: (e) => {
                e.stopPropagation();
            },
            move: (e) => {
                e.stopPropagation();
            },
            end: (e) => {
                e.stopPropagation();
            }
        };

        pauseContent.addEventListener('touchstart', this.pauseScrollHandler.start, { passive: true });
        pauseContent.addEventListener('touchmove', this.pauseScrollHandler.move, { passive: true });
        pauseContent.addEventListener('touchend', this.pauseScrollHandler.end, { passive: true });
    }

    disablePauseScrolling() {
        const pauseContent = document.querySelector('.pause-content');
        if (!pauseContent || !this.pauseScrollHandler) return;

        pauseContent.removeEventListener('touchstart', this.pauseScrollHandler.start, { passive: true });
        pauseContent.removeEventListener('touchmove', this.pauseScrollHandler.move, { passive: true });
        pauseContent.removeEventListener('touchend', this.pauseScrollHandler.end, { passive: true });
        this.pauseScrollHandler = null;
    }

    toggleDashButtonPosition() {
        if (!this.touchControls?.dashButton) return;

        // Delegate to input manager
        this.inputManager.toggleDashButtonPosition();

        // Sync the main class property
        this.dashButtonPosition = this.touchControls.dashButton.position;

        // Phase 12c.12 - Update dash button position via TouchControlsUI
        this.touchControlsUI.setDashButtonPosition(this.touchControls.dashButton.position);

        if (this.modals.pause) {
            this.modals.pause.updateButtonLabels();
        }
        if (this.modals.options) {
            this.modals.options.updateButtonLabels();
        }
    }

    loadSettings() {
        const defaults = { dashButtonPosition: 'right' };

        try {
            const stored = window.localStorage?.getItem('vibeSurvivorSettings');
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...defaults, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load Vibe Survivor settings:', error);
        }

        return { ...defaults };
    }

    saveSettings() {
        if (!this.settings) return;

        try {
            window.localStorage?.setItem('vibeSurvivorSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save Vibe Survivor settings:', error);
        }
    }

    // Phase 12c.6 - Toggle help menu (using HelpMenu modal - Option B pattern)
    toggleHelp() {
        this.isHelpOpen = !this.isHelpOpen;

        if (this.isHelpOpen) {
            // Save current navigation state before opening help
            if (this.menuNavigationState.active) {
                const previousState = {
                    active: this.menuNavigationState.active,
                    selectedIndex: this.menuNavigationState.selectedIndex,
                    menuType: this.menuNavigationState.menuType,
                    menuButtons: [...this.menuNavigationState.menuButtons],
                    keyboardUsed: this.menuNavigationState.keyboardUsed
                };
                this.modals.helpMenu.setPreviousNavigationState(previousState);
            }

            // Update help button text
            this.modals.helpMenu.updateHelpButtonText(true);

            // Show the modal (modal handles all keyboard interaction internally)
            this.modals.helpMenu.show();
        } else {
            // Update help button text
            this.modals.helpMenu.updateHelpButtonText(false);

            // Hide the modal (modal handles all cleanup internally)
            this.modals.helpMenu.hide();
        }
    }

    incrementOverlayLock() {
        if (typeof this.overlayLocks !== 'number') {
            this.overlayLocks = 0;
        }
        this.overlayLocks += 1;
        this.updateOverlayLockState();
    }

    decrementOverlayLock() {
        if (typeof this.overlayLocks !== 'number') {
            this.overlayLocks = 0;
        }
        this.overlayLocks = Math.max(0, this.overlayLocks - 1);
        this.updateOverlayLockState();
    }

    updateOverlayLockState() {
        const content = document.querySelector('.vibe-survivor-content');
        if (!content) return;

        if (this.overlayLocks > 0) {
            content.classList.add('overlay-active');
        } else {
            content.classList.remove('overlay-active');
        }
    }

    setPauseMenuOverlayState(isOpen) {
        const content = document.querySelector('.vibe-survivor-content');
        if (!content) return;
        if (isOpen) {
            content.classList.add('pause-menu-open');
        } else {
            content.classList.remove('pause-menu-open');
        }
    }

    renderHelpStatusTab() {
        const statusPane = document.getElementById('help-pane-status');
        if (!statusPane) return;

        const statusTitle = this.t('statusTab');
        const weaponsSection = this.generateWeaponsSection();
        const passivesSection = this.generatePassivesSection();
        const playerStatsSection = this.generatePlayerStatsSection();

        const sections = [weaponsSection, passivesSection, playerStatsSection].filter(Boolean).join('');

        const emptyText = this.t('statusEmpty');
        statusPane.innerHTML = `
            <h2 id="help-status-title">${statusTitle}</h2>
            ${sections || `<p class="help-status-empty">${emptyText}</p>`}
        `;
    }

    // Phase 12c.2 - Game Over touch scrolling moved to GameOverModal class
    // enableGameOverScrolling() and disableGameOverScrolling() removed
    // Modal now handles its own touch scroll behavior in game-over.js

    // Phase 12c.7 - Victory scrolling methods removed, handled by VictoryModal class

    enableAboutScrolling() {
        const aboutContent = document.querySelector('.about-content');
        if (!aboutContent) return;

        // Remove any existing touch event listeners to avoid duplicates
        if (this.aboutScrollHandler) {
            aboutContent.removeEventListener('touchstart', this.aboutScrollHandler.start, { passive: false });
            aboutContent.removeEventListener('touchmove', this.aboutScrollHandler.move, { passive: false });
            aboutContent.removeEventListener('touchend', this.aboutScrollHandler.end, { passive: false });
        }

        this.aboutScrollHandler = {
            start: (e) => {
                e.stopPropagation();
            },
            move: (e) => {
                e.stopPropagation();
            },
            end: (e) => {
                e.stopPropagation();
            }
        };

        // Add touch event listeners that explicitly allow scrolling
        aboutContent.addEventListener('touchstart', this.aboutScrollHandler.start, { passive: true });
        aboutContent.addEventListener('touchmove', this.aboutScrollHandler.move, { passive: true });
        aboutContent.addEventListener('touchend', this.aboutScrollHandler.end, { passive: true });
    }

    disableAboutScrolling() {
        const aboutContent = document.querySelector('.about-content');
        if (!aboutContent || !this.aboutScrollHandler) return;

        // Remove touch event listeners
        aboutContent.removeEventListener('touchstart', this.aboutScrollHandler.start, { passive: true });
        aboutContent.removeEventListener('touchmove', this.aboutScrollHandler.move, { passive: true });
        aboutContent.removeEventListener('touchend', this.aboutScrollHandler.end, { passive: true });

        // Clear the handler reference
        this.aboutScrollHandler = null;
    }

    enableOptionsScrolling() {
        const optionsContent = document.querySelector('.options-content');
        if (!optionsContent) return;

        // Remove any existing touch event listeners to avoid duplicates
        if (this.optionsScrollHandler) {
            optionsContent.removeEventListener('touchstart', this.optionsScrollHandler.start, { passive: false });
            optionsContent.removeEventListener('touchmove', this.optionsScrollHandler.move, { passive: false });
            optionsContent.removeEventListener('touchend', this.optionsScrollHandler.end, { passive: false });
        }

        this.optionsScrollHandler = {
            start: (e) => {
                e.stopPropagation();
            },
            move: (e) => {
                e.stopPropagation();
            },
            end: (e) => {
                e.stopPropagation();
            }
        };

        // Add touch event listeners that explicitly allow scrolling
        optionsContent.addEventListener('touchstart', this.optionsScrollHandler.start, { passive: true });
        optionsContent.addEventListener('touchmove', this.optionsScrollHandler.move, { passive: true });
        optionsContent.addEventListener('touchend', this.optionsScrollHandler.end, { passive: true });
    }

    disableOptionsScrolling() {
        const optionsContent = document.querySelector('.options-content');
        if (!optionsContent || !this.optionsScrollHandler) return;

        // Remove touch event listeners
        optionsContent.removeEventListener('touchstart', this.optionsScrollHandler.start, { passive: true });
        optionsContent.removeEventListener('touchmove', this.optionsScrollHandler.move, { passive: true });
        optionsContent.removeEventListener('touchend', this.optionsScrollHandler.end, { passive: true });

        // Clear the handler reference
        this.optionsScrollHandler = null;
    }

    // Phase 12c.7 - scrollVictoryContent removed, handled by VictoryModal class

    checkHelpButtonVisibility() {
        const helpBtn = document.getElementById('help-btn');
        if (!helpBtn) return;

        // Hide help button during game over
        if (!this.gameRunning && this.menuNavigationState.menuType === 'gameover') {
            helpBtn.style.display = 'none';
            return;
        }

        // Always show help button - players should have access to merger recipes
        helpBtn.style.display = 'flex';
    }

    // Menu Navigation Methods
    initializeMenuNavigation(menuType, buttons) {
        this.menuNavigationState.active = true;
        this.menuNavigationState.selectedIndex = 0;
        this.menuNavigationState.menuType = menuType;
        this.menuNavigationState.menuButtons = buttons;
        this.menuNavigationState.keyboardUsed = false;
        this.updateMenuSelection();
    }

    updateMenuSelection() {
        if (!this.menuNavigationState.active) return;

        // Remove previous selection styling
        this.menuNavigationState.menuButtons.forEach((button, index) => {
            button.classList.remove('menu-selected');
            button.style.boxShadow = '';
            button.style.borderColor = '';
        });

        // Ensure help button maintains its cyan border regardless of menu navigation
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.style.borderColor = '#00ffff';
        }

        // Only show visual selection if keyboard has been used
        if (this.menuNavigationState.keyboardUsed) {
            // Add current selection styling
            const selectedButton = this.menuNavigationState.menuButtons[this.menuNavigationState.selectedIndex];
            if (selectedButton) {
                selectedButton.classList.add('menu-selected');
                selectedButton.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8)';
                selectedButton.style.borderColor = '#00ffff';

                // Auto-scroll to keep selected item in view
                this.scrollToSelectedItem(selectedButton);
            }
        }
    }

    scrollToSelectedItem(selectedButton) {
        if (!selectedButton) return;

        // Find the scrollable container for this button
        let scrollContainer = null;

        // Check if it's in the help modal
        if (selectedButton.closest('.help-content')) {
            scrollContainer = selectedButton.closest('.help-content');
        }
        // Check if it's in the level up modal
        else if (selectedButton.closest('.upgrade-choices-container')) {
            scrollContainer = selectedButton.closest('.upgrade-choices-container');
        }
        // Check if it's in other scrollable containers
        else {
            // Look for parent with overflow-y: auto or scroll
            let parent = selectedButton.parentElement;
            while (parent && parent !== document.body) {
                const style = window.getComputedStyle(parent);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                    scrollContainer = parent;
                    break;
                }
                parent = parent.parentElement;
            }
        }

        if (!scrollContainer) return;

        // Get container and button positions
        const containerRect = scrollContainer.getBoundingClientRect();
        const buttonRect = selectedButton.getBoundingClientRect();

        // Calculate if button is outside visible area
        const containerTop = containerRect.top;
        const containerBottom = containerRect.bottom;
        const buttonTop = buttonRect.top;
        const buttonBottom = buttonRect.bottom;

        // Add some padding for better UX
        const padding = 20;

        // Check if button is above visible area
        if (buttonTop < containerTop + padding) {
            const scrollAmount = buttonTop - containerTop - padding;
            scrollContainer.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
        // Check if button is below visible area
        else if (buttonBottom > containerBottom - padding) {
            const scrollAmount = buttonBottom - containerBottom + padding;
            scrollContainer.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    navigateMenu(direction) {
        if (!this.menuNavigationState.active) return;

        const buttonCount = this.menuNavigationState.menuButtons.length;
        if (buttonCount === 0) return;

        const oldIndex = this.menuNavigationState.selectedIndex;

        if (direction === 'up' || direction === 'left') {
            this.menuNavigationState.selectedIndex = (this.menuNavigationState.selectedIndex - 1 + buttonCount) % buttonCount;
        } else if (direction === 'down' || direction === 'right') {
            this.menuNavigationState.selectedIndex = (this.menuNavigationState.selectedIndex + 1) % buttonCount;
        }


        this.updateMenuSelection();
    }

    selectCurrentMenuItem() {
        if (!this.menuNavigationState.active) return;

        const selectedElement = this.menuNavigationState.menuButtons[this.menuNavigationState.selectedIndex];
        if (selectedElement) {
            // Handle different element types
            if (selectedElement.tagName === 'SELECT') {
                // For select dropdowns, cycle through options
                const select = selectedElement;
                const currentIndex = select.selectedIndex;
                const nextIndex = (currentIndex + 1) % select.options.length;
                select.selectedIndex = nextIndex;

                // Trigger change event
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
            } else if (selectedElement.tagName === 'A') {
                // For links, simulate click to open in new tab
                selectedElement.click();
            } else {
                // For buttons, just click them
                selectedElement.click();
            }
        }
    }

    resetMenuNavigation() {
        this.inputManager.resetMenuNavigation();
        // Note: We don't clear previousNavigationState here because it's used to restore state later
    }

    exitToMenu() {
        this.isPaused = false;
        this.gameRunning = false;

        // Hide pause menu
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.style.display = 'none';
        }
        this.disablePauseScrolling();

        // Show start screen
        this.showStartScreen();
        this.resetGame();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0);
    }

    // Enhanced browser detection for canvas optimization
    getBrowserOptimizationProfile() {
        const userAgent = navigator.userAgent.toLowerCase();

        // Check if Chrome first
        const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg');

        if (!isChrome) {
            // Samsung Browser (Chrome-based but optimized)
            if (userAgent.includes('samsungbrowser')) {
                return {
                    browser: 'samsung-mobile',
                    contextOptions: { willReadFrequently: false },
                    reason: 'Samsung browser has optimized GPU drivers'
                };
            }

            // Other browsers (Firefox, Safari, etc.)
            return {
                browser: 'other',
                contextOptions: { willReadFrequently: false },
                reason: 'Default browser optimization'
            };
        }

        // Chrome Mobile (the problematic one)
        if ((userAgent.includes('android') && userAgent.includes('mobile')) ||
            userAgent.includes('iphone') || userAgent.includes('ipod') ||
            userAgent.includes('ipad')) {
            return {
                browser: 'chrome-mobile',
                contextOptions: { willReadFrequently: false },
                reason: 'Chrome mobile - forcing GPU acceleration for better performance'
            };
        }

        // Chrome Desktop (should work fine with GPU)
        if (userAgent.includes('windows nt') ||
            userAgent.includes('macintosh') ||
            userAgent.includes('linux')) {
            return {
                browser: 'chrome-desktop',
                contextOptions: { willReadFrequently: false },
                reason: 'Chrome desktop GPU acceleration works well'
            };
        }

        // Chrome unknown platform - be safe and disable GPU
        return {
            browser: 'chrome-unknown',
            contextOptions: { willReadFrequently: false },
            reason: 'Unknown Chrome platform - forcing GPU acceleration for better performance'
        };
    }

    detectPerformanceMode() {
        // DISABLED: Don't auto-enable performance mode
        // Let the adaptive system handle performance based on actual FPS measurements

        // Only enable for very old mobile devices
        const userAgent = navigator.userAgent.toLowerCase();
        if (this.isMobile && (
            userAgent.includes('android 4') ||
            userAgent.includes('iphone os 9')
        )) {
            console.log('Very old mobile device detected - enabling performance mode');
            this.performanceMonitor.setPerformanceMode(true);
        } else {
            console.log('Starting in normal performance mode - will adapt based on actual FPS');
            this.performanceMonitor.setPerformanceMode(false);
        }
    }

    preventBackgroundScrolling() {
        const modal = document.getElementById('vibe-survivor-modal');
        const content = document.querySelector('.vibe-survivor-content');

        if (!modal || !content) return;

        // Prevent touch scrolling on modal and content
        const preventTouchDefault = (e) => {
            // Only prevent default if the touch isn't on game controls
            const target = e.target;
            const isGameControl = target.closest('#survivor-canvas') ||
                target.closest('.mobile-controls') ||
                target.closest('.header-help-btn') ||
                target.closest('.pause-btn') ||
                target.closest('.survivor-btn') ||
                target.closest('.upgrade-choice') ||
                target.closest('.levelup-modal') ||
                target.closest('.pause-menu') ||
                target.closest('#overlay-retry-btn') ||
                target.closest('#overlay-exit-btn') ||
                target.closest('#survivor-game-over-overlay');

            // Allow scrolling within help content, level up modal, victory, and game over modals
            const isHelpContent = target.closest('.help-content');
            const isLevelUpContent = target.closest('.levelup-scroll');
            const isVictoryContent = target.closest('.victory-scroll-content');
            const isGameOverContent = target.closest('.game-over-scroll-content');
            const isScoreboardList = target.closest('.scoreboard-list-container');
            const isScoreDetail = target.closest('.score-detail-scroll');
            const isScoreboardFilter = target.closest('.scoreboard-filter');

            if (!isGameControl && !isHelpContent && !isLevelUpContent && !isVictoryContent && !isGameOverContent && !isScoreboardList && !isScoreDetail && !isScoreboardFilter) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // Add event listeners to prevent background scrolling
        modal.addEventListener('touchstart', preventTouchDefault, { passive: false });
        modal.addEventListener('touchmove', preventTouchDefault, { passive: false });
        modal.addEventListener('touchend', preventTouchDefault, { passive: false });

        // Also prevent wheel events for desktop, but allow scrolling in help content and level up modal
        modal.addEventListener('wheel', (e) => {
            const target = e.target;
            const isHelpContent = target.closest('.help-content');
            const isLevelUpContent = target.closest('.levelup-scroll');
            const isPauseContent = target.closest('.pause-content');
            const isAboutContent = target.closest('.about-content');
            const isOptionsContent = target.closest('.options-content');
            const isVictoryContent = target.closest('.victory-scroll-content');
            const isGameOverContent = target.closest('.game-over-scroll-content');
            const isScoreboardList = target.closest('.scoreboard-list-container');
            const isScoreDetail = target.closest('.score-detail-scroll');
            const isScoreboardFilter = target.closest('.scoreboard-filter');

            if (!isHelpContent && !isLevelUpContent && !isPauseContent && !isAboutContent && !isOptionsContent && !isVictoryContent && !isGameOverContent && !isScoreboardList && !isScoreDetail && !isScoreboardFilter) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });

        // Prevent body scrolling while modal is open
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
    }

    restoreBackgroundScrolling() {
        // Restore normal body scroll behavior
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
    }

    // Phase 12c.12 - Touch control methods removed, now handled by TouchControlsUI class
    // - setupMobileControls() moved to TouchControlsUI.init()
    // - ensureDashButtonInBounds() moved to TouchControlsUI.setDashButtonPosition()
    // - setupDashButton() moved to TouchControlsUI.setupDashButton()
    // - setupVirtualJoystick() was already a no-op (InputManager handles joystick events)
    // - updateTouchControlsPositioning() removed (no longer needed)

    fireWeapon(weapon) {
        // Phase 12b integration - Delegate to WeaponSystem
        this.weaponSystem.fireWeapon(weapon, {
            player: this.player,
            enemies: this.enemies,
            getPooledProjectile: () => this.getPooledProjectile(),
            addProjectile: (projectile) => this.projectiles.push(projectile),
            cachedSqrt: this.cachedSqrt,
            fastCos: this.fastCos,
            fastSin: this.fastSin,
            recordDamage: (weaponType, damage, enemy) => this.recordWeaponDamage(weaponType, damage, enemy),
            createHitParticles: (x, y, color) => this.createHitParticles(x, y, color),
            audioManager: this.audioManager
        });
    }

    // Object pooling methods for performance - removed duplicate method

    // Removed duplicate returnProjectileToPool method - using the correct one below

    createBossMissile(boss, healthPercent = 1.0) {
        const bossLevel = boss.bossLevel || 1;
        const variant = this.getBossVariantById(boss.variantId) || this.getBossVariantForLevel(bossLevel);
        const attackPattern = variant?.attackPattern || 'pulse';
        const cycleLevel = this.getBossCycle(bossLevel);

        switch (attackPattern) {
            case 'shock':
                this.fireShockSentinelPattern(boss);
                break;
            case 'rift':
                this.fireRiftReaverPattern(boss);
                break;
            case 'carrier':
                this.fireNightfallCarrierPattern(boss);
                break;
            case 'titan':
                this.fireSingularityTitanPattern(boss);
                break;
            case 'solar':
                this.fireSolarWardenPattern(boss);
                break;
            case 'prism':
                this.firePrismSeraphPattern(boss);
                break;
            case 'vortex':
                this.fireVortexSpectrePattern(boss);
                break;
            case 'reaper':
                this.fireCrimsonReaperPattern(boss);
                break;
            case 'colossus':
                this.fireFrostColossusPattern(boss);
                break;
            default:
                this.firePulseHunterPattern(boss, healthPercent);
        }

        this.applyBossCycleMissileBonus(boss, attackPattern, cycleLevel);
    }

    firePulseHunterPattern(boss, healthPercent) {
        const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
        const bossLevel = boss.bossLevel || 1;
        const speedMultiplier = this.fastPow(1.05, bossLevel - 1);
        const damageMultiplier = this.fastPow(1.15, bossLevel - 1);

        let spreadAngles;
        let damage;
        let speed;
        let homingStrength;
        let color;

        if (healthPercent > 0.7) {
            spreadAngles = [-0.3, 0, 0.3];
            damage = Math.floor(25 * damageMultiplier);
            speed = 2.5 * speedMultiplier;
            homingStrength = 0.05;
            color = '#FF0066';
        } else if (healthPercent > 0.3) {
            spreadAngles = [-0.6, -0.3, 0, 0.3, 0.6];
            damage = Math.floor(30 * damageMultiplier);
            speed = 2.75 * speedMultiplier;
            homingStrength = 0.07;
            color = '#FF3366';
        } else {
            spreadAngles = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9];
            damage = Math.floor(35 * damageMultiplier);
            speed = 3 * speedMultiplier;
            homingStrength = 0.1;
            color = '#FF0033';
        }

        spreadAngles.forEach(angleOffset => {
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: this.fastCos(angleToPlayer + angleOffset) * speed,
                vy: this.fastSin(angleToPlayer + angleOffset) * speed,
                damage,
                life: this.getBossProjectileLife(300, boss),
                type: 'boss-missile',
                color,
                size: 4,
                homing: true,
                homingStrength,
                explosionRadius: 40,
                speed,
                owner: 'enemy'
            });
        });
    }

    fireShockSentinelPattern(boss) {
        boss.variantState = boss.variantState || {};
        const state = boss.variantState;
        state.attackToggle = !state.attackToggle;
        const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);

        if (state.attackToggle) {
            for (let i = -2; i <= 2; i++) {
                const offset = angleToPlayer + i * 0.08;
                const speed = 5;
                this.projectiles.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(offset) * speed,
                    vy: Math.sin(offset) * speed,
                    damage: 32,
                    life: this.getBossProjectileLife(90, boss),
                    type: 'boss-missile',
                    color: '#00E5FF',
                    size: 5,
                    homing: false,
                    explosionRadius: 30,
                    speed,
                    owner: 'enemy'
                });
            }
        } else {
            const ringCount = 8;
            const offset = (state.ringOffset = ((state.ringOffset || 0) + 0.4) % (Math.PI * 2));
            for (let i = 0; i < ringCount; i++) {
                const angle = offset + (Math.PI * 2 * i) / ringCount;
                const speed = 1.2;
                this.projectiles.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    damage: 26,
                    life: this.getBossProjectileLife(240, boss),
                    type: 'boss-missile',
                    color: '#00B4D8',
                    size: 6,
                    homing: false,
                    explosionRadius: 55,
                    speed,
                    owner: 'enemy'
                });
            }
        }
    }

    fireRiftReaverPattern(boss) {
        boss.variantState = boss.variantState || {};
        const state = boss.variantState;
        state.orbAngle = (state.orbAngle || 0) + 0.35;
        const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);

        const shardOffsets = [-0.4, -0.2, 0, 0.2, 0.4];
        shardOffsets.forEach(offset => {
            const speed = 4.5;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angleToPlayer + offset) * speed,
                vy: Math.sin(angleToPlayer + offset) * speed,
                damage: 36,
                life: this.getBossProjectileLife(220, boss),
                type: 'boss-missile',
                color: '#FF8A00',
                size: 5,
                homing: true,
                homingStrength: 0.12,
                explosionRadius: 45,
                speed,
                owner: 'enemy'
            });
        });

        const orbs = 6;
        for (let i = 0; i < orbs; i++) {
            const angle = state.orbAngle + (Math.PI * 2 * i) / orbs;
            const speed = 2.2;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                damage: 18,
                life: this.getBossProjectileLife(260, boss),
                type: 'boss-missile',
                color: '#FFC078',
                size: 4,
                homing: false,
                explosionRadius: 25,
                speed,
                owner: 'enemy'
            });
        }

        // Dash challenge shots: very fast but deal graceful damage so players can dash through
        const dashShots = 2;
        for (let i = 0; i < dashShots; i++) {
            const offset = i === 0 ? -0.08 : 0.08;
            const speed = 6.5;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angleToPlayer + offset) * speed,
                vy: Math.sin(angleToPlayer + offset) * speed,
                damage: 18,
                life: this.getBossProjectileLife(140, boss),
                type: 'boss-missile',
                color: '#FFDF91',
                size: 4,
                homing: false,
                explosionRadius: 20,
                speed,
                owner: 'enemy'
            });
        }
    }

    fireNightfallCarrierPattern(boss) {
        const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
        const volleyCount = 4;
        for (let i = 0; i < volleyCount; i++) {
            const offset = angleToPlayer + (i - (volleyCount - 1) / 2) * 0.15;
            const speed = 3;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(offset) * speed,
                vy: Math.sin(offset) * speed,
                damage: 28,
                life: this.getBossProjectileLife(200, boss),
                type: 'boss-missile',
                color: '#8F7CFF',
                size: 5,
                homing: false,
                explosionRadius: 60,
                speed,
                owner: 'enemy'
            });
        }

        const slowBombs = 3;
        for (let i = 0; i < slowBombs; i++) {
            const angle = (Math.PI * 2 * i) / slowBombs;
            const speed = 1.2;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                damage: 32,
                life: this.getBossProjectileLife(260, boss),
                type: 'boss-missile',
                color: '#B19CFF',
                size: 6,
                homing: false,
                explosionRadius: 70,
                speed,
                owner: 'enemy'
            });
        }
    }

    fireSingularityTitanPattern(boss) {
        boss.variantState = boss.variantState || {};
        const state = boss.variantState;
        state.radialPhase = (state.radialPhase || 0) + 0.2;

        const bolts = 12;
        for (let i = 0; i < bolts; i++) {
            const angle = state.radialPhase + (Math.PI * 2 * i) / bolts;
            const speed = 3.2;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                damage: 38,
                life: this.getBossProjectileLife(220, boss),
                type: 'boss-missile',
                color: '#FFE34D',
                size: 6,
                homing: false,
                explosionRadius: 50,
                speed,
                owner: 'enemy'
            });
        }

        const gravityWells = 2;
        for (let i = 0; i < gravityWells; i++) {
            const baseAngle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
            const offset = i === 0 ? -0.2 : 0.2;
            const speed = 1.5;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(baseAngle + offset) * speed,
                vy: Math.sin(baseAngle + offset) * speed,
                damage: 42,
                life: this.getBossProjectileLife(260, boss),
                type: 'boss-missile',
                color: '#FFC107',
                size: 7,
                homing: true,
                homingStrength: 0.04,
                explosionRadius: 80,
                speed,
                owner: 'enemy'
            });
        }
    }

    fireSolarWardenPattern(boss) {
        const bolts = 12;
        const baseSpeed = 3.2;
        for (let i = 0; i < bolts; i++) {
            const angle = (Math.PI * 2 * i) / bolts;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: this.fastCos(angle) * baseSpeed,
                vy: this.fastSin(angle) * baseSpeed,
                damage: 30,
                life: this.getBossProjectileLife(220, boss),
                type: 'boss-missile',
                color: '#FFB347',
                size: 5,
                homing: false,
                explosionRadius: 45,
                speed: baseSpeed,
                owner: 'enemy'
            });
        }

        const beamOffset = 0.12;
        const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
        for (let i = -1; i <= 1; i += 2) {
            const beamAngle = angleToPlayer + beamOffset * i;
            const speed = 5.5;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(beamAngle) * speed,
                vy: Math.sin(beamAngle) * speed,
                damage: 16,
                life: this.getBossProjectileLife(160, boss),
                type: 'boss-missile',
                color: '#FFD27F',
                size: 4,
                homing: false,
                explosionRadius: 25,
                speed,
                owner: 'enemy'
            });
        }
    }

    firePrismSeraphPattern(boss) {
        const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
        const shardCount = 6;
        for (let i = 0; i < shardCount; i++) {
            const offset = (Math.PI * 2 * i) / shardCount;
            const speed = 4;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angleToPlayer + offset) * speed,
                vy: Math.sin(angleToPlayer + offset) * speed,
                damage: 24,
                life: this.getBossProjectileLife(200, boss),
                type: 'boss-missile',
                color: '#7CFFE8',
                size: 4,
                homing: true,
                homingStrength: 0.08,
                explosionRadius: 30,
                speed,
                owner: 'enemy'
            });
        }

        const prismBeams = 3;
        for (let i = 0; i < prismBeams; i++) {
            const beamAngle = angleToPlayer + (-0.3 + 0.3 * i);
            const speed = 6;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(beamAngle) * speed,
                vy: Math.sin(beamAngle) * speed,
                damage: 20,
                life: this.getBossProjectileLife(140, boss),
                type: 'boss-missile',
                color: '#C5FFF5',
                size: 3,
                homing: false,
                explosionRadius: 20,
                speed,
                owner: 'enemy'
            });
        }
    }

    fireVortexSpectrePattern(boss) {
        boss.variantState = boss.variantState || {};
        const state = boss.variantState;
        state.spiralPhase = (state.spiralPhase || 0) + 0.25;

        // Counter-rotating spiral waves (8 projectiles each direction)
        const spiralCount = 8;
        for (let i = 0; i < spiralCount; i++) {
            const angle = (Math.PI * 2 * i) / spiralCount;

            // Clockwise spiral
            const angleClockwise = angle + state.spiralPhase;
            const speedCW = 2.8;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angleClockwise) * speedCW,
                vy: Math.sin(angleClockwise) * speedCW,
                damage: 28,
                life: this.getBossProjectileLife(240, boss),
                type: 'boss-missile',
                color: '#9D00FF',
                size: 4,
                homing: false,
                explosionRadius: 35,
                speed: speedCW,
                owner: 'enemy'
            });

            // Counter-clockwise spiral
            const angleCounterCW = angle - state.spiralPhase;
            const speedCCW = 2.8;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angleCounterCW) * speedCCW,
                vy: Math.sin(angleCounterCW) * speedCCW,
                damage: 28,
                life: this.getBossProjectileLife(240, boss),
                type: 'boss-missile',
                color: '#C77DFF',
                size: 4,
                homing: false,
                explosionRadius: 35,
                speed: speedCCW,
                owner: 'enemy'
            });
        }

        // Stationary mines in cardinal directions
        const mineDirections = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        mineDirections.forEach(angle => {
            const distance = 120;
            this.projectiles.push({
                x: boss.x + Math.cos(angle) * distance,
                y: boss.y + Math.sin(angle) * distance,
                vx: 0,
                vy: 0,
                damage: 35,
                life: this.getBossProjectileLife(800, boss),
                type: 'boss-missile',
                color: '#7B2CBF',
                size: 6,
                homing: false,
                explosionRadius: 55,
                speed: 0,
                owner: 'enemy',
                isMine: true,
                pulseOffset: Math.random() * Math.PI * 2
            });
        });
    }

    fireCrimsonReaperPattern(boss) {
        boss.variantState = boss.variantState || {};
        const state = boss.variantState;
        state.attackToggle = !state.attackToggle;
        const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);

        if (state.attackToggle) {
            // Cardinal directions (+ pattern)
            const cardinalAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
            cardinalAngles.forEach(angle => {
                const speed = 5.5;
                this.projectiles.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    damage: 32,
                    life: this.getBossProjectileLife(160, boss),
                    type: 'boss-missile',
                    color: '#FF1744',
                    size: 5,
                    homing: false,
                    explosionRadius: 30,
                    speed,
                    owner: 'enemy'
                });
            });
        } else {
            // Diagonal directions (X pattern)
            const diagonalAngles = [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4];
            diagonalAngles.forEach(angle => {
                const speed = 5.5;
                this.projectiles.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    damage: 32,
                    life: this.getBossProjectileLife(160, boss),
                    type: 'boss-missile',
                    color: '#FF4569',
                    size: 5,
                    homing: false,
                    explosionRadius: 30,
                    speed,
                    owner: 'enemy'
                });
            });
        }

        // Homing missiles toward player (always fire)
        const homingCount = 3;
        for (let i = 0; i < homingCount; i++) {
            const offset = (i - 1) * 0.15;
            const speed = 3.5;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angleToPlayer + offset) * speed,
                vy: Math.sin(angleToPlayer + offset) * speed,
                damage: 26,
                life: this.getBossProjectileLife(200, boss),
                type: 'boss-missile',
                color: '#FF6B88',
                size: 4,
                homing: true,
                homingStrength: 0.09,
                explosionRadius: 35,
                speed,
                owner: 'enemy'
            });
        }
    }

    fireFrostColossusPattern(boss) {
        // Massive 16-projectile ice nova covering all directions
        const novaCount = 16;
        for (let i = 0; i < novaCount; i++) {
            const angle = (Math.PI * 2 * i) / novaCount;
            const speed = 2.2;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                damage: 30,
                life: this.getBossProjectileLife(260, boss),
                type: 'boss-missile',
                color: '#00D4FF',
                size: 8,
                homing: false,
                explosionRadius: 55,
                speed,
                owner: 'enemy'
            });
        }

        // Fast ice spears directly at player
        const angleToPlayer = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
        const spearCount = 3;
        for (let i = 0; i < spearCount; i++) {
            const offset = (i - 1) * 0.12;
            const speed = 6;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angleToPlayer + offset) * speed,
                vy: Math.sin(angleToPlayer + offset) * speed,
                damage: 38,
                life: this.getBossProjectileLife(180, boss),
                type: 'boss-missile',
                color: '#5CE1FF',
                size: 6,
                homing: false,
                explosionRadius: 45,
                speed,
                owner: 'enemy'
            });
        }
    }

    spawnEnemies() {
        // Delegate to EnemySystem
        this.enemySystem.spawnEnemies({
            enemies: this.enemies,
            player: this.player,
            gameTime: this.gameTime,
            bossesKilled: this.bossesKilled,
            bossDefeating: this.bossDefeating,
            spawnEnemy: () => this.spawnEnemy(),
            spawnBoss: () => this.spawnBoss()
        });
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        const spawnDistance = 500; // Distance from player to spawn enemies
        let x, y;

        // Spawn enemies around the player's position instead of canvas bounds
        switch (side) {
            case 0: // Top
                x = this.player.x + (Math.random() - 0.5) * 500;
                y = this.player.y - spawnDistance;
                break;
            case 1: // Right
                x = this.player.x + spawnDistance;
                y = this.player.y + (Math.random() - 0.5) * 500;
                break;
            case 2: // Bottom
                x = this.player.x + (Math.random() - 0.5) * 500;
                y = this.player.y + spawnDistance;
                break;
            case 3: // Left
                x = this.player.x - spawnDistance;
                y = this.player.y + (Math.random() - 0.5) * 500;
                break;
        }

        const enemyTypes = this.getAvailableEnemyTypes();
        const type = this.selectEnemyType(enemyTypes);
        const config = this.getEnemyConfig(type);
        const variant = this.selectEnemyVariant(type);

        // Calculate scaled speed - keep enemy speed constant to maintain gameplay feel
        const baseSpeed = config.speed; // Removed time-based speed scaling
        const scaledSpeed = baseSpeed;

        // Calculate enemy scaling: time-based until first boss, then boss-only scaling
        let timeScaling, bossScaling;

        if (this.bossesKilled === 0) {
            // Before first boss: use time-based scaling only
            timeScaling = 1 + Math.floor(this.gameTime / 30) * 0.3; // 30% per 30 seconds
            bossScaling = 1.0; // No boss scaling yet
        } else {
            // After first boss defeated: freeze time scaling, use boss scaling only
            timeScaling = 1 + Math.floor(300 / 30) * 0.3; // Freeze at first boss time (300 seconds = 10 intervals = 4.0x)
            bossScaling = 1 + this.bossesKilled * 1.0; // 100% health scaling per boss defeated
        }

        const totalHealthMultiplier = config.health * timeScaling * bossScaling;
        const totalDamageMultiplier = config.contactDamage * (1 + (this.bossesKilled || 0) * 0.3); // 30% damage per boss

        const sizeMult = variant?.sizeMult || 1;
        const speedMult = variant?.speedMult || 1;
        const healthMult = variant?.healthMult || 1;
        const radius = Math.max(4, Math.floor(config.radius * sizeMult));
        const enemySpeed = scaledSpeed * speedMult;
        const enemyHealth = Math.floor(totalHealthMultiplier * healthMult);
        const enemyDamage = Math.floor(totalDamageMultiplier);

        const enemy = {
            x: x,
            y: y,
            radius: radius,
            speed: enemySpeed,
            baseSpeed: enemySpeed, // Store base speed for future scaling updates
            maxHealth: enemyHealth,
            health: enemyHealth,
            contactDamage: enemyDamage,
            color: variant?.color || config.color,
            behavior: config.behavior,
            specialCooldown: 0,
            burning: null,
            spawnedMinions: false,
            variantId: variant?.id || 'standard',
            variantShape: variant?.shape || 'circle',
            variantColor: variant?.color || null,
            variantState: {},
            orbitStrength: variant?.orbitStrength || 0,
            orbitDirection: Math.random() < 0.5 ? -1 : 1,
            zigzagStrength: variant?.zigzagStrength || 0,
            zigzagPeriod: variant?.zigzagPeriod || 0,
            burstDuration: variant?.burstDuration || 0,
            burstCooldown: variant?.burstCooldown || 0,
            burstSpeedMultiplier: variant?.burstSpeedMultiplier || 0,
            teleportDistance: variant?.teleportDistance || 80,
            teleportCooldown: variant?.teleportCooldown || 180,
            driftStrength: variant?.driftStrength || 0
        };

        // Give every enemy a small spin for visual motion
        const rotSpeed = (variant?.rotSpeed ?? config.rotSpeed) ?? 0.02;
        enemy.angle = Math.random() * Math.PI * 2;
        enemy.rotSpeed = rotSpeed * (Math.random() < 0.5 ? -1 : 1);

        this.enemies.push(enemy);

        // Show boss notification when boss is spawned
        if (config.behavior === 'boss') {
            this.showBossNotification();
        }
    }

    getBossVariantForLevel(level) {
        if (!Array.isArray(BOSS_VARIANTS) || BOSS_VARIANTS.length === 0) {
            return null;
        }
        const total = BOSS_VARIANTS.length;
        const normalized = Math.max(1, level || 1);
        const index = (normalized - 1) % total;
        return BOSS_VARIANTS[index];
    }

    getBossVariantById(variantId) {
        if (!variantId || !Array.isArray(BOSS_VARIANTS)) return null;
        return BOSS_VARIANTS.find(variant => variant.id === variantId) || null;
    }

    getBossCycle(level) {
        const variantCount = Array.isArray(BOSS_VARIANTS) ? BOSS_VARIANTS.length : 0;
        if (variantCount === 0) {
            return 0;
        }
        const normalizedLevel = Math.max(1, level || 1);
        return Math.floor((normalizedLevel - 1) / variantCount);
    }

    getBossCycleDashMultiplier(level) {
        const cycle = this.getBossCycle(level);
        // +25% dash speed per cycle beyond the first to keep later bosses threatening
        return 1 + (cycle * 0.25);
    }

    getBossProjectileLife(baseLife, boss = null) {
        const level = boss?.bossLevel || this.bossLevel || 1;
        const cycle = this.getBossCycle(level);
        const extendedBase = Math.floor(baseLife * 3); // Make missiles persist much longer before expiring
        if (cycle <= 0) {
            return extendedBase;
        }
        const multiplier = 1 + cycle * 0.25;
        return Math.floor(extendedBase * multiplier);
    }

    applyBossCycleMissileBonus(boss, attackPattern, cycleLevel) {
        if (cycleLevel <= 0) {
            return;
        }

        const ringColor = attackPattern === 'shock' ? '#00C0FF' : '#FF66FF';
        const baseAngle = (this.gameTime || 0) * 0.12;
        const rings = Math.min(2 + cycleLevel, 4);

        for (let ring = 0; ring < rings; ring++) {
            const missileCount = 6 + cycleLevel * 2 + ring * 2;
            const ringSpeed = 2.1 + 0.3 * (ring + cycleLevel);
            const ringDamage = Math.floor(14 * (1 + cycleLevel * 0.25) * (1 + ring * 0.05));

            for (let i = 0; i < missileCount; i++) {
                const angle = baseAngle + (Math.PI * 2 * i) / missileCount + ring * 0.25;
                this.projectiles.push({
                    x: boss.x,
                    y: boss.y,
                    vx: this.fastCos(angle) * ringSpeed,
                    vy: this.fastSin(angle) * ringSpeed,
                    damage: ringDamage,
                    life: this.getBossProjectileLife(240 + cycleLevel * 30, boss),
                    type: 'boss-missile',
                    color: ringColor,
                    size: 3,
                    homing: false,
                    homingStrength: 0,
                    explosionRadius: 20 + ring * 3,
                    speed: ringSpeed,
                    owner: 'enemy'
                });
            }
        }

        // Add extra homing lances aimed around the player for additional pressure
        const bonusHoming = Math.min(4 + cycleLevel, 7);
        const baseTargetAngle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x);
        const spread = 0.18 + cycleLevel * 0.03;

        for (let i = 0; i < bonusHoming; i++) {
            const offset = (i - (bonusHoming - 1) / 2) * spread;
            const dartAngle = baseTargetAngle + offset;
            const dartSpeed = 3.0 + cycleLevel * 0.45;
            this.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: this.fastCos(dartAngle) * dartSpeed,
                vy: this.fastSin(dartAngle) * dartSpeed,
                damage: Math.floor(22 * (1 + cycleLevel * 0.3)),
                life: this.getBossProjectileLife(360, boss),
                type: 'boss-missile',
                color: '#FF9CFF',
                size: 3,
                homing: true,
                homingStrength: 0.12 + cycleLevel * 0.02,
                explosionRadius: 30,
                speed: dartSpeed,
                owner: 'enemy'
            });
        }
    }

    spawnBoss(delaySeconds = this.bossSpawnDelaySeconds, distance = this.bossSpawnDistance) {
        this.queueBossSpawn('first', { delaySeconds, distance });
    }

    spawnScaledBoss(delaySeconds = this.bossSpawnDelaySeconds, distance = this.bossSpawnDistance) {
        this.queueBossSpawn('scaled', { delaySeconds, distance, bossLevel: this.bossLevel });
    }

    queueBossSpawn(type, options = {}) {
        if (this.pendingBossSpawn) {
            return;
        }

        const delaySeconds = Math.max(0, Number(options.delaySeconds ?? this.bossSpawnDelaySeconds) || 0);
        const spawnDistance = Math.max(options.distance || this.bossSpawnDistance, 250);
        const bossLevel = options.bossLevel || this.bossLevel;
        const baseVariant = options.variantId ? this.getBossVariantById(options.variantId) : this.getBossVariantForLevel(bossLevel);
        const variantId = options.variantId || baseVariant?.id || null;
        const variantConfig = variantId ? this.getBossVariantById(variantId) : baseVariant;

        if (delaySeconds === 0) {
            if (type === 'scaled') {
                this.spawnScaledBossImmediate(spawnDistance, variantConfig, bossLevel, false);
            } else {
                this.spawnBossImmediate(spawnDistance, variantConfig, false, bossLevel);
            }
            return;
        }

        this.pendingBossSpawn = {
            type,
            spawnTime: this.gameTime + delaySeconds,
            distance: spawnDistance,
            variantId,
            bossLevel
        };

        // Alert the player immediately; the boss will arrive after the delay
        this.showBossNotification(variantConfig);
    }

    spawnBossImmediate(spawnDistance, variantConfig, suppressNotification = true, bossLevel = this.bossLevel) {
        const angle = Math.random() * Math.PI * 2;
        const x = this.player.x + this.fastCos(angle) * spawnDistance;
        const y = this.player.y + this.fastSin(angle) * spawnDistance;

        const config = this.getEnemyConfig('boss');
        const scaledSpeed = config.speed;
        const sizeMultiplier = variantConfig?.sizeMultiplier || 1;
        const bossColor = variantConfig?.color || config.color;
        const baseHealth = config.health * (1 + Math.floor(this.gameTime / 30) * 0.3);
        const scaledHealth = Math.floor(baseHealth * BOSS_HEALTH_MULTIPLIER);

        this.enemies.push({
            x: x,
            y: y,
            radius: config.radius * sizeMultiplier,
            renderRadius: config.radius * sizeMultiplier,
            baseRadius: config.radius * sizeMultiplier,
            speed: scaledSpeed,
            baseSpeed: config.speed,
            maxHealth: scaledHealth,
            health: scaledHealth,
            contactDamage: config.contactDamage,
            color: bossColor,
            behavior: config.behavior,
            angle: 0,
            rotSpeed: 0.05,
            specialCooldown: 0,
            burning: null,
            spawnedMinions: false,
            lastMissileFrame: 0, // Initialize missile timing for boss attacks
            // Dash state for Phase 3 movement
            dashState: {
                active: false,
                targetX: 0,
                targetY: 0,
                duration: 0,
                maxDuration: 20, // 0.33 seconds at 60fps (reduced from 30 for easier dodging)
                originalSpeed: 0
            },
            variantId: variantConfig?.id || 'pulse_hunter',
            variantName: variantConfig?.name || 'Pulse Hunter',
            variantShape: variantConfig?.shape || 'octagon',
            variantState: {},
            missileInterval: variantConfig?.missileInterval || 200,
            bossLevel: bossLevel
        });

        this.bossSpawned = true;

        if (!suppressNotification) {
            this.showBossNotification(variantConfig);
        }
    }

    spawnScaledBossImmediate(spawnDistance, variantConfig, bossLevel = this.bossLevel, suppressNotification = true) {
        const angle = Math.random() * Math.PI * 2;
        const x = this.player.x + this.fastCos(angle) * spawnDistance;
        const y = this.player.y + this.fastSin(angle) * spawnDistance;

        const baseConfig = this.getEnemyConfig('boss');

        // Calculate scaled stats based on bosses killed
        const healthMultiplier = this.fastPow(1.4, this.bossesKilled);
        const speedMultiplier = this.fastPow(1.05, this.bossesKilled);
        const damageMultiplier = this.fastPow(1.15, this.bossesKilled);
        const sizeMultiplier = this.fastPow(1.05, this.bossesKilled);
        const variantSize = variantConfig?.sizeMultiplier || 1;

        // Use effective first boss HP baseline and boost it
        const effectiveBaseHP = 4000 * BOSS_HEALTH_MULTIPLIER;
        const scaledHealth = Math.floor(effectiveBaseHP * healthMultiplier);
        const scaledSpeed = baseConfig.speed * speedMultiplier;
        const scaledDamage = Math.floor(baseConfig.contactDamage * damageMultiplier);
        const scaledRadius = Math.floor(baseConfig.radius * sizeMultiplier * variantSize);

        this.enemies.push({
            x: x,
            y: y,
            radius: scaledRadius,
            renderRadius: scaledRadius,
            baseRadius: scaledRadius,
            speed: scaledSpeed,
            baseSpeed: scaledSpeed,
            health: scaledHealth,
            maxHealth: scaledHealth,
            contactDamage: scaledDamage,
            color: variantConfig?.color || baseConfig.color,
            behavior: baseConfig.behavior,
            specialCooldown: 0,
            burning: null,
            angle: 0,
            rotSpeed: 0.02,
            lastMissileFrame: 0,
            spawnedMinions: false,
            // Store boss level for rendering effects
            bossLevel: bossLevel,
            // Dash state for Phase 3 movement
            dashState: {
                active: false,
                targetX: 0,
                targetY: 0,
                duration: 0,
                maxDuration: 20, // 0.33 seconds at 60fps (reduced from 30 for easier dodging)
                originalSpeed: 0
            },
            variantId: variantConfig?.id || 'pulse_hunter',
            variantName: variantConfig?.name || 'Pulse Hunter',
            variantShape: variantConfig?.shape || 'octagon',
            variantState: {},
            missileInterval: variantConfig?.missileInterval || 200
        });

        this.bossSpawned = true;

        if (!suppressNotification) {
            this.showBossNotification(variantConfig);
        }
    }

    getAvailableEnemyTypes() {
        const time = this.gameTime;
        const types = ['basic'];

        if (time > 30) types.push('fast');
        if (time > 60) types.push('tank');
        if (time > 120) types.push('flyer');
        if (time > 180) types.push('phantom');
        // Boss spawning is now handled separately in spawnEnemies() method

        return types;
    }

    selectEnemyType(types) {
        const weights = {
            'basic': 0.35,
            'fast': 0.25,
            'tank': 0.15,
            'flyer': 0.15,
            'phantom': 0.05,
            'boss': 0.05  // Rare but powerful
        };

        // Weighted random selection
        const random = Math.random();
        let cumulative = 0;

        for (const type of types) {
            cumulative += weights[type] || 0;
            if (random <= cumulative) {
                return type;
            }
        }

        return types[0];
    }

    getEnemyConfig(type) {
        const configs = {
            basic: {
                radius: 10,
                health: 20,
                speed: 0.75,
                contactDamage: 10,
                color: '#ff00ff', // Neon pink
                behavior: 'chase',
                rotSpeed: 0.018
            },
            fast: {
                radius: 7,
                health: 12,
                speed: 1.85,
                contactDamage: 6,
                color: '#ffff00', // Neon yellow
                behavior: 'dodge',
                rotSpeed: 0.028
            },
            tank: {
                radius: 15,
                health: 80,
                speed: 0.5,
                contactDamage: 20,
                color: '#ff0040', // Neon red
                behavior: 'tank',
                rotSpeed: 0.05
            },
            flyer: {
                radius: 12,
                health: 25,
                speed: 1.25,
                contactDamage: 12,
                color: '#0080ff', // Neon blue
                behavior: 'fly',
                rotSpeed: 0.024
            },
            phantom: {
                radius: 9,
                health: 15,
                speed: 0.75,
                contactDamage: 2,
                color: '#74EE15', // Neon green
                behavior: 'teleport',
                rotSpeed: 0.032
            },
            boss: {
                radius: 40,
                health: 1000,
                speed: 0.75,
                contactDamage: 50,
                color: '#F000FF', // Neon purple
                behavior: 'boss',
                rotSpeed: 0.02
            }
        };

        return configs[type] || configs.basic;
    }

    getEnemyVariantPool() {
        return {
            basic: [
                { id: 'standard', shape: 'circle', weight: 1, minBosses: 0 },
                { id: 'orbiter', shape: 'triangle', color: '#00e5ff', weight: 0.9, minBosses: 1, orbitStrength: 0.45, speedMult: 1.05 },
                { id: 'spiral', shape: 'pentagon', color: '#ffa640', weight: 0.7, minBosses: 2, orbitStrength: 0.65, healthMult: 1.2, rotSpeed: 0.022 },
                { id: 'swarmling', shape: 'diamond', color: '#ff66cc', weight: 0.6, minBosses: 3, sizeMult: 0.85, speedMult: 1.25, healthMult: 0.8 }
            ],
            fast: [
                { id: 'striker', shape: 'circle', weight: 1, minBosses: 0 },
                { id: 'zigzag', shape: 'chevron', color: '#baff29', weight: 0.8, minBosses: 1, zigzagStrength: 0.55, zigzagPeriod: 26, speedMult: 1.05, healthMult: 0.95, rotSpeed: 0.03 }
            ],
            tank: [
                { id: 'bulwark', shape: 'square', weight: 1, minBosses: 0 },
                { id: 'roller', shape: 'hex', color: '#ff3366', weight: 0.7, minBosses: 1, healthMult: 1.2, speedMult: 0.85, rotSpeed: 0.07 }
            ],
            flyer: [
                { id: 'winger', shape: 'circle', weight: 1, minBosses: 0 },
                { id: 'dive-bomber', shape: 'triangle', color: '#ff7f50', weight: 0.9, minBosses: 2, burstDuration: 18, burstCooldown: 90, burstSpeedMultiplier: 2.2 }
            ],
            phantom: [
                { id: 'wisp', shape: 'circle', weight: 1, minBosses: 0 },
                { id: 'phase-walker', shape: 'star', color: '#3ef2a6', weight: 0.7, minBosses: 2, teleportDistance: 110, teleportCooldown: 140, driftStrength: 0.25, speedMult: 1.1 }
            ]
        };
    }

    selectEnemyVariant(type) {
        const pool = this.getEnemyVariantPool()[type];
        if (!pool || pool.length === 0) return null;

        const unlocked = pool.filter(variant => (variant.minBosses || 0) <= (this.bossesKilled || 0));
        if (unlocked.length === 0) {
            return pool[0];
        }

        let totalWeight = 0;
        const weights = unlocked.map(variant => {
            const growthSteps = Math.max(0, (this.bossesKilled || 0) - (variant.minBosses || 0));
            const weightGrowth = 1 + growthSteps * 0.35;
            const weight = (variant.weight || 1) * weightGrowth;
            totalWeight += weight;
            return weight;
        });

        const roll = Math.random() * totalWeight;
        let cumulative = 0;
        for (let i = 0; i < unlocked.length; i++) {
            cumulative += weights[i];
            if (roll <= cumulative) {
                return unlocked[i];
            }
        }

        return unlocked[unlocked.length - 1];
    }

    // Update enemy groupings for batch processing
    updateEnemyGroupings() {
        // Clear existing groupings
        for (const behavior in this.enemiesByBehavior) {
            this.enemiesByBehavior[behavior].length = 0;
        }

        // Re-group enemies by behavior
        for (const enemy of this.enemies) {
            if (this.enemiesByBehavior[enemy.behavior]) {
                this.enemiesByBehavior[enemy.behavior].push(enemy);
            }
        }
    }

    // Batch process enemies by behavior type for optimal performance
    processBatchedEnemies() {
        // Process each behavior type in batches
        this.processBatchChase();
        this.processBatchDodge();
        this.processBatchTank();
        this.processBatchFly();
        this.processBatchTeleport();
        this.processBatchBoss();
    }

    processBatchChase() {
        const chaseEnemies = this.enemiesByBehavior.chase;
        if (chaseEnemies.length === 0) return;

        // Pre-calculate player position for all chase enemies
        const playerX = this.player.x;
        const playerY = this.player.y;

        for (const enemy of chaseEnemies) {
            const [dirX, dirY] = Vector2.direction(enemy.x, enemy.y, playerX, playerY);
            enemy.x += dirX * enemy.speed;
            enemy.y += dirY * enemy.speed;
        }
    }

    processBatchDodge() {
        const dodgeEnemies = this.enemiesByBehavior.dodge;
        if (dodgeEnemies.length === 0) return;

        const playerX = this.player.x;
        const playerY = this.player.y;
        const dodgeRadius = 50;
        const dodgeRadiusSq = dodgeRadius * dodgeRadius;

        for (const enemy of dodgeEnemies) {
            let dodgeX = 0, dodgeY = 0;

            // Check nearby projectiles for dodge behavior
            for (const projectile of this.projectiles) {
                const pDistSq = Vector2.distanceSquared(enemy.x, enemy.y, projectile.x, projectile.y);
                if (pDistSq < dodgeRadiusSq && pDistSq > 0) {
                    const [dodgeDirX, dodgeDirY] = Vector2.direction(projectile.x, projectile.y, enemy.x, enemy.y);
                    const influence = 1 - (pDistSq / dodgeRadiusSq);
                    dodgeX += dodgeDirX * influence;
                    dodgeY += dodgeDirY * influence;
                }
            }

            // Apply movement
            const [dirX, dirY] = Vector2.direction(enemy.x, enemy.y, playerX, playerY);
            if (dodgeX !== 0 || dodgeY !== 0) {
                const [normDodgeX, normDodgeY] = Vector2.normalize(dodgeX, dodgeY);
                const [blendX, blendY] = Vector2.add(
                    normDodgeX * 0.7, normDodgeY * 0.7,
                    dirX * 0.3, dirY * 0.3
                );
                const [finalDirX, finalDirY] = Vector2.normalize(blendX, blendY);
                enemy.x += finalDirX * enemy.speed;
                enemy.y += finalDirY * enemy.speed;
            } else {
                enemy.x += dirX * enemy.speed;
                enemy.y += dirY * enemy.speed;
            }
        }
    }

    processBatchTank() {
        const tankEnemies = this.enemiesByBehavior.tank;
        if (tankEnemies.length === 0) return;

        const playerX = this.player.x;
        const playerY = this.player.y;

        for (const enemy of tankEnemies) {
            const [dirX, dirY] = Vector2.direction(enemy.x, enemy.y, playerX, playerY);
            enemy.x += dirX * enemy.speed;
            enemy.y += dirY * enemy.speed;

            // Check for minion spawning
            if (enemy.health < enemy.maxHealth * 0.25 && !enemy.spawnedMinions) {
                this.spawnMinions(enemy.x, enemy.y, 3);
                enemy.spawnedMinions = true;
            }
        }
    }

    processBatchFly() {
        const flyEnemies = this.enemiesByBehavior.fly;
        if (flyEnemies.length === 0) return;

        const playerX = this.player.x;
        const playerY = this.player.y;
        const orbitRadius = 100;
        const orbitRadiusSq = orbitRadius * orbitRadius;

        for (const enemy of flyEnemies) {
            const [dirX, dirY] = Vector2.direction(enemy.x, enemy.y, playerX, playerY);
            const distanceSquared = Vector2.distanceSquared(enemy.x, enemy.y, playerX, playerY);

            if (distanceSquared > orbitRadiusSq) {
                // Move towards player when far
                enemy.x += dirX * enemy.speed;
                enemy.y += dirY * enemy.speed;
            } else {
                // Orbital movement when close
                const [orbitX, orbitY] = Vector2.rotate(dirX, dirY, Math.PI / 2);
                enemy.x += orbitX * enemy.speed;
                enemy.y += orbitY * enemy.speed;
            }
        }
    }

    processBatchTeleport() {
        const teleportEnemies = this.enemiesByBehavior.teleport;
        if (teleportEnemies.length === 0) return;

        const playerX = this.player.x;
        const playerY = this.player.y;
        const teleportRange = 50;
        const teleportRangeSq = teleportRange * teleportRange;

        for (const enemy of teleportEnemies) {
            const distanceSquared = Vector2.distanceSquared(enemy.x, enemy.y, playerX, playerY);

            if (enemy.specialCooldown <= 0 && distanceSquared > teleportRangeSq) {
                this.createTeleportParticles(enemy.x, enemy.y);
                const teleportDistance = 80;
                const angle = Math.random() * Math.PI * 2;
                const [teleportX, teleportY] = Vector2.rotate(teleportDistance, 0, angle);
                enemy.x = playerX + teleportX;
                enemy.y = playerY + teleportY;
                this.createTeleportParticles(enemy.x, enemy.y);
                enemy.specialCooldown = 180;
            } else {
                const [dirX, dirY] = Vector2.direction(enemy.x, enemy.y, playerX, playerY);
                enemy.x += dirX * enemy.speed * 0.5;
                enemy.y += dirY * enemy.speed * 0.5;
            }
        }
    }


    processBatchBoss() {
        const bossEnemies = this.enemiesByBehavior.boss;
        if (bossEnemies.length === 0) return;

        const playerX = this.player.x;
        const playerY = this.player.y;

        for (const enemy of bossEnemies) {
            if (enemy.health <= 0) {
                continue;
            }

            const variantConfig = this.getBossVariantById(enemy.variantId) || this.getBossVariantForLevel(enemy.bossLevel || 1) || {};
            const bossHealthPercent = enemy.health / enemy.maxHealth;
            const [dirX, dirY] = Vector2.direction(enemy.x, enemy.y, playerX, playerY);
            const distanceSquared = Vector2.distanceSquared(enemy.x, enemy.y, playerX, playerY);
            const distance = this.cachedSqrt(distanceSquared);

            this.handleBossTeleport(enemy, distance, playerX, playerY);

            const missileInterval = enemy.missileInterval || variantConfig.missileInterval || 200;
            if (this.frameCount - (enemy.lastMissileFrame || 0) >= missileInterval) {
                this.createBossMissile(enemy, bossHealthPercent);
                enemy.lastMissileFrame = this.frameCount;
            }

            switch (variantConfig.behavior) {
                case 'shock':
                    this.updateShockSentinelMovement(enemy, dirX, dirY, distance, playerX, playerY);
                    break;
                case 'rift':
                    this.updateRiftReaverMovement(enemy, dirX, dirY, playerX, playerY);
                    break;
                case 'carrier':
                    this.updateNightfallCarrierMovement(enemy, dirX, dirY, distance, playerX, playerY);
                    break;
                case 'titan':
                    this.updateSingularityTitanMovement(enemy, dirX, dirY, distance, playerX, playerY);
                    break;
                case 'solar':
                    this.updateSolarWardenMovement(enemy, dirX, dirY, distance, playerX, playerY);
                    break;
                case 'prism':
                    this.updatePrismSeraphMovement(enemy, dirX, dirY, playerX, playerY);
                    break;
                case 'vortex':
                    this.updateVortexSpectreMovement(enemy, dirX, dirY, distance, playerX, playerY);
                    break;
                case 'reaper':
                    this.updateCrimsonReaperMovement(enemy, dirX, dirY, distance, playerX, playerY);
                    break;
                case 'colossus':
                    this.updateFrostColossusMovement(enemy, dirX, dirY, distance);
                    break;
                default:
                    this.updatePulseHunterMovement(enemy, dirX, dirY, distance, bossHealthPercent, playerX, playerY);
                    break;
            }
        }
    }

    handleBossTeleport(enemy, distance, playerX, playerY) {
        const maxBossDistance = 800;
        if (distance <= maxBossDistance) return;

        for (let i = 0; i < 8; i++) {
            this.createHitParticles(enemy.x, enemy.y, '#FF0066');
        }

        const [teleportDirX, teleportDirY] = Vector2.direction(playerX, playerY, enemy.x, enemy.y);
        const teleportDistance = 400 + Math.random() * 100;
        enemy.x = playerX + teleportDirX * teleportDistance;
        enemy.y = playerY + teleportDirY * teleportDistance;

        for (let i = 0; i < 8; i++) {
            this.createHitParticles(enemy.x, enemy.y, '#FF0066');
        }

        this.cameraShake = Math.max(this.cameraShake || 0, 15);
    }

    updatePulseHunterMovement(enemy, dirX, dirY, distance, bossHealthPercent, playerX, playerY) {
        const dashMultiplier = this.getBossCycleDashMultiplier(enemy.bossLevel || this.bossLevel || 1);
        if (bossHealthPercent > 0.7) {
            enemy.x += dirX * enemy.speed * 1.5;
            enemy.y += dirY * enemy.speed * 1.5;
        } else if (bossHealthPercent > 0.3) {
            enemy.x += dirX * enemy.speed * 1.8;
            enemy.y += dirY * enemy.speed * 1.8;
        } else {
            if (!enemy.dashState.active) {
                if (enemy.specialCooldown <= 0) {
                    enemy.dashState.active = true;
                    enemy.dashState.targetX = playerX;
                    enemy.dashState.targetY = playerY;
                    enemy.dashState.duration = 0;
                    enemy.dashState.originalSpeed = enemy.speed;
                    // Decrease dash cooldown by 3 per boss stage (first cycle only), capped at boss 6, minimum 90 frames
                    const baseCooldown = 108; // Increased from 90 for more breathing room
                    const maxBossScaling = 5; // Cap reduction at boss 6 (after 5 bosses defeated)
                    const cycle = this.getBossCycle(enemy.bossLevel || this.bossLevel || 1);
                    const effectiveBossScaling = cycle === 0 ? Math.min(this.bossesKilled || 0, maxBossScaling) : 0;
                    const cooldownReduction = effectiveBossScaling * 3;
                    const minCooldown = 90; // 1.5 seconds minimum (was 72 = 1.2s)
                    enemy.specialCooldown = Math.max(minCooldown, baseCooldown - cooldownReduction);
                } else {
                    enemy.x += dirX * enemy.speed * 2.0;
                    enemy.y += dirY * enemy.speed * 2.0;
                }
            } else {
                const [dashDirX, dashDirY] = Vector2.direction(enemy.x, enemy.y, enemy.dashState.targetX, enemy.dashState.targetY);
                const dashSpeed = enemy.speed * 6 * dashMultiplier; // Later cycles dash harder
                enemy.x += dashDirX * dashSpeed;
                enemy.y += dashDirY * dashSpeed;
                enemy.dashState.duration++;
                const distToTarget = Vector2.distanceSquared(enemy.x, enemy.y, enemy.dashState.targetX, enemy.dashState.targetY);
                if (enemy.dashState.duration >= enemy.dashState.maxDuration || distToTarget < 100) {
                    enemy.dashState.active = false;
                    enemy.dashState.duration = 0;
                }
            }
        }
    }

    updateShockSentinelMovement(enemy, dirX, dirY, distance, playerX, playerY) {
        enemy.variantState = enemy.variantState || {};
        const state = enemy.variantState;
        const desiredDistance = 280;
        const distanceDelta = distance - desiredDistance;

        if (Math.abs(distanceDelta) > 35) {
            const towardsPlayer = distanceDelta > 0 ? 1 : -1;
            enemy.x += dirX * enemy.speed * 1.2 * towardsPlayer;
            enemy.y += dirY * enemy.speed * 1.2 * towardsPlayer;
        }

        if (!state.orbitDir) state.orbitDir = 1;
        state.switchTimer = (state.switchTimer || 240) - 1;
        if (state.switchTimer <= 0) {
            state.orbitDir *= -1;
            state.switchTimer = 240;
        }

        const perpendicularX = -dirY;
        const perpendicularY = dirX;
        enemy.x += perpendicularX * enemy.speed * 1.5 * state.orbitDir;
        enemy.y += perpendicularY * enemy.speed * 1.5 * state.orbitDir;

    }

    updateRiftReaverMovement(enemy, dirX, dirY, playerX, playerY) {
        enemy.variantState = enemy.variantState || {};
        const dashState = enemy.dashState || (enemy.dashState = {
            active: false,
            targetX: 0,
            targetY: 0,
            duration: 0,
            maxDuration: 22, // 0.37 seconds at 60fps (balanced for challenge)
            originalSpeed: enemy.speed
        });

        // Cap scaling at boss 6, minimum 60 frames (1.0s) for dodge-able patterns (first cycle only)
        const maxBossScaling = 5; // Cap reduction at boss 6
        const cycle = this.getBossCycle(enemy.bossLevel || this.bossLevel || 1);
        const effectiveBossScaling = cycle === 0 ? Math.min(this.bossesKilled || 0, maxBossScaling) : 0;
        const cooldown = Math.max(60, 85 - effectiveBossScaling * 5);
        const dashMultiplier = this.getBossCycleDashMultiplier(enemy.bossLevel || this.bossLevel || 1);

        if (!dashState.active) {
            if (enemy.specialCooldown <= 0) {
                dashState.active = true;
                dashState.targetX = playerX + (Math.random() - 0.5) * 140;
                dashState.targetY = playerY + (Math.random() - 0.5) * 140;
                dashState.duration = 0;
                enemy.specialCooldown = cooldown;
            } else {
                enemy.x += dirX * enemy.speed * 1.3;
                enemy.y += dirY * enemy.speed * 1.3;
            }
        } else {
            const [dashDirX, dashDirY] = Vector2.direction(enemy.x, enemy.y, dashState.targetX, dashState.targetY);
            const dashSpeed = enemy.speed * 6.5 * dashMultiplier; // Later cycles slam much faster
            enemy.x += dashDirX * dashSpeed;
            enemy.y += dashDirY * dashSpeed;
            dashState.duration++;
            const distToTarget = Vector2.distanceSquared(enemy.x, enemy.y, dashState.targetX, dashState.targetY);
            if (dashState.duration >= dashState.maxDuration || distToTarget < 80) {
                dashState.active = false;
                dashState.duration = 0;
            }
        }
    }

    updateNightfallCarrierMovement(enemy, dirX, dirY, distance, playerX, playerY) {
        enemy.variantState = enemy.variantState || {};
        const state = enemy.variantState;
        const desiredDistance = 340;
        const delta = distance - desiredDistance;

        if (Math.abs(delta) > 25) {
            const approach = delta > 0 ? 1 : -1;
            enemy.x += dirX * enemy.speed * 0.9 * approach;
            enemy.y += dirY * enemy.speed * 0.9 * approach;
        }

        state.driftPhase = (state.driftPhase || 0) + 0.03;
        const drift = Math.sin(state.driftPhase);
        enemy.x += (-dirY) * enemy.speed * 0.4 * drift;
        enemy.y += dirX * enemy.speed * 0.4 * drift;

        state.minionCooldown = (state.minionCooldown || 240) - 1;
        if (state.minionCooldown <= 0) {
            this.spawnMinions(enemy.x, enemy.y, 3 + Math.min(3, this.bossesKilled || 0));
            state.minionCooldown = 300;
        }
    }

    updateSingularityTitanMovement(enemy, dirX, dirY, distance, playerX, playerY) {
        enemy.variantState = enemy.variantState || {};
        const state = enemy.variantState;

        state.anchorTimer = (state.anchorTimer || 360) - 1;
        if (state.anchorTimer <= 0) {
            state.anchorTimer = 360;
            state.charging = true;
            state.chargeDuration = 60;
            this.createHitParticles(enemy.x, enemy.y, '#FFE34D');
        }

        if (state.charging) {
            state.chargeDuration--;
            if (state.chargeDuration <= 0) {
                state.charging = false;
            }
            return;
        }

        enemy.x += dirX * enemy.speed;
        enemy.y += dirY * enemy.speed;

        state.rumbleTimer = (state.rumbleTimer || 240) - 1;
        if (state.rumbleTimer <= 0) {
            state.rumbleTimer = 240;
            this.createHitParticles(enemy.x, enemy.y, '#FFE34D');
        }
    }

    updateSolarWardenMovement(enemy, dirX, dirY, distance, playerX, playerY) {
        enemy.variantState = enemy.variantState || {};
        const state = enemy.variantState;
        const desiredDistance = 260;
        const delta = distance - desiredDistance;

        if (Math.abs(delta) > 20) {
            const approach = delta > 0 ? 1 : -1;
            enemy.x += dirX * enemy.speed * 0.85 * approach;
            enemy.y += dirY * enemy.speed * 0.85 * approach;
        }

        state.orbitPhase = (state.orbitPhase || 0) + 0.035;
        enemy.x += this.fastCos(state.orbitPhase) * enemy.speed * 0.8;
        enemy.y += this.fastSin(state.orbitPhase) * enemy.speed * 0.8;

        state.flarePulse = (state.flarePulse || 0) + 0.08;
        const pulse = 1 + Math.sin(state.flarePulse) * 0.15;
        enemy.renderRadius = (enemy.baseRadius || enemy.radius || 40) * pulse;
    }

    updatePrismSeraphMovement(enemy, dirX, dirY, playerX, playerY) {
        enemy.variantState = enemy.variantState || {};
        const state = enemy.variantState;
        state.targetTimer = (state.targetTimer || 0) - 1;

        if (!state.target || state.targetTimer <= 0) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 220 + Math.random() * 120;
            state.target = {
                x: playerX + this.fastCos(angle) * distance,
                y: playerY + this.fastSin(angle) * distance
            };
            state.targetTimer = 90;
        }

        const [moveX, moveY] = Vector2.direction(enemy.x, enemy.y, state.target.x, state.target.y);
        enemy.x += moveX * enemy.speed * 2.1;
        enemy.y += moveY * enemy.speed * 2.1;

        if (Vector2.distanceSquared(enemy.x, enemy.y, state.target.x, state.target.y) < 1600) {
            state.targetTimer = 0;
        }

        enemy.angle = (enemy.angle || 0) + 0.12;
    }

    updateVortexSpectreMovement(enemy, dirX, dirY, distance, playerX, playerY) {
        enemy.variantState = enemy.variantState || {};
        const state = enemy.variantState;

        // Orbital movement with pulsing distance - no teleporting
        state.orbitPhase = (state.orbitPhase || 0) + 0.025;

        // Initialize orbit direction if not set
        if (state.orbitDir === undefined) {
            state.orbitDir = Math.random() < 0.5 ? 1 : -1;
        }

        // Target distance oscillates between 250-350 units
        const baseDistance = 300;
        const pulseDistance = Math.sin(state.orbitPhase * 2) * 50;
        const desiredDistance = baseDistance + pulseDistance;

        const distanceDelta = distance - desiredDistance;

        // Move toward or away to maintain desired distance
        if (Math.abs(distanceDelta) > 40) {
            const towardsPlayer = distanceDelta > 0 ? 1 : -1;
            enemy.x += dirX * enemy.speed * 1.2 * towardsPlayer;
            enemy.y += dirY * enemy.speed * 1.2 * towardsPlayer;
        }

        // Add perpendicular movement for orbiting
        const perpendicularX = -dirY * state.orbitDir;
        const perpendicularY = dirX * state.orbitDir;
        enemy.x += perpendicularX * enemy.speed * 1.4;
        enemy.y += perpendicularY * enemy.speed * 1.4;

        enemy.angle = (enemy.angle || 0) + 0.08;
    }

    updateCrimsonReaperMovement(enemy, dirX, dirY, distance, playerX, playerY) {
        enemy.variantState = enemy.variantState || {};
        const state = enemy.variantState;

        // Figure-8 movement pattern around player
        state.figureEightPhase = (state.figureEightPhase || 0) + 0.03;

        const desiredDistance = 300;
        const figureEightX = Math.sin(state.figureEightPhase) * desiredDistance;
        const figureEightY = Math.sin(state.figureEightPhase * 2) * desiredDistance * 0.5;

        const targetX = playerX + figureEightX;
        const targetY = playerY + figureEightY;

        const [moveX, moveY] = Vector2.direction(enemy.x, enemy.y, targetX, targetY);
        enemy.x += moveX * enemy.speed * 1.6;
        enemy.y += moveY * enemy.speed * 1.6;

        // Rotate to face movement direction
        enemy.angle = Math.atan2(moveY, moveX) + Math.PI / 2;
    }

    updateFrostColossusMovement(enemy, dirX, dirY, distance) {
        // Very slow, relentless chase - the "tank" of bosses
        const moveSpeed = enemy.speed * 0.8;
        enemy.x += dirX * moveSpeed;
        enemy.y += dirY * moveSpeed;

        // Slow rotation for intimidating presence
        enemy.angle = (enemy.angle || 0) + 0.015;
    }

    updateEnemies() {
        // Delegate to EnemySystem
        this.enemySystem.updateEnemies({
            enemies: this.enemies,
            frameCount: this.frameCount,
            player: this.player,
            bossDefeating: this.bossDefeating,
            updateEnemyGroupings: () => this.updateEnemyGroupings(),
            processBatchedEnemies: () => this.processBatchedEnemies(),
            createXPOrb: (x, y) => this.createXPOrb(x, y),
            createDeathParticles: (x, y, color) => this.createDeathParticles(x, y, color),
            createHitParticles: (x, y, color) => this.createHitParticles(x, y, color),
            recordWeaponDamage: (type, damage, enemy) => this.recordWeaponDamage(type, damage, enemy),
            createBossDefeatAnimation: (x, y, radius) => this.createBossDefeatAnimation(x, y, radius),
            setBossDefeating: (value) => { this.bossDefeating = value; },
            clearProjectiles: () => { this.projectiles.length = 0; },
            bossDefeated: () => this.bossDefeated(),
            audioManager: this.audioManager,
            cachedSqrt: this.cachedSqrt
        });
    }

    spawnMinions(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            this.enemies.push({
                x: x + this.fastCos(angle) * 30,
                y: y + this.fastSin(angle) * 30,
                radius: 6,
                speed: 1.5,
                maxHealth: 8,
                health: 8,
                contactDamage: 5,
                color: '#7F8C8D',
                behavior: 'chase',
                specialCooldown: 0,
                burning: null,
                spawnedMinions: false,
                angle: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() < 0.5 ? -1 : 1) * 0.04
            });
        }
    }

    updateProjectiles() {
        // Phase 12b integration - Delegate to ProjectileSystem
        this.projectileSystem.updateProjectiles(this.projectiles, {
            player: this.player,
            enemies: this.enemies,
            cachedSqrt: this.cachedSqrt,
            findNearestEnemy: (x, y, range) => this.findNearestEnemy(x, y, range),
            createExplosion: (x, y, radius, damage, sourceType) => this.createExplosion(x, y, radius, damage, sourceType)
        });
    }

    updateParticles() {
        // Delegated to ParticleSystem (called from update())
        // This method kept for backward compatibility but does nothing
    }

    updateXPOrbs() {
        // Delegate to PickupSystem
        this.pickupSystem.updateXPOrbs(this.xpOrbs, this.player, this.cachedSqrt, this.bossDefeating);
    }

    updateHPOrbs() {
        // Delegate to PickupSystem
        this.pickupSystem.updateHPOrbs(
            this.hpOrbs,
            this.player,
            this.cachedSqrt,
            (message, type) => this.showToastNotification(message, type),
            this.bossDefeating,
            this.audioManager
        );
    }

    updateMagnetOrbs() {
        // Delegate to PickupSystem
        this.pickupSystem.updateMagnetOrbs(
            this.magnetOrbs,
            this.player,
            this.cachedSqrt,
            (message, type) => this.showToastNotification(message, type),
            this.bossDefeating,
            this.audioManager
        );
    }

    createXPOrb(x, y) {
        const orb = this.getPooledXPOrb();
        if (orb) {
            orb.x = x;
            orb.y = y;
            orb.value = 1;
            this.xpOrbs.push(orb);
        }
    }

    spawnHPOrbs() {
        // Delegate to PickupSystem
        const shouldCreate = this.pickupSystem.spawnHPOrbs(
            this.hpOrbs,
            this.playerDead,
            this.isPaused,
            this.bossDefeating
        );

        if (shouldCreate) {
            this.createHPOrb();
        }
    }

    createHPOrb() {
        const orb = this.getPooledHPOrb();
        if (orb) {
            // Spawn at random location within reasonable distance from player
            const angle = Math.random() * Math.PI * 2;
            const minDistance = 300;
            const maxDistance = 800;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);

            orb.x = this.player.x + Math.cos(angle) * distance;
            orb.y = this.player.y + Math.sin(angle) * distance;
            orb.healAmount = 30;
            this.hpOrbs.push(orb);
        }
    }

    spawnMagnetOrbs() {
        // Delegate to PickupSystem
        const shouldCreate = this.pickupSystem.spawnMagnetOrbs(
            this.magnetOrbs,
            this.playerDead,
            this.isPaused,
            this.bossDefeating
        );

        if (shouldCreate) {
            this.createMagnetOrb();
        }
    }

    createMagnetOrb() {
        const orb = this.getPooledMagnetOrb();

        if (orb) {
            // Spawn at random location within reasonable distance from player (same as HP orbs)
            const angle = Math.random() * Math.PI * 2;
            const minDistance = 300;
            const maxDistance = 800;
            const distance = minDistance + Math.random() * (maxDistance - minDistance);

            orb.x = this.player.x + Math.cos(angle) * distance;
            orb.y = this.player.y + Math.sin(angle) * distance;
            orb.attractionRange = 1000;
            this.magnetOrbs.push(orb);
            // Magnet orb created successfully
        }
    }

    spawnChestOrbs() {
        // Delegate to PickupSystem
        const shouldCreate = this.pickupSystem.spawnChestOrbs(
            this.chestOrbs,
            this.playerDead,
            this.isPaused,
            this.bossDefeating
        );

        if (shouldCreate) {
            this.createChestOrb();
        }
    }

    createChestOrb() {
        // Delegate to PickupSystem to create chest orb
        const orb = this.pickupSystem.createChestOrb(
            this.chestOrbs,
            this.player,
            () => this.getPooledChestOrb(),
            (angle) => Math.cos(angle),
            (angle) => Math.sin(angle)
        );

        if (orb) {
            // Trigger spawn notification and effects
            this.showChestSpawnNotification();
            this.audioManager.playSound('upgradeBox');
            this.createChestSpawnParticles(orb.x, orb.y);
        }
    }

    updateChestOrbs() {
        // Delegate to PickupSystem
        this.pickupSystem.updateChestOrbs(
            this.chestOrbs,
            this.player,
            this.cachedSqrt,
            (orb) => this.onChestCollected(orb),
            this.bossDefeating
        );
    }

    onChestCollected(orb) {
        // Play collection sound and effects
        this.audioManager.playSound('upgradeBox');
        this.createChestCollectionParticles(orb.x, orb.y);

        // Increment chest stats
        if (this.player.chestsCollected !== undefined) {
            this.player.chestsCollected++;
        } else {
            this.player.chestsCollected = 1;
        }

        // Show chest modal with passive upgrades
        this.showChestModal();
    }

    showChestModal() {
        if (!this.modals.chest) return;

        // Pause game (same as level-up modal)
        this.gameRunning = false;
        this.timePaused = true;

        // Generate 3 passive upgrade choices using UpgradeSystem
        const passiveChoices = this.upgradeSystem.getUpgradeChoices(
            this.weapons,
            this.player.passives,
            3,
            'passives'
        );

        // Show modal with choices
        this.modals.chest.show(passiveChoices);
    }

    updateNotifications() {
        // Legacy notification system has been replaced with DOM-based toast notifications
        // This method is kept for compatibility but notifications array is no longer used
        this.notifications = [];
    }

    checkLevelUp() {
        // Delegate to PlayerSystem
        const wasDeferred = this.playerSystem.checkLevelUp(
            this.player,
            this.bossDefeating,
            this.bossVictoryInProgress,
            () => this.showLevelUpChoices()
        );

        if (wasDeferred) {
            this.pendingLevelUps++;
        }
    }

    // Process deferred level ups after victory screen or other interruptions
    processPendingLevelUps() {
        // Delegate to PlayerSystem
        const result = this.playerSystem.processPendingLevelUps(
            this.pendingLevelUps,
            this.bossVictoryInProgress,
            this.bossDefeating,
            () => this.showLevelUpChoices()
        );

        // Update pending level ups count
        this.pendingLevelUps = result.pendingLevelUps;
    }

    showLevelUpChoices() {
        // Phase 12c integration - Use LevelUpModal class (Option B: Proper Encapsulation)
        this.gameRunning = false;
        this.timePaused = true;  // Pause time during weapon upgrade menu

        // Generate upgrade choices
        const choices = this.generateUpgradeChoices();

        // Update modal with choices
        this.modals.levelUp.update({
            choices: choices,
            playerLevel: this.player.level
        });

        // Show the modal (modal handles all keyboard interaction, tab switching, and scrolling internally)
        this.modals.levelUp.show();
    }

    getMaxWeapons() {
        return this.maxWeaponSlots || WEAPON_UPGRADES.MAX_WEAPONS;
    }

    generateUpgradeChoices() {
        const choices = [];

        // Weapon upgrades for existing weapons
        this.weapons.forEach((weapon, index) => {
            if (weapon.level < 10) {
                let description = `+${Math.floor(weapon.damage * 0.3)} ${this.t('damageFireRate')}`;

                // Add projectile count info for level 2+ upgrades
                if (weapon.level === 1) {
                    description += `, ${this.t('addProjectile')}`;
                } else if (weapon.level >= 2 && weapon.level < 5) {
                    description += `, ${this.t('addProjectile')}`;
                }

                // Determine what type the weapon will be after upgrade
                let upgradeType = weapon.type;
                if (weapon.level + 1 === 5 && weapon.type === 'basic') {
                    upgradeType = 'rapid';
                } else if (weapon.level + 1 === 8 && weapon.type === 'spread_shot') {
                    upgradeType = 'spread';
                }

                choices.push({
                    type: 'weapon_upgrade',
                    weaponIndex: index,
                    weaponType: upgradeType,
                    name: `${this.getWeaponNameAfterUpgrade(weapon)} LV.${weapon.level + 1}`,
                    description: description,
                    icon: this.getWeaponIcon(upgradeType),
                    isMergeWeapon: weapon.isMergeWeapon || false
                });
            }
        });

        // New weapons (if not at max weapons)
        if (this.weapons.length < this.getMaxWeapons()) {
            const availableWeapons = ['spread', 'laser', 'plasma', 'shotgun', 'lightning', 'flamethrower', 'railgun', 'missiles'];
            const currentTypes = this.weapons.map(w => w.type);

            availableWeapons.forEach(weaponType => {
                if (!currentTypes.includes(weaponType)) {
                    choices.push({
                        type: 'new_weapon',
                        weaponType: weaponType,
                        name: this.getWeaponName(weaponType),
                        description: this.getWeaponDescription(weaponType),
                        icon: this.getWeaponIcon(weaponType)
                    });
                }
            });
        }

        // NOTE: Passive abilities removed - now only available from upgrade chests
        // Chest system provides passive upgrades separately from level-up

        // Return 3-4 random choices (weapons only)
        const shuffled = choices.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(3, shuffled.length));
    }

    getWeaponName(type) {
        const weaponNameMap = {
            'basic': 'basicMissile',
            'rapid': 'rapidFire',
            'spread': 'spreadShot',
            'spread_shot': 'spreadShot',
            'laser': 'laserBeam',
            'plasma': 'plasmaBolt',
            'shotgun': 'shotgun',
            'lightning': 'lightning',
            'flamethrower': 'flamethrower',
            'railgun': 'railgun',
            'missiles': 'homingMissiles',
            'homing_laser': 'homingLaser',
            'shockburst': 'shockburst',
            'gatling_gun': 'gatlingGun'
        };

        const nameKey = weaponNameMap[type];
        return nameKey ? this.t(nameKey, 'weapons') : 'Unknown Weapon';
    }

    getWeaponNameAfterUpgrade(weapon) {
        let type = weapon.type;
        let level = weapon.level + 1;

        // Check if weapon type will change after upgrade
        if (level === 5 && type === 'basic') {
            type = 'rapid';
        } else if (level === 8 && type === 'spread_shot') {
            type = 'spread';
        }

        return this.getWeaponName(type);
    }

    getWeaponDescription(type) {
        const descKey = type + 'Desc';
        return this.t(descKey, 'weapons') || 'Unknown weapon type';
    }

    getWeaponIcon(type) {
        const weaponIconMap = {
            'basic': 'basicMissile',
            'rapid': 'rapidFire',
            'spread': 'spreadShot',
            'spread_shot': 'spreadShot',
            'laser': 'laserBeam',
            'plasma': 'plasmaBolt',
            'shotgun': 'shotgun',
            'lightning': 'lightning',
            'flamethrower': 'flamethrower',
            'railgun': 'railgun',
            'missiles': 'homingMissiles',
            'homing_laser': 'homingLaser',
            'shockburst': 'shockburst',
            'gatling_gun': 'gatlingGun'
        };

        const iconName = weaponIconMap[type] || 'basicMissile';
        return `<img src="images/weapons/${iconName}.png" alt="${type}" style="width: 48px; height: 48px; image-rendering: pixelated; vertical-align: middle; margin-right: 8px;">`;
    }

    ensureWeaponStats(type) {
        if (!type) return null;
        if (!this.weaponStats[type]) {
            this.weaponStats[type] = { total: 0, enemies: 0, bosses: 0 };
        }
        return this.weaponStats[type];
    }

    recordWeaponDamage(sourceType, amount, enemy = null) {
        if (!sourceType) return;
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return;
        const stats = this.ensureWeaponStats(sourceType);
        if (!stats) return;
        stats.total += amount;
        if (enemy && enemy.behavior === 'boss') {
            stats.bosses += amount;
        } else {
            stats.enemies += amount;
        }
    }

    getWeaponDamageStats(type) {
        const stats = this.weaponStats[type];
        if (!stats) {
            return { total: 0, enemies: 0, bosses: 0 };
        }
        return stats;
    }

    getWeaponIconForHeader(type) {
        const weaponIconMap = {
            'basic': 'basicMissile',
            'rapid': 'rapidFire',
            'spread': 'spreadShot',
            'spread_shot': 'spreadShot',
            'laser': 'laserBeam',
            'plasma': 'plasmaBolt',
            'shotgun': 'shotgun',
            'lightning': 'lightning',
            'flamethrower': 'flamethrower',
            'railgun': 'railgun',
            'missiles': 'homingMissiles',
            'homing_laser': 'homingLaser',
            'shockburst': 'shockburst',
            'gatling_gun': 'gatlingGun'
        };

        const iconName = weaponIconMap[type] || 'basicMissile';
        return `images/weapons/${iconName}.png`;
    }

    getPassiveIconForHeader(passiveId) {
        const passiveIconMap = {
            'health_boost': 'healthBoost',
            'speed_boost': 'speedBoost',
            'regeneration': 'regeneration',
            'magnet': 'magnet',
            'armor': 'armor',
            'critical': 'criticalStrike',
            'dash_boost': 'dashBoost',
            'turbo_flux_cycler': 'weaponFirerate',
            'aegis_impact_core': 'weaponPower',
            'splitstream_matrix': 'weaponProjectile',
            'macro_charge_amplifier': 'weaponSize',
            'mod_bay_expander': 'weaponSlot'
        };

        const iconName = passiveIconMap[passiveId] || 'upgrade';
        return `images/passives/${iconName}.png`;
    }

    getPassiveIcon(passiveId) {
        const passiveIconMap = {
            'health_boost': 'healthBoost',
            'speed_boost': 'speedBoost',
            'regeneration': 'regeneration',
            'magnet': 'magnet',
            'armor': 'armor',
            'critical': 'criticalStrike',
            'dash_boost': 'dashBoost',
            'turbo_flux_cycler': 'weaponFirerate',
            'aegis_impact_core': 'weaponPower',
            'splitstream_matrix': 'weaponProjectile',
            'macro_charge_amplifier': 'weaponSize',
            'mod_bay_expander': 'weaponSlot'
        };

        const iconName = passiveIconMap[passiveId] || 'upgrade';
        return `<img src="images/passives/${iconName}.png" alt="${passiveId}" style="width: 48px; height: 48px; vertical-align: middle;">`;
    }

    addMenuNavigationStyles() {
        // Add CSS styles for keyboard navigation if not already added
        if (document.getElementById('menu-navigation-styles')) return;

        const style = document.createElement('style');
        style.id = 'menu-navigation-styles';
        style.textContent = `
            .menu-selected {
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
                border: 2px solid #00ffff !important;
                background: rgba(0, 255, 255, 0.1) !important;
                transition: all 0.2s ease !important;
            }
            
            .upgrade-choice.menu-selected {
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.4) !important;
                border: 2px solid #FFFFFF !important;
                background: rgba(0, 255, 255, 0.15) !important;
            }

            .upgrade-choice-merge.menu-selected {
                box-shadow: 0 0 25px rgba(255, 215, 0, 0.6) !important;
                border: 2px solid #FFD700 !important;
                background: rgba(255, 215, 0, 0.3) !important;
            }

            .upgrade-choice-merge.menu-selected h3 {
                color: #FFD700 !important;
                text-shadow: 0 0 12px rgba(255, 215, 0, 1) !important;
            }

            #overlay-retry-btn.menu-selected,
            #overlay-exit-btn.menu-selected {
                background: rgba(0, 255, 255, 0.2) !important;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
                border-color: #00ffff !important;
                color: #00ffff !important;
                transform: scale(1.1) !important;
            }
            
            #resume-btn.menu-selected,
            #exit-to-menu-btn.menu-selected {
                background: rgba(0, 255, 255, 0.2) !important;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
                border-color: #00ffff !important;
                transform: scale(1.05) !important;
            }
            
            #start-survivor.menu-selected,
            #restart-survivor.menu-selected,
            #exit-survivor.menu-selected {
                background: rgba(0, 255, 255, 0.2) !important;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
                border-color: #00ffff !important;
                transform: scale(1.05) !important;
            }
            
            #victory-continue-btn.menu-selected,
            #victory-retry-btn.menu-selected,
            #victory-exit-btn.menu-selected {
                background: rgba(0, 255, 255, 0.2) !important;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
                border-color: #00ffff !important;
                transform: scale(1.05) !important;
            }
        `;
        document.head.appendChild(style);
    }


    addGameOverModalStyles() {
        // Phase 12c - Add CSS styles for game-over modal
        if (document.getElementById('gameover-modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'gameover-modal-styles';
        style.textContent = `
            /* Game Over Modal Styles */
            .survivor-game-over-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
                align-items: center;
                justify-content: center;
                z-index: 14000;
                backdrop-filter: blur(5px);
                touch-action: auto !important;
            }

            /* When visible, use flex layout for centering */
            .survivor-game-over-overlay[style*="display: block"],
            .survivor-game-over-overlay[style*="display: flex"] {
                display: flex !important;
            }

            .survivor-game-over-content {
                background: linear-gradient(135deg, #0a0a1a, #1a0a2a) !important;
                border: 2px solid #00ffff !important;
                border-radius: 15px !important;
                padding: 30px !important;
                text-align: center !important;
                color: white !important;
                max-width: 550px !important;
                min-width: 400px !important;
                max-height: 80vh !important;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.5) !important;
                touch-action: auto !important;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif !important;
                display: flex !important;
                flex-direction: column !important;
            }

            .gameover-title {
                color: #ff0066 !important;
                font-size: 36px !important;
                font-weight: bold !important;
                margin-bottom: 20px !important;
                text-shadow: 0 0 15px rgba(255, 0, 102, 0.8) !important;
            }

            .game-over-scroll-content {
                overflow-y: auto !important;
                overflow-x: hidden !important;
                max-height: calc(80vh - 220px) !important;
                padding-right: 10px !important;
                margin-bottom: 10px !important;
                flex: 1 1 auto !important;
                -webkit-overflow-scrolling: touch !important;
                touch-action: pan-y !important;
                outline: none !important;
            }

            .gameover-basic-stats {
                margin-bottom: 20px !important;
            }

            .gameover-stat-row {
                display: flex !important;
                justify-content: space-between !important;
                margin: 8px 0 !important;
                font-size: 18px !important;
                color: #00ffff !important;
            }

            .stat-value {
                color: #ff00ff !important;
                font-weight: bold !important;
            }

            .gameover-buttons {
                display: flex !important;
                gap: 15px !important;
                justify-content: center !important;
                margin-top: auto !important;
                position: sticky !important;
                bottom: 0 !important;
                background: linear-gradient(135deg, #0a0a1a, #1a0a2a) !important;
                padding: 10px 0 !important;
                z-index: 10 !important;
            }

            .gameover-restart-btn,
            .gameover-exit-btn {
                background: transparent !important;
                border: 2px solid #00ffff !important;
                color: #00ffff !important;
                padding: 12px 25px !important;
                font-size: 16px !important;
                border-radius: 25px !important;
                font-weight: bold !important;
                transition: all 0.3s ease !important;
                cursor: pointer !important;
                touch-action: manipulation !important;
                min-width: 44px !important;
                min-height: 44px !important;
                user-select: none !important;
                -webkit-user-select: none !important;
                -webkit-tap-highlight-color: transparent !important;
            }

            .gameover-exit-btn {
                border-color: #ff00ff !important;
                color: #ff00ff !important;
            }

            .gameover-restart-btn:hover {
                background: rgba(0, 255, 255, 0.1) !important;
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.5) !important;
            }

            .gameover-exit-btn:hover {
                background: rgba(255, 0, 255, 0.1) !important;
                box-shadow: 0 0 15px rgba(255, 0, 255, 0.5) !important;
            }
        `;
        document.head.appendChild(style);
    }

    addToastStyles() {
        // Add CSS styles for toast notifications if not already added
        if (document.getElementById('toast-notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'toast-notification-styles';
        style.textContent = `
            .toast-container {
                position: absolute !important;
                top: 35% !important;
                left: 50% !important;
                transform: translateX(-50%) translateY(-50%) !important;
                z-index: 99999999 !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
                pointer-events: none !important;
            }
            
            .toast {
                background: transparent !important;
                border: none !important;
                padding: 15px !important;
                color: #ffffff !important;
                font-family: 'NeoDunggeunmoPro', Arial, sans-serif !important;
                text-align: center !important;
                display: block !important;
                pointer-events: auto !important;
                cursor: pointer !important;
                position: relative !important;
                opacity: 0 !important;
                transform: translateY(30px) scale(0.8) !important;
                transition: all 0.6s ease-out !important;
            }
            
            .toast.toast-show {
                opacity: 0.8 !important;
                transform: translateY(0) scale(1) !important;
            }
            

            
            .toast-icon {
                font-size: 30px !important;
                flex-shrink: 0 !important;
                text-shadow: 0 0 20px rgba(255, 255, 255, 1.0),
                           0 0 40px rgba(255, 255, 255, 1.0),
                           0 3px 6px rgba(0, 0, 0, 1.0) !important;
                filter: drop-shadow(0 0 10px rgba(255, 255, 255, 1.0)) !important;
                opacity: 0.8 !important;
            }
            
            .toast-message {
                line-height: 1.2 !important;
                text-shadow: 0 0 20px rgba(0, 255, 255, 1.0),
                           0 0 40px rgba(0, 255, 255, 1.0),
                           0 0 60px rgba(0, 255, 255, 0.8),
                           0 3px 6px rgba(0, 0, 0, 1.0) !important;
                color: #ffffff !important;
                font-weight: 900 !important;
                text-align: center !important;
                opacity: 0.8 !important;
            }
            

            

        `;
        document.head.appendChild(style);
    }


    /**
     * Creates an animated icon canvas for sprite sheets
     * @param {string} imagePath - Path to sprite sheet image
     * @param {number} cols - Number of columns in sprite sheet
     * @param {number} rows - Number of rows in sprite sheet
     * @param {number} frameCount - Total number of frames
     * @param {number} fps - Animation frame rate
     * @param {number} size - Display size (width and height)
     * @returns {HTMLCanvasElement} Animated canvas element
     */
    createAnimatedIcon(imagePath, cols, rows, frameCount, fps = 8, size = 48) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        canvas.style.imageRendering = 'pixelated';

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const img = new Image();
        img.src = imagePath;

        let currentFrame = 0;
        let lastFrameTime = Date.now();
        const frameDelay = 1000 / fps;

        const animate = () => {
            const now = Date.now();
            if (now - lastFrameTime >= frameDelay) {
                // Clear canvas
                ctx.clearRect(0, 0, size, size);

                if (img.complete && img.naturalWidth > 0) {
                    // Calculate frame dimensions
                    const frameWidth = img.width / cols;
                    const frameHeight = img.height / rows;

                    // Calculate current frame position in sprite sheet
                    const col = currentFrame % cols;
                    const row = Math.floor(currentFrame / cols);

                    // Draw current frame
                    ctx.drawImage(
                        img,
                        col * frameWidth, row * frameHeight, frameWidth, frameHeight,
                        0, 0, size, size
                    );

                    // Advance to next frame
                    currentFrame = (currentFrame + 1) % frameCount;
                }

                lastFrameTime = now;
            }

            // Continue animation
            requestAnimationFrame(animate);
        };

        // Start animation when image loads
        img.onload = () => {
            animate();
        };

        // Start animation immediately (will show once loaded)
        animate();

        return canvas;
    }

    createToast(message, type = 'upgrade', duration = 2500, customIcon = null) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            console.error('Toast container not found');
            return;
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Get icon based on type (or use custom icon if provided)
        let iconElement;
        if (customIcon) {
            if (typeof customIcon === 'string') {
                const div = document.createElement('div');
                div.innerHTML = customIcon;
                iconElement = div.firstChild;
            } else {
                iconElement = customIcon;
            }
        } else {
            // Create icon based on type
            if (type === 'victory') {
                // Use animated canvas for victory icon
                iconElement = this.createAnimatedIcon('images/passives/nextStage.png', 2, 2, 4, 8, 48);
            } else {
                // Static images for other types
                const staticIcons = {
                    'boss': '⚠️',
                    'upgrade': '<img src="images/passives/upgrade.png" alt="upgrade" style="width: 48px; height: 48px;">',
                    'heal': '<img src="images/passives/healthBoost.png" alt="heal" style="width: 48px; height: 48px;">',
                    'magnet': '<img src="images/passives/magnet.png" alt="magnet" style="width: 48px; height: 48px;">'
                };
                const iconHtml = staticIcons[type] || '📢';
                const div = document.createElement('div');
                div.innerHTML = iconHtml;
                iconElement = div.firstChild || document.createTextNode(iconHtml);
            }
        }

        // Build toast content
        const contentWrapper = document.createElement('div');
        contentWrapper.style.textAlign = 'center';

        const iconWrapper = document.createElement('div');
        iconWrapper.style.fontSize = '32px';
        iconWrapper.style.marginBottom = '8px';
        iconWrapper.appendChild(iconElement);

        const messageDiv = document.createElement('div');
        messageDiv.style.fontSize = '22px';
        messageDiv.style.fontWeight = 'bold';
        messageDiv.style.color = 'white';
        messageDiv.style.textShadow = '0 0 20px rgba(0,255,255,1), 0 0 40px rgba(0,255,255,0.8), 0 2px 4px rgba(0,0,0,0.9)';
        messageDiv.textContent = message;

        contentWrapper.appendChild(iconWrapper);
        contentWrapper.appendChild(messageDiv);
        toast.appendChild(contentWrapper);

        // Click entire toast to dismiss (optional)
        toast.addEventListener('click', () => {
            this.removeToast(toast);
        });

        // Add to container
        toastContainer.appendChild(toast);

        // Trigger slide-in animation after a small delay
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 50);

        // Auto-dismiss after duration
        if (duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    removeToast(toast) {
        if (!toast || !toast.parentNode) return;

        // Remove the show class and trigger fade out - scale down in place to avoid collision
        toast.classList.remove('toast-show');
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(0) scale(0.5)'; // Scale down in place, no sliding

        // Remove after animation completes
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 600);
    }

    showToastNotification(message, type = 'upgrade', customIcon = null) {
        // Shorter duration based on type and message importance
        const durations = {
            'boss': 3000,      // 3 seconds for boss notifications
            'victory': 3000,   // 3 seconds for victory
            'upgrade': 2500,   // 2.5 seconds for upgrades
            'heal': 2000,      // 2 seconds for healing notifications
            'magnet': 2500     // 2.5 seconds for magnet notifications
        };

        this.createToast(message, type, durations[type], customIcon);
    }


    testToast() {

        this.showToastNotification('TEST NOTIFICATION!', 'upgrade');
    }

    selectUpgrade(choice) {
        switch (choice.type) {
            case 'weapon_upgrade':
                this.upgradeExistingWeapon(choice.weaponIndex);
                break;
            case 'new_weapon':
                this.addNewWeapon(choice.weaponType);
                break;
            case 'passive':
                this.addPassiveAbility(choice.passiveKey || choice.passiveId);
                break;
        }

        this.player.health = Math.min(this.player.maxHealth, this.player.health + 10);

        // Get name and icon for notification
        const upgradeName = choice.passiveName || choice.weaponName || choice.name || 'Upgrade';
        const upgradeIcon = choice.icon || this.getPassiveIconForNotification(choice.passiveKey);
        this.showUpgradeNotification(upgradeName, upgradeIcon);

        // Check if help button should be shown
        this.checkHelpButtonVisibility();
    }

    /**
     * Gets icon HTML for passive type for notifications
     * @param {string} passiveKey - Passive key
     * @returns {string} Icon HTML
     */
    getPassiveIconForNotification(passiveKey) {
        const iconMap = {
            'health_boost': 'images/passives/healthBoost.png',
            'speed_boost': 'images/passives/speedBoost.png',
            'regeneration': 'images/passives/regeneration.png',
            'magnet': 'images/passives/magnet.png',
            'armor': 'images/passives/armor.png',
            'critical': 'images/passives/criticalStrike.png',
            'dash_boost': 'images/passives/dashBoost.png',
            'turbo_flux_cycler': 'images/passives/weaponFirerate.png',
            'aegis_impact_core': 'images/passives/weaponPower.png',
            'splitstream_matrix': 'images/passives/weaponProjectile.png',
            'macro_charge_amplifier': 'images/passives/weaponSize.png',
            'mod_bay_expander': 'images/passives/weaponSlot.png'
        };
        const iconPath = iconMap[passiveKey] || 'images/passives/passive.png';
        return `<img src="${iconPath}" alt="${passiveKey}" style="width: 48px; height: 48px; image-rendering: pixelated; vertical-align: middle; margin-right: 8px;">`;
    }

    upgradeExistingWeapon(weaponIndex) {
        const weapon = this.weapons[weaponIndex];

        // Phase 9 integration - Use WeaponSystem for core upgrade logic
        // This handles: level++, damage increase, projectile count increase
        this.weaponSystem.upgradeWeapon(weapon);

        // Game-specific enhancements - Fire rate adjustment
        if (!weapon.isMergeWeapon) {
            // Non-merge weapons get faster fire rate
            weapon.fireRate = Math.max(10, weapon.fireRate - 3);
        }
        // Note: Merge weapons keep their original fire rate for consistent timing

        // Special upgrades at certain levels (legacy transformations)
        if (weapon.level === 5 && weapon.type === 'basic') {
            weapon.type = 'rapid';
        } else if (weapon.level === 8 && weapon.type === 'spread_shot') {
            weapon.type = 'spread';
        }

        // Check for weapon merges after upgrade
        this.checkForWeaponMerges();
    }

    addNewWeapon(weaponType) {
        // Phase 9 integration - Use WeaponSystem to create weapons
        const newWeapon = this.weaponSystem.createWeapon(weaponType);
        if (newWeapon) {
            this.applyPassiveModifiersToWeapon(newWeapon);
            this.weapons.push(newWeapon);
        } else {
            console.error(`Failed to create weapon: ${weaponType}`);
        }
    }

    checkForWeaponMerges() {
        // Phase 9 integration - Use WeaponSystem for merge detection and execution
        // Check all weapon pairs for possible merges
        for (let i = 0; i < this.weapons.length; i++) {
            for (let j = i + 1; j < this.weapons.length; j++) {
                const mergedType = this.weaponSystem.canMerge(this.weapons[i], this.weapons[j]);
                if (mergedType) {
                    // Perform merge using WeaponSystem
                    if (this.weaponSystem.mergeWeapons(this.weapons, i, j)) {
                        const mergedWeapon = this.weapons[this.weapons.length - 1];
                        this.applyPassiveModifiersToWeapon(mergedWeapon);

                        // Play merger sound
                        this.audioManager.playSound('mergerWeapon');

                        // Show merge notification
                        setTimeout(() => {
                            this.showUpgradeNotification(
                                `${this.getWeaponName(mergedType)} - WEAPONS MERGED!`,
                                this.getWeaponIcon(mergedType)
                            );
                        }, 100);
                        return; // Only merge one pair at a time
                    }
                }
            }
        }
    }

    performWeaponMerge(mergeWeaponType, sourceWeapons) {
        // Legacy method - kept for backward compatibility but now uses WeaponSystem
        const index1 = this.weapons.indexOf(sourceWeapons[0]);
        const index2 = this.weapons.indexOf(sourceWeapons[1]);

        if (index1 !== -1 && index2 !== -1) {
            if (this.weaponSystem.mergeWeapons(this.weapons, index1, index2)) {
                const mergedWeapon = this.weapons[this.weapons.length - 1];
                this.applyPassiveModifiersToWeapon(mergedWeapon);

                // Play merger sound
                this.audioManager.playSound('mergerWeapon');

                setTimeout(() => {
                    this.showUpgradeNotification(
                        `${this.getWeaponName(mergeWeaponType)} - WEAPONS MERGED!`,
                        this.getWeaponIcon(mergeWeaponType)
                    );
                }, 100);
            }
        }
    }

    applyPassiveModifiersToWeapon(weapon) {
        if (!weapon) return;

        if (this.player.passives.turbo_flux_cycler && !weapon._turboFluxApplied) {
            weapon.fireRate = Math.max(2, Math.floor(weapon.fireRate * 0.75));
            weapon._turboFluxApplied = true;
        }

        if (this.player.passives.aegis_impact_core && !weapon._aegisCoreApplied) {
            weapon.damage = Math.floor(weapon.damage * 1.5);
            weapon._aegisCoreApplied = true;
        }

        if (this.player.passives.splitstream_matrix && !weapon._splitstreamApplied) {
            weapon.maxProjectileCount = (weapon.maxProjectileCount || WEAPON_UPGRADES.MAX_PROJECTILES) + 1;
            weapon.projectileCount = Math.min((weapon.projectileCount || 1) + 1, weapon.maxProjectileCount);
            weapon._splitstreamApplied = true;
        }

        if (this.player.passives.macro_charge_amplifier && weapon.explosionRadius && weapon.explosionRadius > 0 && !weapon._macroChargeApplied) {
            weapon.explosionRadius = Math.floor(weapon.explosionRadius * 1.5);
            weapon._macroChargeApplied = true;
        }
    }

    applyPassiveModifiersToAllWeapons() {
        this.weapons.forEach(weapon => this.applyPassiveModifiersToWeapon(weapon));
    }

    addPassiveAbility(passiveId) {
        switch (passiveId) {
            case 'health_boost':
                this.player.maxHealth += 25;
                this.player.health += 25;
                // Track count for stackable passive
                if (typeof this.player.passives.health_boost === 'number') {
                    this.player.passives.health_boost++;
                } else {
                    this.player.passives.health_boost = 1;
                }
                break;
            case 'speed_boost':
                // Track count for stackable passive (capped at 3)
                // PlayerSystem (Phase 8) applies the actual speed boost during movement
                if (typeof this.player.passives.speed_boost === 'number') {
                    this.player.passives.speed_boost = Math.min(3, this.player.passives.speed_boost + 1);
                } else {
                    this.player.passives.speed_boost = 1;
                }
                break;
            case 'regeneration':
                this.player.passives.regeneration = { timer: 0 };
                break;
            case 'magnet':
                if (typeof this.player.passives.magnet === 'number') {
                    this.player.passives.magnet = Math.min(3, this.player.passives.magnet + 1);
                } else if (this.player.passives.magnet) {
                    this.player.passives.magnet = Math.min(3, 2);
                } else {
                    this.player.passives.magnet = 1;
                }
                break;
            case 'armor':
                // Track count for stackable passive
                if (typeof this.player.passives.armor === 'number') {
                    this.player.passives.armor++;
                } else {
                    this.player.passives.armor = 1;
                }
                break;
            case 'critical':
                // Track count for stackable passive (capped at 3)
                if (typeof this.player.passives.critical === 'number') {
                    this.player.passives.critical = Math.min(3, this.player.passives.critical + 1);
                } else {
                    this.player.passives.critical = 1;
                }
                break;
            case 'dash_boost':
                // Track count for stackable passive (capped at 3)
                if (typeof this.player.passives.dash_boost === 'number') {
                    this.player.passives.dash_boost = Math.min(3, this.player.passives.dash_boost + 1);
                } else {
                    this.player.passives.dash_boost = 1;
                }
                break;
            case 'turbo_flux_cycler':
                this.player.passives.turbo_flux_cycler = true;
                this.applyPassiveModifiersToAllWeapons();
                break;
            case 'aegis_impact_core':
                this.player.passives.aegis_impact_core = true;
                this.applyPassiveModifiersToAllWeapons();
                break;
            case 'splitstream_matrix':
                this.player.passives.splitstream_matrix = true;
                this.applyPassiveModifiersToAllWeapons();
                break;
            case 'macro_charge_amplifier':
                this.player.passives.macro_charge_amplifier = true;
                this.applyPassiveModifiersToAllWeapons();
                break;
            case 'mod_bay_expander':
                this.player.passives.mod_bay_expander = true;
                this.maxWeaponSlots = Math.max(this.getMaxWeapons(), WEAPON_UPGRADES.MAX_WEAPONS + 1);
                break;
        }

        // Only set to true for non-stackable passives
        if (!['health_boost', 'speed_boost', 'armor', 'critical', 'dash_boost', 'magnet'].includes(passiveId)) {
            this.player.passives[passiveId] = true;
        }
    }

    checkCollisions() {
        // Delegate to PhysicsManager for all collision detection
        this.physicsManager.checkCollisions(this);
    }

    /**
     * Handle player death - called by PhysicsManager
     */
    handlePlayerDeath() {
        if (this.playerDead || this.gameOverHandled) {
            return;
        }
        this.playerDead = true; // Mark player as dead to stop game logic
        this.gameOverHandled = true;

        // Delay stopping the game to let red flash complete
        setTimeout(() => {
            this.gameRunning = false;
            this.gameOver();
            this.showGameOverModal();
        }, 850);
    }

    findNearestEnemy(x, y, maxRange = Infinity) {
        let nearestEnemy = null;
        let nearestDistance = maxRange;

        this.enemies.forEach(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = this.cachedSqrt(dx * dx + dy * dy);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        });

        return nearestEnemy;
    }

    createExplosion(x, y, radius, damage, sourceType = null) {
        // Delegate to ParticleSystem with damage callback
        const applyDamageCallback = (x, y, radius, damage, sourceType) => {
            this.enemies.forEach(enemy => {
                const dx = enemy.x - x;
                const dy = enemy.y - y;
                const distance = this.cachedSqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const falloff = 1 - (distance / radius);
                    const appliedDamage = damage * Math.max(0, falloff);
                    if (appliedDamage > 0) {
                        enemy.health -= appliedDamage;
                        if (sourceType) {
                            this.recordWeaponDamage(sourceType, appliedDamage, enemy);
                        }
                    }
                }
            });
        };

        this.particleSystem.createExplosion(
            x, y, radius, damage, sourceType,
            applyDamageCallback,
            this.fastCos,
            this.fastSin
        );
    }

    createBossDefeatAnimation(bossX, bossY, bossRadius) {
        // Delegate to ParticleSystem with callbacks
        this.particleSystem.createBossDefeatAnimation(
            bossX, bossY, bossRadius,
            (x, y, r, d) => this.createExplosion(x, y, r, d),
            (intensity, duration) => this.createScreenShake(intensity, duration),
            (intensity) => this.createRedFlash(intensity),
            (msg, type, duration) => this.createToast(msg, type, duration),
            this.fastCos,
            this.fastSin
        );
    }

    createHitParticles(x, y, color) {
        // Particles removed for performance
    }

    createDashParticles() {
        // Particles removed for performance
    }

    createCriticalParticles(x, y) {
        // Particles removed for performance
    }

    createTeleportParticles(x, y) {
        // Particles removed for performance
    }

    createScreenShake(intensity, duration = 20) {
        // Delegate to EffectsManager (now supports duration parameter - fixes bug)
        this.effectsManager.createScreenShake(intensity, duration);
    }

    createRedFlash(intensity = 0.6) {
        // Delegate to EffectsManager
        this.effectsManager.createRedFlash(intensity);
    }


    updateScreenShake() {
        // Delegated to EffectsManager (called from update())
        // This method kept for backward compatibility but does nothing
    }

    updateRedFlash() {
        // Delegated to EffectsManager (called from update())
        // This method kept for backward compatibility but does nothing
    }

    updateExplosions() {
        // Delegated to ParticleSystem (called from update())
        // This method kept for backward compatibility but does nothing
    }

    createDeathParticles(x, y, color) {
        // Particles removed for performance
    }

    showUpgradeNotification(title, iconHtml = null) {
        const acquiredText = this.t('acquiredSuffix');
        let message;

        if (acquiredText && acquiredText !== 'acquiredSuffix') {
            message = acquiredText.includes('{title}')
                ? acquiredText.replace('{title}', title)
                : `${title} ${acquiredText}`.trim();
        } else {
            message = `${title} ACQUIRED!`;
        }

        this.showToastNotification(message, 'upgrade', iconHtml);
    }

    showBossNotification(bossNameOrVariant = null) {
        let bossName = null;

        // If passed a variant config object, extract the appropriate name
        if (bossNameOrVariant && typeof bossNameOrVariant === 'object') {
            const variant = bossNameOrVariant;
            // Use Korean name if language is Korean, otherwise use English name
            bossName = (this.currentLanguage === 'ko' && variant.nameKo)
                ? variant.nameKo
                : variant.name;
        } else if (typeof bossNameOrVariant === 'string') {
            // If passed a string, use it directly (backward compatibility)
            bossName = bossNameOrVariant;
        }

        const message = bossName
            ? `${bossName.toUpperCase()} EMERGES!`
            : "BOSS APPEARED!";
        this.showToastNotification(message, 'boss');
        if (!this.audioManager) return;

        // bossAlert is ~2.0 seconds long; play 3 times at 2.0s intervals
        const intervalMs = 2000;
        this.audioManager.playSound('bossAlert', 2.5);
        setTimeout(() => this.audioManager.playSound('bossAlert', 2.5), intervalMs);
        setTimeout(() => this.audioManager.playSound('bossAlert', 2.5), intervalMs * 2);
    }

    showContinueNotification() {
        this.showToastNotification("BOSS DEFEATED! DIFFICULTY INCREASED!", 'victory');
    }

    showChestSpawnNotification() {
        // Show notification that upgrade chest has appeared
        const chestIcon = '<img src="images/passives/upgradeBox.png" alt="Chest" style="width: 48px; height: 48px; image-rendering: pixelated; vertical-align: middle; margin-right: 8px;">';
        this.showToastNotification("UPGRADE CHEST HAS APPEARED!", 'upgrade', chestIcon);
    }

    createChestSpawnParticles(x, y) {
        // Create gold sparkle particles around chest spawn point
        if (!this.particleSystem) return;

        for (let i = 0; i < 15; i++) {
            const particle = this.particleSystem.getPooledParticle();
            if (particle) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 2;

                particle.x = x;
                particle.y = y;
                particle.vx = Math.cos(angle) * speed;
                particle.vy = Math.sin(angle) * speed;
                particle.size = 2 + Math.random() * 2;
                particle.color = '#FFD700'; // Gold
                particle.life = 0.3 + Math.random() * 0.3;
                particle.maxLife = particle.life;
                particle.type = 'chest_spawn';

                this.particleSystem.particles.push(particle);
            }
        }
    }

    createChestCollectionParticles(x, y) {
        // Create explosion burst of gold particles when chest collected
        if (!this.particleSystem) return;

        for (let i = 0; i < 30; i++) {
            const particle = this.particleSystem.getPooledParticle();
            if (particle) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;

                particle.x = x;
                particle.y = y;
                particle.vx = Math.cos(angle) * speed;
                particle.vy = Math.sin(angle) * speed;
                particle.size = 3 + Math.random() * 3;
                particle.color = i % 2 === 0 ? '#FFD700' : '#FFA500'; // Gold and orange
                particle.life = 0.5 + Math.random() * 0.5;
                particle.maxLife = particle.life;
                particle.type = 'chest_collect';

                this.particleSystem.particles.push(particle);
            }
        }
    }

    calculateNotificationPosition(type) {
        // This method has been replaced by the toast notification system
        // Kept for compatibility but no longer used
        return 0;
    }


    addNotificationSafely(notificationData) {
        // This method has been replaced by the toast notification system
        // Kept for compatibility but no longer used
    }


    repositionOverlappingNotifications() {
        // This method has been replaced by the toast notification system
        // Kept for compatibility but no longer used
    }

    updateCamera() {
        // Use different smoothing based on player state
        let lerpFactor = 0.1; // Default smooth following

        // During dash, use faster but still smooth camera movement
        if (this.player.dashCooldown > 0) {
            lerpFactor = 0.2; // Faster follow during dash, but not instant
        }

        // Delegate to Camera class
        this.camera.follow(
            this.player,
            this.canvas.width,
            this.canvas.height,
            lerpFactor
        );
    }


    // Performance optimization: Check if object is visible on screen
    isInViewport(x, y, radius = 0, cullingLevel = 'normal') {
        if (!this.canvas) return true; // Fallback to render everything if no canvas

        // Different buffer sizes based on culling aggressiveness
        let buffer;
        switch (cullingLevel) {
            case 'aggressive':
                buffer = 50; // Very tight culling for particles/effects
                break;
            case 'tight':
                buffer = 75; // Tighter culling for small entities
                break;
            case 'normal':
                buffer = 100; // Standard buffer
                break;
            case 'loose':
                buffer = 150; // Loose culling for important entities
                break;
            default:
                buffer = 100;
        }

        // Delegate to Camera class
        return this.camera.isInViewport(x, y, this.canvas.width, this.canvas.height, buffer);
    }


    // Enhanced frustum culling with distance-based LOD
    shouldRender(entity, entityType) {
        // Always render critical entities
        if (entityType === 'player' || entity.type === 'boss') {
            return true;
        }

        // Calculate distance from player for LOD decisions
        const dx = entity.x - this.player.x;
        const dy = entity.y - this.player.y;
        const distanceFromPlayer = Math.sqrt(dx * dx + dy * dy);

        // Different culling strategies based on entity type and distance
        switch (entityType) {
            case 'particle':
                // Very aggressive culling for particles
                if (distanceFromPlayer > 400) return false;
                return this.isInViewport(entity.x, entity.y, entity.size || 2, 'aggressive');

            case 'projectile':
                // Special priority for complex weapons to prevent edge case disappearing
                if (entity.type === 'flame' || entity.type === 'lightning' || entity.type === 'shockburst') {
                    // More lenient culling for complex weapons
                    if (distanceFromPlayer > 800) return false;
                    return this.isInViewport(entity.x, entity.y, entity.size || 3, 'normal');
                }
                // Tight culling for basic projectiles
                if (distanceFromPlayer > 600) return false;
                return this.isInViewport(entity.x, entity.y, entity.size || 3, 'tight');

            case 'enemy':
                // Standard culling for enemies, but skip very distant ones
                if (distanceFromPlayer > 800) return false;
                return this.isInViewport(entity.x, entity.y, entity.radius || 15, 'normal');

            case 'effect':
                // Aggressive culling for explosions and effects
                if (distanceFromPlayer > 500) return false;
                return this.isInViewport(entity.x, entity.y, entity.radius || 20, 'aggressive');

            case 'xp':
                // Standard culling for XP orbs
                return this.isInViewport(entity.x, entity.y, 15, 'normal');

            case 'hp':
                // Standard culling for HP orbs (same as XP orbs)
                return this.isInViewport(entity.x, entity.y, 15, 'normal');

            case 'magnet':
                // Standard culling for magnet orbs (same as XP orbs)
                return this.isInViewport(entity.x, entity.y, 15, 'normal');

            default:
                return this.isInViewport(entity.x, entity.y, entity.radius || 10, 'normal');
        }
    }



    // Object pooling for projectiles
    initializeProjectilePool() {
        // Projectile pool
        this.projectilePool = [];
        this.poolSize = 200; // Increased pool size for better performance

        // Pre-create projectiles
        for (let i = 0; i < this.poolSize; i++) {
            this.projectilePool.push({
                x: 0, y: 0, vx: 0, vy: 0,
                damage: 0, speed: 0, life: 0,
                size: 3, color: '#ffffff',
                type: 'basic', active: false,
                trail: [], rotation: 0,
                homing: false, target: null
            });
        }

        // Particle pool for explosions and effects
        this.particlePool = [];
        this.particlePoolSize = 500;

        for (let i = 0; i < this.particlePoolSize; i++) {
            this.particlePool.push({
                x: 0, y: 0, vx: 0, vy: 0,
                size: 2, color: '#ffffff',
                life: 1, maxLife: 1, active: false,
                type: 'basic'
            });
        }

        // Enemy pool for frequently spawned enemies
        this.enemyPool = [];
        this.enemyPoolSize = 50;

        for (let i = 0; i < this.enemyPoolSize; i++) {
            this.enemyPool.push({
                x: 0, y: 0, vx: 0, vy: 0,
                health: 100, maxHealth: 100,
                size: 20, color: '#ff0000',
                type: 'basic', active: false,
                lastHit: 0, flashTime: 0
            });
        }

        // Explosion pool for effects
        this.explosionPool = [];
        this.explosionPoolSize = 50;

        for (let i = 0; i < this.explosionPoolSize; i++) {
            this.explosionPool.push({
                x: 0, y: 0, radius: 0, maxRadius: 0,
                life: 0, maxLife: 0, color: '#FF6600',
                active: false
            });
        }

        // XP orb pool for performance
        this.xpOrbPool = [];
        this.xpOrbPoolSize = 100;

        for (let i = 0; i < this.xpOrbPoolSize; i++) {
            this.xpOrbPool.push({
                x: 0, y: 0, value: 1,
                life: 1800, glow: 0,
                active: false
            });
        }

        // HP orb pool for healing performance
        this.hpOrbPool = [];
        this.hpOrbPoolSize = 20;

        for (let i = 0; i < this.hpOrbPoolSize; i++) {
            this.hpOrbPool.push({
                x: 0, y: 0, healAmount: 30,
                life: 3600, glow: 0,
                active: false
            });
        }

        // Magnet orb pool for attraction performance
        this.magnetOrbPool = [];
        this.magnetOrbPoolSize = 20;

        for (let i = 0; i < this.magnetOrbPoolSize; i++) {
            this.magnetOrbPool.push({
                x: 0, y: 0, attractionRange: 1000,
                life: 3600, glow: 0,
                active: false
            });
        }

        // Chest orb pool for upgrade chests
        this.chestOrbPool = [];
        this.chestOrbPoolSize = 5;

        for (let i = 0; i < this.chestOrbPoolSize; i++) {
            this.chestOrbPool.push({
                x: 0, y: 0,
                life: 0, lifetime: 9000, // 2.5 minutes
                glow: 0,
                active: false,
                __hintInitialized: false,
                hintVisible: false,
                hintFramesRemaining: 0
            });
        }
    }

    // Get projectile from pool - Phase 9 integration
    getPooledProjectile() {
        // Safety limit: Prevent memory issues with too many complex weapons
        const activeProjectiles = this.projectiles.length;
        const maxProjectiles = 1000; // Reasonable limit for performance

        if (activeProjectiles >= maxProjectiles) {
            console.warn('🚨 Projectile limit reached:', activeProjectiles);
            // Return oldest projectile instead of creating new one
            const oldestProjectile = this.projectiles[0];
            if (oldestProjectile) {
                // Reset and reuse
                oldestProjectile.trail = [];
                oldestProjectile.rotation = 0;
                oldestProjectile.homing = false;
                oldestProjectile.target = null;
                oldestProjectile.targetEnemy = null;
                oldestProjectile.owner = 'player'; // Ensure player ownership
                return oldestProjectile;
            }
        }

        // Use ProjectileSystem for pooling
        const projectile = this.projectileSystem.getPooled();

        // Reset properties for reuse
        projectile.active = true;
        projectile.trail = [];
        projectile.rotation = 0;
        projectile.homing = false;
        projectile.target = null;
        projectile.targetEnemy = null;
        projectile.owner = 'player'; // CRITICAL: Ensure player ownership to prevent boss missiles from attacking player

        return projectile;
    }

    getPooledXPOrb() {
        for (let i = 0; i < this.xpOrbPool.length; i++) {
            if (!this.xpOrbPool[i].active) {
                const orb = this.xpOrbPool[i];
                orb.active = true;
                orb.life = 1800; // Reset life
                orb.glow = 0; // Reset glow
                return orb;
            }
        }

        // If no available orb in pool, expand pool dynamically
        const newOrb = {
            x: 0, y: 0, value: 1,
            life: 1800, glow: 0,
            active: true
        };
        this.xpOrbPool.push(newOrb);
        return newOrb;
    }

    getPooledHPOrb() {
        for (let i = 0; i < this.hpOrbPool.length; i++) {
            if (!this.hpOrbPool[i].active) {
                const orb = this.hpOrbPool[i];
                orb.active = true;
                orb.life = 3600; // Reset life (60 seconds)
                orb.glow = 0; // Reset glow
                return orb;
            }
        }

        // If no available orb in pool, expand pool dynamically
        const newOrb = {
            x: 0, y: 0, healAmount: 30,
            life: 3600, glow: 0,
            active: true
        };
        this.hpOrbPool.push(newOrb);
        return newOrb;
    }

    getPooledMagnetOrb() {
        for (let i = 0; i < this.magnetOrbPool.length; i++) {
            if (!this.magnetOrbPool[i].active) {
                const orb = this.magnetOrbPool[i];
                orb.active = true;
                orb.life = 3600; // Reset life (60 seconds)
                orb.glow = 0; // Reset glow
                return orb;
            }
        }

        // If no available orb in pool, expand pool dynamically
        const newOrb = {
            x: 0, y: 0, attractionRange: 1000,
            life: 3600, glow: 0,
            active: true
        };
        this.magnetOrbPool.push(newOrb);
        return newOrb;
    }

    getPooledChestOrb() {
        for (let i = 0; i < this.chestOrbPool.length; i++) {
            if (!this.chestOrbPool[i].active) {
                const orb = this.chestOrbPool[i];
                orb.active = true;
                orb.life = 0; // Reset lifetime counter
                orb.glow = 0; // Reset glow
                orb.__hintInitialized = false;
                orb.hintVisible = false;
                orb.hintFramesRemaining = 0;
                return orb;
            }
        }

        // If no available orb in pool, expand pool dynamically
        const newOrb = {
            x: 0, y: 0,
            life: 0, lifetime: 9000,
            glow: 0,
            active: true,
            __hintInitialized: false,
            hintVisible: false,
            hintFramesRemaining: 0
        };
        this.chestOrbPool.push(newOrb);
        return newOrb;
    }

    // Smart garbage collection system
    initializeSmartGarbageCollection() {
        this.garbageCollectionSystem = {
            enabled: true,
            cleanupScheduled: false,
            lastCleanup: Date.now(),
            cleanupInterval: 5000, // Cleanup every 5 seconds

            // Cleanup tasks to perform during idle periods
            cleanupTasks: [
                () => this.compactProjectilePool(),
                () => this.compactParticlePool(),
                () => this.compactXPOrbPool(),
                () => this.cleanupTrails()
            ]
        };


        this.scheduleIdleCleanup();
    }

    scheduleIdleCleanup() {
        if (!this.garbageCollectionSystem.enabled || this.garbageCollectionSystem.cleanupScheduled) {
            return;
        }

        this.garbageCollectionSystem.cleanupScheduled = true;

        // Use requestIdleCallback if available, otherwise fallback to setTimeout
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback((deadline) => {
                this.performIdleCleanup(deadline);
            }, { timeout: 1000 });
        } else {
            setTimeout(() => {
                this.performIdleCleanup({ timeRemaining: () => 16 }); // Simulate 16ms budget
            }, 100);
        }
    }

    performIdleCleanup(deadline) {
        this.garbageCollectionSystem.cleanupScheduled = false;

        const now = Date.now();
        const timeSinceLastCleanup = now - this.garbageCollectionSystem.lastCleanup;

        // Only perform cleanup if enough time has passed
        if (timeSinceLastCleanup < this.garbageCollectionSystem.cleanupInterval) {
            this.scheduleIdleCleanup();
            return;
        }

        // Perform cleanup tasks while we have idle time
        const tasks = this.garbageCollectionSystem.cleanupTasks;
        let taskIndex = 0;

        while (deadline.timeRemaining() > 1 && taskIndex < tasks.length) {
            try {
                tasks[taskIndex]();
                taskIndex++;
            } catch (e) {
                console.warn('Cleanup task failed:', e);
                taskIndex++;
            }
        }

        this.garbageCollectionSystem.lastCleanup = now;

        // Schedule next cleanup
        this.scheduleIdleCleanup();
    }

    // Pool compaction methods - remove excess inactive objects
    compactProjectilePool() {
        if (this.projectilePool.length > this.poolSize * 1.5) {
            const activeCount = this.projectilePool.filter(p => p.active).length;
            const keepCount = Math.max(this.poolSize, activeCount + 20);

            if (this.projectilePool.length > keepCount) {
                // Keep active objects and some inactive ones
                const newPool = this.projectilePool.filter(p => p.active);
                const inactivePool = this.projectilePool.filter(p => !p.active);
                newPool.push(...inactivePool.slice(0, keepCount - newPool.length));
                this.projectilePool = newPool;

            }
        }
    }

    compactParticlePool() {
        if (this.particlePool.length > this.particlePoolSize * 1.5) {
            const activeCount = this.particlePool.filter(p => p.active).length;
            const keepCount = Math.max(this.particlePoolSize, activeCount + 50);

            if (this.particlePool.length > keepCount) {
                const newPool = this.particlePool.filter(p => p.active);
                const inactivePool = this.particlePool.filter(p => !p.active);
                newPool.push(...inactivePool.slice(0, keepCount - newPool.length));
                this.particlePool = newPool;

            }
        }
    }

    compactXPOrbPool() {
        if (this.xpOrbPool && this.xpOrbPool.length > this.xpOrbPoolSize * 1.5) {
            const activeCount = this.xpOrbPool.filter(o => o.active).length;
            const keepCount = Math.max(this.xpOrbPoolSize, activeCount + 20);

            if (this.xpOrbPool.length > keepCount) {
                const newPool = this.xpOrbPool.filter(o => o.active);
                const inactivePool = this.xpOrbPool.filter(o => !o.active);
                newPool.push(...inactivePool.slice(0, keepCount - newPool.length));
                this.xpOrbPool = newPool;

            }
        }
    }

    cleanupTrails() {
        // Clean up excessive trail points from player and projectiles
        if (this.player && this.player.trail && this.player.trail.length > 20) {
            this.player.trail = this.player.trail.slice(-15);

        }

        // Clean up projectile trails
        let cleanedProjectiles = 0;
        this.projectiles.forEach(projectile => {
            if (projectile.trail && projectile.trail.length > 10) {
                projectile.trail = projectile.trail.slice(-8);
                cleanedProjectiles++;
            }
        });

        if (cleanedProjectiles > 0) {

        }
    }

    // Cached square root for performance
    cachedSqrt(value) {
        if (value < 0) return 0;
        if (value === 0) return 0;
        if (value === 1) return 1;

        // Round to 2 decimal places for cache key
        const rounded = Math.round(value * 100) / 100;

        // Check cache first
        if (this.sqrtCache.has(rounded)) {
            return this.sqrtCache.get(rounded);
        }

        // Calculate and cache result
        const result = Math.sqrt(value);

        // Only cache if we haven't exceeded max size
        if (this.sqrtCache.size < this.maxCacheSize) {
            this.sqrtCache.set(rounded, result);
        }

        return result;
    }

    // Fast power approximation for small integer exponents
    fastPow(base, exponent) {
        // Handle special cases first
        if (exponent === 0) return 1;
        if (exponent === 1) return base;
        if (base === 1) return 1;
        if (base === 0) return 0;

        // Fast approximations for small integer exponents
        if (Number.isInteger(exponent) && exponent > 0 && exponent <= 10) {
            switch (exponent) {
                case 2: return base * base;
                case 3: return base * base * base;
                case 4: { const sq = base * base; return sq * sq; }
                case 5: { const sq = base * base; return sq * sq * base; }
                case 6: { const sq = base * base; return sq * sq * sq; }
                case 7: { const sq = base * base; return sq * sq * sq * base; }
                case 8: { const sq = base * base; const quad = sq * sq; return quad * quad; }
                default: {
                    // For larger powers, use repeated multiplication
                    let result = base;
                    for (let i = 1; i < exponent; i++) {
                        result *= base;
                    }
                    return result;
                }
            }
        }

        // Fall back to Math.pow for complex cases (decimals, negatives, large numbers)
        return Math.pow(base, exponent);
    }

    // Step 5D: Sine/Cosine Lookup Tables for trigonometric optimizations
    initTrigLookupTables() {
        // Pre-calculate sin/cos values for angles from 0 to 2π with high precision
        this.TRIG_TABLE_SIZE = 3600; // 0.1 degree precision (360 * 10)
        this.TRIG_ANGLE_SCALE = this.TRIG_TABLE_SIZE / (2 * Math.PI);

        this.sinTable = new Float32Array(this.TRIG_TABLE_SIZE + 1);
        this.cosTable = new Float32Array(this.TRIG_TABLE_SIZE + 1);

        for (let i = 0; i <= this.TRIG_TABLE_SIZE; i++) {
            const angle = (i / this.TRIG_TABLE_SIZE) * 2 * Math.PI;
            this.sinTable[i] = Math.sin(angle);
            this.cosTable[i] = Math.cos(angle);
        }
    }

    // Fast sine lookup with linear interpolation
    fastSin(angle) {
        // Fast angle normalization using modulo
        angle = angle % (2 * Math.PI);
        if (angle < 0) angle += 2 * Math.PI;

        const index = angle * this.TRIG_ANGLE_SCALE;
        const i0 = Math.floor(index);
        const i1 = (i0 + 1) % this.TRIG_TABLE_SIZE;
        const frac = index - i0;

        // Linear interpolation for better accuracy
        return this.sinTable[i0] + (this.sinTable[i1] - this.sinTable[i0]) * frac;
    }

    // Fast cosine lookup with linear interpolation
    fastCos(angle) {
        // Fast angle normalization using modulo
        angle = angle % (2 * Math.PI);
        if (angle < 0) angle += 2 * Math.PI;

        const index = angle * this.TRIG_ANGLE_SCALE;
        const i0 = Math.floor(index);
        const i1 = (i0 + 1) % this.TRIG_TABLE_SIZE;
        const frac = index - i0;

        // Linear interpolation for better accuracy
        return this.cosTable[i0] + (this.cosTable[i1] - this.cosTable[i0]) * frac;
    }

    getPooledParticle() {
        for (let i = 0; i < this.particlePool.length; i++) {
            if (!this.particlePool[i].active) {
                const particle = this.particlePool[i];
                particle.active = true;
                return particle;
            }
        }

        // If no available particle in pool, expand pool dynamically
        const newParticle = {
            x: 0, y: 0, vx: 0, vy: 0,
            size: 2, color: '#ffffff',
            life: 1, maxLife: 1, active: true,
            type: 'basic'
        };
        this.particlePool.push(newParticle);
        return newParticle;
    }

    returnParticleToPool(particle) {
        particle.active = false;
        particle.life = 1;
        particle.maxLife = 1;
        particle.vx = 0;
        particle.vy = 0;
    }

    getPooledEnemy() {
        for (let i = 0; i < this.enemyPool.length; i++) {
            if (!this.enemyPool[i].active) {
                const enemy = this.enemyPool[i];
                enemy.active = true;
                enemy.lastHit = 0;
                enemy.flashTime = 0;
                return enemy;
            }
        }

        // If no available enemy in pool, expand pool dynamically
        const newEnemy = {
            x: 0, y: 0, vx: 0, vy: 0,
            health: 100, maxHealth: 100,
            size: 20, color: '#ff0000',
            type: 'basic', active: true,
            lastHit: 0, flashTime: 0
        };
        this.enemyPool.push(newEnemy);
        return newEnemy;
    }

    returnEnemyToPool(enemy) {
        enemy.active = false;
        enemy.health = enemy.maxHealth;
        enemy.lastHit = 0;
        enemy.flashTime = 0;
        enemy.vx = 0;
        enemy.vy = 0;
    }

    getPooledExplosion() {
        for (let i = 0; i < this.explosionPool.length; i++) {
            if (!this.explosionPool[i].active) {
                const explosion = this.explosionPool[i];
                explosion.active = true;
                return explosion;
            }
        }

        // If no available explosion in pool, expand pool dynamically
        const newExplosion = {
            x: 0, y: 0, radius: 0, maxRadius: 0,
            life: 0, maxLife: 0, color: '#FF6600',
            active: true
        };
        this.explosionPool.push(newExplosion);
        return newExplosion;
    }

    returnExplosionToPool(explosion) {
        explosion.active = false;
        explosion.x = 0;
        explosion.y = 0;
        explosion.radius = 0;
        explosion.maxRadius = 0;
        explosion.life = 0;
        explosion.maxLife = 0;
    }

    // =====================
    // BATCH RENDERING SYSTEM
    // =====================

    initializeBatchRenderer() {
        this.batchRenderer = {
            entityBatches: {
                enemies: {},
                projectiles: {},
                particles: {},
                explosions: {}
            },
            maxBatchSize: 50, // Maximum entities per batch before forcing a draw
            enabled: true
        };

    }

    // =====================
    // CANVAS LAYERS SYSTEM
    // =====================

    initializeCanvasLayers() {
        if (!this.canvas || !this.canvas.parentNode) {
            console.warn('Cannot initialize canvas layers - main canvas not ready');
            return;
        }

        this.canvasLayers = {
            background: null,
            grid: null,
            entities: null,
            effects: null,
            ui: null,
            enabled: true,
            needsGridRedraw: true
        };

        // Create layer canvases
        this.createCanvasLayer('background', 0); // Bottom layer
        this.createCanvasLayer('grid', 1);       // Grid layer
        this.createCanvasLayer('entities', 2);   // Entities (enemies, projectiles, player)
        this.createCanvasLayer('effects', 3);    // Particles, explosions
        this.createCanvasLayer('ui', 4);         // UI elements, notifications


    }

    createCanvasLayer(name, zIndex) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
            willReadFrequently: false
        });

        // Copy dimensions from main canvas
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;

        // Style the canvas
        canvas.style.position = 'absolute';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        canvas.style.zIndex = zIndex.toString();
        canvas.style.pointerEvents = 'none'; // Allow events to pass through

        // Insert into DOM right after main canvas
        this.canvas.parentNode.insertBefore(canvas, this.canvas.nextSibling);

        // Store layer info
        this.canvasLayers[name] = {
            canvas: canvas,
            ctx: ctx,
            zIndex: zIndex,
            needsRedraw: true
        };


    }

    resizeCanvasLayers() {
        if (!this.canvasLayers || !this.canvasLayers.enabled) return;

        for (const layerName in this.canvasLayers) {
            const layer = this.canvasLayers[layerName];
            if (layer && layer.canvas && this.canvas) {
                layer.canvas.width = this.canvas.width;
                layer.canvas.height = this.canvas.height;
                layer.needsRedraw = true;
            }
        }

        // Mark grid for redraw since canvas was resized
        if (this.canvasLayers.grid) {
            this.canvasLayers.needsGridRedraw = true;
        }
    }

    clearCanvasLayer(layerName) {
        const layer = this.canvasLayers[layerName];
        if (!layer || !layer.canvas) return;

        layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
    }

    drawToLayer(layerName, drawFunction) {
        if (!this.canvasLayers || !this.canvasLayers.enabled) {
            // Fallback to main canvas
            drawFunction(this.ctx);
            return;
        }

        const layer = this.canvasLayers[layerName];
        if (!layer || !layer.canvas) {
            // Fallback to main canvas
            drawFunction(this.ctx);
            return;
        }

        // Draw to the layer
        drawFunction(layer.ctx);
    }

    invalidateLayer(layerName) {
        if (this.canvasLayers && this.canvasLayers[layerName]) {
            this.canvasLayers[layerName].needsRedraw = true;
        }
    }

    cleanupCanvasLayers() {
        if (!this.canvasLayers) return;

        // Remove layer canvases from DOM
        for (const layerName in this.canvasLayers) {
            const layer = this.canvasLayers[layerName];
            if (layer && layer.canvas && layer.canvas.parentNode) {
                layer.canvas.parentNode.removeChild(layer.canvas);
            }
        }

        this.canvasLayers = null;

    }

    // =====================
    // ADAPTIVE QUALITY SCALING SYSTEM
    // =====================

    initializeAdaptiveQuality() {
        this.adaptiveQuality = {
            enabled: true,
            currentLevel: 3, // 1=lowest, 5=highest
            targetFPS: 55,   // Target FPS to maintain
            lowFPSThreshold: 35, // More responsive - reduce quality sooner
            highFPSThreshold: 50, // More conservative - don't increase quality too eagerly
            checkInterval: 30, // Check every 30 frames - twice as responsive
            frameCount: 0,
            adjustmentCooldown: 180, // Wait 3 seconds between adjustments
            lastAdjustment: 0,

            levels: {
                1: { // Ultra Low - Crisis mode
                    particleCount: 0.1,
                    explosionCount: 0.3,
                    shadowBlur: 0,
                    glowEffects: false,
                    batchRendering: true,
                    canvasLayers: false,
                    trailLength: 3
                },
                2: { // Low
                    particleCount: 0.3,
                    explosionCount: 0.5,
                    shadowBlur: 2,
                    glowEffects: false,
                    batchRendering: true,
                    canvasLayers: false,
                    trailLength: 5
                },
                3: { // Medium (default)
                    particleCount: 0.6,
                    explosionCount: 0.8,
                    shadowBlur: 5,
                    glowEffects: true,
                    batchRendering: true,
                    canvasLayers: true,
                    trailLength: 8
                },
                4: { // High
                    particleCount: 0.8,
                    explosionCount: 1.0,
                    shadowBlur: 8,
                    glowEffects: true,
                    batchRendering: true,
                    canvasLayers: true,
                    trailLength: 12
                },
                5: { // Ultra High
                    particleCount: 1.0,
                    explosionCount: 1.0,
                    shadowBlur: 15,
                    glowEffects: true,
                    batchRendering: false, // Allow individual rendering for quality
                    canvasLayers: true,
                    trailLength: 15
                }
            }
        };

        // Initialize default quality level
        this.setQualityLevel(this.adaptiveQuality.currentLevel);
    }

    updateAdaptiveQuality() {
        if (!this.adaptiveQuality || !this.adaptiveQuality.enabled) return;

        this.adaptiveQuality.frameCount++;

        // Only check performance periodically
        if (this.adaptiveQuality.frameCount % this.adaptiveQuality.checkInterval !== 0) return;

        // Don't adjust too frequently
        const timeSinceLastAdjustment = Date.now() - this.adaptiveQuality.lastAdjustment;
        if (timeSinceLastAdjustment < this.adaptiveQuality.adjustmentCooldown * 16.67) return; // Convert to ms

        const currentFPS = this.averageFPS || this.fps || 60;
        const currentLevel = this.adaptiveQuality.currentLevel;
        let newLevel = currentLevel;

        // Decide if we need to adjust quality
        if (currentFPS < this.adaptiveQuality.lowFPSThreshold && currentLevel > 1) {
            // Performance too low, decrease quality
            newLevel = Math.max(1, currentLevel - 1);

        } else if (currentFPS > this.adaptiveQuality.highFPSThreshold && currentLevel < 5) {
            // Performance good, try increasing quality
            newLevel = Math.min(5, currentLevel + 1);

        }

        // Apply quality change if needed
        if (newLevel !== currentLevel) {
            this.setQualityLevel(newLevel);
            this.adaptiveQuality.lastAdjustment = Date.now();
        }
    }

    setQualityLevel(level) {
        if (!this.adaptiveQuality || level < 1 || level > 5) return;

        const oldLevel = this.adaptiveQuality.currentLevel;
        this.adaptiveQuality.currentLevel = level;
        const config = this.adaptiveQuality.levels[level];

        // Apply quality settings
        this.qualitySettings = {
            particleMultiplier: config.particleCount,
            explosionMultiplier: config.explosionCount,
            shadowBlur: config.shadowBlur,
            glowEffects: config.glowEffects,
            useGlow: config.glowEffects,
            effectQuality: config.particleCount,
            batchRendering: config.batchRendering,
            canvasLayers: config.canvasLayers,
            trailLength: config.trailLength
        };

        // Inject quality settings into rendering systems
        if (this.particleSystem) {
            this.particleSystem.setQualitySettings(this.qualitySettings);
        }
        if (this.effectsManager) {
            this.effectsManager.setQualitySettings(this.qualitySettings);
        }

        // Keep canvas layers enabled but note the quality preference
        // (Canvas layers temporarily disabled for debugging)
        this.canvasLayersPreferred = config.canvasLayers;

        // Toggle batch rendering based on quality level
        if (this.batchRenderer) {
            this.batchRenderer.enabled = config.batchRendering;
        }

        // Adjust player trail length
        if (this.player && this.player.trail) {
            const maxTrailLength = Math.min(config.trailLength, this.player.trail.length);
            if (this.player.trail.length > maxTrailLength) {
                this.player.trail = this.player.trail.slice(-maxTrailLength);
            }
            this.player.maxTrailLength = maxTrailLength;
        }


    }

    getQualityLevelName(level) {
        const names = ['', 'Ultra Low', 'Low', 'Medium', 'High', 'Ultra High'];
        return names[level] || 'Unknown';
    }

    shouldCreateParticle() {
        if (!this.adaptiveQuality || !this.qualitySettings) return true;
        return Math.random() < this.qualitySettings.particleMultiplier;
    }

    shouldCreateExplosion() {
        if (!this.adaptiveQuality || !this.qualitySettings) return true;
        return Math.random() < this.qualitySettings.explosionMultiplier;
    }

    getQualityShadowBlur() {
        if (!this.adaptiveQuality || !this.qualitySettings) return 10;
        return this.qualitySettings.shadowBlur;
    }

    shouldUseGlowEffects() {
        if (!this.adaptiveQuality || !this.qualitySettings) return true;
        return this.qualitySettings.glowEffects;
    }

    forceQualityLevel(level) {
        // Allow manual quality override for testing

        this.setQualityLevel(level);
        this.adaptiveQuality.lastAdjustment = Date.now();
    }

    addToBatch(entityType, renderType, entity) {
        if (!this.batchRenderer || !this.batchRenderer.enabled) {
            return false;
        }

        const batch = this.batchRenderer.entityBatches[entityType];
        if (!batch) return false;

        if (!batch[renderType]) {
            batch[renderType] = [];
        }

        batch[renderType].push(entity);

        // Auto-flush if batch gets too large
        if (batch[renderType].length >= this.batchRenderer.maxBatchSize) {
            this.flushBatch(entityType, renderType);
            return true;
        }

        return true;
    }

    flushBatch(entityType, renderType) {
        if (!this.batchRenderer || !this.batchRenderer.enabled) return;

        const batch = this.batchRenderer.entityBatches[entityType];
        if (!batch || !batch[renderType] || batch[renderType].length === 0) return;

        // Set up common rendering state for this batch
        this.ctx.save();

        switch (renderType) {
            case 'basic':
                this.renderBasicEnemyBatch(batch[renderType]);
                break;
            case 'projectile':
                this.renderProjectileBatch(batch[renderType]);
                break;
            case 'particle':
                this.renderParticleBatch(batch[renderType]);
                break;
            case 'explosion':
                this.renderExplosionBatch(batch[renderType]);
                break;
        }

        this.ctx.restore();

        // Clear the batch
        batch[renderType] = [];
    }

    flushAllBatches() {
        if (!this.batchRenderer || !this.batchRenderer.enabled) return;

        for (const entityType in this.batchRenderer.entityBatches) {
            const batches = this.batchRenderer.entityBatches[entityType];
            for (const renderType in batches) {
                this.flushBatch(entityType, renderType);
            }
        }
    }

    renderBasicEnemyBatch(enemies) {
        if (!enemies || enemies.length === 0) return;

        // Set common properties for basic enemies
        this.ctx.fillStyle = '#ff4444';
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;

        // Draw all enemies in one pass
        this.ctx.beginPath();
        for (const enemy of enemies) {
            if (this.shouldRender(enemy, 'enemy')) {
                this.ctx.moveTo(enemy.x + enemy.size, enemy.y);
                this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
            }
        }
        this.ctx.fill();
        this.ctx.stroke();
    }

    renderProjectileBatch(projectiles) {
        if (!projectiles || projectiles.length === 0) return;

        // Group projectiles by type for efficient rendering
        const typeGroups = {};
        for (const projectile of projectiles) {
            if (!this.shouldRender(projectile, 'projectile')) continue;

            const type = projectile.type || 'basic';
            if (!typeGroups[type]) {
                typeGroups[type] = [];
            }
            typeGroups[type].push(projectile);
        }

        // Render each type group
        for (const type in typeGroups) {
            this.renderProjectileTypeGroup(type, typeGroups[type]);
        }
    }

    renderProjectileTypeGroup(type, projectiles) {
        switch (type) {
            case 'basic':
                this.ctx.fillStyle = '#00ffff';
                this.ctx.beginPath();
                for (const p of projectiles) {
                    this.ctx.moveTo(p.x + 3, p.y);
                    this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                }
                this.ctx.fill();
                break;

            case 'plasma':
                this.ctx.fillStyle = '#ff00ff';
                this.ctx.beginPath();
                for (const p of projectiles) {
                    this.ctx.moveTo(p.x + 4, p.y);
                    this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                }
                this.ctx.fill();
                break;

            // Add more projectile types as needed
            default:
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                for (const p of projectiles) {
                    this.ctx.moveTo(p.x + 2, p.y);
                    this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                }
                this.ctx.fill();
        }
    }

    renderParticleBatch(particles) {
        if (!particles || particles.length === 0) return;

        // Sort particles by alpha for better blending
        particles.sort((a, b) => (b.alpha || 1) - (a.alpha || 1));

        this.ctx.globalCompositeOperation = 'lighter';

        for (const particle of particles) {
            if (!this.shouldRender(particle, 'particle')) continue;

            this.ctx.globalAlpha = particle.alpha || 1;
            this.ctx.fillStyle = particle.color || '#ffffff';
            this.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
        }

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = 1;
    }

    renderExplosionBatch(explosions) {
        if (!explosions || explosions.length === 0) return;

        for (const explosion of explosions) {
            if (!this.shouldRender(explosion, 'explosion')) continue;

            const progress = 1 - (explosion.life / explosion.maxLife);
            this.ctx.globalAlpha = 1 - progress;

            // Create radial gradient for explosion effect
            const gradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.radius
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, explosion.color || '#ff4400');
            gradient.addColorStop(1, 'transparent');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
    }


    // updateFrameRate() and adjustQuality() are now handled by PerformanceMonitor
    // These methods have been removed as they are replaced by performanceMonitor.update()

    // Dirty Rectangle Rendering System
    addDirtyRectangle(x, y, width, height) {
        // Add buffer around dirty area for proper cleanup
        const buffer = 10;
        this.dirtyRectangles.push({
            x: x - buffer,
            y: y - buffer,
            width: width + buffer * 2,
            height: height + buffer * 2
        });
    }

    mergeDirtyRectangles() {
        if (this.dirtyRectangles.length === 0) return [];

        // Sort rectangles by x position
        this.dirtyRectangles.sort((a, b) => a.x - b.x);

        const merged = [];
        let current = this.dirtyRectangles[0];

        for (let i = 1; i < this.dirtyRectangles.length; i++) {
            const rect = this.dirtyRectangles[i];

            // Check if rectangles overlap or are adjacent
            if (rect.x <= current.x + current.width + 20) { // 20px tolerance for merging
                // Merge rectangles
                const right = Math.max(current.x + current.width, rect.x + rect.width);
                const bottom = Math.max(current.y + current.height, rect.y + rect.height);
                current.x = Math.min(current.x, rect.x);
                current.y = Math.min(current.y, rect.y);
                current.width = right - current.x;
                current.height = bottom - current.y;
            } else {
                merged.push(current);
                current = rect;
            }
        }
        merged.push(current);

        return merged;
    }

    trackEntityMovement(entity, id) {
        // DISABLED: Skip entity tracking for now to improve performance
        // We can re-enable this later once base performance is stable
        return;
    }

    // OffscreenCanvas and Static Element Caching
    initializeOffscreenCanvases() {
        if (!this.canvas) return;

        try {
            // SIMPLIFIED: Only create grid cache for now
            // Skip complex offscreen canvas setup that might cause performance issues

            if (typeof OffscreenCanvas !== 'undefined') {
                this.gridOffscreen = new OffscreenCanvas(this.canvas.width, this.canvas.height);
                this.gridOffscreenCtx = this.gridOffscreen.getContext('2d', {
                    willReadFrequently: false
                });
            } else {
                // Fallback for browsers without OffscreenCanvas
                this.gridOffscreen = document.createElement('canvas');
                this.gridOffscreen.width = this.canvas.width;
                this.gridOffscreen.height = this.canvas.height;
                this.gridOffscreenCtx = this.gridOffscreen.getContext('2d', {
                    willReadFrequently: false
                });
            }

            // Pre-render the grid (but don't block if it fails)
            this.prerenderGrid();

            this.hasOffscreenCanvases = true;


        } catch (e) {
            console.warn('OffscreenCanvas setup failed, using normal rendering:', e);
            this.hasOffscreenCanvases = false;
            this.gridOffscreen = null;
            this.gridOffscreenCtx = null;
        }
    }

    prerenderGrid() {
        if (!this.gridOffscreenCtx) return;

        const ctx = this.gridOffscreenCtx;
        const width = this.gridOffscreen.width;
        const height = this.gridOffscreen.height;

        // Clear the grid canvas
        ctx.clearRect(0, 0, width, height);

        // Render the grid pattern
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        const gridSize = 60;
        const cameraOffsetX = this.camera.x % gridSize;
        const cameraOffsetY = this.camera.y % gridSize;

        // Vertical lines
        for (let x = -cameraOffsetX; x < width + gridSize; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = -cameraOffsetY; y < height + gridSize; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        this.gridCacheValid = true;
    }

    renderCachedBackground() {
        if (!this.hasOffscreenCanvases || !this.gridCacheValid) {
            return false; // Fall back to regular rendering
        }

        // Copy the pre-rendered grid to main canvas
        this.ctx.drawImage(this.gridOffscreen, 0, 0);
        return true;
    }

    // Performance monitoring display (optional debug feature)
    drawPerformanceStats() {
        if (!this.showPerformanceStats) return;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 120);

        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px NeoDunggeunmoPro, monospace';

        const fps = Math.round(this.frameRateMonitor.currentFPS);
        const avgFps = Math.round(this.frameRateMonitor.averageFPS);
        const quality = this.frameRateMonitor.adaptiveQuality;

        this.ctx.fillText(`FPS: ${fps} (avg: ${avgFps})`, 15, 25);
        this.ctx.fillText(`Performance: ${this.performanceMode ? 'LOW' : 'NORMAL'}`, 15, 40);
        this.ctx.fillText(`Particles: ${Math.round(quality.particleCount * 100)}%`, 15, 55);
        this.ctx.fillText(`Effects: ${Math.round(quality.effectQuality * 100)}%`, 15, 70);
        this.ctx.fillText(`Trails: ${Math.round(quality.trailLength * 100)}%`, 15, 85);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 15, 100);
        this.ctx.fillText(`Projectiles: ${this.projectiles.length}`, 15, 115);

        this.ctx.restore();
    }

    drawBossShape(enemy) {
        const shape = enemy.variantShape || 'octagon';
        const radius = enemy.renderRadius || enemy.radius || 40;
        this.ctx.beginPath();

        switch (shape) {
            case 'triangle':
                this.drawRegularPolygon(3, radius);
                break;
            case 'square':
                this.drawRegularPolygon(4, radius);
                break;
            case 'diamond':
                this.ctx.moveTo(0, -radius);
                this.ctx.lineTo(radius, 0);
                this.ctx.lineTo(0, radius);
                this.ctx.lineTo(-radius, 0);
                this.ctx.closePath();
                break;
            case 'hexagon':
                this.drawRegularPolygon(6, radius);
                break;
            case 'pentagon':
                this.drawRegularPolygon(5, radius);
                break;
            case 'star':
                this.drawStarShape(radius);
                break;
            case 'circle':
                this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
                break;
            case 'octagon':
            default:
                this.drawRegularPolygon(8, radius);
                break;
        }

        this.ctx.stroke();
    }

    drawRegularPolygon(sides, radius) {
        const step = (Math.PI * 2) / sides;
        const offset = Math.PI / 2;
        for (let i = 0; i <= sides; i++) {
            const angle = i * step - offset;
            const x = this.fastCos(angle) * radius;
            const y = this.fastSin(angle) * radius;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
    }

    drawStarShape(radius) {
        const spikes = 5;
        const innerRadius = radius * 0.45;
        const step = Math.PI / spikes;
        let rot = Math.PI / 2 * 3;
        this.ctx.moveTo(0, -radius);
        for (let i = 0; i < spikes; i++) {
            let x = this.fastCos(rot) * radius;
            let y = this.fastSin(rot) * radius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = this.fastCos(rot) * innerRadius;
            y = this.fastSin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }
        this.ctx.lineTo(0, -radius);
        this.ctx.closePath();
    }

    // Return projectile to pool
    returnProjectileToPool(projectile) {
        // Phase 9 integration - Use ProjectileSystem for pool management
        projectile.active = false; // Mark inactive for compatibility
        this.projectileSystem.returnToPool(projectile);
    }


    // Performance optimization: Batch canvas state changes
    setCanvasStyle(strokeStyle, lineWidth, shadowBlur = 0, shadowColor = null, fillStyle = null) {
        if (this.ctx.strokeStyle !== strokeStyle) {
            this.ctx.strokeStyle = strokeStyle;
        }
        if (this.ctx.lineWidth !== lineWidth) {
            this.ctx.lineWidth = lineWidth;
        }
        if (this.ctx.shadowBlur !== shadowBlur) {
            this.ctx.shadowBlur = shadowBlur;
        }
        if (shadowColor && this.ctx.shadowColor !== shadowColor) {
            this.ctx.shadowColor = shadowColor;
        }
        if (fillStyle && this.ctx.fillStyle !== fillStyle) {
            this.ctx.fillStyle = fillStyle;
        }
    }

    draw() {
        if (!this.canvas || !this.ctx) return;

        // Temporarily disable canvas layers to fix rendering issues
        this.drawTraditional();
    }

    drawWithLayers() {
        // Clear main canvas (background layer)
        this.drawToLayer('background', (ctx) => {
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        });

        // Draw grid on grid layer (only when needed)
        if (this.canvasLayers.needsGridRedraw) {
            this.clearCanvasLayer('grid');
            this.drawToLayer('grid', (ctx) => {
                ctx.save();
                let shakeX = 0, shakeY = 0;
                if (this.screenShake) {
                    shakeX = this.screenShake.x;
                    shakeY = this.screenShake.y;
                }
                ctx.scale(this.camera.zoom, this.camera.zoom);
                ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);
                this.drawGridToContext(ctx);
                ctx.restore();
            });
            this.canvasLayers.needsGridRedraw = false;
        }

        // Clear and draw entities layer
        this.clearCanvasLayer('entities');
        this.drawToLayer('entities', (ctx) => {
            ctx.save();
            let shakeX = 0, shakeY = 0;
            if (this.screenShake) {
                shakeX = this.screenShake.x;
                shakeY = this.screenShake.y;
            }
            ctx.scale(this.camera.zoom, this.camera.zoom);
            ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

            // Switch context temporarily for drawing functions
            const originalCtx = this.ctx;
            this.ctx = ctx;

            this.drawPlayerWithBatching();
            this.drawEnemiesWithBatching();
            this.drawProjectilesWithBatching();
            this.drawXPOrbs();
            this.drawHPOrbs();
            this.drawHPOrbs();
            this.drawMagnetOrbs();

            // Restore original context
            this.ctx = originalCtx;
            ctx.restore();
        });

        // Clear and draw effects layer
        this.clearCanvasLayer('effects');
        this.drawToLayer('effects', (ctx) => {
            ctx.save();
            let shakeX = 0, shakeY = 0;
            if (this.screenShake) {
                shakeX = this.screenShake.x;
                shakeY = this.screenShake.y;
            }
            ctx.scale(this.camera.zoom, this.camera.zoom);
            ctx.translate(-this.camera.x + shakeX, -this.camera.y + shakeY);

            // Switch context temporarily for drawing functions
            const originalCtx = this.ctx;
            this.ctx = ctx;

            this.drawExplosionsWithBatching();
            this.drawParticlesWithBatching();

            // Restore original context
            this.ctx = originalCtx;
            ctx.restore();
        });

        // Clear and draw UI layer
        this.clearCanvasLayer('ui');
        this.drawToLayer('ui', (ctx) => {
            // Switch context temporarily for drawing functions
            const originalCtx = this.ctx;
            this.ctx = ctx;

            this.drawNotifications();
            this.drawRedFlash();

            // Restore original context
            this.ctx = originalCtx;
        });

        // Flush any remaining batches
        this.flushAllBatches();

        // Mark grid for redraw on camera movement
        if (this.camera && this.camera.lastX !== this.camera.x || this.camera.lastY !== this.camera.y) {
            this.canvasLayers.needsGridRedraw = true;
            this.camera.lastX = this.camera.x;
            this.camera.lastY = this.camera.y;
        }
    }

    drawTraditional() {
        // Fallback to original rendering method
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();

        // Apply screen shake to camera
        let shakeX = 0, shakeY = 0;
        if (this.screenShake) {
            shakeX = this.screenShake.x;
            shakeY = this.screenShake.y;
        }
        this.camera.applyShake(shakeX, shakeY);

        // Apply camera transform
        this.camera.applyTransform(this.ctx);

        this.drawGrid();
        this.drawPlayerWithBatching();
        this.drawEnemiesWithBatching();
        this.drawProjectilesWithBatching();
        this.drawXPOrbs();
        this.drawHPOrbs();
        this.drawMagnetOrbs();
        this.drawChestOrbs();
        this.drawExplosionsWithBatching();
        this.drawParticlesWithBatching();
        this.drawNotifications();

        this.flushAllBatches();

        this.ctx.restore();

        this.drawRedFlash();

        this.dirtyRectangles = [];
    }

    drawRedFlash() {
        // Delegate to EffectsManager
        this.effectsManager.drawRedFlash(this.ctx, this.canvas.width, this.canvas.height);
    }

    renderStartScreenBackground() {
        if (!this.canvas || !this.ctx) return;

        // Only render if canvas has valid dimensions (don't call resizeCanvas to avoid infinite loop)
        if (this.canvas.width > 0 && this.canvas.height > 0) {
            // Clear canvas with dark background
            this.ctx.fillStyle = '#0a0a0a';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw grid without camera transformation (for start screen)
            this.ctx.save();
            this.drawGrid();
            this.ctx.restore();


        } else {
            console.warn(`Cannot render background - invalid canvas dimensions: ${this.canvas.width}x${this.canvas.height}`);
        }
    }

    drawGrid() {
        // Set grid styling with cyan neon color (more visible)
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        this.ctx.lineWidth = 1;

        const gridSize = 60;

        // Calculate visible world area based on camera position - FIXED BOUNDS
        const canvasWidth = this.canvas.width / this.camera.zoom;
        const canvasHeight = this.canvas.height / this.camera.zoom;

        // Calculate grid bounds to FULLY COVER the visible canvas area
        const margin = gridSize * 3; // Extra margin to ensure full coverage
        const startX = Math.floor((this.camera.x - margin) / gridSize) * gridSize;
        const endX = Math.ceil((this.camera.x + canvasWidth + margin) / gridSize) * gridSize;
        const startY = Math.floor((this.camera.y - margin) / gridSize) * gridSize;
        const endY = Math.ceil((this.camera.y + canvasHeight + margin) / gridSize) * gridSize;

        // Draw vertical lines in world coordinates
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        // Draw horizontal lines in world coordinates
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    drawGridToContext(ctx) {
        // Set grid styling with cyan neon color (more visible)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
        ctx.lineWidth = 1;

        const gridSize = 60;

        // Calculate visible world area based on camera position - FIXED BOUNDS
        const canvasWidth = this.canvas.width / this.camera.zoom;
        const canvasHeight = this.canvas.height / this.camera.zoom;

        // Calculate grid bounds to FULLY COVER the visible canvas area
        const margin = gridSize * 3; // Extra margin to ensure full coverage
        const startX = Math.floor((this.camera.x - margin) / gridSize) * gridSize;
        const endX = Math.ceil((this.camera.x + canvasWidth + margin) / gridSize) * gridSize;
        const startY = Math.floor((this.camera.y - margin) / gridSize) * gridSize;
        const endY = Math.ceil((this.camera.y + canvasHeight + margin) / gridSize) * gridSize;

        // Draw vertical lines in world coordinates
        for (let x = startX; x <= endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }

        // Draw horizontal lines in world coordinates
        for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }
    }

    drawPlayerSprite() {
        // Check if sprites are loaded
        if (this.playerSprites.loaded < this.playerSprites.total) {
            // Fallback to neutral circle so loading state keeps native colour scheme
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
            this.ctx.fill();
            console.log('Sprites not loaded yet:', this.playerSprites.loaded, '/', this.playerSprites.total);
            return;
        }

        // Debug: Log once that we're drawing sprites
        if (!this._spriteDebugLogged) {
            console.log('Drawing sprite:', this.player.spriteDirection, 'frame:', this.player.spriteFrame);
            console.log('Sprite dimensions:', this.spriteConfig.frameWidth, 'x', this.spriteConfig.frameHeight);
            console.log('Player object:', this.player);
            this._spriteDebugLogged = true;
        }

        // Calculate frame dimensions if not yet calculated (rounded to prevent sub-pixel issues)
        if (this.spriteConfig.frameWidth === 0) {
            this.spriteConfig.frameWidth = Math.floor(this.playerSprites.idle.width / this.spriteConfig.cols);
            this.spriteConfig.frameHeight = Math.floor(this.playerSprites.idle.height / this.spriteConfig.rows);
        }

        // Animation timing is now handled in updatePlayer() for consistent speed across all devices

        // Calculate sprite sheet position (use Math.floor to prevent sub-pixel bleeding)
        const col = this.player.spriteFrame % this.spriteConfig.cols;
        const row = Math.floor(this.player.spriteFrame / this.spriteConfig.cols);

        // Aggressive inset to prevent bleeding on high-DPI mobile screens
        // Start 2px inside frame boundary and reduce size by 4px total (2px each side)
        const inset = 2;
        const sx = Math.floor(col * this.spriteConfig.frameWidth) + inset;
        const sy = Math.floor(row * this.spriteConfig.frameHeight) + inset;
        const safeFrameWidth = this.spriteConfig.frameWidth - (inset * 2);
        const safeFrameHeight = this.spriteConfig.frameHeight - (inset * 2);

        // Select the appropriate sprite sheet based on direction
        let spriteSheet = this.playerSprites[this.player.spriteDirection];

        // Draw sprite using native asset colours (no tinting filters)
        const spriteSize = this.player.radius * 3; // Bot sprite at 1/4 scale (radius * 2 = 30px)

        // Temporarily disable smoothing to keep pixel art crisp
        const previousSmoothing = this.ctx.imageSmoothingEnabled;
        this.ctx.imageSmoothingEnabled = false;

        this.ctx.save();
        this.ctx.drawImage(
            spriteSheet,
            sx, sy,
            safeFrameWidth,
            safeFrameHeight,
            -spriteSize / 2,
            -spriteSize / 2 - 10,
            spriteSize,
            spriteSize
        );
        this.ctx.restore();

        // Restore smoothing preference for any subsequent draws
        this.ctx.imageSmoothingEnabled = previousSmoothing;
    }

    drawPlayer() {
        this.ctx.save();

        // Sprite direction and animation timing are now handled in updatePlayer() for consistent behavior

        // Draw trail with neon cyan segments (ALWAYS VISIBLE)
        if (this.player.trail.length > 1) {
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.7;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00ffff';

            this.ctx.beginPath();
            this.ctx.moveTo(this.player.trail[0].x, this.player.trail[0].y);
            for (let i = 1; i < this.player.trail.length; i++) {
                const alpha = i / this.player.trail.length;
                this.ctx.globalAlpha = alpha * 0.7;
                this.ctx.lineTo(this.player.trail[i].x, this.player.trail[i].y);
            }
            this.ctx.stroke();
        }

        // Reset for player drawing
        this.ctx.globalAlpha = this.player.invulnerable > 0 ? 0.5 : 1;

        // Draw HP bar above player
        this.ctx.save();

        // HP bar positioning and styling
        const hpBarWidth = 30;
        const hpBarHeight = 4;
        const hpBarOffset = 25; // Distance above player

        // HP bar background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(
            this.player.x - hpBarWidth / 2,
            this.player.y - hpBarOffset,
            hpBarWidth,
            hpBarHeight
        );

        // HP bar border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            this.player.x - hpBarWidth / 2,
            this.player.y - hpBarOffset,
            hpBarWidth,
            hpBarHeight
        );

        // HP bar fill
        const healthPercent = this.player.health / this.player.maxHealth;
        const fillWidth = hpBarWidth * healthPercent;

        // Color based on health level
        let fillColor = '#00ff00'; // Green for high health
        if (healthPercent < 0.6) fillColor = '#ffff00'; // Yellow for medium health
        if (healthPercent < 0.3) fillColor = '#ff0000'; // Red for low health

        this.ctx.fillStyle = fillColor;
        this.ctx.shadowBlur = 2;
        this.ctx.shadowColor = fillColor;
        this.ctx.fillRect(
            this.player.x - hpBarWidth / 2,
            this.player.y - hpBarOffset,
            fillWidth,
            hpBarHeight
        );

        this.ctx.restore();

        // Draw sprite player
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);

        // Draw the animated sprite
        this.drawPlayerSprite();

        this.ctx.restore();
        this.ctx.restore();
    }

    drawEnemies() {
        if (this.enemies.length === 0) return;

        // Batch enemies by behavior type to reduce context state changes
        const enemiesByType = {};

        for (const enemy of this.enemies) {
            // Skip defeated enemies (boss during defeat animation)
            if (enemy.isDefeated) {
                continue;
            }

            // Enhanced frustum culling: Skip enemies that shouldn't be rendered
            if (!this.shouldRender(enemy, 'enemy')) {
                continue;
            }

            if (!enemiesByType[enemy.behavior]) {
                enemiesByType[enemy.behavior] = [];
            }
            enemiesByType[enemy.behavior].push(enemy);
        }

        this.ctx.save();

        // Render basic enemies with simplified visuals - FIXED BEHAVIOR NAMES
        const basicTypes = ['chase', 'dodge', 'fly', 'teleport']; // Updated to match actual behavior values
        for (const type of basicTypes) {
            const enemies = enemiesByType[type];
            if (!enemies) continue;

            for (const enemy of enemies) {
                this.ctx.save();
                this.ctx.translate(enemy.x, enemy.y);

                const r = enemy.radius || 15;
                const color = enemy.variantColor || enemy.color || '#00ffff';
                const shape = enemy.variantShape || 'circle';

                // Draw body shape with rotation
                this.ctx.save();
                this.ctx.rotate(enemy.angle || 0);
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();

                const drawPolygon = (sides, rotation = 0) => {
                    for (let i = 0; i < sides; i++) {
                        const angle = rotation + (Math.PI * 2 * i) / sides;
                        const px = Math.cos(angle) * r;
                        const py = Math.sin(angle) * r;
                        if (i === 0) {
                            this.ctx.moveTo(px, py);
                        } else {
                            this.ctx.lineTo(px, py);
                        }
                    }
                    this.ctx.closePath();
                };

                switch (shape) {
                    case 'triangle':
                        drawPolygon(3, -Math.PI / 2);
                        break;
                    case 'diamond':
                        drawPolygon(4, Math.PI / 4);
                        break;
                    case 'square':
                        drawPolygon(4, 0);
                        break;
                    case 'pentagon':
                        drawPolygon(5, -Math.PI / 2);
                        break;
                    case 'hex':
                        drawPolygon(6, Math.PI / 6);
                        break;
                    case 'chevron':
                        this.ctx.moveTo(-r * 0.8, -r * 0.2);
                        this.ctx.lineTo(0, r * 0.8);
                        this.ctx.lineTo(r * 0.8, -r * 0.2);
                        break;
                    case 'star': {
                        const points = 5;
                        const innerR = r * 0.5;
                        for (let i = 0; i < points * 2; i++) {
                            const angle = -Math.PI / 2 + (Math.PI * i) / points;
                            const radius = i % 2 === 0 ? r : innerR;
                            const px = Math.cos(angle) * radius;
                            const py = Math.sin(angle) * radius;
                            if (i === 0) {
                                this.ctx.moveTo(px, py);
                            } else {
                                this.ctx.lineTo(px, py);
                            }
                        }
                        this.ctx.closePath();
                        break;
                    }
                    default:
                        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
                        break;
                }
                this.ctx.stroke();

                // Cross overlay for readability
                this.ctx.strokeStyle = color + '80';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(-r * 0.7, 0);
                this.ctx.lineTo(r * 0.7, 0);
                this.ctx.moveTo(0, -r * 0.7);
                this.ctx.lineTo(0, r * 0.7);
                this.ctx.stroke();
                this.ctx.restore();

                // Health bar (always show when damaged)
                if (enemy.health < enemy.maxHealth) {
                    const barWidth = r * 1.5;
                    const barHeight = 2;
                    const healthPercent = enemy.health / enemy.maxHealth;

                    this.ctx.fillStyle = '#333';
                    this.ctx.fillRect(-barWidth / 2, -r - 6, barWidth, barHeight);

                    this.ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
                    this.ctx.fillRect(-barWidth / 2, -r - 6, barWidth * healthPercent, barHeight);
                }

                this.ctx.restore();
            }
        }

        // Render special enemies with more detail
        const specialTypes = ['tank', 'boss'];
        for (const type of specialTypes) {
            const enemies = enemiesByType[type];
            if (!enemies) continue;

            for (const enemy of enemies) {
                this.ctx.save();
                this.ctx.translate(enemy.x, enemy.y);

                // Apply rotation only for tank and boss
                if (type === 'tank' || type === 'boss') {
                    this.ctx.rotate(enemy.angle || 0);
                }

                // Add glow effect for boss like player has
                if (type === 'boss') {
                    // Scale glow based on boss level for higher level bosses
                    const bossLevel = enemy.bossLevel || 1;
                    const glowMultiplier = this.fastPow(1.1, bossLevel - 1); // Scale glow with boss level
                    const baseGlowSize = 60 * glowMultiplier;
                    const glowSize = baseGlowSize + this.fastSin(Date.now() * 0.008) * (20 * glowMultiplier);

                    // Increase glow intensity for higher level bosses
                    const glowIntensity = Math.min(0.6, 0.4 + (bossLevel - 1) * 0.02);

                    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                    gradient.addColorStop(0, `rgba(255, 0, 255, ${glowIntensity})`); // Magenta glow
                    gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');

                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
                }

                this.ctx.strokeStyle = enemy.color || '#ff00ff';
                this.ctx.lineWidth = type === 'boss' ? 3 : 2;

                switch (type) {
                    case 'tank':
                        // Variant shapes (default square)
                        const r = enemy.radius || 20;
                        const tankShape = enemy.variantShape || 'square';
                        const tankColor = enemy.variantColor || enemy.color || '#ff00ff';
                        this.ctx.strokeStyle = tankColor;
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        if (tankShape === 'hex') {
                            for (let i = 0; i < 6; i++) {
                                const angle = Math.PI / 6 + (Math.PI * 2 * i) / 6;
                                const px = Math.cos(angle) * r;
                                const py = Math.sin(angle) * r;
                                if (i === 0) this.ctx.moveTo(px, py); else this.ctx.lineTo(px, py);
                            }
                            this.ctx.closePath();
                            this.ctx.stroke();
                        } else {
                            this.ctx.strokeRect(-r, -r, r * 2, r * 2);
                        }

                        // Grid pattern
                        this.ctx.strokeStyle = (tankColor) + '60';
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(-r, 0);
                        this.ctx.lineTo(r, 0);
                        this.ctx.moveTo(0, -r);
                        this.ctx.lineTo(0, r);
                        this.ctx.stroke();
                        break;

                    case 'boss':
                        const rb = enemy.renderRadius || enemy.radius || 40;
                        this.drawBossShape(enemy);

                        // Inner cross pattern with reduced shadow for inner details
                        const originalShadowBlur = this.ctx.shadowBlur;
                        this.ctx.shadowBlur = 15; // Reduced shadow for inner pattern
                        this.ctx.strokeStyle = (enemy.color || '#ff00ff') + '80';
                        this.ctx.lineWidth = 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(-rb * 0.7, -rb * 0.7);
                        this.ctx.lineTo(rb * 0.7, rb * 0.7);
                        this.ctx.moveTo(-rb * 0.7, rb * 0.7);
                        this.ctx.lineTo(rb * 0.7, -rb * 0.7);
                        this.ctx.stroke();
                        this.ctx.shadowBlur = originalShadowBlur;

                        // Reset alpha after boss drawing is complete
                        this.ctx.globalAlpha = 1.0;
                        break;
                }

                // Health bar for special enemies
                if (enemy.health < enemy.maxHealth) {
                    const barWidth = (enemy.renderRadius || enemy.radius || 20) * 2;
                    const barHeight = 3;
                    const healthPercent = enemy.health / enemy.maxHealth;

                    this.ctx.fillStyle = '#333';
                    this.ctx.fillRect(-barWidth / 2, -(enemy.renderRadius || enemy.radius || 20) - 8, barWidth, barHeight);

                    this.ctx.fillStyle = healthPercent > 0.5 ? '#0f0' : healthPercent > 0.25 ? '#ff0' : '#f00';
                    this.ctx.fillRect(-barWidth / 2, -(enemy.renderRadius || enemy.radius || 20) - 8, barWidth * healthPercent, barHeight);
                }

                this.ctx.restore();
            }
        }

        this.ctx.restore();
    }

    drawProjectiles() {
        if (this.projectiles.length === 0) return;

        // Batch projectiles by type to reduce state changes
        const projectilesByType = {};

        for (const projectile of this.projectiles) {
            // Enhanced frustum culling: Skip projectiles that shouldn't be rendered
            if (!this.shouldRender(projectile, 'projectile')) {
                continue;
            }

            if (!projectilesByType[projectile.type]) {
                projectilesByType[projectile.type] = [];
            }
            projectilesByType[projectile.type].push(projectile);
        }

        // Render batched projectiles
        this.ctx.save();

        // Render basic/spread/shotgun/gatling_gun projectiles together (simple circles)
        const basicTypes = ['basic', 'spread', 'shotgun', 'gatling_gun'];
        for (const type of basicTypes) {
            const projectiles = projectilesByType[type];
            if (!projectiles) continue;

            this.ctx.beginPath();
            for (const projectile of projectiles) {
                this.ctx.fillStyle = projectile.color;
                this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
            }
        }

        // Render laser/railgun projectiles (lines)
        const laserTypes = ['laser', 'railgun'];
        for (const type of laserTypes) {
            const projectiles = projectilesByType[type];
            if (!projectiles) continue;

            this.ctx.globalAlpha = 0.8;
            this.ctx.beginPath();
            for (const projectile of projectiles) {
                this.ctx.strokeStyle = projectile.color;
                this.ctx.lineWidth = projectile.size;
                this.ctx.moveTo(projectile.x - projectile.vx * 3, projectile.y - projectile.vy * 3);
                this.ctx.lineTo(projectile.x, projectile.y);
                this.ctx.stroke();
            }
            this.ctx.globalAlpha = 1;
        }

        // Render homing laser projectiles (special curved beams)
        const homingLasers = projectilesByType['homing_laser'];
        if (homingLasers) {
            for (const projectile of homingLasers) {
                this.ctx.globalAlpha = 0.9;

                // Draw outer glow
                this.ctx.strokeStyle = projectile.color;
                this.ctx.lineWidth = projectile.size + 2;
                this.ctx.shadowColor = projectile.color;
                this.ctx.shadowBlur = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(projectile.x - projectile.vx * 4, projectile.y - projectile.vy * 4);
                this.ctx.lineTo(projectile.x, projectile.y);
                this.ctx.stroke();

                // Draw inner core
                this.ctx.shadowBlur = 0;
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = Math.max(1, projectile.size - 2);
                this.ctx.beginPath();
                this.ctx.moveTo(projectile.x - projectile.vx * 4, projectile.y - projectile.vy * 4);
                this.ctx.lineTo(projectile.x, projectile.y);
                this.ctx.stroke();

                // Draw trail particles for homing effect
                if (Math.random() < 0.3) {
                    this.ctx.fillStyle = projectile.color;
                    this.ctx.globalAlpha = 0.6;
                    this.ctx.beginPath();
                    this.ctx.arc(
                        projectile.x - projectile.vx * (2 + Math.random() * 6),
                        projectile.y - projectile.vy * (2 + Math.random() * 6),
                        1 + Math.random() * 2,
                        0,
                        2 * Math.PI
                    );
                    this.ctx.fill();
                }

                this.ctx.globalAlpha = 1;
            }
        }

        // Render complex projectiles individually (plasma, flame, lightning, missiles)
        const complexTypes = ['plasma', 'flame', 'lightning', 'missile', 'boss-missile', 'shockburst'];
        for (const type of complexTypes) {
            const projectiles = projectilesByType[type];
            if (!projectiles || projectiles.length === 0) continue;

            // Extra safety: Ensure consistent rendering context for each weapon type
            this.ctx.save();

            for (const projectile of projectiles) {
                // Individual projectile context save/restore for isolation
                this.ctx.save();

                switch (type) {
                    case 'plasma':
                        // Simplified plasma effect for performance
                        this.ctx.fillStyle = projectile.color;
                        this.ctx.globalAlpha = 0.7;
                        this.ctx.beginPath();
                        this.ctx.arc(projectile.x, projectile.y, projectile.size * 1.5, 0, Math.PI * 2);
                        this.ctx.fill();

                        this.ctx.globalAlpha = 1;
                        this.ctx.beginPath();
                        this.ctx.arc(projectile.x, projectile.y, projectile.size, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;

                    case 'flame':
                        this.ctx.fillStyle = projectile.color;
                        this.ctx.globalAlpha = 0.7;
                        // Simplified flame - reduce from 3 to 1 circle for performance
                        const x = projectile.x + (Math.random() - 0.5) * 3;
                        const y = projectile.y + (Math.random() - 0.5) * 3;
                        this.ctx.beginPath();
                        this.ctx.arc(x, y, projectile.size + Math.random(), 0, Math.PI * 2);
                        this.ctx.fill();
                        break;

                    case 'lightning':
                        this.ctx.strokeStyle = projectile.color;
                        this.ctx.lineWidth = 2;
                        this.ctx.globalAlpha = Math.max(0.1, projectile.life / 30);

                        // Render lightning chains to all targets
                        if (projectile.chainTargets && projectile.chainTargets.length > 0) {
                            let prevX = projectile.x;
                            let prevY = projectile.y;

                            // Draw line to each chained enemy
                            projectile.chainTargets.forEach(target => {
                                this.ctx.beginPath();
                                this.ctx.moveTo(prevX, prevY);

                                // Simplified lightning with fewer steps for performance
                                const steps = 3;
                                for (let i = 1; i <= steps; i++) {
                                    const progress = i / steps;
                                    const x = prevX + (target.x - prevX) * progress + (Math.random() - 0.5) * 10;
                                    const y = prevY + (target.y - prevY) * progress + (Math.random() - 0.5) * 10;
                                    this.ctx.lineTo(x, y);
                                }
                                this.ctx.stroke();

                                // Update previous position for next chain segment
                                prevX = target.x;
                                prevY = target.y;
                            });
                        } else {
                            // Fallback to original single-target rendering
                            this.ctx.beginPath();
                            this.ctx.moveTo(projectile.x, projectile.y);
                            const steps = 3;
                            for (let i = 1; i <= steps; i++) {
                                const progress = i / steps;
                                const x = projectile.x + (projectile.targetX - projectile.x) * progress + (Math.random() - 0.5) * 10;
                                const y = projectile.y + (projectile.targetY - projectile.y) * progress + (Math.random() - 0.5) * 10;
                                this.ctx.lineTo(x, y);
                            }
                            this.ctx.stroke();
                        }
                        break;

                    case 'shockburst':
                        // Simple rendering like lightning but cyan color

                        this.ctx.strokeStyle = '#00FFFF'; // Cyan color
                        this.ctx.lineWidth = 2;
                        this.ctx.globalAlpha = Math.max(0.1, projectile.life / 30);

                        // Render shockburst chains to all targets (same as lightning)
                        if (projectile.chainTargets && projectile.chainTargets.length > 0) {
                            let prevX = projectile.x;
                            let prevY = projectile.y;

                            // Draw line to each chained enemy
                            projectile.chainTargets.forEach((target, targetIndex) => {
                                this.ctx.beginPath();
                                this.ctx.moveTo(prevX, prevY);

                                // Simplified lightning with fewer steps for performance
                                const steps = 3;
                                for (let i = 1; i <= steps; i++) {
                                    const progress = i / steps;
                                    const x = prevX + (target.x - prevX) * progress + (Math.random() - 0.5) * 10;
                                    const y = prevY + (target.y - prevY) * progress + (Math.random() - 0.5) * 10;
                                    this.ctx.lineTo(x, y);
                                }
                                this.ctx.stroke();

                                // Add explosion visual effect at each chain target
                                const explosionRadius = 100; // Explosion radius for visuals
                                const explosionAlpha = Math.max(0.1, projectile.life / 30) * 0.6; // Slightly transparent

                                // Draw explosion ring
                                this.ctx.globalAlpha = explosionAlpha;
                                this.ctx.strokeStyle = '#00FFFF'; // Cyan explosion
                                this.ctx.lineWidth = 1;
                                this.ctx.beginPath();
                                this.ctx.arc(target.x, target.y, explosionRadius * (1 - projectile.life / 30), 0, Math.PI * 2);
                                this.ctx.stroke();

                                // Draw inner explosion pulse
                                this.ctx.globalAlpha = explosionAlpha * 1.5;
                                this.ctx.lineWidth = 0.5;
                                this.ctx.beginPath();
                                this.ctx.arc(target.x, target.y, (explosionRadius * 0.6) * (1 - projectile.life / 30), 0, Math.PI * 2);
                                this.ctx.stroke();

                                // Reset for next chain
                                this.ctx.strokeStyle = '#00FFFF';
                                this.ctx.lineWidth = 2;
                                this.ctx.globalAlpha = Math.max(0.1, projectile.life / 30);

                                // Update previous position for next chain segment
                                prevX = target.x;
                                prevY = target.y;
                            });
                        } else {
                            // Fallback to original single-target rendering
                            this.ctx.beginPath();
                            this.ctx.moveTo(projectile.x, projectile.y);
                            const steps = 3;
                            for (let i = 1; i <= steps; i++) {
                                const progress = i / steps;
                                const x = projectile.x + (projectile.targetX - projectile.x) * progress + (Math.random() - 0.5) * 10;
                                const y = projectile.y + (projectile.targetY - projectile.y) * progress + (Math.random() - 0.5) * 10;
                                this.ctx.lineTo(x, y);
                            }
                            this.ctx.stroke();
                        }
                        break;

                    case 'missile':
                        this.ctx.translate(projectile.x, projectile.y);
                        this.ctx.rotate(Math.atan2(projectile.vy, projectile.vx));

                        // Missile body
                        this.ctx.fillStyle = projectile.color;
                        this.ctx.fillRect(-6, -2, 12, 4);

                        // Missile tip
                        this.ctx.fillStyle = '#FF6B35';
                        this.ctx.beginPath();
                        this.ctx.moveTo(6, 0);
                        this.ctx.lineTo(3, -2);
                        this.ctx.lineTo(3, 2);
                        this.ctx.closePath();
                        this.ctx.fill();

                        // Simplified exhaust trail
                        this.ctx.fillStyle = '#FF4444';
                        this.ctx.globalAlpha = 0.6;
                        this.ctx.fillRect(-9, -1, 3, 2);
                        break;

                    case 'boss-missile':
                        if (projectile.isMine) {
                            const pulsePhase = (projectile.pulseOffset || 0) + (this.frameCount * 0.08);
                            const pulseScale = 1.2 + Math.sin(pulsePhase) * 0.2;
                            const baseSize = projectile.size || 6;
                            const radius = baseSize * pulseScale;

                            // Outer glow
                            this.ctx.globalAlpha = 0.6;
                            this.ctx.fillStyle = projectile.color || '#7B2CBF';
                            this.ctx.shadowColor = projectile.color || '#7B2CBF';
                            this.ctx.shadowBlur = 15;
                            this.ctx.beginPath();
                            this.ctx.arc(projectile.x, projectile.y, radius, 0, Math.PI * 2);
                            this.ctx.fill();

                            // Inner core
                            this.ctx.shadowBlur = 0;
                            this.ctx.globalAlpha = 0.9;
                            this.ctx.fillStyle = '#FFFFFF';
                            this.ctx.beginPath();
                            this.ctx.arc(projectile.x, projectile.y, baseSize * 0.5, 0, Math.PI * 2);
                            this.ctx.fill();

                            // Warning ring showing detonation radius
                            if (projectile.explosionRadius) {
                                this.ctx.globalAlpha = 0.35;
                                this.ctx.strokeStyle = projectile.color || '#7B2CBF';
                                this.ctx.lineWidth = 2;
                                this.ctx.setLineDash([4, 6]);
                                this.ctx.beginPath();
                                this.ctx.arc(projectile.x, projectile.y, projectile.explosionRadius * 0.6, 0, Math.PI * 2);
                                this.ctx.stroke();
                                this.ctx.setLineDash([]);
                            }

                            this.ctx.globalAlpha = 1;
                        } else {
                            this.ctx.translate(projectile.x, projectile.y);
                            this.ctx.rotate(Math.atan2(projectile.vy, projectile.vx));

                            // Boss missile body
                            this.ctx.fillStyle = projectile.color;
                            this.ctx.fillRect(-8, -3, 16, 6);

                            // Boss missile tip
                            this.ctx.fillStyle = '#FF0000';
                            this.ctx.beginPath();
                            this.ctx.moveTo(8, 0);
                            this.ctx.lineTo(4, -3);
                            this.ctx.lineTo(4, 3);
                            this.ctx.closePath();
                            this.ctx.fill();

                            // Simplified exhaust trail
                            this.ctx.fillStyle = '#FF0066';
                            this.ctx.globalAlpha = 0.8;
                            this.ctx.fillRect(-12, -2, 4, 4);
                        }
                        break;
                }

                // Force context restore for each projectile
                this.ctx.restore();
            }

            // Type-level context restore for safety
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawXPOrbs() {
        this.xpOrbs.forEach(orb => {
            // Enhanced frustum culling: Skip XP orbs that shouldn't be rendered
            if (!this.shouldRender(orb, 'xp')) {
                return; // Skip rendering this orb
            }
            this.ctx.save();

            // Glow effect
            const glowIntensity = 0.5 + this.fastSin(orb.glow) * 0.3;
            const gradient = this.ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 15);
            gradient.addColorStop(0, `rgba(0, 255, 255, ${glowIntensity})`);
            gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(orb.x - 15, orb.y - 15, 30, 30);

            // Orb body
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();

            this.ctx.restore();
        });
    }

    drawHPOrbs() {
        this.hpOrbs.forEach(orb => {
            // Always show hint when active, even if the orb is visible
            this.drawPickupHint(orb, '#FF5555');

            // Enhanced frustum culling: Skip HP orbs that shouldn't be rendered
            if (!this.shouldRender(orb, 'hp')) {
                return; // Skip entirely if far outside range
            }
            this.ctx.save();

            // Glow effect - red neon
            const glowIntensity = 0.6 + this.fastSin(orb.glow) * 0.4;
            const gradient = this.ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 20);
            gradient.addColorStop(0, `rgba(255, 0, 0, ${glowIntensity})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(orb.x - 20, orb.y - 20, 40, 40);

            // Health icon
            const iconSize = 32;
            if (this.itemIcons.health.complete) {
                this.ctx.drawImage(
                    this.itemIcons.health,
                    orb.x - iconSize / 2,
                    orb.y - iconSize / 2,
                    iconSize,
                    iconSize
                );
            }

            this.ctx.restore();
        });
    }

    drawMagnetOrbs() {
        // Removed excessive drawing logging
        this.magnetOrbs.forEach(orb => {
            // Always show hint when active, even if the orb is visible
            this.drawPickupHint(orb, '#6C63FF');

            // Enhanced frustum culling: Skip magnet orbs that shouldn't be rendered
            if (!this.shouldRender(orb, 'magnet')) {
                return; // Skip entirely if far outside range
            }
            this.ctx.save();

            // Glow effect - subtle blue/purple neon for magnet
            const glowIntensity = 0.4 + this.fastSin(orb.glow) * 0.3;
            const gradient = this.ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, 25);
            gradient.addColorStop(0, `rgba(0, 100, 255, ${glowIntensity * 0.3})`); // Much more subtle
            gradient.addColorStop(1, 'rgba(100, 0, 255, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(orb.x - 25, orb.y - 25, 50, 50);

            // Magnet icon
            const iconSize = 32;
            if (this.itemIcons.magnet.complete) {
                this.ctx.drawImage(
                    this.itemIcons.magnet,
                    orb.x - iconSize / 2,
                    orb.y - iconSize / 2,
                    iconSize,
                    iconSize
                );
            }

            this.ctx.restore();
        });
    }

    drawChestOrbs() {
        this.chestOrbs.forEach(orb => {
            // Always show gold arrow hint when active
            this.drawPickupHint(orb, '#FFD700');

            // Enhanced frustum culling: Skip chest orbs that shouldn't be rendered
            if (!this.shouldRender(orb, 'chest')) {
                return; // Skip entirely if far outside range
            }
            this.ctx.save();

            // Upgrade box icon (static, no glow or rotation) - 64px (twice as large)
            const iconSize = 64;
            if (this.itemIcons.upgradeBox && this.itemIcons.upgradeBox.complete) {
                this.ctx.drawImage(
                    this.itemIcons.upgradeBox,
                    orb.x - iconSize / 2,
                    orb.y - iconSize / 2,
                    iconSize,
                    iconSize
                );
            }

            this.ctx.restore();
        });
    }

    drawPickupHint(target, color) {
        if (!target?.hintVisible || !this.player || !this.ctx) {
            return;
        }

        // Avoid hint if we're already very close (naturally visible)
        const dx = target.x - this.player.x;
        const dy = target.y - this.player.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < 2000) {
            return;
        }

        const distance = Math.sqrt(distanceSquared) || 1;
        const arrowDistance = 90;
        const arrowX = this.player.x + (dx / distance) * arrowDistance;
        const arrowY = this.player.y + (dy / distance) * arrowDistance;
        const duration = this.pickupSystem?.pickupHintDuration || 1;
        const alphaBase = Math.min(1, (target.hintFramesRemaining || 0) / duration);
        const alpha = 0.25 + 0.5 * alphaBase;

        this.ctx.save();
        this.ctx.translate(arrowX, arrowY);
        this.ctx.rotate(Math.atan2(dy, dx));
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(16, 0);
        this.ctx.lineTo(-10, 7);
        this.ctx.lineTo(-10, -7);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawExplosions() {
        if (!this.explosions) return;

        this.explosions.forEach(explosion => {
            // Enhanced frustum culling: Skip explosions that shouldn't be rendered
            if (!this.shouldRender(explosion, 'effect')) return;
            if (!this.isInViewport(explosion.x, explosion.y, explosion.maxRadius)) {
                return;
            }

            this.ctx.save();

            // Calculate explosion progress and alpha
            const progress = 1 - (explosion.life / explosion.maxLife);
            const alpha = 1 - progress; // Fade out as explosion progresses

            // Create radial gradient for explosion effect
            const gradient = this.ctx.createRadialGradient(
                explosion.x, explosion.y, 0,
                explosion.x, explosion.y, explosion.radius
            );

            // Color transitions from bright orange to red to transparent
            if (progress < 0.3) {
                gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`); // Bright yellow center
                gradient.addColorStop(0.5, `rgba(255, 140, 0, ${alpha * 0.8})`); // Orange
                gradient.addColorStop(1, `rgba(255, 69, 0, ${alpha * 0.4})`); // Red-orange edge
            } else if (progress < 0.7) {
                gradient.addColorStop(0, `rgba(255, 140, 0, ${alpha})`); // Orange center
                gradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha * 0.8})`); // Red-orange
                gradient.addColorStop(1, `rgba(128, 0, 0, ${alpha * 0.3})`); // Dark red edge
            } else {
                gradient.addColorStop(0, `rgba(255, 69, 0, ${alpha})`); // Red-orange center
                gradient.addColorStop(0.7, `rgba(128, 0, 0, ${alpha * 0.5})`); // Dark red
                gradient.addColorStop(1, `rgba(64, 0, 0, ${alpha * 0.2})`); // Very dark red edge
            }

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    drawParticles() {
        if (this.particles.length === 0) return;

        const quality = this.frameRateMonitor.adaptiveQuality;

        // Enhanced frustum culling: Pre-filter particles aggressively
        const visibleParticles = [];
        for (const particle of this.particles) {
            if (this.shouldRender(particle, 'particle')) {
                visibleParticles.push(particle);
            }
        }

        // Early exit if no visible particles
        if (visibleParticles.length === 0) return;

        // Use simpler rendering for better performance
        if (quality.effectQuality < 0.6) {
            // Ultra-fast particle rendering - single color, no alpha blending
            this.ctx.save();
            this.ctx.fillStyle = '#00ffff';

            for (const particle of visibleParticles) {
                // Simple rectangle instead of circle for speed
                const size = particle.size * (particle.life / particle.maxLife);
                this.ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
            }
            this.ctx.restore();
            return;
        }

        // Batch particles by color to reduce state changes (medium quality)
        const particlesByColor = {};

        for (const particle of visibleParticles) {
            // Quantize colors to reduce the number of batches
            let batchColor = particle.color;
            if (quality.effectQuality < 0.8) {
                // Simplify to primary colors for batching
                if (particle.color.includes('ff6') || particle.color.includes('FF6')) batchColor = '#ff6600';
                else if (particle.color.includes('ff9') || particle.color.includes('FF9')) batchColor = '#ff9900';
                else if (particle.color.includes('ffc') || particle.color.includes('FFC')) batchColor = '#ffcc00';
                else batchColor = '#00ffff'; // Default cyan
            }

            if (!particlesByColor[batchColor]) {
                particlesByColor[batchColor] = [];
            }
            particlesByColor[batchColor].push(particle);
        }

        // Render batched particles with minimal alpha blending
        this.ctx.save();

        for (const color in particlesByColor) {
            const particles = particlesByColor[color];
            this.ctx.fillStyle = color;

            if (quality.effectQuality > 0.8) {
                // High quality - individual alpha per particle
                for (const particle of particles) {
                    const alpha = (particle.life / particle.maxLife) * 0.8;
                    this.ctx.globalAlpha = alpha;
                    const size = particle.size * alpha;

                    // Use rectangles instead of circles for performance
                    this.ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
                }
            } else {
                // Medium quality - batched alpha, simpler shapes
                this.ctx.globalAlpha = 0.7;

                // Draw all particles of this color at once
                for (const particle of particles) {
                    const lifeFactor = particle.life / particle.maxLife;
                    const size = particle.size * lifeFactor;

                    // Simple filled rectangles for speed
                    this.ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
                }
            }
        }

        this.ctx.restore();
    }

    drawNotifications() {
        // Notifications are now handled by DOM-based toast system
        // This method is kept for compatibility but does nothing
    }

    // =====================
    // BATCHED DRAWING FUNCTIONS
    // =====================

    drawPlayerWithBatching() {
        // Player is unique, so just draw normally
        this.drawPlayer();
    }

    drawEnemiesWithBatching() {
        if (!this.enemies || this.enemies.length === 0) return;

        // Fallback to traditional enemy drawing for now
        this.drawEnemies();
    }

    drawProjectilesWithBatching() {
        if (!this.projectiles || this.projectiles.length === 0) return;

        // Fallback to traditional projectile drawing for now
        this.drawProjectiles();
    }

    drawExplosionsWithBatching() {
        // Delegate to ParticleSystem
        this.particleSystem.drawExplosions(this.ctx, this.camera, this.canvas.width, this.canvas.height);
    }

    drawParticlesWithBatching() {
        // Delegate to ParticleSystem
        this.particleSystem.drawParticles(this.ctx, this.camera, this.canvas.width, this.canvas.height);
    }

    // Fallback individual rendering functions
    drawIndividualEnemy(enemy) {
        this.ctx.save();

        // Basic enemy rendering (simplified from original drawEnemies)
        if (enemy.type === 'boss') {
            // Boss rendering
            this.ctx.fillStyle = '#ff0000';
            this.ctx.strokeStyle = '#ffaa00';
            this.ctx.lineWidth = 4;
        } else {
            // Normal enemy rendering
            this.ctx.fillStyle = '#ff4444';
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
        }

        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawIndividualProjectile(projectile) {
        this.ctx.save();

        // Basic projectile rendering
        switch (projectile.type) {
            case 'plasma':
                this.ctx.fillStyle = '#ff00ff';
                this.ctx.shadowColor = '#ff00ff';
                this.ctx.shadowBlur = 10;
                break;
            case 'laser':
                this.ctx.strokeStyle = '#00ff00';
                this.ctx.lineWidth = 2;
                this.ctx.shadowColor = '#00ff00';
                this.ctx.shadowBlur = 5;
                break;
            default:
                this.ctx.fillStyle = '#00ffff';
                this.ctx.shadowColor = '#00ffff';
                this.ctx.shadowBlur = 5;
        }

        if (projectile.type === 'laser') {
            this.ctx.beginPath();
            this.ctx.moveTo(projectile.x - 10, projectile.y);
            this.ctx.lineTo(projectile.x + 10, projectile.y);
            this.ctx.stroke();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, projectile.size || 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawIndividualExplosion(explosion) {
        this.ctx.save();

        const progress = 1 - (explosion.life / explosion.maxLife);
        this.ctx.globalAlpha = 1 - progress;

        const gradient = this.ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, explosion.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, explosion.color || '#ff4400');
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawIndividualParticle(particle) {
        this.ctx.save();

        this.ctx.globalAlpha = particle.alpha || 1;
        this.ctx.fillStyle = particle.color || '#ffffff';
        this.ctx.shadowColor = particle.color || '#ffffff';
        this.ctx.shadowBlur = 3;

        this.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);

        this.ctx.restore();
    }

    updateUI() {
        // Phase 12c integration - Delegate to HUDSystem
        this.hudSystem.updateAll(
            {
                player: this.player,
                weapons: this.weapons,
                game: {
                    gameTime: this.gameTime,
                    bossesKilled: this.bossesKilled,
                    maxWeaponSlots: this.getMaxWeapons()
                }
            },
            this.getWeaponIconForHeader.bind(this),
            this.getWeaponName.bind(this),
            this.getPassiveIconForHeader.bind(this)
        );

        // Phase 12c.12 - Update touch controls visual position
        if (this.touchControls && this.touchControls.joystick.active) {
            const maxDistance = 50;
            const normalizedX = this.touchControls.joystick.moveX / maxDistance;
            const normalizedY = this.touchControls.joystick.moveY / maxDistance;
            this.touchControlsUI.updateJoystick(normalizedX, normalizedY);
        } else if (this.touchControls) {
            this.touchControlsUI.updateJoystick(null, null);
        }
    }

    gameOver() {
        this.gameRunning = false;

        // Hide pause button during game over
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.style.display = 'none';
        }

        // Hide help button during game over
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.style.display = 'none';
        }
    }

    generateWeaponsSection() {
        if (this.weapons.length === 0) return '';

        const t = this.translations[this.currentLanguage].ui;

        const weaponIconMap = {
            'basic': 'basicMissile',
            'rapid': 'rapidFire',
            'spread': 'spreadShot',
            'spread_shot': 'spreadShot',
            'laser': 'laserBeam',
            'plasma': 'plasmaBolt',
            'shotgun': 'shotgun',
            'lightning': 'lightning',
            'flamethrower': 'flamethrower',
            'railgun': 'railgun',
            'missiles': 'homingMissiles',
            'homing_laser': 'homingLaser',
            'shockburst': 'shockburst',
            'gatling_gun': 'gatlingGun'
        };

        const weaponsHtml = this.weapons
            .map(weapon => {
                const damageStats = this.getWeaponDamageStats(weapon.type);
                const totalDamage = Math.round(damageStats.total);
                const bossDamage = Math.round(damageStats.bosses);
                const enemyDamage = Math.round(damageStats.enemies);
                const isMergeWeapon = weapon.isMergeWeapon || false;
                const mergeClass = isMergeWeapon ? 'style="color: #ffaa00 !important;"' : '';
                const iconName = weaponIconMap[weapon.type] || 'basicMissile';

                return {
                    totalDamage,
                    html: {
                        iconName,
                        mergeClass,
                        weaponLevel: weapon.level,
                        name: this.getWeaponName(weapon.type),
                        weaponDamage: weapon.damage,
                        bossDamage,
                        enemyDamage,
                        totalDamage
                    }
                };
            })
            .sort((a, b) => b.totalDamage - a.totalDamage)
            .map((entry, index, arr) => {
                const isLast = index === arr.length - 1;
                const weaponInfo = entry.html;
                return `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        font-size: 14px;
                        align-items: center;
                        gap: 8px;
                        flex-wrap: wrap;
                        border-bottom: ${isLast ? 'none' : '1px solid rgba(0, 255, 255, 0.15)'};
                    ">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="images/weapons/${weaponInfo.iconName}.png" alt="${weaponInfo.name}" style="width: 32px; height: 32px;">
                            <span ${weaponInfo.mergeClass}>${weaponInfo.name} LV.${weaponInfo.weaponLevel}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 3px; font-size: 12px;">
                            <span style="color: #00ffff;">${t.currentDamage}: ${weaponInfo.weaponDamage}</span>
                            <span style="color: #ffff00;">${t.totalDamage}: ${weaponInfo.totalDamage}</span>
                            <span style="color: #ff66ff;">${t.vsBosses}: ${weaponInfo.bossDamage}</span>
                            <span style="color: #66ff66;">${t.vsEnemies}: ${weaponInfo.enemyDamage}</span>
                        </div>
                    </div>
                `;
            })
            .join('');
        return `
            <div style="
                margin: 15px 0;
                padding: 12px;
                border: 1px solid #00ffff33;
                border-radius: 8px;
                background: rgba(0, 255, 255, 0.05);
            ">
                <div style="
                    color: #00ffff;
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                "><img src="images/passives/upgrade.png" alt="weapons" style="width: 48px; height: 48px; image-rendering: pixelated;"> ${t.weaponsResult}</div>
                ${weaponsHtml}
            </div>
        `;
    }

    generatePassivesSection() {
        const uiTranslations = this.translations[this.currentLanguage].ui;
        const uniqueLabel = uiTranslations.uniqueBadgeLabel || 'Unique';
        const p = this.translations[this.currentLanguage].passives;
        const passiveNames = {
            'health_boost': p.healthBoost,
            'speed_boost': p.speedBoost,
            'regeneration': p.regeneration,
            'magnet': p.magnet,
            'armor': p.armor,
            'critical': p.criticalStrike,
            'dash_boost': p.dashBoost,
            'turbo_flux_cycler': p.turboFlux,
            'aegis_impact_core': p.aegisCore,
            'splitstream_matrix': p.splitstreamMatrix,
            'macro_charge_amplifier': p.macroCharge,
            'mod_bay_expander': p.modBay
        };



        const passiveDescriptions = {
            'health_boost': this.t('healthBoostStack', 'help'),
            'speed_boost': this.t('speedBoostStack', 'help'),
            'regeneration': this.t('regenerationStack', 'help'),
            'magnet': this.t('magnetStack', 'help'),
            'armor': this.t('armorStack', 'help'),
            'critical': this.t('criticalStack', 'help'),
            'dash_boost': this.t('dashBoostStack', 'help'),
            'turbo_flux_cycler': this.t('turboFluxStack', 'help'),
            'aegis_impact_core': this.t('aegisCoreStack', 'help'),
            'splitstream_matrix': this.t('splitstreamMatrixStack', 'help'),
            'macro_charge_amplifier': this.t('macroChargeStack', 'help'),
            'mod_bay_expander': this.t('modBayStack', 'help')
        };

        const activePassives = Object.keys(this.player.passives).filter(key =>
            this.player.passives[key] && passiveNames[key]
        );

        const passivesHtml = activePassives.map(passive => {
            const displayName = passiveNames[passive];
            const passiveConfig = PASSIVES[passive.toUpperCase()];
            const isUnique = !!passiveConfig?.isUnique;

            // Get stack count for stackable passives
            let stackCount = '';
            if (['health_boost', 'speed_boost', 'armor', 'critical', 'dash_boost', 'magnet'].includes(passive)) {
                const count = this.player.passives[passive];
                if (typeof count === 'number') {
                    stackCount = `x${count}`;
                }
            }

            const passiveIconMap = {
                'health_boost': 'healthBoost',
                'speed_boost': 'speedBoost',
                'regeneration': 'regeneration',
                'magnet': 'magnet',
                'armor': 'armor',
                'critical': 'criticalStrike',
                'dash_boost': 'dashBoost',
                'turbo_flux_cycler': 'weaponFirerate',
                'aegis_impact_core': 'weaponPower',
                'splitstream_matrix': 'weaponProjectile',
                'macro_charge_amplifier': 'weaponSize',
                'mod_bay_expander': 'weaponSlot'
            };
            const iconName = passiveIconMap[passive] || 'upgrade';

            const wrapperStyles = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 6px 0;
                    font-size: 14px;
                    padding: 8px 10px;
                    border-radius: 8px;
                    ${isUnique
                    ? `
                            background: linear-gradient(135deg, rgba(255, 215, 0, 0.18), rgba(255, 165, 0, 0.08));
                            border: 1px solid rgba(255, 215, 0, 0.5);
                            color: #ffd700;
                            box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
                        `
                    : `
                            color: #ff00ff;
                        `
                }
                `;

            const badge = isUnique ? `<span style="
                    background: rgba(255, 215, 0, 0.15);
                    border: 1px solid rgba(255, 215, 0, 0.5);
                    color: #ffd700;
                    padding: 2px 10px;
                    border-radius: 999px;
                    font-size: 11px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                ">${uniqueLabel}</span>` : '';

            const stackMarkup = stackCount ? `<span style="font-weight: bold; color: ${isUnique ? '#fff5b0' : '#ff88ff'};">${stackCount}</span>` : '';

            return `
                <div style="${wrapperStyles}">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="images/passives/${iconName}.png" alt="${passive}" style="width: 32px; height: 32px; image-rendering: pixelated;">
                        <span>${displayName}</span>
                        ${badge}
                    </div>
                    ${stackMarkup}
                </div>
            `;
        }).join('');

        const t = uiTranslations;
        const emptyPassivesText = t.noPassives || 'No passives acquired';
        const passivesContent = passivesHtml || `<div style="text-align: center; color: #ff88ff; font-size: 13px; padding: 8px 0;">${emptyPassivesText}</div>`;
        return `
            <div style="
                margin: 15px 0;
                padding: 12px;
                border: 1px solid #ff00ff33;
                border-radius: 8px;
                background: rgba(255, 0, 255, 0.05);
            ">
                <div style="
                    color: #ff00ff;
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                "><img src="images/passives/passive.png" alt="Passive Result" style="width: 48px; height: 48px; image-rendering: pixelated;"> ${t.passiveResult}</div>
                ${passivesContent}
            </div>
        `;
    }

    generatePlayerStatsSection() {
        const maxHealthBonus = this.player.maxHealth - 100; // Starting health is 100
        // Calculate speed multiplier from speed_boost passive (matches PlayerSystem calculation)
        let speedMultiplier = 1.0;
        if (this.player.passives.speed_boost) {
            const speedStacks = typeof this.player.passives.speed_boost === 'number' ? this.player.passives.speed_boost : 1;
            speedMultiplier = 1 + (PASSIVES.SPEED_BOOST.value * speedStacks);
        }
        const totalUpgrades = this.player.level - 1; // Level 1 = 0 upgrades

        const t = this.translations[this.currentLanguage].ui;
        const maxHealthLabel = this.currentLanguage === 'ko' ? '최대 체력:' : 'Max Health:';
        const speedLabel = this.currentLanguage === 'ko' ? '속도 배율:' : 'Speed Multiplier:';
        const upgradesLabel = this.currentLanguage === 'ko' ? '총 업그레이드:' : 'Total Upgrades:';

        return `
            <div style="
                margin: 15px 0;
                padding: 12px;
                border: 1px solid #ffff0033;
                border-radius: 8px;
                background: rgba(255, 255, 0, 0.05);
            ">
                <div style="
                    color: #ffff00;
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    width: 100%;
                "><img src="images/passives/stats.png" alt="Final stats" style="width: 48px; height: 48px; image-rendering: pixelated;"> ${t.finalResult}</div>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                    font-size: 14px;
                    color: #ffff00;
                ">
                    <span>${maxHealthLabel}</span>
                    <span>${this.player.maxHealth}${maxHealthBonus > 0 ? ` (+${maxHealthBonus})` : ''}</span>
                </div>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                    font-size: 14px;
                    color: #ffff00;
                ">
                    <span>${speedLabel}</span>
                    <span>${speedMultiplier.toFixed(1)}x</span>
                </div>
                <div style="
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                    font-size: 14px;
                    color: #ffff00;
                ">
                    <span>${upgradesLabel}</span>
                    <span>${totalUpgrades}</span>
                </div>
            </div>
        `;
    }

    /**
     * Collect all game stats for scoreboard storage
     * Returns a normalized object used by both game over display and scoreboard saving
     */
    collectGameStats() {
        // Calculate time
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Collect weapon data with damage stats
        const weapons = this.weapons.map(weapon => {
            const damageStats = this.getWeaponDamageStats(weapon.type);
            return {
                type: weapon.type,
                level: weapon.level,
                damage: weapon.damage,
                isMergeWeapon: weapon.isMergeWeapon || false,
                totalDamage: Math.round(damageStats.total),
                bossDamage: Math.round(damageStats.bosses),
                enemyDamage: Math.round(damageStats.enemies)
            };
        });

        // Collect passives data with stack counts
        const passives = {};
        Object.keys(this.player.passives).forEach(key => {
            const value = this.player.passives[key];
            if (value) {
                passives[key] = {
                    active: true,
                    stacks: typeof value === 'number' ? value : 1
                };
            }
        });

        // Collect player stats
        const playerStats = {
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            speed: this.player.speed,
            chestsCollected: this.player.chestsCollected || 0
        };

        return {
            level: this.player.level,
            time: this.gameTime,
            timeText: timeText,
            enemiesKilled: Math.max(1, Math.floor(this.gameTime * 1.8)),
            bossesKilled: this.bossesKilled,
            chestsCollected: this.player.chestsCollected || 0,
            weapons: weapons,
            passives: passives,
            playerStats: playerStats
        };
    }

    showGameOverModal() {
        // Phase 12c integration - Use GameOverModal class (Option B: Proper Encapsulation)
        if (this.gameOverShown) {
            return;
        }
        this.gameOverShown = true;

        // Calculate final stats
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Generate detailed sections using existing methods
        const weaponsHTML = this.generateWeaponsSection();
        const passivesHTML = this.generatePassivesSection();
        const playerStatsHTML = this.generatePlayerStatsSection();

        // Collect complete score data
        const scoreData = this.collectGameStats();

        // Save score to local storage for scoreboard first to get ID
        let savedScore = null;
        try {
            savedScore = scoreboardStorage.saveScore(scoreData);
            console.log('Game score saved to scoreboard');

            if (this.modals.scoreboard?.isVisible && this.modals.scoreboard.isVisible()) {
                this.modals.scoreboard.populateVersions();
                this.modals.scoreboard.renderScores();
            }
        } catch (error) {
            console.error('Failed to save score to scoreboard:', error);
        }

        // Update modal with all data (include savedScore.id if available)
        this.modals.gameOver.update({
            ...scoreData,
            id: savedScore?.id, // Include the local storage ID
            timeText: timeText,
            weaponsHTML: weaponsHTML,
            passivesHTML: passivesHTML,
            playerStatsHTML: playerStatsHTML
        });

        // Set up event handlers (if not already set)
        if (!this._gameOverHandlersSet) {
            this.modals.gameOver.onRestart(() => {
                this.startGame();
            });

            this.modals.gameOver.onExit(() => {
                this.closeGame();
            });

            this._gameOverHandlersSet = true;
        }

        // Play game over sound
        this.audioManager.playSound('gameOver');

        // Show the modal (modal handles touch scrolling and keyboard interaction internally)
        this.modals.gameOver.show();
    }

    // Phase 12c.7 - Boss defeated using VictoryModal (Option B pattern)
    bossDefeated() {

        // Reset touch controls when victory screen opens to prevent stuck movement
        if (this.touchControls && this.touchControls.joystick) {
            this.touchControls.joystick.active = false;
            this.touchControls.joystick.moveX = 0;
            this.touchControls.joystick.moveY = 0;
            this.touchControls.joystick.visible = false;
            this.touchControls.joystick.touchId = null;
        }

        // Set victory sequence state and pause game time
        this.bossVictoryInProgress = true;  // Mark victory screen active
        this.timePaused = true;             // Pause game time during victory
        this.bossDefeating = false;         // Reset animation state
        this.gameRunning = false;
        this.pauseLoopingWeaponSounds();

        // Cancel any running game loop
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        // Calculate final stats
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const finalStats = {
            level: this.player.level,
            timeText: timeText,
            enemiesKilled: Math.max(1, Math.floor(this.gameTime * 1.8))
        };

        this.lastVictoryPayload = {
            finalStats,
            bossesKilled: this.bossesKilled,
            bossLevel: this.bossLevel
        };
        this.victoryHiddenForExitConfirmation = false;

        // Set up VictoryModal callbacks
        this.modals.victory.setGameStateCallbacks(
            () => this.translations[this.currentLanguage].ui,
            this.t.bind(this),
            this.generateWeaponsSection.bind(this),
            this.generatePassivesSection.bind(this),
            this.generatePlayerStatsSection.bind(this)
        );

        this.modals.victory.setOverlayLockCallbacks(
            this.incrementOverlayLock.bind(this),
            this.decrementOverlayLock.bind(this)
        );

        this.modals.victory.onContinue(() => {
            // Play next stage sound
            this.audioManager.playSound('nextStage');

            // Reset menu navigation
            this.resetMenuNavigation();

            // Clear victory screen state
            this.bossVictoryInProgress = false;
            this.lastVictoryPayload = null;
            this.victoryHiddenForExitConfirmation = false;

            // Process any deferred level ups before continuing
            this.processPendingLevelUps();

            // If no pending level ups, continue immediately
            if (this.pendingLevelUps === 0) {
                this.continueAfterBoss();
            }
        });

        this.modals.victory.onExit(() => {
            if (this.modals.victory.isOpen) {
                this.victoryHiddenForExitConfirmation = true;
                this.modals.victory.hide();
            }

            // Set up exit confirmation to work with victory modal
            this.modals.exitConfirmation.setParentKeyboardCallbacks(
                this.modals.victory.disableKeyboardHandlers.bind(this.modals.victory),
                this.modals.victory.enableKeyboardHandlers.bind(this.modals.victory)
            );

            // Show exit confirmation modal
            this.showExitConfirmation();
        });

        // Show the victory modal
        this.modals.victory.show(finalStats, this.bossesKilled, this.bossLevel);
    }

    continueAfterBoss() {
        // Resume the game with increased difficulty after beating the boss
        this.gameRunning = true;
        this.timePaused = false;
        this.resumeLoopingWeaponSounds();

        // Reset touch controls to ensure clean state when continuing after boss defeat
        if (this.touchControls && this.touchControls.joystick) {
            this.touchControls.joystick.active = false;
            this.touchControls.joystick.moveX = 0;
            this.touchControls.joystick.moveY = 0;
            this.touchControls.joystick.visible = false;
            this.touchControls.joystick.touchId = null;
        }

        // Clear any existing enemies and projectiles for fresh start
        this.enemies = [];
        this.projectiles = [];

        // Increment boss progression counters
        this.bossesKilled++;
        this.bossLevel++;

        // Reset boss tracking and schedule the next encounter using game time
        this.bossSpawned = false;
        // Reset EnemySystem's boss tracking (it won't spawn bosses after the first one)
        this.enemySystem.bossSpawned = false;
        this.scheduleNextBossSpawn(this.bossRespawnDelay);

        // Increase general game difficulty
        this.waveNumber = Math.max(1, this.waveNumber + 1);
        this.spawnRate = Math.max(0.3, this.spawnRate * 0.9); // Spawn enemies faster

        // Player health is maintained from battle as a challenge

        // Add bonus XP for defeating boss - Phase 9 integration
        this.xpSystem.addXP(this.player, 50);
        this.checkLevelUp();

        // Boss defeat notification already shown during animation

        // Resume game loop (only if not showing level up modal)
        if (this.gameRunning && !this.timePaused) {
            this.startAnimationLoop();
        }
    }

    scheduleNextBossSpawn(delaySeconds = this.bossRespawnDelay) {
        const clampedDelay = Math.max(0, Number(delaySeconds) || 0);
        this.nextBossSpawnTime = this.gameTime + clampedDelay;
    }

    checkScheduledBossSpawn() {
        if (this.nextBossSpawnTime === null) {
            return;
        }

        if (this.timePaused || this.playerDead || this.bossDefeating || this.bossVictoryInProgress) {
            return;
        }

        if (this.pendingBossSpawn) {
            return;
        }

        if (this.enemies.some(enemy => enemy.behavior === 'boss')) {
            return;
        }

        if (this.gameTime >= this.nextBossSpawnTime) {
            this.spawnScaledBoss(this.bossSpawnDelaySeconds, this.bossSpawnDistance);
            this.nextBossSpawnTime = null;
        }
    }

    processPendingBossSpawn() {
        if (!this.pendingBossSpawn) {
            return;
        }

        if (this.timePaused || this.playerDead || this.bossDefeating || this.bossVictoryInProgress) {
            return;
        }

        if (this.enemies.some(enemy => enemy.behavior === 'boss')) {
            return;
        }

        if (this.gameTime < this.pendingBossSpawn.spawnTime) {
            return;
        }

        const { type, distance, variantId, bossLevel } = this.pendingBossSpawn;
        const variantConfig = variantId ? this.getBossVariantById(variantId) : this.getBossVariantForLevel(bossLevel || this.bossLevel);

        if (type === 'scaled') {
            this.spawnScaledBossImmediate(distance, variantConfig, bossLevel || this.bossLevel, true);
        } else {
            this.spawnBossImmediate(distance, variantConfig, true, bossLevel || this.bossLevel);
        }

        this.pendingBossSpawn = null;
    }

    restartGame() {
        this.startGame();
    }


    closeGame() {


        // Stop game immediately to prevent any lingering processes
        this.gameRunning = false;
        this.isPaused = false;
        this.disablePauseScrolling();
        this.overlayLocks = 0;
        this.lastVictoryPayload = null;
        this.updateOverlayLockState();

        // Phase 12c.4b - Clean up all modal keyboard handlers
        // NOTE: Don't remove mainKeyboardHandler here - it's needed for internal start screen navigation
        if (this.modals) {
            // Hide all modals to trigger cleanup (only if initialized)
            if (this.modals.pause && this.modals.pause.element) {
                this.modals.pause.hide();
                this.setPauseMenuOverlayState(false);
            }
            if (this.modals.levelUp && this.modals.levelUp.element) {
                this.modals.levelUp.hide();
            }
            if (this.modals.gameOver && this.modals.gameOver.element) {
                this.modals.gameOver.hide();
            }
            if (this.modals.restartConfirmation && this.modals.restartConfirmation.element) {
                this.modals.restartConfirmation.hide();
            }
            if (this.modals.exitConfirmation && this.modals.exitConfirmation.element) {
                this.modals.exitConfirmation.hide();
            }
            if (this.modals.help && this.modals.help.element) {
                this.modals.help.hide();
            }
            if (this.modals.settings && this.modals.settings.element) {
                this.modals.settings.hide();
            }
            if (this.modals.options && this.modals.options.element) {
                this.modals.options.hide();
            }
            if (this.modals.helpMenu && this.modals.helpMenu.element) {
                this.modals.helpMenu.hide();
            }
            // Phase 12c.7 - Victory modal cleanup
            if (this.modals.victory && this.modals.victory.element) {
                this.modals.victory.hide();
            }
        }

        // Cancel any running game loop
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }

        // Stop background music immediately (Phase 11 - AudioManager)
        try {
            this.audioManager.stopMusic();
        } catch (e) {
            console.warn('Could not stop background music:', e);
        }

        // Hide game UI immediately for smooth visual transition
        const container = document.getElementById('vibe-survivor-container');
        if (container) {
            container.classList.add('vibe-survivor-hidden');
        }

        // Remove game modal class
        document.body.classList.remove('game-modal-open');

        // Brief delay to allow final cleanup, then show start screen
        setTimeout(() => {
            // Reset the game state completely
            this.resetGame();

            // Show the start screen instead of reloading
            this.reopenGame();
        }, 200);
    }

    reopenGame() {
        const modal = document.getElementById('vibe-survivor-modal');
        if (modal) {
            modal.style.display = 'flex';
            // Remove game-active class to hide game content
            modal.classList.remove('game-active');
        }

        const container = document.getElementById('vibe-survivor-container');
        if (container) {
            container.classList.remove('vibe-survivor-hidden');
            // Remove game-active class to hide game content
            container.classList.remove('game-active');
        }

        // Also remove from vibe-survivor-content
        const content = document.querySelector('.vibe-survivor-content');
        if (content) {
            content.classList.remove('game-active');
        }

        // Hide pause menu and all other overlays
        const pauseMenu = document.getElementById('pause-menu');
        if (pauseMenu) {
            pauseMenu.style.display = 'none';
        }

        const gameOverModal = document.getElementById('game-over-modal');
        if (gameOverModal) {
            gameOverModal.style.display = 'none';
        }

        // Completely hide the game screen (canvas, HUD, everything)
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('active');
            gameScreen.style.setProperty('display', 'none', 'important');
        }

        // Hide the canvas
        const canvas = document.getElementById('survivor-canvas');
        if (canvas) {
            canvas.style.setProperty('display', 'none', 'important');
        }

        // Ensure start overlay is visible again
        const startOverlay = document.getElementById('survivor-start-overlay');
        if (startOverlay) {
            startOverlay.classList.add('active');
            startOverlay.style.setProperty('display', 'flex', 'important');
            startOverlay.style.setProperty('visibility', 'visible', 'important');
        }

        // Hide mobile controls
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) {
            mobileControls.style.setProperty('display', 'none', 'important');
        }

        // Hide dash button
        const dashBtn = document.getElementById('mobile-dash-btn');
        if (dashBtn) {
            dashBtn.style.setProperty('display', 'none', 'important');
        }

        // Force show start screen and hide all others
        document.querySelectorAll('.vibe-survivor-screen').forEach(screen => {
            screen.classList.remove('active');
            if (screen.id !== 'survivor-start-overlay') {
                screen.style.display = 'none';
            }
        });

        const startScreen = document.getElementById('survivor-start-overlay');
        if (startScreen) {
            startScreen.classList.add('active');
            startScreen.style.display = 'flex';

            // Play Chroma Awards presentation audio when returning to start screen
            this.playStartMenuThemes();

            requestAnimationFrame(() => this.updateStartOverlayLayout());

            // Phase 12c.4b - Initialize keyboard navigation for start screen after quit
            // Use setTimeout to ensure DOM is fully ready
            setTimeout(() => {
                const startBtn = document.getElementById('start-survivor');
                const guideBtn = document.getElementById('start-btn-guide');
                const scoreboardBtn = document.getElementById('scoreboard-btn');
                const optionsBtn = document.getElementById('options-btn');
                const aboutBtn = document.getElementById('about-btn');
                const restartBtn = document.getElementById('restart-survivor');
                const exitBtn = document.getElementById('exit-survivor');
                const startButtons = [startBtn, guideBtn, scoreboardBtn, optionsBtn, aboutBtn, restartBtn, exitBtn].filter(btn => btn);

                if (startButtons.length > 0) {
                    this.initializeMenuNavigation('start', startButtons);
                }
            }, 100);

            // Event listener already set up in setupEventHandlers(), no need to re-attach
        } else {
            console.error('Start screen element not found');
        }
    }


    cleanRestart() {


        // Reset all game state
        this.resetGame();

        // Remove any existing modals to prevent conflicts
        const existingModals = document.querySelectorAll('#vibe-survivor-modal, [id*="fresh-game-over"]');
        existingModals.forEach(modal => modal.remove());

        // Create fresh modal structure
        this.createGameModal();

        // Start the game directly - no intermediate screens
        setTimeout(() => {

            this.startGame();
        }, 200);
    }

    /**
     * Attempts to autoplay start menu sound for returning users
     * Chrome's Media Engagement Index (MEI) allows autoplay for users who have
     * previously engaged with media on this domain (>7s of unmuted playback).
     * This will succeed for returning users and fail silently for new users.
     */
    tryAutoplayStartMenuSound() {
        if (!this.audioManager || this.audioManager.isSfxMuted()) {
            return; // Don't attempt if audio system not ready or SFX muted
        }

        const startMenuSounds = ['startMenu', 'chromaAwardsTheme'];
        startMenuSounds.forEach(soundName => {
            this.attemptStartMenuAutoplay(soundName);
        });
    }

    attemptStartMenuAutoplay(soundName) {
        const sound = this.audioManager.sounds.get(soundName);
        if (!sound) {
            return;
        }

        const autoplayAttempt = sound.cloneNode();
        autoplayAttempt.volume = this.audioManager.sfxVolume;

        autoplayAttempt.play().then(() => {
            // Success - user has sufficient Media Engagement Index
        }).catch(() => {
            // Expected failure for new users or low MEI
        });
    }

    cleanExit() {

        // Phase 12c.4b - Clean up main game keyboard handler (complete exit to landing page)
        if (this.mainKeyboardHandler) {
            document.removeEventListener('keydown', this.mainKeyboardHandler);
            this.mainKeyboardHandler = null;
        }

        // Restore body scrolling behavior
        this.restoreBackgroundScrolling();

        // Reset all game state completely
        this.resetGame();

        // Clean up canvas layers
        this.cleanupCanvasLayers();

        // Remove all vibe-survivor specific elements only
        const existingModals = document.querySelectorAll('#vibe-survivor-modal, [id*="fresh-game-over"], .vibe-survivor-modal, .vibe-survivor-container, [class*="vibe-survivor-"]');
        existingModals.forEach(modal => {
            if (modal.id !== 'vibe-survivor-btn') { // Preserve the main launch button
                modal.remove();
            }
        });


        // Notify Game Manager that we've exited
        if (window.gameManager && window.gameManager.currentGame === 'vibe-survivor') {
            window.gameManager.currentGame = null;
            // Notified Game Manager
        }

        // Game state fully reset
    }

    // Translation System Methods
    initTranslations() {
        return {
            en: {
                ui: {
                    // Landing page
                    gameTitle: "VIBE SURVIVOR",
                    gameTagline: "Survive the endless waves!",
                    startGame: "START",
                    guide: "GUIDE",
                    options: "OPTIONS",
                    about: "ABOUT",

                    // About menu
                    aboutTitle: "ABOUT",
                    vibeCodingTitle: "100% Made via Vibe Coding",
                    vibeCodingSubtitle: "A complete game development journey using AI tools",
                    codingLabel: "Coding:",
                    codingValue: "Claude Code & Codex",
                    musicLabel: "Music:",
                    musicValue: "ElevenLabs",
                    soundEffectsLabel: "Sound Effects:",
                    soundEffectsValue: "ElevenLabs",
                    artworkLabel: "Artwork:",
                    artworkValue: "PixelLab",
                    connectWithUs: "Connect With Us",
                    versionLabel: "Version",
                    aboutHint: "Press ESC to close",

                    // Scoreboard
                    scoreboardButton: "SCOREBOARD",
                    scoreboardTitle: "SCOREBOARD",
                    scoreboardDetailTitle: "RUN DETAILS",
                    scoreboardVersionLabel: "Version",
                    scoreboardAllVersions: "All Versions",
                    scoreboardClear: "CLEAR ALL",
                    scoreboardClearConfirm: "Clear all saved scores?",
                    scoreboardEmpty: "No scores yet. Play a run to add your first record!",
                    scoreboardNoWeapons: "No weapons recorded",
                    scoreboardNoPassives: "No passives recorded",
                    scoreboardBackToList: "BACK TO LIST",
                    scoreboardDelete: "DELETE RECORD",
                    scoreboardDeleteConfirm: "Delete this record?",
                    scoreboardWeaponsHeading: "Weapons",
                    scoreboardPassivesHeading: "Passives",
                    scoreboardPlayerHeading: "Player Stats",
                    scoreboardStatsHeading: "Damage",
                    enterPlayerName: "Enter your display name (3-20 characters):",
                    scoreDetailTitle: "RUN DETAILS",

                    // Options menu
                    optionsTitle: "OPTIONS",
                    language: "Language",
                    audio: "Audio",
                    music: "Music",
                    sfx: "SFX",
                    soundEffects: "Sound Effects",
                    dashPosition: "Dash Button Position",
                    close: "CLOSE",
                    optionsHint: "Press ESC to close",

                    // Buttons
                    resume: "RESUME",
                    continueButton: "Continue",
                    restart: "RESTART",
                    mute: "MUTE",
                    unmute: "UNMUTE",
                    quitGame: "QUIT GAME",
                    playAgain: "PLAY AGAIN",
                    exit: "EXIT",
                    left: "LEFT",
                    right: "RIGHT",
                    button: "BUTTON",
                    submitToGlobal: "Submit to Global",
                    submitting: "Submitting...",
                    viewScoreboard: "View Scoreboard",

                    // Modal titles
                    gamePaused: "GAME PAUSED",
                    gameOver: "GAME OVER",
                    quitConfirm: "QUIT GAME?",
                    restartConfirm: "RESTART GAME?",
                    levelUp: "LEVEL UP!",
                    chestTitle: "UPGRADE CHEST",
                    chestSubtitle: "Choose one passive upgrade",
                    chestHint: "↑↓ Navigate • Enter Select",
                    chestTabUpgrades: "Rewards",
                    uniqueItemsTitle: "Unique Items",
                    uniqueItemsDescription: "These rare passives have a lower chance to appear in chests.",
                    uniqueItemsEmpty: "No unique passives discovered yet.",
                    uniqueBadgeLabel: "Unique",

                    // Confirmations
                    quitWarning: "Are you sure you want to quit?<br>All progress will be lost!",
                    restartWarning: "Are you sure you want to restart?<br>All current progress will be lost!",
                    yesQuit: "YES, QUIT",
                    yesRestart: "YES, RESTART",
                    noContinue: "NO, CONTINUE",

                    // Controls
                    controlsPC: "PC: WASD/Arrow Keys move, Mouse aims, Space dash, ESC pauses, F1 opens Help",
                    controlsMobile: "Mobile: Touch screen to move, tap DASH button",
                    pauseHint: "Press ESC to resume",
                    helpHint: "Press ESC to close",
                    guideTab: "Guide",
                    statusTab: "Status",
                    statusEmpty: "Keep playing to unlock detailed stats.",
                    dash: "DASH",
                    dashButtonRight: "DASH BUTTON: RIGHT",
                    dashButtonLeft: "DASH BUTTON: LEFT",
                    acquiredSuffix: "ACQUIRED!",

                    // Upgrade descriptions
                    damageFireRate: "damage, faster fire rate",
                    addProjectile: "+1 projectile",

                    // Game over stats
                    level: "Level:",
                    time: "Time:",
                    enemies: "Enemies:",
                    bosses: "Bosses",
                    bossesDefeated: "Bosses Defeated:",
                    retry: "RETRY",
                    weaponsResult: "Weapons Result",
                    passiveResult: "Passive Result",
                    finalResult: "Stats Result",
                    currentDamage: "Single Dmg",
                    totalDamage: "Total",
                    vsBosses: "Boss",
                    vsEnemies: "Enemies",
                    victoryTitle: "Victory!",
                    bossDefeatedBanner: "Boss Defeated",
                    bossLevelDefeated: "Boss Level {level} Defeated",
                    nextBoss: "Next: Boss Level {level}",
                    noWeapons: "No weapons acquired",
                    noPassives: "No passives acquired"
                },
                weapons: {
                    // Base weapons
                    basicMissile: "Basic Missile",
                    rapidFire: "Rapid Fire",
                    spreadShot: "Spread Shot",
                    laserBeam: "Laser Beam",
                    plasmaBolt: "Plasma Bolt",
                    homingMissiles: "Homing Missiles",
                    shotgun: "Shotgun",
                    lightning: "Lightning",
                    flamethrower: "Flamethrower",
                    railgun: "Railgun",

                    // Merged weapons
                    homingLaser: "Homing Laser",
                    shockburst: "Shockburst",
                    gatlingGun: "Gatling Gun",

                    // Weapon descriptions
                    basicDesc: "Fires a basic missile at the nearest enemy",
                    spreadDesc: "Fires multiple projectiles in a spread pattern",
                    laserDesc: "High-damage piercing beam",
                    plasmaDesc: "Explosive projectiles with area damage",
                    shotgunDesc: "Close-range high damage spread",
                    lightningDesc: "Chain lightning that jumps between enemies",
                    flamethrowerDesc: "Continuous flame stream with burning damage",
                    railgunDesc: "Ultra high damage piercing shot",
                    missilesDesc: "Homing missiles with explosive damage"
                },
                passives: {
                    healthBoost: "Health Boost",
                    speedBoost: "Speed Boost",
                    regeneration: "Regeneration",
                    magnet: "Magnet",
                    armor: "Armor",
                    criticalStrike: "Critical Strike",
                    dashBoost: "Dash Boost",
                    turboFlux: "Turbo-Flux Cycler",
                    aegisCore: "Aegis Impact Core",
                    splitstreamMatrix: "Splitstream Matrix",
                    macroCharge: "Macro-Charge Amplifier",
                    modBay: "Mod-Bay Expander"
                },
                help: {
                    // Tabs
                    howToTab: "HOW TO",
                    passivesTab: "PASSIVES",
                    weaponsTab: "WEAPONS",
                    statusTab: "STATUS",

                    // Section headers
                    uniquePassivesHeader: "UNIQUE PASSIVES (Chest Rewards)",
                    stackablePassivesHeader: "STACKABLE PASSIVES",
                    mergerWeaponsHeader: "MERGER WEAPONS",
                    evolutionWeaponsHeader: "EVOLUTION WEAPONS",
                    baseWeaponsHeader: "BASE WEAPONS",

                    // How To content
                    controlsLabel: "Controls:",
                    mobileLabel: "Mobile:",
                    objectiveLabel: "Objective:",
                    levelingLabel: "Leveling:",
                    evolutionLabel: "Evolution:",
                    mergersLabel: "Mergers:",

                    controlsText: "WASD/Arrow Keys move, Mouse aims, Space dashes, ESC pauses, F1 opens Help.",
                    mobileText: "Virtual joystick and dash button for quick moves.",
                    objectiveText: "Survive enemy waves, defeat bosses, level up, and pick weapons/passives.",
                    levelingText: "Collect XP orbs to level up and unlock upgrades.",
                    evolutionText: "Basic Missile evolves into Rapid Fire at level 5.",
                    mergersText: "Combine specific weapons at required levels.",

                    // Passive stack info
                    healthBoostStack: "+25 Max Health (infinite stacks)",
                    speedBoostStack: "+10% Movement Speed (max 3 stacks)",
                    magnetStack: "Attract XP orbs (max 3 stacks)",
                    armorStack: "15% damage reduction (infinite stacks, 90% cap)",
                    criticalStack: "15% crit chance, 2x damage (max 3 stacks)",
                    dashBoostStack: "+50% dash distance (max 3 stacks)",
                    turboFluxStack: "+25% fire rate to all weapons",
                    aegisCoreStack: "+50% weapon damage",
                    splitstreamMatrixStack: "+1 projectile to all weapons",
                    macroChargeStack: "+50% explosion radius",
                    modBayStack: "Increase max weapon slots to 5",
                    regenerationStack: "Auto-heal over time",

                    // Weapon mergers
                    weaponMergers: "<img src='images/passives/upgrade.png' alt='upgrade' class='section-icon'> WEAPON MERGERS",
                    homingLaserRecipe: "Laser lvl 3 + Homing Missiles lvl 3",
                    homingLaserDesc: "Heat-seeking laser beams",
                    shockburstRecipe: "Lightning lvl 3 + Plasma lvl 3",
                    shockburstDesc: "Explosive energy bursts",
                    gatlingGunRecipe: "Rapid Fire lvl 5 + Spread Shot lvl 3",
                    gatlingGunDesc: "Multi-barrel rapid fire",

                    // Additional help content
                    weaponEvolution: "WEAPON EVOLUTION",
                    rapidFireEvolution: "Basic Missile evolves into Rapid Fire at level 5 - this creates a powerful automatic weapon with increased fire rate.",
                    rapidFireEvolutionDesc: "Basic Missile evolves at level 5 into Rapid Fire with blazing speed.",

                    // Modal UI
                    closeButton: "CLOSE",
                    helpHint: "Press ESC to close"
                }
            },
            ko: {
                ui: {
                    // Landing page
                    gameTitle: "바이브 서바이벌",
                    gameTagline: "끝없는 도형들의 공격에서 살아남아라!",
                    startGame: "시작",
                    guide: "가이드",
                    options: "설정",
                    about: "정보",

                    // About menu
                    aboutTitle: "정보",
                    vibeCodingTitle: "100% 바이브 코딩으로만 제작 하였습니다.",
                    vibeCodingSubtitle: "AI 도구를 사용한 완전한 게임 개발 여정 입니다.",
                    codingLabel: "코딩:",
                    codingValue: "Claude Code & Codex",
                    musicLabel: "음악:",
                    musicValue: "ElevenLabs",
                    soundEffectsLabel: "효과음:",
                    soundEffectsValue: "ElevenLabs",
                    artworkLabel: "아트워크:",
                    artworkValue: "PixelLab",
                    connectWithUs: "소셜 미디어",
                    versionLabel: "버전",
                    aboutHint: "ESC 키로 닫기",

                    // Scoreboard
                    scoreboardButton: "기록판",
                    scoreboardTitle: "기록판",
                    scoreboardDetailTitle: "기록 상세",
                    scoreboardVersionLabel: "버전",
                    scoreboardAllVersions: "모든 버전",
                    scoreboardClear: "전체 삭제",
                    scoreboardClearConfirm: "저장된 모든 기록을 삭제할까요?",
                    scoreboardEmpty: "아직 저장된 점수가 없습니다. 게임을 플레이해 기록을 추가하세요!",
                    scoreboardNoWeapons: "기록된 무기가 없습니다",
                    scoreboardNoPassives: "기록된 패시브가 없습니다",
                    scoreboardBackToList: "목록으로",
                    scoreboardDelete: "기록 삭제",
                    scoreboardDeleteConfirm: "이 기록을 삭제할까요?",
                    scoreboardWeaponsHeading: "무기",
                    scoreboardPassivesHeading: "패시브",
                    scoreboardPlayerHeading: "플레이어 스탯",
                    scoreboardStatsHeading: "피해",
                    enterPlayerName: "표시 이름을 입력하세요 (3-20자):",
                    scoreDetailTitle: "기록 상세",

                    // Options menu
                    optionsTitle: "설정",
                    language: "언어",
                    audio: "오디오",
                    music: "음악",
                    sfx: "효과음",
                    soundEffects: "효과음",
                    dashPosition: "대시 버튼 위치",
                    close: "닫기",
                    optionsHint: "ESC를 눌러 닫기",

                    // Buttons
                    resume: "계속하기",
                    continueButton: "계속하기",
                    restart: "다시 시작",
                    mute: "음소거",
                    unmute: "음소거 해제",
                    quitGame: "게임 종료",
                    playAgain: "다시하기",
                    exit: "나가기",
                    left: "왼쪽",
                    right: "오른쪽",
                    button: "버튼",
                    submitToGlobal: "글로벌 제출",
                    submitting: "제출 중...",
                    viewScoreboard: "기록판 보기",

                    // Modal titles
                    gamePaused: "일시정지",
                    gameOver: "게임오버",
                    quitConfirm: "게임을 종료할까요?",
                    restartConfirm: "게임을 다시 시작할까요?",
                    levelUp: "레벨 업!",
                    chestTitle: "보상 상자",
                    chestSubtitle: "패시브 업그레이드를 1개 선택하세요",
                    chestHint: "↑↓ 이동 • Enter 선택",
                    chestTabUpgrades: "보상",
                    uniqueItemsTitle: "유니크 아이템",
                    uniqueItemsDescription: "희귀 패시브는 낮은 확률로 상자에서만 등장합니다.",
                    uniqueItemsEmpty: "획득 가능한 유니크 패시브가 없습니다.",
                    uniqueBadgeLabel: "유니크",

                    // Confirmations
                    quitWarning: "정말로 종료하시겠습니까?<br>모든 진행상황이 사라집니다!",
                    restartWarning: "정말로 다시 시작하시겠습니까?<br>현재 진행상황이 모두 사라집니다!",
                    yesQuit: "네, 종료",
                    yesRestart: "네, 다시 시작",
                    noContinue: "아니오, 계속하기",

                    // Controls
                    controlsPC: "PC: WASD/방향키 이동, 마우스 조준, 스페이스 대시, ESC 일시정지, F1 도움말",
                    controlsMobile: "모바일: 화면을 터치해 이동, 대시 버튼을 눌러 대시",
                    pauseHint: "ESC를 눌러 계속하기",
                    helpHint: "ESC를 눌러 닫기",
                    guideTab: "가이드",
                    statusTab: "상태",
                    statusEmpty: "상세 통계를 확인하려면 계속 플레이하세요.",
                    dash: "대시",
                    dashButtonRight: "대시 버튼: 오른쪽",
                    dashButtonLeft: "대시 버튼: 왼쪽",
                    acquiredSuffix: "획득!",

                    // Upgrade descriptions
                    damageFireRate: "데미지, 더 빠른 발사 속도",
                    addProjectile: "+1 발사체",

                    // Game over stats
                    level: "레벨:",
                    time: "시간:",
                    enemies: "처치한 적:",
                    bosses: "보스",
                    bossesDefeated: "처치한 보스:",
                    retry: "다시하기",
                    weaponsResult: "무기 결과",
                    passiveResult: "패시브 결과",
                    finalResult: "통계 결과",
                    currentDamage: "단일 피해",
                    totalDamage: "총합",
                    vsBosses: "보스",
                    vsEnemies: "적",
                    victoryTitle: "승리!",
                    bossDefeatedBanner: "보스를 처치했습니다",
                    bossLevelDefeated: "보스 레벨 {level} 처치",
                    nextBoss: "다음: 보스 레벨 {level}",
                    noWeapons: "획득한 무기가 없습니다",
                    noPassives: "획득한 패시브가 없습니다"
                },
                weapons: {
                    // Base weapons
                    basicMissile: "기본 미사일",
                    rapidFire: "속사",
                    spreadShot: "산탄 총",
                    laserBeam: "레이저 빔",
                    plasmaBolt: "플라즈마 볼트",
                    homingMissiles: "유도 미사일",
                    shotgun: "샷건",
                    lightning: "번개",
                    flamethrower: "화염방사기",
                    railgun: "레일건",

                    // Merged weapons
                    homingLaser: "유도 레이저",
                    shockburst: "충격파",
                    gatlingGun: "개틀링 건",

                    // Weapon descriptions
                    basicDesc: "가장 가까운 적에게 기본 미사일을 발사",
                    spreadDesc: "산탄 형태로 다중 발사체를 발사",
                    laserDesc: "고데미지 관통 빔",
                    plasmaDesc: "광역 피해를 주는 폭발 발사체",
                    shotgunDesc: "근거리 고데미지 산탄",
                    lightningDesc: "적들 사이를 점프하는 연쇄 번개",
                    flamethrowerDesc: "지속적인 화염 공격과 화상 데미지",
                    railgunDesc: "초고데미지 관통 사격",
                    missilesDesc: "폭발 피해를 주는 유도 미사일"
                },
                passives: {
                    healthBoost: "체력 강화",
                    speedBoost: "속도 강화",
                    regeneration: "재생",
                    magnet: "자석",
                    armor: "방어구",
                    criticalStrike: "치명타",
                    dashBoost: "대시 강화",
                    turboFlux: "터보-플럭스 순환기",
                    aegisCore: "에이제스 임팩트 코어",
                    splitstreamMatrix: "스플릿스트림 매트릭스",
                    macroCharge: "매크로 차지 증폭기",
                    modBay: "모드 베이 확장기"
                },
                help: {
                    // Tabs
                    howToTab: "플레이 방법",
                    passivesTab: "패시브",
                    weaponsTab: "무기",
                    statusTab: "상태",

                    // Section headers
                    uniquePassivesHeader: "고유 패시브 (상자 보상)",
                    stackablePassivesHeader: "중첩 가능 패시브",
                    mergerWeaponsHeader: "합성 무기",
                    evolutionWeaponsHeader: "진화 무기",
                    baseWeaponsHeader: "기본 무기",

                    // How To content
                    controlsLabel: "조작법:",
                    mobileLabel: "모바일:",
                    objectiveLabel: "목표:",
                    levelingLabel: "레벨업:",
                    evolutionLabel: "진화:",
                    mergersLabel: "합성:",

                    controlsText: "WASD/방향키 이동, 마우스 조준, 스페이스 대시, ESC 일시정지, F1 도움말.",
                    mobileText: "가상 조이스틱과 대시 버튼으로 빠른 이동.",
                    objectiveText: "적의 공격에서 살아남고 보스를 처치하여 레벨업하고 무기/패시브를 선택하세요.",
                    levelingText: "경험치 구슬을 모아 레벨업하고 업그레이드를 해제하세요.",
                    evolutionText: "기본 미사일이 레벨 5에서 연사로 진화합니다.",
                    mergersText: "특정 레벨의 무기를 조합하세요.",

                    // Passive stack info
                    healthBoostStack: "+25 최대 체력 (무한 중첩)",
                    speedBoostStack: "+10% 이동 속도 (최대 3 중첩)",
                    magnetStack: "경험치 구슬 흡수 (최대 3 중첩)",
                    armorStack: "15% 피해 감소 (무한 중첩, 90% 상한)",
                    criticalStack: "15% 치명타 확률, 2배 피해 (최대 3 중첩)",
                    dashBoostStack: "+50% 대시 거리 (최대 3 중첩)",
                    turboFluxStack: "모든 무기 연사 속도 +25%",
                    aegisCoreStack: "무기 피해량 +50%",
                    splitstreamMatrixStack: "모든 무기 투사체 +1",
                    macroChargeStack: "폭발 범위 +50%",
                    modBayStack: "최대 무기 슬롯 5개로 증가",
                    regenerationStack: "시간 경과에 따라 자동 회복",

                    // Weapon mergers
                    weaponMergers: "<img src='images/passives/upgrade.png' alt='upgrade' class='section-icon'> 무기 합성",
                    homingLaserRecipe: "레이저 레벨 3 + 유도 미사일 레벨 3",
                    homingLaserDesc: "열추적 레이저 빔",
                    shockburstRecipe: "번개 레벨 3 + 플라즈마 레벨 3",
                    shockburstDesc: "폭발적 에너지 파동",
                    gatlingGunRecipe: "속사 레벨 5 + 산탄 총 레벨 3",
                    gatlingGunDesc: "다총신 속사",

                    // Additional help content
                    weaponEvolution: "무기 진화",
                    rapidFireEvolution: "기본 미사일이 레벨 5에서 속사로 진화합니다 - 발사 속도가 크게 향상된 강력한 자동 무기가 됩니다.",
                    rapidFireEvolutionDesc: "기본 미사일이 레벨 5에서 엄청난 속도의 연사로 진화합니다.",

                    // Modal UI
                    closeButton: "닫기",
                    helpHint: "ESC를 눌러 닫기"
                }
            }
        };
    }

    // Translation helper method
    t(key, category = 'ui') {
        const lang = this.translations[this.currentLanguage];
        if (!lang || !lang[category]) {
            return key; // Fallback to key if translation missing
        }

        const keys = key.split('.');
        let result = lang[category];

        for (const k of keys) {
            if (result && typeof result === 'object' && result[k] !== undefined) {
                result = result[k];
            } else {
                return key; // Fallback if path not found
            }
        }

        return result || key;
    }

    // Change language and update all UI
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            this.saveUserSettings();
            this.updateAllText();
        }
    }

    // Update all text elements with current language
    updateAllText() {
        const t = this.t.bind(this);

        if (this.modals.startScreenModal) {
            this.modals.startScreenModal.setTranslationFunction(t);
            this.modals.startScreenModal.updateLocalization();
        }

        if (this.modals.pause) {
            this.modals.pause.updateLocalization();
        }

        if (this.modals.restartConfirmation) {
            this.modals.restartConfirmation.setTranslationFunction(t);
            this.modals.restartConfirmation.updateLocalization();
        }

        if (this.modals.exitConfirmation) {
            this.modals.exitConfirmation.setTranslationFunction(t);
            this.modals.exitConfirmation.updateLocalization();
        }

        if (this.modals.helpMenu) {
            this.modals.helpMenu.updateLocalization();
        }

        if (this.modals.guide) {
            if (this.modals.guide.updateLocalization) {
                this.modals.guide.updateLocalization();
            }
        }

        if (this.modals.levelUp) {
            this.modals.levelUp.updateLocalization();
        }

        if (this.modals.chest) {
            this.modals.chest.setTranslationFunction(t);
            if (typeof this.modals.chest.updateLocalization === 'function') {
                this.modals.chest.updateLocalization();
            }
        }

        if (this.modals.options) {
            this.modals.options.updateLocalization();
            this.modals.options.setLanguageValue(this.currentLanguage);
        }

        if (this.modals.aboutModal) {
            this.modals.aboutModal.setTranslationFunction(t);
            this.modals.aboutModal.updateLocalization();
        }

        if (this.modals.scoreboard) {
            this.modals.scoreboard.setTranslationFunction(t);
            this.modals.scoreboard.updateLocalization();
        }

        if (this.modals.scoreDetail) {
            this.modals.scoreDetail.setTranslationFunction(t);
        }

        if (this.modals.gameOver) {
            this.modals.gameOver.setTranslationFunction(t);
            this.modals.gameOver.updateLocalization();
        }

        if (this.touchControlsUI) {
            this.touchControlsUI.setTranslationFunction(t);
            this.touchControlsUI.updateLocalization();
        }

        this.updateFooterVersion();
    }

    updateFooterVersion() {
        const footerVersion = document.getElementById('footer-version');
        if (footerVersion) {
            const label = this.t ? this.t('versionLabel') : 'Version';
            footerVersion.textContent = `${label} v${GAME_INFO.VERSION}`;
        }
    }

    loadUserSettings() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = window.localStorage.getItem('vibe-survivor-settings');
                if (stored) {
                    const settings = JSON.parse(stored);

                    // Restore language
                    // if (settings.language && this.translations[settings.language]) {
                    //     this.currentLanguage = settings.language;
                    // }

                    // Restore audio settings
                    if (settings.musicMuted !== undefined) {
                        this.audioManager.setMusicMuted(settings.musicMuted);
                    }
                    if (settings.sfxMuted !== undefined) {
                        this.audioManager.setSfxMuted(settings.sfxMuted);
                    }
                    if (settings.musicVolume !== undefined) {
                        this.audioManager.setMusicVolume(settings.musicVolume);
                    }
                    if (settings.sfxVolume !== undefined) {
                        this.audioManager.setSFXVolume(settings.sfxVolume);
                    }

                    // Restore dash button position
                    if (settings.dashButtonPosition) {
                        this.dashButtonPosition = settings.dashButtonPosition;
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load Vibe Survivor settings:', error);
        }
    }

    saveUserSettings() {
        try {
            const storedSettings = {
                language: this.currentLanguage,
                musicMuted: this.audioManager.isMusicMuted(),
                sfxMuted: this.audioManager.isSfxMuted(),
                musicVolume: this.audioManager.musicVolume,
                sfxVolume: this.audioManager.sfxVolume,
                dashButtonPosition: this.touchControls?.dashButton?.position || this.dashButtonPosition || 'right'
            };
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('vibe-survivor-settings', JSON.stringify(storedSettings));
            }
        } catch (error) {
            console.warn('Failed to save Vibe Survivor settings:', error);
        }
    }

    // Options Menu Methods
    showOptionsMenu() {
        if (!this.modals.options) return;

        if (this.menuNavigationState.menuType === 'start') {
            this.modals.options.setPreviousNavigationState({
                active: this.menuNavigationState.active,
                selectedIndex: this.menuNavigationState.selectedIndex,
                menuType: this.menuNavigationState.menuType,
                menuButtons: [...this.menuNavigationState.menuButtons],
                keyboardUsed: this.menuNavigationState.keyboardUsed
            });
        } else {
            this.modals.options.setPreviousNavigationState(null);
        }

        if (window.startScreenBot) {
            window.startScreenBot.hide();
        }

        // Sync volume sliders with current audio manager state
        this.modals.options.updateVolumeSliders(
            this.audioManager.musicVolume,
            this.audioManager.sfxVolume
        );

        this.modals.options.show();

        // Enable scrolling for mobile
        this.enableOptionsScrolling();
    }

    hideOptionsMenu() {
        if (!this.modals.options) return;

        this.modals.options.hide();

        // Disable scrolling handlers
        this.disableOptionsScrolling();

        if (!this.gameRunning && window.startScreenBot) {
            window.startScreenBot.show();
        }
    }

    // About Menu Methods
    showAboutMenu() {
        const aboutMenu = document.getElementById('about-menu');
        if (aboutMenu) {
            // Preserve current navigation state if we're on the start screen
            if (this.menuNavigationState.menuType === 'start') {
                this.previousNavigationState = {
                    active: this.menuNavigationState.active,
                    selectedIndex: this.menuNavigationState.selectedIndex,
                    menuType: this.menuNavigationState.menuType,
                    menuButtons: [...this.menuNavigationState.menuButtons],
                    keyboardUsed: this.menuNavigationState.keyboardUsed
                };
            }

            aboutMenu.style.display = 'flex';

            // Enable scrolling for mobile
            this.enableAboutScrolling();

            // Initialize keyboard navigation for about menu
            const socialLinks = Array.from(aboutMenu.querySelectorAll('.social-item'));
            const closeBtn = document.getElementById('close-about-btn');
            const aboutButtons = [...socialLinks, closeBtn].filter(btn => btn);

            if (aboutButtons.length > 0) {
                this.initializeMenuNavigation('about', aboutButtons);
            }

            // Hide start screen bot when about menu is open
            if (window.startScreenBot) {
                window.startScreenBot.hide();
            }
        }
    }

    hideAboutMenu() {
        const aboutMenu = document.getElementById('about-menu');
        if (aboutMenu) {
            aboutMenu.style.display = 'none';

            // Disable scrolling handlers
            this.disableAboutScrolling();

            // Restore previous navigation state if it exists (from start screen)
            if (this.previousNavigationState) {
                this.menuNavigationState.active = this.previousNavigationState.active;
                this.menuNavigationState.selectedIndex = this.previousNavigationState.selectedIndex;
                this.menuNavigationState.menuType = this.previousNavigationState.menuType;
                this.menuNavigationState.menuButtons = [...this.previousNavigationState.menuButtons];
                this.menuNavigationState.keyboardUsed = this.previousNavigationState.keyboardUsed;
                this.updateMenuSelection();
                this.previousNavigationState = null;
            }

            // Show start screen bot again if we're on the start screen
            if (!this.gameRunning && window.startScreenBot) {
                window.startScreenBot.show();
            }
        }
    }
}

// Export VibeSurvivor class for ES6 modules
export { VibeSurvivor };

// Initialize when ready - prevent multiple instances
// VibeSurvivor class defined

// Prevent multiple instances (only if not using ES6 modules)
if (typeof window !== 'undefined' && window.VIBE_SURVIVOR_AUTO_INIT === false) {
    // Skip auto-init when VIBE_SURVIVOR_AUTO_INIT is explicitly set to false
    console.log('Skipping auto-init (VIBE_SURVIVOR_AUTO_INIT = false)');
} else if (typeof window !== 'undefined' && window.vibeSurvivor) {
    // VibeSurvivor already exists
    console.log('VibeSurvivor already exists');
} else if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Creating VibeSurvivor instance
            if (!window.vibeSurvivor) {
                window.vibeSurvivor = new VibeSurvivor();
                // VibeSurvivor instance created
            }
        });
    } else {
        // Creating VibeSurvivor instance
        setTimeout(() => {
            if (!window.vibeSurvivor) {
                window.vibeSurvivor = new VibeSurvivor();
                // VibeSurvivor instance created
            }
        }, 200);
    }
}
