// ==UserScript==
// @name         Sidekick Stock Ticker Module
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  UPDATED: Dropdown menu + fixed API key using this.core (like TodoList)
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
            
            init() {
                console.log('📈 Stock Ticker: Initializing...');
                
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
                panel.style.cssText = `
                    position: absolute;
                    background: #222;
                    border: 1px solid #444;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    min-width: 250px;
                    min-height: 150px;
                    max-width: 500px;
                    max-height: 600px;
                    z-index: 1000;
                    resize: both;
                    overflow: auto;
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
                `;

                const titleSection = document.createElement('div');
                titleSection.style.cssText = 'display: flex; align-items: center; gap: 8px;';
                
                const icon = document.createElement('span');
                icon.textContent = '📈';
                icon.style.fontSize = '16px';
                
                const title = document.createElement('span');
                title.textContent = 'Stock Ticker';
                title.style.cssText = 'color: #fff; font-weight: 600; font-size: 13px;';
                
                titleSection.appendChild(icon);
                titleSection.appendChild(title);

                const controls = document.createElement('div');
                controls.style.cssText = 'display: flex; align-items: center; gap: 4px;';

                // Menu button (with dropdown)
                const menuBtn = document.createElement('button');
                menuBtn.innerHTML = '⋮';
                menuBtn.title = 'Options';
                menuBtn.style.cssText = `
                    background: none;
                    border: none;
                    color: #bbb;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 4px 6px;
                    border-radius: 4px;
                    transition: all 0.2s;
                    position: relative;
                `;
                menuBtn.onmouseover = () => menuBtn.style.background = '#444';
                menuBtn.onmouseout = () => menuBtn.style.background = 'none';
                
                // Dropdown menu
                const dropdown = document.createElement('div');
                dropdown.style.cssText = `
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: #2a2a2a;
                    border: 1px solid #555;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    z-index: 10000;
                    min-width: 140px;
                    display: none;
                    margin-top: 4px;
                `;
                
                // Refresh option
                const refreshOption = document.createElement('div');
                refreshOption.innerHTML = '<span style="margin-right: 8px;">🔄</span>Refresh';
                refreshOption.style.cssText = `
                    padding: 8px 12px;
                    color: #ccc;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    transition: background 0.2s;
                `;
                refreshOption.onmouseover = () => refreshOption.style.background = '#333';
                refreshOption.onmouseout = () => refreshOption.style.background = 'transparent';
                refreshOption.onclick = (e) => {
                    e.stopPropagation();
                    this.fetchStockData();
                    dropdown.style.display = 'none';
                };
                
                // Pin option
                const pinOption = document.createElement('div');
                pinOption.innerHTML = `<span style="margin-right: 8px;">${this.isPinned ? '📌' : '📍'}</span>${this.isPinned ? 'Unpin' : 'Pin'}`;
                pinOption.style.cssText = `
                    padding: 8px 12px;
                    color: #ccc;
                    cursor: pointer;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    transition: background 0.2s;
                `;
                pinOption.onmouseover = () => pinOption.style.background = '#333';
                pinOption.onmouseout = () => pinOption.style.background = 'transparent';
                pinOption.onclick = (e) => {
                    e.stopPropagation();
                    this.isPinned = !this.isPinned;
                    pinOption.innerHTML = `<span style="margin-right: 8px;">${this.isPinned ? '📌' : '📍'}</span>${this.isPinned ? 'Unpin' : 'Pin'}`;
                    header.style.cursor = this.isPinned ? 'default' : 'move';
                    this.core.saveState('stockticker_pinned', this.isPinned);
                    dropdown.style.display = 'none';
                };
                
                dropdown.appendChild(refreshOption);
                dropdown.appendChild(pinOption);
                
                menuBtn.appendChild(dropdown);
                
                // Toggle dropdown on click
                menuBtn.onclick = (e) => {
                    e.stopPropagation();
                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                };
                
                // Close dropdown when clicking outside
                document.addEventListener('click', () => {
                    dropdown.style.display = 'none';
                });

                // Close button (outside dropdown)
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

                controls.appendChild(menuBtn);
                controls.appendChild(closeBtn);

                header.appendChild(titleSection);
                header.appendChild(controls);

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

                    // Fetch user's torn stocks from API
                    console.log('📈 Stock Ticker: Fetching stock data from API...');
                    const response = await fetch(`/torn-api/user?selections=stocks&key=${apiKey}`);
                    
                    if (!response.ok) {
                        throw new Error('Failed to fetch stock data');
                    }

                    const data = await response.json();
                    
                    // Remove loading overlay
                    loadingOverlay.remove();

                    if (data.error) {
                        this.showError(content, 'API Error: ' + data.error.error);
                        return;
                    }

                    this.stockData = data.stocks || {};
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

                let totalValue = 0;
                let totalInvested = 0;
                const stocksHTML = [];

                // Sort stocks by value (descending)
                const sortedStocks = Object.entries(stocks).sort((a, b) => {
                    const valueA = a[1].total_shares * a[1].current_price;
                    const valueB = b[1].total_shares * b[1].current_price;
                    return valueB - valueA;
                });

                for (const [stockId, stock] of sortedStocks) {
                    const currentValue = stock.total_shares * stock.current_price;
                    const invested = stock.total_shares * stock.bought_price;
                    const profit = currentValue - invested;
                    const profitPercent = ((profit / invested) * 100).toFixed(2);
                    
                    totalValue += currentValue;
                    totalInvested += invested;

                    const isProfit = profit >= 0;
                    const profitColor = isProfit ? '#4CAF50' : '#f44336';
                    const arrow = isProfit ? '↗' : '↘';

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
                                    ${stock.stock_name || 'Stock #' + stockId}
                                </div>
                                <div style="color: ${profitColor}; font-weight: 600; font-size: 14px;">
                                    ${arrow} ${profitPercent}%
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Shares</div>
                                    <div style="color: #fff;">${stock.total_shares.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Current Price</div>
                                    <div style="color: #fff;">$${stock.current_price.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Total Value</div>
                                    <div style="color: #fff;">$${currentValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                                <div>
                                    <div style="color: #888; font-size: 10px; margin-bottom: 2px;">Profit/Loss</div>
                                    <div style="color: ${profitColor};">
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
            }
        };

        // Register the module
        window.SidekickModules = window.SidekickModules || {};
        window.SidekickModules.StockTicker = StockTicker;
        console.log('📈 Stock Ticker Module loaded');
    });
})();
