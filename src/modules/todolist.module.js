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
                panel.className = 'sidekick-panel';
                panel.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 600px;
                    max-height: 80vh;
                    background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%);
                    border: 2px solid #444;
                    border-radius: 12px;
                    z-index: 1000000;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                `;

                // Create header
                const header = document.createElement('div');
                header.style.cssText = `
                    background: linear-gradient(135deg, #333, #555);
                    padding: 16px 20px;
                    border-bottom: 1px solid #444;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                `;
                
                header.innerHTML = `
                    <h2 style="margin: 0; color: #fff; font-size: 18px; font-weight: 600;">
                        📋 Daily To-Do List
                    </h2>
                    <button id="todo-close-btn" style="
                        background: none;
                        border: none;
                        color: #fff;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: background 0.2s;
                    ">×</button>
                `;

                // Create content area
                const content = document.createElement('div');
                content.style.cssText = `
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
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
                
                // Add to page
                document.body.appendChild(panel);
                
                // Add event listeners
                this.addPanelEventListeners(panel);
                
                // Add dragging functionality
                this.addDragging(panel);
                
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
                    font-size: 16px;
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
                    font-size: 16px;
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

                // Create checkboxes for each count
                for (let i = 0; i < taskType.maxCount; i++) {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = i < task.completed;
                    checkbox.style.cssText = `
                        width: 16px;
                        height: 16px;
                        accent-color: ${taskType.color};
                        cursor: pointer;
                    `;
                    
                    checkbox.addEventListener('change', (e) => {
                        this.updateDailyTask(task.type, e.target.checked ? i + 1 : i);
                    });
                    
                    progress.appendChild(checkbox);
                }

                const count = document.createElement('span');
                count.style.cssText = `
                    color: #fff;
                    font-size: 12px;
                    min-width: 40px;
                    text-align: right;
                `;
                count.textContent = `${task.completed}/${taskType.maxCount}`;

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

            addPanelEventListeners(panel) {
                const closeBtn = panel.querySelector('#todo-close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => this.hideTodoPanel());
                }

                // Close on escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.isActive) {
                        this.hideTodoPanel();
                    }
                });
            },

            addDragging(panel) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };

                panel.addEventListener('mousedown', (e) => {
                    if (e.target === panel || e.target.closest('h2')) {
                        isDragging = true;
                        const rect = panel.getBoundingClientRect();
                        dragOffset.x = e.clientX - rect.left;
                        dragOffset.y = e.clientY - rect.top;
                        e.preventDefault();
                        e.stopPropagation();
                        
                        panel.style.cursor = 'grabbing';
                    }
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const newX = e.clientX - dragOffset.x;
                    const newY = e.clientY - dragOffset.y;
                    
                    // Keep within viewport bounds
                    const maxX = window.innerWidth - panel.offsetWidth;
                    const maxY = window.innerHeight - panel.offsetHeight;
                    
                    panel.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
                    panel.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';
                    panel.style.transform = 'none';
                });

                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        panel.style.cursor = 'default';
                    }
                });
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
