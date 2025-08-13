// Flight Tracker Module - REBUILT FOR RELIABILITY
// Fixed: Click detection, positioning, travel detection, window resize handling

(function() {
    'use strict';

    const FlightTrackerModule = {
        name: 'FlightTracker',
        isMarkingMode: false,
        trackedAreas: [],
        
        // Flight duration database from Torn Wiki
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
            console.log("🛩️ FlightTracker: Initializing FIXED flight tracker...");
            this.core = window.SidekickModules?.Core;
            
            if (!this.core) {
                console.error("❌ FlightTracker: Core module not available");
                return;
            }
            
            // Load saved tracked areas
            this.loadTrackedAreas();
            
            // Set up monitoring with error handling
            this.startAreaMonitoring();
            
            // Fix positioning on window resize
            window.addEventListener('resize', () => {
                this.updateAllPositions();
            });
            
            console.log("✅ FlightTracker: FIXED flight tracker ready");
        },

        activate() {
            console.log("🛩️ FlightTracker: Starting area selection...");
            
            if (!this.core?.NotificationSystem) {
                console.error("❌ FlightTracker: NotificationSystem not available");
                return;
            }

            this.core.NotificationSystem.show(
                "🎯 Click anywhere on the page to track travel status!",
                "info",
                5000
            );

            this.enterMarkingMode();
        },

        enterMarkingMode() {
            console.log("🛩️ Entering marking mode...");
            this.isMarkingMode = true;
            
            // Create visual feedback
            document.body.style.cursor = 'crosshair';
            this.showInstructions();
            
            // FIXED: Use proper event binding
            this.boundClickHandler = this.handleAreaClick.bind(this);
            this.boundKeyHandler = this.handleEscapeKey.bind(this);
            
            document.addEventListener('click', this.boundClickHandler, true);
            document.addEventListener('keydown', this.boundKeyHandler, true);
        },

        showInstructions() {
            // Remove existing instructions
            const existing = document.getElementById('flight-instructions');
            if (existing) existing.remove();
            
            const instructions = document.createElement('div');
            instructions.id = 'flight-instructions';
            instructions.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                z-index: 999999;
                text-align: center;
                font-family: Arial, sans-serif;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
            `;
            instructions.innerHTML = `
                <div style="font-size: 18px; margin-bottom: 10px;">🎯 Flight Tracker</div>
                <div>Click anywhere to track travel status at that location</div>
                <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">Press ESC to cancel</div>
            `;
            
            document.body.appendChild(instructions);
        },

        handleAreaClick(event) {
            if (!this.isMarkingMode) return;
            
            console.log("🎯 Area clicked:", event.target);
            
            event.preventDefault();
            event.stopPropagation();
            
            // Create tracker at clicked location
            this.createTracker(event.target, event.clientX, event.clientY);
            
            // Exit marking mode
            this.exitMarkingMode();
        },

        handleEscapeKey(event) {
            if (event.key === 'Escape' && this.isMarkingMode) {
                this.exitMarkingMode();
                this.core.NotificationSystem.show("❌ Flight tracking cancelled", "warning", 3000);
            }
        },

        exitMarkingMode() {
            console.log("🛩️ Exiting marking mode...");
            this.isMarkingMode = false;
            document.body.style.cursor = '';
            
            // FIXED: Remove event listeners properly
            if (this.boundClickHandler) {
                document.removeEventListener('click', this.boundClickHandler, true);
            }
            if (this.boundKeyHandler) {
                document.removeEventListener('keydown', this.boundKeyHandler, true);
            }
            
            // Remove instructions
            const instructions = document.getElementById('flight-instructions');
            if (instructions) instructions.remove();
        },

        createTracker(targetElement, clickX, clickY) {
            const trackerId = 'flight-tracker-' + Date.now();
            
            console.log("✈️ Creating tracker:", trackerId, "at element:", targetElement);
            
            // FIXED: Store element reference with fallback selector
            const areaData = {
                id: trackerId,
                element: targetElement,
                selector: this.generateSelector(targetElement),
                textContent: targetElement.textContent,
                clickX: clickX,
                clickY: clickY,
                createdAt: Date.now(),
                departureTime: null // Will be set when return flight detected
            };
            
            // Create visual indicator
            this.createVisualIndicator(areaData);
            
            // Add to tracked areas
            this.trackedAreas.push(areaData);
            this.saveTrackedAreas();
            
            this.core.NotificationSystem.show(
                `✅ Now tracking travel at selected area`,
                "success",
                3000
            );
            
            // Start monitoring immediately
            setTimeout(() => this.monitorArea(areaData), 500);
        },

        generateSelector(element) {
            // Generate a CSS selector for the element
            try {
                let selector = element.tagName.toLowerCase();
                if (element.id) {
                    selector += '#' + element.id;
                }
                if (element.className) {
                    const classes = element.className.split(' ').filter(c => c.trim());
                    if (classes.length > 0) {
                        selector += '.' + classes.slice(0, 3).join('.');
                    }
                }
                return selector;
            } catch (e) {
                return 'body';
            }
        },

        createVisualIndicator(areaData) {
            // Create border around target element with color coding
            const border = document.createElement('div');
            border.id = areaData.id + '-border';
            border.style.cssText = `
                position: absolute;
                border: 1px solid rgba(76, 175, 80, 0.5);
                border-radius: 3px;
                pointer-events: none;
                z-index: 999995;
                animation: pulse-border 3s ease-in-out infinite;
                transition: border-color 0.3s ease;
            `;
            
            // Create compact status indicator
            const indicator = document.createElement('div');
            indicator.id = areaData.id;
            indicator.style.cssText = `
                position: fixed;
                background: rgba(26, 26, 26, 0.92);
                color: #e8e8e8;
                padding: 6px 8px;
                border-radius: 4px;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 11px;
                z-index: 999996;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(76, 175, 80, 0.3);
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                min-width: 160px;
                max-width: 280px;
                word-wrap: break-word;
                line-height: 1.3;
            `;
            
            indicator.innerHTML = `
                <div id="${areaData.id}-status" style="margin-bottom: 2px; font-weight: 500;">
                    🔍 Scanning...
                </div>
                <div id="${areaData.id}-plane-type" style="font-size: 9px; color: #999; margin-bottom: 2px;">
                    Detecting plane type...
                </div>
                <div id="${areaData.id}-close" 
                     style="position: absolute; top: 2px; right: 2px; background: rgba(244, 67, 54, 0.3); 
                            border: none; color: #ff6b6b; width: 14px; height: 14px; border-radius: 50%; 
                            cursor: pointer; font-size: 9px; display: flex; align-items: center; 
                            justify-content: center; font-weight: bold; transition: all 0.15s ease;
                            line-height: 1;">
                    ×
                </div>
            `;
            
            // FIXED: Proper event binding for remove button
            const closeBtn = indicator.querySelector('#' + areaData.id + '-close');
            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeTracker(areaData.id);
            });
            
            // Add hover effects
            closeBtn.addEventListener('mouseenter', function() {
                this.style.background = 'rgba(244, 67, 54, 0.6)';
                this.style.transform = 'scale(1.1)';
            });
            closeBtn.addEventListener('mouseleave', function() {
                this.style.background = 'rgba(244, 67, 54, 0.3)';
                this.style.transform = 'scale(1)';
            });
            
            // Position indicators
            this.updateIndicatorPosition(areaData, border, indicator);
            
            document.body.appendChild(border);
            document.body.appendChild(indicator);
            
            // Add CSS animation
            if (!document.getElementById('flight-tracker-styles')) {
                const style = document.createElement('style');
                style.id = 'flight-tracker-styles';
                style.textContent = `
                    @keyframes pulse-border {
                        0%, 100% { opacity: 0.6; }
                        50% { opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
        },

        updateIndicatorPosition(areaData, border, indicator) {
            try {
                // Try to find element by stored reference first
                let targetElement = areaData.element;
                
                // If element is stale, try to find it by selector
                if (!document.contains(targetElement)) {
                    targetElement = document.querySelector(areaData.selector);
                    if (targetElement) {
                        areaData.element = targetElement; // Update reference
                    }
                }
                
                if (targetElement && document.contains(targetElement)) {
                    const rect = targetElement.getBoundingClientRect();
                    
                    // Update border position
                    border.style.left = (rect.left + window.scrollX - 2) + 'px';
                    border.style.top = (rect.top + window.scrollY - 2) + 'px';
                    border.style.width = (rect.width + 4) + 'px';
                    border.style.height = (rect.height + 4) + 'px';
                    
                    // Position indicator below the element
                    indicator.style.left = (rect.left + window.scrollX) + 'px';
                    indicator.style.top = (rect.bottom + window.scrollY + 5) + 'px';
                } else {
                    // Fallback to click position if element can't be found
                    border.style.left = (areaData.clickX + window.scrollX - 25) + 'px';
                    border.style.top = (areaData.clickY + window.scrollY - 25) + 'px';
                    border.style.width = '50px';
                    border.style.height = '50px';
                    
                    indicator.style.left = (areaData.clickX + window.scrollX) + 'px';
                    indicator.style.top = (areaData.clickY + window.scrollY + 30) + 'px';
                }
            } catch (e) {
                console.error("Error updating indicator position:", e);
            }
        },

        updateAllPositions() {
            // FIXED: Update all tracker positions when window resizes
            this.trackedAreas.forEach(areaData => {
                const border = document.getElementById(areaData.id + '-border');
                const indicator = document.getElementById(areaData.id);
                if (border && indicator) {
                    this.updateIndicatorPosition(areaData, border, indicator);
                }
            });
        },

        monitorArea(areaData) {
            const statusElement = document.getElementById(areaData.id + '-status');
            const planeTypeElement = document.getElementById(areaData.id + '-plane-type');
            const borderElement = document.getElementById(areaData.id + '-border');
            
            if (!statusElement) return;
            
            console.log("🔍 Monitoring area:", areaData.id);
            
            try {
                // IMPROVED: Search more broadly for travel status
                const travelInfo = this.findTravelStatus(areaData);
                
                if (travelInfo.found) {
                    const status = travelInfo.status.toLowerCase();
                    
                    // Detect plane type and display it
                    const planeType = this.detectPlaneTypeFromStatus(travelInfo.rawText);
                    const planeIcon = planeType === 'private' ? '🛩️' : '✈️';
                    const planeLabel = planeType === 'private' ? 'Private Jet' : 'Commercial';
                    
                    if (planeTypeElement) {
                        planeTypeElement.innerHTML = `${planeIcon} ${planeLabel}`;
                        planeTypeElement.style.color = planeType === 'private' ? '#FFD700' : '#87CEEB';
                    }
                    
                    // Check if person is currently IN another country (landed abroad)
                    const inCountryMatch = this.detectInCountry(status);
                    if (inCountryMatch) {
                        statusElement.innerHTML = `🌍 In ${inCountryMatch.country}<br><span style="color: #FFC107; font-size: 10px;">⏳ Waiting for departure</span>`;
                        statusElement.style.color = '#4CAF50';
                        this.updateBorderColor(borderElement, 'waiting');
                        console.log("🌍 Person is in:", inCountryMatch.country);
                        return;
                    }
                    
                    // Check if this is a "Returning to Torn" flight for countdown
                    const isReturningToTorn = status.includes('Returning to torn') || 
                                            status.includes('Returning to') ||
                                            status.includes('Traveling to torn');
                    
                    if (isReturningToTorn) {
                        // Extract source country from status
                        const sourceCountry = this.extractSourceCountry(status);
                        console.log("🏠 Detected return flight from:", sourceCountry);
                        
                        if (sourceCountry && this.flightDurations[sourceCountry]) {
                            // Initialize departure time if not set
                            if (!areaData.departureTime) {
                                areaData.departureTime = Date.now();
                                this.saveTrackedAreas();
                                console.log("⏰ Started countdown for return flight from", sourceCountry);
                            }
                            
                            // Calculate countdown with plane type
                            const countdown = this.calculateCountdown(areaData.departureTime, sourceCountry, planeType);
                            
                            if (countdown.isActive) {
                                const countryFormatted = this.formatCountryName(sourceCountry);
                                statusElement.innerHTML = `${planeIcon} Returning from ${countryFormatted}<br><span style="color: #4CAF50; font-weight: bold;">${countdown.timeString}</span>`;
                                statusElement.style.color = '#e8e8e8';
                                
                                // COLOR CODING: Change border color based on remaining time
                                this.updateBorderColorByTime(borderElement, countdown.remainingMinutes);
                            } else {
                                statusElement.innerHTML = `🛬 Should have landed!`;
                                statusElement.style.color = '#ff9800';
                                this.updateBorderColor(borderElement, 'landed');
                            }
                        } else {
                            // Unknown country or no duration data
                            const formattedStatus = this.formatTravelStatus(travelInfo.status);
                            statusElement.innerHTML = formattedStatus;
                            statusElement.style.color = '#4CAF50';
                            this.updateBorderColor(borderElement, 'active');
                        }
                    } else {
                        // Other travel status (outbound flights, etc.)
                        const formattedStatus = this.formatTravelStatus(travelInfo.status);
                        statusElement.innerHTML = formattedStatus;
                        statusElement.style.color = travelInfo.color;
                        this.updateBorderColor(borderElement, 'active');
                    }
                    
                    console.log("✅ Travel found:", travelInfo.status);
                } else {
                    statusElement.innerHTML = `🏠 No travel detected`;
                    statusElement.style.color = '#888';
                    
                    if (planeTypeElement) {
                        planeTypeElement.innerHTML = `No travel detected`;
                        planeTypeElement.style.color = '#666';
                    }
                    
                    this.updateBorderColor(borderElement, 'idle');
                    
                    // Reset departure time when not traveling
                    if (areaData.departureTime) {
                        areaData.departureTime = null;
                        this.saveTrackedAreas();
                    }
                }
            } catch (e) {
                console.error("Error monitoring area:", e);
                statusElement.innerHTML = `❌ Error`;
                statusElement.style.color = '#f44336';
                this.updateBorderColor(borderElement, 'error');
            }
        },

        updateBorderColor(borderElement, status) {
            if (!borderElement) return;
            
            switch (status) {
                case 'urgent': // Less than 30 minutes
                    borderElement.style.borderColor = 'rgba(244, 67, 54, 0.8)'; // Red
                    borderElement.style.boxShadow = '0 0 10px rgba(244, 67, 54, 0.4)';
                    break;
                case 'warning': // Less than 60 minutes
                    borderElement.style.borderColor = 'rgba(255, 193, 7, 0.8)'; // Yellow
                    borderElement.style.boxShadow = '0 0 8px rgba(255, 193, 7, 0.3)';
                    break;
                case 'active': // Normal travel
                    borderElement.style.borderColor = 'rgba(76, 175, 80, 0.6)'; // Green
                    borderElement.style.boxShadow = '0 0 6px rgba(76, 175, 80, 0.2)';
                    break;
                case 'waiting': // In another country
                    borderElement.style.borderColor = 'rgba(33, 150, 243, 0.6)'; // Blue
                    borderElement.style.boxShadow = '0 0 6px rgba(33, 150, 243, 0.2)';
                    break;
                case 'landed': // Should have landed
                    borderElement.style.borderColor = 'rgba(156, 39, 176, 0.6)'; // Purple
                    borderElement.style.boxShadow = '0 0 8px rgba(156, 39, 176, 0.3)';
                    break;
                case 'idle': // No travel
                    borderElement.style.borderColor = 'rgba(158, 158, 158, 0.4)'; // Gray
                    borderElement.style.boxShadow = 'none';
                    break;
                case 'error': // Error state
                    borderElement.style.borderColor = 'rgba(244, 67, 54, 0.6)'; // Red
                    borderElement.style.boxShadow = '0 0 8px rgba(244, 67, 54, 0.3)';
                    break;
            }
        },

        updateBorderColorByTime(borderElement, remainingMinutes) {
            if (remainingMinutes <= 30) {
                this.updateBorderColor(borderElement, 'urgent');
            } else if (remainingMinutes <= 60) {
                this.updateBorderColor(borderElement, 'warning');
            } else {
                this.updateBorderColor(borderElement, 'active');
            }
        },

        detectInCountry(statusText) {
            // Detect if someone is currently IN a country (has landed abroad)
            const countryNames = {
                'Argentina': 'Argentina',
                'Canada': 'Canada', 
                'Cayman Islands': 'Cayman Islands',
                'China': 'China',
                'Hawaii': 'Hawaii',
                'Japan': 'Japan',
                'Mexico': 'Mexico',
                'South Africa': 'South Africa',
                'Switzerland': 'Switzerland',
                'UAE': 'UAE',
                'United Kingdom': 'United Kingdom'
            };
            
            // Look for "In [Country]" or "Currently in [Country]" patterns
            for (const [key, displayName] of Object.entries(countryNames)) {
                if (statusText.includes(`in ${key}`) || 
                    statusText.includes(`currently in ${key}`) ||
                    statusText.includes(`located in ${key}`) ||
                    statusText.includes(`staying in ${key}`)) {
                    return { country: displayName, key: key };
                }
            }
            
            return null;
        },

        detectPlaneTypeFromStatus(fullText) {
            // Look for airplane images or indicators in the full text/elements
            if (fullText.toLowerCase().includes('private') || 
                fullText.toLowerCase().includes('jet')) {
                return 'private';
            }
            return 'commercial'; // Default
        },

        formatCountryName(countryKey) {
            const countryNames = {
                'argentina': 'Argentina',
                'canada': 'Canada', 
                'cayman islands': 'Cayman Islands',
                'china': 'China',
                'hawaii': 'Hawaii',
                'japan': 'Japan',
                'mexico': 'Mexico',
                'south africa': 'South Africa',
                'switzerland': 'Switzerland',
                'uae': 'UAE',
                'united kingdom': 'United Kingdom'
            };
            
            return countryNames[countryKey] || countryKey.charAt(0).toUpperCase() + countryKey.slice(1);
        },

        formatTravelStatus(statusText) {
            // Format travel status with proper country names and emojis
            let formatted = statusText;
            
            // Replace country names with properly capitalized versions
            const countryNames = {
                'argentina': 'Argentina',
                'canada': 'Canada', 
                'cayman islands': 'Cayman Islands',
                'china': 'China',
                'hawaii': 'Hawaii',
                'japan': 'Japan',
                'mexico': 'Mexico',
                'south africa': 'South Africa',
                'switzerland': 'Switzerland',
                'uae': 'UAE',
                'united kingdom': 'United Kingdom'
            };
            
            for (const [key, displayName] of Object.entries(countryNames)) {
                const regex = new RegExp(`\\b${key}\\b`, 'gi');
                formatted = formatted.replace(regex, displayName);
            }
            
            return formatted;
        },

        extractSourceCountry(statusText) {
            // Extract country name from "Returning to Torn from [Country]" text
            const text = statusText.toLowerCase();
            
            // Check for "from [country]" pattern
            const fromMatch = text.match(/from\s+([a-zA-Z\s]+)/);
            if (fromMatch) {
                const country = fromMatch[1].trim();
                // Check if it's a known country
                if (this.flightDurations[country]) {
                    return country;
                }
            }
            
            // Check for direct country mentions in known destinations
            for (const country of Object.keys(this.flightDurations)) {
                if (text.includes(country)) {
                    return country;
                }
            }
            
            return null;
        },

        calculateCountdown(departureTime, sourceCountry, planeType = 'commercial') {
            const flightData = this.flightDurations[sourceCountry];
            if (!flightData) return { isActive: false };
            
            // Use the appropriate flight time based on plane type
            const flightTypeKey = planeType === 'private' ? 'private' : 'commercial';
            const durationMinutes = parseInt(flightData[flightTypeKey].replace('m', ''));
            const elapsedMs = Date.now() - departureTime;
            const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
            const remainingMinutes = durationMinutes - elapsedMinutes;
            
            if (remainingMinutes > 0) {
                const hours = Math.floor(remainingMinutes / 60);
                const mins = remainingMinutes % 60;
                
                let timeString;
                if (hours > 0) {
                    timeString = `${hours}h ${mins}m`;
                } else if (mins > 0) {
                    timeString = `${mins}m`;
                } else {
                    timeString = "Landing soon";
                }
                
                return {
                    isActive: true,
                    timeString: timeString,
                    remainingMinutes: remainingMinutes
                };
            } else {
                return { isActive: false };
            }
        },

        formatStatusText(statusText) {
            // Format status text with proper capitalization and styling
            const lines = statusText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            for (const line of lines) {
                const lower = line.toLowerCase();
                if (lower.includes('traveling') || 
                    lower.includes('flying') || 
                    lower.includes('returning') ||
                    lower.includes('abroad')) {
                    
                    // Capitalize first letter and add emoji
                    const firstLetter = line.charAt(0).toUpperCase();
                    const rest = line.slice(1);
                    const formatted = `✈️ <span style="font-size: 14px;">${firstLetter}</span>${rest}`;
                    
                    return formatted.length > 60 ? formatted.substring(0, 57) + '...' : formatted;
                }
            }
            
            // Fallback formatting
            const firstLetter = statusText.charAt(0).toUpperCase();
            const rest = statusText.slice(1);
            return `✈️ <span style="font-size: 14px;">${firstLetter}</span>${rest}`;
        },

        findTravelStatus(areaData) {
            // FIXED: More comprehensive travel detection
            const searchAreas = [];
            
            // Add the target element and surrounding areas
            if (areaData.element && document.contains(areaData.element)) {
                searchAreas.push(areaData.element);
                if (areaData.element.parentElement) {
                    searchAreas.push(areaData.element.parentElement);
                    // Add siblings
                    Array.from(areaData.element.parentElement.children).forEach(child => {
                        searchAreas.push(child);
                    });
                }
            }
            
            // Search entire page as fallback
            const profileElements = document.querySelectorAll('[class*="profile"], [class*="user"], [class*="travel"], [class*="status"], .status');
            searchAreas.push(...Array.from(profileElements));
            
            // Look for travel indicators
            for (const element of searchAreas) {
                if (!element || !element.textContent) continue;
                
                const text = element.textContent.toLowerCase();
                console.log("🔍 Checking text:", text.substring(0, 100));
                
                // EXPANDED: Look for more travel patterns including "In Country"
                if (text.includes('traveling') || 
                    text.includes('flying') || 
                    text.includes('in flight') ||
                    text.includes('abroad') ||
                    text.includes('returning') ||
                    text.includes('departing') ||
                    text.includes('boarding') ||
                    text.includes('landed') ||
                    text.match(/\bin (argentina|canada|cayman|china|hawaii|japan|mexico|south africa|switzerland|uae|united kingdom)\b/i) ||
                    text.match(/to (argentina|canada|cayman|china|hawaii|japan|mexico|south africa|switzerland|uae|united kingdom|torn)/i)) {
                    
                    return {
                        found: true,
                        status: this.parseStatusText(text),
                        rawText: element.textContent, // Full text for plane detection
                        color: '#4CAF50'
                    };
                }
            }
            
            return { found: false };
        },

        parseStatusText(text) {
            // Extract meaningful status from text - now handled by formatStatusText
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            
            for (const line of lines) {
                const lower = line.toLowerCase();
                if (lower.includes('traveling') || 
                    lower.includes('flying') || 
                    lower.includes('returning') ||
                    lower.includes('abroad')) {
                    return line.length > 50 ? line.substring(0, 47) + '...' : line;
                }
            }
            
            return 'Travel detected';
        },

        removeTracker(trackerId) {
            console.log("🗑️ Removing tracker:", trackerId);
            
            // Remove visual elements
            const border = document.getElementById(trackerId + '-border');
            const indicator = document.getElementById(trackerId);
            if (border) border.remove();
            if (indicator) indicator.remove();
            
            // Remove from tracked areas
            this.trackedAreas = this.trackedAreas.filter(area => area.id !== trackerId);
            this.saveTrackedAreas();
            
            this.core.NotificationSystem.show("🗑️ Tracker removed", "info", 2000);
        },

        startAreaMonitoring() {
            // FIXED: Monitor every 3 seconds with error handling
            setInterval(() => {
                this.trackedAreas.forEach(areaData => {
                    try {
                        this.monitorArea(areaData);
                    } catch (e) {
                        console.error("Error in monitoring loop:", e);
                    }
                });
            }, 3000);
            
            console.log("🔄 Area monitoring started (3s intervals)");
        },

        loadTrackedAreas() {
            try {
                const saved = this.core.getSetting('flight-tracked-areas');
                if (saved) {
                    this.trackedAreas = JSON.parse(saved);
                    // Recreate visual indicators for saved areas
                    this.trackedAreas.forEach(areaData => {
                        this.recreateTracker(areaData);
                    });
                    console.log("📂 Loaded", this.trackedAreas.length, "tracked areas");
                }
            } catch (e) {
                console.error("Error loading tracked areas:", e);
                this.trackedAreas = [];
            }
        },

        saveTrackedAreas() {
            try {
                // Save complete data including departure time for persistence
                const saveData = this.trackedAreas.map(area => ({
                    id: area.id,
                    selector: area.selector,
                    textContent: area.textContent,
                    clickX: area.clickX,
                    clickY: area.clickY,
                    createdAt: area.createdAt,
                    departureTime: area.departureTime // IMPORTANT: Save departure time for countdown persistence
                }));
                
                this.core.setSetting('flight-tracked-areas', JSON.stringify(saveData));
                console.log("💾 Saved", saveData.length, "tracked areas with departure times");
            } catch (e) {
                console.error("Error saving tracked areas:", e);
            }
        },

        recreateTracker(areaData) {
            try {
                // Try to find the element by selector
                const element = document.querySelector(areaData.selector);
                if (element) {
                    areaData.element = element;
                } else {
                    // If selector fails, try to find by text content
                    const allElements = document.querySelectorAll('*');
                    for (const el of allElements) {
                        if (el.textContent && el.textContent.includes(areaData.textContent.substring(0, 20))) {
                            areaData.element = el;
                            break;
                        }
                    }
                }
                
                // Ensure departureTime is preserved
                if (!areaData.departureTime) {
                    areaData.departureTime = null;
                }
                
                this.createVisualIndicator(areaData);
                console.log("🔄 Recreated tracker:", areaData.id, "with departure time:", areaData.departureTime);
            } catch (e) {
                console.error("Error recreating tracker:", e);
            }
        }
    };

    // Register the module
    if (!window.SidekickModules) {
        window.SidekickModules = {};
    }
    window.SidekickModules.FlightTracker = FlightTrackerModule;

    console.log("📦 FIXED FlightTracker module loaded");
})();
