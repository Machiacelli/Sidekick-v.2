// ==UserScript==
// @name         Sidekick To-Do List Module (Modern)
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Modern Daily To-Do List with updated system for Torn.com activities
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
            version: '2.0.0',
            isActive: false,
            core: null,
            todoItems: [],
            lastResetDate: null,
            isPinned: false,

            // Modern Todo item types - updated system
            todoItemTypes: {
                // Daily activities
                medical: {
                    name: 'Medical Cooldown',
                    icon: '🏥',
                    color: '#FF6B6B',
                    description: 'Use medical item (daily reset)',
                    category: 'daily'
                },
                drug: {
                    name: 'Drug Cooldown',
                    icon: '💊',
                    color: '#E74C3C',
                    description: 'Use drug item (daily reset)',
                    category: 'daily'
                },
                energyRefill: {
                    name: 'Energy Refill',
                    icon: '⚡',
                    color: '#4ECDC4',
                    description: 'Daily energy refill',
                    category: 'daily'
                },
                nerveRefill: {
                    name: 'Nerve Refill',
                    icon: '🧠',
                    color: '#45B7D1',
                    description: 'Daily nerve refill',
                    category: 'daily'
                },
                // Activities
                gym: {
                    name: 'Gym Training',
                    icon: '💪',
                    color: '#F39C12',
                    description: 'Complete gym training',
                    category: 'daily'
                },
                crime: {
                    name: 'Commit Crime',
                    icon: '🔫',
                    color: '#8E44AD',
                    description: 'Commit a crime',
                    category: 'daily'
                },
                attack: {
                    name: 'Attack Player',
                    icon: '⚔️',
                    color: '#E67E22',
                    description: 'Attack another player',
                    category: 'daily'
                },
                // Economic
                stocks: {
                    name: 'Check Stocks',
                    icon: '📈',
                    color: '#27AE60',
                    description: 'Check stock investments',
                    category: 'daily'
                },
                travel: {
                    name: 'Travel Abroad',
                    icon: '✈️',
                    color: '#3498DB',
                    color: '#3498DB',
                    description: 'Travel for items/money',
                    category: 'weekly'
                },
                // Custom tasks (persistent)
                custom: {
                    name: 'Custom Task',
                    icon: '📝',
                    color: '#9C27B0',
                    description: 'Custom task (persistent)',
                    category: 'custom'
                }
            },

            init() {
                console.log('📋 Initializing Modern To-Do List Module v2.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for To-Do List');
                    return false;
                }

                // Load saved state
                this.loadState();
                
                // Check if daily reset is needed
                this.checkDailyReset();
                
                console.log('✅ Modern To-Do List module initialized successfully');
                return true;
            },

            // Main activation method - called when user clicks To-Do List button
            activate() {
                console.log('📋 Modern To-Do List module activated!');
                
                if (this.isActive) {
                    this.hideTodoPanel();
                    return;
                }

                this.showTodoPanel();
            },

            showTodoPanel() {
                if (this.isActive) return;
                
                console.log('📋 Showing Modern To-Do List panel...');
                
                // Create panel container
                const panel = document.createElement('div');
                panel.id = 'sidekick-todo-panel';
                panel.className = 'sidekick-todo-panel';
                
                // Calculate default position and size - fixed positioning issues
                const defaultWidth = 320;
                const defaultHeight = 400;
                const minWidth = 280;
                const minHeight = 200;
                const maxWidth = 500;
                const maxHeight = 600;

                // Use saved position or defaults - avoid auto-offset that causes drift
                const savedPosition = this.core.loadState('todo_panel_position', { x: 20, y: 20 });
                const savedSize = this.core.loadState('todo_panel_size', { width: defaultWidth, height: defaultHeight });
                
                // Get sidebar bounds for constraining position
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { width: 400, height: 600 };
                
                // Clamp position to sidebar bounds - prevent drift
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
                    min-width: ${minWidth}px;
                    min-height: ${minHeight}px;
                    max-width: ${maxWidth}px;
                    max-height: ${maxHeight}px;
                    z-index: 1000;
                    resize: ${this.isPinned ? 'none' : 'both'};
                    overflow: hidden;
                `;

                // Create header with modern design
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
                
                const title = document.createElement('div');
                title.style.cssText = `
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                `;
                title.innerHTML = '📋 Modern To-Do List';
                
                // Create controls container
                const headerControls = document.createElement('div');
                headerControls.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;

                // Add button for adding tasks
                const addBtn = document.createElement('button');
                addBtn.className = 'add-task-btn';
                addBtn.style.cssText = `
                    background: #27AE60;
                    border: none;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: background 0.2s;
                `;
                addBtn.innerHTML = '+ Add';
                addBtn.title = 'Add new task';

                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #f44336;
                    cursor: pointer;
                    font-size: 16px;
                    padding: 2px;
                    border-radius: 4px;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                `;
                closeBtn.innerHTML = '×';
                closeBtn.title = 'Close panel';

                headerControls.appendChild(addBtn);
                headerControls.appendChild(closeBtn);
                header.appendChild(title);
                header.appendChild(headerControls);

                // Create content area with categories
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

                // Assemble panel
                panel.appendChild(header);
                panel.appendChild(content);
                
                // Add to sidebar content area
                const contentArea = document.getElementById('sidekick-content');
                if (contentArea) {
                    contentArea.appendChild(panel);
                } else {
                    console.error('❌ Content area not found');
                    return;
                }

                // Add event listeners with fixed dragging
                this.addPanelEventListeners(panel, addBtn, closeBtn);
                
                // Add improved dragging functionality
                this.addImprovedDragging(panel, header);
                
                // Add improved resize functionality  
                this.addImprovedResizeFunctionality(panel);
                
                // Mark as active and render content
                this.isActive = true;
                this.refreshModernDisplay();
                
                // Save panel state
                this.core.saveState('todo_panel_open', true);
                
                console.log('✅ Modern To-Do List panel displayed');
            },

            refreshModernDisplay() {
                const content = document.getElementById('todo-content');
                if (!content) return;

                content.innerHTML = '';

                if (this.todoItems.length === 0) {
                    this.showModernEmptyState(content);
                    return;
                }

                // Group items by category
                const categories = {
                    daily: [],
                    weekly: [],
                    custom: []
                };

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
                    font-size: 12px;
                    font-weight: 600;
                    color: #888;
                    text-transform: uppercase;
                    margin-bottom: 6px;
                    padding-bottom: 4px;
                    border-bottom: 1px solid #333;
                `;
                
                const categoryIcons = {
                    daily: '🌅 Daily Tasks',
                    weekly: '📅 Weekly Tasks', 
                    custom: '📝 Custom Tasks'
                };
                
                categoryHeader.textContent = categoryIcons[categoryName] || categoryName;
                container.appendChild(categoryHeader);

                items.forEach((item, index) => {
                    const itemElement = this.createModernTodoItemElement(item, index);
                    container.appendChild(itemElement);
                });
            },

            createModernTodoItemElement(item, index) {
                const element = document.createElement('div');
                element.className = 'modern-todo-item';
                element.dataset.itemId = item.id;
                element.style.cssText = `
                    background: ${item.completed ? '#1a4a1a' : '#333'};
                    border: 1px solid ${item.completed ? '#4CAF50' : '#555'};
                    border-radius: 6px;
                    padding: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 6px;
                    transition: all 0.2s ease;
                `;

                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = item.completed;
                checkbox.style.cssText = `
                    width: 16px;
                    height: 16px;
                    accent-color: ${item.color || '#4CAF50'};
                    cursor: pointer;
                `;
                
                checkbox.addEventListener('change', (e) => {
                    item.completed = e.target.checked;
                    this.saveState();
                    this.refreshModernDisplay();
                });

                // Icon and info
                const infoContainer = document.createElement('div');
                infoContainer.style.cssText = `
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;

                const icon = document.createElement('span');
                icon.style.cssText = `
                    font-size: 16px;
                    opacity: ${item.completed ? '0.6' : '1'};
                `;
                icon.textContent = item.icon;

                const textContainer = document.createElement('div');
                textContainer.style.cssText = `
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                `;

                const name = document.createElement('div');
                name.style.cssText = `
                    color: ${item.completed ? '#888' : '#fff'};
                    font-weight: 500;
                    font-size: 13px;
                    text-decoration: ${item.completed ? 'line-through' : 'none'};
                `;
                
                if (item.isCustom) {
                    const nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.value = item.customText || item.name;
                    nameInput.style.cssText = `
                        background: transparent;
                        border: none;
                        color: ${item.completed ? '#888' : '#fff'};
                        font-weight: 500;
                        font-size: 13px;
                        outline: none;
                        padding: 0;
                        width: 100%;
                    `;
                    
                    nameInput.addEventListener('change', (e) => {
                        item.customText = e.target.value;
                        item.name = e.target.value;
                        this.saveState();
                    });
                    
                    name.appendChild(nameInput);
                } else {
                    name.textContent = item.name;
                }

                const description = document.createElement('div');
                description.style.cssText = `
                    color: #aaa;
                    font-size: 11px;
                    opacity: ${item.completed ? '0.6' : '1'};
                `;
                description.textContent = item.description;

                textContainer.appendChild(name);
                textContainer.appendChild(description);
                infoContainer.appendChild(icon);
                infoContainer.appendChild(textContainer);

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #f44336;
                    cursor: pointer;
                    font-size: 14px;
                    padding: 4px;
                    border-radius: 4px;
                    opacity: 0.7;
                    transition: all 0.2s;
                `;
                deleteBtn.innerHTML = '×';
                deleteBtn.title = 'Delete task';
                
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

                element.appendChild(checkbox);
                element.appendChild(infoContainer);
                element.appendChild(deleteBtn);

                return element;
            },

            showModernEmptyState(content) {
                content.innerHTML = `
                    <div style="
                        color: #888;
                        font-style: italic;
                        text-align: center;
                        padding: 40px 20px;
                        font-size: 14px;
                    ">
                        <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                        <div style="margin-bottom: 8px;">No tasks yet!</div>
                        <div style="font-size: 12px;">Click "Add" to create your first task.</div>
                    </div>
                `;
            },

            showTaskPicker() {
                // Remove any existing picker
                const existingPicker = document.querySelector('.task-picker');
                if (existingPicker) existingPicker.remove();

                // Create task picker overlay
                const picker = document.createElement('div');
                picker.className = 'task-picker';
                picker.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2a2a2a;
                    border: 1px solid #555;
                    border-radius: 8px;
                    padding: 20px;
                    z-index: 999999;
                    min-width: 300px;
                    max-height: 400px;
                    overflow-y: auto;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                `;

                const title = document.createElement('h3');
                title.style.cssText = `
                    margin: 0 0 16px 0;
                    color: #fff;
                    font-size: 16px;
                `;
                title.textContent = 'Add New Task';

                picker.appendChild(title);

                // Group tasks by category
                const categories = {
                    daily: [],
                    weekly: [],
                    custom: []
                };

                Object.entries(this.todoItemTypes).forEach(([key, itemType]) => {
                    categories[itemType.category].push({ key, itemType });
                });

                Object.entries(categories).forEach(([categoryName, items]) => {
                    if (items.length === 0) return;

                    const categoryHeader = document.createElement('div');
                    categoryHeader.style.cssText = `
                        font-size: 12px;
                        font-weight: 600;
                        color: #888;
                        text-transform: uppercase;
                        margin: 12px 0 8px 0;
                        padding-bottom: 4px;
                        border-bottom: 1px solid #333;
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
                            background: none;
                            border: 1px solid #555;
                            color: #fff;
                            padding: 10px;
                            width: 100%;
                            text-align: left;
                            cursor: pointer;
                            font-size: 13px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 4px;
                            border-radius: 4px;
                            transition: all 0.2s;
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

                // Close when clicking outside
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
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #2a2a2a;
                    border: 1px solid #555;
                    border-radius: 8px;
                    padding: 20px;
                    z-index: 999999;
                    min-width: 300px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
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

            addTodoItem(type, itemType) {
                // Check if task already exists (except custom)
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
                    isCustom: type === 'custom',
                    customText: '',
                    createdAt: Date.now()
                };

                this.todoItems.push(todoItem);
                this.saveState();
                this.refreshModernDisplay();
                
                if (this.core && this.core.NotificationSystem) {
                    this.core.NotificationSystem.show('To-Do List', `Added ${itemType.name}`, 'success', 2000);
                }
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

            hideTodoPanel() {
                const panel = document.getElementById('sidekick-todo-panel');
                if (panel) {
                    panel.remove();
                }
                this.isActive = false;
                this.core.saveState('todo_panel_open', false);
                console.log('📋 Modern To-Do List panel hidden');
            },

            addPanelEventListeners(panel, addBtn, closeBtn) {
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
                    
                    // Calculate offset relative to sidebar
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    
                    // Store start position to prevent drift
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
                    
                    // Calculate new position relative to sidebar
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
                        // Only save if position actually changed
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

                // Only detect resize at bottom-right corner
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
                        
                        // Only save if size changed significantly
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

            savePanelPosition(panel) {
                const position = {
                    x: parseInt(panel.style.left) || 20,
                    y: parseInt(panel.style.top) || 20
                };
                this.core.saveState('todo_panel_position', position);
                console.log('📋 Saved panel position:', position);
            },

            savePanelSize(panel) {
                const size = {
                    width: panel.offsetWidth,
                    height: panel.offsetHeight
                };
                this.core.saveState('todo_panel_size', size);
                console.log('📋 Saved panel size:', size);
            },

            loadState() {
                try {
                    console.log('📋 Loading modern todo state...');
                    
                    // Try localStorage first
                    const savedItems = localStorage.getItem('modern_todo_items');
                    const savedResetDate = localStorage.getItem('modern_todo_last_reset_date');
                    const savedPinned = localStorage.getItem('modern_todo_panel_pinned');
                    
                    if (savedItems) {
                        this.todoItems = JSON.parse(savedItems);
                        console.log('📋 Loaded modern todo items:', this.todoItems.length);
                    } else {
                        // Migration: check for old todo items
                        const oldItems = localStorage.getItem('todo_items');
                        if (oldItems) {
                            const parsedOldItems = JSON.parse(oldItems);
                            // Migrate old xanax items to new system
                            this.todoItems = parsedOldItems.map(item => this.migrateOldItem(item));
                            console.log('📋 Migrated old todo items to modern system:', this.todoItems.length);
                            this.saveState(); // Save migrated items
                        } else {
                            this.todoItems = [];
                        }
                    }
                    
                    this.lastResetDate = savedResetDate ? JSON.parse(savedResetDate) : null;
                    this.isPinned = savedPinned ? JSON.parse(savedPinned) : false;
                    
                    console.log('📋 Modern todo state loaded successfully');
                } catch (error) {
                    console.error('❌ Failed to load modern todo state:', error);
                    this.todoItems = [];
                    this.lastResetDate = null;
                    this.isPinned = false;
                }
            },

            migrateOldItem(oldItem) {
                // Map old xanax system to new drug system
                const typeMapping = {
                    'xanax1': 'drug',
                    'xanax2': 'drug', 
                    'xanax3': 'drug',
                    'energyRefill': 'energyRefill',
                    'nerveRefill': 'nerveRefill',
                    'custom': 'custom'
                };

                const newType = typeMapping[oldItem.type] || 'custom';
                const itemType = this.todoItemTypes[newType] || this.todoItemTypes.custom;

                return {
                    ...oldItem,
                    type: newType,
                    name: oldItem.isCustom ? oldItem.customText : itemType.name,
                    icon: itemType.icon,
                    color: itemType.color,
                    description: itemType.description
                };
            },

            saveState() {
                try {
                    localStorage.setItem('modern_todo_items', JSON.stringify(this.todoItems));
                    localStorage.setItem('modern_todo_last_reset_date', JSON.stringify(this.lastResetDate));
                    localStorage.setItem('modern_todo_panel_pinned', JSON.stringify(this.isPinned));
                    
                    // Also save via core module
                    if (this.core && this.core.saveState) {
                        this.core.saveState('modern_todo_items', this.todoItems);
                        this.core.saveState('modern_todo_last_reset_date', this.lastResetDate);
                    }
                    
                    console.log('💾 Modern todo state saved');
                } catch (error) {
                    console.error('❌ Failed to save modern todo state:', error);
                }
            },

            checkDailyReset() {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
                
                if (!this.lastResetDate || this.lastResetDate < todayUTC.getTime()) {
                    console.log('🔄 Daily reset detected for modern todo list...');
                    this.resetDailyTasks();
                    this.lastResetDate = todayUTC.getTime();
                    this.saveState();
                }
            },

            resetDailyTasks() {
                this.todoItems.forEach(item => {
                    const itemType = this.todoItemTypes[item.type];
                    if (itemType && (itemType.category === 'daily' || itemType.category === 'weekly')) {
                        item.completed = false;
                    }
                });
                console.log('🔄 Daily tasks reset in modern system');
            },

            restorePanelState() {
                try {
                    const wasOpen = this.core.loadState('todo_panel_open', false);
                    if (wasOpen && document.getElementById('sidekick-content')) {
                        this.showTodoPanel();
                    }
                } catch (error) {
                    console.error('❌ Failed to restore modern todo panel state:', error);
                }
            }
        };

        // Register module with Sidekick
        if (window.SidekickModules) {
            window.SidekickModules.TodoList = TodoListModule;
            console.log('📋 Modern To-Do List module registered with Sidekick');
        }
    });
})();
