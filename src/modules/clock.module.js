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
            showPoints: true,
            apiKey: null,

            init() {
                console.log('🕐 Initializing Clock Module...');
                this.loadSettings();
                this.startClock();
                
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
            },

            loadSettings() {
                this.showPoints = loadState('sidekick_show_points', true);
                this.apiKey = loadState('sidekick_api_key', '');
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

                const now = new Date();
                
                // UTC Time
                const utcTime = now.toUTCString().split(' ')[4]; // HH:MM:SS
                const utcDate = now.toUTCString().split(' ').slice(0, 4).join(' ');
                
                timeElement.textContent = utcTime;
                dateElement.textContent = utcDate.split(',')[1].trim(); // Remove day name
                
                // Add points pricing if available and enabled
                if (this.showPoints && this.pointsData) {
                    this.updatePointsDisplay();
                }
            },

            setupClockClickHandler() {
                // Wait for clock element to be available
                const checkForClock = () => {
                    const clockContainer = document.getElementById('sidekick-clock');
                    if (clockContainer) {
                        clockContainer.addEventListener('click', (e) => {
                            // Don't trigger if clicking on points display
                            if (e.target.id === 'clock-points') return;
                            
                            this.togglePointsDisplay();
                        });
                        console.log('✅ Clock click handler set up');
                    } else {
                        setTimeout(checkForClock, 100);
                    }
                };
                checkForClock();
            },

            async fetchPointsPricing() {
                if (!this.apiKey) {
                    console.log('⚠️ No API key set for points pricing');
                    return;
                }

                try {
                    const response = await fetch(`https://api.torn.com/market/pointsmarket?selections=pointsmarket&key=${this.apiKey}`);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    
                    if (data.error) {
                        console.error('API Error:', data.error);
                        NotificationSystem.show('API Error', data.error.error, 'error', 3000);
                        return;
                    }

                    this.pointsData = data.pointsmarket;
                    console.log('✅ Points pricing updated');
                    
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

            togglePointsDisplay() {
                this.showPoints = !this.showPoints;
                saveState('sidekick_show_points', this.showPoints);
                
                if (this.showPoints) {
                    // Enable points display and fetch fresh data
                    if (this.apiKey) {
                        this.fetchPointsPricing();
                    }
                    NotificationSystem.show('Points Display', 'Points pricing enabled', 'info', 2000);
                } else {
                    // Hide points display
                    const pointsDisplay = document.getElementById('clock-points');
                    if (pointsDisplay) {
                        pointsDisplay.remove();
                    }
                    NotificationSystem.show('Points Display', 'Points pricing disabled', 'info', 2000);
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
