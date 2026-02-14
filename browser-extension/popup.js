// Traffic Light AI Monitor - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    await updateStatus();
    await updateSnoozeStatus();
    await loadActivityLog();

    // Set up event listeners
    document.getElementById('settingsBtn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await updateStatus();
        await updateSnoozeStatus();
        await loadActivityLog();
    });

    document.getElementById('resetSnoozeBtn').addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ type: 'RESET_SNOOZE' });
        await updateStatus();
        await updateSnoozeStatus();
    });

    // Update countdown every second if snoozed
    setInterval(updateSnoozeStatus, 1000);
});

// Update current status display
async function updateStatus() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab) {
            setStatus('green', 'All Clear', 'No active tab');
            return;
        }

        // Get status from background script
        const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
        const status = response?.status || 'green';

        // Determine display text
        let statusText = 'All Clear';
        let reason = 'No AI usage detected';

        if (status === 'red') {
            statusText = 'Prohibited';
            reason = 'AI usage on academic platform detected';
        } else if (status === 'yellow') {
            statusText = 'Caution';
            reason = 'AI tool detected - use responsibly';
        }

        setStatus(status, statusText, reason);
    } catch (error) {
        console.error('Error updating status:', error);
        setStatus('green', 'Error', 'Could not determine status');
    }
}

// Set status display
function setStatus(status, text, reason) {
    const icons = {
        red: '🔴',
        yellow: '🟡',
        green: '🟢'
    };

    document.getElementById('statusIcon').textContent = icons[status];
    document.getElementById('statusText').textContent = text;
    document.getElementById('statusReason').textContent = reason;
}

// Load activity log
async function loadActivityLog() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVITY_LOG' });
        const log = response?.log || [];

        const activityList = document.getElementById('activityList');

        if (log.length === 0) {
            activityList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">No recent activity</div>
        </div>
      `;
            return;
        }

        // Show last 5 entries
        const recentLog = log.slice(-5).reverse();

        activityList.innerHTML = recentLog.map(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            const url = new URL(entry.url).hostname;

            return `
        <div class="activity-item ${entry.status}">
          <div class="activity-time">${time}</div>
          <div class="activity-url">${url}</div>
          <div class="activity-reason">${entry.reason}</div>
        </div>
      `;
        }).join('');

    } catch (error) {
        console.error('Error loading activity log:', error);
    }
}

// Update snooze status display
async function updateSnoozeStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_SNOOZE_STATUS' });

        const snoozeWarning = document.getElementById('snoozeWarning');
        const violationCounter = document.getElementById('violationCounter');
        const violationCount = document.getElementById('violationCount');

        if (response.isSnoozing) {
            // Show snooze warning
            snoozeWarning.style.display = 'block';
            violationCounter.style.display = 'none';

            // Update countdown
            const remaining = response.snoozeEndTime - Date.now();
            if (remaining > 0) {
                const minutes = Math.floor(remaining / 60000);
                const seconds = Math.floor((remaining % 60000) / 1000);
                document.getElementById('snoozeCountdown').textContent =
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                document.getElementById('snoozeCountdown').textContent = '00:00';
            }
        } else {
            // Hide snooze warning
            snoozeWarning.style.display = 'none';

            // Show violation counter if there are violations
            if (response.redViolationCount > 0) {
                violationCounter.style.display = 'flex';
                violationCount.textContent = `${response.redViolationCount}/${response.violationThreshold}`;
            } else {
                violationCounter.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating snooze status:', error);
    }
}
