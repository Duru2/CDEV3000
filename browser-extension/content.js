// Traffic Light AI Monitor - Content Script with Real-time Message Monitoring

console.log('[Content] ========== Script loaded ==========');
console.log('[Content] URL:', window.location.href);
console.log('[Content] Hostname:', window.location.hostname);

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
        this.lastProcessedMessage = '';
        this.observer = null;
        this.platform = this.detectPlatform();
        this.checkCount = 0;

        if (this.platform) {
            console.log('[Content] ✅ Platform detected:', this.platform);
            this.init();
        } else {
            console.log('[Content] ❌ Platform NOT supported');
        }
    }

    detectPlatform() {
        const hostname = window.location.hostname;
        console.log('[Content] Detecting platform for:', hostname);

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
        console.log('[Content] Initializing message monitor...');

        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
        } else {
            // Page already loaded
            setTimeout(() => this.startMonitoring(), 2000);
        }
    }

    startMonitoring() {
        console.log('[Content] Starting DOM monitoring...');

        // Start observing DOM changes
        this.observer = new MutationObserver((mutations) => {
            this.checkForNewMessages();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[Content] ✅ MutationObserver started');

        // Also check immediately
        this.checkForNewMessages();
    }

    checkForNewMessages() {
        this.checkCount++;

        if (this.checkCount % 50 === 0) {
            console.log('[Content] Check count:', this.checkCount);
        }

        let messageElement = null;
        let messageText = '';

        // Platform-specific selectors
        if (this.platform === 'chatgpt') {
            // Get the last user message
            const userMessages = document.querySelectorAll('[data-message-author-role="user"]');

            if (this.checkCount % 50 === 0) {
                console.log('[Content] Found', userMessages.length, 'user messages');
            }

            if (userMessages.length > 0) {
                messageElement = userMessages[userMessages.length - 1];
                messageText = messageElement.innerText.trim();
            }
        } else if (this.platform === 'gemini') {
            // Get the last query
            const queries = document.querySelectorAll('.query-text, [data-test-id="user-query"]');

            if (this.checkCount % 50 === 0) {
                console.log('[Content] Found', queries.length, 'queries');
            }

            if (queries.length > 0) {
                messageElement = queries[queries.length - 1];
                messageText = messageElement.innerText.trim();
            }
        } else if (this.platform === 'claude') {
            // Get the last user message
            const userMessages = document.querySelectorAll('[data-is-streaming="false"]');
            if (userMessages.length > 0) {
                messageElement = userMessages[userMessages.length - 1];
                messageText = messageElement.innerText.trim();
            }
        }

        // Process new message
        if (messageText && messageText !== this.lastProcessedMessage) {
            console.log('[Content] 🆕 NEW MESSAGE DETECTED!');
            console.log('[Content] Message:', messageText.substring(0, 100));

            this.lastProcessedMessage = messageText;
            this.analyzeMessage(messageText);
        }
    }

    analyzeMessage(text) {
        console.log('[Content] 🔍 Analyzing message...');
        console.log('[Content] Text length:', text.length);

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
                console.error('[Content] ❌ Error sending message:', chrome.runtime.lastError);
            } else {
                console.log('[Content] ✅ Message sent to background, response:', response);
            }
        });
    }

    classifyMessage(text) {
        const lowerText = text.toLowerCase();
        console.log('[Content] Checking keywords in:', lowerText.substring(0, 50));

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

        // Default to yellow if no keywords matched (cautious approach)
        console.log('[Content] 🟡 No keywords matched, defaulting to YELLOW');
        return 'yellow';
    }
}

// Initialize monitor
console.log('[Content] Creating MessageMonitor instance...');
const monitor = new MessageMonitor();
console.log('[Content] MessageMonitor created');

// Also keep the old page context detection for compatibility
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

console.log('[Content] ========== Script initialization complete ==========');
