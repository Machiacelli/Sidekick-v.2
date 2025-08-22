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

    function blockTraining() {
        // Remove gym content
        const gymRoot = document.getElementById('gymroot');
        if (gymRoot) {
            gymRoot.style.display = 'none';
        }
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'block-training-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.85);
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        overlay.innerHTML = `
            <img src="https://i.imgur.com/GPAKP0U.jpeg" alt="Blocked" style="max-width:90vw; max-height:90vh; border-radius:16px; box-shadow:0 0 32px #000;">
        `;
        document.body.appendChild(overlay);

        // Block all clicks
        overlay.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); });
        overlay.addEventListener('mousedown', function(e) { e.stopPropagation(); e.preventDefault(); });
    }

    // Only run on gym page
    if (window.location.pathname === '/gym.php') {
        blockTraining();
    }

    // Export for Sidekick integration
    window.SidekickModules = window.SidekickModules || {};
    window.SidekickModules.BlockTraining = { blockTraining };
})();
