// ==UserScript==
// @name         Sidekick Notepad Module
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  ENHANCED: Notepad with elegant grouping system, stacked notes, group titles, sleek navigation
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

                const activeNotepadId = this.activeGroupNotes[group.id];
                const activeNotepad = this.notepads.find(n => n.id === activeNotepadId);
                
                if (!activeNotepad) return;

                // Create group container
                const groupElement = document.createElement('div');
                groupElement.id = `group-${group.id}`;
                groupElement.className = 'sidebar-item notepad-group';
                groupElement.dataset.groupId = group.id;
                
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarWidth = sidebar ? Math.max(200, sidebar.clientWidth) : 500;
                const sidebarHeight = sidebar ? Math.max(200, sidebar.clientHeight) : 600;

                const minWidth = 200, minHeight = 150;
                const maxWidth = Math.max(minWidth, sidebarWidth - 16);
                const maxHeight = Math.max(minHeight, sidebarHeight - 80);

                const desiredWidth = Math.max(minWidth, Math.min(group.width || 320, maxWidth));
                const desiredHeight = Math.max(minHeight, Math.min(group.height || 200, maxHeight));

                const finalX = Math.min(Math.max(0, group.x || 10), Math.max(0, sidebarWidth - desiredWidth - 8));
                const finalY = Math.min(Math.max(0, group.y || 10), Math.max(0, sidebarHeight - desiredHeight - 8));

                groupElement.style.cssText = `
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
                    resize: both;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;

                // Stack effect - show other notes as background layers
                const stackHTML = group.notepadIds.slice(1, 4).map((id, index) => {
                    const notepad = this.notepads.find(n => n.id === id);
                    if (!notepad) return '';
                    return `
                        <div style="
                            position: absolute;
                            top: ${-3 * (index + 1)}px;
                            left: ${3 * (index + 1)}px;
                            right: ${-3 * (index + 1)}px;
                            height: 20px;
                            background: linear-gradient(135deg, ${notepad.color || '#4CAF50'}, ${this.darkenColor(notepad.color || '#4CAF50', 20)});
                            border-radius: 8px 8px 0 0;
                            opacity: ${0.6 - (index * 0.2)};
                            z-index: ${-index - 1};
                            border: 1px solid #555;
                        "></div>
                    `;
                }).join('');

                groupElement.innerHTML = `
                    ${stackHTML}
                    <div class="group-header" style="
                        background: linear-gradient(135deg, ${activeNotepad.color || '#4CAF50'}, ${this.darkenColor(activeNotepad.color || '#4CAF50', 15)});
                        border-bottom: 1px solid #555;
                        padding: 6px 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: move;
                        height: 32px;
                        flex-shrink: 0;
                        border-radius: 7px 7px 0 0;
                        position: relative;
                        z-index: 10;
                    ">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                            <div class="group-dropdown" style="position: relative; display: inline-block;">
                                <button class="dropdown-btn" style="
                                    background: none;
                                    border: none;
                                    color: rgba(255,255,255,0.9);
                                    cursor: pointer;
                                    font-size: 12px;
                                    padding: 4px;
                                    display: flex;
                                    align-items: center;
                                    border-radius: 4px;
                                    transition: background 0.2s;
                                " title="Group options">
                                    ⚙️
                                </button>
                                <div class="dropdown-content" style="
                                    display: none;
                                    position: fixed;
                                    background: #333;
                                    min-width: 180px;
                                    max-height: 300px;
                                    z-index: 100000;
                                    border-radius: 6px;
                                    border: 1px solid #555;
                                    padding: 6px 0;
                                    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
                                    overflow-y: auto;
                                    scrollbar-width: none;
                                    -ms-overflow-style: none;
                                ">
                                    <div style="padding: 8px 12px; color: #888; font-size: 11px; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #444; margin-bottom: 4px;">
                                        Group: ${group.title}
                                    </div>
                                    <button class="add-note-to-group-btn" style="
                                        background: none; border: none; color: #fff; padding: 8px 12px; width: 100%;
                                        text-align: left; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 8px;
                                        transition: background 0.2s ease;
                                    ">➕ Add Note to Group</button>
                                    <button class="rename-group-btn" style="
                                        background: none; border: none; color: #fff; padding: 8px 12px; width: 100%;
                                        text-align: left; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 8px;
                                        transition: background 0.2s ease;
                                    ">✏️ Rename Group</button>
                                    <div style="height: 1px; background: #444; margin: 4px 0;"></div>
                                    <button class="ungroup-notes-btn" style="
                                        background: none; border: none; color: #ff6b6b; padding: 8px 12px; width: 100%;
                                        text-align: left; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 8px;
                                        transition: background 0.2s ease;
                                    ">📂 Ungroup Notes</button>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 4px; flex: 1;">
                                <input type="text" class="group-title-input" value="${group.title}" style="
                                    background: transparent; border: none; color: #fff; font-weight: 600; font-size: 13px;
                                    outline: none; padding: 0; flex: 1; min-width: 0;
                                " readonly>
                                <span style="color: rgba(255,255,255,0.7); font-size: 11px;">(${group.notepadIds.length})</span>
                            </div>
                            <div class="note-navigation" style="display: flex; align-items: center; gap: 2px;">
                                <button class="nav-prev" style="
                                    background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer;
                                    font-size: 14px; padding: 2px 4px; border-radius: 3px; transition: all 0.2s;
                                    ${group.notepadIds.indexOf(activeNotepadId) === 0 ? 'opacity: 0.3; cursor: not-allowed;' : ''}
                                " title="Previous note">◀</button>
                                <span style="color: rgba(255,255,255,0.8); font-size: 11px; font-weight: 500; min-width: 30px; text-align: center;">
                                    ${group.notepadIds.indexOf(activeNotepadId) + 1}/${group.notepadIds.length}
                                </span>
                                <button class="nav-next" style="
                                    background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer;
                                    font-size: 14px; padding: 2px 4px; border-radius: 3px; transition: all 0.2s;
                                    ${group.notepadIds.indexOf(activeNotepadId) === group.notepadIds.length - 1 ? 'opacity: 0.3; cursor: not-allowed;' : ''}
                                " title="Next note">▶</button>
                            </div>
                        </div>
                        <button class="close-group-btn" style="
                            background: none; border: none; color: rgba(255,67,54,0.8); cursor: pointer;
                            font-size: 16px; padding: 0; width: 18px; height: 18px; display: flex;
                            align-items: center; justify-content: center; opacity: 0.8; border-radius: 3px;
                            transition: all 0.2s;
                        " title="Delete group">×</button>
                    </div>
                    
                    <div class="active-note-title" style="
                        background: rgba(0,0,0,0.2); color: rgba(255,255,255,0.9); padding: 6px 12px;
                        font-size: 12px; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.1);
                        display: flex; align-items: center; justify-content: space-between;
                    ">
                        <span>📝 ${activeNotepad.title}</span>
                        <button class="edit-note-title-btn" style="
                            background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer;
                            font-size: 12px; padding: 2px; transition: color 0.2s;
                        " title="Edit note title">✏️</button>
                    </div>
                    
                    <textarea placeholder="Write your notes here..." data-notepad-id="${activeNotepad.id}" style="
                        flex: 1; background: transparent; border: none; color: #fff; padding: 12px;
                        font-size: 13px; font-family: inherit; resize: none; outline: none; line-height: 1.4;
                        width: 100%; box-sizing: border-box;
                        scrollbar-width: none; -ms-overflow-style: none;
                    ">${activeNotepad.content}</textarea>
                `;

                contentArea.appendChild(groupElement);
                this.addGroupEventListeners(groupElement, group);
                this.addGroupDragging(groupElement, group);
                this.addGroupResizing(groupElement, group);
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
                                    <div style="border-top: 1px solid #555; margin: 4px 0;"></div>
                                    ${notepad.groupId ? `
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
                                    <button class="group-btn" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        📚 Add to Group
                                    </button>
                                    <button class="create-group-btn" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        ✨ Create New Group
                                    </button>
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

                // Group functionality
                const groupBtn = notepadElement.querySelector('.group-btn');
                const createGroupBtn = notepadElement.querySelector('.create-group-btn');
                const ungroupBtn = notepadElement.querySelector('.ungroup-btn');

                if (groupBtn) {
                    groupBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownContent.style.display = 'none';
                        this.showGroupSelector(notepad);
                    });
                }

                if (createGroupBtn) {
                    createGroupBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownContent.style.display = 'none';
                        this.showCreateGroupDialog(notepad);
                    });
                }

                if (ungroupBtn) {
                    ungroupBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdownContent.style.display = 'none';
                        this.removeNotepadFromGroup(notepad.id);
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

            // Group event listeners for navigation and interaction
            addGroupEventListeners(groupElement, group) {
                const header = groupElement.querySelector('.group-header');
                const navigationButtons = groupElement.querySelectorAll('.group-nav-btn');
                const groupControls = groupElement.querySelector('.group-controls');

                // Navigation between stacked notes
                navigationButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const direction = btn.dataset.direction;
                        const currentIndex = this.activeGroupNotes[group.id] || 0;
                        const groupNotes = this.notepads.filter(n => n.groupId === group.id);
                        
                        if (direction === 'prev') {
                            this.activeGroupNotes[group.id] = Math.max(0, currentIndex - 1);
                        } else if (direction === 'next') {
                            this.activeGroupNotes[group.id] = Math.min(groupNotes.length - 1, currentIndex + 1);
                        }
                        
                        // Update the visual display
                        this.updateGroupDisplay(groupElement, group);
                        this.saveNotepads(); // Save active note positions
                    });
                });

                // Group dragging
                this.addGroupDragging(groupElement, group);
                
                // Group resizing
                this.addGroupResizing(groupElement, group);

                // Group controls (expand/collapse, settings)
                if (groupControls) {
                    const expandBtn = groupControls.querySelector('.group-expand-btn');
                    if (expandBtn) {
                        expandBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.toggleGroupExpansion(group.id);
                        });
                    }
                }
            },

            // Add dragging functionality to groups
            addGroupDragging(groupElement, group) {
                const header = groupElement.querySelector('.group-header');
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };

                header.addEventListener('mousedown', (e) => {
                    if (e.target.closest('.group-nav-btn, .group-controls')) return;
                    
                    isDragging = true;
                    const rect = groupElement.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    
                    groupElement.style.zIndex = '1000';
                    e.preventDefault();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    
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
                    
                    // Update group position
                    group.x = newX;
                    group.y = newY;
                });

                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        groupElement.style.zIndex = '100';
                        this.saveNotepads();
                    }
                });
            },

            // Add resizing functionality to groups
            addGroupResizing(groupElement, group) {
                const resizeHandle = groupElement.querySelector('.group-resize-handle');
                if (!resizeHandle) return;

                let isResizing = false;
                let startX, startY, startWidth, startHeight;

                resizeHandle.addEventListener('mousedown', (e) => {
                    isResizing = true;
                    startX = e.clientX;
                    startY = e.clientY;
                    startWidth = parseInt(document.defaultView.getComputedStyle(groupElement).width, 10);
                    startHeight = parseInt(document.defaultView.getComputedStyle(groupElement).height, 10);
                    e.preventDefault();
                    e.stopPropagation();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isResizing) return;
                    
                    const newWidth = Math.max(200, startWidth + e.clientX - startX);
                    const newHeight = Math.max(150, startHeight + e.clientY - startY);
                    
                    groupElement.style.width = newWidth + 'px';
                    groupElement.style.height = newHeight + 'px';
                    
                    // Update group dimensions
                    group.width = newWidth;
                    group.height = newHeight;
                });

                document.addEventListener('mouseup', () => {
                    if (isResizing) {
                        isResizing = false;
                        this.saveNotepads();
                    }
                });
            },

            // Update group display when navigating between notes
            updateGroupDisplay(groupElement, group) {
                const groupNotes = this.notepads.filter(n => n.groupId === group.id);
                const activeIndex = this.activeGroupNotes[group.id] || 0;
                const activeNote = groupNotes[activeIndex];
                
                if (!activeNote) return;

                // Update the visible note content
                const titleElement = groupElement.querySelector('.group-active-title');
                const contentElement = groupElement.querySelector('.group-active-content');
                const counterElement = groupElement.querySelector('.group-counter');
                
                if (titleElement) titleElement.textContent = activeNote.title || 'Untitled';
                if (contentElement) contentElement.textContent = activeNote.content || '';
                if (counterElement) counterElement.textContent = `${activeIndex + 1}/${groupNotes.length}`;

                // Update navigation button states
                const prevBtn = groupElement.querySelector('[data-direction="prev"]');
                const nextBtn = groupElement.querySelector('[data-direction="next"]');
                
                if (prevBtn) prevBtn.disabled = activeIndex === 0;
                if (nextBtn) nextBtn.disabled = activeIndex === groupNotes.length - 1;
            },

            // Toggle group expansion (future feature)
            toggleGroupExpansion(groupId) {
                // Future implementation for expanding groups to show all notes
                console.log('🔄 Toggle group expansion:', groupId);
            },

            // Show group selector dialog
            showGroupSelector(notepad) {
                const existingGroups = this.groups.filter(g => g.id !== notepad.groupId);
                
                if (existingGroups.length === 0) {
                    this.showCreateGroupDialog(notepad);
                    return;
                }

                const selectorDiv = document.createElement('div');
                selectorDiv.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #2c2c2c, #1e1e1e);
                    border: 2px solid #4CAF50;
                    border-radius: 12px;
                    padding: 20px;
                    z-index: 10000;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    min-width: 300px;
                    max-width: 400px;
                    font-family: 'Segoe UI', sans-serif;
                `;

                selectorDiv.innerHTML = `
                    <div style="color: #fff; font-size: 16px; margin-bottom: 15px; text-align: center;">
                        📚 Select Group for "${notepad.title || 'Untitled'}"
                    </div>
                    <div style="max-height: 200px; overflow-y: auto; margin-bottom: 15px;">
                        ${existingGroups.map(group => `
                            <button class="group-option" data-group-id="${group.id}" style="
                                display: block;
                                width: 100%;
                                background: #444;
                                border: 1px solid #666;
                                color: #fff;
                                padding: 10px;
                                margin-bottom: 8px;
                                border-radius: 6px;
                                cursor: pointer;
                                text-align: left;
                                transition: all 0.2s ease;
                            ">
                                📚 ${group.title} (${this.notepads.filter(n => n.groupId === group.id).length} notes)
                            </button>
                        `).join('')}
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="create-new-group" style="
                            background: #4CAF50;
                            border: none;
                            color: white;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 12px;
                        ">✨ Create New</button>
                        <button class="cancel-group" style="
                            background: #f44336;
                            border: none;
                            color: white;
                            padding: 8px 16px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 12px;
                        ">❌ Cancel</button>
                    </div>
                `;

                document.body.appendChild(selectorDiv);

                // Add event listeners
                selectorDiv.querySelectorAll('.group-option').forEach(btn => {
                    btn.addEventListener('mouseenter', () => {
                        btn.style.background = '#555';
                        btn.style.borderColor = '#4CAF50';
                    });
                    btn.addEventListener('mouseleave', () => {
                        btn.style.background = '#444';
                        btn.style.borderColor = '#666';
                    });
                    btn.addEventListener('click', () => {
                        const groupId = btn.dataset.groupId;
                        this.addNotepadToGroup(notepad.id, groupId);
                        selectorDiv.remove();
                    });
                });

                selectorDiv.querySelector('.create-new-group').addEventListener('click', () => {
                    selectorDiv.remove();
                    this.showCreateGroupDialog(notepad);
                });

                selectorDiv.querySelector('.cancel-group').addEventListener('click', () => {
                    selectorDiv.remove();
                });
            },

            // Show create group dialog
            showCreateGroupDialog(notepad) {
                const dialogDiv = document.createElement('div');
                dialogDiv.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #2c2c2c, #1e1e1e);
                    border: 2px solid #4CAF50;
                    border-radius: 12px;
                    padding: 25px;
                    z-index: 10000;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    min-width: 350px;
                    font-family: 'Segoe UI', sans-serif;
                `;

                dialogDiv.innerHTML = `
                    <div style="color: #fff; font-size: 16px; margin-bottom: 20px; text-align: center;">
                        ✨ Create New Group
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="color: #ccc; font-size: 14px; display: block; margin-bottom: 5px;">Group Title:</label>
                        <input type="text" class="group-title-input" placeholder="Enter group name..." style="
                            width: 100%;
                            padding: 10px;
                            border: 1px solid #666;
                            border-radius: 6px;
                            background: #333;
                            color: #fff;
                            font-size: 14px;
                            box-sizing: border-box;
                        ">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="color: #ccc; font-size: 14px; display: block; margin-bottom: 5px;">Position:</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="number" class="group-x-input" placeholder="X" value="50" style="
                                width: 80px;
                                padding: 8px;
                                border: 1px solid #666;
                                border-radius: 4px;
                                background: #333;
                                color: #fff;
                                font-size: 12px;
                            ">
                            <input type="number" class="group-y-input" placeholder="Y" value="50" style="
                                width: 80px;
                                padding: 8px;
                                border: 1px solid #666;
                                border-radius: 4px;
                                background: #333;
                                color: #fff;
                                font-size: 12px;
                            ">
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="create-group-confirm" style="
                            background: #4CAF50;
                            border: none;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">✨ Create Group</button>
                        <button class="create-group-cancel" style="
                            background: #f44336;
                            border: none;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">❌ Cancel</button>
                    </div>
                `;

                document.body.appendChild(dialogDiv);

                const titleInput = dialogDiv.querySelector('.group-title-input');
                const xInput = dialogDiv.querySelector('.group-x-input');
                const yInput = dialogDiv.querySelector('.group-y-input');

                titleInput.focus();

                dialogDiv.querySelector('.create-group-confirm').addEventListener('click', () => {
                    const title = titleInput.value.trim();
                    if (!title) {
                        titleInput.style.borderColor = '#f44336';
                        return;
                    }

                    const x = parseInt(xInput.value) || 50;
                    const y = parseInt(yInput.value) || 50;

                    const groupId = this.createGroup(title, x, y);
                    this.addNotepadToGroup(notepad.id, groupId);
                    dialogDiv.remove();
                });

                dialogDiv.querySelector('.create-group-cancel').addEventListener('click', () => {
                    dialogDiv.remove();
                });

                titleInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        dialogDiv.querySelector('.create-group-confirm').click();
                    }
                });
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
