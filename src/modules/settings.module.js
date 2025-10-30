// ==UserScript==
// @name         Sidewinder Settings Module
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Settings and API management for Sidewinder sidebar with enhanced debugging
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
        const { STORAGE_KEYS, saveState, loadState, NotificationSystem } = window.SidekickModules.Core;

        // === API SYSTEM ===
        const ApiSystem = {
            lastRequest: 0,
            apiVersion: 'v1', // Default to v1, can be upgraded
            baseUrl: 'https://api.torn.com',
            endpointVersions: {}, // Cache which version works for each endpoint
            
            // Enhanced makeRequest with intelligent version selection
            async makeRequest(endpoint, selections = '', retries = 3, forceVersion = null) {
                const apiKey = loadState(STORAGE_KEYS.API_KEY, '');
                if (!apiKey) {
                    throw new Error('API key not configured');
                }

                // Rate limiting - wait at least 1 second between requests
                const now = Date.now();
                const timeSinceLastRequest = now - this.lastRequest;
                if (timeSinceLastRequest < 1000) {
                    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
                }
                this.lastRequest = Date.now();

                // Determine version to use
                const endpointKey = `${endpoint}:${selections}`;
                let version = forceVersion;
                
                if (!version) {
                    // Use cached version if available, otherwise default
                    version = this.endpointVersions[endpointKey] || this.apiVersion;
                }

                // Build URL based on API version
                let url;
                if (version === 'v2') {
                    url = `${this.baseUrl}/v2/${endpoint}?key=${apiKey}`;
                } else {
                    url = `${this.baseUrl}/${endpoint}?key=${apiKey}`;
                }
                
                if (selections) {
                    url += `&selections=${selections}`;
                }

                for (let attempt = 1; attempt <= retries; attempt++) {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        const data = await response.json();
                        
                        if (data.error) {
                            const errorCode = data.error.code;
                            const errorMsg = data.error.error || 'API error';
                            
                            // Handle API V2 migration errors - cache the correct version
                            if (errorCode === 22 || errorCode === 21) {
                                // Selection only available in API v1
                                if (version !== 'v1') {
                                    console.warn(`🔄 ${endpoint}/${selections} only works with API v1, caching preference...`);
                                    this.endpointVersions[endpointKey] = 'v1';
                                    return await this.makeRequest(endpoint, selections, retries, 'v1');
                                }
                            } else if (errorCode === 23) {
                                // Selection only available in API v2
                                if (version !== 'v2') {
                                    console.warn(`🔄 ${endpoint}/${selections} only works with API v2, caching preference...`);
                                    this.endpointVersions[endpointKey] = 'v2';
                                    return await this.makeRequest(endpoint, selections, retries, 'v2');
                                }
                            } else if (errorCode === 19) {
                                console.warn('🔄 Must be migrated to crimes 2.0, attempting alternative...', endpoint, selections);
                                // Handle crimes 2.0 migration - no fallback needed
                            }
                            
                            throw new Error(`API Error (${errorCode}): ${errorMsg}`);
                        }

                        // Success! Cache the working version for this endpoint
                        if (!forceVersion) { // Only cache if we're not forcing a version
                            this.endpointVersions[endpointKey] = version;
                        }
                        console.log(`✅ API ${version.toUpperCase()} call successful:`, endpoint, selections);
                        return data;

                    } catch (error) {
                        console.warn(`API request attempt ${attempt} failed (${version}):`, error);
                        if (attempt === retries) {
                            throw error;
                        }
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                }
            },

            // Detect the optimal API version for the user's key
            async detectApiVersion() {
                try {
                    console.log('🔍 Detecting optimal API version...');
                    
                    // Try a simple call that should work in both versions
                    const testData = await this.makeRequest('user', 'basic', 1, 'v1');
                    
                    // If v1 works, test v2 capabilities
                    try {
                        await this.makeRequest('user', 'basic', 1, 'v2');
                        console.log('✅ API V2 available, upgrading default version');
                        this.apiVersion = 'v2';
                        // Note: Removed annoying notification that appeared on every page refresh
                    } catch (v2Error) {
                        console.log('ℹ️ API V2 not available, staying with V1');
                        this.apiVersion = 'v1';
                    }
                    
                    return this.apiVersion;
                } catch (error) {
                    console.error('❌ API version detection failed:', error);
                    this.apiVersion = 'v1'; // Safe fallback
                    return 'v1';
                }
            },

            // Get current API version info for debugging
            getVersionInfo() {
                return {
                    version: this.apiVersion,
                    baseUrl: this.baseUrl,
                    lastRequest: this.lastRequest,
                    endpointCache: this.endpointVersions,
                    cachedEndpoints: Object.keys(this.endpointVersions).length
                };
            },

            // Clear endpoint version cache (useful for testing)
            clearEndpointCache() {
                console.log('🗑️ Clearing API endpoint version cache...');
                this.endpointVersions = {};
            },

            // Get stats on API usage
            getApiStats() {
                const v1Count = Object.values(this.endpointVersions).filter(v => v === 'v1').length;
                const v2Count = Object.values(this.endpointVersions).filter(v => v === 'v2').length;
                
                return {
                    totalCachedEndpoints: Object.keys(this.endpointVersions).length,
                    v1Endpoints: v1Count,
                    v2Endpoints: v2Count,
                    defaultVersion: this.apiVersion
                };
            }
        };

        // === SETTINGS MODAL ===
        const SettingsManager = {
            createModal() {
                console.log('🔧 showSettingsModal called!');
                
                // Check if modal already exists and remove it
                const existingModal = document.querySelector('[id*="settings_modal"]');
                if (existingModal) {
                    console.log('🔧 Removing existing settings modal');
                    existingModal.remove();
                }
                    
                const modal = this.createCenteredModal('⚙️ Sidekick Settings', `
                    <div style="padding: 0;">
                        <!-- Tab Navigation -->
                        <div style="display: flex; border-bottom: 1px solid #444; background: #333;">
                            <button id="general-tab" class="settings-tab active" style="flex: 1; padding: 15px 20px; background: #2a2a2a; border: none; color: #fff; font-weight: bold; cursor: pointer; border-bottom: 3px solid #4CAF50; font-size: 14px;">
                                ⚙️ General
                            </button>
                            <button id="chain-timer-tab" class="settings-tab" style="flex: 1; padding: 15px 20px; background: #333; border: none; color: #aaa; font-weight: bold; cursor: pointer; border-bottom: 3px solid transparent; font-size: 14px;">
                                ⏱️ Chain Timer
                            </button>
                            <button id="shoplifting-tab" class="settings-tab" style="flex: 1; padding: 15px 20px; background: #333; border: none; color: #aaa; font-weight: bold; cursor: pointer; border-bottom: 3px solid transparent; font-size: 14px;">
                                🏪 Shoplifting Alert
                            </button>
                        </div>
                        
                        <!-- General Tab Content -->
                        <div id="general-content" class="tab-content" style="padding: 20px; display: block;">
                            <div style="margin-bottom: 20px;">
                                <label style="display: block; margin-bottom: 8px; color: #aaa; font-weight: bold; font-size: 14px;">Torn API Key:</label>
                                <input type="text" id="api-key-input" value="${loadState(STORAGE_KEYS.API_KEY, '')}" 
                                       placeholder="Enter your Torn API key here..."
                                       style="width: 100%; background: #333; border: 1px solid #555; color: #fff; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; box-sizing: border-box;">
                                <div style="font-size: 12px; color: #666; margin-top: 6px;">
                                    Get your API key from: <a href="https://www.torn.com/preferences.php#tab=api" target="_blank" style="color: #4CAF50; text-decoration: none;">Torn Preferences</a>
                                </div>
                            </div>
                            <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                                <button id="test-api-btn" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #2196F3, #1976D2); border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">
                                    🧪 Test API Connection
                                </button>
                                <button id="refresh-price-btn" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #4CAF50, #388E3C); border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">
                                    🔄 Refresh Points Price
                                </button>
                            </div>
                            
                            <h4 style="color: #aaa; margin: 20px 0 12px 0; font-size: 14px; font-weight: bold;">Module Settings</h4>
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #2a2a2a; border-radius: 6px; margin: 12px 0;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="color: #fff; font-weight: bold; font-size: 14px;">🚫 Training Blocker</span>
                                    <span style="color: #aaa; font-size: 12px;">Blocks training while stacking energy</span>
                                </div>
                                <label class="block-training-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                    <input type="checkbox" id="block-training-toggle" style="opacity: 0; width: 0; height: 0;">
                                    <span class="block-training-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.3s; border-radius: 24px;"></span>
                                </label>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #2a2a2a; border-radius: 6px; margin: 12px 0;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="color: #fff; font-weight: bold; font-size: 14px;">✈️ Travel Blocker</span>
                                    <span style="color: #aaa; font-size: 12px;">Prevents travel that conflicts with OC timing</span>
                                </div>
                                <label class="travel-blocker-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                    <input type="checkbox" id="travel-blocker-toggle" style="opacity: 0; width: 0; height: 0;">
                                    <span class="travel-blocker-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.3s; border-radius: 24px;"></span>
                                </label>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #2a2a2a; border-radius: 6px; margin: 12px 0;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="color: #fff; font-weight: bold; font-size: 14px;">🎯 Random Target</span>
                                    <span style="color: #aaa; font-size: 12px;">Gives a random target for chains</span>
                                </div>
                                <label class="random-target-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                    <input type="checkbox" id="random-target-toggle" style="opacity: 0; width: 0; height: 0;">
                                    <span class="random-target-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.3s; border-radius: 24px;"></span>
                                </label>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #2a2a2a; border-radius: 6px; margin: 12px 0;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="color: #fff; font-weight: bold; font-size: 14px;">🏋️ Auto Gym Optimizer</span>
                                    <span style="color: #aaa; font-size: 12px;">Automatically switches to best gym for each stat</span>
                                </div>
                                <label class="auto-gym-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                    <input type="checkbox" id="auto-gym-toggle" style="opacity: 0; width: 0; height: 0;">
                                    <span class="auto-gym-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.3s; border-radius: 24px;"></span>
                                </label>
                            </div>
                            
                            <div style="border-top: 1px solid #444; margin: 20px 0; padding-top: 20px;">
                                <h4 style="color: #aaa; margin: 0 0 12px 0; font-size: 14px; font-weight: bold;">Data Management</h4>
                                <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                                    <button id="export-data-btn" style="flex: 1; padding: 10px; background: #555; border: 1px solid #666; color: white; border-radius: 6px; cursor: pointer; font-size: 13px;">📤 Export Data</button>
                                    <button id="import-data-btn" style="flex: 1; padding: 10px; background: #555; border: 1px solid #666; color: white; border-radius: 6px; cursor: pointer; font-size: 13px;">📥 Import Data</button>
                                </div>
                                <button id="clear-all-data-btn" style="width: 100%; padding: 10px; background: #d32f2f; border: 1px solid #f44336; color: white; border-radius: 6px; cursor: pointer; font-size: 13px;">🗑️ Clear All Data</button>
                            </div>
                        </div>
                        
                        <!-- Chain Timer Tab Content -->
                        <div id="chain-timer-content" class="tab-content" style="padding: 20px; display: none;">
                            <!-- Content will be populated by Chain Timer module -->
                        </div>
                        
                        <!-- Shoplifting Tab Content -->
                        <div id="shoplifting-content" class="tab-content" style="padding: 20px; display: none;">
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #2a2a2a; border-radius: 6px; margin-bottom: 20px;">
                                <div style="display: flex; flex-direction: column;">
                                    <span style="color: #fff; font-weight: bold; font-size: 14px;">🚨 Security Alerts</span>
                                    <span style="color: #aaa; font-size: 12px;">Get notified when shop security goes down</span>
                                </div>
                                <label class="shoplifting-monitor-switch" style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                    <input type="checkbox" id="shoplifting-monitor-toggle" style="opacity: 0; width: 0; height: 0;">
                                    <span class="shoplifting-monitor-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.3s; border-radius: 24px;"></span>
                                </label>
                            </div>
                            
                            <div id="shoplifting-config" style="display: none;">
                                <div style="background: #333; border-radius: 6px; padding: 15px; margin: 12px 0;">
                                    <label style="display: block; margin-bottom: 8px; color: #aaa; font-weight: bold; font-size: 14px;">Shoplifting API Key:</label>
                                    <input type="text" id="shoplifting-api-key-input" value=""
                                           placeholder="Enter API key for shoplifting data..."
                                           style="width: 100%; background: #2a2a2a; border: 1px solid #555; color: #fff; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; box-sizing: border-box;">
                                    <div style="font-size: 12px; color: #666; margin-top: 6px;">
                                        <a href="https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=ShopliftingAPI&torn=shoplifting" target="_blank" style="color: #4CAF50; text-decoration: none;">🔗 Create Shoplifting API Key</a><br>
                                        <span style="color: #ff9800; font-size: 11px;">⚠️ Must enable "shoplifting" selection when creating the API key</span>
                                    </div>
                                    <button id="test-shoplifting-api-btn" style="width: 100%; margin-top: 10px; padding: 10px; background: linear-gradient(135deg, #2196F3, #1976D2); border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
                                        🧪 Test Shoplifting API
                                    </button>
                                </div>
                                <div style="background: #333; border-radius: 6px; padding: 15px; margin: 12px 0;">
                                    <h5 style="color: #aaa; margin: 0 0 12px 0; font-size: 13px; font-weight: bold;">📍 Shop Monitoring Settings</h5>
                                    <div style="font-size: 12px; color: #666; margin-bottom: 15px; padding: 10px; background: #2a2a2a; border-radius: 4px; border-left: 3px solid #4CAF50;">
                                        <strong>How to use:</strong><br>
                                        • Click shop name for "all security down" alerts<br>
                                        • Click individual security icons (📹 cameras, 👮 guards, 🔒 locks) for specific alerts
                                    </div>
                                    <div id="shop-alert-settings" style="display: grid; gap: 8px;">
                                        <!-- Shop settings will be dynamically generated -->
                                    </div>
                                </div>
                                <div style="background: #333; border-radius: 6px; padding: 15px; margin: 12px 0;">
                                    <h5 style="color: #aaa; margin: 0 0 12px 0; font-size: 13px; font-weight: bold;">🔔 Notification Settings</h5>
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0;">
                                        <span style="color: #ccc; font-size: 13px;">Play Sound</span>
                                        <label class="notification-sound-switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
                                            <input type="checkbox" id="notification-sound-toggle" style="opacity: 0; width: 0; height: 0;">
                                            <span class="notification-sound-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.3s; border-radius: 20px;"></span>
                                        </label>
                                    </div>
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0;">
                                        <span style="color: #ccc; font-size: 13px;">Auto-redirect to Crimes</span>
                                        <label class="auto-redirect-switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
                                            <input type="checkbox" id="auto-redirect-toggle" style="opacity: 0; width: 0; height: 0;">
                                            <span class="auto-redirect-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: 0.3s; border-radius: 20px;"></span>
                                        </label>
                                    </div>
                                    <div style="margin: 12px 0;">
                                        <label style="display: block; margin-bottom: 6px; color: #aaa; font-size: 12px;">Check Interval (minutes):</label>
                                        <input type="number" id="check-interval-input" min="1" max="10" value="1"
                                               style="width: 100%; background: #2a2a2a; border: 1px solid #555; color: #fff; padding: 8px; border-radius: 4px; font-size: 13px; box-sizing: border-box;">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `, 'settings_modal');
                
                // Inject CSS for travel blocker toggle
                this.injectTravelBlockerCSS();
                
                // Add tab switching functionality
                this.setupTabSwitching();
                
                // Add event listeners to buttons after modal is created
                setTimeout(() => {
                    const testBtn = document.getElementById('test-api-btn');
                    const refreshBtn = document.getElementById('refresh-price-btn');
                    const exportBtn = document.getElementById('export-data-btn');
                    const importBtn = document.getElementById('import-data-btn');
                    const clearBtn = document.getElementById('clear-all-data-btn');
                    
                    if (testBtn) testBtn.addEventListener('click', () => this.testApiConnection());
                    if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshPointsPrice());
                    if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());
                    if (importBtn) importBtn.addEventListener('click', () => this.importData());
                    if (clearBtn) clearBtn.addEventListener('click', () => this.clearAllData());

                    // Block Training toggle
                    const blockTrainingToggle = document.getElementById('block-training-toggle');
                    if (blockTrainingToggle) {
                        console.log('🎛️ Block Training toggle found in DOM');
                        
                        // Set initial state
                        if (window.SidekickModules?.BlockTraining) {
                            const currentState = window.SidekickModules.BlockTraining.isEnabled();
                            blockTrainingToggle.checked = currentState;
                            console.log('🎛️ Block Training initial state:', currentState);
                        } else {
                            console.warn('⚠️ BlockTraining module not available');
                        }
                        
                        blockTrainingToggle.addEventListener('change', () => {
                            console.log('🎛️ Block Training toggle clicked, new state:', blockTrainingToggle.checked);
                            if (window.SidekickModules?.BlockTraining?.toggleBlockTraining) {
                                window.SidekickModules.BlockTraining.toggleBlockTraining();
                                console.log('🎛️ Block Training toggled, isEnabled:', window.SidekickModules.BlockTraining.isEnabled());
                            } else {
                                console.error('❌ BlockTraining.toggleBlockTraining not available');
                            }
                        });
                    } else {
                        console.error('❌ Block Training toggle element not found in DOM');
                    }

                    // Travel Blocker toggle
                    const travelBlockerToggle = document.getElementById('travel-blocker-toggle');
                    if (travelBlockerToggle) {
                        // Set initial state
                        if (window.SidekickModules?.TravelBlocker) {
                            const status = window.SidekickModules.TravelBlocker.getStatus();
                            travelBlockerToggle.checked = status.enabled;
                        }
                        
                        travelBlockerToggle.addEventListener('change', () => {
                            if (window.SidekickModules?.TravelBlocker) {
                                const newState = window.SidekickModules.TravelBlocker.toggle();
                                console.log('🎛️ Travel Blocker toggled:', newState);
                            }
                        });
                    }

                    // Random Target toggle
                    const randomTargetToggle = document.getElementById('random-target-toggle');
                    console.log('🔍 Looking for Random Target toggle:', randomTargetToggle);
                    console.log('🔍 RandomTarget module available:', !!window.SidekickModules?.RandomTarget);
                    console.log('🔍 Available modules:', Object.keys(window.SidekickModules || {}));
                    
                    if (randomTargetToggle) {
                        // Set initial state - check both isActive and the saved state
                        if (window.SidekickModules?.RandomTarget) {
                            const savedState = window.SidekickModules.Core.loadState('random_target_active', false);
                            const moduleState = window.SidekickModules.RandomTarget.isActive;
                            
                            // Prioritize the actual module state over saved state
                            const shouldBeChecked = moduleState !== undefined ? moduleState : savedState;
                            randomTargetToggle.checked = shouldBeChecked;
                            
                            console.log('✅ Random Target toggle initialized:', {
                                savedState: savedState,
                                moduleState: moduleState,
                                finalState: shouldBeChecked
                            });
                            
                            // Force update the toggle appearance
                            if (shouldBeChecked) {
                                randomTargetToggle.style.accentColor = '#4CAF50';
                                randomTargetToggle.style.filter = 'brightness(1.2)';
                                // Update the custom slider appearance
                                const slider = randomTargetToggle.nextElementSibling;
                                if (slider && slider.classList.contains('random-target-slider')) {
                                    slider.style.backgroundColor = '#4CAF50';
                                    slider.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                                }
                            }
                        } else {
                            console.warn('⚠️ RandomTarget module not available for toggle initialization');
                        }
                        
                        randomTargetToggle.addEventListener('change', () => {
                            console.log('🎛️ Random Target toggle changed to:', randomTargetToggle.checked);
                            if (window.SidekickModules?.RandomTarget) {
                                window.SidekickModules.RandomTarget.activate();
                                console.log('🎛️ Random Target toggled:', randomTargetToggle.checked);
                            } else {
                                console.error('❌ RandomTarget module not available for activation');
                            }
                        });

                        // Set up a periodic check to keep toggle in sync with module state
                        setInterval(() => {
                            if (window.SidekickModules?.RandomTarget && randomTargetToggle) {
                                const currentState = window.SidekickModules.Core.loadState('random_target_active', false);
                                const moduleState = window.SidekickModules.RandomTarget.isActive;
                                
                                // Use the actual module state if available, otherwise fall back to saved state
                                const shouldBeChecked = moduleState !== undefined ? moduleState : currentState;
                                
                                if (randomTargetToggle.checked !== shouldBeChecked) {
                                    randomTargetToggle.checked = shouldBeChecked;
                                    console.log('🔄 Random Target toggle synced to:', shouldBeChecked, '(module state:', moduleState, ', saved state:', currentState, ')');
                                }
                                
                                // Update toggle appearance based on state
                                if (shouldBeChecked) {
                                    randomTargetToggle.style.accentColor = '#4CAF50';
                                    randomTargetToggle.style.filter = 'brightness(1.2)';
                                    // Update the custom slider appearance
                                    const slider = randomTargetToggle.nextElementSibling;
                                    if (slider && slider.classList.contains('random-target-slider')) {
                                        slider.style.backgroundColor = '#4CAF50';
                                        slider.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                                    }
                                } else {
                                    randomTargetToggle.style.accentColor = '';
                                    randomTargetToggle.style.filter = '';
                                    // Reset the custom slider appearance
                                    const slider = randomTargetToggle.nextElementSibling;
                                    if (slider && slider.classList.contains('random-target-slider')) {
                                        slider.style.backgroundColor = '#ccc';
                                        slider.style.boxShadow = 'none';
                                    }
                                }
                            }
                        }, 500); // Check every 500ms for better responsiveness
                    } else {
                        console.error('❌ Random Target toggle element not found in DOM');
                    }

                    // Auto Gym toggle
                    const autoGymToggle = document.getElementById('auto-gym-toggle');
                    console.log('🔍 Looking for Auto Gym toggle:', autoGymToggle);
                    console.log('🔍 AutoGym module available:', !!window.SidekickModules?.AutoGym);
                    
                    if (autoGymToggle) {
                        // Set initial state
                        if (window.SidekickModules?.AutoGym) {
                            const savedState = window.SidekickModules.Core.loadState('autoGymEnabled', false);
                            const moduleState = window.SidekickModules.AutoGym.enabled;
                            
                            const shouldBeChecked = moduleState !== undefined ? moduleState : savedState;
                            autoGymToggle.checked = shouldBeChecked;
                            
                            console.log('✅ Auto Gym toggle initialized:', {
                                savedState: savedState,
                                moduleState: moduleState,
                                finalState: shouldBeChecked
                            });
                            
                            // Update toggle appearance
                            if (shouldBeChecked) {
                                const slider = autoGymToggle.nextElementSibling;
                                if (slider && slider.classList.contains('auto-gym-slider')) {
                                    slider.style.backgroundColor = '#4CAF50';
                                    slider.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                                }
                            }
                        } else {
                            console.warn('⚠️ AutoGym module not available for toggle initialization');
                        }
                        
                        autoGymToggle.addEventListener('change', () => {
                            console.log('🏋️ Auto Gym toggle changed to:', autoGymToggle.checked);
                            if (window.SidekickModules?.AutoGym) {
                                const result = window.SidekickModules.AutoGym.toggle();
                                console.log('🏋️ Auto Gym toggled:', result);
                                
                                // Show notification
                                if (window.SidekickModules?.Core?.NotificationSystem) {
                                    window.SidekickModules.Core.NotificationSystem.show(
                                        'Auto Gym',
                                        result ? 'Auto gym optimization enabled' : 'Auto gym optimization disabled',
                                        result ? 'success' : 'info'
                                    );
                                }
                            } else {
                                console.error('❌ AutoGym module not available for activation');
                            }
                        });

                        // Initial state sync only - no interval
                        if (window.SidekickModules?.AutoGym && autoGymToggle) {
                            const module = window.SidekickModules.AutoGym;
                            autoGymToggle.checked = module.enabled;
                            console.log('🔄 Auto Gym initial sync:', module.enabled);
                        }
                    } else {
                        console.error('❌ Auto Gym toggle element not found in DOM');
                    }

                    // Add Block Training button after other buttons
                    const modal = document.querySelector('[id*="settings_modal"]');
                    if (modal) {
                        const blockBtn = document.createElement('button');
                        blockBtn.textContent = 'Block Training';
                        blockBtn.className = 'sidekick-btn';
                        blockBtn.style.display = 'block';
                        blockBtn.style.width = '100%';
                        blockBtn.style.margin = '12px 0';
                        blockBtn.style.padding = '12px';
                        blockBtn.style.background = 'linear-gradient(135deg, #FF9800, #F44336)';
                        blockBtn.style.color = 'white';
                        blockBtn.style.border = 'none';
                        blockBtn.style.borderRadius = '6px';
                        blockBtn.style.fontWeight = 'bold';
                        blockBtn.style.fontSize = '14px';
                        blockBtn.style.cursor = 'pointer';
                        blockBtn.onclick = function() {
                            if (window.SidekickModules?.BlockTraining?.blockTraining) {
                                window.SidekickModules.BlockTraining.blockTraining();
                            }
                        };
                        modal.appendChild(blockBtn);
                    }
                    
                    // Initialize shoplifting monitor
                    this.initShopliftingMonitor();

                }, 100);
                
                console.log('✅ Settings modal created successfully!');
            },

            createCenteredModal(title, content, key) {
                // Create overlay
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: rgba(0, 0, 0, 0.7) !important;
                    z-index: 99999999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                `;
                
                // Create modal
                const modal = document.createElement('div');
                modal.style.cssText = `
                    background: linear-gradient(145deg, #2a2a2a, #1f1f1f) !important;
                    border: 1px solid #444 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
                    color: #fff !important;
                    font-family: 'Segoe UI', sans-serif !important;
                    min-width: 400px !important;
                    max-width: 600px !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                `;
                
                // Modal header
                const header = document.createElement('div');
                header.style.cssText = `
                    background: linear-gradient(135deg, #333, #444) !important;
                    padding: 16px 20px !important;
                    border-radius: 12px 12px 0 0 !important;
                    border-bottom: 1px solid #555 !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    font-weight: 600 !important;
                    font-size: 16px !important;
                `;
                
                header.innerHTML = `
                    <span>${title}</span>
                    <button style="background: none; border: none; color: #bbb; font-size: 20px; cursor: pointer; padding: 0; line-height: 1; transition: color 0.3s ease;" onmouseover="this.style.color='#ff4444'" onmouseout="this.style.color='#bbb'">×</button>
                `;
                
                // Modal content
                const contentDiv = document.createElement('div');
                contentDiv.innerHTML = content;
                
                modal.appendChild(header);
                modal.appendChild(contentDiv);
                overlay.appendChild(modal);
                
                // Close button functionality
                const closeBtn = header.querySelector('button');
                closeBtn.addEventListener('click', () => {
                    overlay.remove();
                });
                
                // Close on overlay click
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        overlay.remove();
                    }
                });
                
                document.body.appendChild(overlay);
                
                return overlay;
            },

            async testApiConnection() {
                console.log('🧪 testApiConnection called!');
                const input = document.getElementById('api-key-input');
                if (!input || !input.value.trim()) {
                    NotificationSystem.show('Error', 'Please enter an API key first', 'error');
                    return;
                }
                const apiKey = input.value.trim();
                // Save the API key first
                saveState(STORAGE_KEYS.API_KEY, apiKey);
                try {
                    NotificationSystem.show('Testing', 'Testing API connection...', 'info');
                    // FIX: Use correct endpoint format for Torn API
                    const response = await ApiSystem.makeRequest('user/me', 'basic');
                    if (response && response.name) {
                        NotificationSystem.show('Success', `Connected as ${response.name} [${response.player_id}]`, 'info');
                        console.log('✅ API test successful:', response);
                    } else {
                        NotificationSystem.show('Error', 'Invalid API response format', 'error');
                    }
                } catch (error) {
                    console.error('❌ API test failed:', error);
                    NotificationSystem.show('Error', `API test failed: ${error.message}`, 'error');
                }
            },

            async refreshPointsPrice() {
                console.log('🔄 refreshPointsPrice called!');
                
                const apiKey = loadState(STORAGE_KEYS.API_KEY, '');
                if (!apiKey) {
                    NotificationSystem.show('Error', 'Please set your API key first', 'error');
                    return;
                }
                
                try {
                    NotificationSystem.show('Refreshing', 'Fetching latest points price...', 'info');
                    
                    const response = await ApiSystem.makeRequest('market?selections=pointsmarket');
                    
                    if (response && response.pointsmarket && response.pointsmarket.length > 0) {
                        const price = response.pointsmarket[0].cost;
                        saveState('points_price', price);
                        NotificationSystem.show('Success', `Points price updated: $${price.toLocaleString()}`, 'info');
                        
                        // Update display if points monitor is active
                        if (window.TopBarPointsMonitor) {
                            window.TopBarPointsMonitor.currentPrice = price;
                            window.TopBarPointsMonitor.updateDisplay();
                        }
                    } else {
                        NotificationSystem.show('Warning', 'No points market data available', 'warning');
                    }
                } catch (error) {
                    console.error('❌ Points price refresh failed:', error);
                    NotificationSystem.show('Error', `Failed to refresh price: ${error.message}`, 'error');
                }
            },

            exportData() {
                const ShopliftingModule = window.SidekickModules?.Shoplifting;
                const shopliftingSettings = ShopliftingModule ? ShopliftingModule.getSettings() : {};
                
                const data = {
                    settings: {
                        apiKey: loadState(STORAGE_KEYS.API_KEY, ''),
                        blockTraining: loadState('blockTraining', false),
                        travelBlocker: loadState('travelBlocker', false),
                        randomTarget: loadState('randomTarget', false),
                        shoplifting: shopliftingSettings
                    },
                    todoList: loadState('sidekick_todos', []),
                    timerData: loadState('timers', []),
                    linkGroupData: loadState('linkGroups', [])
                };
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sidekick-data-' + new Date().toISOString().split('T')[0] + '.json';
                a.click();
                URL.revokeObjectURL(url);
                
                NotificationSystem.show('Success', 'Data exported successfully!', 'info');
            },
            
            // Shoplifting Monitor UI Interface Functions
            initShopliftingMonitor() {
                const toggle = document.getElementById('shoplifting-monitor-toggle');
                const config = document.getElementById('shoplifting-config');
                const apiKeyInput = document.getElementById('shoplifting-api-key-input');
                const testBtn = document.getElementById('test-shoplifting-api-btn');
                const soundToggle = document.getElementById('notification-sound-toggle');
                const redirectToggle = document.getElementById('auto-redirect-toggle');
                const intervalInput = document.getElementById('check-interval-input');
                
                if (!toggle) return;
                
                // Wait for Shoplifting module to be available
                if (!window.SidekickModules?.Shoplifting) {
                    setTimeout(() => this.initShopliftingMonitor(), 100);
                    return;
                }
                
                const ShopliftingModule = window.SidekickModules.Shoplifting;
                const settings = ShopliftingModule.getSettings();
                
                // Load current settings from shoplifting module
                toggle.checked = settings.enabled;
                if (config) config.style.display = settings.enabled ? 'block' : 'none';
                if (apiKeyInput) apiKeyInput.value = settings.apiKey;
                if (soundToggle) soundToggle.checked = settings.soundEnabled;
                if (redirectToggle) redirectToggle.checked = settings.autoRedirect;
                if (intervalInput) intervalInput.value = settings.checkInterval;
                
                // Update slider appearance
                this.updateShopliftingSlider(toggle, settings.enabled);
                this.updateShopliftingSlider(soundToggle, settings.soundEnabled);
                this.updateShopliftingSlider(redirectToggle, settings.autoRedirect);
                
                // Generate shop alert settings
                this.generateShopAlertSettings();
                
                // Event listeners
                if (toggle) {
                    toggle.addEventListener('change', (e) => {
                        const isEnabled = e.target.checked;
                        ShopliftingModule.setEnabled(isEnabled);
                        if (config) config.style.display = isEnabled ? 'block' : 'none';
                        this.updateShopliftingSlider(toggle, isEnabled);
                    });
                }
                
                if (apiKeyInput) {
                    apiKeyInput.addEventListener('change', (e) => {
                        ShopliftingModule.setApiKey(e.target.value.trim());
                    });
                }
                
                if (testBtn) {
                    testBtn.addEventListener('click', () => this.testShopliftingApi());
                }
                
                if (soundToggle) {
                    soundToggle.addEventListener('change', (e) => {
                        const currentSettings = ShopliftingModule.getSettings();
                        ShopliftingModule.updateSettings({
                            ...currentSettings,
                            soundEnabled: e.target.checked
                        });
                        this.updateShopliftingSlider(soundToggle, e.target.checked);
                    });
                }
                
                if (redirectToggle) {
                    redirectToggle.addEventListener('change', (e) => {
                        const currentSettings = ShopliftingModule.getSettings();
                        ShopliftingModule.updateSettings({
                            ...currentSettings,
                            autoRedirect: e.target.checked
                        });
                        this.updateShopliftingSlider(redirectToggle, e.target.checked);
                    });
                }
                
                if (intervalInput) {
                    intervalInput.addEventListener('change', (e) => {
                        const value = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                        e.target.value = value;
                        const currentSettings = ShopliftingModule.getSettings();
                        ShopliftingModule.updateSettings({
                            ...currentSettings,
                            checkInterval: value
                        });
                    });
                }
            },
            
            updateShopliftingSlider(toggle, isChecked) {
                if (!toggle) return;
                const slider = toggle.nextElementSibling;
                if (slider) {
                    slider.style.backgroundColor = isChecked ? '#4CAF50' : '#ccc';
                    slider.style.boxShadow = isChecked ? '0 0 10px rgba(76, 175, 80, 0.5)' : 'none';
                }
            },
            
            generateShopAlertSettings() {
                const container = document.getElementById('shop-alert-settings');
                if (!container || !window.SidekickModules?.Shoplifting) return;
                
                const ShopliftingModule = window.SidekickModules.Shoplifting;
                const shops = ShopliftingModule.getShopList();
                const savedAlerts = ShopliftingModule.getShopAlerts();
                const securityIcons = ShopliftingModule.getSecurityIcons();
                
                container.innerHTML = shops.map(shop => {
                    const shopAlerts = savedAlerts[shop.id] || {};
                    
                    return `
                        <div style="background: #2a2a2a; border-radius: 8px; padding: 12px; margin: 8px 0;">
                            <!-- Shop Name (clickable for all alerts) -->
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                <span class="shop-name-btn" data-shop="${shop.id}" 
                                      style="color: #fff; font-weight: bold; font-size: 13px; cursor: pointer; padding: 4px 8px; border-radius: 4px; background: ${shopAlerts.all ? '#4CAF50' : '#555'}; transition: all 0.3s;">
                                    ${shop.name}
                                </span>
                                <small style="color: #888; font-size: 11px;">${shop.district}</small>
                            </div>
                            
                            <!-- Individual Security Controls -->
                            <div style="display: flex; gap: 8px; justify-content: center;">
                                ${shop.securities.map(security => `
                                    <div class="security-btn" data-shop="${shop.id}" data-security="${security}"
                                         style="display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 6px; border-radius: 4px; background: ${shopAlerts[security] ? '#4CAF50' : '#555'}; transition: all 0.3s; min-width: 40px;">
                                        <span style="font-size: 16px;">${securityIcons[security]}</span>
                                        <span style="font-size: 9px; color: #ccc; text-transform: capitalize;">${security}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('');
                
                // Add event listeners for shop name buttons (all security)
                container.querySelectorAll('.shop-name-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const shopId = e.target.getAttribute('data-shop');
                        const currentState = savedAlerts[shopId]?.all || false;
                        const newState = !currentState;
                        
                        ShopliftingModule.setShopAlert(shopId, 'all', newState);
                        
                        // Update visual state
                        e.target.style.background = newState ? '#4CAF50' : '#555';
                        
                        // Update the saved alerts reference
                        this.generateShopAlertSettings(); // Refresh the display
                    });
                });
                
                // Add event listeners for individual security buttons
                container.querySelectorAll('.security-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const shopId = e.currentTarget.getAttribute('data-shop');
                        const security = e.currentTarget.getAttribute('data-security');
                        const currentState = savedAlerts[shopId]?.[security] || false;
                        const newState = !currentState;
                        
                        ShopliftingModule.setShopAlert(shopId, security, newState);
                        
                        // Update visual state
                        e.currentTarget.style.background = newState ? '#4CAF50' : '#555';
                    });
                });
            },
            
            async testShopliftingApi() {
                if (!window.SidekickModules?.Shoplifting) {
                    NotificationSystem.show('Error', 'Shoplifting module not loaded', 'error');
                    return;
                }
                
                try {
                    const result = await window.SidekickModules.Shoplifting.testApiConnection();
                    if (result.warning) {
                        NotificationSystem.show('Success', result.message, 'warning');
                    } else {
                        NotificationSystem.show('Success', result.message, 'info');
                    }
                } catch (error) {
                    NotificationSystem.show('Error', error.message, 'error');
                }
            },

            importData() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const data = JSON.parse(e.target.result);
                                
                                if (data.pages) {
                                    saveState(STORAGE_KEYS.SIDEBAR_PAGES, data.pages);
                                }
                                
                                if (data.settings) {
                                    if (data.settings.apiKey) {
                                        saveState(STORAGE_KEYS.API_KEY, data.settings.apiKey);
                                    }
                                    if (data.settings.sidebarState) {
                                        saveState(STORAGE_KEYS.SIDEBAR_STATE, data.settings.sidebarState);
                                    }
                                }
                                
                                NotificationSystem.show('Imported', 'Data imported successfully. Refresh to see changes.', 'info');
                            } catch (error) {
                                NotificationSystem.show('Error', 'Invalid backup file format', 'error');
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            },

            clearAllPanels() {
                // Remove all sidekick panels from the current view
                const panelSelectors = [
                    '.sidekick-notepad',
                    '.sidekick-linkgroup', 
                    '.sidekick-todo',
                    '.sidekick-attack-list',
                    '.sidekick-panel'
                ];
                
                panelSelectors.forEach(selector => {
                    const panels = document.querySelectorAll(selector);
                    panels.forEach(panel => panel.remove());
                });
                
                // Clear content area
                const contentArea = document.getElementById('sidekick-content');
                if (contentArea) {
                    const children = contentArea.children;
                    // Keep the basic structure but remove all panels
                    Array.from(children).forEach(child => {
                        if (child.classList.contains('sidekick-notepad') || 
                            child.classList.contains('sidekick-linkgroup') ||
                            child.classList.contains('sidekick-todo') ||
                            child.classList.contains('sidekick-attack-list')) {
                            child.remove();
                        }
                    });
                }
                
                console.log('🗑️ Cleared all panels from view');
            },

            clearAllStorage() {
                // Get all localStorage keys that start with 'sidekick'
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.toLowerCase().includes('sidekick')) {
                        keysToRemove.push(key);
                    }
                }
                
                // Remove all sidekick-related keys
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                    console.log('🗑️ Removed localStorage key:', key);
                });
                
                // Also remove other common keys
                const commonKeys = [
                    'travel_blocker_enabled',
                    'oc_travel_block_enabled',
                    'sidekick_api_key',
                    'sidebar_pages',
                    'current_page',
                    'linkgroups',
                    'notepads',
                    'attack_lists'
                ];
                
                commonKeys.forEach(key => {
                    if (localStorage.getItem(key)) {
                        localStorage.removeItem(key);
                        console.log('🗑️ Removed common key:', key);
                    }
                });
                
                console.log('🗑️ Cleared all localStorage data');
            },

            injectTravelBlockerCSS() {
                if (document.getElementById('travel-blocker-toggle-css')) return;
                
                const style = document.createElement('style');
                style.id = 'travel-blocker-toggle-css';
                style.textContent = `
                    /* Tab styling */
                    .settings-tab {
                        transition: all 0.3s ease !important;
                    }
                    .settings-tab:hover {
                        background: #2a2a2a !important;
                        color: #fff !important;
                    }
                    
                    /* All slider backgrounds */
                    .travel-blocker-slider, .block-training-slider, .random-target-slider, .chain-timer-slider, .auto-gym-slider,
                    .shoplifting-monitor-slider, .notification-sound-slider, .auto-redirect-slider {
                        position: absolute !important;
                        cursor: pointer !important;
                        top: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        bottom: 0 !important;
                        background-color: #ccc !important;
                        transition: 0.3s !important;
                        border-radius: 24px !important;
                    }

                    /* White dots on all sliders */
                    .travel-blocker-slider:before, .block-training-slider:before, .random-target-slider:before, .chain-timer-slider:before, .auto-gym-slider:before,
                    .shoplifting-monitor-slider:before, .notification-sound-slider:before, .auto-redirect-slider:before {
                        position: absolute !important;
                        content: "" !important;
                        height: 18px !important;
                        width: 18px !important;
                        left: 3px !important;
                        bottom: 3px !important;
                        background-color: white !important;
                        transition: 0.3s !important;
                        border-radius: 50% !important;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
                    }

                    /* Smaller toggles for notification settings */
                    .notification-sound-slider:before, .auto-redirect-slider:before {
                        height: 14px !important;
                        width: 14px !important;
                        left: 3px !important;
                        bottom: 3px !important;
                    }

                    /* Green background when checked */
                    #travel-blocker-toggle:checked + .travel-blocker-slider,
                    #block-training-toggle:checked + .block-training-slider,
                    #random-target-toggle:checked + .random-target-slider,
                    #chain-timer-toggle:checked + .chain-timer-slider,
                    #auto-gym-toggle:checked + .auto-gym-slider,
                    #shoplifting-monitor-toggle:checked + .shoplifting-monitor-slider,
                    #notification-sound-toggle:checked + .notification-sound-slider,
                    #auto-redirect-toggle:checked + .auto-redirect-slider {
                        background-color: #4CAF50 !important;
                    }

                    /* Move white dot when checked */
                    #travel-blocker-toggle:checked + .travel-blocker-slider:before,
                    #block-training-toggle:checked + .block-training-slider:before,
                    #random-target-toggle:checked + .random-target-slider:before,
                    #chain-timer-toggle:checked + .chain-timer-slider:before,
                    #auto-gym-toggle:checked + .auto-gym-slider:before,
                    #shoplifting-monitor-toggle:checked + .shoplifting-monitor-slider:before {
                        transform: translateX(26px) !important;
                    }

                    /* Smaller movement for smaller toggles */
                    #notification-sound-toggle:checked + .notification-sound-slider:before,
                    #auto-redirect-toggle:checked + .auto-redirect-slider:before {
                        transform: translateX(20px) !important;
                    }

                    /* Hover effects */
                    .travel-blocker-slider:hover, .block-training-slider:hover, .random-target-slider:hover, .chain-timer-slider:hover, .auto-gym-slider:hover,
                    .shoplifting-monitor-slider:hover, .notification-sound-slider:hover, .auto-redirect-slider:hover {
                        box-shadow: 0 0 1px rgba(255,255,255,0.5) !important;
                    }
                `;
                document.head.appendChild(style);
            },

            setupTabSwitching() {
                // Tab switching functionality
                const generalTab = document.getElementById('general-tab');
                const chainTimerTab = document.getElementById('chain-timer-tab');
                const shopliftingTab = document.getElementById('shoplifting-tab');
                const generalContent = document.getElementById('general-content');
                const chainTimerContent = document.getElementById('chain-timer-content');
                const shopliftingContent = document.getElementById('shoplifting-content');

                // Populate Chain Timer content from module
                if (chainTimerContent && window.SidekickModules?.ChainTimer?.createSettingsContent) {
                    const content = window.SidekickModules.ChainTimer.createSettingsContent();
                    chainTimerContent.appendChild(content);
                }

                const tabs = [
                    { button: generalTab, content: generalContent },
                    { button: chainTimerTab, content: chainTimerContent },
                    { button: shopliftingTab, content: shopliftingContent }
                ];

                tabs.forEach(({ button, content }) => {
                    if (button && content) {
                        button.addEventListener('click', () => {
                            // Deactivate all tabs
                            tabs.forEach(({ button: btn, content: cnt }) => {
                                if (btn) {
                                    btn.style.background = '#333';
                                    btn.style.color = '#aaa';
                                    btn.style.borderBottom = '3px solid transparent';
                                }
                                if (cnt) {
                                    cnt.style.display = 'none';
                                }
                            });

                            // Activate clicked tab
                            button.style.background = '#2a2a2a';
                            button.style.color = '#fff';
                            button.style.borderBottom = '3px solid #4CAF50';
                            content.style.display = 'block';
                        });
                    }
                });
            },

            clearAllData() {
                if (confirm('⚠️ WARNING: This will clear ALL Sidekick data including:\n\n• All panels and content\n• All saved pages\n• API settings\n• All stored preferences\n\nThis cannot be undone! Are you sure?')) {
                    try {
                        // Clear all panels from the current view
                        this.clearAllPanels();
                        
                        // Clear all localStorage data
                        this.clearAllStorage();
                        
                        // Reset core module state
                        if (window.SidekickModules?.Core?.clearAllData) {
                            window.SidekickModules.Core.clearAllData();
                        }
                        
                        // Close settings modal and show success message
                        const modal = document.querySelector('[id*="settings_modal"]');
                        if (modal) modal.remove();
                        
                        // Show success notification
                        NotificationSystem.show('Success', 'All Sidekick data cleared!', 'success');
                        
                        // Suggest page reload
                        setTimeout(() => {
                            if (confirm('Data cleared! Reload the page to reset completely?')) {
                                window.location.reload();
                            }
                        }, 1000);
                        
                    } catch (error) {
                        console.error('❌ Error clearing data:', error);
                        NotificationSystem.show('Error', 'Failed to clear all data', 'error');
                    }
                }
            }
        };

        // Enhanced saveApiKey with API version detection
        window.saveApiKey = function() {
            console.log('💾 saveApiKey called!');
            const input = document.getElementById('api-key-input');
            if (input && input.value.trim()) {
                const newApiKey = input.value.trim();
                saveState(STORAGE_KEYS.API_KEY, newApiKey);
                
                // Detect API version after saving key
                setTimeout(async () => {
                    try {
                        const detectedVersion = await ApiSystem.detectApiVersion();
                        console.log(`🔍 API Version detected: ${detectedVersion.toUpperCase()}`);
                    } catch (error) {
                        console.warn('⚠️ API version detection failed:', error);
                    }
                }, 1000);
                
                // Notify clock module of API key change
                if (window.SidekickModules?.Clock?.updateApiKey) {
                    window.SidekickModules.Clock.updateApiKey(newApiKey);
                }
                
                NotificationSystem.show('Saved', 'API key saved successfully! Detecting optimal API version...', 'info');
                console.log('✅ API key saved');
                
                // Close modal
                const modal = input.closest('[style*="position: fixed"]');
                if (modal) modal.remove();
            } else {
                NotificationSystem.show('Error', 'Please enter a valid API key', 'error');
            }
        };

        // Initialize API version detection if API key is already configured
        setTimeout(async () => {
            const existingApiKey = loadState(STORAGE_KEYS.API_KEY, '');
            if (existingApiKey) {
                try {
                    const detectedVersion = await ApiSystem.detectApiVersion();
                    console.log(`🔍 API Version auto-detected on startup: ${detectedVersion.toUpperCase()}`);
                } catch (error) {
                    console.warn('⚠️ Startup API version detection failed:', error);
                }
            }
        }, 2000); // Delay to ensure modules are loaded

        // Export to global scope
        window.SidekickModules.Settings = SettingsManager;
        window.SidekickModules.Api = ApiSystem;

        console.log('✅ Settings module loaded');
    });

})();
