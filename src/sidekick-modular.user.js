// ==UserScript==
// @name         Sidekick Modular - Full Featured Sidebar
// @namespace    http://tampermonkey.net/
// @version      5.13.0
// @description  Modular version of Sidekick - Enhanced Torn.com sidebar with tools
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/core.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/ui.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/content.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/settings.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/clock.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/notepad.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/blocktraining.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/global-functions.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/attacklist.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/linkgroup.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/travel-blocker.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/traveltracker.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/timer.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/randomtarget.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/plane-replacer.module.js
// @require      file:///c%3A/Users/Machi/Downloads/SidekickV2/Sidekick-Script/src/modules/todolist.module.js

// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log("🚀 SIDEKICK MODULAR STARTING v5.13.0 - " + new Date().toLocaleTimeString());
    console.log("✈️ IMPROVED: Travel Blocker now shows status indicator instead of bulky switch!");
    console.log("⏰ IMPROVED: Timer panel loads immediately and appears by default!");
    console.log("🎛️ INTEGRATION: Full modular architecture, settings toggle, persistent storage, travel page detection");
    console.log("📦 Checking modules availability...");
    console.log("📦 window.SidekickModules =", typeof window.SidekickModules);

    // Simple wrapper functions for module coordination (NO implementation here)
    window.forceFixNotepads = function() {
        if (window.SidekickModules?.Notepad?.forceFixNotepads) {
            window.SidekickModules.Notepad.forceFixNotepads();
        }
    };

    // Wait for DOM and modules to be ready
    function initializeSidekick() {
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
        ['Settings', 'Clock', 'Notepad', 'TravelTracker', 'Timer', 'Content', 'AttackList', 'LinkGroup', 'TravelBlocker', 'RandomTarget', 'PlaneReplacer', 'TodoList'].forEach(moduleName => {
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
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSidekick);
    } else {
        initializeSidekick();
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
