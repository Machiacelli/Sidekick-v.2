// ==UserScript==
// @name         Sidekick Travel Blocker Module
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Travel blocker functionality to prevent OC conflicts with live OC countdown timer
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
        const TravelBlockerModule = {
            name: 'TravelBlocker',
            isEnabled: true,
            isActive: false,
            DEBUG: false, // Toggle to true for detailed logs

            init() {
                console.log('✈️ Initializing Travel Blocker Module v1.1.0...');
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
                // Check multiple indicators for travel page
                const urlCheck = window.location.href.includes('/page.php?sid=travel');
                const titleCheck = document.title.toLowerCase().includes('travel');
                const contentCheck = document.querySelector('.content-wrapper.summer') !== null;
                const travelButtonsCheck = document.querySelectorAll('button.torn-btn.btn-dark-bg, a.torn-btn.btn-dark-bg').length > 0;
                
                // Log the detection results (only once)
                if (!this._hasLoggedPageDetection) {
                    console.log('🔍 [DEBUG] Travel page detection:', {
                        urlCheck,
                        titleCheck,
                        contentCheck,
                        travelButtonsCheck,
                        url: window.location.href,
                        title: document.title
                    });
                    this._hasLoggedPageDetection = true;
                }
                
                // Return true if any of the checks pass
                return urlCheck || (titleCheck && contentCheck) || (contentCheck && travelButtonsCheck);
            },

            activate() {
                if (this.isActive) return;
                this.isActive = true;

                console.log('🚀 Travel Blocker activated on travel page');
                this.injectStyles();
                this.injectToggle();
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

                return this.isEnabled;
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

                // Get OC status and time remaining
                const ocStatus = this.getOCStatus();
                
                const container = document.createElement('div');
                container.id = 'oc-toggle-container';
                container.innerHTML = `
                    <div style="
                        background: linear-gradient(135deg, #2a2a2a, #1f1f1f);
                        border: 1px solid #444;
                        border-radius: 8px;
                        padding: 12px;
                        margin: 12px 0;
                        color: #fff;
                        font-family: 'Segoe UI', sans-serif;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                        max-width: 300px;
                        position: relative;
                    ">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <h4 style="margin: 0; color: #4CAF50; font-size: 14px; font-weight: bold;">
                                🚫 Travel Blocker
                            </h4>
                            <div style="
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background-color: ${this.isEnabled ? '#4CAF50' : '#f44336'};
                                box-shadow: 0 0 8px ${this.isEnabled ? 'rgba(76, 175, 80, 0.6)' : 'rgba(244, 67, 54, 0.6)'};
                                position: absolute;
                                top: 8px;
                                right: 8px;
                            " title="${this.isEnabled ? 'Travel Blocker Active' : 'Travel Blocker Inactive'}"></div>
                        </div>
                        <div style="color: #bbb; font-size: 12px; line-height: 1.3;">
                            ${ocStatus.message}
                        </div>
                        ${ocStatus.timeRemaining ? `
                            <div style="
                                margin-top: 8px; 
                                padding: 6px 10px; 
                                background: ${ocStatus.timeRemaining > 0 ? '#4CAF50' : '#f44336'}; 
                                color: white; 
                                border-radius: 4px; 
                                font-weight: bold; 
                                text-align: center;
                                font-size: 11px;
                            ">
                                ${ocStatus.timeRemaining > 0 ? '⏰' : '⚠️'} ${ocStatus.timeRemaining > 0 ? 
                                    `OC starts in ${ocStatus.timeRemaining}h` : 
                                    'OC ready! Travel safely!'
                                }
                            </div>
                        ` : ''}
                        <div id="oc-countdown-timer" style="
                            margin-top: 8px;
                            padding: 8px 10px;
                            background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                            border: 1px solid #555;
                            border-radius: 4px;
                            text-align: center;
                            font-family: 'Courier New', monospace;
                        ">
                            <div style="font-size: 10px; color: #888; margin-bottom: 4px;">⏰ Next OC Countdown</div>
                            <div id="oc-timer-display" style="font-size: 16px; color: #fff; font-weight: bold;">--:--:--</div>
                        </div>
                    </div>
                `;



                wrapper.prepend(container);
                
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
                    if (this.isOnTravelPage() && !document.getElementById('oc-toggle-container')) {
                        this.injectToggle();
                    }
                });
                
                observer.observe(document.body, { childList: true, subtree: true });
            },

            // Get OC status and time remaining
            getOCStatus() {
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
                            return {
                                message: 'Travel page loading...',
                                timeRemaining: null
                            };
                        }
                        
                        // Check if we have any travel buttons to determine if page is ready
                        const travelButtons = document.querySelectorAll('button.torn-btn.btn-dark-bg, a.torn-btn.btn-dark-bg');
                        console.log('🔍 [DEBUG] Travel buttons found:', travelButtons.length);
                        
                        if (travelButtons.length === 0) {
                            console.log('🔍 [DEBUG] No travel buttons found yet');
                            return {
                                message: 'Waiting for travel data...',
                                timeRemaining: null
                            };
                        }
                        
                        return {
                            message: 'Travel data available. Checking for OC conflicts...',
                            timeRemaining: null
                        };
                    }

                    console.log('🔍 [DEBUG] Found destinations:', dataModel.destinations.length);
                    
                    // Find the earliest OC start time
                    let earliestOC = null;
                    let message = '';
                    let hasOCConflicts = false;

                    dataModel.destinations.forEach((dest, index) => {
                        console.log(`🔍 [DEBUG] Destination ${index}:`, dest);
                        ['standard', 'airstrip', 'private', 'business'].forEach(method => {
                            if (dest[method]) {
                                console.log(`🔍 [DEBUG] Method ${method}:`, dest[method]);
                                if (dest[method]?.ocReadyBeforeBack === true) {
                                    hasOCConflicts = true;
                                    const ocStart = dest[method]?.ocStart;
                                    console.log(`🔍 [DEBUG] OC conflict found for ${method}, start:`, ocStart);
                                    if (ocStart && (!earliestOC || ocStart < earliestOC)) {
                                        earliestOC = ocStart;
                                    }
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

                        return {
                            message: message,
                            timeRemaining: timeRemaining
                        };
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
                } catch (error) {
                    console.error('❌ Error getting OC status:', error);
                    return {
                        message: 'Error checking OC status.',
                        timeRemaining: null
                    };
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
                    const response = await fetch(`https://api.torn.com/v2/user/organizedcrime?key=${apiKey}`);
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

                const ocStart = this.getEarliestOCStart();
                if (!ocStart) {
                    timerDisplay.textContent = '--:--:--';
                    timerDisplay.style.color = '#888';
                    return;
                }

                const now = Math.floor(Date.now() / 1000);
                const timeRemaining = ocStart - now;

                if (timeRemaining <= 0) {
                    timerDisplay.textContent = '00:00:00';
                    timerDisplay.style.color = '#4CAF50';
                    return;
                }

                const hours = Math.floor(timeRemaining / 3600);
                const minutes = Math.floor((timeRemaining % 3600) / 60);
                const seconds = timeRemaining % 60;

                timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                // Color coding based on time remaining
                if (timeRemaining <= 3600) { // 1 hour or less
                    timerDisplay.style.color = '#f44336'; // Red
                } else if (timeRemaining <= 7200) { // 2 hours or less
                    timerDisplay.style.color = '#ff9800'; // Orange
                } else {
                    timerDisplay.style.color = '#fff'; // White
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

