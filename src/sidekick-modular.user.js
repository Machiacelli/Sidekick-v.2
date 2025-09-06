// ==UserScript==
// @name         Sidekick Modular - Full Featured Sidebar
// @namespace    http://tampermonkey.net/
// @version      5.13.4
// @description  Modular version of Sidekick - Enhanced Torn.com sidebar with tools
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/core.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/ui.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/content.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@d5c876a/src/modules/settings.module.js?v=3
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/clock.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/notepad.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/blocktraining.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/global-functions.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/attacklist.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/linkgroup.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/travel-blocker.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/traveltracker.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/timer.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/randomtarget.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/plane-replacer.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/autogym.module.js?v=4
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3e58b29/src/modules/todolist.module.js?v=2
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // SAFE EXECUTION CHECK - wrapped in try-catch to prevent page breaking
    try {
        console.log("🔥 USERSCRIPT EXECUTING - v5.13.4", new Date().toISOString());
    } catch (e) {
        // Silent fail to prevent page breaking
    }

    // SAFE EXECUTION CHECK - wrapped in try-catch to prevent page breaking
    try {
        console.log("🔥 USERSCRIPT EXECUTING - v5.13.4", new Date().toISOString());
    } catch (e) {
        // Silent fail to prevent page breaking
    }

    // Wait for page to be fully loaded before initializing
    if (document.readyState !== 'complete') {
        console.log("⏳ Waiting for page to finish loading...");
        window.addEventListener('load', function() {
            setTimeout(initializeSidekick, 1000); // Give page time to settle
        });
        return;
    }

    console.log("🚀 MAIN SCRIPT BODY EXECUTING NOW!");
    console.log("🚀 SIDEKICK MODULAR STARTING v5.13.4 - " + new Date().toLocaleTimeString());
    console.log("✈️ IMPROVED: Travel Blocker now shows status indicator instead of bulky switch!");
    console.log("⏰ IMPROVED: Timer panel loads immediately and appears by default!");
    console.log("🎛️ INTEGRATION: Full modular architecture, settings toggle, persistent storage, travel page detection");
    console.log("💾 FIXED: To-Do List and Gym Blocker now persist content and state across page refreshes!");
    console.log("🏋️ AUTO GYM: Automatic gym switching for optimal stat training");
    console.log("📦 Checking modules availability...");
    console.log("📦 window.SidekickModules =", typeof window.SidekickModules);
    
    // Watch for module registrations
    let originalSidekickModules = window.SidekickModules;
    Object.defineProperty(window, 'SidekickModules', {
        get: function() {
            return originalSidekickModules;
        },
        set: function(value) {
            console.log("🔍 SidekickModules being set:", value);
            if (value && typeof value === 'object') {
                console.log("📦 New modules available:", Object.keys(value));
                if (value.AutoGym) {
                    console.log("🏋️ AutoGym module registered successfully!");
                }
            }
            originalSidekickModules = value;
        }
    });
    
    // Debug: Force check if modules are being loaded
    setTimeout(() => {
        console.log("🔍 5-second module check:");
        console.log("- window.SidekickModules exists:", typeof window.SidekickModules !== 'undefined');
        console.log("- window.SidekickModules value:", window.SidekickModules);
        if (window.SidekickModules) {
            console.log("- Available modules:", Object.keys(window.SidekickModules));
            console.log("� AutoGym module status:", window.SidekickModules.AutoGym ? 'LOADED' : 'NOT FOUND');
        }
    }, 5000);

    // Simple wrapper functions for module coordination (NO implementation here)
    window.forceFixNotepads = function() {
        if (window.SidekickModules?.Notepad?.forceFixNotepads) {
            window.SidekickModules.Notepad.forceFixNotepads();
        }
    };

    // Wait for DOM and modules to be ready
    function initializeSidekick() {
        try {
            if (typeof window.SidekickModules === 'undefined') {
                console.log("⏳ Waiting for modules to load...");
                setTimeout(initializeSidekick, 100);
                return;
            }

            console.log("📦 Modules loaded:", Object.keys(window.SidekickModules));

            // Wait a bit more to ensure all modules are fully initialized
            if (!window.SidekickModules.UI || !window.SidekickModules.Core) {
                console.log("⏳ Core modules not ready yet, waiting...");
                setTimeout(initializeSidekick, 200);
                return;
            }

            console.log("🎯 Starting module initialization sequence...");

            // Initialize Core module first
            if (window.SidekickModules.Core) {
                console.log("🔧 Initializing Core module...");
                try {
                    window.SidekickModules.Core.init();
                    console.log("✅ Core module initialized");
                } catch (error) {
                    console.error("❌ Core module failed:", error);
                }
            }

            // Initialize UI module
            if (window.SidekickModules.UI) {
                console.log("🎨 Initializing UI module...");
                try {
                    window.SidekickModules.UI.init();
                    console.log("✅ UI module initialized");
                } catch (error) {
                    console.error("❌ UI module failed:", error);
                }
            }

            // Initialize other modules (modular approach: each module self-registers and is initialized here)
            ['Settings', 'Clock', 'Notepad', 'TravelTracker', 'Timer', 'Content', 'AttackList', 'LinkGroup', 'TravelBlocker', 'RandomTarget', 'PlaneReplacer', 'AutoGym', 'TodoList'].forEach(moduleName => {
                if (window.SidekickModules[moduleName]) {
                    console.log(`🔌 Initializing ${moduleName} module...`);
                    try {
                        window.SidekickModules[moduleName].init();
                        console.log(`✅ ${moduleName} module initialized`);
                    } catch (error) {
                        console.error(`❌ ${moduleName} module failed:`, error);
                    }
                } else {
                    console.warn(`⚠️ ${moduleName} module not found in SidekickModules`);
                }
            });

            // Debug: Show all available modules
            console.log('🔍 Final module check - Available modules:', Object.keys(window.SidekickModules));

            console.log("✅ Sidekick Modular initialization complete!");

            // Set up periodic fixes (reduced frequency to minimize console spam)
            setInterval(() => {
                if (window.forceFixNotepads) {
                    window.forceFixNotepads();
                }
            }, 2000); // Reduced from 1000ms to 2000ms
            
        } catch (error) {
            console.error("❌ CRITICAL ERROR in initializeSidekick:", error);
            // Don't let initialization errors break the page
        }
    }

    // SAFE initialization sequence - wrapped to prevent page breaking
    try {
        // Start initialization after page is fully loaded
        console.log("🎯 Starting safe initialization...");
        
        // Only initialize if page is ready
        if (document.readyState === 'complete') {
            setTimeout(initializeSidekick, 500); // Brief delay for stability
        } else {
            window.addEventListener('load', () => {
                setTimeout(initializeSidekick, 1000); // Longer delay after page load
            });
        }
        
        // Also set up DOM ready fallback for earlier execution if safe
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initializeSidekick, 2000); // Delay to ensure page stability
            });
        }
    } catch (error) {
        console.error("❌ Initialization setup failed:", error);
        // Don't break the page if initialization fails
    }

    // Fallback timeout - if no sidebar appears after 10 seconds, show error
    setTimeout(() => {
        if (!document.getElementById('sidekick-sidebar')) {
            console.error("❌ SIDEKICK FAILED TO LOAD - No sidebar found after 10 seconds");
            console.error("📊 Debug info:", {
                "SidekickModules exists": typeof window.SidekickModules !== 'undefined',
                "Available modules": window.SidekickModules ? Object.keys(window.SidekickModules) : 'none',
                "Document ready": document.readyState,
                "Current URL": window.location.href
            });

            // Create a simple error notification
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 16px;
                border-radius: 8px;
                z-index: 999999;
                font-family: Arial, sans-serif;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            errorDiv.innerHTML = `
                <strong>🚨 Sidekick Failed to Load</strong><br>
                Modules: ${window.SidekickModules ? Object.keys(window.SidekickModules).join(', ') : 'None loaded'}<br>
                <small>Check console for details</small>
            `;
            document.body.appendChild(errorDiv);

            // Auto-remove after 10 seconds
            setTimeout(() => errorDiv.remove(), 10000);
        }
    }, 10000);

    // Export SidekickModules to window.top for global access
    window.top.SidekickModules = window.SidekickModules;
})();