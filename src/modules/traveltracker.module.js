// ==UserScript==
// @name         Sidekick Travel Tracker Module
// @namespace    http://tampermonkey.net/
// @version      3.0.0
// @description  Travel tracker with DOM selection, plane detection, and countdown timers - modular approach
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
        if (window.SidekickModules?.Core) {
            callback();
        } else {
            setTimeout(() => waitForCore(callback), 100);
        }
    }

    waitForCore(() => {
        const TravelTrackerModule = {
            name: 'TravelTracker',
            version: '3.0.0',
            isActive: false,
            isMarkingMode: false,
            currentTracker: null,
            statusDisplay: null,
            
            // Travel times table (in minutes) - based on Torn Wiki
            travelTimes: {
                'argentina': { commercial: 167, private: 134 },
                'canada': { commercial: 41, private: 33 },
                'cayman islands': { commercial: 35, private: 28 },
                'china': { commercial: 242, private: 194 },
                'hawaii': { commercial: 103, private: 82 },
                'japan': { commercial: 220, private: 176 },
                'mexico': { commercial: 26, private: 21 },
                'south africa': { commercial: 297, private: 238 },
                'switzerland': { commercial: 158, private: 126 },
                'uae': { commercial: 273, private: 218 },
                'united arab emirates': { commercial: 273, private: 218 },
                'united kingdom': { commercial: 127, private: 102 },
                'uk': { commercial: 127, private: 102 }
            },

            init() {
                console.log('✈️ Initializing Travel Tracker Module v3.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Travel Tracker');
                    return false;
                }

                // Load any saved tracking data
                this.loadState();
                
                console.log('✅ Travel Tracker module initialized successfully');
                return true;
            },

            // Main activation method - called when user clicks Travel Tracker button
            activate() {
                console.log('✈️ Travel Tracker activated!');
                
                if (this.isMarkingMode) {
                    this.exitMarkingMode();
                    return;
                }

                this.enterMarkingMode();
            },

            enterMarkingMode() {
                console.log('🎯 Entering DOM element selection mode...');
                this.isMarkingMode = true;
                document.body.style.cursor = 'crosshair';
                
                // Show instructions
                this.showInstructions();
                
                // Add event listeners
                this.addEventListeners();
                
                this.core.NotificationSystem.show(
                    'Travel Tracker', 
                    'Click on the travel status element to start tracking', 
                    'info'
                );
            },

            exitMarkingMode() {
                console.log('🚫 Exiting DOM element selection mode...');
                this.isMarkingMode = false;
                document.body.style.cursor = '';
                
                // Remove event listeners
                this.removeEventListeners();
                
                // Hide instructions
                this.hideInstructions();
                
                // Remove hover effects
                const highlighted = document.querySelectorAll('.travel-tracker-highlight');
                highlighted.forEach(el => el.classList.remove('travel-tracker-highlight'));
                
                this.core.NotificationSystem.show(
                    'Travel Tracker', 
                    'Element selection cancelled', 
                    'info'
                );
            },

            addEventListeners() {
                // Bind methods to preserve 'this' context
                this.handleClick = this.handleClick.bind(this);
                this.handleMouseOver = this.handleMouseOver.bind(this);
                this.handleMouseOut = this.handleMouseOut.bind(this);
                this.handleEscape = this.handleEscape.bind(this);
                
                document.addEventListener('click', this.handleClick, true);
                document.addEventListener('mouseover', this.handleMouseOver, true);
                document.addEventListener('mouseout', this.handleMouseOut, true);
                document.addEventListener('keydown', this.handleEscape);
            },

            removeEventListeners() {
                document.removeEventListener('click', this.handleClick, true);
                document.removeEventListener('mouseover', this.handleMouseOver, true);
                document.removeEventListener('mouseout', this.handleMouseOut, true);
                document.removeEventListener('keydown', this.handleEscape);
            },

            handleClick(e) {
                if (!this.isMarkingMode) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const element = e.target;
                const text = element.textContent.toLowerCase();
                
                console.log('🎯 Element clicked:', element, 'Text:', text);
                
                // Validate if this is a travel-related element
                if (this.isValidTravelElement(text)) {
                    this.createTracker(element);
                    this.exitMarkingMode();
                } else {
                    this.core.NotificationSystem.show(
                        'Travel Tracker', 
                        'Please select a travel status element (containing travel, flying, abroad, etc.)', 
                        'warning'
                    );
                }
            },

            handleMouseOver(e) {
                if (!this.isMarkingMode) return;
                e.target.classList.add('travel-tracker-highlight');
            },

            handleMouseOut(e) {
                if (!this.isMarkingMode) return;
                e.target.classList.remove('travel-tracker-highlight');
            },

            handleEscape(e) {
                if (e.key === 'Escape' && this.isMarkingMode) {
                    this.exitMarkingMode();
                }
            },

            isValidTravelElement(text) {
                const travelKeywords = [
                    'traveling', 'travelling', 'flying', 'flight', 'abroad', 'landed', 'returning',
                    'argentina', 'canada', 'cayman', 'china', 'hawaii', 'japan',
                    'mexico', 'south africa', 'switzerland', 'uae', 'united kingdom', 'uk'
                ];
                
                return travelKeywords.some(keyword => text.includes(keyword));
            },

            createTracker(element) {
                console.log('🎯 Creating tracker for element:', element);
                
                // Remove any existing tracker
                this.removeCurrentTracker();
                
                const tracker = {
                    id: 'travel-tracker-' + Date.now(),
                    element: element,
                    selector: this.generateSelector(element),
                    initialText: element.textContent,
                    lastText: element.textContent,
                    createdAt: Date.now(),
                    destination: this.extractDestination(element.textContent),
                    planeType: this.detectPlaneType(),
                    status: 'monitoring'
                };
                
                this.currentTracker = tracker;
                this.saveState();
                
                // Create status display
                this.createStatusDisplay();
                
                // Start monitoring
                this.startMonitoring();
                
                this.core.NotificationSystem.show(
                    'Travel Tracker', 
                    `Now tracking travel to ${tracker.destination}!`, 
                    'success'
                );
                
                console.log('✅ Travel tracker created successfully:', tracker);
            },

            generateSelector(element) {
                try {
                    const path = [];
                    let current = element;
                    
                    while (current && current !== document.body) {
                        let selector = current.tagName.toLowerCase();
                        
                        if (current.id) {
                            selector += '#' + current.id;
                            path.unshift(selector);
                            break;
                        } else if (current.className) {
                            const classes = Array.from(current.classList).filter(cls => 
                                !cls.includes('travel-tracker-highlight')
                            );
                            if (classes.length > 0) {
                                selector += '.' + classes.join('.');
                            }
                        }
                        
                        path.unshift(selector);
                        current = current.parentElement;
                    }
                    
                    return path.join(' > ');
                } catch (error) {
                    console.warn('Failed to generate selector:', error);
                    return null;
                }
            },

            extractDestination(text) {
                const lowerText = text.toLowerCase();
                const destinations = Object.keys(this.travelTimes);
                
                for (const dest of destinations) {
                    if (lowerText.includes(dest)) {
                        return dest.charAt(0).toUpperCase() + dest.slice(1);
                    }
                }
                
                return 'Unknown';
            },

            detectPlaneType() {
                // Look for plane images to determine type
                const images = document.querySelectorAll('img[src*="plane"], img[src*="flight"], img[src*="travel"]');
                
                for (const img of images) {
                    const src = img.src.toLowerCase();
                    const alt = (img.alt || '').toLowerCase();
                    
                    if (src.includes('commercial') || src.includes('airline') || alt.includes('commercial')) {
                        return 'commercial';
                    }
                    
                    if (src.includes('private') || src.includes('propeller') || alt.includes('private')) {
                        return 'private';
                    }
                }
                
                return 'commercial'; // Default assumption
            },

            createStatusDisplay() {
                if (this.statusDisplay) {
                    this.statusDisplay.remove();
                }
                
                // Find insertion point
                const insertPoint = this.findStatusInsertPoint();
                if (!insertPoint) return;
                
                this.statusDisplay = document.createElement('div');
                this.statusDisplay.id = 'travel-tracker-status-display';
                this.statusDisplay.style.cssText = `
                    background: linear-gradient(135deg, #1976D2, #2196F3);
                    color: white;
                    padding: 12px;
                    margin: 8px 0;
                    border-radius: 8px;
                    font-family: Arial, sans-serif;
                    font-size: 13px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    border-left: 4px solid #FF5722;
                `;
                
                insertPoint.insertAdjacentElement('afterend', this.statusDisplay);
                this.updateStatusDisplay();
                
                // Add event listener for stop tracking button
                this.addStopTrackingListener();
            },

            addStopTrackingListener() {
                // Use event delegation instead of direct event listeners
                if (this.statusDisplay) {
                    this.statusDisplay.addEventListener('click', (e) => {
                        if (e.target.id === 'travel-tracker-stop-btn') {
                            console.log('🛑 Stop tracking button clicked');
                            e.preventDefault();
                            e.stopPropagation();
                            this.removeCurrentTracker();
                        }
                    });
                }
            },

            findStatusInsertPoint() {
                const selectors = [
                    '.profile-status',
                    '.status-wrapper', 
                    '.user-status',
                    '[class*="status"]',
                    '.profile-container',
                    '.content-wrapper'
                ];
                
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) return element;
                }
                
                return document.body;
            },

            updateStatusDisplay() {
                if (!this.statusDisplay || !this.currentTracker) return;
                
                const tracker = this.currentTracker;
                const statusInfo = this.getStatusInfo(tracker);
                
                this.statusDisplay.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>✈️ Travel Tracker</strong>
                            <div style="margin-top: 4px;">${statusInfo.main}</div>
                        </div>
                        <div style="text-align: right; font-size: 11px; opacity: 0.9;">
                            ${statusInfo.detail}
                            <br>
                            <button id="travel-tracker-stop-btn" 
                                    style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); 
                                           color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; 
                                           cursor: pointer; margin-top: 2px;">
                                Stop Tracking
                            </button>
                        </div>
                    </div>
                `;
            },

            getStatusInfo(tracker) {
                const text = tracker.lastText.toLowerCase();
                
                if (text.includes('traveling') || text.includes('flying')) {
                    return {
                        main: `🛫 Flying to ${tracker.destination}`,
                        detail: `${tracker.planeType} plane<br>Monitoring...`
                    };
                } else if (text.includes('landed') || text.includes('abroad')) {
                    return {
                        main: `🏨 In ${tracker.destination}`, 
                        detail: `Waiting for departure`
                    };
                } else {
                    return {
                        main: `📍 Monitoring ${tracker.destination}`,
                        detail: `Tracking status changes`
                    };
                }
            },

            startMonitoring() {
                if (this.monitoringInterval) {
                    clearInterval(this.monitoringInterval);
                }
                
                this.monitoringInterval = setInterval(() => {
                    this.checkForChanges();
                }, 10000); // Check every 10 seconds
                
                console.log('🔄 Started monitoring travel status changes');
            },

            checkForChanges() {
                if (!this.currentTracker) return;
                
                const tracker = this.currentTracker;
                
                // Try to find the element
                let element = tracker.element;
                if (!element || !document.contains(element)) {
                    if (tracker.selector) {
                        element = document.querySelector(tracker.selector);
                    }
                }
                
                if (!element) {
                    console.warn('Tracked element no longer found');
                    this.removeCurrentTracker();
                    return;
                }
                
                const currentText = element.textContent;
                if (currentText !== tracker.lastText) {
                    console.log('✈️ Travel status changed:', currentText);
                    tracker.lastText = currentText;
                    this.updateStatusDisplay();
                    this.saveState();
                    
                    this.core.NotificationSystem.show(
                        'Travel Tracker',
                        'Travel status updated!',
                        'info'
                    );
                }
            },

            removeCurrentTracker() {
                console.log('🗑️ Removing current tracker');
                
                // Stop monitoring immediately
                if (this.monitoringInterval) {
                    clearInterval(this.monitoringInterval);
                    this.monitoringInterval = null;
                    console.log('🔄 Monitoring stopped');
                }
                
                // Remove status display immediately
                if (this.statusDisplay) {
                    this.statusDisplay.remove();
                    this.statusDisplay = null;
                    console.log('📱 Status display removed');
                }
                
                // Clear current tracker
                this.currentTracker = null;
                
                // Save state immediately
                this.saveState();
                
                // Show success message
                this.core.NotificationSystem.show(
                    'Travel Tracker',
                    'Tracking stopped successfully!',
                    'success'
                );
                
                console.log('✅ Tracker completely removed');
                
                // Force a visual update to ensure everything is cleared
                this.forceUpdate();
            },

            forceUpdate() {
                // Force browser to re-render and clear any remaining elements
                if (document.getElementById('travel-tracker-status-display')) {
                    document.getElementById('travel-tracker-status-display').remove();
                }
                
                // Clear any remaining highlights
                const highlighted = document.querySelectorAll('.travel-tracker-highlight');
                highlighted.forEach(el => el.classList.remove('travel-tracker-highlight'));
                
                console.log('🔄 Forced visual update completed');
            },

            showInstructions() {
                if (document.getElementById('travel-tracker-instructions')) return;
                
                const instructions = document.createElement('div');
                instructions.id = 'travel-tracker-instructions';
                instructions.style.cssText = `
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #2196F3;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    z-index: 999999;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                instructions.innerHTML = `
                    <strong>✈️ Travel Tracker</strong><br>
                    Hover over the travel status text and click to start tracking<br>
                    <small>Press Escape to cancel</small>
                `;
                document.body.appendChild(instructions);
                
                // Add highlight CSS
                if (!document.getElementById('travel-tracker-highlight-css')) {
                    const style = document.createElement('style');
                    style.id = 'travel-tracker-highlight-css';
                    style.textContent = `
                        .travel-tracker-highlight {
                            outline: 3px solid #FF5722 !important;
                            background-color: rgba(255, 87, 34, 0.1) !important;
                        }
                    `;
                    document.head.appendChild(style);
                }
            },

            hideInstructions() {
                const instructions = document.getElementById('travel-tracker-instructions');
                if (instructions) instructions.remove();
            },

            // State management
            saveState() {
                try {
                    const state = {
                        currentTracker: this.currentTracker ? {
                            id: this.currentTracker.id,
                            selector: this.currentTracker.selector,
                            initialText: this.currentTracker.initialText,
                            lastText: this.currentTracker.lastText,
                            createdAt: this.currentTracker.createdAt,
                            destination: this.currentTracker.destination,
                            planeType: this.currentTracker.planeType,
                            status: this.currentTracker.status
                        } : null
                    };
                    
                    this.core.saveState('travel_tracker_state', state);
                    console.log('💾 Travel tracker state saved');
                } catch (error) {
                    console.error('❌ Failed to save travel tracker state:', error);
                }
            },

            loadState() {
                try {
                    const state = this.core.loadState('travel_tracker_state', {});
                    
                    if (state.currentTracker) {
                        this.currentTracker = state.currentTracker;
                        console.log('📂 Restored travel tracker state:', state.currentTracker);
                        
                        // Restore the status display and monitoring
                        this.restoreTracker();
                    }
                } catch (error) {
                    console.error('❌ Failed to load travel tracker state:', error);
                }
            },

            restoreTracker() {
                if (!this.currentTracker) return;
                
                console.log('🔄 Restoring tracker display and monitoring...');
                
                // Create status display
                this.createStatusDisplay();
                
                // Start monitoring
                this.startMonitoring();
                
                console.log('✅ Tracker restored successfully');
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.TravelTracker = TravelTrackerModule;

        console.log('✈️ Travel Tracker module registered globally');
        console.log('🔍 TravelTracker module check:', {
            'SidekickModules exists': !!window.SidekickModules,
            'TravelTracker exists': !!window.SidekickModules.TravelTracker,
            'TravelTracker.activate exists': !!window.SidekickModules.TravelTracker?.activate,
            'Available modules': Object.keys(window.SidekickModules)
        });

        // Fallback registration - ensure module is available
        setTimeout(() => {
            if (!window.SidekickModules.TravelTracker) {
                console.warn('⚠️ TravelTracker not found, re-registering...');
                window.SidekickModules.TravelTracker = TravelTrackerModule;
                console.log('✅ TravelTracker re-registered');
            }
        }, 1000);
    });
})();