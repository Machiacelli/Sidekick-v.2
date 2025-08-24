// ==UserScript==
// @name         Sidekick Attack List Module
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Modern modular Attack List for Sidekick sidebar
// @author       Machiacelli
// @match        https://www.torn.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Sidekick Attack List Module
    const AttackListModule = {
        name: 'AttackList',
        version: '2.0',

        // Initialize the module
        init() {
            console.log(`⚔️ Loading ${this.name} Module v${this.version}...`);
            this.registerMenuItems();
        },

        // Register menu item for the sidebar
        registerMenuItems() {
            if (window.SidekickModules && window.SidekickModules.registerMenuItem) {
                window.SidekickModules.registerMenuItem({
                    icon: '⚔️',
                    text: 'Add Attack List',
                    color: '#f44336',
                    action: () => this.createAttackList()
                });
            }
        },

        // Create a new Attack List panel
        createAttackList() {
            const attackList = {
                id: Date.now() + Math.random(),
                title: 'Untitled Attack List',
                targets: [],
                type: 'attacklist'
            };
            const attackElement = document.createElement('div');
            attackElement.className = 'sidekick-panel';
            attackElement.dataset.id = attackList.id;
            attackElement.style.marginBottom = '18px';
            attackElement.innerHTML = `
                <div class="sidekick-panel-header">
                    <span style="display: flex; align-items: center; gap: 8px; font-size: 16px;">
                        <span>⚔️</span>
                        <input type="text" value="${attackList.title}" data-attack-id="${attackList.id}"
                            style="background: #222; border: 1px solid #555; color: #fff; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 15px; width: 180px;">
                    </span>
                    <button class="remove-btn" data-item-id="${attackList.id}" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 20px; padding: 2px 8px; font-weight: bold;">×</button>
                </div>
                <div class="sidekick-panel-content" id="attack-targets-${attackList.id}"></div>
                <button class="add-attack-target" data-list-id="${attackList.id}" style="width: 100%; margin-top: 10px; padding: 12px; background: linear-gradient(135deg, #f44336, #ff9800); color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer;">+ Add Target</button>
            `;

            // Add event listeners
            setTimeout(() => {
                const titleInput = attackElement.querySelector(`input[data-attack-id="${attackList.id}"]`);
                const addTargetBtn = attackElement.querySelector('.add-attack-target');
                const removeBtn = attackElement.querySelector('.remove-btn');
                if (titleInput) {
                    titleInput.addEventListener('change', (e) => attackList.title = e.target.value);
                }
                if (addTargetBtn) {
                    addTargetBtn.addEventListener('click', () => {
                        const targetName = prompt('Enter target name:');
                        if (targetName && targetName.trim()) {
                            const targetId = prompt('Enter target ID (optional):') || '';
                            const itemId = Date.now() + Math.random();
                            const container = attackElement.querySelector(`#attack-targets-${attackList.id}`);
                            if (container) {
                                const targetElement = document.createElement('div');
                                targetElement.className = 'attack-target';
                                targetElement.style.cssText = `display: flex; align-items: center; gap: 8px; padding: 6px; background: #333; border-radius: 4px; margin-bottom: 4px; min-height: 32px;`;
                                targetElement.innerHTML = `
                                    <span style="font-weight: bold; color: #fff; min-width: 90px;">${targetName}</span>
                                    <span style="font-size: 13px; font-weight: bold; padding: 2px 8px; border-radius: 4px; background: #222; color: #fff;">${targetId}</span>
                                    <button style="background: none; border: none; color: #f44336; cursor: pointer; padding: 2px; font-size: 16px;">×</button>
                                `;
                                targetElement.querySelector('button').addEventListener('click', () => targetElement.remove());
                                container.appendChild(targetElement);
                            }
                        }
                    });
                }
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => attackElement.remove());
                }
            }, 50);

            // Add to sidebar container
            const attackContainer = document.getElementById('sidekick-attacks');
            if (attackContainer) {
                attackContainer.appendChild(attackElement);
            }
        }
    };

    // Register the module for Sidekick loader
    if (!window.SidekickModules) window.SidekickModules = {};
    window.SidekickModules.AttackList = AttackListModule;

})();