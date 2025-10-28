// ==UserScript==
// @name         Sidekick Chain Timer Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Chain timer monitor with alerts - movable floating interface
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
            version: '1.0.0',
            isActive: false,
            timerPanel: null,
            monitorInterval: null,
            flashInterval: null,
            isFlashing: false,
            lastAlertTime: 0,
            
            // Configuration
            config: {
                alertThreshold: 90, // seconds - default 90s
                alertsEnabled: true,
                popupEnabled: true
            },

            init() {
                console.log('⏱️ Initializing Chain Timer Module v1.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Chain Timer');
                    return false;
                }

                // Load saved configuration
                this.loadConfig();
                
                // Check if timer was previously active and restore it
                this.restoreTimerState();
                
                console.log('✅ Chain Timer module initialized successfully');
                return true;
            },

            // Main activation method - called when user toggles Chain Timer switch
            activate() {
                console.log('⏱️ Chain Timer module activation toggled');
                
                if (this.isActive) {
                    this.hideTimerPanel();
                    this.isActive = false;
                    this.core.saveState('chain_timer_active', false);
                    this.updateSettingsToggle(false);
                    return;
                }

                this.showTimerPanel();
                this.isActive = true;
                this.core.saveState('chain_timer_active', true);
                this.updateSettingsToggle(true);
            },

            showTimerPanel() {
                console.log('⏱️ showTimerPanel() called');
                
                if (this.timerPanel) {
                    console.log('⏱️ Panel already exists, not creating duplicate');
                    return;
                }
                
                this.isActive = true;
                this.core.saveState('chain_timer_active', true);
                
                // Load saved panel position
                const savedPosition = this.loadPanelPosition();
                
                // Create timer panel
                this.timerPanel = document.createElement('div');
                this.timerPanel.id = 'chain-timer-panel';
                this.timerPanel.style.cssText = `
                    position: fixed;
                    left: ${savedPosition.x}px;
                    top: ${savedPosition.y}px;
                    background: #2a2a2a;
                    border: 2px solid #ff9800;
                    border-radius: 8px;
                    padding: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    z-index: 9999;
                    user-select: none;
                    min-width: 200px;
                    font-family: Arial, sans-serif;
                `;

                // Build panel content
                this.timerPanel.innerHTML = `
                    <div style="
                        cursor: move;
                        margin-bottom: 10px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid #444;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <span style="font-size: 18px;">⏱️</span>
                        <span style="color: #fff; font-weight: bold; font-size: 14px;">Chain Timer</span>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <label style="color: #ccc; font-size: 12px; display: block; margin-bottom: 4px;">
                            Alert Threshold:
                        </label>
                        <select id="chain-alert-threshold" style="
                            width: 100%;
                            padding: 6px;
                            background: #333;
                            color: #fff;
                            border: 1px solid #555;
                            border-radius: 4px;
                            font-size: 12px;
                            cursor: pointer;
                        ">
                            <option value="60">60 seconds</option>
                            <option value="90" ${this.config.alertThreshold === 90 ? 'selected' : ''}>90 seconds</option>
                            <option value="120" ${this.config.alertThreshold === 120 ? 'selected' : ''}>120 seconds</option>
                            <option value="150" ${this.config.alertThreshold === 150 ? 'selected' : ''}>150 seconds</option>
                            <option value="180" ${this.config.alertThreshold === 180 ? 'selected' : ''}>180 seconds</option>
                            <option value="210" ${this.config.alertThreshold === 210 ? 'selected' : ''}>210 seconds</option>
                            <option value="240" ${this.config.alertThreshold === 240 ? 'selected' : ''}>240 seconds</option>
                            <option value="270" ${this.config.alertThreshold === 270 ? 'selected' : ''}>270 seconds</option>
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                        <label style="color: #ccc; font-size: 12px;">Alerts:</label>
                        <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
                            <input type="checkbox" id="chain-alerts-toggle" ${this.config.alertsEnabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                            <span style="
                                position: absolute;
                                cursor: pointer;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background-color: ${this.config.alertsEnabled ? '#4CAF50' : '#ccc'};
                                transition: .4s;
                                border-radius: 20px;
                            ">
                                <span style="
                                    position: absolute;
                                    content: '';
                                    height: 14px;
                                    width: 14px;
                                    left: ${this.config.alertsEnabled ? '23px' : '3px'};
                                    bottom: 3px;
                                    background-color: white;
                                    transition: .4s;
                                    border-radius: 50%;
                                "></span>
                            </span>
                        </label>
                    </div>
                    
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <label style="color: #ccc; font-size: 12px;">Popup:</label>
                        <label class="switch" style="position: relative; display: inline-block; width: 40px; height: 20px;">
                            <input type="checkbox" id="chain-popup-toggle" ${this.config.popupEnabled ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                            <span style="
                                position: absolute;
                                cursor: pointer;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background-color: ${this.config.popupEnabled ? '#4CAF50' : '#ccc'};
                                transition: .4s;
                                border-radius: 20px;
                            ">
                                <span style="
                                    position: absolute;
                                    content: '';
                                    height: 14px;
                                    width: 14px;
                                    left: ${this.config.popupEnabled ? '23px' : '3px'};
                                    bottom: 3px;
                                    background-color: white;
                                    transition: .4s;
                                    border-radius: 50%;
                                "></span>
                            </span>
                        </label>
                    </div>
                    
                    <div id="chain-timer-status" style="
                        margin-top: 10px;
                        padding-top: 8px;
                        border-top: 1px solid #444;
                        color: #888;
                        font-size: 11px;
                        text-align: center;
                    ">
                        Monitoring...
                    </div>
                `;

                // Add event listeners
                this.attachEventListeners();

                // Add dragging functionality
                this.addDragging(this.timerPanel);

                // Add to page
                document.body.appendChild(this.timerPanel);
                console.log('⏱️ Chain Timer panel created and added to page');
                
                // Start monitoring
                this.startMonitoring();
                
                // Save active state
                this.core.saveState('chain_timer_active', true);
            },

            hideTimerPanel() {
                if (this.timerPanel) {
                    this.timerPanel.remove();
                    this.timerPanel = null;
                }
                
                // Stop monitoring
                this.stopMonitoring();
                
                // Stop any active flashing
                this.stopFlashing();
                
                this.isActive = false;
                this.core.saveState('chain_timer_active', false);
            },

            attachEventListeners() {
                // Alert threshold dropdown
                const thresholdSelect = this.timerPanel.querySelector('#chain-alert-threshold');
                if (thresholdSelect) {
                    thresholdSelect.addEventListener('change', (e) => {
                        this.config.alertThreshold = parseInt(e.target.value);
                        this.saveConfig();
                        console.log('⏱️ Alert threshold changed to:', this.config.alertThreshold);
                    });
                }

                // Alerts toggle
                const alertsToggle = this.timerPanel.querySelector('#chain-alerts-toggle');
                if (alertsToggle) {
                    alertsToggle.addEventListener('change', (e) => {
                        this.config.alertsEnabled = e.target.checked;
                        this.saveConfig();
                        this.updateToggleUI(alertsToggle);
                        console.log('⏱️ Alerts enabled:', this.config.alertsEnabled);
                        
                        // Stop flashing if alerts are disabled
                        if (!this.config.alertsEnabled) {
                            this.stopFlashing();
                        }
                    });
                }

                // Popup toggle
                const popupToggle = this.timerPanel.querySelector('#chain-popup-toggle');
                if (popupToggle) {
                    popupToggle.addEventListener('change', (e) => {
                        this.config.popupEnabled = e.target.checked;
                        this.saveConfig();
                        this.updateToggleUI(popupToggle);
                        console.log('⏱️ Popup enabled:', this.config.popupEnabled);
                    });
                }
            },

            updateToggleUI(toggleInput) {
                const slider = toggleInput.nextElementSibling;
                const knob = slider?.querySelector('span');
                
                if (slider) {
                    slider.style.backgroundColor = toggleInput.checked ? '#4CAF50' : '#ccc';
                }
                
                if (knob) {
                    knob.style.left = toggleInput.checked ? '23px' : '3px';
                }
            },

            addDragging(panel) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };
                let hasMoved = false;
                let startPosition = { x: 0, y: 0 };
                
                const header = panel.querySelector('div');
                
                header.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    hasMoved = false;
                    const rect = panel.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    startPosition.x = rect.left;
                    startPosition.y = rect.top;
                    e.preventDefault();
                    header.style.cursor = 'grabbing';
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    
                    e.preventDefault();
                    
                    const newX = e.clientX - dragOffset.x;
                    const newY = e.clientY - dragOffset.y;
                    
                    // Check if panel has moved significantly
                    const deltaX = Math.abs(newX - startPosition.x);
                    const deltaY = Math.abs(newY - startPosition.y);
                    if (deltaX > 5 || deltaY > 5) {
                        hasMoved = true;
                    }
                    
                    // Keep within viewport bounds
                    const maxX = window.innerWidth - panel.offsetWidth;
                    const maxY = window.innerHeight - panel.offsetHeight;
                    
                    panel.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
                    panel.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
                });
                
                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        header.style.cursor = 'move';
                        
                        if (hasMoved) {
                            this.savePanelPosition(panel);
                        }
                    }
                });
            },

            startMonitoring() {
                console.log('⏱️ Starting chain timer monitoring...');
                
                // Clear any existing interval
                if (this.monitorInterval) {
                    clearInterval(this.monitorInterval);
                }
                
                // Check every second
                this.monitorInterval = setInterval(() => {
                    this.checkChainTimer();
                }, 1000);
            },

            stopMonitoring() {
                console.log('⏱️ Stopping chain timer monitoring...');
                
                if (this.monitorInterval) {
                    clearInterval(this.monitorInterval);
                    this.monitorInterval = null;
                }
            },

            checkChainTimer() {
                // Look for chain timer element on the page
                // Torn typically shows chain info in various places, we need to find the timer
                const chainTimerElement = this.findChainTimerElement();
                
                if (!chainTimerElement) {
                    this.updateStatus('No active chain detected');
                    this.stopFlashing();
                    return;
                }
                
                const timeLeft = this.parseTimeLeft(chainTimerElement.textContent);
                
                if (timeLeft === null) {
                    this.updateStatus('Unable to parse timer');
                    return;
                }
                
                // Update status display
                this.updateStatus(`Chain: ${this.formatTime(timeLeft)}`);
                
                // Check if we should alert
                if (this.config.alertsEnabled && timeLeft <= this.config.alertThreshold && timeLeft > 0) {
                    // Start flashing if not already
                    if (!this.isFlashing) {
                        this.startFlashing();
                        
                        // Show popup if enabled (only once per alert period)
                        if (this.config.popupEnabled && Date.now() - this.lastAlertTime > 30000) {
                            this.showPopupAlert(timeLeft);
                            this.lastAlertTime = Date.now();
                        }
                    }
                } else {
                    // Stop flashing if time is above threshold or chain ended
                    if (this.isFlashing && timeLeft > this.config.alertThreshold) {
                        this.stopFlashing();
                    }
                }
            },

            findChainTimerElement() {
                // Try multiple selectors for chain timer
                // These are common locations on Torn where chain info appears
                
                // Option 1: Chain countdown in sidebar
                let timer = document.querySelector('[class*="chain"] [class*="cooldown"]');
                if (timer) return timer;
                
                // Option 2: Chain bar with time
                timer = document.querySelector('[class*="chain-time"]');
                if (timer) return timer;
                
                // Option 3: Generic timer in chain area
                timer = document.querySelector('[class*="chain"] [class*="time"]');
                if (timer) return timer;
                
                // Option 4: Look for text containing time format
                const timeRegex = /\d{1,2}:\d{2}/;
                const allElements = document.querySelectorAll('[class*="chain"] *');
                for (const el of allElements) {
                    if (timeRegex.test(el.textContent) && !el.querySelector('*')) {
                        return el;
                    }
                }
                
                return null;
            },

            parseTimeLeft(timeString) {
                // Parse time string to seconds
                // Formats: "5:30", "0:45", "10:00", etc.
                const match = timeString.match(/(\d{1,2}):(\d{2})/);
                
                if (!match) return null;
                
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                
                return (minutes * 60) + seconds;
            },

            formatTime(seconds) {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            },

            startFlashing() {
                if (this.isFlashing) return;
                
                console.log('⏱️ Starting screen flash alert');
                this.isFlashing = true;
                
                // Create flash overlay
                const flashOverlay = document.createElement('div');
                flashOverlay.id = 'chain-timer-flash';
                flashOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 0, 0, 0.15);
                    pointer-events: none;
                    z-index: 99999;
                    animation: chainFlash 1s ease-in-out infinite;
                `;
                
                // Add CSS animation
                if (!document.getElementById('chain-flash-style')) {
                    const style = document.createElement('style');
                    style.id = 'chain-flash-style';
                    style.textContent = `
                        @keyframes chainFlash {
                            0%, 100% { opacity: 0; }
                            50% { opacity: 1; }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                document.body.appendChild(flashOverlay);
            },

            stopFlashing() {
                if (!this.isFlashing) return;
                
                console.log('⏱️ Stopping screen flash alert');
                this.isFlashing = false;
                
                const flashOverlay = document.getElementById('chain-timer-flash');
                if (flashOverlay) {
                    flashOverlay.remove();
                }
            },

            showPopupAlert(timeLeft) {
                if (!this.config.popupEnabled) return;
                
                const message = `⚠️ Chain Timer Alert!\n\nTime remaining: ${this.formatTime(timeLeft)}\n\nChain will timeout soon!`;
                alert(message);
            },

            updateStatus(message) {
                if (!this.timerPanel) return;
                
                const statusEl = this.timerPanel.querySelector('#chain-timer-status');
                if (statusEl) {
                    statusEl.textContent = message;
                }
            },

            // Configuration management
            loadConfig() {
                const saved = this.core.loadState('chain_timer_config', null);
                if (saved) {
                    this.config = { ...this.config, ...saved };
                }
                console.log('⏱️ Loaded config:', this.config);
            },

            saveConfig() {
                this.core.saveState('chain_timer_config', this.config);
                console.log('⏱️ Saved config:', this.config);
            },

            // Position management
            loadPanelPosition() {
                const saved = this.core.loadState('chain_timer_position', { x: 20, y: 200 });
                
                // Ensure position is within current viewport
                const maxX = window.innerWidth - 220;
                const maxY = window.innerHeight - 200;
                
                return {
                    x: Math.max(0, Math.min(saved.x, maxX)),
                    y: Math.max(0, Math.min(saved.y, maxY))
                };
            },

            savePanelPosition(panel) {
                const x = parseInt(panel.style.left) || 20;
                const y = parseInt(panel.style.top) || 200;
                
                this.core.saveState('chain_timer_position', { x, y });
                console.log('⏱️ Saved position:', { x, y });
            },

            // Restore state on page load
            restoreTimerState() {
                const wasActive = this.core.loadState('chain_timer_active', false);
                
                if (wasActive) {
                    console.log('⏱️ Restoring previously active timer...');
                    setTimeout(() => {
                        this.showTimerPanel();
                    }, 1000);
                }
            },

            // Settings panel integration
            updateSettingsToggle(isActive) {
                const toggle = document.getElementById('chain-timer-toggle');
                if (toggle && toggle.checked !== isActive) {
                    toggle.checked = isActive;
                    
                    // Update toggle UI
                    const slider = toggle.nextElementSibling;
                    const knob = slider?.querySelector('span');
                    
                    if (slider) {
                        slider.style.backgroundColor = isActive ? '#4CAF50' : '#ccc';
                    }
                    
                    if (knob) {
                        knob.style.left = isActive ? '23px' : '3px';
                    }
                }
            }
        };

        // Register module globally
        if (!window.SidekickModules) {
            window.SidekickModules = {};
        }
        window.SidekickModules.ChainTimer = ChainTimerModule;
        
        console.log('⏱️ Chain Timer module loaded and ready');
    });
})();
