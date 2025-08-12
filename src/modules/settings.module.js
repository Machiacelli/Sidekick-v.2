// ==UserScript==
// @name         Sidewinder Settings Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Settings and API management for Sidewinder sidebar
// @author       GitHub Copilot
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        none
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
        const { STORAGE_KEYS, saveState, loadState, NotificationSystem } = window.SidekickModules.Core;

        // === API SYSTEM ===
        const ApiSystem = {
            lastRequest: 0,
            
            async makeRequest(endpoint, retries = 3) {
                const apiKey = loadState(STORAGE_KEYS.API_KEY, '');
                if (!apiKey) {
                    throw new Error('API key not configured');
                }
                
                // Rate limiting - wait at least 1 second between requests
                const now = Date.now();
                const timeSinceLastRequest = now - this.lastRequest;
                if (timeSinceLastRequest < 1000) {
                    await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
                }
                
                this.lastRequest = Date.now();
                
                const url = `https://api.torn.com/${endpoint}?selections=&key=${apiKey}`;
                
                for (let attempt = 1; attempt <= retries; attempt++) {
                    try {
                        const response = await fetch(url);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        
                        const data = await response.json();
                        
                        if (data.error) {
                            throw new Error(data.error.error || 'API error');
                        }
                        
                        return data;
                    } catch (error) {
                        console.warn(`API request attempt ${attempt} failed:`, error);
                        if (attempt === retries) {
                            throw error;
                        }
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                }
            }
        };

        // === SETTINGS MODAL ===
        const SettingsManager = {
            createModal() {
                console.log('🔧 showSettingsModal called!');
                    
                const modal = this.createCenteredModal('⚙️ API Settings', `
                    <div style="padding: 20px;">
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; color: #aaa; font-weight: bold; font-size: 14px;">Torn API Key:</label>
                            <input type="text" id="api-key-input" value="${loadState(STORAGE_KEYS.API_KEY, '')}" 
                                   placeholder="Enter your Torn API key here..."
                                   style="width: 100%; background: #333; border: 1px solid #555; color: #fff; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; box-sizing: border-box;">
                            <div style="font-size: 12px; color: #666; margin-top: 6px;">
                                Get your API key from: <a href="https://www.torn.com/preferences.php#tab=api" target="_blank" style="color: #4CAF50; text-decoration: none;">Torn Preferences</a>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                            <button id="test-api-btn" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #2196F3, #1976D2); border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">
                                🧪 Test API Connection
                            </button>
                            <button id="refresh-price-btn" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #4CAF50, #388E3C); border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">
                                🔄 Refresh Points Price
                            </button>
                        </div>
                        
                        <div style="border-top: 1px solid #444; margin: 20px 0; padding-top: 20px;">
                            <h4 style="color: #aaa; margin: 0 0 12px 0; font-size: 14px; font-weight: bold;">Data Management</h4>
                            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                                <button id="export-data-btn" style="flex: 1; padding: 10px; background: #555; border: 1px solid #666; color: white; border-radius: 6px; cursor: pointer; font-size: 13px;">📤 Export Data</button>
                                <button id="import-data-btn" style="flex: 1; padding: 10px; background: #555; border: 1px solid #666; color: white; border-radius: 6px; cursor: pointer; font-size: 13px;">📥 Import Data</button>
                            </div>
                            <button id="clear-all-data-btn" style="width: 100%; padding: 10px; background: #d32f2f; border: 1px solid #f44336; color: white; border-radius: 6px; cursor: pointer; font-size: 13px;">🗑️ Clear All Data</button>
                        </div>
                    </div>
                `, 'settings_modal');
                
                // Add event listeners to buttons after modal is created
                setTimeout(() => {
                    const testBtn = document.getElementById('test-api-btn');
                    const refreshBtn = document.getElementById('refresh-price-btn');
                    const exportBtn = document.getElementById('export-data-btn');
                    const importBtn = document.getElementById('import-data-btn');
                    const clearBtn = document.getElementById('clear-all-data-btn');
                    
                    if (testBtn) testBtn.addEventListener('click', () => this.testApiConnection());
                    if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshPointsPrice());
                    if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());
                    if (importBtn) importBtn.addEventListener('click', () => this.importData());
                    if (clearBtn) clearBtn.addEventListener('click', () => this.clearAllData());
                }, 100);
                
                console.log('✅ Settings modal created successfully!');
            },

            createCenteredModal(title, content, key) {
                // Create overlay
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    height: 100% !important;
                    background: rgba(0, 0, 0, 0.7) !important;
                    z-index: 99999999 !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                `;
                
                // Create modal
                const modal = document.createElement('div');
                modal.style.cssText = `
                    background: linear-gradient(145deg, #2a2a2a, #1f1f1f) !important;
                    border: 1px solid #444 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
                    color: #fff !important;
                    font-family: 'Segoe UI', sans-serif !important;
                    min-width: 400px !important;
                    max-width: 600px !important;
                    max-height: 80vh !important;
                    overflow-y: auto !important;
                `;
                
                // Modal header
                const header = document.createElement('div');
                header.style.cssText = `
                    background: linear-gradient(135deg, #333, #444) !important;
                    padding: 16px 20px !important;
                    border-radius: 12px 12px 0 0 !important;
                    border-bottom: 1px solid #555 !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    font-weight: 600 !important;
                    font-size: 16px !important;
                `;
                
                header.innerHTML = `
                    <span>${title}</span>
                    <button style="background: none; border: none; color: #ccc; font-size: 20px; cursor: pointer; padding: 0; line-height: 1;">×</button>
                `;
                
                // Modal content
                const contentDiv = document.createElement('div');
                contentDiv.innerHTML = content;
                
                modal.appendChild(header);
                modal.appendChild(contentDiv);
                overlay.appendChild(modal);
                
                // Close button functionality
                const closeBtn = header.querySelector('button');
                closeBtn.addEventListener('click', () => {
                    overlay.remove();
                });
                
                // Close on overlay click
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        overlay.remove();
                    }
                });
                
                document.body.appendChild(overlay);
                
                return overlay;
            },

            async testApiConnection() {
                console.log('🧪 testApiConnection called!');
                
                const input = document.getElementById('api-key-input');
                if (!input || !input.value.trim()) {
                    NotificationSystem.show('Error', 'Please enter an API key first', 'error');
                    return;
                }
                
                const apiKey = input.value.trim();
                
                // Save the API key first
                saveState(STORAGE_KEYS.API_KEY, apiKey);
                
                try {
                    NotificationSystem.show('Testing', 'Testing API connection...', 'info');
                    
                    const response = await ApiSystem.makeRequest('user?selections=basic');
                    
                    if (response && response.name) {
                        NotificationSystem.show('Success', `Connected as ${response.name} [${response.player_id}]`, 'info');
                        console.log('✅ API test successful:', response);
                    } else {
                        NotificationSystem.show('Error', 'Invalid API response format', 'error');
                    }
                } catch (error) {
                    console.error('❌ API test failed:', error);
                    NotificationSystem.show('Error', `API test failed: ${error.message}`, 'error');
                }
            },

            async refreshPointsPrice() {
                console.log('🔄 refreshPointsPrice called!');
                
                const apiKey = loadState(STORAGE_KEYS.API_KEY, '');
                if (!apiKey) {
                    NotificationSystem.show('Error', 'Please set your API key first', 'error');
                    return;
                }
                
                try {
                    NotificationSystem.show('Refreshing', 'Fetching latest points price...', 'info');
                    
                    const response = await ApiSystem.makeRequest('market?selections=pointsmarket');
                    
                    if (response && response.pointsmarket && response.pointsmarket.length > 0) {
                        const price = response.pointsmarket[0].cost;
                        saveState('points_price', price);
                        NotificationSystem.show('Success', `Points price updated: $${price.toLocaleString()}`, 'info');
                        
                        // Update display if points monitor is active
                        if (window.TopBarPointsMonitor) {
                            window.TopBarPointsMonitor.currentPrice = price;
                            window.TopBarPointsMonitor.updateDisplay();
                        }
                    } else {
                        NotificationSystem.show('Warning', 'No points market data available', 'warning');
                    }
                } catch (error) {
                    console.error('❌ Points price refresh failed:', error);
                    NotificationSystem.show('Error', `Failed to refresh price: ${error.message}`, 'error');
                }
            },

            exportData() {
                const data = {
                    pages: loadState(STORAGE_KEYS.SIDEBAR_PAGES, []),
                    settings: {
                        apiKey: loadState(STORAGE_KEYS.API_KEY, ''),
                        sidebarState: loadState(STORAGE_KEYS.SIDEBAR_STATE, 'visible')
                    },
                    timestamp: Date.now()
                };
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `sidewinder-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                NotificationSystem.show('Exported', 'Data exported successfully', 'info');
            },

            importData() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const data = JSON.parse(e.target.result);
                                
                                if (data.pages) {
                                    saveState(STORAGE_KEYS.SIDEBAR_PAGES, data.pages);
                                }
                                
                                if (data.settings) {
                                    if (data.settings.apiKey) {
                                        saveState(STORAGE_KEYS.API_KEY, data.settings.apiKey);
                                    }
                                    if (data.settings.sidebarState) {
                                        saveState(STORAGE_KEYS.SIDEBAR_STATE, data.settings.sidebarState);
                                    }
                                }
                                
                                NotificationSystem.show('Imported', 'Data imported successfully. Refresh to see changes.', 'info');
                            } catch (error) {
                                NotificationSystem.show('Error', 'Invalid backup file format', 'error');
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            },

            clearAllData() {
                if (confirm('Are you sure you want to clear all Sidekick data? This cannot be undone!')) {
                    if (window.SidekickModules?.Core?.clearAllData) {
                        window.SidekickModules.Core.clearAllData();
                        
                        // Close settings modal
                        const modal = document.querySelector('[id*="settings_modal"]');
                        if (modal) modal.remove();
                        
                        // Suggest page reload
                        if (confirm('Data cleared! Reload the page to reset completely?')) {
                            window.location.reload();
                        }
                    } else {
                        NotificationSystem.show('Error', 'Clear data function not available', 'error');
                    }
                }
            }
        };

        // === GLOBAL WINDOW FUNCTIONS ===
        window.showSettingsModal = function() {
            SettingsManager.createModal();
        };

        window.saveApiKey = function() {
            console.log('💾 saveApiKey called!');
            const input = document.getElementById('api-key-input');
            if (input && input.value.trim()) {
                const newApiKey = input.value.trim();
                saveState(STORAGE_KEYS.API_KEY, newApiKey);
                
                // Notify clock module of API key change
                if (window.SidekickModules?.Clock?.updateApiKey) {
                    window.SidekickModules.Clock.updateApiKey(newApiKey);
                }
                
                NotificationSystem.show('Saved', 'API key saved successfully!', 'info');
                console.log('✅ API key saved');
                
                // Close modal
                const modal = input.closest('[style*="position: fixed"]');
                if (modal) modal.remove();
            } else {
                NotificationSystem.show('Error', 'Please enter a valid API key', 'error');
            }
        };

        // Export to global scope
        window.SidekickModules.Settings = SettingsManager;
        window.SidekickModules.Api = ApiSystem;

        console.log('✅ Settings module loaded');
    });

})();
