// ==UserScript==
// @name         Sidekick Modular - Full Featured Sidebar
// @namespace    http://tampermonkey.net/
// @version      4.2.6
// @description  Modular version of Sidekick - Enhanced Torn.com sidebar with notepads, todo lists, attack lists, cooldown timers, travel tracker, points monitor, clock, and debugging tools
// @author       GitHub Copilot
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@b7756d2/src/modules/core.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@b7756d2/src/modules/ui.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@b7756d2/src/modules/content.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@b7756d2/src/modules/settings.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@b7756d2/src/modules/clock.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@b7756d2/src/modules/notepad.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@b7756d2/src/modules/flight-tracker.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@b7756d2/src/modules/global-functions.module.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log("🚀 SIDEKICK MODULAR STARTING v4.2.5 - " + new Date().toLocaleTimeString());
    console.log("🔧 CLEAN VERSION: Proper modular architecture restored");
    
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

        // Initialize Core module first
        if (window.SidekickModules.Core) {
            console.log("🔧 Initializing Core module...");
            window.SidekickModules.Core.init();
        }

        // Initialize UI module
        if (window.SidekickModules.UI) {
            console.log("🎨 Initializing UI module...");
            window.SidekickModules.UI.init();
        }

        // Initialize other modules
        ['Settings', 'Clock', 'Notepad', 'FlightTracker', 'Content'].forEach(moduleName => {
            if (window.SidekickModules[moduleName]) {
                console.log(`🔌 Initializing ${moduleName} module...`);
                window.SidekickModules[moduleName].init();
            }
        });

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

})();
