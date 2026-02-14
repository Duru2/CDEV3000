// Traffic Light Widget - UI Component

class TrafficLightWidget {
    constructor() {
        this.widget = null;
        this.currentStatus = 'green';
        this.counters = { green: 0, yellow: 0, red: 0 };
        this.isBlocked = false;
        this.blockEndTime = null;
        this.timerInterval = null;

        this.init();
    }

    init() {
        // Create widget DOM
        this.createWidget();

        // Load saved state
        this.loadState();

        // Listen for updates from background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'UPDATE_STATUS') {
                this.updateStatus(message.status, message.counters);
            } else if (message.type === 'ACTIVATE_BLOCK') {
                this.activateBlock(message.endTime);
            } else if (message.type === 'DEACTIVATE_BLOCK') {
                this.deactivateBlock();
            }
        });

        // Check if currently blocked
        this.checkBlockStatus();
    }

    createWidget() {
        // Create widget container
        this.widget = document.createElement('div');
        this.widget.className = 'tl-widget';
        this.widget.innerHTML = `
            <div class="tl-widget-header">
                <div class="tl-widget-icon">🟢</div>
                <div class="tl-widget-title">AI Monitor</div>
                <div class="tl-widget-status tl-status-green">Safe</div>
            </div>
            <div class="tl-widget-counters">
                <div class="tl-counter-row">
                    <div class="tl-counter-label">
                        <span>🟢</span>
                        <span>Green</span>
                    </div>
                    <div class="tl-counter-value tl-counter-green">0</div>
                </div>
                <div class="tl-counter-row">
                    <div class="tl-counter-label">
                        <span>🟡</span>
                        <span>Yellow</span>
                    </div>
                    <div class="tl-counter-value tl-counter-yellow">0</div>
                </div>
                <div class="tl-counter-row tl-counter-red">
                    <div class="tl-counter-label">
                        <span>🔴</span>
                        <span>Red</span>
                    </div>
                    <div class="tl-counter-value">0/5</div>
                </div>
            </div>
        `;

        // Inject CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = chrome.runtime.getURL('traffic-light-widget.css');
        document.head.appendChild(link);

        // Add to page
        document.body.appendChild(this.widget);
    }

    async loadState() {
        const result = await chrome.storage.local.get(['counters', 'blockEndTime']);

        if (result.counters) {
            this.counters = result.counters;
            this.updateCounterDisplay();
        }

        if (result.blockEndTime && result.blockEndTime > Date.now()) {
            this.activateBlock(result.blockEndTime);
        }
    }

    updateStatus(status, counters) {
        this.currentStatus = status;
        if (counters) {
            this.counters = counters;
        }

        // Update icon
        const icons = {
            green: '🟢',
            yellow: '🟡',
            red: '🔴'
        };

        const statusTexts = {
            green: 'Safe',
            yellow: 'Caution',
            red: 'Violation'
        };

        const statusClasses = {
            green: 'tl-status-green',
            yellow: 'tl-status-yellow',
            red: 'tl-status-red'
        };

        this.widget.querySelector('.tl-widget-icon').textContent = icons[status];

        const statusEl = this.widget.querySelector('.tl-widget-status');
        statusEl.textContent = statusTexts[status];
        statusEl.className = 'tl-widget-status ' + statusClasses[status];

        // Update counters
        this.updateCounterDisplay();

        // Shake animation on red
        if (status === 'red') {
            this.widget.classList.add('shake');
            setTimeout(() => this.widget.classList.remove('shake'), 500);
        }
    }

    updateCounterDisplay() {
        this.widget.querySelector('.tl-counter-green').textContent = this.counters.green;
        this.widget.querySelector('.tl-counter-yellow').textContent = this.counters.yellow;
        this.widget.querySelector('.tl-counter-red .tl-counter-value').textContent =
            `${this.counters.red}/5`;
    }

    activateBlock(endTime) {
        this.isBlocked = true;
        this.blockEndTime = endTime;

        // Create blocking overlay
        const overlay = document.createElement('div');
        overlay.className = 'tl-block-overlay';
        overlay.id = 'tl-block-overlay';
        overlay.innerHTML = `
            <div class="tl-block-content">
                <div class="tl-block-icon">⏸️</div>
                <div class="tl-block-title">Chat Blocked</div>
                <div class="tl-block-message">
                    You have reached 5 red violations.<br>
                    AI chat access is temporarily blocked.
                </div>
                <div class="tl-block-timer">
                    <div class="tl-block-timer-label">Time Remaining</div>
                    <div class="tl-block-timer-value" id="tl-block-timer">10:00</div>
                </div>
                <div class="tl-block-reason">
                    Please use AI tools responsibly for learning, not cheating.
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Disable input
        this.disableInput();

        // Start countdown
        this.startCountdown();

        // Update widget
        this.widget.querySelector('.tl-widget-icon').textContent = '⏸️';
        const statusEl = this.widget.querySelector('.tl-widget-status');
        statusEl.textContent = 'Blocked';
        statusEl.className = 'tl-widget-status tl-status-blocked';
    }

    deactivateBlock() {
        this.isBlocked = false;
        this.blockEndTime = null;

        // Remove overlay
        const overlay = document.getElementById('tl-block-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Enable input
        this.enableInput();

        // Stop countdown
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Reset widget
        this.updateStatus('green', this.counters);
    }

    startCountdown() {
        this.updateCountdownDisplay();

        this.timerInterval = setInterval(() => {
            const remaining = this.blockEndTime - Date.now();

            if (remaining <= 0) {
                this.deactivateBlock();
                chrome.runtime.sendMessage({ type: 'BLOCK_ENDED' });
            } else {
                this.updateCountdownDisplay();
            }
        }, 1000);
    }

    updateCountdownDisplay() {
        const remaining = Math.max(0, this.blockEndTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        const timerEl = document.getElementById('tl-block-timer');
        if (timerEl) {
            timerEl.textContent = timeString;
        }
    }

    disableInput() {
        // ChatGPT
        const chatgptInput = document.querySelector('textarea[placeholder*="Message"]');
        if (chatgptInput) {
            chatgptInput.disabled = true;
            chatgptInput.placeholder = "Chat blocked - Please wait...";
        }

        // Gemini
        const geminiInput = document.querySelector('.ql-editor');
        if (geminiInput) {
            geminiInput.contentEditable = 'false';
            geminiInput.style.opacity = '0.5';
        }

        // Disable send buttons
        document.querySelectorAll('button').forEach(btn => {
            if (btn.getAttribute('data-testid') === 'send-button' ||
                btn.getAttribute('aria-label')?.includes('Send')) {
                btn.disabled = true;
            }
        });
    }

    enableInput() {
        // ChatGPT
        const chatgptInput = document.querySelector('textarea[placeholder*="blocked"]');
        if (chatgptInput) {
            chatgptInput.disabled = false;
            chatgptInput.placeholder = "Message ChatGPT";
        }

        // Gemini
        const geminiInput = document.querySelector('.ql-editor');
        if (geminiInput) {
            geminiInput.contentEditable = 'true';
            geminiInput.style.opacity = '1';
        }

        // Enable send buttons
        document.querySelectorAll('button').forEach(btn => {
            if (btn.getAttribute('data-testid') === 'send-button' ||
                btn.getAttribute('aria-label')?.includes('Send')) {
                btn.disabled = false;
            }
        });
    }

    async checkBlockStatus() {
        const result = await chrome.storage.local.get(['blockEndTime']);

        if (result.blockEndTime && result.blockEndTime > Date.now()) {
            this.activateBlock(result.blockEndTime);
        }
    }
}

// Initialize widget when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new TrafficLightWidget();
    });
} else {
    new TrafficLightWidget();
}
