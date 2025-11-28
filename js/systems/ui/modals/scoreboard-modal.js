import { Modal } from './modal-base.js';
import { scoreboardStorage } from '../../../utils/scoreboard-storage.js';
import { supabaseClient } from '../../../utils/supabase-client.js';

export class ScoreboardModal extends Modal {
    constructor(id = 'scoreboard-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: true });

        // Existing properties
        this.versionFilter = null;
        this.scoreList = null;
        this.listContainer = null; // kept for backward compatibility
        this.localListContainer = null;
        this.globalListContainer = null;
        this.emptyState = null;
        this.clearButton = null;
        this.closeButton = null;
        this.actionButtons = [];
        this.onScoreSelectedCallback = null;
        this.onCloseCallback = null;
        this.getTranslation = null;
        this.keyboardHandler = null;
        this.selectedCardIndex = 0;
        this.buttonNavigationMode = false;
        this.buttonIndex = 0;
        this.confirmOverlay = null;
        this.confirmKeyHandler = null;

        // NEW: Tab system properties
        this.activeTab = 'local'; // 'local' or 'global'
        this.tabButtons = { local: null, global: null };
        this.globalScoreList = null;
        this.globalLoadingState = null;
        this.globalErrorState = null;
        this.globalEmptyState = null;
        this.globalScores = [];
    }

    init() {
        const result = super.init();
        if (!result) return false;

        // Existing element references
        this.versionFilter = this.element.querySelector('#scoreboard-version-filter');
        this.scoreList = this.element.querySelector('#scoreboard-list');
        this.localListContainer = this.element.querySelector('[data-tab-pane="local"] .scoreboard-list-container');
        this.globalListContainer = this.element.querySelector('[data-tab-pane="global"] .scoreboard-list-container');
        this.listContainer = this.localListContainer || this.element.querySelector('.scoreboard-list-container');
        this.emptyState = this.element.querySelector('.scoreboard-empty-state');
        this.clearButton = this.element.querySelector('#scoreboard-clear-btn');
        this.closeButton = this.element.querySelector('#scoreboard-close-btn');
        this.actionButtons = [this.clearButton, this.closeButton].filter(Boolean);

        // NEW: Tab elements
        this.tabButtons.local = this.element.querySelector('[data-tab="local"]');
        this.tabButtons.global = this.element.querySelector('[data-tab="global"]');
        this.globalScoreList = this.element.querySelector('#global-scoreboard-list');
        this.globalLoadingState = this.element.querySelector('.global-loading-state');
        this.globalErrorState = this.element.querySelector('.global-error-state');
        this.globalEmptyState = this.element.querySelector('.global-empty-state');

        // Allow wheel/touch events inside the scroll areas to bypass modal blockers
        this.attachScrollGuards(this.localListContainer);
        this.attachScrollGuards(this.globalListContainer);

        this.attachEventHandlers();
        this.populateVersions();
        this.renderScores();
        this.updateLocalization();

        return true;
    }

    getActiveListContainer() {
        return this.activeTab === 'global'
            ? (this.globalListContainer || this.listContainer)
            : (this.localListContainer || this.listContainer);
    }

