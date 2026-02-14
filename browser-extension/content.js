// Traffic Light AI Monitor - Content Script with Direct Input Monitoring

console.log('[Content] ========== Script loaded ==========');
console.log('[Content] URL:', window.location.href);

// Keyword lists for content analysis
const KEYWORDS = {
    red: [
        'write my essay',
        'do my homework',
        'solve this problem for me',
        'complete this assignment',
        'answer these questions',
        'write code for me',
        'do this for me',
        'finish my assignment',
        'write this paper',
        'solve my homework'
    ],
    yellow: [
        'help me write',
        'can you write',
        'generate a',
        'create a',
        'write a draft',
        'help me with this assignment'
    ],
    green: [
        'explain',
        'what is',
        'how does',
        'why',
        'teach me',
        'help me understand',
        'can you clarify',
        'what does this mean'
    ]
};

// Message monitor class
class MessageMonitor {
    constructor() {
        this.platform = this.detectPlatform();
        this.lastAnalyzedText = '';
        this.inputField = null;
        this.sendButton = null;

        if (this.platform) {
            console.log('[Content] ✅ Platform detected:', this.platform);
            this.init();
        } else {
            console.log('[Content] ❌ Platform NOT supported');
        }
    }

    detectPlatform() {
        const hostname = window.location.hostname;

        if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
            return 'chatgpt';
        } else if (hostname.includes('gemini.google.com')) {
            return 'gemini';
        } else if (hostname.includes('claude.ai')) {
            return 'claude';
        }

        return null;
    }

    init() {
        console.log('[Content] Initializing input monitor...');

        // Wait for page to load
        setTimeout(() => {
            this.findInputElements();
            this.setupInputMonitoring();
        }, 3000);
    }

    findInputElements() {
        console.log('[Content] Finding input elements...');

        if (this.platform === 'chatgpt') {
            // Find textarea
            this.inputField = document.querySelector('textarea[placeholder*="Message"]') ||
                document.querySelector('textarea') ||
                document.querySelector('#prompt-textarea');

            // Find send button
            this.sendButton = document.querySelector('button[data-testid="send-button"]') ||
                document.querySelector('button[aria-label*="Send"]');

            console.log('[Content] Input field found:', !!this.inputField);
            console.log('[Content] Send button found:', !!this.sendButton);

        } else if (this.platform === 'gemini') {
            this.inputField = document.querySelector('.ql-editor') ||
                document.querySelector('[contenteditable="true"]');
            this.sendButton = document.querySelector('button[aria-label*="Send"]');
        }

        // Retry if not found
        if (!this.inputField || !this.sendButton) {
            console.log('[Content] Elements not found, retrying in 2s...');
            setTimeout(() => this.findInputElements(), 2000);
        }
    }

    setupInputMonitoring() {
        if (!this.inputField) {
            console.log('[Content] ❌ Input field not found, cannot monitor');
            return;
        }

        console.log('[Content] ✅ Setting up input monitoring...');

        // Method 1: Monitor send button clicks
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => {
                console.log('[Content] 📤 Send button clicked!');
                setTimeout(() => this.captureAndAnalyze(), 100);
            });
            console.log('[Content] ✅ Send button listener added');
        }

        // Method 2: Monitor Enter key press
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                console.log('[Content] ⌨️ Enter key pressed!');
                setTimeout(() => this.captureAndAnalyze(), 100);
            }
        });
        console.log('[Content] ✅ Keyboard listener added');

        // Method 3: Periodically check for new messages in DOM
        setInterval(() => {
            this.checkForNewMessages();
        }, 3000);
        console.log('[Content] ✅ Periodic checker started');
    }

    captureAndAnalyze() {
        const text = this.inputField?.value || this.inputField?.textContent || '';

        console.log('[Content] 📝 Captured text:', text.substring(0, 50));

        if (text && text.trim().length > 3 && text !== this.lastAnalyzedText) {
            this.lastAnalyzedText = text;
            this.analyzeMessage(text);
        }
    }

    checkForNewMessages() {
        // Look for the most recent user message in the DOM
        const userMessages = document.querySelectorAll('[data-message-author-role="user"]');

        if (userMessages.length > 0) {
            const lastMessage = userMessages[userMessages.length - 1];
            const text = lastMessage.innerText || lastMessage.textContent || '';

            if (text && text !== this.lastAnalyzedText && text.length > 3) {
                console.log('[Content] 🔍 Found new message in DOM:', text.substring(0, 50));
                this.lastAnalyzedText = text;
                this.analyzeMessage(text);
            }
        }
    }

    analyzeMessage(text) {
        console.log('[Content] 🔍 Analyzing message...');
        console.log('[Content] Full text:', text);

        const status = this.classifyMessage(text);

        console.log('[Content] ✅ Classification:', status.toUpperCase());

        // Send to background for processing
        chrome.runtime.sendMessage({
            type: 'ANALYZE_MESSAGE',
            data: {
                text: text,
                status: status,
                timestamp: Date.now(),
                platform: this.platform
            }
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('[Content] ❌ Error:', chrome.runtime.lastError.message);
            } else {
                console.log('[Content] ✅ Sent to background, response:', response);
            }
        });
    }

    classifyMessage(text) {
        const lowerText = text.toLowerCase();

        // Check for red keywords (highest priority)
        for (const keyword of KEYWORDS.red) {
            if (lowerText.includes(keyword)) {
                console.log('[Content] 🔴 RED keyword matched:', keyword);
                return 'red';
            }
        }

        // Check for yellow keywords
        for (const keyword of KEYWORDS.yellow) {
            if (lowerText.includes(keyword)) {
                console.log('[Content] 🟡 YELLOW keyword matched:', keyword);
                return 'yellow';
            }
        }

        // Check for green keywords
        for (const keyword of KEYWORDS.green) {
            if (lowerText.includes(keyword)) {
                console.log('[Content] 🟢 GREEN keyword matched:', keyword);
                return 'green';
            }
        }

        // Default to yellow
        console.log('[Content] 🟡 No keywords matched, defaulting to YELLOW');
        return 'yellow';
    }
}

// Initialize monitor
console.log('[Content] Creating MessageMonitor...');
const monitor = new MessageMonitor();

// Page context detection (keep for compatibility)
function detectPageContext() {
    const bodyText = document.body.innerText.toLowerCase();
    const gradingKeywords = [
        'grade', 'grading', 'assignment', 'submission',
        'quiz', 'test', 'exam', 'homework', 'rubric',
        'score', 'points', 'due date', 'submit'
    ];

    const hasGradingKeywords = gradingKeywords.some(keyword =>
        bodyText.includes(keyword)
    );

    chrome.runtime.sendMessage({
        type: 'PAGE_CONTEXT',
        data: {
            hasGradingKeywords,
            url: window.location.href
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectPageContext);
} else {
    detectPageContext();
}

console.log('[Content] ========== Initialization complete ==========');
