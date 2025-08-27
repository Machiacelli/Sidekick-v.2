// ==UserScript==
// @name         Sidekick Travel Blocker Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Travel blocker functionality to prevent OC conflicts
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
                console.log('✈️ Initializing Travel Blocker Module v1.0.0...');
                this.core = window.SidekickModules.Core;
                if (!this.core) {
                    console.error('❌ Core module not available for Travel Blocker');
                    return;
                }

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
                return window.location.href.includes('/page.php?sid=travel');
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
                
                // Remove injected elements
                const container = document.getElementById('oc-toggle-container');
                if (container) container.remove();

                console.log('⏹️ Travel Blocker deactivated');
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
                    </div>
                `;



                wrapper.prepend(container);
            },

            getDataModel() {
                const travelRoot = document.getElementById('travel-root');
                if (!travelRoot) return null;

                try {
                    return JSON.parse(travelRoot.getAttribute('data-model'));
                } catch (e) {
                    console.error("❌ Failed to parse data-model:", e);
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
                    // First try to get OC data from Torn API if available
                    if (window.SidekickModules?.Api?.makeRequest) {
                        return this.getOCStatusFromAPI();
                    }
                    
                    // Fallback to page data model
                    const dataModel = this.getDataModel();
                    if (!dataModel || !dataModel.destinations) {
                        // Try to find travel data in other ways
                        const travelRoot = document.getElementById('travel-root');
                        if (!travelRoot) {
                            return {
                                message: 'Travel page loading...',
                                timeRemaining: null
                            };
                        }
                        
                        // Check if we have any travel buttons to determine if page is ready
                        const travelButtons = document.querySelectorAll('button.torn-btn.btn-dark-bg, a.torn-btn.btn-dark-bg');
                        if (travelButtons.length === 0) {
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

                    // Find the earliest OC start time
                    let earliestOC = null;
                    let message = '';
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
                    // Get user's cooldowns to check for OC
                    const response = await fetch('https://api.torn.com/user/?selections=cooldowns');
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const data = await response.json();
                    if (data.error) {
                        throw new Error(data.error.error || 'API error');
                    }
                    
                    const cooldowns = data.cooldowns;
                    if (!cooldowns) {
                        return {
                            message: 'No cooldown data available',
                            timeRemaining: null
                        };
                    }
                    
                    // Check for OC cooldown
                    const ocCooldown = cooldowns.oc;
                    if (!ocCooldown) {
                        return {
                            message: 'No OC cooldown detected',
                            timeRemaining: null
                        };
                    }
                    
                    const now = Math.floor(Date.now() / 1000);
                    const ocStart = ocCooldown.timestamp;
                    const timeRemaining = Math.ceil((ocStart - now) / 3600); // Convert to hours
                    
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

