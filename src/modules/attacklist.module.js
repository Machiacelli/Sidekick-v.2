// ==UserScript==
// @name         Sidekick Attack List Module
// @namespace    http://tampermonkey.net/
// @version      3.1.0
// @description  Enhanced Attack List with API integration and status tracking
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
        const AttackListModule = {
            attackLists: [],
            updateInterval: null,

            init() {
                console.log('⚔️ Initializing Attack List Module v3.1.0...');
                this.core = window.SidekickModules.Core;
                if (!this.core) {
                    console.error('❌ Core module not available for Attack List');
                    return;
                }
                this.loadAttackLists();
                this.refreshDisplay();
                this.startStatusUpdates();
                console.log('⚔️ Attack List module initialized, loaded', this.attackLists.length, 'attack lists');
            },

            loadAttackLists() {
                console.log('⚔️ Loading attack lists...');
                try {
                    const savedData = this.core.loadState('sidekick_attacklists', []);
                    this.attackLists = savedData || [];
                    console.log('✅ Loaded', this.attackLists.length, 'attack lists');
                } catch (error) {
                    console.error('❌ Error loading attack lists:', error);
                    this.attackLists = [];
                }
            },

            saveAttackLists() {
                try {
                    this.core.saveState('sidekick_attacklists', this.attackLists);
                    console.log('💾 Attack lists saved');
                } catch (error) {
                    console.error('❌ Error saving attack lists:', error);
                }
            },

            refreshDisplay() {
                console.log('⚔️ Refreshing attack list display...');
                this.clearExistingAttackLists();
                this.attackLists.forEach(attackList => this.renderAttackList(attackList));
            },

            clearExistingAttackLists() {
                const existingAttackLists = document.querySelectorAll('.sidekick-attack-list');
                existingAttackLists.forEach(element => element.remove());
            },

            createNewAttackList() {
                console.log('⚔️ Creating new attack list...');
                const newAttackList = {
                    id: Date.now().toString(),
                    name: 'New Attack List',
                    targets: [],
                    color: '#f44336',
                    pinned: false,
                    minimized: false
                };

                this.attackLists.push(newAttackList);
                this.saveAttackLists();
                this.renderAttackList(newAttackList);
                return newAttackList;
            },

            renderAttackList(attackList) {
                const contentArea = document.getElementById('sidekick-content');
                if (!contentArea) {
                    console.error('❌ Content area not found');
                    return;
                }

                const attackListElement = document.createElement('div');
                attackListElement.className = 'sidekick-attack-list';
                attackListElement.dataset.attackListId = attackList.id;
                
                // Calculate default position and size
                const defaultWidth = 350;
                const defaultHeight = 250;
                const minWidth = 300;
                const minHeight = 200;
                const maxWidth = 600;
                const maxHeight = 700;

                // Position new attack lists with slight offset to avoid overlapping
                const existingLists = document.querySelectorAll('.sidekick-attack-list');
                const offset = existingLists.length * 20;
                const defaultX = 20 + offset;
                const defaultY = 20 + offset;

                // Use saved position or defaults
                const desiredX = attackList.x !== undefined ? attackList.x : defaultX;
                const desiredY = attackList.y !== undefined ? attackList.y : defaultY;
                const desiredWidth = attackList.width || defaultWidth;
                const desiredHeight = attackList.height || defaultHeight;

                // Get sidebar bounds for constraining position
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { width: 400, height: 600 };
                const maxX = Math.max(0, sidebarRect.width - desiredWidth);
                const maxY = Math.max(0, sidebarRect.height - desiredHeight);

                // Clamp position to sidebar bounds
                const finalX = Math.min(Math.max(0, desiredX), maxX);
                const finalY = Math.min(Math.max(0, desiredY), maxY);

                // Update the attackList object with clamped values
                attackList.x = finalX;
                attackList.y = finalY;
                attackList.width = desiredWidth;
                attackList.height = desiredHeight;

                attackListElement.style.cssText = `
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
                    z-index: ${1000 + existingLists.length};
                    resize: ${attackList.pinned ? 'none' : 'both'};
                    overflow: hidden;
                `;
                
                attackListElement.innerHTML = `
                    <div class="attacklist-header" style="
                        background: ${attackList.color || '#f44336'};
                        border-bottom: 1px solid #555;
                        padding: 4px 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: ${attackList.pinned ? 'default' : 'move'};
                        height: 24px;
                        flex-shrink: 0;
                        border-radius: 7px 7px 0 0;
                    ">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div class="pin-dropdown" style="position: relative; display: inline-block;">
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
                                    position: absolute;
                                    background: #333;
                                    min-width: 140px;
                                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                                    z-index: 1001;
                                    border-radius: 4px;
                                    border: 1px solid #555;
                                    top: 100%;
                                    left: 0;
                                ">
                                    <button class="add-target-btn" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        🎯 Add Target
                                    </button>
                                    <button class="pin-btn" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        ${attackList.pinned ? '📌 Unpin' : '📌 Pin'}
                                    </button>
                                    <button class="color-btn" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        🎨 Change Color
                                    </button>
                                </div>
                            </div>
                            <span class="attacklist-title" style="color: #fff; font-size: 12px; font-weight: bold; cursor: text;" title="Click to edit title">⚔️ ${attackList.name}</span>
                        </div>
                        <button class="close-btn" style="
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
                        " title="Delete attack list">×</button>
                    </div>
                    <div class="attacklist-content" style="
                        padding: 8px;
                        background: #1a1a1a;
                        border-radius: 0 0 7px 7px;
                        flex: 1;
                        overflow-y: auto;
                        ${attackList.minimized ? 'display: none;' : ''}
                    ">
                        <div class="targets-container">
                            <!-- Targets will be rendered here -->
                        </div>
                    </div>
                `;

                contentArea.appendChild(attackListElement);
                
                // Render targets
                this.renderTargets(attackList);
                
                // Set up event listeners
                this.setupAttackListEventListeners(attackListElement, attackList);
                
                return attackListElement;
            },

            renderTargets(attackList) {
                const attackListElement = document.querySelector(`[data-attack-list-id="${attackList.id}"]`);
                if (!attackListElement) return;

                const targetsContainer = attackListElement.querySelector('.targets-container');
                targetsContainer.innerHTML = '';

                if (attackList.targets.length === 0) {
                    targetsContainer.innerHTML = `
                        <div style="
                            color: #888;
                            font-style: italic;
                            text-align: center;
                            padding: 12px;
                        ">
                            No targets yet. Click the dropdown to add a target.
                        </div>
                    `;
                    return;
                }

                attackList.targets.forEach((target, index) => {
                    const targetElement = document.createElement('div');
                    targetElement.className = 'target-item';
                    targetElement.style.cssText = `
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 8px;
                        margin-bottom: 4px;
                        background: #333;
                        border-radius: 4px;
                        border: 1px solid #555;
                    `;

                    const statusDisplay = this.renderTargetStatus(target);
                    
                    targetElement.innerHTML = `
                        <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                            <a href="https://www.torn.com/loader.php?sid=attack&user2ID=${target.id}" 
                               target="_blank" 
                               style="
                                   color: #4FC3F7;
                                   text-decoration: none;
                                   font-weight: bold;
                                   font-size: 13px;
                               " 
                               title="Attack ${target.name}">
                                ${target.name || `Player ${target.id}`}
                            </a>
                            <span style="font-size: 11px; color: #888;">[${target.id}]</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${statusDisplay}
                            <button class="remove-target-btn" data-target-index="${index}" style="
                                background: #f44336;
                                border: none;
                                color: white;
                                padding: 2px 6px;
                                border-radius: 3px;
                                cursor: pointer;
                                font-size: 11px;
                            " title="Remove target">
                                ×
                            </button>
                        </div>
                    `;

                    targetsContainer.appendChild(targetElement);
                });

                // Set up target action event listeners
                this.setupTargetActionListeners(attackList);
            },

            renderTargetStatus(target) {
                if (!target.data) {
                    return '<span style="color: #888; font-size: 11px;">Loading...</span>';
                }

                if (target.data.error) {
                    return '<span style="color: #f44336; font-size: 11px;">Error</span>';
                }

                const data = target.data;
                
                if (!data.status) {
                    return '<span style="color: #888; font-size: 11px;">No Status</span>';
                }
                
                // Check if player is okay (not in hospital, jail, or traveling)
                if (data.status.state === 'Okay') {
                    return '<span style="color: #4CAF50; font-size: 11px; font-weight: bold;">Okay</span>';
                }

                // Hospital status
                if (data.status.state === 'Hospital') {
                    const timeLeft = data.status.until ? this.formatTimeRemaining(data.status.until) : 'Unknown';
                    return `<span style="color: #f44336; font-size: 11px; font-weight: bold;">🏥 ${timeLeft}</span>`;
                }

                // Jail status
                if (data.status.state === 'Jail') {
                    const timeLeft = data.status.until ? this.formatTimeRemaining(data.status.until) : 'Unknown';
                    return `<span style="color: #9C27B0; font-size: 11px; font-weight: bold;">🔒 ${timeLeft}</span>`;
                }

                // Traveling status
                if (data.status.state === 'Traveling') {
                    const travelInfo = this.formatTravelStatus(data.status);
                    return `<span style="color: #FF9800; font-size: 11px; font-weight: bold;">${travelInfo}</span>`;
                }

                // Other states
                return `<span style="color: #888; font-size: 11px;">${data.status.state || 'Unknown'}</span>`;
            },

            formatTimeRemaining(timestamp) {
                const now = Math.floor(Date.now() / 1000);
                const remaining = timestamp - now;
                
                if (remaining <= 0) return '0m';
                
                const hours = Math.floor(remaining / 3600);
                const minutes = Math.floor((remaining % 3600) / 60);
                
                if (hours > 0) {
                    return `${hours}h ${minutes}m`;
                } else {
                    return `${minutes}m`;
                }
            },

            formatTravelStatus(status) {
                const destination = status.description || '';
                
                // Parse the travel description to determine direction
                if (destination.includes('Traveling to')) {
                    // Going to a country
                    const country = this.extractCountryCode(destination);
                    return `${country} →`;
                } else if (destination.includes('Returning to Torn') || destination.includes('Flying back to Torn')) {
                    // Coming back from a country
                    const country = this.extractCountryCode(destination);
                    return `← ${country}`;
                } else if (destination.includes('In ')) {
                    // Currently in a country
                    const country = this.extractCountryCode(destination);
                    return `${country}`;
                }
                
                return '✈️ Traveling';
            },

            extractCountryCode(description) {
                // Map common country names to codes (based on Torn travel destinations)
                const countryMap = {
                    'United Arab Emirates': 'UAE',
                    'China': 'CHN', 
                    'Canada': 'CAN',
                    'Hawaii': 'HAW',
                    'United Kingdom': 'UK',
                    'Argentina': 'ARG',
                    'Switzerland': 'SWI',
                    'Japan': 'JPN',
                    'Mexico': 'MEX',
                    'South Africa': 'SAF',
                    'Cayman Islands': 'CAY',
                    'UAE': 'UAE',
                    'UK': 'UK'
                };

                // Check for exact country name matches first
                for (const [country, code] of Object.entries(countryMap)) {
                    if (description.toLowerCase().includes(country.toLowerCase())) {
                        return code;
                    }
                }

                // Try to extract country name from travel descriptions
                const patterns = [
                    /(?:to|from|In)\s+([A-Za-z\s]+?)(?:\s|$|\.|,)/,
                    /Traveling to ([A-Za-z\s]+?)(?:\s|$|\.|,)/,
                    /Flying back to Torn from ([A-Za-z\s]+?)(?:\s|$|\.|,)/,
                    /In ([A-Za-z\s]+?)(?:\s|$|\.|,)/
                ];

                for (const pattern of patterns) {
                    const match = description.match(pattern);
                    if (match) {
                        const countryName = match[1].trim();
                        return countryName.substring(0, 3).toUpperCase();
                    }
                }

                return '???';
            },

            setupAttackListEventListeners(element, attackList) {
                const header = element.querySelector('.attacklist-header');
                const dropdownBtn = element.querySelector('.dropdown-btn');
                const dropdownContent = element.querySelector('.dropdown-content');
                const titleSpan = element.querySelector('.attacklist-title');

                // Dragging functionality (only if not pinned)
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };

                header.addEventListener('mousedown', (e) => {
                    // Don't drag if clicking on dropdown, title, or close button
                    if (e.target.closest('.dropdown-btn') || 
                        e.target.closest('.attacklist-title') || 
                        e.target.closest('.close-btn') ||
                        attackList.pinned) {
                        return;
                    }

                    isDragging = true;
                    const rect = element.getBoundingClientRect();
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar.getBoundingClientRect();
                    
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    
                    // Bring to front when dragging starts
                    element.style.zIndex = Date.now();
                    
                    e.preventDefault();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging || attackList.pinned) return;

                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar.getBoundingClientRect();

                    let newX = e.clientX - sidebarRect.left - dragOffset.x;
                    let newY = e.clientY - sidebarRect.top - dragOffset.y;

                    // Keep within sidebar bounds
                    newX = Math.max(0, Math.min(newX, sidebar.offsetWidth - element.offsetWidth));
                    newY = Math.max(0, Math.min(newY, sidebar.offsetHeight - element.offsetHeight));

                    element.style.left = newX + 'px';
                    element.style.top = newY + 'px';

                    // Update stored position
                    attackList.x = newX;
                    attackList.y = newY;
                    this.saveAttackLists();
                });

                document.addEventListener('mouseup', () => {
                    isDragging = false;
                });

                // Title editing functionality
                titleSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.makeTitleEditable(titleSpan, attackList);
                });

                // Resize observer to save dimensions with bounds checking
                const resizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        const rect = entry.contentRect;
                        const sidebar = document.getElementById('sidekick-sidebar');
                        
                        if (sidebar) {
                            const sidebarRect = sidebar.getBoundingClientRect();
                            const maxWidth = sidebarRect.width - element.offsetLeft;
                            const maxHeight = sidebarRect.height - element.offsetTop;
                            
                            // Constrain to sidebar bounds
                            const constrainedWidth = Math.min(rect.width, maxWidth);
                            const constrainedHeight = Math.min(rect.height, maxHeight);
                            
                            // Only apply constraints if we're exceeding bounds
                            if (rect.width > maxWidth || rect.height > maxHeight) {
                                element.style.width = constrainedWidth + 'px';
                                element.style.height = constrainedHeight + 'px';
                            }
                            
                            attackList.width = constrainedWidth;
                            attackList.height = constrainedHeight;
                        } else {
                            attackList.width = rect.width;
                            attackList.height = rect.height;
                        }
                        
                        this.saveAttackLists();
                    }
                });
                resizeObserver.observe(element);

                // Dropdown toggle
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = dropdownContent.style.display === 'block';
                    
                    // Hide all other dropdowns
                    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                        dropdown.style.display = 'none';
                    });
                    
                    dropdownContent.style.display = isVisible ? 'none' : 'block';
                });

                // Add Target button
                const addTargetBtn = element.querySelector('.add-target-btn');
                addTargetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = 'none';
                    this.showAddTargetModal(attackList);
                });

                // Pin/Unpin button
                const pinBtn = element.querySelector('.pin-btn');
                pinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = 'none';
                    this.togglePin(attackList);
                });

                // Color change button
                const colorBtn = element.querySelector('.color-btn');
                colorBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = 'none';
                    this.showColorPicker(attackList);
                });

                // Delete button
                const closeBtn = element.querySelector('.close-btn');
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteAttackList(attackList);
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', () => {
                    dropdownContent.style.display = 'none';
                });
            },

            setupTargetActionListeners(attackList) {
                const attackListElement = document.querySelector(`[data-attack-list-id="${attackList.id}"]`);
                if (!attackListElement) return;

                // Remove target buttons
                attackListElement.querySelectorAll('.remove-target-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const targetIndex = parseInt(btn.dataset.targetIndex);
                        this.removeTarget(attackList, targetIndex);
                    });
                });
            },

            showAddTargetModal(attackList) {
                // Remove existing modal if any
                const existingModal = document.getElementById('sidekick-add-target-modal');
                if (existingModal) existingModal.remove();

                const modal = document.createElement('div');
                modal.id = 'sidekick-add-target-modal';
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                modal.innerHTML = `
                    <div style="
                        background: #333;
                        padding: 24px;
                        border-radius: 8px;
                        border: 1px solid #555;
                        max-width: 400px;
                        width: 90%;
                        color: #fff;
                    ">
                        <h3 style="margin: 0 0 16px 0; color: #fff;">Add Target</h3>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 13px;">Player ID:</label>
                            <input id="target-id-input" type="number" placeholder="Enter player ID..." style="
                                width: 100%;
                                padding: 8px;
                                background: #222;
                                border: 1px solid #555;
                                border-radius: 4px;
                                color: #fff;
                                font-size: 13px;
                            ">
                        </div>
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button id="cancel-target-btn" style="
                                background: #666;
                                border: none;
                                color: #fff;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 13px;
                            ">Cancel</button>
                            <button id="save-target-btn" style="
                                background: #4CAF50;
                                border: none;
                                color: #fff;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 13px;
                            ">Add Target</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);

                const idInput = modal.querySelector('#target-id-input');
                const saveBtn = modal.querySelector('#save-target-btn');
                const cancelBtn = modal.querySelector('#cancel-target-btn');

                // Focus on ID input
                idInput.focus();

                // Save target
                const saveTarget = () => {
                    const playerId = idInput.value.trim();

                    if (!playerId || isNaN(playerId)) {
                        this.core.NotificationSystem.show('Error', 'Please enter a valid player ID', 'error');
                        idInput.focus();
                        return;
                    }

                    // Check if target already exists
                    if (attackList.targets.some(t => t.id === playerId)) {
                        this.core.NotificationSystem.show('Error', 'Target already exists in this list', 'error');
                        return;
                    }

                    this.addTarget(attackList, playerId);
                    modal.remove();
                };

                saveBtn.addEventListener('click', saveTarget);
                cancelBtn.addEventListener('click', () => modal.remove());

                // Handle Enter key
                idInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') saveTarget();
                });

                // Handle Escape key
                modal.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') modal.remove();
                });

                // Close on backdrop click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.remove();
                });
            },

            async addTarget(attackList, playerId) {
                const newTarget = {
                    id: playerId,
                    name: null,
                    data: null,
                    lastUpdated: null
                };

                attackList.targets.push(newTarget);
                this.saveAttackLists();
                this.renderTargets(attackList);
                
                // Fetch player data immediately
                this.core.NotificationSystem.show('Loading', 'Fetching player data...', 'info');
                await this.updateTargetStatus(newTarget);
                this.renderTargets(attackList);
                this.saveAttackLists();
                
                this.core.NotificationSystem.show('Added', 'Target added successfully!', 'success');
            },

            removeTarget(attackList, targetIndex) {
                const target = attackList.targets[targetIndex];
                if (confirm(`Remove target "${target.name || target.id}"?`)) {
                    attackList.targets.splice(targetIndex, 1);
                    this.saveAttackLists();
                    this.renderTargets(attackList);
                    this.core.NotificationSystem.show('Removed', 'Target removed', 'info');
                }
            },

            async updateTargetStatus(target) {
                try {
                    console.log(`🎯 Fetching data for player ${target.id}...`);
                    
                    // According to Torn API docs, we need basic,profile for name and status for current state
                    // API format: https://api.torn.com/user/:ID?selections=basic,profile&key=:KEY
                    const data = await this.core.Api.makeRequest(`user/${target.id}?selections=basic,profile`);
                    
                    if (data && !data.error) {
                        target.name = data.name || `Player ${target.id}`;
                        target.data = {
                            name: data.name,
                            status: data.status || { state: 'Unknown', description: 'Status unavailable' },
                            last_action: data.last_action
                        };
                        target.lastUpdated = Date.now();
                        console.log(`✅ Updated data for ${target.name} (${target.id}):`, target.data.status);
                    } else if (data && data.error) {
                        console.error(`❌ API Error for player ${target.id}:`, data.error);
                        target.name = `Player ${target.id}`;
                        target.data = { error: data.error };
                        
                        // Show user-friendly error message
                        if (data.error.code === 6) {
                            this.core.NotificationSystem.show('Error', `Player ID ${target.id} not found`, 'error');
                        } else if (data.error.code === 7) {
                            this.core.NotificationSystem.show('Error', `No access to player ${target.id} data`, 'error');
                        } else {
                            this.core.NotificationSystem.show('Error', `API Error: ${data.error.error}`, 'error');
                        }
                    } else {
                        console.warn(`⚠️ No data returned for player ${target.id}`);
                        target.name = `Player ${target.id}`;
                        target.data = null;
                    }
                } catch (error) {
                    console.error(`❌ Error fetching target data for ${target.id}:`, error);
                    target.name = `Player ${target.id}`;
                    target.data = null;
                    this.core.NotificationSystem.show('Error', `Failed to fetch data for player ${target.id}`, 'error');
                }
            },

            async updateAllTargets() {
                console.log('⚔️ Updating all target statuses...');
                const promises = [];
                
                this.attackLists.forEach(attackList => {
                    attackList.targets.forEach(target => {
                        promises.push(this.updateTargetStatus(target));
                    });
                });

                await Promise.all(promises);
                this.saveAttackLists();
                this.refreshDisplay();
            },

            startStatusUpdates() {
                // Update every 5 minutes
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                }
                
                this.updateInterval = setInterval(() => {
                    this.updateAllTargets();
                }, 5 * 60 * 1000);

                // Initial update
                this.updateAllTargets();
            },

            togglePin(attackList) {
                attackList.pinned = !attackList.pinned;
                this.saveAttackLists();
                this.refreshDisplay();
                this.core.NotificationSystem.show(
                    'Updated',
                    `Attack list ${attackList.pinned ? 'pinned' : 'unpinned'}`, 
                    'info'
                );
            },

            showColorPicker(attackList) {
                const colors = ['#f44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4'];
                
                const colorModal = document.createElement('div');
                colorModal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                colorModal.innerHTML = `
                    <div style="
                        background: #333;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #555;
                        color: #fff;
                    ">
                        <h3 style="margin: 0 0 16px 0;">Choose Color</h3>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                            ${colors.map(color => `
                                <button class="color-option" data-color="${color}" style="
                                    width: 40px;
                                    height: 40px;
                                    background: ${color};
                                    border: 2px solid ${color === attackList.color ? '#fff' : 'transparent'};
                                    border-radius: 4px;
                                    cursor: pointer;
                                "></button>
                            `).join('')}
                        </div>
                    </div>
                `;

                document.body.appendChild(colorModal);

                colorModal.querySelectorAll('.color-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        attackList.color = btn.dataset.color;
                        this.saveAttackLists();
                        this.refreshDisplay();
                        colorModal.remove();
                        this.core.NotificationSystem.show('Updated', 'Color changed!', 'success');
                    });
                });

                colorModal.addEventListener('click', (e) => {
                    if (e.target === colorModal) colorModal.remove();
                });
            },

            deleteAttackList(attackList) {
                if (confirm(`Delete attack list "${attackList.name}"? This will remove all targets in this list.`)) {
                    this.attackLists = this.attackLists.filter(al => al.id !== attackList.id);
                    this.saveAttackLists();
                    this.refreshDisplay();
                    this.core.NotificationSystem.show('Deleted', 'Attack list removed', 'success');
                }
            },

            makeTitleEditable(titleSpan, attackList) {
                // Don't edit if already editing
                if (titleSpan.querySelector('input')) return;

                const currentTitle = attackList.name;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentTitle;
                input.style.cssText = `
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid #555;
                    color: #fff;
                    font-size: 12px;
                    font-weight: bold;
                    padding: 2px 4px;
                    border-radius: 3px;
                    width: 150px;
                    font-family: inherit;
                `;

                // Replace title with input
                titleSpan.innerHTML = '';
                titleSpan.appendChild(input);
                input.focus();
                input.select();

                const saveTitle = () => {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== currentTitle) {
                        attackList.name = newTitle;
                        this.saveAttackLists();
                        this.core.NotificationSystem.show('Updated', 'Title changed successfully', 'success');
                    }
                    titleSpan.innerHTML = `⚔️ ${attackList.name}`;
                };

                const cancelEdit = () => {
                    titleSpan.innerHTML = `⚔️ ${attackList.name}`;
                };

                // Save on Enter
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveTitle();
                    }
                });

                // Cancel on Escape
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEdit();
                    }
                });

                // Save on blur
                input.addEventListener('blur', saveTitle);

                // Prevent clicks from propagating
                input.addEventListener('click', (e) => e.stopPropagation());
            },

            // Public methods for external use
            addNewAttackList() {
                return this.createNewAttackList();
            },

            // Force refresh method for external calls
            forceRefresh() {
                this.loadAttackLists();
                this.refreshDisplay();
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.AttackList = AttackListModule;

        console.log('⚔️ Attack List module registered');
    });
})();