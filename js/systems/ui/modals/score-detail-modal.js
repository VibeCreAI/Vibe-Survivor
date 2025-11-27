import { Modal } from './modal-base.js';
import { PASSIVES } from '../../../config/constants.js';

export class ScoreDetailModal extends Modal {
    constructor(id = 'score-detail-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: false });
        this.backButton = null;
        this.deleteButton = null;
        this.scrollContainer = null;

        this.versionEl = null;
        this.dateEl = null;
        this.summaryEls = {};
        this.weaponsSection = null;
        this.passivesSection = null;
        this.playerSection = null;

        this.currentScore = null;
        this.getTranslation = null;
        this.getWeaponName = null;
        this.onBackCallback = null;
        this.onDeleteCallback = null;
        this.keyboardHandler = null;
        this.actionButtons = [];
        this.buttonNavigationMode = false;
        this.buttonIndex = 0;
        this.confirmOverlay = null;
        this.confirmKeyHandler = null;

        // NEW: Submission properties
        this.submitButton = null;
        this.submissionStatus = null;
        this.submittedName = null;
        this.viewGlobalButton = null;
        this.onSubmitCallback = null;
        this.onViewGlobalCallback = null;

        // Modals for prompts/alerts
        this.promptModal = null;
        this.notificationModal = null;
    }

    init() {
        const result = super.init();
        if (!result) return false;

        this.backButton = this.element.querySelector('#score-detail-back-btn');
        this.deleteButton = this.element.querySelector('#score-detail-delete-btn');
        this.scrollContainer = this.element.querySelector('.score-detail-scroll');
        this.versionEl = this.element.querySelector('.score-detail-version');
        this.dateEl = this.element.querySelector('.score-detail-date');
        this.summaryEls = {
            level: this.element.querySelector('.score-detail-level'),
            time: this.element.querySelector('.score-detail-time'),
            enemies: this.element.querySelector('.score-detail-enemies'),
            bosses: this.element.querySelector('.score-detail-bosses'),
            chests: this.element.querySelector('.score-detail-chests')
        };
        this.weaponsSection = this.element.querySelector('.score-detail-weapons');
        this.passivesSection = this.element.querySelector('.score-detail-passives');
        this.playerSection = this.element.querySelector('.score-detail-player');

        // NEW: Submission elements
        this.submitButton = this.element.querySelector('#submit-to-global-btn');
        this.submissionStatus = this.element.querySelector('#submission-status');
        this.submittedName = this.element.querySelector('#submitted-name');
        this.viewGlobalButton = this.element.querySelector('#view-on-global-btn');

        this.actionButtons = [this.backButton, this.deleteButton, this.submitButton].filter(Boolean);

        if (this.backButton) {
            this.backButton.addEventListener('click', () => this.handleBack());
        }

        if (this.deleteButton) {
            this.deleteButton.addEventListener('click', () => this.handleDelete());
        }

        // NEW: Submission event handlers
        if (this.submitButton) {
            this.submitButton.addEventListener('click', () => this.handleSubmit());
        }

        if (this.viewGlobalButton) {
            this.viewGlobalButton.addEventListener('click', () => this.handleViewGlobal());
        }

        this.updateLocalization();
        return true;
    }

    setTranslationFunction(getTranslation) {
        this.getTranslation = getTranslation;
        this.updateLocalization();
    }

    setHelpers({ getWeaponName } = {}) {
        this.getWeaponName = getWeaponName;
    }

    setModals({ promptModal, notificationModal } = {}) {
        this.promptModal = promptModal;
        this.notificationModal = notificationModal;
    }

    onBack(callback) {
        this.onBackCallback = callback;
    }

    onDelete(callback) {
        this.onDeleteCallback = callback;
    }

    // NEW: Submission callbacks
    onSubmit(callback) {
        this.onSubmitCallback = callback;
    }

    onViewGlobal(callback) {
        this.onViewGlobalCallback = callback;
    }

    showScore(score) {
        if (!score) return;
        this.currentScore = score;
        this.renderScore(score);
        super.show();
        if (this.element) {
            this.element.style.display = 'flex';
        }

        // Setup keyboard handlers
        this.setupKeyboardHandlers();

        if (this.scrollContainer) {
            this.scrollContainer.scrollTop = 0;
            setTimeout(() => this.scrollContainer.focus({ preventScroll: true }), 50);
        }
        this.buttonNavigationMode = false;
        this.buttonIndex = 0;
    }

