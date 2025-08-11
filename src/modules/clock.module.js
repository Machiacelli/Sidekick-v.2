// ==UserScript==
// @name         Sidekick Clock Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Clock and points pricing functionality for Sidekick sidebar
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
        const { saveState, loadState, NotificationSystem } = window.SidekickModules.Core;

        const ClockModule = {
            clockInterval: null,
            pointsData: null,
            showPoints: false,
            apiKey: null,
            updateTimeout: null,
            clickHandlerSetup: false,
            initialized: false,

            init() {
                console.log('🕐 Initializing Clock Module...');
                
                // Ensure single instance
                if (window.SidekickModules?.Clock?.initialized) {
                    console.log('⚠️ Clock module already initialized, skipping...');
                    return;
                }
                
                this.loadSettings();
                this.startClock();
                
                // Load manual price if set
                const manualPrice = loadState('sidekick_manual_points_price', null);
                if (manualPrice) {
                    this.pointsData = [{ cost: manualPrice }];
                }
                
                // Only fetch points if API key exists
                if (this.apiKey) {
                    this.fetchPointsPricing();
                    // Refresh points pricing every 5 minutes
                    setInterval(() => {
                        this.fetchPointsPricing();
                    }, 5 * 60 * 1000);
                }
                
                // Set up clock click handler
                this.setupClockClickHandler();
                
                // Mark as initialized
                this.initialized = true;
            },

            loadSettings() {
                const savedShowPoints = loadState('sidekick_show_points', false);
                this.showPoints = savedShowPoints;
                this.apiKey = loadState('sidekick_api_key', '');
                console.log('🔧 Clock settings loaded - showPoints:', this.showPoints, 'apiKey:', this.apiKey ? 'SET' : 'NOT SET');
            },

            startClock() {
                this.updateClock();
                this.clockInterval = setInterval(() => {
                    this.updateClock();
                }, 1000);
            },

            updateClock() {
                const timeElement = document.getElementById('clock-time');
                const dateElement = document.getElementById('clock-date');
                
                if (!timeElement || !dateElement) return;

                // Reload the current state from storage to ensure consistency
                const currentShowPoints = loadState('sidekick_show_points', false);
                if (this.showPoints !== currentShowPoints) {
                    console.log('🔄 State mismatch detected! Correcting showPoints from', this.showPoints, 'to', currentShowPoints);
                    this.showPoints = currentShowPoints;
                }

                // Debug: Log the current state every 10 seconds to avoid spam
                if (!this.lastDebugTime || Date.now() - this.lastDebugTime > 10000) {
                    console.log('🕐 Clock update - showPoints:', this.showPoints, 'hasPointsData:', !!this.pointsData);
                    this.lastDebugTime = Date.now();
                }

                if (this.showPoints && this.pointsData && this.pointsData.length > 0) {
                    // Show points price - find cheapest offer
                    const cheapestOffer = Math.min(...this.pointsData.map(offer => offer.cost));
                    timeElement.textContent = `$${cheapestOffer.toLocaleString()}`;
                    timeElement.style.color = '#4CAF50';
                    dateElement.textContent = 'Points';
                    dateElement.style.color = '#4CAF50';
                } else if (this.showPoints && (!this.pointsData || this.pointsData.length === 0)) {
                    // Show "No Data" when points mode is enabled but no data available
                    timeElement.textContent = 'No Data';
                    timeElement.style.color = '#ff9800';
                    dateElement.textContent = 'Points';
                    dateElement.style.color = '#ff9800';
                } else {
                    // Show current UTC time (Torn time)
                    const now = new Date();
                    
                    // Format time as HH:MM:SS using UTC
                    const hours = String(now.getUTCHours()).padStart(2, '0');
                    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
                    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
                    const timeStr = `${hours}:${minutes}:${seconds}`;
                    
                    // Format date as "11 Aug"
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const day = now.getUTCDate();
                    const month = months[now.getUTCMonth()];
                    const dateStr = `${day} ${month}`;
                    
                    timeElement.textContent = timeStr;
                    timeElement.style.color = '#fff';
                    dateElement.textContent = dateStr;
                    dateElement.style.color = '#aaa';
                }
            },

            setupClockClickHandler() {
                // Prevent multiple event listeners
                if (this.clickHandlerSetup) {
                    console.log('⚠️ Clock click handler already set up, skipping...');
                    return;
                }
                
                // Wait for clock element to be available
                const checkForClock = () => {
                    const clockContainer = document.getElementById('sidekick-clock');
                    if (clockContainer) {
                        // Remove any existing listeners first
                        clockContainer.removeEventListener('click', this.boundToggle);
                        clockContainer.removeEventListener('contextmenu', this.boundRightClick);
                        
                        // Create bound functions to allow proper removal
                        this.boundToggle = () => this.togglePointsDisplay();
                        this.boundRightClick = (e) => {
                            e.preventDefault();
                            this.promptForManualPrice();
                        };
                        
                        clockContainer.addEventListener('click', this.boundToggle);
                        clockContainer.addEventListener('contextmenu', this.boundRightClick);
                        
                        this.clickHandlerSetup = true;
                        console.log('✅ Clock click handler set up');
                    } else {
                        setTimeout(checkForClock, 100);
                    }
                };
                checkForClock();
            },

            togglePointsDisplay() {
                console.log('🔄 TOGGLE CALLED - Current showPoints:', this.showPoints, 'Will change to:', !this.showPoints);
                console.trace('Toggle called from:'); // This will show the call stack
                
                this.showPoints = !this.showPoints;
                saveState('sidekick_show_points', this.showPoints);
                
                // Clear any pending updates to prevent race conditions
                if (this.updateTimeout) {
                    clearTimeout(this.updateTimeout);
                }
                
                // Immediate update with slight delay to ensure state is saved
                this.updateTimeout = setTimeout(() => {
                    this.updateClock();
                    console.log('✅ Toggle complete, showing points:', this.showPoints);
                }, 10);
            },

            promptForManualPrice() {
                const currentPrice = this.pointsData && this.pointsData.length > 0 
                    ? Math.min(...this.pointsData.map(offer => offer.cost)) 
                    : '';
                
                const newPrice = prompt(`Enter current points price per dollar:\n(Current: $${currentPrice || 'Not set'})`, currentPrice);
                
                if (newPrice !== null && newPrice.trim() !== '') {
                    const price = parseFloat(newPrice.trim().replace(/[^\d.]/g, ''));
                    if (!isNaN(price) && price > 0) {
                        // Create manual price data
                        this.pointsData = [{ cost: price }];
                        saveState('sidekick_manual_points_price', price);
                        
                        if (this.showPoints) {
                            this.updateClock();
                        }
                        NotificationSystem.show('Price Updated', `Points price set to $${price.toLocaleString()}`, 'info');
                    } else {
                        NotificationSystem.show('Error', 'Please enter a valid positive number', 'error');
                    }
                }
            },

            async fetchPointsPricing() {
                if (!this.apiKey) {
                    console.log('⚠️ No API key set for points pricing');
                    return;
                }

                try {
                    const response = await fetch(`https://api.torn.com/market/?selections=pointsmarket&key=${this.apiKey}`);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    
                    if (data.error) {
                        console.error('API Error:', data.error);
                        NotificationSystem.show('API Error', data.error.error, 'error', 3000);
                        return;
                    }

                    if (data.pointsmarket && Object.keys(data.pointsmarket).length > 0) {
                        // Convert object to array and extract costs
                        this.pointsData = Object.values(data.pointsmarket);
                        console.log('✅ Points pricing updated:', this.pointsData.length, 'offers');
                    }
                    
                } catch (error) {
                    console.error('Failed to fetch points pricing:', error);
                    // Don't show notification for every failure to avoid spam
                }
            },

            updatePointsDisplay() {
                if (!this.pointsData || !this.pointsData.length) return;

                const clockContainer = document.getElementById('sidekick-clock');
                if (!clockContainer) return;

                // Find the cheapest points offer
                const cheapestOffer = this.pointsData.reduce((min, offer) => {
                    return offer.cost < min.cost ? offer : min;
                }, this.pointsData[0]);

                // Check if points display already exists
                let pointsDisplay = document.getElementById('clock-points');
                if (!pointsDisplay) {
                    pointsDisplay = document.createElement('div');
                    pointsDisplay.id = 'clock-points';
                    pointsDisplay.style.cssText = `
                        font-size: 10px;
                        color: #4CAF50;
                        margin-top: 2px;
                        text-align: center;
                        cursor: pointer;
                        border: 1px solid rgba(76, 175, 80, 0.3);
                        border-radius: 3px;
                        padding: 1px 3px;
                        background: rgba(76, 175, 80, 0.1);
                        transition: all 0.3s ease;
                    `;
                    
                    pointsDisplay.addEventListener('click', () => {
                        this.togglePointsDisplay();
                    });
                    
                    pointsDisplay.addEventListener('mouseenter', () => {
                        pointsDisplay.style.background = 'rgba(76, 175, 80, 0.2)';
                    });
                    
                    pointsDisplay.addEventListener('mouseleave', () => {
                        pointsDisplay.style.background = 'rgba(76, 175, 80, 0.1)';
                    });
                    
                    clockContainer.appendChild(pointsDisplay);
                }

                // Format the cost nicely
                const costText = this.formatMoney(cheapestOffer.cost);
                pointsDisplay.textContent = `💎 ${costText}`;
                pointsDisplay.title = `Cheapest points: $${costText} for ${cheapestOffer.quantity} points\nClick to toggle display`;
            },

            formatMoney(amount) {
                // Convert to appropriate units (K, M, B)
                if (amount >= 1000000000) {
                    return (amount / 1000000000).toFixed(1) + 'B';
                } else if (amount >= 1000000) {
                    return (amount / 1000000).toFixed(1) + 'M';
                } else if (amount >= 1000) {
                    return (amount / 1000).toFixed(0) + 'K';
                } else {
                    return amount.toString();
                }
            },

            updateApiKey(newApiKey) {
                this.apiKey = newApiKey;
                if (newApiKey) {
                    this.fetchPointsPricing();
                }
            },

            destroy() {
                if (this.clockInterval) {
                    clearInterval(this.clockInterval);
                    this.clockInterval = null;
                }
            }
        };

        // Export to global scope
        window.SidekickModules.Clock = ClockModule;

        // Auto-initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => ClockModule.init(), 500);
            });
        } else {
            setTimeout(() => ClockModule.init(), 500);
        }

        console.log('✅ Clock module loaded');
    });

})();
