import { Modal } from './modal-base.js';
import { scoreboardStorage } from '../../../utils/scoreboard-storage.js';

export class ScoreboardModal extends Modal {
    constructor(id = 'scoreboard-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: true });
        this.versionFilter = null;
        this.scoreList = null;
        this.listContainer = null;
        this.emptyState = null;
        this.clearButton = null;
        this.closeButton = null;
        this.onScoreSelectedCallback = null;
        this.onCloseCallback = null;
        this.getTranslation = null;
        this.keyboardHandler = null;
        this.selectedCardIndex = 0;
    }

    init() {
        const result = super.init();
        if (!result) return false;

        this.versionFilter = this.element.querySelector('#scoreboard-version-filter');
        this.scoreList = this.element.querySelector('#scoreboard-list');
        this.listContainer = this.element.querySelector('.scoreboard-list-container');
        this.emptyState = this.element.querySelector('.scoreboard-empty-state');
        this.clearButton = this.element.querySelector('#scoreboard-clear-btn');
        this.closeButton = this.element.querySelector('#scoreboard-close-btn');

        this.attachEventHandlers();
        this.populateVersions();
        this.renderScores();
        this.updateLocalization();

        return true;
    }

    attachEventHandlers() {
        if (this.versionFilter) {
            this.versionFilter.addEventListener('change', () => this.renderScores());
        }

        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => this.handleClearScores());
        }

        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hide());
        }
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
        this.renderScores();
        super.show();
        if (this.element) {
            this.element.style.display = 'flex';
        }

        // Setup keyboard handlers to capture events before global handlers
        this.setupKeyboardHandlers();

        // Reset selection state
        this.selectedCardIndex = 0;

        // Focus scroll container for keyboard navigation
        if (this.listContainer) {
            setTimeout(() => {
                this.listContainer.focus({ preventScroll: true });
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

        card.innerHTML = `
            <div class="score-card__header">
                <div class="score-rank">#${rank}</div>
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
        const confirmText = t ? t('scoreboardClearConfirm') : 'Clear all saved scores?';
        if (!confirm(confirmText)) return;

        scoreboardStorage.clearAllScores();
        this.populateVersions();
        this.renderScores();
    }

    formatTime(totalSeconds = 0) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    setupKeyboardHandlers() {
        this.cleanupKeyboardHandlers();
        this.keyboardHandler = (e) => {
            if (!this.visible) return;

            const key = e.key.toLowerCase();
            const scoreCards = this.scoreList?.querySelectorAll('.score-card') || [];

            // Block navigation keys to prevent start screen navigation
            const navigationKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'enter', ' ', 'escape'];

            if (navigationKeys.includes(key)) {
                e.preventDefault();
                e.stopPropagation();
            }

            // Handle escape to close modal
            if (key === 'escape') {
                this.hide();
                return;
            }

            // Handle arrow up/down/w/s for score card navigation
            if (key === 'arrowdown' || key === 's') {
                if (scoreCards.length > 0) {
                    this.selectedCardIndex = Math.min(this.selectedCardIndex + 1, scoreCards.length - 1);
                    this.updateCardSelection();
                }
                return;
            }

            if (key === 'arrowup' || key === 'w') {
                if (scoreCards.length > 0) {
                    this.selectedCardIndex = Math.max(this.selectedCardIndex - 1, 0);
                    this.updateCardSelection();
                }
                return;
            }

            // Block left/right arrows and A/D to prevent start screen navigation
            if (key === 'arrowleft' || key === 'arrowright' || key === 'a' || key === 'd') {
                // Do nothing, just block the event
                return;
            }

            // Handle enter/space to select score card
            if (key === 'enter' || key === ' ') {
                // Open selected score card
                if (scoreCards.length > 0 && scoreCards[this.selectedCardIndex]) {
                    const card = scoreCards[this.selectedCardIndex];
                    const scoreId = card.dataset.scoreId;
                    if (scoreId && this.onScoreSelectedCallback) {
                        this.onScoreSelectedCallback(parseInt(scoreId));
                    }
                }
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
    }

    updateCardSelection() {
        const scoreCards = this.scoreList?.querySelectorAll('.score-card') || [];

        // Remove previous selection
        scoreCards.forEach(card => {
            card.classList.remove('menu-selected');
            card.style.boxShadow = '';
        });

        // Add current selection
        if (scoreCards[this.selectedCardIndex]) {
            const selectedCard = scoreCards[this.selectedCardIndex];
            selectedCard.classList.add('menu-selected');
            selectedCard.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.8)';
            selectedCard.focus({ preventScroll: false });

            // Scroll into view if needed
            selectedCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
}
