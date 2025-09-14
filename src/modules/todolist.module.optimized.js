// ==UserScript==
// @name         Sidekick To-Do List Module - Optimized
// @namespace    http://tampermonkey.net/
// @version      1.1.0-optimized
// @description  Optimized Daily To-Do List with instant loading
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
        const TodoListModule = {
            name: 'TodoList',
            version: '1.1.0-optimized',
            isActive: false,
            core: null,
            todoItems: [],
            lastResetDate: null,
            isPinned: false,

            // Todo item types
            todoItemTypes: {
                xanax1: {
                    name: 'Xanax 1',
                    icon: '💊',
                    color: '#FF6B6B',
                    description: 'First daily Xanax'
                },
                xanax2: {
                    name: 'Xanax 2',
                    icon: '💊',
                    color: '#FF6B6B',
                    description: 'Second daily Xanax'
                },
                xanax3: {
                    name: 'Xanax 3',
                    icon: '💊',
                    color: '#FF6B6B',
                    description: 'Third daily Xanax'
                },
                energyRefill: {
                    name: 'Energy Refill',
                    icon: '⚡',
                    color: '#4ECDC4',
                    description: 'Daily energy refill'
                },
                nerveRefill: {
                    name: 'Nerve Refill',
                    icon: '🧠',
                    color: '#45B7D1',
                    description: 'Daily nerve refill'
                },
                custom: {
                    name: 'Custom Task',
                    icon: '📝',
                    color: '#9C27B0',
                    description: 'Custom task (persistent)'
                }
            },

            init() {
                console.log('📋 Initializing To-Do List Module v1.1.0-optimized...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for To-Do List');
                    return false;
                }

                // Pre-load state immediately for instant activation
                this.loadState();
                
                // Check if daily reset is needed
                this.checkDailyReset();
                
                console.log('✅ To-Do List module initialized successfully');
                return true;
            },

            // Main activation method - optimized for instant display
            activate() {
                console.log('📋 To-Do List module activated!');
                
                if (this.isActive) {
                    this.hideTodoPanel();
                    return;
                }

                // Show panel immediately
                this.showTodoPanel();
            },

            showTodoPanel() {
                if (this.isActive) return;
                
                console.log('📋 Showing To-Do List panel...');
                
                // Create panel container immediately
                const panel = document.createElement('div');
                panel.id = 'sidekick-todo-panel';
                panel.className = 'sidekick-todo-panel';
                
                // Calculate default position and size
                const defaultWidth = 300;
                const defaultHeight = 200;
                const minWidth = 250;
                const minHeight = 150;
                const maxWidth = 500;
                const maxHeight = 600;

                // Position new panel with slight offset to avoid overlapping
                const existingPanels = document.querySelectorAll('.sidekick-todo-panel');
                const offset = existingPanels.length * 20;
                const defaultX = 20 + offset;
                const defaultY = 20 + offset;

                // Use saved position or defaults
                const savedPosition = this.core.loadState('todo_panel_position', { x: defaultX, y: defaultY });
                const savedSize = this.core.loadState('todo_panel_size', { width: defaultWidth, height: defaultHeight });
                
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

                // Create content area immediately
                const content = document.createElement('div');
                content.id = 'todo-content';
                content.style.cssText = `
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
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
                this.core.saveState('todo_panel_open', true);

                // Add event listeners immediately
                this.addPanelEventListeners(panel);
                this.addDragging(panel, header);
                this.addResizeFunctionality(panel);

                // Populate content immediately (data is already loaded)
                this.refreshDisplay();

                console.log('✅ To-Do List panel displayed instantly');
            },

            createHeader() {
                const header = document.createElement('div');
                header.className = 'todo-header';
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
                
                const leftContainer = document.createElement('div');
                leftContainer.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    position: relative;
                `;

                // Dropdown menu button
                const dropdownBtn = document.createElement('button');
                dropdownBtn.className = 'dropdown-btn';
                dropdownBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #bbb;
                    cursor: pointer;
                    font-size: 12px;
                    padding: 2px;
                    display: flex;
                    align-items: center;
                `;
                dropdownBtn.innerHTML = '▼';
                dropdownBtn.title = 'Add Todo Items';
                
                const title = document.createElement('div');
                title.style.cssText = `
                    color: #fff;
                    font-size: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                `;
                title.innerHTML = '📋 To-Do List';

                // Dropdown content
                const dropdownContent = this.createDropdownContent();
                
                leftContainer.appendChild(dropdownBtn);
                leftContainer.appendChild(title);
                leftContainer.appendChild(dropdownContent);

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
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    height: 16px;
                `;
                closeBtn.innerHTML = '×';
                closeBtn.title = 'Close panel';
                closeBtn.addEventListener('click', () => this.hideTodoPanel());

                header.appendChild(leftContainer);
                header.appendChild(closeBtn);

                // Add dropdown functionality
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const newDisplay = dropdownContent.style.display === 'block' ? 'none' : 'block';
                    dropdownContent.style.display = newDisplay;
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (e.target === dropdownBtn || dropdownContent.contains(e.target)) {
                        return;
                    }
                    dropdownContent.style.display = 'none';
                });
                
                return header;
            },

            createDropdownContent() {
                const dropdownContent = document.createElement('div');
                dropdownContent.className = 'dropdown-content';
                dropdownContent.style.cssText = `
                    display: none;
                    position: absolute;
                    background: #333;
                    min-width: 140px;
                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                    z-index: 9999;
                    border-radius: 4px;
                    border: 1px solid #555;
                    top: 100%;
                    left: 0;
                `;
                
                // Add todo item options
                Object.entries(this.todoItemTypes).forEach(([key, itemType]) => {
                    const addBtn = document.createElement('button');
                    addBtn.style.cssText = `
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
                        transition: background 0.2s;
                    `;
                    addBtn.innerHTML = `${itemType.icon} ${itemType.name}`;
                    
                    // Add hover effect
                    addBtn.addEventListener('mouseenter', () => {
                        addBtn.style.background = '#555';
                    });
                    
                    addBtn.addEventListener('mouseleave', () => {
                        addBtn.style.background = 'none';
                    });
                    
                    addBtn.addEventListener('click', () => {
                        this.addTodoItem(key, itemType);
                        dropdownContent.style.display = 'none';
                    });
                    
                    dropdownContent.appendChild(addBtn);
                });
                
                // Add separator
                const separator = document.createElement('div');
                separator.style.cssText = `
                    height: 1px;
                    background: #555;
                    margin: 4px 0;
                `;
                dropdownContent.appendChild(separator);
                
                // Add pin button
                const pinBtn = document.createElement('button');
                pinBtn.id = 'pin-panel-btn';
                pinBtn.style.cssText = `
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
                `;
                pinBtn.innerHTML = this.isPinned ? '📌 Unpin Panel' : '📌 Pin Panel';
                pinBtn.title = this.isPinned ? 'Unpin panel' : 'Pin panel to stay on top';
                
                pinBtn.addEventListener('mouseenter', () => {
                    pinBtn.style.background = '#555';
                });
                pinBtn.addEventListener('mouseleave', () => {
                    pinBtn.style.background = 'none';
                });
                
                pinBtn.addEventListener('click', () => {
                    this.togglePinPanel();
                    dropdownContent.style.display = 'none';
                });
                
                dropdownContent.appendChild(pinBtn);
                
                return dropdownContent;
            },

            // Optimized refresh display - instant rendering with pre-loaded data
            refreshDisplay() {
                const content = document.getElementById('todo-content');
                if (!content) {
                    console.error('❌ No #todo-content element found!');
                    return;
                }
                
                if (this.todoItems.length === 0) {
                    this.showEmptyState(content);
                    return;
                }
                
                // Clear content and add items instantly
                content.innerHTML = '';
                
                // Use document fragment for efficient DOM manipulation
                const fragment = document.createDocumentFragment();
                
                this.todoItems.forEach((item, index) => {
                    const itemElement = this.createTodoItemElement(item, index);
                    fragment.appendChild(itemElement);
                });
                
                content.appendChild(fragment);
                
                console.log(`✅ Instantly refreshed display with ${this.todoItems.length} todo items`);
            },

            showEmptyState(content) {
                content.innerHTML = `
                    <div style="
                        color: #888;
                        font-style: italic;
                        text-align: center;
                        padding: 40px 20px;
                        font-size: 14px;
                    ">
                        No todo items yet.<br>
                        Click the ▼ menu to add items.
                    </div>
                `;
            },

            addTodoItem(type, itemType) {
                console.log('📋 Adding todo item:', type, itemType.name);
                
                const todoItem = {
                    id: Date.now() + Math.random(),
                    type: type,
                    name: itemType.name,
                    icon: itemType.icon,
                    color: itemType.color,
                    description: itemType.description,
                    completed: false,
                    isCustom: type === 'custom',
                    customText: type === 'custom' ? 'Custom Task' : '',
                    createdAt: Date.now()
                };

                this.todoItems.push(todoItem);
                this.saveState();
                this.refreshDisplay();
                
                if (this.core && this.core.NotificationSystem) {
                    this.core.NotificationSystem.show('To-Do List', `Added ${itemType.name}`, 'info', 2000);
                }
            },

            createTodoItemElement(item, index) {
                const element = document.createElement('div');
                element.className = 'todo-item';
                element.dataset.itemId = item.id;
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
                    color: ${item.color};
                `;
                icon.textContent = item.icon;

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
                
                if (item.isCustom) {
                    // For custom tasks, make the name editable
                    const nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.value = item.customText;
                    nameInput.style.cssText = `
                        background: transparent;
                        border: none;
                        color: #fff;
                        font-weight: 600;
                        font-size: 14px;
                        outline: none;
                        padding: 0;
                    `;
                    
                    nameInput.addEventListener('change', (e) => {
                        item.customText = e.target.value;
                        this.saveState();
                    });
                    
                    name.appendChild(nameInput);
                } else {
                    name.textContent = item.name;
                }

                const description = document.createElement('div');
                description.style.cssText = `
                    color: #aaa;
                    font-size: 12px;
                `;
                description.textContent = item.description;

                info.appendChild(name);
                info.appendChild(description);

                const controls = document.createElement('div');
                controls.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;

                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = item.completed;
                checkbox.style.cssText = `
                    width: 16px;
                    height: 16px;
                    accent-color: ${item.color};
                    cursor: pointer;
                `;
                
                checkbox.addEventListener('change', (e) => {
                    item.completed = e.target.checked;
                    this.saveState();
                });
                
                controls.appendChild(checkbox);

                // Delete button
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
                deleteBtn.title = 'Delete item';
                deleteBtn.addEventListener('click', () => {
                    this.deleteTodoItem(index);
                });
                
                controls.appendChild(deleteBtn);

                element.appendChild(icon);
                element.appendChild(info);
                element.appendChild(controls);

                return element;
            },

            deleteTodoItem(index) {
                if (confirm('Delete this todo item?')) {
                    this.todoItems.splice(index, 1);
                    this.saveState();
                    this.refreshDisplay();
                }
            },

            hideTodoPanel() {
                const panel = document.getElementById('sidekick-todo-panel');
                if (panel) {
                    this.cleanupPanel(panel);
                    panel.remove();
                }
                
                this.isActive = false;
                this.core.saveState('todo_panel_open', false);
                console.log('📋 To-Do List panel hidden');
            },

            cleanupPanel(panel) {
                // Clean up drag handler
                if (panel._dragHandler) {
                    const header = panel.querySelector('.todo-header');
                    if (header) {
                        header.removeEventListener('mousedown', panel._dragHandler);
                    }
                    delete panel._dragHandler;
                }
                
                // Clean up resize observer
                if (panel._resizeObserver) {
                    panel._resizeObserver.disconnect();
                    delete panel._resizeObserver;
                }
            },

            addPanelEventListeners(panel) {
                // Panel-specific event listeners can be added here if needed
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
                this.core.saveState('todo_panel_position', position);
            },

            savePanelSize(panel) {
                const size = {
                    width: panel.offsetWidth,
                    height: panel.offsetHeight
                };
                this.core.saveState('todo_panel_size', size);
            },

            // Optimized state loading - instant loading with fallback
            loadState() {
                try {
                    console.log('📋 Loading state...');
                    
                    // Try localStorage first for fastest loading
                    try {
                        const savedItems = localStorage.getItem('todo_items');
                        const savedResetDate = localStorage.getItem('todo_last_reset_date');
                        const savedPinned = localStorage.getItem('todo_panel_pinned');
                        
                        if (savedItems) {
                            this.todoItems = JSON.parse(savedItems);
                            console.log('📋 Loaded from localStorage:', this.todoItems.length, 'items');
                        } else {
                            this.todoItems = [];
                        }
                        
                        this.lastResetDate = savedResetDate ? JSON.parse(savedResetDate) : null;
                        this.isPinned = savedPinned ? JSON.parse(savedPinned) : false;
                    } catch (localError) {
                        console.error('❌ localStorage load failed:', localError);
                        this.todoItems = [];
                        this.lastResetDate = null;
                        this.isPinned = false;
                    }
                    
                    // Also try core module if available (for compatibility)
                    if (this.core && this.core.loadState) {
                        try {
                            const coreItems = this.core.loadState('todo_items', null);
                            if (coreItems && coreItems.length > 0 && this.todoItems.length === 0) {
                                this.todoItems = coreItems;
                                console.log('📋 Using core module backup data');
                            }
                        } catch (coreError) {
                            console.warn('⚠️ Core module load failed:', coreError);
                        }
                    }
                    
                    console.log('📋 Final state loaded:', {
                        todoItems: this.todoItems.length,
                        lastResetDate: this.lastResetDate,
                        isPinned: this.isPinned
                    });
                } catch (error) {
                    console.error('❌ Failed to load To-Do List state:', error);
                    this.todoItems = [];
                    this.lastResetDate = null;
                    this.isPinned = false;
                }
            },

            // Optimized state saving - instant saving with dual storage
            saveState() {
                try {
                    // Save to localStorage for fastest loading
                    localStorage.setItem('todo_items', JSON.stringify(this.todoItems));
                    localStorage.setItem('todo_last_reset_date', JSON.stringify(this.lastResetDate));
                    localStorage.setItem('todo_panel_pinned', JSON.stringify(this.isPinned));
                    
                    // Also save using core module if available
                    if (this.core && this.core.saveState) {
                        try {
                            this.core.saveState('todo_items', this.todoItems);
                            this.core.saveState('todo_last_reset_date', this.lastResetDate);
                            this.core.saveState('todo_panel_pinned', this.isPinned);
                        } catch (coreError) {
                            console.warn('⚠️ Core module save failed:', coreError);
                        }
                    }
                    
                    console.log('💾 State saved successfully');
                } catch (error) {
                    console.error('❌ Failed to save To-Do List state:', error);
                }
            },

            checkDailyReset() {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
                
                if (!this.lastResetDate || this.lastResetDate < todayUTC.getTime()) {
                    console.log('🔄 Daily reset detected, clearing daily tasks...');
                    this.resetDailyTasks();
                    this.lastResetDate = todayUTC.getTime();
                    this.saveState();
                }
            },

            resetDailyTasks() {
                // Only reset non-custom tasks
                this.todoItems.forEach(item => {
                    if (!item.isCustom) {
                        item.completed = false;
                    }
                });
                console.log('🔄 Daily tasks reset');
            },

            togglePinPanel() {
                this.isPinned = !this.isPinned;

                const panel = document.getElementById('sidekick-todo-panel');
                if (panel) {
                    panel.style.resize = this.isPinned ? 'none' : 'both';
                    const header = panel.querySelector('.todo-header');
                    if (header) {
                        header.style.cursor = this.isPinned ? 'default' : 'move';
                    }
                }
                
                // Save pinned state
                this.core.saveState('todo_panel_pinned', this.isPinned);
                
                // Update pin button text
                const pinBtn = document.getElementById('pin-panel-btn');
                if (pinBtn) {
                    pinBtn.innerHTML = this.isPinned ? '📌 Unpin Panel' : '📌 Pin Panel';
                    pinBtn.title = this.isPinned ? 'Unpin panel' : 'Pin panel to stay on top';
                }
                
                if (this.core.NotificationSystem) {
                    this.core.NotificationSystem.show(
                        'To-Do List',
                        this.isPinned ? 'Panel pinned! It will stay on top of other panels.' : 'Panel unpinned.',
                        'info'
                    );
                }
            },

            restorePanelState() {
                try {
                    const wasOpen = this.core.loadState('todo_panel_open', false);
                    if (wasOpen) {
                        console.log('🔄 Restoring To-Do List panel state...');
                        setTimeout(() => {
                            if (document.getElementById('sidekick-content')) {
                                this.showTodoPanel();
                                console.log('✅ To-Do List panel restored successfully');
                            }
                        }, 1000);
                    }
                } catch (error) {
                    console.error('❌ Failed to restore panel state:', error);
                }
            }
        };

        // Register module with Sidekick
        if (window.SidekickModules) {
            window.SidekickModules.TodoList = TodoListModule;
            console.log('📋 Optimized To-Do List module registered with Sidekick');
        }

        // Initialize module
        TodoListModule.init();
        
        // Restore panel state if it was previously open
        TodoListModule.restorePanelState();
    });

})();
