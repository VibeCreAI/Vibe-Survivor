/**
 * Chest Modal
 * Displays passive upgrade choices when player collects upgrade chest
 * Simplified version of level-up modal - passive upgrades only
 */

import { Modal } from './modal-base.js';

/**
 * ChestModal - Displays 3 passive upgrade choices from collected chest
 */
export class ChestModal extends Modal {
    constructor(id = 'chest-modal') {
        super(id, { closeOnEscape: false, closeOnBackdropClick: false });
        this.upgradeChoices = [];
        this.onUpgradeSelectedCallback = null;

        // Keyboard navigation state
        this.keyboardHandler = null;
        this.selectedIndex = 0;
        this.navigableButtons = [];
        this.keyboardUsed = false;

        // Touch scrolling state
        this.scrollHandler = null;
        this.scrollContainer = null;

        // Translation function (set externally)
        this.getTranslation = null;

        // Overlay lock callbacks (for pausing game)
        this.incrementOverlayLockCallback = null;
        this.decrementOverlayLockCallback = null;
    }

    /**
     * Sets callback for when upgrade is selected
     * @param {Function} callback - Callback(choice, choiceIndex)
     */
    onUpgradeSelected(callback) {
        this.onUpgradeSelectedCallback = callback;
    }

    /**
     * Sets translation function
     * @param {Function} t - Translation function
     */
    setTranslationFunction(t) {
        this.getTranslation = t;
    }

    /**
     * Sets overlay lock callbacks for pausing game
     * @param {Function} incrementFn - Function to call when modal shows
     * @param {Function} decrementFn - Function to call when modal hides
     */
    setOverlayLockCallbacks(incrementFn, decrementFn) {
        this.incrementOverlayLockCallback = incrementFn;
        this.decrementOverlayLockCallback = decrementFn;
    }

    /**
     * Updates modal with passive upgrade choices
     * @param {Object} data - Upgrade data
     * @param {Array} data.choices - Array of passive upgrade choice objects
     */
    update(data) {
        if (!data || !data.choices) {
            console.error('ChestModal.update() called without choices data');
            return;
        }

        this.upgradeChoices = data.choices;
        this.renderUpgradeChoices();
    }

    /**
     * Shows modal with upgrade choices
     * @param {Array} choices - Array of passive upgrade choice objects
     */
    show(choices) {
        if (!this.element) {
            console.error('ChestModal element not found');
            return;
        }

        this.upgradeChoices = choices || [];
        this.renderUpgradeChoices();
        super.show();
    }

