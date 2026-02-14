// Traffic Light AI Monitor - Content Script

// Keywords that indicate grading or submission context
const GRADING_KEYWORDS = [
    'submit', 'grade', 'grading', 'assignment', 'quiz', 'test', 'exam',
    'turn in', 'upload', 'assessment', 'rubric', 'score', 'marking'
];

// Analyze page context
function analyzePageContext() {
    const pageText = document.body.innerText.toLowerCase();
    const hasGradingKeywords = GRADING_KEYWORDS.some(keyword =>
        pageText.includes(keyword)
    );

    // Check for form submissions
    const hasForms = document.querySelectorAll('form').length > 0;
    const hasFileUpload = document.querySelectorAll('input[type="file"]').length > 0;

    return {
        hasGradingKeywords,
        hasForms,
        hasFileUpload,
        url: window.location.href
    };
}

// Send context to background script
function reportContext() {
    const context = analyzePageContext();

    chrome.runtime.sendMessage({
        type: 'PAGE_CONTEXT',
        data: context
    });
}

// Run analysis when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reportContext);
} else {
    reportContext();
}

// Monitor for dynamic content changes
const observer = new MutationObserver(() => {
    reportContext();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
