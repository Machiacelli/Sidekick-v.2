// ==UserScript==
// @name         Sidekick Training Blocker Module
// @namespace    http://tampermonkey.net/
// @version      1.1.0
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
            createBlockingOverlay();
            notify('Training is now blocked!', 'warning');
        }

        function unblockTraining() {
            isBlocked = false;
            saveState(STORAGE_KEY, false);
            removeBlockingOverlay();
            notify('Training is now unblocked!', 'success');
        }

        function toggleBlockTraining() {
            if (isBlocked) {
                unblockTraining();
            } else {
                blockTraining();
            }
        }

        function createBlockingOverlay() {
            // Remove existing overlay if any
            removeBlockingOverlay();

            // Create blocking overlay
            blockingOverlay = document.createElement('div');
            blockingOverlay.id = 'training-blocker-overlay';
            blockingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(5px);
            `;

            // Create message container
            const messageContainer = document.createElement('div');
            messageContainer.style.cssText = `
                background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                border: 2px solid #f44336;
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                color: white;
                font-family: 'Segoe UI', sans-serif;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                max-width: 400px;
                animation: pulse 2s infinite;
            `;

            messageContainer.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 20px;">🚫</div>
                <h2 style="margin: 0 0 15px 0; color: #f44336; font-size: 24px;">Training Blocked!</h2>
                <p style="margin: 0 0 20px 0; color: #bbb; font-size: 16px; line-height: 1.4;">
                    Training is currently blocked to prevent energy loss while stacking.
                    <br><br>
                    Use the training blocker button to unblock when you're ready to train.
                </p>
                <div style="
                    background: #f44336;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 14px;
                    display: inline-block;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="window.SidekickModules.BlockTraining.unblockTraining()">
                    Unblock Training
                </div>
            `;

            // Add pulse animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);

            blockingOverlay.appendChild(messageContainer);
            document.body.appendChild(blockingOverlay);
        }

        function removeBlockingOverlay() {
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

        // Restore button and overlay if they were previously created
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
                createBlockingOverlay();
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
