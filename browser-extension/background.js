// Traffic Light AI Monitor - Background Service Worker

let rules = {};
let currentStatus = {};
let activityLog = [];

// Snooze feature state
let redViolationCount = 0;
let snoozeEndTime = null;
let isSnoozing = false;
let snoozeConfig = {
    violationThreshold: 5,
    snoozeDurationMinutes: 10,
    enabled: true
};

// Load rules on installation
chrome.runtime.onInstalled.addListener(async () => {
    await loadRules();
    await loadSnoozeState();
    console.log('Traffic Light AI Monitor installed');
});

// Load rules from rules.json
async function loadRules() {
    try {
        const response = await fetch(chrome.runtime.getURL('rules.json'));
        rules = await response.json();

        // Load custom rules from storage if they exist
        const stored = await chrome.storage.local.get('customRules');
        if (stored.customRules) {
            rules = { ...rules, ...stored.customRules };
        }
    } catch (error) {
        console.error('Error loading rules:', error);
    }
}

// Load snooze state from storage
async function loadSnoozeState() {
    try {
        const stored = await chrome.storage.local.get(['redViolationCount', 'snoozeEndTime', 'snoozeConfig']);

        if (stored.redViolationCount !== undefined) {
            redViolationCount = stored.redViolationCount;
        }

        if (stored.snoozeEndTime) {
            snoozeEndTime = stored.snoozeEndTime;
            // Check if snooze is still active
            if (snoozeEndTime > Date.now()) {
                isSnoozing = true;
                scheduleSnoozeEnd();
            } else {
                // Snooze expired while extension was inactive
                resetSnooze();
            }
        }

        if (stored.snoozeConfig) {
            snoozeConfig = { ...snoozeConfig, ...stored.snoozeConfig };
        }
    } catch (error) {
        console.error('Error loading snooze state:', error);
    }
}

// Save snooze state to storage
async function saveSnoozeState() {
    try {
        await chrome.storage.local.set({
            redViolationCount,
            snoozeEndTime,
            snoozeConfig
        });
    } catch (error) {
        console.error('Error saving snooze state:', error);
    }
}

// Monitor tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        evaluateTab(tabId, tab.url);
    }
});

// Monitor active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
        evaluateTab(activeInfo.tabId, tab.url);
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PAGE_CONTEXT') {
        handlePageContext(sender.tab.id, sender.tab.url, message.data);
    } else if (message.type === 'GET_STATUS') {
        sendResponse({ status: currentStatus[sender.tab.id] || 'green' });
    } else if (message.type === 'ANALYZE_MESSAGE') {
        handleMessageAnalysis(sender.tab.id, message.data);
        sendResponse({ success: true });
    } else if (message.type === 'GET_ACTIVITY_LOG') {
        sendResponse({ log: activityLog.slice(-50) }); // Last 50 entries
    } else if (message.type === 'GET_SNOOZE_STATUS') {
        sendResponse({
            isSnoozing,
            snoozeEndTime,
            redViolationCount,
            violationThreshold: snoozeConfig.violationThreshold
        });
    } else if (message.type === 'RESET_SNOOZE') {
        resetSnooze();
        sendResponse({ success: true });
    } else if (message.type === 'BLOCK_ENDED') {
        resetSnooze();
        sendResponse({ success: true });
    } else if (message.type === 'GET_COUNTERS') {
        chrome.storage.local.get(['colorCounters'], (result) => {
            sendResponse({ counters: result.colorCounters || { green: 0, yellow: 0, red: 0 } });
        });
        return true;
    }
    return true;
});

