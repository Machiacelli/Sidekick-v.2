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

    // Persistent state key
    const STORAGE_KEY = 'blockTrainingActive';

    function isBlocked() {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }

    function setBlocked(active) {
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
        if (window.SidekickModules?.Core?.NotificationSystem) {
            window.SidekickModules.Core.NotificationSystem.show('Block Training', msg, type || 'info', 2000);
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

    // On gym page load, restore block if active
    if (window.location.pathname === '/gym.php') {
        if (isBlocked()) {
            showBlock();
        }
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
