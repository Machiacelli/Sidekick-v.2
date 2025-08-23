// ==UserScript==
// @name         Block Training Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Blocks the training page with a custom image overlay
// @author       Machiacelli
// @match        https://www.torn.com/gym.php*
// ==/UserScript==


(function() {
    'use strict';

    // Modular persistent state key
    const STORAGE_KEY = 'blockTrainingActive';
    // Use Sidekick Core for persistence
    function isBlocked() {
        if (window.SidekickModules?.Core?.loadState) {
            return window.SidekickModules.Core.loadState(STORAGE_KEY, false) === true;
        }
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }

    function setBlocked(active) {
        if (window.SidekickModules?.Core?.saveState) {
            window.SidekickModules.Core.saveState(STORAGE_KEY, !!active);
        }
        localStorage.setItem(STORAGE_KEY, active ? 'true' : 'false');
    }

    function blockTraining() {
        setBlocked(true);
        showBlock();
        notify('Training is now blocked!', 'warning');
        updateButtonLabel();
    }

    function unblockTraining() {
        setBlocked(false);
        removeBlock();
        notify('Training is now unblocked!', 'success');
        updateButtonLabel();
    }

    function toggleBlockTraining() {
        if (isBlocked()) {
            unblockTraining();
        } else {
            blockTraining();
        }
    }

    function showBlock() {
        const gymRoot = document.getElementById('gymroot');
        if (gymRoot) {
            gymRoot.innerHTML = `
                <center>
                    <img src="https://i.imgur.com/GPAKP0U.jpeg" style="width:80%;max-width:600px;border-radius:16px;box-shadow:0 0 32px #000;">
                </center>
            `;
        }
    }

    function removeBlock() {
        // Reload gym page to restore original content
        if (window.location.pathname === '/gym.php') {
            window.location.reload();
        }
    }

    function notify(msg, type) {
        // Use consistent color and style for Sidekick notifications
        if (window.SidekickModules?.Core?.NotificationSystem) {
            // Use 'info' for enabled, 'success' for disabled, matching other modules
            window.SidekickModules.Core.NotificationSystem.show(
                'Block Training',
                msg,
                type === 'warning' ? 'info' : (type || 'info'),
                3000
            );
        } else {
            alert(msg);
        }
    }

    function updateButtonLabel() {
        const btn = document.getElementById('block-training-btn');
        if (btn) {
            btn.textContent = isBlocked() ? 'Unblock Training' : 'Block Training';
        }
    }

    // On gym page load, restore block if active (modular persistence)
    if (window.location.pathname === '/gym.php') {
        // Wait for Core to be ready for modular persistence
        function restoreBlockTraining() {
            if (window.SidekickModules?.Core?.loadState) {
                if (isBlocked()) {
                    showBlock();
                }
            } else {
                setTimeout(restoreBlockTraining, 100);
            }
        }
        restoreBlockTraining();
    }

    // Export for Sidekick integration
    window.SidekickModules = window.SidekickModules || {};
    window.SidekickModules.BlockTraining = {
        blockTraining,
        unblockTraining,
        toggleBlockTraining,
        isBlocked,
        updateButtonLabel
    };

})();
