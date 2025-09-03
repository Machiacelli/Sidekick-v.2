(function() {
    'use strict';

    // Initialize SidekickModules if it doesn't exist
    if (typeof window.SidekickModules === 'undefined') {
        window.SidekickModules = {};
    }

    const ForumTracker = {
        name: 'ForumTracker',
        version: '1.0.0',
        isActive: false,
        isExpanded: false,
        bookmarks: [],
        
        // Module lifecycle
        init() {
            console.log('📋 Initializing Forum Tracker Module v1.0.0...');
            this.loadBookmarks();
            this.addForumButtons();
            this.isActive = true;
            console.log('✅ Forum Tracker module initialized');
        },

        destroy() {
            this.removeForumPanel();
            this.removeForumButtons();
            this.isActive = false;
        },

        // Activate method for use by content module
        activate() {
            console.log('📋 Forum Tracker module activated!');
            
            // Show the forum tracker panel
            this.showForumPanel();
        },

        showForumPanel() {
            console.log('📋 Showing Forum Tracker panel...');
            
            let panel = document.getElementById('forum-tracker-panel');
            if (!panel) {
                this.createForumPanel();
                panel = document.getElementById('forum-tracker-panel');
            }
            
            if (panel) {
                panel.style.display = 'flex';
                // Refresh the bookmarks list
                const bookmarksContainer = document.getElementById('forum-bookmarks-container');
                if (bookmarksContainer) {
                    bookmarksContainer.innerHTML = this.renderBookmarksList();
                    this.attachBookmarkEventListeners();
                }
            }
        },

        // Make panel draggable (like Timer module)
        makeDraggable(element) {
            const header = element.querySelector('.forum-tracker-header');
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            header.addEventListener('mousedown', dragMouseDown);
            
            const self = this;
            
            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.addEventListener('mouseup', closeDragElement);
                document.addEventListener('mousemove', elementDrag);
            }
            
            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
            }
            
            function closeDragElement() {
                document.removeEventListener('mouseup', closeDragElement);
                document.removeEventListener('mousemove', elementDrag);
                // Save position after dragging
                self.savePanelState();
            }

            // Add resize observer to save size changes
            const resizeObserver = new ResizeObserver(() => {
                self.savePanelState();
            });
            resizeObserver.observe(element);
        },

        // Save panel position and size
        savePanelState() {
            const panel = document.getElementById('forum-tracker-panel');
            if (!panel) {
                console.log('⚠️ Panel not found when trying to save state');
                return;
            }

            const state = {
                x: parseInt(panel.style.left) || 20,
                y: parseInt(panel.style.top) || 20,
                width: panel.offsetWidth,
                height: panel.offsetHeight
            };

            console.log('💾 Saving panel state:', state);

            try {
                if (window.SidekickModules?.Core?.setData) {
                    window.SidekickModules.Core.setData('forumTrackerPanelState', state);
                    console.log('✅ Panel state saved successfully');
                } else {
                    console.log('⚠️ SidekickModules.Core.setData not available');
                }
            } catch (error) {
                console.error('❌ Failed to save panel state:', error);
            }
        },

        // Load panel position and size
        loadPanelState() {
            try {
                const saved = window.SidekickModules?.Core?.getData('forumTrackerPanelState');
                const result = saved || { x: 20, y: 20, width: 320, height: 420 };
                console.log('📖 Loading panel state:', result);
                return result;
            } catch (error) {
                console.error('❌ Failed to load panel state:', error);
                return { x: 20, y: 20, width: 320, height: 420 };
            }
        },

        // Load bookmarks from storage
        loadBookmarks() {
            try {
                const saved = window.SidekickModules?.Core?.getData('forumBookmarks');
                this.bookmarks = saved || [];
                console.log(`📋 Loaded ${this.bookmarks.length} forum bookmarks`);
            } catch (error) {
                console.error('❌ Failed to load forum bookmarks:', error);
                this.bookmarks = [];
            }
        },

        // Save bookmarks to storage
        saveBookmarks() {
            try {
                if (window.SidekickModules?.Core?.setData) {
                    window.SidekickModules.Core.setData('forumBookmarks', this.bookmarks);
                    console.log(`💾 Saved ${this.bookmarks.length} forum bookmarks`);
                }
            } catch (error) {
                console.error('❌ Failed to save forum bookmarks:', error);
            }
        },

        // Create the forum tracker panel in sidebar
        createForumPanel() {
            // Check if panel already exists
            if (document.getElementById('forum-tracker-panel')) {
                console.log('📋 Forum Tracker panel already exists');
                return;
            }

            // Load saved panel state
            const panelState = this.loadPanelState();

            // Create forum tracker panel in sidebar style (like LinkGroup module)
            const panel = document.createElement('div');
            panel.id = 'forum-tracker-panel';
            panel.className = 'sidebar-item';
            panel.style.cssText = `
                position: absolute;
                left: ${panelState.x}px;
                top: ${panelState.y}px;
                width: ${panelState.width}px;
                height: ${panelState.height}px;
                background: #222;
                border: 1px solid #444;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                flex-direction: column;
                min-width: 150px;
                min-height: 100px;
                max-width: 800px;
                max-height: 800px;
                z-index: 1000;
                resize: both;
                overflow: hidden;
            `;

            panel.innerHTML = `
                <div class="forum-tracker-header" style="
                    background: #2196F3;
                    border-bottom: 1px solid #555;
                    padding: 4px 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                    height: 24px;
                    flex-shrink: 0;
                    border-radius: 7px 7px 0 0;
                ">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <div class="forum-dropdown" style="position: relative; display: inline-block;">
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
                                min-width: 140px;
                                box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                                z-index: 1001;
                                border-radius: 4px;
                                border: 1px solid #555;
                                top: 100%;
                                left: 0;
                            ">
                                <button class="add-current-forum-btn" style="
                                    background: none;
                                    border: none;
                                    color: #fff;
                                    padding: 8px 12px;
                                    width: 100%;
                                    text-align: left;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">
                                    📋 Add Current Page
                                </button>
                                <button class="add-manual-forum-btn" style="
                                    background: none;
                                    border: none;
                                    color: #fff;
                                    padding: 8px 12px;
                                    width: 100%;
                                    text-align: left;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">
                                    ✏️ Manual Add
                                </button>
                                <button class="clear-all-forums-btn" style="
                                    background: none;
                                    border: none;
                                    color: #fff;
                                    padding: 8px 12px;
                                    width: 100%;
                                    text-align: left;
                                    cursor: pointer;
                                    font-size: 12px;
                                ">
                                    🗑️ Clear All
                                </button>
                            </div>
                        </div>
                        <span style="color: #fff; font-size: 12px; font-weight: bold;">📋 Forum Tracker</span>
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
                    " title="Close forum tracker">×</button>
                </div>
                <div class="forum-tracker-content" style="
                    padding: 8px;
                    background: #1a1a1a;
                    border-radius: 0 0 7px 7px;
                    flex: 1;
                    overflow-y: auto;
                ">
                    <div id="forum-bookmarks-container">
                        ${this.renderBookmarksList()}
                    </div>
                </div>
            `;

            // Add to sidebar content area (like LinkGroup module)
            const sidebarContent = document.getElementById('sidekick-content');
            if (sidebarContent) {
                sidebarContent.appendChild(panel);
                console.log('📋 Forum Tracker panel added to sidebar');
            } else {
                // Fallback: add to body
                document.body.appendChild(panel);
                console.log('📋 Forum Tracker panel added to body (fallback)');
            }

            // Add dragging functionality
            this.makeDraggable(panel);
            
            // Add resize observer to save size changes
            const self = this;
            const resizeObserver = new ResizeObserver(() => {
                self.savePanelState();
            });
            resizeObserver.observe(panel);
            
            // Attach panel event listeners (dropdown, close button) - only once
            this.attachPanelEventListeners();
            
            // Attach bookmark event listeners
            this.attachBookmarkEventListeners();
        },

        // Render the bookmarks list
        renderBookmarksList() {
            if (this.bookmarks.length === 0) {
                return `
                    <div style="
                        color: #888;
                        font-style: italic;
                        text-align: center;
                        padding: 12px;
                    ">
                        No forum bookmarks yet. Click the dropdown to add a new bookmark.
                    </div>
                `;
            }

            return this.bookmarks.map((bookmark, index) => `
                <div class="forum-bookmark" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px;
                    margin-bottom: 6px;
                    background: #333;
                    border-radius: 4px;
                    border: 1px solid #555;
                ">
                    <div style="flex: 1; margin-right: 8px; overflow: hidden;">
                        <div style="
                            color: #4FC3F7;
                            font-size: 13px;
                            font-weight: bold;
                            margin-bottom: 2px;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        " title="${bookmark.title}">
                            ${bookmark.title}
                        </div>
                        <div style="
                            color: #888;
                            font-size: 11px;
                            display: flex;
                            gap: 8px;
                            align-items: center;
                        ">
                            <span style="color: #FFC107;">${bookmark.section}</span>
                            <span>•</span>
                            <span>${this.formatDate(bookmark.lastVisit)}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 2px; flex-shrink: 0;">
                        <button class="visit-bookmark" data-url="${bookmark.url}" style="
                            background: #4CAF50;
                            border: none;
                            color: white;
                            padding: 2px 4px;
                            border-radius: 2px;
                            cursor: pointer;
                            font-size: 9px;
                            min-width: 20px;
                            height: 18px;
                        " title="Visit forum thread">
                            📖
                        </button>
                        <button class="copy-bookmark" data-url="${bookmark.url}" style="
                            background: #2196F3;
                            border: none;
                            color: white;
                            padding: 2px 4px;
                            border-radius: 2px;
                            cursor: pointer;
                            font-size: 9px;
                            min-width: 20px;
                            height: 18px;
                        " title="Copy link">
                            📋
                        </button>
                        <button class="remove-bookmark" data-index="${index}" style="
                            background: #f44336;
                            border: none;
                            color: white;
                            padding: 2px 4px;
                            border-radius: 2px;
                            cursor: pointer;
                            font-size: 9px;
                            min-width: 20px;
                            height: 18px;
                        " title="Remove bookmark">
                            ×
                        </button>
                    </div>
                </div>
            `).join('');
        },

        // Add panel event listeners (dropdown, close button) - called once
        attachPanelEventListeners() {
            const panel = document.getElementById('forum-tracker-panel');
            if (!panel) return;

            // Dropdown toggle
            const dropdownBtn = panel.querySelector('.dropdown-btn');
            const dropdownContent = panel.querySelector('.dropdown-content');
            
            if (dropdownBtn && dropdownContent) {
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = dropdownContent.style.display === 'block';
                    
                    // Hide all other dropdowns
                    document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                        dropdown.style.display = 'none';
                    });
                    
                    dropdownContent.style.display = isVisible ? 'none' : 'block';
                });
            }

            // Close button
            const closeBtn = panel.querySelector('.close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    panel.style.display = 'none';
                });
            }

            // Add current page button
            const addCurrentBtn = panel.querySelector('.add-current-forum-btn');
            if (addCurrentBtn) {
                addCurrentBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (dropdownContent) dropdownContent.style.display = 'none';
                    this.addCurrentPage();
                });
            }

            // Manual add button
            const manualAddBtn = panel.querySelector('.add-manual-forum-btn');
            if (manualAddBtn) {
                manualAddBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (dropdownContent) dropdownContent.style.display = 'none';
                    this.showManualAddDialog();
                });
            }

            // Clear all button
            const clearBtn = panel.querySelector('.clear-all-forums-btn');
            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (dropdownContent) dropdownContent.style.display = 'none';
                    this.clearAllBookmarks();
                });
            }

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                if (dropdownContent) {
                    dropdownContent.style.display = 'none';
                }
            });
        },

        // Add bookmark event listeners (for dynamic content) - called on refresh
        attachBookmarkEventListeners() {
            const panel = document.getElementById('forum-tracker-panel');
            if (!panel) return;

            // Bookmark actions (delegated events)
            const bookmarksContainer = panel.querySelector('#forum-bookmarks-container');
            if (bookmarksContainer) {
                // Remove existing listeners to prevent duplicates
                const newContainer = bookmarksContainer.cloneNode(true);
                bookmarksContainer.parentNode.replaceChild(newContainer, bookmarksContainer);
                
                // Add new listeners
                newContainer.addEventListener('click', (e) => {
                    if (e.target.classList.contains('visit-bookmark')) {
                        const url = e.target.dataset.url;
                        this.visitBookmark(url);
                    } else if (e.target.classList.contains('copy-bookmark')) {
                        const url = e.target.dataset.url;
                        this.copyBookmarkUrl(url);
                    } else if (e.target.classList.contains('remove-bookmark')) {
                        const index = parseInt(e.target.dataset.index);
                        this.removeBookmark(index);
                    }
                });
            }
        },

        // Legacy method for backward compatibility
        attachEventListeners() {
            this.attachBookmarkEventListeners();
        },

        // Add current forum page as bookmark
        addCurrentPage() {
            const url = window.location.href;
            
            // Check if we're on a forum page
            if (!url.includes('/forums.php')) {
                this.showNotification('⚠️ Not on a forum page', 'warning');
                return;
            }

            // Extract forum information
            const forumInfo = this.extractForumInfo();
            if (!forumInfo) {
                this.showNotification('❌ Could not extract forum information', 'error');
                return;
            }

            // Check if already bookmarked
            const existing = this.bookmarks.find(b => b.url === url);
            if (existing) {
                existing.lastVisit = Date.now();
                this.saveBookmarks();
                this.refreshBookmarksList();
                this.showNotification('✅ Updated existing bookmark', 'success');
                return;
            }

            // Add new bookmark
            const bookmark = {
                id: Date.now(),
                url: url,
                title: forumInfo.title,
                section: forumInfo.section,
                addedDate: Date.now(),
                lastVisit: Date.now(),
                notes: ''
            };

            this.bookmarks.unshift(bookmark);
            this.saveBookmarks();
            this.refreshBookmarksList();
            this.showNotification('✅ Forum bookmark added', 'success');
        },

        // Extract forum information from current page
        extractForumInfo() {
            try {
                console.log('🔍 Extracting forum info from:', window.location.href);
                
                // Try to get thread title from various page elements
                let title = 'Forum Thread';
                
                // Common selectors for forum thread titles in Torn
                const titleSelectors = [
                    // Torn-specific selectors
                    '.content-wrapper h4',
                    '.forum-thread h4',
                    '.title___ h4',
                    '.content-title h4',
                    '.content-wrapper .title',
                    '.forum-content h4',
                    '.thread-title h4',
                    
                    // Generic fallbacks
                    'h4[class*="title"]',
                    '.forum-thread-title',
                    '.title___',
                    'h3',
                    'h4', 
                    '[class*="title"]',
                    '.content-title',
                    '.thread-title',
                    'h1',
                    'h2'
                ];
                
                for (const selector of titleSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        title = element.textContent.trim();
                        console.log(`📋 Found title with selector "${selector}":`, title);
                        break;
                    }
                }
                
                // If still no title, try to extract from page title
                if (title === 'Forum Thread' && document.title) {
                    const pageTitle = document.title.replace('TORN - ', '').replace('Torn - ', '').trim();
                    if (pageTitle && pageTitle !== 'TORN' && pageTitle !== 'Torn') {
                        title = pageTitle;
                        console.log('📋 Using page title:', title);
                    }
                }
                
                // Last resort: scan for any text that looks like a thread title
                if (title === 'Forum Thread') {
                    console.log('📋 Last resort: scanning for thread-like text');
                    const possibleTitles = document.querySelectorAll('h1, h2, h3, h4, h5, .title, .heading, [class*="title"], [class*="thread"]');
                    for (let element of possibleTitles) {
                        const text = element.textContent.trim();
                        if (text.length > 10 && text.length < 200 && !text.toLowerCase().includes('forum') && !text.toLowerCase().includes('torn')) {
                            title = text;
                            console.log('📋 Found potential title:', title);
                            break;
                        }
                    }
                }
                
                // Clean up the title
                title = title.replace(/^\s*[-•]\s*/, '').trim(); // Remove leading bullets/dashes
                
                // Try to determine forum section from URL or breadcrumbs
                let section = 'Forums';
                
                // Extract from URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const forumId = urlParams.get('f');
                const threadId = urlParams.get('t');
                
                console.log('🔍 URL params - Forum ID:', forumId, 'Thread ID:', threadId);
                
                // Try breadcrumbs first
                const breadcrumbSelectors = [
                    '.breadcrumb a',
                    'nav a',
                    '[class*="breadcrumb"] a',
                    '.forum-nav a',
                    'a[href*="forums.php"]'
                ];
                
                for (const selector of breadcrumbSelectors) {
                    const breadcrumbs = document.querySelectorAll(selector);
                    for (let crumb of breadcrumbs) {
                        const text = crumb.textContent.trim();
                        console.log('🔍 Checking breadcrumb:', text);
                        if (text.length > 3 && !text.includes('Home') && !text.includes('Forum') && text !== 'Forums') {
                            section = text;
                            console.log('📋 Found section from breadcrumb:', section);
                            break;
                        }
                    }
                    if (section !== 'Forums') break;
                }
                
                // Forum ID mapping for common sections
                const forumSections = {
                    '1': 'General Discussion',
                    '2': 'Game Discussion', 
                    '3': 'Guides & Tutorials',
                    '4': 'Help & Support',
                    '5': 'Bug Reports',
                    '15': 'Trade Chat',
                    '19': 'Faction Forums'
                };
                
                if (forumId && forumSections[forumId]) {
                    section = forumSections[forumId];
                    console.log('📋 Found section from forum ID:', section);
                }

                const result = {
                    title: title.length > 60 ? title.substring(0, 60) + '...' : title,
                    section: section
                };
                
                console.log('📋 Final forum info:', result);
                return result;
            } catch (error) {
                console.error('Error extracting forum info:', error);
                return {
                    title: 'Forum Thread',
                    section: 'Forums'
                };
            }
        },

        // Show manual add dialog
        showManualAddDialog() {
            const url = prompt('Enter forum thread URL:');
            if (!url) return;

            if (!url.includes('torn.com/forums.php')) {
                this.showNotification('⚠️ Please enter a valid Torn forum URL', 'warning');
                return;
            }

            const title = prompt('Enter a title for this bookmark:') || 'Manual Bookmark';
            const section = prompt('Enter forum section (optional):') || 'Forums';

            const bookmark = {
                id: Date.now(),
                url: url,
                title: title.length > 50 ? title.substring(0, 50) + '...' : title,
                section: section,
                addedDate: Date.now(),
                lastVisit: 0,
                notes: ''
            };

            this.bookmarks.unshift(bookmark);
            this.saveBookmarks();
            this.refreshBookmarksList();
            this.showNotification('✅ Manual bookmark added', 'success');
        },

        // Visit a bookmarked forum
        visitBookmark(url) {
            // Update last visit time
            const bookmark = this.bookmarks.find(b => b.url === url);
            if (bookmark) {
                bookmark.lastVisit = Date.now();
                this.saveBookmarks();
                this.refreshBookmarksList();
            }

            // Open in new tab or current window
            window.open(url, '_blank');
        },

        // Copy bookmark URL to clipboard
        copyBookmarkUrl(url) {
            navigator.clipboard.writeText(url).then(() => {
                this.showNotification('📋 URL copied to clipboard', 'success');
            }).catch(() => {
                this.showNotification('❌ Failed to copy URL', 'error');
            });
        },

        // Remove a bookmark
        removeBookmark(index) {
            if (confirm('Remove this forum bookmark?')) {
                this.bookmarks.splice(index, 1);
                this.saveBookmarks();
                this.refreshBookmarksList();
                this.showNotification('✅ Bookmark removed', 'success');
            }
        },

        // Clear all bookmarks
        clearAllBookmarks() {
            if (confirm('Clear all forum bookmarks? This cannot be undone.')) {
                this.bookmarks = [];
                this.saveBookmarks();
                this.refreshBookmarksList();
                this.showNotification('✅ All bookmarks cleared', 'success');
            }
        },

        // Refresh the bookmarks list display
        refreshBookmarksList() {
            const listContainer = document.getElementById('forum-bookmarks-container');
            if (listContainer) {
                listContainer.innerHTML = this.renderBookmarksList();
                // Re-attach only bookmark event listeners after refreshing content
                this.attachBookmarkEventListeners();
            }
        },

        // Format date for display
        formatDate(timestamp) {
            if (!timestamp) return 'Never';
            
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now - date;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            
            return date.toLocaleDateString();
        },

        // Show notification
        showNotification(message, type = 'info') {
            if (window.SidekickModules?.UI?.showNotification) {
                window.SidekickModules.UI.showNotification(message, type);
            } else {
                console.log(`📋 Forum Tracker: ${message}`);
            }
        },

        // Add buttons to forum pages
        addForumButtons() {
            // Only add buttons if we're on a forum page
            if (!window.location.href.includes('/forums.php')) return;

            setTimeout(() => {
                this.addTrackButtonToForumPage();
            }, 1000); // Wait for page to load
        },

        // Add "Track Thread" button to forum pages
        addTrackButtonToForumPage() {
            try {
                // Look for a good place to add the button
                const targetArea = document.querySelector('.content-wrapper') || 
                                 document.querySelector('.forum-content') ||
                                 document.querySelector('body');

                if (!targetArea || document.getElementById('forum-track-button')) return;

                const trackButton = document.createElement('div');
                trackButton.id = 'forum-track-button';
                trackButton.style.cssText = `
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    z-index: 1000;
                    background: #2196F3;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                `;
                trackButton.innerHTML = '📋 Track Thread';
                trackButton.title = 'Add this thread to Forum Tracker';

                trackButton.addEventListener('click', () => {
                    this.addCurrentPage();
                });

                trackButton.addEventListener('mouseenter', () => {
                    trackButton.style.background = '#1976D2';
                    trackButton.style.transform = 'scale(1.05)';
                });

                trackButton.addEventListener('mouseleave', () => {
                    trackButton.style.background = '#2196F3';
                    trackButton.style.transform = 'scale(1)';
                });

                document.body.appendChild(trackButton);
            } catch (error) {
                console.error('Error adding forum track button:', error);
            }
        },

        // Remove forum buttons
        removeForumButtons() {
            const trackButton = document.getElementById('forum-track-button');
            if (trackButton) {
                trackButton.remove();
            }
        },

        // Remove the panel
        removeForumPanel() {
            if (window.SidekickModules?.UI?.removePanel) {
                window.SidekickModules.UI.removePanel('forum-tracker');
            }
        },

        // Add styles for forum tracker
        addForumTrackerStyles() {
            if (document.getElementById('forum-tracker-styles')) return;

            const styles = document.createElement('style');
            styles.id = 'forum-tracker-styles';
            styles.textContent = `
                #forum-tracker-content {
                    padding: 10px;
                }

                .forum-tracker-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #333;
                    padding-bottom: 8px;
                }

                .forum-tracker-header h4 {
                    margin: 0;
                    color: #2196F3;
                }

                .forum-bookmark {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    margin: 4px 0;
                    background: rgba(255,255,255,0.05);
                    border-radius: 4px;
                    border-left: 3px solid #2196F3;
                }

                .bookmark-info {
                    flex: 1;
                    min-width: 0;
                }

                .bookmark-title {
                    font-weight: bold;
                    color: #fff;
                    font-size: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .bookmark-meta {
                    font-size: 10px;
                    color: #aaa;
                    margin-top: 2px;
                }

                .forum-section {
                    color: #2196F3;
                    margin-right: 8px;
                }

                .last-visit {
                    color: #888;
                }

                .bookmark-actions {
                    display: flex;
                    gap: 4px;
                    margin-left: 8px;
                }

                .sk-btn-tiny {
                    padding: 2px 6px;
                    font-size: 10px;
                    min-width: unset;
                }

                .no-bookmarks {
                    text-align: center;
                    color: #888;
                    padding: 20px 10px;
                    font-size: 12px;
                }

                .forum-tracker-footer {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    margin-top: 10px;
                    padding-top: 8px;
                    border-top: 1px solid #333;
                }

                .forum-tracker-footer .sk-btn-small {
                    flex: 1;
                    padding: 6px;
                    font-size: 10px;
                }
            `;

            document.head.appendChild(styles);
        }
    };

    // Register the module
    window.SidekickModules.ForumTracker = ForumTracker;
    console.log('📋 Forum Tracker module registered');

})();
