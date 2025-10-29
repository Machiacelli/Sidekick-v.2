// ==UserScript==
// @name         Sidekick Stock Ticker Module
// @namespace    http://tampermonkey.net/
// @version      1.3.3
// @description  FIXED: Now fetches both user portfolio AND market prices for accurate display
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
            selectedStocks: [], // Array of stock IDs to display
            settingsWindow: null,
            
            init() {
                console.log('📈 Stock Ticker: Initializing...');
                
                // Load selected stocks from storage
                this.selectedStocks = this.core.loadState('stockticker_selected_stocks', []);
                
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
                
                // Load saved size or use defaults
                const savedSize = this.core.loadState('stockticker_size', { width: 320, height: 400 });
                
                panel.style.cssText = `
                    position: absolute;
                    background: #222;
                    border: 1px solid #444;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    width: ${savedSize.width}px;
                    height: ${savedSize.height}px;
                    min-width: 250px;
                    min-height: 150px;
                    max-width: 600px;
                    max-height: 800px;
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
                    
                    // Reset button state
                    autoAddOption.disabled = false;
                    autoAddOption.innerHTML = '<span style="margin-right: 8px;">✨</span>Auto-Add Owned Stocks';
                    
                    // Refresh the ticker display
                    this.fetchStockData();
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
                
                dropdown.appendChild(refreshOption);
                dropdown.appendChild(pinOption);
                dropdown.appendChild(autoAddOption);
                dropdown.appendChild(settingsOption);
                
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
                
                // Add resize observer to save size
                const resizeObserver = new ResizeObserver(() => {
                    const size = {
                        width: panel.offsetWidth,
                        height: panel.offsetHeight
                    };
                    this.core.saveState('stockticker_size', size);
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
                    // Show loading indicator
                    const loadingOverlay = document.createElement('div');
                    loadingOverlay.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: #4CAF50;
                        font-size: 24px;
                        z-index: 10;
                    `;
                    loadingOverlay.textContent = '🔄';
                    content.style.position = 'relative';
                    content.appendChild(loadingOverlay);

                    // Get API key from Core module's storage (same way TodoList does it)
                    console.log('📈 Stock Ticker: Attempting to fetch API key...');
                    console.log('📈 Stock Ticker: this.core:', this.core);
                    console.log('📈 Stock Ticker: this.core.loadState:', this.core?.loadState);
                    console.log('📈 Stock Ticker: this.core.STORAGE_KEYS:', this.core?.STORAGE_KEYS);
                    
                    if (!this.core || !this.core.loadState || !this.core.STORAGE_KEYS) {
                        console.error('❌ Stock Ticker: Core module not properly loaded');
                        loadingOverlay.remove();
                        this.showError(content, 'Core module not loaded. Please refresh the page.');
                        return;
                    }
                    
                    console.log('📈 Stock Ticker: API_KEY constant:', this.core.STORAGE_KEYS.API_KEY);
                    const apiKey = this.core.loadState(this.core.STORAGE_KEYS.API_KEY, '');
                    console.log('📈 Stock Ticker: Retrieved API key:', apiKey ? `${apiKey.substring(0, 4)}...` : 'EMPTY');
                    
                    if (!apiKey) {
                        console.error('❌ Stock Ticker: No API key found in storage');
                        loadingOverlay.remove();
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
                    
                    // Remove loading overlay
                    loadingOverlay.remove();

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
                    
                    // Merge: add current_price from market data to user portfolio stocks
                    this.stockData = {};
                    for (const [stockId, userStock] of Object.entries(userStocks)) {
                        this.stockData[stockId] = {
                            ...userStock,
                            current_price: marketStocks[stockId]?.current_price || 0,
                            name: marketStocks[stockId]?.name || userStock.name
                        };
                    }
                    
                    console.log('📈 Stock Ticker: Combined stock data:', this.stockData);
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
                if (this.selectedStocks.length > 0) {
                    filteredStocks = {};
                    for (const [stockId, stockData] of Object.entries(stocks)) {
                        if (this.selectedStocks.includes(parseInt(stockId))) {
                            filteredStocks[stockId] = stockData;
                        }
                    }
                }

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
                let totalInvested = 0;
                const stocksHTML = [];

                // Sort stocks by value (descending)
                const sortedStocks = Object.entries(filteredStocks).sort((a, b) => {
                    const stockA = a[1];
                    const stockB = b[1];
                    
                    // Calculate total shares from transactions
                    const getShares = (stock) => {
                        if (!stock.transactions || !Array.isArray(stock.transactions)) return 0;
                        return stock.transactions.reduce((sum, t) => sum + (t.shares || 0), 0);
                    };
                    
                    const valueA = getShares(stockA) * (stockA.current_price || 0);
                    const valueB = getShares(stockB) * (stockB.current_price || 0);
                    return valueB - valueA;
                });

                for (const [stockId, stock] of sortedStocks) {
                    console.log(`📈 Processing stock ${stockId}:`, stock);
                    
                    const transactions = stock.transactions || [];
                    const currentPrice = stock.current_price || 0;
                    const stockName = stock.name || `Stock #${stockId}`;
                    
                    console.log(`📈 Stock ${stockId} - Name: ${stockName}, Current Price: ${currentPrice}`);
                    
                    // Calculate average bought price from transactions
                    let totalShares = 0;
                    let totalCost = 0;
                    
                    if (transactions && Array.isArray(transactions)) {
                        for (const transaction of transactions) {
                            const shares = transaction.shares || 0;
                            const boughtPrice = transaction.bought_price || 0;
                            totalShares += shares;
                            totalCost += shares * boughtPrice;
                        }
                    }
                    
                    const avgBoughtPrice = totalShares > 0 ? totalCost / totalShares : 0;
                    const shares = totalShares;
                    
                    console.log(`📈 Stock ${stockId} - Shares: ${shares}, Current Price: ${currentPrice}, Avg Bought: ${avgBoughtPrice}`);
                    
                    // Calculate values
                    const currentValue = shares * currentPrice;
                    const invested = totalCost;
                    const profit = currentValue - invested;
                    const profitPercent = invested > 0 ? ((profit / invested) * 100).toFixed(2) : '0.00';
                    
                    totalValue += currentValue;
                    totalInvested += invested;

                    const isProfit = profit >= 0;
                    const profitColor = isProfit ? '#4CAF50' : '#f44336';
                    const arrow = isProfit ? '↗' : '↘';

                    console.log(`📈 Stock ${stockId} calculated:`, {
                        name: stockName,
                        shares,
                        currentPrice,
                        avgBoughtPrice,
                        currentValue,
                        invested,
                        profit,
                        profitPercent
                    });

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
                                    ${stockName}
                                </div>
                                <div style="color: ${profitColor}; font-weight: 600; font-size: 14px;">
                                    ${arrow} ${profitPercent}%
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Shares</div>
                                    <div style="color: #fff;">${shares.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Current Price</div>
                                    <div style="color: #fff;">$${currentPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Avg Bought At</div>
                                    <div style="color: #fff;">$${avgBoughtPrice.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Total Value</div>
                                    <div style="color: #fff;">$${currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                                <div style="grid-column: 1 / -1;">
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Profit/Loss</div>
                                    <div style="color: ${profitColor}; font-weight: 600;">
                                        ${isProfit ? '+' : ''}$${profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `);
                }

                const totalProfit = totalValue - totalInvested;
                const totalProfitPercent = ((totalProfit / totalInvested) * 100).toFixed(2);
                const isTotalProfit = totalProfit >= 0;

                const summaryHTML = `
                    <div style="
                        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                        border: 1px solid #3b82f6;
                        border-radius: 8px;
                        padding: 16px;
                        margin-bottom: 16px;
                        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
                    ">
                        <div style="color: #93c5fd; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                            Portfolio Summary
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <div style="color: #bfdbfe; font-size: 10px; margin-bottom: 4px;">Total Value</div>
                                <div style="color: #fff; font-size: 18px; font-weight: 700;">
                                    $${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </div>
                            </div>
                            <div>
                                <div style="color: #bfdbfe; font-size: 10px; margin-bottom: 4px;">Total P/L</div>
                                <div style="color: ${isTotalProfit ? '#4ade80' : '#f87171'}; font-size: 18px; font-weight: 700;">
                                    ${isTotalProfit ? '+' : ''}$${totalProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    <span style="font-size: 14px; margin-left: 4px;">(${isTotalProfit ? '+' : ''}${totalProfitPercent}%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                content.innerHTML = summaryHTML + stocksHTML.join('');

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

                // All available Torn stocks with short names
                const allStocks = [
                    { id: 1, short: 'TCI', name: 'Torn City Invest' },
                    { id: 2, short: 'CRU', name: 'Crude & Co' },
                    { id: 3, short: 'TCS', name: 'Torn City Stocks' },
                    { id: 4, short: 'SYS', name: 'Syster' },
                    { id: 5, short: 'LAG', name: 'Lucky Clothing Co.' },
                    { id: 6, short: 'FHC', name: 'Feathery Hotels' },
                    { id: 7, short: 'SYM', name: 'Torn & Shanghai Banking' },
                    { id: 8, short: 'IIL', name: 'I Industries Ltd.' },
                    { id: 9, short: 'GRN', name: 'Messaging Inc.' },
                    { id: 10, short: 'TMI', name: 'TC Music Industries' },
                    { id: 11, short: 'TCP', name: 'Torn City Health Service' },
                    { id: 12, short: 'IOU', name: 'Grain' },
                    { id: 13, short: 'GRS', name: 'TC Media Productions' },
                    { id: 14, short: 'CNC', name: 'Empty Lunchbox Casinos' },
                    { id: 15, short: 'MSG', name: 'Alcoholohol' },
                    { id: 16, short: 'TMU', name: 'Evo Estates' },
                    { id: 17, short: 'TCP', name: 'HEX' },
                    { id: 18, short: 'IIL', name: 'TC Clothing' },
                    { id: 19, short: 'TCT', name: 'The Torn City Times' },
                    { id: 20, short: 'CRU', name: 'Big Al\'s Gun Shop' },
                    { id: 21, short: 'TCB', name: 'TC Television' },
                    { id: 22, short: 'TCM', name: 'YazBread' },
                    { id: 23, short: 'YAZ', name: 'Flowers For You' },
                    { id: 24, short: 'TCM', name: 'Canine Couture' },
                    { id: 25, short: 'LSC', name: 'Foot Ball Association' },
                    { id: 26, short: 'EWM', name: 'Sail Boats & Yachts' },
                    { id: 27, short: 'TCM', name: 'Performance Automobiles' },
                    { id: 28, short: 'MCS', name: 'Tik' },
                    { id: 29, short: 'EWM', name: 'The Torn City Museum' },
                    { id: 30, short: 'SYM', name: 'TC Mining Corp.' },
                    { id: 31, short: 'TCM', name: 'TC Oil Rig' },
                    { id: 32, short: 'TCM', name: 'Pharmata' },
                    { id: 33, short: 'HRG', name: 'Home Retail Group' },
                    { id: 34, short: 'TEL', name: 'Tell Group' },
                    { id: 35, short: 'PRN', name: 'Presto Logs' }
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
            }
        };

        // Register the module
        window.SidekickModules = window.SidekickModules || {};
        window.SidekickModules.StockTicker = StockTicker;
        console.log('📈 Stock Ticker Module loaded');
    });
})();
