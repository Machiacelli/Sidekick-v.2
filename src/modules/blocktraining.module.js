// ==UserScript==
// @name         Sidekick Training Blocker Module
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  SIMPLIFIED gym blocker with correct image URL and extensive logging
// @author       Machiacelli
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
            console.log('🚫 blockTraining() called - ENABLING blocker');
            isBlocked = true;
            saveState(STORAGE_KEY, true);
            console.log('🚫 State saved, isBlocked:', isBlocked);
            
            // ALWAYS try to create the overlay immediately
            console.log('🚫 Attempting to create overlay NOW');
            createTrainingBlock();
            
            notify('Training is now blocked!', 'warning');
            console.log('� blockTraining() complete');
        }

        function unblockTraining() {
            console.log('✅ unblockTraining() called - DISABLING blocker');
            isBlocked = false;
            saveState(STORAGE_KEY, false);
            removeTrainingBlock();
            notify('Training is now unblocked!', 'success');
            console.log('✅ unblockTraining() complete');
        }

        function toggleBlockTraining() {
            if (isBlocked) {
                unblockTraining();
            } else {
                blockTraining();
            }
        }

        function createTrainingBlock() {
            console.log('🔨 createTrainingBlock() called');
            
            // Remove existing block if any
            removeTrainingBlock();

            // Target the gymroot specifically
            const gymRoot = document.querySelector('#gymroot');
            console.log('🔨 Looking for #gymroot element:', gymRoot);
            
            if (!gymRoot) {
                console.warn('⚠️ Gym root not found on this page - overlay NOT created');
                return; // Don't create overlay if gym isn't present
            }

            console.log('✅ #gymroot found! Creating overlay...');
            createBlockOverlay(gymRoot);
        }

        function createBlockOverlay(targetElement) {
            console.log('🎨 createBlockOverlay() called with element:', targetElement);
            
            // Ensure the target element has position relative
            const computedPosition = window.getComputedStyle(targetElement).position;
            console.log('🎨 Current position:', computedPosition);
            if (computedPosition === 'static') {
                targetElement.style.position = 'relative';
                console.log('🎨 Changed position to relative');
            }
            
            // Create blocking overlay with custom picture (no black tint)
            blockingOverlay = document.createElement('div');
            blockingOverlay.id = 'training-blocker-overlay';
            blockingOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9998;
                display: flex;
                align-items: center;
                justify-content: center;
                background: red;
            `;

            // Create custom picture container
            const pictureContainer = document.createElement('div');
            pictureContainer.style.cssText = `
                background: url('https://i.imgur.com/DExI6Og.png') no-repeat center center;
                background-size: cover;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            blockingOverlay.appendChild(pictureContainer);
            
            // Append directly to the target element for absolute positioning
            targetElement.appendChild(blockingOverlay);
            
            console.log('✅✅✅ OVERLAY CREATED AND ADDED TO DOM! ✅✅✅');
            console.log('Overlay element:', blockingOverlay);
            console.log('Overlay parent:', blockingOverlay.parentNode);
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
                console.log('🔄 Restoring training blocker overlay...');
                // Wait a bit longer to ensure the gym elements are fully loaded
                setTimeout(() => {
                    createTrainingBlock();
                    console.log('✅ Training blocker overlay restored successfully');
                }, 1500); // Increased delay to ensure gym elements are loaded
            }
        }

        // Start the training blocker
        restoreTrainingBlocker();
        
        // Enhanced restoration function for better persistence
        function enhancedRestoreTrainingBlocker() {
            if (!isBlocked) return;
            
            console.log('🔄 Enhanced restoration: Checking if training blocker needs to be restored...');
            
            // Check if we're on a gym/training page
            const isGymPage = window.location.href.includes('/gym') || 
                             window.location.href.includes('/training') ||
                             document.querySelector('#gymroot') ||
                             document.querySelector('.training-section') ||
                             document.querySelector('.training') ||
                             document.querySelector('.gym');
            
            if (isGymPage) {
                console.log('🏋️ Gym page detected, restoring training blocker...');
                // Multiple attempts with increasing delays to ensure success
                setTimeout(() => createTrainingBlock(), 1000);
                setTimeout(() => {
                    if (!blockingOverlay) {
                        console.log('🔄 Second attempt to restore training blocker...');
                        createTrainingBlock();
                    }
                }, 3000);
                setTimeout(() => {
                    if (!blockingOverlay) {
                        console.log('🔄 Third attempt to restore training blocker...');
                        createTrainingBlock();
                    }
                }, 6000);
            } else {
                console.log('📄 Not on gym page, training blocker not needed');
            }
        }
        
        // Call enhanced restoration for better persistence
        enhancedRestoreTrainingBlocker();
        
        // Listen for URL changes to restore blocker when navigating to gym pages
        let currentUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                console.log('🧭 URL changed, checking if training blocker needs restoration...');
                setTimeout(enhancedRestoreTrainingBlocker, 1000);
            }
        }, 1000);
        
        // Also listen for DOM changes that might indicate gym elements appeared
        const domObserver = new MutationObserver((mutations) => {
            if (!isBlocked) return;
            
            // Check if gym elements appeared
            const hasGymElements = document.querySelector('#gymroot') || 
                                 document.querySelector('.training-section') ||
                                 document.querySelector('.training') ||
                                 document.querySelector('.gym');
            
            if (hasGymElements && !blockingOverlay) {
                console.log('🔍 DOM change detected: Gym elements found, restoring training blocker...');
                setTimeout(() => createTrainingBlock(), 500);
            }
        });
        
        domObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Periodic check to ensure blocking overlay is maintained
        setInterval(() => {
            if (isBlocked && !blockingOverlay) {
                console.log('🔄 Periodic check: Training blocker should be active but overlay is missing, restoring...');
                createTrainingBlock();
            }
        }, 5000); // Check every 5 seconds

        // Export module
        window.SidekickModules.BlockTraining = {
            blockTraining,
            unblockTraining,
            toggleBlockTraining,
            isEnabled: () => isBlocked,
            restoreTrainingBlocker: () => {
                if (isBlocked) {
                    console.log('🔄 Restoring training blocker from external call...');
                    setTimeout(() => {
                        createTrainingBlock();
                        console.log('✅ Training blocker restored from external call');
                    }, 1000);
                }
            }
        };

        console.log('🚫 Training Blocker module loaded');
    });
})();
