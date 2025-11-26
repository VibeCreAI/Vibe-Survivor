# Frontend Implementation Guide - Global Leaderboard

## Progress Summary

### ✅ Completed:
1. Backend setup (database, Edge Function, RLS)
2. Supabase config and client utility
3. Scoreboard storage with submission tracking
4. Supabase CDN script added to index.html
5. Scoreboard modal updated with tabs system
6. Update score-detail-modal.js with submit button logic
7. Add HTML for tabs in scoreboard modal (vibe-survivor-game.js)
8. Add HTML for submission section in score detail modal
9. Add CSS styling for all new UI elements
10. Wire Supabase client initialization in vibe-survivor-game.js

### 📋 Remaining Tasks:
None - Implementation complete! Ready for testing.

---

## Task 1: Update score-detail-modal.js

### Add Properties (after line 28):
```javascript
// NEW: Submission properties
this.submitButton = null;
this.submissionStatus = null;
this.submittedName = null;
this.viewGlobalButton = null;
this.onSubmitCallback = null;
```

### Update init() method (after line 49):
```javascript
// NEW: Submission elements
this.submitButton = this.element.querySelector('#submit-to-global-btn');
this.submissionStatus = this.element.querySelector('#submission-status');
this.submittedName = this.element.querySelector('#submitted-name');
this.viewGlobalButton = this.element.querySelector('#view-on-global-btn');
```

### Update action buttons array (line 50):
```javascript
this.actionButtons = [this.backButton, this.deleteButton, this.submitButton].filter(Boolean);
```

### Add event handler (after line 58):
```javascript
if (this.submitButton) {
    this.submitButton.addEventListener('click', () => this.handleSubmit());
}

if (this.viewGlobalButton) {
    this.viewGlobalButton.addEventListener('click', () => this.handleViewGlobal());
}
```

### Add callback methods (after line 79):
```javascript
onSubmit(callback) {
    this.onSubmitCallback = callback;
}

onViewGlobal(callback) {
    this.onViewGlobalCallback = callback;
}
```

### Add submission methods (at end of class):
```javascript
async handleSubmit() {
    if (!this.currentScore) return;

    const t = this.getTranslation;
    const promptMessage = t ? t('enterPlayerName') : 'Enter your display name (3-20 characters):';
    const playerName = prompt(promptMessage);

    if (!playerName) return;

    // Client-side validation
    const trimmed = playerName.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
        alert('Player name must be 3-20 characters');
        return;
    }

    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
        alert('Player name can only contain letters, numbers, spaces, _ and -');
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
                this.submitButton.textContent = '📊 SUBMIT TO GLOBAL LEADERBOARD';
            }
        }
    }
}

handleViewGlobal() {
    if (this.onViewGlobalCallback) {
        this.onViewGlobalCallback();
    }
}

updateSubmissionUI(score) {
    const { scoreboardStorage } = await import('../../../utils/scoreboard-storage.js');
    const status = scoreboardStorage.getSubmissionStatus(score.id);

    if (status && status.submitted) {
        // Hide submit button
        if (this.submitButton) this.submitButton.style.display = 'none';

        // Show submission status
        if (this.submissionStatus) {
            this.submissionStatus.style.display = 'block';
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
```

### Update update() method (find existing method, add at end):
```javascript
// NEW: Update submission UI
this.updateSubmissionUI(score);
```

---

## Task 2: Add HTML for Scoreboard Modal Tabs

Find the scoreboard modal HTML in `vibe-survivor-game.js` (around line 2000-2200).

### Replace the existing scoreboard content div with:
```html
<div class="scoreboard-tabs">
    <button class="scoreboard-tab active" data-tab="local">LOCAL</button>
    <button class="scoreboard-tab" data-tab="global">GLOBAL</button>
</div>

<div class="scoreboard-tabs-content">
    <!-- LOCAL TAB -->
    <div class="scoreboard-tab-pane active" data-tab-pane="local">
        <div class="scoreboard-filter">
            <label for="scoreboard-version-filter" data-i18n="scoreboardVersionLabel">Game Version:</label>
            <select id="scoreboard-version-filter" class="survivor-select">
                <option value="all" data-i18n="scoreboardAllVersions">All Versions</option>
            </select>
        </div>
        <div class="scoreboard-list-container" tabindex="0">
            <div id="scoreboard-list" class="scoreboard-list"></div>
            <p class="scoreboard-empty-state" data-i18n="scoreboardEmpty">
                No scores yet. Play a run to add your first record!
            </p>
        </div>
    </div>

    <!-- GLOBAL TAB -->
    <div class="scoreboard-tab-pane" data-tab-pane="global">
        <div class="scoreboard-filter">
            <label for="scoreboard-version-filter" data-i18n="scoreboardVersionLabel">Game Version:</label>
            <!-- Same filter element, shared between tabs -->
        </div>
        <div class="scoreboard-list-container" tabindex="0">
            <div id="global-scoreboard-list" class="scoreboard-list"></div>

            <!-- Loading state -->
            <div class="global-loading-state">
                <div class="spinner"></div>
                <p>Loading global scores...</p>
            </div>

            <!-- Error state -->
            <div class="global-error-state" style="display: none;">
                Failed to load global scores
            </div>

            <!-- Empty state -->
            <p class="global-empty-state" style="display: none;" data-i18n="globalScoreboardEmpty">
                No global scores yet. Be the first!
            </p>
        </div>
    </div>
</div>
```

