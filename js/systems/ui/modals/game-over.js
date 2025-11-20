/**
 * Game Over Modal
 * Death screen with final stats and retry option
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * GameOverModal - Displays game over screen with stats
 */
export class GameOverModal extends Modal {
    constructor(id = 'game-over-modal') {
        super(id, { closeOnEscape: false, closeOnBackdropClick: false });
        this.restartButton = null;
        this.exitButton = null;
        this.onRestartCallback = null;
        this.onExitCallback = null;

        // Keyboard navigation state
        this.keyboardHandler = null;
        this.selectedButtonIndex = 0;
        this.buttons = [];
        this.keyboardUsed = false;

        // Touch scroll handler (needed to stop event bubbling to canvas)
        this.touchScrollHandler = null;

        // Localization
        this.getTranslation = null;
    }

    /**
     * Initializes game over modal elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.restartButton = this.element.querySelector('.gameover-restart-btn');
            this.exitButton = this.element.querySelector('.gameover-exit-btn');

            if (this.restartButton) {
                this.restartButton.addEventListener('click', () => this.handleRestart());
            }
            if (this.exitButton) {
                this.exitButton.addEventListener('click', () => this.handleExit());
            }
            if (this.getTranslation) {
                this.updateLocalization();
            }
        }
        return result;
    }

    /**
     * Sets callback for restart action
     * @param {Function} callback - Restart callback
     */
    onRestart(callback) {
        this.onRestartCallback = callback;
    }

    /**
     * Sets callback for exit action
     * @param {Function} callback - Exit callback
     */
    onExit(callback) {
        this.onExitCallback = callback;
    }

    /**
     * Sets translation function
     * @param {Function} getTranslation - Translation lookup
     */
    setTranslationFunction(getTranslation) {
        this.getTranslation = getTranslation;
        this.updateLocalization();
    }

    /**
     * Updates modal with final game stats
     * @param {Object} data - Game over data
     * @param {number} data.level - Final level reached
     * @param {string} data.timeText - Time survived (formatted)
     * @param {number} data.enemiesKilled - Enemies defeated
     * @param {number} data.bossesKilled - Bosses defeated
     * @param {Array} data.weapons - Final weapons
     * @param {Object} data.passives - Final passives
     * @param {string} data.weaponsHTML - Pre-generated weapons HTML
     * @param {string} data.passivesHTML - Pre-generated passives HTML
     * @param {string} data.playerStatsHTML - Pre-generated player stats HTML
     */
    update(data) {
        if (!data) return;

        // Update basic stats
        this.updateStat('final-level', data.level);
        this.updateStat('final-time', data.timeText);
        this.updateStat('enemies-killed', data.enemiesKilled);

        // Update bosses (show row if any bosses killed)
        const bossesRow = this.element?.querySelector('.gameover-bosses-row');
        if (bossesRow) {
            if (data.bossesKilled > 0) {
                bossesRow.style.display = 'flex';
                this.updateStat('bosses-defeated', data.bossesKilled);
            } else {
                bossesRow.style.display = 'none';
            }
        }

        // Update detailed sections with pre-generated HTML
        if (data.weaponsHTML) {
            const weaponsSection = this.element?.querySelector('.gameover-weapons-section');
            if (weaponsSection) weaponsSection.innerHTML = data.weaponsHTML;
        }

        if (data.passivesHTML) {
            const passivesSection = this.element?.querySelector('.gameover-passives-section');
            if (passivesSection) passivesSection.innerHTML = data.passivesHTML;
        }

        if (data.playerStatsHTML) {
            const playerStatsSection = this.element?.querySelector('.gameover-player-stats-section');
            if (playerStatsSection) playerStatsSection.innerHTML = data.playerStatsHTML;
        }
    }

