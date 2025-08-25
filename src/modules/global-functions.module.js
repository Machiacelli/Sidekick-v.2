// ==UserScript==
// @name         Sidewinder Global Functions Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Global window functions for Sidewinder sidebar compatibility
// @author       GitHub Copilot
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        none
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
        const { STORAGE_KEYS, saveState, loadState, NotificationSystem } = window.SidekickModules.Core;

        // === GLOBAL WINDOW FUNCTIONS FOR CONTENT COMPATIBILITY ===
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

        window.addTodoItem = function(listId) {
            if (window.SidekickModules?.Content?.addTodoItemToList) {
                window.SidekickModules.Content.addTodoItemToList(listId);
            } else {
                NotificationSystem.show('Info', 'Content module loading...', 'info');
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

        window.addAttackTarget = function(listId) {
            if (window.SidekickModules?.Content?.addAttackTargetToList) {
                window.SidekickModules.Content.addAttackTargetToList(listId);
            } else {
                NotificationSystem.show('Info', 'Content module loading...', 'info');
            }
        };

        window.removeSidebarItem = function(itemId, itemType) {
            // Remove from DOM
            const element = document.querySelector(`[data-id="${itemId}"]`);
            if (element) {
                element.remove();
            }
            
            // Remove from data storage
            const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
            
            if (itemType === 'notepad' && pages[currentPage].notepads) {
                pages[currentPage].notepads = pages[currentPage].notepads.filter(item => item.id !== itemId);
            } else if (itemType === 'todolist' && pages[currentPage].todoLists) {
                pages[currentPage].todoLists = pages[currentPage].todoLists.filter(item => item.id !== itemId);
            } else if (itemType === 'attacklist' && pages[currentPage].attackLists) {
                pages[currentPage].attackLists = pages[currentPage].attackLists.filter(item => item.id !== itemId);
            }
            
            saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
            NotificationSystem.show('Removed', `${itemType} removed successfully`, 'info');
            console.log(`✅ Removed ${itemType}: ${itemId}`);
        };

        window.createTimerFromPanel = function() {
            const nameEl = document.getElementById('timer-name');
            const durationEl = document.getElementById('timer-duration');
            
            if (nameEl && durationEl) {
                const name = nameEl.value.trim();
                const duration = parseInt(durationEl.value);
                
                if (name && duration > 0) {
                    if (window.SidekickModules?.Timer?.createTimer) {
                        window.SidekickModules.Timer.createTimer(name, duration * 60 * 1000);
                        NotificationSystem.show('Timer', `Timer "${name}" created for ${duration} minutes`, 'info');
                    } else {
                        NotificationSystem.show('Info', 'Timer module not yet loaded', 'info');
                    }
                    
                    // Close the panel
                    const panel = nameEl.closest('.sidekick-panel');
                    if (panel) panel.remove();
                } else {
                    NotificationSystem.show('Error', 'Please enter valid timer details', 'error');
                }
            }
        };

        // Test API key and fetch points price immediately
        window.testApiKeyAndFetchPrice = async function(apiKey) {
            try {
                if (window.SidekickModules?.Api?.makeRequest) {
                    const userResponse = await window.SidekickModules.Api.makeRequest('user', 'basic');
                    if (userResponse && userResponse.name) {
                        NotificationSystem.show('API Test', `Connected as ${userResponse.name}`, 'info');
                        
                        // Try to get points price
                        try {
                            const marketResponse = await window.SidekickModules.Api.makeRequest('market', 'pointsmarket');
                            if (marketResponse && marketResponse.pointsmarket && marketResponse.pointsmarket.length > 0) {
                                const price = marketResponse.pointsmarket[0].cost;
                                saveState('points_price', price);
                                NotificationSystem.show('Points Price', `Current price: $${price.toLocaleString()}`, 'info');
                            }
                        } catch (priceError) {
                            console.warn('Failed to fetch points price:', priceError);
                        }
                        
                        return true;
                    }
                }
                return false;
            } catch (error) {
                console.error('API test failed:', error);
                NotificationSystem.show('API Error', error.message, 'error');
                return false;
            }
        };

        window.refreshPointsPrice = function() {
            const apiKey = loadState(STORAGE_KEYS.API_KEY, '');
            if (!apiKey) {
                NotificationSystem.show('Error', 'Please set your API key in settings first', 'error');
                return;
            }
            
            if (window.SidekickModules?.Settings?.refreshPointsPrice) {
                window.SidekickModules.Settings.refreshPointsPrice();
            } else {
                NotificationSystem.show('Info', 'Settings module loading...', 'info');
            }
        };

        window.exportData = function() {
            if (window.SidekickModules?.Settings?.exportData) {
                window.SidekickModules.Settings.exportData();
            } else {
                NotificationSystem.show('Info', 'Settings module loading...', 'info');
            }
        };

        window.importData = function() {
            if (window.SidekickModules?.Settings?.importData) {
                window.SidekickModules.Settings.importData();
            } else {
                NotificationSystem.show('Info', 'Settings module loading...', 'info');
            }
        };

        // === CLOCK FUNCTIONALITY ===
        window.startTornClock = function() {
            console.log('🕐 Starting Torn clock...');
            
            function updateClock() {
                const now = new Date();
                const timeString = now.toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                });
                const dateString = now.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                const timeEl = document.getElementById('clock-time');
                const dateEl = document.getElementById('clock-date');
                
                if (timeEl) timeEl.textContent = timeString;
                if (dateEl) dateEl.textContent = dateString;
            }
            
            // Update immediately
            updateClock();
            
            // Update every second
            setInterval(updateClock, 1000);
        };

        console.log('✅ Global functions module loaded');
    });

})();
