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
                
                // Check if panel was previously open and restore it
                this.restorePanelState();
                
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
                
                // Load saved panel position
                const savedPosition = this.loadPanelPosition();
                
                // Create timer panel in sidebar style
                const panel = document.createElement('div');
                panel.id = 'timer-panel';
                panel.className = 'sidebar-item';
                panel.style.cssText = `
                    position: absolute;
                    left: ${savedPosition.x}px;
                    top: ${savedPosition.y}px;
                    width: ${savedPosition.width}px;
                    height: ${savedPosition.height}px;
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
                        padding: 4px 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: move;
                        height: 24px;
                        flex-shrink: 0;
                        border-radius: 7px 7px 0 0;
                    ">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 14px;">⏰</span>
                            <span style="font-weight: bold; color: #4CAF50; font-size: 12px;">Timer Panel</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div class="timer-dropdown" style="position: relative; display: inline-block;">
                                <button class="dropdown-btn" style="
                                    background: none;
                                    border: none;
                                    color: #bbb;
                                    cursor: pointer;
                                    font-size: 12px;
                                    padding: 2px;
                                    display: flex;
                                    align-items: center;
                                " title="Options">
                                    ▼
                                </button>
                                <div class="dropdown-content" style="
                                    display: none;
                                    position: fixed;
                                    background: #333;
                                    min-width: 160px;
                                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                                    z-index: 100000;
                                    border-radius: 4px;
                                    border: 1px solid #555;
                                    padding: 4px 0;
                                ">
                                    <button id="refresh-cooldowns" style="
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
                                        transition: background 0.2s ease;
                                    " title="Refresh Cooldowns">🔄 Refresh Cooldowns</button>
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
                                        transition: background 0.2s ease;
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
                                        transition: background 0.2s ease;
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
                                        transition: background 0.2s ease;
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
                                        transition: background 0.2s ease;
                                    ">⏱️ Custom Timer</button>
                                </div>
                            </div>
                            <button id="timer-close-btn" style="
                                background: none;
                                border: none;
                                color: #f44336;
                                cursor: pointer;
                                font-size: 14px;
                                padding: 0;
                                width: 16px;
                                height: 16px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                opacity: 0.7;
                            " title="Close timer panel">×</button>
                        </div>
                    </div>
                    
                    <div style="padding: 12px; flex: 1; overflow-y: auto;">
                        <div id="timers-container">
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
                
                // Fetch current cooldown data immediately
                this.fetchCooldownData();
                
                // Add dragging functionality
                this.addDragging(panel);
                
                // Save panel open state
                window.SidekickModules.Core.saveState('timer_panel_open', true);
            },

            hideTimerPanel() {
                const panel = document.getElementById('timer-panel');
                if (panel) {
                    panel.remove();
                }
                this.isActive = false;
                
                // Save panel closed state
                window.SidekickModules.Core.saveState('timer_panel_open', false);
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
                window.SidekickModules.Core.saveState('timer_panel_position', position);
            },

            loadPanelPosition() {
                try {
                    const position = window.SidekickModules.Core.loadState('timer_panel_position', { x: 10, y: 10, width: 280, height: 200 });
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

                // Refresh cooldowns button (now inside dropdown)
                panel.querySelector('#refresh-cooldowns').addEventListener('click', () => {
                    window.SidekickModules.Core.NotificationSystem.show(
                        'Timer',
                        'Refreshing cooldown data...',
                        'info'
                    );
                    this.fetchCooldownData().then(() => {
                        if (this.cooldownData) {
                            const activeCooldowns = Object.values(this.cooldownData).filter(time => time !== null).length;
                            window.SidekickModules.Core.NotificationSystem.show(
                                'Timer',
                                `Found ${activeCooldowns} active cooldown(s)!`,
                                'success'
                            );
                        }
                    });
                    // Close dropdown after action
                    const dropdownContent = panel.querySelector('.dropdown-content');
                    if (dropdownContent) dropdownContent.style.display = 'none';
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
                        btn.style.background = '#444';
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
                    const isVisible = dropdownContent.style.display === 'block';
                    
                    if (isVisible) {
                        dropdownContent.style.display = 'none';
                    } else {
                        // Position dropdown dynamically
                        const btnRect = dropdownBtn.getBoundingClientRect();
                        const panelRect = panel.getBoundingClientRect();
                        
                        // Calculate position to ensure dropdown is always visible
                        let left = btnRect.left;
                        let top = btnRect.bottom + 4;
                        
                        // Check if dropdown would go off the right edge
                        if (left + 160 > window.innerWidth) {
                            left = window.innerWidth - 160 - 10;
                        }
                        
                        // Check if dropdown would go off the bottom edge
                        if (top + 200 > window.innerHeight) {
                            top = btnRect.top - 200 - 4;
                        }
                        
                        dropdownContent.style.left = left + 'px';
                        dropdownContent.style.top = top + 'px';
                        dropdownContent.style.display = 'block';
                    }
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                        dropdownContent.style.display = 'none';
                    }
                });

                // Add hover effect for refresh button
                const refreshBtn = panel.querySelector('#refresh-cooldowns');
                if (refreshBtn) {
                    refreshBtn.addEventListener('mouseenter', () => {
                        refreshBtn.style.background = '#444';
                    });
                    refreshBtn.addEventListener('mouseleave', () => {
                        refreshBtn.style.background = 'none';
                    });
                }
            },

            addTimer(type) {
                console.log(`➕ Adding timer for type: ${type}`);
                console.log(`➕ Current timers before adding:`, this.timers.length);
                
                if (type === this.timerTypes.CUSTOM) {
                    this.showCustomTimerDialog();
                    return;
                }

                // Check if timer of this type already exists
                if (this.timers.some(t => t.type === type)) {
                    window.SidekickModules.Core.NotificationSystem.show(
                        'Timer',
                        `Timer for ${type} already exists`,
                        'info'
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
                        window.SidekickModules.Core.NotificationSystem.show(
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
                console.log(`🔍 Creating cooldown timer for type: ${type}`);
                console.log(`🔍 Current cooldown data:`, this.cooldownData);
                console.log(`🔍 Current timers before creating:`, this.timers.length);
                
                // Check if we have cooldown data for this type
                if (!this.cooldownData || !this.cooldownData[type]) {
                    console.log(`❌ No cooldown data for ${type}`);
                    // Try to fetch fresh data first
                    window.SidekickModules.Core.NotificationSystem.show(
                        'Timer',
                        `No cooldown data for ${type}. Fetching fresh data...`,
                        'info'
                    );
                    
                    // Fetch fresh data and then try again
                    this.fetchCooldownData().then(() => {
                        console.log(`🔄 After fetching, cooldown data:`, this.cooldownData);
                        if (this.cooldownData && this.cooldownData[type]) {
                            this.createCooldownTimer(type);
                        } else {
                            window.SidekickModules.Core.NotificationSystem.show(
                                'Timer',
                                `No active ${type} cooldown found. You can only add timers for active cooldowns.`,
                                'error'
                            );
                        }
                    });
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

                console.log(`⏰ Created timer:`, timer);
                console.log(`⏰ Timers array after push:`, this.timers.length);

                this.timers.push(timer);
                this.saveState();
                this.renderTimers();
                
                window.SidekickModules.Core.NotificationSystem.show(
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
                
                window.SidekickModules.Core.NotificationSystem.show(
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

                console.log('🔄 Rendering timers:', this.timers.length, 'timers');

                if (this.timers.length === 0) {
                    container.innerHTML = '';
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
                
                window.SidekickModules.Core.NotificationSystem.show(
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
                    const apiKey = window.SidekickModules.Core.loadState('sidekick_api_key', '');
                    if (!apiKey) {
                        console.warn('No API key available for cooldown data');
                        window.SidekickModules.Core.NotificationSystem.show(
                            'Timer',
                            'No API key found. Please set your API key in settings first.',
                            'warning'
                        );
                        return;
                    }

                    console.log('🔄 Fetching cooldown data from Torn API...');
                    
                    // First test if API key is working by checking user profile
                    try {
                        const testResponse = await fetch(`https://api.torn.com/user/?selections=basic&key=${apiKey}`);
                        const testData = await testResponse.json();
                        if (testData.error) {
                            console.warn('API key test failed:', testData.error);
                            window.SidekickModules.Core.NotificationSystem.show(
                                'Timer',
                                `API Key Error: ${testData.error}. Please check your API key in settings.`,
                                'error'
                            );
                            return;
                        }
                        console.log('✅ API key is working, user:', testData.name || 'Unknown');
                    } catch (testError) {
                        console.warn('Failed to test API key:', testError);
                    }
                    
                    // Try the correct Torn API endpoint for cooldowns
                    let response = await fetch(`https://api.torn.com/user/?selections=cooldowns&key=${apiKey}`);
                    let data = await response.json();
                    
                    if (data.error) {
                        console.warn('Failed to fetch cooldown data from primary endpoint:', data.error);
                        
                        // Try alternative endpoint as fallback
                        console.log('🔄 Trying alternative API endpoint...');
                        response = await fetch(`https://api.torn.com/user/?selections=cooldowns&key=${apiKey}`);
                        data = await response.json();
                        
                        if (data.error) {
                            console.warn('Failed to fetch cooldown data from fallback endpoint:', data.error);
                            window.SidekickModules.Core.NotificationSystem.show(
                                'Timer',
                                `API Error: ${data.error}`,
                                'error'
                            );
                            return;
                        }
                    }
                    
                    console.log('📊 Raw cooldown data:', data.cooldowns);
                    console.log('📊 Full API response:', data);
                    
                    // Check if we have any cooldown data
                    if (!data.cooldowns || Object.keys(data.cooldowns).length === 0) {
                        console.log('📊 No active cooldowns found');
                        this.cooldownData = {
                            [this.timerTypes.MEDICAL]: null,
                            [this.timerTypes.DRUG]: null,
                            [this.timerTypes.BOOSTER]: null
                        };
                    } else {
                        // Convert cooldown seconds to end timestamps
                        // Note: API returns seconds remaining, so we add to current time
                        this.cooldownData = {
                            [this.timerTypes.MEDICAL]: data.cooldowns.medical && data.cooldowns.medical > 0 ? Date.now() + (data.cooldowns.medical * 1000) : null,
                            [this.timerTypes.DRUG]: data.cooldowns.drug && data.cooldowns.drug > 0 ? Date.now() + (data.cooldowns.drug * 1000) : null,
                            [this.timerTypes.BOOSTER]: data.cooldowns.booster && data.cooldowns.booster > 0 ? Date.now() + (data.cooldowns.booster * 1000) : null
                        };
                        
                        // Log each cooldown type for debugging
                        console.log('🏥 Medical cooldown:', data.cooldowns.medical, 'seconds remaining');
                        console.log('💊 Drug cooldown:', data.cooldowns.drug, 'seconds remaining');
                        console.log('💉 Booster cooldown:', data.cooldowns.booster, 'seconds remaining');
                    }
                    
                    console.log('📊 Processed cooldown data:', this.cooldownData);
                    
                    // Show success notification
                    const activeCooldowns = Object.values(this.cooldownData).filter(time => time !== null).length;
                    if (activeCooldowns > 0) {
                        window.SidekickModules.Core.NotificationSystem.show(
                            'Timer',
                            `Found ${activeCooldowns} active cooldown(s)!`,
                            'success'
                        );
                    } else {
                        window.SidekickModules.Core.NotificationSystem.show(
                            'Timer',
                            'No active cooldowns found.',
                            'info'
                        );
                    }
                    
                    // Update timers display
                    if (this.isActive) {
                        this.renderTimers();
                    }
                } catch (error) {
                    console.error('❌ Error fetching cooldown data:', error);
                    window.SidekickModules.Core.NotificationSystem.show(
                        'Timer',
                        `Failed to fetch cooldown data: ${error.message}`,
                        'error'
                    );
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
                    
                    console.log('💾 Saving timer state:', state);
                    window.SidekickModules.Core.saveState('timer_state', state);
                    console.log('💾 Timer state saved successfully');
                } catch (error) {
                    console.error('❌ Failed to save timer state:', error);
                }
            },

            loadState() {
                try {
                    const state = window.SidekickModules.Core.loadState('timer_state', { timers: [] });
                    console.log('📂 Loaded timer state from storage:', state);
                    this.timers = state.timers || [];
                    console.log('📂 Restored timer state:', this.timers.length, 'timers');
                } catch (error) {
                    console.error('❌ Failed to load timer state:', error);
                }
            },

            restorePanelState() {
                try {
                    const wasOpen = window.SidekickModules.Core.loadState('timer_panel_open', false);
                    if (wasOpen) {
                        console.log('🔄 Restoring timer panel state...');
                        // Small delay to ensure DOM is ready
                        setTimeout(() => {
                            this.showTimerPanel();
                        }, 500);
                    }
                } catch (error) {
                    console.error('❌ Failed to restore panel state:', error);
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