// Evaluate tab and determine traffic light status
async function evaluateTab(tabId, url) {
    // Check if currently snoozed
    if (isSnoozing && snoozeConfig.enabled) {
        const isAIWebsite = checkAIWebsite(url);
        if (isAIWebsite) {
            // Block AI website access during snooze
            chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html') });
            return;
        }
    }

    const isAIWebsite = checkAIWebsite(url);
    const isAcademicPlatform = checkAcademicPlatform(url);

    let status = 'green';
    let reason = 'No AI usage detected';

    if (isAIWebsite && isAcademicPlatform) {
        status = 'red';
        reason = `Using ${isAIWebsite.name} on ${isAcademicPlatform.name}`;

        // Increment violation counter
        if (snoozeConfig.enabled) {
            redViolationCount++;
            await saveSnoozeState();

            // Check if threshold reached
            if (redViolationCount >= snoozeConfig.violationThreshold) {
                activateSnooze();
                return; // Exit early, snooze will handle the redirect
            }
        }
    } else if (isAIWebsite) {
        status = 'yellow';
        reason = `Using ${isAIWebsite.name}`;
        // Reset violation count on non-red status
        if (redViolationCount > 0) {
            redViolationCount = 0;
            await saveSnoozeState();
        }
    } else {
        // Reset violation count on green status
        if (redViolationCount > 0) {
            redViolationCount = 0;
            await saveSnoozeState();
        }
    }

    currentStatus[tabId] = status;
    updateBadge(tabId, status);
    logActivity(tabId, url, status, reason);
}

// Check if URL matches AI website patterns
function checkAIWebsite(url) {
    if (!rules.aiWebsites) return null;

    for (const site of rules.aiWebsites) {
        if (matchPattern(url, site.pattern)) {
            return site;
        }
    }
    return null;
}

// Check if URL matches academic platform patterns
function checkAcademicPlatform(url) {
    if (!rules.academicPlatforms) return null;

    for (const platform of rules.academicPlatforms) {
        if (matchPattern(url, platform.pattern)) {
            return platform;
        }
    }
    return null;
}

// Match URL against pattern (simplified version)
function matchPattern(url, pattern) {
    // Convert pattern to regex
    const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\./g, '\\.');

    const regex = new RegExp('^' + regexPattern + '$');
    return regex.test(url);
}

// Update badge color and text
function updateBadge(tabId, status) {
    // Override with snooze badge if snoozed
    if (isSnoozing) {
        chrome.action.setBadgeBackgroundColor({ color: '#6B7280', tabId });
        chrome.action.setBadgeText({ text: '⏸️', tabId });
        return;
    }

    const colors = {
        red: '#DC2626',
        yellow: '#FBBF24',
        green: '#10B981'
    };

    const symbols = {
        red: '🔴',
        yellow: '🟡',
        green: '🟢'
    };

    chrome.action.setBadgeBackgroundColor({ color: colors[status], tabId });
    chrome.action.setBadgeText({ text: symbols[status], tabId });
}

// Log activity
function logActivity(tabId, url, status, reason) {
    const entry = {
        timestamp: new Date().toISOString(),
        tabId,
        url,
        status,
        reason
    };

    activityLog.push(entry);

    // Keep only last 100 entries
    if (activityLog.length > 100) {
        activityLog = activityLog.slice(-100);
    }

    // Save to storage
    chrome.storage.local.set({ activityLog });
}

// Handle message analysis from content script
async function handleMessageAnalysis(tabId, data) {
    const { text, status, timestamp, platform } = data;

    console.log('[Background] Message analyzed:', status, 'on', platform);

    // Load current counters
    const result = await chrome.storage.local.get(['colorCounters', 'counterTimestamps']);
    let counters = result.colorCounters || { green: 0, yellow: 0, red: 0 };
    let timestamps = result.counterTimestamps || { green: [], yellow: [], red: [] };

    // Remove counts older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    for (const color of ['green', 'yellow', 'red']) {
        timestamps[color] = timestamps[color].filter(ts => ts > thirtyDaysAgo);
        counters[color] = timestamps[color].length;
    }

    // Add new count
    timestamps[status].push(timestamp);
    counters[status]++;

    // Save updated counters
    await chrome.storage.local.set({ colorCounters: counters, counterTimestamps: timestamps });

    // Log activity
    logActivity(tabId, window.location?.href || 'AI Chat', status,
        `${status.toUpperCase()} message detected: "${text.substring(0, 50)}..."`);

    // Check for red violation threshold
    if (status === 'red' && counters.red >= 5 && snoozeConfig.enabled && !isSnoozing) {
        // Activate snooze
        activateChatBlock(tabId);
    }

    // Send update to widget
    chrome.tabs.sendMessage(tabId, {
        type: 'UPDATE_STATUS',
        status: status,
        counters: counters
    }).catch(() => {
        // Widget might not be loaded yet, ignore error
    });
}

