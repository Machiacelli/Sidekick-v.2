// ==UserScript==
// @name         Sidekick Xanax Viewer Module
// @version      1.0.0
// @description  View individual Xanax usage on Faction and Profile pages with settings integration
// @author       Machiacelli
// @match        https://www.torn.com/*
// @grant        none
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
        const { STORAGE_KEYS, saveState, loadState } = window.SidekickModules.Core;

        const XanaxViewerModule = {
            name: 'XanaxViewer',
            version: '1.0.0',
            isActive: false,
            myInfo: null,
            
            // Storage keys for Xanax Viewer
            XANAX_STORAGE_KEYS: {
                ENABLED: 'xanax_viewer_enabled',
                API_KEY: 'xanax_viewer_api_key',
                AUTO_LIMIT: 'xanax_viewer_auto_limit',
                SHOW_RELATIVE: 'xanax_viewer_show_relative',
                CACHE: 'xanax_viewer_cache'
            },

            // Get settings with defaults
            getSettings() {
                return {
                    enabled: loadState(this.XANAX_STORAGE_KEYS.ENABLED, false),
                    apiKey: loadState(this.XANAX_STORAGE_KEYS.API_KEY, ''),
                    autoLimit: loadState(this.XANAX_STORAGE_KEYS.AUTO_LIMIT, 0),
                    showRelative: loadState(this.XANAX_STORAGE_KEYS.SHOW_RELATIVE, false)
                };
            },

            // Save settings
            saveSettings(settings) {
                saveState(this.XANAX_STORAGE_KEYS.ENABLED, settings.enabled);
                saveState(this.XANAX_STORAGE_KEYS.API_KEY, settings.apiKey);
                saveState(this.XANAX_STORAGE_KEYS.AUTO_LIMIT, settings.autoLimit);
                saveState(this.XANAX_STORAGE_KEYS.SHOW_RELATIVE, settings.showRelative);
            },

            // Get cache
            getCache() {
                const cache = loadState(this.XANAX_STORAGE_KEYS.CACHE, null);
                return cache ? JSON.parse(cache) : {};
            },

            // Save cache
            saveCache(cache) {
                saveState(this.XANAX_STORAGE_KEYS.CACHE, JSON.stringify(cache));
            },

            // Clear cache
            clearCache() {
                saveState(this.XANAX_STORAGE_KEYS.CACHE, JSON.stringify({}));
            },

            async init() {
                console.log('💊 Initializing Xanax Viewer Module v1.0.0...');
                
                const settings = this.getSettings();
                
                if (!settings.enabled) {
                    console.log('💊 Xanax Viewer is disabled in settings');
                    return;
                }

                if (!settings.apiKey) {
                    console.warn('⚠️ Xanax Viewer: No API key configured');
                    return;
                }

                this.isActive = true;
                
                // Inject CSS
                this.injectStyles();
                
                // Fetch own stats first
                try {
                    const data = await this.fetchTornAPI('user', 'basic,personalstats', settings.apiKey);
                    
                    if (data.error) {
                        console.error('❌ Xanax Viewer API Error:', data.error.error);
                        this.showError(`API Error: ${data.error.error}`);
                        return;
                    }
                    
                    this.myInfo = data;
                    console.log('✅ Xanax Viewer: Loaded user stats');
                    
                    // Initialize based on current page
                    this.initializeForPage(settings);
                    
                } catch (error) {
                    console.error('❌ Xanax Viewer initialization failed:', error);
                    this.showError('Failed to load user stats');
                }
            },

            initializeForPage(settings) {
                const pageName = this.getPageName();
                
                if (pageName === 'profiles.php') {
                    this.initProfilePage(settings);
                } else if (pageName === 'factions.php') {
                    this.initFactionPage(settings);
                }
            },

            initProfilePage(settings) {
                const uid = this.getUIDFromURL();
                if (!uid) return;

                this.waitForElement('#profileroot .profile-buttons .title-black').then(selector => {
                    this.getUserStats(uid, settings.apiKey).then(stats => {
                        const xanDisplay = settings.showRelative 
                            ? stats.xantaken - this.myInfo.personalstats.xantaken 
                            : stats.xantaken;
                        
                        const existingXan = selector.querySelector('.xanaxviewer-profile');
                        if (!existingXan) {
                            selector.insertAdjacentHTML('beforeend', `
                                <span class="xanaxviewer-profile">${xanDisplay.toLocaleString()} Xanax</span>
                            `);
                            selector.insertAdjacentHTML('beforeend', `
                                <span class="xanaxviewer-profile">${stats.refills.toLocaleString()} Refills</span>
                            `);
                        }
                    });
                });
            },

            initFactionPage(settings) {
                let profiles = {};

                this.waitForElement('.members-list .positionCol___Lk6E4').then(() => {
                    this.delay(250).then(() => {
                        // Add header column
                        const header = document.querySelector('.faction-info-wrap .table-header');
                        if (header && !header.querySelector('.xanaxviewer_header')) {
                            header.insertAdjacentHTML('beforeend', `
                                <li tabindex="0" class="table-cell xanaxviewer_header torn-divider divider-vertical c-pointer">
                                    Xanax<div class="sortIcon___ALgdi asc___bb84w"></div>
                                </li>
                            `);
                        }

                        // Add data to each row
                        const rows = document.querySelectorAll('.faction-info-wrap .table-body .table-row');
                        rows.forEach(row => {
                            if (row.querySelector('.xanaxviewer_header')) return; // Already processed

                            const link = row.querySelectorAll('a')[1];
                            if (!link) return;
                            
                            const uid = link.getAttribute('href').split('=').slice(-1)[0];
                            const cache = this.getCache();
                            const info = cache[uid];

                            if (info) {
                                const xanDisplay = settings.showRelative 
                                    ? info.xantaken - this.myInfo.personalstats.xantaken 
                                    : info.xantaken;
                                row.insertAdjacentHTML('beforeend', `
                                    <div class="table-cell xanaxviewer_header">
                                        <a class="xanaxviewer_refresh" data-uid="${uid}">${xanDisplay.toLocaleString()}</a>
                                    </div>
                                `);
                            } else {
                                row.insertAdjacentHTML('beforeend', `
                                    <div class="table-cell xanaxviewer_header">
                                        <a class="xanaxviewer_refresh" data-uid="${uid}">⟳</a>
                                    </div>
                                `);
                            }

                            // Track by level for auto-refresh
                            const levelEl = row.querySelector('.lvl');
                            if (levelEl) {
                                const level = levelEl.textContent.trim();
                                if (!profiles[level]) profiles[level] = [];
                                profiles[level].push(row);
                            }
                        });

                        // Setup click handlers for refresh buttons
                        document.querySelectorAll('.xanaxviewer_refresh').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                this.updateViewer(btn, settings);
                            });
                        });

                        // Auto-refresh closest levels
                        if (settings.autoLimit > 0) {
                            this.autoRefreshFaction(profiles, settings);
                        }
                    });
                });
            },

            async autoRefreshFaction(profiles, settings) {
                const memberCountEl = document.querySelector('.members-list .c-pointer span');
                if (!memberCountEl) return;

                let memberCount = memberCountEl.innerHTML.split('/')[0].replace(/ /g, '');
                memberCount = parseInt(memberCount);

                let autoLimit = Math.min(settings.autoLimit, memberCount);
                if (autoLimit <= 0) return;

                let toBeRefreshed = [];
                let refreshed = 0;
                let level = this.myInfo.level;
                let cursorLevel = level;
                let generation = 0;
                let nextMinus = true;

                // Find profiles closest to our level
                while (refreshed < autoLimit) {
                    cursorLevel = nextMinus ? level + generation : level - generation;
                    
                    if (nextMinus) generation++;
                    nextMinus = !nextMinus;

                    if (profiles[cursorLevel]) {
                        for (const row of profiles[cursorLevel]) {
                            if (refreshed >= autoLimit) break;
                            
                            toBeRefreshed.push(row);
                            const cell = row.querySelector('.xanaxviewer_header');
                            if (cell) cell.innerHTML = '<a class="xanaxviewer_refresh">⏳</a>';
                            refreshed++;
                        }
                    }
                }

                // Refresh sequentially with delay
                for (let i = 0; i < toBeRefreshed.length; i++) {
                    const row = toBeRefreshed[i];
                    const btn = row.querySelector('.xanaxviewer_refresh');
                    if (btn) {
                        await this.updateViewer(btn, settings);
                        await this.delay(1000); // 1 second between requests
                    }
                }
            },

            async updateViewer(element, settings) {
                const uid = element.getAttribute('data-uid');
                if (!uid) return;

                try {
                    const stats = await this.getUserStats(uid, settings.apiKey);
                    const xanDisplay = settings.showRelative 
                        ? stats.xantaken - this.myInfo.personalstats.xantaken 
                        : stats.xantaken;
                    
                    element.textContent = xanDisplay.toLocaleString();
                } catch (error) {
                    console.error('❌ Failed to update viewer:', error);
                    element.textContent = '✖';
                }
            },

            async getUserStats(uid, apiKey) {
                const data = await this.fetchTornAPI(`user/${uid}`, 'personalstats', apiKey);
                
                if (data.error) {
                    throw new Error(data.error.error);
                }

                // Cache the data
                const cache = this.getCache();
                cache[uid] = {
                    xantaken: data.personalstats.xantaken,
                    cantaken: data.personalstats.cantaken,
                    lsdtaken: data.personalstats.lsdtaken,
                    refills: data.personalstats.refills,
                    updated: Date.now()
                };
                this.saveCache(cache);

                return data.personalstats;
            },

            async fetchTornAPI(endpoint, selections, apiKey) {
                const url = `https://api.torn.com/${endpoint}?selections=${selections}&key=${apiKey}&comment=sidekick_xanaxviewer`;
                const response = await fetch(url);
                return await response.json();
            },

            injectStyles() {
                GM_addStyle(`
                    .xanaxviewer_header { 
                        width: 6%; 
                    }
                    .xanaxviewer-profile { 
                        float: right; 
                        padding-right: 10px; 
                        color: #ff9800; 
                        font-weight: bold;
                    }
                    .xanaxviewer_refresh {
                        cursor: pointer;
                        color: #4CAF50;
                        text-decoration: none;
                    }
                    .xanaxviewer_refresh:hover {
                        color: #66BB6A;
                        text-decoration: underline;
                    }
                    .member-icons { 
                        width: 25% !important; 
                    }
                `);
            },

            showError(message) {
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #d32f2f;
                    color: white;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 999999;
                    font-family: 'Segoe UI', sans-serif;
                    font-size: 14px;
                `;
                errorDiv.innerHTML = `💊 Xanax Viewer: ${message}`;
                document.body.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 5000);
            },

            /* HELPER FUNCTIONS */
            getPageName() {
                const path = window.location.pathname;
                return path.split('/').pop();
            },

            getUIDFromURL() {
                const params = new URLSearchParams(window.location.search);
                return params.get('XID');
            },

            waitForElement(selector) {
                return new Promise(resolve => {
                    const el = document.querySelector(selector);
                    if (el) return resolve(el);

                    const observer = new MutationObserver(() => {
                        const el = document.querySelector(selector);
                        if (el) {
                            resolve(el);
                            observer.disconnect();
                        }
                    });

                    observer.observe(document.body, {
                        subtree: true,
                        childList: true
                    });
                });
            },

            delay(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
        };

        // Use the same GM_addStyle from global functions if available
        if (!window.GM_addStyle) {
            window.GM_addStyle = function(css) {
                const style = document.getElementById("GM_addStyleBy8626") || (function() {
                    const style = document.createElement('style');
                    style.type = 'text/css';
                    style.id = "GM_addStyleBy8626";
                    document.head.appendChild(style);
                    return style;
                })();
                const sheet = style.sheet;
                sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length);
            };
        }

        // Register module
        if (!window.SidekickModules) {
            window.SidekickModules = {};
        }
        window.SidekickModules.XanaxViewer = XanaxViewerModule;
        console.log('✅ Xanax Viewer Module registered');
    });
})();
