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
            
            // API integration for auto-completion
            apiKey: null,
            apiEnabled: false,
            lastApiCheck: 0,
            dailyStatsBaseline: null, // Store baseline stats for daily tracking

            // Modern todo item types - enhanced system with all daily activities
            todoItemTypes: {
                // Daily activities
                medical: {
                    name: 'Medical Cooldown',
                    icon: '🏥',
                    color: '#FF6B6B',
                    description: 'Use medical item (daily reset)',
                    category: 'daily',
                    maxCompletions: 1,
                    isMultiCompletion: false
                },
                drug: {
                    name: 'Drug Cooldown',
                    icon: '💊',
                    color: '#E74C3C',
                    description: 'Use drug item (daily reset)',
                    category: 'daily',
                    maxCompletions: 1,
                    isMultiCompletion: false
                },
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
                // Activities
                gym: {
                    name: 'Gym Training',
                    icon: '💪',
                    color: '#F39C12',
                    description: 'Complete gym training',
                    category: 'daily',
                    maxCompletions: 1,
                    isMultiCompletion: false
                },
                crime: {
                    name: 'Commit Crime',
                    icon: '🔫',
                    color: '#8E44AD',
                    description: 'Commit a crime',
                    category: 'daily',
                    maxCompletions: 1,
                    isMultiCompletion: false
                },
                attack: {
                    name: 'Attack Player',
                    icon: '⚔️',
                    color: '#E67E22',
                    description: 'Attack another player',
                    category: 'daily',
                    maxCompletions: 1,
                    isMultiCompletion: false
                },
                // Economic
                stocks: {
                    name: 'Check Stocks',
                    icon: '📈',
                    color: '#27AE60',
                    description: 'Check stock investments',
                    category: 'daily',
                    maxCompletions: 1,
                    isMultiCompletion: false
                },
                travel: {
                    name: 'Travel Abroad',
                    icon: '✈️',
                    color: '#3498DB',
                    description: 'Travel for items/money',
                    category: 'weekly',
                    maxCompletions: 1,
                    isMultiCompletion: false
                },
                // Legacy support
                xanax: {
                    name: 'Drug Use',
                    icon: '�',
                    color: '#E74C3C',
                    description: 'Daily drug use (legacy)',
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
                    background: #222;
                    border: 1px solid #444;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    min-width: 280px;
                    min-height: 200px;
                    max-width: 500px;
                    max-height: 600px;
                    z-index: 1000;
                    resize: ${this.isPinned ? 'none' : 'both'};
                    overflow: hidden;
                `;

                const header = document.createElement('div');
                header.className = 'todo-header';
                header.style.cssText = `
                    background: linear-gradient(135deg, #2C3E50, #4A6741);
                    border-bottom: 1px solid #444;
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
                    <div style="color: #fff; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                        📋 Modern To-Do List
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="add-task-btn" style="
                            background: #27AE60; border: none; color: white; padding: 4px 8px; 
                            border-radius: 4px; cursor: pointer; font-size: 12px; transition: background 0.2s;
                        ">+ Add</button>
                        <button class="close-btn" style="
                            background: none; border: none; color: #f44336; cursor: pointer; 
                            font-size: 16px; padding: 2px; border-radius: 4px; transition: background 0.2s;
                            display: flex; align-items: center; justify-content: center; width: 20px; height: 20px;
                        ">×</button>
                    </div>
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
                `;

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
                const categories = { daily: [], weekly: [], custom: [] };
                this.todoItems.forEach(item => {
                    const itemType = this.todoItemTypes[item.type];
                    const category = itemType ? itemType.category : 'custom';
                    categories[category].push(item);
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
                    weekly: '📅 Weekly Tasks', 
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
                    item.completed = e.target.checked;
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
                const categories = { daily: [], weekly: [], custom: [] };
                Object.entries(this.todoItemTypes).forEach(([key, itemType]) => {
                    categories[itemType.category].push({ key, itemType });
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
                        weekly: '📅 Weekly Tasks',
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
                    name.textContent = item.name;
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

            addPanelEventListeners(panel) {
                const addBtn = panel.querySelector('.add-task-btn');
                const closeBtn = panel.querySelector('.close-btn');

                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showTaskPicker();
                });

                addBtn.addEventListener('mouseenter', () => {
                    addBtn.style.background = '#2ECC71';
                });

                addBtn.addEventListener('mouseleave', () => {
                    addBtn.style.background = '#27AE60';
                });

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
                // Reset daily and weekly tasks (but not custom tasks)
                this.todoItems.forEach(item => {
                    const itemType = this.todoItemTypes[item.type];
                    if (itemType && (itemType.category === 'daily' || itemType.category === 'weekly')) {
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
            
            // Fetch data from Torn API
            async fetchApiData(section, selection) {
                if (!this.apiKey) return null;
                
                try {
                    const url = `https://api.torn.com/${section}?selections=${selection}&key=${this.apiKey}`;
                    const response = await fetch(url);
                    const data = await response.json();
                    
                    if (data.error) {
                        console.error(`❌ API Error for ${section}/${selection}:`, data.error);
                        return null;
                    }
                    
                    return data;
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
                
                // Find the Xanax item
                const xanaxItem = this.todoItems.find(item => item.type === 'xanax');
                if (!xanaxItem) return 0;
                
                // Get current daily Xanax count
                const currentXanaxCount = this.getDailyXanaxCount(personalstats);
                
                // Update completion count if it has increased
                if (currentXanaxCount > xanaxItem.completedCount) {
                    const previousCount = xanaxItem.completedCount;
                    xanaxItem.completedCount = Math.min(currentXanaxCount, xanaxItem.maxCompletions);
                    xanaxItem.completed = xanaxItem.completedCount >= xanaxItem.maxCompletions;
                    
                    completions = xanaxItem.completedCount - previousCount;
                    console.log(`✅ Auto-completed: ${xanaxItem.name} (${xanaxItem.completedCount}/${xanaxItem.maxCompletions})`);
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
