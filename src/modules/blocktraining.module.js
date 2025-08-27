// ==UserScript==
// @name         Sidekick Training Blocker Module
// @namespace    http://tampermonkey.net/
// @version      1.5.0
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

            // Target the gymroot specifically like the original script
            const gymRoot = document.querySelector('#gymroot');
            
            if (!gymRoot) {
                console.log('Gym root not found, trying alternative selectors...');
                // Fallback selectors if gymroot doesn't exist
                const alternatives = [
                    '.training-section',
                    '.training', 
                    '[class*="training"]',
                    '.gym',
                    '[class*="gym"]'
                ];
                
                for (let selector of alternatives) {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log('Found training element with selector:', selector);
                        createBlockOverlay(element);
                        return;
                    }
                }
                
                console.warn('No training section found to block');
                return;
            }

            createBlockOverlay(gymRoot);
        }

        function createBlockOverlay(targetElement) {
            // Create blocking overlay with custom picture (no black tint)
            blockingOverlay = document.createElement('div');
            blockingOverlay.id = 'training-blocker-overlay';
            blockingOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
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
            
            // Position the overlay relative to the target element (like the original script)
            const rect = targetElement.getBoundingClientRect();
            blockingOverlay.style.position = 'fixed';
            blockingOverlay.style.top = rect.top + 'px';
            blockingOverlay.style.left = rect.left + 'px';
            blockingOverlay.style.width = rect.width + 'px';
            blockingOverlay.style.height = rect.height + 'px';
            
            document.body.appendChild(blockingOverlay);
            
            console.log('Training blocker positioned over gymroot:', {
                top: blockingOverlay.style.top,
                left: blockingOverlay.style.left,
                width: blockingOverlay.style.width,
                height: blockingOverlay.style.height
            });
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
