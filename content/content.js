// console.log("ANGLYSIS CONTENT LOADED");

let currentButton = null;
let currentPopup = null;

document.addEventListener(
    "mouseup",
    onTextSelected
);

function onTextSelected(event) {
    if (
        event.target &&
        event.target.closest(".anglysis-button")
    ) {
        return;
    }

    const selection =
        window
            .getSelection()
            .toString()
            .trim();

    if (!selection) {
        return;
    }

    removeButton();

    const range =
        window
            .getSelection()
            .getRangeAt(0);

    const rect =
        range.getBoundingClientRect();

    createLookupButton(
        selection,
        rect
    );
}

function createLookupButton(
    word,
    rect
) {
    const button =
        document.createElement("button");

    button.className =
        "anglysis-button";

    button.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <circle cx="12" cy="8" r="1"></circle>
        </svg>
    `;

    button.style.left =
        `${window.scrollX + rect.right}px`;

    button.style.top =
        `${window.scrollY + rect.bottom + 8}px`;

    document.body.appendChild(button);

    currentButton = button;

    button.addEventListener(
        "click",
        async () => {
            try {
                removeButton();

                const response =
                    await chrome.runtime.sendMessage({
                        type: "ANALYZE_WORD",
                        word
                    });

                showResultPopup(
                    rect,
                    word,
                    response.data
                );
            } catch (err) {
                showErrorPopup(
                    rect,
                    err.message
                );
            }

        }
    );
}

function showResultPopup(
    rect,
    selectedWord,
    data
) {
    removePopup();

    const popup =
        document.createElement("div");

    popup.className =
        "anglysis-popup";

    const morphemes =
        data.morphemes || [];

    const morphemesHtml =
        morphemes
            .map(
                item => `
                <div class="anglysis-morpheme">
                    <div class="anglysis-morpheme-root">
                        ${item.text}
                    </div>
                    <div class="anglysis-morpheme-meaning">
                        ${item.meaning}
                    </div>
                </div>
            `
            )
            .join("");

    popup.innerHTML = `
        <div class="anglysis-header">
            ${selectedWord}
        </div>

        <div class="anglysis-section">
            <div class="anglysis-label">
                Meaning
            </div>

            <div class="anglysis-value">
                ${data.meaning || "-"}
            </div>
        </div>

        <div class="anglysis-section">
            <div class="anglysis-label">
                Morpheme Breakdown
            </div>
            <div class="anglysis-morphemes">
                ${morphemesHtml}
            </div>
        </div>

        <div class="anglysis-section">
            <div class="anglysis-label">
                Origin
            </div>
            <div class="anglysis-value">
                ${data.originLanguage || "-"}
            </div>
        </div>
    `;

    popup.style.left =
        `${window.scrollX + rect.left}px`;

    popup.style.top =
        `${window.scrollY + rect.bottom + 12}px`;

    document.body.appendChild(
        popup
    );

    currentPopup = popup;
}

function showErrorPopup(
    rect,
    message
) {

    removePopup();

    const popup =
        document.createElement("div");

    popup.className =
        "anglysis-popup";

    popup.innerHTML = `
    <div class="anglysis-error">
      ${message}
    </div>
  `;

    popup.style.left =
        `${window.scrollX + rect.left}px`;

    popup.style.top =
        `${window.scrollY + rect.bottom + 18}px`;

    document.body.appendChild(
        popup
    );

    currentPopup = popup;
}

function removeButton() {
    if (currentButton) {
        currentButton.remove();
        currentButton = null;
    }
}

function removePopup() {
    if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
    }
}

document.addEventListener(
    "mousedown",
    (event) => {
        const clickedButton =
            currentButton &&
            currentButton.contains(
                event.target
            );

        const clickedPopup =
            currentPopup &&
            currentPopup.contains(
                event.target
            );

        if (
            !clickedButton &&
            !clickedPopup
        ) {
            removeButton();
            removePopup();
        }
    }
);

document.addEventListener(
    "selectionchange",
    () => {
        const selection =
            window
                .getSelection()
                .toString()
                .trim();

        if (!selection) {
            removeButton();
        }
    }
);