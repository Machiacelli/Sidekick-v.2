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
                if (document.getElementById('travel-blocker-styles')) return;

                const style = document.createElement('style');
                style.id = 'travel-blocker-styles';
                style.textContent = `
                    .script-disabled-button {
                        background-color: #a00 !important;
                        color: crimson !important;
                        font-weight: bold;
                        text-transform: uppercase;
                        cursor: not-allowed !important;
                        pointer-events: none;
                    }

                    #oc-toggle-container {
                        margin: 10px 0;
                        padding: 6px 10px;
                        background: #222;
                        color: #fff;
                        border-radius: 5px;
                        font-size: 13px;
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .switch {
                        position: relative;
                        display: inline-block;
                        width: 38px;
                        height: 20px;
                        flex-shrink: 0;
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
                        border-radius: 34px;
                    }

                    .slider:before {
                        position: absolute;
                        content: "";
                        height: 14px;
                        width: 14px;
                        left: 3px;
                        bottom: 3px;
                        background-color: white;
                        transition: 0.3s;
                        border-radius: 50%;
                    }

                    input:checked + .slider {
                        background-color: #4caf50;
                    }

                    input:checked + .slider:before {
                        transform: translateX(18px);
                    }

                    @media (max-width: 600px) {
                        #oc-toggle-container {
                            font-size: 12px;
                            padding: 4px 8px;
                            gap: 6px;
                        }

                        .switch {
                            width: 32px;
                            height: 16px;
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

                const container = document.createElement('div');
                container.id = 'oc-toggle-container';
                container.innerHTML = `
                    <span>Travel Blocker:</span>
                    <label class="switch">
                        <input type="checkbox" id="oc-toggle" ${this.isEnabled ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <span id="oc-status">${this.isEnabled ? 'Enabled' : 'Disabled'}</span>
                `;

                const input = container.querySelector('#oc-toggle');
                const status = container.querySelector('#oc-status');

                input.addEventListener('change', () => {
                    this.isEnabled = input.checked;
                    this.saveSettings();
                    status.textContent = this.isEnabled ? 'Enabled' : 'Disabled';
                    
                    const message = this.isEnabled ? 'Travel Blocker enabled' : 'Travel Blocker disabled';
                    this.core.NotificationSystem.show('Updated', message, 'info');
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
