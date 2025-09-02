// ==UserScript==
// @name         Sidekick To-Do List Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Daily To-Do List with automatic reset for Torn.com activities
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
            setTimeout(() => waitForCore(callback), 100);
        }
    }

    waitForCore(() => {
        const TodoListModule = {
            name: 'TodoList',
            version: '1.0.0',
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
                console.log('📋 Initializing To-Do List Module v1.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for To-Do List');
                    return false;
                }

                // Load saved state
                this.loadState();
                
                // Check if daily reset is needed
                this.checkDailyReset();
                
                // Show panel immediately if it was previously open (like other modules)
                this.restorePanelState();
                
                console.log('✅ To-Do List module initialized successfully');
                return true;
            },

            // Main activation method - called when user clicks To-Do List button
            activate() {
                console.log('📋 To-Do List module activated!');
                
                if (this.isActive) {
                    this.hideTodoPanel();
                    return;
                }

                this.showTodoPanel();
            },

            showTodoPanel() {
                if (this.isActive) return;
                
                console.log('📋 Showing To-Do List panel...');
                
                // Create panel container
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

                // Create header
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
                
                const headerControls = document.createElement('div');
                headerControls.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 4px;
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
                
                // Dropdown content
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
                        console.log('📋 Adding todo item:', key, itemType.name);
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
                pinBtn.innerHTML = '📌 Pin Panel';
                pinBtn.title = 'Pin panel to stay on top';
                
                // Add hover effects
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
                
                // Close button (X button)
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
                
                closeBtn.addEventListener('click', () => {
                    this.hideTodoPanel();
                });
                
                headerControls.appendChild(dropdownBtn);
                headerControls.appendChild(closeBtn);
                
                // Create left container for dropdown and title
                const leftContainer = document.createElement('div');
                leftContainer.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    position: relative;
                `;
                leftContainer.appendChild(dropdownBtn);
                leftContainer.appendChild(title);
                
                // Add dropdown content to leftContainer for proper positioning
                leftContainer.appendChild(dropdownContent);
                
                header.appendChild(leftContainer);
                header.appendChild(closeBtn);

                // Create content area
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

                // Assemble panel first
                panel.appendChild(header);
                panel.appendChild(content);
                
                // Add to sidebar content area BEFORE trying to populate content
                const contentArea = document.getElementById('sidekick-content');
                if (contentArea) {
                    contentArea.appendChild(panel);
                } else {
                    console.error('❌ Content area not found');
                    return;
                }
                
                // Debug: Check storage state before deciding what to show
                this.debugStorageState();
                
                // Force reload state to ensure we have the latest data
                console.log('🔄 Force reloading state before display...');
                this.loadState();
                
                // Now check if we have existing todo items and show them, otherwise show empty state
                console.log(`📋 Checking todo items in showTodoPanel: ${this.todoItems.length} items found`);
                if (this.todoItems && this.todoItems.length > 0) {
                    console.log(`📋 Found ${this.todoItems.length} existing todo items, restoring content...`);
                    this.refreshDisplay();
                } else {
                    console.log('📋 No existing todo items, showing empty state');
                    this.showEmptyState(content);
                }
                
                // Update pin button text based on saved state
                if (this.isPinned) {
                    pinBtn.innerHTML = '📌 Unpin Panel';
                    pinBtn.title = 'Unpin panel';
                }
                
                // Add event listeners
                this.addPanelEventListeners(panel, dropdownBtn, dropdownContent);
                
                // Add dragging functionality
                this.addDragging(panel, header);
                
                // Add resize functionality
                this.addResizeFunctionality(panel);
                
                // Mark as active
                this.isActive = true;
                
                // Save panel state
                this.core.saveState('todo_panel_open', true);
                
                console.log('✅ To-Do List panel displayed');
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
                console.log(`📋 Todo items array now has ${this.todoItems.length} items:`, this.todoItems);
                
                this.saveState();
                this.refreshDisplay();
                
                if (this.core && this.core.NotificationSystem) {
                    this.core.NotificationSystem.show('To-Do List', `Added ${itemType.name}`, 'info', 2000);
                }
            },

            refreshDisplay() {
                console.log('🔄 refreshDisplay() called');
                console.log('📋 todoItems length:', this.todoItems.length);
                console.log('📋 todoItems:', this.todoItems);
                
                // Wait a moment for DOM to be ready
                setTimeout(() => {
                    const content = document.getElementById('todo-content');
                    console.log('🔍 Found content element:', content);
                    
                    if (!content) {
                        console.error('❌ No #todo-content element found!');
                        return;
                    }
                    
                    if (this.todoItems.length === 0) {
                        console.log('📋 No items to display, showing empty state');
                        this.showEmptyState(content);
                        return;
                    }
                    
                    console.log('📋 Clearing content and adding items...');
                    content.innerHTML = '';
                    
                    this.todoItems.forEach((item, index) => {
                        console.log(`📋 Creating element for item ${index}:`, item.name);
                        const itemElement = this.createTodoItemElement(item, index);
                        content.appendChild(itemElement);
                    });
                    
                    console.log(`✅ Refreshed display with ${this.todoItems.length} todo items`);
                    console.log('🔍 Content element now contains:', content.children.length, 'children');
                }, 50); // Small delay to ensure DOM is ready
            },

            createTodoItemElement(item, index) {
                console.log(`🔨 Creating element for: ${item.name} (${item.type})`);
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
                    // Clean up event listeners and observers
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

            addPanelEventListeners(panel, dropdownBtn, dropdownContent) {
                // Dropdown functionality
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('📋 Dropdown button clicked, current display:', dropdownContent.style.display);
                    
                    const newDisplay = dropdownContent.style.display === 'block' ? 'none' : 'block';
                    dropdownContent.style.display = newDisplay;
                    console.log('📋 Dropdown display set to:', newDisplay);
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    // Don't close if clicking on the dropdown button or content
                    if (e.target === dropdownBtn || dropdownContent.contains(e.target)) {
                        return;
                    }
                    dropdownContent.style.display = 'none';
                });
            },

            addDragging(panel, header) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };

                header.addEventListener('mousedown', (e) => {
                    // Don't allow dragging if panel is pinned
                    if (this.isPinned) return;
                    
                    isDragging = true;
                    const rect = panel.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    e.preventDefault();
                });

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
                // Only add resize observer if not pinned
                if (this.isPinned) return;
                
                let resizeTimeout;
                let lastSize = { width: panel.offsetWidth, height: panel.offsetHeight };
                
                if (window.ResizeObserver) {
                    const resizeObserver = new ResizeObserver((entries) => {
                        // Don't apply constraints if panel is pinned
                        if (this.isPinned) return;
                        
                        // Clear previous timeout
                        if (resizeTimeout) clearTimeout(resizeTimeout);
                        
                        // Debounce resize events to prevent excessive saves
                        resizeTimeout = setTimeout(() => {
                            const currentSize = { 
                                width: panel.offsetWidth, 
                                height: panel.offsetHeight 
                            };
                            
                            // Only save if size actually changed significantly (more than 20px)
                            if (Math.abs(currentSize.width - lastSize.width) > 20 || 
                                Math.abs(currentSize.height - lastSize.height) > 20) {
                                lastSize = currentSize;
                                this.savePanelSize(panel);
                            }
                        }, 500); // 500ms debounce for much better performance
                    });
                    resizeObserver.observe(panel);
                    
                    // Store reference for cleanup
                    panel._resizeObserver = resizeObserver;
                }
                
                // Remove manual resize constraints - they're not needed and cause performance issues
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

            loadState() {
                try {
                    console.log('📋 Starting load process...');
                    
                    // Primary storage: try core module first (more reliable in this context)
                    let itemsLoaded = false;
                    
                    if (this.core && this.core.loadState) {
                        try {
                            const coreItems = this.core.loadState('todo_items', null);
                            const coreResetDate = this.core.loadState('todo_last_reset_date', null);
                            const corePinned = this.core.loadState('todo_panel_pinned', false);
                            
                            if (coreItems && Array.isArray(coreItems)) {
                                this.todoItems = coreItems;
                                this.lastResetDate = coreResetDate;
                                this.isPinned = corePinned;
                                itemsLoaded = true;
                                console.log('📋 Loaded To-Do List state from core module:', this.todoItems.length, 'items');
                            }
                        } catch (coreError) {
                            console.warn('⚠️ Core module load failed:', coreError);
                        }
                    }
                    
                    // Fallback: try localStorage if core module failed or returned no data
                    if (!itemsLoaded) {
                        try {
                            const savedItems = localStorage.getItem('todo_items');
                            const savedResetDate = localStorage.getItem('todo_last_reset_date');
                            const savedPinned = localStorage.getItem('todo_panel_pinned');
                            
                            if (savedItems) {
                                this.todoItems = JSON.parse(savedItems);
                                this.lastResetDate = savedResetDate ? JSON.parse(savedResetDate) : null;
                                this.isPinned = savedPinned ? JSON.parse(savedPinned) : false;
                                console.log('📋 Loaded To-Do List state from localStorage:', this.todoItems.length, 'items');
                            } else {
                                this.todoItems = [];
                                this.lastResetDate = null;
                                this.isPinned = false;
                                console.log('📋 No saved items found, starting with empty array');
                            }
                        } catch (localError) {
                            console.error('❌ Failed to load from localStorage:', localError);
                            this.todoItems = [];
                            this.lastResetDate = null;
                            this.isPinned = false;
                        }
                    }
                    
                    // Ensure todoItems is always an array
                    if (!Array.isArray(this.todoItems)) {
                        console.warn('⚠️ todoItems was not an array, resetting to empty array');
                        this.todoItems = [];
                    }
                    
                    console.log('📋 Final loaded state:', {
                        todoItems: this.todoItems.length,
                        lastResetDate: this.lastResetDate,
                        isPinned: this.isPinned,
                        todoItemsData: this.todoItems
                    });
                    
                    // Additional debug: Check if items are actually loaded
                    if (this.todoItems && this.todoItems.length > 0) {
                        console.log('📋 Todo items details:', this.todoItems.map(item => ({
                            name: item.name,
                            completed: item.completed,
                            type: item.type
                        })));
                    }
                } catch (error) {
                    console.error('❌ Failed to load To-Do List state:', error);
                    this.todoItems = [];
                    this.lastResetDate = null;
                    this.isPinned = false;
                }
            },

            saveState() {
                try {
                    console.log('💾 Starting save process...');
                    console.log('📋 Current todoItems to save:', this.todoItems);
                    console.log('📋 todoItems length:', this.todoItems.length);
                    
                    // Ensure todoItems is always an array
                    if (!Array.isArray(this.todoItems)) {
                        console.warn('⚠️ todoItems was not an array during save, resetting to empty array');
                        this.todoItems = [];
                    }
                    
                    // Primary save: use core module (more reliable in this context)
                    let coreSaved = false;
                    if (this.core && this.core.saveState) {
                        try {
                            this.core.saveState('todo_items', this.todoItems);
                            this.core.saveState('todo_last_reset_date', this.lastResetDate);
                            this.core.saveState('todo_panel_pinned', this.isPinned);
                            coreSaved = true;
                            console.log('💾 Saved To-Do List state via core module');
                        } catch (coreError) {
                            console.warn('⚠️ Core module save failed:', coreError);
                        }
                    }
                    
                    // Also save to localStorage as backup
                    try {
                        localStorage.setItem('todo_items', JSON.stringify(this.todoItems));
                        localStorage.setItem('todo_last_reset_date', JSON.stringify(this.lastResetDate));
                        localStorage.setItem('todo_panel_pinned', JSON.stringify(this.isPinned));
                        console.log('💾 Also saved To-Do List state to localStorage');
                    } catch (localError) {
                        console.warn('⚠️ localStorage save failed:', localError);
                        if (!coreSaved) {
                            throw localError; // Only throw if both methods failed
                        }
                    }
                    
                    // Verify the save worked by reading it back from the primary source
                    if (this.core && this.core.loadState) {
                        const savedItems = this.core.loadState('todo_items', []);
                        const savedCount = Array.isArray(savedItems) ? savedItems.length : 0;
                        console.log('✅ Save verification - core module now contains:', savedCount, 'items');
                    } else {
                        const savedItems = localStorage.getItem('todo_items');
                        const savedCount = savedItems ? JSON.parse(savedItems).length : 0;
                        console.log('✅ Save verification - localStorage now contains:', savedCount, 'items');
                    }
                    
                    // Debug: Log what we saved
                    console.log('📋 Successfully saved todo items:', {
                        count: this.todoItems.length,
                        items: this.todoItems.map(item => ({ name: item.name, completed: item.completed }))
                    });
                } catch (error) {
                    console.error('❌ Failed to save To-Do List state:', error);
                    // Last resort: try localStorage directly
                    try {
                        localStorage.setItem('todo_items', JSON.stringify(this.todoItems || []));
                        localStorage.setItem('todo_last_reset_date', JSON.stringify(this.lastResetDate));
                        localStorage.setItem('todo_panel_pinned', JSON.stringify(this.isPinned));
                        console.log('💾 Saved To-Do List state via localStorage as last resort');
                    } catch (localError) {
                        console.error('❌ Failed to save even to localStorage:', localError);
                    }
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

            restorePanelState() {
                try {
                    const wasOpen = this.core.loadState('todo_panel_open', false);
                    if (wasOpen) {
                        console.log('🔄 Restoring To-Do List panel state immediately...');
                        // Show panel immediately like other modules (no delay)
                        if (document.getElementById('sidekick-content')) {
                            this.showTodoPanel();
                            console.log('✅ To-Do List panel restored successfully');
                        } else {
                            console.log('⏳ Sidebar not ready yet, will retry...');
                            // Quick single retry if DOM not ready yet
                            setTimeout(() => {
                                if (document.getElementById('sidekick-content')) {
                                    this.showTodoPanel();
                                    console.log('✅ To-Do List panel restored on retry');
                                }
                            }, 100);
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to restore panel state:', error);
                }
            },

            togglePinPanel() {
                this.isPinned = !this.isPinned;
                const panel = document.getElementById('sidekick-todo-panel');
                if (panel) {
                    // Update resize and cursor based on pinned state
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
                
                this.core.NotificationSystem.show(
                    'To-Do List',
                    this.isPinned ? 'Panel pinned! It will stay on top of other panels.' : 'Panel unpinned.',
                    'info'
                );
            },

            // Debug function to check storage state
            debugStorageState() {
                console.log('🔍 === DEBUG STORAGE STATE ===');
                console.log('📋 Current todoItems array:', this.todoItems);
                console.log('📋 todoItems length:', this.todoItems.length);
                
                // Check core module storage
                if (this.core && this.core.loadState) {
                    try {
                        const coreItems = this.core.loadState('todo_items', null);
                        console.log('📋 Core module storage:', coreItems);
                    } catch (error) {
                        console.error('❌ Error reading core module storage:', error);
                    }
                }
                
                // Check localStorage
                try {
                    const localItems = localStorage.getItem('todo_items');
                    console.log('📋 localStorage raw:', localItems);
                    if (localItems) {
                        const parsed = JSON.parse(localItems);
                        console.log('📋 localStorage parsed:', parsed);
                    }
                } catch (error) {
                    console.error('❌ Error reading localStorage:', error);
                }
                
                console.log('🔍 === END DEBUG ===');
            }
        };

        // Register module with Sidekick
        if (window.SidekickModules) {
            window.SidekickModules.TodoList = TodoListModule;
            console.log('📋 To-Do List module registered with Sidekick');
        }

        // Initialize module
        TodoListModule.init();
    });

})();
