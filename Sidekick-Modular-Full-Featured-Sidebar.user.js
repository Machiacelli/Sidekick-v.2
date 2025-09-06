// ==UserScript==
// @name         Sidekick Modular - Full Featured Sidebar
// @namespace    http://tampermonkey.net/
// @version      5.17.0
// @description  Modular version of Sidekick - Enhanced Torn.com sidebar with tools
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/core.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/ui.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/content.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@d5c876a/src/modules/settings.module.js?v=3
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/clock.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/notepad.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/blocktraining.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/global-functions.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/attacklist.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/linkgroup.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/travel-blocker.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/traveltracker.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/timer.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/randomtarget.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/plane-replacer.module.js?v=2
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@622e785/src/modules/autogym.module.js?v=4
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@88b5327/src/modules/todolist.module.js?v=2
// @run-at       document-start
// ==/UserScript==

// FORCE IMMEDIATE EXECUTION CHECK
console.log("🔥 USERSCRIPT EXECUTING - v5.13.4", new Date().toISOString());

(function() {
    'use strict';

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
    }

    // Start initialization immediately - don't wait for DOM
    console.log("🎯 Starting immediate initialization...");
    initializeSidekick();
    
    // Also set up DOM ready fallback
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSidekick);
    } else {
        setTimeout(initializeSidekick, 100);
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

    // ========== v5.17.0 TAMPERMONKEY OVERRIDE SYSTEM ==========
    
    // FORCE SIDEBAR CREATION - Hijack existing inline modules
    function forceSidebarCreation() {
        console.log("🔧 Attempting to hijack inline modules for sidebar creation...");
        
        try {
            // Check if we have the necessary modules
            if (!window.SidekickModules || !window.SidekickModules.UI) {
                console.log("❌ Required modules not found for hijacking");
                return false;
            }
            
            // Force UI initialization
            if (typeof window.SidekickModules.UI.createSidebar === 'function') {
                console.log("📦 Found UI.createSidebar, attempting to force execution...");
                window.SidekickModules.UI.createSidebar();
                
                // Force additional initializations
                setTimeout(() => {
                    if (window.SidekickModules.Settings?.initializeSettings) {
                        window.SidekickModules.Settings.initializeSettings();
                    }
                    if (window.SidekickModules.Clock?.initialize) {
                        window.SidekickModules.Clock.initialize();
                    }
                }, 500);
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.log("❌ Error during hijacking attempt:", error);
            return false;
        }
    }
    
    // CREATE MANUAL SIDEBAR - Complete fallback implementation
    function createTampermonkeySidebar() {
        console.log("🏗️ Creating manual Tampermonkey sidebar...");
        
        // Remove any existing sidebars
        const existingSidebars = document.querySelectorAll('#sidekick-sidebar, #sidekick-error-sidebar');
        existingSidebars.forEach(sidebar => sidebar.remove());
        
        const sidebar = document.createElement('div');
        sidebar.id = 'sidekick-sidebar';
        sidebar.innerHTML = `
            <div style="
                position: fixed;
                top: 50px;
                right: 10px;
                width: 320px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: 2px solid #333;
                border-radius: 15px;
                padding: 0;
                z-index: 999999;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 15px 35px rgba(0,0,0,0.7), 0 5px 15px rgba(0,0,0,0.3);
                backdrop-filter: blur(10px);
                cursor: move;
                max-height: 80vh;
                overflow-y: auto;
            " class="sidekick-draggable">
                <div style="
                    background: rgba(255,255,255,0.1);
                    padding: 15px;
                    border-radius: 13px 13px 0 0;
                    text-align: center;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                ">
                    <h2 style="margin: 0; font-size: 18px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                        🚀 Sidekick v5.17.0
                    </h2>
                    <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Tampermonkey Override Active</p>
                </div>
                
                <div style="padding: 20px;">
                    <!-- AutoGym Toggle -->
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                            <span style="font-weight: bold; font-size: 14px;">🏋️ AutoGym</span>
                            <label style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                <input type="checkbox" id="autogym-toggle" style="opacity: 0; width: 0; height: 0;">
                                <span style="
                                    position: absolute;
                                    cursor: pointer;
                                    top: 0; left: 0; right: 0; bottom: 0;
                                    background-color: #ccc;
                                    transition: .4s;
                                    border-radius: 24px;
                                    background: ${GM_getValue('autoGymEnabled', false) ? '#4CAF50' : '#ccc'};
                                ">
                                    <span style="
                                        position: absolute;
                                        content: '';
                                        height: 18px; width: 18px;
                                        left: ${GM_getValue('autoGymEnabled', false) ? '28px' : '3px'};
                                        bottom: 3px;
                                        background-color: white;
                                        transition: .4s;
                                        border-radius: 50%;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                    "></span>
                                </span>
                            </label>
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">
                            Status: <span id="autogym-status">${GM_getValue('autoGymEnabled', false) ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                    
                    <!-- Timer Display -->
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px; text-align: center;">
                        <div style="font-weight: bold; margin-bottom: 10px;">⏰ Timer</div>
                        <div id="timer-display" style="font-size: 24px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                            00:00:00
                        </div>
                        <div style="margin-top: 10px;">
                            <button id="timer-start" style="background: #4CAF50; color: white; border: none; padding: 8px 12px; border-radius: 5px; margin: 0 5px; cursor: pointer;">Start</button>
                            <button id="timer-stop" style="background: #f44336; color: white; border: none; padding: 8px 12px; border-radius: 5px; margin: 0 5px; cursor: pointer;">Stop</button>
                            <button id="timer-reset" style="background: #FF9800; color: white; border: none; padding: 8px 12px; border-radius: 5px; margin: 0 5px; cursor: pointer;">Reset</button>
                        </div>
                    </div>
                    
                    <!-- Quick Notes -->
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">📝 Quick Notes</div>
                        <textarea id="quick-notes" placeholder="Enter your notes here..." style="
                            width: 100%; height: 80px; background: rgba(255,255,255,0.1); 
                            border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; 
                            color: white; padding: 8px; resize: vertical; font-family: inherit;
                        ">${GM_getValue('quickNotes', '')}</textarea>
                    </div>
                    
                    <!-- Status Info -->
                    <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px; font-size: 12px; opacity: 0.8;">
                        <div>✅ Tampermonkey Active</div>
                        <div>🔧 Override Mode: v5.17.0</div>
                        <div>📊 State Persistence: GM_setValue</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(sidebar);
        console.log("✅ Manual sidebar created successfully");
    }
    
    // SETUP TAMPERMONKEY FEATURES - Add interactivity and state persistence
    function setupTampermonkeyFeatures() {
        console.log("⚙️ Setting up Tampermonkey features...");
        
        // AutoGym Toggle Functionality
        const autoGymToggle = document.getElementById('autogym-toggle');
        const autoGymStatus = document.getElementById('autogym-status');
        
        if (autoGymToggle && autoGymStatus) {
            // Set initial state
            const isEnabled = GM_getValue('autoGymEnabled', false);
            autoGymToggle.checked = isEnabled;
            autoGymStatus.textContent = isEnabled ? 'Enabled' : 'Disabled';
            
            // Update toggle appearance
            const toggleSlider = autoGymToggle.nextElementSibling;
            const toggleButton = toggleSlider?.querySelector('span:last-child');
            if (toggleSlider && toggleButton) {
                toggleSlider.style.background = isEnabled ? '#4CAF50' : '#ccc';
                toggleButton.style.left = isEnabled ? '28px' : '3px';
            }
            
            // Add click handler
            autoGymToggle.addEventListener('change', function() {
                const enabled = this.checked;
                GM_setValue('autoGymEnabled', enabled);
                autoGymStatus.textContent = enabled ? 'Enabled' : 'Disabled';
                
                // Update appearance
                if (toggleSlider && toggleButton) {
                    toggleSlider.style.background = enabled ? '#4CAF50' : '#ccc';
                    toggleButton.style.left = enabled ? '28px' : '3px';
                }
                
                console.log('🏋️ AutoGym state saved:', enabled);
            });
        }
        
        // Timer Functionality
        let timerInterval = null;
        let timerSeconds = 0;
        const timerDisplay = document.getElementById('timer-display');
        const timerStart = document.getElementById('timer-start');
        const timerStop = document.getElementById('timer-stop');
        const timerReset = document.getElementById('timer-reset');
        
        function updateTimerDisplay() {
            const hours = Math.floor(timerSeconds / 3600);
            const minutes = Math.floor((timerSeconds % 3600) / 60);
            const seconds = timerSeconds % 60;
            if (timerDisplay) {
                timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
        
        if (timerStart) {
            timerStart.addEventListener('click', function() {
                if (!timerInterval) {
                    timerInterval = setInterval(() => {
                        timerSeconds++;
                        updateTimerDisplay();
                    }, 1000);
                    this.style.background = '#45a049';
                    this.textContent = 'Running...';
                }
            });
        }
        
        if (timerStop) {
            timerStop.addEventListener('click', function() {
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    if (timerStart) {
                        timerStart.style.background = '#4CAF50';
                        timerStart.textContent = 'Start';
                    }
                }
            });
        }
        
        if (timerReset) {
            timerReset.addEventListener('click', function() {
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
                timerSeconds = 0;
                updateTimerDisplay();
                if (timerStart) {
                    timerStart.style.background = '#4CAF50';
                    timerStart.textContent = 'Start';
                }
            });
        }
        
        // Quick Notes Functionality
        const quickNotes = document.getElementById('quick-notes');
        if (quickNotes) {
            quickNotes.addEventListener('input', function() {
                GM_setValue('quickNotes', this.value);
            });
        }
        
        // Make sidebar draggable
        const draggableElements = document.querySelectorAll('.sidekick-draggable');
        draggableElements.forEach(element => {
            let isDragging = false;
            let startX, startY, startLeft, startTop;
            
            element.addEventListener('mousedown', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') {
                    return;
                }
                
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(getComputedStyle(element).right, 10);
                startTop = parseInt(getComputedStyle(element).top, 10);
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                e.preventDefault();
            });
            
            function handleMouseMove(e) {
                if (!isDragging) return;
                
                const deltaX = startX - e.clientX;
                const deltaY = e.clientY - startY;
                
                element.style.right = (startLeft + deltaX) + 'px';
                element.style.top = (startTop + deltaY) + 'px';
            }
            
            function handleMouseUp() {
                isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
        });
        
        console.log("✅ Tampermonkey features setup complete");
    }
    
    // MAIN EXECUTION LOGIC - Override Approach
    function executeOverrideSequence() {
        console.log("🚨🔥 TAMPERMONKEY OVERRIDE SCRIPT EXECUTING - v5.17.0");
        
        // Phase 1: Check for existing inline modules
        if (window.SidekickModules && Object.keys(window.SidekickModules).length > 0) {
            console.log("📦 Found existing inline modules:", Object.keys(window.SidekickModules));
            
            // Attempt to hijack and force sidebar creation
            if (forceSidebarCreation()) {
                console.log("✅ Successfully hijacked inline modules for sidebar creation");
                setupTampermonkeyFeatures();
                return;
            }
        }
        
        // Phase 2: Wait for @require modules to load
        console.log("🔄 No inline modules found, waiting for @require modules...");
        let moduleCheckAttempts = 0;
        const maxAttempts = 50;
        
        const checkForModules = () => {
            moduleCheckAttempts++;
            
            if (window.SidekickCore && window.SidekickUI) {
                console.log("✅ @require modules loaded successfully");
                waitForModulesToLoad();
                return;
            }
            
            if (moduleCheckAttempts >= maxAttempts) {
                console.log("⚠️ @require modules failed to load, creating manual sidebar");
                createTampermonkeySidebar();
                setupTampermonkeyFeatures();
                return;
            }
            
            setTimeout(checkForModules, 200);
        };
        
        checkForModules();
    }
    
    // Start the override sequence
    executeOverrideSequence();

    // Export SidekickModules to window.top for global access
    window.top.SidekickModules = window.SidekickModules;
})();