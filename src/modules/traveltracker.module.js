// ==UserScript==
// @name         Sidekick Travel Tracker Module
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Advanced travel tracker with DOM selection, plane detection, and countdown timers
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
        const TravelTrackerModule = {
            name: 'TravelTracker',
            isMarkingMode: false,
            trackedElements: [],
            currentTracker: null,
            statusDisplay: null,
            
            // Travel times table (in minutes) - from Torn Wiki
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
                console.log('✈️ Initializing Travel Tracker Module v2.0.0...');
                this.core = window.SidekickModules.Core;
                if (!this.core) {
                    console.error('❌ Core module not available for Travel Tracker');
                    return;
                }

                // Load saved trackers
                this.loadTrackedElements();
                
                // Start monitoring if we have active trackers
                if (this.trackedElements.length > 0) {
                    this.startMonitoring();
                }

                console.log('✅ Travel Tracker module initialized');
            },

            // Called when user clicks the Travel Tracker button
            activate() {
                if (this.isMarkingMode) {
                    this.exitMarkingMode();
                    return;
                }

                console.log('✈️ Starting DOM element selection for travel tracking...');
                this.enterMarkingMode();
            },

            enterMarkingMode() {
                this.isMarkingMode = true;
                document.body.style.cursor = 'crosshair';
                
                // Show instructions
                this.showInstructions();
                
                // Add event listeners for element selection
                document.addEventListener('click', this.handleElementClick.bind(this), true);
                document.addEventListener('mouseover', this.handleElementHover.bind(this), true);
                document.addEventListener('mouseout', this.handleElementOut.bind(this), true);
                
                this.core.NotificationSystem.show('Travel Tracker', 'Click on the travel status element to start tracking', 'info');
            },

            exitMarkingMode() {
                this.isMarkingMode = false;
                document.body.style.cursor = '';
                
                // Remove event listeners
                document.removeEventListener('click', this.handleElementClick.bind(this), true);
                document.removeEventListener('mouseover', this.handleElementHover.bind(this), true);
                document.removeEventListener('mouseout', this.handleElementOut.bind(this), true);
                
                // Remove hover effects
                const highlighted = document.querySelectorAll('.travel-tracker-highlight');
                highlighted.forEach(el => el.classList.remove('travel-tracker-highlight'));
                
                // Hide instructions
                this.hideInstructions();
                
                this.core.NotificationSystem.show('Travel Tracker', 'Element selection cancelled', 'info');
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
                    Hover over the travel status element and click to start tracking<br>
                    <small>Click elsewhere to cancel</small>
                `;
                document.body.appendChild(instructions);
                
                // Add CSS for highlighting
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

            handleElementHover(e) {
                if (!this.isMarkingMode) return;
                e.target.classList.add('travel-tracker-highlight');
            },

            handleElementOut(e) {
                if (!this.isMarkingMode) return;
                e.target.classList.remove('travel-tracker-highlight');
            },

            handleElementClick(e) {
                if (!this.isMarkingMode) return;
                
                e.preventDefault();
                e.stopPropagation();
                
                const element = e.target;
                console.log('✈️ Selected element for tracking:', element);
                
                // Check if this looks like a travel status element
                const text = element.textContent.toLowerCase();
                if (this.isValidTravelElement(text)) {
                    this.createTracker(element);
                    this.exitMarkingMode();
                } else {
                    this.core.NotificationSystem.show('Travel Tracker', 'This doesn\'t look like a travel status element. Try selecting the travel status text.', 'warning');
                }
            },

            isValidTravelElement(text) {
                const travelKeywords = [
                    'traveling', 'flying', 'flight', 'abroad', 'landed', 'returning',
                    'argentina', 'canada', 'cayman', 'china', 'hawaii', 'japan',
                    'mexico', 'south africa', 'switzerland', 'uae', 'united kingdom', 'uk'
                ];
                
                return travelKeywords.some(keyword => text.includes(keyword));
            },

            createTracker(element) {
                // Remove any existing tracker first
                this.removeCurrentTracker();
                
                const trackerId = 'travel-tracker-' + Date.now();
                
                const tracker = {
                    id: trackerId,
                    element: element,
                    selector: this.generateSelector(element),
                    lastText: element.textContent,
                    createdAt: Date.now(),
                    destination: null,
                    planeType: null,
                    departureTime: null,
                    status: 'monitoring'
                };
                
                this.currentTracker = tracker;
                this.trackedElements = [tracker]; // Keep only one active tracker
                this.saveTrackedElements();
                
                // Create status display
                this.createStatusDisplay();
                
                // Start monitoring
                this.startMonitoring();
                
                // Initial analysis
                this.analyzeCurrentStatus(tracker);
                
                this.core.NotificationSystem.show('Travel Tracker', 'Now tracking travel status!', 'success');
                console.log('✅ Travel tracker created:', tracker);
            },

            generateSelector(element) {
                // Generate a CSS selector for the element
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
                            selector += '.' + Array.from(current.classList).join('.');
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

            createStatusDisplay() {
                // Remove existing display
                if (this.statusDisplay) {
                    this.statusDisplay.remove();
                }
                
                // Find a good place to insert the status display (below profile status or similar)
                const insertPoint = this.findStatusInsertPoint();
                if (!insertPoint) {
                    console.warn('Could not find suitable place for status display');
                    return;
                }
                
                this.statusDisplay = document.createElement('div');
                this.statusDisplay.id = 'travel-tracker-status';
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
            },

            findStatusInsertPoint() {
                // Look for common profile status containers
                const selectors = [
                    '.profile-status',
                    '.status-wrapper',
                    '.user-status',
                    '[class*="status"]',
                    '.profile-container .m-top10',
                    '.profile-wrapper'
                ];
                
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        console.log('Found status insert point:', selector);
                        return element;
                    }
                }
                
                // Fallback: insert after first found container
                return document.querySelector('.content-wrapper, .container, main') || document.body;
            },

            updateStatusDisplay() {
                if (!this.statusDisplay || !this.currentTracker) return;
                
                const tracker = this.currentTracker;
                const status = this.getFormattedStatus(tracker);
                
                this.statusDisplay.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>✈️ Travel Tracker</strong>
                            ${status.main}
                        </div>
                        <div style="text-align: right; font-size: 11px; opacity: 0.9;">
                            ${status.detail}
                            <br>
                            <button onclick="window.SidekickModules.TravelTracker.removeCurrentTracker()" 
                                    style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); 
                                           color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;">
                                Stop Tracking
                            </button>
                        </div>
                    </div>
                `;
            },

            getFormattedStatus(tracker) {
                const text = tracker.lastText.toLowerCase();
                
                // Detect current status
                if (text.includes('traveling') || text.includes('flying')) {
                    // Currently traveling
                    const destination = this.extractDestination(text);
                    const planeType = this.detectPlaneType();
                    
                    return {
                        main: `<br><span style="color: #FFC107;">🛫 Flying to ${destination}</span>`,
                        detail: `${planeType} plane<br>Monitoring arrival...`
                    };
                    
                } else if (text.includes('landed') || text.includes('abroad')) {
                    // Landed/abroad
                    const destination = this.extractDestination(text);
                    
                    return {
                        main: `<br><span style="color: #4CAF50;">🏨 In ${destination}</span>`,
                        detail: `Waiting for departure<br>Ready to time return flight`
                    };
                    
                } else if (text.includes('returning')) {
                    // Returning flight
                    const destination = this.extractDestination(text);
                    const planeType = this.detectPlaneType();
                    
                    if (tracker.departureTime) {
                        const timeLeft = this.calculateTimeRemaining(tracker.departureTime, destination, planeType);
                        return {
                            main: `<br><span style="color: #FF5722;">🛬 Returning from ${destination}</span>`,
                            detail: `${planeType} plane<br>ETA: ${timeLeft}`
                        };
                    } else {
                        return {
                            main: `<br><span style="color: #FF5722;">🛬 Returning from ${destination}</span>`,
                            detail: `${planeType} plane<br>Starting timer...`
                        };
                    }
                    
                } else {
                    return {
                        main: `<br><span style="color: #9E9E9E;">📍 Not traveling</span>`,
                        detail: `Monitoring status changes...`
                    };
                }
            },

            extractDestination(text) {
                // Extract destination from travel text
                const destinations = Object.keys(this.travelTimes);
                
                for (const dest of destinations) {
                    if (text.includes(dest)) {
                        return dest.charAt(0).toUpperCase() + dest.slice(1);
                    }
                }
                
                // Fallback: try to extract from common patterns
                const patterns = [
                    /to ([a-z\s]+)/i,
                    /in ([a-z\s]+)/i,
                    /from ([a-z\s]+)/i
                ];
                
                for (const pattern of patterns) {
                    const match = text.match(pattern);
                    if (match) {
                        return match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1);
                    }
                }
                
                return 'Unknown';
            },

            detectPlaneType() {
                // Look for plane images on the page to determine type
                const images = document.querySelectorAll('img[src*="plane"], img[src*="flight"], img[src*="travel"]');
                
                for (const img of images) {
                    const src = img.src.toLowerCase();
                    const alt = (img.alt || '').toLowerCase();
                    
                    // Commercial plane indicators: large aircraft, airline livery
                    if (src.includes('commercial') || src.includes('airline') || src.includes('boeing') || src.includes('airbus') ||
                        alt.includes('commercial') || alt.includes('airline')) {
                        return 'Commercial';
                    }
                    
                    // Private plane indicators: small aircraft, single engine, propeller
                    if (src.includes('private') || src.includes('propeller') || src.includes('cessna') || src.includes('single') ||
                        alt.includes('private') || alt.includes('propeller')) {
                        return 'Private';
                    }
                }
                
                // Fallback: analyze the context or make educated guess
                // Commercial flights are more common, so default to that
                return 'Commercial';
            },

            calculateTimeRemaining(departureTime, destination, planeType) {
                const dest = destination.toLowerCase();
                const times = this.travelTimes[dest];
                
                if (!times) {
                    return 'Unknown time';
                }
                
                const duration = planeType.toLowerCase() === 'private' ? times.private : times.commercial;
                const arrivalTime = departureTime + (duration * 60000); // Convert minutes to milliseconds
                const now = Date.now();
                const remaining = arrivalTime - now;
                
                if (remaining <= 0) {
                    return 'Should have arrived';
                }
                
                const minutes = Math.floor(remaining / 60000);
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                
                if (hours > 0) {
                    return `${hours}h ${mins}m`;
                } else {
                    return `${mins}m`;
                }
            },

            startMonitoring() {
                // Clear any existing interval
                if (this.monitoringInterval) {
                    clearInterval(this.monitoringInterval);
                }
                
                // Monitor every 10 seconds
                this.monitoringInterval = setInterval(() => {
                    this.monitorTrackedElements();
                }, 10000);
                
                console.log('✅ Started travel status monitoring');
            },

            monitorTrackedElements() {
                if (!this.currentTracker) return;
                
                const tracker = this.currentTracker;
                
                // Try to find the element
                let element = tracker.element;
                if (!element || !document.contains(element)) {
                    // Try to find by selector
                    if (tracker.selector) {
                        element = document.querySelector(tracker.selector);
                    }
                }
                
                if (!element) {
                    console.warn('Tracked element not found, removing tracker');
                    this.removeCurrentTracker();
                    return;
                }
                
                // Check for changes
                const currentText = element.textContent;
                if (currentText !== tracker.lastText) {
                    console.log('✈️ Travel status changed:', currentText);
                    
                    // Detect if this is a departure (start of return flight)
                    if (currentText.toLowerCase().includes('returning') && !tracker.lastText.toLowerCase().includes('returning')) {
                        tracker.departureTime = Date.now();
                        this.core.NotificationSystem.show('Travel Tracker', 'Return flight detected! Starting timer...', 'info');
                    }
                    
                    tracker.lastText = currentText;
                    this.saveTrackedElements();
                    this.updateStatusDisplay();
                }
            },

            removeCurrentTracker() {
                if (this.currentTracker) {
                    console.log('🗑️ Removing travel tracker');
                    this.currentTracker = null;
                    this.trackedElements = [];
                    this.saveTrackedElements();
                    
                    if (this.statusDisplay) {
                        this.statusDisplay.remove();
                        this.statusDisplay = null;
                    }
                    
                    if (this.monitoringInterval) {
                        clearInterval(this.monitoringInterval);
                        this.monitoringInterval = null;
                    }
                    
                    this.core.NotificationSystem.show('Travel Tracker', 'Tracking stopped', 'info');
                }
            },

            analyzeCurrentStatus(tracker) {
                // Immediately analyze the selected element to understand current status
                const text = tracker.lastText.toLowerCase();
                tracker.destination = this.extractDestination(text);
                tracker.planeType = this.detectPlaneType();
                
                console.log('📊 Initial analysis:', {
                    destination: tracker.destination,
                    planeType: tracker.planeType,
                    text: tracker.lastText
                });
                
                this.updateStatusDisplay();
            },

            // Storage methods
            saveTrackedElements() {
                try {
                    const dataToSave = this.trackedElements.map(tracker => ({
                        id: tracker.id,
                        selector: tracker.selector,
                        lastText: tracker.lastText,
                        createdAt: tracker.createdAt,
                        destination: tracker.destination,
                        planeType: tracker.planeType,
                        departureTime: tracker.departureTime,
                        status: tracker.status
                    }));
                    
                    this.core.saveState('travel_tracker_elements', dataToSave);
                    console.log('💾 Travel tracker data saved');
                } catch (error) {
                    console.error('❌ Failed to save travel tracker data:', error);
                }
            },

            loadTrackedElements() {
                try {
                    const savedData = this.core.loadState('travel_tracker_elements', []);
                    this.trackedElements = savedData || [];
                    
                    // Restore current tracker if exists
                    if (this.trackedElements.length > 0) {
                        this.currentTracker = this.trackedElements[0];
                        // Note: We don't restore the DOM element reference, it will be found during monitoring
                    }
                    
                    console.log('📂 Loaded travel tracker data:', this.trackedElements.length, 'trackers');
                } catch (error) {
                    console.error('❌ Failed to load travel tracker data:', error);
                    this.trackedElements = [];
                }
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.TravelTracker = TravelTrackerModule;

        console.log('✈️ Travel Tracker module registered');
    });
})();
