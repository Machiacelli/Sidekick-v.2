// ==UserScript==
// @name         Sidekick Timer Module - Optimized
// @namespace    http://tampermonkey.net/
// @version      1.2.0-optimized
// @description  Timer module with optimized loading and real-time updates
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @require      none
// ==/UserScript==

(function() {
    'use strict';

    // Wait for core module to be available
    function waitForCore(callback) {
        if (window.SidekickModules?.Core) {
            callback();
        } else {
            setTimeout(() => waitForCore(callback), 50); // Reduced from 100ms for faster loading
        }
    }

    waitForCore(() => {
        const TimerModule = {
            name: 'Timer',
            version: '1.2.0-optimized',
            isActive: false,
            core: null,
            cooldowns: [],
            customTimers: [],
            refreshInterval: null,
            realTimeInterval: null, // New: separate interval for real-time updates
            isPinned: false,
            
            // Cache for API data to reduce loading times
            cooldownCache: {
                data: null,
                timestamp: 0,
                ttl: 30000 // 30 seconds cache
            },

            init() {
                console.log('⏱️ Initializing Timer Module v1.2.0-optimized...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Timer');
                    return false;
                }

                // Pre-load state immediately for faster activation
                this.loadState();
                
                // Pre-cache cooldown data for instant display
                this.preCacheCooldowns();
                
                console.log('✅ Timer module initialized successfully');
                return true;
            },

            // Pre-cache cooldown data for instant loading
            preCacheCooldowns() {
                this.getCooldowns().then(cooldowns => {
                    this.cooldownCache.data = cooldowns;
                    this.cooldownCache.timestamp = Date.now();
                    console.log('⚡ Timer data pre-cached for instant loading');
                }).catch(error => {
                    console.warn('⚠️ Pre-cache failed, will load on demand:', error);
                });
            },

            activate() {
                console.log('⏱️ Timer module activated!');
                
                if (this.isActive) {
                    this.hideTimerPanel();
                    return;
                }

                // Show panel immediately, load data after
                this.showTimerPanel();
            },

            showTimerPanel() {
                if (this.isActive) return;
                
                console.log('⏱️ Showing Timer panel...');
                
                // Create panel container immediately
                const panel = document.createElement('div');
                panel.id = 'sidekick-timer-panel';
                panel.className = 'sidekick-timer-panel';
                
                // Calculate default position and size
                const defaultWidth = 350;
                const defaultHeight = 250;
                const minWidth = 300;
                const minHeight = 200;
                const maxWidth = 600;
                const maxHeight = 700;

                // Position new panel with slight offset to avoid overlapping
                const existingPanels = document.querySelectorAll('.sidekick-timer-panel');
                const offset = existingPanels.length * 20;
                const defaultX = 20 + offset;
                const defaultY = 20 + offset;

                // Use saved position or defaults
                const savedPosition = this.core.loadState('timer_panel_position', { x: defaultX, y: defaultY });
                const savedSize = this.core.loadState('timer_panel_size', { width: defaultWidth, height: defaultHeight });
                
                const desiredX = savedPosition.x || defaultX;
                const desiredY = savedPosition.y || defaultY;
                const desiredWidth = savedSize.width || defaultWidth;
                const desiredHeight = savedSize.height || defaultHeight;

                // Get sidebar bounds for constraining position
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { width: 400, height: 600 };
                const maxX = Math.max(0, sidebarRect.width - desiredWidth);
                const maxY = Math.max(0, sidebarRect.height - desiredHeight);

                // Clamp position to sidebar bounds
                const finalX = Math.min(Math.max(0, desiredX), maxX);
                const finalY = Math.min(Math.max(0, desiredY), maxY);

                panel.style.cssText = `
                    position: absolute;
                    left: ${finalX}px;
                    top: ${finalY}px;
                    width: ${desiredWidth}px;
                    height: ${desiredHeight}px;
                    background: #222;
                    border: 1px solid #444;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    min-width: ${minWidth}px;
                    min-height: ${minHeight}px;
                    max-width: ${maxWidth}px;
                    max-height: ${maxHeight}px;
                    z-index: ${1000 + existingPanels.length};
                    resize: ${this.isPinned ? 'none' : 'both'};
                    overflow: hidden;
                `;

                // Create header immediately
                const header = this.createHeader();
                panel.appendChild(header);

                // Create content area with loading state
                const content = document.createElement('div');
                content.id = 'timer-content';
                content.style.cssText = `
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                `;

                // Show loading state immediately
                content.innerHTML = `
                    <div style="
                        color: #888;
                        text-align: center;
                        padding: 20px;
                        font-size: 14px;
                    ">
                        ⏱️ Loading timers...
                    </div>
                `;

                panel.appendChild(content);
                
                // Add to sidebar content area immediately
                const contentArea = document.getElementById('sidekick-content');
                if (contentArea) {
                    contentArea.appendChild(panel);
                } else {
                    console.error('❌ Content area not found');
                    return;
                }

                // Mark as active immediately
                this.isActive = true;
                this.core.saveState('timer_panel_open', true);

                // Add event listeners immediately
                this.addPanelEventListeners(panel);
                this.addDragging(panel, header);
                this.addResizeFunctionality(panel);

                // Load data after panel is shown for instant UI response
                this.loadTimerData().then(() => {
                    this.refreshDisplay();
                    // Start real-time updates immediately after data loads
                    this.startRealTimeUpdates();
                });

                console.log('✅ Timer panel displayed instantly');
            },

            createHeader() {
                const header = document.createElement('div');
                header.className = 'timer-header';
                header.style.cssText = `
                    background: linear-gradient(135deg, #333, #555);
                    border-bottom: 1px solid #444;
                    padding: 4px 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: ${this.isPinned ? 'default' : 'move'};
                    height: 24px;
                    flex-shrink: 0;
                    border-radius: 7px 7px 0 0;
                `;
                
                const title = document.createElement('div');
                title.style.cssText = `
                    color: #fff;
                    font-size: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                `;
                title.innerHTML = '⏱️ Timers';
                
                const headerControls = document.createElement('div');
                headerControls.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 4px;
                `;

                // Add Timer button
                const addBtn = document.createElement('button');
                addBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #4CAF50;
                    cursor: pointer;
                    font-size: 12px;
                    padding: 2px;
                    border-radius: 4px;
                    transition: background 0.2s;
                `;
                addBtn.innerHTML = '+';
                addBtn.title = 'Add custom timer';
                addBtn.addEventListener('click', () => this.addCustomTimer());

                // Pin button
                const pinBtn = document.createElement('button');
                pinBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #9C27B0;
                    cursor: pointer;
                    font-size: 10px;
                    padding: 2px;
                    border-radius: 4px;
                    transition: background 0.2s;
                `;
                pinBtn.innerHTML = this.isPinned ? '📌' : '📍';
                pinBtn.title = this.isPinned ? 'Unpin panel' : 'Pin panel';
                pinBtn.addEventListener('click', () => this.togglePinPanel());

                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #f44336;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 2px;
                    border-radius: 4px;
                    transition: background 0.2s;
                `;
                closeBtn.innerHTML = '×';
                closeBtn.title = 'Close panel';
                closeBtn.addEventListener('click', () => this.hideTimerPanel());

                headerControls.appendChild(addBtn);
                headerControls.appendChild(pinBtn);
                headerControls.appendChild(closeBtn);
                
                header.appendChild(title);
                header.appendChild(headerControls);
                
                return header;
            },

            // Optimized data loading with caching
            async loadTimerData() {
                try {
                    // Use cached data if available and not expired
                    const now = Date.now();
                    if (this.cooldownCache.data && 
                        (now - this.cooldownCache.timestamp) < this.cooldownCache.ttl) {
                        console.log('⚡ Using cached timer data for instant loading');
                        this.cooldowns = this.cooldownCache.data;
                        return;
                    }

                    // Load fresh data
                    console.log('🔄 Loading fresh timer data...');
                    this.cooldowns = await this.getCooldowns();
                    
                    // Update cache
                    this.cooldownCache.data = this.cooldowns;
                    this.cooldownCache.timestamp = now;
                    
                    console.log('✅ Timer data loaded and cached');
                } catch (error) {
                    console.error('❌ Failed to load timer data:', error);
                    this.cooldowns = [];
                }
            },

            // Start real-time updates with optimized 1-second intervals
            startRealTimeUpdates() {
                // Clear any existing intervals
                this.stopRealTimeUpdates();
                
                // Real-time countdown updates every 1 second for accurate timing
                this.realTimeInterval = setInterval(() => {
                    this.updateCountdowns();
                }, 1000); // Exactly 1 second for real-time counting
                
                // Periodic data refresh every 30 seconds
                this.refreshInterval = setInterval(() => {
                    this.loadTimerData().then(() => this.refreshDisplay());
                }, 30000);
                
                console.log('⚡ Real-time updates started (1-second intervals)');
            },

            stopRealTimeUpdates() {
                if (this.realTimeInterval) {
                    clearInterval(this.realTimeInterval);
                    this.realTimeInterval = null;
                }
                if (this.refreshInterval) {
                    clearInterval(this.refreshInterval);
                    this.refreshInterval = null;
                }
            },

            // Optimized countdown updates - only update display, no API calls
            updateCountdowns() {
                if (!this.isActive) return;

                const content = document.getElementById('timer-content');
                if (!content) return;

                const timerElements = content.querySelectorAll('[data-timer-id]');
                timerElements.forEach(element => {
                    const timerId = element.getAttribute('data-timer-id');
                    const timeDisplay = element.querySelector('.time-display');
                    
                    if (!timeDisplay) return;

                    // Find the timer data
                    let timer = this.cooldowns.find(cd => cd.type === timerId);
                    if (!timer) {
                        timer = this.customTimers.find(ct => ct.id === timerId);
                    }

                    if (timer && timer.endTime) {
                        const now = Date.now();
                        const remaining = Math.max(0, timer.endTime - now);
                        
                        if (remaining > 0) {
                            timeDisplay.textContent = this.formatTime(remaining);
                            timeDisplay.style.color = '#4CAF50';
                        } else {
                            timeDisplay.textContent = 'Ready!';
                            timeDisplay.style.color = '#FF9800';
                        }
                    }
                });
            },

            refreshDisplay() {
                if (!this.isActive) return;
                
                const content = document.getElementById('timer-content');
                if (!content) return;

                // Clear content
                content.innerHTML = '';

                // Combine cooldowns and custom timers
                const allTimers = [
                    ...this.cooldowns.map(cd => ({ ...cd, isCustom: false })),
                    ...this.customTimers.map(ct => ({ ...ct, isCustom: true }))
                ];

                if (allTimers.length === 0) {
                    content.innerHTML = `
                        <div style="
                            color: #888;
                            font-style: italic;
                            text-align: center;
                            padding: 40px 20px;
                            font-size: 14px;
                        ">
                            No active timers.<br>
                            Game cooldowns will appear here automatically.
                        </div>
                    `;
                    return;
                }

                // Create timer elements
                allTimers.forEach(timer => {
                    const timerElement = this.createTimerElement(timer);
                    content.appendChild(timerElement);
                });

                console.log(`✅ Refreshed display with ${allTimers.length} timers`);
            },

            createTimerElement(timer) {
                const element = document.createElement('div');
                element.className = 'timer-item';
                element.setAttribute('data-timer-id', timer.type || timer.id);
                element.style.cssText = `
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 6px;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                `;

                const icon = document.createElement('span');
                icon.style.cssText = `
                    font-size: 18px;
                    color: #4CAF50;
                `;
                icon.textContent = timer.icon || '⏱️';

                const info = document.createElement('div');
                info.style.cssText = `
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                `;

                const name = document.createElement('div');
                name.style.cssText = `
                    color: #fff;
                    font-weight: 600;
                    font-size: 14px;
                `;
                name.textContent = timer.name || timer.type;

                const timeDisplay = document.createElement('div');
                timeDisplay.className = 'time-display';
                timeDisplay.style.cssText = `
                    color: #4CAF50;
                    font-size: 12px;
                    font-family: monospace;
                `;

                // Calculate remaining time
                if (timer.endTime) {
                    const now = Date.now();
                    const remaining = Math.max(0, timer.endTime - now);
                    
                    if (remaining > 0) {
                        timeDisplay.textContent = this.formatTime(remaining);
                    } else {
                        timeDisplay.textContent = 'Ready!';
                        timeDisplay.style.color = '#FF9800';
                    }
                } else {
                    timeDisplay.textContent = 'No data';
                    timeDisplay.style.color = '#888';
                }

                info.appendChild(name);
                info.appendChild(timeDisplay);

                element.appendChild(icon);
                element.appendChild(info);

                // Add delete button for custom timers
                if (timer.isCustom) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.style.cssText = `
                        background: none;
                        border: none;
                        color: #f44336;
                        cursor: pointer;
                        font-size: 16px;
                        padding: 4px;
                        border-radius: 4px;
                        transition: background 0.2s;
                    `;
                    deleteBtn.innerHTML = '×';
                    deleteBtn.title = 'Delete timer';
                    deleteBtn.addEventListener('click', () => this.deleteCustomTimer(timer.id));
                    element.appendChild(deleteBtn);
                }

                return element;
            },

            async getCooldowns() {
                try {
                    const response = await fetch('/api/user/cooldowns');
                    if (!response.ok) throw new Error('Failed to fetch cooldowns');
                    
                    const data = await response.json();
                    const cooldowns = [];
                    
                    // Parse cooldowns from API response
                    if (data.drug) {
                        cooldowns.push({
                            type: 'drug',
                            name: 'Drug Cooldown',
                            icon: '💊',
                            endTime: Date.now() + (data.drug * 1000)
                        });
                    }
                    
                    if (data.medical) {
                        cooldowns.push({
                            type: 'medical',
                            name: 'Medical Cooldown',
                            icon: '🏥',
                            endTime: Date.now() + (data.medical * 1000)
                        });
                    }
                    
                    if (data.booster) {
                        cooldowns.push({
                            type: 'booster',
                            name: 'Booster Cooldown',
                            icon: '⚡',
                            endTime: Date.now() + (data.booster * 1000)
                        });
                    }
                    
                    return cooldowns;
                } catch (error) {
                    console.error('❌ Failed to fetch cooldowns:', error);
                    return [];
                }
            },

            formatTime(milliseconds) {
                const totalSeconds = Math.floor(milliseconds / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                
                if (hours > 0) {
                    return `${hours}h ${minutes}m ${seconds}s`;
                } else if (minutes > 0) {
                    return `${minutes}m ${seconds}s`;
                } else {
                    return `${seconds}s`;
                }
            },

            addCustomTimer() {
                const duration = prompt('Enter timer duration (e.g., "5m", "1h", "30s"):');
                if (!duration) return;
                
                const name = prompt('Enter timer name:') || 'Custom Timer';
                
                const milliseconds = this.parseDuration(duration);
                if (milliseconds <= 0) {
                    alert('Invalid duration format. Use: 5m, 1h, 30s, etc.');
                    return;
                }
                
                const timer = {
                    id: Date.now() + Math.random(),
                    name: name,
                    icon: '⏲️',
                    endTime: Date.now() + milliseconds,
                    isCustom: true
                };
                
                this.customTimers.push(timer);
                this.saveState();
                this.refreshDisplay();
            },

            parseDuration(duration) {
                const match = duration.match(/^(\d+)([smh])$/);
                if (!match) return 0;
                
                const value = parseInt(match[1]);
                const unit = match[2];
                
                switch (unit) {
                    case 's': return value * 1000;
                    case 'm': return value * 60 * 1000;
                    case 'h': return value * 60 * 60 * 1000;
                    default: return 0;
                }
            },

            deleteCustomTimer(timerId) {
                this.customTimers = this.customTimers.filter(timer => timer.id !== timerId);
                this.saveState();
                this.refreshDisplay();
            },

            hideTimerPanel() {
                const panel = document.getElementById('sidekick-timer-panel');
                if (panel) {
                    this.cleanupPanel(panel);
                    panel.remove();
                }
                
                this.stopRealTimeUpdates();
                this.isActive = false;
                this.core.saveState('timer_panel_open', false);
                console.log('⏱️ Timer panel hidden');
            },

            cleanupPanel(panel) {
                // Clean up event listeners and observers
                if (panel._dragHandler) {
                    const header = panel.querySelector('.timer-header');
                    if (header) {
                        header.removeEventListener('mousedown', panel._dragHandler);
                    }
                    delete panel._dragHandler;
                }
                
                if (panel._resizeObserver) {
                    panel._resizeObserver.disconnect();
                    delete panel._resizeObserver;
                }
            },

            addPanelEventListeners(panel) {
                // Panel-specific event listeners can be added here
            },

            addDragging(panel, header) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };

                const dragHandler = (e) => {
                    if (this.isPinned) return;
                    
                    isDragging = true;
                    const rect = panel.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    e.preventDefault();
                };

                header.addEventListener('mousedown', dragHandler);
                panel._dragHandler = dragHandler;

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging || this.isPinned) return;
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar.getBoundingClientRect();
                    
                    let newX = e.clientX - sidebarRect.left - dragOffset.x;
                    let newY = e.clientY - sidebarRect.top - dragOffset.y;
                    
                    // Keep within sidebar bounds
                    const maxX = Math.max(0, sidebar.offsetWidth - panel.offsetWidth);
                    const maxY = Math.max(0, sidebar.offsetHeight - panel.offsetHeight);
                    
                    newX = Math.max(0, Math.min(newX, maxX));
                    newY = Math.max(0, Math.min(newY, maxY));
                    
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

            addResizeFunctionality(panel) {
                if (this.isPinned) return;
                
                let resizeTimeout;
                
                if (window.ResizeObserver) {
                    const resizeObserver = new ResizeObserver(() => {
                        if (this.isPinned) return;
                        
                        if (resizeTimeout) clearTimeout(resizeTimeout);
                        resizeTimeout = setTimeout(() => {
                            this.savePanelSize(panel);
                        }, 500);
                    });
                    
                    resizeObserver.observe(panel);
                    panel._resizeObserver = resizeObserver;
                }
            },

            savePanelPosition(panel) {
                const position = {
                    x: parseInt(panel.style.left) || 20,
                    y: parseInt(panel.style.top) || 20
                };
                this.core.saveState('timer_panel_position', position);
            },

            savePanelSize(panel) {
                const size = {
                    width: panel.offsetWidth,
                    height: panel.offsetHeight
                };
                this.core.saveState('timer_panel_size', size);
            },

            togglePinPanel() {
                this.isPinned = !this.isPinned;
                
                const panel = document.getElementById('sidekick-timer-panel');
                if (panel) {
                    panel.style.resize = this.isPinned ? 'none' : 'both';
                    const header = panel.querySelector('.timer-header');
                    if (header) {
                        header.style.cursor = this.isPinned ? 'default' : 'move';
                    }
                }
                
                this.core.saveState('timer_panel_pinned', this.isPinned);
                
                if (this.core.NotificationSystem) {
                    this.core.NotificationSystem.show(
                        'Timer',
                        this.isPinned ? 'Panel pinned!' : 'Panel unpinned.',
                        'info'
                    );
                }
            },

            loadState() {
                try {
                    const savedCustomTimers = this.core.loadState('custom_timers', []);
                    const savedPinned = this.core.loadState('timer_panel_pinned', false);
                    
                    this.customTimers = savedCustomTimers;
                    this.isPinned = savedPinned;
                    
                    console.log('⏱️ Timer state loaded');
                } catch (error) {
                    console.error('❌ Failed to load timer state:', error);
                    this.customTimers = [];
                    this.isPinned = false;
                }
            },

            saveState() {
                try {
                    this.core.saveState('custom_timers', this.customTimers);
                    this.core.saveState('timer_panel_pinned', this.isPinned);
                } catch (error) {
                    console.error('❌ Failed to save timer state:', error);
                }
            },

            restorePanelState() {
                try {
                    const wasOpen = this.core.loadState('timer_panel_open', false);
                    if (wasOpen) {
                        console.log('🔄 Restoring Timer panel state...');
                        setTimeout(() => {
                            if (document.getElementById('sidekick-content')) {
                                this.showTimerPanel();
                                console.log('✅ Timer panel restored successfully');
                            }
                        }, 1000);
                    }
                } catch (error) {
                    console.error('❌ Failed to restore timer panel state:', error);
                }
            }
        };

        // Register module with Sidekick
        if (window.SidekickModules) {
            window.SidekickModules.Timer = TimerModule;
            console.log('⏱️ Optimized Timer module registered with Sidekick');
        }

        // Initialize module
        TimerModule.init();
        
        // Restore panel state if it was previously open
        TimerModule.restorePanelState();
    });

})();
