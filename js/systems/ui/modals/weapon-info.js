/**
 * Weapon Info Modal
 * Detailed weapon stats and information
 * Extracted from vibe-survivor-game.js during Phase 10 refactoring
 */

import { Modal } from './modal-base.js';

/**
 * WeaponInfoModal - Displays detailed weapon information
 */
export class WeaponInfoModal extends Modal {
    constructor(id = 'weapon-info-modal') {
        super(id, { closeOnEscape: true, closeOnBackdropClick: true });
        this.closeButton = null;
    }

    /**
     * Initializes weapon info modal elements
     */
    init() {
        const result = super.init();
        if (result) {
            this.closeButton = this.element.querySelector('.weaponinfo-close-btn');
            if (this.closeButton) {
                this.closeButton.addEventListener('click', () => this.hide());
            }
        }
        return result;
    }

    /**
     * Updates modal with weapon details
     * @param {Object} data - Weapon data
     * @param {string} data.name - Weapon name
     * @param {string} data.type - Weapon type
     * @param {number} data.level - Weapon level
     * @param {number} data.damage - Weapon damage
     * @param {number} data.fireRate - Fire rate
     * @param {number} data.range - Weapon range
     * @param {string} data.description - Weapon description
     * @param {Array} data.upgrades - Upgrade history
     */
    update(data) {
        if (!data) return;

        // Update weapon name
        this.updateElement('.weapon-info-name', data.name);

        // Update weapon stats
        this.updateElement('.weapon-info-level', `Level ${data.level}`);
        this.updateElement('.weapon-info-damage', `Damage: ${data.damage}`);
        this.updateElement('.weapon-info-firerate', `Fire Rate: ${data.fireRate}`);
        this.updateElement('.weapon-info-range', `Range: ${data.range}`);

        // Update description
        this.updateElement('.weapon-info-description', data.description);

        // Update upgrades list
        if (data.upgrades && data.upgrades.length > 0) {
            this.updateUpgradesList(data.upgrades);
        }
    }

    /**
     * Updates an element's text content
     * @param {string} selector - Element selector
     * @param {string} text - Text content
     */
    updateElement(selector, text) {
        const element = this.element?.querySelector(selector);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Updates the upgrades list
     * @param {Array} upgrades - Upgrade history
     */
    updateUpgradesList(upgrades) {
        const upgradesContainer = this.element?.querySelector('.weapon-info-upgrades');
        if (!upgradesContainer) return;

        const upgradesHTML = upgrades.map((upgrade, index) => `
            <li>Level ${index + 2}: ${upgrade}</li>
        `).join('');

        upgradesContainer.innerHTML = `<ul>${upgradesHTML}</ul>`;
    }
}
