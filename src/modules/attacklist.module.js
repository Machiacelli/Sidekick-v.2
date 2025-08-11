// ==UserScript==
// @name         Sidewinder - Attack List Module
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Attack List functionality for Sidewinder
// @author       You
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
            
            // Create attack list element to add inside sidebar
            const attackElement = document.createElement('div');
            attackElement.className = 'sidebar-item';
            attackElement.dataset.id = attackList.id;
            attackElement.style.cssText = `
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                transition: all 0.3s ease;
            `;
            
            attackElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <input type="text" value="${attackList.title}" data-attack-id="${attackList.id}"
                           style="background: #333; border: 1px solid #555; color: #fff; padding: 6px 8px; border-radius: 4px; font-weight: bold; flex: 1; margin-right: 8px;">
                    <button class="remove-btn" data-item-id="${attackList.id}" data-item-type="attacklist" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 4px;">×</button>
                </div>
                <div id="attack-targets-${attackList.id}" style="margin-bottom: 8px;"></div>
                <button class="add-attack-target" data-list-id="${attackList.id}" style="width: 100%; background: #f44336; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 14px;">+ Add Target</button>
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
                        console.log(`🗑️ Removing attack list: ${attackList.id}`);
                        if (window.removeSidebarItem) {
                            window.removeSidebarItem(attackList.id, 'attacklist');
                        }
                    });
                }
            }, 50);
            
            // Add hover effects
            this.addHoverEffects(attackElement);
            
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
            attackElement.className = 'sidebar-item';
            attackElement.dataset.id = attackList.id;
            attackElement.style.cssText = `
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
                transition: all 0.3s ease;
            `;
            
            attackElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <input type="text" value="${attackList.title || 'Untitled Attack List'}" data-attack-id="${attackList.id}"
                           style="background: #333; border: 1px solid #555; color: #fff; padding: 6px 8px; border-radius: 4px; font-weight: bold; flex: 1; margin-right: 8px;">
                    <button class="remove-btn" data-item-id="${attackList.id}" data-item-type="attacklist" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 4px;">×</button>
                </div>
                <div id="attack-targets-${attackList.id}" style="margin-bottom: 8px;"></div>
                <button class="add-attack-target" data-list-id="${attackList.id}" style="width: 100%; background: #f44336; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 14px;">+ Add Target</button>
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
            
            // Add hover effects
            this.addHoverEffects(attackElement);
            
            const attackContainer = document.getElementById('sidekick-attacks');
            if (attackContainer) {
                attackContainer.appendChild(attackElement);
            }
            
            // Restore attack targets if they exist
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
        
        // Add target to DOM element
        addTargetToElement(listId, name = '', targetId = '', itemId = null) {
            const container = document.getElementById(`attack-targets-${listId}`);
            if (!container) return;
            
            if (!itemId) itemId = Date.now() + Math.random();
            
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
            `;
            
            targetElement.innerHTML = `
                <input type="text" placeholder="Target name" value="${name}" data-target-name-id="${itemId}"
                       style="flex: 1; background: transparent; border: none; color: #fff; padding: 4px;">
                <input type="text" placeholder="ID" value="${targetId}" data-target-id-id="${itemId}"
                       style="width: 80px; background: transparent; border: none; color: #fff; padding: 4px;">
                <button class="remove-attack-target" data-target-remove-id="${itemId}"
                        style="background: none; border: none; color: #f44336; cursor: pointer; padding: 2px;">×</button>
            `;
            
            container.appendChild(targetElement);
            
            // Add event listeners
            setTimeout(() => {
                const nameInput = targetElement.querySelector(`input[data-target-name-id="${itemId}"]`);
                const idInput = targetElement.querySelector(`input[data-target-id-id="${itemId}"]`);
                const removeBtn = targetElement.querySelector(`button[data-target-remove-id="${itemId}"]`);
                
                if (nameInput) {
                    nameInput.addEventListener('change', () => {
                        this.updateTargetInStorage(listId, itemId, nameInput.value, idInput.value);
                    });
                    nameInput.addEventListener('input', () => {
                        this.updateTargetInStorage(listId, itemId, nameInput.value, idInput.value);
                    });
                }
                if (idInput) {
                    idInput.addEventListener('change', () => {
                        this.updateTargetInStorage(listId, itemId, nameInput.value, idInput.value);
                    });
                    idInput.addEventListener('input', () => {
                        this.updateTargetInStorage(listId, itemId, nameInput.value, idInput.value);
                    });
                }
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        targetElement.remove();
                        this.removeTargetFromStorage(listId, itemId);
                    });
                }
            }, 50);
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
    
    // Register module when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => AttackListModule.init(), 100);
        });
    } else {
        setTimeout(() => AttackListModule.init(), 100);
    }
    
    // Expose module globally
    window.AttackListModule = AttackListModule;
    
})();
