// ==UserScript==
// @name         Sidekick Attack List Module
// @namespace    http://tampermonkey.net/
// @version      3.0.0
// @description  Enhanced Attack List with API integration and status tracking
// @author       GitHub Copilot
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        none
// @require      none
// ==/UserScript==

(function() {
    'use strict';

    // Wait for core module to be available
    function waitForCore(callback) {
        if (window.SidekickModules?.Core) {
            callback();
        } else {
            setTimeout(() => waitForCore(callback), 100);
        }
    }

    waitForCore(() => {
        const AttackListModule = {
            attackLists: [],
            updateInterval: null,

            init() {
                console.log('⚔️ Initializing Attack List Module v3.0.0...');
                this.core = window.SidekickModules.Core;
                if (!this.core) {
                    console.error('❌ Core module not available for Attack List');
                    return;
                }
                this.loadAttackLists();
                this.refreshDisplay();
                this.startStatusUpdates();
                console.log('⚔️ Attack List module initialized, loaded', this.attackLists.length, 'attack lists');
            },

            loadAttackLists() {
                console.log('⚔️ Loading attack lists...');
                try {
                    const savedData = this.core.loadState('sidekick_attacklists', []);
                    this.attackLists = savedData || [];
                    console.log('✅ Loaded', this.attackLists.length, 'attack lists');
                } catch (error) {
                    console.error('❌ Error loading attack lists:', error);
                    this.attackLists = [];
                }
            },

            saveAttackLists() {
                try {
                    this.core.saveState('sidekick_attacklists', this.attackLists);
                    console.log('💾 Attack lists saved');
                } catch (error) {
                    console.error('❌ Error saving attack lists:', error);
                }
            },

            refreshDisplay() {
                console.log('⚔️ Refreshing attack list display...');
                this.clearExistingAttackLists();
                this.attackLists.forEach(attackList => this.renderAttackList(attackList));
            },

            clearExistingAttackLists() {
                const existingAttackLists = document.querySelectorAll('.sidekick-attack-list');
                existingAttackLists.forEach(element => element.remove());
            },

            createNewAttackList() {
                console.log('⚔️ Creating new attack list...');
                const newAttackList = {
                    id: Date.now().toString(),
                    name: 'New Attack List',
                    targets: [],
                    color: '#f44336',
                    pinned: false,
                    minimized: false
                };

                this.attackLists.push(newAttackList);
                this.saveAttackLists();
                this.renderAttackList(newAttackList);
                return newAttackList;
            },

            // Public methods for external use
            addNewAttackList() {
                return this.createNewAttackList();
            },

            forceRefresh() {
                this.loadAttackLists();
                this.refreshDisplay();
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.AttackList = AttackListModule;

        console.log('⚔️ Attack List module registered');
    });
})();
