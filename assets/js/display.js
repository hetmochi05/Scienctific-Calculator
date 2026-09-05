/* ==========================================================
   display.js
   Display rendering, expression formatting, dynamic font scaling,
   status badges, copy-to-clipboard, persistent history, and
   responsive history drawer management.
   ========================================================== */

const resultEl = document.getElementById('result');
const exprEl = document.querySelector('.expression');
const historyListEl = document.querySelector('.history-list');
const clearHistoryBtn = document.querySelector('.clear-history');
const historyPanel = document.querySelector('.history');

let calcHistory = [];
try {
    const saved = localStorage.getItem("smart_calc_history");
    if (saved) calcHistory = JSON.parse(saved);
} catch { calcHistory = []; }

function saveHistory() {
    try {
        localStorage.setItem("smart_calc_history", JSON.stringify(calcHistory.slice(0, 60)));
    } catch { }
}

// Format raw tokens for display (×, ÷, ʸ√, −)
function prettifyExpr(str) {
    if (!str) return '';
    let out = str
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/#/g, 'ʸ√');

    const isBareNegativeNumber = /^-(\d+\.?\d*|\.\d+)$/.test(str);

    if (!isBareNegativeNumber) {
        out = out.replace(/(^|[+\-×÷^ʸ√(])-(\d+\.?\d*|\.\d+)/g, (match, prefix, num) => {
            return `${prefix}(-${num})`;
        });
    }

    out = out.replace(/(?<=[0-9)])-/g, '−');

    return out;
}

function updateResultFontSize(text) {
    if (!resultEl) return;
    const len = text ? text.length : 1;
    if (window.innerWidth < 640) {
        if (len <= 8) resultEl.style.fontSize = '48px';
        else if (len <= 12) resultEl.style.fontSize = '36px';
        else if (len <= 16) resultEl.style.fontSize = '28px';
        else resultEl.style.fontSize = '22px';
    } else {
        if (len <= 9) resultEl.style.fontSize = ''; // use CSS default
        else if (len <= 13) resultEl.style.fontSize = '54px';
        else if (len <= 18) resultEl.style.fontSize = '40px';
        else resultEl.style.fontSize = '30px';
    }
}

function renderResult(rawStr) {
    const val = rawStr === '' ? '0' : prettifyExpr(rawStr);
    resultEl.textContent = val;
    updateResultFontSize(val);
}

function renderExpression(rawStr) {
    exprEl.textContent = prettifyExpr(rawStr);
}

function flashError() {
    resultEl.classList.add('input-error');
    setTimeout(() => resultEl.classList.remove('input-error'), 400);
}

function addToHistory(expr, result) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    calcHistory.unshift({
        expr: prettifyExpr(expr),
        result: String(result),
        rawExpr: expr,
        time: timeStr
    });
    saveHistory();
    renderHistory();
}

function renderHistory() {
    if (!historyListEl) return;
    historyListEl.innerHTML = '';

    if (calcHistory.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'history-empty';
        empty.innerHTML = `<i class="fa-regular fa-clock"></i><p>No calculations yet</p>`;
        historyListEl.appendChild(empty);
        return;
    }

    calcHistory.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');
        div.innerHTML = `
            <button type="button" class="history-item-delete" aria-label="Delete this entry" title="Delete entry">
                <i class="fa-solid fa-trash-can"></i>
            </button>
            <div class="history-item-meta">
                <small>${item.expr}</small>
                ${item.time ? `<span class="history-item-time">${item.time}</span>` : ''}
            </div>
            <h2>${item.result}</h2>`;

        const delBtn = div.querySelector('.history-item-delete');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteHistoryItem(index);
        });

        div.addEventListener('click', () => {
            currentValue = item.result;
            justCalculated = true;
            renderResult(currentValue);
            renderExpression(item.expr);
            closeHistoryDrawer();
        });

        historyListEl.appendChild(div);
    });
}

function deleteHistoryItem(index) {
    calcHistory.splice(index, 1);
    saveHistory();
    renderHistory();
}

function clearHistory() {
    if (calcHistory.length === 0) return;
    calcHistory = [];
    saveHistory();
    renderHistory();
    showToast("History cleared");
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// Drawer management for mobile / tablet
function toggleHistoryDrawer() {
    if (!historyPanel) return;
    const isOpen = historyPanel.classList.contains('history-open');
    if (isOpen) {
        closeHistoryDrawer();
    } else {
        openHistoryDrawer();
    }
}

function openHistoryDrawer() {
    if (!historyPanel) return;
    historyPanel.classList.add('history-open');
    let backdrop = document.getElementById('historyBackdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'historyBackdrop';
        backdrop.className = 'history-backdrop';
        backdrop.addEventListener('click', closeHistoryDrawer);
        document.body.appendChild(backdrop);
    }
    backdrop.classList.add('visible');
}

function closeHistoryDrawer() {
    if (!historyPanel) return;
    historyPanel.classList.remove('history-open');
    const backdrop = document.getElementById('historyBackdrop');
    if (backdrop) backdrop.classList.remove('visible');
}

// Copy to clipboard with toast notification
function copyResultToClipboard() {
    const textToCopy = (currentValue === 'Error' || currentValue === '') ? '0' : currentValue;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`Copied ${textToCopy} to clipboard!`);
    }).catch(() => {
        showToast("Unable to copy to clipboard");
    });
}

function showToast(message) {
    let toast = document.getElementById('calcToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'calcToast';
        toast.className = 'calc-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2200);
}