    attachEventHandlers() {
        // Existing handlers
        if (this.versionFilter) {
            const handleChange = () => {
                if (this.activeTab === 'local') {
                    this.renderScores();
                } else {
                    this.loadGlobalScores();
                }
            };
            this.versionFilter.addEventListener('change', handleChange);
            this.versionFilter.addEventListener('input', handleChange);
        }

        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.handleClearScores());
        }

        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hide());
        }

        // NEW: Tab button handlers
        if (this.tabButtons.local) {
            const localHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchTab('local');
            };
            this.tabButtons.local.addEventListener('click', localHandler);
            this.tabButtons.local.addEventListener('touchend', localHandler);
        }

        if (this.tabButtons.global) {
            const globalHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.switchTab('global');
            };
            this.tabButtons.global.addEventListener('click', globalHandler);
            this.tabButtons.global.addEventListener('touchend', globalHandler);
        }
    }

    // NEW: Switch between LOCAL and GLOBAL tabs
    switchTab(tabName) {
        if (this.activeTab === tabName) return;

        this.activeTab = tabName;

        // Update tab button active states
        Object.entries(this.tabButtons).forEach(([name, button]) => {
            if (button) {
                if (name === tabName) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        });

        // Update tab pane visibility
        const localPane = this.element.querySelector('[data-tab-pane="local"]');
        const globalPane = this.element.querySelector('[data-tab-pane="global"]');

        if (localPane && globalPane) {
            if (tabName === 'local') {
                localPane.classList.add('active');
                globalPane.classList.remove('active');
                this.renderScores();
                // Show Clear All button on local tab
                if (this.clearButton) {
                    this.clearButton.style.display = '';
                }
            } else {
                localPane.classList.remove('active');
                globalPane.classList.add('active');
                this.loadGlobalScores();
                // Hide Clear All button on global tab
                if (this.clearButton) {
                    this.clearButton.style.display = 'none';
                }
            }
        }

        // Reset selection state
        this.selectedCardIndex = 0;
        this.buttonNavigationMode = false;

        // Focus active scroll area for keyboard/touch interactions
        const activeContainer = this.getActiveListContainer();
        if (activeContainer) {
            this.listContainer = activeContainer;
            requestAnimationFrame(() => activeContainer.focus({ preventScroll: true }));
        }
    }

    // NEW: Load global scores from Supabase
    async loadGlobalScores() {
        if (!supabaseClient.isAvailable()) {
            this.showGlobalError('Global leaderboard unavailable (offline mode)');
            return;
        }

        // Show loading state
        this.showGlobalLoading(true);

        try {
            const version = this.versionFilter?.value || 'all';
            const majorVersion = version === 'all' ? null : version;

            const result = await supabaseClient.fetchGlobalScores({
                majorVersion,
                limit: 100,
                offset: 0
            });

            if (result.success) {
                this.globalScores = result.scores || [];
                this.renderGlobalScores();
            } else {
                this.showGlobalError(result.error || 'Failed to load global scores');
            }
        } catch (error) {
            console.error('Error loading global scores:', error);
            this.showGlobalError('Failed to load global scores');
        } finally {
            this.showGlobalLoading(false);
        }
    }

    // NEW: Render global scores
    renderGlobalScores() {
        if (!this.globalScoreList) return;

        this.globalScoreList.innerHTML = '';

        // Hide all states initially
        this.showGlobalLoading(false);
        this.showGlobalError(null);
        if (this.globalEmptyState) this.globalEmptyState.style.display = 'none';

        if (!this.globalScores.length) {
            if (this.globalEmptyState) {
                this.globalEmptyState.style.display = 'block';
            }
            return;
        }

        this.globalScores.forEach((score) => {
            const card = this.createGlobalScoreCard(score);
            this.globalScoreList.appendChild(card);
        });
    }

    // NEW: Create global score card (read-only)
    createGlobalScoreCard(score) {
        const t = this.getTranslation;
        const formatter = new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });

        const dateText = score.submission_date ? formatter.format(new Date(score.submission_date)) : '';
        const scoreData = score.score_data || {};
        const bossesLabel = t ? t('bosses') : 'Bosses';
        const enemiesLabel = t ? t('enemies') : 'Enemies';
        const levelLabel = t ? t('level') : 'Level';
        const timeLabel = t ? t('time') : 'Time';

        const card = document.createElement('div');
        card.className = 'score-card score-card--global';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Rank ${score.rank}: ${score.player_name}, ${levelLabel} ${scoreData.level}`);
        card.dataset.globalId = score.id;

        card.innerHTML = `
            <div class="score-card__header">
                <div class="score-rank">#${score.rank}</div>
                <div class="score-meta">
                    <span class="score-player">${this.escapeHtml(score.player_name)}</span>
                    <span class="score-version">v${score.game_version || '1.1.0'}</span>
                    <span class="score-date">${dateText}</span>
                </div>
            </div>
            <div class="score-card__body">
                <div class="score-stat">${levelLabel}: <span>${scoreData.level || 0}</span></div>
                <div class="score-stat">${timeLabel}: <span>${scoreData.timeText || this.formatTime(scoreData.time)}</span></div>
                <div class="score-stat">${enemiesLabel}: <span>${scoreData.enemiesKilled ?? 0}</span></div>
                <div class="score-stat">${bossesLabel}: <span>${scoreData.bossesKilled ?? 0}</span></div>
            </div>
        `;

        // Add click handler to show detail in read-only mode
        const handleClick = () => {
            if (this.onScoreSelectedCallback) {
                // Convert global score format to local score format for display
                const localFormatScore = {
                    ...scoreData,
                    id: score.id,
                    isGlobal: true,
                    playerName: score.player_name,
                    isAnonymous: score.is_anonymous,
                    version: score.game_version,
                    majorVersion: score.major_version,
                    date: score.submission_date,
                    timeText: this.formatTime(scoreData.time)
                };
                this.onScoreSelectedCallback(localFormatScore);
            }
        };

        card.addEventListener('click', handleClick);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        });

        return card;
    }

    // NEW: Show/hide global loading state
    showGlobalLoading(isLoading) {
        if (this.globalLoadingState) {
            this.globalLoadingState.style.display = isLoading ? 'flex' : 'none';
        }
        if (this.globalScoreList) {
            this.globalScoreList.style.display = isLoading ? 'none' : 'flex';
        }
    }

    // NEW: Show global error state
    showGlobalError(message) {
        if (this.globalErrorState) {
            if (message) {
                this.globalErrorState.textContent = message;
                this.globalErrorState.style.display = 'block';
            } else {
                this.globalErrorState.style.display = 'none';
            }
        }
        if (this.globalScoreList) {
            this.globalScoreList.style.display = message ? 'none' : 'flex';
        }
    }

    // NEW: Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setTranslationFunction(getTranslation) {
        this.getTranslation = getTranslation;
        this.updateLocalization();
    }

    onScoreSelected(callback) {
        this.onScoreSelectedCallback = callback;
    }

    onClose(callback) {
        this.onCloseCallback = callback;
    }

    show() {
        this.populateVersions();

        // Show active tab content
        if (this.activeTab === 'local') {
            this.renderScores();
        } else {
            this.loadGlobalScores();
        }

        super.show();
        if (this.element) {
            this.element.style.display = 'flex';
        }

        // Setup keyboard handlers to capture events before global handlers
        this.setupKeyboardHandlers();

        // Reset selection state
        this.selectedCardIndex = 0;
        this.buttonNavigationMode = false;
        this.buttonIndex = 0;

        // Focus scroll container for keyboard navigation
        const activeContainer = this.getActiveListContainer();
        if (activeContainer) {
            this.listContainer = activeContainer;
        }
        if (activeContainer) {
            setTimeout(() => {
                activeContainer.focus({ preventScroll: true });
                this.updateCardSelection();
            }, 50);
        }
    }

    hide() {
        // Cleanup keyboard handlers
        this.cleanupKeyboardHandlers();

        super.hide();
        if (this.onCloseCallback) {
            this.onCloseCallback();
        }
    }

    updateLocalization() {
        if (!this.getTranslation) return;
        const t = this.getTranslation;

        const title = this.element?.querySelector('.scoreboard-title');
        if (title) title.textContent = t('scoreboardTitle');

        const filterLabel = this.element?.querySelector('.scoreboard-filter label');
        if (filterLabel) filterLabel.textContent = t('scoreboardVersionLabel');

        const clearText = t('scoreboardClear') || 'CLEAR ALL';
        if (this.clearButton) this.clearButton.textContent = clearText;

        const closeText = t('close') || 'CLOSE';
        if (this.closeButton) this.closeButton.textContent = closeText;

        const emptyCopy = t('scoreboardEmpty') || 'No scores yet. Play a run to add your first record!';
        if (this.emptyState) this.emptyState.textContent = emptyCopy;

        // NEW: Global empty state
        const globalEmptyCopy = t('globalScoreboardEmpty') || 'No global scores yet. Be the first!';
        if (this.globalEmptyState) this.globalEmptyState.textContent = globalEmptyCopy;

        // Refresh dropdown to ensure placeholder text is translated
        this.populateVersions();
    }

    populateVersions() {
        if (!this.versionFilter) return;

        const selected = this.versionFilter.value || 'all';
        const versions = scoreboardStorage.getUniqueMajorVersions();
        const t = this.getTranslation;

        this.versionFilter.innerHTML = '';
        const allLabel = t ? t('scoreboardAllVersions') : 'All Versions';
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = allLabel;
        this.versionFilter.appendChild(allOption);

        versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version;
            option.textContent = `v${version}`;
            this.versionFilter.appendChild(option);
        });

        if (selected) {
            this.versionFilter.value = selected;
        }
    }

    renderScores() {
        if (!this.scoreList) return;

        const version = this.versionFilter?.value || 'all';
        const scores = version === 'all'
            ? scoreboardStorage.getAllScores()
            : scoreboardStorage.getScoresByVersion(version);

        this.scoreList.innerHTML = '';

        if (!scores.length) {
            this.scoreList.style.display = 'none';
            if (this.emptyState) this.emptyState.style.display = 'block';
            return;
        }

        this.scoreList.style.display = 'flex';
        if (this.emptyState) this.emptyState.style.display = 'none';

        scores.forEach((score, index) => {
            const card = this.createScoreCard(score, index + 1);
            this.scoreList.appendChild(card);
        });
    }

    createScoreCard(score, rank) {
        const t = this.getTranslation;
        const formatter = new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        const dateText = score.date ? formatter.format(new Date(score.date)) : '';
        const bossesLabel = t ? t('bosses') : 'Bosses';
        const enemiesLabel = t ? t('enemies') : 'Enemies';
        const levelLabel = t ? t('level') : 'Level';
        const timeLabel = t ? t('time') : 'Time';

        const card = document.createElement('div');
        card.className = 'score-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `${levelLabel} ${score.level}, ${timeLabel} ${score.timeText}`);
        card.dataset.scoreId = score.id;

        // NEW: Show submission badge if submitted to global
        const submissionStatus = scoreboardStorage.getSubmissionStatus(score.id);
        const submittedBadge = (submissionStatus && submissionStatus.submitted)
            ? '<span class="submitted-badge" title="Submitted to global leaderboard">🌐</span>'
            : '';

        card.innerHTML = `
            <div class="score-card__header">
                <div class="score-rank">#${rank} ${submittedBadge}</div>
                <div class="score-meta">
                    <span class="score-version">v${score.majorVersion || score.version || '1.0'}</span>
                    <span class="score-date">${dateText}</span>
                </div>
            </div>
            <div class="score-card__body">
                <div class="score-stat">${levelLabel}: <span>${score.level}</span></div>
                <div class="score-stat">${timeLabel}: <span>${score.timeText || this.formatTime(score.time)}</span></div>
                <div class="score-stat">${enemiesLabel}: <span>${score.enemiesKilled ?? 0}</span></div>
                <div class="score-stat">${bossesLabel}: <span>${score.bossesKilled ?? 0}</span></div>
            </div>
        `;

        const openDetail = () => {
            if (this.onScoreSelectedCallback) {
                this.onScoreSelectedCallback(score.id);
            }
        };

        card.addEventListener('click', openDetail);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openDetail();
            }
        });

        return card;
    }

    handleClearScores() {
        const t = this.getTranslation;
        const message = t ? t('scoreboardClearConfirm') : 'Clear all saved scores?';
        this.showConfirm(message, () => {
            scoreboardStorage.clearAllScores();
            this.populateVersions();
            this.renderScores();
        });
    }

    formatTime(totalSeconds = 0) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Rest of the existing keyboard handling methods remain unchanged
    // (setupKeyboardHandlers, cleanupKeyboardHandlers, etc.)
    // I'll keep those methods as-is from the original file

    setupKeyboardHandlers() {
        this.keyboardHandler = (e) => {
            if (!this.visible) return;

            // If a blocking overlay (prompt/notification) is open, ignore navigation
            if (this.isOverlayActive('.prompt-modal') || this.isOverlayActive('.notification-modal')) {
                return;
            }

            // Handle confirmation overlay first
            if (this.confirmOverlay && this.confirmOverlay.style.display !== 'none') {
                return; // Confirmation has its own handler
            }

            const key = e.key;

            // ESC to close
            if (key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.hide();
                return;
            }

            // Handle button navigation mode
            if (this.buttonNavigationMode) {
                if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
                    e.preventDefault();
                    this.buttonIndex = Math.max(0, this.buttonIndex - 1);
                    this.updateButtonSelection();
                } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
                    e.preventDefault();
                    this.buttonIndex = Math.min(this.actionButtons.length - 1, this.buttonIndex + 1);
                    this.updateButtonSelection();
                } else if (key === 'Enter' || key === ' ') {
                    e.preventDefault();
                    const button = this.actionButtons[this.buttonIndex];
                    if (button) button.click();
                } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                    e.preventDefault();
                    this.buttonNavigationMode = false;
                    this.updateCardSelection();
                }
                return;
            }

            // Card navigation
            const activeList = this.activeTab === 'local' ? this.scoreList : this.globalScoreList;
            const cards = activeList ? Array.from(activeList.querySelectorAll('.score-card')) : [];

            if (!cards.length) return;

            if (key === 'ArrowDown' || key === 's' || key === 'S') {
                e.preventDefault();
                this.selectedCardIndex = Math.min(cards.length - 1, this.selectedCardIndex + 1);
                this.updateCardSelection();
                this.scrollToSelected();
            } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                e.preventDefault();
                if (this.selectedCardIndex === 0 && this.actionButtons.length) {
                    this.buttonNavigationMode = true;
                    this.buttonIndex = 0;
                    this.updateButtonSelection();
                } else {
                    this.selectedCardIndex = Math.max(0, this.selectedCardIndex - 1);
                    this.updateCardSelection();
                    this.scrollToSelected();
                }
            } else if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                const selectedCard = cards[this.selectedCardIndex];
                if (selectedCard && this.activeTab === 'local') {
                    selectedCard.click();
                }
            } else if (key === 'Tab') {
                e.preventDefault();
                this.buttonNavigationMode = true;
                this.buttonIndex = 0;
                this.updateButtonSelection();
            }
        };

        document.addEventListener('keydown', this.keyboardHandler, { capture: true });
    }

    cleanupKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
            this.keyboardHandler = null;
        }
        if (this.confirmKeyHandler) {
            document.removeEventListener('keydown', this.confirmKeyHandler, { capture: true });
            this.confirmKeyHandler = null;
        }
    }

    updateCardSelection() {
        const activeList = this.activeTab === 'local' ? this.scoreList : this.globalScoreList;
        const cards = activeList ? Array.from(activeList.querySelectorAll('.score-card')) : [];

        cards.forEach((card, index) => {
            if (index === this.selectedCardIndex) {
                card.classList.add('selected');
                card.focus({ preventScroll: true });
            } else {
                card.classList.remove('selected');
            }
        });

        this.actionButtons.forEach(btn => btn?.classList.remove('selected'));
    }

    updateButtonSelection() {
        const activeList = this.activeTab === 'local' ? this.scoreList : this.globalScoreList;
        const cards = activeList ? Array.from(activeList.querySelectorAll('.score-card')) : [];

        cards.forEach(card => card.classList.remove('selected'));

        this.actionButtons.forEach((btn, index) => {
            if (btn) {
                if (index === this.buttonIndex) {
                    btn.classList.add('selected');
                    btn.focus();
                } else {
                    btn.classList.remove('selected');
                }
            }
        });
    }

    scrollToSelected() {
        const activeList = this.activeTab === 'local' ? this.scoreList : this.globalScoreList;
        const cards = activeList ? Array.from(activeList.querySelectorAll('.score-card')) : [];
        const selectedCard = cards[this.selectedCardIndex];
        const container = this.getActiveListContainer();

        if (selectedCard && container) {
            const containerRect = container.getBoundingClientRect();
            const cardRect = selectedCard.getBoundingClientRect();

            if (cardRect.bottom > containerRect.bottom) {
                selectedCard.scrollIntoView({ block: 'end', behavior: 'smooth' });
            } else if (cardRect.top < containerRect.top) {
                selectedCard.scrollIntoView({ block: 'start', behavior: 'smooth' });
            }
        }
    }

    showConfirm(message, onConfirm) {
        const t = this.getTranslation;
        const yesText = t ? t('yes') : 'YES';
        const noText = t ? t('no') : 'NO';

        const overlay = document.createElement('div');
        overlay.className = 'scoreboard-confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <p class="confirm-message">${message}</p>
                <div class="confirm-actions">
                    <button class="survivor-btn confirm-yes">${yesText}</button>
                    <button class="survivor-btn confirm-no">${noText}</button>
                </div>
            </div>
        `;

        const yesBtn = overlay.querySelector('.confirm-yes');
        const noBtn = overlay.querySelector('.confirm-no');
        let selectedButtonIndex = 0;
        const buttons = [noBtn, yesBtn];

        const updateSelection = () => {
            buttons.forEach((btn, idx) => {
                if (idx === selectedButtonIndex) {
                    btn?.classList.add('selected');
                    btn?.focus();
                } else {
                    btn?.classList.remove('selected');
                }
            });
        };

        const closeOverlay = () => {
            if (this.confirmKeyHandler) {
                document.removeEventListener('keydown', this.confirmKeyHandler, { capture: true });
                this.confirmKeyHandler = null;
            }
            overlay.remove();
            this.confirmOverlay = null;
            const activeContainer = this.getActiveListContainer();
            if (activeContainer) {
                setTimeout(() => activeContainer.focus({ preventScroll: true }), 50);
            }
        };

        yesBtn?.addEventListener('click', () => {
            onConfirm();
            closeOverlay();
        });

        noBtn?.addEventListener('click', closeOverlay);

        this.confirmKeyHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                selectedButtonIndex = Math.max(0, selectedButtonIndex - 1);
                updateSelection();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                selectedButtonIndex = Math.min(buttons.length - 1, selectedButtonIndex + 1);
                updateSelection();
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const selectedButton = buttons[selectedButtonIndex];
                if (selectedButton) selectedButton.click();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeOverlay();
            }
        };

        document.addEventListener('keydown', this.confirmKeyHandler, { capture: true });

        this.element.appendChild(overlay);
        this.confirmOverlay = overlay;
        setTimeout(() => updateSelection(), 50);
    }

    isOverlayActive(selector) {
        const el = document.querySelector(selector);
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    attachScrollGuards(container) {
        if (!container) return;
        const stopPropagation = (e) => e.stopPropagation();
        container.addEventListener('wheel', stopPropagation, { passive: true });
        container.addEventListener('touchstart', stopPropagation, { passive: true });
        container.addEventListener('touchmove', stopPropagation, { passive: true });
    }
}