    /**
     * Renders upgrade choice cards
     */
    renderUpgradeChoices() {
        const container = this.element?.querySelector('.chest-choices-container');
        if (!container) return;

        container.innerHTML = '';

        this.upgradeChoices.forEach((choice, index) => {
            const choiceDiv = document.createElement('div');
            choiceDiv.className = 'chest-choice';
            choiceDiv.setAttribute('data-choice', index);

            // Icon and title
            const iconDiv = document.createElement('div');
            iconDiv.className = 'chest-choice-icon';

            const iconImage = document.createElement('img');
            iconImage.className = 'chest-choice-icon-image';
            iconImage.src = this.getPassiveIconPath(choice);
            iconImage.alt = choice.passiveName || 'Passive';
            iconDiv.appendChild(iconImage);

            const title = document.createElement('span');
            title.className = 'chest-choice-title';
            title.textContent = choice.passiveName || 'Unknown Passive';
            iconDiv.appendChild(title);

            choiceDiv.appendChild(iconDiv);

            // Description
            const description = document.createElement('p');
            description.textContent = choice.passiveDescription || '';
            choiceDiv.appendChild(description);

            // Stack info if stackable
            if (choice.maxStacks && choice.maxStacks !== Infinity) {
                const stackInfo = document.createElement('span');
                stackInfo.className = 'chest-stack-info';
                const current = choice.currentStacks || 0;
                stackInfo.textContent = `Stacks: ${current}/${choice.maxStacks}`;
                choiceDiv.appendChild(stackInfo);
            }

            // Click handler
            choiceDiv.addEventListener('click', () => this.selectUpgrade(index));
            choiceDiv.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectUpgrade(index);
            }, { passive: false });

            container.appendChild(choiceDiv);
        });

        // Update navigable buttons for keyboard
        this.navigableButtons = Array.from(container.querySelectorAll('.chest-choice'));
        this.selectedIndex = 0;
        this.keyboardUsed = false;
    }

    /**
     * Gets icon path for passive type
     * @param {Object} choice - Upgrade choice object
     * @returns {string} Icon path
     */
    getPassiveIconPath(choice) {
        const iconMap = {
            'health_boost': 'images/passives/healthBoost.png',
            'speed_boost': 'images/passives/speedBoost.png',
            'regeneration': 'images/passives/regeneration.png',
            'magnet': 'images/passives/magnet.png',
            'armor': 'images/passives/armor.png',
            'critical': 'images/passives/criticalStrike.png',
            'dash_boost': 'images/passives/dashBoost.png'
        };
        return iconMap[choice.passiveKey] || 'images/passives/passive.png';
    }

    /**
     * Handles upgrade selection
     * @param {number} choiceIndex - Index of selected choice
     */
    selectUpgrade(choiceIndex) {
        if (choiceIndex < 0 || choiceIndex >= this.upgradeChoices.length) {
            return;
        }

        const choice = this.upgradeChoices[choiceIndex];

        // Trigger callback
        if (this.onUpgradeSelectedCallback) {
            this.onUpgradeSelectedCallback(choice, choiceIndex);
        }

        // Hide modal
        this.hide();
    }

    /**
     * Lifecycle: Called when modal is shown
     */
    onShow() {
        // Pause game
        if (this.incrementOverlayLockCallback) {
            this.incrementOverlayLockCallback();
        }

        // Set up keyboard navigation
        this.setupKeyboardHandlers();

        // Set up touch scrolling
        this.setupTouchScrolling();

        // Focus modal
        if (this.element) {
            this.element.setAttribute('tabindex', '-1');
            this.element.focus({ preventScroll: true });
        }
    }

    /**
     * Lifecycle: Called when modal is hidden
     */
    onHide() {
        // Clean up keyboard handlers
        this.cleanupKeyboardHandlers();

        // Clean up touch scrolling
        this.cleanupTouchScrolling();

        // Unpause game
        if (this.decrementOverlayLockCallback) {
            this.decrementOverlayLockCallback();
        }
    }

    /**
     * Set up keyboard navigation handlers
     */
    setupKeyboardHandlers() {
        this.keyboardHandler = (e) => {
            switch (e.key.toLowerCase()) {
                case 'arrowup':
                case 'w':
                    e.preventDefault();
                    e.stopPropagation();
                    this.keyboardUsed = true;
                    this.navigateChoices('up');
                    break;

                case 'arrowdown':
                case 's':
                    e.preventDefault();
                    e.stopPropagation();
                    this.keyboardUsed = true;
                    this.navigateChoices('down');
                    break;

                case 'enter':
                case ' ':
                    if (this.keyboardUsed) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.selectUpgrade(this.selectedIndex);
                    }
                    break;
            }
        };

        // Use capture phase to intercept events
        document.addEventListener('keydown', this.keyboardHandler, { capture: true });

        // Add navigation styles
        this.addNavigationStyles();
    }

    /**
     * Clean up keyboard handlers
     */
    cleanupKeyboardHandlers() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler, { capture: true });
            this.keyboardHandler = null;
        }

        // Remove selection styles
        this.navigableButtons.forEach(btn => {
            if (btn) {
                btn.classList.remove('menu-selected');
                btn.style.boxShadow = '';
                btn.style.borderColor = '';
            }
        });
    }

    /**
     * Navigate between upgrade choices
     * @param {string} direction - 'up' or 'down'
     */
    navigateChoices(direction) {
        if (this.navigableButtons.length === 0) return;

        // Remove selection from current
        const currentButton = this.navigableButtons[this.selectedIndex];
        if (currentButton) {
            currentButton.classList.remove('menu-selected');
            currentButton.style.boxShadow = '';
            currentButton.style.borderColor = '';
        }

        // Update selected index
        if (direction === 'up') {
            this.selectedIndex = (this.selectedIndex - 1 + this.navigableButtons.length) % this.navigableButtons.length;
        } else if (direction === 'down') {
            this.selectedIndex = (this.selectedIndex + 1) % this.navigableButtons.length;
        }

        // Add selection to new
        const newButton = this.navigableButtons[this.selectedIndex];
        if (newButton) {
            newButton.classList.add('menu-selected');
            newButton.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.4)';
            newButton.style.borderColor = '#FFD700';

            // Scroll into view
            newButton.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    /**
     * Add navigation styles to page
     */
    addNavigationStyles() {
        if (document.getElementById('chest-modal-nav-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'chest-modal-nav-styles';
        style.textContent = `
            .chest-choice.menu-selected {
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.4) !important;
                border: 2px solid #FFD700 !important;
                background: rgba(255, 215, 0, 0.2) !important;
                outline: 2px solid rgba(255, 215, 0, 0.3);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Set up touch scrolling for mobile
     */
    setupTouchScrolling() {
        this.scrollContainer = this.element?.querySelector('.chest-scroll');
        if (!this.scrollContainer) return;

        this.scrollHandler = {
            start: (e) => e.stopPropagation(),
            move: (e) => e.stopPropagation(),
            end: (e) => e.stopPropagation()
        };

        this.scrollContainer.addEventListener('touchstart', this.scrollHandler.start, { passive: true });
        this.scrollContainer.addEventListener('touchmove', this.scrollHandler.move, { passive: true });
        this.scrollContainer.addEventListener('touchend', this.scrollHandler.end, { passive: true });
    }

    /**
     * Clean up touch scrolling
     */
    cleanupTouchScrolling() {
        if (this.scrollContainer && this.scrollHandler) {
            this.scrollContainer.removeEventListener('touchstart', this.scrollHandler.start);
            this.scrollContainer.removeEventListener('touchmove', this.scrollHandler.move);
            this.scrollContainer.removeEventListener('touchend', this.scrollHandler.end);
            this.scrollHandler = null;
        }
    }
}
