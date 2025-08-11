// ==UserScript==
// @name         Sidewinder - Todo List Module
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Todo List functionality for Sidewinder
// @author       You
// @match        https://www.torn.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Module: Todo List
    const TodoListModule = {
        name: 'TodoList',
        version: '1.0',
        
        // Initialize the module
        init() {
            console.log(`✅ Loading ${this.name} Module v${this.version}...`);
            this.registerMenuItems();
            this.registerFunctions();
        },
        
        // Register menu items for this module
        registerMenuItems() {
            if (window.SidekickModules) {
                window.SidekickModules.registerMenuItem({
                    icon: '✅',
                    text: 'Add Todo List',
                    color: '#2196F3',
                    action: () => this.createTodoList()
                });
            }
        },
        
        // Register global functions
        registerFunctions() {
            window.updateTodoTitle = this.updateTitle.bind(this);
            window.addTodoItem = this.addItem.bind(this);
        },
        
        // Create a new todo list
        createTodoList() {
            const todoList = window.DataTemplates?.createTodoList() || {
                id: Date.now() + Math.random(),
                title: 'Untitled Todo List',
                items: [],
                type: 'todolist'
            };
            
            // Create todo list element to add inside sidebar
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
                    <input type="text" value="${todoList.title}" data-todo-id="${todoList.id}"
                           style="background: #333; border: 1px solid #555; color: #fff; padding: 6px 8px; border-radius: 4px; font-weight: bold; flex: 1; margin-right: 8px;">
                    <button class="remove-btn" data-item-id="${todoList.id}" data-item-type="todolist" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 4px;">×</button>
                </div>
                <div id="todo-items-${todoList.id}" style="margin-bottom: 8px;"></div>
                <button class="add-todo-item" data-list-id="${todoList.id}" style="width: 100%; background: #2196F3; border: none; color: white; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 14px;">+ Add Item</button>
            `;
            
            // Add event listeners
            setTimeout(() => {
                const titleInput = todoElement.querySelector(`input[data-todo-id="${todoList.id}"]`);
                const addItemBtn = todoElement.querySelector('.add-todo-item');
                const removeBtn = todoElement.querySelector('.remove-btn');
                
                if (titleInput) {
                    titleInput.addEventListener('change', (e) => this.updateTitle(todoList.id, e.target.value));
                    titleInput.addEventListener('input', (e) => this.updateTitle(todoList.id, e.target.value));
                }
                if (addItemBtn) {
                    addItemBtn.addEventListener('click', () => this.addItem(todoList.id));
                }
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        console.log(`🗑️ Removing todo list: ${todoList.id}`);
                        if (window.removeSidebarItem) {
                            window.removeSidebarItem(todoList.id, 'todolist');
                        }
                    });
                }
            }, 50);
            
            // Add hover effects
            this.addHoverEffects(todoElement);
            
            // Add to sidebar content
            const todoContainer = document.getElementById('sidekick-todos');
            if (todoContainer) {
                todoContainer.appendChild(todoElement);
            }
            
            // Save to current page
            this.saveToStorage(todoList);
            
            if (window.NotificationSystem) {
                window.NotificationSystem.show('Success', 'Todo list created!', 'info');
            }
        },
        
        // Create todo list element during restoration
        createElement(todoList) {
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
            
            // Add event listeners
            setTimeout(() => {
                const titleInput = todoElement.querySelector(`input[data-todo-id="${todoList.id}"]`);
                const addItemBtn = todoElement.querySelector('.add-todo-item');
                const removeBtn = todoElement.querySelector('.remove-btn');
                
                if (titleInput) {
                    titleInput.addEventListener('change', (e) => this.updateTitle(todoList.id, e.target.value));
                    titleInput.addEventListener('input', (e) => this.updateTitle(todoList.id, e.target.value));
                }
                if (addItemBtn) {
                    addItemBtn.addEventListener('click', () => this.addItem(todoList.id));
                }
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        if (window.removeSidebarItem) {
                            window.removeSidebarItem(todoList.id, 'todolist');
                        }
                    });
                }
            }, 50);
            
            // Add hover effects
            this.addHoverEffects(todoElement);
            
            const todoContainer = document.getElementById('sidekick-todos');
            if (todoContainer) {
                todoContainer.appendChild(todoElement);
            }
            
            // Restore todo items if they exist
            if (todoList.items && todoList.items.length > 0) {
                setTimeout(() => {
                    todoList.items.forEach(item => {
                        this.addItemToElement(todoList.id, item.text, item.completed, item.id);
                    });
                }, 100);
            }
        },
        
        // Add hover effects to element
        addHoverEffects(element) {
            element.addEventListener('mouseenter', () => {
                element.style.background = '#333';
                element.style.borderColor = '#555';
            });
            element.addEventListener('mouseleave', () => {
                element.style.background = '#2a2a2a';
                element.style.borderColor = '#444';
            });
        },
        
        // Update todo list title
        updateTitle(id, title) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            const todoList = pages[currentPage].todoLists?.find(t => t.id === id);
            if (todoList) {
                todoList.title = title;
                window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
                console.log('✅ Todo title updated:', id, title);
            }
        },
        
        // Add new item to todo list
        addItem(listId) {
            const newItem = prompt('Enter todo item:');
            if (newItem && newItem.trim()) {
                const itemId = Date.now() + Math.random();
                this.addItemToElement(listId, newItem.trim(), false, itemId);
                this.saveItemToStorage(listId, itemId, newItem.trim(), false);
            }
        },
        
        // Add item to DOM element
        addItemToElement(listId, text = '', completed = false, itemId = null) {
            const container = document.getElementById(`todo-items-${listId}`);
            if (!container) return;
            
            if (!itemId) itemId = Date.now() + Math.random();
            
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
                    checkbox.addEventListener('change', () => {
                        this.updateItemInStorage(listId, itemId, textInput.value, checkbox.checked);
                    });
                }
                if (textInput) {
                    textInput.addEventListener('change', () => {
                        this.updateItemInStorage(listId, itemId, textInput.value, checkbox.checked);
                    });
                    textInput.addEventListener('input', () => {
                        this.updateItemInStorage(listId, itemId, textInput.value, checkbox.checked);
                    });
                }
                if (removeBtn) {
                    removeBtn.addEventListener('click', () => {
                        itemElement.remove();
                        this.removeItemFromStorage(listId, itemId);
                    });
                }
            }, 50);
        },
        
        // Save new item to storage
        saveItemToStorage(listId, itemId, text, completed) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            const todoList = pages[currentPage].todoLists?.find(list => list.id === listId);
            if (todoList) {
                if (!todoList.items) todoList.items = [];
                todoList.items.push({ id: itemId, text, completed });
                window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
            }
        },
        
        // Update item in storage
        updateItemInStorage(listId, itemId, text, completed) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            const todoList = pages[currentPage].todoLists?.find(list => list.id === listId);
            if (todoList) {
                if (!todoList.items) todoList.items = [];
                const existingItem = todoList.items.find(item => item.id === itemId);
                if (existingItem) {
                    existingItem.text = text;
                    existingItem.completed = completed;
                } else {
                    todoList.items.push({ id: itemId, text, completed });
                }
                window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
            }
        },
        
        // Remove item from storage
        removeItemFromStorage(listId, itemId) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            const todoList = pages[currentPage].todoLists?.find(list => list.id === listId);
            if (todoList && todoList.items) {
                todoList.items = todoList.items.filter(item => item.id !== itemId);
                window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
            }
        },
        
        // Save todo list to storage
        saveToStorage(todoList) {
            if (!window.loadState || !window.saveState || !window.STORAGE_KEYS) return;
            
            const pages = window.loadState(window.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.loadState(window.STORAGE_KEYS.CURRENT_PAGE, 0);
            
            if (!pages[currentPage].todoLists) pages[currentPage].todoLists = [];
            pages[currentPage].todoLists.push(todoList);
            
            window.saveState(window.STORAGE_KEYS.SIDEBAR_PAGES, pages);
        }
    };
    
    // Register module when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => TodoListModule.init(), 100);
        });
    } else {
        setTimeout(() => TodoListModule.init(), 100);
    }
    
    // Expose module globally
    window.TodoListModule = TodoListModule;
    
})();
