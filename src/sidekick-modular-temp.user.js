// ==UserScript==
// @name         Sidekick Modular - Full Featured Sidebar
// @namespace    http://tampermonkey.net/
// @version      4.3.0
// @description  Modular version of Sidekick - Enhanced Torn.com sidebar with notepads, todo lists, attack lists, cooldown timers, travel tracker, points monitor, clock, and debugging tools
// @author       GitHub Copilot
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@734e05c/src/modules/core.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@734e05c/src/modules/ui.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@734e05c/src/modules/content.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@734e05c/src/modules/settings.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@734e05c/src/modules/clock.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@734e05c/src/modules/notepad.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@734e05c/src/modules/global-functions.module.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log("🚀 SIDEKICK MODULAR STARTING - " + new Date().toLocaleTimeString());
    
    // Wait for all modules to be loaded
    function waitForModules(callback) {
        const requiredModules = ['Core', 'UI', 'Content', 'Settings', 'Clock', 'Notepad'];
        const checkModules = () => {
            const loadedModules = requiredModules.filter(module => 
                window.SidekickModules && window.SidekickModules[module]
            );
            
            console.log(`📦 Modules loaded: ${loadedModules.join(', ')} (${loadedModules.length}/${requiredModules.length})`);
            
            if (loadedModules.length === requiredModules.length) {
                console.log('✅ All modules loaded successfully!');
                callback();
            } else {
                setTimeout(checkModules, 100);
            }
        };
        checkModules();
    }

    // Initialize Sidekick with all modules
    function initializeSidekick() {
        console.log("🔧 Initializing Sidekick with modular system...");
        
        try {
            // Initialize UI first (creates sidebar structure)
            window.SidekickModules.UI.init();
            
            // Initialize content modules
            window.SidekickModules.Content.init();
            window.SidekickModules.Settings.init();
            window.SidekickModules.Clock.init();
            window.SidekickModules.Notepad.init();
            
            console.log('✅ Sidekick initialization complete!');
            window.SidekickModules.Core.NotificationSystem.show('Sidekick', 'Modular system loaded successfully!', 'info');
            
        } catch (error) {
            console.error('❌ Failed to initialize Sidekick:', error);
            window.SidekickModules.Core.NotificationSystem.show('Error', 'Failed to initialize modular system', 'error');
        }
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM loaded, waiting for modules...');
            waitForModules(initializeSidekick);
        });
    } else {
        console.log('📄 DOM already ready, waiting for modules...');
        setTimeout(() => {
            waitForModules(initializeSidekick);
        }, 100);
    }

    console.log("🎯 Sidekick Modular script loaded and ready!");

})();
