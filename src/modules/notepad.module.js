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
        const { saveState, loadState, NotificationSystem } = window.SidekickModules.Core;

        const NotepadModule = {
            notepads: [],
            currentPage: 0,

            init() {
                console.log('📝 Initializing Notepad Module...');
                this.loadNotepads();
            },

            loadNotepads() {
                const pages = loadState('sidekick_sidebar_pages', [{ notepads: [], todoLists: [], attackLists: [] }]);
                this.currentPage = loadState('sidekick_current_page', 0);
                
                if (pages[this.currentPage]) {
                    this.notepads = pages[this.currentPage].notepads || [];
                }
            },

            saveNotepads() {
                const pages = loadState('sidekick_sidebar_pages', [{ notepads: [], todoLists: [], attackLists: [] }]);
                
                // Ensure current page exists
                while (pages.length <= this.currentPage) {
                    pages.push({ notepads: [], todoLists: [], attackLists: [] });
                }
                
                pages[this.currentPage].notepads = this.notepads;
                saveState('sidekick_sidebar_pages', pages);
            },

            addNotepad(title = 'New Note') {
                const notepad = {
                    id: Date.now() + Math.random(),
                    title: title,
                    content: '',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };

                this.notepads.push(notepad);
                this.saveNotepads();
                this.renderNotepad(notepad);
                
                NotificationSystem.show('Notepad', 'New notepad created', 'info', 2000);
                return notepad;
            },

            deleteNotepad(id) {
                const index = this.notepads.findIndex(n => n.id === id);
                if (index > -1) {
                    const notepad = this.notepads[index];
                    if (confirm(`Delete notepad "${notepad.title}"?`)) {
                        this.notepads.splice(index, 1);
                        this.saveNotepads();
                        
                        // Remove from DOM
                        const element = document.getElementById(`notepad-${id}`);
                        if (element) {
                            element.remove();
                        }
                        
                        NotificationSystem.show('Notepad', 'Notepad deleted', 'info', 2000);
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

                // Create notepad element with enhanced design
                const notepadElement = document.createElement('div');
                notepadElement.id = `notepad-${notepad.id}`;
                notepadElement.className = 'sidebar-item enhanced-notepad';
                notepadElement.style.cssText = `
                    background: #2a2a2a !important;
                    border: 1px solid #444 !important;
                    border-radius: 8px !important;
                    padding: 0px !important;
                    margin-bottom: 12px !important;
                    transition: background 0.2s ease, border-color 0.2s ease !important;
                    resize: both !important;
                    overflow: hidden !important;
                    min-width: 200px !important;
                    min-height: 60px !important;
                    max-width: calc(100% - 8px) !important;
                    width: 280px !important;
                    height: 90px !important;
                    position: relative !important;
                `;

                notepadElement.innerHTML = `
                    <div class="notepad-header" style="position: absolute; top: 0; left: 0; right: 0; height: 20px; background: rgba(42, 42, 42, 0.8); cursor: move; z-index: 10; display: flex; justify-content: flex-end; align-items: center; padding: 2px 4px;">
                        <div style="display: flex; align-items: center; gap: 4px;">
                            <div class="notepad-dropdown" style="position: relative;">
                                <button class="dropdown-toggle" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 10px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease;"
                                        title="Options">▼</button>
                                <div class="dropdown-menu" style="position: absolute; top: 16px; right: 0; background: #333; border: 1px solid #555; border-radius: 4px; min-width: 80px; display: none; z-index: 20; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                                    <button class="pin-notepad-btn" style="width: 100%; background: none; border: none; color: #fff; padding: 6px 8px; text-align: left; cursor: pointer; font-size: 11px; transition: background 0.2s ease;"
                                            title="Pin window position and size">📌 Pin</button>
                                </div>
                            </div>
                            <button class="delete-notepad-btn" data-notepad-id="${notepad.id}"
                                    style="background: none; border: none; color: rgba(128, 128, 128, 0.7); cursor: pointer; font-size: 11px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease; font-weight: bold;"
                                    title="Delete notepad">×</button>
                        </div>
                    </div>
                    <textarea placeholder="Write your notes here..."
                              style="width: 100%; height: 100%; background: transparent; border: none; color: #fff; padding: 20px 8px 8px 8px; border-radius: 8px; font-size: 13px; resize: none; font-family: inherit; box-sizing: border-box; outline: none; margin: 0;">${notepad.content}</textarea>
                `;

                // Add enhanced functionality
                this.setupNotepadHandlers(notepadElement, notepad);

                contentArea.appendChild(notepadElement);
            },

            setupNotepadHandlers(notepadElement, notepad) {
                const contentTextarea = notepadElement.querySelector('textarea');
                const deleteBtn = notepadElement.querySelector('.delete-notepad-btn');
                const dropdownToggle = notepadElement.querySelector('.dropdown-toggle');
                const dropdownMenu = notepadElement.querySelector('.dropdown-menu');
                const pinBtn = notepadElement.querySelector('.pin-notepad-btn');
                const notepadHeader = notepadElement.querySelector('.notepad-header');
                
                // Dropdown menu functionality
                dropdownToggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
                });
                
                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!notepadElement.contains(e.target)) {
                        dropdownMenu.style.display = 'none';
                    }
                });
                
                // Pin functionality
                let isPinned = notepad.pinned || false;
                pinBtn.innerHTML = isPinned ? '📍 Unpin' : '📌 Pin';
                pinBtn.addEventListener('click', () => {
                    isPinned = !isPinned;
                    pinBtn.innerHTML = isPinned ? '📍 Unpin' : '📌 Pin';
                    pinBtn.title = isPinned ? 'Unpin window' : 'Pin window position and size';
                    dropdownMenu.style.display = 'none';
                    
                    // Save pinned state
                    notepad.pinned = isPinned;
                    notepad.pinnedPosition = isPinned ? {
                        left: notepadElement.style.left,
                        top: notepadElement.style.top,
                        width: notepadElement.style.width,
                        height: notepadElement.style.height
                    } : null;
                    this.saveNotepads();
                });
                
                // Dragging functionality
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };
                
                notepadHeader.addEventListener('mousedown', (e) => {
                    if (isPinned) return;
                    isDragging = true;
                    const rect = notepadElement.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    notepadElement.style.zIndex = '1000';
                    e.preventDefault();
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging || isPinned) return;
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar.getBoundingClientRect();
                    
                    let newLeft = e.clientX - sidebarRect.left - dragOffset.x;
                    let newTop = e.clientY - sidebarRect.top - dragOffset.y;
                    
                    // Constrain to sidebar bounds with smaller padding
                    const padding = 8;
                    newLeft = Math.max(padding, Math.min(newLeft, sidebarRect.width - notepadElement.offsetWidth - padding));
                    newTop = Math.max(padding, Math.min(newTop, sidebarRect.height - notepadElement.offsetHeight - padding));
                    
                    notepadElement.style.left = `${newLeft}px`;
                    notepadElement.style.top = `${newTop}px`;
                    notepadElement.style.position = 'absolute';
                });
                
                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        notepadElement.style.zIndex = '';
                    }
                });

                // Content change handler
                contentTextarea.addEventListener('input', () => {
                    notepad.content = contentTextarea.value;
                    notepad.modified = new Date().toISOString();
                    this.saveNotepads();
                });

                // Delete button functionality
                deleteBtn.addEventListener('click', () => {
                    this.deleteNotepad(notepad.id);
                });

                // Add resize constraints
                const resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        const element = entry.target;
                        const rect = element.getBoundingClientRect();
                        const sidebar = document.getElementById('sidekick-sidebar');
                        const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
                        
                        // Constraint: don't exceed sidebar width with smaller padding
                        if (sidebarRect && rect.width > sidebarRect.width - 8) {
                            element.style.width = `${sidebarRect.width - 8}px`;
                        }
                        
                        // Constraint: minimum size based on content
                        const textLength = contentTextarea.value.length;
                        const minHeight = Math.max(60, Math.min(180, textLength / 5 + 50));
                        if (rect.height < minHeight) {
                            element.style.height = `${minHeight}px`;
                        }
                    }
                });
                
                resizeObserver.observe(notepadElement);

                // Add hover effects
                notepadElement.addEventListener('mouseenter', () => {
                    notepadElement.style.background = '#333 !important';
                    notepadElement.style.borderColor = '#555 !important';
                });

                notepadElement.addEventListener('mouseleave', () => {
                    notepadElement.style.background = '#2a2a2a !important';
                    notepadElement.style.borderColor = '#444 !important';
                });
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
