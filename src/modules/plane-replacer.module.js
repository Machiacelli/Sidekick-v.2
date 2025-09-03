// ==UserScript==
// @name         Sidekick Plane Replacer Module v2.0
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Replaces the plane with custom overlay on Torn travel page + spinning propeller
// @author       Machiacelli
// @match        https://www.torn.com/page.php?sid=travel
// @match        https://*.torn.com/page.php?sid=travel
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
        const PlaneReplacerModule = {
            name: 'PlaneReplacer',
            version: '2.0.0',
            isActive: false,
            customPlaneImage: null,
            
            // Configuration for custom plane images - targeting only the plane, not the background
            config: {
                // Custom plane image - should be a plane without background, roughly 100-150px wide
                customPlaneUrl: 'https://i.imgur.com/9vhJJpT.png', // Transparent plane PNG
                customPlaneUrlJpeg: 'https://i.imgur.com/dRixRIO.jpeg', // Original for reference
                // Fallback small plane SVG (plane only, no background)
                fallbackPlaneUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMCAyMEwxMCAxNUwyNSAxMEw0NSA4TDY1IDhMODUgOEwxMDAgMTBMMTEwIDE1TDExNSAyMEwxMTAgMjVMMTAwIDMwTDg1IDMyTDY1IDMyTDQ1IDMyTDI1IDMwTDEwIDI1TDEwIDIwWiIgZmlsbD0iIzY2NjY2NiIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIyMCIgcj0iOCIgZmlsbD0iIzk5OTk5OSIgY2xhc3M9InByb3BlbGxlciIvPjwvc3ZnPg==',
                // Enable spinning propeller animation
                enableSpinningPropeller: true,
                // Plane positioning within the 778x300 frame (approximate center)
                planePosition: {
                    left: '50%', // Center horizontally
                    top: '45%',  // Slightly above center vertically
                    transform: 'translate(-50%, -50%)'
                },
                // Estimated plane size (the actual plane in the image, not the full 778x300)
                planeSize: {
                    width: '120px',  // Approximate width of just the plane
                    height: '40px'   // Approximate height of just the plane
                }
            },

            init() {
                console.log('✈️ Initializing Plane Replacer Module v2.0.0 (Overlay System)...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Plane Replacer');
                    return false;
                }

                // Check if we're on the travel page
                if (window.location.href.includes('/page.php?sid=travel')) {
                    this.activate();
                }

                console.log('✅ Plane Replacer v2.0 module initialized successfully (Overlay + Spinning Propeller)');
                return true;
            },

            activate() {
                if (this.isActive) return;
                
                console.log('🚀 Plane Replacer activated on travel page');
                this.isActive = true;
                
                // Start monitoring for the plane image
                this.startMonitoring();
            },

            startMonitoring() {
                // Try to replace immediately if elements are already present
                this.replacePlaneImage();
                
                // Set up a mutation observer to watch for dynamic content
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach((node) => {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    // Check if the added node contains plane images
                                    if (node.querySelector && (
                                        node.querySelector('.planeImageKbn3b') ||
                                        node.querySelector('img[src*="/images/v2/travel_agency/planes/"]') ||
                                        node.querySelector('img[src*="travel_agency/planes"]')
                                    )) {
                                        console.log('🔍 New plane image detected, attempting replacement...');
                                        setTimeout(() => this.replacePlaneImage(), 100);
                                    }
                                }
                            });
                        }
                    });
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // Also check periodically for any missed images
                const periodicCheck = setInterval(() => {
                    if (!this.isActive) {
                        clearInterval(periodicCheck);
                        return;
                    }
                    
                    const planeImages = document.querySelectorAll('.planeImageKbn3b, img[src*="/images/v2/travel_agency/planes/"], img[src*="travel_agency/planes"]');
                    const customPlanes = document.querySelectorAll('img[data-sidekick-replaced="true"]');
                    
                    if (planeImages.length > customPlanes.length) {
                        console.log('🔍 Periodic check: Found unreplaced plane images, attempting replacement...');
                        this.replacePlaneImage();
                    }
                }, 2000);

                console.log('👀 Plane Replacer monitoring started');
            },

            replacePlaneImage() {
                // Find all plane images on the page (the 778x300 background images)
                const planeImages = document.querySelectorAll('.planeImageKbn3b, img[src*="/images/v2/travel_agency/planes/"], img[src*="travel_agency/planes"]');
                
                if (planeImages.length === 0) {
                    console.log('🔍 No plane images found yet, will retry...');
                    return;
                }

                console.log(`🎯 Found ${planeImages.length} plane background image(s) to overlay`);

                planeImages.forEach((img, index) => {
                    // Skip if already processed
                    if (img.dataset.sidekickProcessed === 'true') {
                        return;
                    }
                    this.addPlaneOverlay(img, index);
                });
            },

            addPlaneOverlay(backgroundImg, index) {
                try {
                    console.log(`✈️ Adding custom plane overlay to background image ${index + 1}:`, {
                        src: backgroundImg.src,
                        dimensions: `${backgroundImg.offsetWidth}x${backgroundImg.offsetHeight}`,
                        classes: backgroundImg.className
                    });

                    // Mark the background image as processed
                    backgroundImg.dataset.sidekickProcessed = 'true';

                    // Create a container to hold both the background and our custom plane
                    const container = document.createElement('div');
                    container.style.cssText = `
                        position: relative;
                        display: inline-block;
                        width: ${backgroundImg.offsetWidth}px;
                        height: ${backgroundImg.offsetHeight}px;
                    `;

                    // Wrap the original background image
                    backgroundImg.parentNode.insertBefore(container, backgroundImg);
                    container.appendChild(backgroundImg);

                    // Create our custom plane element
                    const customPlane = document.createElement('img');
                    customPlane.className = 'sidekick-custom-plane';
                    customPlane.alt = 'Custom Sidekick Plane';
                    customPlane.style.cssText = `
                        position: absolute;
                        left: ${this.config.planePosition.left};
                        top: ${this.config.planePosition.top};
                        transform: ${this.config.planePosition.transform};
                        width: ${this.config.planeSize.width};
                        height: ${this.config.planeSize.height};
                        z-index: 10;
                        pointer-events: none;
                        background: transparent;
                        object-fit: contain;
                    `;

                    // Set the custom plane image source
                    customPlane.src = this.config.customPlaneUrl;
                    
                    // Add error handling
                    customPlane.onerror = () => {
                        console.warn('⚠️ Custom plane image failed to load, using fallback...');
                        customPlane.src = this.config.fallbackPlaneUrl;
                    };
                    
                    customPlane.onload = () => {
                        console.log('✅ Custom plane overlay loaded successfully');
                        
                        // Add spinning propeller animation if enabled
                        if (this.config.enableSpinningPropeller) {
                            this.addSpinningPropeller(customPlane);
                        }
                    };

                    // Add data attributes for tracking
                    customPlane.dataset.sidekickReplaced = 'true';
                    customPlane.dataset.originalSrc = backgroundImg.src;
                    customPlane.dataset.overlayIndex = index;

                    // Add the custom plane to the container
                    container.appendChild(customPlane);
                    
                    console.log(`✅ Successfully added custom plane overlay ${index + 1}`);
                    
                    // Store reference to custom plane
                    this.customPlaneImage = customPlane;
                    
                } catch (error) {
                    console.error(`❌ Failed to add plane overlay ${index + 1}:`, error);
                }
            },

            addSpinningPropeller(planeImg) {
                try {
                    // Create propeller element
                    const propeller = document.createElement('div');
                    propeller.className = 'sidekick-propeller';
                    propeller.style.cssText = `
                        position: absolute;
                        right: 15%;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 20px;
                        height: 20px;
                        background: radial-gradient(circle, rgba(0,0,0,0.3) 1px, transparent 1px);
                        border-radius: 50%;
                        z-index: 11;
                        pointer-events: none;
                        animation: spin 0.1s linear infinite;
                    `;

                    // Add CSS animation for spinning
                    if (!document.getElementById('sidekick-propeller-animation')) {
                        const style = document.createElement('style');
                        style.id = 'sidekick-propeller-animation';
                        style.textContent = `
                            @keyframes spin {
                                from { transform: translateY(-50%) rotate(0deg); }
                                to { transform: translateY(-50%) rotate(360deg); }
                            }
                            
                            .sidekick-propeller::before {
                                content: '';
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                width: 18px;
                                height: 2px;
                                background: rgba(0,0,0,0.4);
                                border-radius: 1px;
                            }
                            
                            .sidekick-propeller::after {
                                content: '';
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%) rotate(90deg);
                                width: 18px;
                                height: 2px;
                                background: rgba(0,0,0,0.4);
                                border-radius: 1px;
                            }
                        `;
                        document.head.appendChild(style);
                    }

                    // Add propeller to the plane's parent container
                    planeImg.parentNode.appendChild(propeller);
                    
                    console.log('🌀 Added spinning propeller animation');
                    
                } catch (error) {
                    console.error('❌ Failed to add spinning propeller:', error);
                }
            },

            // Method to update the custom image source
            updateCustomImage(newImageUrl) {
                this.config.customPlaneUrl = newImageUrl;
                
                // Update all existing custom plane overlays
                const customPlanes = document.querySelectorAll('img[data-sidekick-replaced="true"]');
                customPlanes.forEach(plane => {
                    plane.src = newImageUrl;
                    console.log('🔄 Updated custom plane overlay to:', newImageUrl);
                });
                
                if (customPlanes.length === 0) {
                    console.warn('⚠️ No custom plane overlays to update');
                    // Re-apply to create new overlays
                    this.replacePlaneImage();
                }
            },

            // Method to switch between PNG (transparent) and JPEG versions
            useTransparentVersion() {
                console.log('🎨 Switching to transparent PNG version...');
                this.updateCustomImage(this.config.customPlaneUrl);
            },

            useOriginalJpegVersion() {
                console.log('🖼️ Switching to original JPEG version...');
                this.updateCustomImage(this.config.customPlaneUrlJpeg);
            },

            // Method to toggle spinning propeller
            toggleSpinningPropeller() {
                this.config.enableSpinningPropeller = !this.config.enableSpinningPropeller;
                
                if (this.config.enableSpinningPropeller) {
                    console.log('� Enabling spinning propeller...');
                    // Add propellers to existing planes
                    const customPlanes = document.querySelectorAll('img[data-sidekick-replaced="true"]');
                    customPlanes.forEach(plane => {
                        if (!plane.parentNode.querySelector('.sidekick-propeller')) {
                            this.addSpinningPropeller(plane);
                        }
                    });
                } else {
                    console.log('⏹️ Disabling spinning propeller...');
                    // Remove existing propellers
                    const propellers = document.querySelectorAll('.sidekick-propeller');
                    propellers.forEach(prop => prop.remove());
                }
                
                return this.config.enableSpinningPropeller;
            },

            // Method to adjust plane position
            adjustPlanePosition(left, top) {
                this.config.planePosition.left = left;
                this.config.planePosition.top = top;
                
                console.log(`📍 Adjusting plane position to: ${left}, ${top}`);
                
                // Update existing plane positions
                const customPlanes = document.querySelectorAll('img[data-sidekick-replaced="true"]');
                customPlanes.forEach(plane => {
                    plane.style.left = left;
                    plane.style.top = top;
                });
            },

            // Method to adjust plane size
            adjustPlaneSize(width, height) {
                this.config.planeSize.width = width;
                this.config.planeSize.height = height;
                
                console.log(`📏 Adjusting plane size to: ${width} x ${height}`);
                
                // Update existing plane sizes
                const customPlanes = document.querySelectorAll('img[data-sidekick-replaced="true"]');
                customPlanes.forEach(plane => {
                    plane.style.width = width;
                    plane.style.height = height;
                });
            },

            // Method to get original plane image dimensions for reference
            getOriginalPlaneDimensions() {
                const originalPlanes = document.querySelectorAll('.planeImageKbn3b, img[src*="/images/v2/travel_agency/planes/"], img[src*="travel_agency/planes"]');
                const customPlanes = document.querySelectorAll('img[data-sidekick-replaced="true"]');
                
                if (originalPlanes.length > 0) {
                    const plane = originalPlanes[0];
                    return {
                        width: plane.naturalWidth || plane.offsetWidth,
                        height: plane.naturalHeight || plane.offsetHeight,
                        computed: window.getComputedStyle(plane)
                    };
                } else if (customPlanes.length > 0) {
                    const customPlane = customPlanes[0];
                    return {
                        originalSrc: customPlane.dataset.originalSrc,
                        currentSrc: customPlane.src,
                        width: customPlane.offsetWidth,
                        height: customPlane.offsetHeight
                    };
                }
                
                return null;
            },

            // Method to restore original plane images (remove overlays)
            restoreOriginalPlanes() {
                const customPlanes = document.querySelectorAll('img[data-sidekick-replaced="true"]');
                const processedBackgrounds = document.querySelectorAll('img[data-sidekick-processed="true"]');
                const propellers = document.querySelectorAll('.sidekick-propeller');
                
                // Remove custom plane overlays
                customPlanes.forEach((customPlane) => {
                    try {
                        console.log('🔄 Removing custom plane overlay:', customPlane.src);
                        customPlane.remove();
                    } catch (error) {
                        console.error('❌ Failed to remove custom plane overlay:', error);
                    }
                });
                
                // Remove propellers
                propellers.forEach((propeller) => {
                    propeller.remove();
                });
                
                // Reset background image processing flags
                processedBackgrounds.forEach((bg) => {
                    bg.dataset.sidekickProcessed = 'false';
                    
                    // If the background is wrapped in our container, unwrap it
                    const container = bg.parentNode;
                    if (container && container.style.position === 'relative' && 
                        container.style.display === 'inline-block') {
                        const grandParent = container.parentNode;
                        if (grandParent) {
                            grandParent.insertBefore(bg, container);
                            container.remove();
                        }
                    }
                });
                
                // Remove animation styles
                const animationStyle = document.getElementById('sidekick-propeller-animation');
                if (animationStyle) {
                    animationStyle.remove();
                }
                
                this.customPlaneImage = null;
                console.log('🔄 Restored original plane images');
            },

            // Public methods for external access
            getStatus() {
                return {
                    active: this.isActive,
                    customImageUrl: this.config.customPlaneUrl,
                    fallbackUrl: this.config.fallbackPlaneUrl,
                    spinningPropeller: this.config.enableSpinningPropeller,
                    planePosition: this.config.planePosition,
                    planeSize: this.config.planeSize,
                    onTravelPage: window.location.href.includes('/page.php?sid=travel'),
                    backgroundImagesFound: document.querySelectorAll('.planeImageKbn3b, img[src*="/images/v2/travel_agency/planes/"], img[src*="travel_agency/planes"]').length,
                    overlaysActive: document.querySelectorAll('img[data-sidekick-replaced="true"]').length,
                    propellersActive: document.querySelectorAll('.sidekick-propeller').length
                };
            },

            // Helper method to debug plane replacement issues
            debugPlaneReplacement() {
                console.log('🔧 Plane Replacer Debug Info (v2.0 - Overlay System):');
                console.log('- Status:', this.getStatus());
                
                const backgroundImages = document.querySelectorAll('.planeImageKbn3b, img[src*="/images/v2/travel_agency/planes/"], img[src*="travel_agency/planes"]');
                const customOverlays = document.querySelectorAll('img[data-sidekick-replaced="true"]');
                const propellers = document.querySelectorAll('.sidekick-propeller');
                
                console.log('- Background images found:', backgroundImages.length);
                console.log('- Custom overlays active:', customOverlays.length);
                console.log('- Spinning propellers:', propellers.length);
                
                backgroundImages.forEach((img, i) => {
                    console.log(`- Background image ${i + 1}:`, {
                        src: img.src,
                        dimensions: `${img.offsetWidth}x${img.offsetHeight}`,
                        processed: img.dataset.sidekickProcessed === 'true',
                        classes: img.className
                    });
                });
                
                customOverlays.forEach((overlay, i) => {
                    console.log(`- Custom overlay ${i + 1}:`, {
                        src: overlay.src,
                        dimensions: `${overlay.offsetWidth}x${overlay.offsetHeight}`,
                        position: {
                            left: overlay.style.left,
                            top: overlay.style.top,
                            transform: overlay.style.transform
                        }
                    });
                });
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.PlaneReplacer = PlaneReplacerModule;

        console.log('✈️ Plane Replacer module registered globally');
        
        // Auto-initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => PlaneReplacerModule.init(), 500);
            });
        } else {
            setTimeout(() => PlaneReplacerModule.init(), 500);
        }
    });
})();
