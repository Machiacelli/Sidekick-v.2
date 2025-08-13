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
                left: ${elementRect.left + scrollX - 2}px;
                top: ${elementRect.top + scrollY - 2}px;
                width: ${elementRect.width + 4}px;
                height: ${elementRect.height + 4}px;
                border: 1px solid rgba(76, 175, 80, 0.4);
                border-radius: 3px;
                pointer-events: none;
                z-index: 999996;
                animation: subtlePulse 4s ease-in-out infinite;
            `;
            
            // Position tracker below the marked area (not bottom-left corner)
            let trackerX, trackerY;
            
            if (rect.element) {
                // Position relative to the marked element
                trackerX = elementRect.left + scrollX;
                trackerY = elementRect.bottom + scrollY + 8; // 8px below the element
            } else {
                // Fallback to click position if no element
                trackerX = rect.x || elementRect.left + scrollX;
                trackerY = rect.y || elementRect.bottom + scrollY + 8;
            }
            
            // Create sleek tracker positioned below the marked area
            const indicator = document.createElement('div');
            indicator.id = areaId;
            indicator.style.cssText = `
                position: absolute;
                left: ${trackerX}px;
                top: ${trackerY}px;
                background: rgba(26, 26, 26, 0.95);
                color: #e0e0e0;
                padding: 6px 10px;
                border-radius: 5px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 11px;
                font-weight: 400;
                z-index: 999997;
                border: 1px solid rgba(76, 175, 80, 0.3);
                backdrop-filter: blur(8px);
                box-shadow: 0 2px 12px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                gap: 6px;
                max-width: 300px;
                transition: all 0.2s ease;
                white-space: nowrap;
            `;
            
            // Add subtle animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes subtlePulse {
                    0%, 100% { 
                        border-color: rgba(76, 175, 80, 0.3);
                        box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.2);
                    }
                    50% { 
                        border-color: rgba(76, 175, 80, 0.6);
                        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
                    }
                }
                .flight-remove-btn:hover {
                    background: rgba(244, 67, 54, 0.3) !important;
                    transform: scale(1.05);
                }
            `;
            document.head.appendChild(style);
            
            indicator.innerHTML = `
                <span id="${areaId}-status" style="flex: 1; color: #b0b0b0; font-size: 11px;">
                    🔍 Scanning...
                </span>
                <button class="flight-remove-btn" data-area-id="${areaId}"
                        style="background: rgba(244, 67, 54, 0.2); 
                               border: 1px solid rgba(244, 67, 54, 0.4); 
                               color: #ff6b6b; 
                               padding: 2px 5px; 
                               border-radius: 3px; 
                               cursor: pointer; 
                               font-size: 9px;
                               transition: all 0.2s ease;
                               font-family: inherit;">
                    ✕
                </button>
            `;
            
            // Add click handler for remove button (better than onclick)
            const removeBtn = indicator.querySelector('.flight-remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeArea(areaId);
            });
            
            // Add both elements to the page
            document.body.appendChild(scanBorder);
            document.body.appendChild(indicator);
            
            // Store area data with element selector for persistence
            const elementSelector = this.generateElementSelector(rect.element);
            const areaData = {
                id: areaId,
                x: trackerX,
                y: trackerY,
                elementSelector: elementSelector,
                element: rect.element,
                created: Date.now(),
                url: window.location.href,
                departureTime: null // Will store when flight departs FROM Torn
            };
            
            this.trackedAreas.push(areaData);
            this.saveTrackedAreas();
            
            // Start monitoring this area
            this.monitorArea(areaData);
            
            this.core.NotificationSystem.show(
                "✅ Flight tracker created! Monitoring travel status...",
                "success",
                3000
            );
        },

        // Generate a unique selector for an element to find it after page refresh
        generateElementSelector(element) {
            if (!element) return null;
            
            const selectors = [];
            
            // Try ID first
            if (element.id) {
                return `#${element.id}`;
            }
            
            // Try classes
            if (element.className && typeof element.className === 'string') {
                const classes = element.className.split(' ').filter(c => c.trim()).slice(0, 3);
                if (classes.length > 0) {
                    selectors.push(element.tagName.toLowerCase() + '.' + classes.join('.'));
                }
            }
            
            // Try data attributes
            for (const attr of element.attributes) {
                if (attr.name.startsWith('data-')) {
                    selectors.push(`${element.tagName.toLowerCase()}[${attr.name}="${attr.value}"]`);
                    break;
                }
            }
            
            // Fallback: try to create a path
            let path = [];
            let current = element;
            while (current && current !== document.body && path.length < 5) {
                let selector = current.tagName.toLowerCase();
                if (current.id) {
                    path.unshift(`#${current.id}`);
                    break;
                } else if (current.className && typeof current.className === 'string') {
                    const classes = current.className.split(' ').filter(c => c.trim()).slice(0, 2);
                    if (classes.length > 0) {
                        selector += '.' + classes.join('.');
                    }
                }
                
                // Add position if needed
                const siblings = Array.from(current.parentElement?.children || [])
                    .filter(sibling => sibling.tagName === current.tagName);
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    selector += `:nth-of-type(${index})`;
                }
                
                path.unshift(selector);
                current = current.parentElement;
            }
            
            return selectors[0] || path.join(' > ');
        },

        monitorArea(areaData) {
            const statusElement = document.getElementById(areaData.id + '-status');
            if (!statusElement) return;
            
            // Look for travel-related text in the nearby area
            const travelStatus = this.detectTravelStatus(areaData.element);
            
            if (travelStatus.isActive) {
                if (travelStatus.isWaiting) {
                    const destinationText = travelStatus.destination ? 
                        ` to ${travelStatus.destination.charAt(0).toUpperCase() + travelStatus.destination.slice(1)}` : '';
                    
                    statusElement.innerHTML = `⏳ Waiting for departure${destinationText}`;
                    statusElement.style.color = '#ffc107';
                    
                } else if (travelStatus.destination) {
                    const planeType = travelStatus.planeType === 'private' ? 'Private' : 'Commercial';
                    const destinationName = travelStatus.destination.charAt(0).toUpperCase() + travelStatus.destination.slice(1);
                    
                    // CORRECTED LOGIC: We can only track flights we see departing
                    if (travelStatus.destination === 'torn' || destinationName.toLowerCase() === 'torn') {
                        // Flight TO Torn - we DON'T know when they started, so just show estimated arrival
                        if (travelStatus.estimatedLanding) {
                            statusElement.innerHTML = `🏠 Est. arrival ${travelStatus.estimatedLanding}`;
                            statusElement.style.color = '#4CAF50';
                        } else {
                            statusElement.innerHTML = `🏠 ${planeType} to Torn`;
                            statusElement.style.color = '#4CAF50';
                        }
                        
                        // Reset departure time since we can't track flights TO Torn
                        if (areaData.departureTime) {
                            areaData.departureTime = null;
                            this.saveTrackedAreas();
                        }
                    } else {
                        // Flight FROM Torn TO another country - we CAN track this with live timer
                        if (!areaData.departureTime) {
                            // First time detecting departure FROM Torn, record the time
                            areaData.departureTime = Date.now();
                            this.saveTrackedAreas();
                        }
                        
                        // Calculate live countdown for flight FROM Torn
                        const elapsedMinutes = Math.floor((Date.now() - areaData.departureTime) / (1000 * 60));
                        const flightDuration = this.flightDurations[travelStatus.destination.toLowerCase()];
                        
                        if (flightDuration && flightDuration[travelStatus.planeType]) {
                            const totalMinutes = parseInt(flightDuration[travelStatus.planeType].replace('m', ''));
                            const remainingMinutes = totalMinutes - elapsedMinutes;
                            
                            if (remainingMinutes > 0) {
                                const hours = Math.floor(remainingMinutes / 60);
                                const mins = remainingMinutes % 60;
                                const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                                
                                statusElement.innerHTML = `✈️ Landing in ${timeString}`;
                                statusElement.style.color = '#4CAF50';
                            } else {
                                statusElement.innerHTML = `🛬 Should have landed`;
                                statusElement.style.color = '#ff9800';
                            }
                        } else {
                            statusElement.innerHTML = `✈️ ${planeType} to ${destinationName}`;
                            statusElement.style.color = '#4CAF50';
                        }
                    }
                }
            } else {
                statusElement.innerHTML = `🏠 No travel detected`;
                statusElement.style.color = '#757575';
                
                // Reset departure time when not traveling
                if (areaData.departureTime) {
                    areaData.departureTime = null;
                    this.saveTrackedAreas();
                }
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
                        'japan', 'mexico', 'south africa', 'switzerland', 'uae', 'united kingdom', 'torn'
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
                        'japan', 'mexico', 'south africa', 'switzerland', 'uae', 'united kingdom', 'torn'
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
                const savedAreas = JSON.parse(saved);
                
                // Filter areas for current page and recreate them
                this.trackedAreas = savedAreas.filter(area => {
                    // Only keep areas for the current page or general areas
                    return !area.url || area.url === window.location.href;
                });
                
                // Recreate visual indicators for saved areas
                this.trackedAreas.forEach(area => {
                    this.recreateAreaIndicator(area);
                });
                
                console.log(`🛩️ FlightTracker: Loaded ${this.trackedAreas.length} tracked areas for current page`);
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
            // Try to find the element using the saved selector
            let targetElement = null;
            
            if (areaData.elementSelector) {
                try {
                    targetElement = document.querySelector(areaData.elementSelector);
                } catch (e) {
                    console.warn("❌ FlightTracker: Could not find element with selector:", areaData.elementSelector);
                }
            }
            
            // If we found the element, create the scanning border
            if (targetElement) {
                const scanBorder = document.createElement('div');
                scanBorder.id = areaData.id + '-border';
                
                const elementRect = targetElement.getBoundingClientRect();
                const scrollX = window.scrollX;
                const scrollY = window.scrollY;
                
                scanBorder.style.cssText = `
                    position: absolute;
                    left: ${elementRect.left + scrollX - 2}px;
                    top: ${elementRect.top + scrollY - 2}px;
                    width: ${elementRect.width + 4}px;
                    height: ${elementRect.height + 4}px;
                    border: 1px solid rgba(76, 175, 80, 0.4);
                    border-radius: 3px;
                    pointer-events: none;
                    z-index: 999996;
                    animation: subtlePulse 4s ease-in-out infinite;
                `;
                
                document.body.appendChild(scanBorder);
                areaData.element = targetElement; // Update the element reference
            }
            
            // Create the tracker positioned below the marked element (not bottom-left corner)
            const indicator = document.createElement('div');
            indicator.id = areaData.id;
            
            // Calculate position below the marked element
            let trackerX = 20, trackerY = 20; // Default fallback position
            
            if (targetElement) {
                const elementRect = targetElement.getBoundingClientRect();
                const scrollX = window.scrollX;
                const scrollY = window.scrollY;
                trackerX = elementRect.left + scrollX;
                trackerY = elementRect.bottom + scrollY + 8; // 8px below element
            } else if (areaData.x && areaData.y) {
                // Use saved position if available
                trackerX = areaData.x;
                trackerY = areaData.y;
            }
            
            indicator.style.cssText = `
                position: absolute;
                left: ${trackerX}px;
                top: ${trackerY}px;
                background: rgba(26, 26, 26, 0.95);
                color: #e0e0e0;
                padding: 8px 12px;
                border-radius: 6px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 12px;
                font-weight: 400;
                z-index: 999997;
                border: 1px solid rgba(76, 175, 80, 0.3);
                backdrop-filter: blur(8px);
                box-shadow: 0 2px 12px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                gap: 8px;
                max-width: 400px;
                transition: all 0.2s ease;
            `;
            
            indicator.innerHTML = `
                <span id="${areaData.id}-status" style="flex: 1; color: #b0b0b0;">
                    🔍 Scanning...
                </span>
                <button class="flight-remove-btn" data-area-id="${areaData.id}"
                        style="background: rgba(244, 67, 54, 0.2); 
                               border: 1px solid rgba(244, 67, 54, 0.4); 
                               color: #ff6b6b; 
                               padding: 3px 6px; 
                               border-radius: 3px; 
                               cursor: pointer; 
                               font-size: 10px;
                               transition: all 0.2s ease;
                               font-family: inherit;">
                    ✕
                </button>
            `;
            
            // Add click handler for remove button
            const removeBtn = indicator.querySelector('.flight-remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeArea(areaData.id);
            });
            
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