// Activate chat blocking
async function activateChatBlock(tabId) {
    isSnoozing = true;
    snoozeEndTime = Date.now() + (snoozeConfig.snoozeDurationMinutes * 60 * 1000);

    await saveSnoozeState();

    // Notify tab to show blocking overlay
    chrome.tabs.sendMessage(tabId, {
        type: 'ACTIVATE_BLOCK',
        endTime: snoozeEndTime
    }).catch(() => {
        console.log('[Background] Could not send block message to tab');
    });

    // Show notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Chat Blocked - 5 Red Violations',
        message: `AI chat access blocked for ${snoozeConfig.snoozeDurationMinutes} minutes due to repeated inappropriate usage.`,
        priority: 2
    });

    // Schedule auto-unblock
    setTimeout(() => {
        deactivateChatBlock(tabId);
    }, snoozeConfig.snoozeDurationMinutes * 60 * 1000);
}

// Deactivate chat blocking
async function deactivateChatBlock(tabId) {
    isSnoozing = false;
    snoozeEndTime = null;

    await saveSnoozeState();

    // Notify tab to remove blocking overlay
    chrome.tabs.sendMessage(tabId, {
        type: 'DEACTIVATE_BLOCK'
    }).catch(() => {
        console.log('[Background] Could not send unblock message to tab');
    });

    // Show notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Chat Unblocked',
        message: 'AI chat access has been restored. Please use AI tools responsibly.',
        priority: 1
    });
}

// Handle page context updates from content script
function handlePageContext(tabId, url, context) {
    const currentTab = currentStatus[tabId];

    // If we detect grading keywords on an AI website, escalate to red
    if (context.hasGradingKeywords && checkAIWebsite(url)) {
        currentStatus[tabId] = 'red';
        updateBadge(tabId, 'red');
        logActivity(tabId, url, 'red', 'AI usage detected on grading/submission page');
    }
}

// Activate snooze mode
function activateSnooze() {
    isSnoozing = true;
    snoozeEndTime = Date.now() + (snoozeConfig.snoozeDurationMinutes * 60 * 1000);

    // Save state
    saveSnoozeState();

    // Show notification
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'AI Access Blocked',
        message: `Snooze activated for ${snoozeConfig.snoozeDurationMinutes} minutes due to repeated violations.`,
        priority: 2
    });

    // Update all tabs badges
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            updateBadge(tab.id, 'snooze');
        });
    });

    // Schedule snooze end
    scheduleSnoozeEnd();
}

// Schedule snooze end timer
function scheduleSnoozeEnd() {
    const remainingTime = snoozeEndTime - Date.now();

    if (remainingTime > 0) {
        setTimeout(() => {
            resetSnooze();
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Snooze Ended',
                message: 'AI access has been restored. Please use AI tools responsibly.',
                priority: 1
            });
        }, remainingTime);
    }
}

// Reset snooze state
async function resetSnooze() {
    isSnoozing = false;
    snoozeEndTime = null;
    redViolationCount = 0;

    await saveSnoozeState();

    // Update all tabs badges
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            if (tab.url) {
                evaluateTab(tab.id, tab.url);
            }
        });
    });
}
