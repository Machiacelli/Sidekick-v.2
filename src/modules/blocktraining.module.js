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
        const gymRoot = document.getElementById('gymroot');
        if (gymRoot) {
            gymRoot.innerHTML = `
                <center>
                    <img src="https://i.imgur.com/GPAKP0U.jpeg" style="width:80%;max-width:600px;border-radius:16px;box-shadow:0 0 32px #000;">
                </center>
            `;
        }
    }

    // Only run on gym page
    if (window.location.pathname === '/gym.php') {
        blockTraining();
    }

    // Export for Sidekick integration
    window.SidekickModules = window.SidekickModules || {};
    window.SidekickModules.BlockTraining = { blockTraining };
})();
