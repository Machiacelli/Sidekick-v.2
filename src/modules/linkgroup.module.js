// ==UserScript==
// @name         Sidekick LinkGroup Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Link group functionality for Sidekick sidebar
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
        const LinkGroupModule = {
            linkGroups: [],
            currentPage: 0,

        init() {
                console.log('🔗 Initializing LinkGroup Module v1.0.0...');
                this.core = window.SidekickModules.Core;
                if (!this.core) {
                    console.error('❌ Core module not available for LinkGroup');
                return;
            }
                this.loadLinkGroups();
                this.refreshDisplay(); // Render any existing link groups
                console.log('🔗 LinkGroup module initialized, loaded', this.linkGroups.length, 'link groups');
            },

            loadLinkGroups() {
                console.log('🔗 Loading link groups...');
                try {
                    const savedData = this.core.loadState('sidekick_linkgroups', []);
                    this.linkGroups = savedData || [];
                    console.log('✅ Loaded', this.linkGroups.length, 'link groups');
                } catch (error) {
                    console.error('❌ Error loading link groups:', error);
                    this.linkGroups = [];
                }
            },

            saveLinkGroups() {
                try {
                    this.core.saveState('sidekick_linkgroups', this.linkGroups);
                    console.log('💾 Link groups saved');
                } catch (error) {
                    console.error('❌ Error saving link groups:', error);
                }
            },

            refreshDisplay() {
                console.log('🔗 Refreshing link group display...');
                this.clearExistingLinkGroups();
                this.linkGroups.forEach(linkGroup => this.renderLinkGroup(linkGroup));
            },

            clearExistingLinkGroups() {
                const existingLinkGroups = document.querySelectorAll('.sidekick-linkgroup');
                existingLinkGroups.forEach(element => element.remove());
            },

            createNewLinkGroup() {
                console.log('🔗 Creating new link group...');
                const newLinkGroup = {
                    id: Date.now().toString(),
                    name: 'New Link Group',
                    links: [],
                    color: '#607D8B',
                    pinned: false,
                    minimized: false
                };

                this.linkGroups.push(newLinkGroup);
                this.saveLinkGroups();
                this.renderLinkGroup(newLinkGroup);
                return newLinkGroup;
            },

            renderLinkGroup(linkGroup) {
                const contentArea = document.getElementById('sidekick-content');
                if (!contentArea) {
                    console.error('❌ Content area not found');
                    return;
                }

                const linkGroupElement = document.createElement('div');
                linkGroupElement.className = 'sidekick-linkgroup';
                linkGroupElement.dataset.linkgroupId = linkGroup.id;
                
                // Calculate default position and size
                const defaultWidth = 300;
                const defaultHeight = 200;
                const minWidth = 250;
                const minHeight = 150;
                const maxWidth = 500;
                const maxHeight = 600;

                // Position new link groups with slight offset to avoid overlapping
                const existingGroups = document.querySelectorAll('.sidekick-linkgroup');
                const offset = existingGroups.length * 20;
                const defaultX = 20 + offset;
                const defaultY = 20 + offset;

                // Use saved position or defaults
                const desiredX = linkGroup.x !== undefined ? linkGroup.x : defaultX;
                const desiredY = linkGroup.y !== undefined ? linkGroup.y : defaultY;
                const desiredWidth = linkGroup.width || defaultWidth;
                const desiredHeight = linkGroup.height || defaultHeight;

                // Get sidebar bounds for constraining position
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { width: 400, height: 600 };
                const maxX = Math.max(0, sidebarRect.width - desiredWidth);
                const maxY = Math.max(0, sidebarRect.height - desiredHeight);

                // Clamp position to sidebar bounds
                const finalX = Math.min(Math.max(0, desiredX), maxX);
                const finalY = Math.min(Math.max(0, desiredY), maxY);

                // Update the linkGroup object with clamped values
                linkGroup.x = finalX;
                linkGroup.y = finalY;
                linkGroup.width = desiredWidth;
                linkGroup.height = desiredHeight;

                linkGroupElement.style.cssText = `
                    position: absolute;
                    left: ${finalX}px;
                    top: ${finalY}px;
                    width: ${desiredWidth}px;
                    height: ${desiredHeight}px;
                    background: #222;
                    border: 1px solid #444;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    min-width: ${minWidth}px;
                    min-height: ${minHeight}px;
                    max-width: ${maxWidth}px;
                    max-height: ${maxHeight}px;
                    z-index: ${1000 + existingGroups.length};
                    resize: ${linkGroup.pinned ? 'none' : 'both'};
                    overflow: hidden;
                `;
                
                linkGroupElement.innerHTML = `
                    <div class="linkgroup-header" style="
                        background: ${linkGroup.color || '#607D8B'};
                        border-bottom: 1px solid #555;
                        padding: 4px 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        cursor: ${linkGroup.pinned ? 'default' : 'move'};
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
                                    <button class="new-link-btn" style="
                                        background: none;
                                        border: none;
                                        color: #fff;
                                        padding: 8px 12px;
                                        width: 100%;
                                        text-align: left;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">
                                        🔗 New Link
                                    </button>
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
                                        ${linkGroup.pinned ? '📌 Unpin' : '📌 Pin'}
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
                            <span class="linkgroup-title" style="color: #fff; font-size: 12px; font-weight: bold; cursor: text;" title="Click to edit title">🔗 ${linkGroup.name}</span>
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
                        " title="Delete link group">×</button>
                    </div>
                    <div class="linkgroup-content" style="
                        padding: 8px;
                        background: #1a1a1a;
                        border-radius: 0 0 7px 7px;
                        ${linkGroup.minimized ? 'display: none;' : ''}
                    ">
                        <div class="links-container">
                            <!-- Links will be rendered here -->
                        </div>
                    </div>
                `;

                contentArea.appendChild(linkGroupElement);
                
                // Render links
                this.renderLinks(linkGroup);
                
                // Set up event listeners
                this.setupLinkGroupEventListeners(linkGroupElement, linkGroup);
                
                return linkGroupElement;
            },

            renderLinks(linkGroup) {
                const linkGroupElement = document.querySelector(`[data-linkgroup-id="${linkGroup.id}"]`);
                if (!linkGroupElement) return;

                const linksContainer = linkGroupElement.querySelector('.links-container');
                linksContainer.innerHTML = '';

                if (linkGroup.links.length === 0) {
                    linksContainer.innerHTML = `
                        <div style="
                            color: #888;
                            font-style: italic;
                            text-align: center;
                            padding: 12px;
                        ">
                            No links yet. Click the dropdown to add a new link.
                        </div>
                    `;
                    return;
                }

                linkGroup.links.forEach((link, index) => {
                    const linkElement = document.createElement('div');
                    linkElement.className = 'link-item';
                    linkElement.style.cssText = `
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        padding: 6px 8px;
                        margin-bottom: 4px;
                        background: #333;
                        border-radius: 4px;
                        border: 1px solid #555;
                    `;

                    linkElement.innerHTML = `
                        <a href="${link.url}" target="_blank" style="
                            color: #4FC3F7;
                            text-decoration: none;
                            flex: 1;
                            margin-right: 8px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                            font-size: 13px;
                        " title="${link.url}">
                            ${link.name}
                        </a>
                        <div style="display: flex; gap: 4px;">
                            <button class="copy-link-btn" data-link-index="${index}" style="
                                background: #4CAF50;
                                border: none;
                                color: white;
                                padding: 2px 6px;
                                border-radius: 3px;
                                cursor: pointer;
                                font-size: 11px;
                            " title="Copy link">
                                📋
                            </button>
                            <button class="remove-link-btn" data-link-index="${index}" style="
                                background: #f44336;
                                border: none;
                                color: white;
                                padding: 2px 6px;
                                border-radius: 3px;
                                cursor: pointer;
                                font-size: 11px;
                            " title="Remove link">
                                ×
                            </button>
                        </div>
                    `;

                    linksContainer.appendChild(linkElement);
                });

                // Set up link action event listeners
                this.setupLinkActionListeners(linkGroup);
            },

            setupLinkGroupEventListeners(element, linkGroup) {
                const header = element.querySelector('.linkgroup-header');
                const dropdownBtn = element.querySelector('.dropdown-btn');
                const dropdownContent = element.querySelector('.dropdown-content');
                const titleSpan = element.querySelector('.linkgroup-title');

                // Dragging functionality (only if not pinned)
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };

                header.addEventListener('mousedown', (e) => {
                    // Don't drag if clicking on dropdown, title, or close button
                    if (e.target.closest('.dropdown-btn') || 
                        e.target.closest('.linkgroup-title') || 
                        e.target.closest('.close-btn') ||
                        linkGroup.pinned) {
                        return;
                    }

                    isDragging = true;
                    const rect = element.getBoundingClientRect();
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar.getBoundingClientRect();
                    
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    
                    // Bring to front when dragging starts
                    element.style.zIndex = Date.now();
                    
                    e.preventDefault();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging || linkGroup.pinned) return;

                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar.getBoundingClientRect();

                    let newX = e.clientX - sidebarRect.left - dragOffset.x;
                    let newY = e.clientY - sidebarRect.top - dragOffset.y;

                    // Keep within sidebar bounds
                    newX = Math.max(0, Math.min(newX, sidebar.offsetWidth - element.offsetWidth));
                    newY = Math.max(0, Math.min(newY, sidebar.offsetHeight - element.offsetHeight));

                    element.style.left = newX + 'px';
                    element.style.top = newY + 'px';

                    // Update stored position
                    linkGroup.x = newX;
                    linkGroup.y = newY;
                    this.saveLinkGroups();
                });

                document.addEventListener('mouseup', () => {
                    isDragging = false;
                });

                // Title editing functionality
                titleSpan.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.maketitleEditable(titleSpan, linkGroup);
                });

                // Resize observer to save dimensions
                const resizeObserver = new ResizeObserver((entries) => {
                    for (const entry of entries) {
                        const rect = entry.contentRect;
                        linkGroup.width = rect.width;
                        linkGroup.height = rect.height;
                        this.saveLinkGroups();
                    }
                });
                resizeObserver.observe(element);

                // Dropdown toggle
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = dropdownContent.style.display === 'block';
                    
                    // Hide all other dropdowns
                    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                        dropdown.style.display = 'none';
                    });
                    
                    dropdownContent.style.display = isVisible ? 'none' : 'block';
                });

                // New Link button
                const newLinkBtn = element.querySelector('.new-link-btn');
                newLinkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = 'none';
                    this.showAddLinkModal(linkGroup);
                });

                // Pin/Unpin button
                const pinBtn = element.querySelector('.pin-btn');
                pinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = 'none';
                    this.togglePin(linkGroup);
                });

                // Color change button
                const colorBtn = element.querySelector('.color-btn');
                colorBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = 'none';
                    this.showColorPicker(linkGroup);
                });

                // Delete button
                const closeBtn = element.querySelector('.close-btn');
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteLinkGroup(linkGroup);
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', () => {
                    dropdownContent.style.display = 'none';
                });
            },

            setupLinkActionListeners(linkGroup) {
                const linkGroupElement = document.querySelector(`[data-linkgroup-id="${linkGroup.id}"]`);
                if (!linkGroupElement) return;

                // Copy link buttons
                linkGroupElement.querySelectorAll('.copy-link-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const linkIndex = parseInt(btn.dataset.linkIndex);
                        const link = linkGroup.links[linkIndex];
                        
                        navigator.clipboard.writeText(link.url).then(() => {
                            this.core.NotificationSystem.show('Copied', 'Link copied to clipboard!', 'success');
                        }).catch(() => {
                            this.core.NotificationSystem.show('Error', 'Failed to copy link', 'error');
                        });
                    });
                });

                // Remove link buttons
                linkGroupElement.querySelectorAll('.remove-link-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const linkIndex = parseInt(btn.dataset.linkIndex);
                        this.removeLink(linkGroup, linkIndex);
                    });
                });
            },

            showAddLinkModal(linkGroup) {
                // Remove existing modal if any
                const existingModal = document.getElementById('sidekick-add-link-modal');
                if (existingModal) existingModal.remove();

                const modal = document.createElement('div');
                modal.id = 'sidekick-add-link-modal';
                modal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                modal.innerHTML = `
                    <div style="
                        background: #333;
                        padding: 24px;
                        border-radius: 8px;
                        border: 1px solid #555;
                        max-width: 400px;
                        width: 90%;
                        color: #fff;
                    ">
                        <h3 style="margin: 0 0 16px 0; color: #fff;">Add New Link</h3>
                        <div style="margin-bottom: 12px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 13px;">Link Name:</label>
                            <input id="link-name-input" type="text" placeholder="Enter link name..." style="
                                width: 100%;
                                padding: 8px;
                                background: #222;
                                border: 1px solid #555;
                                border-radius: 4px;
                                color: #fff;
                                font-size: 13px;
                            ">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 13px;">URL:</label>
                            <input id="link-url-input" type="url" placeholder="https://..." style="
                                width: 100%;
                                padding: 8px;
                                background: #222;
                                border: 1px solid #555;
                                border-radius: 4px;
                                color: #fff;
                                font-size: 13px;
                            ">
                        </div>
                        <div style="display: flex; gap: 8px; justify-content: flex-end;">
                            <button id="cancel-link-btn" style="
                                background: #666;
                                border: none;
                                color: #fff;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 13px;
                            ">Cancel</button>
                            <button id="save-link-btn" style="
                                background: #4CAF50;
                                border: none;
                                color: #fff;
                                padding: 8px 16px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 13px;
                            ">Add Link</button>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);

                const nameInput = modal.querySelector('#link-name-input');
                const urlInput = modal.querySelector('#link-url-input');
                const saveBtn = modal.querySelector('#save-link-btn');
                const cancelBtn = modal.querySelector('#cancel-link-btn');

                // Focus on name input
                nameInput.focus();

                // Save link
                const saveLink = () => {
                    const name = nameInput.value.trim();
                    const url = urlInput.value.trim();

                    if (!name) {
                        this.core.NotificationSystem.show('Error', 'Please enter a link name', 'error');
                        nameInput.focus();
                        return;
                    }

                    if (!url) {
                        this.core.NotificationSystem.show('Error', 'Please enter a URL', 'error');
                        urlInput.focus();
                        return;
                    }

                    // Add http:// if no protocol specified
                    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;

                    linkGroup.links.push({
                        name: name,
                        url: formattedUrl,
                        id: Date.now().toString()
                    });

                    this.saveLinkGroups();
                    this.renderLinks(linkGroup);
                    modal.remove();
                    this.core.NotificationSystem.show('Added', 'Link added successfully!', 'success');
                };

                saveBtn.addEventListener('click', saveLink);
                cancelBtn.addEventListener('click', () => modal.remove());

                // Handle Enter key
                [nameInput, urlInput].forEach(input => {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') saveLink();
                    });
                });

                // Handle Escape key
                modal.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') modal.remove();
                });

                // Close on backdrop click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.remove();
                });
            },

            togglePin(linkGroup) {
                linkGroup.pinned = !linkGroup.pinned;
                this.saveLinkGroups();
                this.refreshDisplay();
                this.core.NotificationSystem.show(
                    'Updated',
                    `Link group ${linkGroup.pinned ? 'pinned' : 'unpinned'}`, 
                    'info'
                );
            },

            showColorPicker(linkGroup) {
                const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#607D8B', '#795548', '#009688'];
                
                const colorModal = document.createElement('div');
                colorModal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                colorModal.innerHTML = `
                    <div style="
                        background: #333;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #555;
                        color: #fff;
                    ">
                        <h3 style="margin: 0 0 16px 0;">Choose Color</h3>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                            ${colors.map(color => `
                                <button class="color-option" data-color="${color}" style="
                                    width: 40px;
                                    height: 40px;
                                    background: ${color};
                                    border: 2px solid ${color === linkGroup.color ? '#fff' : 'transparent'};
                                    border-radius: 4px;
                                    cursor: pointer;
                                "></button>
                            `).join('')}
                        </div>
                    </div>
                `;

                document.body.appendChild(colorModal);

                colorModal.querySelectorAll('.color-option').forEach(btn => {
                    btn.addEventListener('click', () => {
                        linkGroup.color = btn.dataset.color;
                        this.saveLinkGroups();
                        this.refreshDisplay();
                        colorModal.remove();
                        this.core.NotificationSystem.show('Updated', 'Color changed!', 'success');
                    });
                });

                colorModal.addEventListener('click', (e) => {
                    if (e.target === colorModal) colorModal.remove();
                });
            },

            removeLink(linkGroup, linkIndex) {
                const link = linkGroup.links[linkIndex];
                if (confirm(`Remove link "${link.name}"?`)) {
                    linkGroup.links.splice(linkIndex, 1);
                    this.saveLinkGroups();
                    this.renderLinks(linkGroup);
                    this.core.NotificationSystem.show('Removed', 'Link removed', 'info');
                }
            },

            deleteLinkGroup(linkGroup) {
                if (confirm(`Delete link group "${linkGroup.name}"? This will remove all links in this group.`)) {
                    this.linkGroups = this.linkGroups.filter(lg => lg.id !== linkGroup.id);
                    this.saveLinkGroups();
                    this.refreshDisplay();
                    this.core.NotificationSystem.show('Deleted', 'Link group removed', 'success');
                }
            },

            maketitleEditable(titleSpan, linkGroup) {
                // Don't edit if already editing
                if (titleSpan.querySelector('input')) return;

                const currentTitle = linkGroup.name;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentTitle;
                input.style.cssText = `
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid #555;
                    color: #fff;
                    font-size: 12px;
                    font-weight: bold;
                    padding: 2px 4px;
                    border-radius: 3px;
                    width: 150px;
                    font-family: inherit;
                `;

                // Replace title with input
                titleSpan.innerHTML = '';
                titleSpan.appendChild(input);
                input.focus();
                input.select();

                const saveTitle = () => {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== currentTitle) {
                        linkGroup.name = newTitle;
                        this.saveLinkGroups();
                        this.core.NotificationSystem.show('Updated', 'Title changed successfully', 'success');
                    }
                    titleSpan.innerHTML = `🔗 ${linkGroup.name}`;
                };

                const cancelEdit = () => {
                    titleSpan.innerHTML = `🔗 ${linkGroup.name}`;
                };

                // Save on Enter
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveTitle();
                    }
                });

                // Cancel on Escape
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        cancelEdit();
                    }
                });

                // Save on blur
                input.addEventListener('blur', saveTitle);

                // Prevent clicks from propagating
                input.addEventListener('click', (e) => e.stopPropagation());
            },

            // Public methods for external use
            addNewLinkGroup() {
                return this.createNewLinkGroup();
            },

            // Force refresh method for external calls
            forceRefresh() {
                this.loadLinkGroups();
                this.refreshDisplay();
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.LinkGroup = LinkGroupModule;

        console.log('🔗 LinkGroup module registered');
    });
})();
