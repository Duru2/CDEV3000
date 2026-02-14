// Traffic Light AI Monitor - Settings Script

document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();

    // Event listeners
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
    document.getElementById('resetBtn').addEventListener('click', resetSettings);
    document.getElementById('exportBtn').addEventListener('click', exportSettings);
    document.getElementById('resetSnoozeBtn').addEventListener('click', resetSnooze);
});

// Load settings from storage
async function loadSettings() {
    try {
        const settings = await chrome.storage.local.get([
            'customAIWebsites',
            'customAcademicPlatforms',
            'gradingKeywords',
            'notifyOnRed',
            'notifyOnYellow',
            'snoozeConfig'
        ]);

        // Populate form fields
        if (settings.customAIWebsites) {
            document.getElementById('customAIWebsites').value = settings.customAIWebsites.join('\n');
        }

        if (settings.customAcademicPlatforms) {
            document.getElementById('customAcademicPlatforms').value = settings.customAcademicPlatforms.join('\n');
        }

        if (settings.gradingKeywords) {
            document.getElementById('gradingKeywords').value = settings.gradingKeywords.join(', ');
        }

        document.getElementById('notifyOnRed').checked = settings.notifyOnRed || false;
        document.getElementById('notifyOnYellow').checked = settings.notifyOnYellow || false;

        // Load snooze config
        const snoozeConfig = settings.snoozeConfig || { enabled: true, violationThreshold: 5, snoozeDurationMinutes: 10 };
        document.getElementById('snoozeEnabled').checked = snoozeConfig.enabled;
        document.getElementById('violationThreshold').value = snoozeConfig.violationThreshold;
        document.getElementById('snoozeDuration').value = snoozeConfig.snoozeDurationMinutes;

    } catch (error) {
        console.error('Error loading settings:', error);
        showMessage('Error loading settings', 'error');
    }
}

// Save settings to storage
async function saveSettings() {
    try {
        const customAIWebsites = document.getElementById('customAIWebsites').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const customAcademicPlatforms = document.getElementById('customAcademicPlatforms').value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        const gradingKeywords = document.getElementById('gradingKeywords').value
            .split(',')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0);

        const notifyOnRed = document.getElementById('notifyOnRed').checked;
        const notifyOnYellow = document.getElementById('notifyOnYellow').checked;

        // Get snooze config
        const snoozeConfig = {
            enabled: document.getElementById('snoozeEnabled').checked,
            violationThreshold: parseInt(document.getElementById('violationThreshold').value),
            snoozeDurationMinutes: parseInt(document.getElementById('snoozeDuration').value)
        };

        await chrome.storage.local.set({
            customAIWebsites,
            customAcademicPlatforms,
            gradingKeywords,
            notifyOnRed,
            notifyOnYellow,
            snoozeConfig
        });

        showMessage('✅ Settings saved successfully!', 'success');

        // Reload rules in background script
        chrome.runtime.sendMessage({ type: 'RELOAD_RULES' });

    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage('❌ Error saving settings', 'error');
    }
}

// Reset to default settings
async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
        return;
    }

    try {
        await chrome.storage.local.clear();

        // Clear form fields
        document.getElementById('customAIWebsites').value = '';
        document.getElementById('customAcademicPlatforms').value = '';
        document.getElementById('gradingKeywords').value = '';
        document.getElementById('notifyOnRed').checked = false;
        document.getElementById('notifyOnYellow').checked = false;
        document.getElementById('snoozeEnabled').checked = true;
        document.getElementById('violationThreshold').value = 5;
        document.getElementById('snoozeDuration').value = 10;

        showMessage('✅ Settings reset to defaults', 'success');

        // Reload rules in background script
        chrome.runtime.sendMessage({ type: 'RELOAD_RULES' });

    } catch (error) {
        console.error('Error resetting settings:', error);
        showMessage('❌ Error resetting settings', 'error');
    }
}

// Export settings as JSON
async function exportSettings() {
    try {
        const settings = await chrome.storage.local.get(null);

        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'traffic-light-settings.json';
        link.click();

        URL.revokeObjectURL(url);

        showMessage('✅ Settings exported successfully!', 'success');

    } catch (error) {
        console.error('Error exporting settings:', error);
        showMessage('❌ Error exporting settings', 'error');
    }
}

// Show message to user
function showMessage(message, type) {
    const messageEl = document.getElementById('saveMessage');
    messageEl.textContent = message;
    messageEl.style.display = 'block';

    if (type === 'success') {
        messageEl.style.background = 'var(--color-green-light)';
        messageEl.style.color = 'var(--color-green)';
        messageEl.style.border = '1px solid var(--color-green)';
    } else {
        messageEl.style.background = 'var(--color-red-light)';
        messageEl.style.color = 'var(--color-red)';
        messageEl.style.border = '1px solid var(--color-red)';
    }

    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// Reset current snooze
async function resetSnooze() {
    try {
        await chrome.runtime.sendMessage({ type: 'RESET_SNOOZE' });
        showMessage('✅ Snooze reset successfully!', 'success');
    } catch (error) {
        console.error('Error resetting snooze:', error);
        showMessage('❌ Error resetting snooze', 'error');
    }
}
