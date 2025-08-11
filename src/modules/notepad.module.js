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
                    background: transparent !important;
                    border: none !important;
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
                    <textarea placeholder="Write your notes here..." data-notepad-id="${notepad.id}"
                              style="width: 100%; height: 100%; background: #2a2a2a; border: 1px solid #444; color: #fff; padding: 8px; border-radius: 8px; font-size: 13px; resize: both; font-family: inherit; box-sizing: border-box; outline: none; margin: 0;">${notepad.content}</textarea>
                `;

                // Add enhanced functionality
                this.setupNotepadHandlers(notepadElement, notepad);

                contentArea.appendChild(notepadElement);
            },

            setupNotepadHandlers(notepadElement, notepad) {
                const contentTextarea = notepadElement.querySelector('textarea');
                
                // Auto-save content on input
                if (contentTextarea) {
                    contentTextarea.addEventListener('input', () => {
                        this.updateNotepad(notepad.id, notepad.title, contentTextarea.value);
                    });
                    
                    // Add delete functionality with right-click context menu
                    contentTextarea.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        if (confirm(`Delete this notepad?`)) {
                            this.deleteNotepad(notepad.id);
                        }
                    });
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
