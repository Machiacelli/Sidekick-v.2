// Event Ticker Module - Shows rolling notifications for Torn events
(function() {
    'use strict';

    const EventTicker = {
        name: 'EventTicker',
        core: null,
        tickerElement: null,
        currentEventIndex: 0,
        rotationInterval: null,
        playerSignupDate: null,
        playerBirthdayChecked: false,

        // Event data from events.txt
        events: [
            {
                startMonth: 1, startDay: 19,
                endMonth: 1, endDay: 25,
                name: "Awareness Week",
                feature: "+Awareness boost",
                notification: "City map looking like a garage sale – Awareness Week is live."
            },
            {
                startMonth: 1, startDay: 30,
                endMonth: 1, endDay: 31,
                name: "Weekend Road Trip",
                feature: "2× racing points & Racing skill",
                notification: "Engines loud, egos louder – Weekend Road Trip live."
            },
            {
                startMonth: 2, startDay: 14,
                endMonth: 2, endDay: 15,
                name: "Valentine's Day",
                feature: "Love Juice drug",
                notification: "Nothing says love like questionable liquid in a syringe. Happy V-Day."
            },
            {
                startMonth: 3, startDay: 6,
                endMonth: 3, endDay: 7,
                name: "Employee Appreciation Day",
                feature: "3× company training stats & job points",
                notification: "Your boss suddenly cares. Enjoy it—it'll wear off Monday."
            },
            {
                startMonth: 3, startDay: 17,
                endMonth: 3, endDay: 18,
                name: "St. Patrick's Day",
                feature: "2× alcohol effects; Green Stout item",
                notification: "Drink up – St. Patrick's Day bonuses live."
            },
            {
                startMonth: 4, startDay: 18,
                endMonth: 4, endDay: 24,
                name: "Easter Egg Hunt",
                feature: "Eggs spawn on Torn pages",
                notification: "Crack eggs, not skulls… or both. Easter in Torn."
            },
            {
                startMonth: 4, startDay: 20,
                endMonth: 4, endDay: 21,
                name: "420 Day",
                feature: "3× cannabis nerve; 5× overdose risk",
                notification: "The city smells funny. Must be April 20th again."
            },
            {
                startMonth: 5, startDay: 17,
                endMonth: 5, endDay: 18,
                name: "Museum Day",
                feature: "10% bonus on museum exchange points",
                notification: "Museum Day: plushies finally worth something."
            },
            {
                startMonth: 6, startDay: 13,
                endMonth: 6, endDay: 14,
                name: "World Blood Donor Day",
                feature: "50% medical cooldown & life loss reduction",
                notification: "Half-price blood loss today. Go stab someone to celebrate."
            },
            {
                startMonth: 7, startDay: 6,
                endMonth: 7, endDay: 7,
                name: "World Population Day",
                feature: "2× XP from attacks",
                notification: "Double XP for attacks – Population Day active."
            },
            {
                startMonth: 7, startDay: 28,
                endMonth: 7, endDay: 29,
                name: "World Tiger Day",
                feature: "5× hunting experience",
                notification: "Tiger Day: hunt like it owes you money."
            },
            {
                startMonth: 7, startDay: 31,
                endMonth: 8, endDay: 1,
                name: "International Beer Day",
                feature: "5× nerve from beer items",
                notification: "Cheers! Every pint is five crimes closer to jail."
            },
            {
                startMonth: 9, startDay: 26,
                endMonth: 9, endDay: 27,
                name: "Tourism Day",
                feature: "Double travel item capacity",
                notification: "Smuggling limit doubled. Customs is crying."
            },
            {
                startMonth: 10, startDay: 10,
                endMonth: 10, endDay: 11,
                name: "CaffeineCon 2025",
                feature: "2× energy drink effects",
                notification: "Stock the Red Cow, it's CaffeineCon time."
            },
            {
                startMonth: 10, startDay: 24,
                endMonth: 11, endDay: 1,
                name: "Trick or Treat",
                feature: "Treat trade for basket upgrades/prizes",
                notification: "Basket's empty. Go beat someone up for candy."
            },
            {
                startMonth: 11, startDay: 15,
                endMonth: 11, endDay: 16,
                name: "Torn Anniversary",
                feature: "",
                notification: "Torn is celebrating its birthday today!"
            },
            {
                startMonth: 11, startDay: 14,
                endMonth: 11, endDay: 15,
                name: "World Diabetes Day",
                feature: "3× happy from candy",
                notification: "World Diabetes Day: Torn's running on pure sugar highs."
            },
            {
                startMonth: 11, startDay: 27,
                endMonth: 11, endDay: 28,
                name: "Black Friday",
                feature: "$1 bazaar \"dollar sale\" community frenzy",
                notification: "Black Friday: $1 bazaar chaos, refresh or cry."
            },
            {
                startMonth: 12, startDay: 4,
                endMonth: 12, endDay: 5,
                name: "Slash Wednesday",
                feature: "Hospital times reduced by 75%",
                notification: "Slash Wednesday live: ER now with a fast lane."
            },
            {
                startMonth: 12, startDay: 15,
                endMonth: 12, endDay: 31,
                name: "Christmas Town",
                feature: "Seasonal map-based event with treasure",
                notification: "Christmas Town: snow, loot, and sketchy Santa."
            }
        ],

        init() {
            console.log('🎪 Event Ticker: Initializing...');
            this.core = window.SidekickModules.Core;
            
            // Fetch player's Torn birthday
            this.fetchPlayerBirthday();
            
            // Wait for sidebar to be created
            this.waitForSidebar();
        },

        async fetchPlayerBirthday() {
            if (this.playerBirthdayChecked) return;
            
            try {
                console.log('🎂 Event Ticker: Fetching player birthday from Torn API...');
                const apiKey = await this.core.getApiKey();
                
                if (!apiKey) {
                    console.log('⚠️ Event Ticker: No API key found, skipping birthday check');
                    this.playerBirthdayChecked = true;
                    return;
                }
                
                const response = await fetch(`https://api.torn.com/user/?selections=profile&key=${apiKey}`);
                const data = await response.json();
                
                if (data.error) {
                    console.error('❌ Event Ticker: API error:', data.error);
                    this.playerBirthdayChecked = true;
                    return;
                }
                
                if (data.signup) {
                    // Parse signup date (format: "yyyy-MM-dd HH:mm:ss")
                    this.playerSignupDate = new Date(data.signup);
                    console.log('✅ Event Ticker: Player joined Torn on', data.signup);
                    
                    const yearsInTorn = this.getYearsInTorn();
                    console.log(`🎉 Event Ticker: Player has been in Torn for ${yearsInTorn} years!`);
                } else {
                    console.log('⚠️ Event Ticker: No signup date found in API response');
                }
                
                this.playerBirthdayChecked = true;
            } catch (error) {
                console.error('❌ Event Ticker: Failed to fetch player birthday:', error);
                this.playerBirthdayChecked = true;
            }
        },

        getYearsInTorn() {
            if (!this.playerSignupDate) return 0;
            
            const now = new Date();
            const years = now.getFullYear() - this.playerSignupDate.getFullYear();
            
            // Check if birthday has passed this year
            const thisYearBirthday = new Date(
                now.getFullYear(),
                this.playerSignupDate.getMonth(),
                this.playerSignupDate.getDate()
            );
            
            if (now < thisYearBirthday) {
                return years - 1;
            }
            
            return years;
        },

        isTornBirthdayToday() {
            if (!this.playerSignupDate) return false;
            
            const now = new Date();
            const signupMonth = this.playerSignupDate.getMonth();
            const signupDay = this.playerSignupDate.getDate();
            
            return now.getMonth() === signupMonth && now.getDate() === signupDay;
        },

        isTornBirthdaySoon(daysAhead = 7) {
            if (!this.playerSignupDate) return false;
            
            const now = new Date();
            const signupMonth = this.playerSignupDate.getMonth();
            const signupDay = this.playerSignupDate.getDate();
            
            // Create birthday date for this year
            let birthdayThisYear = new Date(now.getFullYear(), signupMonth, signupDay);
            
            // If birthday already passed this year, check next year
            if (birthdayThisYear < now) {
                birthdayThisYear = new Date(now.getFullYear() + 1, signupMonth, signupDay);
            }
            
            const daysUntil = Math.floor((birthdayThisYear - now) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= daysAhead;
        },

        waitForSidebar() {
            const checkSidebar = setInterval(() => {
                const sidebar = document.getElementById('sidekick-sidebar');
                if (sidebar) {
                    clearInterval(checkSidebar);
                    this.createTicker();
                    this.startRotation();
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => clearInterval(checkSidebar), 10000);
        },

        createTicker() {
            // Check if ticker already exists
            if (document.getElementById('sidekick-event-ticker')) {
                return;
            }

            const sidebar = document.getElementById('sidekick-sidebar');
            if (!sidebar) return;

            // Add CSS keyframes for scrolling animation
            if (!document.getElementById('sidekick-ticker-styles')) {
                const style = document.createElement('style');
                style.id = 'sidekick-ticker-styles';
                style.textContent = `
                    @keyframes sidekick-ticker-scroll {
                        0% {
                            transform: translateX(100%);
                        }
                        100% {
                            transform: translateX(-100%);
                        }
                    }
                    
                    .sidekick-ticker-scrolling {
                        animation: sidekick-ticker-scroll 20s linear infinite;
                    }
                `;
                document.head.appendChild(style);
            }

            // Create ticker container
            const ticker = document.createElement('div');
            ticker.id = 'sidekick-event-ticker';
            ticker.style.cssText = `
                width: 100%;
                background: linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
                border-bottom: 1px solid #444;
                padding: 8px 16px;
                box-sizing: border-box;
                overflow: hidden;
                position: relative;
                min-height: 36px;
                display: flex;
                align-items: center;
                gap: 8px;
            `;

            // Icon container
            const iconContainer = document.createElement('div');
            iconContainer.style.cssText = `
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
            `;
            iconContainer.innerHTML = '🎪';

            // Scrolling wrapper for overflow control
            const scrollWrapper = document.createElement('div');
            scrollWrapper.style.cssText = `
                flex: 1;
                overflow: hidden;
                position: relative;
            `;

            // Text container with scrolling animation
            const textContainer = document.createElement('div');
            textContainer.id = 'sidekick-ticker-text';
            textContainer.className = 'sidekick-ticker-scrolling';
            textContainer.style.cssText = `
                color: #fff;
                font-size: 12px;
                white-space: nowrap;
                display: inline-block;
                padding-left: 100%;
            `;

            scrollWrapper.appendChild(textContainer);
            ticker.appendChild(iconContainer);
            ticker.appendChild(scrollWrapper);

            // Insert at the top of sidebar (after the hamburger button area)
            const contentArea = document.getElementById('sidekick-content');
            if (contentArea) {
                sidebar.insertBefore(ticker, contentArea);
            } else {
                sidebar.insertBefore(ticker, sidebar.firstChild);
            }

            this.tickerElement = textContainer;
            console.log('✅ Event Ticker: Created with scrolling animation');

            // Show initial message
            this.updateTickerDisplay();
        },

        // Check if a date is within an event's range (handles leap years and year boundaries)
        isEventActive(event, now = new Date()) {
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
            const currentDay = now.getDate();

            // Create Date objects for start and end
            let startDate = new Date(currentYear, event.startMonth - 1, event.startDay);
            let endDate = new Date(currentYear, event.endMonth - 1, event.endDay);

            // Handle events that span year boundary (e.g., Dec 15 - Dec 31)
            if (event.endMonth < event.startMonth) {
                // If current month is >= start month, use current year for start and next year for end
                if (currentMonth >= event.startMonth) {
                    endDate = new Date(currentYear + 1, event.endMonth - 1, event.endDay);
                } else {
                    // Otherwise, use previous year for start and current year for end
                    startDate = new Date(currentYear - 1, event.startMonth - 1, event.startDay);
                }
            }

            // Set time to start/end of day for accurate comparison
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            now.setHours(0, 0, 0, 0);

            return now >= startDate && now <= endDate;
        },

        // Get all currently active events
        getActiveEvents() {
            const now = new Date();
            const activeEvents = this.events.filter(event => this.isEventActive(event, now));
            
            // Add Torn birthday if it's today
            if (this.isTornBirthdayToday()) {
                const years = this.getYearsInTorn();
                activeEvents.push({
                    name: "Your Torn Birthday",
                    feature: "Personal celebration",
                    notification: `🎂 Happy Torn Birthday! ${years} year${years !== 1 ? 's' : ''} of mayhem and counting!`,
                    isBirthday: true
                });
            }
            
            return activeEvents;
        },

        // Get upcoming events (within next 7 days)
        getUpcomingEvents(daysAhead = 7) {
            const now = new Date();
            const future = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
            
            const upcomingEvents = this.events.filter(event => {
                const currentYear = now.getFullYear();
                let eventStart = new Date(currentYear, event.startMonth - 1, event.startDay);
                
                // Handle year boundary
                if (eventStart < now) {
                    eventStart = new Date(currentYear + 1, event.startMonth - 1, event.startDay);
                }
                
                return eventStart > now && eventStart <= future;
            });
            
            // Add Torn birthday if it's coming soon
            if (this.isTornBirthdaySoon(daysAhead) && !this.isTornBirthdayToday()) {
                const signupMonth = this.playerSignupDate.getMonth();
                const signupDay = this.playerSignupDate.getDate();
                const birthdayThisYear = new Date(now.getFullYear(), signupMonth, signupDay);
                const birthdayDate = birthdayThisYear < now 
                    ? new Date(now.getFullYear() + 1, signupMonth, signupDay)
                    : birthdayThisYear;
                
                const daysUntil = Math.floor((birthdayDate - now) / (1000 * 60 * 60 * 24));
                const years = this.getYearsInTorn() + 1; // Next anniversary
                
                upcomingEvents.push({
                    name: "Your Torn Birthday",
                    feature: `${years} years in Torn`,
                    notification: `Your Torn anniversary is coming up!`,
                    isBirthday: true,
                    daysUntil: daysUntil
                });
            }
            
            return upcomingEvents;
        },

        updateTickerDisplay() {
            if (!this.tickerElement) return;

            const activeEvents = this.getActiveEvents();
            const upcomingEvents = this.getUpcomingEvents(3);

            let displayText = '';
            let iconEmoji = '🎪';

            if (activeEvents.length > 0) {
                // Show active event with notification text
                const event = activeEvents[this.currentEventIndex % activeEvents.length];
                
                // Special handling for birthday events
                if (event.isBirthday) {
                    displayText = event.notification;
                    iconEmoji = '🎂';
                } else {
                    displayText = `🔴 LIVE: ${event.notification}`;
                    iconEmoji = '🔴';
                }
                
                // Update icon
                const iconContainer = this.tickerElement.parentElement.querySelector('div');
                if (iconContainer) iconContainer.innerHTML = iconEmoji;
                
            } else if (upcomingEvents.length > 0) {
                // Show upcoming event
                const event = upcomingEvents[0];
                
                // Special handling for birthday events
                if (event.isBirthday && event.daysUntil !== undefined) {
                    const daysText = event.daysUntil === 0 ? 'tomorrow' : 
                                    event.daysUntil === 1 ? 'in 1 day' : 
                                    `in ${event.daysUntil} days`;
                    displayText = `🎂 Your Torn Birthday is ${daysText}! (${event.feature})`;
                    iconEmoji = '🎂';
                } else {
                    const daysUntil = this.getDaysUntil(event);
                    displayText = `📅 Coming ${daysUntil === 0 ? 'tomorrow' : `in ${daysUntil + 1} days`}: ${event.name} - ${event.feature}`;
                    iconEmoji = '📅';
                }
                
                // Update icon
                const iconContainer = this.tickerElement.parentElement.querySelector('div');
                if (iconContainer) iconContainer.innerHTML = iconEmoji;
                
            } else {
                // No events - show generic message
                displayText = '✨ No events active - Stay sharp, stay violent';
                iconEmoji = '✨';
                
                // Update icon
                const iconContainer = this.tickerElement.parentElement.querySelector('div');
                if (iconContainer) iconContainer.innerHTML = iconEmoji;
            }

            // Update text (animation restarts automatically)
            this.tickerElement.textContent = displayText;
        },

        getDaysUntil(event) {
            const now = new Date();
            const currentYear = now.getFullYear();
            let eventStart = new Date(currentYear, event.startMonth - 1, event.startDay);
            
            // Handle year boundary
            if (eventStart < now) {
                eventStart = new Date(currentYear + 1, event.startMonth - 1, event.startDay);
            }
            
            const diffTime = eventStart - now;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        },

        startRotation() {
            // Update ticker every 8 seconds
            this.rotationInterval = setInterval(() => {
                const activeEvents = this.getActiveEvents();
                
                if (activeEvents.length > 1) {
                    // Rotate through active events
                    this.currentEventIndex++;
                }
                
                this.updateTickerDisplay();
            }, 8000);

            console.log('✅ Event Ticker: Rotation started (8s interval)');
        },

        stopRotation() {
            if (this.rotationInterval) {
                clearInterval(this.rotationInterval);
                this.rotationInterval = null;
            }
        },

        destroy() {
            this.stopRotation();
            if (this.tickerElement && this.tickerElement.parentElement) {
                this.tickerElement.parentElement.remove();
            }
        }
    };

    // Register module
    if (!window.SidekickModules) {
        window.SidekickModules = {};
    }
    window.SidekickModules.EventTicker = EventTicker;

    console.log('✅ Event Ticker Module loaded');
})();
