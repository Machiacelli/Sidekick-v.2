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
            dailyTasks: [],
            customTasks: [],
            lastResetDate: null,

            // Daily task definitions
            dailyTaskTypes: {
                xanax: {
                    name: 'Xanax',
                    maxCount: 3,
                    icon: '💊',
                    color: '#FF6B6B',
                    description: 'Daily Xanax consumption'
                },
                energyRefill: {
                    name: 'Energy Refill',
                    maxCount: 1,
                    icon: '⚡',
                    color: '#4ECDC4',
                    description: 'Daily energy refill'
                },
                nerveRefill: {
                    name: 'Nerve Refill',
                    maxCount: 1,
                    icon: '🧠',
                    color: '#45B7D1',
                    description: 'Daily nerve refill'
                },
                npcShop: {
                    name: 'NPC Shop Items',
                    maxCount: 100,
                    icon: '🛒',
                    color: '#96CEB4',
                    description: 'Daily NPC shop purchases'
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
                
                // Start monitoring for Torn.com activities
                this.startActivityMonitoring();
                
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
                const defaultWidth = 400;
                const defaultHeight = 500;
                const minWidth = 300;
                const minHeight = 400;
                const maxWidth = 600;
                const maxHeight = 700;

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
                    resize: both;
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
                    cursor: move;
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
                title.innerHTML = '📋 Daily To-Do List';
                
                const headerControls = document.createElement('div');
                headerControls.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 4px;
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
                dropdownBtn.title = 'Options';
                
                // Dropdown content
                const dropdownContent = document.createElement('div');
                dropdownContent.className = 'dropdown-content';
                dropdownContent.style.cssText = `
                    display: none;
                    position: absolute;
                    background: #333;
                    min-width: 120px;
                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                    z-index: 1001;
                    border-radius: 4px;
                    border: 1px solid #555;
                    top: 100%;
                    right: 0;
                `;
                
                const resetBtn = document.createElement('button');
                resetBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #fff;
                    padding: 8px 12px;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 12px;
                `;
                resetBtn.innerHTML = '🔄 Reset Daily Tasks';
                
                const closeBtn = document.createElement('button');
                closeBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #f44336;
                    padding: 8px 12px;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 12px;
                `;
                closeBtn.innerHTML = '❌ Close Panel';
                
                dropdownContent.appendChild(resetBtn);
                dropdownContent.appendChild(closeBtn);
                
                headerControls.appendChild(dropdownBtn);
                headerControls.appendChild(dropdownContent);
                
                header.appendChild(title);
                header.appendChild(headerControls);

                // Create content area
                const content = document.createElement('div');
                content.style.cssText = `
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                `;

                // Add daily tasks section
                content.appendChild(this.createDailyTasksSection());
                
                // Add custom tasks section
                content.appendChild(this.createCustomTasksSection());
                
                // Add add task button
                content.appendChild(this.createAddTaskButton());

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
                
                // Add event listeners
                this.addPanelEventListeners(panel, dropdownBtn, dropdownContent, resetBtn, closeBtn);
                
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

            createDailyTasksSection() {
                const section = document.createElement('div');
                section.style.cssText = `
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 16px;
                `;

                const title = document.createElement('h3');
                title.style.cssText = `
                    margin: 0 0 16px 0;
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;
                title.innerHTML = '🔄 Daily Tasks (Resets at 00:00 UTC)';

                const tasksContainer = document.createElement('div');
                tasksContainer.id = 'daily-tasks-container';
                tasksContainer.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                `;

                // Render daily tasks
                this.renderDailyTasks(tasksContainer);

                section.appendChild(title);
                section.appendChild(tasksContainer);
                
                return section;
            },

            createCustomTasksSection() {
                const section = document.createElement('div');
                section.style.cssText = `
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    padding: 16px;
                `;

                const title = document.createElement('h3');
                title.style.cssText = `
                    margin: 0 0 16px 0;
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;
                title.innerHTML = '📝 Custom Tasks';

                const tasksContainer = document.createElement('div');
                tasksContainer.id = 'custom-tasks-container';
                tasksContainer.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                `;

                // Render custom tasks
                this.renderCustomTasks(tasksContainer);

                section.appendChild(title);
                section.appendChild(tasksContainer);
                
                return section;
            },

            createAddTaskButton() {
                const button = document.createElement('button');
                button.id = 'add-custom-task-btn';
                button.style.cssText = `
                    background: linear-gradient(135deg, #4CAF50, #45a049);
                    border: none;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                `;
                button.innerHTML = '➕ Add Custom Task';
                
                button.addEventListener('click', () => this.addCustomTask());
                
                return button;
            },

            renderDailyTasks(container) {
                container.innerHTML = '';
                
                Object.entries(this.dailyTaskTypes).forEach(([key, taskType]) => {
                    const task = this.dailyTasks.find(t => t.type === key) || {
                        type: key,
                        completed: 0,
                        maxCount: taskType.maxCount
                    };

                    const taskElement = this.createDailyTaskElement(task, taskType);
                    container.appendChild(taskElement);
                });
            },

            renderCustomTasks(container) {
                container.innerHTML = '';
                
                if (this.customTasks.length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.style.cssText = `
                        color: #888;
                        font-style: italic;
                        text-align: center;
                        padding: 20px;
                    `;
                    emptyMessage.textContent = 'No custom tasks yet. Click "Add Custom Task" to create one!';
                    container.appendChild(emptyMessage);
                    return;
                }

                this.customTasks.forEach((task, index) => {
                    const taskElement = this.createCustomTaskElement(task, index);
                    container.appendChild(taskElement);
                });
            },

            createDailyTaskElement(task, taskType) {
                const element = document.createElement('div');
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
                    font-size: 20px;
                    color: ${taskType.color};
                `;
                icon.textContent = taskType.icon;

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
                name.textContent = taskType.name;

                const description = document.createElement('div');
                description.style.cssText = `
                    color: #aaa;
                    font-size: 12px;
                `;
                description.textContent = taskType.description;

                info.appendChild(name);
                info.appendChild(description);

                const progress = document.createElement('div');
                progress.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 8px;
                `;

                // Create single checkbox for each task type
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed >= taskType.maxCount;
                checkbox.style.cssText = `
                    width: 16px;
                    height: 16px;
                    accent-color: ${taskType.color};
                    cursor: pointer;
                `;
                
                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.updateDailyTask(task.type, taskType.maxCount);
                    } else {
                        this.updateDailyTask(task.type, 0);
                    }
                });
                
                progress.appendChild(checkbox);

                // Show progress counter (e.g., "2/3" for Xanax)
                const count = document.createElement('span');
                count.style.cssText = `
                    color: #fff;
                    font-size: 12px;
                    min-width: 40px;
                    text-align: right;
                `;
                count.textContent = `(${task.completed}/${taskType.maxCount})`;

                progress.appendChild(count);

                element.appendChild(icon);
                element.appendChild(info);
                element.appendChild(progress);

                return element;
            },

            createCustomTaskElement(task, index) {
                const element = document.createElement('div');
                element.style.cssText = `
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 6px;
                    padding: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                `;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed;
                checkbox.style.cssText = `
                    width: 16px;
                    height: 16px;
                    accent-color: #9C27B0;
                    cursor: pointer;
                `;
                
                checkbox.addEventListener('change', (e) => {
                    this.updateCustomTask(index, e.target.checked);
                });

                const text = document.createElement('input');
                text.type = 'text';
                text.value = task.text;
                text.style.cssText = `
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #fff;
                    font-size: 14px;
                    padding: 4px;
                    outline: none;
                `;
                
                text.addEventListener('change', (e) => {
                    this.updateCustomTaskText(index, e.target.value);
                });

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
                
                deleteBtn.addEventListener('click', () => {
                    this.deleteCustomTask(index);
                });

                element.appendChild(checkbox);
                element.appendChild(text);
                element.appendChild(deleteBtn);

                return element;
            },

            addCustomTask() {
                const text = prompt('Enter custom task:');
                if (text && text.trim()) {
                    this.customTasks.push({
                        text: text.trim(),
                        completed: false,
                        createdAt: Date.now()
                    });
                    this.saveState();
                    this.refreshDisplay();
                }
            },

            updateDailyTask(type, completed) {
                const task = this.dailyTasks.find(t => t.type === type);
                if (task) {
                    task.completed = completed;
                } else {
                    this.dailyTasks.push({
                        type: type,
                        completed: completed,
                        maxCount: this.dailyTaskTypes[type].maxCount
                    });
                }
                this.saveState();
                this.refreshDisplay();
            },

            updateCustomTask(index, completed) {
                if (this.customTasks[index]) {
                    this.customTasks[index].completed = completed;
                    this.saveState();
                    this.refreshDisplay();
                }
            },

            updateCustomTaskText(index, text) {
                if (this.customTasks[index] && text.trim()) {
                    this.customTasks[index].text = text.trim();
                    this.saveState();
                }
            },

            deleteCustomTask(index) {
                if (confirm('Delete this custom task?')) {
                    this.customTasks.splice(index, 1);
                    this.saveState();
                    this.refreshDisplay();
                }
            },

            refreshDisplay() {
                if (!this.isActive) return;
                
                const dailyContainer = document.getElementById('daily-tasks-container');
                const customContainer = document.getElementById('custom-tasks-container');
                
                if (dailyContainer) {
                    this.renderDailyTasks(dailyContainer);
                }
                
                if (customContainer) {
                    this.renderCustomTasks(customContainer);
                }
            },

            hideTodoPanel() {
                const panel = document.getElementById('sidekick-todo-panel');
                if (panel) {
                    panel.remove();
                }
                
                this.isActive = false;
                this.core.saveState('todo_panel_open', false);
                console.log('📋 To-Do List panel hidden');
            },

            addPanelEventListeners(panel, dropdownBtn, dropdownContent, resetBtn, closeBtn) {
                // Dropdown functionality
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', () => {
                    dropdownContent.style.display = 'none';
                });

                // Reset daily tasks
                resetBtn.addEventListener('click', () => {
                    if (confirm('Reset all daily tasks to 0?')) {
                        this.dailyTasks.forEach(task => {
                            task.completed = 0;
                        });
                        this.saveState();
                        this.refreshDisplay();
                        dropdownContent.style.display = 'none';
                    }
                });

                // Close panel
                closeBtn.addEventListener('click', () => {
                    this.hideTodoPanel();
                    dropdownContent.style.display = 'none';
                });
            },

            addDragging(panel, header) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };

                header.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    const rect = panel.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    e.preventDefault();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    
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
                // Resize observer to save size changes
                if (window.ResizeObserver) {
                    let resizeTimeout;
                    let lastSize = { width: panel.offsetWidth, height: panel.offsetHeight };
                    
                    const resizeObserver = new ResizeObserver((entries) => {
                        // Clear previous timeout
                        if (resizeTimeout) clearTimeout(resizeTimeout);
                        
                        // Debounce resize events to prevent excessive saves
                        resizeTimeout = setTimeout(() => {
                            const currentSize = { 
                                width: panel.offsetWidth, 
                                height: panel.offsetHeight 
                            };
                            
                            // Only save if size actually changed significantly (more than 5px)
                            if (Math.abs(currentSize.width - lastSize.width) > 5 || 
                                Math.abs(currentSize.height - lastSize.height) > 5) {
                                lastSize = currentSize;
                                this.savePanelSize(panel);
                            }
                        }, 100); // 100ms debounce
                    });
                    resizeObserver.observe(panel);
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

            loadState() {
                try {
                    this.dailyTasks = this.core.loadState('todo_daily_tasks', []);
                    this.customTasks = this.core.loadState('todo_custom_tasks', []);
                    this.lastResetDate = this.core.loadState('todo_last_reset_date', null);
                    
                    console.log('📋 Loaded To-Do List state:', {
                        dailyTasks: this.dailyTasks.length,
                        customTasks: this.customTasks.length,
                        lastResetDate: this.lastResetDate
                    });
                } catch (error) {
                    console.error('❌ Failed to load To-Do List state:', error);
                }
            },

            saveState() {
                try {
                    this.core.saveState('todo_daily_tasks', this.dailyTasks);
                    this.core.saveState('todo_custom_tasks', this.customTasks);
                    this.core.saveState('todo_last_reset_date', this.lastResetDate);
                    
                    console.log('💾 Saved To-Do List state');
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
                this.dailyTasks = [];
                console.log('🔄 Daily tasks reset');
            },

            startActivityMonitoring() {
                // Monitor for Torn.com activity changes
                // This is a basic implementation - can be enhanced with more specific detection
                console.log('📋 Started activity monitoring');
                
                // Check for changes every 30 seconds
                setInterval(() => {
                    this.checkForActivityChanges();
                }, 30000);
            },

            checkForActivityChanges() {
                // This method can be enhanced to detect actual Torn.com activities
                // For now, it's a placeholder for future implementation
                // Could integrate with Torn API to detect Xanax usage, refills, etc.
                console.log('📋 Checking for activity changes...');
            },

            restorePanelState() {
                try {
                    const wasOpen = this.core.loadState('todo_panel_open', false);
                    if (wasOpen) {
                        console.log('🔄 Restoring To-Do List panel state...');
                        setTimeout(() => {
                            this.showTodoPanel();
                        }, 800);
                    }
                } catch (error) {
                    console.error('❌ Failed to restore panel state:', error);
                }
            }
        };

        // Register module with Sidekick
        if (window.SidekickModules) {
            window.SidekickModules.TodoList = TodoListModule;
            console.log('📋 To-Do List module registered with Sidekick');
        }

        // Initialize module
        TodoListModule.init();
        
        // Restore panel state if it was previously open
        TodoListModule.restorePanelState();
    });

})();
