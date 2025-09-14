// ==UserScript==
// @name         Sidekick Auto Gym Module
// @namespace    http://tampermonkey.net/
// @version      1.0.5
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
            version: '1.0.5',
            enabled: false,
            originalFetch: null,
            core: null,
            
            // Complete gym data with stat multipliers - ALL 33 GYMS
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
                25: { 'str': 7.5, 'spe': 7.8, 'def': 7.5, 'dex': 7.8 },
                26: { 'str': 7.8, 'spe': 7.5, 'def': 7.8, 'dex': 7.5 },
                27: { 'str': 8, 'spe': 0, 'def': 0, 'dex': 0 },
                28: { 'str': 0, 'spe': 0, 'def': 8, 'dex': 0 },
                29: { 'str': 0, 'spe': 8, 'def': 0, 'dex': 0 },
                30: { 'str': 0, 'spe': 0, 'def': 0, 'dex': 8 },
                31: { 'str': 9, 'spe': 9, 'def': 9, 'dex': 9 },
                32: { 'str': 10, 'spe': 10, 'def': 10, 'dex': 10 },
                33: { 'str': 10.5, 'spe': 10.5, 'def': 10.5, 'dex': 10.5 }
            },

            init() {
                console.log('🏋️ Initializing Auto Gym Module v1.0.5...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for AutoGym');
                    return false;
                }

                // Load saved state
                const savedState = this.core.loadState('autoGymEnabled');
                this.enabled = savedState === true; // Only true if explicitly saved as true
                
                console.log('🔧 AutoGym loadState result:', savedState);
                console.log('🔧 AutoGym initialized with saved state:', this.enabled);
                
                // Enable auto gym if it was previously enabled and on gym page
                if (this.enabled && window.location.href.includes('/gym.php')) {
                    this.enableAutoGym();
                }
                
                return true;
            },

            // Find the best gym for training a specific stat
            findBestGym(stat) {
                let bestGym = null;
                let bestMultiplier = 0;
                
                for (const gymId in this.gymInfo) {
                    const multiplier = this.gymInfo[gymId][stat];
                    if (multiplier > bestMultiplier) {
                        bestMultiplier = multiplier;
                        bestGym = parseInt(gymId);
                    }
                }
                console.log(`🎯 Best gym for ${stat}: gym ${bestGym} (${bestMultiplier}x)`);
                return bestGym;
            },

            // Enable auto gym switching
            enableAutoGym() {
                if (this.originalFetch) return;
                this.originalFetch = window.fetch;
                const self = this;
                
                window.fetch = async function(...args) {
                    if (args[0] && args[0].includes && args[0].includes('/gym.php?step=train') && args[1] && args[1].body) {
                        try {
                            const requestData = JSON.parse(args[1].body);
                            let stat = requestData.stat;
                            
                            // Normalize stat names
                            if (stat.includes('strength')) stat = 'str';
                            else if (stat.includes('defense')) stat = 'def';
                            else if (stat.includes('speed')) stat = 'spe';
                            else if (stat.includes('dexterity')) stat = 'dex';
                            else stat = stat.substring(0, 3);
                            
                            console.log(`🎯 Training ${stat}, finding best gym...`);
                            const bestGymId = self.findBestGym(stat);
                            
                            if (bestGymId) {
                                console.log(`🔄 Switching to best gym for ${stat}: ${bestGymId}`);
                                try {
                                    await fetch('/gym.php', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                        body: `step=changeGym&gymID=${bestGymId}`
                                    });
                                    console.log('✅ Gym switched successfully');
                                } catch (error) {
                                    console.warn('⚠️ Gym switch failed:', error);
                                }
                            }
                        } catch (error) {
                            console.error('❌ Error processing training request:', error);
                        }
                    }
                    
                    // Continue with original request
                    return self.originalFetch(...args);
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

            // Enable/disable the auto gym feature
            toggle() {
                console.log('🏋️ AutoGym toggle called. Current state:', this.enabled);
                this.enabled = !this.enabled;
                console.log('🏋️ AutoGym new state:', this.enabled);
                
                // Save state
                if (this.core && this.core.saveState) {
                    this.core.saveState('autoGymEnabled', this.enabled);
                    console.log('🏋️ AutoGym state saved via Core module:', this.enabled);
                    
                    // Verify it was saved
                    const verifyState = this.core.loadState('autoGymEnabled');
                    console.log('🏋️ AutoGym verify saved state:', verifyState);
                } else {
                    console.error('🏋️ AutoGym Core module not available for saving state!');
                }
                
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
                    onGymPage: window.location.href.includes('/gym.php')
                };
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.AutoGym = AutoGymModule;

        console.log('🏋️ Auto Gym module registered globally');
    });
})();
