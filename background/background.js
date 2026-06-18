const API_BASE_URL =
    "http://localhost:3000";

const LOOKUP_ENDPOINT =
    `${API_BASE_URL}/api/analyze`;

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (message.type !== "ANALYZE_WORD") {
            return;
        }

        lookupWord(message.word)
            .then(sendResponse)
            .catch((error) => {

                sendResponse({
                    success: false,
                    error: error.message
                });

            });

        return true;
    }
);

async function lookupWord(word) {
    const response = await fetch(
        LOOKUP_ENDPOINT,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                text: word
            })
        }
    );

    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}`
        );
    }

    return response.json();
}