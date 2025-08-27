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
                const toggle = document.getElementById('oc-toggle-container');
                if (toggle) toggle.remove();

                console.log('⏹️ Travel Blocker deactivated');
            },

            toggle() {
                this.isEnabled = !this.isEnabled;
                this.saveSettings();
                
                const message = this.isEnabled ? 'Travel Blocker enabled' : 'Travel Blocker disabled';
                this.core.NotificationSystem.show('Updated', message, 'info');

                // Update toggle UI if it exists
                this.updateToggleUI();

                return this.isEnabled;
            },

            updateToggleUI() {
                const toggleInput = document.getElementById('oc-toggle');
                const statusSpan = document.getElementById('oc-status');
                
                if (toggleInput) {
                    toggleInput.checked = this.isEnabled;
                }
                if (statusSpan) {
                    statusSpan.textContent = this.isEnabled ? 'Enabled' : 'Disabled';
                }
            },

            injectStyles() {
                const style = document.createElement('style');
                style.textContent = `
                    /* Travel Blocker Styles */
                    .switch {
                        position: relative;
                        display: inline-block;
                        width: 50px;
                        height: 24px;
                    }

                    .switch input {
                        opacity: 0;
                        width: 0;
                        height: 0;
                    }

                    .slider {
                        position: absolute;
                        cursor: pointer;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: #ccc;
                        transition: 0.3s;
                        border-radius: 24px;
                    }

                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 16px;
                        width: 16px;
                        left: 4px;
                        bottom: 4px;
                        background-color: white;
                        transition: 0.3s;
                        border-radius: 50%;
                    }

                    input:checked + .slider {
                        background-color: #4CAF50;
                    }

                    input:checked + .slider:before {
                        transform: translateX(26px);
                    }

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
                    ">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                            <h4 style="margin: 0; color: #4CAF50; font-size: 14px; font-weight: bold;">
                                🚫 Travel Blocker
                            </h4>
                            <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
                                <input type="checkbox" id="oc-toggle" ${this.isEnabled ? 'checked' : ''}>
                                <span class="slider" style="
                                    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; 
                                    background-color: ${this.isEnabled ? '#4CAF50' : '#ccc'}; 
                                    transition: 0.3s; border-radius: 20px;
                                    ${this.isEnabled ? 'box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);' : ''}
                                "></span>
                            </label>
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

                const input = container.querySelector('#oc-toggle');
                const slider = container.querySelector('.slider');

                input.addEventListener('change', () => {
                    this.isEnabled = input.checked;
                    this.saveSettings();
                    
                    // Update slider appearance
                    if (this.isEnabled) {
                        slider.style.backgroundColor = '#4CAF50';
                        slider.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                    } else {
                        slider.style.backgroundColor = '#ccc';
                        slider.style.boxShadow = 'none';
                    }
                    
                    const message = this.isEnabled ? 'Travel Blocker enabled' : 'Travel Blocker disabled';
                    this.core.NotificationSystem.show('Updated', message, 'info');
                    
                    // Refresh the infobox
                    this.updateInfoBox();
                });

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
                    const dataModel = this.getDataModel();
                    if (!dataModel || !dataModel.destinations) {
                        return {
                            message: 'Unable to determine OC status. Please refresh the page.',
                            timeRemaining: null
                        };
                    }

                    // Find the earliest OC start time
                    let earliestOC = null;
                    let message = '';

                    dataModel.destinations.forEach(dest => {
                        ['standard', 'airstrip', 'private', 'business'].forEach(method => {
                            if (dest[method]?.ocReadyBeforeBack === true) {
                                const ocStart = dest[method]?.ocStart;
                                if (ocStart && (!earliestOC || ocStart < earliestOC)) {
                                    earliestOC = ocStart;
                                }
                            }
                        });
                    });

                    if (earliestOC) {
                        const now = Math.floor(Date.now() / 1000);
                        const timeRemaining = Math.ceil((earliestOC - now) / 3600); // Convert to hours
                        
                        if (timeRemaining > 0) {
                            message = `Travel is currently blocked to prevent OC conflicts. The earliest OC starts in ${timeRemaining} hours.`;
                        } else {
                            message = 'OC is ready! Travel is now safe.';
                        }

                        return {
                            message: message,
                            timeRemaining: timeRemaining
                        };
                    } else {
                        return {
                            message: 'No OC conflicts detected. Travel is safe.',
                            timeRemaining: null
                        };
                    }
                } catch (error) {
                    console.error('❌ Error getting OC status:', error);
                    return {
                        message: 'Error determining OC status.',
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

