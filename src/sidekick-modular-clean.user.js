// ==UserScript==
// @name         Sidekick Modular CDN - Final Version
// @namespace    http://tampermonkey.net/
// @version      6.9.17
// @description  Plane direction now detected from filename - more reliable
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @downloadURL  https://raw.githubusercontent.com/Machiacelli/Sidekick-v.2/d2a0083/src/sidekick-modular-clean.user.js?v=20251101-11
// @updateURL    https://raw.githubusercontent.com/Machiacelli/Sidekick-v.2/d2a0083/src/sidekick-modular-clean.user.js?v=20251101-11
// @connect      api.lzpt.io
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@8247910/src/modules/core.module.js?v=20251101-5
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@8247910/src/modules/ui.module.js?v=20251101-5
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@ea0778e/src/modules/settings.module.js?v=20251101-6
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@86a0f5e/src/modules/content.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3781930/src/modules/global-functions.module.js?v=20251029
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@86a0f5e/src/modules/notepad.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@86a0f5e/src/modules/linkgroup.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@86a0f5e/src/modules/attacklist.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@86a0f5e/src/modules/timer.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3781930/src/modules/clock.module.js?v=20251029
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3781930/src/modules/randomtarget.module.js?v=20251029
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@affc546/src/modules/chain-timer.module.js?v=20250129
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3781930/src/modules/blocktraining.module.js?v=20251029
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3781930/src/modules/travel-blocker.module.js?v=20251029  
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@dddd58d/src/modules/plane-replacer.module.js?v=20251106-5
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@05edd8b/src/modules/traveltracker.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@1b0f5a9/src/modules/stockticker.module.js?v=20251106-1
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@78a5175/src/modules/timeontab.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@552a4bb/src/modules/npc-attack-timer.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@9385acc/src/modules/xanax-viewer.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@86a0f5e/src/modules/todolist.module.js?v=20251030
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@25fc2c5/src/modules/event-ticker.module.js?v=20251106-3
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@8247910/src/modules/attack-button-mover.module.js?v=20251101-5
// ==/UserScript==

