/* ==========================================================
   ui-controls.js
   All state and actions for button interactions:
   typing, clear/backspace, calculation, memory, angle mode,
   sound effects, basic/scientific mode toggle, and unary functions.
   ========================================================== */

let currentValue = "0";      // the raw expression string being typed
let justCalculated = false;  // true right after "=" — next digit starts fresh
let lastOperator = null;     // for repeat-equals
let lastOperand = null;
let angleMode = "DEG";       // "DEG" or "RAD"
let secondMode = false;
let memoryValue = 0;
let ansValue = "0";

// Sound & Haptics state with persistence
let isMuted = localStorage.getItem("smart_calc_muted") === "true";
let clickSound;
try {
    clickSound = new Audio("assets/sounds/Music.mp3");
} catch { /* audio not supported */ }

function playClick() {
    if (isMuted || !clickSound) return;
    try {
        clickSound.volume = 0.25;
        clickSound.currentTime = 0;
        clickSound.play().catch(() => { });
    } catch { }
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem("smart_calc_muted", isMuted ? "true" : "false");
    updateSoundButtonUI();
}

function updateSoundButtonUI() {
    const soundBtn = document.getElementById("toggleSoundBtn");
    if (soundBtn) {
        soundBtn.innerHTML = isMuted
            ? '<i class="fa-solid fa-volume-xmark"></i>'
            : '<i class="fa-solid fa-volume-high"></i>';
        soundBtn.setAttribute("aria-label", isMuted ? "Unmute sound" : "Mute sound");
        soundBtn.title = isMuted ? "Sound: Muted (Click to unmute)" : "Sound: On (Click to mute)";
    }
}

function haptic(type = "light") {
    if (!navigator.vibrate) return;
    if (type === "light") navigator.vibrate(10);
    else if (type === "medium") navigator.vibrate([15, 10, 15]);
    else if (type === "heavy") navigator.vibrate([30, 20, 30]);
}

// Mode toggle: 'scientific' or 'basic'
let currentMode = localStorage.getItem("smart_calc_mode") || "scientific";

function setCalculatorMode(mode) {
    currentMode = mode;
    localStorage.setItem("smart_calc_mode", mode);

    const calcWrapper = document.querySelector(".calculator");
    const modeToggleBtn = document.getElementById("inlineModeToggle");
    const modeHeaderBtn = document.getElementById("headerModeToggle");

    if (calcWrapper) {
        if (mode === "basic") {
            calcWrapper.classList.add("mode-basic");
        } else {
            calcWrapper.classList.remove("mode-basic");
        }
    }

    if (modeToggleBtn) {
        modeToggleBtn.innerHTML = mode === "basic"
            ? '<i class="fa-solid fa-flask"></i>'
            : '<i class="fa-solid fa-calculator"></i>';
        modeToggleBtn.title = mode === "basic" ? "Switch to Scientific Mode" : "Switch to Basic Mode";
        modeToggleBtn.setAttribute("aria-label", modeToggleBtn.title);
    }

    if (modeHeaderBtn) {
        const textSpan = modeHeaderBtn.querySelector(".mode-text");
        if (textSpan) textSpan.textContent = mode === "basic" ? "Standard" : "Scientific";
        modeHeaderBtn.title = mode === "basic" ? "Mode: Standard (Click to switch to Scientific)" : "Mode: Scientific (Click to switch to Standard)";
    }
}

