// ==UserScript==
// @name         Sidekick Notepad Module
// @namespace    http://tampermonkey.net/
// @version      1.3.0
// @description  DRAG-DROP GROUPING: Simple drag header onto header to group notes, click headers to navigate, title editing. NO SIZE DRIFT on drag!
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
            groups: [], // Array of note groups
            activeGroupNotes: {}, // Track which note is active in each group

            init() {
                console.log('📝 Initializing Notepad Module v3.6.0...');
                this.core = window.SidekickModules.Core;
                if (!this.core) {
                    console.error('❌ Core module not available for Notepad');
                    return;
                }
                this.loadNotepads();
                this.refreshDisplay(); // Render any existing notepads immediately
                console.log('📝 Notepad module initialized, loaded', this.notepads.length, 'notepads');
            },

            loadNotepads() {
                console.log('📝 Loading notepads and groups...');
                // Load notepads globally, not page-specific
                const allNotepads = this.core.loadState(this.core.STORAGE_KEYS.NOTEPADS, []);
                console.log('📝 Loaded global notepads from storage:', allNotepads);
                
                // Load groups
                this.groups = this.core.loadState('notepad_groups', []);
                this.activeGroupNotes = this.core.loadState('notepad_active_group_notes', {});
                console.log('📝 Loaded notepad groups:', this.groups.length, 'groups');
                
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
                    const notepads = container.querySelectorAll('.movable-notepad, .notepad-group');
                    notepads.forEach(notepad => notepad.remove());
                    console.log('📝 Cleared existing notepad elements');
                }

                // Render groups first
                if (this.groups && this.groups.length > 0) {
                    console.log(`📝 Rendering ${this.groups.length} groups...`);
                    this.groups.forEach((group, index) => {
                        console.log(`📝 Rendering group ${index + 1}:`, group.title, group.id);
                        this.renderGroup(group);
                    });
                }

                // Then render individual notepads (those not in groups)
                if (this.notepads && this.notepads.length > 0) {
                    const ungroupedNotepads = this.notepads.filter(notepad => !notepad.groupId);
                    if (ungroupedNotepads.length > 0) {
                        console.log(`📝 Rendering ${ungroupedNotepads.length} individual notepads...`);
                        ungroupedNotepads.forEach((notepad, index) => {
                            console.log(`📝 Rendering notepad ${index + 1}:`, notepad.title, notepad.id);
                            this.renderNotepad(notepad);
                        });
                    }
                } else {
                    console.log('📝 No notepads to render');
                }
            },            saveNotepads() {
                console.log('📝 Saving notepads and groups globally...', this.notepads);
                // Save notepads globally, not page-specific
                this.core.saveState(this.core.STORAGE_KEYS.NOTEPADS, this.notepads);
                // Save groups
                this.core.saveState('notepad_groups', this.groups);
                this.core.saveState('notepad_active_group_notes', this.activeGroupNotes);
                console.log('📝 Notepads and groups saved to global storage');
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

            // Group management methods
            createGroup(title = 'Note Group', notepadIds = []) {
                const group = {
                    id: Date.now() + Math.random(),
                    title: title,
                    notepadIds: notepadIds,
                    x: 10 + (this.groups.length * 30),
                    y: 10 + (this.groups.length * 30),
                    width: 320,
                    height: 200,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString()
                };
                
                this.groups.push(group);
                
                // Set first notepad as active if any
                if (notepadIds.length > 0) {
                    this.activeGroupNotes[group.id] = notepadIds[0];
                }
                
                this.saveNotepads();
                console.log('📝 Created group:', title, 'with', notepadIds.length, 'notes');
                return group;
            },

            addNotepadToGroup(notepadId, groupId) {
                const group = this.groups.find(g => g.id === groupId);
                if (group && !group.notepadIds.includes(notepadId)) {
                    group.notepadIds.push(notepadId);
                    group.modified = new Date().toISOString();
                    
                    // Set as active if first note in group
                    if (group.notepadIds.length === 1) {
                        this.activeGroupNotes[groupId] = notepadId;
                    }
                    
                    this.saveNotepads();
                    console.log('📝 Added notepad to group:', notepadId, 'to', group.title);
                }
            },

            removeNotepadFromGroup(notepadId, groupId) {
                const group = this.groups.find(g => g.id === groupId);
                if (group) {
                    group.notepadIds = group.notepadIds.filter(id => id !== notepadId);
                    group.modified = new Date().toISOString();
                    
                    // Update active note if removed note was active
                    if (this.activeGroupNotes[groupId] === notepadId) {
                        this.activeGroupNotes[groupId] = group.notepadIds[0] || null;
                    }
                    
                    // Remove group if no notes left
                    if (group.notepadIds.length === 0) {
                        this.deleteGroup(groupId);
                    } else {
                        this.saveNotepads();
                    }
                    console.log('📝 Removed notepad from group:', notepadId);
                }
            },

            deleteGroup(groupId) {
                this.groups = this.groups.filter(g => g.id !== groupId);
                delete this.activeGroupNotes[groupId];
                this.saveNotepads();
                console.log('📝 Deleted group:', groupId);
            },

            setActiveNoteInGroup(groupId, notepadId) {
                const group = this.groups.find(g => g.id === groupId);
                if (group && group.notepadIds.includes(notepadId)) {
                    this.activeGroupNotes[groupId] = notepadId;
                    this.saveNotepads();
                    this.refreshDisplay();
                    console.log('📝 Set active note in group:', notepadId, 'in', group.title);
                }
            },

            getGroupForNotepad(notepadId) {
                return this.groups.find(g => g.notepadIds.includes(notepadId));
            },

            renderGroup(group) {
                const contentArea = document.getElementById('sidekick-content');
                if (!contentArea) return;

                const groupNotes = group.noteIds.map(id => this.notepads.find(n => n.id === id)).filter(n => n);
                if (groupNotes.length === 0) return;

                const activeIndex = group.activeNoteIndex || 0;
                const activeNote = groupNotes[activeIndex];

                // Create group container
                const groupElement = document.createElement('div');
                groupElement.id = `group-${group.id}`;
                groupElement.className = 'movable-notepad notepad-group';
                groupElement.dataset.groupId = group.id;

                groupElement.style.cssText = `
                    position: absolute;
                    left: ${group.x}px;
                    top: ${group.y}px;
                    width: ${group.width}px;
                    height: ${group.height}px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    z-index: 100;
                    resize: both;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;

                // Build stacked headers - only top bar of each note is visible
                let headersHTML = '';
                groupNotes.forEach((note, index) => {
                    const isActive = index === activeIndex;
                    const zIndex = isActive ? 10 : 9 - index;
                    const topOffset = index * 2; // Small offset for stacking effect
                    
                    headersHTML += `
                        <div class="stacked-header ${isActive ? 'active' : ''}" 
                             data-note-id="${note.id}" 
                             data-index="${index}"
                             style="
                                 position: absolute;
                                 top: ${topOffset}px;
                                 left: 0;
                                 right: 0;
                                 height: 32px;
                                 background: linear-gradient(135deg, ${note.color || '#4CAF50'}, ${this.darkenColor(note.color || '#4CAF50', 15)});
                                 border-bottom: 1px solid #555;
                                 cursor: pointer;
                                 z-index: ${zIndex};
                                 border-radius: ${index === 0 ? '7px 7px 0 0' : '0'};
                                 ${isActive ? '' : 'opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.1);'}
                                 transition: all 0.2s ease;
                             ">
                            <div style="
                                padding: 8px 12px;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                height: 100%;
                                box-sizing: border-box;
                            ">
                                <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                                    ${group.title && index === 0 ? `
                                    <input type="text" class="group-title" value="${group.title}" 
                                           placeholder="Group title..." 
                                           style="
                                               background: transparent;
                                               border: none;
                                               color: #fff;
                                               font-weight: 600;
                                               font-size: 12px;
                                               outline: none;
                                               max-width: 100px;
                                               ${group.title ? '' : 'display: none;'}
                                           ">
                                    ` : ''}
                                    <span class="note-title" style="
                                        color: #fff;
                                        font-size: ${index === 0 && group.title ? '11px' : '13px'};
                                        font-weight: ${isActive ? '600' : '500'};
                                        opacity: ${isActive ? '1' : '0.9'};
                                        ${index === 0 && group.title ? 'font-style: italic;' : ''}
                                    ">${note.title || 'Untitled'}</span>
                                </div>
                                
                                ${isActive ? `
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    ${index === 0 ? `
                                    <button class="group-title-toggle" style="
                                        background: none;
                                        border: none;
                                        color: rgba(255,255,255,0.7);
                                        cursor: pointer;
                                        font-size: 10px;
                                        padding: 2px;
                                    " title="Toggle group title">T</button>
                                    ` : ''}
                                    <button class="dropdown-btn" style="
                                        background: none;
                                        border: none;
                                        color: rgba(255,255,255,0.8);
                                        cursor: pointer;
                                        font-size: 12px;
                                        padding: 2px;
                                    ">▼</button>
                                    <button class="close-btn" style="
                                        background: none;
                                        border: none;
                                        color: #f44336;
                                        cursor: pointer;
                                        font-size: 14px;
                                        padding: 0;
                                        width: 16px;
                                        height: 16px;
                                    ">×</button>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });

                groupElement.innerHTML = `
                    ${headersHTML}
                    <textarea placeholder="Write your notes here..." 
                              data-notepad-id="${activeNote.id}" 
                              style="
                                  position: absolute;
                                  top: ${32 + (groupNotes.length - 1) * 2}px;
                                  left: 0;
                                  right: 0;
                                  bottom: 0;
                                  background: transparent;
                                  border: none;
                                  color: #fff;
                                  padding: 12px;
                                  font-size: 13px;
                                  font-family: inherit;
                                  resize: none;
                                  outline: none;
                                  line-height: 1.4;
                                  scrollbar-width: none;
                                  -ms-overflow-style: none;
                              ">${activeNote.content}</textarea>
                `;

                contentArea.appendChild(groupElement);
                this.addGroupEventListeners(groupElement, group);
            },

            // Helper method to darken colors for gradient effects
            darkenColor(color, percent) {
                const num = parseInt(color.replace("#", ""), 16);
                const amt = Math.round(2.55 * percent);
                const R = (num >> 16) - amt;
                const G = (num >> 8 & 0x00FF) - amt;
                const B = (num & 0x0000FF) - amt;
                return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
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
                                    ${notepad.groupId ? `
                                    <div style="border-top: 1px solid #555; margin: 4px 0;"></div>
                                    <button class="ungroup-btn" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        📤 Remove from Group
                                    </button>
                                    ` : `
                                    <div style="border-top: 1px solid #555; margin: 4px 0;"></div>
                                    <div style="
                                        color: #999;
                                        padding: 8px 12px;
                                        font-size: 11px;
                                        text-align: center;
                                        font-style: italic;
                                    ">
                                        Drag header onto another note to group
                                    </div>
                                    `}
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

                    // Only save if values actually changed significantly (more generous thresholds)
                    if (Math.abs(notepad.x - x) < 5 && Math.abs(notepad.y - y) < 5 && 
                        Math.abs(notepad.width - width) < 20 && Math.abs(notepad.height - height) < 20 && 
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
                
                const savePositionOnly = () => {
                    if (this._isProgrammaticChange) {
                        console.log('📝 Skipping save during programmatic change');
                        return;
                    }
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarWidth = sidebar ? Math.max(200, sidebar.clientWidth) : 500;
                    const sidebarHeight = sidebar ? Math.max(200, sidebar.clientHeight) : 600;

                    const rawX = parseInt(notepadElement.style.left) || 0;
                    const rawY = parseInt(notepadElement.style.top) || 0;

                    // Use existing saved dimensions, don't recalculate from offsetWidth
                    const width = notepad.width || 280;
                    const height = notepad.height || 150;

                    const maxX = Math.max(0, sidebarWidth - width - 8);
                    const maxY = Math.max(0, sidebarHeight - height - 8);

                    const x = Math.min(Math.max(0, rawX), maxX);
                    const y = Math.min(Math.max(0, rawY), maxY);

                    // Only save if position actually changed significantly
                    if (Math.abs(notepad.x - x) < 5 && Math.abs(notepad.y - y) < 5) {
                        console.log('📝 No significant position changes detected, skipping save');
                        return;
                    }

                    notepad.x = x;
                    notepad.y = y;
                    // Don't update width/height during drag!

                    this._isProgrammaticChange = true;
                    notepadElement.style.left = x + 'px';
                    notepadElement.style.top = y + 'px';
                    
                    setTimeout(() => {
                        this._isProgrammaticChange = false;
                    }, 100);

                    this.saveNotepads();
                    console.log('📝 Saved position only for notepad ' + notepad.id);
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

                // Ungroup functionality
                const ungroupBtn = notepadElement.querySelector('.ungroup-btn');
                if (ungroupBtn) {
                    ungroupBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownContent.style.display = 'none';
                        this.removeNotepadFromGroup(notepad.id);
                    });
                }
                
                // ENHANCED DRAGGING with grouping support
                if (header) {
                    let isDragging = false;
                    let dragOffset = { x: 0, y: 0 };
                    let startPosition = { x: 0, y: 0 };
                    let dragStartTime = 0;
                    
                    // Make header draggable for grouping
                    header.draggable = true;
                    
                    // Drag and drop events for grouping
                    header.addEventListener('dragstart', (e) => {
                        this.handleHeaderDragStart(notepad, header);
                        e.dataTransfer.effectAllowed = 'move';
                    });
                    
                    header.addEventListener('dragend', () => {
                        this.handleHeaderDragEnd();
                    });
                    
                    header.addEventListener('dragover', (e) => {
                        this.handleHeaderDragOver(notepad, header, e);
                    });
                    
                    header.addEventListener('dragleave', () => {
                        // Reset drag highlight when leaving
                        header.style.boxShadow = '';
                        header.style.borderColor = '';
                    });
                    
                    header.addEventListener('drop', (e) => {
                        this.handleHeaderDrop(notepad, e);
                    });
                    
                    // Regular dragging for positioning
                    header.addEventListener('mousedown', (e) => {
                        if (isPinned) return;
                        
                        dragStartTime = Date.now();
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
                        
                        // Disable draggable only when actually moving to prevent conflicts
                        if (header.draggable) {
                            header.draggable = false;
                        }
                        
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
                            
                            // Re-enable draggable for grouping
                            setTimeout(() => {
                                header.draggable = true;
                            }, 100);
                            
                            const currentX = parseInt(notepadElement.style.left) || 0;
                            const currentY = parseInt(notepadElement.style.top) || 0;
                            
                            if (Math.abs(currentX - startPosition.x) > 3 || Math.abs(currentY - startPosition.y) > 3) {
                                console.log('📝 Position changed during drag, saving position only (not size)...');
                                savePositionOnly.call(this);
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
                        
                        if (widthDiff > 25 || heightDiff > 25) {
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

            // Group event listeners for navigation and interaction
            addGroupEventListeners(groupElement, group) {
                // Stacked header clicking to switch notes
                const stackedHeaders = groupElement.querySelectorAll('.stacked-header');
                stackedHeaders.forEach(header => {
                    header.addEventListener('click', (e) => {
                        const index = parseInt(header.dataset.index);
                        if (index !== group.activeNoteIndex) {
                            // Move current active note to the back of the stack
                            const currentActive = group.noteIds[group.activeNoteIndex];
                            group.noteIds.splice(group.activeNoteIndex, 1);
                            group.noteIds.push(currentActive);
                            
                            // Set clicked note as active (it's now at the clicked index)
                            group.activeNoteIndex = index;
                            
                            // Re-render the group
                            groupElement.remove();
                            this.renderGroup(group);
                            this.saveNotepads();
                        }
                    });
                });

                // Group title toggle
                const titleToggle = groupElement.querySelector('.group-title-toggle');
                if (titleToggle) {
                    titleToggle.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const titleInput = groupElement.querySelector('.group-title');
                        if (titleInput.style.display === 'none') {
                            titleInput.style.display = '';
                            titleInput.focus();
                        } else {
                            titleInput.style.display = 'none';
                            group.title = '';
                            this.saveNotepads();
                        }
                    });
                }

                // Group title editing
                const titleInput = groupElement.querySelector('.group-title');
                if (titleInput) {
                    titleInput.addEventListener('blur', () => {
                        group.title = titleInput.value;
                        this.saveNotepads();
                    });
                    titleInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            titleInput.blur();
                        }
                    });
                }

                // Textarea content saving
                const textarea = groupElement.querySelector('textarea');
                if (textarea) {
                    textarea.addEventListener('input', () => {
                        const noteId = textarea.dataset.notepadId;
                        const note = this.notepads.find(n => n.id === noteId);
                        if (note) {
                            note.content = textarea.value;
                            this.saveNotepads();
                        }
                    });
                }

                // Close button - ungroup all notes
                const closeBtn = groupElement.querySelector('.close-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.ungroupNotes(group.id);
                    });
                }

                // Group dragging and resizing
                this.addGroupMovement(groupElement, group);
            },

            // Simple group movement (dragging and resizing)
            addGroupMovement(groupElement, group) {
                let isDragging = false;
                let isResizing = false;
                let dragOffset = { x: 0, y: 0 };

                // Dragging - use the first header (group title area) as drag handle
                const dragHandle = groupElement.querySelector('.stacked-header[data-index="0"]');
                if (dragHandle) {
                    dragHandle.addEventListener('mousedown', (e) => {
                        // Only drag if clicking on the drag area (not buttons)
                        if (e.target.closest('button')) return;
                        
                        isDragging = true;
                        const rect = groupElement.getBoundingClientRect();
                        dragOffset.x = e.clientX - rect.left;
                        dragOffset.y = e.clientY - rect.top;
                        
                        groupElement.style.zIndex = '1000';
                        e.preventDefault();
                    });
                }

                document.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        const sidebar = document.getElementById('sidekick-content');
                        const sidebarRect = sidebar.getBoundingClientRect();
                        
                        let newX = e.clientX - sidebarRect.left - dragOffset.x;
                        let newY = e.clientY - sidebarRect.top - dragOffset.y;
                        
                        // Constrain to sidebar bounds
                        const groupRect = groupElement.getBoundingClientRect();
                        newX = Math.max(0, Math.min(newX, sidebarRect.width - groupRect.width));
                        newY = Math.max(0, Math.min(newY, sidebarRect.height - groupRect.height));
                        
                        groupElement.style.left = newX + 'px';
                        groupElement.style.top = newY + 'px';
                        
                        group.x = newX;
                        group.y = newY;
                    }
                });

                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        groupElement.style.zIndex = '100';
                        this.saveNotepads();
                    }
                });

                // Resizing observer to update group dimensions
                const resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        if (entry.target === groupElement) {
                            group.width = entry.contentRect.width;
                            group.height = entry.contentRect.height;
                            this.saveNotepads();
                        }
                    }
                });
                resizeObserver.observe(groupElement);
            },

            // Ungroup all notes in a group
            ungroupNotes(groupId) {
                const group = this.groups.find(g => g.id === groupId);
                if (!group) return;

                // Remove group reference from notes and restore them as individual notes
                group.noteIds.forEach((noteId, index) => {
                    const note = this.notepads.find(n => n.id === noteId);
                    if (note) {
                        delete note.groupId;
                        // Spread notes out from group position
                        note.x = group.x + (index * 20);
                        note.y = group.y + (index * 20);
                        note.width = group.width;
                        note.height = group.height;
                    }
                });

                // Remove group from groups array
                this.groups = this.groups.filter(g => g.id !== groupId);

                // Remove group element
                document.getElementById(`group-${groupId}`)?.remove();

                // Refresh display to show individual notes
                this.refreshDisplay();
                this.saveNotepads();

                console.log('� Ungrouped notes from group:', groupId);
            },

            // Simple drag-and-drop grouping system
            handleHeaderDragStart(sourceNotepad, headerElement) {
                console.log('📝 Starting drag for notepad:', sourceNotepad.title);
                
                // Store drag data
                this.dragData = {
                    sourceNotepad: sourceNotepad,
                    sourceElement: headerElement.closest('.movable-notepad')
                };
                
                // Add visual feedback
                headerElement.style.opacity = '0.7';
                headerElement.style.transform = 'scale(0.95)';
                
                // Add drag highlight to all other notepad headers
                this.notepads.forEach(notepad => {
                    if (notepad.id !== sourceNotepad.id && !notepad.groupId) {
                        const element = document.querySelector(`[data-notepad-id="${notepad.id}"] .notepad-header`);
                        if (element) {
                            element.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                            element.style.borderColor = '#4CAF50';
                        }
                    }
                });
            },

            handleHeaderDragEnd() {
                if (!this.dragData) return;
                
                // Reset visual feedback
                const sourceHeader = this.dragData.sourceElement?.querySelector('.notepad-header');
                if (sourceHeader) {
                    sourceHeader.style.opacity = '';
                    sourceHeader.style.transform = '';
                }
                
                // Remove drag highlights
                document.querySelectorAll('.notepad-header').forEach(header => {
                    header.style.boxShadow = '';
                    header.style.borderColor = '';
                });
                
                this.dragData = null;
            },

            handleHeaderDragOver(targetNotepad, headerElement, event) {
                if (!this.dragData || this.dragData.sourceNotepad.id === targetNotepad.id) return;
                
                event.preventDefault();
                headerElement.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.8)';
                headerElement.style.borderColor = '#4CAF50';
            },

            handleHeaderDragLeave(headerElement) {
                headerElement.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                headerElement.style.borderColor = '#4CAF50';
            },

            handleHeaderDrop(targetNotepad, event) {
                event.preventDefault();
                
                if (!this.dragData || this.dragData.sourceNotepad.id === targetNotepad.id) return;
                
                // Ask user for confirmation
                const confirm = window.confirm(`Group "${this.dragData.sourceNotepad.title || 'Untitled'}" with "${targetNotepad.title || 'Untitled'}"?`);
                
                if (confirm) {
                    this.createDragDropGroup(this.dragData.sourceNotepad, targetNotepad);
                }
                
                this.handleHeaderDragEnd();
            },

            createDragDropGroup(sourceNotepad, targetNotepad) {
                console.log('📚 Creating drag-drop group:', sourceNotepad.title, 'onto', targetNotepad.title);
                
                // Create group at target position with target size
                const targetElement = document.querySelector(`[data-notepad-id="${targetNotepad.id}"]`);
                const targetRect = targetElement.getBoundingClientRect();
                const sidebar = document.getElementById('sidekick-content');
                const sidebarRect = sidebar.getBoundingClientRect();
                
                const groupId = 'group_' + Date.now();
                const group = {
                    id: groupId,
                    title: '', // No title initially
                    x: targetNotepad.x,
                    y: targetNotepad.y,
                    width: targetNotepad.width,
                    height: targetNotepad.height,
                    noteIds: [targetNotepad.id, sourceNotepad.id], // Target first, source second
                    activeNoteIndex: 0 // Show target note initially
                };
                
                // Add group to groups array
                this.groups.push(group);
                
                // Update notepads to belong to group
                sourceNotepad.groupId = groupId;
                targetNotepad.groupId = groupId;
                
                // Remove individual notepad elements
                document.querySelector(`[data-notepad-id="${sourceNotepad.id}"]`)?.remove();
                document.querySelector(`[data-notepad-id="${targetNotepad.id}"]`)?.remove();
                
                // Render the group
                this.renderGroup(group);
                
                // Save changes
                this.saveNotepads();
                
                console.log('✅ Group created successfully');
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
