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
                const bookmarksList = document.getElementById('forum-bookmarks-list');
                if (bookmarksList) {
                    bookmarksList.innerHTML = this.renderBookmarksList();
                    this.attachEventListeners();
                }
            }
        },

        // Make panel draggable (like Timer module)
        makeDraggable(element) {
            const header = element.querySelector('.forum-tracker-header');
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            header.addEventListener('mousedown', dragMouseDown);
            
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

            // Create forum tracker panel in sidebar style (like Timer module)
            const panel = document.createElement('div');
            panel.id = 'forum-tracker-panel';
            panel.className = 'sidebar-item';
            panel.style.cssText = `
                position: absolute;
                left: 10px;
                top: 10px;
                width: 300px;
                height: 400px;
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                min-width: 250px;
                min-height: 200px;
                z-index: 1000;
                resize: both;
                overflow: hidden;
            `;

            panel.innerHTML = `
                <div class="forum-tracker-header" style="
                    background: #333;
                    border-bottom: 1px solid #555;
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: move;
                    height: 32px;
                    flex-shrink: 0;
                    border-radius: 7px 7px 0 0;
                ">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px;">📋</span>
                        <span style="color: #2196F3; font-weight: bold; font-size: 14px;">Forum Tracker</span>
                    </div>
                    <div style="display: flex; gap: 4px;">
                        <button id="add-forum-bookmark" style="
                            background: #4CAF50;
                            border: none;
                            color: white;
                            padding: 4px 8px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 10px;
                            font-weight: bold;
                        ">+ Add Current</button>
                        <button class="close-btn" style="
                            background: #f44336;
                            border: none;
                            color: white;
                            padding: 2px 6px;
                            border-radius: 3px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: bold;
                        ">×</button>
                    </div>
                </div>
                <div id="forum-tracker-content" style="
                    flex: 1;
                    padding: 12px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                ">
                    <div id="forum-bookmarks-list">
                        ${this.renderBookmarksList()}
                    </div>
                    <div class="forum-tracker-footer" style="
                        display: flex;
                        justify-content: space-between;
                        gap: 8px;
                        margin-top: auto;
                        padding-top: 8px;
                        border-top: 1px solid #333;
                    ">
                        <button id="add-manual-bookmark" style="
                            flex: 1;
                            padding: 6px;
                            font-size: 10px;
                            background: #2196F3;
                            border: none;
                            color: white;
                            border-radius: 4px;
                            cursor: pointer;
                        ">+ Manual Add</button>
                        <button id="clear-forum-bookmarks" style="
                            flex: 1;
                            padding: 6px;
                            font-size: 10px;
                            background: #f44336;
                            border: none;
                            color: white;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Clear All</button>
                    </div>
                </div>
            `;

            // Add to sidebar content area (like Timer module)
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
            
            // Attach event listeners
            this.attachEventListeners();
            
            // Add styles
            this.addForumTrackerStyles();
        },

        // Render the bookmarks list
        renderBookmarksList() {
            if (this.bookmarks.length === 0) {
                return '<div class="no-bookmarks">No forum bookmarks yet.<br><small>Visit a forum thread and click "+ Add Current"</small></div>';
            }

            return this.bookmarks.map((bookmark, index) => `
                <div class="forum-bookmark" data-index="${index}">
                    <div class="bookmark-info">
                        <div class="bookmark-title">${bookmark.title}</div>
                        <div class="bookmark-meta">
                            <span class="forum-section">${bookmark.section}</span>
                            <span class="last-visit">${this.formatDate(bookmark.lastVisit)}</span>
                        </div>
                    </div>
                    <div class="bookmark-actions">
                        <button class="visit-bookmark sk-btn sk-btn-tiny" data-url="${bookmark.url}">Visit</button>
                        <button class="remove-bookmark sk-btn sk-btn-tiny sk-btn-danger" data-index="${index}">×</button>
                    </div>
                </div>
            `).join('');
        },

        // Add event listeners
        attachEventListeners() {
            // Close button
            const closeBtn = document.querySelector('#forum-tracker-panel .close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    const panel = document.getElementById('forum-tracker-panel');
                    if (panel) {
                        panel.style.display = 'none';
                    }
                });
            }

            // Add current page button
            const addCurrentBtn = document.getElementById('add-forum-bookmark');
            if (addCurrentBtn) {
                addCurrentBtn.addEventListener('click', () => this.addCurrentPage());
            }

            // Manual add button
            const manualAddBtn = document.getElementById('add-manual-bookmark');
            if (manualAddBtn) {
                manualAddBtn.addEventListener('click', () => this.showManualAddDialog());
            }

            // Clear all button
            const clearBtn = document.getElementById('clear-forum-bookmarks');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => this.clearAllBookmarks());
            }

            // Bookmark actions (delegated events)
            const bookmarksList = document.getElementById('forum-bookmarks-list');
            if (bookmarksList) {
                bookmarksList.addEventListener('click', (e) => {
                    if (e.target.classList.contains('visit-bookmark')) {
                        const url = e.target.dataset.url;
                        this.visitBookmark(url);
                    } else if (e.target.classList.contains('remove-bookmark')) {
                        const index = parseInt(e.target.dataset.index);
                        this.removeBookmark(index);
                    }
                });
            }
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
                // Try to get thread title from page
                const titleElement = document.querySelector('h4[class*="title"]') || 
                                   document.querySelector('.forum-thread-title') ||
                                   document.querySelector('h3') ||
                                   document.querySelector('h4');
                
                const title = titleElement ? titleElement.textContent.trim() : 'Forum Thread';
                
                // Try to determine forum section
                const breadcrumbs = document.querySelectorAll('.breadcrumb a, nav a');
                let section = 'Forums';
                
                for (let crumb of breadcrumbs) {
                    if (crumb.textContent.includes('Forum') && !crumb.textContent.includes('Home')) {
                        section = crumb.textContent.trim();
                        break;
                    }
                }

                return {
                    title: title.length > 50 ? title.substring(0, 50) + '...' : title,
                    section: section
                };
            } catch (error) {
                console.error('Error extracting forum info:', error);
                return null;
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
            const listContainer = document.getElementById('forum-bookmarks-list');
            if (listContainer) {
                listContainer.innerHTML = this.renderBookmarksList();
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