    updateLocalization() {
        if (!this.getTranslation) return;
        const t = this.getTranslation;

        const title = this.element?.querySelector('.score-detail-title');
        if (title) title.textContent = t('scoreDetailTitle') || 'Run Details';

        const backText = t('scoreboardBackToList') || 'BACK TO LIST';
        if (this.backButton) this.backButton.textContent = backText;

        const deleteText = t('scoreboardDelete') || 'DELETE RECORD';
        if (this.deleteButton) this.deleteButton.textContent = deleteText;

        const headings = this.element?.querySelectorAll('[data-heading="weapons"]');
        headings?.forEach(el => el.textContent = t('scoreboardWeaponsHeading') || 'Weapons');

        const passiveHeading = this.element?.querySelectorAll('[data-heading="passives"]');
        passiveHeading?.forEach(el => el.textContent = t('scoreboardPassivesHeading') || 'Passives');

        const playerHeading = this.element?.querySelectorAll('[data-heading="player"]');
        playerHeading?.forEach(el => el.textContent = t('scoreboardPlayerHeading') || 'Player Stats');
    }

    renderScore(score) {
        const formatter = new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        const dateText = score.date ? formatter.format(new Date(score.date)) : '';

        if (this.versionEl) this.versionEl.textContent = `v${score.version || score.majorVersion || '1.0.1'}`;
        if (this.dateEl) this.dateEl.textContent = dateText;

        if (this.summaryEls.level) {
            const label = this.getLabel('level', 'Level');
            this.summaryEls.level.innerHTML = `<span class="label">${label}</span><span class="value">Lv.${score.level}</span>`;
        }
        if (this.summaryEls.time) {
            const label = this.getLabel('time', 'Time');
            this.summaryEls.time.innerHTML = `<span class="label">${label}</span><span class="value">${score.timeText || this.formatTime(score.time)}</span>`;
        }
        if (this.summaryEls.enemies) {
            const label = this.getLabel('enemies', 'Enemies');
            this.summaryEls.enemies.innerHTML = `<span class="label">${label}</span><span class="value">${score.enemiesKilled ?? 0}</span>`;
        }
        if (this.summaryEls.bosses) {
            const label = this.getLabel('bosses', 'Bosses');
            this.summaryEls.bosses.innerHTML = `<span class="label">${label}</span><span class="value">${score.bossesKilled ?? 0}</span>`;
        }
        if (this.summaryEls.chests) {
            const label = this.getLabel('chestsCollected', 'Chests');
            this.summaryEls.chests.innerHTML = `<span class="label">${label}</span><span class="value">${score.chestsCollected ?? 0}</span>`;
        }

        this.renderWeapons(score.weapons || []);
        this.renderPassives(score.passives || {});
        this.renderPlayerStats(score.playerStats || {});

        // NEW: Update submission UI
        this.updateSubmissionUI(score);
    }

    renderWeapons(weapons) {
        if (!this.weaponsSection) return;
        const t = this.getTranslation;
        if (!weapons.length) {
            const emptyText = t ? t('scoreboardNoWeapons') || t('noWeapons') : 'No weapons recorded';
            this.weaponsSection.innerHTML = `<p class="scoreboard-empty-line">${emptyText}</p>`;
            return;
        }

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
            'gatling_gun': 'gatlingGun',
            'napalm_buckshot': 'napalmBuckshot'
        };

        const damageHeading = t ? t('scoreboardStatsHeading') || t('totalDamage') : 'Damage';
        const totalLabel = this.getLabel('totalDamage', 'Total');
        const bossLabel = this.getLabel('vsBosses', 'Bosses');
        const enemyLabel = this.getLabel('vsEnemies', 'Enemies');

