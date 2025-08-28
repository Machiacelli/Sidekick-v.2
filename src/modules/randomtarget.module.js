// ==UserScript==
// @name         Sidekick Random Target Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Random target finder for Torn chains - modular approach
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
        const RandomTargetModule = {
            name: 'RandomTarget',
            version: '1.0.0',
            isActive: false,
            targetButton: null,
            
            // Configuration
            config: {
                enableApiChecks: false, // requires valid public api key if set to true
                apiKey: '', // public API key
                maxXanax: 1000,
                maxRefills: 500,
                maxSEs: 1,
                minID: 1000000,
                maxID: 3400000
            },

            init() {
                console.log('🎯 Initializing Random Target Module v1.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Random Target');
                    return false;
                }

                // Load saved configuration
                this.loadConfig();
                
                // Check if button was previously active and restore it
                this.restoreButtonState();
                
                console.log('✅ Random Target module initialized successfully');
                return true;
            },

            // Main activation method - called when user toggles Random Target switch
            activate() {
                console.log('🎯 Random Target module activated!');
                
                if (this.isActive) {
                    this.hideTargetButton();
                    this.isActive = false;
                    this.core.saveState('random_target_active', false);
                    this.updateSettingsToggle(false);
                    return;
                }

                this.showTargetButton();
                this.isActive = true;
                this.core.saveState('random_target_active', true);
                this.updateSettingsToggle(true);
            },

            showTargetButton() {
                if (this.targetButton) return;
                
                this.isActive = true;
                this.core.saveState('random_target_active', true);
                
                // Load saved button position
                const savedPosition = this.loadButtonPosition();
                
                // Create target button
                this.targetButton = document.createElement('button');
                this.targetButton.id = 'random-target-button';
                this.targetButton.innerHTML = '🎯';
                this.targetButton.style.cssText = `
                    position: fixed;
                    left: ${savedPosition.x}px;
                    top: ${savedPosition.y}px;
                    background: #2a2a2a;
                    color: white;
                    border: 2px solid #4CAF50;
                    padding: 6px;
                    border-radius: 50%;
                    cursor: move;
                    font-weight: bold;
                    font-size: 16px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                    z-index: 9999;
                    user-select: none;
                    transition: all 0.2s ease;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                // Add hover effects
                this.targetButton.addEventListener('mouseenter', () => {
                    this.targetButton.style.transform = 'scale(1.05)';
                    this.targetButton.style.borderColor = '#45a049';
                    this.targetButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
                });

                this.targetButton.addEventListener('mouseleave', () => {
                    this.targetButton.style.transform = 'scale(1)';
                    this.targetButton.style.borderColor = '#4CAF50';
                    this.targetButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
                });

                // Add click event
                this.targetButton.addEventListener('click', () => {
                    this.findTarget();
                });

                // Add dragging functionality
                this.addDragging(this.targetButton);

                // Add to page
                document.body.appendChild(this.targetButton);
                
                // Add viewport resize handler to keep button visible
                this.addViewportResizeHandler(this.targetButton);
                
                // Save button active state
                window.SidekickModules.Core.saveState('random_target_active', true);
            },

            hideTargetButton() {
                if (this.targetButton) {
                    // Clean up resize handler
                    if (this.targetButton.viewportResizeHandler) {
                        window.removeEventListener('resize', this.targetButton.viewportResizeHandler);
                        this.targetButton.viewportResizeHandler = null;
                    }
                    
                    this.targetButton.remove();
                    this.targetButton = null;
                }
                this.isActive = false;
                
                // Save button inactive state
                window.SidekickModules.Core.saveState('random_target_active', false);
            },

            addDragging(button) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };
                let hasMoved = false; // Track if button actually moved during drag
                let startPosition = { x: 0, y: 0 }; // Track starting position
                
                button.addEventListener('mousedown', (e) => {
                    if (e.target === button) {
                        isDragging = true;
                        hasMoved = false;
                        const rect = button.getBoundingClientRect();
                        dragOffset.x = e.clientX - rect.left;
                        dragOffset.y = e.clientY - rect.top;
                        startPosition.x = rect.left;
                        startPosition.y = rect.top;
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Change cursor during drag
                        button.style.cursor = 'grabbing';
                    }
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const newX = e.clientX - dragOffset.x;
                    const newY = e.clientY - dragOffset.y;
                    
                    // Check if button has moved significantly (more than 5 pixels)
                    const deltaX = Math.abs(newX - startPosition.x);
                    const deltaY = Math.abs(newY - startPosition.y);
                    if (deltaX > 5 || deltaY > 5) {
                        hasMoved = true;
                    }
                    
                    // Keep within viewport bounds
                    const maxX = window.innerWidth - button.offsetWidth;
                    const maxY = window.innerHeight - button.offsetHeight;
                    
                    button.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
                    button.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
                });
                
                document.addEventListener('mouseup', (e) => {
                    if (isDragging) {
                        isDragging = false;
                        button.style.cursor = 'move';
                        
                        // Only save position if button actually moved
                        if (hasMoved) {
                            this.saveButtonPosition(button);
                        }
                        
                        // Prevent click event from firing after drag
                        if (hasMoved) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }
                });
            },

            saveButtonPosition(button) {
                const position = {
                    x: parseInt(button.style.left) || 10,
                    y: parseInt(button.style.top) || 10
                };
                
                // Save both position and current viewport dimensions
                window.SidekickModules.Core.saveState('random_target_position', position);
                window.SidekickModules.Core.saveState('random_target_viewport', {
                    width: window.innerWidth,
                    height: window.innerHeight
                });
                
                console.log('💾 Saved button position:', position, 'viewport:', { width: window.innerWidth, height: window.innerHeight });
            },

            addViewportResizeHandler(button) {
                // Handle viewport resize to maintain relative position
                const handleResize = () => {
                    // Get current button position
                    const currentX = parseInt(button.style.left) || 10;
                    const currentY = parseInt(button.style.top) || 10;
                    
                    // Get current viewport dimensions
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    const buttonSize = button.offsetWidth || 40;
                    
                    // Calculate relative position as percentages
                    const relativeX = (currentX / (viewportWidth - buttonSize)) * 100;
                    const relativeY = (currentY / (viewportHeight - buttonSize)) * 100;
                    
                    // Clamp relative values to 0-100 range
                    const clampedRelativeX = Math.max(0, Math.min(100, relativeX));
                    const clampedRelativeY = Math.max(0, Math.min(100, relativeY));
                    
                    // Convert back to absolute pixels for new viewport
                    const newX = Math.round((clampedRelativeX / 100) * (viewportWidth - buttonSize));
                    const newY = Math.round((clampedRelativeY / 100) * (viewportHeight - buttonSize));
                    
                    // Ensure minimum values
                    const finalX = Math.max(0, newX);
                    const finalY = Math.max(0, newY);
                    
                    // Update button position to maintain relative location
                    button.style.left = finalX + 'px';
                    button.style.top = finalY + 'px';
                    
                    // Save new position and viewport
                    this.saveButtonPosition(button);
                    
                    console.log('🎯 Maintained relative position during resize:', { 
                        relative: { x: clampedRelativeX.toFixed(1) + '%', y: clampedRelativeY.toFixed(1) + '%' },
                        absolute: { x: finalX, y: finalY }
                    });
                };
                
                // Add resize event listener with debouncing for performance
                let resizeTimeout;
                const debouncedHandleResize = () => {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(handleResize, 100);
                };
                
                window.addEventListener('resize', debouncedHandleResize);
                
                // Store reference for cleanup
                button.viewportResizeHandler = debouncedHandleResize;
            },

            loadButtonPosition() {
                try {
                    const position = window.SidekickModules.Core.loadState('random_target_position', { x: 10, y: 10 });
                    
                    // Instead of constraining to viewport bounds, maintain relative position
                    // This prevents the button from "jumping" when viewport changes
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    const buttonSize = 40; // Button width/height
                    
                    // Calculate relative position as percentages (0-100)
                    const relativeX = (position.x / (viewportWidth - buttonSize)) * 100;
                    const relativeY = (position.y / (viewportHeight - buttonSize)) * 100;
                    
                    // Clamp relative values to 0-100 range
                    const clampedRelativeX = Math.max(0, Math.min(100, relativeX));
                    const clampedRelativeY = Math.max(0, Math.min(100, relativeY));
                    
                    // Convert back to absolute pixels for current viewport
                    const newX = Math.round((clampedRelativeX / 100) * (viewportWidth - buttonSize));
                    const newY = Math.round((clampedRelativeY / 100) * (viewportHeight - buttonSize));
                    
                    // Ensure minimum values
                    const finalX = Math.max(0, newX);
                    const finalY = Math.max(0, newY);
                    
                    // Only update saved position if viewport changed significantly
                    const savedViewport = window.SidekickModules.Core.loadState('random_target_viewport', { width: 0, height: 0 });
                    const viewportChanged = Math.abs(savedViewport.width - viewportWidth) > 50 || 
                                          Math.abs(savedViewport.height - viewportHeight) > 50;
                    
                    if (viewportChanged) {
                        console.log('🎯 Viewport changed, updating relative position');
                        // Save new viewport dimensions
                        window.SidekickModules.Core.saveState('random_target_viewport', { 
                            width: viewportWidth, 
                            height: viewportHeight 
                        });
                        
                        // Save new absolute position
                        window.SidekickModules.Core.saveState('random_target_position', { 
                            x: finalX, 
                            y: finalY 
                        });
                    }
                    
                    return { x: finalX, y: finalY };
                } catch (error) {
                    console.error('❌ Error loading button position:', error);
                    return { x: 10, y: 10 };
                }
            },

            restoreButtonState() {
                try {
                    const wasActive = window.SidekickModules.Core.loadState('random_target_active', false);
                    if (wasActive) {
                        console.log('🔄 Restoring random target button state...');
                        this.isActive = true;
                        // Small delay to ensure DOM is ready
                        setTimeout(() => {
                            this.showTargetButton();
                            this.updateSettingsToggle(true);
                        }, 500);
                    } else {
                        this.isActive = false;
                    }
                } catch (error) {
                    console.error('❌ Failed to restore button state:', error);
                }
            },

            loadConfig() {
                try {
                    const savedConfig = window.SidekickModules.Core.loadState('random_target_config', {});
                    this.config = { ...this.config, ...savedConfig };
                    console.log('📂 Loaded random target config:', this.config);
                } catch (error) {
                    console.error('❌ Failed to load config:', error);
                }
            },

            saveConfig() {
                try {
                    window.SidekickModules.Core.saveState('random_target_config', this.config);
                    console.log('💾 Saved random target config');
                } catch (error) {
                    console.error('❌ Failed to save config:', error);
                }
            },

            getRandomNumber(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            },

            async findTarget() {
                console.log('🎯 Finding random target...');
                
                let success = false;
                let randID = this.getRandomNumber(this.config.minID, this.config.maxID);

                if (this.config.enableApiChecks && this.config.apiKey) {
                    try {
                        const url = `https://api.torn.com/user/${randID}?selections=basic,personalstats&key=${this.config.apiKey}`;
                        const response = await fetch(url);
                        const user = await response.json();

                        if (user.status && user.status.state !== 'Okay') {
                            console.log(`User ${randID} discarded because not Okay`);
                            success = false;
                        } else if (user.personalstats && user.personalstats.xantaken > this.config.maxXanax) {
                            console.log(`User ${randID} discarded because too many Xanax`);
                            success = false;
                        } else if (user.personalstats && user.personalstats.refills > this.config.maxRefills) {
                            console.log(`User ${randID} discarded because too many refills`);
                            success = false;
                        } else if (user.personalstats && user.personalstats.statenhancersused > this.config.maxSEs) {
                            console.log(`User ${randID} discarded because too many SEs`);
                            success = false;
                        } else {
                            success = true;
                        }

                        if (success) {
                            this.openProfile(randID);
                        } else {
                            // Retry with delay to respect API rate limits
                            setTimeout(() => this.findTarget(), 200);
                        }
                    } catch (error) {
                        console.error('❌ Error checking user:', error);
                        // Fallback to random ID without API checks
                        this.openProfile(randID);
                    }
                } else {
                    // No API checks, use random ID directly
                    this.openProfile(randID);
                }
            },

            openProfile(userId) {
                // Profile link - you can change this to attack link if preferred
                const profileLink = `https://www.torn.com/profiles.php?XID=${userId}`;
                
                // Open in new tab
                window.open(profileLink, '_blank');
                
                // Show notification
                window.SidekickModules.Core.NotificationSystem.show(
                    'Random Target',
                    `Found target: ${userId}`,
                    'success'
                );
            },

            // Method to update configuration (called from settings)
            updateConfig(newConfig) {
                this.config = { ...this.config, ...newConfig };
                this.saveConfig();
                console.log('⚙️ Random target config updated:', this.config);
            },

            // Method to update the settings toggle to reflect current state
            updateSettingsToggle(isActive) {
                try {
                    const toggle = document.getElementById('random-target-toggle');
                    if (toggle) {
                        toggle.checked = isActive;
                        console.log('🔄 Updated Random Target toggle to:', isActive);
                    }
                } catch (error) {
                    console.error('❌ Failed to update settings toggle:', error);
                }
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.RandomTarget = RandomTargetModule;

        console.log('🎯 Random Target module registered globally');
        console.log('🔍 Random Target module check:', {
            'SidekickModules exists': !!window.SidekickModules,
            'RandomTarget exists': !!window.SidekickModules.RandomTarget,
            'RandomTarget.activate exists': !!window.SidekickModules.RandomTarget?.activate,
            'Available modules': Object.keys(window.SidekickModules)
        });
        
        // Additional debugging
        console.log('🎯 RandomTarget module object:', RandomTargetModule);
        console.log('🎯 RandomTarget module name:', RandomTargetModule.name);
        console.log('🎯 RandomTarget module activate method:', typeof RandomTargetModule.activate);

        // Fallback registration - ensure module is available
        setTimeout(() => {
            if (!window.SidekickModules.RandomTarget) {
                console.warn('⚠️ RandomTarget not found, re-registering...');
                window.SidekickModules.RandomTarget = RandomTargetModule;
                console.log('✅ RandomTarget re-registered');
            }
        }, 1000);
    });
})();
