# 🔄 **TORN API V2 MIGRATION ANALYSIS**

## 📊 **CURRENT API USAGE ANALYSIS**

### **Critical Issues Identified:**

#### **1. API V1 Dependencies** ⚠️
Our project currently uses **Torn API V1** endpoints exclusively:
```javascript
// Current V1 format in settings.module.js
let url = `https://api.torn.com/${endpoint}?key=${apiKey}`;
```

#### **2. New Error Codes (V2 Migration)** 🚨
From TornAPI documentation, new error codes indicate V1/V2 compatibility issues:
- **Error Code 22:** "This selection is only available in API v1"
- **Error Code 23:** "This selection is only available in API v2"
- **Error Code 19:** "Must be migrated to crimes 2.0"

#### **3. API Endpoints Used by Sidekick:**
```javascript
// settings.module.js
await ApiSystem.makeRequest('user/me', 'basic');
await ApiSystem.makeRequest('market?selections=pointsmarket');

// attacklist.module.js  
await window.SidekickModules.Api.makeRequest(`user/${target.id}`, 'basic,profile');

// todolist.module.js
const url = `https://api.torn.com/${section}?selections=${selection}&key=${this.apiKey}`;

// clock.module.js
await fetch(`https://api.torn.com/market/?selections=pointsmarket&key=${this.apiKey}`);

// timer.module.js
await fetch(`https://api.torn.com/user/?selections=cooldowns&key=${apiKey}`);
await fetch(`https://api.torn.com/user/?selections=basic&key=${apiKey}`);

// randomtarget.module.js
const url = `https://api.torn.com/user/${randID}?selections=basic,personalstats&key=${this.config.apiKey}`;

// global-functions.module.js
await window.SidekickModules.Api.makeRequest('user', 'basic');
await window.SidekickModules.Api.makeRequest('market', 'pointsmarket');
```

---

## 🚨 **POTENTIAL BREAKING CHANGES**

### **1. URL Format Changes**
**V1 Format:** `https://api.torn.com/user/123?selections=basic&key=ABC`
**V2 Format:** May require version specification: `https://api.torn.com/v2/user/123?selections=basic&key=ABC`

### **2. Selections Availability** 
Some selections might be:
- **V1 Only:** May become deprecated
- **V2 Only:** New features not available in V1
- **Changed Format:** Same data, different structure

### **3. Response Structure Changes**
V2 might return data in different JSON structure, breaking our parsing logic.

---

## 📋 **COMPATIBILITY REQUIREMENTS**

### **Priority 1: Critical Endpoints** 🔴
1. **User Data:** `user/{id}` with `basic,profile` selections (AttackList module)
2. **User Cooldowns:** `user/` with `cooldowns` selection (Timer module)  
3. **Market Data:** `market/` with `pointsmarket` selection (Clock module)
4. **User Stats:** `user/{id}` with `personalstats` selection (RandomTarget module)

### **Priority 2: Enhanced Features** 🟡
1. **TodoList API Integration:** Generic API calls for task completion detection
2. **Settings API Validation:** User validation calls

---

## 🛠️ **MIGRATION STRATEGY**

### **Phase 1: API Version Detection** ✅ (Next)
1. **Add API version detection logic**
2. **Create dual-compatibility API client**  
3. **Handle new error codes (22, 23, 19)**

### **Phase 2: Endpoint Migration** 📝 (Planning)
1. **Test current endpoints for V2 compatibility**
2. **Update URL formats if needed**
3. **Handle response structure changes**

### **Phase 3: Graceful Fallback** 🔄 (Future)
1. **Implement V1 → V2 fallback logic**
2. **Cache API version capabilities**
3. **User notification for migration issues**

---

## 🔧 **IMPLEMENTATION PLAN**

### **Step 1: Enhanced Error Handling**
```javascript
// Add to settings.module.js ApiSystem
if (data.error) {
    const errorCode = data.error.code;
    
    // Handle V1/V2 specific errors
    if (errorCode === 22) {
        console.warn('Selection only available in API v1, falling back...');
        // Fallback logic
    } else if (errorCode === 23) {
        console.warn('Selection only available in API v2, upgrading...');
        // Upgrade logic  
    } else if (errorCode === 19) {
        console.warn('Must migrate to crimes 2.0');
        // Migration logic
    }
    
    throw new Error(data.error.error || 'API error');
}
```

### **Step 2: Dual API Client**
```javascript
const ApiSystem = {
    apiVersion: 'v1', // Default to v1
    baseUrl: 'https://api.torn.com',
    
    async makeRequest(endpoint, selections = '', retries = 3, forceVersion = null) {
        const version = forceVersion || this.apiVersion;
        let url;
        
        if (version === 'v2') {
            url = `${this.baseUrl}/v2/${endpoint}?key=${apiKey}`;
        } else {
            url = `${this.baseUrl}/${endpoint}?key=${apiKey}`;
        }
        
        // Rest of implementation...
    },
    
    async detectApiVersion() {
        // Test call to determine available API version
    }
};
```

---

## 🎯 **IMMEDIATE ACTIONS NEEDED**

### **🔍 Test Current API Calls**
1. **Validate all existing endpoints still work**
2. **Check for error codes 22, 23, 19**
3. **Document any breaking changes**

### **⚡ Update Error Handling**  
1. **Add new error code handling**
2. **Improve API error messages**
3. **Add fallback mechanisms**

### **🏗️ Future-Proof Architecture**
1. **Design version-agnostic API client**
2. **Add configuration for API version selection**
3. **Create migration path for users**

---

## 📈 **RISK ASSESSMENT**

### **🔴 HIGH RISK:**
- **Timer Module:** Critical cooldown functionality
- **AttackList Module:** Player data fetching
- **Settings Validation:** API key verification

### **🟡 MEDIUM RISK:**
- **Clock Module:** Market data display
- **TodoList Integration:** API-based task completion
- **RandomTarget Module:** Player statistics

### **🟢 LOW RISK:**
- **Core Modules:** No direct API dependencies
- **UI Modules:** Pure frontend functionality

---

## 🚀 **NEXT STEPS**

1. **✅ IMMEDIATE:** Test all current API endpoints for V2 compatibility
2. **🔧 SHORT TERM:** Implement enhanced error handling for new codes
3. **🏗️ MEDIUM TERM:** Create dual-compatibility API system
4. **🎯 LONG TERM:** Full V2 migration with user notification system

**Goal:** Ensure Sidekick continues working seamlessly during Torn's API V2 transition without breaking user experience.
