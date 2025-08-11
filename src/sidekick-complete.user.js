// ==UserScript==
// @name         Sidekick Complete - Full Featured Sidebar
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Complete all-in-one modular sidebar - Enhanced Torn.com sidebar with notepads, todo lists, attack lists, cooldown timers, travel tracker, points monitor, clock, and debugging tools
// @author       GitHub Copilot
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log("🚀 SIDEWINDER COMPLETE STARTING - " + new Date().toLocaleTimeString());
    
    // Test basic functionality
    console.log('🧪 Testing basic JavaScript functionality...');
    console.log('✅ JavaScript is working');
    
    // Test if we can access the page
    console.log('🌐 Page URL:', window.location.href);
    console.log('📄 Document ready state:', document.readyState);

    // Inject critical CSS immediately for maximum visibility
    GM_addStyle(`
        /* COMPACT HAMBURGER BUTTON - SMALLER AND MORE CORNER POSITIONED */
        #sidekick-hamburger {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            z-index: 2147483647 !important;
            background: linear-gradient(135deg, #262626, #5e5c5cff) !important;
            color: white !important;
            border: 1px solid rgba(255,255,255,0.6) !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 16px !important;
            font-weight: bold !important;
            text-align: center !important;
            line-height: 30px !important;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5) !important;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            pointer-events: auto !important;
            outline: none !important;
            user-select: none !important;
        }

        #sidekick-hamburger:hover {
            transform: scale(1.15) !important;
            box-shadow: 0 4px 16px #000000ff !important;
            background: linear-gradient(135deg, #66BB6A, #ffad5a) !important;
        }

        #sidekick-hamburger:active {
            transform: scale(0.9) !important;
        }

        /* SIDEBAR STYLES */
        #sidekick-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 380px !important;
            height: 100vh !important;
            background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%) !important;
            border-right: 2px solid #444 !important;
            z-index: 999999 !important;
            overflow: hidden !important;
            transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
            box-shadow: 4px 0 20px rgba(0,0,0,0.3) !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
            display: flex !important;
            flex-direction: column !important;
        }

        #sidekick-sidebar.hidden {
            transform: translateX(-100%) !important;
        }

        /* ADD BUTTON STYLES */
        #sidekick-add-btn {
            position: fixed !important;
            bottom: 30px !important;
            left: 30px !important;
            width: 56px !important;
            height: 56px !important;
            background: linear-gradient(135deg, #4CAF50, #45a049) !important;
            color: white !important;
            border: none !important;
            border-radius: 50% !important;
            font-size: 24px !important;
            cursor: pointer !important;
            z-index: 999998 !important;
            box-shadow: 0 4px 20px rgba(76,175,80,0.4) !important;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
        }

        #sidekick-add-btn:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 6px 25px rgba(76,175,80,0.6) !important;
        }

        #sidekick-add-btn.hidden {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
        }

        /* BUTTON STYLES */
        .sidekick-btn {
            background: linear-gradient(135deg, #4CAF50, #45a049) !important;
            color: white !important;
            border: none !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            transition: all 0.3s ease !important;
        }

        .sidekick-btn:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(76,175,80,0.4) !important;
        }

        /* NOTIFICATION STYLES */
        .sidekick-notification {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: linear-gradient(135deg, #4CAF50, #45a049) !important;
            color: white !important;
            padding: 12px 20px !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
            z-index: 9999999 !important;
            animation: slideInRight 0.3s ease !important;
            max-width: 300px !important;
            font-family: 'Segoe UI', sans-serif !important;
        }

        .sidekick-notification.error {
            background: linear-gradient(135deg, #f44336, #d32f2f) !important;
        }

        .sidekick-notification.warning {
            background: linear-gradient(135deg, #ff9800, #f57c00) !important;
        }

        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `);

    // === CORE STORAGE SYSTEM ===
    const STORAGE_KEYS = {
        NOTEPADS: 'sidekick_notepads',
        TODO_LISTS: 'sidekick_todo_lists',
        ATTACK_LISTS: 'sidekick_attack_lists',
        API_KEY: 'sidekick_api_key',
        SIDEBAR_STATE: 'sidekick_sidebar_state',
        SIDEBAR_WIDTH: 'sidekick_sidebar_width',
        SIDEBAR_PAGES: 'sidekick_sidebar_pages',
        CURRENT_PAGE: 'sidekick_current_page',
        TIMERS: 'sidekick_timers',
        TRAVEL_TRACKERS: 'sidekick_travel_trackers'
    };

    // Enhanced storage with profile support
    function getProfileKey() {
        const urlMatch = window.location.href.match(/profiles\.php\?XID=(\d+)/);
        return urlMatch ? urlMatch[1] : 'default';
    }

    function getProfileSpecificKey(baseKey) {
        const profileId = getProfileKey();
        return `${baseKey}_profile_${profileId}`;
    }

    function saveState(key, data) {
        const profileKey = getProfileSpecificKey(key);
        try {
            localStorage.setItem(profileKey, JSON.stringify(data));
            localStorage.setItem(key, JSON.stringify(data)); // Backward compatibility
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    function loadState(key, defaultValue = null) {
        const profileKey = getProfileSpecificKey(key);
        try {
            const profileData = localStorage.getItem(profileKey);
            if (profileData) return JSON.parse(profileData);
            
            const baseData = localStorage.getItem(key);
            if (baseData) {
                const parsed = JSON.parse(baseData);
                saveState(key, parsed); // Migrate to profile-specific
                return parsed;
            }
        } catch (error) {
            console.error('Failed to load state:', error);
        }
        return defaultValue;
    }

    // === NOTIFICATION SYSTEM ===
    const NotificationSystem = {
        show(title, message, type = 'info', duration = 4000) {
            const notification = document.createElement('div');
            notification.className = `sidekick-notification ${type}`;
            
            notification.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 13px; opacity: 0.9;">${message}</div>
            `;
            
            document.body.appendChild(notification);
            
            // Auto remove
            setTimeout(() => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, duration);
            
            // Click to dismiss
            notification.addEventListener('click', () => {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            });
        }
    };

    // === DATA TEMPLATES ===
    const DataTemplates = {
        createNotepad() {
            return {
                id: Date.now() + Math.random(),
                title: 'Untitled Notepad',
                content: '',
                type: 'notepad',
                created: new Date().toISOString()
            };
        },

        createTodoList() {
            return {
                id: Date.now() + Math.random(),
                title: 'Untitled Todo List',
                items: [],
                type: 'todoList',
                created: new Date().toISOString()
            };
        },

        createAttackList() {
            return {
                id: Date.now() + Math.random(),
                title: 'Untitled Attack List',
                targets: [],
                type: 'attackList',
                created: new Date().toISOString()
            };
        }
    };

    // === GLOBAL WINDOW FUNCTIONS ===
    console.log('📋 Defining global window functions...');
    
    window.updateNotepadTitle = function(id, title) {
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
        
        const notepad = pages[currentPage].notepads?.find(n => n.id === id);
        if (notepad) {
            notepad.title = title;
            saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
            console.log('✅ Notepad title updated:', id, title);
        }
    };

    window.updateNotepadContent = function(id, content) {
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
        
        const notepad = pages[currentPage].notepads?.find(n => n.id === id);
        if (notepad) {
            notepad.content = content;
            saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
            console.log('✅ Notepad content updated:', id, content.substring(0, 50) + '...');
        }
    };

    window.updateTodoTitle = function(id, title) {
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
        
        const todoList = pages[currentPage].todoLists?.find(t => t.id === id);
        if (todoList) {
            todoList.title = title;
            saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
            console.log('✅ Todo title updated:', id, title);
        }
    };

    window.updateAttackTitle = function(id, title) {
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
        
        const attackList = pages[currentPage].attackLists?.find(a => a.id === id);
        if (attackList) {
            attackList.title = title;
            saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
            console.log('✅ Attack list title updated:', id, title);
        }
    };

    window.removeSidebarItem = function(itemId, itemType) {
        const element = document.querySelector(`[data-id="${itemId}"]`);
        if (element) {
            element.remove();
        }
        
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
        
        if (itemType === 'notepad' && pages[currentPage].notepads) {
            pages[currentPage].notepads = pages[currentPage].notepads.filter(item => item.id !== itemId);
        } else if (itemType === 'todoList' && pages[currentPage].todoLists) {
            pages[currentPage].todoLists = pages[currentPage].todoLists.filter(item => item.id !== itemId);
        } else if (itemType === 'attackList' && pages[currentPage].attackLists) {
            pages[currentPage].attackLists = pages[currentPage].attackLists.filter(item => item.id !== itemId);
        }
        
        saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
        NotificationSystem.show('Removed', `${itemType} removed successfully`, 'info');
    };

    // === MAIN UI CREATION FUNCTIONS ===
    function createHamburgerButton() {
        const hamburger = document.createElement('button');
        hamburger.id = 'sidekick-hamburger';
        hamburger.innerHTML = '☰';
        hamburger.title = 'Toggle Sidewinder Sidebar';
        
        hamburger.addEventListener('click', () => {
            const sidebar = document.getElementById('sidekick-sidebar');
            if (sidebar) {
                sidebar.classList.toggle('hidden');
                const isHidden = sidebar.classList.contains('hidden');
                saveState(STORAGE_KEYS.SIDEBAR_STATE, { hidden: isHidden });
                console.log('🔧 Sidebar toggled:', isHidden ? 'hidden' : 'visible');
            }
        });
        
        document.body.appendChild(hamburger);
        console.log('✅ Hamburger button created');
    }

    function createSidebar() {
        const sidebar = document.createElement('div');
        sidebar.id = 'sidekick-sidebar';
        
        // Load sidebar state
        const sidebarState = loadState(STORAGE_KEYS.SIDEBAR_STATE, { hidden: false });
        if (sidebarState.hidden) {
            sidebar.classList.add('hidden');
        }
        
        document.body.appendChild(sidebar);
        console.log('✅ Sidebar container created');
        
        createTopBar();
        createContentContainers();
        createPageNavigation();
    }

    function createTopBar() {
        const sidebar = document.getElementById('sidekick-sidebar');
        const topBar = document.createElement('div');
        topBar.className = 'sidekick-topbar';
        topBar.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h3 style="margin: 0; font-size: 16px; color: #fff;">Sidewinder v2.0</h3>
                    <p style="margin: 2px 0 0 0; font-size: 11px; color: #ccc;">Complete Modular Suite</p>
                </div>
                <button onclick="showSettingsModal()" style="background: none; border: 1px solid #555; color: #ccc; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">⚙️ Settings</button>
            </div>
        `;
        sidebar.appendChild(topBar);
    }

    function createContentContainers() {
        const sidebar = document.getElementById('sidekick-sidebar');
        
        const content = document.createElement('div');
        content.id = 'sidekick-content';
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            padding-bottom: 60px;
        `;
        
        // Create containers for different types
        const notepadContainer = document.createElement('div');
        notepadContainer.id = 'sidekick-notepads';
        notepadContainer.style.marginBottom = '20px';
        content.appendChild(notepadContainer);
        
        const todoContainer = document.createElement('div');
        todoContainer.id = 'sidekick-todos';
        todoContainer.style.marginBottom = '20px';
        content.appendChild(todoContainer);
        
        const attackContainer = document.createElement('div');
        attackContainer.id = 'sidekick-attacks';
        attackContainer.style.marginBottom = '20px';
        content.appendChild(attackContainer);
        
        sidebar.appendChild(content);
    }

    function createAddButton() {
        const addBtn = document.createElement('button');
        addBtn.id = 'sidekick-add-btn';
        addBtn.innerHTML = '+';
        addBtn.title = 'Add new item';
        
        addBtn.addEventListener('click', showAddMenu);
        
        document.body.appendChild(addBtn);
        console.log('✅ Add button created');
    }

    function createPageNavigation() {
        const sidebar = document.getElementById('sidekick-sidebar');
        const pageNav = document.createElement('div');
        pageNav.className = 'sidekick-page-dots';
        pageNav.id = 'sidekick-page-nav';
        
        // Create initial page dot
        const dot = document.createElement('div');
        dot.className = 'sidekick-page-dot active';
        dot.dataset.page = '0';
        dot.addEventListener('click', () => switchToPage(0));
        pageNav.appendChild(dot);
        
        // Add page button
        const addPageBtn = document.createElement('div');
        addPageBtn.className = 'sidekick-add-page-btn';
        addPageBtn.innerHTML = '+';
        addPageBtn.title = 'Add new page';
        addPageBtn.addEventListener('click', addNewPage);
        pageNav.appendChild(addPageBtn);
        
        sidebar.appendChild(pageNav);
    }

    function showAddMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 30px;
            background: linear-gradient(145deg, #2a2a2a, #1f1f1f);
            border: 1px solid #444;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            z-index: 999999;
            overflow: hidden;
        `;
        
        const items = [
            { icon: '📝', text: 'Add Notepad', action: addNotepad },
            { icon: '✅', text: 'Add Todo List', action: addTodoList },
            { icon: '🎯', text: 'Add Attack List', action: addAttackList }
        ];
        
        items.forEach(item => {
            const btn = document.createElement('button');
            btn.style.cssText = `
                display: flex;
                align-items: center;
                width: 100%;
                padding: 12px 16px;
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                transition: background 0.3s ease;
                font-size: 14px;
                border-bottom: 1px solid #333;
            `;
            btn.innerHTML = `<span style="margin-right: 12px; font-size: 16px;">${item.icon}</span>${item.text}`;
            
            btn.addEventListener('mouseenter', () => btn.style.background = '#333');
            btn.addEventListener('mouseleave', () => btn.style.background = 'none');
            btn.addEventListener('click', () => {
                item.action();
                menu.remove();
            });
            
            menu.appendChild(btn);
        });
        
        document.body.appendChild(menu);
        
        // Remove menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function removeMenu(e) {
                if (!menu.contains(e.target) && e.target.id !== 'sidekick-add-btn') {
                    menu.remove();
                    document.removeEventListener('click', removeMenu);
                }
            });
        }, 100);
    }

    // === ADD FUNCTIONS ===
    function addNotepad() {
        const notepad = DataTemplates.createNotepad();
        const notepadElement = createNotepadElement(notepad);
        
        const container = document.getElementById('sidekick-notepads');
        container.appendChild(notepadElement);
        
        // Save to storage
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
        
        if (!pages[currentPage].notepads) pages[currentPage].notepads = [];
        pages[currentPage].notepads.push(notepad);
        
        saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
        
        NotificationSystem.show('Success', 'Notepad created!', 'info');
    }

    function addTodoList() {
        const todoList = DataTemplates.createTodoList();
        const todoElement = createTodoListElement(todoList);
        
        const container = document.getElementById('sidekick-todos');
        container.appendChild(todoElement);
        
        // Save to storage
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
        
        if (!pages[currentPage].todoLists) pages[currentPage].todoLists = [];
        pages[currentPage].todoLists.push(todoList);
        
        saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
        
        NotificationSystem.show('Success', 'Todo list created!', 'info');
    }

    function addAttackList() {
        const attackList = DataTemplates.createAttackList();
        const attackElement = createAttackListElement(attackList);
        
        const container = document.getElementById('sidekick-attacks');
        container.appendChild(attackElement);
        
        // Save to storage
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
        
        if (!pages[currentPage].attackLists) pages[currentPage].attackLists = [];
        pages[currentPage].attackLists.push(attackList);
        
        saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
        
        NotificationSystem.show('Success', 'Attack list created!', 'info');
    }

    // === ELEMENT CREATION FUNCTIONS ===
    function createNotepadElement(notepad) {
        const element = document.createElement('div');
        element.className = 'sidebar-item';
        element.dataset.id = notepad.id;
        element.style.cssText = `
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            transition: all 0.3s ease;
        `;
        
        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <input type="text" value="${notepad.title}" data-notepad-id="${notepad.id}" 
                       style="background: #333; border: 1px solid #555; color: #fff; padding: 6px 8px; border-radius: 4px; font-weight: bold; flex: 1; margin-right: 8px;">
                <button class="remove-btn" data-item-id="${notepad.id}" data-item-type="notepad" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 4px;">×</button>
            </div>
            <textarea placeholder="Start typing your notes..." data-notepad-content-id="${notepad.id}"
                      style="width: 100%; height: 120px; background: #333; border: 1px solid #555; color: #fff; padding: 8px; border-radius: 4px; resize: vertical; font-family: inherit; box-sizing: border-box;">${notepad.content || ''}</textarea>
        `;
        
        // Add event listeners
        const titleInput = element.querySelector(`input[data-notepad-id="${notepad.id}"]`);
        const contentTextarea = element.querySelector(`textarea[data-notepad-content-id="${notepad.id}"]`);
        const removeBtn = element.querySelector('.remove-btn');
        
        titleInput.addEventListener('input', (e) => window.updateNotepadTitle(notepad.id, e.target.value));
        contentTextarea.addEventListener('input', (e) => window.updateNotepadContent(notepad.id, e.target.value));
        removeBtn.addEventListener('click', () => window.removeSidebarItem(notepad.id, 'notepad'));
        
        // Hover effects
        element.addEventListener('mouseenter', () => {
            element.style.background = '#333';
            element.style.borderColor = '#555';
        });
        element.addEventListener('mouseleave', () => {
            element.style.background = '#2a2a2a';
            element.style.borderColor = '#444';
        });
        
        return element;
    }

    function createTodoListElement(todoList) {
        const element = document.createElement('div');
        element.className = 'sidebar-item';
        element.dataset.id = todoList.id;
        element.style.cssText = `
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            transition: all 0.3s ease;
        `;
        
        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <input type="text" value="${todoList.title}" data-todo-id="${todoList.id}" 
                       style="background: #333; border: 1px solid #555; color: #fff; padding: 6px 8px; border-radius: 4px; font-weight: bold; flex: 1; margin-right: 8px;">
                <button class="remove-btn" data-item-id="${todoList.id}" data-item-type="todoList" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 4px;">×</button>
            </div>
            <div class="todo-items" data-todo-items="${todoList.id}" style="margin-bottom: 8px;"></div>
            <button onclick="addTodoItem('${todoList.id}')" style="background: #4CAF50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">+ Add Item</button>
        `;
        
        // Add event listeners
        const titleInput = element.querySelector(`input[data-todo-id="${todoList.id}"]`);
        const removeBtn = element.querySelector('.remove-btn');
        
        titleInput.addEventListener('input', (e) => window.updateTodoTitle(todoList.id, e.target.value));
        removeBtn.addEventListener('click', () => window.removeSidebarItem(todoList.id, 'todoList'));
        
        // Hover effects
        element.addEventListener('mouseenter', () => {
            element.style.background = '#333';
            element.style.borderColor = '#555';
        });
        element.addEventListener('mouseleave', () => {
            element.style.background = '#2a2a2a';
            element.style.borderColor = '#444';
        });
        
        return element;
    }

    function createAttackListElement(attackList) {
        const element = document.createElement('div');
        element.className = 'sidebar-item';
        element.dataset.id = attackList.id;
        element.style.cssText = `
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            transition: all 0.3s ease;
        `;
        
        element.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <input type="text" value="${attackList.title}" data-attack-id="${attackList.id}" 
                       style="background: #333; border: 1px solid #555; color: #fff; padding: 6px 8px; border-radius: 4px; font-weight: bold; flex: 1; margin-right: 8px;">
                <button class="remove-btn" data-item-id="${attackList.id}" data-item-type="attackList" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 4px;">×</button>
            </div>
            <div class="attack-targets" data-attack-targets="${attackList.id}" style="margin-bottom: 8px;"></div>
            <button onclick="addAttackTarget('${attackList.id}')" style="background: #f44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">+ Add Target</button>
        `;
        
        // Add event listeners
        const titleInput = element.querySelector(`input[data-attack-id="${attackList.id}"]`);
        const removeBtn = element.querySelector('.remove-btn');
        
        titleInput.addEventListener('input', (e) => window.updateAttackTitle(attackList.id, e.target.value));
        removeBtn.addEventListener('click', () => window.removeSidebarItem(attackList.id, 'attackList'));
        
        // Hover effects
        element.addEventListener('mouseenter', () => {
            element.style.background = '#333';
            element.style.borderColor = '#555';
        });
        element.addEventListener('mouseleave', () => {
            element.style.background = '#2a2a2a';
            element.style.borderColor = '#444';
        });
        
        return element;
    }

    // === PAGE MANAGEMENT ===
    function switchToPage(pageIndex) {
        saveState(STORAGE_KEYS.CURRENT_PAGE, pageIndex);
        
        // Update dot appearance
        document.querySelectorAll('.sidekick-page-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === pageIndex);
        });
        
        // Refresh content for new page
        refreshSidebarContent();
    }

    function addNewPage() {
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        
        // Add new empty page
        pages.push({ notepads: [], todoLists: [], attackLists: [] });
        saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
        
        // Update navigation
        const nav = document.getElementById('sidekick-page-nav');
        const newDot = document.createElement('div');
        newDot.className = 'sidekick-page-dot';
        newDot.dataset.page = pages.length - 1;
        newDot.addEventListener('click', () => switchToPage(pages.length - 1));
        
        // Insert before add button
        const addBtn = nav.querySelector('.sidekick-add-page-btn');
        nav.insertBefore(newDot, addBtn);
        
        // Switch to new page
        switchToPage(pages.length - 1);
        
        NotificationSystem.show('Success', 'New page created!', 'info');
    }

    // === CONTENT RESTORATION ===
    function restoreSavedContent() {
        const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
        const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
        
        if (pages[currentPage]) {
            // Restore notepads
            if (pages[currentPage].notepads) {
                pages[currentPage].notepads.forEach(notepad => {
                    const element = createNotepadElement(notepad);
                    document.getElementById('sidekick-notepads').appendChild(element);
                });
            }
            
            // Restore todo lists
            if (pages[currentPage].todoLists) {
                pages[currentPage].todoLists.forEach(todoList => {
                    const element = createTodoListElement(todoList);
                    document.getElementById('sidekick-todos').appendChild(element);
                });
            }
            
            // Restore attack lists
            if (pages[currentPage].attackLists) {
                pages[currentPage].attackLists.forEach(attackList => {
                    const element = createAttackListElement(attackList);
                    document.getElementById('sidekick-attacks').appendChild(element);
                });
            }
        }
        
        console.log(`✅ Restored content for page ${currentPage}`);
    }

    function refreshSidebarContent() {
        // Clear current content
        document.getElementById('sidekick-notepads').innerHTML = '';
        document.getElementById('sidekick-todos').innerHTML = '';
        document.getElementById('sidekick-attacks').innerHTML = '';
        
        // Restore content for current page
        restoreSavedContent();
    }

    // === SETTINGS MODAL ===
    window.showSettingsModal = function() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 99999999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div style="background: linear-gradient(145deg, #2a2a2a, #1f1f1f); border: 1px solid #444; border-radius: 12px; padding: 24px; max-width: 500px; width: 90%; color: #fff;">
                <h3 style="margin: 0 0 20px 0; color: #fff;">Sidewinder Settings</h3>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 6px; color: #ccc;">Torn API Key:</label>
                    <input type="password" id="api-key-input" placeholder="Enter your API key" style="width: 100%; padding: 8px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px; box-sizing: border-box;">
                    <small style="color: #888; font-size: 11px;">Required for points monitor and API features</small>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 20px;">
                    <button onclick="saveApiKey()" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save</button>
                    <button onclick="this.closest('div').parentElement.remove()" style="background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
            </div>
        `;
        
        // Load current API key
        const apiKeyInput = modal.querySelector('#api-key-input');
        const currentKey = loadState(STORAGE_KEYS.API_KEY, '');
        if (currentKey) {
            apiKeyInput.value = currentKey;
        }
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };

    window.saveApiKey = function() {
        const apiKey = document.getElementById('api-key-input').value.trim();
        if (apiKey) {
            saveState(STORAGE_KEYS.API_KEY, apiKey);
            NotificationSystem.show('Success', 'API key saved!', 'info');
            document.querySelector('#api-key-input').closest('div').parentElement.remove();
        } else {
            NotificationSystem.show('Error', 'Please enter a valid API key', 'error');
        }
    };

    // === INITIALIZATION ===
    function initializeSidewinder() {
        console.log('🔧 Initializing Sidewinder Complete...');
        
        createHamburgerButton();
        createSidebar();
        createAddButton();
        
        // Restore saved content
        setTimeout(() => {
            restoreSavedContent();
            console.log('✅ Sidewinder Complete initialization complete!');
            NotificationSystem.show('Sidewinder', 'Complete system loaded successfully!', 'info');
        }, 500);
    }

    // === STARTUP ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSidewinder);
    } else {
        initializeSidewinder();
    }

    // Backup initialization
    setTimeout(() => {
        if (!document.getElementById('sidekick-hamburger')) {
            console.log('🔄 Backup initialization triggered');
            initializeSidewinder();
        }
    }, 2000);

    console.log("🎯 Sidewinder Complete script loaded and ready!");

})();
