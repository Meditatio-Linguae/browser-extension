let button = null;
let popup = null;
let analysisResult = null;
let currentWordIndex = 0;
let currentMorphemeIndex = 0;

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
    if (!popup || !analysisResult) return;

    const word = analysisResult.words[currentWordIndex];
    const morpheme = word.morphemes[currentMorphemeIndex];
    const prevDisabled = currentWordIndex === 0;
    const nextDisabled = currentWordIndex === analysisResult.words.length - 1;

    const tabs = word.morphemes.map((m, i) => `
        <button class="morpheme-tab ${i === currentMorphemeIndex ? "active" : ""}" data-index="${i}">
            ${m.text}
        </button>
    `).join("");

    popup.innerHTML = `
        <div class="anglysis-toolbar">
            <button class="word-prev" ${prevDisabled ? "disabled" : ""}>◀</button>
            <div class="morpheme-tabs">${tabs}</div>
            <button class="word-next" ${nextDisabled ? "disabled" : ""}>▶</button>
        </div>
        <div class="anglysis-word">${word.fullWord}</div>
        <div class="anglysis-section">
            <div class="label">Meaning</div>
            <div class="value">${morpheme?.meaning || "-"}</div>
        </div>
        <div class="anglysis-section">
            <div class="label">Origin</div>
            <div class="value">${morpheme?.origin || "-"}</div>
        </div>
    `;
}

/* =========================
   CLEANUP & CLICK OUTSIDE
========================= */
function removeButton() { button?.remove(); button = null; }
function removePopup() { popup?.remove(); popup = null; }

/* Click ngoài rìa thực sự mới đóng */
document.addEventListener("mousedown", (e) => {
    if (e.target.closest(".anglysis-popup") || e.target.closest(".anglysis-button")) {
        return;
    }
    removePopup();
    removeButton();
});
