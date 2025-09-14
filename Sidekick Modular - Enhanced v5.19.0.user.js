// ==UserScript==
// @name         Sidekick Modular - Full Featured Sidebar (Enhanced)
// @namespace    http://tampermonkey.net/
// @version      5.19.0
// @description  Enhanced Modular Sidekick with fixed positioning and modern TodoList system
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue

// Core modules from CDN
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/core.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/ui.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/content.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/settings.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/clock.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/notepad.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/blocktraining.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/global-functions.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/attacklist.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/linkgroup.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/travel-blocker.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/traveltracker.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/timer.module.js?v=5.13.2&instant=true
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/randomtarget.module.js?v=5.13.2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@bd4d205/src/modules/plane-replacer.module.js?v=5.13.2

// Enhanced local modules are included inline below

// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log("🚀 SIDEKICK MODULAR ENHANCED STARTING v5.19.0 - " + new Date().toLocaleTimeString());
    console.log("⚡ ENHANCED: Modern TodoList system replaces old xanax system!");
    console.log("🔧 FIXED: Notepad and TodoList panels no longer drift or auto-resize!");
    console.log("🎯 IMPROVED: Both panels load INSTANTLY like other modules!");
    console.log("⏰ MAINTAINED: Timer panel still counts in real-time every second!");
    console.log("✈️ NEW: Plane Replacer uses directional transparent images (FromTorn/ToTorn)!");
    console.log("📦 Loading enhanced modules...");

    // Wait for core modules to load first
    function waitForCoreModules() {
        if (typeof window.SidekickModules === 'undefined' || !window.SidekickModules.Core) {
            setTimeout(waitForCoreModules, 100);
            return;
        }
        
        console.log("📦 Core modules loaded, initializing enhanced components...");
        loadEnhancedModules();
    }

    function loadEnhancedModules() {
        // Load Modern TodoList Module (replaces old xanax system)
        loadModernTodoListModule();
        
        // Load Notepad positioning fixes
        loadNotepadPositioningFixes();
        
        // Load Plane Replacer transparency enhancement
        loadPlaneReplacerEnhancement();
        
        // Start main initialization after enhanced modules are ready
        setTimeout(initializeSidekick, 500);
    }

    // Modern TodoList Module - replaces old xanax system
    function loadModernTodoListModule() {
        console.log("📋 Loading Modern TodoList Module...");
        
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

                this.loadState();
                this.checkDailyReset();
                
                console.log('✅ Modern To-Do List module initialized successfully');
                return true;
            },

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

            addTodoItem(type, itemType) {
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
                            this.todoItems = parsedOldItems.map(item => this.migrateOldItem(item));
                            console.log('📋 Migrated old todo items to modern system:', this.todoItems.length);
                            this.saveState();
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

        // Replace the old TodoList module
        window.SidekickModules = window.SidekickModules || {};
        window.SidekickModules.TodoList = TodoListModule;
        console.log("✅ Modern TodoList Module loaded and registered");
    }

    // Notepad positioning fixes
    function loadNotepadPositioningFixes() {
        console.log("📝 Loading Notepad positioning fixes...");
        
        function waitForNotepadModule() {
            if (!window.SidekickModules?.Notepad) {
                setTimeout(waitForNotepadModule, 100);
                return;
            }
            
            console.log('🔧 Applying notepad positioning fixes...');
            
            const notepadModule = window.SidekickModules.Notepad;
            const originalSetupHandlers = notepadModule.setupNotepadHandlers;
            
            // Override with improved positioning logic to prevent drift
            notepadModule.setupNotepadHandlers = function(notepadElement, notepad) {
                const contentTextarea = notepadElement.querySelector('textarea');
                const header = notepadElement.querySelector('.notepad-header');
                const closeBtn = notepadElement.querySelector('.close-btn');
                const dropdownBtn = notepadElement.querySelector('.dropdown-btn');
                const dropdownContent = notepadElement.querySelector('.dropdown-content');
                const pinBtn = notepadElement.querySelector('.pin-btn');
                const colorBtn = notepadElement.querySelector('.color-btn');
                
                let isPinned = notepad.pinned || false;
                
                // Improved save layout - prevents drift and unwanted resizing
                const saveLayout = () => {
                    if (this._isProgrammaticChange) {
                        console.log('📝 Skipping save during programmatic change');
                        return;
                    }
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarWidth = sidebar ? Math.max(200, sidebar.clientWidth) : 500;
                    const sidebarHeight = sidebar ? Math.max(200, sidebar.clientHeight) : 600;

                    const rawX = parseInt(notepadElement.style.left) || 0;
                    const rawY = parseInt(notepadElement.style.top) || 0;
                    const rawWidth = notepadElement.offsetWidth;
                    const rawHeight = notepadElement.offsetHeight;

                    const maxWidth = Math.max(150, sidebarWidth - 16);
                    const maxHeight = Math.max(100, sidebarHeight - 80);

                    const width = Math.min(rawWidth, maxWidth);
                    const height = Math.min(rawHeight, maxHeight);

                    const maxX = Math.max(0, sidebarWidth - width - 8);
                    const maxY = Math.max(0, sidebarHeight - height - 8);

                    const x = Math.min(Math.max(0, rawX), maxX);
                    const y = Math.min(Math.max(0, rawY), maxY);

                    // Only save if values actually changed significantly
                    if (Math.abs(notepad.x - x) < 2 && Math.abs(notepad.y - y) < 2 && 
                        Math.abs(notepad.width - width) < 10 && Math.abs(notepad.height - height) < 10 && 
                        notepad.pinned === isPinned) {
                        console.log('📝 No significant layout changes detected, skipping save');
                        return;
                    }

                    notepad.x = x;
                    notepad.y = y;
                    notepad.width = width;
                    notepad.height = height;
                    notepad.pinned = isPinned;

                    this._isProgrammaticChange = true;
                    notepadElement.style.left = x + 'px';
                    notepadElement.style.top = y + 'px';
                    notepadElement.style.width = width + 'px';
                    notepadElement.style.height = height + 'px';
                    
                    setTimeout(() => {
                        this._isProgrammaticChange = false;
                    }, 100);

                    this.saveNotepads();
                    console.log('📝 Saved improved layout for notepad ' + notepad.id);
                };
                
                // Setup all the event handlers with improved logic
                if (contentTextarea) {
                    contentTextarea.addEventListener('input', () => {
                        this.updateNotepad(notepad.id, notepad.title, contentTextarea.value);
                    });
                    
                    contentTextarea.addEventListener('focus', () => {
                        notepadElement.style.borderColor = '#66BB6A';
                        notepadElement.style.boxShadow = '0 0 0 2px rgba(102, 187, 106, 0.2)';
                    });
                    
                    contentTextarea.addEventListener('blur', () => {
                        notepadElement.style.borderColor = '#444';
                        notepadElement.style.boxShadow = 'none';
                    });
                }
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteNotepad(notepad.id);
                    });
                }
                
                if (dropdownBtn && dropdownContent) {
                    dropdownBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
                    });
                    
                    document.addEventListener('click', () => {
                        dropdownContent.style.display = 'none';
                    });
                }
                
                if (pinBtn) {
                    pinBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        isPinned = !isPinned;
                        pinBtn.textContent = isPinned ? '📌 Unpin' : '📌 Pin';
                        
                        notepadElement.style.resize = isPinned ? 'none' : 'both';
                        header.style.cursor = isPinned ? 'default' : 'move';
                        saveLayout.call(this);
                        dropdownContent.style.display = 'none';
                    });
                }
                
                if (colorBtn) {
                    colorBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownContent.style.display = 'none';
                        this.showColorPicker(notepadElement, notepad);
                    });
                }
                
                // IMPROVED DRAGGING - prevents drift
                if (header) {
                    let isDragging = false;
                    let dragOffset = { x: 0, y: 0 };
                    let startPosition = { x: 0, y: 0 };
                    
                    header.addEventListener('mousedown', (e) => {
                        if (isPinned) return;
                        
                        isDragging = true;
                        const rect = notepadElement.getBoundingClientRect();
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
                        if (!isDragging || isPinned) return;
                        
                        const sidebar = document.getElementById('sidekick-sidebar');
                        if (!sidebar) return;
                        
                        const sidebarRect = sidebar.getBoundingClientRect();
                        
                        let newX = e.clientX - sidebarRect.left - dragOffset.x;
                        let newY = e.clientY - sidebarRect.top - dragOffset.y;
                        
                        const maxX = Math.max(0, sidebar.offsetWidth - notepadElement.offsetWidth);
                        const maxY = Math.max(0, sidebar.offsetHeight - notepadElement.offsetHeight);
                        
                        newX = Math.max(0, Math.min(newX, maxX));
                        newY = Math.max(0, Math.min(newY, maxY));
                        
                        notepadElement.style.left = newX + 'px';
                        notepadElement.style.top = newY + 'px';
                    });
                    
                    document.addEventListener('mouseup', () => {
                        if (isDragging) {
                            isDragging = false;
                            
                            const currentX = parseInt(notepadElement.style.left) || 0;
                            const currentY = parseInt(notepadElement.style.top) || 0;
                            
                            if (Math.abs(currentX - startPosition.x) > 3 || Math.abs(currentY - startPosition.y) > 3) {
                                console.log('📝 Position changed during drag, saving layout...');
                                saveLayout.call(this);
                            } else {
                                console.log('📝 Position change too small (likely drift), not saving');
                            }
                        }
                    });
                }
                
                // IMPROVED RESIZING - only save when user actually resizes significantly
                let isUserResizing = false;
                let startSize = { width: 0, height: 0 };
                let resizeTimeout = null;
                let lastSavedSize = { width: notepad.width || 280, height: notepad.height || 150 };
                
                notepadElement.addEventListener('mousedown', (e) => {
                    const rect = notepadElement.getBoundingClientRect();
                    if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) {
                        isUserResizing = true;
                        startSize.width = notepadElement.offsetWidth;
                        startSize.height = notepadElement.offsetHeight;
                        console.log('📝 User started resizing notepad:', startSize);
                    }
                });
                
                document.addEventListener('mouseup', () => {
                    if (isUserResizing) {
                        isUserResizing = false;
                        
                        if (resizeTimeout) {
                            clearTimeout(resizeTimeout);
                        }
                        
                        const currentWidth = notepadElement.offsetWidth;
                        const currentHeight = notepadElement.offsetHeight;
                        
                        const widthDiff = Math.abs(currentWidth - lastSavedSize.width);
                        const heightDiff = Math.abs(currentHeight - lastSavedSize.height);
                        
                        if (widthDiff > 15 || heightDiff > 15) {
                            console.log('📝 Size changed significantly, saving layout...');
                            lastSavedSize = { width: currentWidth, height: currentHeight };
                            
                            resizeTimeout = setTimeout(() => {
                                saveLayout.call(this);
                            }, 200);
                        } else {
                            console.log('📝 Size change too small, not saving');
                        }
                    }
                });
            };
            
            console.log('✅ Notepad positioning fixes applied successfully');
        }
        
        waitForNotepadModule();
    }

    // Plane Replacer Transparency Enhancement
    function loadPlaneReplacerEnhancement() {
        console.log("✈️ Loading Plane Replacer transparency enhancement...");
        
        function waitForPlaneReplacerModule() {
            if (!window.SidekickModules?.PlaneReplacer) {
                setTimeout(waitForPlaneReplacerModule, 100);
                return;
            }
            
            console.log('✈️ Applying Plane Replacer transparency enhancement...');
            
            const planeReplacerModule = window.SidekickModules.PlaneReplacer;
            
            // Store the original replaceSinglePlaneImage method
            const originalReplaceSinglePlaneImage = planeReplacerModule.replaceSinglePlaneImage?.bind(planeReplacerModule);
            
            if (!originalReplaceSinglePlaneImage) {
                console.warn('⚠️ PlaneReplacer module replaceSinglePlaneImage method not found');
                return;
            }
            
            // Override replaceSinglePlaneImage to use transparent PNG with proper hosting
            planeReplacerModule.replaceSinglePlaneImage = function(img, index) {
                try {
                    // Store original image info for debugging
                    const originalSrc = img.src;
                    const originalAlt = img.alt;
                    
                    console.log(`✈️ Replacing plane image ${index + 1} with custom transparent image:`, {
                        src: originalSrc,
                        alt: originalAlt,
                        classes: img.className
                    });

                    // Detect travel direction based on current page and context
                    const currentUrl = window.location.href;
                    const pageContent = document.body.innerText || '';
                    let isFromTorn = true; // Default to leaving Torn
                    
                    // Smart detection of travel direction
                    if (currentUrl.includes('travel.php') || currentUrl.includes('city.php')) {
                        // Check for specific text indicators of returning to Torn
                        if (pageContent.includes('Return to Torn') || 
                            pageContent.includes('Back to Torn') ||
                            pageContent.includes('Torn City') ||
                            originalAlt.includes('return') ||
                            originalAlt.includes('back') ||
                            originalSrc.includes('return')) {
                            isFromTorn = false; // Returning to Torn
                            console.log('🏠 Detected: Returning TO Torn');
                        } else {
                            console.log('✈️ Detected: Traveling FROM Torn');
                        }
                    }
                    
                    // Additional detection based on page elements
                    const returnLinks = document.querySelectorAll('a[href*="travel"], a[href*="city"]');
                    returnLinks.forEach(link => {
                        if (link.textContent.includes('Torn') || link.textContent.includes('Home')) {
                            isFromTorn = false;
                        }
                    });

                    // Create custom plane image element
                    const customPlane = document.createElement('img');
                    customPlane.className = img.className;
                    customPlane.alt = isFromTorn ? 'Custom Sidekick Plane (From Torn)' : 'Custom Sidekick Plane (To Torn)';
                    
                    // Seamless integration styling - removes all borders and artifacts
                    customPlane.style.cssText = `
                        all: unset !important;
                        display: block !important;
                        background: transparent !important;
                        border: none !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        outline: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        vertical-align: baseline !important;
                        object-fit: contain !important;
                        max-width: 100% !important;
                        height: auto !important;
                        position: static !important;
                    `;
                    
                    // Remove any CSS classes that might add unwanted styling
                    customPlane.className = '';
                    
                    // Copy only essential attributes from original for proper sizing
                    if (img.width) customPlane.width = img.width;
                    if (img.height) customPlane.height = img.height;
                    
                    // Fix parent container to prevent line artifacts
                    const originalParent = img.parentNode;
                    if (originalParent && originalParent.style) {
                        originalParent.style.overflow = 'hidden';
                        originalParent.style.lineHeight = '0';
                        originalParent.style.fontSize = '0';
                    }

                    // Use appropriate image based on travel direction
                    if (isFromTorn) {
                        // Traveling FROM Torn to another country
                        customPlane.src = 'https://raw.githubusercontent.com/Machiacelli/Sidekick-v.2/master/src/assets/PlaneReplacerFromTorn.png';
                        console.log('✈️ Using PlaneReplacerFromTorn.png (leaving Torn)');
                    } else {
                        // Traveling TO Torn (returning home)
                        customPlane.src = 'https://raw.githubusercontent.com/Machiacelli/Sidekick-v.2/master/src/assets/PlaneReplacerToTorn.png';
                        console.log('🏠 Using PlaneReplacerToTorn.png (returning to Torn)');
                    }
                    
                    // Option 3: Base64 embedded transparent image (for complete control)
                    // Uncomment below and comment above line to use embedded image:
                    /*
                    customPlane.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAA...';
                    */
                    
                    // Add data attribute to mark this as replaced
                    customPlane.dataset.sidekickReplaced = 'true';
                    customPlane.dataset.originalSrc = originalSrc;

                    // Handle load success and error
                    customPlane.onload = function() {
                        console.log(`✅ Successfully loaded transparent plane image ${index + 1}`);
                    };
                    
                    customPlane.onerror = function() {
                        console.warn(`⚠️ Failed to load transparent image, falling back to original`);
                        // Fallback to original functionality
                        originalReplaceSinglePlaneImage(img, index);
                    };

                    // Replace the original image
                    img.parentNode.replaceChild(customPlane, img);
                    
                    console.log(`✅ Successfully replaced plane image ${index + 1} with transparent PNG`);
                    
                    // Store reference to custom image
                    this.customPlaneImage = customPlane;
                    
                } catch (error) {
                    console.error(`❌ Failed to replace plane image ${index + 1}:`, error);
                    // Fallback to original functionality
                    if (originalReplaceSinglePlaneImage) {
                        originalReplaceSinglePlaneImage(img, index);
                    }
                }
            };
            
            console.log('✅ Plane Replacer transparency enhancement applied successfully');
            console.log('🎨 Directional plane images configured:');
            console.log('   ✈️ FROM Torn: PlaneReplacerFromTorn.png');
            console.log('   🏠 TO Torn: PlaneReplacerToTorn.png');
        }
        
        waitForPlaneReplacerModule();
    }

    // Complete module override for instant loading behavior
    function optimizeInstantLoading() {
        try {
            console.log('⚡ PHASE 1: Preparing module overrides for instant loading...');
            
            // Wait for modules to be available before overriding
            const checkModulesReady = () => {
                if (!window.SidekickModules?.Timer || !window.SidekickModules?.TodoList) {
                    setTimeout(checkModulesReady, 50);
                    return;
                }
                
                console.log('⚡ PHASE 2: Modules detected, applying instant loading overrides...');
                
                // TIMER MODULE: Complete instant loading transformation
                if (window.SidekickModules.Timer) {
                    console.log('⚡ Overriding Timer module for instant loading...');
                    
                    // Store original functions
                    const timer = window.SidekickModules.Timer;
                    const originalInit = timer.init.bind(timer);
                    const originalActivate = timer.activate.bind(timer);
                    
                    // Override init to eliminate lazy loading
                    timer.init = function() {
                        console.log('⚡ Timer: Instant initialization starting...');
                        const result = originalInit();
                        
                        // Immediately do everything that was previously lazy-loaded
                        if (typeof this.startUpdateLoop === 'function') {
                            this.startUpdateLoop();
                        }
                        
                        // Pre-fetch cooldown data silently
                        if (typeof this.fetchCooldownData === 'function') {
                            this.fetchCooldownData().catch(() => {
                                // Silent fail for pages without API access
                            });
                        }
                        
                        this.isLazyInitialized = true;
                        console.log('⚡ Timer: Instant initialization complete');
                        return result;
                    };
                    
                    // Override activate to skip lazy initialization
                    timer.activate = function() {
                        console.log('⚡ Timer: Instant activation (no delays)...');
                        
                        if (this.isActive) {
                            this.hideTimerPanel();
                            return;
                        }

                        this.showTimerPanel();
                        
                        // Ensure real-time updates are working
                        if (typeof this.startUpdateLoop === 'function' && !this.updateInterval) {
                            this.startUpdateLoop();
                        }
                    };
                    
                    // Override restorePanelState to eliminate the 800ms delay
                    timer.restorePanelState = function() {
                        console.log('⚡ Timer: Instant panel restoration...');
                        try {
                            const wasOpen = this.core.loadState('timer_panel_open', false);
                            if (wasOpen && document.getElementById('sidekick-content')) {
                                // Show immediately with no delay
                                this.showTimerPanel();
                            }
                        } catch (error) {
                            console.error('❌ Timer instant restore failed:', error);
                        }
                    };
                    
                    console.log('✅ Timer module transformed for instant loading');
                }
                
                // TODOLIST MODULE: Already enhanced with modern system above
                if (window.SidekickModules.TodoList) {
                    console.log('⚡ TodoList module already optimized with modern system');
                }
                
                console.log('🚀 PHASE 3: Instant loading optimizations complete!');
                
                // Global real-time timer mechanism
                if (!window.sidekickGlobalTimerUpdate) {
                    window.sidekickGlobalTimerUpdate = setInterval(() => {
                        if (window.SidekickModules?.Timer?.isActive && document.getElementById('timer-panel')) {
                            try {
                                if (typeof window.SidekickModules.Timer.renderTimers === 'function') {
                                    window.SidekickModules.Timer.renderTimers();
                                }
                            } catch (error) {
                                // Silent fail to avoid console spam
                            }
                        }
                    }, 1000);
                    console.log('⏱️ Global real-time timer backup mechanism activated');
                }
            };
            
            checkModulesReady();

        } catch (error) {
            console.warn('⚠️ Instant loading optimization failed:', error);
        }
    }

    // Simple wrapper functions for module coordination (NO implementation here)
    window.forceFixNotepads = function() {
        if (window.SidekickModules?.Notepad?.forceFixNotepads) {
            window.SidekickModules.Notepad.forceFixNotepads();
        }
    };

    // Wait for DOM and modules to be ready
    function initializeSidekick() {
        if (typeof window.SidekickModules === 'undefined') {
            console.log("⏳ Waiting for modules to load...");
            setTimeout(initializeSidekick, 100);
            return;
        }

        console.log("📦 Modules loaded:", Object.keys(window.SidekickModules));

        // Apply instant loading optimizations as soon as possible
        optimizeInstantLoading();

        // Wait a bit more to ensure all modules are fully initialized
        if (!window.SidekickModules.UI || !window.SidekickModules.Core) {
            console.log("⏳ Core modules not ready yet, waiting...");
            setTimeout(initializeSidekick, 200);
            return;
        }

        console.log("🎯 Starting module initialization sequence...");

        // Initialize Core module first
        if (window.SidekickModules.Core) {
            console.log("🔧 Initializing Core module...");
            try {
                window.SidekickModules.Core.init();
                console.log("✅ Core module initialized");
            } catch (error) {
                console.error("❌ Core module failed:", error);
            }
        }

        // Initialize UI module
        if (window.SidekickModules.UI) {
            console.log("🎨 Initializing UI module...");
            try {
                window.SidekickModules.UI.init();
                console.log("✅ UI module initialized");
            } catch (error) {
                console.error("❌ UI module failed:", error);
            }
        }

        // Priority initialization for instant-loading modules
        console.log(`⚡ Initializing instant-load modules (Timer, TodoList)...`);
        ['Timer', 'TodoList'].forEach(moduleName => {
            if (window.SidekickModules[moduleName]) {
                console.log(`⚡ Initializing ${moduleName} for instant loading...`);
                try {
                    window.SidekickModules[moduleName].init();
                    console.log(`✅ ${moduleName} initialized for instant loading`);
                } catch (error) {
                    console.error(`❌ ${moduleName} initialization failed:`, error);
                }
            }
        });

        // Initialize other modules (modular approach: each module self-registers and is initialized here)
        ['Settings', 'Clock', 'Notepad', 'TravelTracker', 'Content', 'AttackList', 'LinkGroup', 'TravelBlocker', 'RandomTarget', 'PlaneReplacer'].forEach(moduleName => {
            if (window.SidekickModules[moduleName]) {
                console.log(`🔌 Initializing ${moduleName} module...`);
                try {
                    window.SidekickModules[moduleName].init();
                    console.log(`✅ ${moduleName} module initialized`);
                } catch (error) {
                    console.error(`❌ ${moduleName} module failed:`, error);
                }
            } else {
                console.warn(`⚠️ ${moduleName} module not found in SidekickModules`);
            }
        });

        // Debug: Show all available modules
        console.log('🔍 Final module check - Available modules:', Object.keys(window.SidekickModules));

        console.log("✅ Sidekick Enhanced Modular initialization complete!");

        // Set up periodic fixes (reduced frequency to minimize console spam)
        setInterval(() => {
            if (window.forceFixNotepads) {
                window.forceFixNotepads();
            }
        }, 2000); // Reduced from 1000ms to 2000ms
    }

    // Start core module loading
    waitForCoreModules();

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSidekick);
    } else {
        initializeSidekick();
    }

    // Fallback timeout - if no sidebar appears after 10 seconds, show error
    setTimeout(() => {
        if (!document.getElementById('sidekick-sidebar')) {
            console.error("❌ SIDEKICK FAILED TO LOAD - No sidebar found after 10 seconds");
            console.error("📊 Debug info:", {
                "SidekickModules exists": typeof window.SidekickModules !== 'undefined',
                "Available modules": window.SidekickModules ? Object.keys(window.SidekickModules) : 'none',
                "Document ready": document.readyState,
                "Current URL": window.location.href
            });

            // Create a simple error notification
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 16px;
                border-radius: 8px;
                z-index: 999999;
                font-family: Arial, sans-serif;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            errorDiv.innerHTML = `
                <strong>🚨 Sidekick Failed to Load</strong><br>
                Modules: ${window.SidekickModules ? Object.keys(window.SidekickModules).join(', ') : 'None loaded'}<br>
                <small>Check console for details</small>
            `;
            document.body.appendChild(errorDiv);

            // Auto-remove after 10 seconds
            setTimeout(() => errorDiv.remove(), 10000);
        }
    }, 10000);

    // Export SidekickModules to window.top for global access
    window.top.SidekickModules = window.SidekickModules;
})();
