// Flight Tracker Module for Sidekick
// Provides real-time flight tracking functionality

(function() {
    'use strict';

    console.log('✈️ Flight Tracker module loading...');

    const FlightTrackerModule = {
        trackers: new Map(),
        updateIntervals: new Map(),

        init() {
            console.log('✈️ Initializing Flight Tracker Module...');
            this.setupGlobalFunctions();
            this.restoreFlightTrackers();
        },

        setupGlobalFunctions() {
            // Make flight tracker creation globally available
            window.createFlightTracker = this.createFlightTracker.bind(this);
        },

        async createFlightTracker() {
            const sidebar = document.getElementById('sidekick-sidebar');
            const contentArea = document.getElementById('sidekick-content');
            if (!sidebar || !contentArea) {
                console.warn('❌ Cannot create flight tracker - sidebar not found');
                return;
            }
            
            const trackerId = Date.now() + Math.random();
            const savedLayout = JSON.parse(localStorage.getItem(`flighttracker_${trackerId}_layout`) || '{}');
            
            const tracker = document.createElement('div');
            tracker.id = `flighttracker-${trackerId}`;
            tracker.className = 'sidebar-item flight-tracker';
            tracker.style.cssText = `
                position: absolute !important;
                left: ${savedLayout.x || 50}px !important;
                top: ${savedLayout.y || 50}px !important;
                width: ${savedLayout.width || 300}px !important;
                height: ${savedLayout.height || 180}px !important;
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
                background: #1976D2 !important;
                border-bottom: 1px solid #555 !important;
                padding: 4px 8px !important;
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                cursor: move !important;
                height: 20px !important;
                user-select: none !important;
                border-radius: 7px 7px 0 0 !important;
                box-sizing: border-box !important;
            `;
            
            const title = document.createElement('span');
            title.innerHTML = '✈️ Flight Tracker';
            title.style.cssText = `
                color: #fff !important;
                font-size: 11px !important;
                font-weight: bold !important;
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                background: none !important;
                border: none !important;
                color: #fff !important;
                cursor: pointer !important;
                font-size: 14px !important;
                font-weight: bold !important;
                padding: 0 !important;
                width: 16px !important;
                height: 16px !important;
            `;
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            
            // Create content area
            const content = document.createElement('div');
            content.style.cssText = `
                padding: 12px !important;
                height: calc(100% - 28px) !important;
                overflow-y: auto !important;
                color: #fff !important;
                font-size: 12px !important;
            `;
            
            content.innerHTML = `
                <div style="margin-bottom: 8px;">
                    <strong>Flight Status:</strong> <span id="flight-status-${trackerId}" style="color: #4CAF50;">Checking...</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Destination:</strong> <span id="flight-destination-${trackerId}">Unknown</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Time Remaining:</strong> <span id="flight-time-${trackerId}">--:--:--</span>
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Landing:</strong> <span id="flight-landing-${trackerId}">--</span>
                </div>
                <div style="text-align: center; margin-top: 12px;">
                    <button id="refresh-flight-${trackerId}" style="background: #4CAF50; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">🔄 Refresh</button>
                </div>
            `;
            
            tracker.appendChild(header);
            tracker.appendChild(content);
            contentArea.appendChild(tracker);
            
            // Store tracker reference
            this.trackers.set(trackerId, tracker);
            
            // Add drag functionality
            this.addDragFunctionality(tracker, header, trackerId, closeBtn);
            
            // Add close functionality
            this.addCloseFunctionality(tracker, trackerId, closeBtn);
            
            // Start flight tracking
            this.startFlightTracking(trackerId);
            
            // Save tracker to localStorage for persistence
            this.saveTrackerToStorage(trackerId);
            
            console.log("✈️ Flight tracker created:", trackerId);
            
            if (window.SidekickModules?.Core?.NotificationSystem) {
                window.SidekickModules.Core.NotificationSystem.show('Flight Tracker', 'Flight tracker created successfully!', 'info');
            }
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
                    localStorage.setItem(`flighttracker_${trackerId}_layout`, JSON.stringify(layout));
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
                localStorage.setItem(`flighttracker_${trackerId}_layout`, JSON.stringify(layout));
            });
            resizeObserver.observe(tracker);
        },

        addCloseFunctionality(tracker, trackerId, closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Remove flight tracker?')) {
                    this.removeFlightTracker(trackerId);
                }
            });
        },

        removeFlightTracker(trackerId) {
            // Clear update interval
            const interval = this.updateIntervals.get(trackerId);
            if (interval) {
                clearInterval(interval);
                this.updateIntervals.delete(trackerId);
            }
            
            // Remove tracker element
            const tracker = this.trackers.get(trackerId);
            if (tracker) {
                tracker.remove();
                this.trackers.delete(trackerId);
            }
            
            // Clean up localStorage
            localStorage.removeItem(`flighttracker_${trackerId}_layout`);
            this.removeTrackerFromStorage(trackerId);
        },

        startFlightTracking(trackerId) {
            const updateFlightStatus = async () => {
                const apiKey = localStorage.getItem('sidekick_api_key');
                if (!apiKey) {
                    const statusEl = document.getElementById(`flight-status-${trackerId}`);
                    if (statusEl) {
                        statusEl.innerHTML = '<span style="color: #f44336;">API Key Required</span>';
                    }
                    return;
                }
                
                try {
                    const response = await fetch(`https://api.torn.com/user/?selections=travel&key=${apiKey}`);
                    const data = await response.json();
                    
                    if (data.error) {
                        const statusEl = document.getElementById(`flight-status-${trackerId}`);
                        if (statusEl) {
                            statusEl.innerHTML = '<span style="color: #f44336;">API Error</span>';
                        }
                        return;
                    }
                    
                    this.updateFlightDisplay(trackerId, data.travel);
                    
                } catch (error) {
                    const statusEl = document.getElementById(`flight-status-${trackerId}`);
                    if (statusEl) {
                        statusEl.innerHTML = '<span style="color: #f44336;">Connection Error</span>';
                    }
                }
            };
            
            // Initial update
            updateFlightStatus();
            
            // Set up auto-update every 30 seconds
            const interval = setInterval(updateFlightStatus, 30000);
            this.updateIntervals.set(trackerId, interval);
            
            // Add refresh button listener
            const refreshBtn = document.getElementById(`refresh-flight-${trackerId}`);
            if (refreshBtn) {
                refreshBtn.addEventListener('click', updateFlightStatus);
            }
        },

        updateFlightDisplay(trackerId, travel) {
            const statusEl = document.getElementById(`flight-status-${trackerId}`);
            const destinationEl = document.getElementById(`flight-destination-${trackerId}`);
            const timeEl = document.getElementById(`flight-time-${trackerId}`);
            const landingEl = document.getElementById(`flight-landing-${trackerId}`);
            
            if (!statusEl || !destinationEl || !timeEl || !landingEl) return;
            
            if (travel.departed === 0) {
                statusEl.innerHTML = '<span style="color: #666;">Not Traveling</span>';
                destinationEl.textContent = 'None';
                timeEl.textContent = '--:--:--';
                landingEl.textContent = '--';
            } else {
                const timeRemaining = travel.time_left;
                const destination = travel.destination;
                
                statusEl.innerHTML = '<span style="color: #4CAF50;">In Flight</span>';
                destinationEl.textContent = destination;
                
                if (timeRemaining > 0) {
                    const hours = Math.floor(timeRemaining / 3600);
                    const minutes = Math.floor((timeRemaining % 3600) / 60);
                    const seconds = timeRemaining % 60;
                    timeEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    
                    const landingTime = new Date(Date.now() + timeRemaining * 1000);
                    landingEl.textContent = landingTime.toLocaleTimeString();
                } else {
                    statusEl.innerHTML = '<span style="color: #FF9800;">Landing...</span>';
                    timeEl.textContent = '00:00:00';
                    landingEl.textContent = 'Now';
                }
            }
        },

        saveTrackerToStorage(trackerId) {
            const trackers = JSON.parse(localStorage.getItem('sidekick_flight_trackers') || '[]');
            if (!trackers.includes(trackerId)) {
                trackers.push(trackerId);
                localStorage.setItem('sidekick_flight_trackers', JSON.stringify(trackers));
            }
        },

        removeTrackerFromStorage(trackerId) {
            const trackers = JSON.parse(localStorage.getItem('sidekick_flight_trackers') || '[]');
            const filtered = trackers.filter(id => id !== trackerId);
            localStorage.setItem('sidekick_flight_trackers', JSON.stringify(filtered));
        },

        restoreFlightTrackers() {
            const trackers = JSON.parse(localStorage.getItem('sidekick_flight_trackers') || '[]');
            trackers.forEach(trackerId => {
                const layout = localStorage.getItem(`flighttracker_${trackerId}_layout`);
                if (layout) {
                    // Only restore if layout exists (tracker hasn't been manually deleted)
                    setTimeout(() => this.createFlightTracker(), 100);
                }
            });
        }
    };

    // Register module
    if (!window.SidekickModules) {
        window.SidekickModules = {};
    }
    
    window.SidekickModules.FlightTracker = FlightTrackerModule;
    console.log('✅ Flight Tracker module loaded');

})();
