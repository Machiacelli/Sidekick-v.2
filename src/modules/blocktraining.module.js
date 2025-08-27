// ==UserScript==
// @name         Sidekick Training Blocker Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Training blocker functionality to prevent training while stacking energy
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
        const STORAGE_KEY = 'blockTrainingActive';
        let isBlocked = false;

        function blockTraining() {
            isBlocked = true;
            saveState(STORAGE_KEY, true);
            notify('Training is now blocked!', 'warning');
        }

        function unblockTraining() {
            isBlocked = false;
            saveState(STORAGE_KEY, false);
            notify('Training is now unblocked!', 'success');
        }

        function toggleBlockTraining() {
            if (isBlocked) {
                unblockTraining();
            } else {
                blockTraining();
            }
        }

        function notify(message, type = 'info') {
            if (window.SidekickModules?.Core?.NotificationSystem) {
                window.SidekickModules.Core.NotificationSystem.show('Training Blocker', message, type);
            } else {
                console.log(`[Training Blocker] ${message}`);
            }
        }

        function saveState(key, value) {
            if (window.SidekickModules?.Core?.saveState) {
                window.SidekickModules.Core.saveState(key, value);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        }

        function loadState(key, defaultValue) {
            if (window.SidekickModules?.Core?.loadState) {
                return window.SidekickModules.Core.loadState(key, defaultValue);
            } else {
                try {
                    const saved = localStorage.getItem(key);
                    return saved ? JSON.parse(saved) : defaultValue;
                } catch (e) {
                    return defaultValue;
                }
            }
        }

        // Load saved state
        isBlocked = loadState(STORAGE_KEY, false);

        // Create and inject the training blocker button
        function createTrainingBlockerButton() {
            const existingBtn = document.querySelector('#training-blocker-btn');
            if (existingBtn) return;

            const btn = document.createElement('button');
            btn.id = 'training-blocker-btn';
            btn.textContent = isBlocked ? 'Unblock Training' : 'Block Training';
            btn.style.cssText = `
                position: fixed;
                top: 120px;
                right: 20px;
                background: ${isBlocked ? '#f44336' : '#4CAF50'};
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `;

            btn.addEventListener('click', () => {
                toggleBlockTraining();
                btn.textContent = isBlocked ? 'Unblock Training' : 'Block Training';
                btn.style.background = isBlocked ? '#f44336' : '#4CAF50';
            });

            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'scale(1.05)';
                btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'scale(1)';
                btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            });

            document.body.appendChild(btn);
        }

        // Restore button if it was previously created
        function restoreTrainingBlocker() {
            if (document.readyState === 'loading') {
                setTimeout(restoreTrainingBlocker, 50);
                return;
            }

            if (document.body) {
                setTimeout(restoreTrainingBlocker, 100);
                return;
            }

            restoreTrainingBlocker();
        }

        // Start the training blocker
        restoreTrainingBlocker();

        // Export module
        window.SidekickModules.BlockTraining = {
            blockTraining,
            unblockTraining,
            toggleBlockTraining,
            isEnabled: () => isBlocked
        };

        console.log('🚫 Training Blocker module loaded');
    });
})();
