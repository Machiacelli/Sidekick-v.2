// ==UserScript==
// @name         Sidekick Auto Gym Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Automatically switches to the best gym for training each stat
// @author       Machiacelli
// @match        https://www.torn.com/gym.php*
// @match        https://*.torn.com/gym.php*
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
        const AutoGymModule = {
            name: 'AutoGym',
            version: '1.0.0',
            isActive: false,
            enabled: false,
            currentGym: null,
            originalFetch: null,
            
            // Gym data from the original script - all 33 gyms with stat multipliers
            gymInfo: {
                1: { 'str': 2, 'spe': 2, 'def': 2, 'dex': 2 },
                2: { 'str': 2.4, 'spe': 2.4, 'def': 2.7, 'dex': 2.4 },
                3: { 'str': 2.7, 'spe': 3.2, 'def': 3.0, 'dex': 2.7 },
                4: { 'str': 3.2, 'spe': 3.2, 'def': 3.2, 'dex': 0 },
                5: { 'str': 3.4, 'spe': 3.6, 'def': 3.4, 'dex': 3.2 },
                6: { 'str': 3.4, 'spe': 3.6, 'def': 3.6, 'dex': 3.8 },
                7: { 'str': 3.7, 'spe': 0, 'def': 3.7, 'dex': 3.7 },
                8: { 'str': 4, 'spe': 4, 'def': 4, 'dex': 4 },
                9: { 'str': 4.8, 'spe': 4.4, 'def': 4, 'dex': 4.2 },
                10: { 'str': 4.4, 'spe': 4.6, 'def': 4.8, 'dex': 4.4 },
                11: { 'str': 5, 'spe': 4.6, 'def': 5.2, 'dex': 4.6 },
                12: { 'str': 5, 'spe': 5.2, 'def': 5, 'dex': 5 },
                13: { 'str': 5, 'spe': 5.4, 'def': 4.8, 'dex': 5.2 },
                14: { 'str': 5.5, 'spe': 5.7, 'def': 5.5, 'dex': 5.2 },
                15: { 'str': 0, 'spe': 5.5, 'def': 5.5, 'dex': 5.7 },
                16: { 'str': 6, 'spe': 6, 'def': 6, 'dex': 6 },
                17: { 'str': 6, 'spe': 6.2, 'def': 6.4, 'dex': 6.2 },
                18: { 'str': 6.5, 'spe': 6.4, 'def': 6.2, 'dex': 6.2 },
                19: { 'str': 6.4, 'spe': 6.5, 'def': 6.4, 'dex': 6.8 },
                20: { 'str': 6.4, 'spe': 6.4, 'def': 6.8, 'dex': 7 },
                21: { 'str': 7, 'spe': 6.4, 'def': 6.4, 'dex': 6.5 },
                22: { 'str': 6.8, 'spe': 6.5, 'def': 7, 'dex': 6.5 },
                23: { 'str': 6.8, 'spe': 7, 'def': 7, 'dex': 6.8 },
                24: { 'str': 7.3, 'spe': 7.3, 'def': 7.3, 'dex': 7.3 },
                25: { 'str': 0, 'spe': 0, 'def': 7.5, 'dex': 7.5 },
                26: { 'str': 7.5, 'spe': 7.5, 'def': 0, 'dex': 0 },
                27: { 'str': 8, 'spe': 0, 'def': 0, 'dex': 0 },
                28: { 'str': 0, 'spe': 0, 'def': 8, 'dex': 0 },
                29: { 'str': 0, 'spe': 8, 'def': 0, 'dex': 0 },
                30: { 'str': 0, 'spe': 0, 'def': 0, 'dex': 8 },
                31: { 'str': 9, 'spe': 9, 'def': 9, 'dex': 9 },
                32: { 'str': 10, 'spe': 10, 'def': 10, 'dex': 10 },
                33: { 'str': 3.4, 'spe': 3.4, 'def': 4.6, 'dex': 0 }
            },

            // Store best gyms for each stat (pre-calculated for performance)
            bestGyms: {
                'str': [],
                'def': [],
                'spe': [],
                'dex': []
            },

            init() {
                console.log('🏋️ Initializing Auto Gym Module v1.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Auto Gym');
                    return false;
                }

                // Load saved settings
                this.enabled = this.core.loadState('autoGymEnabled') || false;
                
                // Pre-calculate best gyms for each stat
                this.calculateBestGyms();
                
                // Only activate on gym page
                if (window.location.href.includes('/gym.php')) {
                    this.activate();
                }

                console.log('✅ Auto Gym module initialized');
                return true;
            },

            activate() {
                if (this.isActive) return;
                
                console.log('🏋️ Auto Gym activated on gym page');
                this.isActive = true;
                
                if (this.enabled) {
                    this.enableAutoGym();
                }
            },

            // Pre-calculate the best gyms for each stat (sorted by multiplier, then by ID)
            calculateBestGyms() {
                const stats = ['str', 'def', 'spe', 'dex'];
                
                stats.forEach(stat => {
                    const gymsForStat = [];
                    
                    for (const gymId in this.gymInfo) {
                        const multiplier = this.gymInfo[gymId][stat];
                        if (multiplier > 0) {
                            gymsForStat.push({
                                id: parseInt(gymId),
                                multiplier: multiplier
                            });
                        }
                    }
                    
                    // Sort by multiplier (highest first), then by ID (highest first for tiebreaker)
                    gymsForStat.sort((a, b) => {
                        if (a.multiplier === b.multiplier) {
                            return b.id - a.id;
                        }
                        return b.multiplier - a.multiplier;
                    });
                    
                    this.bestGyms[stat] = gymsForStat;
                });
                
                console.log('🎯 Best gyms calculated:', this.bestGyms);
            },

            // Find the best available gym for a stat
            findBestGym(stat) {
                const gymList = this.bestGyms[stat];
                
                for (const gym of gymList) {
                    // Check if gym is available (not locked)
                    if (gym.id > 24 && gym.id < 32) {
                        // Special gyms - check if they're locked
                        const gymElement = document.querySelector(`[class*='gym-${gym.id}']`);
                        if (gymElement) {
                            const isLocked = Array.from(gymElement.parentElement.classList)
                                .some(className => className.includes('locked'));
                            
                            if (!isLocked) {
                                return gym.id;
                            }
                        }
                    } else {
                        // Regular gyms
                        return gym.id;
                    }
                }
                
                return null;
            },

            // Enable auto gym switching by intercepting fetch requests
            enableAutoGym() {
                if (this.originalFetch) return; // Already enabled
                
                this.originalFetch = window.fetch;
                const self = this;
                
                window.fetch = async function(...args) {
                    // Check if this is a training request
                    if (args[0].includes('/gym.php?step=train') && args[1] && args[1].body) {
                        try {
                            const requestData = JSON.parse(args[1].body);
                            const stat = requestData.stat.substring(0, 3); // Get first 3 chars (str, def, spe, dex)
                            
                            console.log(`🎯 Training ${stat}, finding best gym...`);
                            
                            const bestGymId = self.findBestGym(stat);
                            
                            if (bestGymId && bestGymId !== self.currentGym) {
                                console.log(`🔄 Switching from gym ${self.currentGym} to gym ${bestGymId} for ${stat} training`);
                                
                                // Switch gym first
                                const switchResult = await self.switchGym(bestGymId);
                                if (!switchResult.success) {
                                    console.warn('⚠️ Gym switch failed, training with current gym');
                                } else {
                                    console.log('✅ Gym switched successfully');
                                }
                            }
                            
                        } catch (error) {
                            console.error('❌ Error processing training request:', error);
                        }
                    }
                    
                    // Continue with original request
                    const result = await self.originalFetch(...args);
                    
                    // Track gym changes and current gym
                    if (args[0].includes('/gym.php?step=getInitialGymInfo')) {
                        try {
                            const jsonData = await result.clone().json();
                            self.processGymData(jsonData);
                        } catch (error) {
                            console.error('❌ Error processing gym info:', error);
                        }
                    } else if (args[0].includes('/gym.php?step=changeGym')) {
                        try {
                            const jsonData = await result.clone().json();
                            if (jsonData.success && args[1] && args[1].body) {
                                const requestData = JSON.parse(args[1].body);
                                self.currentGym = parseInt(requestData.gymID);
                                console.log(`📍 Current gym updated to: ${self.currentGym}`);
                            }
                        } catch (error) {
                            console.error('❌ Error processing gym change:', error);
                        }
                    }
                    
                    return result;
                };
                
                console.log('🔄 Auto gym switching enabled');
            },

            // Disable auto gym switching
            disableAutoGym() {
                if (this.originalFetch) {
                    window.fetch = this.originalFetch;
                    this.originalFetch = null;
                    console.log('⏹️ Auto gym switching disabled');
                }
            },

            // Process initial gym data to find current gym
            processGymData(gymData) {
                try {
                    const classList = ['specialist', 'heavyweight', 'middleweight', 'lightweight', 'jail'];
                    
                    for (const gymClass of classList) {
                        if (gymData.gyms[gymClass]) {
                            for (const gym of gymData.gyms[gymClass]) {
                                if (gym.status === 'active') {
                                    this.currentGym = gym.id;
                                    console.log(`📍 Current gym detected: ${gym.id} (${gym.name})`);
                                    return;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Error processing gym data:', error);
                }
            },

            // Switch to specific gym
            async switchGym(gymId) {
                try {
                    const response = await fetch('/gym.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `step=changeGym&gymID=${gymId}`
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        this.currentGym = gymId;
                        this.updateGymUI(gymId);
                    }
                    
                    return result;
                    
                } catch (error) {
                    console.error('❌ Error switching gym:', error);
                    return { success: false, message: 'Network error' };
                }
            },

            // Update gym UI elements after switching
            updateGymUI(gymId) {
                try {
                    // Update active gym button styling
                    const currentActive = document.querySelector('[class*=\'active\'][class^=\'gymButton\']');
                    const newActive = document.querySelector(`[class*='gym-${gymId}']`);
                    
                    if (currentActive && newActive) {
                        // Remove active class from current
                        const activeClass = Array.from(currentActive.classList)
                            .find(className => className.includes('active'));
                        
                        if (activeClass) {
                            currentActive.classList.remove(activeClass);
                            newActive.parentElement.classList.add(activeClass);
                        }
                    }
                    
                    // Update gym logo
                    const logos = document.querySelectorAll('[class^=\'logo\'] img');
                    for (const logo of logos) {
                        if (logo.src.includes('/gym/')) {
                            const srcParts = logo.src.split('/');
                            srcParts[srcParts.length - 1] = `${gymId}.png`;
                            logo.src = srcParts.join('/');
                            break;
                        }
                    }
                    
                } catch (error) {
                    console.error('❌ Error updating gym UI:', error);
                }
            },

            // Enable/disable the auto gym feature
            toggle() {
                this.enabled = !this.enabled;
                this.core.saveState('autoGymEnabled', this.enabled);
                
                if (this.enabled) {
                    this.enableAutoGym();
                    console.log('✅ Auto Gym enabled');
                } else {
                    this.disableAutoGym();
                    console.log('⏹️ Auto Gym disabled');
                }
                
                return this.enabled;
            },

            // Get current status
            getStatus() {
                return {
                    enabled: this.enabled,
                    active: this.isActive,
                    currentGym: this.currentGym,
                    onGymPage: window.location.href.includes('/gym.php'),
                    bestGyms: this.bestGyms
                };
            },

            // Manual gym switch for testing
            async manualSwitch(stat) {
                if (!this.enabled) {
                    console.warn('⚠️ Auto gym is disabled');
                    return false;
                }
                
                const bestGym = this.findBestGym(stat);
                if (bestGym && bestGym !== this.currentGym) {
                    console.log(`🔄 Manually switching to best gym for ${stat}: ${bestGym}`);
                    const result = await this.switchGym(bestGym);
                    return result.success;
                }
                
                console.log(`✅ Already at best gym for ${stat}`);
                return true;
            },

            // Get best gym for a stat
            getBestGymFor(stat) {
                const best = this.bestGyms[stat]?.[0];
                return best ? { id: best.id, multiplier: best.multiplier } : null;
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.AutoGym = AutoGymModule;

        console.log('🏋️ Auto Gym module registered globally');
        
        // Auto-initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => AutoGymModule.init(), 500);
            });
        } else {
            setTimeout(() => AutoGymModule.init(), 500);
        }
    });
})();
