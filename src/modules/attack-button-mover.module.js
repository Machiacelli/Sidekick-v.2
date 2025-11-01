// Attack Button Mover Module
// Moves the "Start Fight" button on top of weapon for faster attack speed

(function() {
    'use strict';

    const AttackButtonMover = {
        name: 'AttackButtonMover',
        version: '1.0.0',
        isEnabled: false,
        buttonLocation: 'Primary', // Default: Primary weapon
        loopIntervalId: null,

        init() {
            console.log(`⚔️ Attack Button Mover v${this.version} initializing...`);
            
            // Check if enabled in settings
            const enabled = GM_getValue(window.SidekickModules.Core.STORAGE_KEYS.ATTACK_BUTTON_ENABLED, true);
            this.isEnabled = enabled;
            
            if (this.isEnabled) {
                console.log('✅ Attack Button Mover: Enabled - will activate on attack pages');
                this.startMonitoring();
            } else {
                console.log('⏸️ Attack Button Mover: Disabled via settings');
            }
        },

        startMonitoring() {
            // Only run on loader.php pages (attack/gym pages)
            if (!window.location.href.includes('loader.php')) {
                return;
            }

            console.log('🎯 Attack Button Mover: On attack page, starting button detection...');
            
            // Start detection loop
            let loopCount = 0;
            this.loopIntervalId = setInterval(() => {
                loopCount++;
                if (loopCount > 20) { // Stop after 5 seconds (20 * 250ms)
                    clearInterval(this.loopIntervalId);
                    console.log('⏹️ Attack Button Mover: Detection timeout after 5 seconds');
                    return;
                }

                this.moveStartFightButton();

                // If button successfully moved, stop loop
                if (document.querySelector('.sidekick-attack-button-wrapper')) {
                    clearInterval(this.loopIntervalId);
                    console.log('✅ Attack Button Mover: Start fight button successfully moved');
                }
            }, 250);
        },

        moveStartFightButton() {
            let startFightButton, weaponImage, weaponWrapper;

            // Find elements based on button location setting
            if (this.buttonLocation === 'Primary') {
                startFightButton = document.querySelector('.torn-btn.btn___RxE8_.silver');
                weaponImage = document.querySelector('.weaponImage___tUzwP img');
                weaponWrapper = document.querySelector('.weaponWrapper___h3buK');
            } else if (this.buttonLocation === 'Secondary') {
                startFightButton = document.querySelector('.torn-btn.btn___RxE8_.silver');
                weaponImage = document.querySelector('#weapon_second .weaponImage___tUzwP img');
                weaponWrapper = document.querySelector('#weapon_second');
            } else if (this.buttonLocation === 'Melee') {
                startFightButton = document.querySelector('.torn-btn.btn___RxE8_.silver');
                weaponImage = document.querySelector('#weapon_melee .weaponImage___tUzwP img');
                weaponWrapper = document.querySelector('#weapon_melee');
            } else if (this.buttonLocation === 'Temp') {
                startFightButton = document.querySelector('.torn-btn.btn___RxE8_.silver');
                weaponImage = document.querySelector('#weapon_temp .weaponImage___tUzwP img');
                weaponWrapper = document.querySelector('#weapon_temp');
            }

            // Only proceed if all elements found
            if (!startFightButton || !weaponImage || !weaponWrapper) {
                return;
            }

            // Check if already moved
            if (document.querySelector('.sidekick-attack-button-wrapper')) {
                return;
            }

            console.log('🎯 Attack Button Mover: Moving button to', this.buttonLocation);

            // Create wrapper for button
            const buttonWrapper = document.createElement('div');
            buttonWrapper.classList.add('sidekick-attack-button-wrapper');
            buttonWrapper.appendChild(startFightButton);

            // Insert wrapper after weapon image
            weaponWrapper.insertBefore(buttonWrapper, weaponImage.nextSibling);

            // Position button over weapon image
            buttonWrapper.style.position = 'absolute';
            buttonWrapper.style.top = weaponImage.offsetTop + 'px';
            buttonWrapper.style.left = '15px';
            buttonWrapper.style.zIndex = '10';

            // Remove wrapper when button clicked
            startFightButton.addEventListener('click', () => {
                console.log('🎯 Attack Button Mover: Fight started, removing button wrapper');
                buttonWrapper.remove();
            });

            console.log('✅ Attack Button Mover: Button positioned over weapon');
        },

        setEnabled(enabled) {
            this.isEnabled = enabled;
            GM_setValue(window.SidekickModules.Core.STORAGE_KEYS.ATTACK_BUTTON_ENABLED, enabled);
            
            if (enabled) {
                console.log('✅ Attack Button Mover: Enabled');
                this.startMonitoring();
            } else {
                console.log('⏸️ Attack Button Mover: Disabled');
                // Clear any running interval
                if (this.loopIntervalId) {
                    clearInterval(this.loopIntervalId);
                }
                // Remove any existing button wrapper
                const existingWrapper = document.querySelector('.sidekick-attack-button-wrapper');
                if (existingWrapper) {
                    existingWrapper.remove();
                }
            }
        },

        setButtonLocation(location) {
            if (['Primary', 'Secondary', 'Melee', 'Temp'].includes(location)) {
                this.buttonLocation = location;
                GM_setValue(window.SidekickModules.Core.STORAGE_KEYS.ATTACK_BUTTON_LOCATION, location);
                console.log(`🎯 Attack Button Mover: Location set to ${location}`);
            }
        }
    };

    // Register module
    if (!window.SidekickModules) {
        window.SidekickModules = {};
    }
    window.SidekickModules.AttackButtonMover = AttackButtonMover;

    console.log('✅ Attack Button Mover module loaded');
})();
