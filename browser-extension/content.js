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
        this.messageCount = 0;

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
            // Page already loaded, wait a bit for React to render
            setTimeout(() => this.startMonitoring(), 3000);
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
            subtree: true,
            characterData: true
        });

        console.log('[Content] ✅ MutationObserver started');

        // Also check immediately
        this.checkForNewMessages();

        // And check periodically as backup
        setInterval(() => {
            this.checkForNewMessages();
        }, 2000);
    }

    checkForNewMessages() {
        this.checkCount++;

        let messageText = '';

        // Platform-specific selectors
        if (this.platform === 'chatgpt') {
            // Try multiple selectors for ChatGPT
            const selectors = [
                '[data-message-author-role="user"]',
                '[data-testid*="user"]',
                'div.group.w-full',
                'article'
            ];

            let allMessages = [];

            for (const selector of selectors) {
                const messages = document.querySelectorAll(selector);
                if (messages.length > allMessages.length) {
                    allMessages = messages;
                    if (this.checkCount === 1) {
                        console.log('[Content] Using selector:', selector, '- Found', messages.length, 'messages');
                    }
                }
            }

            // Get all text content from the page and find user messages
            if (allMessages.length > 0) {
                const lastMessage = allMessages[allMessages.length - 1];
                messageText = lastMessage.innerText?.trim() || lastMessage.textContent?.trim() || '';

                // Filter out assistant responses
                if (messageText && !messageText.includes('ChatGPT') && messageText.length > 5) {
                    this.messageCount = allMessages.length;
                }
            }

            // Fallback: check the input field for submitted text
            if (!messageText) {
                const mainContent = document.querySelector('main');
                if (mainContent) {
                    const allText = mainContent.innerText;
                    // Try to extract the last user message
                    const lines = allText.split('\n').filter(line => line.trim().length > 10);
                    if (lines.length > 0) {
                        messageText = lines[lines.length - 1];
                    }
                }
            }

        } else if (this.platform === 'gemini') {
            const queries = document.querySelectorAll('.query-text, [data-test-id="user-query"]');
            if (queries.length > 0) {
                messageText = queries[queries.length - 1].innerText.trim();
            }
        } else if (this.platform === 'claude') {
            const userMessages = document.querySelectorAll('[data-is-streaming="false"]');
            if (userMessages.length > 0) {
                messageText = userMessages[userMessages.length - 1].innerText.trim();
            }
        }

        // Process new message
        if (messageText && messageText !== this.lastProcessedMessage && messageText.length > 5) {
            console.log('[Content] 🆕 NEW MESSAGE DETECTED!');
            console.log('[Content] Message preview:', messageText.substring(0, 100));
            console.log('[Content] Message length:', messageText.length);

            this.lastProcessedMessage = messageText;
            this.analyzeMessage(messageText);
        }
    }

    analyzeMessage(text) {
        console.log('[Content] 🔍 Analyzing message...');

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

        // Default to yellow if no keywords matched
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
