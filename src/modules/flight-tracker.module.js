// ==UserScript==
// @name         Sidekick Travel Tracker Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Travel tracking functionality for Sidekick sidebar
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
        const { NotificationSystem } = window.SidekickModules.Core;

        // Travel times data (from torn wiki - standard and airstrip times in minutes)
        const TRAVEL_TIMES = {
            'Mexico': { standard: 26, airstrip: 21 },
            'Cayman Islands': { standard: 35, airstrip: 28 },
            'Canada': { standard: 41, airstrip: 33 },
            'Hawaii': { standard: 134, airstrip: 107 },
            'United Kingdom': { standard: 159, airstrip: 127 },
            'Argentina': { standard: 167, airstrip: 134 },
            'Switzerland': { standard: 175, airstrip: 140 },
            'Japan': { standard: 225, airstrip: 180 },
            'China': { standard: 242, airstrip: 194 },
            'UAE': { standard: 271, airstrip: 217 },
            'South Africa': { standard: 297, airstrip: 238 }
        };

        const TravelTrackerModule = {
            trackers: new Map(),
            updateIntervals: new Map(),
            isMarkerMode: false,
            marker: null,

            init() {
                console.log('✈️ Initializing Travel Tracker Module...');
                this.setupGlobalFunctions();
                this.restoreTravelTrackers();
                console.log('✅ Travel Tracker Module initialized');
            },

            setupGlobalFunctions() {
                // Make travel tracker creation globally available for the add menu
                window.createTravelTracker = this.startMarkerMode.bind(this);
            },

            startMarkerMode() {
                if (this.isMarkerMode) return;
                
                this.isMarkerMode = true;
                NotificationSystem.show('Travel Tracker', 'Drag the marker over the travel status field you want to track!', 'info', 6000);
                
                this.createMarker();
                this.setupMarkerDrag();
            },

            createMarker() {
                this.marker = document.createElement('div');
                this.marker.id = 'travel-tracker-marker';
                this.marker.style.cssText = `
                    position: fixed !important;
                    width: 100px !important;
                    height: 30px !important;
                    background: linear-gradient(135deg, #FF5722, #FF9800) !important;
                    border: 2px solid #fff !important;
                    border-radius: 15px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    color: white !important;
                    font-size: 11px !important;
                    font-weight: bold !important;
                    z-index: 999999 !important;
                    cursor: move !important;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                    user-select: none !important;
                    animation: travelMarkerPulse 2s infinite !important;
                    top: 50px !important;
                    left: 50px !important;
                `;
                this.marker.innerHTML = '✈️ DRAG ME';
                
                // Add animation keyframes
                if (!document.getElementById('travel-tracker-style')) {
                    const style = document.createElement('style');
                    style.id = 'travel-tracker-style';
                    style.textContent = `
                        @keyframes travelMarkerPulse {
                            0% { transform: scale(1); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                            50% { transform: scale(1.05); box-shadow: 0 6px 25px rgba(255,87,34,0.6); }
                            100% { transform: scale(1); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                document.body.appendChild(this.marker);
            },

            setupMarkerDrag() {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };

                this.marker.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    const rect = this.marker.getBoundingClientRect();
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    this.marker.style.animation = 'none';
                    e.preventDefault();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    
                    this.marker.style.left = (e.clientX - dragOffset.x) + 'px';
                    this.marker.style.top = (e.clientY - dragOffset.y) + 'px';
                    
                    // Check for travel status elements under the marker
                    this.highlightTravelElements(e.clientX, e.clientY);
                });

                document.addEventListener('mouseup', (e) => {
                    if (!isDragging) return;
                    
                    isDragging = false;
                    
                    // Check if we dropped on a valid travel element
                    const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
                    const travelElement = this.findTravelElement(elementUnder);
                    
                    if (travelElement) {
                        this.createTravelTracker(travelElement);
                        this.cleanup();
                    } else {
                        NotificationSystem.show('Travel Tracker', 'Please drop the marker on a travel status field!', 'warning');
                    }
                });

                // Escape key to cancel
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.isMarkerMode) {
                        this.cleanup();
                        NotificationSystem.show('Travel Tracker', 'Marker mode cancelled', 'info');
                    }
                });
            },

            highlightTravelElements(x, y) {
                // Remove previous highlights
                document.querySelectorAll('.travel-tracker-highlight').forEach(el => {
                    el.classList.remove('travel-tracker-highlight');
                });

                const elementUnder = document.elementFromPoint(x, y);
                const travelElement = this.findTravelElement(elementUnder);
                
                if (travelElement) {
                    travelElement.classList.add('travel-tracker-highlight');
                    
                    // Add highlight style if not exists
                    if (!document.getElementById('travel-highlight-style')) {
                        const style = document.createElement('style');
                        style.id = 'travel-highlight-style';
                        style.textContent = `
                            .travel-tracker-highlight {
                                outline: 3px solid #FF5722 !important;
                                outline-offset: 2px !important;
                                background: rgba(255, 87, 34, 0.1) !important;
                            }
                        `;
                        document.head.appendChild(style);
                    }
                }
            },

            findTravelElement(element) {
                if (!element) return null;
                
                // Look for travel-related text patterns
                const textContent = element.textContent?.toLowerCase() || '';
                const travelKeywords = ['traveling', 'travelling', 'in flight', 'flying', 'abroad', 'destination', 'travel', 'arriving'];
                
                // Check current element and parents
                let currentElement = element;
                for (let i = 0; i < 5 && currentElement; i++) {
                    const text = currentElement.textContent?.toLowerCase() || '';
                    const hasKeyword = travelKeywords.some(keyword => text.includes(keyword));
                    
                    if (hasKeyword || this.isTimeElement(currentElement)) {
                        return currentElement;
                    }
                    currentElement = currentElement.parentElement;
                }
                
                return null;
            },

            isTimeElement(element) {
                const text = element.textContent || '';
                // Look for time patterns like "10:30:45" or "2 hours"
                const timePatterns = [
                    /\d{1,2}:\d{2}:\d{2}/,  // HH:MM:SS
                    /\d{1,2}:\d{2}/,        // HH:MM
                    /\d+\s*(hour|hr|min|sec)/i
                ];
                
                return timePatterns.some(pattern => pattern.test(text));
            },

            cleanup() {
                this.isMarkerMode = false;
                if (this.marker) {
                    this.marker.remove();
                    this.marker = null;
                }
                // Remove highlights
                document.querySelectorAll('.travel-tracker-highlight').forEach(el => {
                    el.classList.remove('travel-tracker-highlight');
                });
            },

            createTravelTracker(trackedElement) {
                const sidebar = document.getElementById('sidekick-sidebar');
                const contentArea = document.getElementById('sidekick-content');
                if (!sidebar || !contentArea) {
                    console.warn('❌ Cannot create travel tracker - sidebar not found');
                    return;
                }
                
                const trackerId = Date.now() + Math.random();
                const savedLayout = JSON.parse(localStorage.getItem(`traveltracker_${trackerId}_layout`) || '{}');
                
                const tracker = document.createElement('div');
                tracker.id = `traveltracker-${trackerId}`;
                tracker.className = 'sidebar-item travel-tracker';
                tracker.style.cssText = `
                    position: absolute !important;
                    left: ${savedLayout.x || 20}px !important;
                    top: ${savedLayout.y || 20}px !important;
                    width: ${savedLayout.width || 280}px !important;
                    height: ${savedLayout.height || 200}px !important;
                    background: #2a2a2a !important;
                    border: 1px solid #444 !important;
                    border-radius: 8px !important;
                    display: block !important;
                    min-width: 250px !important;
                    min-height: 150px !important;
                    max-width: 400px !important;
                    max-height: 300px !important;
                    z-index: 1000 !important;
                    resize: both !important;
                    overflow: hidden !important;
                    box-sizing: border-box !important;
                `;
                
                // Create header
                const header = document.createElement('div');
                header.style.cssText = `
                    background: linear-gradient(135deg, #FF5722, #FF9800) !important;
                    border-bottom: 1px solid #555 !important;
                    padding: 8px 12px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    cursor: move !important;
                    user-select: none !important;
                    border-radius: 7px 7px 0 0 !important;
                    box-sizing: border-box !important;
                `;
                
                const title = document.createElement('span');
                title.innerHTML = '✈️ Travel Tracker';
                title.style.cssText = `
                    color: #fff !important;
                    font-size: 13px !important;
                    font-weight: bold !important;
                `;
                
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '×';
                closeBtn.style.cssText = `
                    background: none !important;
                    border: none !important;
                    color: #fff !important;
                    cursor: pointer !important;
                    font-size: 16px !important;
                    font-weight: bold !important;
                    padding: 0 !important;
                    width: 18px !important;
                    height: 18px !important;
                    border-radius: 50% !important;
                    transition: background 0.2s ease !important;
                `;
                
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.background = 'rgba(255,255,255,0.2)';
                });
                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.background = 'none';
                });
                
                header.appendChild(title);
                header.appendChild(closeBtn);
                
                // Create content area
                const content = document.createElement('div');
                content.style.cssText = `
                    padding: 12px !important;
                    height: calc(100% - 40px) !important;
                    overflow-y: auto !important;
                    color: #fff !important;
                    font-size: 12px !important;
                `;
                
                content.innerHTML = `
                    <div style="margin-bottom: 8px;">
                        <strong>Status:</strong> <span id="travel-status-${trackerId}" style="color: #4CAF50;">Checking...</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>Destination:</strong> <span id="travel-destination-${trackerId}">Unknown</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>Time Remaining:</strong> <span id="travel-time-${trackerId}">--:--:--</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>Arrival:</strong> <span id="travel-arrival-${trackerId}">--</span>
                    </div>
                    <div style="margin-bottom: 8px; font-size: 10px; color: #888;">
                        <strong>Standard Flight:</strong> <span id="travel-standard-${trackerId}">--</span><br>
                        <strong>Airstrip Flight:</strong> <span id="travel-airstrip-${trackerId}">--</span>
                    </div>
                    <div style="text-align: center; margin-top: 8px;">
                        <button id="refresh-travel-${trackerId}" style="background: #FF5722; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">🔄 Refresh</button>
                    </div>
                `;
                
                tracker.appendChild(header);
                tracker.appendChild(content);
                contentArea.appendChild(tracker);
                
                // Store tracker reference
                this.trackers.set(trackerId, { element: tracker, trackedElement: trackedElement });
                
                // Add functionality
                this.addDragFunctionality(tracker, header, trackerId, closeBtn);
                this.addCloseFunctionality(tracker, trackerId, closeBtn);
                this.startTravelTracking(trackerId, trackedElement);
                this.saveTrackerToStorage(trackerId);
                
                console.log("✈️ Travel tracker created:", trackerId);
                NotificationSystem.show('Travel Tracker', 'Travel tracker created! Now monitoring your travel status.', 'success');
            },

            addDragFunctionality(tracker, header, trackerId, closeBtn) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };
                
                header.addEventListener('mousedown', (e) => {
                    if (e.target === closeBtn) return;
                    
                    isDragging = true;
                    const headerRect = header.getBoundingClientRect();
                    dragOffset.x = e.clientX - headerRect.left;
                    dragOffset.y = e.clientY - headerRect.top;
                    tracker.style.zIndex = '2000';
                    e.preventDefault();
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    if (!sidebar) return;
                    
                    const sidebarRect = sidebar.getBoundingClientRect();
                    let newX = e.clientX - sidebarRect.left - dragOffset.x;
                    let newY = e.clientY - sidebarRect.top - dragOffset.y;
                    
                    const padding = 5;
                    const maxX = sidebar.offsetWidth - tracker.offsetWidth - padding;
                    const maxY = sidebar.offsetHeight - tracker.offsetHeight - padding;
                    
                    newX = Math.max(padding, Math.min(newX, maxX));
                    newY = Math.max(padding, Math.min(newY, maxY));
                    
                    tracker.style.left = newX + 'px';
                    tracker.style.top = newY + 'px';
                });
                
                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        tracker.style.zIndex = '1000';
                        
                        // Save position
                        const layout = {
                            x: parseInt(tracker.style.left),
                            y: parseInt(tracker.style.top),
                            width: tracker.offsetWidth,
                            height: tracker.offsetHeight
                        };
                        localStorage.setItem(`traveltracker_${trackerId}_layout`, JSON.stringify(layout));
                    }
                });

                // Save size changes on resize
                const resizeObserver = new ResizeObserver(() => {
                    const layout = {
                        x: parseInt(tracker.style.left),
                        y: parseInt(tracker.style.top),
                        width: tracker.offsetWidth,
                        height: tracker.offsetHeight
                    };
                    localStorage.setItem(`traveltracker_${trackerId}_layout`, JSON.stringify(layout));
                });
                resizeObserver.observe(tracker);
            },

            addCloseFunctionality(tracker, trackerId, closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Remove travel tracker?')) {
                        this.removeTravelTracker(trackerId);
                    }
                });
            },

            removeTravelTracker(trackerId) {
                // Clear update interval
                const interval = this.updateIntervals.get(trackerId);
                if (interval) {
                    clearInterval(interval);
                    this.updateIntervals.delete(trackerId);
                }
                
                // Remove tracker element
                const trackerData = this.trackers.get(trackerId);
                if (trackerData && trackerData.element) {
                    trackerData.element.remove();
                    this.trackers.delete(trackerId);
                }
                
                // Clean up localStorage
                localStorage.removeItem(`traveltracker_${trackerId}_layout`);
                this.removeTrackerFromStorage(trackerId);
            },

            startTravelTracking(trackerId, trackedElement) {
                const updateTravelStatus = () => {
                    try {
                        const travelData = this.extractTravelData(trackedElement);
                        this.updateTravelDisplay(trackerId, travelData);
                    } catch (error) {
                        console.error('Error updating travel status:', error);
                        const statusEl = document.getElementById(`travel-status-${trackerId}`);
                        if (statusEl) {
                            statusEl.innerHTML = '<span style="color: #f44336;">Error Reading Status</span>';
                        }
                    }
                };
                
                // Initial update
                updateTravelStatus();
                
                // Set up auto-update every 10 seconds
                const interval = setInterval(updateTravelStatus, 10000);
                this.updateIntervals.set(trackerId, interval);
                
                // Add refresh button listener
                const refreshBtn = document.getElementById(`refresh-travel-${trackerId}`);
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', updateTravelStatus);
                }
            },

            extractTravelData(element) {
                const text = element.textContent || '';
                
                // Check if traveling
                const travelKeywords = ['traveling', 'travelling', 'in flight', 'flying'];
                const isTravel = travelKeywords.some(keyword => text.toLowerCase().includes(keyword));
                
                if (!isTravel) {
                    return { status: 'home', destination: null, timeRemaining: null };
                }

                // Extract destination
                let destination = null;
                for (const [country] of Object.entries(TRAVEL_TIMES)) {
                    if (text.toLowerCase().includes(country.toLowerCase())) {
                        destination = country;
                        break;
                    }
                }

                // Extract time remaining - look for time patterns near travel keywords
                // or specifically in travel-related context
                let timeRemaining = null;
                
                // Try to find time in specific travel context first
                const travelTimePatterns = [
                    /(?:time remaining|arrives? in|landing in|eta)\s*:?\s*(\d{1,2}):(\d{2}):(\d{2})/i,
                    /(\d{1,2}):(\d{2}):(\d{2})(?:\s*(?:remaining|left|until arrival))/i,
                    /(?:traveling|flying).*?(\d{1,2}):(\d{2}):(\d{2})/i
                ];
                
                for (const pattern of travelTimePatterns) {
                    const match = text.match(pattern);
                    if (match) {
                        const hours = parseInt(match[1]);
                        const minutes = parseInt(match[2]);
                        const seconds = parseInt(match[3]);
                        timeRemaining = hours * 3600 + minutes * 60 + seconds;
                        break;
                    }
                }
                
                // Fallback: if no specific travel time found, look for any time pattern
                // but only if we're confident we're in a travel context
                if (!timeRemaining && isTravel) {
                    const timeMatch = text.match(/(\d{1,2}):(\d{2}):(\d{2})/);
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1]);
                        const minutes = parseInt(timeMatch[2]);
                        const seconds = parseInt(timeMatch[3]);
                        // Only accept if it seems like a reasonable travel time (less than 24 hours)
                        if (hours < 24) {
                            timeRemaining = hours * 3600 + minutes * 60 + seconds;
                        }
                    }
                }

                return { status: 'traveling', destination, timeRemaining };
            },

            updateTravelDisplay(trackerId, travelData) {
                const statusEl = document.getElementById(`travel-status-${trackerId}`);
                const destinationEl = document.getElementById(`travel-destination-${trackerId}`);
                const timeEl = document.getElementById(`travel-time-${trackerId}`);
                const arrivalEl = document.getElementById(`travel-arrival-${trackerId}`);
                const standardEl = document.getElementById(`travel-standard-${trackerId}`);
                const airstripEl = document.getElementById(`travel-airstrip-${trackerId}`);
                
                if (!statusEl || !destinationEl || !timeEl || !arrivalEl) return;
                
                if (travelData.status === 'home') {
                    statusEl.innerHTML = '<span style="color: #666;">Not Traveling</span>';
                    destinationEl.textContent = 'None';
                    timeEl.textContent = '--:--:--';
                    arrivalEl.textContent = '--';
                    if (standardEl) standardEl.textContent = '--';
                    if (airstripEl) airstripEl.textContent = '--';
                } else {
                    statusEl.innerHTML = '<span style="color: #4CAF50;">Traveling</span>';
                    destinationEl.textContent = travelData.destination || 'Unknown';
                    
                    if (travelData.timeRemaining && travelData.timeRemaining > 0) {
                        const hours = Math.floor(travelData.timeRemaining / 3600);
                        const minutes = Math.floor((travelData.timeRemaining % 3600) / 60);
                        const seconds = travelData.timeRemaining % 60;
                        timeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        
                        const arrivalTime = new Date(Date.now() + travelData.timeRemaining * 1000);
                        arrivalEl.textContent = arrivalTime.toLocaleTimeString();
                    } else {
                        timeEl.textContent = 'Arriving...';
                        arrivalEl.textContent = 'Now';
                    }

                    // Display flight times if destination is known
                    if (travelData.destination && TRAVEL_TIMES[travelData.destination]) {
                        const times = TRAVEL_TIMES[travelData.destination];
                        if (standardEl) standardEl.textContent = `${times.standard} min`;
                        if (airstripEl) airstripEl.textContent = `${times.airstrip} min`;
                    }
                }
            },

            saveTrackerToStorage(trackerId) {
                const trackers = JSON.parse(localStorage.getItem('sidekick_travel_trackers') || '[]');
                if (!trackers.includes(trackerId)) {
                    trackers.push(trackerId);
                    localStorage.setItem('sidekick_travel_trackers', JSON.stringify(trackers));
                }
            },

            removeTrackerFromStorage(trackerId) {
                const trackers = JSON.parse(localStorage.getItem('sidekick_travel_trackers') || '[]');
                const filtered = trackers.filter(id => id !== trackerId);
                localStorage.setItem('sidekick_travel_trackers', JSON.stringify(filtered));
            },

            restoreTravelTrackers() {
                // For now, don't auto-restore trackers as they need to be bound to specific elements
                // Users will need to recreate them after page refresh
                const trackers = JSON.parse(localStorage.getItem('sidekick_travel_trackers') || '[]');
                if (trackers.length > 0) {
                    // Clean up old tracker references
                    localStorage.setItem('sidekick_travel_trackers', '[]');
                    trackers.forEach(trackerId => {
                        localStorage.removeItem(`traveltracker_${trackerId}_layout`);
                    });
                }
            }
        };

        // Export to global scope
        window.SidekickModules = window.SidekickModules || {};
        window.SidekickModules.FlightTracker = TravelTrackerModule;

        console.log('✅ Travel Tracker module loaded');
    });

})();
