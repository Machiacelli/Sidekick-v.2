// ==UserScript==
// @name         Sidekick Core Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Core functionality for Sidekick sidebar system
// @author       GitHub Copilot
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      none
// ==/UserScript==

(function() {
    'use strict';

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
        createNotepad(title = 'New Notepad') {
            return {
                id: Date.now() + Math.random(),
                title: title,
                content: '',
                type: 'notepad',
                created: new Date().toISOString()
            };
        },
        
        createTodoList(title = 'New Todo List') {
            return {
                id: Date.now() + Math.random(),
                title: title,
                items: [],
                type: 'todoList',
                created: new Date().toISOString()
            };
        },
        
        createAttackList(title = 'New Attack List') {
            return {
                id: Date.now() + Math.random(),
                title: title,
                targets: [],
                type: 'attackList',
                created: new Date().toISOString()
            };
        }
    };

    // === SIDEBAR STATE MANAGER ===
    const SidebarStateManager = {
        getState() {
            return loadState(STORAGE_KEYS.SIDEBAR_STATE, { hidden: false });
        },
        
        setState(state) {
            saveState(STORAGE_KEYS.SIDEBAR_STATE, state);
        },
        
        isHidden() {
            return this.getState().hidden;
        },
        
        toggle() {
            const currentState = this.getState();
            const newState = { ...currentState, hidden: !currentState.hidden };
            this.setState(newState);
            this.applyState();
            return newState;
        },
        
        applyState() {
            const state = this.getState();
            const sidebar = document.getElementById('sidekick-sidebar');
            const addBtn = document.getElementById('sidekick-add-btn');
            const hamburger = document.getElementById('sidekick-hamburger');
            
            console.log('🔄 Applying sidebar state:', state);
            
            // Apply body class for CSS targeting
            if (state.hidden) {
                document.body.classList.add('sidekick-sidebar-hidden');
                document.body.classList.remove('sidekick-sidebar-visible');
            } else {
                document.body.classList.remove('sidekick-sidebar-hidden');
                document.body.classList.add('sidekick-sidebar-visible');
            }
            
            if (sidebar) {
                sidebar.classList.toggle('hidden', state.hidden);
                console.log('📊 Sidebar element state applied - hidden:', state.hidden);
            }
            
            if (addBtn) {
                // Don't hide the add button anymore, just reposition it
                // addBtn.classList.toggle('hidden', state.hidden);
            }
            
            if (hamburger) {
                hamburger.innerHTML = state.hidden ? '☰' : '✕';
                hamburger.title = state.hidden ? 'Show Sidebar' : 'Hide Sidebar';
                console.log('🍔 Hamburger updated - showing:', state.hidden ? 'show button' : 'hide button');
            }
            
            // Also update the UI module to make sure it knows about the state change
            if (window.SidekickModules?.UI?.updateSidebarVisibility) {
                window.SidekickModules.UI.updateSidebarVisibility(state.hidden);
            }
        },
        
        // Auto-apply state on page load
        init() {
            console.log('🏗️ Initializing sidebar state manager...');
            
            // Apply state immediately
            this.applyState();
            
            // Also observe for DOM changes to ensure state persistence
            const observer = new MutationObserver(() => {
                setTimeout(() => this.applyState(), 100);
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            console.log('✅ Sidebar state manager initialized');
        }
    };

    // Export to global scope for other modules to use
    if (typeof window.SidekickModules === 'undefined') {
        window.SidekickModules = {};
    }

    window.SidekickModules.Core = {
        STORAGE_KEYS,
        saveState,
        loadState,
        NotificationSystem,
        DataTemplates,
        SidebarStateManager,
        getProfileKey,
        getProfileSpecificKey
    };

    // Initialize the sidebar state manager
    SidebarStateManager.init();

    console.log('✅ Core module loaded');

})();
