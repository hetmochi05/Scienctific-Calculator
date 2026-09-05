/* ==========================================================
   keyboard.js
   Enables physical keyboard input for the calculator.
   Safely ignores keystrokes when focusing on text inputs or
   when tool screens (Age/Currency) are active.
   ========================================================== */

document.addEventListener("keydown", function (event) {
    // 1. Guard against capturing keystrokes in form inputs / dropdowns
    const target = event.target;
    if (
        target &&
        (target.tagName === "INPUT" ||
            target.tagName === "SELECT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
    ) {
        return;
    }

    // 2. Guard: only listen when the calculator screen is visible
    const calcScreen = document.getElementById("calcScreen");
    if (calcScreen && !calcScreen.classList.contains("active")) {
        return;
    }

    const key = event.key;

    // Digits
    if (/^[0-9]$/.test(key)) {
        appendValue(key);
        return;
    }

    // Numpad Support
    if (event.code && event.code.startsWith("Numpad")) {
        if (/^Numpad[0-9]$/.test(event.code)) {
            appendValue(event.code.replace("Numpad", ""));
            return;
        }
        if (event.code === "NumpadDecimal") { appendValue("."); return; }
        if (event.code === "NumpadAdd") { appendValue("+"); return; }
        if (event.code === "NumpadSubtract") { appendValue("-"); return; }
        if (event.code === "NumpadMultiply") { appendValue("*"); return; }
        if (event.code === "NumpadDivide") { event.preventDefault(); appendValue("/"); return; }
        if (event.code === "NumpadEnter") { event.preventDefault(); calculate(); return; }
    }

    // Standard Operators
    if (key === "+" || key === "-" || key === "*") {
        appendValue(key);
        return;
    }
    if (key === "/") {
        event.preventDefault(); // prevent Firefox quick find
        appendValue("/");
        return;
    }
    if (key === "^") {
        appendValue("^");
        return;
    }
    if (key === ".") {
        appendValue(".");
        return;
    }
    if (key === "(" || key === ")") {
        appendValue(key);
        return;
    }
    if (key === "%") {
        appendValue("%");
        return;
    }

    // Execution & Editing
    if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
        return;
    }
    if (key === "Backspace") {
        event.preventDefault();
        deleteLast();
        return;
    }
    if (key === "Escape") {
        event.preventDefault();
        clearDisplay();
        return;
    }

    // Quick Scientific Shortcuts (without modifiers like Ctrl/Alt)
    if (!event.ctrlKey && !event.altKey && !event.metaKey) {
        if (key.toLowerCase() === "p") {
            insertConstant(Math.PI);
            return;
        }
        if (key === "e") {
            insertConstant(Math.E);
            return;
        }
        if (key === "!") {
            applyUnary(factorial);
            return;
        }
        if (key.toLowerCase() === "h") {
            toggleHistoryDrawer();
            return;
        }
        if (key.toLowerCase() === "m") {
            toggleCalculatorMode();
            return;
        }
    }
});
