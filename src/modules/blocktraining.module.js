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
            // Create blocking overlay
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

            // Create message container
            const messageContainer = document.createElement('div');
            messageContainer.style.cssText = `
                background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                border: 2px solid #f44336;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                color: white;
                font-family: 'Segoe UI', sans-serif;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                max-width: 300px;
            `;

            messageContainer.innerHTML = `
                <div style="font-size: 36px; margin-bottom: 15px;">🚫</div>
                <h3 style="margin: 0 0 10px 0; color: #f44336; font-size: 18px;">Training Blocked!</h3>
                <p style="margin: 0; color: #bbb; font-size: 14px; line-height: 1.3;">
                    Training is blocked to prevent energy loss while stacking.
                </p>
            `;

            blockingOverlay.appendChild(messageContainer);
            
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

        // Restore button and block if they were previously created
        function restoreTrainingBlocker() {
            if (document.readyState === 'loading') {
                setTimeout(restoreTrainingBlocker, 50);
                return;
            }

            if (!document.body) {
                setTimeout(restoreTrainingBlocker, 100);
                return;
            }

            createTrainingBlockerButton();
            
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
