// ==UserScript==
// @name         Sidekick Modular - Central Controller
// @namespace    http://tampermonkey.net/
// @version      6.0.0
// @description  Central controller for Sidekick - Disables inline conflicts and manages modular architecture
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/core.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/ui.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/content.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/settings.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/clock.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/notepad.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/blocktraining.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/global-functions.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/attacklist.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/linkgroup.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/travel-blocker.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/traveltracker.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/timer.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/randomtarget.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/plane-replacer.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/autogym.module.js?v=6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@089126e/src/modules/todolist.module.js?v=6
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log("🚀 SIDEKICK CENTRAL CONTROLLER v6.0.0 - STARTING");
    console.log("🎯 Mission: Disable inline conflicts and establish modular control");

    // ========== PHASE 1: CONFLICT DETECTION & NEUTRALIZATION ==========
    
    // Step 1: Block inline Sidekick from initializing
    function blockInlineScript() {
        console.log("🛡️ Phase 1: Blocking inline Sidekick initialization...");
        
        // Create a flag to indicate Tampermonkey is in control
        window.TAMPERMONKEY_SIDEKICK_ACTIVE = true;
        
        // Override any existing SidekickModules to prevent conflicts
        if (window.SidekickModules) {
            console.log("⚠️ Found existing SidekickModules, backing up and clearing...");
            window.INLINE_SIDEKICK_BACKUP = window.SidekickModules;
            window.SidekickModules = undefined;
        }
        
        // Block common inline script initialization patterns
        const originalDefineProperty = Object.defineProperty;
        Object.defineProperty = function(obj, prop, descriptor) {
            // Block inline scripts from setting SidekickModules
            if (prop === 'SidekickModules' && obj === window && !window.TAMPERMONKEY_SIDEKICK_ACTIVE) {
                console.log("🚫 Blocked inline script from setting SidekickModules");
                return obj;
            }
            return originalDefineProperty.call(this, obj, prop, descriptor);
        };
        
        console.log("✅ Inline script blocking measures activated");
    }
    
    // Step 2: Clean up any existing sidebars from conflicts
    function cleanupConflictingSidebars() {
        console.log("🧹 Phase 2: Cleaning up conflicting sidebars...");
        
        // Remove any existing Sidekick sidebars
        const existingSidebars = document.querySelectorAll('[id*="sidekick"], [class*="sidekick"], [id*="Sidekick"]');
        let removedCount = 0;
        
        existingSidebars.forEach(element => {
            element.remove();
            removedCount++;
        });
        
        if (removedCount > 0) {
            console.log(`🗑️ Removed ${removedCount} conflicting sidebar elements`);
        }
        
        console.log("✅ Conflict cleanup complete");
    }
    
    // ========== PHASE 2: MODULE COORDINATION SYSTEM ==========
    
    // Central module registry
    window.SidekickCentralRegistry = {
        modules: {},
        initialized: false,
        initQueue: [],
        
        registerModule: function(name, moduleObject) {
            console.log(`📦 Registering module: ${name}`);
            this.modules[name] = moduleObject;
            
            // If system is already initialized, init this module immediately
            if (this.initialized) {
                this.initializeModule(name);
            }
        },
        
        initializeModule: function(name) {
            const module = this.modules[name];
            if (module && typeof module.init === 'function') {
                try {
                    console.log(`🔌 Initializing ${name} module...`);
                    module.init();
                    console.log(`✅ ${name} module initialized successfully`);
                } catch (error) {
                    console.error(`❌ ${name} module failed to initialize:`, error);
                }
            }
        },
        
        initializeAllModules: function() {
            console.log("🎯 Initializing all registered modules...");
            
            // Initialize Core module first
            if (this.modules.Core) {
                this.initializeModule('Core');
            }
            
            // Initialize UI module second
            if (this.modules.UI) {
                this.initializeModule('UI');
            }
            
            // Initialize all other modules
            const moduleOrder = [
                'Settings', 'Content', 'Clock', 'Notepad', 'BlockTraining', 
                'GlobalFunctions', 'AttackList', 'LinkGroup', 'TravelBlocker', 
                'TravelTracker', 'Timer', 'RandomTarget', 'PlaneReplacer', 
                'AutoGym', 'TodoList'
            ];
            
            moduleOrder.forEach(name => {
                if (this.modules[name] && name !== 'Core' && name !== 'UI') {
                    this.initializeModule(name);
                }
            });
            
            this.initialized = true;
            console.log("✅ All modules initialized - Central Controller ready");
        }
    };
    
    // ========== PHASE 3: MODULE LOADING & COORDINATION ==========
    
    function waitForModulesAndInitialize() {
        console.log("⏳ Phase 3: Waiting for @require modules to load...");
        
        let checkAttempts = 0;
        const maxAttempts = 100;
        
        function checkModulesReady() {
            checkAttempts++;
            
            // Check if core modules are available
            const coreReady = window.SidekickCore || (window.SidekickModules && window.SidekickModules.Core);
            const uiReady = window.SidekickUI || (window.SidekickModules && window.SidekickModules.UI);
            
            if (coreReady && uiReady) {
                console.log("✅ Core modules detected, proceeding with initialization");
                
                // If modules are in window.SidekickModules, transfer them to our registry
                if (window.SidekickModules) {
                    Object.keys(window.SidekickModules).forEach(moduleName => {
                        window.SidekickCentralRegistry.registerModule(moduleName, window.SidekickModules[moduleName]);
                    });
                }
                
                // If modules are in separate variables, register them
                if (window.SidekickCore) {
                    window.SidekickCentralRegistry.registerModule('Core', window.SidekickCore);
                }
                if (window.SidekickUI) {
                    window.SidekickCentralRegistry.registerModule('UI', window.SidekickUI);
                }
                
                // Initialize the system
                setTimeout(() => {
                    window.SidekickCentralRegistry.initializeAllModules();
                    setupPeriodicTasks();
                }, 500);
                
                return;
            }
            
            if (checkAttempts >= maxAttempts) {
                console.error("❌ Modules failed to load after maximum attempts");
                createEmergencyFallbackSidebar();
                return;
            }
            
            setTimeout(checkModulesReady, 200);
        }
        
        checkModulesReady();
    }
    
    // ========== PHASE 4: EMERGENCY FALLBACK SYSTEM ==========
    
    function createEmergencyFallbackSidebar() {
        console.log("🚨 Creating emergency fallback sidebar...");
        
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
                box-shadow: 0 15px 35px rgba(0,0,0,0.7);
                cursor: move;
            " class="sidekick-draggable">
                <div style="
                    background: rgba(255,255,255,0.1);
                    padding: 15px;
                    border-radius: 13px 13px 0 0;
                    text-align: center;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                ">
                    <h2 style="margin: 0; font-size: 18px;">🚀 Sidekick v6.0.0</h2>
                    <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.8;">Emergency Fallback Mode</p>
                </div>
                
                <div style="padding: 20px;">
                    <!-- AutoGym Toggle -->
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                            <span style="font-weight: bold;">🏋️ AutoGym</span>
                            <label style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                <input type="checkbox" id="autogym-toggle" style="opacity: 0; width: 0; height: 0;">
                                <span id="autogym-slider" style="
                                    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                                    background: #ccc; transition: .4s; border-radius: 24px;
                                ">
                                    <span id="autogym-button" style="
                                        position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px;
                                        background-color: white; transition: .4s; border-radius: 50%;
                                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                                    "></span>
                                </span>
                            </label>
                        </div>
                        <div style="font-size: 12px; opacity: 0.8;">
                            Status: <span id="autogym-status">Loading...</span>
                        </div>
                    </div>
                    
                    <!-- Quick Notes -->
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">📝 Quick Notes</div>
                        <textarea id="quick-notes" placeholder="Enter your notes here..." style="
                            width: 100%; height: 80px; background: rgba(255,255,255,0.1); 
                            border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; 
                            color: white; padding: 8px; resize: vertical; font-family: inherit;
                        "></textarea>
                    </div>
                    
                    <!-- Status Info -->
                    <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 10px; font-size: 12px; opacity: 0.8;">
                        <div>🚨 Emergency Mode Active</div>
                        <div>🔧 Central Controller: v6.0.0</div>
                        <div>📊 State Persistence: GM_setValue</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(sidebar);
        setupEmergencyFeatures();
        console.log("✅ Emergency fallback sidebar created");
    }
    
    function setupEmergencyFeatures() {
        // AutoGym Toggle
        const toggle = document.getElementById('autogym-toggle');
        const status = document.getElementById('autogym-status');
        const slider = document.getElementById('autogym-slider');
        const button = document.getElementById('autogym-button');
        
        if (toggle && status && slider && button) {
            const isEnabled = GM_getValue('autoGymEnabled', false);
            toggle.checked = isEnabled;
            status.textContent = isEnabled ? 'Enabled' : 'Disabled';
            slider.style.background = isEnabled ? '#4CAF50' : '#ccc';
            button.style.left = isEnabled ? '28px' : '3px';
            
            toggle.addEventListener('change', function() {
                const enabled = this.checked;
                GM_setValue('autoGymEnabled', enabled);
                status.textContent = enabled ? 'Enabled' : 'Disabled';
                slider.style.background = enabled ? '#4CAF50' : '#ccc';
                button.style.left = enabled ? '28px' : '3px';
                console.log('🏋️ AutoGym state saved:', enabled);
            });
        }
        
        // Quick Notes
        const notes = document.getElementById('quick-notes');
        if (notes) {
            notes.value = GM_getValue('quickNotes', '');
            notes.addEventListener('input', function() {
                GM_setValue('quickNotes', this.value);
            });
        }
        
        // Make draggable
        const draggable = document.querySelector('.sidekick-draggable');
        if (draggable) {
            let isDragging = false;
            let startX, startY, startLeft, startTop;
            
            draggable.addEventListener('mousedown', function(e) {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                startLeft = parseInt(getComputedStyle(draggable).right, 10);
                startTop = parseInt(getComputedStyle(draggable).top, 10);
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
                e.preventDefault();
            });
            
            function handleMouseMove(e) {
                if (!isDragging) return;
                draggable.style.right = (startLeft + startX - e.clientX) + 'px';
                draggable.style.top = (startTop + e.clientY - startY) + 'px';
            }
            
            function handleMouseUp() {
                isDragging = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            }
        }
    }
    
    // ========== PHASE 5: PERIODIC MAINTENANCE ==========
    
    function setupPeriodicTasks() {
        console.log("⚙️ Setting up periodic maintenance tasks...");
        
        // Notepad fixes
        setInterval(() => {
            if (window.SidekickCentralRegistry.modules.Notepad?.forceFixNotepads) {
                window.SidekickCentralRegistry.modules.Notepad.forceFixNotepads();
            }
        }, 3000);
        
        // Conflict detection
        setInterval(() => {
            // Check for conflicting sidebars
            const conflictingSidebars = document.querySelectorAll('[id*="sidekick"]:not(#sidekick-sidebar)');
            if (conflictingSidebars.length > 0) {
                console.log("🚫 Detected conflicting sidebars, removing...");
                conflictingSidebars.forEach(sidebar => sidebar.remove());
            }
        }, 5000);
        
        console.log("✅ Periodic tasks configured");
    }
    
    // ========== MAIN EXECUTION SEQUENCE ==========
    
    function initializeCentralController() {
        console.log("🎯 Initializing Sidekick Central Controller...");
        
        // Execute phases in sequence
        blockInlineScript();
        
        // Wait for DOM to be ready for cleanup
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                cleanupConflictingSidebars();
                waitForModulesAndInitialize();
            });
        } else {
            cleanupConflictingSidebars();
            waitForModulesAndInitialize();
        }
        
        // Fallback timeout
        setTimeout(() => {
            if (!document.getElementById('sidekick-sidebar')) {
                console.log("⚠️ No sidebar detected after timeout, creating emergency fallback");
                createEmergencyFallbackSidebar();
            }
        }, 15000);
    }
    
    // Start the central controller
    initializeCentralController();
    
    // Global exports for compatibility
    window.SidekickModules = window.SidekickCentralRegistry.modules;
    window.forceFixNotepads = function() {
        if (window.SidekickCentralRegistry.modules.Notepad?.forceFixNotepads) {
            window.SidekickCentralRegistry.modules.Notepad.forceFixNotepads();
        }
    };
    
    console.log("🚀 Sidekick Central Controller v6.0.0 - Initialization Complete");
    
})();
