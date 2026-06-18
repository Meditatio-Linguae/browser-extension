// console.log("LATIN LENS CONTENT LOADED");

let currentButton = null;
let currentPopup = null;

document.addEventListener(
    "mouseup",
    onTextSelected
);

function onTextSelected(event) {
    if (
        event.target &&
        event.target.closest(".latin-lens-button")
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
        "latin-lens-button";

    button.textContent = "L";

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
                        type: "LOOKUP_LATIN",
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
        "latin-lens-popup";

    const morphemes =
        data.morphemes || [];

    const morphemesHtml =
        morphemes
            .map(
                item => `
                <div class="latin-morpheme">
                    <div class="latin-morpheme-root">
                        ${item.text}
                    </div>
                    <div class="latin-morpheme-meaning">
                        ${item.meaning}
                    </div>
                </div>
            `
            )
            .join("");

    popup.innerHTML = `
        <div class="latin-header">
            ${selectedWord}
        </div>

        <div class="latin-section">
            <div class="latin-label">
                Meaning
            </div>

            <div class="latin-value">
                ${data.meaning || "-"}
            </div>
        </div>

        <div class="latin-section">
            <div class="latin-label">
                Morpheme Breakdown
            </div>
            <div class="latin-morphemes">
                ${morphemesHtml}
            </div>
        </div>

        <div class="latin-section">
            <div class="latin-label">
                Origin
            </div>
            <div class="latin-value">
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
        "latin-lens-popup";

    popup.innerHTML = `
    <div class="latin-error">
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