// ==UserScript==
// @name         Sidekick Timer Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Timer module for Torn cooldowns and custom timers - modular approach
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
        const TimerModule = {
            name: 'Timer',
            version: '1.0.0',
            isActive: false,
            timers: [],
            cooldownData: null,
            updateInterval: null,
            
            // Timer types
            timerTypes: {
                MEDICAL: 'medical',
                DRUG: 'drug',
                BOOSTER: 'booster',
                CUSTOM: 'custom'
            },

            init() {
                console.log('⏰ Initializing Timer Module v1.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Timer');
                    return false;
                }

                // Load saved timers
                this.loadState();
                
                // Start update loop
                this.startUpdateLoop();
                
                console.log('✅ Timer module initialized successfully');
                return true;
            },

            // Main activation method - called when user clicks Timer button
            activate() {
                console.log('⏰ Timer module activated!');
                
                if (this.isActive) {
                    this.hideTimerPanel();
                    return;
                }

                this.showTimerPanel();
            },

            showTimerPanel() {
                if (document.getElementById('timer-panel')) return;
                
                this.isActive = true;
                
                // Create timer panel in sidebar style
                const panel = document.createElement('div');
                panel.id = 'timer-panel';
                panel.className = 'sidebar-item';
                panel.style.cssText = `
                    position: absolute;
                    left: 10px;
                    top: 10px;
                    width: 280px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    min-width: 200px;
                    min-height: 100px;
                    z-index: 1000;
                    resize: both;
                    overflow: hidden;
                `;

                panel.innerHTML = `
                    <div class="timer-header" style="
                        background: #333;
                        border-bottom: 1px solid #555;
                        padding: 8px 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: move;
                        height: 32px;
                        flex-shrink: 0;
                        border-radius: 7px 7px 0 0;
                    ">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 16px;">⏰</span>
                            <span style="font-weight: bold; color: #4CAF50;">Timer Panel</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <button id="refresh-cooldowns" style="
                                background: #FF9800;
                                border: none;
                                color: white;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 11px;
                                display: flex;
                                align-items: center;
                                gap: 4px;
                            " title="Refresh Cooldowns">
                                🔄 Refresh
                            </button>
                            <div class="timer-dropdown" style="position: relative; display: inline-block;">
                                <button class="dropdown-btn" style="
                                    background: #2196F3;
                                    border: none;
                                    color: white;
                                    padding: 4px 8px;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 11px;
                                    display: flex;
                                    align-items: center;
                                    gap: 4px;
                                " title="Add Timer">
                                    + Add Timer
                                    <span style="font-size: 10px;">▼</span>
                                </button>
                                <div class="dropdown-content" style="
                                    display: none;
                                    position: absolute;
                                    background: #333;
                                    min-width: 140px;
                                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                                    z-index: 1001;
                                    border-radius: 4px;
                                    border: 1px solid #555;
                                    top: 100%;
                                    right: 0;
                                    margin-top: 4px;
                                ">
                                    <button class="timer-add-btn" data-type="medical" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                    ">🏥 Medical Cooldown</button>
                                    <button class="timer-add-btn" data-type="drug" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                    ">💊 Drug Cooldown</button>
                                    <button class="timer-add-btn" data-type="booster" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                    ">💉 Booster Cooldown</button>
                                    <button class="timer-add-btn" data-type="custom" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                    ">⏱️ Custom Timer</button>
                                </div>
                            </div>
                            <button id="timer-close-btn" style="
                                background: none;
                                border: none;
                                color: #f44336;
                                cursor: pointer;
                                font-size: 18px;
                                padding: 0;
                                width: 20px;
                                height: 20px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                opacity: 0.7;
                            " title="Close timer panel">×</button>
                        </div>
                    </div>
                    
                    <div style="padding: 12px; flex: 1; overflow-y: auto;">
                        <div id="timers-container">
                            <div style="text-align: center; color: #888; padding: 20px; font-size: 12px;">
                                No timers added yet. Click "Add Timer" to add one.
                            </div>
                        </div>
                    </div>
                `;

                // Add to sidebar content area
                const sidebar = document.getElementById('sidekick-sidebar');
                if (sidebar) {
                    sidebar.appendChild(panel);
                } else {
                    document.body.appendChild(panel);
                }
                
                // Add event listeners
                this.addPanelEventListeners();
                
                // Load existing timers
                this.renderTimers();
                
                // Fetch current cooldown data
                this.fetchCooldownData();
                
                // Add dragging functionality
                this.addDragging(panel);
            },

            hideTimerPanel() {
                const panel = document.getElementById('timer-panel');
                if (panel) {
                    panel.remove();
                }
                this.isActive = false;
            },

            addDragging(panel) {
                const header = panel.querySelector('.timer-header');
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };
                
                header.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    const rect = panel.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    e.preventDefault();
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { left: 0, top: 0 };
                    
                    let newX = e.clientX - sidebarRect.left - dragOffset.x;
                    let newY = e.clientY - sidebarRect.top - dragOffset.y;
                    
                    // Keep within sidebar bounds
                    if (sidebar) {
                        newX = Math.max(0, Math.min(newX, sidebar.offsetWidth - panel.offsetWidth));
                        newY = Math.max(0, Math.min(newY, sidebar.offsetHeight - panel.offsetHeight));
                    }
                    
                    panel.style.left = newX + 'px';
                    panel.style.top = newY + 'px';
                });
                
                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        this.savePanelPosition(panel);
                    }
                });
            },

            savePanelPosition(panel) {
                const position = {
                    x: parseInt(panel.style.left) || 10,
                    y: parseInt(panel.style.top) || 10,
                    width: panel.offsetWidth,
                    height: panel.offsetHeight
                };
                this.core.saveState('timer_panel_position', position);
            },

            loadPanelPosition() {
                try {
                    const position = this.core.loadState('timer_panel_position', { x: 10, y: 10, width: 280, height: 200 });
                    return position;
                } catch (error) {
                    return { x: 10, y: 10, width: 280, height: 200 };
                }
            },

            addPanelEventListeners() {
                const panel = document.getElementById('timer-panel');
                if (!panel) return;

                // Close button
                panel.querySelector('#timer-close-btn').addEventListener('click', () => {
                    this.hideTimerPanel();
                });

                // Refresh cooldowns button
                panel.querySelector('#refresh-cooldowns').addEventListener('click', () => {
                    this.fetchCooldownData();
                    this.core.NotificationSystem.show(
                        'Timer',
                        'Refreshing cooldown data...',
                        'info'
                    );
                });

                // Add timer buttons
                panel.querySelectorAll('.timer-add-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const type = e.target.dataset.type;
                        this.addTimer(type);
                        // Close dropdown after selection
                        const dropdownContent = panel.querySelector('.dropdown-content');
                        if (dropdownContent) dropdownContent.style.display = 'none';
                    });
                    
                    // Hover effects
                    btn.addEventListener('mouseenter', () => {
                        btn.style.background = '#555';
                    });
                    btn.addEventListener('mouseleave', () => {
                        btn.style.background = 'none';
                    });
                });

                // Dropdown button
                const dropdownBtn = panel.querySelector('.dropdown-btn');
                const dropdownContent = panel.querySelector('.dropdown-content');

                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                        dropdownContent.style.display = 'none';
                    }
                });
            },

            addTimer(type) {
                if (type === this.timerTypes.CUSTOM) {
                    this.showCustomTimerDialog();
                    return;
                }

                // Check if timer of this type already exists
                if (this.timers.some(t => t.type === type)) {
                    this.core.NotificationSystem.show(
                        'Timer',
                        `Only one ${type} timer allowed per page`,
                        'warning'
                    );
                    return;
                }

                // Create cooldown timer
                this.createCooldownTimer(type);
            },

            showCustomTimerDialog() {
                const dialog = document.createElement('div');
                dialog.id = 'custom-timer-dialog';
                dialog.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
                    color: white;
                    padding: 20px;
                    border-radius: 12px;
                    font-family: 'Segoe UI', sans-serif;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                    border: 1px solid #444;
                    z-index: 1000000;
                    min-width: 300px;
                `;

                dialog.innerHTML = `
                    <h4 style="margin: 0 0 15px 0; color: #2196F3;">⏱️ Custom Timer</h4>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Timer Name:</label>
                        <input type="text" id="custom-timer-name" placeholder="e.g., Gym Session" 
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px;">Duration (minutes):</label>
                        <input type="number" id="custom-timer-duration" min="1" value="60"
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white;">
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="custom-timer-start" style="flex: 1; padding: 10px; background: #4CAF50; border: none; border-radius: 4px; color: white; cursor: pointer;">
                            Start Timer
                        </button>
                        <button id="custom-timer-cancel" style="flex: 1; padding: 10px; background: #666; border: none; border-radius: 4px; color: white; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                `;

                document.body.appendChild(dialog);

                // Add event listeners
                const startBtn = dialog.querySelector('#custom-timer-start');
                const cancelBtn = dialog.querySelector('#custom-timer-cancel');
                const nameInput = dialog.querySelector('#custom-timer-name');
                const durationInput = dialog.querySelector('#custom-timer-duration');

                startBtn.addEventListener('click', () => {
                    const name = nameInput.value.trim();
                    const duration = parseInt(durationInput.value);
                    
                    if (!name || duration < 1) {
                        this.core.NotificationSystem.show(
                            'Timer',
                            'Please enter a valid name and duration',
                            'warning'
                        );
                        return;
                    }

                    this.createCustomTimer(name, duration);
                    dialog.remove();
                });

                cancelBtn.addEventListener('click', () => {
                    dialog.remove();
                });

                // Focus on name input
                nameInput.focus();
            },

            createCooldownTimer(type) {
                // Check if we have cooldown data for this type
                if (!this.cooldownData || !this.cooldownData[type]) {
                    this.core.NotificationSystem.show(
                        'Timer',
                        `No cooldown data available for ${type}. Please refresh cooldowns first.`,
                        'warning'
                    );
                    return;
                }

                const timer = {
                    id: 'timer-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    type: type,
                    name: this.getTimerDisplayName(type),
                    startTime: Date.now(),
                    endTime: this.cooldownData[type],
                    duration: this.getCooldownDuration(type),
                    isActive: true,
                    isCooldown: true
                };

                this.timers.push(timer);
                this.saveState();
                this.renderTimers();
                
                this.core.NotificationSystem.show(
                    'Timer',
                    `${timer.name} timer added! Cooldown ends in ${this.formatTime(this.cooldownData[type] - Date.now())}`,
                    'success'
                );
            },

            createCustomTimer(name, durationMinutes) {
                const timer = {
                    id: 'timer-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    type: this.timerTypes.CUSTOM,
                    name: name,
                    startTime: Date.now(),
                    endTime: Date.now() + (durationMinutes * 60 * 1000),
                    duration: durationMinutes * 60 * 1000,
                    isActive: true,
                    isCooldown: false
                };

                this.timers.push(timer);
                this.saveState();
                this.renderTimers();
                
                this.core.NotificationSystem.show(
                    'Timer',
                    `Custom timer "${name}" started for ${durationMinutes} minutes!`,
                    'success'
                );
            },

            getTimerDisplayName(type) {
                const names = {
                    [this.timerTypes.MEDICAL]: '🏥 Medical Cooldown',
                    [this.timerTypes.DRUG]: '💊 Drug Cooldown',
                    [this.timerTypes.BOOSTER]: '💉 Booster Cooldown',
                    [this.timerTypes.CUSTOM]: '⏱️ Custom Timer'
                };
                return names[type] || type;
            },

            renderTimers() {
                const container = document.getElementById('timers-container');
                if (!container) return;

                if (this.timers.length === 0) {
                    container.innerHTML = `
                        <div style="text-align: center; color: #888; padding: 20px; font-size: 12px;">
                            No timers added yet. Click "Add Timer" to add one.
                        </div>
                    `;
                    return;
                }

                container.innerHTML = this.timers.map(timer => this.renderTimer(timer)).join('');
                
                // Add event listeners to timer elements
                this.addTimerEventListeners();
            },

            renderTimer(timer) {
                const timeLeft = this.getTimeLeft(timer);
                const progress = this.getProgress(timer);
                const isExpired = timeLeft <= 0;
                
                // If only one timer, show full detailed view
                if (this.timers.length === 1) {
                    return `
                        <div class="timer-item" data-timer-id="${timer.id}" style="
                            background: linear-gradient(135deg, #2d2d2d, #3d3d3d);
                            border: 1px solid #555;
                            border-radius: 8px;
                            padding: 12px;
                            margin-bottom: 10px;
                            position: relative;
                            overflow: hidden;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div>
                                    <strong style="color: #4CAF50; font-size: 13px;">${timer.name}</strong>
                                    <div style="font-size: 11px; color: #888; margin-top: 2px;">
                                        ${timer.isCooldown ? 'Cooldown Timer' : 'Custom Timer'}
                                    </div>
                                </div>
                                <button class="remove-timer-btn" data-timer-id="${timer.id}" style="
                                    background: #f44336;
                                    border: none;
                                    border-radius: 4px;
                                    color: white;
                                    padding: 3px 6px;
                                    font-size: 11px;
                                    cursor: pointer;
                                ">Remove</button>
                            </div>
                            
                            <div style="margin-bottom: 8px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                                    <span style="font-size: 11px; color: #888;">Progress</span>
                                    <span style="font-size: 11px; color: #888;">${Math.round(progress * 100)}%</span>
                                </div>
                                <div style="
                                    width: 100%;
                                    height: 4px;
                                    background: #555;
                                    border-radius: 2px;
                                    overflow: hidden;
                                ">
                                    <div style="
                                        width: ${progress * 100}%;
                                        height: 100%;
                                        background: ${isExpired ? '#4CAF50' : '#2196F3'};
                                        transition: width 0.3s ease;
                                    "></div>
                                </div>
                            </div>
                            
                            <div style="text-align: center;">
                                <div style="
                                    font-size: 16px;
                                    font-weight: bold;
                                    color: ${isExpired ? '#4CAF50' : '#FF9800'};
                                    font-family: 'Courier New', monospace;
                                ">${this.formatTime(timeLeft)}</div>
                                <div style="font-size: 10px; color: #888; margin-top: 2px;">
                                    ${isExpired ? 'Ready!' : 'Time remaining'}
                                </div>
                            </div>
                        </div>
                    `;
                }
                
                // If multiple timers, show compact view
                return `
                    <div class="timer-item" data-timer-id="${timer.id}" style="
                        background: #333;
                        border: 1px solid #555;
                        border-radius: 6px;
                        padding: 8px;
                        margin-bottom: 6px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                            <span style="font-size: 14px;">${this.getTimerIcon(timer.type)}</span>
                            <div>
                                <div style="font-size: 12px; color: #fff; font-weight: bold;">${timer.name}</div>
                                <div style="font-size: 10px; color: #888;">${this.formatTime(timeLeft)}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="
                                width: 40px;
                                height: 4px;
                                background: #555;
                                border-radius: 2px;
                                overflow: hidden;
                            ">
                                <div style="
                                    width: ${progress * 100}%;
                                    height: 100%;
                                    background: ${isExpired ? '#4CAF50' : '#2196F3'};
                                    transition: width 0.3s ease;
                                "></div>
                            </div>
                            <button class="remove-timer-btn" data-timer-id="${timer.id}" style="
                                background: #f44336;
                                border: none;
                                border-radius: 3px;
                                color: white;
                                padding: 2px 4px;
                                font-size: 10px;
                                cursor: pointer;
                                min-width: 20px;
                            ">×</button>
                        </div>
                    </div>
                `;
            },

            getTimerIcon(type) {
                const icons = {
                    [this.timerTypes.MEDICAL]: '🏥',
                    [this.timerTypes.DRUG]: '💊',
                    [this.timerTypes.BOOSTER]: '💉',
                    [this.timerTypes.CUSTOM]: '⏱️'
                };
                return icons[type] || '⏰';
            },

            addTimerEventListeners() {
                document.querySelectorAll('.remove-timer-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const timerId = e.target.dataset.timerId;
                        this.removeTimer(timerId);
                    });
                });
            },

            removeTimer(timerId) {
                this.timers = this.timers.filter(t => t.id !== timerId);
                this.saveState();
                this.renderTimers();
                
                this.core.NotificationSystem.show(
                    'Timer',
                    'Timer removed!',
                    'info'
                );
            },

            getTimeLeft(timer) {
                if (timer.isCooldown) {
                    // For cooldowns, we need to calculate based on cooldown data
                    if (this.cooldownData && this.cooldownData[timer.type]) {
                        const cooldownEnd = this.cooldownData[timer.type];
                        return Math.max(0, cooldownEnd - Date.now());
                    }
                    return 0;
                } else {
                    // For custom timers, calculate based on end time
                    return Math.max(0, timer.endTime - Date.now());
                }
            },

            getProgress(timer) {
                if (timer.isCooldown) {
                    // For cooldowns, we need cooldown data
                    if (this.cooldownData && this.cooldownData[timer.type]) {
                        const cooldownEnd = this.cooldownData[timer.type];
                        const cooldownStart = cooldownEnd - this.getCooldownDuration(timer.type);
                        const total = cooldownEnd - cooldownStart;
                        const elapsed = Date.now() - cooldownStart;
                        return Math.min(1, Math.max(0, elapsed / total));
                    }
                    return 0;
                } else {
                    // For custom timers, calculate based on duration
                    const elapsed = timer.duration - this.getTimeLeft(timer);
                    return Math.min(1, Math.max(0, elapsed / timer.duration));
                }
            },

            getCooldownDuration(type) {
                // Default cooldown durations in milliseconds (can be updated via API)
                const durations = {
                    [this.timerTypes.MEDICAL]: 2 * 60 * 60 * 1000, // 2 hours
                    [this.timerTypes.DRUG]: 1 * 60 * 60 * 1000,    // 1 hour
                    [this.timerTypes.BOOSTER]: 3 * 60 * 60 * 1000  // 3 hours
                };
                return durations[type] || 0;
            },

            formatTime(milliseconds) {
                if (milliseconds <= 0) return '00:00:00';
                
                const hours = Math.floor(milliseconds / (1000 * 60 * 60));
                const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
                
                return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            },

            async fetchCooldownData() {
                try {
                    // Fetch cooldown data from Torn API
                    const apiKey = this.core.getApiKey();
                    if (!apiKey) {
                        console.warn('No API key available for cooldown data');
                        return;
                    }

                    const response = await fetch(`https://api.torn.com/user/?selections=cooldowns&key=${apiKey}`);
                    const data = await response.json();
                    
                    if (data.error) {
                        console.warn('Failed to fetch cooldown data:', data.error);
                        return;
                    }
                    
                    console.log('📊 Raw cooldown data:', data.cooldowns);
                    
                    // Convert cooldown seconds to end timestamps
                    this.cooldownData = {
                        [this.timerTypes.MEDICAL]: data.cooldowns?.medical ? Date.now() + (data.cooldowns.medical * 1000) : null,
                        [this.timerTypes.DRUG]: data.cooldowns?.drug ? Date.now() + (data.cooldowns.drug * 1000) : null,
                        [this.timerTypes.BOOSTER]: data.cooldowns?.booster ? Date.now() + (data.cooldowns.booster * 1000) : null
                    };
                    
                    console.log('📊 Processed cooldown data:', this.cooldownData);
                    
                    // Update timers display
                    if (this.isActive) {
                        this.renderTimers();
                    }
                } catch (error) {
                    console.error('❌ Error fetching cooldown data:', error);
                }
            },

            startUpdateLoop() {
                // Update every second
                this.updateInterval = setInterval(() => {
                    if (this.isActive && this.timers.length > 0) {
                        this.renderTimers();
                    }
                }, 1000);
            },

            stopUpdateLoop() {
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                    this.updateInterval = null;
                }
            },

            // State management
            saveState() {
                try {
                    const state = {
                        timers: this.timers.map(timer => ({
                            ...timer,
                            // Don't save DOM references
                            element: null
                        }))
                    };
                    
                    this.core.saveState('timer_state', state);
                    console.log('💾 Timer state saved');
                } catch (error) {
                    console.error('❌ Failed to save timer state:', error);
                }
            },

            loadState() {
                try {
                    const state = this.core.loadState('timer_state', { timers: [] });
                    this.timers = state.timers || [];
                    console.log('📂 Restored timer state:', this.timers.length, 'timers');
                } catch (error) {
                    console.error('❌ Failed to load timer state:', error);
                }
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.Timer = TimerModule;

        console.log('⏰ Timer module registered globally');
        console.log('🔍 Timer module check:', {
            'SidekickModules exists': !!window.SidekickModules,
            'Timer exists': !!window.SidekickModules.Timer,
            'Timer.activate exists': !!window.SidekickModules.Timer?.activate,
            'Available modules': Object.keys(window.SidekickModules)
        });

        // Fallback registration - ensure module is available
        setTimeout(() => {
            if (!window.SidekickModules.Timer) {
                console.warn('⚠️ Timer not found, re-registering...');
                window.SidekickModules.Timer = TimerModule;
                console.log('✅ Timer re-registered');
            }
        }, 1000);
    });
})();
