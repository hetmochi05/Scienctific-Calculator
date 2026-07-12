/* ==========================================================
   display.js
   Everything that touches the screen + history list.
   Keeps a separate "pretty" version of the expression for
   display (×, ÷, −) while calculator-engine.js always works
   on the raw ASCII string (*, /, -).
   ========================================================== */

const resultEl = document.getElementById('result');
const exprEl = document.querySelector('.expression');
const historyListEl = document.querySelector('.history-list');
const clearHistoryBtn = document.querySelector('.clear-history');

let calcHistory = [];

// Cosmetic-only: swap raw operators for nicer-looking symbols on screen.
function prettifyExpr(str) {
    let out = str
        .replace(/\*/g, '×')
        .replace(/\//g, '÷');

    // A bare negative number on its own -- e.g. a calculated result like
    // "-2" -- stays plain. Only wrap negatives that appear as part of a
    // bigger expression, e.g. "8+-6" -> "8+(-6)" or "-5+3" -> "(-5)+3".
    const isBareNegativeNumber = /^-(\d+\.?\d*|\.\d+)$/.test(str);

    if (!isBareNegativeNumber) {
        out = out.replace(/(^|[+\-×÷^#(])-(\d+\.?\d*|\.\d+)/g, (match, prefix, num) => {
            return `${prefix}(-${num})`;
        });
    }

    // Any "-" left over at this point is a real binary subtraction
    // operator (preceded by a digit or closing paren) — show it as "−".
    out = out.replace(/(?<=[0-9)])-/g, '−');

    return out;
}

function renderResult(rawStr) {
    resultEl.textContent = rawStr === '' ? '0' : prettifyExpr(rawStr);
}

function renderExpression(rawStr) {
    exprEl.textContent = prettifyExpr(rawStr);
}

function flashError() {
    resultEl.classList.add('input-error');
    setTimeout(() => resultEl.classList.remove('input-error'), 400);
}

function addToHistory(expr, result) {
    calcHistory.unshift({ expr: prettifyExpr(expr), result: String(result) });
    renderHistory();
}

function renderHistory() {
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
        div.innerHTML = `
            <button type="button" class="history-item-delete" aria-label="Delete this entry">
                <i class="fa-solid fa-trash"></i>
            </button>
            <small>${item.expr}</small><h2>${item.result}</h2>`;

        div.querySelector('.history-item-delete').addEventListener('click', (e) => {
            e.stopPropagation(); // don't also trigger the "load into display" click below
            deleteHistoryItem(index);
        });

        div.addEventListener('click', () => {
            currentValue = item.result;
            justCalculated = true;
            renderResult(currentValue);
            renderExpression('');
            if (historyPanel && historyPanel.classList.contains('history-open')) {
                closeHistoryDrawer();
            }
        });
        historyListEl.appendChild(div);
    });
}

function deleteHistoryItem(index) {
    calcHistory.splice(index, 1);
    renderHistory();
}

function clearHistory() {
    calcHistory = [];
    renderHistory();
}

clearHistoryBtn.addEventListener('click', clearHistory);