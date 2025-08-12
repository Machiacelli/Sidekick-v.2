// ==UserScript==
// @name         Sidekick Modular - Full Featured Sidebar
// @namespace    http://tampermonkey.net/
// @version      4.2.0
// @description  Modular version of Sidekick - Enhanced Torn.com sidebar with notepads, todo lists, attack lists, cooldown timers, travel tracker, points monitor, clock, and debugging tools
// @author       GitHub Copilot
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@f99f08e/src/modules/core.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@f99f08e/src/modules/ui.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@f99f08e/src/modules/content.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@f99f08e/src/modules/settings.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@f99f08e/src/modules/clock.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@f99f08e/src/modules/notepad.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@f99f08e/src/modules/flight-tracker.module.js
// @require      https://cdn.jsdelivr.net/gh/Machiacelli/Sidekick-v.2@f99f08e/src/modules/global-functions.module.js
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log("🚀 SIDEKICK MODULAR STARTING - " + new Date().toLocaleTimeString());
    
    // FORCE OVERRIDE NOTEPAD SYSTEM - SIMPLIFIED AND FIXED
    window.forceFixNotepads = function() {
        console.log("🔧 Force fixing notepads...");
        
        // Find all notepad elements
        const notepads = document.querySelectorAll('[id*="notepad"], .sidebar-item, .simplified-notepad, .movable-notepad');
        
        notepads.forEach((notepad, index) => {
            if (notepad.querySelector('textarea')) {
                // Check if notepad is already properly formatted (has our header structure)
                if (notepad.querySelector('.notepad-header') && notepad.style.position === 'absolute') {
                    // Already fixed, skip rebuilding
                    return;
                }
                
                console.log("📝 Fixing notepad:", notepad.id);
                
                // Get saved layout or use defaults
                const notepadId = notepad.id.replace('notepad-', '') || index;
                const savedLayout = JSON.parse(localStorage.getItem(`notepad_${notepadId}_layout`) || '{}');
                const savedContent = localStorage.getItem(`notepad_${notepadId}_content`) || '';
                const savedColor = localStorage.getItem(`notepad_${notepadId}_color`) || '#333';
                
                // Get existing content if not saved
                const existingTextarea = notepad.querySelector('textarea');
                const content = savedContent || (existingTextarea ? existingTextarea.value : '');
                
                // COMPLETELY REBUILD with clean structure
                notepad.innerHTML = '';
                
                // Apply clean styles
                notepad.style.cssText = `
                    position: absolute !important;
                    left: ${savedLayout.x || (10 + index * 20)}px !important;
                    top: ${savedLayout.y || (10 + index * 20)}px !important;
                    width: ${savedLayout.width || 280}px !important;
                    height: ${savedLayout.height || 150}px !important;
                    background: #2a2a2a !important;
                    border: 1px solid #444 !important;
                    border-radius: 8px !important;
                    display: block !important;
                    min-width: 200px !important;
                    min-height: 100px !important;
                    max-width: 350px !important;
                    max-height: 400px !important;
                    z-index: ${1000 + index} !important;
                    resize: both !important;
                    overflow: hidden !important;
                    box-sizing: border-box !important;
                `;
                
                // Create header with saved color
                const header = document.createElement('div');
                header.className = 'notepad-header';
                header.style.cssText = `
                    background: ${savedColor} !important;
                    border-bottom: 1px solid #555 !important;
                    padding: 4px 8px !important;
                    display: flex !important;
                    justify-content: space-between !important;
                    align-items: center !important;
                    cursor: move !important;
                    height: 20px !important;
                    user-select: none !important;
                    border-radius: 7px 7px 0 0 !important;
                    box-sizing: border-box !important;
                `;
                
                // Create dropdown container
                const dropdownContainer = document.createElement('div');
                dropdownContainer.style.cssText = `
                    position: relative !important;
                    display: flex !important;
                    align-items: center !important;
                `;
                
                const dropdownArrow = document.createElement('span');
                dropdownArrow.innerHTML = '▼';
                dropdownArrow.style.cssText = `
                    color: #bbb !important;
                    font-size: 10px !important;
                    cursor: pointer !important;
                    user-select: none !important;
                `;
                
                const dropdownMenu = document.createElement('div');
                dropdownMenu.style.cssText = `
                    position: absolute !important;
                    top: 18px !important;
                    left: 0 !important;
                    background: #333 !important;
                    border: 1px solid #555 !important;
                    border-radius: 4px !important;
                    min-width: 120px !important;
                    display: none !important;
                    z-index: 9999 !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
                `;
                
                const pinOption = document.createElement('div');
                pinOption.innerHTML = '📌 Pin';
                pinOption.style.cssText = `
                    padding: 6px 10px !important;
                    color: #fff !important;
                    cursor: pointer !important;
                    font-size: 11px !important;
                    border-bottom: 1px solid #555 !important;
                `;
                
                const colorOption = document.createElement('div');
                colorOption.innerHTML = '🎨 Color';
                colorOption.style.cssText = `
                    padding: 6px 10px !important;
                    color: #fff !important;
                    cursor: pointer !important;
                    font-size: 11px !important;
                `;
                
                dropdownMenu.appendChild(pinOption);
                dropdownMenu.appendChild(colorOption);
                dropdownContainer.appendChild(dropdownArrow);
                dropdownContainer.appendChild(dropdownMenu);
                
                // Create close button
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '×';
                closeBtn.style.cssText = `
                    background: none !important;
                    border: none !important;
                    color: #f44336 !important;
                    cursor: pointer !important;
                    font-size: 14px !important;
                    font-weight: bold !important;
                    padding: 0 !important;
                    width: 16px !important;
                    height: 16px !important;
                `;
                
                header.appendChild(dropdownContainer);
                header.appendChild(closeBtn);
                
                // Create textarea
                const textarea = document.createElement('textarea');
                textarea.placeholder = 'Write your notes here...';
                textarea.value = content;
                textarea.style.cssText = `
                    width: 100% !important;
                    height: calc(100% - 28px) !important;
                    background: transparent !important;
                    border: none !important;
                    color: #fff !important;
                    padding: 8px !important;
                    font-size: 13px !important;
                    font-family: inherit !important;
                    resize: none !important;
                    outline: none !important;
                    line-height: 1.4 !important;
                    box-sizing: border-box !important;
                    margin: 0 !important;
                    border-radius: 0 0 7px 7px !important;
                `;
                
                // Assemble notepad
                notepad.appendChild(header);
                notepad.appendChild(textarea);
                
                // FUNCTIONALITY - Dragging with fixed offset
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };
                
                header.addEventListener('mousedown', (e) => {
                    if (e.target === dropdownArrow || e.target === closeBtn || dropdownMenu.contains(e.target)) {
                        return;
                    }
                    
                    isDragging = true;
                    // Fix the drag offset calculation - use notepad position, not header
                    const notepadRect = notepad.getBoundingClientRect();
                    const sidebarRect = document.getElementById('sidekick-sidebar').getBoundingClientRect();
                    dragOffset.x = e.clientX - notepadRect.left;
                    dragOffset.y = e.clientY - notepadRect.top;
                    notepad.style.zIndex = '2000';
                    e.preventDefault();
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    if (!sidebar) return;
                    
                    const sidebarRect = sidebar.getBoundingClientRect();
                    // Use header-relative positioning for smooth dragging
                    let newX = e.clientX - sidebarRect.left - dragOffset.x;
                    let newY = e.clientY - sidebarRect.top - dragOffset.y;
                    
                    // Keep within bounds
                    const padding = 5;
                    const maxX = sidebar.offsetWidth - notepad.offsetWidth - padding;
                    const maxY = sidebar.offsetHeight - notepad.offsetHeight - padding;
                    
                    newX = Math.max(padding, Math.min(newX, maxX));
                    newY = Math.max(padding, Math.min(newY, maxY));
                    
                    notepad.style.left = newX + 'px';
                    notepad.style.top = newY + 'px';
                });
                
                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        notepad.style.zIndex = (1000 + index).toString();
                        
                        // Save position and size
                        const layout = {
                            x: parseInt(notepad.style.left),
                            y: parseInt(notepad.style.top),
                            width: notepad.offsetWidth,
                            height: notepad.offsetHeight
                        };
                        localStorage.setItem(`notepad_${notepadId}_layout`, JSON.stringify(layout));
                    }
                });
                
                // Close button
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this notepad?')) {
                        notepad.remove();
                        localStorage.removeItem(`notepad_${notepadId}_layout`);
                        localStorage.removeItem(`notepad_${notepadId}_content`);
                        localStorage.removeItem(`notepad_${notepadId}_color`);
                    }
                });
                
                // Dropdown functionality
                dropdownArrow.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = dropdownMenu.style.display === 'block';
                    dropdownMenu.style.display = isVisible ? 'none' : 'block';
                });
                
                // Close dropdown when clicking outside (but not on color picker)
                document.addEventListener('click', (e) => {
                    if (!notepad.contains(e.target) && !e.target.closest('.color-picker')) {
                        dropdownMenu.style.display = 'none';
                    }
                });
                
                // Pin functionality
                let isPinned = savedLayout.pinned || false;
                pinOption.innerHTML = isPinned ? '📍 Unpin' : '📌 Pin';
                if (isPinned) {
                    notepad.style.resize = 'none';
                    header.style.cursor = 'default';
                } else {
                    notepad.style.resize = 'both';
                    header.style.cursor = 'move';
                }
                
                pinOption.addEventListener('click', () => {
                    isPinned = !isPinned;
                    pinOption.innerHTML = isPinned ? '📍 Unpin' : '📌 Pin';
                    dropdownMenu.style.display = 'none';
                    
                    if (isPinned) {
                        notepad.style.resize = 'none';
                        header.style.cursor = 'default';
                    } else {
                        notepad.style.resize = 'both';
                        header.style.cursor = 'move';
                    }
                    
                    // Save pin state
                    const layout = JSON.parse(localStorage.getItem(`notepad_${notepadId}_layout`) || '{}');
                    layout.pinned = isPinned;
                    localStorage.setItem(`notepad_${notepadId}_layout`, JSON.stringify(layout));
                });
                
                // Color functionality
                colorOption.addEventListener('click', () => {
                    dropdownMenu.style.display = 'none';
                    
                    // Create color picker popup
                    const colorPicker = document.createElement('div');
                    colorPicker.className = 'color-picker';
                    colorPicker.style.cssText = `
                        position: absolute !important;
                        top: 25px !important;
                        left: 0 !important;
                        background: #333 !important;
                        border: 1px solid #555 !important;
                        border-radius: 4px !important;
                        padding: 8px !important;
                        display: grid !important;
                        grid-template-columns: repeat(4, 20px) !important;
                        gap: 4px !important;
                        z-index: 9999 !important;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
                    `;
                    
                    const colors = ['#333', '#4CAF50', '#2196F3', '#FF9800', '#f44336', '#9C27B0', '#607D8B', '#795548'];
                    
                    colors.forEach(color => {
                        const colorBtn = document.createElement('div');
                        colorBtn.style.cssText = `
                            width: 20px !important;
                            height: 20px !important;
                            background: ${color} !important;
                            border: 1px solid #666 !important;
                            border-radius: 3px !important;
                            cursor: pointer !important;
                        `;
                        
                        if (color === savedColor) {
                            colorBtn.style.border = '2px solid #fff !important';
                        }
                        
                        colorBtn.addEventListener('click', () => {
                            header.style.background = color + ' !important';
                            localStorage.setItem(`notepad_${notepadId}_color`, color);
                            colorPicker.remove();
                            
                            // Force rebuild this specific notepad to apply the new color properly
                            setTimeout(() => {
                                // Temporarily remove the notepad-header class to force rebuild
                                header.classList.remove('notepad-header');
                                window.forceFixNotepads();
                            }, 100);
                        });
                        
                        colorPicker.appendChild(colorBtn);
                    });
                    
                    dropdownContainer.appendChild(colorPicker);
                    
                    // Remove color picker when clicking outside
                    setTimeout(() => {
                        document.addEventListener('click', function removeColorPicker(e) {
                            if (!colorPicker.contains(e.target)) {
                                colorPicker.remove();
                                document.removeEventListener('click', removeColorPicker);
                            }
                        });
                    }, 100);
                });
                
                // Hover effects for dropdown items
                [pinOption, colorOption].forEach(item => {
                    item.addEventListener('mouseenter', () => item.style.background = '#444');
                    item.addEventListener('mouseleave', () => item.style.background = 'transparent');
                });
                
                // Save content on changes
                textarea.addEventListener('input', () => {
                    localStorage.setItem(`notepad_${notepadId}_content`, textarea.value);
                });
                
                // Save size changes on resize
                const resizeObserver = new ResizeObserver(() => {
                    const layout = {
                        x: parseInt(notepad.style.left),
                        y: parseInt(notepad.style.top),
                        width: notepad.offsetWidth,
                        height: notepad.offsetHeight,
                        pinned: isPinned
                    };
                    localStorage.setItem(`notepad_${notepadId}_layout`, JSON.stringify(layout));
                });
                resizeObserver.observe(notepad);
                
                console.log("✅ Notepad rebuilt successfully:", notepadId);
            }
        });
    };
    
    // Function to create new notepads
    window.createNewNotepad = function(content = '') {
        const sidebar = document.getElementById('sidekick-sidebar');
        const contentArea = document.getElementById('sidekick-content');
        if (!sidebar || !contentArea) return;
        
        const notepadId = Date.now() + Math.random();
        const notepad = document.createElement('div');
        notepad.id = `notepad-${notepadId}`;
        notepad.className = 'sidebar-item movable-notepad';
        
        // Add basic textarea
        notepad.innerHTML = `<textarea>${content}</textarea>`;
        contentArea.appendChild(notepad);
        
        // Force fix this notepad
        setTimeout(() => {
            window.forceFixNotepads();
        }, 100);
    };
    
    // Debug function to see what's happening
    window.debugNotepads = function() {
        console.log("🔍 DEBUGGING NOTEPADS:");
        const allElements = document.querySelectorAll('[id*="notepad"], .sidebar-item, .simplified-notepad, .movable-notepad');
        allElements.forEach((el, i) => {
            console.log(`Element ${i}:`, {
                id: el.id,
                className: el.className,
                hasTextarea: !!el.querySelector('textarea'),
                innerHTML: el.innerHTML.substring(0, 100) + '...'
            });
        });
    };
    
    // Test function to create a notepad for testing
    window.testCreateNotepad = function() {
        console.log("🧪 Creating test notepad...");
        window.createNewNotepad("This is a test notepad!\n\nYou should be able to:\n✅ Type in this area\n✅ Drag the window by the header\n✅ Resize the window\n✅ Use the dropdown menu\n✅ Close with the × button");
    };
    
    // Auto-fix notepads every 1 second for better persistence
    setInterval(() => {
        if (document.getElementById('sidekick-sidebar')) {
            window.forceFixNotepads();
        }
    }, 1000);
    
    // Also run forceFixNotepads on page navigation events
    let lastUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            console.log('🔄 Page navigation detected, fixing notepads...');
            setTimeout(() => {
                if (window.forceFixNotepads) {
                    window.forceFixNotepads();
                }
            }, 500);
        }
    }, 500);
    
    // Test basic functionality
    console.log('🧪 Testing modular system...');
    console.log('✅ JavaScript is working');
    
    // Test if we can access the page
    console.log('🌐 Page URL:', window.location.href);
    console.log('📄 Document ready state:', document.readyState);

    // Inject critical CSS immediately for maximum visibility
    GM_addStyle(`
        /* SPECIFIC SIDEBAR FIXES ONLY - DON'T AFFECT TORN ELEMENTS */
        #sidekick-sidebar .sidekick-topbar,
        #sidekick-sidebar .sidekick-page-navigation, 
        #sidekick-sidebar .sidekick-bottom-bar {
            border-bottom: none !important;
            border-top: none !important;
        }
        
        /* REMOVE BOTTOM BORDER FROM SIDEBAR ONLY */
        #sidekick-sidebar::after, #sidekick-sidebar::before,
        #sidekick-sidebar > *:last-child, 
        #sidekick-sidebar .sidekick-page-dots, 
        #sidekick-sidebar .sidekick-page-navigation {
            border: none !important;
            border-bottom: none !important;
            border-top: none !important;
            box-shadow: none !important;
        }
        
        /* FORCE BOUNDARY CONSTRAINTS */
        #sidekick-content {
            position: relative !important;
            overflow: hidden !important;
        }

        /* COMPACT HAMBURGER BUTTON */
        #sidekick-hamburger {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            z-index: 2147483647 !important;
            background: linear-gradient(135deg, #262626, #5e5c5cff) !important;
            color: white !important;
            border: 1px solid rgba(255,255,255,0.6) !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 16px !important;
            font-weight: bold !important;
            text-align: center !important;
            line-height: 30px !important;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5) !important;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            pointer-events: auto !important;
            outline: none !important;
            user-select: none !important;
        }

        #sidekick-hamburger:hover {
            transform: scale(1.15) !important;
            box-shadow: 0 4px 16px #000000ff !important;
            background: linear-gradient(135deg, #66BB6A, #ffad5a) !important;
        }

        #sidekick-hamburger:active {
            transform: scale(0.9) !important;
        }

        /* SIDEBAR STYLES */
        #sidekick-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 380px !important;
            height: 100vh !important;
            background: linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 100%) !important;
            border-right: 2px solid #444 !important;
            z-index: 999999 !important;
            overflow: hidden !important;
            transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
            box-shadow: 4px 0 20px rgba(0,0,0,0.3) !important;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
            display: flex !important;
            flex-direction: column !important;
        }

        #sidekick-sidebar.hidden {
            transform: translateX(-100%) !important;
        }

        /* ADD COMPONENT BUTTON IN BOTTOM BAR */
        .sidekick-add-component-btn {
            width: 24px !important;
            height: 24px !important;
            border-radius: 6px !important;
            background: linear-gradient(135deg, #262626, #5e5c5cff) !important;
            border: 1px solid rgba(255, 255, 255, 0.6) !important;
            color: white !important;
            font-size: 14px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            opacity: 1 !important;
            margin-right: 8px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
            user-select: none !important;
            outline: none !important;
        }

        .sidekick-add-component-btn:hover {
            transform: scale(1.15) !important;
            background: linear-gradient(135deg, #66BB6A, #ffad5a) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6) !important;
        }

        .sidekick-add-component-btn:active {
            transform: scale(0.9) !important;
        }

        /* PANEL STYLES */
        .sidekick-panel {
            position: absolute !important;
            background: linear-gradient(145deg, #2a2a2a, #1f1f1f) !important;
            border: 1px solid #444 !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
            color: #fff !important;
            font-family: 'Segoe UI', sans-serif !important;
            min-width: 250px !important;
            max-width: 400px !important;
            backdrop-filter: blur(10px) !important;
            z-index: 999990 !important;
        }

        .sidekick-panel-header {
            background: linear-gradient(135deg, #333, #444) !important;
            padding: 12px 16px !important;
            border-radius: 12px 12px 0 0 !important;
            border-bottom: 1px solid #555 !important;
            cursor: move !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            font-weight: 600 !important;
            font-size: 14px !important;
        }

        .sidekick-panel-content {
            padding: 16px !important;
            max-height: 400px !important;
            overflow-y: auto !important;
        }

        /* TOP BAR STYLES */
        .sidekick-topbar {
            background: linear-gradient(135deg, #333, #2a2a2a) !important;
            padding: 8px !important;
            border-bottom: 2px solid #444 !important;
            color: #fff !important;
            text-align: center !important;
            height: 50px !important;
        }

        /* SCROLLBAR STYLING */
        #sidekick-content::-webkit-scrollbar {
            width: 8px !important;
        }

        #sidekick-content::-webkit-scrollbar-track {
            background: #1a1a1a !important;
        }

        #sidekick-content::-webkit-scrollbar-thumb {
            background: #444 !important;
            border-radius: 4px !important;
        }

        #sidekick-content::-webkit-scrollbar-thumb:hover {
            background: #555 !important;
        }

        /* PAGE DOTS NAVIGATION */
        .sidekick-page-dots {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: 12px 16px !important;
            background: linear-gradient(180deg, transparent 0%, #1a1a1a 50%) !important;
            border-top: 1px solid #333 !important;
        }

        .sidekick-component-controls {
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
        }

        .sidekick-page-navigation {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 6px !important;
            flex: 1 !important;
        }

        .sidekick-page-dot {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            background: rgba(255, 255, 255, 0.3) !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            opacity: 0.4 !important;
            position: relative !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }

        .sidekick-page-dot.active {
            background: rgba(255, 255, 255, 0.8) !important;
            transform: scale(1.3) !important;
            opacity: 1 !important;
            border: 1px solid rgba(255, 255, 255, 0.6) !important;
        }

        .sidekick-page-dot:hover {
            background: rgba(255, 255, 255, 0.5) !important;
            opacity: 0.7 !important;
            transform: scale(1.1) !important;
            border: 1px solid rgba(255, 255, 255, 0.4) !important;
        }

        .sidekick-page-dot.removing {
            background: #f44336 !important;
            transform: scale(1.4) !important;
            opacity: 1 !important;
            animation: pulse-red 0.3s ease infinite alternate !important;
        }

        @keyframes pulse-red {
            from { background: #f44336; }
            to { background: #ff5722; }
        }

        .sidekick-add-page-btn {
            width: 16px !important;
            height: 16px !important;
            border-radius: 50% !important;
            background: rgba(255, 255, 255, 0.2) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            color: white !important;
            font-size: 10px !important;
            font-weight: bold !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            opacity: 0.5 !important;
            margin-left: 4px !important;
        }

        .sidekick-add-page-btn:hover {
            opacity: 1 !important;
            transform: scale(1.2) !important;
            background: rgba(255, 255, 255, 0.4) !important;
            border: 1px solid rgba(255, 255, 255, 0.5) !important;
            box-shadow: 0 2px 8px rgba(255, 255, 255, 0.2) !important;
        }

        /* BUTTON STYLES */
        .sidekick-btn {
            background: linear-gradient(135deg, #4CAF50, #45a049) !important;
            color: white !important;
            border: none !important;
            padding: 8px 16px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            transition: all 0.3s ease !important;
        }

        .sidekick-btn:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(76,175,80,0.4) !important;
        }

        /* NOTIFICATION STYLES */
        .sidekick-notification {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            background: linear-gradient(135deg, #4CAF50, #45a049) !important;
            color: white !important;
            padding: 12px 20px !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
            z-index: 9999999 !important;
            animation: slideInRight 0.3s ease !important;
            max-width: 300px !important;
            font-family: 'Segoe UI', sans-serif !important;
        }

        .sidekick-notification.error {
            background: linear-gradient(135deg, #f44336, #d32f2f) !important;
        }

        .sidekick-notification.warning {
            background: linear-gradient(135deg, #ff9800, #f57c00) !important;
        }

        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }

        /* SIDEBAR ITEMS STYLES */
        .sidebar-item {
            background: #2a2a2a !important;
            border: 1px solid #444 !important;
            border-radius: 8px !important;
            padding: 12px !important;
            margin-bottom: 12px !important;
            transition: all 0.3s ease !important;
        }

        .sidebar-item:hover {
            background: #333 !important;
            border-color: #555 !important;
        }

        .sidebar-item input[type="text"], .sidebar-item textarea {
            background: #333 !important;
            border: 1px solid #555 !important;
            color: #fff !important;
            border-radius: 4px !important;
            font-family: inherit !important;
        }

        .sidebar-item input[type="text"]:focus, .sidebar-item textarea:focus {
            border-color: #4CAF50 !important;
            outline: none !important;
        }

        .sidebar-item .remove-btn {
            background: none !important;
            border: none !important;
            color: #f44336 !important;
            cursor: pointer !important;
            font-size: 16px !important;
            padding: 4px !important;
            transition: all 0.2s ease !important;
        }

        .sidebar-item .remove-btn:hover {
            color: #ff5722 !important;
            transform: scale(1.2) !important;
        }

        /* ADD MENU STYLES */
        #sidekick-add-menu {
            position: fixed !important;
            background: linear-gradient(145deg, #2a2a2a, #1f1f1f) !important;
            border: 1px solid #444 !important;
            border-radius: 12px !important;
            padding: 12px !important;
            z-index: 999999 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
            min-width: 200px !important;
        }

        #sidekick-add-menu button {
            border: none !important;
            border-radius: 8px !important;
            padding: 12px 16px !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 12px !important;
            font-size: 14px !important;
            transition: all 0.3s ease !important;
            color: white !important;
        }

        #sidekick-add-menu button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        }
    `);

    // Wait for all modules to be loaded
    function waitForModules(callback) {
        const requiredModules = ['Core', 'UI', 'Content', 'Settings', 'Notepad', 'FlightTracker'];
        const checkModules = () => {
            const loadedModules = requiredModules.filter(module => 
                window.SidekickModules && window.SidekickModules[module]
            );
            
            console.log(`📦 Modules loaded: ${loadedModules.join(', ')} (${loadedModules.length}/${requiredModules.length})`);
            
            if (loadedModules.length === requiredModules.length) {
                console.log('✅ All modules loaded successfully!');
                callback();
            } else {
                // If modules aren't loading, fall back to basic implementation
                setTimeout(() => {
                    if (loadedModules.length === 0) {
                        console.log('⚠️ Modules not found, using fallback implementation');
                        initializeFallbackMode();
                    } else {
                        checkModules();
                    }
                }, 500);
            }
        };
        checkModules();
    }

    // === FALLBACK IMPLEMENTATION FOR STANDALONE OPERATION ===
    function initializeFallbackMode() {
        console.log("🔧 Initializing Sidekick in fallback mode...");
        
        // Basic notification system
        window.NotificationSystem = {
            show(title, message, type = 'info', duration = 4000) {
                const notification = document.createElement('div');
                notification.className = `sidekick-notification ${type}`;
                
                notification.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
                    <div style="font-size: 13px; opacity: 0.9;">${message}</div>
                `;
                
                document.body.appendChild(notification);
                
                // Auto remove
                setTimeout(() => {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                }, duration);
                
                // Click to dismiss
                notification.onclick = () => {
                    notification.style.animation = 'slideOutRight 0.3s ease';
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                };
            }
        };

        // Basic storage system
        window.SidekickStorage = {
            save(key, data) {
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                } catch (error) {
                    console.error('Failed to save state:', error);
                }
            },
            
            load(key, defaultValue = null) {
                try {
                    const data = localStorage.getItem(key);
                    return data ? JSON.parse(data) : defaultValue;
                } catch (error) {
                    console.error('Failed to load state:', error);
                    return defaultValue;
                }
            }
        };

        // Basic sidebar state manager
        window.SidebarStateManager = {
            isHidden() {
                return window.SidekickStorage.load('sidekick_sidebar_state', 'visible') === 'hidden';
            },
            
            toggle() {
                const sidebar = document.getElementById('sidekick-sidebar');
                // Add button is now part of the sidebar - no need to reference separately
                const hamburger = document.getElementById('sidekick-hamburger');
                
                if (!sidebar) return;
                
                const isHidden = this.isHidden();
                const newState = isHidden ? 'visible' : 'hidden';
                
                window.SidekickStorage.save('sidekick_sidebar_state', newState);
                
                // Apply body classes for CSS targeting
                if (newState === 'hidden') {
                    document.body.classList.add('sidekick-sidebar-hidden');
                    document.body.classList.remove('sidekick-sidebar-visible');
                    sidebar.classList.add('hidden');
                } else {
                    document.body.classList.remove('sidekick-sidebar-hidden');
                    document.body.classList.add('sidekick-sidebar-visible');
                    sidebar.classList.remove('hidden');
                }
                
                // Don't hide the add button anymore, just let CSS reposition it
                // if (addBtn) addBtn.classList.toggle('hidden', newState === 'hidden');
                
                if (hamburger) {
                    hamburger.innerHTML = newState === 'hidden' ? '☰' : '✕';
                    hamburger.title = newState === 'hidden' ? 'Show Sidebar' : 'Hide Sidebar';
                }
            },
            
            applyState() {
                const sidebar = document.getElementById('sidekick-sidebar');
                // Add button is now part of the sidebar - no need to reference separately
                const hamburger = document.getElementById('sidekick-hamburger');
                
                if (this.isHidden()) {
                    document.body.classList.add('sidekick-sidebar-hidden');
                    document.body.classList.remove('sidekick-sidebar-visible');
                    if (sidebar) sidebar.classList.add('hidden');
                    if (hamburger) {
                        hamburger.innerHTML = '☰';
                        hamburger.title = 'Show Sidebar';
                    }
                } else {
                    document.body.classList.remove('sidekick-sidebar-hidden');
                    document.body.classList.add('sidekick-sidebar-visible');
                    if (sidebar) sidebar.classList.remove('hidden');
                    if (hamburger) {
                        hamburger.innerHTML = '✕';
                        hamburger.title = 'Hide Sidebar';
                    }
                }
            }
        };

        // === SETTINGS MODAL IMPLEMENTATION ===
        function showSettingsModal() {
            console.log('🔧 showSettingsModal called!');
            
            // Remove any existing modal
            const existing = document.getElementById('settings-modal-overlay');
            if (existing) existing.remove();
            
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.id = 'settings-modal-overlay';
            overlay.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.7) !important;
                z-index: 999999 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                backdrop-filter: blur(5px) !important;
            `;
            
            // Create modal content
            const modal = document.createElement('div');
            modal.style.cssText = `
                background: linear-gradient(145deg, #2a2a2a, #1f1f1f) !important;
                border: 1px solid #444 !important;
                border-radius: 12px !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
                color: #fff !important;
                font-family: 'Segoe UI', sans-serif !important;
                width: 500px !important;
                max-width: 90vw !important;
                max-height: 80vh !important;
                overflow-y: auto !important;
            `;
            
            modal.innerHTML = `
                <div style="background: linear-gradient(135deg, #333, #444); padding: 16px; border-radius: 12px 12px 0 0; border-bottom: 1px solid #555; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-size: 18px;">⚙️ Sidekick Settings</h3>
                    <button id="close-settings-modal" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; padding: 5px;">×</button>
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; color: #aaa; font-weight: bold; font-size: 14px;">Torn API Key:</label>
                        <input type="text" id="api-key-input" value="${window.SidekickStorage.load('sidekick_api_key', '')}" 
                               placeholder="Enter your Torn API key here..."
                               style="width: 100%; background: #333; border: 1px solid #555; color: #fff; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 14px; box-sizing: border-box;">
                        <div style="font-size: 12px; color: #666; margin-top: 6px;">
                            Get your API key from: <a href="https://www.torn.com/preferences.php#tab=api" target="_blank" style="color: #4CAF50; text-decoration: none;">Torn Preferences</a>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
                        <button id="save-api-key" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #4CAF50, #388E3C); border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">
                            💾 Save API Key
                        </button>
                        <button id="test-api-btn" style="flex: 1; padding: 12px; background: linear-gradient(135deg, #2196F3, #1976D2); border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">
                            🧪 Test API
                        </button>
                    </div>
                    
                    <div style="border-top: 1px solid #444; margin: 20px 0; padding-top: 20px;">
                        <h4 style="color: #aaa; margin: 0 0 12px 0; font-size: 14px; font-weight: bold;">Data Management</h4>
                        <div style="display: flex; gap: 12px;">
                            <button id="export-data-btn" style="flex: 1; padding: 10px; background: #555; border: 1px solid #666; color: white; border-radius: 6px; cursor: pointer; font-size: 13px;">📤 Export Data</button>
                            <button id="import-data-btn" style="flex: 1; padding: 10px; background: #555; border: 1px solid #666; color: white; border-radius: 6px; cursor: pointer; font-size: 13px;">📥 Import Data</button>
                        </div>
                    </div>

                    <div style="border-top: 1px solid #444; margin: 20px 0; padding-top: 20px;">
                        <h4 style="color: #aaa; margin: 0 0 12px 0; font-size: 14px; font-weight: bold;">System Information</h4>
                        <div style="background: #1a1a1a; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; color: #aaa;">
                            <div>Version: 3.0.0</div>
                            <div>Mode: ${window.SidekickModules ? 'Modular' : 'Fallback'}</div>
                            <div>Storage: ${window.SidekickStorage.load('sidekick_api_key', '') ? 'API Key Set' : 'No API Key'}</div>
                        </div>
                    </div>
                </div>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            // Add event listeners
            setTimeout(() => {
                // Close modal
                const closeBtn = document.getElementById('close-settings-modal');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => overlay.remove());
                }
                
                // Close on overlay click
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) overlay.remove();
                });
                
                // Save API key
                const saveBtn = document.getElementById('save-api-key');
                if (saveBtn) {
                    saveBtn.addEventListener('click', () => {
                        const input = document.getElementById('api-key-input');
                        if (input && input.value.trim()) {
                            window.SidekickStorage.save('sidekick_api_key', input.value.trim());
                            window.NotificationSystem.show('Saved', 'API key saved successfully!', 'info');
                        } else {
                            window.NotificationSystem.show('Error', 'Please enter a valid API key', 'error');
                        }
                    });
                }
                
                // Test API
                const testBtn = document.getElementById('test-api-btn');
                if (testBtn) {
                    testBtn.addEventListener('click', async () => {
                        const input = document.getElementById('api-key-input');
                        if (!input || !input.value.trim()) {
                            window.NotificationSystem.show('Error', 'Please enter an API key first', 'error');
                            return;
                        }
                        
                        const apiKey = input.value.trim();
                        testBtn.disabled = true;
                        testBtn.innerHTML = '⏳ Testing...';
                        
                        try {
                            const response = await fetch(`https://api.torn.com/user/?selections=basic&key=${apiKey}`);
                            const data = await response.json();
                            
                            if (data.error) {
                                window.NotificationSystem.show('API Error', data.error.error, 'error');
                            } else {
                                window.NotificationSystem.show('Success', `API connection successful! Welcome, ${data.name}`, 'info');
                                window.SidekickStorage.save('sidekick_api_key', apiKey);
                            }
                        } catch (error) {
                            window.NotificationSystem.show('Error', 'Failed to test API connection', 'error');
                        } finally {
                            testBtn.disabled = false;
                            testBtn.innerHTML = '🧪 Test API';
                        }
                    });
                }
                
                // Export data
                const exportBtn = document.getElementById('export-data-btn');
                if (exportBtn) {
                    exportBtn.addEventListener('click', () => {
                        const data = {
                            settings: {
                                apiKey: window.SidekickStorage.load('sidekick_api_key', ''),
                                sidebarState: window.SidekickStorage.load('sidekick_sidebar_state', 'visible')
                            },
                            timestamp: Date.now(),
                            version: '3.0.0'
                        };
                        
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `sidekick-backup-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        
                        window.NotificationSystem.show('Exported', 'Data exported successfully', 'info');
                    });
                }
                
                // Import data
                const importBtn = document.getElementById('import-data-btn');
                if (importBtn) {
                    importBtn.addEventListener('click', () => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                try {
                                    const data = JSON.parse(e.target.result);
                                    if (data.settings) {
                                        if (data.settings.apiKey) window.SidekickStorage.save('sidekick_api_key', data.settings.apiKey);
                                        if (data.settings.sidebarState) window.SidekickStorage.save('sidekick_sidebar_state', data.settings.sidebarState);
                                        window.NotificationSystem.show('Imported', 'Data imported successfully', 'info');
                                        overlay.remove();
                                    } else {
                                        window.NotificationSystem.show('Error', 'Invalid backup file format', 'error');
                                    }
                                } catch (error) {
                                    window.NotificationSystem.show('Error', 'Failed to parse backup file', 'error');
                                }
                            };
                            reader.readAsText(file);
                        };
                        input.click();
                    });
                }
            }, 100);
        }

        // Make settings modal globally available
        window.showSettingsModal = showSettingsModal;

        // Basic UI creation functions
        function createHamburgerButton() {
            console.log("🍔 Creating hamburger button...");
            
            const existing = document.getElementById('sidekick-hamburger');
            if (existing) existing.remove();
            
            const hamburger = document.createElement('button');
            hamburger.id = 'sidekick-hamburger';
            hamburger.innerHTML = window.SidebarStateManager.isHidden() ? '☰' : '✕';
            hamburger.title = window.SidebarStateManager.isHidden() ? 'Show Sidebar' : 'Hide Sidebar';
            
            hamburger.addEventListener('click', () => {
                console.log("🍔 Hamburger clicked!");
                window.SidebarStateManager.toggle();
            });
            
            document.body.appendChild(hamburger);
            console.log("✅ Hamburger button created");
            return hamburger;
        }

        function createSidebar() {
            console.log("📋 Creating modular sidebar...");
            
            const existing = document.getElementById('sidekick-sidebar');
            if (existing) existing.remove();
            
            const sidebar = document.createElement('div');
            sidebar.id = 'sidekick-sidebar';
            
            // Create content area (topbar will be added by UI module)
            const contentArea = document.createElement('div');
            contentArea.id = 'sidekick-content';
            contentArea.style.cssText = `
                flex: 1;
                padding: 0px 16px 80px 16px;
                overflow-y: auto;
                overflow-x: hidden;
                max-height: calc(100vh - 140px);
                scrollbar-width: thin;
                scrollbar-color: #666 #2a2a2a;
            `;
            
            sidebar.appendChild(contentArea);
            document.body.appendChild(sidebar);
            
            // Initialize modules after sidebar creation
            initializeModules();
            
            console.log("✅ Modular sidebar created");
        }

        // Initialize all modules in proper order
        function initializeModules() {
            // Wait for modules to be available
            const checkModules = () => {
                if (window.SidekickModules?.UI && 
                    window.SidekickModules?.Notepad && 
                    window.SidekickModules?.Clock) {
                    
                    // Initialize UI first (creates topbar)
                    window.SidekickModules.UI.init();
                    
                    // Then initialize content modules
                    window.SidekickModules.Notepad.init();
                    window.SidekickModules.Clock.init();
                    
                    console.log('✅ All modules initialized');
                } else {
                    setTimeout(checkModules, 100);
                }
            };
            checkModules();
        }
        
        function loadSidebarContent() {
            
            // Create page navigation container
            const pageNavigation = document.createElement('div');
            pageNavigation.className = 'sidekick-page-navigation';
            
            // Create component controls container
            const componentControls = document.createElement('div');
            componentControls.className = 'sidekick-component-controls';
            
            // Load or initialize page data
            const pages = window.SidekickStorage.load('sidekick_sidebar_pages', [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.SidekickStorage.load('sidekick_current_page', 0);
            
            // Create page dots
            pages.forEach((page, index) => {
                const dot = document.createElement('div');
                dot.className = 'sidekick-page-dot';
                if (index === currentPage) {
                    dot.classList.add('active');
                }
                dot.dataset.page = index;
                dot.title = `Page ${index + 1}`;
                
                // Left-click to switch page
                dot.addEventListener('click', () => {
                    // Update active dot
                    pageNavigation.querySelectorAll('.sidekick-page-dot').forEach((d, i) => {
                        d.classList.toggle('active', i === index);
                    });
                    
                    // Save current page
                    window.SidekickStorage.save('sidekick_current_page', index);
                    
                    // Update content area
                    updateContentForPage(index);
                    
                    window.NotificationSystem.show('Page', `Switched to page ${index + 1}`, 'info', 1500);
                });
                
                // Press and hold to delete page (if more than one page exists)
                let pressTimer = null;
                dot.addEventListener('mousedown', (e) => {
                    if (pages.length > 1) {
                        pressTimer = setTimeout(() => {
                            if (confirm(`Delete page ${index + 1}?`)) {
                                removePage(index);
                            }
                        }, 1000); // 1 second hold
                    }
                });
                
                dot.addEventListener('mouseup', () => {
                    if (pressTimer) {
                        clearTimeout(pressTimer);
                        pressTimer = null;
                    }
                });
                
                dot.addEventListener('mouseleave', () => {
                    if (pressTimer) {
                        clearTimeout(pressTimer);
                        pressTimer = null;
                    }
                });
                
                // Right-click to delete page (keep as backup)
                dot.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (pages.length > 1) {
                        if (confirm(`Delete page ${index + 1}?`)) {
                            removePage(index);
                        }
                    } else {
                        window.NotificationSystem.show('Info', 'Cannot delete the last page', 'warning', 2000);
                    }
                });
                
                pageNavigation.appendChild(dot);
            });
            
            // Add new page button
            const addPageBtn = document.createElement('button');
            addPageBtn.innerHTML = '+';
            addPageBtn.className = 'sidekick-add-page-btn';
            addPageBtn.title = 'Add new page';
            addPageBtn.addEventListener('click', () => {
                addNewPage();
            });
            
            pageNavigation.appendChild(addPageBtn);
            
            // Add new component button (replaces the floating add button)
            const addComponentBtn = document.createElement('button');
            addComponentBtn.innerHTML = '+';
            addComponentBtn.className = 'sidekick-add-component-btn';
            addComponentBtn.title = 'Add component (notepad, todo, etc.)';
            addComponentBtn.addEventListener('click', () => {
                // Check if menu is already open and toggle it
                const existingMenu = document.getElementById('sidekick-add-menu');
                if (existingMenu) {
                    existingMenu.remove();
                } else {
                    showAddComponentDialog();
                }
            });
            
            componentControls.appendChild(addComponentBtn);
            
            // Assemble the navigation bar
            pageNav.appendChild(componentControls);
            pageNav.appendChild(pageNavigation);
            sidebar.appendChild(pageNav);
            
            // Page management functions
            function updateContentForPage(pageIndex) {
                const contentArea = document.getElementById('sidekick-content');
                if (!contentArea) return;
                
                const pages = window.SidekickStorage.load('sidekick_sidebar_pages', []);
                if (!pages[pageIndex]) return;
                
                console.log(`🔄 Updating content for page ${pageIndex}:`, pages[pageIndex]);
                
                // Update current page in storage for modules to use
                window.SidekickStorage.save('sidekick_current_page', pageIndex);
                
                // Switch notepad module to this page if available
                if (window.SidekickModules?.Notepad) {
                    console.log('📝 Using modular notepad system');
                    window.SidekickModules.Notepad.switchToPage(pageIndex);
                } else {
                    console.log('📝 Using fallback notepad system');
                    // Fallback: restore notepads from storage
                    contentArea.innerHTML = '';
                    const pageData = pages[pageIndex];
                    
                    if (pageData?.notepads && pageData.notepads.length > 0) {
                        console.log(`📋 Restoring ${pageData.notepads.length} notepads:`, pageData.notepads);
                        // Restore notepads for this page
                        pageData.notepads.forEach(notepad => {
                            createFallbackNotepadElement(notepad);
                        });
                    } else {
                        console.log('📝 No notepads found, showing placeholder');
                        // Show placeholder
                        contentArea.innerHTML = `
                            <div class="sidekick-placeholder" style="text-align: center; padding: 40px 20px; color: #aaa;">
                                <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                                <h3 style="margin: 0 0 8px 0; color: #fff; text-align: center;">No Panels Yet</h3>
                                <p style="margin: 0; font-size: 14px; text-align: center;">Click the + button to add your first panel</p>
                            </div>
                        `;
                    }
                }
            }
            
            function addNewPage() {
                const pages = window.SidekickStorage.load('sidekick_sidebar_pages', []);
                
                // Add new empty page
                pages.push({ notepads: [], todoLists: [], attackLists: [] });
                window.SidekickStorage.save('sidekick_sidebar_pages', pages);
                
                // Get navigation containers
                const pageNavigation = document.querySelector('.sidekick-page-navigation');
                const addPageBtn = pageNavigation.querySelector('.sidekick-add-page-btn');
                
                const newDot = document.createElement('div');
                newDot.className = 'sidekick-page-dot';
                newDot.dataset.page = pages.length - 1;
                newDot.title = `Page ${pages.length}`;
                
                // Add event listeners
                newDot.addEventListener('click', () => {
                    pageNavigation.querySelectorAll('.sidekick-page-dot').forEach((d, i) => {
                        d.classList.toggle('active', i === pages.length - 1);
                    });
                    window.SidekickStorage.save('sidekick_current_page', pages.length - 1);
                    updateContentForPage(pages.length - 1);
                    window.NotificationSystem.show('Page', `Switched to page ${pages.length}`, 'info', 1500);
                });
                
                // Press and hold to delete page
                let pressTimer = null;
                newDot.addEventListener('mousedown', (e) => {
                    if (pages.length > 1) {
                        pressTimer = setTimeout(() => {
                            if (confirm(`Delete page ${pages.length}?`)) {
                                removePage(pages.length - 1);
                            }
                        }, 1000); // 1 second hold
                    }
                });
                
                newDot.addEventListener('mouseup', () => {
                    if (pressTimer) {
                        clearTimeout(pressTimer);
                        pressTimer = null;
                    }
                });
                
                newDot.addEventListener('mouseleave', () => {
                    if (pressTimer) {
                        clearTimeout(pressTimer);
                        pressTimer = null;
                    }
                });
                
                newDot.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    if (pages.length > 1) {
                        if (confirm(`Delete page ${pages.length}?`)) {
                            removePage(pages.length - 1);
                        }
                    } else {
                        window.NotificationSystem.show('Info', 'Cannot delete the last page', 'warning', 2000);
                    }
                });
                
                // Insert before add page button
                pageNavigation.insertBefore(newDot, addPageBtn);
                
                // Switch to new page
                pageNavigation.querySelectorAll('.sidekick-page-dot').forEach((d, i) => {
                    d.classList.toggle('active', i === pages.length - 1);
                });
                window.SidekickStorage.save('sidekick_current_page', pages.length - 1);
                updateContentForPage(pages.length - 1);
                
                window.NotificationSystem.show('Success', `Page ${pages.length} created!`, 'info');
            }
            
            function removePage(pageIndex) {
                const pages = window.SidekickStorage.load('sidekick_sidebar_pages', []);
                const currentPage = window.SidekickStorage.load('sidekick_current_page', 0);
                
                // Don't allow removing the last page
                if (pages.length <= 1) {
                    window.NotificationSystem.show('Error', 'Cannot remove the last page', 'error');
                    return;
                }
                
                // Remove the page
                pages.splice(pageIndex, 1);
                
                // Adjust current page if necessary
                let newCurrentPage = currentPage;
                if (pageIndex <= currentPage) {
                    newCurrentPage = Math.max(0, currentPage - 1);
                }
                if (newCurrentPage >= pages.length) {
                    newCurrentPage = pages.length - 1;
                }
                
                // Save changes
                window.SidekickStorage.save('sidekick_sidebar_pages', pages);
                window.SidekickStorage.save('sidekick_current_page', newCurrentPage);
                
                // Refresh the page navigation
                const pageNavigation = document.querySelector('.sidekick-page-navigation');
                const addPageBtn = pageNavigation.querySelector('.sidekick-add-page-btn');
                
                // Remove all dots and recreate them
                pageNavigation.querySelectorAll('.sidekick-page-dot').forEach(dot => dot.remove());
                
                pages.forEach((page, index) => {
                    const dot = document.createElement('div');
                    dot.className = 'sidekick-page-dot';
                    if (index === newCurrentPage) {
                        dot.classList.add('active');
                    }
                    dot.dataset.page = index;
                    dot.title = `Page ${index + 1}`;
                    
                    dot.addEventListener('click', () => {
                        pageNavigation.querySelectorAll('.sidekick-page-dot').forEach((d, i) => {
                            d.classList.toggle('active', i === index);
                        });
                        window.SidekickStorage.save('sidekick_current_page', index);
                        updateContentForPage(index);
                        window.NotificationSystem.show('Page', `Switched to page ${index + 1}`, 'info', 1500);
                    });
                    
                    // Press and hold to delete page
                    let pressTimer = null;
                    dot.addEventListener('mousedown', (e) => {
                        if (pages.length > 1) {
                            pressTimer = setTimeout(() => {
                                if (confirm(`Delete page ${index + 1}?`)) {
                                    removePage(index);
                                }
                            }, 1000); // 1 second hold
                        }
                    });
                    
                    dot.addEventListener('mouseup', () => {
                        if (pressTimer) {
                            clearTimeout(pressTimer);
                            pressTimer = null;
                        }
                    });
                    
                    dot.addEventListener('mouseleave', () => {
                        if (pressTimer) {
                            clearTimeout(pressTimer);
                            pressTimer = null;
                        }
                    });
                    
                    dot.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        if (pages.length > 1) {
                            if (confirm(`Delete page ${index + 1}?`)) {
                                removePage(index);
                            }
                        } else {
                            window.NotificationSystem.show('Info', 'Cannot delete the last page', 'warning', 2000);
                        }
                    });
                    
                    pageNavigation.insertBefore(dot, addPageBtn);
                });
                
                // Update content for new current page
                updateContentForPage(newCurrentPage);
                
                window.NotificationSystem.show('Success', `Page ${pageIndex + 1} removed`, 'info');
            }
            
            // Initialize with current page content
            setTimeout(() => {
                updateContentForPage(currentPage);
            }, 100);
            
            // Add settings functionality
            setTimeout(() => {
                const settingsBtn = document.getElementById('settings-button');
                if (settingsBtn) {
                    settingsBtn.addEventListener('click', () => {
                        showSettingsModal();
                    });
                    
                    // Add hover effect
                    settingsBtn.addEventListener('mouseenter', () => {
                        settingsBtn.style.background = 'rgba(255,255,255,0.1)';
                        settingsBtn.style.borderColor = '#777';
                    });
                    
                    settingsBtn.addEventListener('mouseleave', () => {
                        settingsBtn.style.background = 'none';
                        settingsBtn.style.borderColor = '#555';
                    });
                }
                
                // Start clock
                startBasicClock();
            }, 100);
            
            document.body.appendChild(sidebar);
            window.SidebarStateManager.applyState();
            
            console.log("✅ Sidebar created");
            return sidebar;
        }

        // Floating add button functionality moved to bottom bar
        function showBasicAddMenu() {
            showAddComponentDialog();
        }

        function startBasicClock() {
            // === TOP BAR POINTS MONITOR (Based on working test implementation) ===
            const TopBarPointsMonitor = {
                currentPrice: null,
                isShowingPrice: false,
                updateInterval: null,
                
                init() {
                    console.log('💰 Initializing TopBarPointsMonitor...');
                    this.loadStoredPrice();
                    this.setupClickHandlers();
                    this.startApiMonitoring();
                },
                
                setupClickHandlers() {
                    // Set up click handler for the clock element when it's created
                    setTimeout(() => {
                        const clockElement = document.getElementById('sidekick-clock');
                        if (clockElement) {
                            clockElement.style.cursor = 'pointer';
                            clockElement.addEventListener('click', () => this.toggleDisplay());
                            clockElement.addEventListener('contextmenu', (e) => {
                                e.preventDefault();
                                this.promptForPrice();
                            });
                            clockElement.title = 'Click to toggle time/price, Right-click to set price';
                        }
                    }, 100);
                },
                
                loadStoredPrice() {
                    const stored = window.SidekickStorage.load('sidekick-points-price', null);
                    if (stored) {
                        this.currentPrice = parseFloat(stored);
                        console.log(`💰 Loaded stored price: $${this.currentPrice}`);
                    }
                },
                
                savePrice(price) {
                    this.currentPrice = price;
                    window.SidekickStorage.save('sidekick-points-price', price);
                    console.log(`💰 Saved price: $${price}`);
                },
                
                toggleDisplay() {
                    this.isShowingPrice = !this.isShowingPrice;
                    this.updateDisplay();
                },
                
                updateDisplay() {
                    const clockElement = document.getElementById('sidekick-clock');
                    const timeElement = document.getElementById('clock-time');
                    const dateElement = document.getElementById('clock-date');
                    if (!clockElement) return;
                    
                    if (this.isShowingPrice && this.currentPrice !== null) {
                        if (timeElement) {
                            timeElement.textContent = `$${this.currentPrice.toLocaleString()}`;
                            timeElement.style.color = '#4CAF50';
                        }
                        if (dateElement) {
                            // Hide date when showing price
                            dateElement.textContent = '';
                            dateElement.style.display = 'none';
                        }
                        clockElement.title = 'Click to show UTC time, Right-click to update price';
                    } else {
                        // Show current UTC time (Torn time) - always UTC, no local timezone
                        const now = new Date();
                        const timeStr = now.toISOString().substr(11, 8); // Gets HH:MM:SS from ISO string
                        
                        // Format date as "11 Aug"
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const day = now.getUTCDate();
                        const month = months[now.getUTCMonth()];
                        const dateStr = `${day} ${month}`;
                        
                        if (timeElement) {
                            timeElement.textContent = timeStr;
                            timeElement.style.color = '#fff';
                        }
                        if (dateElement) {
                            dateElement.textContent = dateStr;
                            dateElement.style.color = '#aaa';
                            dateElement.style.display = 'block';
                        }
                        clockElement.title = 'Click to show points price, Right-click to set price';
                    }
                },
                
                promptForPrice() {
                    const current = this.currentPrice || '';
                    const newPrice = prompt(`Enter current points price per dollar:\n(Current: $${current})`, current);
                    
                    if (newPrice !== null && newPrice.trim() !== '') {
                        const price = parseFloat(newPrice.trim().replace(/[^\d.]/g, ''));
                        if (!isNaN(price) && price > 0) {
                            this.savePrice(price);
                            if (this.isShowingPrice) {
                                this.updateDisplay();
                            }
                            window.NotificationSystem.show('Price Updated', `Points price set to $${price.toLocaleString()}`, 'info');
                        } else {
                            alert('Please enter a valid positive number');
                        }
                    }
                },
                
                startApiMonitoring() {
                    this.updatePointsPrice();
                    this.updateInterval = setInterval(() => {
                        this.updatePointsPrice();
                    }, 30000); // Every 30 seconds
                },
                
                async updatePointsPrice() {
                    try {
                        const apiKey = window.SidekickStorage.load('sidekick_api_key', '');
                        if (!apiKey) {
                            console.log('💰 No API key available for points price updates');
                            return;
                        }
                        
                        const apiUrl = `https://api.torn.com/market/?selections=pointsmarket&key=${apiKey}`;
                        const response = await fetch(apiUrl);
                        const data = await response.json();
                        
                        if (data.error) {
                            console.log('💰 API Error:', data.error.error);
                            return;
                        }
                        
                        if (data.pointsmarket && Object.keys(data.pointsmarket).length > 0) {
                            const costs = Object.values(data.pointsmarket).map(item => item.cost);
                            const newPrice = Math.min(...costs);
                            
                            if (newPrice !== this.currentPrice) {
                                this.savePrice(newPrice);
                                if (this.isShowingPrice) {
                                    this.updateDisplay();
                                }
                                console.log(`💰 Auto-updated points price: $${newPrice.toLocaleString()}`);
                            }
                        }
                    } catch (error) {
                        // Silently handle API errors for auto-updates
                        console.log('💰 Could not fetch points price from API (manual entry available):', error.message);
                    }
                }
            };
            
            function updateClock() {
                if (!TopBarPointsMonitor.isShowingPrice) {
                    TopBarPointsMonitor.updateDisplay();
                }
            }
            
            // Initialize points monitor
            TopBarPointsMonitor.init();
            
            // Update immediately
            updateClock();
            
            // Update every second, but only if not showing price
            setInterval(() => {
                if (!TopBarPointsMonitor.isShowingPrice) {
                    updateClock();
                }
            }, 1000);
        }

        function createFallbackNotepad() {
            const contentArea = document.getElementById('sidekick-content');
            if (!contentArea) return;

            // Remove placeholder if it exists
            const placeholder = contentArea.querySelector('.sidekick-placeholder');
            if (placeholder) {
                placeholder.remove();
            }

            const notepadId = Date.now() + Math.random();
            const notepad = {
                id: notepadId,
                content: '',
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            };

            console.log('📝 Creating new notepad:', notepad);

            // Save to storage
            const pages = window.SidekickStorage.load('sidekick_sidebar_pages', [{ notepads: [], todoLists: [], attackLists: [] }]);
            const currentPage = window.SidekickStorage.load('sidekick_current_page', 0);
            
            console.log('📄 Current pages before save:', JSON.parse(JSON.stringify(pages)));
            console.log('📍 Current page index:', currentPage);
            
            // Ensure current page exists
            while (pages.length <= currentPage) {
                pages.push({ notepads: [], todoLists: [], attackLists: [] });
            }
            
            if (!pages[currentPage].notepads) pages[currentPage].notepads = [];
            pages[currentPage].notepads.push(notepad);
            window.SidekickStorage.save('sidekick_sidebar_pages', pages);
            
            console.log('📄 Pages after save:', JSON.parse(JSON.stringify(pages)));
            console.log('💾 Saved notepad to storage successfully');

            // Create notepad element with enhanced design
            const notepadElement = document.createElement('div');
            notepadElement.id = `notepad-${notepadId}`;
            notepadElement.className = 'sidebar-item enhanced-notepad';
            notepadElement.style.cssText = `
                background: #2a2a2a !important;
                border: 1px solid #444 !important;
                border-radius: 8px !important;
                padding: 0px !important;
                margin-bottom: 12px !important;
                transition: background 0.2s ease, border-color 0.2s ease !important;
                resize: both !important;
                overflow: hidden !important;
                min-width: 200px !important;
                min-height: 60px !important;
                max-width: calc(100% - 8px) !important;
                width: 280px !important;
                height: 90px !important;
                position: relative !important;
            `;

            notepadElement.innerHTML = `
                <div class="notepad-header" style="position: absolute; top: 0; left: 0; right: 0; height: 20px; background: rgba(42, 42, 42, 0.8); cursor: move; z-index: 10; display: flex; justify-content: flex-end; align-items: center; padding: 2px 4px;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <div class="notepad-dropdown" style="position: relative;">
                            <button class="dropdown-toggle" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 10px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease;"
                                    title="Options">▼</button>
                            <div class="dropdown-menu" style="position: absolute; top: 16px; right: 0; background: #333; border: 1px solid #555; border-radius: 4px; min-width: 80px; display: none; z-index: 20; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                                <button class="pin-notepad-btn" style="width: 100%; background: none; border: none; color: #fff; padding: 6px 8px; text-align: left; cursor: pointer; font-size: 11px; transition: background 0.2s ease;"
                                        title="Pin window position and size">📌 Pin</button>
                            </div>
                        </div>
                        <button class="delete-notepad-btn" data-notepad-id="${notepadId}"
                                style="background: none; border: none; color: rgba(128, 128, 128, 0.7); cursor: pointer; font-size: 11px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease; font-weight: bold;"
                                title="Delete notepad">×</button>
                    </div>
                </div>
                <textarea placeholder="Write your notes here..."
                          style="width: 100%; height: 100%; background: transparent; border: none; color: #fff; padding: 20px 8px 8px 8px; border-radius: 8px; font-size: 13px; resize: none; font-family: inherit; box-sizing: border-box; outline: none; margin: 0;">${notepad.content}</textarea>
            `;

            // Add change handlers
            const contentTextarea = notepadElement.querySelector('textarea');
            const deleteBtn = notepadElement.querySelector('.delete-notepad-btn');
            const dropdownToggle = notepadElement.querySelector('.dropdown-toggle');
            const dropdownMenu = notepadElement.querySelector('.dropdown-menu');
            const pinBtn = notepadElement.querySelector('.pin-notepad-btn');
            const notepadHeader = notepadElement.querySelector('.notepad-header');
            
            // Dropdown menu functionality
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!notepadElement.contains(e.target)) {
                    dropdownMenu.style.display = 'none';
                }
            });
            
            // Pin functionality
            let isPinned = false;
            pinBtn.addEventListener('click', () => {
                isPinned = !isPinned;
                pinBtn.innerHTML = isPinned ? '📍 Unpin' : '📌 Pin';
                pinBtn.title = isPinned ? 'Unpin window' : 'Pin window position and size';
                dropdownMenu.style.display = 'none';
                
                // Save pinned state
                const pages = window.SidekickStorage.load('sidekick_sidebar_pages', []);
                const currentPage = window.SidekickStorage.load('sidekick_current_page', 0);
                const notepadData = pages[currentPage]?.notepads?.find(n => n.id === notepadId);
                if (notepadData) {
                    notepadData.pinned = isPinned;
                    notepadData.pinnedPosition = isPinned ? {
                        left: notepadElement.style.left,
                        top: notepadElement.style.top,
                        width: notepadElement.style.width,
                        height: notepadElement.style.height
                    } : null;
                    window.SidekickStorage.save('sidekick_sidebar_pages', pages);
                }
            });
            
            // Dragging functionality
            let isDragging = false;
            let dragOffset = { x: 0, y: 0 };
            
            notepadHeader.addEventListener('mousedown', (e) => {
                if (isPinned) return;
                isDragging = true;
                const rect = notepadElement.getBoundingClientRect();
                dragOffset.x = e.clientX - rect.left;
                dragOffset.y = e.clientY - rect.top;
                notepadElement.style.zIndex = '1000';
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging || isPinned) return;
                
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarRect = sidebar.getBoundingClientRect();
                
                let newLeft = e.clientX - sidebarRect.left - dragOffset.x;
                let newTop = e.clientY - sidebarRect.top - dragOffset.y;
                
                // Constrain to sidebar bounds with smaller padding
                const padding = 8;
                newLeft = Math.max(padding, Math.min(newLeft, sidebarRect.width - notepadElement.offsetWidth - padding));
                newTop = Math.max(padding, Math.min(newTop, sidebarRect.height - notepadElement.offsetHeight - padding));
                
                notepadElement.style.left = `${newLeft}px`;
                notepadElement.style.top = `${newTop}px`;
                notepadElement.style.position = 'absolute';
            });
            
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    notepadElement.style.zIndex = '';
                }
            });
            
            function saveChanges() {
                const pages = window.SidekickStorage.load('sidekick_sidebar_pages', []);
                const currentPage = window.SidekickStorage.load('sidekick_current_page', 0);
                const notepadData = pages[currentPage]?.notepads?.find(n => n.id === notepadId);
                if (notepadData) {
                    notepadData.content = contentTextarea.value;
                    notepadData.modified = new Date().toISOString();
                    window.SidekickStorage.save('sidekick_sidebar_pages', pages);
                }
            }

            // Delete button functionality
            deleteBtn.addEventListener('click', () => {
                if (confirm('Delete this notepad?')) {
                    const pages = window.SidekickStorage.load('sidekick_sidebar_pages', []);
                    const currentPage = window.SidekickStorage.load('sidekick_current_page', 0);
                    if (pages[currentPage]?.notepads) {
                        pages[currentPage].notepads = pages[currentPage].notepads.filter(n => n.id !== notepadId);
                        window.SidekickStorage.save('sidekick_sidebar_pages', pages);
                        notepadElement.remove();
                        window.NotificationSystem.show('Notepad', 'Notepad deleted!', 'info', 1500);
                        
                        // Show placeholder if no notepads left
                        const contentArea = document.getElementById('sidekick-content');
                        if (contentArea && !contentArea.querySelector('.enhanced-notepad')) {
                            contentArea.innerHTML = `
                                <div class="sidekick-placeholder" style="text-align: center; padding: 40px 20px; color: #aaa;">
                                    <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                                    <h3 style="margin: 0 0 8px 0; color: #fff;">No Notes Yet</h3>
                                    <p style="margin: 0; font-size: 14px;">Click the + button to add your first notepad</p>
                                </div>
                            `;
                        }
                    }
                }
            });

            contentTextarea.addEventListener('input', saveChanges);

            // Add resize constraints
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const element = entry.target;
                    const rect = element.getBoundingClientRect();
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
                    
                    // Constraint: don't exceed sidebar width with smaller padding
                    if (sidebarRect && rect.width > sidebarRect.width - 8) {
                        element.style.width = `${sidebarRect.width - 8}px`;
                    }
                    
                    // Constraint: minimum size based on content
                    const textLength = contentTextarea.value.length;
                    const minHeight = Math.max(60, Math.min(180, textLength / 5 + 50));
                    if (rect.height < minHeight) {
                        element.style.height = `${minHeight}px`;
                    }
                }
            });
            
            resizeObserver.observe(notepadElement);

            // Add hover effects
            notepadElement.addEventListener('mouseenter', () => {
                notepadElement.style.background = '#333 !important';
                notepadElement.style.borderColor = '#555 !important';
            });

            notepadElement.addEventListener('mouseleave', () => {
                notepadElement.style.background = '#2a2a2a !important';
                notepadElement.style.borderColor = '#444 !important';
            });

            contentArea.appendChild(notepadElement);
            window.NotificationSystem.show('Notepad', 'Notepad created!', 'info', 2000);
        }

        function createFallbackNotepadElement(notepad) {
            const contentArea = document.getElementById('sidekick-content');
            if (!contentArea) return;

            const notepadElement = document.createElement('div');
            notepadElement.id = `notepad-${notepad.id}`;
            notepadElement.className = 'sidebar-item enhanced-notepad';
            notepadElement.style.cssText = `
                background: #2a2a2a !important;
                border: 1px solid #444 !important;
                border-radius: 8px !important;
                padding: 0px !important;
                margin-bottom: 12px !important;
                transition: background 0.2s ease, border-color 0.2s ease !important;
                resize: both !important;
                overflow: hidden !important;
                min-width: 200px !important;
                min-height: 60px !important;
                max-width: calc(100% - 8px) !important;
                width: 280px !important;
                height: 90px !important;
                position: relative !important;
            `;

            notepadElement.innerHTML = `
                <div class="notepad-header" style="position: absolute; top: 0; left: 0; right: 0; height: 20px; background: rgba(42, 42, 42, 0.8); cursor: move; z-index: 10; display: flex; justify-content: flex-end; align-items: center; padding: 2px 4px;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <div class="notepad-dropdown" style="position: relative;">
                            <button class="dropdown-toggle" style="background: none; border: none; color: #aaa; cursor: pointer; font-size: 10px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease;"
                                    title="Options">▼</button>
                            <div class="dropdown-menu" style="position: absolute; top: 16px; right: 0; background: #333; border: 1px solid #555; border-radius: 4px; min-width: 80px; display: none; z-index: 20; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                                <button class="pin-notepad-btn" style="width: 100%; background: none; border: none; color: #fff; padding: 6px 8px; text-align: left; cursor: pointer; font-size: 11px; transition: background 0.2s ease;"
                                        title="Pin window position and size">📌 Pin</button>
                            </div>
                        </div>
                        <button class="delete-notepad-btn" data-notepad-id="${notepad.id}"
                                style="background: none; border: none; color: rgba(128, 128, 128, 0.7); cursor: pointer; font-size: 11px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; transition: color 0.2s ease; font-weight: bold;"
                                title="Delete notepad">×</button>
                    </div>
                </div>
                <textarea placeholder="Write your notes here..."
                          style="width: 100%; height: 100%; background: transparent; border: none; color: #fff; padding: 20px 8px 8px 8px; border-radius: 8px; font-size: 13px; resize: none; font-family: inherit; box-sizing: border-box; outline: none; margin: 0;">${notepad.content}</textarea>
            `;

            // Add change handlers
            const contentTextarea = notepadElement.querySelector('textarea');
            const deleteBtn = notepadElement.querySelector('.delete-notepad-btn');
            const dropdownToggle = notepadElement.querySelector('.dropdown-toggle');
            const dropdownMenu = notepadElement.querySelector('.dropdown-menu');
            const pinBtn = notepadElement.querySelector('.pin-notepad-btn');
            const notepadHeader = notepadElement.querySelector('.notepad-header');
            
            // Dropdown menu functionality
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!notepadElement.contains(e.target)) {
                    dropdownMenu.style.display = 'none';
                }
            });
            
            // Pin functionality
            let isPinned = false;
            pinBtn.addEventListener('click', () => {
                isPinned = !isPinned;
                pinBtn.innerHTML = isPinned ? '📍 Unpin' : '📌 Pin';
                pinBtn.title = isPinned ? 'Unpin window' : 'Pin window position and size';
                dropdownMenu.style.display = 'none';
                
                // Save pinned state
                const pages = window.SidekickStorage.load('sidekick_sidebar_pages', []);
                const currentPage = window.SidekickStorage.load('sidekick_current_page', 0);
                const notepadData = pages[currentPage]?.notepads?.find(n => n.id === notepad.id);
                if (notepadData) {
                    notepadData.pinned = isPinned;
                    notepadData.pinnedPosition = isPinned ? {
                        left: notepadElement.style.left,
                        top: notepadElement.style.top,
                        width: notepadElement.style.width,
                        height: notepadElement.style.height
                    } : null;
                    window.SidekickStorage.save('sidekick_sidebar_pages', pages);
                }
            });
            
            // Dragging functionality
            let isDragging = false;
            let dragOffset = { x: 0, y: 0 };
            
            notepadHeader.addEventListener('mousedown', (e) => {
                if (isPinned) return;
                isDragging = true;
                const rect = notepadElement.getBoundingClientRect();
                dragOffset.x = e.clientX - rect.left;
                dragOffset.y = e.clientY - rect.top;
                notepadElement.style.zIndex = '1000';
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging || isPinned) return;
                
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarRect = sidebar.getBoundingClientRect();
                
                let newLeft = e.clientX - sidebarRect.left - dragOffset.x;
                let newTop = e.clientY - sidebarRect.top - dragOffset.y;
                
                // Constrain to sidebar bounds with smaller padding
                const padding = 8;
                newLeft = Math.max(padding, Math.min(newLeft, sidebarRect.width - notepadElement.offsetWidth - padding));
                newTop = Math.max(padding, Math.min(newTop, sidebarRect.height - notepadElement.offsetHeight - padding));
                
                notepadElement.style.left = `${newLeft}px`;
                notepadElement.style.top = `${newTop}px`;
                notepadElement.style.position = 'absolute';
            });
            
            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    notepadElement.style.zIndex = '';
                }
            });
            
            function saveChanges() {
                const pages = window.SidekickStorage.load('sidekick_sidebar_pages', []);
                const currentPage = window.SidekickStorage.load('sidekick_current_page', 0);
                const notepadData = pages[currentPage]?.notepads?.find(n => n.id === notepad.id);
                if (notepadData) {
                    notepadData.content = contentTextarea.value;
                    notepadData.modified = new Date().toISOString();
                    window.SidekickStorage.save('sidekick_sidebar_pages', pages);
                }
            }

            // Delete button functionality
            deleteBtn.addEventListener('click', () => {
                if (confirm('Delete this notepad?')) {
                    const pages = window.SidekickStorage.load('sidekick_sidebar_pages', []);
                    const currentPage = window.SidekickStorage.load('sidekick_current_page', 0);
                    if (pages[currentPage]?.notepads) {
                        pages[currentPage].notepads = pages[currentPage].notepads.filter(n => n.id !== notepad.id);
                        window.SidekickStorage.save('sidekick_sidebar_pages', pages);
                        notepadElement.remove();
                        window.NotificationSystem.show('Notepad', 'Notepad deleted!', 'info', 1500);
                        
                        // Show placeholder if no notepads left
                        const contentArea = document.getElementById('sidekick-content');
                        if (contentArea && !contentArea.querySelector('.enhanced-notepad')) {
                            contentArea.innerHTML = `
                                <div class="sidekick-placeholder" style="text-align: center; padding: 40px 20px; color: #aaa;">
                                    <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                                    <h3 style="margin: 0 0 8px 0; color: #fff;">No Notes Yet</h3>
                                    <p style="margin: 0; font-size: 14px;">Click the + button to add your first notepad</p>
                                </div>
                            `;
                        }
                    }
                }
            });

            contentTextarea.addEventListener('input', saveChanges);

            // Add resize constraints
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const element = entry.target;
                    const rect = element.getBoundingClientRect();
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
                    
                    // Constraint: don't exceed sidebar width with smaller padding
                    if (sidebarRect && rect.width > sidebarRect.width - 8) {
                        element.style.width = `${sidebarRect.width - 8}px`;
                    }
                    
                    // Constraint: minimum size based on content
                    const textLength = contentTextarea.value.length;
                    const minHeight = Math.max(60, Math.min(180, textLength / 5 + 50));
                    if (rect.height < minHeight) {
                        element.style.height = `${minHeight}px`;
                    }
                }
            });
            
            resizeObserver.observe(notepadElement);

            // Add hover effects
            notepadElement.addEventListener('mouseenter', () => {
                notepadElement.style.background = '#333 !important';
                notepadElement.style.borderColor = '#555 !important';
            });

            notepadElement.addEventListener('mouseleave', () => {
                notepadElement.style.background = '#2a2a2a !important';
                notepadElement.style.borderColor = '#444 !important';
            });

            contentArea.appendChild(notepadElement);
        }

        function showAddComponentDialog() {
            showBasicAddMenu();
        }

        function showBasicAddMenu() {
            // Remove existing menu
            const existing = document.getElementById('sidekick-add-menu');
            if (existing) existing.remove();
            
            const menu = document.createElement('div');
            menu.id = 'sidekick-add-menu';
            
            // Position relative to the sidebar
            const sidebar = document.getElementById('sidekick-sidebar');
            const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { left: 20, bottom: 100 };
            
            menu.style.cssText = `
                position: fixed !important;
                bottom: 80px !important;
                left: ${sidebarRect.left + 20}px !important;
                background: linear-gradient(145deg, #2a2a2a, #1f1f1f) !important;
                border: 1px solid #444 !important;
                border-radius: 12px !important;
                padding: 12px !important;
                z-index: 999999 !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
                min-width: 200px !important;
            `;
            
            const menuItems = [
                { 
                    icon: '📝', 
                    text: 'Add Notepad', 
                    color: '#2196F3',
                    action: () => {
                        if (window.SidekickModules?.Notepad) {
                            window.SidekickModules.Notepad.addNotepad();
                        } else {
                            // Fallback notepad creation
                            createFallbackNotepad();
                        }
                        menu.remove();
                    }
                },
                { 
                    icon: '✈️', 
                    text: 'Add Flight Tracker', 
                    color: '#1976D2',
                    action: () => {
                        console.log('🔍 Flight tracker button clicked');
                        console.log('🔍 window.createFlightTracker exists:', typeof window.createFlightTracker);
                        console.log('🔍 FlightTracker module:', window.SidekickModules?.FlightTracker);
                        
                        if (window.createFlightTracker) {
                            window.createFlightTracker();
                        } else if (window.SidekickModules?.FlightTracker?.createFlightTracker) {
                            window.SidekickModules.FlightTracker.createFlightTracker();
                        } else {
                            console.error('❌ Flight tracker function not available');
                            window.NotificationSystem?.show('Error', 'Flight tracker module not loaded', 'error');
                        }
                        menu.remove();
                    }
                },
                { 
                    icon: '✅', 
                    text: 'Add Todo List', 
                    color: '#4CAF50',
                    action: () => {
                        window.NotificationSystem.show('Todo', 'Todo list functionality will be available with modules', 'info');
                        menu.remove();
                    }
                },
                { 
                    icon: '⚔️', 
                    text: 'Add Attack List', 
                    color: '#f44336',
                    action: () => {
                        window.NotificationSystem.show('Attack List', 'Attack list functionality will be available with modules', 'info');
                        menu.remove();
                    }
                }
            ];
            
            menuItems.forEach(item => {
                const button = document.createElement('button');
                button.style.cssText = `
                    background: linear-gradient(135deg, ${item.color}, ${item.color}dd) !important;
                    color: white !important;
                    border: none !important;
                    border-radius: 8px !important;
                    padding: 12px 16px !important;
                    cursor: pointer !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 12px !important;
                    font-size: 14px !important;
                    transition: all 0.3s ease !important;
                `;
                
                button.innerHTML = `<span style="font-size: 16px;">${item.icon}</span> ${item.text}`;
                
                button.addEventListener('click', item.action);
                
                button.addEventListener('mouseenter', () => {
                    button.style.transform = 'translateY(-2px)';
                    button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                });
                
                button.addEventListener('mouseleave', () => {
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = 'none';
                });
                
                menu.appendChild(button);
            });
            
            document.body.appendChild(menu);
            
            // Close menu when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target) && 
                        !e.target.classList.contains('sidekick-add-component-btn')) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 100);
        }

        // Create UI components
        try {
            createHamburgerButton();
            createSidebar();
            // Add button is now integrated in the bottom bar of the sidebar
            
            console.log('✅ Fallback UI created successfully!');
            // window.NotificationSystem.show('Sidekick', 'Visual system loaded with settings! Modules coming soon...', 'info');
        } catch (error) {
            console.error('❌ Failed to create fallback UI:', error);
        }
    }

    // === INITIALIZATION ===
    function initializeSidekickModular() {
        console.log("🔧 Initializing Sidekick Modular with modules...");
        
        // Set API key if not already set (temporary fix)
        if (!window.SidekickModules.Core.loadState(window.SidekickModules.Core.STORAGE_KEYS.API_KEY, '')) {
            console.log('ℹ️ No API key found, user will need to set one in settings');
        }
        
        try {
            // Create UI components using modular system
            const hamburger = window.SidekickModules.UI.createHamburgerButton();
            const sidebar = window.SidekickModules.UI.createSidebar();
            // Add button is now integrated in the sidebar bottom bar
            
            console.log('🎨 UI components created with modules');
            
            // Start clock
            if (window.startTornClock) {
                window.startTornClock();
            }
            
            // Restore saved content after a short delay
            setTimeout(() => {
                if (window.SidekickModules.Content.restoreSavedContent) {
                    window.SidekickModules.Content.restoreSavedContent();
                    console.log('📋 Content restored');
                }
                
                // Force fix notepads to ensure proper formatting after content restoration
                if (window.forceFixNotepads) {
                    window.forceFixNotepads();
                    console.log('🔧 Notepads force-fixed after content restoration');
                }
                
                // Initialize FlightTracker module
                if (window.SidekickModules.FlightTracker && window.SidekickModules.FlightTracker.init) {
                    window.SidekickModules.FlightTracker.init();
                    console.log('✈️ FlightTracker module initialized');
                }
                
                console.log('✅ Sidekick Modular initialization complete!');
                // Removed notification to avoid showing on every page refresh
            }, 500);
            
        } catch (error) {
            console.error('❌ Failed to initialize Sidekick Modular:', error);
            if (window.SidekickModules.Core && window.SidekickModules.Core.NotificationSystem) {
                window.SidekickModules.Core.NotificationSystem.show('Error', 'Failed to initialize modular system', 'error');
            }
        }
    }

    // === STARTUP ===
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM loaded, waiting for modules...');
            waitForModules(initializeSidekickModular);
        });
    } else {
        // DOM already loaded
        console.log('📄 DOM already ready, waiting for modules...');
        setTimeout(() => {
            waitForModules(initializeSidekickModular);
        }, 100);
    }

    // Backup initialization in case modules fail to load
    setTimeout(() => {
        if (!document.getElementById('sidekick-hamburger')) {
            console.log('🔄 No UI detected, triggering backup initialization');
            // Try modules one more time
            if (window.SidekickModules && Object.keys(window.SidekickModules).length > 0) {
                console.log('🔄 Modules found on retry, initializing...');
                waitForModules(initializeSidekickModular);
            } else {
                console.log('🔄 No modules found, using fallback implementation');
                initializeFallbackMode();
            }
        }
    }, 5000); // Give modules 5 seconds to load

    console.log("🎯 Sidekick Modular script loaded and ready!");

})();
