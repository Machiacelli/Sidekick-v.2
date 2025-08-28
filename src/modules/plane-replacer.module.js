// ==UserScript==
// @name         Sidekick Plane Replacer Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Replaces the plane image on Torn travel page with custom image
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
            version: '1.0.0',
            isActive: false,
            customPlaneImage: null,

            init() {
                console.log('✈️ Initializing Plane Replacer Module v1.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Plane Replacer');
                    return false;
                }

                // Check if we're on the travel page
                if (window.location.href.includes('/page.php?sid=travel')) {
                    this.activate();
                }

                console.log('✅ Plane Replacer module initialized successfully');
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
                // Find all plane images on the page
                const planeImages = document.querySelectorAll('.planeImageKbn3b, img[src*="/images/v2/travel_agency/planes/"], img[src*="travel_agency/planes"]');
                
                if (planeImages.length === 0) {
                    console.log('🔍 No plane images found yet, will retry...');
                    return;
                }

                console.log(`🎯 Found ${planeImages.length} plane image(s) to replace`);

                planeImages.forEach((img, index) => {
                    // Skip if already replaced
                    if (img.dataset.sidekickReplaced === 'true') {
                        return;
                    }
                    this.replaceSinglePlaneImage(img, index);
                });
            },

            replaceSinglePlaneImage(img, index) {
                try {
                    // Store original image info for debugging
                    const originalSrc = img.src;
                    const originalAlt = img.alt;
                    
                    console.log(`✈️ Replacing plane image ${index + 1}:`, {
                        src: originalSrc,
                        alt: originalAlt,
                        classes: img.className
                    });

                    // Create custom plane image element
                    const customPlane = document.createElement('img');
                    customPlane.className = img.className;
                    customPlane.alt = 'Custom Sidekick Plane';
                    customPlane.style.cssText = `
                        width: 100%;
                        height: auto;
                        max-width: 778px;
                        max-height: 300px;
                        object-fit: cover;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        background: transparent;
                        display: block;
                        margin: 0;
                        padding: 0;
                    `;

                    // Set the custom image source
                    // You can replace this URL with your custom plane image
                    customPlane.src = 'https://i.imgur.com/dRixRIO.jpeg';
                    
                    // Add a data attribute to mark this as replaced
                    customPlane.dataset.sidekickReplaced = 'true';
                    customPlane.dataset.originalSrc = originalSrc;

                    // Replace the original image
                    img.parentNode.replaceChild(customPlane, img);
                    
                    console.log(`✅ Successfully replaced plane image ${index + 1}`);
                    
                    // Store reference to custom image
                    this.customPlaneImage = customPlane;
                    
                } catch (error) {
                    console.error(`❌ Failed to replace plane image ${index + 1}:`, error);
                }
            },

            // Method to update the custom image source
            updateCustomImage(newImageUrl) {
                if (this.customPlaneImage) {
                    this.customPlaneImage.src = newImageUrl;
                    console.log('🔄 Updated custom plane image to:', newImageUrl);
                } else {
                    console.warn('⚠️ No custom plane image to update');
                }
            },

            // Method to restore original plane images
            restoreOriginalPlanes() {
                const customPlanes = document.querySelectorAll('img[data-sidekick-replaced="true"]');
                
                customPlanes.forEach((customPlane) => {
                    try {
                        const originalSrc = customPlane.dataset.originalSrc;
                        const originalClasses = customPlane.className;
                        
                        // Create new original image
                        const originalImg = document.createElement('img');
                        originalImg.className = originalClasses;
                        originalImg.src = originalSrc;
                        originalImg.alt = 'Airborne plane facing right against a background of moving clouds';
                        
                        // Replace custom image with original
                        customPlane.parentNode.replaceChild(originalImg, customPlane);
                        
                        console.log('🔄 Restored original plane image:', originalSrc);
                    } catch (error) {
                        console.error('❌ Failed to restore original plane image:', error);
                    }
                });
                
                this.customPlaneImage = null;
            },

            // Public methods for external access
            getStatus() {
                return {
                    active: this.isActive,
                    customImage: this.customPlaneImage ? this.customPlaneImage.src : null,
                    onTravelPage: window.location.href.includes('/page.php?sid=travel')
                };
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
