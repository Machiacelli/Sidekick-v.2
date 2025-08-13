// ==UserScript==
// @name         Sidekick Notepad Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Notepad functionality for Sidekick sidebar
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
        const { NotificationSystem } = window.SidekickModules.Core;

        const NotepadModule = {
            notepads: [],
            currentPage: 0,

            init() {
                console.log('📝 Initializing Notepad Module v3.6.0...');
                this.core = window.SidekickModules.Core;
                if (!this.core) {
                    console.error('❌ Core module not available for Notepad');
                    return;
                }
                this.loadNotepads();
                this.refreshDisplay(); // Render any existing notepads
                console.log('📝 Notepad module initialized, loaded', this.notepads.length, 'notepads');
            },

            loadNotepads() {
                console.log('📝 Loading notepads...');
                const pages = this.core.loadState(this.core.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                console.log('📝 Loaded pages from storage:', pages);
                this.currentPage = this.core.loadState(this.core.STORAGE_KEYS.CURRENT_PAGE, 0);
                console.log('📝 Current page index:', this.currentPage);

                if (pages[this.currentPage]) {
                    this.notepads = pages[this.currentPage].notepads || [];
                    console.log('📝 Loaded notepads for current page:', this.notepads);
                } else {
                    console.log('📝 No data for current page, initializing empty');
                    this.notepads = [];
                }
            },

            refreshDisplay() {
                // Clear current notepad display
                const container = document.getElementById('sidekick-notepads');
                if (container) {
                    container.innerHTML = '';
                }

                // Re-render all notepads for current page
                this.notepads.forEach(notepad => {
                    this.renderNotepad(notepad);
                });
            },            saveNotepads() {
                console.log('📝 Saving notepads...', this.notepads);
                const pages = this.core.loadState(this.core.STORAGE_KEYS.SIDEBAR_PAGES, [{ notepads: [], todoLists: [], attackLists: [] }]);
                
                // Ensure current page exists
                while (pages.length <= this.currentPage) {
                    pages.push({ notepads: [], todoLists: [], attackLists: [] });
                }
                
                pages[this.currentPage].notepads = this.notepads;
                this.core.saveState(this.core.STORAGE_KEYS.SIDEBAR_PAGES, pages);
                console.log('📝 Notepads saved to storage, total pages:', pages.length);
            },

            addNotepad(title = 'New Note') {
                console.log('📝 Adding new notepad:', title);
                const notepad = {
                    id: Date.now() + Math.random(),
                    title: title,
                    content: '',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };

                this.notepads.push(notepad);
                this.saveNotepads();
                
                // Use refreshDisplay instead of renderNotepad to avoid duplicates
                this.refreshDisplay();
                
                NotificationSystem.show('Notepad', 'New notepad created', 'info', 2000);
                console.log('📝 Notepad added successfully, total notepads:', this.notepads.length);
                return notepad;
            },

            deleteNotepad(id) {
                const notepad = this.notepads.find(n => n.id === id);
                if (notepad && confirm(`Delete notepad "${notepad.title}"?`)) {
                    // Use the standard removeSidebarItem function like attack lists do
                    if (window.removeSidebarItem) {
                        window.removeSidebarItem(id, 'notepad');
                        // Reload notepads to sync with updated storage
                        this.loadNotepads();
                        this.refreshDisplay();
                        NotificationSystem.show('Notepad', 'Notepad deleted', 'info', 2000);
                    } else {
                        console.error('removeSidebarItem function not available');
                    }
                }
            },

            updateNotepad(id, title, content) {
                const notepad = this.notepads.find(n => n.id === id);
                if (notepad) {
                    notepad.title = title;
                    notepad.content = content;
                    notepad.modified = new Date().toISOString();
                    this.saveNotepads();
                }
            },

            renderNotepad(notepad) {
                const contentArea = document.getElementById('sidekick-content');
                if (!contentArea) return;

                // Remove placeholder if it exists
                const placeholder = contentArea.querySelector('.sidekick-placeholder');
                if (placeholder) {
                    placeholder.remove();
                }

                // Create movable notepad window with unified design
                const notepadElement = document.createElement('div');
                notepadElement.id = `notepad-${notepad.id}`;
                notepadElement.className = 'sidebar-item movable-notepad';
                notepadElement.dataset.id = notepad.id;
                
                // Load saved position and size from localStorage
                const savedNotepad = JSON.parse(localStorage.getItem(`notepad_${notepad.id}_layout`) || '{}');
                const defaultWidth = 280;
                const defaultHeight = 150;
                const defaultX = 10;
                const defaultY = 10;
                
                notepadElement.style.cssText = `
                    position: absolute;
                    left: ${savedNotepad.x || defaultX}px;
                    top: ${savedNotepad.y || defaultY}px;
                    width: ${savedNotepad.width || defaultWidth}px;
                    height: ${savedNotepad.height || defaultHeight}px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    min-width: 200px;
                    min-height: 100px;
                    z-index: 1000;
                    resize: ${savedNotepad.pinned ? 'none' : 'both'};
                    overflow: hidden;
                `;
                
                notepadElement.innerHTML = `
                    <div class="notepad-header" style="
                        background: #333;
                        border-bottom: 1px solid #555;
                        padding: 4px 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: ${savedNotepad.pinned ? 'default' : 'move'};
                        height: 24px;
                        flex-shrink: 0;
                        border-radius: 7px 7px 0 0;
                    ">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div class="pin-dropdown" style="position: relative; display: inline-block;">
                                <button class="dropdown-btn" style="
                                    background: none;
                                    border: none;
                                    color: #bbb;
                                    cursor: pointer;
                                    font-size: 12px;
                                    padding: 2px;
                                    display: flex;
                                    align-items: center;
                                " title="Options">
                                    ▼
                                </button>
                                <div class="dropdown-content" style="
                                    display: none;
                                    position: absolute;
                                    background: #333;
                                    min-width: 120px;
                                    box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                                    z-index: 1001;
                                    border-radius: 4px;
                                    border: 1px solid #555;
                                    top: 100%;
                                    left: 0;
                                ">
                                    <button class="pin-btn" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        ${savedNotepad.pinned ? '📌 Unpin' : '📌 Pin'}
                                    </button>
                                    <button class="color-btn" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        🎨 Change Color
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button class="close-btn" style="
                            background: none;
                            border: none;
                            color: #f44336;
                            cursor: pointer;
                            font-size: 14px;
                            padding: 0;
                            width: 16px;
                            height: 16px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            opacity: 0.7;
                        " title="Delete notepad">×</button>
                    </div>
                    <textarea placeholder="Write your notes here..." data-notepad-id="${notepad.id}" style="
                        flex: 1;
                        background: transparent;
                        border: none;
                        color: #fff;
                        padding: 12px;
                        font-size: 13px;
                        font-family: inherit;
                        resize: none;
                        outline: none;
                        line-height: 1.4;
                        width: 100%;
                        box-sizing: border-box;
                    ">${notepad.content}</textarea>
                `;

                // Add enhanced functionality with movable controls
                this.setupNotepadHandlers(notepadElement, notepad, savedNotepad);

                contentArea.appendChild(notepadElement);
            },

            setupNotepadHandlers(notepadElement, notepad, savedNotepad = {}) {
                const contentTextarea = notepadElement.querySelector('textarea');
                const header = notepadElement.querySelector('.notepad-header');
                const closeBtn = notepadElement.querySelector('.close-btn');
                const dropdownBtn = notepadElement.querySelector('.dropdown-btn');
                const dropdownContent = notepadElement.querySelector('.dropdown-content');
                const pinBtn = notepadElement.querySelector('.pin-btn');
                const colorBtn = notepadElement.querySelector('.color-btn');
                
                let isPinned = savedNotepad.pinned || false;
                
                // Save position and size function
                function saveLayout() {
                    const layout = {
                        x: notepadElement.offsetLeft,
                        y: notepadElement.offsetTop,
                        width: notepadElement.offsetWidth,
                        height: notepadElement.offsetHeight,
                        pinned: isPinned
                    };
                    localStorage.setItem(`notepad_${notepad.id}_layout`, JSON.stringify(layout));
                }
                
                // Add enhanced styling and functionality
                if (contentTextarea) {
                    // Auto-save content on input
                    contentTextarea.addEventListener('input', () => {
                        this.updateNotepad(notepad.id, notepad.title, contentTextarea.value);
                    });
                    
                    // Enhanced focus and blur effects on entire notepad
                    contentTextarea.addEventListener('focus', () => {
                        notepadElement.style.borderColor = '#66BB6A';
                        notepadElement.style.boxShadow = '0 0 0 2px rgba(102, 187, 106, 0.2)';
                    });
                    
                    contentTextarea.addEventListener('blur', () => {
                        notepadElement.style.borderColor = '#444';
                        notepadElement.style.boxShadow = 'none';
                    });
                }
                
                // Close button functionality
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm('Delete this notepad?')) {
                            localStorage.removeItem(`notepad_${notepad.id}_layout`);
                            this.deleteNotepad(notepad.id);
                        }
                    });
                }
                
                // Dropdown functionality
                if (dropdownBtn && dropdownContent) {
                    dropdownBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
                    });
                    
                    // Close dropdown when clicking outside
                    document.addEventListener('click', () => {
                        dropdownContent.style.display = 'none';
                    });
                }
                
                // Pin functionality
                if (pinBtn) {
                    pinBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        isPinned = !isPinned;
                        pinBtn.textContent = isPinned ? '📌 Unpin' : '📌 Pin';
                        notepadElement.style.resize = isPinned ? 'none' : 'both';
                        header.style.cursor = isPinned ? 'default' : 'move';
                        saveLayout();
                        dropdownContent.style.display = 'none';
                    });
                }
                
                // Color functionality
                if (colorBtn) {
                    colorBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownContent.style.display = 'none';
                        this.showColorPicker(notepadElement, notepad);
                    });
                }
                
                // Dragging functionality (only if not pinned)
                if (header) {
                    let isDragging = false;
                    let dragOffset = { x: 0, y: 0 };
                    
                    header.addEventListener('mousedown', (e) => {
                        if (isPinned) return;
                        isDragging = true;
                        const rect = notepadElement.getBoundingClientRect();
                        dragOffset.x = e.clientX - rect.left;
                        dragOffset.y = e.clientY - rect.top;
                        e.preventDefault();
                    });
                    
                    document.addEventListener('mousemove', (e) => {
                        if (!isDragging || isPinned) return;
                        
                        const sidebar = document.getElementById('sidekick-sidebar');
                        const sidebarRect = sidebar.getBoundingClientRect();
                        
                        let newX = e.clientX - sidebarRect.left - dragOffset.x;
                        let newY = e.clientY - sidebarRect.top - dragOffset.y;
                        
                        // Keep within sidebar bounds
                        newX = Math.max(0, Math.min(newX, sidebar.offsetWidth - notepadElement.offsetWidth));
                        newY = Math.max(0, Math.min(newY, sidebar.offsetHeight - notepadElement.offsetHeight));
                        
                        notepadElement.style.left = newX + 'px';
                        notepadElement.style.top = newY + 'px';
                    });
                    
                    document.addEventListener('mouseup', () => {
                        if (isDragging) {
                            isDragging = false;
                            saveLayout();
                        }
                    });
                }
                
                // Resize observer to save size changes
                if (window.ResizeObserver) {
                    const resizeObserver = new ResizeObserver(() => {
                        if (!isPinned) {
                            saveLayout();
                        }
                    });
                    resizeObserver.observe(notepadElement);
                }
            },

            deleteNotepad(id) {
                const index = this.notepads.findIndex(n => n.id === id);
                if (index > -1) {
                    if (confirm('Delete this notepad?')) {
                        this.notepads.splice(index, 1);
                        this.saveNotepads();
                        
                        // Remove from DOM
                        const element = document.getElementById(`notepad-${id}`);
                        if (element) {
                            element.remove();
                        }
                        
                        // Show placeholder if no notepads left
                        this.checkAndShowPlaceholder();
                        
                        NotificationSystem.show('Notepad', 'Notepad deleted!', 'info', 1500);
                    }
                }
            },

            checkAndShowPlaceholder() {
                const contentArea = document.getElementById('sidekick-content');
                if (contentArea && !contentArea.querySelector('.enhanced-notepad')) {
                    contentArea.innerHTML = `
                        <div class="sidekick-placeholder" style="text-align: center; padding: 40px 20px; color: #aaa;">
                            <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                            <h3 style="margin: 0 0 8px 0; color: #fff; text-align: center;">No Notes Yet</h3>
                            <p style="margin: 0; font-size: 14px; text-align: center;">Click the + button to add your first notepad</p>
                        </div>
                    `;
                }
            },

            renderAllNotepads() {
                const contentArea = document.getElementById('sidekick-content');
                if (!contentArea) return;

                // Clear existing content
                contentArea.innerHTML = '';

                if (this.notepads.length === 0) {
                    this.checkAndShowPlaceholder();
                } else {
                    // Render all notepads
                    this.notepads.forEach(notepad => {
                        this.renderNotepad(notepad);
                    });
                }
            },

            showColorPicker(notepadElement, notepad) {
                // Remove any existing color picker
                const existingPicker = document.querySelector('.color-picker');
                if (existingPicker) existingPicker.remove();
                
                // Create color picker overlay
                const colorPicker = document.createElement('div');
                colorPicker.className = 'color-picker';
                colorPicker.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 8px;
                    padding: 16px;
                    z-index: 999999;
                    display: grid;
                    grid-template-columns: repeat(4, 30px);
                    gap: 8px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                `;
                
                const colors = ['#333', '#4CAF50', '#2196F3', '#FF9800', '#f44336', '#9C27B0', '#607D8B', '#795548'];
                
                colors.forEach(color => {
                    const colorBtn = document.createElement('div');
                    colorBtn.style.cssText = `
                        width: 30px;
                        height: 30px;
                        background: ${color};
                        border: 2px solid ${notepad.color === color ? '#fff' : '#666'};
                        border-radius: 4px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                    `;
                    
                    colorBtn.addEventListener('click', () => {
                        // Update notepad color
                        notepad.color = color;
                        notepadElement.querySelector('.notepad-header').style.background = color;
                        
                        // Save notepads
                        this.saveNotepads();
                        
                        // Remove color picker
                        colorPicker.remove();
                        
                        console.log(`🎨 Notepad color changed to ${color}`);
                    });
                    
                    colorBtn.addEventListener('mouseenter', () => {
                        colorBtn.style.transform = 'scale(1.1)';
                    });
                    
                    colorBtn.addEventListener('mouseleave', () => {
                        colorBtn.style.transform = 'scale(1)';
                    });
                    
                    colorPicker.appendChild(colorBtn);
                });
                
                document.body.appendChild(colorPicker);
                
                // Close when clicking outside
                setTimeout(() => {
                    document.addEventListener('click', function closeColorPicker(e) {
                        if (!colorPicker.contains(e.target)) {
                            colorPicker.remove();
                            document.removeEventListener('click', closeColorPicker);
                        }
                    });
                }, 100);
            },

            switchToPage(pageIndex) {
                this.currentPage = pageIndex;
                this.loadNotepads();
                this.renderAllNotepads();
            }
        };

        // Export to global scope
        window.SidekickModules = window.SidekickModules || {};
        window.SidekickModules.Notepad = NotepadModule;

        // Auto-initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => NotepadModule.init(), 500);
            });
        } else {
            setTimeout(() => NotepadModule.init(), 500);
        }

        console.log('✅ Notepad module loaded');
    });

})();
