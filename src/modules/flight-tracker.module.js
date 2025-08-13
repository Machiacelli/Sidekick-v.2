// Flight Tracker Module - Area Marking System
// Allows users to mark areas on the page to monitor travel status

(function() {
    'use strict';

    const FlightTrackerModule = {
        name: 'FlightTracker',
        isMarkingMode: false,
        trackedAreas: [],
        
        // Flight duration database from Torn Wiki (Commercial/Standard and Airstrip/Private)
        flightDurations: {
            'argentina': { commercial: '167m', private: '134m' },
            'canada': { commercial: '41m', private: '33m' },
            'cayman islands': { commercial: '35m', private: '28m' },
            'china': { commercial: '242m', private: '194m' },
            'hawaii': { commercial: '103m', private: '82m' },
            'japan': { commercial: '220m', private: '176m' },
            'mexico': { commercial: '26m', private: '21m' },
            'south africa': { commercial: '297m', private: '238m' },
            'switzerland': { commercial: '158m', private: '126m' },
            'uae': { commercial: '273m', private: '218m' },
            'united kingdom': { commercial: '127m', private: '102m' }
        },
        
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

            // Create subtle dark overlay matching Torn's theme
            const overlay = document.createElement('div');
            overlay.id = 'flight-tracker-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(26, 26, 26, 0.85);
                z-index: 999998;
                pointer-events: none;
                backdrop-filter: blur(2px);
            `;

            // Stylish instructions matching Torn's dark theme
            const instructions = document.createElement('div');
            instructions.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                color: #e0e0e0;
                padding: 24px 32px;
                border-radius: 12px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 15px;
                text-align: center;
                z-index: 999999;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6), 
                           inset 0 1px 0 rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.15);
                pointer-events: none;
                max-width: 400px;
                animation: fadeInScale 0.3s ease-out;
            `;
            
            instructions.innerHTML = `
                <div style="margin-bottom: 12px;">
                    <span style="font-size: 24px; margin-right: 8px;">🎯</span>
                    <strong style="color: #4CAF50; font-size: 16px;">Flight Tracker</strong>
                </div>
                <div style="margin-bottom: 8px; color: #b0b0b0;">
                    Click anywhere on the page to mark a travel monitoring area
                </div>
                <div style="font-size: 13px; color: #888; opacity: 0.8;">
                    Press <kbd style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace;">ESC</kbd> to cancel
                </div>
            `;

            // Add CSS animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeInScale {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);

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
            
            // Create subtle scanning border around the target element
            const scanBorder = document.createElement('div');
            scanBorder.id = areaId + '-border';
            
            // Get element dimensions and position
            const elementRect = rect.element.getBoundingClientRect();
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;
            
            scanBorder.style.cssText = `
                position: absolute;
                left: ${elementRect.left + scrollX - 3}px;
                top: ${elementRect.top + scrollY - 3}px;
                width: ${elementRect.width + 6}px;
                height: ${elementRect.height + 6}px;
                border: 2px solid rgba(76, 175, 80, 0.6);
                border-radius: 4px;
                pointer-events: none;
                z-index: 999996;
                animation: scanPulse 3s ease-in-out infinite;
                box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
            `;
            
            // Create stylish tracking indicator
            const indicator = document.createElement('div');
            indicator.id = areaId;
            indicator.style.cssText = `
                position: absolute;
                left: ${rect.x - 120}px;
                top: ${rect.y + 20}px;
                background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                color: #e0e0e0;
                padding: 12px 16px;
                border-radius: 8px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11px;
                font-weight: 500;
                z-index: 999997;
                box-shadow: 0 4px 16px rgba(0,0,0,0.4), 
                           inset 0 1px 0 rgba(255,255,255,0.1);
                border: 1px solid rgba(76, 175, 80, 0.3);
                min-width: 220px;
                text-align: center;
                backdrop-filter: blur(4px);
            `;
            
            // Enhanced CSS animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes scanPulse {
                    0%, 100% { 
                        border-color: rgba(76, 175, 80, 0.6);
                        box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
                    }
                    50% { 
                        border-color: rgba(76, 175, 80, 0.9);
                        box-shadow: 0 0 16px rgba(76, 175, 80, 0.5);
                    }
                }
                @keyframes statusGlow {
                    0%, 100% { text-shadow: 0 0 4px rgba(76, 175, 80, 0.5); }
                    50% { text-shadow: 0 0 8px rgba(76, 175, 80, 0.8); }
                }
            `;
            document.head.appendChild(style);
            
            indicator.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                    <span style="font-size: 14px; margin-right: 6px;">🛩️</span>
                    <strong style="color: #4CAF50; font-size: 12px;">Flight Tracker</strong>
                </div>
                <div id="${areaId}-status" style="margin-bottom: 8px; font-size: 10px; color: #b0b0b0;">
                    🔍 Scanning for travel status...
                </div>
                <div style="display: flex; justify-content: center;">
                    <button onclick="window.SidekickModules.FlightTracker.removeArea('${areaId}')" 
                            style="background: rgba(244, 67, 54, 0.2); 
                                   border: 1px solid rgba(244, 67, 54, 0.4); 
                                   color: #ff6b6b; 
                                   padding: 4px 8px; 
                                   border-radius: 4px; 
                                   cursor: pointer; 
                                   font-size: 9px;
                                   transition: all 0.2s ease;
                                   font-family: inherit;"
                            onmouseover="this.style.background='rgba(244, 67, 54, 0.3)'"
                            onmouseout="this.style.background='rgba(244, 67, 54, 0.2)'">
                        ✕ Remove
                    </button>
                </div>
            `;
            
            // Add both elements to the page
            document.body.appendChild(scanBorder);
            document.body.appendChild(indicator);
            
            // Store area data including border reference
            const areaData = {
                id: areaId,
                x: rect.x,
                y: rect.y,
                element: rect.element,
                created: Date.now(),
                borderElement: scanBorder
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
                    const planeTypeText = travelStatus.planeType ? ` (${travelStatus.planeType})` : '';
                    const destinationText = travelStatus.destination ? ` to ${travelStatus.destination.charAt(0).toUpperCase() + travelStatus.destination.slice(1)}` : '';
                    
                    statusElement.innerHTML = `⏳ Waiting for departure${destinationText}${planeTypeText}`;
                    statusElement.style.cssText = `
                        margin-bottom: 8px; font-size: 10px; 
                        color: #ffc107; 
                        animation: statusGlow 2s ease-in-out infinite;
                    `;
                } else if (travelStatus.destination) {
                    const planeIcon = travelStatus.planeType === 'private' ? '🛩️' : '✈️';
                    const planeTypeText = travelStatus.planeType === 'private' ? 'Private' : 'Commercial';
                    const destinationName = travelStatus.destination.charAt(0).toUpperCase() + travelStatus.destination.slice(1);
                    
                    let statusText = `${planeIcon} ${planeTypeText} to ${destinationName}`;
                    
                    // Show calculated landing time if available
                    if (travelStatus.estimatedLanding) {
                        statusText += `<br><small style="color: #90caf9;">Est. Landing: ${travelStatus.estimatedLanding}</small>`;
                    }
                    
                    // Show actual remaining time if detected from page
                    if (travelStatus.timeRemaining) {
                        statusText += `<br><small style="color: #81c784;">Remaining: ${travelStatus.timeRemaining}</small>`;
                    }
                    
                    statusElement.innerHTML = statusText;
                    statusElement.style.cssText = `
                        margin-bottom: 8px; font-size: 10px; 
                        color: #4CAF50; 
                        animation: statusGlow 2s ease-in-out infinite;
                        line-height: 1.3;
                    `;
                }
            } else {
                statusElement.innerHTML = `🏠 Not traveling`;
                statusElement.style.cssText = `
                    margin-bottom: 8px; font-size: 10px; 
                    color: #757575;
                `;
            }
        },

        detectTravelStatus(element) {
            // Comprehensive travel detection system
            const result = {
                isActive: false,
                isWaiting: false,
                destination: null,
                timeRemaining: null,
                planeType: null, // 'commercial' or 'private'
                estimatedLanding: null
            };
            
            // Search in the element and its parents/siblings for travel text
            const searchElements = [
                element,
                element.parentElement,
                element.parentElement?.parentElement,
                ...Array.from(element.parentElement?.children || [])
            ];
            
            // Also search for images to detect plane type
            const allImages = Array.from(document.querySelectorAll('img'));
            
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
                            result.destination = dest.toLowerCase();
                            break;
                        }
                    }
                    
                    // Detect plane type by looking for airplane images near the travel text
                    if (result.destination) {
                        result.planeType = this.detectPlaneType(el, allImages);
                        
                        // Calculate flight time and estimated landing
                        if (this.flightDurations[result.destination] && result.planeType) {
                            const flightDuration = this.flightDurations[result.destination][result.planeType];
                            result.estimatedLanding = this.calculateLandingTime(flightDuration);
                        }
                    }
                    
                    // Look for existing time remaining in the text
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
                    
                    // Still try to detect destination and plane type for waiting flights
                    const destinations = [
                        'argentina', 'canada', 'cayman islands', 'china', 'hawaii', 
                        'japan', 'mexico', 'south africa', 'switzerland', 'uae', 'united kingdom'
                    ];
                    
                    for (const dest of destinations) {
                        if (text.includes(dest)) {
                            result.destination = dest.toLowerCase();
                            result.planeType = this.detectPlaneType(el, allImages);
                            break;
                        }
                    }
                    
                    break;
                }
            }
            
            return result;
        },

        detectPlaneType(travelElement, allImages) {
            // Look for airplane images near the travel text to determine plane type
            const searchArea = travelElement.closest('div') || travelElement.parentElement;
            if (!searchArea) return 'commercial'; // Default fallback
            
            // Search for images within the same container or nearby
            const nearbyImages = Array.from(searchArea.querySelectorAll('img'));
            
            // Also check images that might be in adjacent elements
            const siblingElements = Array.from(searchArea.parentElement?.children || []);
            siblingElements.forEach(sibling => {
                nearbyImages.push(...Array.from(sibling.querySelectorAll('img')));
            });
            
            for (const img of nearbyImages) {
                const src = img.src?.toLowerCase() || '';
                const alt = img.alt?.toLowerCase() || '';
                const title = img.title?.toLowerCase() || '';
                
                // Private plane indicators (small single-engine propeller plane)
                if (src.includes('private') || src.includes('airstrip') || 
                    src.includes('small') || src.includes('propeller') ||
                    alt.includes('private') || alt.includes('airstrip') ||
                    title.includes('private') || title.includes('airstrip')) {
                    return 'private';
                }
                
                // Commercial plane indicators (large planes with airline text/livery)
                if (src.includes('commercial') || src.includes('airline') || 
                    src.includes('boeing') || src.includes('airbus') ||
                    alt.includes('commercial') || alt.includes('airline') ||
                    title.includes('commercial') || title.includes('airline')) {
                    return 'commercial';
                }
                
                // Check for specific airline liveries mentioned in the requirements
                const airlineIndicators = [
                    'hawaii', 'dimsum', 'buenos', 'springbrook', 'arabic'
                ];
                
                for (const indicator of airlineIndicators) {
                    if (src.includes(indicator) || alt.includes(indicator) || title.includes(indicator)) {
                        return 'commercial';
                    }
                }
            }
            
            // If we can't determine from images, try to detect from file names or context
            // Most travel images without specific private plane indicators are commercial
            return 'commercial';
        },

        calculateLandingTime(durationString) {
            // Parse duration string like "167m" and calculate landing time
            const minutes = parseInt(durationString.replace('m', ''));
            if (isNaN(minutes)) return null;
            
            const now = new Date();
            const landingTime = new Date(now.getTime() + (minutes * 60 * 1000));
            
            // Format as HH:MM
            return landingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },

        removeArea(areaId) {
            // Remove visual indicator
            const indicator = document.getElementById(areaId);
            if (indicator) {
                indicator.remove();
            }
            
            // Remove scanning border
            const border = document.getElementById(areaId + '-border');
            if (border) {
                border.remove();
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
            // Try to find the element by selector if we have it stored
            let targetElement = areaData.element;
            
            // Create scanning border (if element still exists)
            if (targetElement && document.contains(targetElement)) {
                const scanBorder = document.createElement('div');
                scanBorder.id = areaData.id + '-border';
                
                const elementRect = targetElement.getBoundingClientRect();
                const scrollX = window.scrollX;
                const scrollY = window.scrollY;
                
                scanBorder.style.cssText = `
                    position: absolute;
                    left: ${elementRect.left + scrollX - 3}px;
                    top: ${elementRect.top + scrollY - 3}px;
                    width: ${elementRect.width + 6}px;
                    height: ${elementRect.height + 6}px;
                    border: 2px solid rgba(76, 175, 80, 0.6);
                    border-radius: 4px;
                    pointer-events: none;
                    z-index: 999996;
                    animation: scanPulse 3s ease-in-out infinite;
                    box-shadow: 0 0 8px rgba(76, 175, 80, 0.3);
                `;
                
                document.body.appendChild(scanBorder);
            }
            
            // Recreate the stylish indicator
            const indicator = document.createElement('div');
            indicator.id = areaData.id;
            indicator.style.cssText = `
                position: absolute;
                left: ${areaData.x - 120}px;
                top: ${areaData.y + 20}px;
                background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                color: #e0e0e0;
                padding: 12px 16px;
                border-radius: 8px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11px;
                font-weight: 500;
                z-index: 999997;
                box-shadow: 0 4px 16px rgba(0,0,0,0.4), 
                           inset 0 1px 0 rgba(255,255,255,0.1);
                border: 1px solid rgba(76, 175, 80, 0.3);
                min-width: 220px;
                text-align: center;
                backdrop-filter: blur(4px);
            `;
            
            indicator.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                    <span style="font-size: 14px; margin-right: 6px;">🛩️</span>
                    <strong style="color: #4CAF50; font-size: 12px;">Flight Tracker</strong>
                </div>
                <div id="${areaData.id}-status" style="margin-bottom: 8px; font-size: 10px; color: #b0b0b0;">
                    🔍 Scanning for travel status...
                </div>
                <div style="display: flex; justify-content: center;">
                    <button onclick="window.SidekickModules.FlightTracker.removeArea('${areaData.id}')" 
                            style="background: rgba(244, 67, 54, 0.2); 
                                   border: 1px solid rgba(244, 67, 54, 0.4); 
                                   color: #ff6b6b; 
                                   padding: 4px 8px; 
                                   border-radius: 4px; 
                                   cursor: pointer; 
                                   font-size: 9px;
                                   transition: all 0.2s ease;
                                   font-family: inherit;"
                            onmouseover="this.style.background='rgba(244, 67, 54, 0.3)'"
                            onmouseout="this.style.background='rgba(244, 67, 54, 0.2)'">
                        ✕ Remove
                    </button>
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
