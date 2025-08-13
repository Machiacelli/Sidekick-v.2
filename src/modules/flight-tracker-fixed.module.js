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
                createdAt: Date.now()
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
            // Create border around target element
            const border = document.createElement('div');
            border.id = areaData.id + '-border';
            border.style.cssText = `
                position: absolute;
                border: 2px solid rgba(76, 175, 80, 0.6);
                border-radius: 4px;
                pointer-events: none;
                z-index: 999995;
                animation: pulse-border 2s ease-in-out infinite;
            `;
            
            // Create status indicator positioned relative to element
            const indicator = document.createElement('div');
            indicator.id = areaData.id;
            indicator.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: #e0e0e0;
                padding: 8px 12px;
                border-radius: 6px;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 12px;
                z-index: 999996;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(76, 175, 80, 0.3);
                max-width: 200px;
                word-wrap: break-word;
            `;
            
            indicator.innerHTML = `
                <div id="${areaData.id}-status" style="margin-bottom: 4px;">
                    🔍 Scanning for travel...
                </div>
                <button onclick="window.SidekickModules.FlightTracker.removeTracker('${areaData.id}')" 
                        style="background: rgba(244, 67, 54, 0.2); border: 1px solid rgba(244, 67, 54, 0.4); 
                               color: #ff6b6b; padding: 2px 6px; border-radius: 3px; cursor: pointer; 
                               font-size: 10px;">
                    Remove
                </button>
            `;
            
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
            if (!statusElement) return;
            
            console.log("🔍 Monitoring area:", areaData.id);
            
            try {
                // IMPROVED: Search more broadly for travel status
                const travelInfo = this.findTravelStatus(areaData);
                
                if (travelInfo.found) {
                    statusElement.innerHTML = `✈️ ${travelInfo.status}`;
                    statusElement.style.color = travelInfo.color;
                    console.log("✅ Travel found:", travelInfo.status);
                } else {
                    statusElement.innerHTML = `🏠 No travel detected`;
                    statusElement.style.color = '#757575';
                }
            } catch (e) {
                console.error("Error monitoring area:", e);
                statusElement.innerHTML = `❌ Monitoring error`;
                statusElement.style.color = '#f44336';
            }
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
                
                // EXPANDED: Look for more travel patterns
                if (text.includes('traveling') || 
                    text.includes('flying') || 
                    text.includes('in flight') ||
                    text.includes('abroad') ||
                    text.includes('returning') ||
                    text.includes('departing') ||
                    text.includes('boarding') ||
                    text.includes('landed') ||
                    text.match(/to (argentina|canada|cayman|china|hawaii|japan|mexico|south africa|switzerland|uae|united kingdom|torn)/i)) {
                    
                    return {
                        found: true,
                        status: this.parseStatusText(text),
                        color: '#4CAF50'
                    };
                }
            }
            
            return { found: false };
        },

        parseStatusText(text) {
            // Extract meaningful status from text
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
                // Save minimal data (remove DOM references)
                const saveData = this.trackedAreas.map(area => ({
                    id: area.id,
                    selector: area.selector,
                    textContent: area.textContent,
                    clickX: area.clickX,
                    clickY: area.clickY,
                    createdAt: area.createdAt
                }));
                
                this.core.setSetting('flight-tracked-areas', JSON.stringify(saveData));
                console.log("💾 Saved", saveData.length, "tracked areas");
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
                }
                
                this.createVisualIndicator(areaData);
                console.log("🔄 Recreated tracker:", areaData.id);
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
