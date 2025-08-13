// ==UserScript==
// @name         Sidekick Flight Tracker Module
// @namespace    http://tampermonkey.net/
// @version      0.4.2
// @description  Flight tracker functionality for Sidekick
// @author       Daxl
// @match        https://www.torn.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Wait for SidekickModules to be available
    function waitForSidekickModules() {
        if (typeof window.SidekickModules !== 'undefined') {
            initializeFlightTracker();
        } else {
            setTimeout(waitForSidekickModules, 100);
        }
    }
    
    function initializeFlightTracker() {
        console.log('✈️ Initializing Flight Tracker module...');
        
        window.SidekickModules = window.SidekickModules || {};
        
        window.SidekickModules.FlightTracker = {
            name: 'FlightTracker',
            core: null,
            
            init(coreModule) {
                this.core = coreModule;
                console.log('✈️ Flight Tracker module initialized');
                
                // Register as flight tracker button handler
                window.createFlightTrackerTimer = this.createFlightTrackerTimer.bind(this);
            },
            
            createFlightTrackerTimer() {
                console.log('✈️ Creating flight tracker timer...');
                
                try {
                    // Check if we're on a flight page by looking for flight information
                    const flightInfo = this.extractFlightInfo();
                    
                    if (!flightInfo) {
                        // Use proper notification system reference
                        if (this.core && this.core.NotificationSystem) {
                            this.core.NotificationSystem.show('Flight Tracker', 'Please navigate to a flight page to track your flight', 'warning', 3000);
                        } else {
                            console.warn('✈️ Flight Tracker: Please navigate to a flight page to track your flight');
                        }
                        return;
                    }
                    
                    // Create timer using the Clock module
                    if (window.SidekickModules.Clock && window.SidekickModules.Clock.createTimer) {
                        const timerData = {
                            name: `Flight to ${flightInfo.destination}`,
                            duration: flightInfo.duration,
                            type: 'countdown'
                        };
                        
                        window.SidekickModules.Clock.createTimer(timerData);
                        if (this.core && this.core.NotificationSystem) {
                            this.core.NotificationSystem.show('Flight Tracker', `Flight timer created: ${timerData.name}`, 'success', 3000);
                        }
                    } else {
                        console.error('Clock module not available for timer creation');
                        if (this.core && this.core.NotificationSystem) {
                            this.core.NotificationSystem.show('Flight Tracker', 'Clock module not available', 'error', 3000);
                        }
                    }
                    
                } catch (error) {
                    console.error('✈️ Error creating flight tracker timer:', error);
                    if (this.core && this.core.NotificationSystem) {
                        this.core.NotificationSystem.show('Flight Tracker', 'Error creating flight timer', 'error', 3000);
                    }
                }
            },
            
            extractFlightInfo() {
                console.log('✈️ Extracting flight information from page...');
                
                try {
                    // Method 1: Look for flight duration in various places
                    let duration = null;
                    let destination = 'Unknown';
                    
                    // Try to find flight duration from page elements
                    const durationSelectors = [
                        '.flight-duration',
                        '.duration',
                        '[class*="duration"]',
                        '[class*="time"]',
                        '.travel-time'
                    ];
                    
                    for (const selector of durationSelectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            const text = element.textContent.trim();
                            duration = this.parseDuration(text);
                            if (duration) break;
                        }
                    }
                    
                    // Method 2: Look for destination information
                    const destinationSelectors = [
                        '.destination',
                        '.location',
                        '[class*="destination"]',
                        '.travel-destination'
                    ];
                    
                    for (const selector of destinationSelectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            destination = element.textContent.trim();
                            break;
                        }
                    }
                    
                    // Method 3: Try to parse from any text on the page that looks like flight info
                    if (!duration) {
                        const bodyText = document.body.textContent;
                        const timeMatch = bodyText.match(/(\d+)\s*hours?\s*(\d+)?\s*minutes?/i);
                        if (timeMatch) {
                            const hours = parseInt(timeMatch[1]) || 0;
                            const minutes = parseInt(timeMatch[2]) || 0;
                            duration = (hours * 60) + minutes;
                        }
                    }
                    
                    // If we found duration, return flight info
                    if (duration && duration > 0) {
                        console.log('✈️ Flight info extracted:', { destination, duration });
                        return { destination, duration };
                    }
                    
                    console.log('✈️ No flight information found on current page');
                    return null;
                    
                } catch (error) {
                    console.error('✈️ Error extracting flight info:', error);
                    return null;
                }
            },
            
            parseDuration(text) {
                // Parse various duration formats
                try {
                    // Format: "2h 30m" or "2 hours 30 minutes"
                    const hoursMinutesMatch = text.match(/(\d+)\s*h(?:ours?)?\s*(\d+)\s*m(?:inutes?)?/i);
                    if (hoursMinutesMatch) {
                        return (parseInt(hoursMinutesMatch[1]) * 60) + parseInt(hoursMinutesMatch[2]);
                    }
                    
                    // Format: "150 minutes" or "150m"
                    const minutesMatch = text.match(/(\d+)\s*m(?:inutes?)?/i);
                    if (minutesMatch) {
                        return parseInt(minutesMatch[1]);
                    }
                    
                    // Format: "2 hours" or "2h"
                    const hoursMatch = text.match(/(\d+)\s*h(?:ours?)?/i);
                    if (hoursMatch) {
                        return parseInt(hoursMatch[1]) * 60;
                    }
                    
                    return null;
                } catch (error) {
                    console.error('Error parsing duration:', error);
                    return null;
                }
            }
        };
        
        console.log('✈️ Flight Tracker module registered');
    }
    
    // Start the initialization
    waitForSidekickModules();
})();