        const cards = weapons
            .map(weapon => ({ weapon, totalDamage: weapon.totalDamage ?? 0 }))
            .sort((a, b) => b.totalDamage - a.totalDamage)
            .map(({ weapon }) => {
                const iconName = weaponIconMap[weapon.type] || 'basicMissile';
                const name = this.getWeaponName ? this.getWeaponName(weapon.type) : weapon.type;
                const mergeClass = weapon.isMergeWeapon ? 'weapon-merge' : '';
                return `
                        <div class="score-detail-weapon ${mergeClass}">
                            <div class="weapon-left">
                                <img src="images/weapons/${iconName}.png" alt="${name}">
                                <div class="weapon-info">
                                    <div class="weapon-name">${name}</div>
                                    <div class="weapon-meta">LV.${weapon.level} • ${damageHeading}</div>
                                </div>
                            </div>
                        <div class="weapon-damage">
                            <div class="weapon-damage-item" title="${totalLabel}">
                                <span class="weapon-damage-label">${totalLabel}</span>
                                <span class="weapon-damage-value">${this.formatDamageValue(weapon.totalDamage)}</span>
                            </div>
                            <div class="weapon-damage-item" title="${bossLabel}">
                                <span class="weapon-damage-label">${bossLabel}</span>
                                <span class="weapon-damage-value">${this.formatDamageValue(weapon.bossDamage)}</span>
                            </div>
                            <div class="weapon-damage-item" title="${enemyLabel}">
                                <span class="weapon-damage-label">${enemyLabel}</span>
                                <span class="weapon-damage-value">${this.formatDamageValue(weapon.enemyDamage)}</span>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');

        this.weaponsSection.innerHTML = cards;
    }

    renderPassives(passives) {
        if (!this.passivesSection) return;
        const t = this.getTranslation;
        const passiveEntries = Object.keys(passives)
            .map(key => ({ key, data: passives[key] }))
            .filter(entry => entry.data && entry.data.active);

        if (!passiveEntries.length) {
            const emptyText = t ? (t('scoreboardNoPassives') || t('noPassives')) : 'No passives recorded';
            this.passivesSection.innerHTML = `<p class="scoreboard-empty-line">${emptyText}</p>`;
            return;
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

        const passiveKeys = {
            'health_boost': 'healthBoost',
            'speed_boost': 'speedBoost',
            'regeneration': 'regeneration',
            'magnet': 'magnet',
            'armor': 'armor',
            'critical': 'criticalStrike',
            'dash_boost': 'dashBoost',
            'turbo_flux_cycler': 'turboFlux',
            'aegis_impact_core': 'aegisCore',
            'splitstream_matrix': 'splitstreamMatrix',
            'macro_charge_amplifier': 'macroCharge',
            'mod_bay_expander': 'modBay'
        };
        const uniqueLabel = t ? t('uniqueBadgeLabel') || 'Unique' : 'Unique';

        const cards = passiveEntries.map(({ key, data }) => {
            const iconName = passiveIconMap[key] || 'upgrade';
            const translationKey = passiveKeys[key] || key;
            const displayName = t ? t(translationKey, 'passives') : key;
            const stacks = typeof data.stacks === 'number' ? data.stacks : 1;
            const passiveConfig = PASSIVES[key?.toUpperCase?.()] || PASSIVES[key] || {};
            const isUnique = !!passiveConfig.isUnique;
            const badge = isUnique ? `<span class="passive-badge">${uniqueLabel}</span>` : '';

            return `
                <div class="score-detail-passive${isUnique ? ' passive-unique' : ''}">
                    <div class="passive-left">
                        <img src="images/passives/${iconName}.png" alt="${displayName}">
                        <div class="passive-info">
                            <div class="passive-name">${displayName}</div>
                            ${badge}
                        </div>
                    </div>
                    <div class="passive-stack">x${stacks}</div>
                </div>
            `;
        }).join('');

        this.passivesSection.innerHTML = cards;
    }

    renderPlayerStats(stats) {
        if (!this.playerSection) return;
        const maxHealthLabel = this.getLabel('maxHealthLabel', 'Max Health');
        const speedLabel = this.getLabel('speedLabel', 'Speed');
        const chestLabel = this.getLabel('chestsCollected', 'Chests');

        const rows = [
            { label: maxHealthLabel, value: `${stats.maxHealth ?? '--'}` },
            { label: speedLabel, value: `${stats.speed ?? '--'}` },
            { label: chestLabel, value: `${stats.chestsCollected ?? 0}` }
        ];

        this.playerSection.innerHTML = rows.map(row => `
            <div class="player-stat-row">
                <span>${row.label}</span>
                <span class="stat-value">${row.value}</span>
            </div>
        `).join('');
    }

    handleBack() {
        // Cleanup keyboard handlers
        this.cleanupKeyboardHandlers();

        this.hide();
        if (this.onBackCallback) {
            this.onBackCallback();
        }
    }

    handleDelete() {
        if (!this.currentScore) return;
        const t = this.getTranslation;
        const confirmText = t ? t('scoreboardDeleteConfirm') : 'Delete this record?';

        this.showConfirm(confirmText, () => {
            if (this.onDeleteCallback) {
                this.onDeleteCallback(this.currentScore.id);
            }
        });
    }

    formatTime(totalSeconds = 0) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    formatDamageValue(value = 0) {
        const amount = Math.max(0, Math.round(value ?? 0));
        if (amount >= 1_000_000) {
            return `${(amount / 1_000_000).toFixed(1)}m`;
        }
        if (amount >= 100_000) {
            return `${Math.floor(amount / 1000)}k`;
        }
        return `${amount}`;
    }

    getLabel(key, fallback) {
        if (!this.getTranslation) return fallback;
        const value = this.getTranslation(key);
        return value === key ? fallback : (value || fallback);
    }

    setupKeyboardHandlers() {
        this.cleanupKeyboardHandlers();
        this.keyboardHandler = (e) => {
            if (!this.visible) return;
            if (this.confirmOverlay) return;

            const key = e.key.toLowerCase();

            // Block ALL navigation keys to prevent start screen navigation
            const navigationKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'enter', ' ', 'escape', 'tab'];

            if (navigationKeys.includes(key)) {
                e.preventDefault();
                e.stopPropagation();
            }

            // Handle escape to go back
            if (key === 'escape') {
                this.handleBack();
                return;
            }

            // Button navigation mode
            if (this.buttonNavigationMode) {
                if (key === 'arrowdown' || key === 's') {
                    if (this.buttonIndex < this.actionButtons.length - 1) {
                        this.buttonIndex += 1;
                        this.updateButtonSelection();
                    }
                    return;
                }
                if (key === 'arrowup' || key === 'w') {
                    if (this.buttonIndex > 0) {
                        this.buttonIndex -= 1;
                        this.updateButtonSelection();
                        return;
                    }
                    this.exitButtonNavigation();
                    return;
                }
                if (key === 'enter' || key === ' ') {
                    const btn = this.actionButtons[this.buttonIndex];
                    if (btn) {
                        btn.click();
                    }
                    return;
                }
            }

            // Handle arrow up/down/w/s for scrolling and transition to buttons
            if (key === 'arrowdown' || key === 's') {
                if (this.scrollContainer) {
                    const atBottom = this.scrollContainer.scrollTop + this.scrollContainer.clientHeight >= this.scrollContainer.scrollHeight - 5;
                    if (atBottom && this.actionButtons.length) {
                        this.enterButtonNavigation();
                    } else {
                        this.scrollContainer.scrollBy({ top: 60, behavior: 'smooth' });
                    }
                } else if (this.actionButtons.length) {
                    this.enterButtonNavigation();
                }
                return;
            }

            if (key === 'arrowup' || key === 'w') {
                if (this.scrollContainer) {
                    const atTop = this.scrollContainer.scrollTop <= 5;
                    if (atTop) {
                        return;
                    }
                    this.scrollContainer.scrollBy({ top: -60, behavior: 'smooth' });
                }
                return;
            }

            // Block left/right arrows and A/D to prevent start screen navigation
            if (key === 'arrowleft' || key === 'arrowright' || key === 'a' || key === 'd') {
                return;
            }

            // Block tab
            if (key === 'tab') {
                return;
            }
        };

        // Use capture: true to intercept events before they reach global handlers
        document.addEventListener('keydown', this.keyboardHandler, { capture: true });
    }

    cleanupKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
            this.keyboardHandler = null;
        }
        this.buttonNavigationMode = false;
        this.buttonIndex = 0;
        this.actionButtons.forEach(btn => btn?.classList.remove('menu-selected'));
        if (this.confirmKeyHandler) {
            document.removeEventListener('keydown', this.confirmKeyHandler, { capture: true });
            this.confirmKeyHandler = null;
        }
    }

    enterButtonNavigation() {
        if (!this.actionButtons.length) return;
        this.buttonNavigationMode = true;
        this.buttonIndex = Math.min(this.buttonIndex, this.actionButtons.length - 1);
        this.updateButtonSelection();
    }

    exitButtonNavigation() {
        this.buttonNavigationMode = false;
        this.buttonIndex = 0;
        this.actionButtons.forEach(btn => btn?.classList.remove('menu-selected'));
        if (this.scrollContainer) {
            this.scrollContainer.focus({ preventScroll: true });
        }
    }

    updateButtonSelection() {
        this.actionButtons.forEach((btn, i) => {
            if (!btn) return;
            if (i === this.buttonIndex) {
                btn.classList.add('menu-selected');
                btn.focus({ preventScroll: true });
            } else {
                btn.classList.remove('menu-selected');
            }
        });
    }

    showConfirm(message, onConfirm) {
        if (!this.element) return;
        if (this.confirmOverlay) {
            this.confirmOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'scoreboard-confirm-overlay';
        overlay.innerHTML = `
            <div class="scoreboard-confirm">
                <p>${message}</p>
                <div class="scoreboard-confirm-actions">
                    <button class="survivor-btn destructive confirm-yes">YES</button>
                    <button class="survivor-btn confirm-no">NO</button>
                </div>
            </div>
        `;

        const yesBtn = overlay.querySelector('.confirm-yes');
        const noBtn = overlay.querySelector('.confirm-no');
        const cleanup = () => {
            overlay.remove();
            this.confirmOverlay = null;
            if (this.confirmKeyHandler) {
                document.removeEventListener('keydown', this.confirmKeyHandler, { capture: true });
                this.confirmKeyHandler = null;
            }
        };

        yesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cleanup();
            if (onConfirm) onConfirm();
        });

        noBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cleanup();
        });

        this.element.appendChild(overlay);
        this.confirmOverlay = overlay;

        const buttons = [yesBtn, noBtn];
        let idx = 0;
        const setSelection = (i) => {
            idx = Math.max(0, Math.min(i, buttons.length - 1));
            buttons.forEach((btn, bi) => {
                if (bi === idx) {
                    btn.classList.add('menu-selected');
                    btn.focus({ preventScroll: true });
                } else {
                    btn.classList.remove('menu-selected');
                }
            });
        };
        setSelection(0);

        this.confirmKeyHandler = (e) => {
            if (!this.confirmOverlay) return;
            const key = e.key.toLowerCase();
            const nav = ['arrowup', 'arrowdown', 'w', 's', 'enter', ' ', 'escape'];
            if (nav.includes(key)) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (key === 'escape') {
                cleanup();
                return;
            }
            if (key === 'arrowdown' || key === 's') {
                setSelection(idx + 1);
                return;
            }
            if (key === 'arrowup' || key === 'w') {
                setSelection(idx - 1);
                return;
            }
            if (key === 'enter' || key === ' ') {
                buttons[idx]?.click();
            }
        };

        document.addEventListener('keydown', this.confirmKeyHandler, { capture: true });
    }

    // NEW: Submission methods
    async handleSubmit() {
        if (!this.currentScore) return;

        const t = this.getTranslation;
        const promptMessage = (t && t('enterPlayerName')) || 'Enter your display name (3-20 characters):';

        // Use custom prompt modal if available, otherwise fallback to browser prompt
        const playerName = this.promptModal
            ? await this.promptModal.prompt(promptMessage, 'Player name', '')
            : prompt(promptMessage);

        if (!playerName) return;

        // Client-side validation
        const trimmed = playerName.trim();
        if (trimmed.length < 3 || trimmed.length > 20) {
            if (this.notificationModal) {
                await this.notificationModal.notify('Player name must be 3-20 characters', 'error');
            } else {
                alert('Player name must be 3-20 characters');
            }
            return;
        }

        if (!/^[\p{L}\p{N}\s_-]+$/u.test(trimmed)) {
            if (this.notificationModal) {
                await this.notificationModal.notify('Player name can only contain letters, numbers, spaces, _ and -', 'error');
            } else {
                alert('Player name can only contain letters, numbers, spaces, _ and -');
            }
            return;
        }

        // Show submitting state
        if (this.submitButton) {
            this.submitButton.disabled = true;
            this.submitButton.textContent = 'SUBMITTING...';
        }

        // Call submission callback
        if (this.onSubmitCallback) {
            const success = await this.onSubmitCallback(this.currentScore, trimmed);

            if (success) {
                this.updateSubmissionUI(this.currentScore);
            } else {
                // Re-enable button on failure
                if (this.submitButton) {
                    this.submitButton.disabled = false;
                    this.submitButton.textContent = 'SUBMIT TO GLOBAL';
                }
            }
        }
    }

    handleViewGlobal() {
        if (this.onViewGlobalCallback) {
            this.onViewGlobalCallback();
        }
    }

    async updateSubmissionUI(score) {
        // If this is a global score (read-only), hide delete and submit buttons
        if (score.isGlobal) {
            if (this.deleteButton) this.deleteButton.style.display = 'none';
            if (this.submitButton) this.submitButton.style.display = 'none';
            if (this.submissionStatus) this.submissionStatus.style.display = 'none';
            return;
        }

        // Show delete button for local scores
        if (this.deleteButton) this.deleteButton.style.display = '';

        const { scoreboardStorage } = await import('../../../utils/scoreboard-storage.js');
        const status = scoreboardStorage.getSubmissionStatus(score.id);

        if (status && status.submitted) {
            // Hide submit button
            if (this.submitButton) this.submitButton.style.display = 'none';

            // Show submission status
            if (this.submissionStatus) {
                this.submissionStatus.style.display = 'flex';
                if (this.submittedName) {
                    this.submittedName.textContent = status.playerName;
                }
            }
        } else {
            // Show submit button
            if (this.submitButton) {
                this.submitButton.style.display = 'block';
                this.submitButton.disabled = false;
            }

            // Hide submission status
            if (this.submissionStatus) {
                this.submissionStatus.style.display = 'none';
            }
        }
    }
}
