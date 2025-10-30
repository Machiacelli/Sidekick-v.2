// ==UserScript==
// @name         Sidekick Stock Ticker Module
// @namespace    http://tampermonkey.net/
// @version      1.9.0
// @description  CRITICAL FIX: Added size validation and reset option to prevent panel from becoming unusable
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        none
// @require      none
// ==/UserScript==

(function() {
    'use strict';

    // Wait for core module to be available
    function waitForCore(callback) {
        if (window.SidekickModules && window.SidekickModules.Core) {
            callback();
        } else {
            setTimeout(() => waitForCore(callback), 100);
        }
    }

    waitForCore(() => {
        const StockTicker = {
            core: window.SidekickModules.Core,
            panel: null,
            isPinned: false,
            updateInterval: null,
            refreshRate: 30000, // 30 seconds
            stockData: {},
            stockNameToIdMap: {}, // Dynamic mapping from API
            selectedStocks: [], // Array of stock IDs to display
            settingsWindow: null,
            transactionObserver: null, // MutationObserver for tracking transactions
            trackedTransactions: {}, // Store tracked purchase data
            
            init() {
                console.log('📈 Stock Ticker: Initializing...');
                
                // Load selected stocks from storage
                this.selectedStocks = this.core.loadState('stockticker_selected_stocks', []);
                
                // Load tracked transactions
                this.trackedTransactions = this.core.loadState('stockticker_transactions', {});
                console.log('📊 Stock Ticker: Loaded tracked transactions:', this.trackedTransactions);
                
                // Start monitoring stock transactions if on stocks page
                this.startTransactionMonitoring();
                
                // Check if panel was previously open
                const wasActive = this.core.loadState('stockticker_active');
                if (wasActive) {
                    this.show();
                }
                
                console.log('✅ Stock Ticker: Initialized');
            },

            toggle() {
                if (this.panel && document.body.contains(this.panel)) {
                    this.hide();
                } else {
                    this.show();
                }
            },

            async show() {
                if (this.panel && document.body.contains(this.panel)) {
                    return;
                }

                const sidebar = document.getElementById('sidekick-sidebar');
                if (!sidebar) {
                    console.error('❌ Stock Ticker: Sidebar not found');
                    return;
                }

                this.panel = this.createPanel();
                sidebar.appendChild(this.panel);
                
                // Load saved position
                this.loadPanelPosition();
                
                // Save active state
                this.core.saveState('stockticker_active', true);
                
                // Start auto-refresh
                this.startAutoRefresh();
                
                // Initial data fetch
                await this.fetchStockData();
                
                console.log('✅ Stock Ticker: Panel shown');
            },

            hide() {
                if (this.panel && document.body.contains(this.panel)) {
                    this.panel.remove();
                    this.panel = null;
                    this.core.saveState('stockticker_active', false);
                    this.stopAutoRefresh();
                    console.log('✅ Stock Ticker: Panel hidden');
                }
            },

            createPanel() {
                const panel = document.createElement('div');
                panel.className = 'stockticker-panel';
                
                // Load saved size or use defaults, with validation
                const savedSize = this.core.loadState('stockticker_size', { width: 320, height: 400 });
                
                // Validate and constrain saved size
                const minWidth = 250;
                const minHeight = 150;
                const maxWidth = 600;
                const maxHeight = 800;
                
                const validWidth = Math.max(minWidth, Math.min(maxWidth, savedSize.width || 320));
                const validHeight = Math.max(minHeight, Math.min(maxHeight, savedSize.height || 400));
                
                // If saved size was invalid, reset it
                if (validWidth !== savedSize.width || validHeight !== savedSize.height) {
                    console.warn('⚠️ Stock Ticker: Invalid saved size detected, using constrained values');
                    this.core.saveState('stockticker_size', { width: validWidth, height: validHeight });
                }
                
                panel.style.cssText = `
                    position: absolute;
                    background: #222;
                    border: 1px solid #444;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    width: ${validWidth}px;
                    height: ${validHeight}px;
                    min-width: ${minWidth}px;
                    min-height: ${minHeight}px;
                    max-width: ${maxWidth}px;
                    max-height: ${maxHeight}px;
                    z-index: 1000;
                    resize: both;
                    overflow: hidden;
                `;

                const header = document.createElement('div');
                header.className = 'stockticker-header';
                header.style.cssText = `
                    background: #333;
                    border-bottom: 1px solid #555;
                    padding: 8px 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: ${this.isPinned ? 'default' : 'move'};
                    height: 32px;
                    flex-shrink: 0;
                    border-radius: 7px 7px 0 0;
                `;

                // LEFT SIDE: Dropdown arrow + Emoji + Title
                const leftSection = document.createElement('div');
                leftSection.style.cssText = 'display: flex; align-items: center; gap: 4px;';
                
                // Dropdown button
                const dropdownBtn = document.createElement('button');
                dropdownBtn.innerHTML = '▼';
                dropdownBtn.title = 'Options';
                dropdownBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #bbb;
                    cursor: pointer;
                    font-size: 12px;
                    padding: 2px;
                    display: flex;
                    align-items: center;
                    transition: all 0.2s;
                `;
                dropdownBtn.onmouseover = () => dropdownBtn.style.color = '#fff';
                dropdownBtn.onmouseout = () => dropdownBtn.style.color = '#bbb';
                
                // Dropdown menu container
                const dropdownContainer = document.createElement('div');
                dropdownContainer.style.cssText = 'position: relative; display: inline-block;';
                
                // Dropdown menu
                const dropdown = document.createElement('div');
                dropdown.style.cssText = `
                    display: none;
                    position: fixed;
                    background: #333;
                    min-width: 140px;
                    z-index: 100000;
                    border-radius: 4px;
                    border: 1px solid #555;
                    padding: 4px 0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                `;
                
                // Refresh option
                const refreshOption = document.createElement('button');
                refreshOption.innerHTML = '<span style="margin-right: 8px;">🔄</span>Refresh';
                refreshOption.style.cssText = `
                    background: none;
                    border: none;
                    color: #fff;
                    padding: 8px 12px;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                `;
                refreshOption.onmouseover = () => refreshOption.style.background = '#444';
                refreshOption.onmouseout = () => refreshOption.style.background = 'none';
                refreshOption.onclick = (e) => {
                    e.stopPropagation();
                    this.fetchStockData();
                    dropdown.style.display = 'none';
                };
                
                // Pin option
                const pinOption = document.createElement('button');
                pinOption.innerHTML = `<span style="margin-right: 8px;">${this.isPinned ? '📌' : '📍'}</span>${this.isPinned ? 'Unpin' : 'Pin Panel'}`;
                pinOption.style.cssText = `
                    background: none;
                    border: none;
                    color: #fff;
                    padding: 8px 12px;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                `;
                pinOption.onmouseover = () => pinOption.style.background = '#444';
                pinOption.onmouseout = () => pinOption.style.background = 'none';
                pinOption.onclick = (e) => {
                    e.stopPropagation();
                    this.isPinned = !this.isPinned;
                    pinOption.innerHTML = `<span style="margin-right: 8px;">${this.isPinned ? '📌' : '📍'}</span>${this.isPinned ? 'Unpin' : 'Pin Panel'}`;
                    header.style.cursor = this.isPinned ? 'default' : 'move';
                    this.core.saveState('stockticker_pinned', this.isPinned);
                    dropdown.style.display = 'none';
                };
                
                // Auto-add owned stocks option
                const autoAddOption = document.createElement('button');
                autoAddOption.innerHTML = '<span style="margin-right: 8px;">✨</span>Auto-Add Owned Stocks';
                autoAddOption.style.cssText = `
                    background: none;
                    border: none;
                    color: #fff;
                    padding: 8px 12px;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                `;
                autoAddOption.onmouseover = () => autoAddOption.style.background = '#444';
                autoAddOption.onmouseout = () => autoAddOption.style.background = 'none';
                autoAddOption.onclick = async (e) => {
                    e.stopPropagation();
                    dropdown.style.display = 'none';
                    
                    // Show loading state
                    autoAddOption.disabled = true;
                    autoAddOption.innerHTML = '<span style="margin-right: 8px;">⏳</span>Loading...';
                    
                    await this.fetchStockData();
                    
                    // Auto-select owned stocks
                    const ownedStockIds = Object.keys(this.stockData).map(id => parseInt(id));
                    this.selectedStocks = ownedStockIds;
                    this.core.saveState('stockticker_selected_stocks', this.selectedStocks);
                    this.core.saveState('stockticker_has_selection', true); // Mark that user has made a selection
                    
                    // Reset button state
                    autoAddOption.disabled = false;
                    autoAddOption.innerHTML = '<span style="margin-right: 8px;">✨</span>Auto-Add Owned Stocks';
                    
                    // Refresh the ticker display
                    this.fetchStockData();
                };
                
                // Reset size & position option
                const resetSizeOption = document.createElement('button');
                resetSizeOption.innerHTML = '<span style="margin-right: 8px;">🔧</span>Reset Size & Position';
                resetSizeOption.style.cssText = `
                    background: none;
                    border: none;
                    color: #fff;
                    padding: 8px 12px;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                `;
                resetSizeOption.onmouseover = () => resetSizeOption.style.background = '#444';
                resetSizeOption.onmouseout = () => resetSizeOption.style.background = 'none';
                resetSizeOption.onclick = (e) => {
                    e.stopPropagation();
                    dropdown.style.display = 'none';
                    
                    // Reset to default size
                    const defaultSize = { width: 320, height: 400 };
                    panel.style.width = defaultSize.width + 'px';
                    panel.style.height = defaultSize.height + 'px';
                    
                    // Reset to default position (centered)
                    const sidebar = document.getElementById('sidekick-sidebar');
                    if (sidebar) {
                        const centerX = (sidebar.offsetWidth - defaultSize.width) / 2;
                        const centerY = (sidebar.offsetHeight - defaultSize.height) / 2;
                        panel.style.left = Math.max(0, centerX) + 'px';
                        panel.style.top = Math.max(0, centerY) + 'px';
                    }
                    
                    // Save the reset values
                    this.core.saveState('stockticker_size', defaultSize);
                    this.core.saveState('stockticker_position', { 
                        x: parseInt(panel.style.left) || 0, 
                        y: parseInt(panel.style.top) || 0 
                    });
                    
                    console.log('✅ Stock Ticker: Size and position reset to defaults');
                };
                
                // Settings option
                const settingsOption = document.createElement('button');
                settingsOption.innerHTML = '<span style="margin-right: 8px;">⚙️</span>Select Stocks';
                settingsOption.style.cssText = `
                    background: none;
                    border: none;
                    color: #fff;
                    padding: 8px 12px;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                `;
                settingsOption.onmouseover = () => settingsOption.style.background = '#444';
                settingsOption.onmouseout = () => settingsOption.style.background = 'none';
                settingsOption.onclick = (e) => {
                    e.stopPropagation();
                    this.showSettingsWindow();
                    dropdown.style.display = 'none';
                };
                
                // Clear tracking data option
                const clearDataOption = document.createElement('button');
                clearDataOption.innerHTML = '<span style="margin-right: 8px;">🗑️</span>Clear Tracking Data';
                clearDataOption.style.cssText = `
                    background: none;
                    border: none;
                    color: #f44336;
                    padding: 8px 12px;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                `;
                clearDataOption.onmouseover = () => clearDataOption.style.background = '#444';
                clearDataOption.onmouseout = () => clearDataOption.style.background = 'none';
                clearDataOption.onclick = (e) => {
                    e.stopPropagation();
                    dropdown.style.display = 'none';
                    
                    if (confirm('⚠️ This will delete all tracked transaction data.\n\nProfit/Loss calculations will reset.\n\nContinue?')) {
                        this.trackedTransactions = {};
                        this.core.saveState('stockticker_transactions', {});
                        console.log('🗑️ Cleared all transaction tracking data');
                        this.fetchStockData(); // Refresh display
                    }
                };
                
                // Import historical data option
                const importDataOption = document.createElement('button');
                importDataOption.innerHTML = '<span style="margin-right: 8px;">📥</span>Import Historical Data';
                importDataOption.style.cssText = `
                    background: none;
                    border: none;
                    color: #4CAF50;
                    padding: 8px 12px;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: background 0.2s ease;
                `;
                importDataOption.onmouseover = () => importDataOption.style.background = '#444';
                importDataOption.onmouseout = () => importDataOption.style.background = 'none';
                importDataOption.onclick = (e) => {
                    e.stopPropagation();
                    dropdown.style.display = 'none';
                    this.showImportWindow();
                };
                
                dropdown.appendChild(refreshOption);
                dropdown.appendChild(pinOption);
                dropdown.appendChild(autoAddOption);
                dropdown.appendChild(resetSizeOption);
                dropdown.appendChild(settingsOption);
                dropdown.appendChild(importDataOption);
                dropdown.appendChild(clearDataOption);
                
                dropdownContainer.appendChild(dropdownBtn);
                dropdownContainer.appendChild(dropdown);
                
                // Toggle dropdown on click
                dropdownBtn.onclick = (e) => {
                    e.stopPropagation();
                    const isVisible = dropdown.style.display === 'block';
                    dropdown.style.display = isVisible ? 'none' : 'block';
                    
                    if (!isVisible) {
                        const rect = dropdownBtn.getBoundingClientRect();
                        dropdown.style.left = rect.left + 'px';
                        dropdown.style.top = (rect.bottom + 4) + 'px';
                    }
                };
                
                // Close dropdown when clicking outside
                document.addEventListener('click', () => {
                    dropdown.style.display = 'none';
                });
                
                // Emoji icon
                const icon = document.createElement('span');
                icon.textContent = '📈';
                icon.style.fontSize = '16px';
                
                // Title
                const title = document.createElement('span');
                title.textContent = 'Stock Ticker';
                title.style.cssText = 'color: #fff; font-weight: 600; font-size: 13px;';
                
                leftSection.appendChild(dropdownContainer);
                leftSection.appendChild(icon);
                leftSection.appendChild(title);

                // RIGHT SIDE: Close button
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '×';
                closeBtn.title = 'Close';
                closeBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #bbb;
                    cursor: pointer;
                    font-size: 20px;
                    padding: 0 6px;
                    line-height: 1;
                    border-radius: 4px;
                    transition: all 0.2s;
                `;
                closeBtn.onmouseover = () => { closeBtn.style.background = '#d32f2f'; closeBtn.style.color = '#fff'; };
                closeBtn.onmouseout = () => { closeBtn.style.background = 'none'; closeBtn.style.color = '#bbb'; };
                closeBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.hide();
                };

                header.appendChild(leftSection);
                header.appendChild(closeBtn);

                // Content area
                const content = document.createElement('div');
                content.className = 'stockticker-content';
                content.style.cssText = `
                    padding: 12px;
                    overflow-y: auto;
                    flex: 1;
                    color: #ccc;
                    font-size: 13px;
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE and Edge */
                `;
                
                // Hide scrollbar for Chrome, Safari and Opera
                const style = document.createElement('style');
                style.textContent = `
                    .stockticker-content::-webkit-scrollbar {
                        display: none;
                    }
                `;
                document.head.appendChild(style);

                // Loading state
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px; color: #888;">
                        <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
                        <div>Loading stock data...</div>
                    </div>
                `;

                panel.appendChild(header);
                panel.appendChild(content);

                // Add dragging functionality
                this.addDragging(panel, header);
                
                // Add resize observer to save size with validation
                const resizeObserver = new ResizeObserver(() => {
                    const width = panel.offsetWidth;
                    const height = panel.offsetHeight;
                    
                    // Validate and constrain dimensions
                    const minWidth = 250;
                    const minHeight = 150;
                    const maxWidth = 600;
                    const maxHeight = 800;
                    
                    const validWidth = Math.max(minWidth, Math.min(maxWidth, width));
                    const validHeight = Math.max(minHeight, Math.min(maxHeight, height));
                    
                    // Only save if dimensions are valid
                    if (validWidth === width && validHeight === height) {
                        const size = { width, height };
                        this.core.saveState('stockticker_size', size);
                    } else {
                        // Reset to valid size if invalid dimensions detected
                        console.warn('⚠️ Stock Ticker: Invalid size detected, resetting to valid dimensions');
                        panel.style.width = validWidth + 'px';
                        panel.style.height = validHeight + 'px';
                    }
                });
                resizeObserver.observe(panel);

                return panel;
            },

            addDragging(panel, header) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };
                let startPosition = { x: 0, y: 0 };

                header.addEventListener('mousedown', (e) => {
                    if (this.isPinned) return;
                    
                    isDragging = true;
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { left: 0, top: 0 };
                    
                    // Calculate offset from mouse to panel's current position (relative to sidebar)
                    const currentLeft = parseInt(panel.style.left) || 0;
                    const currentTop = parseInt(panel.style.top) || 0;
                    
                    dragOffset.x = (e.clientX - sidebarRect.left) - currentLeft;
                    dragOffset.y = (e.clientY - sidebarRect.top) - currentTop;
                    
                    startPosition.x = currentLeft;
                    startPosition.y = currentTop;
                    
                    e.preventDefault();
                    e.stopPropagation();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging || this.isPinned) return;
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    if (!sidebar) return;
                    
                    const sidebarRect = sidebar.getBoundingClientRect();
                    
                    let newX = e.clientX - sidebarRect.left - dragOffset.x;
                    let newY = e.clientY - sidebarRect.top - dragOffset.y;
                    
                    const maxX = Math.max(0, sidebar.offsetWidth - panel.offsetWidth);
                    const maxY = Math.max(0, sidebar.offsetHeight - panel.offsetHeight);
                    
                    newX = Math.max(0, Math.min(newX, maxX));
                    newY = Math.max(0, Math.min(newY, maxY));
                    
                    panel.style.left = newX + 'px';
                    panel.style.top = newY + 'px';
                });

                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        const currentX = parseInt(panel.style.left) || 0;
                        const currentY = parseInt(panel.style.top) || 0;
                        
                        if (Math.abs(currentX - startPosition.x) > 1 || Math.abs(currentY - startPosition.y) > 1) {
                            this.savePanelPosition(panel);
                        }
                    }
                });
            },

            async fetchStockData() {
                const content = this.panel?.querySelector('.stockticker-content');
                if (!content) return;

                try {
                    // Remove loading indicator - causes UI flicker
                    // Just fetch data silently in the background

                    // Get API key from Core module's storage (same way TodoList does it)
                    console.log('📈 Stock Ticker: Attempting to fetch API key...');
                    console.log('📈 Stock Ticker: this.core:', this.core);
                    console.log('📈 Stock Ticker: this.core.loadState:', this.core?.loadState);
                    console.log('📈 Stock Ticker: this.core.STORAGE_KEYS:', this.core?.STORAGE_KEYS);
                    
                    if (!this.core || !this.core.loadState || !this.core.STORAGE_KEYS) {
                        console.error('❌ Stock Ticker: Core module not properly loaded');
                        this.showError(content, 'Core module not loaded. Please refresh the page.');
                        return;
                    }
                    
                    console.log('📈 Stock Ticker: API_KEY constant:', this.core.STORAGE_KEYS.API_KEY);
                    const apiKey = this.core.loadState(this.core.STORAGE_KEYS.API_KEY, '');
                    console.log('📈 Stock Ticker: Retrieved API key:', apiKey ? `${apiKey.substring(0, 4)}...` : 'EMPTY');
                    
                    if (!apiKey) {
                        console.error('❌ Stock Ticker: No API key found in storage');
                        this.showError(content, 'No API key found. Please set your API key in Settings.');
                        return;
                    }


                    // Fetch BOTH user portfolio and market prices
                    // User endpoint gives us transactions, torn endpoint gives current prices
                    console.log('📈 Stock Ticker: Fetching portfolio and market data...');
                    
                    const [userResponse, marketResponse] = await Promise.all([
                        fetch(`https://api.torn.com/user/?selections=stocks&key=${apiKey}`),
                        fetch(`https://api.torn.com/torn/?selections=stocks&key=${apiKey}`)
                    ]);
                    
                    if (!userResponse.ok || !marketResponse.ok) {
                        throw new Error('Failed to fetch stock data');
                    }

                    const userData = await userResponse.json();
                    const marketData = await marketResponse.json();
                    
                    console.log('📈 Stock Ticker: User portfolio data:', userData);
                    console.log('📈 Stock Ticker: Market price data:', marketData);

                    if (userData.error) {
                        this.showError(content, 'API Error: ' + userData.error.error);
                        return;

                    }

                    if (marketData.error) {
                        this.showError(content, 'API Error: ' + marketData.error.error);
                        return;
                    }

                    // Combine the data: user portfolio with market prices
                    const userStocks = userData.stocks || {};
                    const marketStocks = marketData.stocks || {};
                    
                    console.log('📈 Stock Ticker: User stocks keys:', Object.keys(userStocks));
                    console.log('📈 Stock Ticker: Market stocks keys:', Object.keys(marketStocks).length, 'stocks');
                    console.log('📈 Stock Ticker: Sample market stock:', marketStocks['1']);
                    console.log('📈 Stock Ticker: Sample user stock:', userStocks[Object.keys(userStocks)[0]]);
                    
                    // Merge: add current_price from market data to user portfolio stocks
                    this.stockData = {};
                    this.stockNameToIdMap = {}; // Reset mapping
                    
                    // Build mapping from ALL stocks (not just owned)
                    for (const [stockId, marketStock] of Object.entries(marketStocks)) {
                        if (marketStock) {
                            // Map both full name and acronym to ID
                            const fullName = marketStock.name;
                            const acronym = marketStock.acronym;
                            
                            this.stockNameToIdMap[fullName.toLowerCase()] = parseInt(stockId);
                            this.stockNameToIdMap[acronym.toLowerCase()] = parseInt(stockId);
                            
                            console.log(`📊 Mapped stock: "${fullName}" / "${acronym}" -> ID ${stockId}`);
                        }
                    }
                    
                    for (const [stockId, userStock] of Object.entries(userStocks)) {
                        const marketStock = marketStocks[stockId];
                        console.log(`📈 Merging stock ${stockId}:`, {
                            userStock,
                            marketStock,
                            current_price: marketStock?.current_price
                        });
                        
                        this.stockData[stockId] = {
                            ...userStock,
                            current_price: marketStock?.current_price || 0,
                            name: marketStock?.name || userStock.name || `Stock #${stockId}`,
                            acronym: marketStock?.acronym || `#${stockId}` // Store acronym from API
                        };
                    }
                    
                    console.log('📈 Stock Ticker: Stock name mapping:', this.stockNameToIdMap);
                    console.log('📈 Stock Ticker: Combined stock data:', this.stockData);
                    console.log('📈 Stock Ticker: First combined stock:', this.stockData[Object.keys(this.stockData)[0]]);
                    this.renderStocks(content);

                } catch (error) {
                    console.error('❌ Stock Ticker: Error fetching data:', error);
                    if (content.querySelector('[style*="position: absolute"]')) {
                        content.querySelector('[style*="position: absolute"]').remove();
                    }
                    this.showError(content, 'Failed to load stock data. Check API key in settings.');
                }
            },

            renderStocks(content) {
                const stocks = this.stockData;
                
                console.log('📈 Stock Ticker: Rendering stocks...', stocks);
                
                if (!stocks || Object.keys(stocks).length === 0) {
                    content.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px; color: #888;">
                            <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
                            <div>No stocks owned</div>
                            <div style="font-size: 11px; margin-top: 8px; color: #666;">
                                Visit the stock market to purchase stocks
                            </div>
                        </div>
                    `;
                    return;
                }

                // Filter stocks based on selected stocks
                let filteredStocks = stocks;
                
                // Check if user has made a selection (even if empty array)
                const hasSelectedStocks = this.core.loadState('stockticker_has_selection', false);
                
                if (hasSelectedStocks && this.selectedStocks.length === 0) {
                    // User explicitly deselected all stocks - show message
                    content.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px; color: #888;">
                            <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
                            <div>No stocks selected</div>
                            <div style="font-size: 11px; margin-top: 8px; color: #666;">
                                Use ⚙️ Select Stocks to choose which stocks to display
                            </div>
                        </div>
                    `;
                    return;
                } else if (this.selectedStocks.length > 0) {
                    // User has selected specific stocks - filter to show only those
                    filteredStocks = {};
                    for (const [stockId, stockData] of Object.entries(stocks)) {
                        if (this.selectedStocks.includes(parseInt(stockId))) {
                            filteredStocks[stockId] = stockData;
                        }
                    }
                }
                // If hasSelectedStocks is false and selectedStocks is empty, show all stocks (initial state)

                console.log('📈 Stock Ticker: Filtered stocks:', filteredStocks);

                if (Object.keys(filteredStocks).length === 0) {
                    content.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px; color: #888;">
                            <div style="font-size: 32px; margin-bottom: 12px;">🔍</div>
                            <div>No selected stocks to display</div>
                            <div style="font-size: 11px; margin-top: 8px; color: #666;">
                                Use ⚙️ Select Stocks to choose which stocks to display
                            </div>
                        </div>
                    `;
                    return;
                }

                let totalValue = 0;
                const stocksHTML = [];

                // Sort stocks by value (descending) - shares is directly available
                const sortedStocks = Object.entries(filteredStocks).sort((a, b) => {
                    const stockA = a[1];
                    const stockB = b[1];
                    
                    const valueA = (stockA.shares || 0) * (stockA.current_price || 0);
                    const valueB = (stockB.shares || 0) * (stockB.current_price || 0);
                    return valueB - valueA;
                });

                for (const [stockId, stock] of sortedStocks) {
                    console.log(`📈 Processing stock ${stockId}:`, stock);
                    
                    // ACTUAL API STRUCTURE: shares is a number, transactions is a count
                    const shares = stock.shares || 0;
                    const currentPrice = stock.current_price || 0;
                    const stockName = stock.name || `Stock #${stockId}`;
                    const stockAcronym = stock.acronym || stockId; // Use acronym from API
                    const transactionCount = stock.transactions || 0;
                    
                    console.log(`📈 Stock ${stockId} - Acronym: ${stockAcronym}, Name: ${stockName}, Shares: ${shares}, Current Price: ${currentPrice}, Transactions: ${transactionCount}`);
                    
                    // Calculate current value
                    const currentValue = shares * currentPrice;
                    
                    // Calculate profit/loss from tracked transactions
                    let profitLoss = null;
                    let profitPercent = null;
                    let avgBuyPrice = null;
                    let isTracked = false;
                    
                    const trackedStock = this.trackedTransactions[stockId];
                    if (trackedStock && trackedStock.totalShares > 0) {
                        avgBuyPrice = trackedStock.totalInvested / trackedStock.totalShares;
                        
                        // IMPORTANT: Calculate profit based on tracked shares ONLY, not total portfolio shares
                        const trackedCurrentValue = trackedStock.totalShares * currentPrice;
                        profitLoss = trackedCurrentValue - trackedStock.totalInvested;
                        profitPercent = (profitLoss / trackedStock.totalInvested) * 100;
                        isTracked = true;
                        
                        console.log(`� Stock ${stockId} P/L: $${profitLoss.toFixed(2)} (${profitPercent.toFixed(2)}%)`);
                    }
                    
                    totalValue += currentValue;

                    // Build stock card with profit/loss if tracked
                    const profitColor = profitLoss === null ? '#888' : (profitLoss >= 0 ? '#4CAF50' : '#f44336');
                    const profitSign = profitLoss > 0 ? '+' : '';
                    const profitDisplay = profitLoss === null 
                        ? 'Not tracked' 
                        : `${profitSign}$${profitLoss.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                    const percentDisplay = profitPercent === null 
                        ? '' 
                        : ` (${profitSign}${profitPercent.toFixed(2)}%)`;

                    stocksHTML.push(`
                        <div style="
                            background: #2a2a2a;
                            border: 1px solid #3a3a3a;
                            border-radius: 6px;
                            padding: 12px;
                            margin-bottom: 8px;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#333'; this.style.borderColor='#444';" 
                           onmouseout="this.style.background='#2a2a2a'; this.style.borderColor='#3a3a3a';">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div style="font-weight: 600; color: #fff; font-size: 14px;">
                                    [${stockAcronym}] ${stockName}
                                </div>
                                <div style="color: ${profitColor}; font-weight: 600; font-size: 13px;">
                                    ${profitDisplay}${percentDisplay}
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Current Price</div>
                                    <div style="color: #fff;">$${currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Total Value</div>
                                    <div style="color: #fff;">$${currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                            </div>
                        </div>
                    `);
                }

                // Removed portfolio summary and profit/loss calculations (not available from API)
                content.innerHTML = stocksHTML.join('');

                // Update last refresh time
                const now = new Date().toLocaleTimeString();
                console.log(`📈 Stock Ticker: Updated at ${now}`);
            },

            showError(content, message) {
                content.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <div style="font-size: 32px; margin-bottom: 12px; color: #f44336;">⚠️</div>
                        <div style="color: #f44336; margin-bottom: 8px;">${message}</div>
                        <button onclick="window.SidekickModules.StockTicker.fetchStockData()" style="
                            background: #4CAF50;
                            border: none;
                            color: white;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            margin-top: 8px;
                        ">Retry</button>
                    </div>
                `;
            },

            // Transaction Tracking System
            startTransactionMonitoring() {
                // Only monitor on stocks page
                if (!window.location.href.includes('/stockexchange.php')) {
                    console.log('📈 Stock Ticker: Not on stocks page, skipping transaction monitoring');
                    return;
                }

                console.log('📈 Stock Ticker: Starting transaction monitoring...');

                // Monitor for stock purchase/sale confirmations
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === 1) { // Element node
                                // Look for success messages
                                const message = node.textContent || '';
                                
                                // Match patterns like "You bought 1,000 shares of Stock Name for $5,000.00"
                                const buyMatch = message.match(/You bought ([\d,]+) shares of (.+?) for \$([\d,]+\.?\d*)/i);
                                if (buyMatch) {
                                    const shares = parseInt(buyMatch[1].replace(/,/g, ''));
                                    const stockName = buyMatch[2].trim();
                                    const totalCost = parseFloat(buyMatch[3].replace(/,/g, ''));
                                    const pricePerShare = totalCost / shares;
                                    
                                    console.log(`💰 BUY detected: ${shares} shares of ${stockName} at $${pricePerShare.toFixed(2)}/share`);
                                    this.recordTransaction('buy', stockName, shares, pricePerShare);
                                }
                                
                                // Match patterns like "You sold 1,000 shares of Stock Name for $6,000.00"
                                const sellMatch = message.match(/You sold ([\d,]+) shares of (.+?) for \$([\d,]+\.?\d*)/i);
                                if (sellMatch) {
                                    const shares = parseInt(sellMatch[1].replace(/,/g, ''));
                                    const stockName = sellMatch[2].trim();
                                    const totalRevenue = parseFloat(sellMatch[3].replace(/,/g, ''));
                                    const pricePerShare = totalRevenue / shares;
                                    
                                    console.log(`💸 SELL detected: ${shares} shares of ${stockName} at $${pricePerShare.toFixed(2)}/share`);
                                    this.recordTransaction('sell', stockName, shares, pricePerShare);
                                }
                            }
                        }
                    }
                });

                // Observe the entire document for changes
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                this.transactionObserver = observer;
                console.log('✅ Stock Ticker: Transaction monitoring started');
            },

            recordTransaction(type, stockName, shares, pricePerShare) {
                // Check if we have the stock mapping - if not, we need to fetch it first
                if (Object.keys(this.stockNameToIdMap).length === 0) {
                    console.log('📊 Stock name mapping not available yet, fetching stock data...');
                    // Queue this transaction to retry after fetching
                    this.fetchStockData().then(() => {
                        // Retry the transaction recording
                        this.recordTransaction(type, stockName, shares, pricePerShare);
                    });
                    return;
                }
                
                // Find stock ID by name
                const stockId = this.getStockIdByName(stockName);
                if (!stockId) {
                    console.warn(`⚠️ Could not find stock ID for: "${stockName}"`);
                    console.log('📊 Transaction will not be tracked. Available stock names:', Object.keys(this.stockNameToIdMap).slice(0, 10));
                    return;
                }

                console.log(`✅ Found stock ID ${stockId} for "${stockName}"`);

                // Initialize stock tracking if not exists
                if (!this.trackedTransactions[stockId]) {
                    this.trackedTransactions[stockId] = {
                        name: stockName,
                        purchases: [], // Array of {shares, price, timestamp}
                        totalShares: 0,
                        totalInvested: 0
                    };
                }

                const stock = this.trackedTransactions[stockId];
                const timestamp = Date.now();

                if (type === 'buy') {
                    // Add purchase record
                    stock.purchases.push({
                        shares: shares,
                        price: pricePerShare,
                        timestamp: timestamp
                    });
                    stock.totalShares += shares;
                    stock.totalInvested += shares * pricePerShare;

                    console.log(`✅ Recorded BUY: ${shares} shares of ${stockName} at $${pricePerShare.toFixed(2)}`);
                } else if (type === 'sell') {
                    // FIFO (First In, First Out) - sell oldest purchases first
                    let sharesToSell = shares;
                    let totalCostBasis = 0;

                    while (sharesToSell > 0 && stock.purchases.length > 0) {
                        const oldestPurchase = stock.purchases[0];
                        
                        if (oldestPurchase.shares <= sharesToSell) {
                            // Sell entire oldest purchase
                            totalCostBasis += oldestPurchase.shares * oldestPurchase.price;
                            sharesToSell -= oldestPurchase.shares;
                            stock.purchases.shift(); // Remove from array
                        } else {
                            // Partial sell of oldest purchase
                            totalCostBasis += sharesToSell * oldestPurchase.price;
                            oldestPurchase.shares -= sharesToSell;
                            sharesToSell = 0;
                        }
                    }

                    stock.totalShares -= shares;
                    stock.totalInvested -= totalCostBasis;

                    const profit = (shares * pricePerShare) - totalCostBasis;
                    console.log(`✅ Recorded SELL: ${shares} shares of ${stockName} at $${pricePerShare.toFixed(2)}, Profit: $${profit.toFixed(2)}`);
                }

                // Save to storage
                this.core.saveState('stockticker_transactions', this.trackedTransactions);
                console.log('💾 Saved transactions to storage');

                // Refresh display if panel is open
                if (this.panel && document.body.contains(this.panel)) {
                    this.fetchStockData();
                }
            },

            getStockIdByName(stockName) {
                if (!stockName) return null;
                
                // Try exact match (case-insensitive)
                const lowerName = stockName.toLowerCase().trim();
                if (this.stockNameToIdMap[lowerName]) {
                    console.log(`✅ Found stock ID for "${stockName}": ${this.stockNameToIdMap[lowerName]}`);
                    return this.stockNameToIdMap[lowerName];
                }
                
                // Try partial match - find stock name that contains the search term
                for (const [mappedName, stockId] of Object.entries(this.stockNameToIdMap)) {
                    if (mappedName.includes(lowerName) || lowerName.includes(mappedName)) {
                        console.log(`✅ Found partial match for "${stockName}" -> "${mappedName}": ID ${stockId}`);
                        return stockId;
                    }
                }
                
                console.warn(`⚠️ Could not find stock ID for: "${stockName}"`);
                console.log('📊 Available mappings:', Object.keys(this.stockNameToIdMap));
                return null;
            },

            // Parse shorthand notation (e.g., "5k" -> 5000, "1.5m" -> 1500000, "2b" -> 2000000000)
            parseShorthandNumber(value) {
                if (typeof value === 'number') return value;
                if (!value) return null;
                
                const str = String(value).toLowerCase().trim();
                
                // Match number with optional k/m/b suffix
                const match = str.match(/^([\d.]+)\s*([kmb])?$/);
                if (!match) return parseFloat(str) || null;
                
                const num = parseFloat(match[1]);
                const suffix = match[2];
                
                if (!suffix) return num;
                
                const multipliers = {
                    'k': 1000,
                    'm': 1000000,
                    'b': 1000000000
                };
                
                return num * (multipliers[suffix] || 1);
            },

            startAutoRefresh() {
                this.stopAutoRefresh();
                this.updateInterval = setInterval(() => {
                    this.fetchStockData();
                }, this.refreshRate);
            },

            stopAutoRefresh() {
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                    this.updateInterval = null;
                }
            },

            savePanelPosition(panel) {
                const position = {
                    x: parseInt(panel.style.left) || 10,
                    y: parseInt(panel.style.top) || 10
                };
                this.core.saveState('stockticker_position', position);
            },

            loadPanelPosition() {
                const position = this.core.loadState('stockticker_position');
                if (position && this.panel) {
                    this.panel.style.left = position.x + 'px';
                    this.panel.style.top = position.y + 'px';
                } else if (this.panel) {
                    this.panel.style.left = '10px';
                    this.panel.style.top = '10px';
                }

                const pinned = this.core.loadState('stockticker_pinned');
                if (pinned !== null) {
                    this.isPinned = pinned;
                }
            },

            showSettingsWindow() {
                if (this.settingsWindow && document.body.contains(this.settingsWindow)) {
                    return; // Already open
                }

                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 999999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                `;

                const window = document.createElement('div');
                window.style.cssText = `
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    width: 500px;
                    max-height: 600px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                `;

                // Header
                const header = document.createElement('div');
                header.style.cssText = `
                    background: #333;
                    border-bottom: 1px solid #555;
                    padding: 12px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 7px 7px 0 0;
                `;
                header.innerHTML = `
                    <div style="color: #fff; font-weight: 600; font-size: 14px;">📈 Select Stocks to Display</div>
                `;

                // Create close button properly with event listener
                const closeButton = document.createElement('button');
                closeButton.style.cssText = `
                    background: none;
                    border: none;
                    color: #bbb;
                    cursor: pointer;
                    font-size: 20px;
                    padding: 0;
                    line-height: 1;
                `;
                closeButton.textContent = '×';
                closeButton.onclick = () => overlay.remove();
                header.appendChild(closeButton);

                // Content
                const content = document.createElement('div');
                content.style.cssText = `
                    padding: 16px;
                    overflow-y: auto;
                    flex: 1;
                `;

                // Stock list
                const stockList = document.createElement('div');
                stockList.style.cssText = `
                    display: grid;
                    gap: 8px;
                `;

                // All available Torn stocks with short names (alphabetically sorted by acronym)
                const allStocks = [
                    { id: 15, short: 'ASS', name: 'Alcoholics Synonymous' },
                    { id: 20, short: 'BAG', name: 'Big Al\'s Gun Shop' },
                    { id: 17, short: 'CBD', name: 'Herbal Releaf Co.' },
                    { id: 2, short: 'CNC', name: 'Crude & Co' },
                    { id: 14, short: 'ELT', name: 'Empty Lunchbox Traders' },
                    { id: 16, short: 'EVL', name: 'Evil Ducks Candy Corp' },
                    { id: 24, short: 'EWM', name: 'Eaglewood Mercenary' },
                    { id: 6, short: 'FHG', name: 'Feathery Hotels Group' },
                    { id: 12, short: 'GRN', name: 'Grain' },
                    { id: 32, short: 'HRG', name: 'Home Retail Group' },
                    { id: 8, short: 'IIL', name: 'I Industries Ltd.' },
                    { id: 5, short: 'IOU', name: 'Insured On Us' },
                    { id: 3, short: 'IST', name: 'International School TC' },
                    { id: 30, short: 'LAG', name: 'Legal Authorities Group' },
                    { id: 29, short: 'LOS', name: 'Lo Squalo Waste Management' },
                    { id: 25, short: 'LSC', name: 'Lucky Shots Casino' },
                    { id: 35, short: 'MCS', name: 'Mc Smoogle Corp' },
                    { id: 9, short: 'MSG', name: 'Messaging Inc.' },
                    { id: 27, short: 'MUN', name: 'Munster Beverage Corp.' },
                    { id: 31, short: 'PRN', name: 'Performance Ribaldry Network' },
                    { id: 23, short: 'PTS', name: 'PointLess' },
                    { id: 26, short: 'SYM', name: 'Symbiotic Ltd.' },
                    { id: 4, short: 'SYS', name: 'Syscore MFG' },
                    { id: 18, short: 'TCC', name: 'Torn City Clothing' },
                    { id: 1, short: 'TCI', name: 'Torn City Investments' },
                    { id: 34, short: 'TCM', name: 'Torn City Motors' },
                    { id: 13, short: 'TCP', name: 'TC Media Productions' },
                    { id: 19, short: 'TCT', name: 'The Torn City Times' },
                    { id: 33, short: 'TGP', name: 'Tell Group Plc.' },
                    { id: 11, short: 'THS', name: 'Torn City Health Service' },
                    { id: 10, short: 'TMI', name: 'TC Music Industries' },
                    { id: 7, short: 'TSB', name: 'Torn & Shanghai Banking' },
                    { id: 21, short: 'WLT', name: 'Wind Lines Travel' },
                    { id: 28, short: 'WSU', name: 'West Side University' },
                    { id: 22, short: 'YAZ', name: 'Yazoo' }
                ];

                allStocks.forEach(stock => {
                    const checkbox = document.createElement('label');
                    checkbox.style.cssText = `
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 12px;
                        background: #333;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: background 0.2s;
                    `;
                    checkbox.onmouseover = () => checkbox.style.background = '#3a3a3a';
                    checkbox.onmouseout = () => checkbox.style.background = '#333';

                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.checked = this.selectedStocks.includes(stock.id);
                    input.style.cssText = `
                        cursor: pointer;
                        width: 18px;
                        height: 18px;
                    `;
                    input.onchange = () => {
                        if (input.checked) {
                            if (!this.selectedStocks.includes(stock.id)) {
                                this.selectedStocks.push(stock.id);
                            }
                        } else {
                            this.selectedStocks = this.selectedStocks.filter(id => id !== stock.id);
                        }
                        this.core.saveState('stockticker_selected_stocks', this.selectedStocks);
                        this.core.saveState('stockticker_has_selection', true); // Mark that user has made a selection
                        this.fetchStockData(); // Refresh display
                    };

                    const label = document.createElement('span');
                    label.textContent = `[${stock.short}] ${stock.name}`;
                    label.style.cssText = 'color: #fff; font-size: 13px; flex: 1;';

                    checkbox.appendChild(input);
                    checkbox.appendChild(label);
                    stockList.appendChild(checkbox);
                });

                content.appendChild(stockList);
                window.appendChild(header);
                window.appendChild(content);
                overlay.appendChild(window);
                document.body.appendChild(overlay);

                this.settingsWindow = overlay;

                // Close on overlay click
                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        overlay.remove();
                    }
                };
            },

            showImportWindow() {
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    z-index: 999999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                `;

                const window = document.createElement('div');
                window.style.cssText = `
                    background: #2a2a2a;
                    border: 1px solid #444;
                    border-radius: 8px;
                    width: 600px;
                    max-height: 700px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                `;

                // Header
                const header = document.createElement('div');
                header.style.cssText = `
                    background: #333;
                    border-bottom: 1px solid #555;
                    padding: 12px 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 7px 7px 0 0;
                `;
                header.innerHTML = `
                    <div style="color: #fff; font-weight: 600; font-size: 14px;">📥 Import Historical Stock Purchases</div>
                `;

                const closeButton = document.createElement('button');
                closeButton.style.cssText = `
                    background: none;
                    border: none;
                    color: #bbb;
                    cursor: pointer;
                    font-size: 20px;
                    padding: 0;
                    line-height: 1;
                `;
                closeButton.textContent = '×';
                closeButton.onclick = () => overlay.remove();
                header.appendChild(closeButton);

                // Content
                const content = document.createElement('div');
                content.style.cssText = `
                    padding: 16px;
                    overflow-y: auto;
                    flex: 1;
                `;

                content.innerHTML = `
                    <div style="color: #ccc; font-size: 13px; margin-bottom: 16px; line-height: 1.6;">
                        <strong style="color: #4CAF50;">💡 Import Your Old Stock Purchases</strong><br>
                        Add your historical stock purchases to start tracking profit/loss immediately!<br><br>
                        
                        <strong>How to use:</strong><br>
                        1. Select a stock from the dropdown<br>
                        2. Enter number of shares purchased<br>
                        3. Enter the price per share you paid<br>
                        4. Click "Add Purchase"<br>
                        5. Repeat for all your historical purchases<br><br>
                        
                        <em style="color: #888;">Note: You can add multiple purchases for the same stock at different prices.</em>
                    </div>

                    <div style="background: #333; padding: 16px; border-radius: 6px; margin-bottom: 16px;">
                        <div style="margin-bottom: 12px;">
                            <label style="color: #ccc; font-size: 12px; display: block; margin-bottom: 6px;">Stock:</label>
                            <select id="import-stock-select" style="
                                width: 100%;
                                padding: 8px;
                                background: #2a2a2a;
                                border: 1px solid #555;
                                border-radius: 4px;
                                color: #fff;
                                font-size: 13px;
                            ">
                                <option value="">Select a stock...</option>
                                <option value="15">[ASS] Alcoholics Synonymous</option>
                                <option value="20">[BAG] Big Al's Gun Shop</option>
                                <option value="17">[CBD] Herbal Releaf Co.</option>
                                <option value="2">[CNC] Crude & Co</option>
                                <option value="14">[ELT] Empty Lunchbox Traders</option>
                                <option value="16">[EVL] Evil Ducks Candy Corp</option>
                                <option value="24">[EWM] Eaglewood Mercenary</option>
                                <option value="6">[FHG] Feathery Hotels Group</option>
                                <option value="12">[GRN] Grain</option>
                                <option value="32">[HRG] Home Retail Group</option>
                                <option value="8">[IIL] I Industries Ltd.</option>
                                <option value="5">[IOU] Insured On Us</option>
                                <option value="3">[IST] International School TC</option>
                                <option value="30">[LAG] Legal Authorities Group</option>
                                <option value="29">[LOS] Lo Squalo Waste Management</option>
                                <option value="25">[LSC] Lucky Shots Casino</option>
                                <option value="35">[MCS] Mc Smoogle Corp</option>
                                <option value="9">[MSG] Messaging Inc.</option>
                                <option value="27">[MUN] Munster Beverage Corp.</option>
                                <option value="31">[PRN] Performance Ribaldry Network</option>
                                <option value="23">[PTS] PointLess</option>
                                <option value="26">[SYM] Symbiotic Ltd.</option>
                                <option value="4">[SYS] Syscore MFG</option>
                                <option value="18">[TCC] Torn City Clothing</option>
                                <option value="1">[TCI] Torn City Investments</option>
                                <option value="34">[TCM] Torn City Motors</option>
                                <option value="13">[TCP] TC Media Productions</option>
                                <option value="19">[TCT] The Torn City Times</option>
                                <option value="33">[TGP] Tell Group Plc.</option>
                                <option value="11">[THS] Torn City Health Service</option>
                                <option value="10">[TMI] TC Music Industries</option>
                                <option value="7">[TSB] Torn & Shanghai Banking</option>
                                <option value="21">[WLT] Wind Lines Travel</option>
                                <option value="28">[WSU] West Side University</option>
                                <option value="22">[YAZ] Yazoo</option>
                            </select>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="color: #ccc; font-size: 12px; display: block; margin-bottom: 6px;">Shares:</label>
                                <input type="text" id="import-shares" placeholder="Type: 5k, 1.5m, 2000" style="
                                    width: 100%;
                                    padding: 8px;
                                    background: #2a2a2a;
                                    border: 1px solid #555;
                                    border-radius: 4px;
                                    color: #fff;
                                    font-size: 13px;
                                    box-sizing: border-box;
                                ">
                                <div style="font-size: 10px; color: #888; margin-top: 4px;">Auto-converts: 5k→5000, 1m→1000000</div>
                            </div>
                            <div>
                                <label style="color: #ccc; font-size: 12px; display: block; margin-bottom: 6px;">Price per Share ($):</label>
                                <input type="text" id="import-price" placeholder="Type: 1.2k, 45.50" style="
                                    width: 100%;
                                    padding: 8px;
                                    background: #2a2a2a;
                                    border: 1px solid #555;
                                    border-radius: 4px;
                                    color: #fff;
                                    font-size: 13px;
                                    box-sizing: border-box;
                                ">
                                <div style="font-size: 10px; color: #888; margin-top: 4px;">Auto-converts: k→×1000, m→×1000000</div>
                            </div>
                        </div>

                        <button id="import-add-btn" style="
                            width: 100%;
                            padding: 10px;
                            background: #4CAF50;
                            border: none;
                            border-radius: 4px;
                            color: white;
                            font-weight: 600;
                            cursor: pointer;
                            font-size: 13px;
                        ">✅ Add Purchase</button>
                    </div>

                    <div id="import-status" style="
                        margin-top: 12px;
                        padding: 12px;
                        border-radius: 4px;
                        font-size: 13px;
                        display: none;
                    "></div>

                    <div id="import-summary" style="
                        margin-top: 16px;
                        padding: 12px;
                        background: #333;
                        border-radius: 6px;
                        color: #ccc;
                        font-size: 12px;
                        max-height: 200px;
                        overflow-y: auto;
                    "></div>
                `;

                window.appendChild(header);
                window.appendChild(content);
                overlay.appendChild(window);
                document.body.appendChild(overlay);

                // Setup event handlers
                const addBtn = content.querySelector('#import-add-btn');
                const stockSelect = content.querySelector('#import-stock-select');
                const sharesInput = content.querySelector('#import-shares');
                const priceInput = content.querySelector('#import-price');
                const statusDiv = content.querySelector('#import-status');
                const summaryDiv = content.querySelector('#import-summary');

                const updateSummary = () => {
                    const purchases = Object.entries(this.trackedTransactions)
                        .map(([stockId, data]) => {
                            const purchaseCount = data.purchases?.length || 0;
                            return purchaseCount > 0 ? `<div style="margin-bottom: 4px;">
                                <strong style="color: #4CAF50;">${data.name}</strong>: 
                                ${purchaseCount} purchase${purchaseCount > 1 ? 's' : ''}, 
                                ${data.totalShares.toLocaleString()} shares, 
                                avg $${(data.totalInvested / data.totalShares).toFixed(2)}/share
                            </div>` : '';
                        })
                        .filter(html => html !== '')
                        .join('');

                    if (purchases) {
                        summaryDiv.innerHTML = `<strong style="color: #fff; display: block; margin-bottom: 8px;">📊 Imported Purchases:</strong>${purchases}`;
                    } else {
                        summaryDiv.innerHTML = '<em style="color: #888;">No purchases imported yet</em>';
                    }
                };

                // Auto-convert shorthand notation as user types
                const handleShorthandInput = (input) => {
                    input.addEventListener('input', (e) => {
                        const value = e.target.value.toLowerCase().trim();
                        
                        // Check if ends with k, m, or b
                        if (value.match(/[\d.]+\s*[kmb]$/)) {
                            const converted = this.parseShorthandNumber(value);
                            if (converted !== null) {
                                e.target.value = converted.toString();
                                // Trigger visual feedback
                                e.target.style.background = '#1a4d1a';
                                setTimeout(() => {
                                    e.target.style.background = '#2a2a2a';
                                }, 200);
                            }
                        }
                    });
                    
                    // Also handle on blur (when user leaves the field)
                    input.addEventListener('blur', (e) => {
                        const value = e.target.value.trim();
                        const converted = this.parseShorthandNumber(value);
                        if (converted !== null && value.match(/[kmb]/i)) {
                            e.target.value = converted.toString();
                        }
                    });
                };

                // Apply auto-conversion to both inputs
                handleShorthandInput(sharesInput);
                handleShorthandInput(priceInput);

                updateSummary();

                addBtn.onclick = () => {
                    const stockId = parseInt(stockSelect.value);
                    const shares = this.parseShorthandNumber(sharesInput.value);
                    const pricePerShare = this.parseShorthandNumber(priceInput.value);

                    // Validation
                    if (!stockId) {
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#f44336';
                        statusDiv.style.color = '#fff';
                        statusDiv.textContent = '❌ Please select a stock';
                        return;
                    }

                    if (!shares || shares <= 0) {
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#f44336';
                        statusDiv.style.color = '#fff';
                        statusDiv.textContent = '❌ Please enter a valid number of shares (e.g., 1000 or 1k)';
                        return;
                    }

                    if (!pricePerShare || pricePerShare <= 0) {
                        statusDiv.style.display = 'block';
                        statusDiv.style.background = '#f44336';
                        statusDiv.style.color = '#fff';
                        statusDiv.textContent = '❌ Please enter a valid price per share (e.g., 45.50 or 1.5k)';
                        return;
                    }

                    // Get stock name
                    const stockName = stockSelect.options[stockSelect.selectedIndex].text.replace(/^\[.*?\]\s*/, '');

                    // Initialize stock tracking if not exists
                    if (!this.trackedTransactions[stockId]) {
                        this.trackedTransactions[stockId] = {
                            name: stockName,
                            purchases: [],
                            totalShares: 0,
                            totalInvested: 0
                        };
                    }

                    // Add purchase
                    const stock = this.trackedTransactions[stockId];
                    stock.purchases.push({
                        shares: shares,
                        price: pricePerShare,
                        timestamp: Date.now()
                    });
                    stock.totalShares += shares;
                    stock.totalInvested += shares * pricePerShare;

                    // Save
                    this.core.saveState('stockticker_transactions', this.trackedTransactions);

                    // Show success
                    statusDiv.style.display = 'block';
                    statusDiv.style.background = '#4CAF50';
                    statusDiv.style.color = '#fff';
                    statusDiv.textContent = `✅ Added ${shares.toLocaleString()} shares of ${stockName} at $${pricePerShare.toFixed(2)}/share`;

                    // Clear inputs
                    sharesInput.value = '';
                    priceInput.value = '';

                    // Update summary
                    updateSummary();

                    // Refresh ticker display if open
                    if (this.panel && document.body.contains(this.panel)) {
                        this.fetchStockData();
                    }

                    console.log(`📥 Imported: ${shares} shares of ${stockName} at $${pricePerShare.toFixed(2)}`);
                };

                // Close on overlay click
                overlay.onclick = (e) => {
                    if (e.target === overlay) {
                        overlay.remove();
                    }
                };
            }
        };

        // Register the module
        window.SidekickModules = window.SidekickModules || {};
        window.SidekickModules.StockTicker = StockTicker;
        console.log('📈 Stock Ticker Module loaded');
    });
})();
