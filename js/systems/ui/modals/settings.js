/**
 * Settings Modal
 * Game settings (audio, controls, language, etc.)
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * SettingsModal - Game settings configuration
 */
export class SettingsModal extends Modal {
    constructor(id = 'settings-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: false });
        this.musicVolumeSlider = null;
        this.sfxVolumeSlider = null;
        this.languageSelect = null;
        this.closeButton = null;
        this.onSettingsChangeCallback = null;
    }

    /**
     * Initializes settings modal elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.musicVolumeSlider = this.element.querySelector('#music-volume');
            this.sfxVolumeSlider = this.element.querySelector('#sfx-volume');
            this.languageSelect = this.element.querySelector('#language-select');
            this.closeButton = this.element.querySelector('.settings-close-btn');

            // Set up event listeners
            if (this.musicVolumeSlider) {
                this.musicVolumeSlider.addEventListener('input', (e) => this.handleMusicVolumeChange(e));
            }
            if (this.sfxVolumeSlider) {
                this.sfxVolumeSlider.addEventListener('input', (e) => this.handleSfxVolumeChange(e));
            }
            if (this.languageSelect) {
                this.languageSelect.addEventListener('change', (e) => this.handleLanguageChange(e));
            }
            if (this.closeButton) {
                this.closeButton.addEventListener('click', () => this.hide());
            }
        }
        return result;
    }

    /**
     * Sets callback for settings changes
     * @param {Function} callback - Callback(settingName, value)
     */
    onSettingsChange(callback) {
        this.onSettingsChangeCallback = callback;
    }

    /**
     * Updates modal with current settings
     * @param {Object} data - Current settings
     */
    update(data) {
        if (!data) return;

        if (this.musicVolumeSlider && data.musicVolume !== undefined) {
            this.musicVolumeSlider.value = data.musicVolume;
        }
        if (this.sfxVolumeSlider && data.sfxVolume !== undefined) {
            this.sfxVolumeSlider.value = data.sfxVolume;
        }
        if (this.languageSelect && data.language) {
            this.languageSelect.value = data.language;
        }
    }

    /**
     * Handles music volume change
     * @param {Event} event - Input event
     */
    handleMusicVolumeChange(event) {
        if (this.onSettingsChangeCallback) {
            this.onSettingsChangeCallback('musicVolume', parseFloat(event.target.value));
        }
    }

    /**
     * Handles SFX volume change
     * @param {Event} event - Input event
     */
    handleSfxVolumeChange(event) {
        if (this.onSettingsChangeCallback) {
            this.onSettingsChangeCallback('sfxVolume', parseFloat(event.target.value));
        }
    }

    /**
     * Handles language change
     * @param {Event} event - Change event
     */
    handleLanguageChange(event) {
        if (this.onSettingsChangeCallback) {
            this.onSettingsChangeCallback('language', event.target.value);
        }
    }
}
