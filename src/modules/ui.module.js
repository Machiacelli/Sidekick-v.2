// ==UserScript==
// @name         Sidekick UI Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  UI creation and management for Sidekick sidebar
// @author       GitHub Copilot
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
        const { STORAGE_KEYS, saveState, loadState, NotificationSystem, SidebarStateManager } = window.SidekickModules.Core;

        // Inject comprehensive CSS from sidekick-test.user.js
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

            /* When sidebar is open, move add button to avoid overlap */
            body:not(.sidekick-sidebar-hidden) #sidekick-add-btn {
                right: 30px !important;
                left: auto !important;
            }

            /* When sidebar is closed, keep add button on the right */
            body.sidekick-sidebar-hidden #sidekick-add-btn {
                right: 30px !important;
                left: auto !important;
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

            /* PANEL STYLES */
            .sidekick-panel {
                position: absolute !important;
                background: linear-gradient(145deg, #2a2a2a, #1f1f1f) !important;
                border: 1px solid #444 !important;
                border-radius: 12px !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
                color: #fff !important;
                font-family: 'Segoe UI', sans-serif !important;
                min-width: 250px !important;
                max-width: 400px !important;
                backdrop-filter: blur(10px) !important;
                z-index: 999990 !important;
            }

            .sidekick-panel-header {
                background: linear-gradient(135deg, #333, #444) !important;
                padding: 12px 16px !important;
                border-radius: 12px 12px 0 0 !important;
                border-bottom: 1px solid #555 !important;
                cursor: move !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                font-weight: 600 !important;
                font-size: 14px !important;
            }

            .sidekick-panel-content {
                padding: 16px !important;
                max-height: 400px !important;
                overflow-y: auto !important;
            }

            /* TOP BAR STYLES */
            .sidekick-topbar {
                background: linear-gradient(135deg, #333, #2a2a2a) !important;
                padding: 4px 12px !important;
                border-bottom: 2px solid #444 !important;
                color: #fff !important;
                min-height: 28px !important;
                display: flex !important;
                align-items: center !important;
                flex-shrink: 0 !important;
            }

            /* SCROLLBAR STYLING */
            #sidekick-content::-webkit-scrollbar {
                width: 8px !important;
            }

            #sidekick-content::-webkit-scrollbar-track {
                background: #1a1a1a !important;
            }

            #sidekick-content::-webkit-scrollbar-thumb {
                background: #444 !important;
                border-radius: 4px !important;
            }

            #sidekick-content::-webkit-scrollbar-thumb:hover {
                background: #555 !important;
            }

            /* PAGE DOTS NAVIGATION */
            .sidekick-page-dots {
                position: absolute !important;
                bottom: 0 !important;
                left: 0 !important;
                right: 0 !important;
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                gap: 6px !important;
                padding: 12px 16px !important;
                background: linear-gradient(180deg, transparent 0%, #1a1a1a 50%) !important;
                border-top: 1px solid #333 !important;
            }

            .sidekick-page-navigation {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                gap: 4px !important;
                flex: 1 !important;
            }

            .sidekick-component-controls {
                position: absolute !important;
                left: 16px !important;
                display: flex !important;
                align-items: center !important;
                gap: 4px !important;
            }

            .sidekick-add-component-btn {
                width: 32px !important;
                height: 32px !important;
                border-radius: 6px !important;
                background: linear-gradient(135deg, #4CAF50, #45a049) !important;
                border: none !important;
                color: white !important;
                font-size: 18px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3) !important;
                user-select: none !important;
                outline: none !important;
            }

            .sidekick-add-component-btn:hover {
                transform: scale(1.1) !important;
                background: linear-gradient(135deg, #66BB6A, #388E3C) !important;
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5) !important;
            }

            .sidekick-add-component-btn:active {
                transform: scale(0.95) !important;
            }

            .sidekick-page-dot {
                width: 8px !important;
                height: 8px !important;
                border-radius: 50% !important;
                background: rgba(255, 255, 255, 0.3) !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                opacity: 0.4 !important;
                position: relative !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
            }

            .sidekick-page-dot.active {
                background: rgba(255, 255, 255, 0.8) !important;
                transform: scale(1.3) !important;
                opacity: 1 !important;
                border: 1px solid rgba(255, 255, 255, 0.6) !important;
            }

            .sidekick-page-dot:hover {
                background: rgba(255, 255, 255, 0.5) !important;
                opacity: 0.7 !important;
                transform: scale(1.1) !important;
                border: 1px solid rgba(255, 255, 255, 0.4) !important;
            }

            .sidekick-page-dot.removing {
                background: #f44336 !important;
                transform: scale(1.4) !important;
                opacity: 1 !important;
                animation: pulse-red 0.3s ease infinite alternate !important;
            }

            @keyframes pulse-red {
                from { background: #f44336; }
                to { background: #ff5722; }
            }

            .sidekick-add-page-btn {
                width: 16px !important;
                height: 16px !important;
                border-radius: 50% !important;
                background: rgba(255, 255, 255, 0.2) !important;
                border: 1px solid rgba(255, 255, 255, 0.3) !important;
                color: white !important;
                font-size: 10px !important;
                font-weight: bold !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                opacity: 0.5 !important;
                margin-left: 4px !important;
            }

            .sidekick-add-page-btn:hover {
                opacity: 1 !important;
                transform: scale(1.2) !important;
                background: rgba(255, 255, 255, 0.4) !important;
                border: 1px solid rgba(255, 255, 255, 0.5) !important;
                box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2) !important;
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

        // === UI CREATION FUNCTIONS ===
        const UIManager = {
            init() {
                console.log('🎨 Initializing UI Manager...');
                
                // Create the complete sidebar structure
                this.createHamburgerButton();
                this.createSidebar();
                this.createAddButton();
                
                console.log('✅ UI Manager initialization complete!');
            },

            createHamburgerButton() {
                console.log("🍔 Creating hamburger button...");
                
                // Remove any existing hamburger button
                const existing = document.getElementById('sidekick-hamburger');
                if (existing) existing.remove();
                
                const hamburger = document.createElement('button');
                hamburger.id = 'sidekick-hamburger';
                hamburger.innerHTML = SidebarStateManager.isHidden() ? '☰' : '✕';
                hamburger.title = SidebarStateManager.isHidden() ? 'Show Sidebar' : 'Hide Sidebar';
                
                hamburger.addEventListener('click', () => {
                    SidebarStateManager.toggle();
                    console.log('🔧 Sidebar toggled');
                });
                
                document.body.appendChild(hamburger);
                console.log("✅ Hamburger button created and added to DOM");
                
                return hamburger;
            },

            createSidebar() {
                console.log("📋 Creating sidebar...");
                
                // Remove existing sidebar
                const existing = document.getElementById('sidekick-sidebar');
                if (existing) existing.remove();
                
                const sidebar = document.createElement('div');
                sidebar.id = 'sidekick-sidebar';
                
                // Create compact top bar with SVG logo
                const topBar = document.createElement('div');
                topBar.className = 'sidekick-topbar';
                topBar.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 4px 8px;">
                        <div style="display: flex; align-items: center; margin-left: 8px;">
                            <svg width="120" height="24" viewBox="0 0 600 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sidekick logo">
                              <defs>
                                <linearGradient id="grad" gradientTransform="rotate(135)">
                                  <stop offset="0%" stop-color="#66BB6A"/>
                                  <stop offset="100%" stop-color="#ffad5a"/>
                                </linearGradient>
                                <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="black" flood-opacity="0.6"/>
                                </filter>
                              </defs>
                              <text x="20" y="110" font-family="Impact, sans-serif" font-size="64" fill="url(#grad)" filter="url(#textShadow)">
                                Sidekick
                              </text>
                            </svg>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <div id="sidekick-clock" style="font-family: monospace; font-size: 11px; text-align: center; line-height: 1.1; cursor: pointer;" title="Click to toggle points pricing">
                                <div id="clock-time">--:--:--</div>
                                <div id="clock-date" style="font-size: 9px; color: #aaa;">-- ---</div>
                            </div>
                            <button id="settings-button" style="background: none; border: 1px solid #555; color: #ccc; padding: 3px 6px; border-radius: 3px; cursor: pointer; font-size: 10px;">⚙️</button>
                        </div>
                    </div>
                `;
                
                sidebar.appendChild(topBar);
                
                // Setup settings button handler
                setTimeout(() => {
                    const settingsButton = document.getElementById('settings-button');
                    if (settingsButton) {
                        settingsButton.addEventListener('click', () => {
                            if (window.SidekickModules?.Settings) {
                                window.SidekickModules.Settings.showSettingsDialog();
                            } else {
                                console.log('Settings module not available');
                            }
                        });
                    }
                }, 100);
                
                // Create content area - scrollable and takes up remaining space
                const contentArea = document.createElement('div');
                contentArea.id = 'sidekick-content';
                contentArea.style.cssText = `
                    padding: 16px;
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding-bottom: 60px;
                `;
                
                sidebar.appendChild(contentArea);
                
                // Add containers for different content types
                const containers = this.createContentContainers();
                containers.forEach(container => contentArea.appendChild(container));
                
                // Add page navigation at the bottom
                const pageNav = this.createPageNavigation();
                sidebar.appendChild(pageNav);
                
                document.body.appendChild(sidebar);
                
                // Apply current state
                SidebarStateManager.applyState();
                
                console.log("✅ Sidebar created successfully");
                return sidebar;
            },

            createAddButton() {
                console.log("➕ Creating add button...");
                
                // Remove existing add button
                const existing = document.getElementById('sidekick-add-btn');
                if (existing) existing.remove();
                
                const addBtn = document.createElement('button');
                addBtn.id = 'sidekick-add-btn';
                addBtn.innerHTML = '+';
                addBtn.title = 'Add new item';
                
                addBtn.addEventListener('click', () => {
                    if (window.SidekickModules?.Content?.showAddMenu) {
                        window.SidekickModules.Content.showAddMenu();
                    } else {
                        NotificationSystem.show('Info', 'Add menu will be available when content module loads', 'info');
                    }
                });
                
                document.body.appendChild(addBtn);
                
                // Apply current visibility state
                SidebarStateManager.applyState();
                
                console.log("✅ Add button created successfully");
                return addBtn;
            },

            createContentContainers() {
                const containers = [];
                
                // Notepads container
                const notepadContainer = document.createElement('div');
                notepadContainer.id = 'sidekick-notepads';
                containers.push(notepadContainer);
                
                // Todo lists container
                const todoContainer = document.createElement('div');
                todoContainer.id = 'sidekick-todos';
                containers.push(todoContainer);
                
                // Attack lists container
                const attackContainer = document.createElement('div');
                attackContainer.id = 'sidekick-attacks';
                containers.push(attackContainer);
                
                return containers;
            },

            createPageNavigation() {
                const nav = document.createElement('div');
                nav.className = 'sidekick-page-dots';
                
                // Create component controls (add button)
                const componentControls = document.createElement('div');
                componentControls.className = 'sidekick-component-controls';
                
                const addComponentBtn = document.createElement('button');
                addComponentBtn.innerHTML = '+';
                addComponentBtn.className = 'sidekick-add-component-btn';
                addComponentBtn.title = 'Add component (notepad, todo, etc.)';
                addComponentBtn.addEventListener('click', () => {
                    if (window.SidekickModules?.Content?.showAddMenu) {
                        window.SidekickModules.Content.showAddMenu();
                    }
                });
                
                componentControls.appendChild(addComponentBtn);
                
                // Create page navigation container
                const pageNavigation = document.createElement('div');
                pageNavigation.className = 'sidekick-page-navigation';
                
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                pages.forEach((page, index) => {
                    const dot = document.createElement('div');
                    dot.className = 'sidekick-page-dot';
                    if (index === currentPage) {
                        dot.classList.add('active');
                    }
                    dot.dataset.page = index;
                    dot.title = `Page ${index + 1}`;
                    
                    // Press and hold to delete page
                    let pressTimer = null;
                    dot.addEventListener('mousedown', (e) => {
                        if (pages.length > 1) {
                            pressTimer = setTimeout(() => {
                                if (confirm(`Delete page ${index + 1}?`)) {
                                    this.removePage(index);
                                }
                            }, 1000);
                        }
                    });
                    
                    ['mouseup', 'mouseleave'].forEach(event => {
                        dot.addEventListener(event, () => {
                            if (pressTimer) {
                                clearTimeout(pressTimer);
                                pressTimer = null;
                            }
                        });
                    });
                    
                    // Left-click to switch page
                    dot.addEventListener('click', () => {
                        if (window.SidekickModules?.Content?.switchToPage) {
                            window.SidekickModules.Content.switchToPage(index);
                        }
                    });
                    
                    pageNavigation.appendChild(dot);
                });
                
                // Add new page button
                const addPageBtn = document.createElement('button');
                addPageBtn.innerHTML = '+';
                addPageBtn.className = 'sidekick-add-page-btn';
                addPageBtn.title = 'Add new page';
                addPageBtn.addEventListener('click', () => {
                    if (window.SidekickModules?.Content?.addNewPage) {
                        window.SidekickModules.Content.addNewPage();
                    }
                });
                
                pageNavigation.appendChild(addPageBtn);
                
                // Assemble navigation
                nav.appendChild(componentControls);
                nav.appendChild(pageNavigation);
                
                return nav;
            },

            updatePageDots() {
                const pageNavigation = document.querySelector('.sidekick-page-navigation');
                if (!pageNavigation) return;

                // Clear existing dots (but keep add page button)
                const addPageBtn = pageNavigation.querySelector('.sidekick-add-page-btn');
                pageNavigation.innerHTML = '';

                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);

                // Recreate page dots
                pages.forEach((page, index) => {
                    const dot = document.createElement('div');
                    dot.className = 'sidekick-page-dot';
                    if (index === currentPage) {
                        dot.classList.add('active');
                    }
                    dot.dataset.page = index;
                    dot.title = `Page ${index + 1}`;
                    
                    // Press and hold to delete page
                    let pressTimer = null;
                    dot.addEventListener('mousedown', (e) => {
                        if (pages.length > 1) {
                            pressTimer = setTimeout(() => {
                                if (confirm(`Delete page ${index + 1}?`)) {
                                    this.removePage(index);
                                }
                            }, 1000);
                        }
                    });
                    
                    ['mouseup', 'mouseleave'].forEach(event => {
                        dot.addEventListener(event, () => {
                            if (pressTimer) {
                                clearTimeout(pressTimer);
                                pressTimer = null;
                            }
                        });
                    });
                    
                    // Left-click to switch page
                    dot.addEventListener('click', () => {
                        if (window.SidekickModules?.Content?.switchToPage) {
                            window.SidekickModules.Content.switchToPage(index);
                        }
                    });
                    
                    pageNavigation.appendChild(dot);
                });
                
                // Re-add the add page button
                if (addPageBtn) {
                    pageNavigation.appendChild(addPageBtn);
                }
            },

            removePage(pageIndex) {
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, []);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                // Don't allow removing the last page
                if (pages.length <= 1) {
                    NotificationSystem.show('Error', 'Cannot remove the last page', 'error');
                    return;
                }
                
                // Remove the page
                pages.splice(pageIndex, 1);
                
                // Adjust current page if necessary
                let newCurrentPage = currentPage;
                if (pageIndex <= currentPage) {
                    newCurrentPage = Math.max(0, currentPage - 1);
                }
                if (newCurrentPage >= pages.length) {
                    newCurrentPage = pages.length - 1;
                }
                
                // Save changes
                saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                saveState(STORAGE_KEYS.CURRENT_PAGE, newCurrentPage);
                
                // Update UI
                this.updatePageDots();
                if (window.SidekickModules?.Content?.switchToPage) {
                    window.SidekickModules.Content.switchToPage(newCurrentPage);
                }
                
                NotificationSystem.show('Success', `Page ${pageIndex + 1} removed`, 'info');
            },

            createPanelButton() {
                const panelCreationBtn = document.createElement('button');
                panelCreationBtn.id = 'sidekick-panel-btn';
                panelCreationBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                `;
                
                panelCreationBtn.style.cssText = `
                    position: absolute !important;
                    bottom: 15px !important;
                    left: 15px !important;
                    width: 50px !important;
                    height: 50px !important;
                    border-radius: 50% !important;
                    border: 2px solid rgba(255, 255, 255, 0.2) !important;
                    background: linear-gradient(145deg, rgba(45, 45, 45, 0.95), rgba(25, 25, 25, 0.95)) !important;
                    color: rgba(255, 255, 255, 0.8) !important;
                    cursor: pointer !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    z-index: 10 !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    backdrop-filter: blur(10px) !important;
                    box-shadow: 0 3px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
                    font-size: 0 !important;
                `;
                
                // Hover and interaction effects
                panelCreationBtn.addEventListener('mouseenter', () => {
                    panelCreationBtn.style.transform = 'scale(1.1)';
                    panelCreationBtn.style.boxShadow = '0 6px 25px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                });
                
                panelCreationBtn.addEventListener('mouseleave', () => {
                    panelCreationBtn.style.transform = 'scale(1)';
                    panelCreationBtn.style.boxShadow = '0 3px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                });
                
                panelCreationBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.SidekickModules?.Content?.showAddMenu) {
                        window.SidekickModules.Content.showAddMenu();
                    }
                });
                
                return panelCreationBtn;
            },

            removePage(pageIndex) {
                const pages = loadState(STORAGE_KEYS.SIDEBAR_PAGES, []);
                const currentPage = loadState(STORAGE_KEYS.CURRENT_PAGE, 0);
                
                // Don't allow removing the last page
                if (pages.length <= 1) {
                    NotificationSystem.show('Error', 'Cannot remove the last page', 'error');
                    return;
                }
                
                // Remove the page
                pages.splice(pageIndex, 1);
                
                // Adjust current page if necessary
                let newCurrentPage = currentPage;
                if (pageIndex <= currentPage) {
                    newCurrentPage = Math.max(0, currentPage - 1);
                }
                if (newCurrentPage >= pages.length) {
                    newCurrentPage = pages.length - 1;
                }
                
                // Save changes
                saveState(STORAGE_KEYS.SIDEBAR_PAGES, pages);
                saveState(STORAGE_KEYS.CURRENT_PAGE, newCurrentPage);
                
                // Refresh the sidebar
                if (window.SidekickModules?.Content?.refreshSidebarContent) {
                    window.SidekickModules.Content.refreshSidebarContent();
                }
                
                NotificationSystem.show('Success', `Page ${pageIndex + 1} removed`, 'info');
            }
        };

        // Export to global scope
        window.SidekickModules.UI = UIManager;

        console.log('✅ UI module loaded');
    });

})();
