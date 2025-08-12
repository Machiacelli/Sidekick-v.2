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
            init() {
                console.log('🎯 Initializing Content Module...');
                // Initialize pages if none exist
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                if (pages.length === 0) {
                    pages.push({ notepads: [], todoLists: [], attackLists: [] });
                    saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                }
                
                // Set initial page if none set
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                if (currentPage >= pages.length) {
                    saveState(STORAGE_KEYS.CURRENT_PAGE, 0);
                }
                
                // Restore saved content after a short delay to ensure UI is ready
                setTimeout(() => {
                    this.restoreSavedContent();
                }, 500);
                
                console.log('✅ Content Module initialized');
            },

            showAddMenu() {
                // Check if menu already exists and remove it (toggle behavior)
                const existingMenu = document.getElementById('sidekick-add-menu');
                if (existingMenu) {
                    this.closeAddMenu();
                    return;
                }

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
                if (window.SidekickModules?.FlightTracker?.addTravelTracker) {
                    window.SidekickModules.FlightTracker.addTravelTracker();
                    this.closeAddMenu();
                } else {
                    console.error('FlightTracker module not available');
                    NotificationSystem.show('Travel Tracker', 'Travel tracker module not loaded!', 'error');
                }
            },

            // === ELEMENT CREATION FUNCTIONS ===
            createNotepadElement(notepad) {
                const notepadElement = document.createElement('div');
                notepadElement.className = 'sidebar-item';
                notepadElement.dataset.id = notepad.id;
                
                // Load saved position and size from localStorage
                const savedNotepad = JSON.parse(localStorage.getItem(`notepad_${notepad.id}_layout`) || '{}');
                const defaultWidth = 280;
                const defaultHeight = 150;
                const defaultX = 10;
                const defaultY = 10;
                
                notepadElement.style.cssText = `
                    position: absolute;
                    left: ${savedNotepad.x || defaultX}px;
                    top: ${savedNotepad.y || defaultY}px;
                    width: ${savedNotepad.width || defaultWidth}px;
                    height: ${savedNotepad.height || defaultHeight}px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    min-width: 200px;
                    min-height: 100px;
                    z-index: 1000;
                    resize: ${savedNotepad.pinned ? 'none' : 'both'};
                    overflow: hidden;
                `;
                
                notepadElement.innerHTML = `
                    <div class="notepad-header" style="
                        background: #333;
                        border-bottom: 1px solid #555;
                        padding: 4px 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: ${savedNotepad.pinned ? 'default' : 'move'};
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
                                    min-width: 120px;
                                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                                    z-index: 1001;
                                    border-radius: 4px;
                                    border: 1px solid #555;
                                    top: 100%;
                                    left: 0;
                                ">
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
                                        ${savedNotepad.pinned ? '📌 Unpin' : '📌 Pin'}
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
                        " title="Delete notepad">×</button>
                    </div>
                    <textarea placeholder="Write your notes here..." data-notepad-content-id="${notepad.id}" style="
                        flex: 1;
                        background: transparent;
                        border: none;
                        color: #fff;
                        padding: 12px;
                        font-size: 13px;
                        font-family: inherit;
                        resize: none;
                        outline: none;
                        line-height: 1.4;
                        width: 100%;
                        box-sizing: border-box;
                    ">${notepad.content || ''}</textarea>
                `;
                
                // Add event listeners for proper functionality
                setTimeout(() => {
                    const contentTextarea = notepadElement.querySelector(`textarea[data-notepad-content-id="${notepad.id}"]`);
                    const header = notepadElement.querySelector('.notepad-header');
                    const closeBtn = notepadElement.querySelector('.close-btn');
                    const removeBtn = closeBtn; // Use same variable for consistency
                    const dropdownBtn = notepadElement.querySelector('.dropdown-btn');
                    const dropdownContent = notepadElement.querySelector('.dropdown-content');
                    const pinBtn = notepadElement.querySelector('.pin-btn');
                    
                    let isDrawing = false;
                    let isPinned = savedNotepad.pinned || false;
                    
                    // Save position and size function
                    function saveLayout() {
                        const rect = notepadElement.getBoundingClientRect();
                        const sidebarRect = document.getElementById('sidekick-sidebar').getBoundingClientRect();
                        const layout = {
                            x: notepadElement.offsetLeft,
                            y: notepadElement.offsetTop,
                            width: notepadElement.offsetWidth,
                            height: notepadElement.offsetHeight,
                            pinned: isPinned
                        };
                        localStorage.setItem(`notepad_${notepad.id}_layout`, JSON.stringify(layout));
                    }
                    
                    // Auto-save content on input
                    if (contentTextarea) {
                        contentTextarea.addEventListener('input', (e) => {
                            if (window.updateNotepadContent) {
                                window.updateNotepadContent(notepad.id, e.target.value);
                            }
                        });
                        
                        // Focus effects on the entire notepad
                        contentTextarea.addEventListener('focus', () => {
                            notepadElement.style.borderColor = '#66BB6A';
                            notepadElement.style.boxShadow = '0 0 0 2px rgba(102, 187, 106, 0.2)';
                        });
                        
                        contentTextarea.addEventListener('blur', () => {
                            notepadElement.style.borderColor = '#444';
                            notepadElement.style.boxShadow = 'none';
                        });
                    }
                    
                    // Close button functionality
                    if (closeBtn) {
                        closeBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (confirm('Delete this notepad?')) {
                                localStorage.removeItem(`notepad_${notepad.id}_layout`);
                                if (window.removeContent) {
                                    window.removeContent(notepad.id, 'notepad');
                                }
                            }
                        });
                    }
                    
                    // Dropdown functionality
                    if (dropdownBtn && dropdownContent) {
                        dropdownBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
                        });
                        
                        // Close dropdown when clicking outside
                        document.addEventListener('click', () => {
                            dropdownContent.style.display = 'none';
                        });
                    }
                    
                    // Pin functionality
                    if (pinBtn) {
                        pinBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            isPinned = !isPinned;
                            pinBtn.textContent = isPinned ? '📌 Unpin' : '📌 Pin';
                            notepadElement.style.resize = isPinned ? 'none' : 'both';
                            header.style.cursor = isPinned ? 'default' : 'move';
                            saveLayout();
                            dropdownContent.style.display = 'none';
                        });
                    }
                    
                    // Color picker functionality
                    const colorBtn = notepadElement.querySelector('.color-btn');
                    if (colorBtn) {
                        colorBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            dropdownContent.style.display = 'none';
                            
                            // Call the color picker function from notepad module
                            if (window.SidekickModules?.Notepad?.showColorPicker) {
                                window.SidekickModules.Notepad.showColorPicker(notepadElement, notepad);
                            } else {
                                console.warn('Color picker functionality not available');
                            }
                        });
                    }
                    
                    // Dragging functionality (only if not pinned)
                    if (header) {
                        let isDragging = false;
                        let dragOffset = { x: 0, y: 0 };
                        
                        header.addEventListener('mousedown', (e) => {
                            if (isPinned) return;
                            isDragging = true;
                            const rect = notepadElement.getBoundingClientRect();
                            dragOffset.x = e.clientX - rect.left;
                            dragOffset.y = e.clientY - rect.top;
                            e.preventDefault();
                        });
                        
                        document.addEventListener('mousemove', (e) => {
                            if (!isDragging || isPinned) return;
                            
                            const sidebar = document.getElementById('sidekick-sidebar');
                            const sidebarRect = sidebar.getBoundingClientRect();
                            
                            let newX = e.clientX - sidebarRect.left - dragOffset.x;
                            let newY = e.clientY - sidebarRect.top - dragOffset.y;
                            
                            // Keep within sidebar bounds
                            newX = Math.max(0, Math.min(newX, sidebar.offsetWidth - notepadElement.offsetWidth));
                            newY = Math.max(0, Math.min(newY, sidebar.offsetHeight - notepadElement.offsetHeight));
                            
                            notepadElement.style.left = newX + 'px';
                            notepadElement.style.top = newY + 'px';
                        });
                        
                        document.addEventListener('mouseup', () => {
                            if (isDragging) {
                                isDragging = false;
                                saveLayout();
                            }
                        });
                    }
                    
                    // Resize observer to save size changes
                    if (window.ResizeObserver) {
                        const resizeObserver = new ResizeObserver(() => {
                            if (!isPinned) {
                                saveLayout();
                            }
                        });
                        resizeObserver.observe(notepadElement);
                    }
                    
                    if (removeBtn) {
                        removeBtn.addEventListener('click', () => {
                            console.log('🗑️ Delete button clicked for notepad:', notepad.id);
                            
                            // Remove from DOM
                            notepadElement.remove();
                            
                            // Remove from notepad module data
                            if (window.SidekickModules?.Notepad?.deleteNotepad) {
                                window.SidekickModules.Notepad.deleteNotepad(notepad.id);
                            } else {
                                console.warn('Notepad deletion method not available');
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
                
                // Update notepad module's current page and reload notepads
                if (window.SidekickModules?.Notepad) {
                    window.SidekickModules.Notepad.currentPage = pageIndex;
                    window.SidekickModules.Notepad.loadNotepads();
                    window.SidekickModules.Notepad.refreshDisplay();
                }
                
                // Update dot appearance
                document.querySelectorAll('.sidekick-page-dot').forEach((dot, index) => {
                    dot.classList.toggle('active', index === pageIndex);
                });
                
                // Refresh content for new page (excluding notepads since we handled them above)
                this.refreshSidebarContent();
            },

            addNewPage() {
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                
                // Add new empty page
                pages.push({ notepads: [], todoLists: [], attackLists: [] });
                saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                
                // Update page dots using UI module
                if (window.SidekickModules?.UI?.updatePageDots) {
                    window.SidekickModules.UI.updatePageDots();
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
                
                // Clear non-notepad containers (notepads are handled by the notepad module)
                const todoContainer = document.getElementById('sidekick-todos');
                const attackContainer = document.getElementById('sidekick-attacks');
                
                if (todoContainer) todoContainer.innerHTML = '';
                if (attackContainer) attackContainer.innerHTML = '';
                
                // Note: Notepads are handled by the notepad module's refreshDisplay method
                
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
                
                console.log(`✅ Restored ${pageData.notepads?.length || 0} notepads (via notepad module), ${pageData.todoLists?.length || 0} todo lists, ${pageData.attackLists?.length || 0} attack lists`);
            },

            refreshSidebarContent() {
                // Clear current content (excluding notepads which are managed by notepad module)
                const todoContainer = document.getElementById('sidekick-todos');
                const attackContainer = document.getElementById('sidekick-attacks');
                
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
