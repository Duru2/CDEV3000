# Traffic Light AI Monitor - Browser Extension

A Chrome/Edge browser extension that monitors student AI usage with a traffic light system (🔴 red, 🟡 yellow, 🟢 green) to help teachers track appropriate AI tool usage.

## Quick Start

### Installation

1. Open Chrome or Edge browser
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top-right)
4. Click **"Load unpacked"**
5. Select the `/browser-extension/` folder
6. Extension installed! 🎉

### Usage

- 🟢 **Green**: Safe browsing, no AI detected
- 🟡 **Yellow**: AI tool in use (caution)
- 🔴 **Red**: AI used on academic platform (prohibited)

## Features

- Real-time AI usage monitoring
- Traffic light badge system
- Activity logging
- Customizable rules
- Settings export/import
- Privacy-focused (local-only processing)

## Files

- `manifest.json` - Extension configuration
- `background.js` - Monitoring service worker
- `content.js` - Page analysis script
- `popup.html/js` - Extension popup UI
- `settings.html/js` - Settings page
- `rules.json` - Default monitoring rules
- `icons/` - Extension icons

## Documentation

See the main [README.md](../README.md) for full documentation and the complete project overview.

## Part of CDEV3000

This browser extension is part of the CDEV3000 AI Governance Efficiency Framework project.
