// ==UserScript==
// @name         Sidekick Training Blocker Module
// @namespace    http://tampermonkey.net/
// @version      1.3.0
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

            // Find the training section with better detection
            let trainingSection = document.querySelector('.training-section, .training, [class*="training"], .gym, [class*="gym"]');
            
            if (!trainingSection) {
                console.log('Training section not found, trying alternative selectors...');
                // Try alternative selectors for training area
                const alternatives = [
                    'div[class*="strength"]',
                    'div[class*="dexterity"]', 
                    'div[class*="speed"]',
                    'div[class*="defense"]',
                    '.stats-training',
                    '.training-stats',
                    '[class*="gym"]',
                    '[class*="training"]'
                ];
                
                for (let selector of alternatives) {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log('Found training element with selector:', selector);
                        // Look for a parent container that encompasses the training area
                        let parent = element.parentElement;
                        while (parent && parent !== document.body) {
                            if (parent.querySelectorAll('[class*="strength"], [class*="dexterity"], [class*="speed"], [class*="defense"]').length > 1) {
                                trainingSection = parent;
                                break;
                            }
                            parent = parent.parentElement;
                        }
                        if (!trainingSection) trainingSection = element;
                        break;
                    }
                }
                
                if (!trainingSection) {
                    console.warn('No training section found to block');
                    return;
                }
            }

            createBlockOverlay(trainingSection);
        }

        function createBlockOverlay(targetElement) {
            // Create blocking overlay with custom picture (no black tint)
            blockingOverlay = document.createElement('div');
            blockingOverlay.id = 'training-blocker-overlay';
            blockingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9998;
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
            
            // Get the bounding rectangle of the target element
            const rect = targetElement.getBoundingClientRect();
            
            // Position the overlay to cover the entire training section
            blockingOverlay.style.top = rect.top + 'px';
            blockingOverlay.style.left = rect.left + 'px';
            blockingOverlay.style.width = rect.width + 'px';
            blockingOverlay.style.height = rect.height + 'px';
            
            // Add some padding to ensure complete coverage
            const padding = 20;
            blockingOverlay.style.top = (rect.top - padding) + 'px';
            blockingOverlay.style.left = (rect.left - padding) + 'px';
            blockingOverlay.style.width = (rect.width + padding * 2) + 'px';
            blockingOverlay.style.height = (rect.height + padding * 2) + 'px';
            
            document.body.appendChild(blockingOverlay);
            
            console.log('Training blocker positioned at:', {
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