(function() {
    'use strict';

    console.log('🚀 Sidekick Modular CDN v6.9.17 - Filename-Based Plane Detection!');
    console.log('✈️ FIXED: Plane direction now detected from image filename (from/to)');
    console.log('✈️ IMPROVED: More reliable than text-based detection - checks actual file path');
    console.log('🔍 PRIORITY: Filename detection first, then falls back to text/URL detection');
    console.log('✅ FIXED: Event Ticker now scrolls smoothly without vanishing - continuous loop animation');
    console.log('✅ FIXED: Removed animation sync - ticker now always starts fresh on page load');
    console.log('✅ IMPROVED: Ticker scrolls all the way to the left edge near Sidekick logo');
    console.log('✅ FIXED: Event Ticker now visible - removed conflicting padding that hid the ticker');
    console.log('✅ FIXED: Event Ticker API errors - Birthday and calendar now load correctly');
    console.log('✅ FIXED: Stock Ticker resize loop - Panel no longer grows out of control');
    console.log('⏰ FEATURE: Added personal event END time - filters out events that ended for you');
    console.log('🎃 FIXED: Events like Halloween won\'t show after YOUR personal event period ends');
    console.log('⏰ FEATURE: Event ticker now uses YOUR personal competition start time');
    console.log('📍 IMPROVED: Increased left padding for better visual balance');
    console.log('⏰ FEATURE: Live countdown to next Torn event with API integration');
    console.log('🔄 FEATURE: Ticker animation synced across all tabs');
    console.log('⚡ RENAMED: "Attack Button Mover" → "Fast Attack" for cleaner UI');
    console.log('📍 IMPROVED: Event ticker now directly adjacent to logo (no gap)');
    console.log('⚔️ FEATURE: Fast Attack - Positions "Start Fight" over your weapon for faster attacks');
    console.log('🎪 IMPROVED: Event ticker seamlessly integrated into top bar between logo and clock');
    console.log('👆 Add button fades in on hover and stays on top of all panels');
    console.log('🎂 Birthday celebration shows your Torn account anniversary');
    console.log('🎪 Event Ticker: Shows live events, upcoming events, and your Torn birthday');
    console.log('🎨 Event Ticker: Horizontal scrolling ticker animation');
    console.log('✨ FEATURES: Smart date handling with leap years and year boundaries');
    console.log('🔄 AUTO-ROTATE: Cycles through multiple active events every 8 seconds');
    console.log('💰 FIXED: P/L now uses actual totalInvested, not estimated value');
    console.log('✅ FIXED: Correct profit/loss after selling shares (FIFO adjusted)');
    console.log('✅ FIXED: New stock purchases no longer create "stock_17" format');
    console.log('✅ Xanax Viewer v1.0.0 - View Xanax usage on faction/profile pages with dedicated settings tab');
    console.log('✅ NPC Attack Timer - Shows Loot Rangers attack times in news ticker');
    console.log('✅ Travel Tracker v3.3.3 - No more "cancelled" notification when minimizing sidebar');
    console.log('✅ Time on Tab URL matching - works on travel/hospital/raceway/faction pages');
    console.log('📝 Stock Ticker: Fixed stock IDs, UI cleanup, enhanced debugging');
    console.log('🔍 Script identity: Sidekick-Modular-CDN-Final-Version');
    console.log('📍 Running from:', window.location.href);

    // CDN Diagnostics System
    const CdnDiagnostics = {
        cdnBase: 'https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@3781930/src/modules/',
        moduleTests: [
            'core.module.js',
            'ui.module.js', 
            'settings.module.js',
            'content.module.js',
            'global-functions.module.js',
            'todolist.module.js'
        ],

        async testCdnAccess() {
            console.log('🔍 Testing CDN module accessibility...');
            const results = {};
            
            for (const module of this.moduleTests) {
                try {
                    const url = this.cdnBase + module;
                    const response = await fetch(url, { method: 'HEAD' });
                    results[module] = {
                        accessible: response.ok,
                        status: response.status,
                        url: url
                    };
                    
                    if (response.ok) {
                        console.log(`✅ ${module}: CDN accessible (${response.status})`);
                    } else {
                        console.error(`❌ ${module}: CDN failed (${response.status})`);
                    }
                } catch (error) {
                    results[module] = {
                        accessible: false,
                        error: error.message,
                        url: this.cdnBase + module
                    };
                    console.error(`❌ ${module}: CDN error -`, error.message);
                }
            }
            
            return results;
        },

        async diagnoseLoadingIssues() {
            console.log('🏥 Diagnosing module loading issues...');
            
            // Check if core modules loaded
            const coreLoaded = window.SidekickModules?.Core;
            const uiLoaded = window.SidekickModules?.UI;
            const settingsLoaded = window.SidekickModules?.Settings;
            const todoListLoaded = window.SidekickModules?.TodoList;
            
            console.log('📋 Module Loading Status:');
            console.log(`  Core Module: ${coreLoaded ? '✅ Loaded' : '❌ Missing'}`);
            console.log(`  UI Module: ${uiLoaded ? '✅ Loaded' : '❌ Missing'}`);
            console.log(`  Settings Module: ${settingsLoaded ? '✅ Loaded' : '❌ Missing'}`);
            console.log(`  TodoList Module: ${todoListLoaded ? '✅ Loaded' : '❌ Missing'}`);
            
            if (!coreLoaded || !uiLoaded || !settingsLoaded) {
                console.error('❌ Critical modules missing - checking CDN accessibility...');
                const cdnResults = await this.testCdnAccess();
                
                // Show user-friendly error if CDN is down
                if (Object.values(cdnResults).some(result => !result.accessible)) {
                    this.showCdnError(cdnResults);
                    return false;
                }
            }
            
            return true;
        },

        showCdnError(cdnResults) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #d32f2f, #f44336);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 999999;
                max-width: 400px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                line-height: 1.4;
                border: 1px solid #f44336;
            `;
            
            const failedModules = Object.entries(cdnResults)
                .filter(([_, result]) => !result.accessible)
                .map(([module, _]) => module);
            
            errorDiv.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
                    <strong style="font-size: 16px;">Sidekick Loading Error</strong>
                </div>
                <p style="margin: 0 0 12px 0;">
                    Unable to load modules from CDN. Failed modules:
                </p>
                <ul style="margin: 0 0 12px 20px; padding: 0;">
                    ${failedModules.map(module => `<li>${module}</li>`).join('')}
                </ul>
                <p style="margin: 0; font-size: 12px; opacity: 0.9;">
                    This may be a temporary CDN issue. Try refreshing the page.
                </p>
                <button onclick="this.parentElement.remove()" style="
                    position: absolute;
                    top: 8px;
                    right: 12px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 4px;
                    line-height: 1;
                ">×</button>
            `;
            
            document.body.appendChild(errorDiv);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 10000);
        }
    };

    // Main initialization with enhanced error handling
    async function initializeSidekick() {
        try {
            console.log('⏳ CDN Launcher: Waiting for modules to load...');
            console.log('🔍 CDN Launcher: Checking for Core and UI modules...');
            console.log('🔍 CDN Launcher: window.SidekickModules =', window.SidekickModules);
            console.log('🔍 CDN Launcher: Core available =', !!window.SidekickModules?.Core);
            console.log('🔍 CDN Launcher: UI available =', !!window.SidekickModules?.UI);
            console.log('🔍 CDN Launcher: Settings available =', !!window.SidekickModules?.Settings);
            console.log('🔍 CDN Launcher: TodoList available =', !!window.SidekickModules?.TodoList);
            
            // Wait for critical modules with timeout
            const timeout = 15000; // 15 seconds
            const startTime = Date.now();
            
            while (!window.SidekickModules?.Core?.STORAGE_KEYS || !window.SidekickModules?.UI?.init) {
                console.log('🔄 CDN Launcher: Still waiting... Core.STORAGE_KEYS:', !!window.SidekickModules?.Core?.STORAGE_KEYS, 'UI.init:', !!window.SidekickModules?.UI?.init);
                
                if (Date.now() - startTime > timeout) {
                    console.error('❌ Module loading timeout after 15 seconds');
                    console.log('🔍 Final state - window.SidekickModules:', window.SidekickModules);
                    if (window.SidekickModules?.Core) {
                        console.log('🔍 Core keys:', Object.keys(window.SidekickModules.Core));
                    }
                    if (window.SidekickModules?.UI) {
                        console.log('🔍 UI keys:', Object.keys(window.SidekickModules.UI));
                    }
                    await CdnDiagnostics.diagnoseLoadingIssues();
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log('✅ CDN Launcher: Core modules loaded successfully');
            console.log('📦 CDN Launcher: Available modules:', Object.keys(window.SidekickModules || {}));
            
            // Test CDN accessibility proactively
            const diagnosticsPassed = await CdnDiagnostics.diagnoseLoadingIssues();
            if (!diagnosticsPassed) {
                console.error('❌ CDN diagnostics failed - aborting initialization');
                return;
            }
            
            // Initialize UI first
            console.log('🎨 CDN Launcher: Initializing UI...');
            console.log('🔍 CDN Launcher: UI.init method:', typeof window.SidekickModules.UI.init);
            await window.SidekickModules.UI.init();
            console.log('✅ CDN Launcher: UI initialization completed');
            
            // Initialize content manager
            console.log('📄 CDN Launcher: Initializing content manager...');
            if (window.SidekickModules.Content?.init) {
                window.SidekickModules.Content.init();
            }
            
            // Initialize Random Target module explicitly
            console.log('🎯 CDN Launcher: Initializing Random Target...');
            if (window.SidekickModules.RandomTarget?.init) {
                console.log('🎯 RandomTarget found, initializing...');
                window.SidekickModules.RandomTarget.init();
            } else {
                console.warn('❌ RandomTarget module not found in SidekickModules');
                console.log('🔍 Available modules:', Object.keys(window.SidekickModules || {}));
            }
            
            // Initialize Chain Timer module
            console.log('⏱️ CDN Launcher: Initializing Chain Timer...');
            if (window.SidekickModules.ChainTimer?.init) {
                console.log('⏱️ ChainTimer found, initializing...');
                window.SidekickModules.ChainTimer.init();
            } else {
                console.warn('❌ ChainTimer module not found in SidekickModules');
                console.log('🔍 Available modules:', Object.keys(window.SidekickModules || {}));
            }
            
            // Auto-restore previously active modules by checking their panel states
            console.log('🔄 CDN Launcher: Checking for previously active modules...');
            
            // Check and restore Timer module
            if (window.SidekickModules.Timer?.init) {
                console.log('⏰ Initializing Timer module (checks for previously open panel)...');
                window.SidekickModules.Timer.init();
            }
            
            // Check and restore TodoList module (PROPER CDN VERSION)
            if (window.SidekickModules.TodoList?.init) {
                console.log('📋 Initializing TodoList module from CDN (v1.3.3 with all features)...');
                try {
                    window.SidekickModules.TodoList.init();
                    console.log('✅ CDN TodoList module initialized successfully');
                } catch (error) {
                    console.error('❌ TodoList init failed:', error);
                }
            } else {
                console.error('❌ TodoList module not loaded from CDN');
            }
            
            // Check and restore AttackList module  
            if (window.SidekickModules.AttackList?.init) {
                console.log('⚔️ Initializing AttackList module (checks for previously open panel)...');
                try {
                    window.SidekickModules.AttackList.init();
                } catch (error) {
                    console.error('❌ AttackList init failed:', error);
                }
            }
            
            // Check and restore LinkGroup module
            if (window.SidekickModules.LinkGroup?.init) {
                console.log('🔗 Initializing LinkGroup module (checks for previously open panel)...');
                try {
                    window.SidekickModules.LinkGroup.init();
                } catch (error) {
                    console.error('❌ LinkGroup init failed:', error);
                }
            }
            
            // Check and restore Stock Ticker module
            if (window.SidekickModules.StockTicker?.init) {
                console.log('📈 Initializing Stock Ticker module (checks for previously open panel)...');
                try {
                    window.SidekickModules.StockTicker.init();
                } catch (error) {
                    console.error('❌ Stock Ticker init failed:', error);
                }
            }
            
            // Initialize Travel Tracker module
            if (window.SidekickModules.TravelTracker?.init) {
                console.log('✈️ Initializing Travel Tracker module...');
                try {
                    window.SidekickModules.TravelTracker.init();
                    console.log('✅ Travel Tracker initialized successfully');
                } catch (error) {
                    console.error('❌ Travel Tracker init failed:', error);
                }
            }
            
            // Initialize Time on Tab module
            if (window.SidekickModules.TimeOnTab?.init) {
                console.log('⏰ Initializing Time on Tab module...');
                try {
                    window.SidekickModules.TimeOnTab.init();
                    console.log('✅ Time on Tab initialized successfully');
                } catch (error) {
                    console.error('❌ Time on Tab init failed:', error);
                }
            }
            
            // Initialize NPC Attack Timer module
            if (window.SidekickModules.NPCAttackTimer?.init) {
                console.log('⚔️ Initializing NPC Attack Timer module...');
                try {
                    window.SidekickModules.NPCAttackTimer.init();
                    console.log('✅ NPC Attack Timer initialized successfully');
                } catch (error) {
                    console.error('❌ NPC Attack Timer init failed:', error);
                }
            }
            
            // Initialize Xanax Viewer module
            if (window.SidekickModules.XanaxViewer?.init) {
                console.log('💊 Initializing Xanax Viewer module...');
                try {
                    window.SidekickModules.XanaxViewer.init();
                    console.log('✅ Xanax Viewer initialized successfully');
                } catch (error) {
                    console.error('❌ Xanax Viewer init failed:', error);
                }
            }
            
            // Initialize Event Ticker module
            if (window.SidekickModules.EventTicker?.init) {
                console.log('🎪 Initializing Event Ticker module...');
                try {
                    window.SidekickModules.EventTicker.init();
                    console.log('✅ Event Ticker initialized successfully');
                } catch (error) {
                    console.error('❌ Event Ticker init failed:', error);
                }
            }
            
            // Check and restore BlockTraining module (Training Blocker)
            if (window.SidekickModules.BlockTraining?.restoreTrainingBlocker) {
                console.log('🚫 Restoring Training Blocker if previously active...');
                try {
                    // Give the page more time to load gym elements
                    setTimeout(() => {
                        window.SidekickModules.BlockTraining.restoreTrainingBlocker();
                        console.log('✅ Training Blocker restoration attempted');
                    }, 2000);
                } catch (error) {
                    console.error('❌ Training Blocker restoration failed:', error);
                }
            }
            
            // Initialize Attack Button Mover module
            if (window.SidekickModules.AttackButtonMover?.init) {
                console.log('⚔️ Initializing Attack Button Mover module...');
                try {
                    window.SidekickModules.AttackButtonMover.init();
                    console.log('✅ Attack Button Mover initialized successfully');
                } catch (error) {
                    console.error('❌ Attack Button Mover init failed:', error);
                }
            }
            
            console.log('✅ CDN Launcher: Module initialization completed - previously active panels should be restored');
            
            console.log('🎉 Sidekick Enhanced v5.35.0 initialization complete - All major fixes implemented!');
            
        } catch (error) {
            console.error('❌ Sidekick initialization failed:', error);
            
            // Show user-friendly error
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #d32f2f;
                color: white;
                padding: 16px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 999999;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                max-width: 300px;
            `;
            errorDiv.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="margin-right: 8px;">❌</span>
                    <strong>Sidekick Error</strong>
                </div>
                <div style="font-size: 13px; opacity: 0.9;">
                    Failed to initialize. Check console for details.
                </div>
            `;
            document.body.appendChild(errorDiv);
            
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }

    // Enhanced startup sequence
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSidekick);
    } else {
        // DOM already ready, start immediately
        setTimeout(initializeSidekick, 100);
    }

})();
