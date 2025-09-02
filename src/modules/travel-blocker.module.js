// ==UserScript==
// @name         Sidekick Travel Blocker Module
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  Travel blocker functionality to prevent OC conflicts with live OC countdown timer
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
                console.log('✈️ Initializing Travel Blocker Module v1.1.1...');
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

                console.log('✅ Travel Blocker module initialized');
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

                    /* Responsive adjustments */
                    @media (max-width: 768px) {
                        .switch {
                            width: 40px;
                            height: 20px;
                        }

                        .slider:before {
                            height: 10px;
                            width: 10px;
                            left: 3px;
                            bottom: 3px;
                        }

                        input:checked + .slider:before {
                            transform: translateX(14px);
                        }
                    }
                `;
                document.head.appendChild(style);
            },

            injectToggle() {
                const wrapper = document.querySelector('div.content-wrapper.summer');
                if (!wrapper || wrapper.querySelector('#oc-toggle-container')) return;

                // Skip injection if module is disabled
                if (!this.isEnabled) {
                    if (this.DEBUG) console.log('🚫 Travel Blocker UI injection skipped - module disabled');
                    return;
                }

                // Get OC status and time remaining
                const ocStatus = this.getOCStatus();
                
                const container = document.createElement('div');
                container.id = 'oc-toggle-container';
                container.innerHTML = `
                    <div style="
                        background: linear-gradient(135deg, rgba(42, 42, 42, 0.95), rgba(31, 31, 31, 0.95));
                        border: 1px solid rgba(68, 68, 68, 0.7);
                        border-radius: 12px;
                        padding: 16px;
                        margin: 16px 0;
                        color: #fff;
                        font-family: 'Segoe UI', 'Inter', sans-serif;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
                        backdrop-filter: blur(10px);
                        max-width: 400px;
                        position: relative;
                        overflow: hidden;
                    ">
                        <!-- Header with status indicator -->
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <h3 style="margin: 0; color: #4CAF50; font-size: 16px; font-weight: 600;">
                                    �️ Travel Intelligence
                                </h3>
                                <div style="
                                    width: 8px;
                                    height: 8px;
                                    border-radius: 50%;
                                    background-color: ${this.isEnabled ? '#4CAF50' : '#f44336'};
                                    box-shadow: 0 0 10px ${this.isEnabled ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'};
                                    animation: pulse 2s infinite;
                                " title="${this.isEnabled ? 'Protection Active' : 'Protection Inactive'}"></div>
                            </div>
                            <div style="font-size: 10px; color: #888; opacity: 0.7;">
                                Last updated: ${new Date().toLocaleTimeString()}
                            </div>
                        </div>

                        <!-- OC Status Card -->
                        <div style="
                            background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
                            border-radius: 8px;
                            padding: 12px;
                            margin-bottom: 12px;
                            border: 1px solid rgba(255,255,255,0.1);
                        ">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="font-size: 12px;">🎯</span>
                                <span style="font-size: 12px; font-weight: 500; color: #fff;">Organized Crime Status</span>
                            </div>
                            <div style="color: #e0e0e0; font-size: 13px; line-height: 1.4;">
                                ${ocStatus.message}
                            </div>
                        </div>

                        <!-- Live Countdown Timer -->
                        <div id="oc-countdown-timer" style="
                            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                            border: 1px solid rgba(76, 175, 80, 0.3);
                            border-radius: 8px;
                            padding: 12px;
                            text-align: center;
                            margin-bottom: 12px;
                        ">
                            <div style="font-size: 11px; color: #4CAF50; margin-bottom: 6px; font-weight: 500;">
                                ⏰ NEXT OC COUNTDOWN
                            </div>
                            <div id="oc-timer-display" style="
                                font-size: 18px; 
                                color: #fff; 
                                font-weight: 700; 
                                font-family: 'Courier New', monospace;
                                letter-spacing: 1px;
                            ">--:--:--</div>
                        </div>

                        <!-- Flight Calculator -->
                        <div id="flight-calculator" style="
                            background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05));
                            border: 1px solid rgba(33, 150, 243, 0.3);
                            border-radius: 8px;
                            padding: 12px;
                            margin-bottom: 8px;
                        ">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="font-size: 12px;">✈️</span>
                                <span style="font-size: 12px; font-weight: 500; color: #2196F3;">Flight Time Calculator</span>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                                <select id="destination-select" style="
                                    background: rgba(255,255,255,0.1);
                                    border: 1px solid rgba(255,255,255,0.2);
                                    border-radius: 4px;
                                    color: #fff;
                                    padding: 4px 8px;
                                    font-size: 11px;
                                    flex: 1;
                                    min-width: 120px;
                                ">
                                    <option value="1">Mexico (1h)</option>
                                    <option value="2">Cayman Islands (2h)</option>
                                    <option value="3">Canada (3h)</option>
                                    <option value="4">Hawaii (4h)</option>
                                    <option value="5">United Kingdom (5h)</option>
                                    <option value="6">Argentina (6h)</option>
                                    <option value="7">Switzerland (7h)</option>
                                    <option value="8">Japan (8h)</option>
                                    <option value="9">China (9h)</option>
                                    <option value="10">UAE (10h)</option>
                                    <option value="11">South Africa (11h)</option>
                                </select>
                                <button id="calculate-flight" style="
                                    background: #2196F3;
                                    border: none;
                                    border-radius: 4px;
                                    color: white;
                                    padding: 4px 8px;
                                    font-size: 11px;
                                    cursor: pointer;
                                    transition: background 0.2s;
                                " onmouseover="this.style.background='#1976D2'" onmouseout="this.style.background='#2196F3'">
                                    Calculate
                                </button>
                            </div>
                            <div id="flight-result" style="
                                margin-top: 8px;
                                padding: 6px 8px;
                                background: rgba(255,255,255,0.05);
                                border-radius: 4px;
                                font-size: 11px;
                                color: #e0e0e0;
                                display: none;
                            "></div>
                        </div>

                        <!-- Quick Actions -->
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button id="refresh-oc-data" style="
                                background: rgba(76, 175, 80, 0.2);
                                border: 1px solid rgba(76, 175, 80, 0.5);
                                border-radius: 6px;
                                color: #4CAF50;
                                padding: 6px 12px;
                                font-size: 11px;
                                cursor: pointer;
                                transition: all 0.2s;
                                font-weight: 500;
                            " onmouseover="this.style.background='rgba(76, 175, 80, 0.3)'" onmouseout="this.style.background='rgba(76, 175, 80, 0.2)'">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>

                    <style>
                        @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.5; }
                        }
                        
                        #destination-select:focus {
                            outline: none;
                            border-color: rgba(33, 150, 243, 0.6);
                            box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
                        }
                    </style>
                `;

                wrapper.prepend(container);
                
                // Add event listeners
                this.setupFlightCalculator();
                this.setupRefreshButton();
                
                // Start the countdown timer
                this.startOCCountdown();
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

            getOCDataFromPage() {
                try {
                    const travelRoot = document.querySelector('#travel-root');
                    if (!travelRoot) {
                        return { timeText: '--:--:--', statusText: 'Travel page not found' };
                    }

                    const dataModel = travelRoot.getAttribute('data-model');
                    if (!dataModel) {
                        return { timeText: '--:--:--', statusText: 'No travel data available' };
                    }

                    const data = JSON.parse(dataModel.replace(/&quot;/g, '"'));
                    
                    // Find current location and check OC status
                    if (data.destinations) {
                        for (const [country, details] of Object.entries(data.destinations)) {
                            if (details.active && details.active.ocReadyBeforeBack !== undefined) {
                                if (details.active.ocReadyBeforeBack) {
                                    return { timeText: 'Ready!', statusText: 'OC available before return' };
                                } else {
                                    // Calculate time remaining based on travel end time
                                    const currentTime = Date.now() / 1000;
                                    const travelEndTime = details.active.timestamp;
                                    const ocReadyTime = travelEndTime + (6 * 60 * 60); // OC ready 6 hours after travel ends
                                    const timeRemaining = ocReadyTime - currentTime;
                                    
                                    if (timeRemaining > 0) {
                                        const hours = Math.floor(timeRemaining / 3600);
                                        const minutes = Math.floor((timeRemaining % 3600) / 60);
                                        const seconds = Math.floor(timeRemaining % 60);
                                        return { 
                                            timeText: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
                                            statusText: 'Time until next OC'
                                        };
                                    } else {
                                        return { timeText: 'Ready!', statusText: 'OC should be available' };
                                    }
                                }
                            }
                        }
                    }
                    
                    return { timeText: '--:--:--', statusText: 'Not traveling' };
                } catch (error) {
                    console.error('Error getting OC data from page:', error);
                    return { timeText: '--:--:--', statusText: 'Error loading OC data' };
                }
            },

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

            // Get OC status and time remaining
            getOCStatus() {
                // Rate limiting to prevent spam - only call once every 5 seconds
                if (this._lastOCStatusCall && Date.now() - this._lastOCStatusCall < 5000) {
                    return this._lastOCStatusResult || {
                        message: 'Travel Blocker Active - Rate limited',
                        timeRemaining: null
                    };
                }
                
                this._lastOCStatusCall = Date.now();
                
                try {
                    console.log('🔍 [DEBUG] Getting OC status...');
                    
                    // First try to get OC data from Torn API if available
                    if (window.SidekickModules?.Api?.makeRequest) {
                        console.log('🔍 [DEBUG] API available, trying API method...');
                        return this.getOCStatusFromAPI();
                    }
                    
                    // Fallback to page data model
                    console.log('🔍 [DEBUG] API not available, trying page data model...');
                    const dataModel = this.getDataModel();
                    console.log('🔍 [DEBUG] Data model:', dataModel);
                    
                    if (!dataModel || !dataModel.destinations) {
                        console.log('🔍 [DEBUG] No data model or destinations found');
                        
                        // Try to find travel data in other ways
                        const travelRoot = document.getElementById('travel-root');
                        console.log('🔍 [DEBUG] Travel root element:', travelRoot);
                        
                        if (!travelRoot) {
                            console.log('🔍 [DEBUG] Travel root not found');
                            const result = {
                                message: 'Travel Blocker Active - Waiting for page data...',
                                timeRemaining: null
                            };
                            this._lastOCStatusResult = result;
                            return result;
                        }
                        
                        // Check if we have any travel buttons to determine if page is ready
                        const travelButtons = document.querySelectorAll('button.torn-btn.btn-dark-bg, a.torn-btn.btn-dark-bg');
                        console.log('🔍 [DEBUG] Travel buttons found:', travelButtons.length);
                        
                        if (travelButtons.length === 0) {
                            console.log('🔍 [DEBUG] No travel buttons found yet');
                            const result = {
                                message: 'Travel Blocker Active - Page loading...',
                                timeRemaining: null
                            };
                            this._lastOCStatusResult = result;
                            return result;
                        }
                        
                        const result = {
                            message: 'Travel Blocker Active - Monitoring for OC conflicts',
                            timeRemaining: null
                        };
                        this._lastOCStatusResult = result;
                        return result;
                    }

                    console.log('🔍 [DEBUG] Found destinations:', dataModel.destinations.length);
                    
                    // Find the earliest OC start time
                    let earliestOC = null;
                    let message = '';
                    let hasOCConflicts = false;

                    dataModel.destinations.forEach((dest, index) => {
                        ['standard', 'airstrip', 'private', 'business'].forEach(method => {
                            if (dest[method]?.ocReadyBeforeBack === true) {
                                hasOCConflicts = true;
                                const ocStart = dest[method]?.ocStart;
                                console.log(`🔍 [DEBUG] OC conflict found for ${method}, start:`, ocStart);
                                if (ocStart && (!earliestOC || ocStart < earliestOC)) {
                                    earliestOC = ocStart;
                                }
                            }
                        });
                    });

                    console.log('🔍 [DEBUG] Has OC conflicts:', hasOCConflicts, 'Earliest OC:', earliestOC);

                    if (hasOCConflicts && earliestOC) {
                        const now = Math.floor(Date.now() / 1000);
                        const timeRemaining = Math.ceil((earliestOC - now) / 3600); // Convert to hours
                        
                        if (timeRemaining > 0) {
                            message = `Travel blocked: OC starts in ${timeRemaining}h`;
                        } else {
                            message = 'OC ready! Travel is safe.';
                        }

                        const result = {
                            message: message,
                            timeRemaining: timeRemaining
                        };
                        this._lastOCStatusResult = result;
                        return result;
                    } else if (hasOCConflicts) {
                        const result = {
                            message: 'OC conflicts detected. Travel blocked.',
                            timeRemaining: null
                        };
                        this._lastOCStatusResult = result;
                        return result;
                    } else {
                        const result = {
                            message: 'No OC conflicts. Travel is safe.',
                            timeRemaining: null
                        };
                        this._lastOCStatusResult = result;
                        return result;
                    }
                } catch (error) {
                    console.error('❌ Error getting OC status:', error);
                    const result = {
                        message: 'Travel Blocker Active - Error occurred',
                        timeRemaining: null
                    };
                    this._lastOCStatusResult = result;
                    return result;
                }
            },

            // Get OC status from Torn API
            async getOCStatusFromAPI() {
                try {
                    // Get user's organized crime data using the correct API endpoint
                    const apiKey = window.SidekickModules.Core.loadState('sidekick_api_key', '');
                    if (!apiKey) {
                        console.log('🔍 [DEBUG] No API key available, falling back to page data');
                        return this.getOCStatusFromPage();
                    }

                    console.log('🔍 [DEBUG] Fetching OC data from Torn API v2...');
                    const response = await fetch(`https://api.torn.com/v2/user/?selections=organizedcrime&key=${apiKey}`);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log('🔍 [DEBUG] Full API response:', data);
                    
                    if (data.error) {
                        throw new Error(data.error.error || 'API error');
                    }
                    
                    // The API returns the OC data directly, not nested under 'organizedcrime'
                    const ocData = data;
                    console.log('🔍 [DEBUG] OC data extracted:', ocData);
                    
                    if (!ocData) {
                        console.log('🔍 [DEBUG] No organized crime data found in API response');
                        return {
                            message: 'No OC data available from API',
                            timeRemaining: null
                        };
                    }

                    // Log all available properties to understand the structure
                    console.log('🔍 [DEBUG] Available properties in OC data:', Object.keys(ocData));
                    
                    // Check if user is in an OC (try different property names)
                    const currentOC = ocData.current || ocData.active || ocData.current_oc;
                    if (currentOC && (currentOC.active || currentOC.status === 'active')) {
                        const ocStart = currentOC.start || currentOC.start_time || currentOC.timestamp;
                        const ocEnd = currentOC.end || currentOC.end_time || currentOC.duration;
                        const now = Math.floor(Date.now() / 1000);
                        
                        console.log('🔍 [DEBUG] Current OC found:', { ocStart, ocEnd, now });
                        
                        if (ocStart && ocEnd) {
                            if (now < ocStart) {
                                // OC hasn't started yet
                                const timeRemaining = Math.ceil((ocStart - now) / 3600);
                                return {
                                    message: `OC starts in ${timeRemaining}h`,
                                    timeRemaining: timeRemaining,
                                    ocStart: ocStart,
                                    ocEnd: ocEnd
                                };
                            } else if (now >= ocStart && now < ocEnd) {
                                // OC is currently active
                                const timeRemaining = Math.ceil((ocEnd - now) / 3600);
                                return {
                                    message: `OC active for ${timeRemaining}h`,
                                    timeRemaining: timeRemaining,
                                    ocStart: ocStart,
                                    ocEnd: ocEnd
                                };
                            } else {
                                // OC has ended
                                return {
                                    message: 'OC completed. Travel is safe.',
                                    timeRemaining: 0,
                                    ocStart: ocStart,
                                    ocEnd: ocEnd
                                };
                            }
                        }
                    }
                    
                    // Check for upcoming OC (try different property names)
                    const upcomingOC = ocData.upcoming || ocData.next || ocData.scheduled;
                    if (upcomingOC && (Array.isArray(upcomingOC) ? upcomingOC.length > 0 : upcomingOC.start)) {
                        const nextOC = Array.isArray(upcomingOC) ? upcomingOC[0] : upcomingOC;
                        const ocStart = nextOC.start || nextOC.start_time || nextOC.timestamp;
                        const now = Math.floor(Date.now() / 1000);
                        
                        console.log('🔍 [DEBUG] Upcoming OC found:', { ocStart, now });
                        
                        if (ocStart && ocStart > now) {
                            const timeRemaining = Math.ceil((ocStart - now) / 3600);
                            return {
                                message: `Next OC starts in ${timeRemaining}h`,
                                timeRemaining: timeRemaining,
                                ocStart: ocStart,
                                ocEnd: nextOC.end || nextOC.end_time
                            };
                        }
                    }
                    
                    // Check for cooldown information (common in OC APIs)
                    if (ocData.cooldown || ocData.cooldowns) {
                        const cooldown = ocData.cooldown || ocData.cooldowns;
                        console.log('🔍 [DEBUG] Cooldown data found:', cooldown);
                        
                        // Look for next OC start time in cooldown data
                        const nextOCStart = cooldown.next || cooldown.next_oc || cooldown.organized_crime;
                        if (nextOCStart) {
                            const now = Math.floor(Date.now() / 1000);
                            const timeRemaining = Math.ceil((nextOCStart - now) / 3600);
                            
                            if (timeRemaining > 0) {
                                return {
                                    message: `Next OC starts in ${timeRemaining}h`,
                                    timeRemaining: timeRemaining,
                                    ocStart: nextOCStart
                                };
                            }
                        }
                    }
                    
                    // Check for any timestamp-like properties that might contain OC timing
                    const timestampProps = Object.keys(ocData).filter(key => 
                        key.toLowerCase().includes('time') || 
                        key.toLowerCase().includes('start') || 
                        key.toLowerCase().includes('next') ||
                        key.toLowerCase().includes('oc')
                    );
                    
                    console.log('🔍 [DEBUG] Potential timestamp properties:', timestampProps);
                    
                    for (const prop of timestampProps) {
                        const value = ocData[prop];
                        console.log(`🔍 [DEBUG] Checking property "${prop}":`, value);
                        
                        if (value && typeof value === 'number' && value > 0) {
                            const now = Math.floor(Date.now() / 1000);
                            if (value > now) {
                                const timeRemaining = Math.ceil((value - now) / 3600);
                                console.log(`🔍 [DEBUG] Found potential OC start time in "${prop}":`, value, 'timeRemaining:', timeRemaining);
                                
                                if (timeRemaining > 0) {
                                    return {
                                        message: `Next OC starts in ${timeRemaining}h`,
                                        timeRemaining: timeRemaining,
                                        ocStart: value
                                    };
                                }
                            }
                        }
                    }
                    
                    // No active or upcoming OC found
                    console.log('🔍 [DEBUG] No OC timing data found in response structure');
                    return {
                        message: 'No OC scheduled. Travel is safe.',
                        timeRemaining: null
                    };
                    
                } catch (error) {
                    console.error('❌ Error getting OC status from API:', error);
                    // Fallback to page data
                    return this.getOCStatusFromPage();
                }
            },

            // Get OC status from page data as fallback
            getOCStatusFromPage() {
                const dataModel = this.getDataModel();
                if (!dataModel || !dataModel.destinations) {
                    return {
                        message: 'Travel data loading...',
                        timeRemaining: null
                    };
                }

                // Find the earliest OC start time
                let earliestOC = null;
                let hasOCConflicts = false;

                dataModel.destinations.forEach(dest => {
                    ['standard', 'airstrip', 'private', 'business'].forEach(method => {
                        if (dest[method]?.ocReadyBeforeBack === true) {
                            hasOCConflicts = true;
                            const ocStart = dest[method]?.ocStart;
                            if (ocStart && (!earliestOC || ocStart < earliestOC)) {
                                earliestOC = ocStart;
                            }
                        }
                    });
                });

                if (hasOCConflicts && earliestOC) {
                    const now = Math.floor(Date.now() / 1000);
                    const timeRemaining = Math.ceil((earliestOC - now) / 3600);
                    
                    if (timeRemaining > 0) {
                        return {
                            message: `Travel blocked: OC starts in ${timeRemaining}h`,
                            timeRemaining: timeRemaining
                        };
                    } else {
                        return {
                            message: 'OC ready! Travel is safe.',
                            timeRemaining: 0
                        };
                    }
                } else if (hasOCConflicts) {
                    return {
                        message: 'OC conflicts detected. Travel blocked.',
                        timeRemaining: null
                    };
                } else {
                    return {
                        message: 'No OC conflicts. Travel is safe.',
                        timeRemaining: null
                    };
                }
            },

            // Update the infobox with current OC status
            updateInfoBox() {
                const container = document.getElementById('oc-toggle-container');
                if (!container) return;

                const ocStatus = this.getOCStatus();
                
                // Update the message
                const messageDiv = container.querySelector('div[style*="color: #bbb"]');
                if (messageDiv) {
                    messageDiv.textContent = ocStatus.message;
                }

                // Update the time remaining display
                const timeDiv = container.querySelector('div[style*="background:"]');
                if (timeDiv) {
                    if (ocStatus.timeRemaining !== null) {
                        timeDiv.style.background = ocStatus.timeRemaining > 0 ? '#4CAF50' : '#f44336';
                        timeDiv.innerHTML = `${ocStatus.timeRemaining > 0 ? '⏰' : '⚠️'} ${ocStatus.timeRemaining > 0 ? 
                            `OC starts in ${ocStatus.timeRemaining} hours` : 
                            'OC is ready! Travel safely!'
                        }`;
                    } else {
                        timeDiv.style.display = 'none';
                    }
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

            // Update the OC countdown display
            updateOCCountdown() {
                const timerDisplay = document.getElementById('oc-timer-display');
                if (!timerDisplay) return;

                // Get OC data from page using simplified approach
                const ocData = this.getOCDataFromPage();
                
                timerDisplay.textContent = ocData.timeText;
                
                // Set color based on status
                if (ocData.timeText === 'Ready!' || ocData.timeText === '00:00:00') {
                    timerDisplay.style.color = '#4CAF50';
                } else if (ocData.timeText === '--:--:--') {
                    timerDisplay.style.color = '#888';
                } else {
                    timerDisplay.style.color = '#fff';
                }
            },

            // Get the earliest OC start time from all destinations
            getEarliestOCStart() {
                const dataModel = this.getDataModel();
                if (!dataModel || !dataModel.destinations) return null;

                let earliestOC = null;

                dataModel.destinations.forEach(dest => {
                    ['standard', 'airstrip', 'private', 'business'].forEach(method => {
                        if (dest[method]?.ocStart) {
                            if (!earliestOC || dest[method].ocStart < earliestOC) {
                                earliestOC = dest[method].ocStart;
                            }
                        }
                    });
                });

                return earliestOC;
            },

            // Setup flight calculator functionality
            setupFlightCalculator() {
                const calculateBtn = document.getElementById('calculate-flight');
                const destinationSelect = document.getElementById('destination-select');
                const resultDiv = document.getElementById('flight-result');

                if (!calculateBtn || !destinationSelect || !resultDiv) return;

                calculateBtn.addEventListener('click', () => {
                    const flightHours = parseInt(destinationSelect.value);
                    const destination = destinationSelect.options[destinationSelect.selectedIndex].text;
                    
                    // Get current OC status
                    const ocStatus = this.getOCStatus();
                    
                    if (ocStatus.timeRemaining && ocStatus.timeRemaining > 0) {
                        const totalTripTime = flightHours * 2; // Round trip
                        const timeUntilOC = ocStatus.timeRemaining;
                        
                        const canMakeTrip = totalTripTime < timeUntilOC;
                        const timeBuffer = timeUntilOC - totalTripTime;
                        
                        resultDiv.style.display = 'block';
                        
                        if (canMakeTrip) {
                            resultDiv.style.borderLeft = '3px solid #4CAF50';
                            resultDiv.innerHTML = `
                                <div style="color: #4CAF50; font-weight: bold; margin-bottom: 4px;">✅ SAFE TO TRAVEL</div>
                                <div style="font-size: 10px; color: #ccc;">
                                    • ${destination}: ${flightHours}h each way<br>
                                    • Round trip: ${totalTripTime}h total<br>
                                    • Buffer time: ${timeBuffer.toFixed(1)}h before OC<br>
                                    • Next OC: ${timeUntilOC}h from now
                                </div>
                            `;
                        } else {
                            resultDiv.style.borderLeft = '3px solid #f44336';
                            resultDiv.innerHTML = `
                                <div style="color: #f44336; font-weight: bold; margin-bottom: 4px;">⚠️ RISKY TRAVEL</div>
                                <div style="font-size: 10px; color: #ccc;">
                                    • ${destination}: ${flightHours}h each way<br>
                                    • Round trip: ${totalTripTime}h total<br>
                                    • Shortage: ${Math.abs(timeBuffer).toFixed(1)}h over OC time<br>
                                    • Next OC: ${timeUntilOC}h from now
                                </div>
                            `;
                        }
                    } else {
                        resultDiv.style.display = 'block';
                        resultDiv.style.borderLeft = '3px solid #2196F3';
                        resultDiv.innerHTML = `
                            <div style="color: #2196F3; font-weight: bold; margin-bottom: 4px;">ℹ️ NO OC SCHEDULED</div>
                            <div style="font-size: 10px; color: #ccc;">
                                • ${destination}: ${flightHours}h each way<br>
                                • Round trip: ${totalTripTime}h total<br>
                                • No organized crime conflicts detected
                            </div>
                        `;
                    }
                });
            },

            // Setup refresh button functionality
            setupRefreshButton() {
                const refreshBtn = document.getElementById('refresh-oc-data');
                if (!refreshBtn) return;

                refreshBtn.addEventListener('click', async () => {
                    refreshBtn.innerHTML = '🔄 Refreshing...';
                    refreshBtn.disabled = true;
                    
                    try {
                        // Force refresh of OC data
                        const ocStatus = await this.getOCStatusFromAPI();
                        
                        // Update the display
                        this.updateInfoBox();
                        
                        // Update last refreshed time
                        const timeDiv = document.querySelector('#oc-toggle-container div[style*="Last updated"]');
                        if (timeDiv) {
                            timeDiv.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
                        }
                        
                        // Show success feedback
                        refreshBtn.innerHTML = '✅ Updated';
                        setTimeout(() => {
                            refreshBtn.innerHTML = '🔄 Refresh';
                            refreshBtn.disabled = false;
                        }, 2000);
                        
                    } catch (error) {
                        console.error('Failed to refresh OC data:', error);
                        refreshBtn.innerHTML = '❌ Failed';
                        setTimeout(() => {
                            refreshBtn.innerHTML = '🔄 Refresh';
                            refreshBtn.disabled = false;
                        }, 2000);
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

        console.log('✈️ Travel Blocker module registered');
    });
})();

