// ==UserScript==
// @name         Sidekick Chain Timer Module
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Chain timer monitor with settings tab and floating mirror display
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
        const ChainTimerModule = {
            name: 'ChainTimer',
            version: '2.0.0',
            isActive: false,
            core: null,
            
            floatingDisplay: null,
            settingsContent: null,
            
            monitorInterval: null,
            flashIntervalId: null,
            flashDiv: null,
            alertedForCurrentThreshold: false,
            
            alertThresholdInSeconds: 240,
            alertsEnabled: true,
            popupEnabled: true,

            init() {
                console.log('⏱️ Initializing Chain Timer Module v2.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available');
                    return false;
                }

                this.loadConfig();
                
                const wasActive = this.core.loadState('chain_timer_active', false);
                if (wasActive) {
                    setTimeout(() => this.activate(), 500);
                }
                
                console.log('✅ Chain Timer initialized');
                return true;
            },

            activate() {
                if (this.isActive) {
                    this.deactivate();
                    return;
                }

                this.isActive = true;
                this.core.saveState('chain_timer_active', true);
                this.showFloatingDisplay();
                this.startMonitoring();
                this.updateSettingsToggle(true);
            },

            deactivate() {
                this.isActive = false;
                this.core.saveState('chain_timer_active', false);
                this.hideFloatingDisplay();
                this.stopMonitoring();
                this.stopFlashing();
                this.updateSettingsToggle(false);
            },

            createSettingsContent() {
                const content = document.createElement('div');
                content.style.cssText = 'padding: 20px; color: #fff;';
                
                content.innerHTML = `
                    <div style="margin-bottom: 20px;">
                        <h3 style="margin: 0 0 10px 0; color: #ff9800; font-size: 16px;">⏱️ Chain Timer Settings</h3>
                        <p style="margin: 0; color: #ccc; font-size: 12px;">Configure alerts for when your chain timer is running low</p>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: #ff9800; font-weight: bold;">Alert Threshold</label>
                        <select id="chain-threshold-dropdown" style="width: 100%; padding: 8px; background: #2a2a2a; color: #fff; border: 1px solid #ff9800; border-radius: 4px; font-size: 14px;">
                            <option value="60">1 minute (60 seconds)</option>
                            <option value="90">1.5 minutes (90 seconds)</option>
                            <option value="120">2 minutes (120 seconds)</option>
                            <option value="150">2.5 minutes (150 seconds)</option>
                            <option value="180">3 minutes (180 seconds)</option>
                            <option value="210">3.5 minutes (210 seconds)</option>
                            <option value="240" selected>4 minutes (240 seconds)</option>
                            <option value="270">4.5 minutes (270 seconds)</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="chain-alerts-toggle" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                            <span style="color: #fff; font-size: 14px;">Enable Screen Flash Alerts</span>
                        </label>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="chain-popup-toggle" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer;">
                            <span style="color: #fff; font-size: 14px;">Enable Popup Alerts</span>
                        </label>
                    </div>

                    <div style="margin-top: 20px; padding: 12px; background: rgba(255,152,0,0.1); border-left: 3px solid #ff9800; border-radius: 4px;">
                        <p style="margin: 0; color: #ccc; font-size: 12px;">ℹ️ The floating timer can be dragged anywhere on the screen. Position is saved automatically.</p>
                    </div>
                `;

                // Set current values
                setTimeout(() => {
                    const thresholdDropdown = content.querySelector('#chain-threshold-dropdown');
                    const alertsToggle = content.querySelector('#chain-alerts-toggle');
                    const popupToggle = content.querySelector('#chain-popup-toggle');

                    if (thresholdDropdown) {
                        thresholdDropdown.value = this.alertThresholdInSeconds.toString();
                        thresholdDropdown.addEventListener('change', (e) => {
                            this.alertThresholdInSeconds = parseInt(e.target.value);
                            this.saveConfig();
                            this.alertedForCurrentThreshold = false;
                        });
                    }

                    if (alertsToggle) {
                        alertsToggle.checked = this.alertsEnabled;
                        alertsToggle.addEventListener('change', (e) => {
                            this.alertsEnabled = e.target.checked;
                            this.saveConfig();
                            if (!this.alertsEnabled) {
                                this.stopFlashing();
                            }
                        });
                    }

                    if (popupToggle) {
                        popupToggle.checked = this.popupEnabled;
                        popupToggle.addEventListener('change', (e) => {
                            this.popupEnabled = e.target.checked;
                            this.saveConfig();
                        });
                    }
                }, 100);

                this.settingsContent = content;
                return content;
            },

            showFloatingDisplay() {
                if (this.floatingDisplay) return;

                const savedPosition = this.loadDisplayPosition();
                this.floatingDisplay = document.createElement('div');
                this.floatingDisplay.id = 'chain-timer-floating';
                this.floatingDisplay.style.cssText = `position: fixed; left: ${savedPosition.x}px; top: ${savedPosition.y}px; background: rgba(0,0,0,0.8); border: 2px solid #ff9800; border-radius: 8px; padding: 12px 20px; z-index: 9999; cursor: move;`;
                this.floatingDisplay.innerHTML = '<div id="floating-chain-time" style="color: #ff9800; font-size: 20px; font-weight: bold;">--:--</div>';
                
                this.addDragging(this.floatingDisplay);
                document.body.appendChild(this.floatingDisplay);
            },

            hideFloatingDisplay() {
                if (this.floatingDisplay) {
                    this.floatingDisplay.remove();
                    this.floatingDisplay = null;
                }
            },

            addDragging(element) {
                let isDragging = false;
                let startX, startY, initialX, initialY;

                element.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    initialX = element.offsetLeft;
                    initialY = element.offsetTop;
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;
                    element.style.left = (initialX + dx) + 'px';
                    element.style.top = (initialY + dy) + 'px';
                });

                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        this.saveDisplayPosition(element);
                    }
                });
            },

            startMonitoring() {
                if (this.monitorInterval) return;
                this.monitorInterval = setInterval(() => this.monitorChainTimer(), 2000);
            },

            stopMonitoring() {
                if (this.monitorInterval) {
                    clearInterval(this.monitorInterval);
                    this.monitorInterval = null;
                }
            },

            monitorChainTimer() {
                const timerElement = document.querySelector('[class*="bar-timeleft"]');
                
                if (!timerElement) {
                    this.updateDisplays('--:--');
                    return;
                }

                const timerText = timerElement.textContent.trim();

                if (!this.alertsEnabled || timerText === '00:00') {
                    this.stopFlashing();
                    this.alertedForCurrentThreshold = false;
                    this.updateDisplays(timerText);
                    return;
                }

                const [min, sec] = timerText.split(':').map(part => parseInt(part, 10));
                
                if (isNaN(min) || isNaN(sec)) {
                    this.updateDisplays('--:--');
                    return;
                }

                const totalTimeInSeconds = min * 60 + sec;
                this.updateDisplays(timerText);

                if (totalTimeInSeconds < this.alertThresholdInSeconds) {
                    this.triggerAlert();
                } else {
                    this.alertedForCurrentThreshold = false;
                    this.stopFlashing();
                }
            },

            updateDisplays(timeText) {
                if (this.floatingDisplay) {
                    const display = this.floatingDisplay.querySelector('#floating-chain-time');
                    if (display) display.textContent = timeText;
                }
            },

            triggerAlert() {
                if (!this.alertedForCurrentThreshold) {
                    if (this.popupEnabled) {
                        alert(`Chain timer is below ${this.alertThresholdInSeconds / 60} minutes!`);
                    }
                    this.alertedForCurrentThreshold = true;
                }
                this.startFlashing();
            },

            startFlashing() {
                if (this.flashIntervalId) return;

                this.flashDiv = document.createElement('div');
                this.flashDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: red; opacity: 0; z-index: 9999; pointer-events: none; transition: opacity 0.5s ease-in-out;';
                document.body.appendChild(this.flashDiv);

                let visible = false;
                this.flashIntervalId = setInterval(() => {
                    visible = !visible;
                    this.flashDiv.style.opacity = visible ? '0.5' : '0';
                }, 1000);
            },

            stopFlashing() {
                if (this.flashIntervalId) {
                    clearInterval(this.flashIntervalId);
                    this.flashIntervalId = null;
                }
                if (this.flashDiv) {
                    this.flashDiv.remove();
                    this.flashDiv = null;
                }
            },

            loadConfig() {
                const config = this.core.loadState('chain_timer_config', null);
                if (config) {
                    this.alertThresholdInSeconds = config.alertThreshold || 240;
                    this.alertsEnabled = config.alertsEnabled !== false;
                    this.popupEnabled = config.popupEnabled !== false;
                }
            },

            saveConfig() {
                this.core.saveState('chain_timer_config', {
                    alertThreshold: this.alertThresholdInSeconds,
                    alertsEnabled: this.alertsEnabled,
                    popupEnabled: this.popupEnabled
                });
            },

            loadDisplayPosition() {
                return this.core.loadState('chain_timer_position', { x: 20, y: 100 });
            },

            saveDisplayPosition(element) {
                const x = parseInt(element.style.left) || 20;
                const y = parseInt(element.style.top) || 100;
                this.core.saveState('chain_timer_position', { x, y });
            },

            updateSettingsToggle(isActive) {
                const toggle = document.getElementById('chain-timer-toggle');
                if (toggle && toggle.checked !== isActive) {
                    toggle.checked = isActive;
                }
            }
        };

        if (!window.SidekickModules) {
            window.SidekickModules = {};
        }
        window.SidekickModules.ChainTimer = ChainTimerModule;
        console.log('✅ Chain Timer Module registered');
    });
})();
