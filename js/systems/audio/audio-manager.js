/**
 * Audio Manager System
 * Manages background music and sound effects
 * Extracted from vibe-survivor-game.js during Phase 11 refactoring
 */

/**
 * AudioManager - Manages all audio playback
 */
export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.music = null;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.5;
        this.musicMuted = false;
        this.sfxMuted = false;
        this.initialized = false;
    }

    /**
     * Initializes audio system
     * Loads background music
     */
    async init() {
        try {
            this.music = new Audio('sound/Vibe_Survivor.mp3');
            this.music.loop = true;
            this.music.volume = this.musicVolume;
            this.initialized = true;
        } catch (error) {
            console.warn('Failed to load background music:', error);
            this.initialized = false;
        }
    }

    /**
     * Loads all game sound effects from asset configuration
     * @param {Object} audioAssets - Audio assets from ASSET_PATHS.audio
     */
    loadGameSounds(audioAssets) {
        if (!audioAssets) return;

        // Load all SFX sounds (skip bgMusic)
        Object.entries(audioAssets).forEach(([name, path]) => {
            if (name !== 'bgMusic') {
                this.loadSound(name, path);
            }
        });
    }

    /**
     * Plays background music
     */
    playMusic() {
        if (this.music && !this.musicMuted && this.initialized) {
            this.music.play().catch(e => {
                console.warn('Music playback failed:', e);
            });
        }
    }

    /**
     * Stops background music and resets to beginning
     */
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
        }
    }

    /**
     * Pauses background music
     */
    pauseMusic() {
        if (this.music) {
            this.music.pause();
        }
    }

    /**
     * Resumes background music
     */
    resumeMusic() {
        if (this.music && !this.musicMuted && this.initialized) {
            this.music.play().catch(e => {
                console.warn('Music resume failed:', e);
            });
        }
    }

    /**
     * Resets music to beginning
     */
    resetMusic() {
        if (this.music) {
            this.music.currentTime = 0;
        }
    }

    /**
     * Loads a sound effect
     * @param {string} name - Sound identifier
     * @param {string} path - Path to audio file
     */
    loadSound(name, path) {
        try {
            const audio = new Audio(path);
            audio.volume = this.sfxVolume;
            this.sounds.set(name, audio);
        } catch (error) {
            console.warn(`Failed to load sound ${name}:`, error);
        }
    }

    /**
     * Plays a sound effect
     * @param {string} name - Sound identifier
     */
    playSound(name) {
        if (this.sfxMuted) return;

        const sound = this.sounds.get(name);
        if (sound) {
            // Clone audio for overlapping sounds
            const clone = sound.cloneNode();
            clone.volume = this.sfxVolume;
            clone.play().catch(e => {
                console.warn(`Sound ${name} playback failed:`, e);
            });
        }
    }

    /**
     * Sets music volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.music) {
            this.music.volume = this.musicMuted ? 0 : this.musicVolume;
        }
    }

    /**
     * Sets sound effects volume
     * @param {number} volume - Volume level (0.0 to 1.0)
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.sounds.forEach(sound => {
            sound.volume = this.sfxVolume;
        });
    }

    /**
     * Toggles music mute state
     * @returns {boolean} New music mute state
     */
    toggleMusicMute() {
        this.musicMuted = !this.musicMuted;
        if (this.music) {
            this.music.volume = this.musicMuted ? 0 : this.musicVolume;
        }
        return this.musicMuted;
    }

    /**
     * Sets music mute state
     * @param {boolean} muted - Music mute state
     */
    setMusicMuted(muted) {
        this.musicMuted = muted;
        if (this.music) {
            this.music.volume = this.musicMuted ? 0 : this.musicVolume;
        }
    }

    /**
     * Gets current music mute state
     * @returns {boolean}
     */
    isMusicMuted() {
        return this.musicMuted;
    }

    /**
     * Toggles SFX mute state
     * @returns {boolean} New SFX mute state
     */
    toggleSfxMute() {
        this.sfxMuted = !this.sfxMuted;
        return this.sfxMuted;
    }

    /**
     * Sets SFX mute state
     * @param {boolean} muted - SFX mute state
     */
    setSfxMuted(muted) {
        this.sfxMuted = muted;
    }

    /**
     * Gets current SFX mute state
     * @returns {boolean}
     */
    isSfxMuted() {
        return this.sfxMuted;
    }

    /**
     * Gets whether music is currently playing
     * @returns {boolean}
     */
    isMusicPlaying() {
        return this.music && !this.music.paused;
    }

    /**
     * Gets whether audio system is initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Cleans up audio resources
     */
    destroy() {
        this.stopMusic();
        this.sounds.clear();
        this.music = null;
        this.initialized = false;
    }
}
