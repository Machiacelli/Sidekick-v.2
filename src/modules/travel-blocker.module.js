// ==UserScript==
// @name         Sidekick Travel Blocker Module (Simplified)
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  Simplified Travel blocker with minimal UI - just timer and status light
// @author       Machiacelli
// @match        https://www.torn.com/*
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
        const TravelBlockerModule = {
            name: 'TravelBlocker',
            isEnabled: true,
            isActive: false,
            DEBUG: false, // Toggle to true for detailed logs

            init() {
                console.log('✈️ Initializing Travel Blocker Module v1.2.0 (Simplified UI)...');
                this.core = window.SidekickModules.Core;
                if (!this.core) {
                    console.error('❌ Core module not available for Travel Blocker');
                    return;
                }

                // Reset logging flags for new page
                this.resetLoggingFlags();

                // Load saved state
                this.loadSettings();
                
                // Only activate if we're on the travel page
                if (this.isOnTravelPage()) {
                    this.activate();
                }

                console.log('✅ Travel Blocker module initialized (Simplified)');
            },

            loadSettings() {
                // Load the enabled state from core storage
                this.isEnabled = this.core.loadState('travel_blocker_enabled', true);
                if (this.DEBUG) console.log('📁 Travel Blocker settings loaded:', { enabled: this.isEnabled });
            },

            saveSettings() {
                // Save the enabled state to core storage
                this.core.saveState('travel_blocker_enabled', this.isEnabled);
                if (this.DEBUG) console.log('💾 Travel Blocker settings saved:', { enabled: this.isEnabled });
            },

            isOnTravelPage() {
                // Only show on the exact travel page
                const urlCheck = window.location.href.includes('/page.php?sid=travel');
                
                // Log the detection result (only once)
                if (!this._hasLoggedPageDetection) {
                    console.log('🔍 [DEBUG] Travel page detection:', {
                        urlCheck,
                        url: window.location.href,
                        title: document.title
                    });
                    this._hasLoggedPageDetection = true;
                }
                
                // Only return true for the exact travel page
                return urlCheck;
            },

            activate() {
                if (this.isActive) return;
                this.isActive = true;

                console.log('🚀 Travel Blocker activated on travel page');
                this.injectStyles();
                
                // Only inject UI if module is enabled
                if (this.isEnabled) {
                    this.injectToggle();
                } else {
                    console.log('🚫 Travel Blocker UI not injected - module disabled');
                }
                
                this.setupClickInterceptor();

                // Monitor for page changes
                this.setupPageMonitor();
            },

            deactivate() {
                if (!this.isActive) return;
                this.isActive = false;
                
                // Clear the countdown timer
                if (this.ocTimerInterval) {
                    clearInterval(this.ocTimerInterval);
                    this.ocTimerInterval = null;
                }
                
                // Remove injected elements
                const container = document.getElementById('oc-toggle-container');
                if (container) container.remove();

                // Reset logging flags for next page
                this.resetLoggingFlags();

                console.log('⏹️ Travel Blocker deactivated');
            },

            resetLoggingFlags() {
                this._hasLoggedTravelRoot = false;
                this._hasLoggedDataModel = false;
                this._hasLoggedNoDataModel = false;
                this._hasLoggedParsed = false;
                this._hasLoggedPageDetection = false;
            },

            toggle() {
                this.isEnabled = !this.isEnabled;
                this.saveSettings();
                
                const message = this.isEnabled ? 'Travel Blocker enabled' : 'Travel Blocker disabled';
                this.core.NotificationSystem.show('Updated', message, 'info');

                // Handle UI visibility based on enabled state
                if (this.isOnTravelPage()) {
                    if (this.isEnabled) {
                        // Re-inject the UI if not present
                        if (!document.querySelector('#oc-toggle-container')) {
                            this.injectToggle();
                        }
                    } else {
                        // Remove the UI immediately when disabled
                        this.removeToggle();
                        console.log('🗑️ Travel Blocker UI removed - module disabled');
                    }
                }

                return this.isEnabled;
            },

            removeToggle() {
                const container = document.querySelector('#oc-toggle-container');
                if (container) {
                    container.remove();
                    if (this.DEBUG) console.log('🗑️ Travel Blocker UI removed');
                }
                
                // Clear the countdown timer when removing UI
                if (this.ocTimerInterval) {
                    clearInterval(this.ocTimerInterval);
                    this.ocTimerInterval = null;
                    if (this.DEBUG) console.log('⏹️ OC countdown timer cleared');
                }
            },

            injectStyles() {
                const style = document.createElement('style');
                style.textContent = `
                    /* Travel Blocker Styles */

                    /* Disable clouds on travel page */
                    .clouds___1qX8K,
                    .clouds___2qX8K,
                    .clouds___3qX8K,
                    [class*="clouds"],
                    .cloud-animation,
                    .travel-clouds {
                        display: none !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                    }

                    /* Hide any cloud-related elements */
                    [class*="cloud"],
                    [class*="Cloud"] {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);
            },

            // SIMPLIFIED UI: Just timer and status light
            injectToggle() {
                const wrapper = document.querySelector('div.content-wrapper.summer');
                if (!wrapper || wrapper.querySelector('#oc-toggle-container')) return;

                // Skip injection if module is disabled
                if (!this.isEnabled) {
                    if (this.DEBUG) console.log('🚫 Travel Blocker UI injection skipped - module disabled');
                    return;
                }
                
                const container = document.createElement('div');
                container.id = 'oc-toggle-container';
                container.innerHTML = `
                    <div style="
                        background: rgba(42, 42, 42, 0.95);
                        border: 1px solid rgba(68, 68, 68, 0.7);
                        border-radius: 8px;
                        padding: 12px 16px;
                        margin: 16px 0;
                        color: #fff;
                        font-family: 'Segoe UI', 'Inter', sans-serif;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                        max-width: 250px;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    ">
                        <!-- Status Indicator (Green Light) -->
                        <div style="
                            width: 10px;
                            height: 10px;
                            border-radius: 50%;
                            background-color: #4CAF50;
                            box-shadow: 0 0 8px rgba(76, 175, 80, 0.8);
                            animation: pulse 2s infinite;
                            flex-shrink: 0;
                        " title="Travel Blocker Active"></div>
                        
                        <!-- Timer Display -->
                        <div style="flex: 1;">
                            <div style="font-size: 11px; color: #888; margin-bottom: 2px;">Next OC:</div>
                            <div id="oc-timer-display" style="
                                font-size: 16px; 
                                color: #fff; 
                                font-weight: 600; 
                                font-family: 'Courier New', monospace;
                                letter-spacing: 0.5px;
                            ">--:--:--</div>
                        </div>
                    </div>

                    <style>
                        @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.6; }
                        }
                    </style>
                `;

                wrapper.prepend(container);
                
                // Start the countdown timer
                this.startOCCountdown();
            },

            setupPageMonitor() {
                // Monitor for DOM changes to re-inject toggle if needed
                const observer = new MutationObserver(() => {
                    if (this.isOnTravelPage() && this.isEnabled && !document.getElementById('oc-toggle-container')) {
                        this.injectToggle();
                    } else if (this.isOnTravelPage() && !this.isEnabled && document.getElementById('oc-toggle-container')) {
                        // Remove UI if module was disabled
                        this.removeToggle();
                    }
                });
                
                observer.observe(document.body, { childList: true, subtree: true });
            },

            // Get OC data from page and update timer - FIXED VERSION
            getOCDataFromPage() {
                try {
                    // Method 1: Try to get from Torn's global user data (most reliable)
                    if (window.user && window.user.criminalrecord) {
                        const ocData = window.user.criminalrecord;
                        
                        // Check if user is currently in cooldown
                        if (ocData.time_ready) {
                            const timeRemaining = ocData.time_ready - Math.floor(Date.now() / 1000);
                            if (timeRemaining > 0) {
                                return this.formatOCTime(timeRemaining);
                            } else {
                                return { timeText: 'Ready!', statusText: 'OC available now' };
                            }
                        }
                        
                        // Alternative structure check
                        if (ocData.time_left && ocData.time_left > 0) {
                            return this.formatOCTime(ocData.time_left);
                        }
                        
                        // If no cooldown, OC is ready
                        return { timeText: 'Ready!', statusText: 'OC available now' };
                    }

                    // Method 2: Try to get from travel page data model (if available)
                    const travelRoot = document.querySelector('#travel-root');
                    if (travelRoot) {
                        const dataModel = travelRoot.getAttribute('data-model');
                        if (dataModel) {
                            const data = JSON.parse(dataModel.replace(/&quot;/g, '"'));
                            
                            // Check if user has OC data in travel model
                            if (data.user && data.user.criminalrecord) {
                                const ocData = data.user.criminalrecord;
                                if (ocData.time_ready) {
                                    const timeRemaining = ocData.time_ready - Math.floor(Date.now() / 1000);
                                    if (timeRemaining > 0) {
                                        return this.formatOCTime(timeRemaining);
                                    } else {
                                        return { timeText: 'Ready!', statusText: 'OC available now' };
                                    }
                                }
                                if (ocData.time_left && ocData.time_left > 0) {
                                    return this.formatOCTime(ocData.time_left);
                                }
                            }
                        }
                    }

                    // Method 3: Try to extract from page elements (comprehensive search)
                    const timerSelectors = [
                        '[class*="crime"]',
                        '[class*="organized"]',
                        '[id*="crime"]',
                        '[data-testid*="crime"]',
                        '.cooldown',
                        '.timer',
                        'span[title*="crime"]',
                        'div[title*="crime"]'
                    ];
                    
                    for (const selector of timerSelectors) {
                        const elements = document.querySelectorAll(selector);
                        for (const element of elements) {
                            const text = element.textContent;
                            if (text && text.includes(':')) {
                                // Try to extract time pattern HH:MM:SS
                                const timeMatch = text.match(/(\d{1,2}):(\d{2}):(\d{2})/);
                                if (timeMatch) {
                                    return { 
                                        timeText: `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}:${timeMatch[3]}`, 
                                        statusText: 'OC countdown from page' 
                                    };
                                }
                            }
                        }
                    }

                    // Method 4: Make a direct API call if we have an API key
                    if (this.core && this.core.loadState('sidekick_api_key', '')) {
                        this.fetchOCFromAPI().then(result => {
                            if (result && result.timeText !== '--:--:--') {
                                // Update the timer with API data
                                this.updateTimerDisplay(result.timeText);
                            }
                        }).catch(err => {
                            if (this.DEBUG) console.log('API call failed:', err);
                        });
                    }
                    
                    return { timeText: '--:--:--', statusText: 'No OC data found' };
                } catch (error) {
                    if (this.DEBUG) console.error('Error getting OC data from page:', error);
                    return { timeText: '--:--:--', statusText: 'Error loading OC data' };
                }
            },

            // Format OC time remaining into HH:MM:SS
            formatOCTime(seconds) {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = Math.floor(seconds % 60);
                return { 
                    timeText: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
                    statusText: 'Time until next OC'
                };
            },

            // Fetch OC data from Torn API (async)
            async fetchOCFromAPI() {
                try {
                    const apiKey = this.core.loadState('sidekick_api_key', '');
                    if (!apiKey) return null;

                    const response = await fetch(`https://api.torn.com/user/?selections=criminalrecord&key=${apiKey}`);
                    const data = await response.json();
                    
                    if (data.criminalrecord && data.criminalrecord.organized_crime) {
                        const ocData = data.criminalrecord.organized_crime;
                        if (ocData.time_ready) {
                            const timeRemaining = ocData.time_ready - Math.floor(Date.now() / 1000);
                            if (timeRemaining > 0) {
                                return this.formatOCTime(timeRemaining);
                            } else {
                                return { timeText: 'Ready!', statusText: 'OC available now' };
                            }
                        }
                    }
                    return null;
                } catch (error) {
                    if (this.DEBUG) console.error('API fetch error:', error);
                    return null;
                }
            },

            // Update timer display directly
            updateTimerDisplay(timeText) {
                const timerDisplay = document.getElementById('oc-timer-display');
                if (timerDisplay && timeText !== '--:--:--') {
                    timerDisplay.textContent = timeText;
                    timerDisplay.style.color = timeText === 'Ready!' ? '#4CAF50' : '#fff';
                }
            },

            // Start the OC countdown timer
            startOCCountdown() {
                // Update timer every second
                this.ocTimerInterval = setInterval(() => {
                    this.updateOCCountdown();
                }, 1000);
                
                // Initial update
                this.updateOCCountdown();
            },

            // Update the OC countdown display - IMPROVED VERSION
            updateOCCountdown() {
                const timerDisplay = document.getElementById('oc-timer-display');
                if (!timerDisplay) return;

                // Get OC data from page using improved method
                const ocData = this.getOCDataFromPage();
                
                if (ocData && ocData.timeText) {
                    timerDisplay.textContent = ocData.timeText;
                    
                    // Set color based on status
                    if (ocData.timeText === 'Ready!' || ocData.timeText === '00:00:00') {
                        timerDisplay.style.color = '#4CAF50';
                    } else if (ocData.timeText === '--:--:--') {
                        timerDisplay.style.color = '#888';
                    } else {
                        timerDisplay.style.color = '#fff';
                    }

                    // Debug logging (only every 30 seconds to avoid spam)
                    if (this.DEBUG && Math.floor(Date.now() / 1000) % 30 === 0) {
                        console.log(`⏰ OC Timer: ${ocData.timeText} | Status: ${ocData.statusText}`);
                        this.debugOCDataSources(); // Show what data sources are available
                    }
                } else {
                    timerDisplay.textContent = '--:--:--';
                    timerDisplay.style.color = '#888';
                    
                    if (this.DEBUG) {
                        console.log('⚠️ No OC data available for timer update');
                        this.debugOCDataSources(); // Show what data sources are available
                    }
                }
            },

            // Debug method to check all available OC data sources
            debugOCDataSources() {
                console.log('=== OC Data Source Debug ===');
                
                // Check window.user
                if (window.user) {
                    console.log('✅ window.user exists');
                    if (window.user.criminalrecord) {
                        console.log('✅ window.user.criminalrecord exists:', window.user.criminalrecord);
                    } else {
                        console.log('❌ window.user.criminalrecord missing');
                    }
                } else {
                    console.log('❌ window.user missing');
                }
                
                // Check travel root data
                const travelRoot = document.querySelector('#travel-root');
                if (travelRoot) {
                    console.log('✅ #travel-root exists');
                    const dataModel = travelRoot.getAttribute('data-model');
                    if (dataModel) {
                        console.log('✅ data-model attribute exists, length:', dataModel.length);
                        try {
                            const data = JSON.parse(dataModel.replace(/&quot;/g, '"'));
                            if (data.user && data.user.criminalrecord) {
                                console.log('✅ travel data has criminalrecord:', data.user.criminalrecord);
                            } else {
                                console.log('❌ travel data missing criminalrecord');
                            }
                        } catch (e) {
                            console.log('❌ travel data parse error:', e);
                        }
                    } else {
                        console.log('❌ data-model attribute missing');
                    }
                } else {
                    console.log('❌ #travel-root missing');
                }
                
                // Check for timer elements on page
                const timerElements = document.querySelectorAll('[class*="crime"], [class*="organized"], .timer, .cooldown');
                console.log(`Found ${timerElements.length} potential timer elements on page`);
                
                console.log('=== End Debug ===');
            },

            // Keep the travel blocking functionality
            disableContinueButton(country, method) {
                const buttons = document.querySelectorAll("a.torn-btn.btn-dark-bg, button.torn-btn.btn-dark-bg");

                buttons.forEach((btn) => {
                    if (btn.textContent.trim() === "Continue") {
                        console.warn(`🔒 Blocking travel to ${country} via ${method}`);
                        btn.disabled = true;
                        btn.textContent = "DISABLED";
                        btn.title = "Blocked: OC not ready before return.";
                        btn.classList.add("script-disabled-button");

                        const prevent = (e) => {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                        };

                        btn.onclick = prevent;
                        btn.onmousedown = prevent;
                        btn.addEventListener("click", prevent, true);
                        btn.addEventListener("mousedown", prevent, true);
                    }
                });
            },

            getDataModel() {
                const travelRoot = document.getElementById('travel-root');
                
                // Only log once per page load to reduce spam
                if (!this._hasLoggedTravelRoot) {
                    console.log('🔍 [DEBUG] getDataModel - Travel root found:', !!travelRoot);
                    this._hasLoggedTravelRoot = true;
                }
                
                if (!travelRoot) return null;

                try {
                    const dataModelAttr = travelRoot.getAttribute('data-model');
                    
                    // Only log once per page load
                    if (!this._hasLoggedDataModel) {
                        console.log('🔍 [DEBUG] getDataModel - data-model attribute:', dataModelAttr);
                        this._hasLoggedDataModel = true;
                    }
                    
                    if (!dataModelAttr) {
                        if (!this._hasLoggedNoDataModel) {
                            console.log('🔍 [DEBUG] getDataModel - No data-model attribute found');
                            this._hasLoggedNoDataModel = true;
                        }
                        return null;
                    }
                    
                    const parsed = JSON.parse(dataModelAttr);
                    
                    // Only log once per page load
                    if (!this._hasLoggedParsed) {
                        console.log('🔍 [DEBUG] getDataModel - Parsed successfully:', parsed);
                        this._hasLoggedParsed = true;
                    }
                    
                    return parsed;
                } catch (e) {
                    console.error("❌ Failed to parse data-model:", e);
                    console.log('🔍 [DEBUG] getDataModel - Raw attribute value:', travelRoot.getAttribute('data-model'));
                    return null;
                }
            },

            handleDesktopClick(event) {
                const button = event.target.closest("button.torn-btn.btn-dark-bg, a.torn-btn.btn-dark-bg");
                if (!button) return;

                const flightGrid = button.closest(".flightDetailsGrid___uAttX");
                const countrySpan = flightGrid?.querySelector(".country___wBPip");
                const countryName = countrySpan?.textContent.trim();
                if (!countryName) return;

                if (this.DEBUG) console.log(`[DESKTOP] Clicked travel button for: ${countryName}`);

                const parsed = this.getDataModel();
                const match = parsed?.destinations?.find(dest =>
                    dest.country.toLowerCase() === countryName.toLowerCase()
                );

                if (!match) {
                    console.warn(`⚠️ No destination found in data-model for ${countryName}`);
                    return;
                }

                const methodInput = document.querySelector('fieldset.travelTypeSelector___zK5N4 input[name="travelType"]:checked');
                const selectedMethod = methodInput?.value;

                if (!selectedMethod) {
                    console.warn("⚠️ Could not detect selected travel method.");
                    return;
                }

                if (this.DEBUG) console.log(`📦 Selected travel method: ${selectedMethod}`);

                const ocReady = match[selectedMethod]?.ocReadyBeforeBack;
                if (this.DEBUG) console.log(`🚦 OC Ready Before Back: ${ocReady} for method: ${selectedMethod}`);

                if (ocReady === true) {
                    this.disableContinueButton(countryName, selectedMethod);
                } else {
                    if (this.DEBUG) console.log(`✅ Travel allowed to ${countryName} via ${selectedMethod}`);
                }
            },

            handleMobileClick(event) {
                const button = event.target.closest("button");
                if (!button) return;

                const spans = button.querySelectorAll("span");
                const countryName = [...spans].map(s => s.textContent.trim())
                    .find(t => /^[A-Za-z\s]+$/.test(t));

                if (!countryName) return;

                if (this.DEBUG) console.log(`[MOBILE] Clicked destination: ${countryName}`);

                const parsed = this.getDataModel();
                const match = parsed?.destinations?.find(dest =>
                    dest.country.toLowerCase() === countryName.toLowerCase()
                );

                if (!match) {
                    console.warn(`⚠️ No match found in data-model for ${countryName}`);
                    return;
                }

                for (const key of ['standard', 'airstrip', 'private', 'business']) {
                    const method = match[key];
                    const ocReady = method?.ocReadyBeforeBack;
                    if (this.DEBUG) console.log(`🔍 Checking ${key} => ocReadyBeforeBack: ${ocReady}`);
                    if (ocReady === true) {
                        this.disableContinueButton(countryName, key);
                        return;
                    }
                }

                if (this.DEBUG) console.log(`✅ Travel allowed to ${countryName} via all methods`);
            },

            setupClickInterceptor() {
                const isMobile = window.matchMedia("(max-width: 600px)").matches;

                document.body.addEventListener("click", (e) => {
                    if (!this.isEnabled) return;
                    
                    if (isMobile) {
                        this.handleMobileClick(e);
                    } else {
                        this.handleDesktopClick(e);
                    }
                });
            },

            // Public methods for external access
            getStatus() {
                return {
                    enabled: this.isEnabled,
                    active: this.isActive,
                    onTravelPage: this.isOnTravelPage()
                };
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.TravelBlocker = TravelBlockerModule;

        console.log('✈️ Travel Blocker module registered (Simplified UI)');
    });
})();
