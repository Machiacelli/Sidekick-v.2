// ==UserScript==
// @name         Sidekick Training Blocker Module
// @namespace    http://tampermonkey.net/
// @version      1.4.0
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
        let blockingOverlay = null;

        function blockTraining() {
            isBlocked = true;
            saveState(STORAGE_KEY, true);
            createTrainingBlock();
            notify('Training is now blocked!', 'warning');
        }

        function unblockTraining() {
            isBlocked = false;
            saveState(STORAGE_KEY, false);
            removeTrainingBlock();
            notify('Training is now unblocked!', 'success');
        }

        function toggleBlockTraining() {
            if (isBlocked) {
                unblockTraining();
            } else {
                blockTraining();
            }
        }

        function createTrainingBlock() {
            // Remove existing block if any
            removeTrainingBlock();

            // Create blocking overlay that covers the entire page
            createBlockOverlay();
        }

        function createBlockOverlay() {
            // Create blocking overlay with custom picture (no black tint)
            blockingOverlay = document.createElement('div');
            blockingOverlay.id = 'training-blocker-overlay';
            blockingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // Create custom picture container
            const pictureContainer = document.createElement('div');
            pictureContainer.style.cssText = `
                background: url('https://i.imgur.com/Ewv4zCy.jpeg') no-repeat center center;
                background-size: cover;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            blockingOverlay.appendChild(pictureContainer);
            
            // Position the overlay to cover the entire page from top
            blockingOverlay.style.top = '0px';
            blockingOverlay.style.left = '0px';
            blockingOverlay.style.width = '100vw';
            blockingOverlay.style.height = '100vh';
            
            document.body.appendChild(blockingOverlay);
            
            console.log('Training blocker positioned to cover entire page');
        }

        function removeTrainingBlock() {
            if (blockingOverlay && blockingOverlay.parentNode) {
                blockingOverlay.parentNode.removeChild(blockingOverlay);
                blockingOverlay = null;
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

        // Restore blocking overlay if it was previously active
        function restoreTrainingBlocker() {
            if (document.readyState === 'loading') {
                setTimeout(restoreTrainingBlocker, 50);
                return;
            }

            if (!document.body) {
                setTimeout(restoreTrainingBlocker, 100);
                return;
            }
            
            // Restore blocking overlay if it was active
            if (isBlocked) {
                createTrainingBlock();
            }
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
