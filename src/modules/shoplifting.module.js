// Shoplifting Monitor Module
// Monitors shop security status and sends notifications when security is low

(function() {
    'use strict';

    // Ensure SidekickModules exists
    if (typeof window.SidekickModules === 'undefined') {
        window.SidekickModules = {};
    }

    const { saveState, loadState, NotificationSystem, ApiSystem } = window.SidekickModules.Core || {};

    window.SidekickModules.Shoplifting = {
        name: 'Shoplifting',
        monitoringInterval: null,
        
        init() {
            console.log('🏪 Initializing Shoplifting Monitor module...');
            
            // Wait for Core module to be available
            if (!window.SidekickModules.Core) {
                setTimeout(() => this.init(), 100);
                return;
            }
            
            // Start monitoring if enabled
            const enabled = this.isEnabled();
            if (enabled) {
                this.startMonitoring();
            }
            
            console.log('✅ Shoplifting Monitor module initialized');
        },

        // Configuration Methods
        isEnabled() {
            return loadState('shoplifting.enabled', false);
        },

        setEnabled(enabled) {
            saveState('shoplifting.enabled', enabled);
            if (enabled) {
                this.startMonitoring();
            } else {
                this.stopMonitoring();
            }
        },

        getApiKey() {
            return loadState('shoplifting.apiKey', '');
        },

        setApiKey(apiKey) {
            saveState('shoplifting.apiKey', apiKey);
        },

        getSettings() {
            return {
                enabled: loadState('shoplifting.enabled', false),
                apiKey: loadState('shoplifting.apiKey', ''),
                soundEnabled: loadState('shoplifting.soundEnabled', true),
                autoRedirect: loadState('shoplifting.autoRedirect', false),
                checkInterval: loadState('shoplifting.checkInterval', 1),
                alerts: loadState('shoplifting.alerts', {})
            };
        },

        updateSettings(settings) {
            Object.entries(settings).forEach(([key, value]) => {
                saveState(`shoplifting.${key}`, value);
            });
            
            // Restart monitoring if enabled
            if (settings.enabled) {
                this.startMonitoring();
            } else {
                this.stopMonitoring();
            }
        },

        // Shop Configuration
        getShopList() {
            return [
                { id: 'sweet-shop', name: '🍭 Sweet Shop', district: 'Red Light' },
                { id: 'clothes-shop', name: '👕 Clothes Shop', district: 'Red Light' },
                { id: 'cyber-force', name: '💻 Cyber Force', district: 'Red Light' },
                { id: 'super-store', name: '🛒 Super Store', district: 'Downtown' },
                { id: 'big-als', name: '🏪 Big Al\'s Gun Shop', district: 'Downtown' },
                { id: 'jewelry', name: '💎 Jewelry Store', district: 'City Center' },
                { id: 'pawn-shop', name: '🏛️ Pawn Shop', district: 'Historical' }
            ];
        },

        getShopAlerts() {
            return loadState('shoplifting.alerts', {});
        },

        setShopAlert(shopId, enabled) {
            const alerts = this.getShopAlerts();
            alerts[shopId] = enabled;
            saveState('shoplifting.alerts', alerts);
        },

        // API Methods
        async testApiConnection() {
            const apiKey = this.getApiKey();
            if (!apiKey) {
                throw new Error('Please enter a shoplifting API key first');
            }
            
            try {
                const response = await fetch(`https://api.torn.com/user/?selections=shoplifting&key=${apiKey}`);
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error.error);
                }
                
                if (data.shoplifting) {
                    return { success: true, message: 'Shoplifting API test successful!' };
                } else {
                    return { success: true, message: 'API key works but no shoplifting data available', warning: true };
                }
            } catch (error) {
                console.error('❌ Shoplifting API test failed:', error);
                throw new Error(`Shoplifting API test failed: ${error.message}`);
            }
        },

        // Monitoring Methods
        startMonitoring() {
            this.stopMonitoring(); // Clear any existing interval
            
            const settings = this.getSettings();
            if (!settings.enabled || !settings.apiKey) {
                return;
            }
            
            const checkInterval = settings.checkInterval * 60 * 1000; // Convert to milliseconds
            
            this.monitoringInterval = setInterval(() => {
                this.checkShopliftingSecurity();
            }, checkInterval);
            
            // Check immediately
            this.checkShopliftingSecurity();
            
            console.log('🏪 Shoplifting monitor started');
        },

        stopMonitoring() {
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
                console.log('🏪 Shoplifting monitor stopped');
            }
        },

        async checkShopliftingSecurity() {
            const settings = this.getSettings();
            const { apiKey, alerts } = settings;
            
            if (!apiKey || Object.keys(alerts).length === 0) {
                return;
            }
            
            try {
                const response = await fetch(`https://api.torn.com/user/?selections=shoplifting&key=${apiKey}`);
                const data = await response.json();
                
                if (data.error) {
                    console.error('Shoplifting API error:', data.error);
                    return;
                }
                
                if (data.shoplifting) {
                    this.processShopliftingData(data.shoplifting, alerts);
                }
            } catch (error) {
                console.error('Failed to check shoplifting security:', error);
            }
        },

        processShopliftingData(shopliftingData, alerts) {
            const shopMap = {
                'sweet-shop': 'Sweet Shop',
                'clothes-shop': 'Clothes Shop', 
                'cyber-force': 'Cyber Force',
                'super-store': 'Super Store',
                'big-als': 'Big Al\'s Gun Shop',
                'jewelry': 'Jewelry Store',
                'pawn-shop': 'Pawn Shop'
            };
            
            Object.entries(alerts).forEach(([shopId, enabled]) => {
                if (!enabled) return;
                
                const shopName = shopMap[shopId];
                const shopData = Object.values(shopliftingData).find(shop => 
                    shop.name && shop.name.includes(shopName.replace(/🎭|🍭|👕|💻|🛒|🏪|💎|🏛️/g, '').trim())
                );
                
                if (shopData && shopData.security === 'Low') {
                    this.triggerShopliftingAlert(shopName, shopData);
                }
            });
        },

        triggerShopliftingAlert(shopName, shopData) {
            const settings = this.getSettings();
            const { soundEnabled, autoRedirect } = settings;
            
            // Show notification
            if (NotificationSystem) {
                NotificationSystem.show(
                    '🚨 Low Security Alert!', 
                    `${shopName} security is LOW! Perfect time to shoplift.`, 
                    'warning',
                    10000
                );
            }
            
            // Play sound if enabled
            if (soundEnabled) {
                this.playNotificationSound();
            }
            
            // Auto-redirect if enabled
            if (autoRedirect) {
                setTimeout(() => {
                    window.location.href = 'https://www.torn.com/crimes.php';
                }, 2000);
            }
        },

        playNotificationSound() {
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMhBDiS4/PEeSkEK4rQ8tDEfDMFLYnN8tmHNgcZa7j165pQFQ1QqeHutmMdBj+V4/PHeSUDLYfN8tiIIUgHAwACAAAA');
                audio.volume = 0.3;
                audio.play().catch(console.error);
            } catch (error) {
                console.error('Failed to play notification sound:', error);
            }
        },

        // Utility Methods
        getStatus() {
            return {
                enabled: this.isEnabled(),
                monitoring: this.monitoringInterval !== null,
                apiKey: this.getApiKey() ? 'Set' : 'Not set',
                alertsConfigured: Object.values(this.getShopAlerts()).filter(Boolean).length
            };
        }
    };

    console.log('🏪 Shoplifting module loaded');
})();
