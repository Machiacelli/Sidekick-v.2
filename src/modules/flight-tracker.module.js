// Flight Tracker Module - Area Marking System
// Allows users to mark areas on the page to monitor travel status

(function() {
    'use strict';

    const FlightTrackerModule = {
        name: 'FlightTracker',
        isMarkingMode: false,
        trackedAreas: [],
        
        init() {
            console.log("🛩️ FlightTracker: Initializing area marking system...");
            this.core = window.SidekickModules?.Core;
            
            if (!this.core) {
                console.error("❌ FlightTracker: Core module not available");
                return;
            }
            
            // Load saved tracked areas
            this.loadTrackedAreas();
            
            // Set up periodic checking for tracked areas
            this.startAreaMonitoring();
            
            console.log("✅ FlightTracker: Area marking system ready");
        },

        // Called when user clicks the Flight Tracker button
        activate() {
            console.log("🛩️ FlightTracker: Button pressed, starting area marking...");
            
            if (!this.core?.NotificationSystem) {
                console.error("❌ FlightTracker: NotificationSystem not available");
                return;
            }

            // Show notification asking user to mark area
            this.core.NotificationSystem.show(
                "🎯 Click on any area of the page to track travel status there!",
                "info",
                5000
            );

            // Enter marking mode
            this.enterMarkingMode();
        },

        // Backward compatibility method
        addTravelTracker() {
            this.activate();
        },

        enterMarkingMode() {
            this.isMarkingMode = true;
            
            // Change cursor to crosshair
            document.body.style.cursor = 'crosshair';
            
            // Add overlay instructions
            this.showMarkingOverlay();
            
            // Add click listener to entire document
            document.addEventListener('click', this.handleAreaClick.bind(this), true);
            
            // ESC to cancel
            document.addEventListener('keydown', this.handleEscapeKey.bind(this), true);
        },

        showMarkingOverlay() {
            // Remove existing overlay if any
            const existingOverlay = document.getElementById('flight-tracker-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            const overlay = document.createElement('div');
            overlay.id = 'flight-tracker-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 123, 255, 0.1);
                z-index: 999998;
                pointer-events: none;
                border: 3px dashed #007bff;
                box-sizing: border-box;
            `;

            const instructions = document.createElement('div');
            instructions.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #007bff;
                color: white;
                padding: 20px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                font-size: 16px;
                text-align: center;
                z-index: 999999;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                pointer-events: none;
            `;
            instructions.innerHTML = `
                <strong>🎯 Flight Tracker - Area Marking Mode</strong><br>
                Click anywhere to mark a travel tracking area<br>
                <small>Press ESC to cancel</small>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(instructions);
        },

        handleAreaClick(event) {
            if (!this.isMarkingMode) return;
            
            event.preventDefault();
            event.stopPropagation();
            
            // Get click position
            const rect = {
                x: event.clientX + window.scrollX,
                y: event.clientY + window.scrollY,
                element: event.target
            };
            
            // Create tracking area
            this.createTrackingArea(rect);
            
            // Exit marking mode
            this.exitMarkingMode();
        },

        handleEscapeKey(event) {
            if (event.key === 'Escape' && this.isMarkingMode) {
                this.exitMarkingMode();
                this.core.NotificationSystem.show("❌ Area marking cancelled", "warning", 3000);
            }
        },

        exitMarkingMode() {
            this.isMarkingMode = false;
            document.body.style.cursor = '';
            
            // Remove event listeners
            document.removeEventListener('click', this.handleAreaClick.bind(this), true);
            document.removeEventListener('keydown', this.handleEscapeKey.bind(this), true);
            
            // Remove overlay
            const overlay = document.getElementById('flight-tracker-overlay');
            if (overlay) overlay.remove();
            
            const instructions = document.querySelector('[style*="transform: translate(-50%, -50%)"]');
            if (instructions) instructions.remove();
        },

        createTrackingArea(rect) {
            const areaId = 'flight-area-' + Date.now();
            
            // Create tracking indicator
            const indicator = document.createElement('div');
            indicator.id = areaId;
            indicator.style.cssText = `
                position: absolute;
                left: ${rect.x - 100}px;
                top: ${rect.y + 20}px;
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                font-weight: bold;
                z-index: 999997;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                border: 2px solid #fff;
                min-width: 200px;
                text-align: center;
                animation: pulse 2s infinite;
            `;
            
            // Add pulsing animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
            
            indicator.innerHTML = `
                <div>🛩️ Flight Tracker Active</div>
                <div id="${areaId}-status" style="margin-top: 4px; font-size: 11px;">
                    🔍 Scanning for travel status...
                </div>
                <div style="margin-top: 4px;">
                    <button onclick="window.SidekickModules.FlightTracker.removeArea('${areaId}')" 
                            style="background: rgba(255,255,255,0.2); border: 1px solid white; 
                                   color: white; padding: 2px 6px; border-radius: 10px; 
                                   cursor: pointer; font-size: 10px;">✕ Remove</button>
                </div>
            `;
            
            document.body.appendChild(indicator);
            
            // Store area data
            const areaData = {
                id: areaId,
                x: rect.x,
                y: rect.y,
                element: rect.element,
                created: Date.now()
            };
            
            this.trackedAreas.push(areaData);
            this.saveTrackedAreas();
            
            // Start monitoring this area
            this.monitorArea(areaData);
            
            this.core.NotificationSystem.show(
                "✅ Travel tracking area created! Monitoring for travel status...",
                "success",
                4000
            );
        },

        monitorArea(areaData) {
            const statusElement = document.getElementById(areaData.id + '-status');
            if (!statusElement) return;
            
            // Look for travel-related text in the nearby area
            const travelStatus = this.detectTravelStatus(areaData.element);
            
            if (travelStatus.isActive) {
                if (travelStatus.isWaiting) {
                    statusElement.innerHTML = `⏳ Waiting for departure`;
                    statusElement.style.color = '#ffc107';
                } else if (travelStatus.timeRemaining) {
                    statusElement.innerHTML = `✈️ Landing in: ${travelStatus.timeRemaining}`;
                    statusElement.style.color = '#28a745';
                } else if (travelStatus.destination) {
                    statusElement.innerHTML = `🌍 Traveling to: ${travelStatus.destination}`;
                    statusElement.style.color = '#17a2b8';
                }
            } else {
                statusElement.innerHTML = `🏠 Not traveling`;
                statusElement.style.color = '#6c757d';
            }
        },

        detectTravelStatus(element) {
            // Comprehensive travel detection system
            const result = {
                isActive: false,
                isWaiting: false,
                destination: null,
                timeRemaining: null
            };
            
            // Search in the element and its parents/siblings for travel text
            const searchElements = [
                element,
                element.parentElement,
                element.parentElement?.parentElement,
                ...Array.from(element.parentElement?.children || [])
            ];
            
            for (const el of searchElements) {
                if (!el || !el.textContent) continue;
                
                const text = el.textContent.toLowerCase();
                
                // Check for "traveling" status
                if (text.includes('traveling') || text.includes('flying') || text.includes('in flight')) {
                    result.isActive = true;
                    
                    // Extract destination
                    const destinations = [
                        'argentina', 'canada', 'cayman islands', 'china', 'hawaii', 
                        'japan', 'mexico', 'south africa', 'switzerland', 'uae', 'united kingdom'
                    ];
                    
                    for (const dest of destinations) {
                        if (text.includes(dest)) {
                            result.destination = dest.charAt(0).toUpperCase() + dest.slice(1);
                            break;
                        }
                    }
                    
                    // Look for time remaining
                    const timeMatch = text.match(/(\d+)\s*(min|hour|hr|minute)/i);
                    if (timeMatch) {
                        result.timeRemaining = timeMatch[0];
                    }
                    
                    break;
                }
                
                // Check for waiting status
                if (text.includes('waiting') || text.includes('boarding') || text.includes('departing')) {
                    result.isActive = true;
                    result.isWaiting = true;
                    break;
                }
            }
            
            return result;
        },

        removeArea(areaId) {
            // Remove visual indicator
            const indicator = document.getElementById(areaId);
            if (indicator) {
                indicator.remove();
            }
            
            // Remove from tracked areas
            this.trackedAreas = this.trackedAreas.filter(area => area.id !== areaId);
            this.saveTrackedAreas();
            
            this.core.NotificationSystem.show("🗑️ Tracking area removed", "info", 2000);
        },

        startAreaMonitoring() {
            // Monitor all tracked areas every 5 seconds
            setInterval(() => {
                this.trackedAreas.forEach(area => {
                    this.monitorArea(area);
                });
            }, 5000);
        },

        loadTrackedAreas() {
            try {
                const saved = this.core.getStorage('flight_tracked_areas', '[]');
                this.trackedAreas = JSON.parse(saved);
                
                // Recreate visual indicators for saved areas
                this.trackedAreas.forEach(area => {
                    this.recreateAreaIndicator(area);
                });
                
                console.log(`🛩️ FlightTracker: Loaded ${this.trackedAreas.length} tracked areas`);
            } catch (error) {
                console.error("❌ FlightTracker: Error loading tracked areas:", error);
                this.trackedAreas = [];
            }
        },

        saveTrackedAreas() {
            try {
                this.core.setStorage('flight_tracked_areas', JSON.stringify(this.trackedAreas));
            } catch (error) {
                console.error("❌ FlightTracker: Error saving tracked areas:", error);
            }
        },

        recreateAreaIndicator(areaData) {
            // Recreate the visual indicator for a saved area
            const indicator = document.createElement('div');
            indicator.id = areaData.id;
            indicator.style.cssText = `
                position: absolute;
                left: ${areaData.x - 100}px;
                top: ${areaData.y + 20}px;
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                font-weight: bold;
                z-index: 999997;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                border: 2px solid #fff;
                min-width: 200px;
                text-align: center;
            `;
            
            indicator.innerHTML = `
                <div>🛩️ Flight Tracker Active</div>
                <div id="${areaData.id}-status" style="margin-top: 4px; font-size: 11px;">
                    🔍 Scanning for travel status...
                </div>
                <div style="margin-top: 4px;">
                    <button onclick="window.SidekickModules.FlightTracker.removeArea('${areaData.id}')" 
                            style="background: rgba(255,255,255,0.2); border: 1px solid white; 
                                   color: white; padding: 2px 6px; border-radius: 10px; 
                                   cursor: pointer; font-size: 10px;">✕ Remove</button>
                </div>
            `;
            
            document.body.appendChild(indicator);
        }
    };

    // Register the module
    if (!window.SidekickModules) {
        window.SidekickModules = {};
    }
    window.SidekickModules.FlightTracker = FlightTrackerModule;

    console.log("📦 FlightTracker module loaded");
})();
