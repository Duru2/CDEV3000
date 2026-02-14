// Traffic Light AI Monitor - Content Script with Real-time Message Monitoring

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

        if (this.platform) {
            console.log('[Traffic Light] Detected platform:', this.platform);
            this.init();
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
        console.log('[Traffic Light] Initializing message monitor...');

        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.startMonitoring());
        } else {
            this.startMonitoring();
        }
    }

    startMonitoring() {
        // Start observing DOM changes
        this.observer = new MutationObserver((mutations) => {
            this.checkForNewMessages();
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        console.log('[Traffic Light] Message monitoring started');
    }

    checkForNewMessages() {
        let messageElement = null;
        let messageText = '';

        // Platform-specific selectors
        if (this.platform === 'chatgpt') {
            // Get the last user message
            const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
            if (userMessages.length > 0) {
                messageElement = userMessages[userMessages.length - 1];
                messageText = messageElement.innerText.trim();
            }
        } else if (this.platform === 'gemini') {
            // Get the last query
            const queries = document.querySelectorAll('.query-text, [data-test-id="user-query"]');
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
            this.lastProcessedMessage = messageText;
            this.analyzeMessage(messageText);
        }
    }

    analyzeMessage(text) {
        console.log('[Traffic Light] Analyzing message:', text.substring(0, 50) + '...');

        const status = this.classifyMessage(text);

        console.log('[Traffic Light] Classification:', status);

        // Send to background for processing
        chrome.runtime.sendMessage({
            type: 'ANALYZE_MESSAGE',
            data: {
                text: text,
                status: status,
                timestamp: Date.now(),
                platform: this.platform
            }
        });
    }

    classifyMessage(text) {
        const lowerText = text.toLowerCase();

        // Check for red keywords (highest priority)
        for (const keyword of KEYWORDS.red) {
            if (lowerText.includes(keyword)) {
                return 'red';
            }
        }

        // Check for yellow keywords
        for (const keyword of KEYWORDS.yellow) {
            if (lowerText.includes(keyword)) {
                return 'yellow';
            }
        }

        // Check for green keywords
        for (const keyword of KEYWORDS.green) {
            if (lowerText.includes(keyword)) {
                return 'green';
            }
        }

        // Default to yellow if no keywords matched (cautious approach)
        return 'yellow';
    }
}

// Initialize monitor
const monitor = new MessageMonitor();

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
