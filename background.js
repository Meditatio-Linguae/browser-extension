const API_BASE = "http://localhost:3000";
const ANALYZE_API = `${API_BASE}/api/analyze`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type !== "ANALYZE_TEXT") {
        return;
    }

    analyzeText(message.text)
        .then(sendResponse)
        .catch(err => {
            sendResponse({
                success: false,
                error: err.message
            });
        });

    return true;
});

async function analyzeText(text) {
    const res = await fetch(ANALYZE_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
    });

    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }

    return res.json();
}
