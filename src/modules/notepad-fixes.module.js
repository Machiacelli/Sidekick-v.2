// Enhanced dragging and positioning fixes for Notepad module
// This patches the existing notepad module to fix drift and auto-resize issues

(function() {
    'use strict';
    
    console.log('🔧 Loading Notepad positioning fixes...');
    
    // Wait for the notepad module to be available
    function waitForNotepadModule() {
        if (!window.SidekickModules?.Notepad) {
            setTimeout(waitForNotepadModule, 100);
            return;
        }
        
        console.log('🔧 Applying notepad positioning fixes...');
        
        const notepadModule = window.SidekickModules.Notepad;
        
        // Store original functions
        const originalSetupHandlers = notepadModule.setupNotepadHandlers;
        
        // Override setupNotepadHandlers with improved positioning logic
        notepadModule.setupNotepadHandlers = function(notepadElement, notepad) {
            const contentTextarea = notepadElement.querySelector('textarea');
            const header = notepadElement.querySelector('.notepad-header');
            const closeBtn = notepadElement.querySelector('.close-btn');
            const dropdownBtn = notepadElement.querySelector('.dropdown-btn');
            const dropdownContent = notepadElement.querySelector('.dropdown-content');
            const pinBtn = notepadElement.querySelector('.pin-btn');
            const colorBtn = notepadElement.querySelector('.color-btn');
            
            // Use notepad pinned state
            let isPinned = notepad.pinned || false;
            
            // Improved save layout function - prevents drift and unwanted resizing
            const saveLayout = () => {
                // Prevent saving during programmatic changes
                if (this._isProgrammaticChange) {
                    console.log('📝 Skipping save during programmatic change');
                    return;
                }
                
                // Get current values but clamp them properly
                const sidebar = document.getElementById('sidekick-sidebar');
                const sidebarWidth = sidebar ? Math.max(200, sidebar.clientWidth) : 500;
                const sidebarHeight = sidebar ? Math.max(200, sidebar.clientHeight) : 600;

                const rawX = parseInt(notepadElement.style.left) || 0;
                const rawY = parseInt(notepadElement.style.top) || 0;
                const rawWidth = notepadElement.offsetWidth;
                const rawHeight = notepadElement.offsetHeight;

                const maxWidth = Math.max(150, sidebarWidth - 16);
                const maxHeight = Math.max(100, sidebarHeight - 80);

                const width = Math.min(rawWidth, maxWidth);
                const height = Math.min(rawHeight, maxHeight);

                const maxX = Math.max(0, sidebarWidth - width - 8);
                const maxY = Math.max(0, sidebarHeight - height - 8);

                const x = Math.min(Math.max(0, rawX), maxX);
                const y = Math.min(Math.max(0, rawY), maxY);

                // Only save if values actually changed significantly
                if (Math.abs(notepad.x - x) < 2 && Math.abs(notepad.y - y) < 2 && 
                    Math.abs(notepad.width - width) < 10 && Math.abs(notepad.height - height) < 10 && 
                    notepad.pinned === isPinned) {
                    console.log('📝 No significant layout changes detected, skipping save');
                    return;
                }

                // Update the notepad object with clamped values
                notepad.x = x;
                notepad.y = y;
                notepad.width = width;
                notepad.height = height;
                notepad.pinned = isPinned;

                // Apply corrected styles to prevent visual inconsistencies
                this._isProgrammaticChange = true;
                notepadElement.style.left = x + 'px';
                notepadElement.style.top = y + 'px';
                notepadElement.style.width = width + 'px';
                notepadElement.style.height = height + 'px';
                
                setTimeout(() => {
                    this._isProgrammaticChange = false;
                }, 100);

                // Save to storage
                this.saveNotepads();
                console.log('📝 Saved improved layout for notepad ' + notepad.id + ':', {
                    x: notepad.x, y: notepad.y, width: notepad.width, height: notepad.height, pinned: notepad.pinned
                });
            };
            
            // Content textarea handlers
            if (contentTextarea) {
                contentTextarea.addEventListener('input', () => {
                    this.updateNotepad(notepad.id, notepad.title, contentTextarea.value);
                });
                
                contentTextarea.addEventListener('focus', () => {
                    notepadElement.style.borderColor = '#66BB6A';
                    notepadElement.style.boxShadow = '0 0 0 2px rgba(102, 187, 106, 0.2)';
                });
                
                contentTextarea.addEventListener('blur', () => {
                    notepadElement.style.borderColor = '#444';
                    notepadElement.style.boxShadow = 'none';
                });
            }
            
            // Close button
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteNotepad(notepad.id);
                });
            }
            
            // Dropdown functionality
            if (dropdownBtn && dropdownContent) {
                dropdownBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
                });
                
                document.addEventListener('click', () => {
                    dropdownContent.style.display = 'none';
                });
            }
            
            // Pin functionality
            if (pinBtn) {
                pinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    isPinned = !isPinned;
                    pinBtn.textContent = isPinned ? '📌 Unpin' : '📌 Pin';
                    
                    notepadElement.style.resize = isPinned ? 'none' : 'both';
                    header.style.cursor = isPinned ? 'default' : 'move';
                    saveLayout.call(this);
                    dropdownContent.style.display = 'none';
                });
            }
            
            // Color functionality
            if (colorBtn) {
                colorBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownContent.style.display = 'none';
                    this.showColorPicker(notepadElement, notepad);
                });
            }
            
            // IMPROVED DRAGGING - prevents drift and unwanted movement
            if (header) {
                let isDragging = false;
                let dragOffset = { x: 0, y: 0 };
                let startPosition = { x: 0, y: 0 };
                
                header.addEventListener('mousedown', (e) => {
                    if (isPinned) return;
                    
                    isDragging = true;
                    const rect = notepadElement.getBoundingClientRect();
                    const sidebar = document.getElementById('sidekick-sidebar');
                    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { left: 0, top: 0 };
                    
                    // Calculate offset relative to the notepad element
                    dragOffset.x = e.clientX - rect.left;
                    dragOffset.y = e.clientY - rect.top;
                    
                    // Store start position to detect actual movement
                    startPosition.x = rect.left - sidebarRect.left;
                    startPosition.y = rect.top - sidebarRect.top;
                    
                    e.preventDefault();
                    e.stopPropagation();
                });
                
                document.addEventListener('mousemove', (e) => {
                    if (!isDragging || isPinned) return;
                    
                    const sidebar = document.getElementById('sidekick-sidebar');
                    if (!sidebar) return;
                    
                    const sidebarRect = sidebar.getBoundingClientRect();
                    
                    // Calculate new position relative to sidebar, accounting for offset
                    let newX = e.clientX - sidebarRect.left - dragOffset.x;
                    let newY = e.clientY - sidebarRect.top - dragOffset.y;
                    
                    // Keep within sidebar bounds
                    const maxX = Math.max(0, sidebar.offsetWidth - notepadElement.offsetWidth);
                    const maxY = Math.max(0, sidebar.offsetHeight - notepadElement.offsetHeight);
                    
                    newX = Math.max(0, Math.min(newX, maxX));
                    newY = Math.max(0, Math.min(newY, maxY));
                    
                    notepadElement.style.left = newX + 'px';
                    notepadElement.style.top = newY + 'px';
                });
                
                document.addEventListener('mouseup', () => {
                    if (isDragging) {
                        isDragging = false;
                        
                        // Only save if position actually changed (prevents drift from micro-movements)
                        const currentX = parseInt(notepadElement.style.left) || 0;
                        const currentY = parseInt(notepadElement.style.top) || 0;
                        
                        if (Math.abs(currentX - startPosition.x) > 3 || Math.abs(currentY - startPosition.y) > 3) {
                            console.log('📝 Position changed during drag, saving layout...');
                            saveLayout.call(this);
                        } else {
                            console.log('📝 Position change too small (likely drift), not saving');
                        }
                    }
                });
            }
            
            // IMPROVED RESIZING - only save when user actually resizes significantly
            let isUserResizing = false;
            let startSize = { width: 0, height: 0 };
            let resizeTimeout = null;
            let lastSavedSize = { width: notepad.width || 280, height: notepad.height || 150 };
            
            notepadElement.addEventListener('mousedown', (e) => {
                // Check if mouse is near the bottom-right corner (resize handle)
                const rect = notepadElement.getBoundingClientRect();
                if (e.clientX > rect.right - 20 && e.clientY > rect.bottom - 20) {
                    isUserResizing = true;
                    startSize.width = notepadElement.offsetWidth;
                    startSize.height = notepadElement.offsetHeight;
                    console.log('📝 User started resizing notepad:', startSize);
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (isUserResizing) {
                    isUserResizing = false;
                    
                    // Clear any existing timeout
                    if (resizeTimeout) {
                        clearTimeout(resizeTimeout);
                    }
                    
                    // Only save if size actually changed significantly
                    const currentWidth = notepadElement.offsetWidth;
                    const currentHeight = notepadElement.offsetHeight;
                    
                    const widthDiff = Math.abs(currentWidth - lastSavedSize.width);
                    const heightDiff = Math.abs(currentHeight - lastSavedSize.height);
                    
                    if (widthDiff > 15 || heightDiff > 15) {
                        console.log('📝 Size changed significantly, saving layout...', {
                            widthDiff: widthDiff,
                            heightDiff: heightDiff,
                            current: { width: currentWidth, height: currentHeight },
                            lastSaved: lastSavedSize
                        });
                        
                        // Update last saved size
                        lastSavedSize = { width: currentWidth, height: currentHeight };
                        
                        // Use a delay to ensure the resize is complete
                        resizeTimeout = setTimeout(() => {
                            saveLayout.call(this);
                        }, 200);
                    } else {
                        console.log('📝 Size change too small, not saving');
                    }
                }
            });
        };
        
        console.log('✅ Notepad positioning fixes applied successfully');
    }
    
    // Start waiting for notepad module
    waitForNotepadModule();
})();
