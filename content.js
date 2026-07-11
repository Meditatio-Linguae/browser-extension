let button = null;
let popup = null;
let analysisResult = null;
let currentWordIndex = 0;
let currentMorphemeIndex = 0;
let highlightedWords = [];
let selectedRange = null;

const ORIGIN_OF_TONGUE = {
    la: "Latin",
    el: "Greek",
    en: "English",
    fr: "French"
};

function getOriginName(origin) {
    if (!origin) {
        return "-";
    }
    return ORIGIN_OF_TONGUE[origin] || origin;
}

function highlightSelectedText() {
    if (!selectedRange) {
        return;
    }

    removeWordHighlights();
    const text = selectedRange.toString();
    const words = text.match(/\S+/g) || [];
    const container = document.createElement("span");
    container.className = "anglysis-selection";
    words.forEach((word, index) => {
        const span = document.createElement("span");
        span.className = "anglysis-word-highlight";
        span.dataset.index = index;
        span.textContent = word;
        container.appendChild(span);
        if (index < words.length - 1) {
            container.appendChild(document.createTextNode(" "));
        }
        highlightedWords.push(span);
    });
    selectedRange.deleteContents();
    selectedRange.insertNode(container);
}

function removeWordHighlights() {
    highlightedWords.forEach(span => {
        const parent = span.parentNode;
        if (!parent) {
            return;
        }
        parent.replaceWith(parent.textContent);
    });
    highlightedWords = [];
}

function updateCurrentHighlightedWord() {
    highlightedWords.forEach((span, index) => {
        span.classList.toggle(
            "current-word",
            index === currentWordIndex
        );
    });
}

/* =========================
   TEXT SELECTION
========================= */
document.addEventListener("mouseup", (event) => {
    // Nếu nhả chuột trúng popup hoặc button thì tuyệt đối không làm gì
    if (event.target.closest(".anglysis-popup") || event.target.closest(".anglysis-button")) {
        return;
    }

    const text = window.getSelection().toString().trim();
    if (!text) {
        removeButton();
        return;
    }

    removeButton();
    removePopup();

    const range = window.getSelection().getRangeAt(0);
    selectedRange = range.cloneRange();
    const rect = range.getBoundingClientRect();
    createButton(text, rect);
});

/* =========================
   BUTTON
========================= */
function createButton(text, rect) {
    button = document.createElement("button");
    button.className = "anglysis-button";
    button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="pointer-events: none;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <circle cx="12" cy="8" r="1"/>
        </svg>
    `;
    button.style.left = `${window.scrollX + rect.right}px`;
    button.style.top = `${window.scrollY + rect.bottom + 8}px`;
    document.body.appendChild(button);

    button.addEventListener("click", async (e) => {
        e.stopPropagation();
        removeButton();

        const res = await chrome.runtime.sendMessage({ type: "ANALYZE_TEXT", text });
        if (!res || !res.words) {
            alert(res?.error || "Error");
            return;
        }

        analysisResult = res;
        highlightSelectedText();
        window.getSelection().removeAllRanges();
        currentWordIndex = 0;
        currentMorphemeIndex = 0;

        // Tạo khung popup cố định nếu chưa có
        if (!popup) {
            createPopupContainer(rect);
        }

        updatePopupContent();
    });
}

/* =========================
   POPUP CONTAINER & EVENT DELEGATION
========================= */
function createPopupContainer(rect) {
    popup = document.createElement("div");
    popup.className = "anglysis-popup";
    popup.style.left = `${window.scrollX + rect.left}px`;
    popup.style.top = `${window.scrollY + rect.bottom + 12}px`;
    document.body.appendChild(popup);

    // KỸ THUẬT ỦY QUYỀN SỰ KIỆN: Lắng nghe click duy nhất trên popup cha cố định
    popup.addEventListener("click", (e) => {
        // 1. Click vào Tab hình vị
        const tab = e.target.closest(".morpheme-tab");
        if (tab) {
            currentMorphemeIndex = Number(tab.dataset.index);
            updatePopupContent();
            return;
        }

        // 2. Click vào nút lùi từ (Prev)
        const prevBtn = e.target.closest(".word-prev");
        if (prevBtn && currentWordIndex > 0) {
            currentWordIndex--;
            currentMorphemeIndex = 0;
            updatePopupContent();
            return;
        }

        // 3. Click vào nút tiến từ (Next)
        const nextBtn = e.target.closest(".word-next");
        if (nextBtn && currentWordIndex < analysisResult.words.length - 1) {
            currentWordIndex++;
            currentMorphemeIndex = 0;
            updatePopupContent();
            return;
        }
    });
}

/* =========================
   POPUP UPDATE (CHỈ ĐỔI RUỘT HTML)
========================= */
function updatePopupContent() {
    if (!popup || !analysisResult) {
        return;
    }

    const word = analysisResult.words[currentWordIndex];
    const hasMorphemes = word.morphemes.length > 0;
    const morpheme = hasMorphemes ? word.morphemes[currentMorphemeIndex] : null;
    const prevDisabled = currentWordIndex === 0;
    const nextDisabled = currentWordIndex === analysisResult.words.length - 1;
    const tabs = hasMorphemes ? word.morphemes.map((m, i) => `
        <button
            class="morpheme-tab ${i === currentMorphemeIndex ? "active" : ""}"
            data-index="${i}">
            ${m.text}
        </button>
    `).join("") : "";

    popup.innerHTML = `
    <div class="anglysis-toolbar">

        <button class="word-prev"
            ${prevDisabled ? "disabled" : ""}>
            ◀
        </button>

        <div class="morpheme-tabs-wrapper">
            ${hasMorphemes
            ? `
                    <div class="morpheme-tabs">
                        ${tabs}
                    </div>
                    `
            : `
                    <div class="anglysis-word-header">
                        ${word.fullWord}
                    </div>
                    `
        }
            <div class="morpheme-divider"></div>
        </div>

        <button class="word-next"
            ${nextDisabled ? "disabled" : ""}>
            ▶
        </button>
    </div>
        ${hasMorphemes
            ? `
            <div class="anglysis-section">
                <div class="label">Meaning</div>
                <div class="value">
                    ${morpheme.meaning}
                </div>
            </div>
            <div class="anglysis-section">
                <div class="label">
                    Origin of Tongue
                </div>
                <div class="value">
                    ${morpheme.root || "-"}
                    ${morpheme.origin
                ? `(from ${getOriginName(morpheme.origin)})`
                : ""}
                </div>
            </div>
            ` : `
            <div class="anglysis-empty">
                Sorry! We don't have that word in our database, but we're always adding new ones.
            </div>
            `}
    `;
    updateCurrentHighlightedWord();
}

/* =========================
   CLEANUP & CLICK OUTSIDE
========================= */
function removeButton() { button?.remove(); button = null; }
function removePopup() {
    popup?.remove();
    popup = null;
    removeWordHighlights();
}

/* Click ngoài rìa thực sự mới đóng */
document.addEventListener("mousedown", (e) => {
    if (e.target.closest(".anglysis-popup") || e.target.closest(".anglysis-button")) {
        return;
    }
    removePopup();
    removeButton();
});
