// ==UserScript==
// @name         Sidewinder Content Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Content management (notepads, todos, attack lists) for Sidewinder sidebar
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
        const { STORAGE_KEYS, saveState, loadState, NotificationSystem, DataTemplates } = window.SidekickModules.Core;

        // === CONTENT MANAGEMENT ===
        const ContentManager = {
            showAddMenu() {
                const menu = document.createElement('div');
                menu.id = 'sidekick-add-menu';
                
                // Get sidebar position to position menu relative to it
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { left: 30, bottom: 100 };
                
                menu.style.cssText = `
                    position: fixed !important;
                    bottom: ${window.innerHeight - sidebarRect.bottom + 70}px !important;
                    left: ${sidebarRect.left + 15}px !important;
                    background: linear-gradient(145deg, #2a2a2a, #1f1f1f) !important;
                    border: 1px solid #444 !important;
                    border-radius: 12px !important;
                    padding: 12px !important;
                    z-index: 999999 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    gap: 8px !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
                    min-width: 200px !important;
                `;
                
                const menuItems = [
                    { icon: '📝', text: 'Add Notepad', color: '#4CAF50', action: () => this.addNotepad() },
                    { icon: '✅', text: 'Add Todo List', color: '#2196F3', action: () => this.addTodoList() },
                    { icon: '⚔️', text: 'Add Attack List', color: '#f44336', action: () => this.addAttackList() },
                    { icon: '⏱️', text: 'Add Timer', color: '#ff9800', action: () => this.addTimer() },
                    { icon: '✈️', text: 'Travel Tracker', color: '#9C27B0', action: () => this.addTravelTracker() }
                ];
                
                menuItems.forEach(item => {
                    const menuItem = document.createElement('button');
                    menuItem.style.cssText = `
                        display: flex !important;
                        align-items: center !important;
                        gap: 12px !important;
                        padding: 12px 16px !important;
                        background: transparent !important;
                        border: none !important;
                        color: #fff !important;
                        cursor: pointer !important;
                        border-radius: 8px !important;
                        transition: all 0.3s ease !important;
                        font-size: 14px !important;
                        width: 100% !important;
                        text-align: left !important;
                    `;
                    
                    menuItem.innerHTML = `
                        <span style="font-size: 18px;">${item.icon}</span>
                        <span>${item.text}</span>
                    `;
                    
                    menuItem.addEventListener('mouseenter', () => {
                        menuItem.style.background = item.color + '22';
                        menuItem.style.borderLeft = `3px solid ${item.color}`;
                    });
                    
                    menuItem.addEventListener('mouseleave', () => {
                        menuItem.style.background = 'transparent';
                        menuItem.style.borderLeft = 'none';
                    });
                    
                    menuItem.addEventListener('click', () => {
                        item.action();
                        this.closeAddMenu();
                    });
                    
                    menu.appendChild(menuItem);
                });
                
                document.body.appendChild(menu);
                
                // Close menu when clicking outside
                setTimeout(() => {
                    const closeHandler = (e) => {
                        if (!menu.contains(e.target) && 
                            e.target.id !== 'sidekick-add-btn' && 
                            e.target.id !== 'sidekick-panel-btn') {
                            this.closeAddMenu();
                            document.removeEventListener('click', closeHandler);
                        }
                    };
                    document.addEventListener('click', closeHandler);
                }, 100);
            },

            closeAddMenu() {
                const menu = document.getElementById('sidekick-add-menu');
                if (menu) {
                    menu.remove();
                }
            },

            // === ADD FUNCTIONS ===
            addNotepad() {
                const notepad = DataTemplates.createNotepad();
                
                // Create notepad element to add inside sidebar
                const notepadElement = this.createNotepadElement(notepad);
                
                // Add to sidebar content
                const notepadContainer = document.getElementById('sidekick-notepads');
                if (notepadContainer) {
                    notepadContainer.appendChild(notepadElement);
                }
                
                // Save to current page
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                if (!pages[currentPage].notepads) pages[currentPage].notepads = [];
                pages[currentPage].notepads.push(notepad);
                
                saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                NotificationSystem.show('Success', 'Notepad created!', 'info');
            },

            addTodoList() {
                const todoList = DataTemplates.createTodoList();
                
                // Create todo list element to add inside sidebar
                const todoElement = this.createTodoListElement(todoList);
                
                // Add to sidebar content
                const todoContainer = document.getElementById('sidekick-todos');
                if (todoContainer) {
                    todoContainer.appendChild(todoElement);
                }
                
                // Save to current page
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                if (!pages[currentPage].todoLists) pages[currentPage].todoLists = [];
                pages[currentPage].todoLists.push(todoList);
                
                saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                NotificationSystem.show('Success', 'Todo list created!', 'info');
            },

            addAttackList() {
                const attackList = DataTemplates.createAttackList();
                
                // Create attack list element to add inside sidebar
                const attackElement = this.createAttackListElement(attackList);
                
                // Add to sidebar content
                const attackContainer = document.getElementById('sidekick-attacks');
                if (attackContainer) {
                    attackContainer.appendChild(attackElement);
                }
                
                // Save to current page
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                if (!pages[currentPage].attackLists) pages[currentPage].attackLists = [];
                pages[currentPage].attackLists.push(attackList);
                
                saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                NotificationSystem.show('Success', 'Attack list created!', 'info');
            },

            addTimer() {
                // Use existing timer functionality - just show notification
                NotificationSystem.show('Timer', 'Use the existing timer functionality in the sidebar', 'info');
                console.log('ℹ️ Timer functionality already available in sidebar');
            },

            addTravelTracker() {
                NotificationSystem.show('Travel Tracker', 'Travel tracker functionality coming soon!', 'info');
            },

            // === ELEMENT CREATION FUNCTIONS ===
            createNotepadElement(notepad) {
                const notepadElement = document.createElement('div');
                notepadElement.className = 'sidebar-item';
                notepadElement.dataset.id = notepad.id;
                notepadElement.style.cssText = `
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 12px;
                    transition: all 0.3s ease;
                `;
                
                notepadElement.innerHTML = `
                    <textarea placeholder="Write your notes here..." data-notepad-content-id="${notepad.id}"
                              style="width: 100%; height: 120px; background: #2a2a2a; border: 1px solid #444; color: #fff; padding: 12px; border-radius: 8px; resize: both; font-family: inherit; box-sizing: border-box; outline: none; font-size: 13px; line-height: 1.4;">${notepad.content || ''}</textarea>
                `;
                
                // Add event listeners for proper functionality
                setTimeout(() => {
                    const contentTextarea = notepadElement.querySelector(`textarea[data-notepad-content-id="${notepad.id}"]`);
                    
                    if (contentTextarea) {
                        // Auto-save content on input
                        contentTextarea.addEventListener('input', (e) => {
                            if (window.updateNotepadContent) {
                                window.updateNotepadContent(notepad.id, e.target.value);
                            }
                        });
                        
                        // Enhanced focus effects
                        contentTextarea.addEventListener('focus', () => {
                            contentTextarea.style.borderColor = '#66BB6A';
                            contentTextarea.style.boxShadow = '0 0 0 2px rgba(102, 187, 106, 0.2)';
                        });
                        
                        contentTextarea.addEventListener('blur', () => {
                            contentTextarea.style.borderColor = '#444';
                            contentTextarea.style.boxShadow = 'none';
                        });
                        
                        // Right-click delete functionality
                        contentTextarea.addEventListener('contextmenu', (e) => {
                            e.preventDefault();
                            if (confirm('Delete this notepad?')) {
                                if (window.removeContent) {
                                    window.removeContent(notepad.id, 'notepad');
                                }
                            }
                        });
                    }
                    
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            if (window.removeSidebarItem) {
                                window.removeSidebarItem(notepad.id, 'notepad');
                            }
                        });
                    }
                }, 50);
                
                // Add hover effects
                notepadElement.addEventListener('mouseenter', () => {
                    notepadElement.style.background = '#333';
                    notepadElement.style.borderColor = '#555';
                });
                
                notepadElement.addEventListener('mouseleave', () => {
                    notepadElement.style.background = '#2a2a2a';
                    notepadElement.style.borderColor = '#444';
                });
                
                return notepadElement;
            },

            createTodoListElement(todoList) {
                const todoElement = document.createElement('div');
                todoElement.className = 'sidebar-item';
                todoElement.dataset.id = todoList.id;
                todoElement.style.cssText = `
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 12px;
                    transition: all 0.3s ease;
                `;
                
                todoElement.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <input type="text" value="${todoList.title || 'Untitled Todo List'}" data-todo-id="${todoList.id}"
                               style="background: #333; border: 1px solid #555; color: #fff; padding: 6px 8px; border-radius: 4px; font-weight: bold; flex: 1; margin-right: 8px;">
                        <button class="remove-btn" data-item-id="${todoList.id}" data-item-type="todolist" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 4px;">×</button>
                    </div>
                    <div id="todo-items-${todoList.id}" style="margin-bottom: 8px;"></div>
                    <button class="add-todo-item" data-list-id="${todoList.id}" style="width: 100%; background: #2196F3; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 14px;">+ Add Item</button>
                `;
                
                // Add event listeners for proper functionality
                setTimeout(() => {
                    const titleInput = todoElement.querySelector(`input[data-todo-id="${todoList.id}"]`);
                    const removeBtn = todoElement.querySelector('.remove-btn');
                    const addItemBtn = todoElement.querySelector('.add-todo-item');
                    
                    if (titleInput) {
                        titleInput.addEventListener('input', (e) => {
                            if (window.updateTodoTitle) {
                                window.updateTodoTitle(todoList.id, e.target.value);
                            }
                        });
                    }
                    
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            if (window.removeSidebarItem) {
                                window.removeSidebarItem(todoList.id, 'todolist');
                            }
                        });
                    }
                    
                    if (addItemBtn) {
                        addItemBtn.addEventListener('click', () => {
                            this.addTodoItemToList(todoList.id);
                        });
                    }
                }, 50);
                
                // Add hover effects
                todoElement.addEventListener('mouseenter', () => {
                    todoElement.style.background = '#333';
                    todoElement.style.borderColor = '#555';
                });
                
                todoElement.addEventListener('mouseleave', () => {
                    todoElement.style.background = '#2a2a2a';
                    todoElement.style.borderColor = '#444';
                });
                
                // Restore todo items if they exist
                if (todoList.items && todoList.items.length > 0) {
                    setTimeout(() => {
                        todoList.items.forEach(item => {
                            this.addTodoItemToElement(todoList.id, item.text || '', item.completed || false);
                        });
                    }, 100);
                }
                
                return todoElement;
            },

            createAttackListElement(attackList) {
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
                
                // Add event listeners for proper functionality
                setTimeout(() => {
                    const titleInput = attackElement.querySelector(`input[data-attack-id="${attackList.id}"]`);
                    const removeBtn = attackElement.querySelector('.remove-btn');
                    const addTargetBtn = attackElement.querySelector('.add-attack-target');
                    
                    if (titleInput) {
                        titleInput.addEventListener('input', (e) => {
                            if (window.updateAttackTitle) {
                                window.updateAttackTitle(attackList.id, e.target.value);
                            }
                        });
                    }
                    
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            if (window.removeSidebarItem) {
                                window.removeSidebarItem(attackList.id, 'attacklist');
                            }
                        });
                    }
                    
                    if (addTargetBtn) {
                        addTargetBtn.addEventListener('click', () => {
                            this.addAttackTargetToList(attackList.id);
                        });
                    }
                }, 50);
                
                // Add hover effects
                attackElement.addEventListener('mouseenter', () => {
                    attackElement.style.background = '#333';
                    attackElement.style.borderColor = '#555';
                });
                
                attackElement.addEventListener('mouseleave', () => {
                    attackElement.style.background = '#2a2a2a';
                    attackElement.style.borderColor = '#444';
                });
                
                // Restore attack targets if they exist
                if (attackList.targets && attackList.targets.length > 0) {
                    setTimeout(() => {
                        attackList.targets.forEach(target => {
                            this.addAttackTargetToElement(attackList.id, target.name || '', target.targetId || '');
                        });
                    }, 100);
                }
                
                return attackElement;
            },

            // === TODO ITEM MANAGEMENT ===
            addTodoItemToList(listId) {
                this.addTodoItemToElement(listId, '', false);
                
                // Update storage
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                const todoList = pages[currentPage].todoLists?.find(list => list.id === listId);
                if (todoList) {
                    if (!todoList.items) todoList.items = [];
                    todoList.items.push({ text: '', completed: false, id: Date.now() + Math.random() });
                    saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                }
            },

            // Helper function to add todo item during restoration (doesn't update storage)
            addTodoItemToElement(listId, text = '', completed = false) {
                const container = document.getElementById(`todo-items-${listId}`);
                if (!container) return;
                
                const itemId = Date.now() + Math.random();
                const itemElement = document.createElement('div');
                itemElement.className = 'todo-item';
                itemElement.dataset.itemId = itemId;
                itemElement.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px;
                    background: #333;
                    border-radius: 4px;
                    margin-bottom: 4px;
                `;
                
                itemElement.innerHTML = `
                    <input type="checkbox" ${completed ? 'checked' : ''} data-todo-item-id="${itemId}" style="margin: 0;">
                    <input type="text" value="${text}" data-todo-text-id="${itemId}" 
                           style="flex: 1; background: transparent; border: none; color: #fff; padding: 4px;">
                    <button class="remove-todo-item" data-todo-remove-id="${itemId}" 
                            style="background: none; border: none; color: #f44336; cursor: pointer; padding: 2px;">×</button>
                `;
                
                container.appendChild(itemElement);
                
                // Add event listeners
                setTimeout(() => {
                    const checkbox = itemElement.querySelector(`input[data-todo-item-id="${itemId}"]`);
                    const textInput = itemElement.querySelector(`input[data-todo-text-id="${itemId}"]`);
                    const removeBtn = itemElement.querySelector(`button[data-todo-remove-id="${itemId}"]`);
                    
                    if (checkbox) {
                        checkbox.addEventListener('change', (e) => {
                            this.updateTodoItemInStorage(listId, itemId, textInput?.value || '', e.target.checked);
                        });
                    }
                    
                    if (textInput) {
                        textInput.addEventListener('input', (e) => {
                            this.updateTodoItemInStorage(listId, itemId, e.target.value, checkbox?.checked || false);
                        });
                    }
                    
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            itemElement.remove();
                            this.removeTodoItemFromStorage(listId, itemId);
                        });
                    }
                }, 50);
            },

            // === ATTACK TARGET MANAGEMENT ===
            addAttackTargetToList(listId) {
                this.addAttackTargetToElement(listId, '', '');
                
                // Update storage
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                const attackList = pages[currentPage].attackLists?.find(list => list.id === listId);
                if (attackList) {
                    if (!attackList.targets) attackList.targets = [];
                    attackList.targets.push({ name: '', targetId: '', id: Date.now() + Math.random() });
                    saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                }
            },

            // Helper function to add attack target during restoration (doesn't update storage)
            addAttackTargetToElement(listId, name = '', targetId = '') {
                const container = document.getElementById(`attack-targets-${listId}`);
                if (!container) return;
                
                const itemId = Date.now() + Math.random();
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
                        nameInput.addEventListener('input', (e) => {
                            this.updateAttackTargetInStorage(listId, itemId, e.target.value, idInput?.value || '');
                        });
                    }
                    
                    if (idInput) {
                        idInput.addEventListener('input', (e) => {
                            this.updateAttackTargetInStorage(listId, itemId, nameInput?.value || '', e.target.value);
                        });
                    }
                    
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            targetElement.remove();
                            this.removeAttackTargetFromStorage(listId, itemId);
                        });
                    }
                }, 50);
            },

            // === STORAGE UPDATE FUNCTIONS ===
            updateTodoItemInStorage(listId, itemId, text, completed) {
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                const todoList = pages[currentPage].todoLists?.find(list => list.id === listId);
                if (todoList && todoList.items) {
                    let item = todoList.items.find(item => item.id === itemId);
                    if (!item) {
                        item = { id: itemId, text: '', completed: false };
                        todoList.items.push(item);
                    }
                    item.text = text;
                    item.completed = completed;
                    saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                }
            },

            removeTodoItemFromStorage(listId, itemId) {
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                const todoList = pages[currentPage].todoLists?.find(list => list.id === listId);
                if (todoList && todoList.items) {
                    todoList.items = todoList.items.filter(item => item.id !== itemId);
                    saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                }
            },

            updateAttackTargetInStorage(listId, itemId, name, targetId) {
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                const attackList = pages[currentPage].attackLists?.find(list => list.id === listId);
                if (attackList && attackList.targets) {
                    let target = attackList.targets.find(target => target.id === itemId);
                    if (!target) {
                        target = { id: itemId, name: '', targetId: '' };
                        attackList.targets.push(target);
                    }
                    target.name = name;
                    target.targetId = targetId;
                    saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                }
            },

            removeAttackTargetFromStorage(listId, itemId) {
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                const attackList = pages[currentPage].attackLists?.find(list => list.id === listId);
                if (attackList && attackList.targets) {
                    attackList.targets = attackList.targets.filter(target => target.id !== itemId);
                    saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                }
            },

            // === PAGE MANAGEMENT ===
            switchToPage(pageIndex) {
                saveState(STORAGE_KEYS.CURRENT_PAGE, pageIndex);
                
                // Update dot appearance
                document.querySelectorAll('.sidekick-page-dot').forEach((dot, index) => {
                    dot.classList.toggle('active', index === pageIndex);
                });
                
                // Refresh content for new page
                this.refreshSidebarContent();
            },

            addNewPage() {
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                
                // Add new empty page
                pages.push({ notepads: [], todoLists: [], attackLists: [] });
                saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                
                // Update navigation
                const nav = document.querySelector('.sidekick-page-dots');
                if (nav) {
                    const newDot = document.createElement('div');
                    newDot.className = 'sidekick-page-dot';
                    newDot.dataset.page = pages.length - 1;
                    newDot.addEventListener('click', () => this.switchToPage(pages.length - 1));
                    
                    // Insert before add button
                    const addBtn = nav.querySelector('.sidekick-add-page-btn');
                    nav.insertBefore(newDot, addBtn);
                }
                
                // Switch to new page
                this.switchToPage(pages.length - 1);
                
                NotificationSystem.show('Success', 'New page created!', 'info');
            },

            // === CONTENT RESTORATION ===
            restoreSavedContent() {
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                if (!pages[currentPage]) return;
                
                const pageData = pages[currentPage];
                
                // Restore notepads
                if (pageData.notepads && pageData.notepads.length > 0) {
                    pageData.notepads.forEach(notepad => {
                        const element = this.createNotepadElement(notepad);
                        const container = document.getElementById('sidekick-notepads');
                        if (container) container.appendChild(element);
                    });
                }
                
                // Restore todo lists
                if (pageData.todoLists && pageData.todoLists.length > 0) {
                    pageData.todoLists.forEach(todoList => {
                        const element = this.createTodoListElement(todoList);
                        const container = document.getElementById('sidekick-todos');
                        if (container) container.appendChild(element);
                    });
                }
                
                // Restore attack lists
                if (pageData.attackLists && pageData.attackLists.length > 0) {
                    pageData.attackLists.forEach(attackList => {
                        const element = this.createAttackListElement(attackList);
                        const container = document.getElementById('sidekick-attacks');
                        if (container) container.appendChild(element);
                    });
                }
                
                console.log(`✅ Restored ${pageData.notepads?.length || 0} notepads, ${pageData.todoLists?.length || 0} todo lists, ${pageData.attackLists?.length || 0} attack lists`);
            },

            refreshSidebarContent() {
                // Clear current content
                const notepadContainer = document.getElementById('sidekick-notepads');
                const todoContainer = document.getElementById('sidekick-todos');
                const attackContainer = document.getElementById('sidekick-attacks');
                
                if (notepadContainer) notepadContainer.innerHTML = '';
                if (todoContainer) todoContainer.innerHTML = '';
                if (attackContainer) attackContainer.innerHTML = '';
                
                // Restore content for current page
                this.restoreSavedContent();
            }
        };

        // Export to global scope
        window.SidekickModules.Content = ContentManager;

        console.log('✅ Content module loaded');
    });

})();
