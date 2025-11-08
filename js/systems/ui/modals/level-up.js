/**
 * Level Up Modal
 * Level-up upgrade selection screen
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * LevelUpModal - Displays upgrade choices on level up
 */
export class LevelUpModal extends Modal {
    constructor(id = 'levelup-modal') {
        super(id, { closeOnEscape: false, closeOnBackdropClick: false });
        this.upgradeChoices = [];
        this.onUpgradeSelectedCallback = null;
    }

    /**
     * Sets callback for when upgrade is selected
     * @param {Function} callback - Callback(choiceIndex)
     */
    onUpgradeSelected(callback) {
        this.onUpgradeSelectedCallback = callback;
    }

    /**
     * Updates modal with upgrade choices
     * @param {Object} data - Upgrade data
     * @param {Array} data.choices - Array of upgrade choice objects
     * @param {number} data.playerLevel - Current player level
     */
    update(data) {
        if (!data || !data.choices) return;

        this.upgradeChoices = data.choices;
        this.renderUpgradeChoices(data.choices, data.playerLevel);
    }

    /**
     * Renders upgrade choices in the modal
     * @param {Array} choices - Upgrade choice objects
     * @param {number} playerLevel - Current player level
     */
    renderUpgradeChoices(choices, playerLevel) {
        const choicesContainer = this.element?.querySelector('.upgrade-choices');
        if (!choicesContainer) return;

        const choicesHTML = choices.map((choice, index) => {
            const mergeClass = choice.isMergeWeapon ? ' upgrade-choice-merge' : '';
            return `
                <div class="upgrade-choice${mergeClass}" data-choice="${index}">
                    <div class="upgrade-choice-icon">
                        <span class="upgrade-choice-icon-image">${choice.icon || '⚔️'}</span>
                        <span class="upgrade-choice-title">${choice.name}</span>
                    </div>
                    <h3>${choice.name}</h3>
                    <p>${choice.description}</p>
                    ${choice.level ? `<span class="upgrade-level">Level ${choice.level}</span>` : ''}
                </div>
            `;
        }).join('');

        choicesContainer.innerHTML = choicesHTML;

        // Add click handlers to choices
        const choiceElements = choicesContainer.querySelectorAll('.upgrade-choice');
        choiceElements.forEach((element, index) => {
            element.addEventListener('click', () => this.selectUpgrade(index));
        });
    }

    /**
     * Handles upgrade selection
     * @param {number} choiceIndex - Index of selected choice
     */
    selectUpgrade(choiceIndex) {
        if (this.onUpgradeSelectedCallback) {
            const choice = this.upgradeChoices[choiceIndex];
            this.onUpgradeSelectedCallback(choice, choiceIndex);
        }
        this.hide();
    }

    /**
     * Gets formatted upgrade description
     * @param {Object} choice - Upgrade choice object
     * @returns {string} Formatted description
     */
    getUpgradeDescription(choice) {
        switch (choice.type) {
            case 'weapon_upgrade':
                return `Upgrade ${choice.weaponName} to Level ${choice.currentLevel + 1}`;
            case 'weapon_new':
                return `Acquire ${choice.weaponName}`;
            case 'passive':
                const stackText = choice.currentStacks > 0 ? ` (Stack ${choice.currentStacks + 1})` : '';
                return `${choice.passiveDescription}${stackText}`;
            default:
                return choice.description || '';
        }
    }

    /**
     * Shows level up modal
     */
    onShow() {
        // Focus first upgrade choice
        const firstChoice = this.element?.querySelector('.upgrade-choice');
        if (firstChoice) {
            firstChoice.focus();
        }
    }

    /**
     * Hides level up modal
     */
    onHide() {
        this.upgradeChoices = [];
    }
}
