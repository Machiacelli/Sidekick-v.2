// ==UserScript==
// @name         Sidewinder - Attack List Module
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Attack List functionality for Sidewinder
// @author       Machiacelli
// @match        https://www.torn.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Module: Attack List
    const AttackListModule = {
        name: 'AttackList',
        version: '1.0',
        
        // Initialize the module
        init() {
            console.log(`⚔️ Loading ${this.name} Module v${this.version}...`);
            this.registerMenuItems();
            this.registerFunctions();
        },
        
        // Register menu items for this module
        registerMenuItems() {
            if (window.SidekickModules) {
                window.SidekickModules.registerMenuItem({
                    icon: '⚔️',
                    text: 'Add Attack List',
                    color: '#f44336',
                    action: () => this.createAttackList()
                });
            }
        },
        
        // Register global functions
        registerFunctions() {
            window.updateAttackTitle = this.updateTitle.bind(this);
            window.addAttackTarget = this.addTarget.bind(this);
        },
        
        // Create a new attack list
        createAttackList() {
            const attackList = window.DataTemplates?.createAttackList() || {
                id: Date.now() + Math.random(),
                title: 'Untitled Attack List',
                targets: [],
                type: 'attacklist'
            };
            // Create attack list panel using Sidekick theme
            const attackElement = document.createElement('div');
            attackElement.className = 'sidekick-panel';
            attackElement.dataset.id = attackList.id;
            attackElement.style.cssText = `margin-bottom: 18px;`;
            attackElement.innerHTML = `
                <div class="sidekick-panel-header">
                    <span style="display: flex; align-items: center; gap: 8px; font-size: 16px;">
                        <span>⚔️</span>
                        <input type="text" value="${attackList.title}" data-attack-id="${attackList.id}"
                            style="background: #222; border: 1px solid #555; color: #fff; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 15px; width: 180px;">
                    </span>
                    <button class="remove-btn" data-item-id="${attackList.id}" data-item-type="attacklist" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 20px; padding: 2px 8px; font-weight: bold;">×</button>
                </div>
                <div class="sidekick-panel-content" id="attack-targets-${attackList.id}"></div>
                <button class="add-attack-target" data-list-id="${attackList.id}" style="width: 100%; margin-top: 10px; padding: 12px; background: linear-gradient(135deg, #f44336, #ff9800); color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer;">+ Add Target</button>
            `;
            // Add event listeners
            setTimeout(() => {
                const titleInput = attackElement.querySelector(`input[data-attack-id="${attackList.id}"]`);
                const addTargetBtn = attackElement.querySelector('.add-attack-target');
                const removeBtn = attackElement.querySelector('.remove-btn');
                if (titleInput) {
                    titleInput.addEventListener('change', (e) => this.updateTitle(attackList.id, e.target.value));
                    titleInput.addEventListener('input', (e) => this.updateTitle(attackList.id, e.target.value));
                }
                if (addTargetBtn) {
                    addTargetBtn.addEventListener('click', () => this.addTarget(attackList.id));
                }
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        if (window.removeSidebarItem) {
                            window.removeSidebarItem(attackList.id, 'attacklist');
                        }
                    });
                }
            }, 50);
            // Add to sidebar content
            const attackContainer = document.getElementById('sidekick-attacks');
            if (attackContainer) {
                attackContainer.appendChild(attackElement);
            }
            // Save to current page
            this.saveToStorage(attackList);
            if (window.NotificationSystem) {
                window.NotificationSystem.show('Success', 'Attack list created!', 'info');
            }
        },
        
        // Create attack list element during restoration
        createElement(attackList) {
            const attackElement = document.createElement('div');
            attackElement.className = 'sidekick-panel';
            attackElement.dataset.id = attackList.id;
            attackElement.style.cssText = `margin-bottom: 18px;`;
            attackElement.innerHTML = `
                <div class="sidekick-panel-header">
                    <span style="display: flex; align-items: center; gap: 8px; font-size: 16px;">
                        <span>⚔️</span>
                        <input type="text" value="${attackList.title || 'Untitled Attack List'}" data-attack-id="${attackList.id}"
                            style="background: #222; border: 1px solid #555; color: #fff; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 15px; width: 180px;">
                    </span>
                    <button class="remove-btn" data-item-id="${attackList.id}" data-item-type="attacklist" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 20px; padding: 2px 8px; font-weight: bold;">×</button>
                </div>
                <div class="sidekick-panel-content" id="attack-targets-${attackList.id}"></div>
                <button class="add-attack-target" data-list-id="${attackList.id}" style="width: 100%; margin-top: 10px; padding: 12px; background: linear-gradient(135deg, #f44336, #ff9800); color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 15px; cursor: pointer;">+ Add Target</button>
            `;
            setTimeout(() => {
                const titleInput = attackElement.querySelector(`input[data-attack-id="${attackList.id}"]`);
                const addTargetBtn = attackElement.querySelector('.add-attack-target');
                const removeBtn = attackElement.querySelector('.remove-btn');
                if (titleInput) {
                    titleInput.addEventListener('change', (e) => this.updateTitle(attackList.id, e.target.value));
                    titleInput.addEventListener('input', (e) => this.updateTitle(attackList.id, e.target.value));
                }
                if (addTargetBtn) {
                    addTargetBtn.addEventListener('click', () => this.addTarget(attackList.id));
                }
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        if (window.removeSidebarItem) {
                            window.removeSidebarItem(attackList.id, 'attacklist');
                        }
                    });
                }
            }, 50);
            const attackContainer = document.getElementById('sidekick-attacks');
            if (attackContainer) {
                attackContainer.appendChild(attackElement);
            }
            if (attackList.targets && attackList.targets.length > 0) {
                setTimeout(() => {
                    attackList.targets.forEach(target => {
                        this.addTargetToElement(attackList.id, target.name, target.targetId, target.id);
                    });
                }, 100);
            }
        },
        
        // Add hover effects to element
        addHoverEffects(element) {
            element.addEventListener('mouseenter', () => {
                element.style.background = '#333';
                element.style.borderColor = '#555';
            });
            element.addEventListener('mouseleave', () => {
                element.style.background = '#2a2a2a';
                element.style.borderColor = '#444';
            });
        },
        
        // Update attack list title
        updateTitle(id, title) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            const attackList = pages[currentPage].attackLists?.find(a => a.id === id);
            if (attackList) {
                attackList.title = title;
                window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
                console.log('✅ Attack list title updated:', id, title);
            }
        },
        
        // Add new target to attack list
        addTarget(listId) {
            const targetName = prompt('Enter target name:');
            if (targetName && targetName.trim()) {
                const targetId = prompt('Enter target ID (optional):') || '';
                const itemId = Date.now() + Math.random();
                this.addTargetToElement(listId, targetName.trim(), targetId.trim(), itemId);
                this.saveTargetToStorage(listId, itemId, targetName.trim(), targetId.trim());
            }
        },
        
        // Add target to DOM element and fetch live status from Torn API
        addTargetToElement(listId, name = '', targetId = '', itemId = null) {
            const container = document.getElementById(`attack-targets-${listId}`);
            if (!container) return;
            if (!itemId) itemId = Date.now() + Math.random();

            // Create the target row element
            const targetElement = document.createElement('div');
            targetElement.className = 'attack-target';
            targetElement.dataset.itemId = itemId;
            targetElement.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px;
                background: #333;
                border-radius: 4px;
                margin-bottom: 4px;
                min-height: 32px;
            `;

            // Add editable ID field and remove button
            targetElement.innerHTML = `
                <input type="text" placeholder="ID" value="${targetId}" data-target-id-id="${itemId}"
                       style="width: 70px; background: #222; border: 1px solid #555; color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 13px;">
                <span class="username" data-username-id="${itemId}" style="font-weight: bold; color: #fff; min-width: 90px;">${name || ''}</span>
                <span class="status" data-status-id="${itemId}" style="font-size: 13px; font-weight: bold; padding: 2px 8px; border-radius: 4px;">...</span>
                <button class="remove-attack-target" data-target-remove-id="${itemId}"
                        style="background: none; border: none; color: #f44336; cursor: pointer; padding: 2px; font-size: 16px;">×</button>
            `;
            container.appendChild(targetElement);

            // Add event listeners for ID field and remove button
            setTimeout(() => {
                const idInput = targetElement.querySelector(`input[data-target-id-id="${itemId}"]`);
                const removeBtn = targetElement.querySelector(`button[data-target-remove-id="${itemId}"]`);
                if (idInput) {
                    idInput.addEventListener('change', () => {
                        this.updateTargetInStorage(listId, itemId, '', idInput.value);
                        this.refreshTargetStatus(itemId, idInput.value);
                    });
                    idInput.addEventListener('input', () => {
                        this.updateTargetInStorage(listId, itemId, '', idInput.value);
                    });
                }
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        targetElement.remove();
                        this.removeTargetFromStorage(listId, itemId);
                    });
                }
            }, 50);

            // Fetch and display status immediately
            this.refreshTargetStatus(itemId, targetId);
        },

        // Helper: Map country names to short forms
        getCountryShort(country) {
            const map = {
                'south africa': 'SA', 'united kingdom': 'UK', 'switzerland': 'CH', 'united arab emirates': 'UAE',
                'japan': 'JP', 'canada': 'CA', 'mexico': 'MX', 'cayman islands': 'CI', 'china': 'CN',
                'hawaii': 'HI', 'argentina': 'AR', 'torn': 'Torn'
            };
            if (!country) return '';
            country = country.toLowerCase();
            return map[country] || country.charAt(0).toUpperCase() + country.slice(1,3);
        },

        // Helper: Format timer as mm:ss or hh:mm:ss
        formatTimer(until) {
            if (!until) return '';
            const now = Math.floor(Date.now() / 1000);
            let seconds = until - now;
            if (seconds < 0) seconds = 0;
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
            return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        },

        // Fetch player info from Torn API and update status row
        async refreshTargetStatus(itemId, targetId) {
            const apiKey = window.loadState?.(window.STORAGE_KEYS?.API_KEY, '');
            if (!apiKey || !targetId) return;
            const usernameSpan = document.querySelector(`[data-username-id="${itemId}"]`);
            const statusSpan = document.querySelector(`[data-status-id="${itemId}"]`);
            if (!usernameSpan || !statusSpan) return;
            statusSpan.textContent = 'Loading...';
            statusSpan.style.background = '#222';
            try {
                const url = `https://api.torn.com/user/${targetId}?selections=basic,travel,status&key=${apiKey}`;
                const response = await fetch(url);
                const data = await response.json();
                if (data.error) {
                    usernameSpan.textContent = 'Invalid ID';
                    statusSpan.textContent = 'Error';
                    statusSpan.style.background = '#222';
                    return;
                }
                // Username
                usernameSpan.textContent = data.name || targetId;
                // Status logic
                let status = data.status?.description || '';
                let color = '#4CAF50'; // Default green
                let timer = '';
                let statusText = '';
                // Hospital
                if (status === 'Hospital') {
                    color = '#f44336';
                    timer = this.formatTimer(data.status.until);
                    statusText = `${timer}`;
                }
                // Jail
                else if (status === 'Jail') {
                    color = '#9C27B0';
                    timer = this.formatTimer(data.status.until);
                    statusText = `${timer}`;
                }
                // Okay
                else if (status === 'Okay') {
                    color = '#4CAF50';
                    statusText = 'Okay';
                }
                // Abroad (not in Torn, not flying)
                else if (data.travel && data.travel.status === 'Abroad') {
                    color = '#2196F3';
                    const country = this.getCountryShort(data.travel.destination);
                    statusText = `${country}`;
                }
                // Flying (no timer, only country and arrows)
                else if (data.travel && data.travel.status === 'Traveling') {
                    color = '#2196F3';
                    const country = this.getCountryShort(data.travel.destination);
                    const direction = data.travel.direction === 'Out' ? `> ${country}` : `${country} <`;
                    statusText = `${direction}`;
                }
                // Default
                else {
                    color = '#757575';
                    statusText = status || 'Unknown';
                }
                statusSpan.textContent = statusText;
                statusSpan.style.background = color;
                statusSpan.style.color = '#fff';
            } catch (e) {
                usernameSpan.textContent = 'Error';
                statusSpan.textContent = 'Error';
                statusSpan.style.background = '#222';
            }
        },

        // Periodically refresh all targets in all attack lists
        startAutoRefresh() {
            setInterval(() => {
                const pages = window.loadState?.(window.STORAGE_KEYS?.SIDEBAR_PAGES, []);
                const currentPage = window.loadState?.(window.STORAGE_KEYS?.CURRENT_PAGE, 0);
                if (!pages || !pages[currentPage] || !pages[currentPage].attackLists) return;
                pages[currentPage].attackLists.forEach(list => {
                    if (list.targets) {
                        list.targets.forEach(target => {
                            this.refreshTargetStatus(target.id, target.targetId);
                        });
                    }
                });
            }, 30000); // 30 seconds
        },
        
        // Save new target to storage
        saveTargetToStorage(listId, itemId, name, targetId) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            const attackList = pages[currentPage].attackLists?.find(list => list.id === listId);
            if (attackList) {
                if (!attackList.targets) attackList.targets = [];
                attackList.targets.push({ id: itemId, name, targetId });
                window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
            }
        },
        
        // Update target in storage
        updateTargetInStorage(listId, itemId, name, targetId) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            const attackList = pages[currentPage].attackLists?.find(list => list.id === listId);
            if (attackList) {
                if (!attackList.targets) attackList.targets = [];
                const existingTarget = attackList.targets.find(target => target.id === itemId);
                if (existingTarget) {
                    existingTarget.name = name;
                    existingTarget.targetId = targetId;
                } else {
                    attackList.targets.push({ id: itemId, name, targetId });
                }
                window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
            }
        },
        
        // Remove target from storage
        removeTargetFromStorage(listId, itemId) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            const attackList = pages[currentPage].attackLists?.find(list => list.id === listId);
            if (attackList && attackList.targets) {
                attackList.targets = attackList.targets.filter(target => target.id !== itemId);
                window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
            }
        },
        
        // Save attack list to storage
        saveToStorage(attackList) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            if (!pages[currentPage].attackLists) pages[currentPage].attackLists = [];
            pages[currentPage].attackLists.push(attackList);
            
            window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
        }
    };
    

    // Modular registration: attach to SidekickModules for loader-based initialization
    if (!window.SidekickModules) window.SidekickModules = {};
    window.SidekickModules.AttackList = AttackListModule;

})();
