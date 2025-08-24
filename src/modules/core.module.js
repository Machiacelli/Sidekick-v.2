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

    // Enhanced storage with consistent global keys
    function getProfileKey() {
        // Use consistent storage across ALL pages for true global persistence
        // This ensures notepads appear on all pages regardless of which profile you're viewing
        return 'global';
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
            // Use global storage for sidebar state (not profile-specific)
            try {
                const state = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
                return state ? JSON.parse(state) : { hidden: false };
            } catch (error) {
                return { hidden: false };
            }
        },
        
        setState(state) {
            // Use global storage for sidebar state (not profile-specific)
            try {
                localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, JSON.stringify(state));
            } catch (error) {
                console.error('Failed to save sidebar state:', error);
            }
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
            const hamburger = document.getElementById('sidekick-hamburger');
            
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
            }
            
            if (hamburger) {
                hamburger.innerHTML = state.hidden ? '☰' : '✕';
                hamburger.title = state.hidden ? 'Show Sidebar' : 'Hide Sidebar';
            }
        },
        
        // Simple initialization without mutation observer
        clearAllData() {
            // Remove all Sidekick-related localStorage keys
            const knownKeys = [
                'SIDEBAR_PAGES',
                'CURRENT_PAGE',
                // Add any other keys your modules use here
            ];
            // Remove all keys starting with 'sidekick_'
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith('sidekick_')) {
                    localStorage.removeItem(key);
                }
            }
            // Remove known keys
            knownKeys.forEach(key => localStorage.removeItem(key));

            console.log('🗑️ Cleared all Sidekick data from localStorage');
            if (window.NotificationSystem && typeof window.NotificationSystem.show === 'function') {
                NotificationSystem.show('Data Cleared', 'All Sidekick data has been cleared', 'info', 3000);
            }
            // Optionally reload the page to reset UI
            setTimeout(() => window.location.reload(), 500);
        },

        init() {
            console.log('🏗️ Initializing sidebar state manager...');
            this.applyState();
            console.log('✅ Sidebar state manager initialized');
        }
    };

    // Navigation detection for better persistence
    const NavigationManager = {
        currentUrl: window.location.href,
        
        init() {
            this.setupNavigationDetection();
        },
        
        setupNavigationDetection() {
            // Monitor for URL changes (both popstate and pushstate)
            window.addEventListener('popstate', () => this.handleNavigation());
            
            // Override pushState and replaceState to catch programmatic navigation
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function(...args) {
                originalPushState.apply(history, args);
                NavigationManager.handleNavigation();
            };
            
            history.replaceState = function(...args) {
                originalReplaceState.apply(history, args);
                NavigationManager.handleNavigation();
            };
            
            // Also monitor for DOM changes that might indicate navigation
            const observer = new MutationObserver(() => {
                if (window.location.href !== this.currentUrl) {
                    this.handleNavigation();
                }
            });
            
            observer.observe(document.body, { 
                childList: true, 
                subtree: true,
                attributes: false
            });
            
            console.log('🧭 Navigation detection system initialized');
        },
        
        handleNavigation() {
            const newUrl = window.location.href;
            if (newUrl !== this.currentUrl) {
                console.log('🧭 Page navigation detected:', this.currentUrl, '→', newUrl);
                this.currentUrl = newUrl;
                
                // Delay to allow page to load
                setTimeout(() => {
                    this.restorePanels();
                }, 1000);
            }
        },
        
        restorePanels() {
            try {
                console.log('🔄 Restoring panels after navigation...');
                
                // Refresh notepads with page-specific layouts but global content
                if (window.SidekickModules?.Notepad) {
                    console.log('📝 Refreshing notepads for new page...');
                    window.SidekickModules.Notepad.refreshDisplay();
                } else {
                    console.log('⚠️ Notepad module not ready for panel restoration');
                }
                
            } catch (error) {
                console.error('❌ Error restoring panels:', error);
            }
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
        NavigationManager,
        getProfileKey,
        getProfileSpecificKey
    };

    // Initialize the sidebar state manager and navigation detection
    SidebarStateManager.init();
    NavigationManager.init();

    console.log('✅ Core module loaded - v3.6.0 cache refresh');

})();
