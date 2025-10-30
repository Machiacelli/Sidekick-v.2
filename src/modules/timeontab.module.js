// ==UserScript==
// @name         Sidekick Time on Tab Module
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Display remaining travel time, hospital time, raceway time, and time left for chain on tab title
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Wait for core module to be available
    function waitForCore(callback) {
        if (window.SidekickModules?.Core) {
            callback();
        } else {
            setTimeout(() => waitForCore(callback), 100);
        }
    }

    waitForCore(() => {
        const TimeOnTabModule = {
            name: 'TimeOnTab',
            version: '1.0.1',
            
            // Constants
            title: "[Time on Tab Title]: ",
            
            TEXT_TRAVEL: " Traveling | TORN",
            TEXT_HOSPITAL: " Hospital | TORN",
            TEXT_RACEWAY: " Racing | TORN",
            TEXT_CHAIN: " Chain | TORN",
            
            ID_HOSPITAL: 'theCounter',
            ID_RACEWAY: 'infoSpot',
            
            SPAN_CHAIN_TITLE: 'span.chain-box-title',
            SPAN_CHAIN_LENGTH: 'p.bar-value___uxnah',
            SPAN_CHAIN_TIME: "p.bar-timeleft___B9RGV",
            
            URL_HOSPITAL: "https://www.torn.com/hospitalview.php",
            URL_RACEWAY: "https://www.torn.com/loader.php?sid=racing",
            URL_CHAIN: 'https://www.torn.com/factions.php',
            URL_TRAVEL: "https://www.torn.com/page.php?sid=travel",
            
            IF_PARSE_HOSPITAL_TIME: false,
            IF_PARSE_RACEWAY_TIME: false,
            
            observers: [],

            init() {
                console.log('⏰ Initializing Time on Tab Module v1.0.1...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for Time on Tab');
                    return false;
                }

                // Start observing based on current URL
                this.startObservingBasedOnURL();
                
                console.log('✅ Time on Tab module initialized successfully');
                return true;
            },

            parseTime(timeString) {
                // Extract hours, minutes, and seconds from the string
                let hoursMatch = timeString.match(/(\d+)\s*hour/);
                let minutesMatch = timeString.match(/(\d+)\s*minute/);
                let secondsMatch = timeString.match(/(\d+)\s*second/);
                
                // If hours, minutes, or seconds weren't found, default to 0
                let hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
                let minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
                let seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;
                
                // Add any minutes over 60 to the hours and keep the remainder as minutes
                hours += Math.floor(minutes / 60);
                minutes = minutes % 60;
                
                // Pad the hours, minutes, and seconds with leading zeros if necessary
                hours = hours.toString().padStart(2, '0');
                minutes = minutes.toString().padStart(2, '0');
                seconds = seconds.toString().padStart(2, '0');
                
                return hours + ':' + minutes + ':' + seconds;
            },

            startObserving(spanId, tabText) {
                let span = document.getElementById(spanId);
                
                if (span) {
                    let observer = new MutationObserver((mutations) => {
                        if (document.contains(span)) {
                            let text = null;
                            if (spanId === this.ID_RACEWAY) {
                                if (span.textContent.startsWith("Race")) {
                                    text = span.textContent;
                                } else {
                                    text = span.querySelector("span").textContent;
                                    if (this.IF_PARSE_RACEWAY_TIME) {
                                        text = this.parseTime(text);
                                    }
                                }
                            } else {
                                text = span.textContent;
                            }
                            
                            // If raceway or hospital check for if parse time is enabled
                            if (spanId === this.ID_HOSPITAL && this.IF_PARSE_HOSPITAL_TIME) {
                                text = this.parseTime(text);
                            } else {
                                text = span.textContent;
                            }
                            let newTitle = text + tabText;
                            document.title = newTitle;
                        } else {
                            observer.disconnect();
                            console.log(this.title + 'Element with id "' + spanId + '" not found. Observer disconnected.');
                        }
                    });
                    
                    observer.observe(span, { characterData: true, childList: true, subtree: true });
                    this.observers.push(observer);
                } else {
                    window.setTimeout(() => this.startObserving(spanId, tabText), 500);
                }
            },

            startObservingChain() {
                let span = document.querySelector(this.SPAN_CHAIN_TIME);
                if (span) {
                    let observer = new MutationObserver((mutations) => {
                        if (document.contains(span)) {
                            let length = document.querySelector(this.SPAN_CHAIN_LENGTH).textContent;
                            let time = document.querySelector(this.SPAN_CHAIN_TIME).textContent;
                            
                            document.title = time + " left " + length + " " + this.TEXT_CHAIN;
                        } else {
                            observer.disconnect();
                            console.log(this.title + 'Element with class ' + this.SPAN_CHAIN_TITLE + ' not found or chain inactive. Observer disconnected.');
                        }
                    });
                    
                    observer.observe(span, { characterData: true, childList: true, subtree: true });
                    this.observers.push(observer);
                } else {
                    window.setTimeout(() => this.startObservingChain(), 500);
                }
            },

            startObservingTravel() {
                let span = document.querySelector("#travel-root > div.flightProgressSection___fhrD5 > div.progressText___qJFfY > span > span:nth-child(2) > time");
                if (span) {
                    let observer = new MutationObserver((mutations) => {
                        if (document.contains(span)) {
                            let text = span.textContent;
                            document.title = text + this.TEXT_TRAVEL;
                        } else {
                            observer.disconnect();
                            console.log(this.title + 'Element with id "travel-root" not found. Observer disconnected.');
                        }
                    });
                    
                    observer.observe(span, { characterData: true, childList: true, subtree: true });
                    this.observers.push(observer);
                } else {
                    window.setTimeout(() => this.startObservingTravel(), 500);
                }
            },

            startObservingBasedOnURL() {
                const url = window.location.href;
                
                console.log('🔍 Time on Tab: Checking URL:', url);
                
                // Check for travel page (use includes instead of exact match)
                if (url.includes('torn.com/page.php') && url.includes('sid=travel')) {
                    console.log('✈️ Travel page detected, starting travel observer');
                    this.startObservingTravel();
                }
                // Check for hospital page
                else if (url.includes('torn.com/hospitalview.php')) {
                    console.log('🏥 Hospital page detected, starting hospital observer');
                    this.startObserving(this.ID_HOSPITAL, this.TEXT_HOSPITAL);
                }
                // Check for raceway page
                else if (url.includes('torn.com/loader.php') && url.includes('sid=racing')) {
                    console.log('🏁 Raceway page detected, starting raceway observer');
                    this.startObserving(this.ID_RACEWAY, this.TEXT_RACEWAY);
                }
                // Check for faction page (chain)
                else if (url.includes('torn.com/factions.php')) {
                    console.log('⛓️ Faction page detected, starting chain observer');
                    this.startObservingChain();
                } else {
                    console.log('⏸️ No matching page for Time on Tab');
                }
            },

            cleanup() {
                // Disconnect all observers
                this.observers.forEach(observer => observer.disconnect());
                this.observers = [];
                console.log('⏰ Time on Tab observers cleaned up');
            }
        };

        // Register module globally
        if (typeof window.SidekickModules === 'undefined') {
            window.SidekickModules = {};
        }
        window.SidekickModules.TimeOnTab = TimeOnTabModule;

        console.log('⏰ Time on Tab module registered globally');
    });
})();
