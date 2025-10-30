// ==UserScript==
// @name         Sidekick Travel Tracker Module
// @namespace    http://tampermonkey.net/
// @version      3.3.3
// @description  Travel tracker with dropdown menu, strict multi-tab isolation, persistent tracking, auto-cleanup, and private plane terminology
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
            version: '3.3.3',
            isActive: false,
            isMarkingMode: false,
            currentTracker: null,
            statusDisplay: null,
            tabId: null, // Unique identifier for this tab
            isTrackingTab: false, // Flag to indicate if this tab created the tracker
            
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
                console.log('✈️ Initializing Travel Tracker Module v3.3.3...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Travel Tracker');
                    return false;
                }

                // Generate unique tab ID for this session
                this.tabId = 'tab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                console.log('🆔 Tab ID:', this.tabId);

                // Load any saved tracking data (but be strict about restoring)
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
                
                const destination = this.extractDestination(element.textContent);
                const detectedPlaneType = this.detectPlaneType();
                
                console.log('📍 Destination:', destination);
                console.log('✈️ Detected plane type:', detectedPlaneType);
                
                // Show plane type confirmation dialog
                this.showPlaneTypeDialog(element, destination, detectedPlaneType);
            },

            showPlaneTypeDialog(element, destination, detectedType) {
                // Create compact dropdown menu instead of modal
                const dropdown = document.createElement('div');
                dropdown.id = 'travel-tracker-plane-dropdown';
                dropdown.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #1a1a1a;
                    color: #e0e0e0;
                    padding: 16px;
                    border-radius: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    z-index: 999999;
                    min-width: 280px;
                    animation: dropdownSlide 0.2s ease;
                `;
                
                dropdown.innerHTML = `
                    <style>
                        @keyframes dropdownSlide {
                            from { transform: translate(-50%, -55%); opacity: 0; }
                            to { transform: translate(-50%, -50%); opacity: 1; }
                        }
                        .tt-dropdown-option {
                            padding: 10px 14px;
                            margin: 4px 0;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.15s ease;
                            border: 1px solid transparent;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            font-size: 13px;
                        }
                        .tt-dropdown-option:hover {
                            background: rgba(255, 255, 255, 0.08);
                            border-color: rgba(255, 255, 255, 0.2);
                        }
                        .tt-dropdown-option.detected {
                            background: rgba(76, 175, 80, 0.15);
                            border-color: rgba(76, 175, 80, 0.3);
                        }
                        .tt-dropdown-header {
                            font-size: 13px;
                            font-weight: 600;
                            margin-bottom: 12px;
                            padding-bottom: 8px;
                            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                            color: #ffffff;
                        }
                        .tt-dropdown-cancel {
                            margin-top: 8px;
                            padding: 8px;
                            text-align: center;
                            font-size: 11px;
                            color: #888;
                            cursor: pointer;
                            border-radius: 6px;
                            transition: all 0.15s;
                        }
                        .tt-dropdown-cancel:hover {
                            background: rgba(255, 255, 255, 0.05);
                            color: #aaa;
                        }
                    </style>
                    <div class="tt-dropdown-header">
                        ✈️ Select Plane Type → ${destination}
                    </div>
                    <div class="tt-dropdown-option ${detectedType === 'commercial' ? 'detected' : ''}" data-type="commercial">
                        <span style="font-size: 18px;">🛫</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 500;">Commercial Flight</div>
                            <div style="font-size: 11px; opacity: 0.7;">Standard travel time</div>
                        </div>
                        ${detectedType === 'commercial' ? '<span style="color: #4CAF50; font-size: 16px;">✓</span>' : ''}
                    </div>
                    <div class="tt-dropdown-option ${detectedType === 'private' ? 'detected' : ''}" data-type="private">
                        <span style="font-size: 18px;">✈️</span>
                        <div style="flex: 1;">
                            <div style="font-weight: 500;">Private Plane</div>
                            <div style="font-size: 11px; opacity: 0.7;">Faster travel time</div>
                        </div>
                        ${detectedType === 'private' ? '<span style="color: #4CAF50; font-size: 16px;">✓</span>' : ''}
                    </div>
                    <div class="tt-dropdown-cancel">Cancel (or click outside)</div>
                `;
                
                document.body.appendChild(dropdown);
                
                // Option click handlers
                const options = dropdown.querySelectorAll('.tt-dropdown-option');
                options.forEach(option => {
                    option.onclick = () => {
                        const planeType = option.getAttribute('data-type');
                        dropdown.remove();
                        this.finalizeTracker(element, destination, planeType);
                    };
                });
                
                // Cancel button
                const cancelBtn = dropdown.querySelector('.tt-dropdown-cancel');
                cancelBtn.onclick = () => {
                    dropdown.remove();
                    this.core.NotificationSystem.show(
                        'Travel Tracker',
                        'Tracking cancelled',
                        'info'
                    );
                };
                
                // Click outside to close
                const closeOnOutsideClick = (e) => {
                    if (!dropdown.contains(e.target)) {
                        dropdown.remove();
                        document.removeEventListener('click', closeOnOutsideClick);
                        this.core.NotificationSystem.show(
                            'Travel Tracker',
                            'Tracking cancelled',
                            'info'
                        );
                    }
                };
                
                // Add listener after a small delay to prevent immediate closing
                setTimeout(() => {
                    document.addEventListener('click', closeOnOutsideClick);
                }, 100);
                
                // ESC key to close
                const closeOnEscape = (e) => {
                    if (e.key === 'Escape') {
                        dropdown.remove();
                        document.removeEventListener('keydown', closeOnEscape);
                        document.removeEventListener('click', closeOnOutsideClick);
                        this.core.NotificationSystem.show(
                            'Travel Tracker',
                            'Tracking cancelled',
                            'info'
                        );
                    }
                };
                document.addEventListener('keydown', closeOnEscape);
            },

            finalizeTracker(element, destination, planeType) {
                const tracker = {
                    id: 'travel-tracker-' + Date.now(),
                    element: element,
                    selector: this.generateSelector(element),
                    initialText: element.textContent,
                    lastText: element.textContent,
                    createdAt: Date.now(),
                    destination: destination,
                    planeType: planeType,
                    status: 'monitoring',
                    tabId: this.tabId // Associate with this specific tab
                };
                
                this.currentTracker = tracker;
                this.isTrackingTab = true; // Mark this tab as the tracking tab
                this.markTabActive(); // Mark as active tracking tab
                this.saveState();
                
                // Exit marking mode since we've successfully created the tracker
                this.isMarkingMode = false;
                document.body.style.cursor = '';
                this.hideInstructions();
                this.removeEventListeners();
                
                // Remove hover effects
                const highlighted = document.querySelectorAll('.travel-tracker-highlight');
                highlighted.forEach(el => el.classList.remove('travel-tracker-highlight'));
                
                // Create status display
                this.createStatusDisplay();
                
                // Start monitoring
                this.startMonitoring();
                
                this.core.NotificationSystem.show(
                    'Travel Tracker', 
                    `Now tracking ${planeType} ${planeType === 'private' ? 'plane' : 'flight'} to ${destination}!`, 
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
                console.log('🔍 Detecting plane type...');
                
                // Method 1: Check URL parameters (most reliable)
                const urlParams = new URLSearchParams(window.location.search);
                const step = urlParams.get('step');
                if (step) {
                    if (step.includes('private') || step.includes('PI')) {
                        console.log('✈️ Detected PRIVATE plane from URL parameter:', step);
                        return 'private';
                    }
                    if (step.includes('commercial') || step.includes('airstrip')) {
                        console.log('✈️ Detected COMMERCIAL plane from URL parameter:', step);
                        return 'commercial';
                    }
                }
                
                // Method 2: Check travel page content for plane type indicators
                const pageContent = document.body.textContent.toLowerCase();
                
                // Look for private plane indicators
                const privateIndicators = [
                    'private plane',
                    'private flight',
                    'cessna',
                    'learjet',
                    'your private',
                    'business plane'
                ];
                
                for (const indicator of privateIndicators) {
                    if (pageContent.includes(indicator)) {
                        console.log('✈️ Detected PRIVATE plane from page content:', indicator);
                        return 'private';
                    }
                }
                
                // Look for commercial indicators
                const commercialIndicators = [
                    'commercial flight',
                    'airline',
                    'airbus',
                    'boeing',
                    'economy class',
                    'business class',
                    'first class'
                ];
                
                for (const indicator of commercialIndicators) {
                    if (pageContent.includes(indicator)) {
                        console.log('✈️ Detected COMMERCIAL plane from page content:', indicator);
                        return 'commercial';
                    }
                }
                
                // Method 3: Check for specific image patterns (Torn uses specific images)
                const images = document.querySelectorAll('img');
                
                for (const img of images) {
                    const src = img.src.toLowerCase();
                    const alt = (img.alt || '').toLowerCase();
                    const title = (img.title || '').toLowerCase();
                    
                    // Torn's private plane images often contain these patterns
                    if (src.includes('privjet') || 
                        src.includes('private') || 
                        src.includes('cessna') ||
                        src.includes('learjet') ||
                        alt.includes('private') ||
                        title.includes('private')) {
                        console.log('✈️ Detected PRIVATE plane from image:', src);
                        return 'private';
                    }
                    
                    // Commercial plane patterns
                    if (src.includes('commercial') || 
                        src.includes('airline') || 
                        src.includes('airbus') ||
                        src.includes('boeing') ||
                        alt.includes('commercial') ||
                        title.includes('commercial')) {
                        console.log('✈️ Detected COMMERCIAL plane from image:', src);
                        return 'commercial';
                    }
                }
                
                // Method 4: Check localStorage or sessionStorage for recent travel data
                try {
                    const recentTravel = localStorage.getItem('torn_recent_travel');
                    if (recentTravel) {
                        const travelData = JSON.parse(recentTravel);
                        if (travelData.planeType) {
                            console.log('✈️ Detected plane type from storage:', travelData.planeType);
                            return travelData.planeType;
                        }
                    }
                } catch (e) {
                    // Ignore storage errors
                }
                
                // Default: Ask the user or use commercial as fallback
                console.warn('⚠️ Could not detect plane type, defaulting to commercial');
                console.log('🔍 Page URL:', window.location.href);
                console.log('🔍 Available images:', Array.from(images).map(img => img.src));
                
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
                    // Only monitor if this is still the active tab
                    if (!this.isActiveTab()) {
                        console.log('⏸️ No longer active tab, stopping monitoring');
                        this.stopMonitoringOnly();
                        return;
                    }
                    
                    // Update tab activity timestamp
                    this.markTabActive();
                    
                    this.checkForChanges();
                }, 10000); // Check every 10 seconds
                
                console.log('🔄 Started monitoring travel status changes');
            },

            stopMonitoringOnly() {
                // Stop monitoring without removing the tracker
                if (this.monitoringInterval) {
                    clearInterval(this.monitoringInterval);
                    this.monitoringInterval = null;
                    console.log('🔄 Monitoring stopped (tracker preserved)');
                }
                
                // Remove status display from this tab
                if (this.statusDisplay) {
                    this.statusDisplay.remove();
                    this.statusDisplay = null;
                }
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
                
                // If element not found, just skip this check cycle (don't cancel tracking!)
                // The element might be temporarily hidden or the DOM might be updating
                if (!element) {
                    console.log('⏸️ Tracked element temporarily not found - will retry next cycle');
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
                this.isTrackingTab = false;
                
                // Clear active tab marker
                try {
                    localStorage.removeItem('travel_tracker_active_tab');
                } catch (e) {
                    console.warn('Failed to clear active tab marker');
                }
                
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

            // Multi-tab management
            markTabActive() {
                try {
                    // Store this tab's ID and timestamp
                    const activeTabData = {
                        tabId: this.tabId,
                        lastActiveTime: Date.now()
                    };
                    localStorage.setItem('travel_tracker_active_tab', JSON.stringify(activeTabData));
                    console.log('✅ Tab marked as active:', this.tabId);
                } catch (error) {
                    console.error('❌ Failed to mark tab as active:', error);
                }
            },

            isActiveTab() {
                try {
                    const activeTabData = localStorage.getItem('travel_tracker_active_tab');
                    if (!activeTabData) return true; // If no active tab, assume this is it
                    
                    const data = JSON.parse(activeTabData);
                    
                    // Check if this tab is the active one
                    if (data.tabId === this.tabId) {
                        return true;
                    }
                    
                    // Check if the active tab is stale (more than 5 seconds old without update)
                    const timeSinceLastActive = Date.now() - data.lastActiveTime;
                    if (timeSinceLastActive > 5000) {
                        console.log('⚠️ Active tab appears stale, claiming tracking rights');
                        this.markTabActive();
                        return true;
                    }
                    
                    return false;
                } catch (error) {
                    console.error('❌ Failed to check active tab:', error);
                    return true;
                }
            },

            // State management
            saveState() {
                try {
                    // Only save if this is the active tracking tab
                    if (!this.isActiveTab() && this.currentTracker) {
                        console.log('⏸️ Not saving state - another tab is actively tracking');
                        return;
                    }

                    const state = {
                        currentTracker: this.currentTracker ? {
                            id: this.currentTracker.id,
                            selector: this.currentTracker.selector,
                            initialText: this.currentTracker.initialText,
                            lastText: this.currentTracker.lastText,
                            createdAt: this.currentTracker.createdAt,
                            destination: this.currentTracker.destination,
                            planeType: this.currentTracker.planeType,
                            status: this.currentTracker.status,
                            tabId: this.currentTracker.tabId
                        } : null
                    };
                    
                    this.core.saveState('travel_tracker_state', state);
                    console.log('💾 Travel tracker state saved for tab:', this.tabId);
                } catch (error) {
                    console.error('❌ Failed to save travel tracker state:', error);
                }
            },

            loadState() {
                try {
                    const state = this.core.loadState('travel_tracker_state', {});
                    
                    if (state.currentTracker) {
                        const savedTabId = state.currentTracker.tabId;
                        
                        // STRICT: Only restore if this exact tab created it (tab IDs match)
                        // This prevents restoration on new page loads in other tabs
                        if (savedTabId === this.tabId) {
                            // This is our tracker, restore it
                            this.currentTracker = state.currentTracker;
                            this.isTrackingTab = true;
                            console.log('📂 Restored own tracker:', state.currentTracker);
                            this.restoreTracker();
                        } else {
                            // Different tab - check if we should claim it
                            const isActivelyTracking = this.isActiveTab();
                            
                            if (!isActivelyTracking) {
                                // The tracking tab appears to be gone (stale)
                                // But DON'T claim it automatically - wait for user action
                                console.log('⏸️ Found stale tracker from another tab, but not auto-claiming');
                                console.log('💡 User can manually start a new tracker if needed');
                            } else {
                                // Another tab is actively tracking
                                console.log('⏸️ Another tab is actively tracking, not restoring here');
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to load travel tracker state:', error);
                }
            },

            restoreTracker() {
                if (!this.currentTracker) return;
                
                // STRICT: Only restore if this tab is marked as the tracking tab
                if (!this.isTrackingTab) {
                    console.log('⏸️ Not restoring tracker - not the tracking tab');
                    return;
                }
                
                console.log('🔄 Restoring tracker display and monitoring...');
                
                // Mark as active
                this.markTabActive();
                
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