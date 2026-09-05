/* ==========================================================
   app.js
   Application bootstrap: wires button events to ui-controls.js,
   binds header controls (mode, sound, history drawer), and
   initializes app state from localStorage.
   ========================================================== */

const allButtons = document.querySelectorAll('.buttons button');
const backspaceBtn = document.querySelector('.backspace-btn');
const headerModeToggle = document.getElementById('headerModeToggle');
const toggleSoundBtn = document.getElementById('toggleSoundBtn');
const openHistoryDrawerBtn = document.getElementById('openHistoryDrawerBtn');
const copyResultBtn = document.getElementById('copyResultBtn');

function handleButton(btn) {
    // Mode toggle button
    if (btn.id === 'inlineModeToggle' || btn.getAttribute('data-action') === 'toggle-mode') {
        return toggleCalculatorMode();
    }

    const label = btn.textContent.trim();

    // Digits + decimal
    if (/^[0-9]$/.test(label)) return appendValue(label);
    if (label === '.') return appendValue('.');

    // Parens
    if (label === '(') return appendValue('(');
    if (label === ')') return appendValue(')');

    // Basic operators
    if (label === '+') return appendValue('+');
    if (label === '−' || label === '-') return appendValue('-');
    if (label === '×' || label === '*') return appendValue('*');
    if (label === '÷' || label === '/') return appendValue('/');
    if (label === '=') return calculate();

    // Control
    if (label === 'AC') return clearDisplay();
    if (label === '+/-') return toggleSign();
    if (label === '%') return appendValue('%');

    // Memory
    if (label === 'mc') return memoryClear();
    if (label === 'm+') return memoryAdd();
    if (label === 'm−' || label === 'm-') return memorySubtract();
    if (label === 'mr') return memoryRecall();

    // Modes
    if (label === 'Rad' || label === 'Deg') return toggleAngleModeBtn(btn);
    if (label === '2nd') return toggleSecondMode(btn);

    // Binary sci operators
    if (label === 'xʸ') return appendValue('^');
    if (label === 'ʸ√x' || label === 'ⁿ√x') return appendValue('#');

    // Unary sci functions
    if (label === 'x²') return applyUnary(x => Math.pow(x, 2));
    if (label === 'x³') return applyUnary(x => Math.pow(x, 3));
    if (label === 'eˣ') return applyUnary(x => Math.exp(x));
    if (label === '10ˣ') return applyUnary(x => Math.pow(10, x));
    if (label === '1/x') return applyUnary(x => 1 / x);
    if (label === '²√x') return applyUnary(x => Math.sqrt(x));
    if (label === '³√x') return applyUnary(x => Math.cbrt(x));
    if (label === 'ln') return applyUnary(x => Math.log(x));
    if (label === 'log') return applyUnary(x => Math.log10(x));
    if (label === 'x!') return applyUnary(x => factorial(x));
    if (label === 'π') return insertConstant(Math.PI);
    if (label === 'e') return insertConstant(Math.E);
    if (label === 'EE') return insertExponentEE();

    // Trig functions
    if (label === 'sin' || label === 'sin⁻¹') return applyTrig('sin');
    if (label === 'cos' || label === 'cos⁻¹') return applyTrig('cos');
    if (label === 'tan' || label === 'tan⁻¹') return applyTrig('tan');

    // Hyperbolic functions
    if (label === 'sinh' || label === 'sinh⁻¹') return applyHyp('sinh');
    if (label === 'cosh' || label === 'cosh⁻¹') return applyHyp('cosh');
    if (label === 'tanh' || label === 'tanh⁻¹') return applyHyp('tanh');

    // Ans (Last result)
    if (label === 'Ans') {
        if (ansValue && ansValue !== 'Error') {
            appendValue(ansValue);
        }
        return;
    }
}

allButtons.forEach(btn => {
    btn.addEventListener('click', () => handleButton(btn));
});

if (backspaceBtn) {
    backspaceBtn.addEventListener('click', deleteLast);
}

if (headerModeToggle) {
    headerModeToggle.addEventListener('click', toggleCalculatorMode);
}

if (toggleSoundBtn) {
    toggleSoundBtn.addEventListener('click', toggleMute);
}

if (openHistoryDrawerBtn) {
    openHistoryDrawerBtn.addEventListener('click', toggleHistoryDrawer);
}

if (copyResultBtn) {
    copyResultBtn.addEventListener('click', copyResultToClipboard);
}

// ---------- Initialization ----------
setCalculatorMode(currentMode);
updateSoundButtonUI();
updateAngleIndicator();
updateMemoryIndicator();
clearDisplay();
renderHistory();
