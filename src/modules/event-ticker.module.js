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
        
        // Nearest event timer data
        tornEvents: null,
        nearestEvent: null,
        userEventStartTime: null,
        lastApiUpdate: 0,
        apiUpdateInterval: 1800, // 30 minutes in seconds
        countdownInterval: null,

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
            
            // Fetch nearest event from Torn calendar
            this.fetchNearestEvent();
            
            // Start countdown timer
            this.startCountdown();
            
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
                }
                
                // Also fetch user's event start time for countdown
                if (data.calendar && data.calendar.start_time) {
                    this.userEventStartTime = data.calendar.start_time.toLowerCase().split(" tct")[0];
                    GM_setValue('userEventStartTime', this.userEventStartTime);
                    console.log('⏰ Event Ticker: User event start time:', this.userEventStartTime);
                }
                
                this.playerBirthdayChecked = true;
            } catch (error) {
                console.error('❌ Event Ticker: Failed to fetch player birthday:', error);
                this.playerBirthdayChecked = true;
            }
        },

        async fetchNearestEvent() {
            try {
                const currentTime = Math.round(Date.now() / 1000);
                const cachedEvents = GM_getValue('torn_events', null);
                const lastUpdate = GM_getValue('torn_events_update', 0);
                
                // Check if we need to update (30 min interval)
                if (cachedEvents && (currentTime - lastUpdate) < this.apiUpdateInterval) {
                    this.tornEvents = cachedEvents;
                    this.calculateNearestEvent();
                    return;
                }
                
                console.log('🔄 Event Ticker: Fetching Torn calendar from API...');
                const apiKey = await this.core.getApiKey();
                
                if (!apiKey) {
                    console.log('⚠️ Event Ticker: No API key for calendar fetch');
                    return;
                }
                
                const response = await fetch(`https://api.torn.com/v2/torn/?selections=calendar&key=${apiKey}`);
                const data = await response.json();
                
                if (data.error) {
                    console.error('❌ Event Ticker: Calendar API error:', data.error);
                    return;
                }
                
                if (data.calendar) {
                    let events = data.calendar.events || [];
                    if (data.calendar.competitions) {
                        events = events.concat(data.calendar.competitions);
                    }
                    
                    this.tornEvents = events;
                    GM_setValue('torn_events', events);
                    GM_setValue('torn_events_update', currentTime);
                    
                    console.log(`✅ Event Ticker: Fetched ${events.length} Torn events`);
                    this.calculateNearestEvent();
                }
            } catch (error) {
                console.error('❌ Event Ticker: Failed to fetch calendar:', error);
            }
        },

        calculateNearestEvent() {
            if (!this.tornEvents || this.tornEvents.length === 0) return;
            
            const currentTime = Math.round(Date.now() / 1000);
            let upcomingEvents = [];
            
            for (let event of this.tornEvents) {
                const diff = event.start - currentTime;
                if (diff >= 0) {
                    upcomingEvents.push({...event, diff: diff});
                }
            }
            
            if (upcomingEvents.length === 0) {
                this.nearestEvent = null;
                return;
            }
            
            // Sort by time difference
            upcomingEvents.sort((a, b) => a.diff - b.diff);
            this.nearestEvent = upcomingEvents[0];
            
            console.log('⏱️ Event Ticker: Next event:', this.nearestEvent.title, 'in', this.formatCountdown(this.nearestEvent.diff));
        },

        formatCountdown(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            if (days > 0) {
                return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        },

        startCountdown() {
            // Update countdown every second
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
            }
            
            this.countdownInterval = setInterval(() => {
                if (this.nearestEvent) {
                    const currentTime = Math.round(Date.now() / 1000);
                    const timeUntil = this.nearestEvent.start - currentTime;
                    
                    if (timeUntil <= 0) {
                        // Event started, fetch new data
                        this.fetchNearestEvent();
                    }
                }
            }, 1000);
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

            // Wait for ticker placeholder
            const placeholder = document.getElementById('sidekick-ticker-placeholder');
            if (!placeholder) {
                console.warn('⚠️ Event Ticker: Placeholder not found, retrying...');
                setTimeout(() => this.createTicker(), 200);
                return;
            }

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

            // Calculate animation delay to sync across tabs
            // Sync to the minute so all tabs start at the same point in the 20s cycle
            const now = new Date();
            const secondsIntoMinute = now.getSeconds() + (now.getMilliseconds() / 1000);
            const cyclePosition = secondsIntoMinute % 20; // Position within 20s cycle
            const animationDelay = -cyclePosition; // Negative delay to sync

            // Create seamless ticker container (no borders, background matches topbar)
            const ticker = document.createElement('div');
            ticker.id = 'sidekick-event-ticker';
            ticker.style.cssText = `
                display: flex;
                align-items: center;
                width: 100%;
                overflow: hidden;
                position: relative;
                min-height: 20px;
                transform: translateX(-100px);
            `;

            // Scrolling wrapper for overflow control (no icon, just text)
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
                color: #ccc;
                font-size: 11px;
                white-space: nowrap;
                display: inline-block;
                padding-left: 100%;
                animation-delay: ${animationDelay}s;
            `;

            scrollWrapper.appendChild(textContainer);
            ticker.appendChild(scrollWrapper);

            // Insert into placeholder (seamless integration)
            placeholder.appendChild(ticker);

            this.tickerElement = textContainer;
            console.log('✅ Event Ticker: Created seamlessly in top bar (synced animation)');

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

            // Priority 1: Show nearest API event countdown if available
            if (this.nearestEvent) {
                const currentTime = Math.round(Date.now() / 1000);
                const timeUntil = this.nearestEvent.start - currentTime;
                
                if (timeUntil > 0) {
                    displayText = `⏰ Next Event: ${this.nearestEvent.title} in ${this.formatCountdown(timeUntil)}`;
                    iconEmoji = '⏰';
                    
                    // Update text
                    this.tickerElement.textContent = displayText;
                    return;
                }
            }

            // Priority 2: Active events
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
                
            } else if (upcomingEvents.length > 0) {
                // Priority 3: Show upcoming event
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
                
            } else {
                // No events - show generic message
                displayText = '✨ No events active - Stay sharp, stay violent';
                iconEmoji = '✨';
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