    /**
     * Updates a specific stat element
     * @param {string} statId - Stat element ID
     * @param {string|number} value - Stat value
     */
    updateStat(statId, value) {
        const element = this.element?.querySelector(`#${statId}, .${statId}`);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Updates weapons section
     * @param {Array} weapons - Final weapons array
     */
    updateWeaponsSection(weapons) {
        const weaponsContainer = this.element?.querySelector('.gameover-weapons');
        if (!weaponsContainer) return;

        const weaponsHTML = weapons.map(weapon => `
            <div class="gameover-weapon-item">
                <span class="weapon-name">${weapon.name}</span>
                <span class="weapon-level">Lv${weapon.level}</span>
            </div>
        `).join('');

        const emptyText = this.getTranslation ? this.getTranslation('noWeapons') : 'No weapons acquired';
        weaponsContainer.innerHTML = weaponsHTML || `<p>${emptyText}</p>`;
    }

    /**
     * Updates passives section
     * @param {Object} passives - Final passives object
     */
    updatePassivesSection(passives) {
        const passivesContainer = this.element?.querySelector('.gameover-passives');
        if (!passivesContainer) return;

        const passiveEntries = Object.entries(passives);
        const passivesHTML = passiveEntries.map(([key, stacks]) => `
            <div class="gameover-passive-item">
                <span class="passive-name">${this.getPassiveName(key)}</span>
                <span class="passive-stacks">x${stacks}</span>
            </div>
        `).join('');

        const emptyText = this.getTranslation ? this.getTranslation('noPassives') : 'No passives acquired';
        passivesContainer.innerHTML = passivesHTML || `<p>${emptyText}</p>`;
    }

    /**
     * Gets display name for passive
     * @param {string} passiveKey - Passive key
     * @returns {string} Display name
     */
    getPassiveName(passiveKey) {
        if (this.getTranslation) {
            const translated = this.getTranslation(passiveKey, 'passives');
            if (translated && translated !== passiveKey) {
                return translated;
            }
        }

        const names = {
            health_boost: 'Health Boost',
            speed_boost: 'Speed Boost',
            regeneration: 'Regeneration',
            magnet: 'Magnet',
            armor: 'Armor',
            critical: 'Critical Hit',
            dash_boost: 'Dash Boost'
        };
        return names[passiveKey] || passiveKey;
    }

    /**
     * Handles restart button click
     */
    handleRestart() {
        if (this.onRestartCallback) {
            this.onRestartCallback();
        }
        this.hide();
    }

    /**
     * Handles exit button click
     */
    handleExit() {
        if (this.onExitCallback) {
            this.onExitCallback();
        }
        this.hide();
    }

    /**
     * Scrolls the game over content
     * @param {string} direction - 'up' or 'down'
     */
    scrollContent(direction) {
        const scrollContent = this.element?.querySelector('.game-over-scroll-content');
        if (!scrollContent) return;

        const scrollAmount = 50;

        if (direction === 'up') {
            scrollContent.scrollBy({
                top: -scrollAmount,
                behavior: 'smooth'
            });
        } else if (direction === 'down') {
            scrollContent.scrollBy({
                top: scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Updates button selection visual highlight
     */
    updateButtonSelection() {
        // Remove previous selection styling
        this.buttons.forEach(button => {
            button.classList.remove('menu-selected');
            button.style.boxShadow = '';
            button.style.borderColor = '';
        });

        // Only show visual selection if keyboard has been used
        if (this.keyboardUsed && this.buttons[this.selectedButtonIndex]) {
            const selectedButton = this.buttons[this.selectedButtonIndex];
            selectedButton.classList.add('menu-selected');
            selectedButton.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8)';
            selectedButton.style.borderColor = '#00ffff';
        }
    }

    /**
     * Sets up keyboard event handlers
     */
    setupKeyboardHandlers() {
        // Store buttons for navigation
        this.buttons = [this.restartButton, this.exitButton].filter(Boolean);
        this.selectedButtonIndex = 0;
        this.keyboardUsed = false;

        // Create keyboard handler
        this.keyboardHandler = (e) => {
            // Scroll controls (W/S, Arrow Up/Down)
            if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                this.scrollContent('up');
            } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
                e.preventDefault();
                this.scrollContent('down');
            }
            // Button navigation (Arrow Left/Right)
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.keyboardUsed = true;

                if (e.key === 'ArrowLeft') {
                    this.selectedButtonIndex = Math.max(0, this.selectedButtonIndex - 1);
                } else {
                    this.selectedButtonIndex = (this.selectedButtonIndex + 1) % this.buttons.length;
                }

                this.updateButtonSelection();
            }
            // Activate selected button (Enter)
            else if (e.key === 'Enter') {
                if (this.keyboardUsed && this.buttons[this.selectedButtonIndex]) {
                    e.preventDefault();
                    this.buttons[this.selectedButtonIndex].click();
                }
            }
        };

        // Add event listener
        document.addEventListener('keydown', this.keyboardHandler);

        // Add navigation styles
        this.addNavigationStyles();
    }

    /**
     * Adds CSS for keyboard navigation
     */
    addNavigationStyles() {
        if (document.getElementById('gameover-nav-styles')) return;

        const style = document.createElement('style');
        style.id = 'gameover-nav-styles';
        style.textContent = `
            .menu-selected {
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8) !important;
                border-color: #00ffff !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Removes keyboard event handlers
     */
    cleanupKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }
        this.selectedButtonIndex = 0;
        this.keyboardUsed = false;
        this.buttons = [];
    }

    /**
     * Shows game over modal
     */
    onShow() {
        // Set up keyboard handlers
        this.setupKeyboardHandlers();

        // Enable touch scrolling (critical for mobile)
        this.enableTouchScrolling();

        // Focus the scrollable content for keyboard scrolling
        const scrollContent = this.element?.querySelector('.game-over-scroll-content');
        if (scrollContent) {
            scrollContent.focus({ preventScroll: true });
        }
    }

    /**
     * Hides game over modal
     */
    onHide() {
        // Clean up keyboard handlers
        this.cleanupKeyboardHandlers();

        // Disable touch scrolling
        this.disableTouchScrolling();
    }

    /**
     * Enables touch scrolling for mobile devices
     * Uses stopPropagation to prevent events from bubbling to canvas
     */
    enableTouchScrolling() {
        const scrollContent = this.element?.querySelector('.game-over-scroll-content');
        if (!scrollContent) return;

        // Remove existing handlers if any
        if (this.touchScrollHandler) {
            scrollContent.removeEventListener('touchstart', this.touchScrollHandler.start, { passive: true });
            scrollContent.removeEventListener('touchmove', this.touchScrollHandler.move, { passive: true });
            scrollContent.removeEventListener('touchend', this.touchScrollHandler.end, { passive: true });
        }

        // Create handlers that stop event bubbling (prevents canvas touch handlers from interfering)
        this.touchScrollHandler = {
            start: (e) => {
                e.stopPropagation(); // Critical: prevents bubbling to canvas
            },
            move: (e) => {
                e.stopPropagation(); // Critical: prevents bubbling to canvas
            },
            end: (e) => {
                e.stopPropagation(); // Critical: prevents bubbling to canvas
            }
        };

        // Add touch listeners with passive: true for smooth native scrolling
        scrollContent.addEventListener('touchstart', this.touchScrollHandler.start, { passive: true });
        scrollContent.addEventListener('touchmove', this.touchScrollHandler.move, { passive: true });
        scrollContent.addEventListener('touchend', this.touchScrollHandler.end, { passive: true });
    }

    /**
     * Disables touch scrolling handlers
     */
    disableTouchScrolling() {
        const scrollContent = this.element?.querySelector('.game-over-scroll-content');
        if (!scrollContent || !this.touchScrollHandler) return;

        scrollContent.removeEventListener('touchstart', this.touchScrollHandler.start, { passive: true });
        scrollContent.removeEventListener('touchmove', this.touchScrollHandler.move, { passive: true });
        scrollContent.removeEventListener('touchend', this.touchScrollHandler.end, { passive: true });
        this.touchScrollHandler = null;
    }

    /**
     * Updates localized text (title/buttons)
     */
    updateLocalization() {
        if (!this.getTranslation || !this.element) return;

        const t = this.getTranslation;

        const title = this.element.querySelector('.gameover-title');
        if (title) title.textContent = t('gameOver');

        const restartBtn = this.element.querySelector('.gameover-restart-btn');
        if (restartBtn) restartBtn.textContent = t('playAgain');

        const exitBtn = this.element.querySelector('.gameover-exit-btn');
        if (exitBtn) exitBtn.textContent = t('exit');

        const levelLabel = this.element.querySelector('[data-i18n="level"]');
        if (levelLabel) levelLabel.textContent = t('level');

        const timeLabel = this.element.querySelector('[data-i18n="time"]');
        if (timeLabel) timeLabel.textContent = t('time');

        const enemiesLabel = this.element.querySelector('[data-i18n="enemies"]');
        if (enemiesLabel) enemiesLabel.textContent = t('enemies');

        const bossesLabel = this.element.querySelector('[data-i18n="bosses"]');
        if (bossesLabel) bossesLabel.textContent = t('bossesDefeated');
    }
}
