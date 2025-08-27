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

            // Find the training section
            const trainingSection = document.querySelector('.training-section, .training, [class*="training"], .gym, [class*="gym"]');
            
            if (!trainingSection) {
                console.log('Training section not found, trying alternative selectors...');
                // Try alternative selectors for training area
                const alternatives = [
                    'div[class*="strength"]',
                    'div[class*="dexterity"]', 
                    'div[class*="speed"]',
                    'div[class*="defense"]',
                    '.stats-training',
                    '.training-stats'
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

            createBlockOverlay(trainingSection);
        }

        function createBlockOverlay(targetElement) {
            // Create blocking overlay with custom picture
            blockingOverlay = document.createElement('div');
            blockingOverlay.id = 'training-blocker-overlay';
            blockingOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
            `;

            // Create custom picture container
            const pictureContainer = document.createElement('div');
            pictureContainer.style.cssText = `
                background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMmEyYTIiLz4KPHRleHQgeD0iMTUwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UT1JOIFRyYWluaW5nPC90ZXh0Pgo8dGV4dCB4PSIxNTAiIHk9IjYwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPi0tIEJsb2NrZWQhPC90ZXh0Pgo8dGV4dCB4PSIxNTAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UcmFpbmluZyBpcyBibG9ja2VkIHRvPC90ZXh0Pgo8dGV4dCB4PSIxNTAiIHk9IjEyMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5wcmV2ZW50IGVuZXJneSBsb3NzIHdoaWxlPC90ZXh0Pgo8dGV4dCB4PSIxNTAiIHk9IjE0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5zdGFja2luZy48L3RleHQ+Cjx0ZXh0IHg9IjE1MCIgeT0iMTgwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNmNDQzMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlVzZSBjb2d3aGVlbCB0byB1bmJsb2NrPC90ZXh0Pgo8L3N2Zz4K') no-repeat center center;
                background-size: contain;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            blockingOverlay.appendChild(pictureContainer);
            
            // Position the overlay relative to the target element
            const rect = targetElement.getBoundingClientRect();
            blockingOverlay.style.position = 'fixed';
            blockingOverlay.style.top = rect.top + 'px';
            blockingOverlay.style.left = rect.left + 'px';
            blockingOverlay.style.width = rect.width + 'px';
            blockingOverlay.style.height = rect.height + 'px';
            
            document.body.appendChild(blockingOverlay);
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
