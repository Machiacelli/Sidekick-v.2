// ==UserScript==
// @name         Sidekick NPC Attack Timer Module
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Add NPC attack time to the news ticker using Loot Rangers API
// @author       Machiacelli
// @match        https://www.torn.com/*
// @match        https://*.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.lzpt.io
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
        const NPCAttackTimerModule = {
            name: 'NPCAttackTimer',
            version: '1.0.0',
            isActive: false,
            
            // Configuration
            config: {
                color: "#8abeef", // Color for news ticker
                format: 24, // 12 or 24 hour format
                local: false // true = local time, false = UTC (TCT)
            },
            
            lzptData: null,
            newstickerObserver: null,
            originalFetch: null,

            init() {
                console.log('⚔️ Initializing NPC Attack Timer Module v1.0.0...');
                this.core = window.SidekickModules.Core;
                
                if (!this.core) {
                    console.error('❌ Core module not available for NPC Attack Timer');
                    return false;
                }

                // Fetch attack times and setup fetch interceptor
                this.setupFetchInterceptor();
                this.startNewstickerObserver();
                
                console.log('✅ NPC Attack Timer initialized successfully');
                return true;
            },

            setupFetchInterceptor() {
                const self = this;
                
                // Store original fetch
                if (!this.originalFetch) {
                    this.originalFetch = unsafeWindow.fetch;
                }
                
                // Override fetch to inject NPC data into news ticker
                unsafeWindow.fetch = async (...args) => {
                    const [resource, config] = args;
                    const response = await self.originalFetch(resource, config);
                    
                    // Only intercept news ticker requests
                    if (response.url.indexOf('?sid=newsTicker') === -1) {
                        return response;
                    }
                    
                    // Clone response and modify data
                    const json = () => response.clone().json()
                        .then(async (data) => {
                            data = { ...data };
                            
                            try {
                                const lzptData = await self.getAttackTimes();
                                const attackItem = self.createAttackItem(lzptData);
                                
                                if (attackItem) {
                                    data.headlines.unshift(attackItem);
                                }
                            } catch (error) {
                                console.error('❌ Error adding NPC attack data:', error);
                            }
                            
                            return data;
                        });
                    
                    response.json = json;
                    response.text = async () => JSON.stringify(await json());
                    
                    return response;
                };
                
                console.log('✅ Fetch interceptor setup complete');
            },

            createAttackItem(result) {
                if (!result || !result.time) return null;
                
                let attackOrder = '';
                let attackString = '';
                let attackLink = '';
                let attackTarget = 0;

                // If there's no clear time set
                if (result.time.clear == 0 && result.time.attack === false) {
                    attackString = result.time.reason 
                        ? 'NPC attacking will resume after ' + result.time.reason 
                        : 'No attack currently set.';
                } else {
                    // Build the string for the attack order
                    if (result.order && result.npcs) {
                        result.order.forEach((npcId) => {
                            const npc = result.npcs[npcId];
                            if (npc && npc.next) {
                                // If there's an attack happening right now, cross out NPCs that are in the hospital
                                if (result.time.attack === true) {
                                    if (npc.hosp_out >= result.time.current) {
                                        attackOrder += '<span style="text-decoration: line-through">' + npc.name + '</span>, ';
                                    } else {
                                        attackOrder += npc.name + ', ';
                                    }
                                } else {
                                    attackOrder += npc.name + ', ';
                                }
                            }
                            
                            // Adjust the current target based on if an attack is going and who isn't in the hospital yet
                            if (result.time.attack === true) {
                                if (npc && npc.hosp_out <= result.time.current) {
                                    if (attackTarget == 0) {
                                        attackTarget = npcId;
                                    }
                                }
                            }
                        });
                    }

                    // Check if target has been set, otherwise default to first in attack order
                    if (attackTarget == 0 && result.order && result.order.length > 0) {
                        attackTarget = result.order[0];
                    }

                    // Clean up the attack order string
                    attackOrder = attackOrder.slice(0, -2) + '.';

                    // Check if an attack is currently happening and adjust the message accordingly
                    if (result.time.attack === true) {
                        attackString = 'NPC attack is underway! Get in there and get some loot!';
                        attackLink = 'loader.php?sid=attack&user2ID=' + attackTarget;
                    } else {
                        attackString = 'NPC attack set for ' + this.formatTime(result.time.clear) + '. Order is: ' + attackOrder;
                        attackLink = 'loader.php?sid=attack&user2ID=' + attackTarget;
                    }
                }

                // Insert the custom news item
                return {
                    ID: 0,
                    headline: '<span style="color:' + this.config.color + '; font-weight: bold;" id="icey-npctimer">' + attackString + '</span>',
                    countdown: true,
                    endTime: result.time.clear,
                    link: attackLink,
                    isGlobal: true,
                    type: 'generalMessage'
                };
            },

            formatTime(timestamp) {
                const d = new Date(timestamp * 1000);
                let tail, D, T;
                
                if (this.config.local) {
                    tail = ' LT';
                    D = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
                    T = [d.getHours(), d.getMinutes(), d.getSeconds()];
                } else {
                    tail = ' TCT';
                    D = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
                    T = [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()];
                }
                
                if (this.config.format == 12) {
                    if (+T[0] > 12) {
                        T[0] -= 12;
                        tail = 'PM ' + tail;
                    } else {
                        tail = 'AM ' + tail;
                    }
                }
                
                for (let i = 0; i < 3; i++) {
                    if (D[i] < 10) D[i] = '0' + D[i];
                    if (T[i] < 10) T[i] = '0' + T[i];
                }
                
                return T.join(':') + tail;
            },

            async getAttackTimes() {
                return new Promise((resolve, reject) => {
                    const request_url = 'https://api.lzpt.io/loot';
                    
                    if (typeof GM_xmlhttpRequest === 'undefined') {
                        // Fallback to regular fetch if GM_xmlhttpRequest not available
                        fetch(request_url)
                            .then(response => response.json())
                            .then(data => resolve(data))
                            .catch(error => reject(error));
                        return;
                    }
                    
                    GM_xmlhttpRequest({
                        method: "GET",
                        url: request_url,
                        headers: {
                            "Content-Type": "application/json"
                        },
                        onload: response => {
                            try {
                                const data = JSON.parse(response.responseText);
                                if (!data) {
                                    console.log('⚠️ No response from Loot Rangers');
                                    reject('No response from Loot Rangers');
                                } else {
                                    resolve(data);
                                }
                            } catch (e) {
                                console.error('❌ Error parsing Loot Rangers data:', e);
                                reject(e);
                            }
                        },
                        onerror: (e) => {
                            console.error('❌ Error fetching from Loot Rangers:', e);
                            reject(e);
                        }
                    });
                });
            },

            modifyNewstickerContent() {
                return new Promise((resolve, reject) => {
                    const ticker = document.querySelector('.news-ticker-countdown');
                    if (!ticker) {
                        resolve('No ticker found');
                        return;
                    }
                    
                    ticker.style.color = this.config.color;
                    const wrap = ticker.parentNode.parentNode.parentNode;
                    const svg = wrap.children[0];
                    
                    if (svg) {
                        svg.setAttribute('fill', this.config.color);
                        svg.setAttribute('viewBox', "0 0 24 24");
                        svg.setAttribute('height', '14');
                        svg.setAttribute('width', '14');
                        
                        if (svg.children[0]) {
                            svg.children[0].setAttribute('d', 'M17.457 3L21 3.003l.002 3.523-5.467 5.466 2.828 2.829 1.415-1.414 1.414 1.414-2.474 2.475 2.828 2.829-1.414 1.414-2.829-2.829-2.475 2.475-1.414-1.414 1.414-1.415-2.829-2.828-2.828 2.828 1.415 1.415-1.414 1.414-2.475-2.475-2.829 2.829-1.414-1.414 2.829-2.83-2.475-2.474 1.414-1.414 1.414 1.413 2.827-2.828-5.46-5.46L3 3l3.546.003 5.453 5.454L17.457 3zm-7.58 10.406L7.05 16.234l.708.707 2.827-2.828-.707-.707zm9.124-8.405h-.717l-4.87 4.869.706.707 4.881-4.879v-.697zm-14 0v.7l11.241 11.241.707-.707L5.716 5.002l-.715-.001z');
                        }
                    }
                    
                    resolve('Content updated');
                });
            },

            startNewstickerObserver() {
                const self = this;
                
                // Wait for the NPC timer element to appear
                this.waitForElement('#icey-npctimer').then(() => {
                    // Create observer for ticker content changes
                    self.newstickerObserver = new MutationObserver((mutationsList, observer) => {
                        const npcTimer = document.querySelector(".news-ticker-slide #icey-npctimer");
                        
                        if (npcTimer) {
                            // Disconnect observer to avoid infinite loop
                            self.newstickerObserver.disconnect();
                            
                            // Modify the content
                            self.modifyNewstickerContent()
                                .then(() => {
                                    // Re-observe after modifications
                                    self.observeNewsticker();
                                })
                                .catch(error => console.error('❌ Error updating ticker content:', error));
                        }
                    });
                    
                    self.observeNewsticker();
                });
            },

            observeNewsticker() {
                const target = document.querySelector('.news-ticker-slider-wrapper');
                if (target && this.newstickerObserver) {
                    this.newstickerObserver.observe(target, {
                        childList: true,
                        subtree: true,
                        attributes: false,
                        characterData: false
                    });
                }
            },

            waitForElement(selector) {
                return new Promise(resolve => {
                    if (document.querySelector(selector)) {
                        return resolve(document.querySelector(selector));
                    }

                    const observer = new MutationObserver(mutations => {
                        if (document.querySelector(selector)) {
                            observer.disconnect();
                            resolve(document.querySelector(selector));
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                });
            },

            cleanup() {
                // Restore original fetch
                if (this.originalFetch) {
                    unsafeWindow.fetch = this.originalFetch;
                }
                
                // Disconnect observer
                if (this.newstickerObserver) {
                    this.newstickerObserver.disconnect();
                }
                
                console.log('🧹 NPC Attack Timer cleaned up');
            }
        };

        // Register module
        if (!window.SidekickModules) {
            window.SidekickModules = {};
        }
        window.SidekickModules.NPCAttackTimer = NPCAttackTimerModule;

        console.log('✅ NPC Attack Timer module registered');
    });
})();
