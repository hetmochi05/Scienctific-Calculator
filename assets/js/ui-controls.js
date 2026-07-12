/* ==========================================================
   ui-controls.js
   All the state + actions a button press can trigger:
   typing, clear/backspace, calculate, memory, angle mode,
   2nd/inverse toggle, and the unary scientific functions.
   Built on top of calculator-engine.js's pure functions.
   ========================================================== */

let currentValue = "0";      // the raw expression string being typed
let justCalculated = false;  // true right after "=" — next digit starts fresh
let lastOperator = null;     // for repeat-equals
let lastOperand = null;
let angleMode = "DEG";       // "DEG" or "RAD"
let secondMode = false;
let memoryValue = 0;

let clickSound;
try {
    clickSound = new Audio("assets/sounds/Music.mp3");
} catch { /* no audio support — silently skip */ }

function playClick() {
    if (!clickSound) return;
    clickSound.volume = 0.3;
    clickSound.currentTime = 0;
    clickSound.play().catch(() => { });
}

function haptic(type = "light") {
    if (!navigator.vibrate) return;
    if (type === "light") navigator.vibrate(10);
    else if (type === "medium") navigator.vibrate([15, 10, 15]);
    else if (type === "heavy") navigator.vibrate([30, 20, 30]);
}

function hasDecimalInCurrentNumber() {
    let parts = currentValue.split(/[+\-*/%^#]/);
    let currentNumber = parts[parts.length - 1];
    return currentNumber.includes(".");
}

// Append a raw token ("0"-"9", ".", "+", "-", "*", "/", "^", "#", "(", ")", "%")
function appendValue(value) {
    playClick();
    haptic("light");

    const lastChar = currentValue.slice(-1);

    if (currentValue === "Error") currentValue = "0";

    if (justCalculated && !CALC_OPERATORS.includes(value)) {
        currentValue = "0";
        justCalculated = false;
    } else if (justCalculated && CALC_OPERATORS.includes(value)) {
        // Continuing from a fresh result (e.g. after "=" or picking a
        // history item) with an operator — keep the number, just stop
        // treating it as "fresh" so the next digit appends instead of
        // wiping the operator back out.
        justCalculated = false;
    }

    // Prevent starting with an operator (except "-")
    if (currentValue === "0" && CALC_OPERATORS.includes(value) && value !== "-") {
        renderResult(currentValue);
        return;
    }

    if (CALC_OPERATORS.includes(value)) {
        if (currentValue === "0" && value === "-") {
            currentValue = "-";
            renderResult(currentValue);
            return;
        }

        if (CALC_OPERATORS.includes(lastChar)) {
            // The full run of operator chars at the end (e.g. "+", or "+-"
            // if a negative number was started). Always replace the whole
            // run, not just the last character, so a stranded leading
            // operator can't survive multiple quick operator switches.
            const trailingRun = currentValue.match(/[+\-*/^#]+$/)[0];

            if (value === "-" && lastChar !== "-") {
                // Extend the run to start typing a negative number, e.g. "8+" -> "8+-"
                currentValue += "-";
                renderResult(currentValue);
                return;
            }
            currentValue = currentValue.slice(0, currentValue.length - trailingRun.length) + value;
            renderResult(currentValue);
            return;
        }
    }

    if (value === "." && lastChar === ".") { renderResult(currentValue); return; }

    if (value === "." && CALC_OPERATORS.includes(lastChar)) {
        currentValue += "0";
    }

    if (value === "." && currentValue === "0") {
        currentValue = "0.";
        renderResult(currentValue);
        return;
    }

    if (value === "." && hasDecimalInCurrentNumber()) { renderResult(currentValue); return; }

    if (currentValue === "0" && value !== ".") {
        currentValue = value;
    } else {
        currentValue += value;
    }

    renderResult(currentValue);
}

function toggleSign() {
    playClick();
    if (currentValue === "0" || currentValue === "Error") return;

    let exp = currentValue;

    if (!/[+\-*/%^#]/.test(exp.slice(1))) {
        currentValue = exp.startsWith("-") ? exp.slice(1) : "-" + exp;
        renderResult(currentValue);
        return;
    }

    let parts = exp.split(/([+\-*/^#])/);
    let last = parts.pop();

    if (last === "") { parts.push(last); return; }

    last = last.startsWith("-") ? last.slice(1) : "-" + last;
    parts.push(last);
    currentValue = parts.join("");
    renderResult(currentValue);
}

function clearDisplay() {
    playClick();
    haptic("medium");

    currentValue = "0";
    renderResult(currentValue);
    renderExpression("");
    justCalculated = false;
    lastOperator = null;
    lastOperand = null;
}

function deleteLast() {
    playClick();
    haptic("medium");

    if (currentValue === "Error") return;

    currentValue = currentValue.slice(0, -1);
    if (currentValue === "") currentValue = "0";

    justCalculated = false;
    renderResult(currentValue);
}

function calculate() {
    playClick();
    haptic("heavy");

    try {
        let originalExpression = currentValue;

        // Real-calculator "repeat =" behavior
        const isPlainNumber = /^-?\d*\.?\d+$/.test(originalExpression);
        if (justCalculated && isPlainNumber && lastOperator !== null && lastOperand !== null) {
            originalExpression = originalExpression + lastOperator + lastOperand;
        }

        let expression = originalExpression;
        expression = convertPercents(expression);
        expression = solveBrackets(expression);

        let result = calculateExpression(expression);

        if (result === "Error" || typeof result !== "number" || isNaN(result) || !isFinite(result)) {
            currentValue = "Error";
            renderResult(currentValue);
            flashError();
        } else {
            if (!(justCalculated && isPlainNumber)) {
                const lastOp = extractLastOperation(originalExpression);
                if (lastOp) {
                    lastOperator = lastOp.operator;
                    lastOperand = lastOp.operand;
                }
            }

            currentValue = String(Number(result.toFixed(8)));
            renderExpression(originalExpression);
            renderResult(currentValue);
            addToHistory(originalExpression, currentValue);
        }

        justCalculated = true;
    } catch {
        currentValue = "Error";
        renderResult(currentValue);
        flashError();
        justCalculated = true;
    }
}

// Apply a unary function (sin, sqrt, x², etc.) to the number currently
// being typed — same instant-apply feel as a real calculator.
function applyUnary(fn) {
    playClick();
    if (currentValue === "Error") return;

    const expr = currentValue;

    let splitIndex = -1;
    for (let i = expr.length - 1; i >= 0; i--) {
        const ch = expr[i];
        if ("+-*/^#".includes(ch)) {
            const prevCh = i > 0 ? expr[i - 1] : null;
            const isSign = ch === "-" && (prevCh === null || "+-*/^#".includes(prevCh));
            if (!isSign) { splitIndex = i; break; }
        }
    }

    const before = splitIndex === -1 ? "" : expr.slice(0, splitIndex + 1);
    const lastNumStr = splitIndex === -1 ? expr : expr.slice(splitIndex + 1);
    const num = Number(lastNumStr);

    if (lastNumStr === "" || isNaN(num)) return;

    let result;
    try { result = fn(num); } catch { result = NaN; }

    if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
        currentValue = "Error";
        renderResult(currentValue);
        flashError();
        justCalculated = true;
        return;
    }

    currentValue = before + String(Number(result.toFixed(8)));
    justCalculated = false;
    renderResult(currentValue);
}

function applyTrig(name) {
    const fns = secondMode ? {
        sin: n => angleMode === "DEG" ? toDeg(Math.asin(n)) : Math.asin(n),
        cos: n => angleMode === "DEG" ? toDeg(Math.acos(n)) : Math.acos(n),
        tan: n => angleMode === "DEG" ? toDeg(Math.atan(n)) : Math.atan(n),
    } : {
        sin: n => Math.sin(angleMode === "DEG" ? toRad(n) : n),
        cos: n => Math.cos(angleMode === "DEG" ? toRad(n) : n),
        tan: n => Math.tan(angleMode === "DEG" ? toRad(n) : n),
    };
    applyUnary(fns[name]);
}

function applyHyp(name) {
    const fns = {
        sinh: secondMode ? Math.asinh : Math.sinh,
        cosh: secondMode ? Math.acosh : Math.cosh,
        tanh: secondMode ? Math.atanh : Math.tanh,
    };
    applyUnary(fns[name]);
}

function insertConstant(value) {
    appendValue(String(Number(value.toFixed(8))));
}

function toggleSecondMode(btnEl) {
    secondMode = !secondMode;
    if (btnEl) btnEl.classList.toggle('active-second', secondMode);

    const map = {
        sin: 'sin⁻¹', cos: 'cos⁻¹', tan: 'tan⁻¹',
        'sin⁻¹': 'sin', 'cos⁻¹': 'cos', 'tan⁻¹': 'tan',
        sinh: 'sinh⁻¹', cosh: 'cosh⁻¹', tanh: 'tanh⁻¹',
        'sinh⁻¹': 'sinh', 'cosh⁻¹': 'cosh', 'tanh⁻¹': 'tanh'
    };
    document.querySelectorAll('.buttons button').forEach(btn => {
        const t = btn.textContent.trim();
        if (map[t]) btn.textContent = map[t];
    });
}

function toggleAngleModeBtn(btnEl) {
    angleMode = angleMode === "DEG" ? "RAD" : "DEG";
    if (btnEl) btnEl.textContent = angleMode === "DEG" ? "Rad" : "Deg";
}

function insertExponentEE() {
    if (currentValue === "Error" || currentValue === "0") return;
    appendValue("*");
    appendValue("1");
    appendValue("0");
    appendValue("^");
}

// Memory
function memoryClear() { memoryValue = 0; }

function memoryAdd() {
    const val = Number(currentValue);
    if (!isNaN(val)) memoryValue += val;
    justCalculated = true;
}

function memorySubtract() {
    const val = Number(currentValue);
    if (!isNaN(val)) memoryValue -= val;
    justCalculated = true;
}

function memoryRecall() {
    appendValue(String(Number(memoryValue.toFixed(8))));
}