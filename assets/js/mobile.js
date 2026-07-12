/* ==========================================================
   mobile.js
   Mobile-only UI: the slide-in history drawer, and switching
   between Basic / Scientific button layouts (auto-detected
   from orientation, or manually toggled).
   ========================================================== */

const historyPanel = document.querySelector('.history');
const historyToggleBtn = document.querySelector('.mobile-history-toggle');
const historyCloseBtn = document.querySelector('.history-close');
const historyBackdrop = document.querySelector('.history-backdrop');

function openHistoryDrawer() {
    historyPanel.classList.add('history-open');
    historyBackdrop.classList.add('visible');
}

function closeHistoryDrawer() {
    historyPanel.classList.remove('history-open');
    historyBackdrop.classList.remove('visible');
}

if (historyToggleBtn) historyToggleBtn.addEventListener('click', openHistoryDrawer);
if (historyCloseBtn) historyCloseBtn.addEventListener('click', closeHistoryDrawer);
if (historyBackdrop) historyBackdrop.addEventListener('click', closeHistoryDrawer);

// ---------- Basic / Scientific mode (mobile) ----------
const modeToggleBtn = document.querySelector('.mode-toggle-btn');
const orientationQuery = window.matchMedia('(orientation: portrait)');
let calcMode = orientationQuery.matches ? 'basic' : 'scientific';

function applyCalcMode(mode) {
    calcMode = mode;
    document.body.setAttribute('data-calc-mode', mode);
    if (modeToggleBtn) {
        const icon = modeToggleBtn.querySelector('i');
        if (mode === 'basic') {
            icon.className = 'fa-solid fa-square-root-variable';
            modeToggleBtn.setAttribute('aria-label', 'Switch to Scientific mode');
        } else {
            icon.className = 'fa-solid fa-calculator';
            modeToggleBtn.setAttribute('aria-label', 'Switch to Basic mode');
        }
    }
}

applyCalcMode(calcMode);

orientationQuery.addEventListener('change', (e) => {
    applyCalcMode(e.matches ? 'basic' : 'scientific');
});

if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
        applyCalcMode(calcMode === 'basic' ? 'scientific' : 'basic');
    });
}
