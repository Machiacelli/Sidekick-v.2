// ==UserScript==
// @name         Sidekick To-Do List Module
// @namespace    http://tampermonkey.net/
// @version      1.4.5
// @description  FIXED: Lowered minimum size to 200x150 for more compact panels
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
            version: '1.4.1',
            isActive: false,
            core: null,
            todoItems: [],
            lastResetDate: null,
            isPinned: false,
            
            // API integration for auto-completion
            apiKey: null,
            apiEnabled: false,
            lastApiCheck: 0,
            dailyStatsBaseline: null, // Store baseline stats for daily tracking

            // Modern todo item types - enhanced system with all daily activities
            todoItemTypes: {
                // Daily activities
                energyRefill: {
                    name: 'Energy Refill',
                    icon: '⚡',
                    color: '#4ECDC4',
                    description: 'Daily energy refill',
                    category: 'daily',
                    maxCompletions: 1,
                    isMultiCompletion: false
                },
                nerveRefill: {
                    name: 'Nerve Refill',
                    icon: '🧠',
                    color: '#45B7D1',
                    description: 'Daily nerve refill',
                    category: 'daily',
                    maxCompletions: 1,
                    isMultiCompletion: false
                },
                attack: {
                    name: 'Attack Player',
                    icon: '⚔️',
                    color: '#E67E22',
                    description: 'Attack specific player (set target ID)',
                    category: 'daily',
                    maxCompletions: 1,
                    isMultiCompletion: false,
                    requiresInput: true,
                    inputType: 'profileId'
                },
                // Medical/Drug tasks
                xanax: {
                    name: 'Take Xanax',
                    icon: '💊',
                    color: '#E74C3C',
                    description: 'Daily Xanax doses (up to 3)',
                    category: 'daily',
                    maxCompletions: 3,
                    isMultiCompletion: true
                },
                // Custom tasks (persistent)
                custom: {
                    name: 'Custom Task',
                    icon: '�📝',
                    color: '#9C27B0',
                    description: 'Custom task (persistent)',
                    category: 'custom',
                    maxCompletions: 1,
                    isMultiCompletion: false
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
                
                // Initialize API integration using settings API key
                this.initApiIntegration();
                
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
                
                console.log('📋 Showing modern To-Do List panel...');
                
                const panel = document.createElement('div');
                panel.id = 'sidekick-todo-panel';
                panel.className = 'sidekick-todo-panel';
                
                const defaultWidth = 320;
                const defaultHeight = 400;

                const savedPosition = this.core.loadState('todo_panel_position', { x: 20, y: 20 });
                const savedSize = this.core.loadState('todo_panel_size', { width: defaultWidth, height: defaultHeight });
                
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { width: 400, height: 600 };
                
                const finalX = Math.min(Math.max(0, savedPosition.x), Math.max(0, sidebarRect.width - savedSize.width));
                const finalY = Math.min(Math.max(0, savedPosition.y), Math.max(0, sidebarRect.height - savedSize.height));

                panel.style.cssText = `
                    position: absolute;
                    left: ${finalX}px;
                    top: ${finalY}px;
                    width: ${savedSize.width}px;
                    height: ${savedSize.height}px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    min-width: 200px;
                    min-height: 150px;
                    max-width: 600px;
                    max-height: 800px;
                    z-index: 1000;
                `;
                
                // Add resize handle if not pinned
                if (!this.isPinned) {
                    const resizeHandle = document.createElement('div');
                    resizeHandle.className = 'todo-resize-handle';
                    resizeHandle.style.cssText = `
                        position: absolute;
                        bottom: 0;
                        right: 0;
                        width: 20px;
                        height: 20px;
                        cursor: nwse-resize;
                        z-index: 10;
                        background: linear-gradient(135deg, transparent 0%, transparent 50%, #666 50%, #666 100%);
                        border-bottom-right-radius: 8px;
                    `;
                    
                    // Add resize functionality
                    let isResizing = false;
                    let startX, startY, startWidth, startHeight;
                    
                    resizeHandle.addEventListener('mousedown', (e) => {
                        isResizing = true;
                        startX = e.clientX;
                        startY = e.clientY;
                        startWidth = panel.offsetWidth;
                        startHeight = panel.offsetHeight;
                        e.preventDefault();
                        e.stopPropagation();
                    });
                    
                    document.addEventListener('mousemove', (e) => {
                        if (!isResizing) return;
                        
                        const width = startWidth + (e.clientX - startX);
                        const height = startHeight + (e.clientY - startY);
                        
                        // Apply constraints - Lower minimums for compact size
                        if (width >= 200 && width <= 600) {
                            panel.style.width = width + 'px';
                        }
                        if (height >= 150 && height <= 800) {
                            panel.style.height = height + 'px';
                        }
                    });
                    
                    document.addEventListener('mouseup', () => {
                        if (isResizing) {
                            isResizing = false;
                            this.savePanelSize(panel);
                        }
                    });
                    
                    panel.appendChild(resizeHandle);
                }

                // Prevent body scroll when scrolling inside panel
                panel.addEventListener('wheel', (e) => {
                    e.stopPropagation();
                }, { passive: true });

                const header = document.createElement('div');
                header.className = 'todo-header';
                header.style.cssText = `
                    background: #333;
                    border-bottom: 1px solid #555;
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: ${this.isPinned ? 'default' : 'move'};
                    height: 32px;
                    flex-shrink: 0;
                    border-radius: 7px 7px 0 0;
                `;
                
                header.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <div class="todo-dropdown" style="position: relative; display: inline-block;">
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
                                min-width: 200px;
                                max-height: 300px;
                                z-index: 100000;
                                border-radius: 4px;
                                border: 1px solid #555;
                                padding: 4px 0;
                                overflow-y: auto;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                                /* Hide scrollbars but keep scroll functionality */
                                scrollbar-width: none; /* Firefox */
                                -ms-overflow-style: none; /* Internet Explorer 10+ */
                            ">
                                <!-- Panel Options -->
                                <button class="pin-toggle-btn" style="
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
                                " title="Toggle pin state">📌 Pin Panel</button>
                                
                                <!-- Divider -->
                                <div style="height: 1px; background: #444; margin: 8px 0;"></div>
                                
                                <!-- Task Categories -->
                                <div class="task-category-header" style="
                                    color: #888;
                                    font-size: 10px;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    padding: 8px 12px 4px 12px;
                                    border-bottom: 1px solid #444;
                                    margin-bottom: 4px;
                                ">Daily Tasks</div>
                                <div class="daily-tasks"></div>
                                
                                <div class="task-category-header" style="
                                    color: #888;
                                    font-size: 10px;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    padding: 8px 12px 4px 12px;
                                    border-bottom: 1px solid #444;
                                    margin: 8px 0 4px 0;
                                ">Custom Tasks</div>
                                <div class="custom-tasks"></div>
                                
                                <!-- Divider -->
                                <div style="height: 1px; background: #444; margin: 8px 0;"></div>
                                
                                <button class="clear-completed-btn" style="
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
                                " title="Clear completed tasks">🗑️ Clear Completed</button>
                            </div>
                        </div>
                        <span style="font-size: 14px;">📋</span>
                        <span style="font-weight: bold; color: #4CAF50; font-size: 12px;">To-Do List</span>
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
                    " title="Close todo panel">×</button>
                `;

                const content = document.createElement('div');
                content.id = 'todo-content';
                content.style.cssText = `
                    flex: 1;
                    padding: 12px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    /* Hide scrollbars but keep scroll functionality */
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* Internet Explorer 10+ */
                `;
                
                // Hide scrollbars for webkit browsers (Chrome, Safari, Edge)
                content.style.setProperty('--scrollbar-display', 'none');
                
                // Add style to hide webkit scrollbars and add animations
                if (!document.getElementById('sidekick-scrollbar-styles')) {
                    const style = document.createElement('style');
                    style.id = 'sidekick-scrollbar-styles';
                    style.textContent = `
                        #todo-content::-webkit-scrollbar,
                        .sidekick-panel *::-webkit-scrollbar,
                        .sidekick-content *::-webkit-scrollbar,
                        .dropdown-content::-webkit-scrollbar,
                        #timer-panel *::-webkit-scrollbar {
                            display: none;
                            width: 0;
                            height: 0;
                        }
                        
                        #todo-content::-webkit-scrollbar-track,
                        .sidekick-panel *::-webkit-scrollbar-track,
                        .sidekick-content *::-webkit-scrollbar-track,
                        .dropdown-content::-webkit-scrollbar-track,
                        #timer-panel *::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        
                        @keyframes pulse-glow {
                            0%, 100% { 
                                box-shadow: 0 0 8px rgba(231, 76, 60, 0.4), inset 0 1px 2px rgba(255,255,255,0.3);
                            }
                            50% { 
                                box-shadow: 0 0 16px rgba(231, 76, 60, 0.8), inset 0 1px 2px rgba(255,255,255,0.4);
                            }
                        }
                    `;
                    document.head.appendChild(style);
                }

                panel.appendChild(header);
                panel.appendChild(content);
                
                const contentArea = document.getElementById('sidekick-content');
                if (contentArea) {
                    contentArea.appendChild(panel);
                } else {
                    console.error('❌ Content area not found');
                    return;
                }

                this.addPanelEventListeners(panel);
                this.addImprovedDragging(panel, header);
                this.addImprovedResizeFunctionality(panel);
                
                this.isActive = true;
                this.refreshModernDisplay();
                this.core.saveState('todo_panel_open', true);
                
                console.log('✅ Modern To-Do List panel displayed');
            },

            refreshModernDisplay() {
                const content = document.getElementById('todo-content');
                if (!content) return;

                content.innerHTML = '';

                if (this.todoItems.length === 0) {
                    content.innerHTML = `
                        <div style="color: #888; font-style: italic; text-align: center; padding: 40px 20px; font-size: 14px;">
                            <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                            <div style="margin-bottom: 8px;">No tasks yet!</div>
                            <div style="font-size: 12px;">Click "Add" to create your first task.</div>
                        </div>
                    `;
                    return;
                }

                // Group items by category
                const categories = { daily: [], custom: [] };
                this.todoItems.forEach(item => {
                    const itemType = this.todoItemTypes[item.type];
                    const category = itemType ? itemType.category : 'custom';
                    if (category !== 'weekly') { // Skip any remaining weekly tasks
                        categories[category] = categories[category] || [];
                        categories[category].push(item);
                    }
                });

                // Render each category
                Object.entries(categories).forEach(([categoryName, items]) => {
                    if (items.length > 0) {
                        this.renderCategory(content, categoryName, items);
                    }
                });
            },

            renderCategory(container, categoryName, items) {
                const categoryHeader = document.createElement('div');
                categoryHeader.style.cssText = `
                    font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase;
                    margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #333;
                `;
                
                const categoryIcons = {
                    daily: '🌅 Daily Tasks',
                    custom: '📝 Custom Tasks'
                };
                
                categoryHeader.textContent = categoryIcons[categoryName] || categoryName;
                container.appendChild(categoryHeader);

                items.forEach((item) => {
                    const itemElement = this.createModernTodoItemElement(item);
                    container.appendChild(itemElement);
                });
            },

            createModernTodoItemElement(item) {
                const element = document.createElement('div');
                element.className = 'modern-todo-item';
                element.dataset.itemId = item.id;
                element.style.cssText = `
                    background: ${item.completed ? '#1a4a1a' : '#333'};
                    border: 1px solid ${item.completed ? '#4CAF50' : '#555'};
                    border-radius: 6px; padding: 10px; display: flex; align-items: center;
                    gap: 10px; margin-bottom: 6px; transition: all 0.2s ease;
                `;

                element.innerHTML = `
                    <input type="checkbox" ${item.completed ? 'checked' : ''} style="
                        width: 16px; height: 16px; accent-color: ${item.color || '#4CAF50'}; cursor: pointer;
                    ">
                    <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px; opacity: ${item.completed ? '0.6' : '1'};">${item.icon}</span>
                        <div style="flex: 1;">
                            <div style="
                                color: ${item.completed ? '#888' : '#fff'}; font-weight: 500; font-size: 13px;
                                text-decoration: ${item.completed ? 'line-through' : 'none'};
                            ">${item.isCustom ? `<input type="text" value="${item.customText || item.name}" style="
                                background: transparent; border: none; color: ${item.completed ? '#888' : '#fff'};
                                font-weight: 500; font-size: 13px; outline: none; padding: 0; width: 100%;
                            ">` : item.name}</div>
                            <div style="color: #aaa; font-size: 11px; opacity: ${item.completed ? '0.6' : '1'};">
                                ${item.description}
                            </div>
                        </div>
                    </div>
                    <button class="delete-btn" style="
                        background: none; border: none; color: #f44336; cursor: pointer;
                        font-size: 14px; padding: 4px; border-radius: 4px; opacity: 0.7; transition: all 0.2s;
                    ">×</button>
                `;

                // Add event listeners
                const checkbox = element.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', (e) => {
                    // All tasks are now single completion
                    item.completed = e.target.checked;
                    item.completedCount = e.target.checked ? 1 : 0;
                    this.saveState();
                    this.refreshModernDisplay();
                });

                if (item.isCustom) {
                    const nameInput = element.querySelector('input[type="text"]');
                    nameInput.addEventListener('change', (e) => {
                        item.customText = e.target.value;
                        item.name = e.target.value;
                        this.saveState();
                    });
                }

                const deleteBtn = element.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', () => {
                    this.deleteTodoItem(item.id);
                });

                deleteBtn.addEventListener('mouseenter', () => {
                    deleteBtn.style.opacity = '1';
                    deleteBtn.style.background = 'rgba(244, 67, 54, 0.1)';
                });

                deleteBtn.addEventListener('mouseleave', () => {
                    deleteBtn.style.opacity = '0.7';
                    deleteBtn.style.background = 'none';
                });

                return element;
            },

            showTaskPicker() {
                const existingPicker = document.querySelector('.task-picker');
                if (existingPicker) existingPicker.remove();

                const picker = document.createElement('div');
                picker.className = 'task-picker';
                picker.style.cssText = `
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: #2a2a2a; border: 1px solid #555; border-radius: 8px; padding: 20px;
                    z-index: 999999; min-width: 300px; max-height: 400px; overflow-y: auto;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                `;

                picker.innerHTML = '<h3 style="margin: 0 0 16px 0; color: #fff; font-size: 16px;">Add New Task</h3>';

                // Add task buttons grouped by category
                const categories = { daily: [], custom: [] };
                Object.entries(this.todoItemTypes).forEach(([key, itemType]) => {
                    if (itemType.category !== 'weekly') { // Skip weekly tasks
                        categories[itemType.category] = categories[itemType.category] || [];
                        categories[itemType.category].push({ key, itemType });
                    }
                });

                Object.entries(categories).forEach(([categoryName, items]) => {
                    if (items.length === 0) return;

                    const categoryHeader = document.createElement('div');
                    categoryHeader.style.cssText = `
                        font-size: 12px; font-weight: 600; color: #888; text-transform: uppercase;
                        margin: 12px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #333;
                    `;
                    const categoryLabels = {
                        daily: '🌅 Daily Tasks',
                        custom: '📝 Custom Tasks'
                    };
                    categoryHeader.textContent = categoryLabels[categoryName];
                    picker.appendChild(categoryHeader);

                    items.forEach(({ key, itemType }) => {
                        const taskBtn = document.createElement('button');
                        taskBtn.style.cssText = `
                            background: none; border: 1px solid #555; color: #fff; padding: 10px;
                            width: 100%; text-align: left; cursor: pointer; font-size: 13px;
                            display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
                            border-radius: 4px; transition: all 0.2s;
                        `;
                        
                        taskBtn.innerHTML = `
                            <span style="font-size: 16px;">${itemType.icon}</span>
                            <div>
                                <div style="font-weight: 500;">${itemType.name}</div>
                                <div style="font-size: 11px; color: #aaa;">${itemType.description}</div>
                            </div>
                        `;

                        taskBtn.addEventListener('mouseenter', () => {
                            taskBtn.style.background = '#444';
                            taskBtn.style.borderColor = itemType.color;
                        });

                        taskBtn.addEventListener('mouseleave', () => {
                            taskBtn.style.background = 'none';
                            taskBtn.style.borderColor = '#555';
                        });

                        taskBtn.addEventListener('click', () => {
                            if (key === 'custom') {
                                this.showCustomTaskDialog();
                            } else {
                                this.addTodoItem(key, itemType);
                            }
                            picker.remove();
                        });

                        picker.appendChild(taskBtn);
                    });
                });

                document.body.appendChild(picker);

                setTimeout(() => {
                    document.addEventListener('click', function closePicker(e) {
                        if (!picker.contains(e.target)) {
                            picker.remove();
                            document.removeEventListener('click', closePicker);
                        }
                    });
                }, 100);
            },

            showCustomTaskDialog() {
                const dialog = document.createElement('div');
                dialog.style.cssText = `
                    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    background: #2a2a2a; border: 1px solid #555; border-radius: 8px; padding: 20px;
                    z-index: 999999; min-width: 300px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                `;

                dialog.innerHTML = `
                    <h3 style="margin: 0 0 16px 0; color: #fff;">📝 Custom Task</h3>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; margin-bottom: 4px; color: #ccc; font-size: 12px;">Task Name:</label>
                        <input type="text" id="custom-task-name" placeholder="Enter task name..." 
                               style="width: 100%; padding: 8px; border: 1px solid #555; border-radius: 4px; background: #333; color: white;">
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="create-custom-task" style="flex: 1; padding: 10px; background: #27AE60; border: none; border-radius: 4px; color: white; cursor: pointer;">
                            Create Task
                        </button>
                        <button id="cancel-custom-task" style="flex: 1; padding: 10px; background: #666; border: none; border-radius: 4px; color: white; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                `;

                document.body.appendChild(dialog);

                const nameInput = dialog.querySelector('#custom-task-name');
                const createBtn = dialog.querySelector('#create-custom-task');
                const cancelBtn = dialog.querySelector('#cancel-custom-task');

                nameInput.focus();

                createBtn.addEventListener('click', () => {
                    const taskName = nameInput.value.trim();
                    if (taskName) {
                        this.addCustomTodoItem(taskName);
                        dialog.remove();
                    }
                });

                cancelBtn.addEventListener('click', () => {
                    dialog.remove();
                });

                nameInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        createBtn.click();
                    }
                });
            },

            addCustomTodoItem(taskName) {
                const todoItem = {
                    id: Date.now() + Math.random(),
                    type: 'custom',
                    name: taskName,
                    icon: '📝',
                    color: '#9C27B0',
                    description: 'Custom task',
                    completed: false,
                    isCustom: true,
                    customText: taskName,
                    createdAt: Date.now()
                };

                this.todoItems.push(todoItem);
                this.saveState();
                this.refreshModernDisplay();
                
                if (this.core && this.core.NotificationSystem) {
                    this.core.NotificationSystem.show('To-Do List', `Added custom task: ${taskName}`, 'success', 2000);
                }
            },

            deleteTodoItem(itemId) {
                if (confirm('Delete this task?')) {
                    this.todoItems = this.todoItems.filter(t => t.id !== itemId);
                    this.saveState();
                    this.refreshModernDisplay();
                    
                    if (this.core && this.core.NotificationSystem) {
                        this.core.NotificationSystem.show('To-Do List', 'Task deleted', 'info');
                    }
                }
            },

            addImprovedDragging(panel, header) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };
                let startPosition = { x: 0, y: 0 };

                header.addEventListener('mousedown', (e) => {
                    if (this.isPinned) return;
                    
                    isDragging = true;
                    const rect = panel.getBoundingClientRect();
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { left: 0, top: 0 };
                    
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    
                    startPosition.x = rect.left - sidebarRect.left;
                    startPosition.y = rect.top - sidebarRect.top;
                    
                    e.preventDefault();
                    e.stopPropagation();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging || this.isPinned) return;
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    if (!sidebar) return;
                    
                    const sidebarRect = sidebar.getBoundingClientRect();
                    
                    let newX = e.clientX - sidebarRect.left - dragOffset.x;
                    let newY = e.clientY - sidebarRect.top - dragOffset.y;
                    
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
                        const currentX = parseInt(panel.style.left) || 0;
                        const currentY = parseInt(panel.style.top) || 0;
                        
                        if (Math.abs(currentX - startPosition.x) > 1 || Math.abs(currentY - startPosition.y) > 1) {
                            this.savePanelPosition(panel);
                        }
                    }
                });
            },

            addImprovedResizeFunctionality(panel) {
                if (this.isPinned) return;
                
                let isResizing = false;
                let startSize = { width: 0, height: 0 };
                let resizeTimeout = null;

                panel.addEventListener('mousedown', (e) => {
                    const rect = panel.getBoundingClientRect();
                    if (e.clientX > rect.right - 15 && e.clientY > rect.bottom - 15) {
                        isResizing = true;
                        startSize.width = panel.offsetWidth;
                        startSize.height = panel.offsetHeight;
                        e.preventDefault();
                    }
                });

                document.addEventListener('mouseup', () => {
                    if (isResizing) {
                        isResizing = false;
                        
                        const currentWidth = panel.offsetWidth;
                        const currentHeight = panel.offsetHeight;
                        
                        if (Math.abs(currentWidth - startSize.width) > 10 || 
                            Math.abs(currentHeight - startSize.height) > 10) {
                            
                            if (resizeTimeout) clearTimeout(resizeTimeout);
                            resizeTimeout = setTimeout(() => {
                                this.savePanelSize(panel);
                            }, 200);
                        }
                    }
                });
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
                console.log('📋 Adding modern todo item:', type, itemType.name);
                
                // Check for duplicates (except custom tasks)
                if (type !== 'custom' && this.todoItems.some(t => t.type === type)) {
                    if (this.core && this.core.NotificationSystem) {
                        this.core.NotificationSystem.show('To-Do List', `${itemType.name} already exists`, 'info');
                    }
                    return;
                }

                const todoItem = {
                    id: Date.now() + Math.random(),
                    type: type,
                    name: itemType.name,
                    icon: itemType.icon,
                    color: itemType.color,
                    description: itemType.description,
                    completed: false,
                    completedCount: 0, // Track number of completions
                    maxCompletions: itemType.maxCompletions || 1,
                    isMultiCompletion: itemType.isMultiCompletion || false,
                    isCustom: type === 'custom',
                    customText: type === 'custom' ? 'Custom Task' : '',
                    createdAt: Date.now()
                };

                this.todoItems.push(todoItem);
                console.log(`📋 Modern todo items array now has ${this.todoItems.length} items:`, this.todoItems);
                
                this.saveState();
                this.refreshModernDisplay();
                
                if (this.core && this.core.NotificationSystem) {
                    this.core.NotificationSystem.show('To-Do List', `Added ${itemType.name}`, 'success', 2000);
                }
            },

            refreshDisplay() {
                console.log('🔄 refreshDisplay() called with modern system');
                console.log('📋 todoItems length:', this.todoItems.length);
                console.log('📋 todoItems:', this.todoItems);
                
                // Use the modern display refresh
                this.refreshModernDisplay();
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
                    // For attack tasks, show target name if available
                    if (item.type === 'attack' && item.targetName) {
                        name.textContent = `${item.name} (${item.targetName})`;
                    } else {
                        name.textContent = item.name;
                    }
                }

                // Special input for attack task
                if (item.type === 'attack') {
                    const targetContainer = document.createElement('div');
                    targetContainer.style.cssText = `
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-top: 4px;
                    `;
                    
                    const targetInput = document.createElement('input');
                    targetInput.type = 'number';
                    targetInput.placeholder = 'Profile ID';
                    targetInput.value = item.targetId || '';
                    targetInput.style.cssText = `
                        background: rgba(255,255,255,0.1);
                        border: 1px solid #555;
                        border-radius: 4px;
                        color: #fff;
                        font-size: 11px;
                        padding: 4px 6px;
                        width: 80px;
                        outline: none;
                    `;
                    
                    const fetchBtn = document.createElement('button');
                    fetchBtn.textContent = '👤';
                    fetchBtn.title = 'Fetch username';
                    fetchBtn.style.cssText = `
                        background: #4CAF50;
                        border: none;
                        border-radius: 4px;
                        color: white;
                        cursor: pointer;
                        font-size: 10px;
                        padding: 4px 6px;
                        transition: background 0.2s ease;
                    `;
                    
                    targetInput.addEventListener('change', async (e) => {
                        const profileId = e.target.value.trim();
                        if (profileId && /^\d+$/.test(profileId)) {
                            item.targetId = profileId;
                            // Try to fetch username
                            try {
                                const username = await this.fetchUsername(profileId);
                                if (username) {
                                    item.targetName = username;
                                    name.textContent = `${item.name} (${username})`;
                                }
                            } catch (error) {
                                console.log('Could not fetch username:', error);
                            }
                            this.saveState();
                        }
                    });
                    
                    fetchBtn.addEventListener('click', async () => {
                        const profileId = targetInput.value.trim();
                        if (profileId && /^\d+$/.test(profileId)) {
                            try {
                                fetchBtn.style.background = '#FF9800';
                                const username = await this.fetchUsername(profileId);
                                if (username) {
                                    item.targetName = username;
                                    name.textContent = `${item.name} (${username})`;
                                    fetchBtn.style.background = '#4CAF50';
                                    this.saveState();
                                }
                            } catch (error) {
                                fetchBtn.style.background = '#f44336';
                                setTimeout(() => {
                                    fetchBtn.style.background = '#4CAF50';
                                }, 2000);
                            }
                        }
                    });
                    
                    targetContainer.appendChild(targetInput);
                    targetContainer.appendChild(fetchBtn);
                    info.appendChild(targetContainer);
                }

                // Description with progress for multi-completion items
                const description = document.createElement('div');
                description.style.cssText = `
                    color: #aaa;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;
                
                // Use regular description for all items (progress is shown in the progress container)
                description.textContent = item.description;

                info.appendChild(name);
                info.appendChild(description);

                const controls = document.createElement('div');
                controls.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;

                // For multi-completion items, show progress circles instead of checkbox
                if (item.isMultiCompletion) {
                    // Special handling for Xanax task - show 3 elegant dots in a row
                    if (item.type === 'xanax') {
                        const xanaxContainer = document.createElement('div');
                        xanaxContainer.style.cssText = `
                            display: flex;
                            gap: 6px;
                            align-items: center;
                            background: linear-gradient(135deg, rgba(231, 76, 60, 0.15), rgba(231, 76, 60, 0.05));
                            padding: 8px 12px;
                            border-radius: 16px;
                            border: 1px solid rgba(231, 76, 60, 0.4);
                            backdrop-filter: blur(5px);
                        `;
                        
                        for (let i = 0; i < 3; i++) {
                            const xanaxDot = document.createElement('div');
                            const isCompleted = i < (item.completedCount || 0);
                            
                            xanaxDot.style.cssText = `
                                width: 12px;
                                height: 12px;
                                border-radius: 50%;
                                background: ${isCompleted ? 
                                    'linear-gradient(135deg, #E74C3C, #C0392B)' : 
                                    'linear-gradient(135deg, #555, #333)'};
                                border: 2px solid ${isCompleted ? '#E74C3C' : '#666'};
                                cursor: pointer;
                                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                position: relative;
                                box-shadow: ${isCompleted ? 
                                    '0 0 8px rgba(231, 76, 60, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)' : 
                                    '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.1)'};
                                transform: ${isCompleted ? 'scale(1.1)' : 'scale(1)'};
                            `;
                            
                            // Add subtle pulsing animation for active state
                            if (isCompleted) {
                                xanaxDot.style.animation = 'pulse-glow 2s ease-in-out infinite';
                            }
                            
                            // Add number indicator inside dot
                            const numberIndicator = document.createElement('span');
                            numberIndicator.style.cssText = `
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                font-size: 8px;
                                font-weight: bold;
                                color: ${isCompleted ? '#fff' : '#999'};
                                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                                pointer-events: none;
                            `;
                            numberIndicator.textContent = (i + 1).toString();
                            xanaxDot.appendChild(numberIndicator);
                            
                            xanaxDot.addEventListener('click', () => {
                                // Toggle completion state
                                if (i < (item.completedCount || 0)) {
                                    // Clicking on a completed dot - reduce count to this position
                                    item.completedCount = i;
                                } else {
                                    // Clicking on an incomplete dot - set count to this position + 1
                                    item.completedCount = i + 1;
                                }
                                
                                // Update overall completion status
                                item.completed = item.completedCount >= 3;
                                
                                this.saveState();
                                this.refreshDisplay();
                            });
                            
                            xanaxDot.addEventListener('mouseenter', () => {
                                xanaxDot.style.transform = 'scale(1.2)';
                                xanaxDot.style.boxShadow = isCompleted ? 
                                    '0 0 12px rgba(231, 76, 60, 0.6), inset 0 1px 2px rgba(255,255,255,0.3)' :
                                    '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)';
                            });
                            
                            xanaxDot.addEventListener('mouseleave', () => {
                                xanaxDot.style.transform = isCompleted ? 'scale(1.1)' : 'scale(1)';
                                xanaxDot.style.boxShadow = isCompleted ? 
                                    '0 0 8px rgba(231, 76, 60, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)' :
                                    '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.1)';
                            });
                            
                            xanaxContainer.appendChild(xanaxDot);
                        }
                        
                        // Add progress text
                        const progressText = document.createElement('span');
                        progressText.style.cssText = `
                            font-size: 10px;
                            color: #E74C3C;
                            font-weight: 600;
                            margin-left: 4px;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                        `;
                        progressText.textContent = `${item.completedCount || 0}/3`;
                        xanaxContainer.appendChild(progressText);
                        
                        controls.appendChild(xanaxContainer);
                    } else {
                        // Regular multi-completion display for other tasks
                        const progressContainer = document.createElement('div');
                        progressContainer.style.cssText = `
                            display: flex;
                            gap: 3px;
                            align-items: center;
                        `;
                        
                        // For tasks with many completions (>5), show only numerical count
                        if (item.maxCompletions > 5) {
                        const numberDisplay = document.createElement('span');
                        numberDisplay.style.cssText = `
                            color: ${item.completedCount >= item.maxCompletions ? '#4CAF50' : item.color};
                            font-size: 12px;
                            font-weight: bold;
                            background: rgba(255,255,255,0.1);
                            padding: 2px 6px;
                            border-radius: 10px;
                            border: 1px solid ${item.completedCount >= item.maxCompletions ? '#4CAF50' : item.color};
                        `;
                        numberDisplay.textContent = `${item.completedCount}/${item.maxCompletions}`;
                        progressContainer.appendChild(numberDisplay);
                    } else {
                        // Create progress circles for tasks with 5 or fewer completions
                        for (let i = 0; i < item.maxCompletions; i++) {
                            const circle = document.createElement('div');
                            circle.style.cssText = `
                                width: 8px;
                                height: 8px;
                                border-radius: 50%;
                                background: ${i < item.completedCount ? item.color : '#555'};
                                border: 1px solid ${item.color};
                                cursor: pointer;
                                transition: all 0.2s ease;
                            `;
                            
                            circle.addEventListener('click', () => {
                                // Toggle completion state
                                if (i < item.completedCount) {
                                    // Clicking on a completed circle - reduce count
                                    item.completedCount = i;
                                } else {
                                    // Clicking on an incomplete circle - set count to this position + 1
                                    item.completedCount = i + 1;
                                }
                                
                                // Update overall completion status
                                item.completed = item.completedCount >= item.maxCompletions;
                                
                                this.saveState();
                                this.refreshDisplay();
                            });
                            
                            progressContainer.appendChild(circle);
                        }
                    }
                    
                    controls.appendChild(progressContainer);
                    }
                } else {
                    // Regular checkbox for single-completion items
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
                        item.completedCount = e.target.checked ? 1 : 0;
                        this.saveState();
                    });
                    
                    controls.appendChild(checkbox);
                }

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
                    this.deleteTodoItem(item.id);
                });
                
                controls.appendChild(deleteBtn);

                element.appendChild(icon);
                element.appendChild(info);
                element.appendChild(controls);

                return element;
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

            addPanelEventListeners(panel) {
                const closeBtn = panel.querySelector('.close-btn');
                const clearCompletedBtn = panel.querySelector('.clear-completed-btn');
                const dropdownBtn = panel.querySelector('.dropdown-btn');
                const dropdownContent = panel.querySelector('.dropdown-content');

                // Populate task categories in dropdown
                this.populateTaskDropdown(panel);

                // Dropdown functionality
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = dropdownContent.style.display === 'block';
                    
                    if (isVisible) {
                        dropdownContent.style.display = 'none';
                    } else {
                        // Position dropdown relative to button but use fixed positioning
                        const btnRect = dropdownBtn.getBoundingClientRect();
                        dropdownContent.style.top = `${btnRect.bottom + 2}px`;
                        dropdownContent.style.left = `${btnRect.left}px`;
                        dropdownContent.style.display = 'block';
                    }
                });

                // Pin toggle functionality
                const pinToggleBtn = panel.querySelector('.pin-toggle-btn');
                pinToggleBtn.innerHTML = this.isPinned ? '📌 Unpin Panel' : '📌 Pin Panel';
                pinToggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = 'none';
                    this.togglePinPanel();
                });

                // Pin toggle hover effects
                pinToggleBtn.addEventListener('mouseenter', () => {
                    pinToggleBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                });
                pinToggleBtn.addEventListener('mouseleave', () => {
                    pinToggleBtn.style.background = 'none';
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!panel.contains(e.target)) {
                        dropdownContent.style.display = 'none';
                    }
                });

                // Clear completed functionality
                clearCompletedBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = 'none';
                    this.clearCompletedTasks();
                });

                // Dropdown hover effects for clear completed button
                clearCompletedBtn.addEventListener('mouseenter', () => {
                    clearCompletedBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                });
                clearCompletedBtn.addEventListener('mouseleave', () => {
                    clearCompletedBtn.style.background = 'none';
                });

                // Close button functionality
                closeBtn.addEventListener('click', () => {
                    this.hideTodoPanel();
                });

                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.background = 'rgba(244, 67, 54, 0.2)';
                });

                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.background = 'none';
                });
            },

            clearCompletedTasks() {
                const initialCount = this.todoItems.length;
                this.todoItems = this.todoItems.filter(item => !item.completed);
                const clearedCount = initialCount - this.todoItems.length;
                
                if (clearedCount > 0) {
                    console.log(`📋 Cleared ${clearedCount} completed tasks`);
                    this.saveState();
                    this.refreshModernDisplay();
                } else {
                    console.log('📋 No completed tasks to clear');
                }
            },

            populateTaskDropdown(panel) {
                const dailyContainer = panel.querySelector('.daily-tasks');
                const customContainer = panel.querySelector('.custom-tasks');
                
                // Group tasks by category
                const categories = { daily: [], custom: [] };
                Object.entries(this.todoItemTypes).forEach(([key, itemType]) => {
                    if (itemType.category !== 'weekly') { // Skip weekly tasks
                        categories[itemType.category] = categories[itemType.category] || [];
                        categories[itemType.category].push({ key, itemType });
                    }
                });

                // Create task buttons for each category
                Object.entries(categories).forEach(([categoryName, items]) => {
                    const container = categoryName === 'daily' ? dailyContainer : customContainer;
                    
                    items.forEach(({ key, itemType }) => {
                        const taskButton = document.createElement('button');
                        taskButton.className = 'task-option-btn';
                        taskButton.style.cssText = `
                            background: none;
                            border: none;
                            color: #fff;
                            padding: 6px 12px;
                            width: 100%;
                            text-align: left;
                            cursor: pointer;
                            font-size: 11px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            transition: background 0.2s ease;
                        `;
                        taskButton.innerHTML = `${itemType.icon} ${itemType.name}`;
                        taskButton.title = itemType.description;
                        
                        // Add click handler to add this task
                        taskButton.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.addTodoItem(key, itemType);
                            panel.querySelector('.dropdown-content').style.display = 'none';
                        });
                        
                        // Add hover effects
                        taskButton.addEventListener('mouseenter', () => {
                            taskButton.style.background = 'rgba(255, 255, 255, 0.1)';
                        });
                        taskButton.addEventListener('mouseleave', () => {
                            taskButton.style.background = 'none';
                        });
                        
                        container.appendChild(taskButton);
                    });
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
                const minWidth = 250;
                const maxWidth = 500;
                const minHeight = 200;
                const maxHeight = 800;
                
                const size = {
                    width: Math.max(minWidth, Math.min(maxWidth, panel.offsetWidth)),
                    height: Math.max(minHeight, Math.min(maxHeight, panel.offsetHeight))
                };
                
                // Only save if size is reasonable (prevent weird resizing bugs)
                if (size.width >= minWidth && size.width <= maxWidth && 
                    size.height >= minHeight && size.height <= maxHeight) {
                    this.core.saveState('todo_panel_size', size);
                    console.log('📏 Saved panel size:', size);
                } else {
                    console.warn('📏 Ignoring invalid panel size:', panel.offsetWidth, 'x', panel.offsetHeight);
                }
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
                // Use UTC time (Torn City Time - TCT)
                const now = new Date();
                const todayTCT = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
                
                if (!this.lastResetDate || this.lastResetDate < todayTCT.getTime()) {
                    console.log('🔄 Daily reset detected (TCT 00:00), clearing daily tasks...');
                    this.resetDailyTasks();
                    this.lastResetDate = todayTCT.getTime();
                    this.saveState();
                }
            },

            resetDailyTasks() {
                // Reset daily tasks (but not custom tasks)
                this.todoItems.forEach(item => {
                    const itemType = this.todoItemTypes[item.type];
                    if (itemType && itemType.category === 'daily') {
                        item.completed = false;
                        item.completedCount = 0;
                    }
                });
                this.saveState();
                console.log('🔄 Daily tasks reset in modern system');
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
                    panel.style.overflow = this.isPinned ? 'hidden' : 'visible';
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

            // ===== API INTEGRATION METHODS =====
            
            // Initialize API integration using settings API key
            initApiIntegration() {
                console.log('🔗 Initializing Todo List API integration...');
                
                // Get API key from settings
                const apiKey = this.core.loadState(this.core.STORAGE_KEYS.API_KEY, '');
                this.apiKey = apiKey;
                this.apiEnabled = !!apiKey;
                
                if (this.apiEnabled) {
                    console.log('✅ API integration enabled - using settings API key');
                    
                    // Load baseline stats for daily tracking
                    this.loadDailyStatsBaseline();
                    
                    // Start periodic API checks (every 30 seconds to respect cache)
                    this.startApiChecking();
                } else {
                    console.log('ℹ️ API integration disabled - no API key in settings');
                }
            },
            
            // Start periodic API checking for auto-completion
            startApiChecking() {
                if (!this.apiEnabled) return;
                
                // Initial check
                this.checkApiForCompletion();
                
                // Set up periodic checking (every 30 seconds due to API cache)
                setInterval(() => {
                    if (this.apiEnabled && this.isActive) {
                        this.checkApiForCompletion();
                    }
                }, 30000);
            },
            
            // Main API checking method
            async checkApiForCompletion() {
                if (!this.apiEnabled || Date.now() - this.lastApiCheck < 25000) {
                    return; // Rate limiting
                }
                
                this.lastApiCheck = Date.now();
                
                try {
                    console.log('🔗 Checking API for todo completion...');
                    
                    // Get current API data
                    const [cooldowns, refills, personalstats] = await Promise.all([
                        this.fetchApiData('user', 'cooldowns'),
                        this.fetchApiData('user', 'refills'),
                        this.fetchApiData('user', 'personalstats')
                    ]);
                    
                    if (cooldowns && refills && personalstats) {
                        this.processApiData(cooldowns, refills, personalstats);
                    }
                    
                } catch (error) {
                    console.error('❌ API check failed:', error);
                }
            },
            
            // Fetch data from Torn API using enhanced API system
            async fetchApiData(section, selection, userId = null) {
                if (!this.apiKey) return null;
                
                try {
                    // Use the enhanced API system from settings module if available
                    if (window.SidekickModules?.Api?.makeRequest) {
                        console.log(`🔄 Using enhanced API system for ${section}/${selection}${userId ? ` (user: ${userId})` : ''}`);
                        if (userId) {
                            // For other users, construct the URL manually
                            const url = `https://api.torn.com/user/${userId}?selections=${selection}&key=${this.apiKey}`;
                            const response = await fetch(url);
                            const data = await response.json();
                            return data;
                        } else {
                            const data = await window.SidekickModules.Api.makeRequest(section, selection);
                            return data;
                        }
                    } else {
                        // Fallback to direct fetch with V2 compatibility
                        console.log(`🔄 Using direct fetch fallback for ${section}/${selection}${userId ? ` (user: ${userId})` : ''}`);
                        const baseUrl = userId ? `https://api.torn.com/user/${userId}` : `https://api.torn.com/${section}`;
                        const url = `${baseUrl}?selections=${selection}&key=${this.apiKey}`;
                        const response = await fetch(url);
                        const data = await response.json();
                        
                        if (data.error) {
                            const errorCode = data.error.code;
                            
                            // Handle API V2 migration errors in fallback mode
                            if (errorCode === 22) {
                                console.warn('🔄 TodoList: Selection only available in API v1');
                            } else if (errorCode === 23) {
                                console.warn('🔄 TodoList: Selection only available in API v2');  
                            } else if (errorCode === 19) {
                                console.warn('🔄 TodoList: Must be migrated to crimes 2.0');
                            }
                            
                            console.error(`❌ API Error for ${section}/${selection}:`, data.error);
                            return null;
                        }
                        
                        return data;
                    }
                } catch (error) {
                    console.error(`❌ Fetch failed for ${section}/${selection}:`, error);
                    return null;
                }
            },
            
            // Process API data and auto-complete todo items
            processApiData(cooldowns, refills, personalstats) {
                console.log('📊 Processing API data for auto-completion...');
                
                let completionsFound = 0;
                
                // Check Xanax (drug cooldowns and personal stats)
                completionsFound += this.checkXanaxCompletion(cooldowns.cooldowns, personalstats.personalstats);
                
                // Check Energy Refill
                completionsFound += this.checkEnergyRefillCompletion(refills.refills);
                
                // Check Nerve Refill
                completionsFound += this.checkNerveRefillCompletion(refills.refills);
                
                if (completionsFound > 0) {
                    this.saveState();
                    this.refreshDisplay();
                    
                    if (this.core?.NotificationSystem) {
                        this.core.NotificationSystem.show(
                            'Todo Auto-Complete',
                            `${completionsFound} task(s) completed automatically!`,
                            'success',
                            3000
                        );
                    }
                }
            },
            
            // Check Xanax completion (up to 3 per day)
            checkXanaxCompletion(cooldowns, personalstats) {
                let completions = 0;
                
                // Get current daily Xanax count from API
                const currentXanaxCount = this.getDailyXanaxCount(personalstats);
                
                // Find the single Xanax task
                const xanaxTask = this.todoItems.find(item => item.type === 'xanax');
                
                if (!xanaxTask) return 0;
                
                // Count how many completions the task currently has
                const currentlyCompleted = xanaxTask.completedCount || 0;
                
                // Auto-complete based on API count but don't exceed current completions
                if (currentXanaxCount > currentlyCompleted) {
                    const newCompletions = Math.min(currentXanaxCount, xanaxTask.maxCompletions || 3);
                    if (newCompletions > currentlyCompleted) {
                        xanaxTask.completedCount = newCompletions;
                        completions = newCompletions - currentlyCompleted;
                        console.log(`✅ Auto-updated Xanax task: ${currentlyCompleted} → ${newCompletions} completions`);
                    }
                }
                
                return completions;
            },
            
            // Check Energy Refill completion
            checkEnergyRefillCompletion(refills) {
                const item = this.todoItems.find(item => item.type === 'energyRefill' && !item.completed);
                if (item && refills.energy_refill_used) {
                    item.completed = true;
                    console.log(`✅ Auto-completed: ${item.name}`);
                    return 1;
                }
                return 0;
            },
            
            // Check Nerve Refill completion
            checkNerveRefillCompletion(refills) {
                const item = this.todoItems.find(item => item.type === 'nerveRefill' && !item.completed);
                if (item && refills.nerve_refill_used) {
                    item.completed = true;
                    console.log(`✅ Auto-completed: ${item.name}`);
                    return 1;
                }
                return 0;
            },
            
            // Get current daily Xanax count by comparing with baseline
            getDailyXanaxCount(personalstats) {
                if (!this.dailyStatsBaseline) {
                    return 0;
                }
                
                const currentXanax = personalstats.xantaken || 0;
                const baselineXanax = this.dailyStatsBaseline.xantaken || 0;
                
                return Math.max(0, currentXanax - baselineXanax);
            },
            
            // Fetch username from profile ID
            async fetchUsername(profileId) {
                try {
                    if (!this.apiEnabled) {
                        throw new Error('API not enabled');
                    }
                    
                    const data = await this.fetchApiData('user', 'basic', profileId);
                    if (data && data.name) {
                        return data.name;
                    }
                    throw new Error('No username found');
                } catch (error) {
                    console.error('Failed to fetch username:', error);
                    throw error;
                }
            },
            
            // Load or create daily stats baseline
            loadDailyStatsBaseline() {
                try {
                    const today = new Date().toDateString();
                    const savedBaseline = this.core.loadState('todo_daily_baseline', null);
                    
                    if (savedBaseline && savedBaseline.date === today) {
                        this.dailyStatsBaseline = savedBaseline.stats;
                        console.log('📊 Loaded daily stats baseline');
                    } else {
                        console.log('📊 Need to fetch new daily stats baseline');
                        this.fetchDailyStatsBaseline();
                    }
                } catch (error) {
                    console.error('❌ Failed to load daily stats baseline:', error);
                }
            },
            
            // Fetch and save new daily stats baseline
            async fetchDailyStatsBaseline() {
                if (!this.apiKey) return;
                
                try {
                    const data = await this.fetchApiData('user', 'personalstats');
                    if (data && data.personalstats) {
                        const today = new Date().toDateString();
                        this.dailyStatsBaseline = {
                            xantaken: data.personalstats.xantaken || 0,
                            cityitemsbought: data.personalstats.cityitemsbought || 0,
                            // Add more stats as needed
                        };
                        
                        this.core.saveState('todo_daily_baseline', {
                            date: today,
                            stats: this.dailyStatsBaseline
                        });
                        
                        console.log('📊 Saved new daily stats baseline:', this.dailyStatsBaseline);
                    }
                } catch (error) {
                    console.error('❌ Failed to fetch daily stats baseline:', error);
                }
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
