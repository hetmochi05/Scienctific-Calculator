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
    return str
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/(?<=[0-9)])-/g, '−'); // only binary minus, keep leading "-" as-is for typing
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

    calcHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<small>${item.expr}</small><h2>${item.result}</h2>`;
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

function clearHistory() {
    calcHistory = [];
    renderHistory();
}

clearHistoryBtn.addEventListener('click', clearHistory);