function toggleCalculatorMode() {
    playClick();
    setCalculatorMode(currentMode === "scientific" ? "basic" : "scientific");
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
            const trailingRun = currentValue.match(/[+\-*/^#]+$/)[0];

            if (value === "-" && lastChar !== "-") {
                // Extend run to start a negative number, e.g. "8+" -> "8+-"
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
    const segment = splitIndex === -1 ? expr : expr.slice(splitIndex + 1);

    if (segment === "") return;

    const wasNegative = segment.startsWith("-");
    const bare = segment.replace(/^-+/, "");

    currentValue = before + (wasNegative ? bare : "-" + bare);
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

    if (currentValue === "Error") {
        clearDisplay();
        return;
    }

    currentValue = currentValue.slice(0, -1);
    if (currentValue === "" || currentValue === "-") currentValue = "0";

    justCalculated = false;
    renderResult(currentValue);
}

function calculate() {
    playClick();
    haptic("heavy");

    try {
        let originalExpression = currentValue;

        // Repeat "=" behavior: e.g. "5+3=" -> 8, pressing "=" again calculates 8+3=11
        const isPlainNumber = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(originalExpression);
        if (justCalculated && isPlainNumber && lastOperator !== null && lastOperand !== null) {
            originalExpression = originalExpression + lastOperator + lastOperand;
        }

        // Clean trailing dangling operators (e.g. "5+3+" -> "5+3")
        let cleanedExpression = originalExpression.replace(/[+\-*/^#]+$/, "");
        if (!cleanedExpression) cleanedExpression = "0";

        let expression = cleanedExpression;
        expression = convertPercents(expression);
        expression = solveBrackets(expression);

        let result = calculateExpression(expression);

        if (result === "Error" || typeof result !== "number" || isNaN(result) || !isFinite(result)) {
            currentValue = "Error";
            renderResult(currentValue);
            flashError();
        } else {
            if (!(justCalculated && isPlainNumber)) {
                const lastOp = extractLastOperation(cleanedExpression);
                if (lastOp) {
                    lastOperator = lastOp.operator;
                    lastOperand = lastOp.operand;
                }
            }

            result = roundPrecision(result, 12);
            currentValue = String(result);
            ansValue = currentValue;
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

// Apply unary function to the active number segment
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

    result = roundPrecision(result, 12);
    currentValue = before + String(result);
    justCalculated = false;
    renderResult(currentValue);
}

// Accurate trigonometry with exact angle normalization
function safeSin(angle) {
    if (angleMode === "DEG") {
        const normalized = ((angle % 360) + 360) % 360;
        if (normalized === 0 || normalized === 180) return 0;
        if (normalized === 90) return 1;
        if (normalized === 270) return -1;
        return roundPrecision(Math.sin(toRad(angle)));
    }
    const val = Math.sin(angle);
    return Math.abs(val) < 1e-15 ? 0 : roundPrecision(val);
}

function safeCos(angle) {
    if (angleMode === "DEG") {
        const normalized = ((angle % 360) + 360) % 360;
        if (normalized === 90 || normalized === 270) return 0;
        if (normalized === 0) return 1;
        if (normalized === 180) return -1;
        return roundPrecision(Math.cos(toRad(angle)));
    }
    const val = Math.cos(angle);
    return Math.abs(val) < 1e-15 ? 0 : roundPrecision(val);
}

function safeTan(angle) {
    if (angleMode === "DEG") {
        const normalized = ((angle % 360) + 360) % 360;
        if (normalized === 90 || normalized === 270) return NaN; // Undefined -> Error
        if (normalized === 0 || normalized === 180) return 0;
        if (normalized === 45 || normalized === 225) return 1;
        if (normalized === 135 || normalized === 315) return -1;
        return roundPrecision(Math.tan(toRad(angle)));
    }
    if (Math.abs(Math.cos(angle)) < 1e-15) return NaN;
    const val = Math.tan(angle);
    return Math.abs(val) < 1e-15 ? 0 : roundPrecision(val);
}

function applyTrig(name) {
    const fns = secondMode ? {
        sin: n => {
            if (n < -1 || n > 1) return NaN;
            return angleMode === "DEG" ? roundPrecision(toDeg(Math.asin(n))) : roundPrecision(Math.asin(n));
        },
        cos: n => {
            if (n < -1 || n > 1) return NaN;
            return angleMode === "DEG" ? roundPrecision(toDeg(Math.acos(n))) : roundPrecision(Math.acos(n));
        },
        tan: n => angleMode === "DEG" ? roundPrecision(toDeg(Math.atan(n))) : roundPrecision(Math.atan(n)),
    } : {
        sin: safeSin,
        cos: safeCos,
        tan: safeTan,
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
    appendValue(String(roundPrecision(value, 12)));
}

function toggleSecondMode(btnEl) {
    secondMode = !secondMode;
    if (btnEl) btnEl.classList.toggle("active-second", secondMode);

    const map = {
        sin: "sin⁻¹", cos: "cos⁻¹", tan: "tan⁻¹",
        "sin⁻¹": "sin", "cos⁻¹": "cos", "tan⁻¹": "tan",
        sinh: "sinh⁻¹", cosh: "cosh⁻¹", tanh: "tanh⁻¹",
        "sinh⁻¹": "sinh", "cosh⁻¹": "cosh", "tanh⁻¹": "tanh"
    };
    document.querySelectorAll(".buttons button").forEach(btn => {
        const t = btn.textContent.trim();
        if (map[t]) btn.textContent = map[t];
    });

    updateSecondIndicator();
}

function toggleAngleModeBtn(btnEl) {
    angleMode = angleMode === "DEG" ? "RAD" : "DEG";
    if (btnEl) btnEl.textContent = angleMode === "DEG" ? "Rad" : "Deg";
    updateAngleIndicator();
}

function insertExponentEE() {
    if (currentValue === "Error" || currentValue === "0") return;
    appendValue("*");
    appendValue("1");
    appendValue("0");
    appendValue("^");
}

// Memory operations
function memoryClear() {
    playClick();
    memoryValue = 0;
    updateMemoryIndicator();
}

function memoryAdd() {
    playClick();
    const val = Number(currentValue);
    if (!isNaN(val)) memoryValue += val;
    justCalculated = true;
    updateMemoryIndicator();
}

function memorySubtract() {
    playClick();
    const val = Number(currentValue);
    if (!isNaN(val)) memoryValue -= val;
    justCalculated = true;
    updateMemoryIndicator();
}

function memoryRecall() {
    playClick();
    haptic("light");
    if (currentValue === "Error") currentValue = "0";

    const memStr = String(roundPrecision(memoryValue, 12));

    if (justCalculated) {
        currentValue = memStr;
        justCalculated = false;
    } else {
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
        currentValue = before + memStr;
    }

    renderResult(currentValue);
}

// Visual indicators updates
function updateAngleIndicator() {
    const badge = document.getElementById("angleBadge");
    if (badge) badge.textContent = angleMode;
}

function updateMemoryIndicator() {
    const badge = document.getElementById("memoryBadge");
    if (badge) {
        badge.classList.toggle("active-badge", memoryValue !== 0);
        badge.textContent = memoryValue !== 0 ? `M (${roundPrecision(memoryValue, 4)})` : "M";
    }
}

function updateSecondIndicator() {
    const badge = document.getElementById("secondBadge");
    if (badge) {
        badge.classList.toggle("active-badge", secondMode);
    }
}