---

## Task 3: Add HTML for Score Detail Submission

Find the score-detail modal HTML in `vibe-survivor-game.js`.

### Add BEFORE the actions div:
```html
<!-- Submission Section -->
<div class="score-submission-section">
    <!-- Show when NOT submitted -->
    <button id="submit-to-global-btn" class="survivor-btn submit-global" style="display: none;">
        📊 SUBMIT TO GLOBAL LEADERBOARD
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
```

---

## Task 4: Add CSS Styling

Add to `styles/base.css`:

```css
/* ==========================================
   SCOREBOARD TABS
   ========================================== */

.scoreboard-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid var(--text-primary);
}

.scoreboard-tab {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: var(--text-secondary);
    font-family: var(--font-pixel);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.scoreboard-tab:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
}

.scoreboard-tab.active {
    color: var(--accent-color);
    border-bottom-color: var(--accent-color);
}

.scoreboard-tabs-content {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.scoreboard-tab-pane {
    display: none;
    flex-direction: column;
    height: 100%;
}

.scoreboard-tab-pane.active {
    display: flex;
}

/* ==========================================
   GLOBAL SCOREBOARD STATES
   ========================================== */

.global-loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    gap: 1rem;
    color: var(--text-secondary);
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--accent-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.global-error-state {
    padding: 2rem;
    text-align: center;
    color: var(--color-error, #ff6b6b);
    font-family: var(--font-pixel);
}

.global-empty-state {
    padding: 3rem;
    text-align: center;
    color: var(--text-secondary);
    font-family: var(--font-pixel);
}

/* ==========================================
   SCORE SUBMISSION
   ========================================== */

.score-submission-section {
    margin: 1.5rem 0;
    padding: 1rem;
    border-top: 2px solid var(--text-primary);
    border-bottom: 2px solid var(--text-primary);
}

.submit-global {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 1.5rem;
    font-size: 0.9rem;
    transition: transform 0.2s ease, opacity 0.2s ease;
}

.submit-global:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-global:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

#submission-status {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.submission-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(76, 175, 80, 0.1);
    border: 2px solid #4caf50;
    border-radius: 4px;
}

.submission-checkmark {
    font-size: 1.5rem;
    color: #4caf50;
}

.submission-text {
    font-family: var(--font-pixel);
    color: var(--text-primary);
    font-size: 0.85rem;
}

/* ==========================================
   SCORE CARD BADGES
   ========================================== */

.score-card--global {
    border-left: 4px solid var(--accent-color);
}

.submitted-badge {
    display: inline-block;
    margin-left: 0.5rem;
    font-size: 0.9rem;
}

.anonymous-badge {
    display: inline-block;
    margin-left: 0.25rem;
    font-size: 0.8rem;
    opacity: 0.6;
}

.score-player {
    font-weight: bold;
    color: var(--accent-color);
}
```

---

## Task 5: Wire Supabase Client Initialization

In `vibe-survivor-game.js`, find the `initGame()` method or constructor.

### Add import at top of file:
```javascript
import { supabaseClient } from './utils/supabase-client.js';
```

### Add initialization (in constructor after audio manager, around line 165):
```javascript
// Initialize Supabase client for global leaderboard
supabaseClient.init();
```

### Wire submission callback (in initGame(), after score detail modal setup):
```javascript
// Setup submission callback
this.modals.scoreDetail.onSubmit(async (score, playerName) => {
    const { GAME_INFO } = await import('./config/constants.js');

    const result = await supabaseClient.submitScore(
        score,
        playerName,
        GAME_INFO.VERSION,
        GAME_INFO.MAJOR_VERSION
    );

    if (result.success) {
        // Mark as submitted in local storage
        scoreboardStorage.markAsSubmitted(score.id, result.id, playerName);
        alert(`Score submitted as ${playerName}!`);
        return true;
    } else {
        alert(`Failed to submit: ${result.error}`);
        return false;
    }
});

// Setup view global callback
this.modals.scoreDetail.onViewGlobal(() => {
    this.modals.scoreDetail.hide();
    this.modals.scoreboard.show();
    this.modals.scoreboard.switchTab('global');
});
```

---

## Testing Checklist

After implementation:

- [ ] LOCAL tab shows local scores
- [ ] GLOBAL tab shows loading spinner
- [ ] GLOBAL tab loads scores from Supabase
- [ ] Version filter works on both tabs
- [ ] Submit button appears on unsubmitted scores
- [ ] Submit button prompts for name
- [ ] Submit validates name (3-20 chars, alphanumeric)
- [ ] Submit shows success message
- [ ] Submitted badge appears on local score
- [ ] Submission status persists on page refresh
- [ ] View on Global button works
- [ ] Keyboard navigation works with tabs

---

## Quick Implementation Order

1. Update score-detail-modal.js (add submit methods)
2. Update vibe-survivor-game.js HTML (tabs + submission section)
3. Add CSS to base.css
4. Wire Supabase in vibe-survivor-game.js
5. Test end-to-end

---

## Estimated Time: 1-2 hours

Most of the work is copy-paste from this guide. The tricky parts (backend, client utility, modal logic) are already done!
