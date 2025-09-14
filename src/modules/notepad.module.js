// ==UserScript==
// @name         Sidekick Notepad Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Notepad functionality for Sidekick sidebar
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
                // Load notepads globally, not page-specific
                const allNotepads = this.core.loadState(this.core.STORAGE_KEYS.NOTEPADS, []);
                console.log('📝 Loaded global notepads from storage:', allNotepads);
                
                // Clamp any loaded layouts to sidebar bounds to avoid broken positions/sizes
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarWidth = sidebar ? Math.max(200, sidebar.clientWidth) : 500;
                const sidebarHeight = sidebar ? Math.max(200, sidebar.clientHeight) : 600;

                this.notepads = (allNotepads || []).map(n => {
                    const desiredWidth = n.width || 280;
                    const desiredHeight = n.height || 150;
                    const maxWidth = Math.max(150, sidebarWidth - 16);
                    const maxHeight = Math.max(100, sidebarHeight - 80);
                    const width = Math.min(desiredWidth, maxWidth);
                    const height = Math.min(desiredHeight, maxHeight);

                    const desiredX = (n.x !== undefined) ? n.x : 10;
                    const desiredY = (n.y !== undefined) ? n.y : 10;
                    const maxX = Math.max(0, sidebarWidth - width - 8);
                    const maxY = Math.max(0, sidebarHeight - height - 8);
                    const x = Math.min(Math.max(0, desiredX), maxX);
                    const y = Math.min(Math.max(0, desiredY), maxY);

                    return Object.assign({}, n, { x, y, width, height });
                });
                console.log('📝 Set notepads globally:', this.notepads);
            },

            refreshDisplay() {
                console.log('📝 Refreshing notepad display...');
                // Clear current notepad display completely - use content area consistently
                const container = document.getElementById('sidekick-content');
                if (container) {
                    // Only clear notepad elements, not all content
                    const notepads = container.querySelectorAll('.movable-notepad');
                    notepads.forEach(notepad => notepad.remove());
                    console.log('📝 Cleared existing notepad elements');
                }

                // Re-render all notepads for current page
                if (this.notepads && this.notepads.length > 0) {
                    console.log(`📝 Rendering ${this.notepads.length} notepads...`);
                    this.notepads.forEach((notepad, index) => {
                        console.log(`📝 Rendering notepad ${index + 1}:`, notepad.title, notepad.id);
                        this.renderNotepad(notepad);
                    });
                } else {
                    console.log('📝 No notepads to render');
                }
            },            saveNotepads() {
                console.log('📝 Saving notepads globally...', this.notepads);
                // Save notepads globally, not page-specific
                this.core.saveState(this.core.STORAGE_KEYS.NOTEPADS, this.notepads);
                console.log('📝 Notepads saved to global storage');
            },

            addNotepad(title = 'New Note') {
                console.log('📝 Adding new notepad:', title);
                const notepad = {
                    id: Date.now() + Math.random(),
                    title: title,
                    content: '',
                    color: '#4CAF50', // Default color
                    x: 10 + (this.notepads.length * 20), // Offset new notepads so they don't overlap
                    y: 10 + (this.notepads.length * 20),
                    width: 280,
                    height: 150,
                    pinned: false,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };

                this.notepads.push(notepad);
                this.saveNotepads();
                
                // Use refreshDisplay instead of renderNotepad to avoid duplicates
                this.refreshDisplay();
                
                if (this.core && this.core.NotificationSystem) {
                    this.core.NotificationSystem.show('Notepad', 'New notepad created', 'info', 2000);
                }
                console.log('📝 Notepad added successfully, total notepads:', this.notepads.length);
                return notepad;
            },

            deleteNotepad(id) {
                const notepad = this.notepads.find(n => n.id === id);
                if (notepad && confirm(`Delete notepad "${notepad.title}"?`)) {
                    console.log('📝 Deleting notepad:', id, notepad.title);
                    // Remove from local array first
                    this.notepads = this.notepads.filter(n => n.id !== id);
                    // Remove only the deleted notepad from DOM
                    const element = document.querySelector(`[data-id="${id}"]`);
                    if (element) {
                        element.remove();
                        console.log('📝 Removed notepad element from DOM');
                    }
                    // Clear layout storage
                    localStorage.removeItem(`notepad_${id}_layout`);
                    console.log('📝 Cleared notepad layout storage');
                    // Save updated array to storage
                    this.saveNotepads();
                    // If no notepads left, show placeholder
                    if (this.notepads.length === 0) {
                        this.checkAndShowPlaceholder();
                    }
                    if (this.core && this.core.NotificationSystem) {
                        this.core.NotificationSystem.show('Notepad', 'Notepad deleted', 'success', 2000);
                    }
                    console.log('📝 Notepad deleted successfully, remaining notepads:', this.notepads.length);
                }
            },

            updateNotepad(id, title, content) {
                const notepad = this.notepads.find(n => n.id === id);
                if (notepad) {
                    notepad.title = title;
                    notepad.content = content;
                    notepad.modified = new Date().toISOString();
                    this.saveNotepads();
                    console.log('📝 Updated notepad content:', id, content.substring(0, 50));
                }
            },

            // Update position, size, color, and pinned state
            updateNotepadLayout(id, layout) {
                const notepad = this.notepads.find(n => n.id === id);
                if (notepad) {
                        const sidebar = document.getElementById('sidekick-sidebar');
                        const sidebarWidth = sidebar ? Math.max(200, sidebar.clientWidth) : 500;
                        const sidebarHeight = sidebar ? Math.max(200, sidebar.clientHeight) : 600;
                        const minWidth = 150, minHeight = 100;
                        const maxWidth = Math.max(minWidth, sidebarWidth - 16);
                        const maxHeight = Math.max(minHeight, sidebarHeight - 80);
                        if (layout.x !== undefined) notepad.x = Math.min(Math.max(0, layout.x), Math.max(0, sidebarWidth - (notepad.width || minWidth) - 8));
                        if (layout.y !== undefined) notepad.y = Math.min(Math.max(0, layout.y), Math.max(0, sidebarHeight - (notepad.height || minHeight) - 8));
                        if (layout.width !== undefined) notepad.width = Math.max(minWidth, Math.min(layout.width, maxWidth));
                        if (layout.height !== undefined) notepad.height = Math.max(minHeight, Math.min(layout.height, maxHeight));
                        if (layout.pinned !== undefined) notepad.pinned = layout.pinned;
                        if (layout.color !== undefined) notepad.color = layout.color;
                        notepad.modified = new Date().toISOString();
                        this.saveNotepads();
                        console.log('📝 Updated notepad layout:', id, layout);
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
                
                // Clamp stored values against the current sidebar size to avoid huge/offset notes
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarWidth = sidebar ? Math.max(200, sidebar.clientWidth) : 500;
                const sidebarHeight = sidebar ? Math.max(200, sidebar.clientHeight) : 600;

                const minWidth = 150, minHeight = 100;
                const maxWidth = Math.max(minWidth, sidebarWidth - 16); // leave some padding
                const maxHeight = Math.max(minHeight, sidebarHeight - 80);

                // Clamp width/height strictly
                const desiredWidth = Math.max(minWidth, Math.min(notepad.width || 280, maxWidth));
                const desiredHeight = Math.max(minHeight, Math.min(notepad.height || 150, maxHeight));

                const desiredX = (notepad.x !== undefined) ? notepad.x : 10;
                const desiredY = (notepad.y !== undefined) ? notepad.y : 10;
                const maxX = Math.max(0, sidebarWidth - desiredWidth - 8);
                const maxY = Math.max(0, sidebarHeight - desiredHeight - 8);

                const finalX = Math.min(Math.max(0, desiredX), maxX);
                const finalY = Math.min(Math.max(0, desiredY), maxY);

                // Update the notepad object with clamped values so persistence won't reapply bad sizes
                notepad.x = finalX;
                notepad.y = finalY;
                notepad.width = desiredWidth;
                notepad.height = desiredHeight;

                notepadElement.style.cssText = `
                    position: absolute;
                    left: ${finalX}px;
                    top: ${finalY}px;
                    width: ${desiredWidth}px;
                    height: ${desiredHeight}px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    display: flex;
                    flex-direction: column;
                    min-width: ${minWidth}px;
                    min-height: ${minHeight}px;
                    max-width: ${maxWidth}px;
                    max-height: ${maxHeight}px;
                    z-index: 1000;
                    resize: ${notepad.pinned ? 'none' : 'both'};
                    overflow: hidden;
                `;
                
                notepadElement.innerHTML = `
                    <div class="notepad-header" style="
                        background: ${notepad.color || '#4CAF50'};
                        border-bottom: 1px solid #555;
                        padding: 4px 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: ${notepad.pinned ? 'default' : 'move'};
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
                                        ${notepad.pinned ? '📌 Unpin' : '📌 Pin'}
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
                this.setupNotepadHandlers(notepadElement, notepad);

                contentArea.appendChild(notepadElement);
            },

            setupNotepadHandlers(notepadElement, notepad) {
                const contentTextarea = notepadElement.querySelector('textarea');
                const header = notepadElement.querySelector('.notepad-header');
                const closeBtn = notepadElement.querySelector('.close-btn');
                const dropdownBtn = notepadElement.querySelector('.dropdown-btn');
                const dropdownContent = notepadElement.querySelector('.dropdown-content');
                const pinBtn = notepadElement.querySelector('.pin-btn');
                const colorBtn = notepadElement.querySelector('.color-btn');
                
                // Use global notepad pinned state
                let isPinned = notepad.pinned || false;
                
                // Enhanced save layout - prevents drift and unwanted resizing
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
                
                // Prevent accidental saves during programmatic changes
                let isProgrammaticChange = false;
                const preventAccidentalSave = () => {
                    if (!isProgrammaticChange) {
                        isProgrammaticChange = true;
                        setTimeout(() => {
                            isProgrammaticChange = false;
                        }, 100);
                    }
                };
                
                // Close button functionality
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteNotepad(notepad.id);
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
                        
                        // Prevent accidental save during programmatic changes
                        preventAccidentalSave();
                        
                        notepadElement.style.resize = isPinned ? 'none' : 'both';
                        header.style.cursor = isPinned ? 'default' : 'move';
                        saveLayout.call(this);
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
            },

            checkAndShowPlaceholder() {
                const contentArea = document.getElementById('sidekick-content');
                if (contentArea && !contentArea.querySelector('.enhanced-notepad')) {
                    contentArea.innerHTML = `
                        <div class="sidekick-placeholder" style="text-align: center; padding: 40px 20px; color: #aaa;">
                            <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
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
                
                                const colors = [
                                    '#333', '#4CAF50', '#2196F3', '#FF9800', '#f44336', '#9C27B0', '#607D8B', '#795548',
                                    '#E91E63', // Pink
                                    '#00BCD4', // Cyan
                                    '#8BC34A', // Light Green
                                    '#FFC107', // Amber
                                    '#FFEB3B', // Yellow
                                    '#BDBDBD', // Grey
                                    '#FFFFFF', // White
                                    '#000000'  // Black
                                ];
                
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
