# 🎯 Sidekick - Ultimate Torn.com Sidebar Enhancement# Sidekick v6.0.0 - Central Controller



> A comprehensive, modular userscript that adds a powerful sidebar to Torn.com with essential tools and features for enhanced gameplay.## 🚀 Current Active Script



![Version](https://img.shields.io/badge/version-5.44.0-blue.svg)**ONLY USE THIS SCRIPT:** `Sidekick-Modular-Central-Controller.user.js` (v6.0.0)

![Status](https://img.shields.io/badge/status-stable-green.svg)

![License](https://img.shields.io/badge/license-MIT-orange.svg)## ✅ What's Included



## 📖 Overview- **Central Controller v6.0.0**: The new conflict-free script that manages all modules

- **Modular Architecture**: All functionality separated into modules in `/src/modules/`

**Sidekick** is an all-in-one Tampermonkey userscript that provides a sleek, customizable sidebar for Torn.com. It eliminates the need for multiple scripts by consolidating essential features into a single, modular system powered by CDN-hosted modules for easy updates and maintenance.- **Conflict Resolution**: Automatically detects and prevents inline script conflicts



## ✨ Core Features## 🚫 Scripts Removed (No Longer Needed)



### 📝 **Notepad System**- 

- Create unlimited floating notepads- 

- Drag-and-drop grouping with stacked navigation

- Resizable panels with persistent size/position## 📦 Installation Instructions

- Color coding for organization

- Full markdown support1. **Install in Tampermonkey**: `Sidekick-Modular-Central-Controller.user.js`

2. **Disable any old Sidekick scripts** you may have installed

### ✅ **Todo List Manager**3. **Visit Torn.com** and check console for: `🚀 SIDEKICK CENTRAL CONTROLLER v6.0.0 - STARTING`

- Track tasks with checkboxes

- Persistent across sessions## 🎯 Features

- Clean, organized interface

- Quick add/remove functionality- **AutoGym Toggle**: State persistence with GM_setValue/GM_getValue

- **Conflict Prevention**: Blocks inline script interference

### ⏰ **Custom Timers**- **Emergency Fallback**: Guaranteed sidebar creation

- Set custom countdown timers with days/hours/minutes- **Modular Design**: All modules load independently

- Visual countdown display- **Self-Healing**: Automatic conflict detection and resolution

- Persistent timer state

- Audio/visual alerts on completion## 📊 Version Info



### 🏋️ **Gym Blocker**- **Current Version**: 6.0.0

- Prevent accidental training while energy stacking- **Commit Hash**: 80448a9

- Toggle on/off from settings- **Status**: Production Ready ✅

- Full-screen overlay with custom image

- Automatic persistence across page loads---



### ✈️ **Travel Tools**One stop sidepanel for torn with all the tools you need. Eliminate the need for multiple scripts with different API or the travel to other sites for information.

- **Travel Blocker**: Prevents travel that conflicts with OC timing
- **Plane Replacer**: Custom plane departure/arrival graphics
- **Travel Tracker**: Monitor travel status and timing

### ⚔️ **Attack List**
- Manage favorite targets
- Quick access to attack links
- Persistent storage

### 🔗 **Link Groups**
- Organize frequently used links
- Customizable categories
- One-click access

### 🎯 **Random Target Generator**
- Free-floating, movable panel
- Generate random attack targets
- Level range filtering

### ⏱️ **Chain Timer**
- Monitor chain timeout countdown
- Configurable alert thresholds
- Visual screen flash and popup alerts
- Movable floating interface
- Toggle on/off from settings

### 🔧 **Settings Panel**
- Centralized configuration
- Toggle features on/off
- API key management
- Import/export data
- Clear all data option

## 🎨 User Interface

- **Collapsible Sidebar**: Sleek design that doesn't interfere with Torn's UI
- **Resizable Panels**: Adjust panel sizes to your preference
- **Drag & Drop**: Move floating elements anywhere on screen
- **Dark Theme**: Matches Torn's aesthetic
- **Responsive Design**: Works on all screen sizes

## 🚀 Installation

### Prerequisites
- [Tampermonkey](https://www.tampermonkey.net/) browser extension

### Steps
1. Install Tampermonkey for your browser
2. Click on the Tampermonkey icon → "Create a new script"
3. Copy the contents of `Sidekick-Modular-Clean.user.js`
4. Paste into the editor and save
5. Visit [Torn.com](https://www.torn.com)
6. Look for the Sidekick sidebar on the right side of the page

## ⚙️ Configuration

### API Key Setup
1. Get your Torn API key from: https://www.torn.com/preferences.php#tab=api
2. Click the Settings (⚙️) button in the Sidekick sidebar
3. Paste your API key and save

### Feature Toggles
Access the Settings panel to enable/disable:
- ✈️ Travel Blocker
- 🏋️ Training Blocker  
- 🎯 Random Target Generator
- ⏱️ Chain Timer
- 🔔 Notification Sounds
- 🔄 Auto-redirect options

## 📦 Architecture

Sidekick uses a **modular CDN architecture** for reliability and easy updates:

```
Sidekick
├── Main Script (sidekick-modular-clean.user.js)
└── CDN Modules (@jsdelivr)
    ├── core.module.js        - Core functionality & storage
    ├── ui.module.js          - Sidebar UI management
    ├── settings.module.js    - Settings panel
    ├── notepad.module.js     - Notepad system
    ├── todolist.module.js    - Todo list
    ├── timer.module.js       - Custom timers
    ├── clock.module.js       - Clock display
    ├── blocktraining.module.js - Gym blocker
    ├── travel-blocker.module.js - Travel blocker
    ├── chain-timer.module.js - Chain timer
    ├── attacklist.module.js  - Attack list
    ├── linkgroup.module.js   - Link groups
    ├── randomtarget.module.js - Random target
    └── ... more modules
```

### Benefits of CDN Architecture
- ✅ Instant updates without script reinstallation
- ✅ Reduced script size
- ✅ Modular development
- ✅ Easy to add new features
- ✅ Reliable jsdelivr CDN hosting

## 🛠️ Development

### File Structure
```
Sidekick-Script/
├── Sidekick-Modular-Clean.user.js  # Main userscript
├── README.md                        # This file
├── LICENSE.txt                      # MIT License
└── src/
    ├── modules/                     # All feature modules
    │   ├── core.module.js
    │   ├── ui.module.js
    │   └── ...
    └── assets/                      # Images & resources
        ├── icons/
        └── images/
```

### Adding New Features
1. Create new module in `/src/modules/`
2. Follow existing module pattern
3. Export to `window.SidekickModules`
4. Add @require to main script
5. Commit and CDN will auto-update

## 🐛 Troubleshooting

### Sidebar Not Appearing
1. Check browser console (F12) for errors
2. Verify Tampermonkey is enabled
3. Make sure script is active for `*.torn.com`
4. Hard refresh the page (Ctrl+F5)

### Features Not Working
1. Check Settings panel - feature might be toggled off
2. Verify API key is set correctly
3. Check console for module loading errors
4. Clear browser cache and reload

### Module Loading Errors
The script includes automatic CDN diagnostics. Check console for:
- `✅ Module: CDN accessible` - Module loaded successfully
- `❌ Module: CDN failed` - Module failed to load

## 📝 License

MIT License - See [LICENSE.txt](LICENSE.txt) for details

## 👥 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 🔗 Links

- **Repository**: [GitHub - Sidekick-v.2](https://github.com/Machiacelli/Sidekick-v.2)
- **Issues**: [Report a Bug](https://github.com/Machiacelli/Sidekick-v.2/issues)

## 📊 Version History

Current Version: **5.44.0**
- Latest Commit: `b72300b`
- Last Updated: October 28, 2025

For detailed changelog, see [GitHub Commits](https://github.com/Machiacelli/Sidekick-v.2/commits/master)

---

**Made with ❤️ for the Torn community**

*Disclaimer: This is a third-party userscript and is not officially affiliated with Torn.com*