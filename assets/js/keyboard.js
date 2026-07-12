/* ==========================================================
   keyboard.js
   Lets people type on a physical keyboard instead of clicking.
   Keys map directly to the raw tokens the engine expects.
   ========================================================== */

document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (key.trim() !== "" && !isNaN(key)) { appendValue(key); return; }
    if (CALC_OPERATORS.includes(key)) { appendValue(key); return; }
    if (key === ".") { appendValue("."); return; }
    if (key === "(" || key === ")") { appendValue(key); return; }
    if (key === "%") { appendValue("%"); return; }
    if (key === "Enter" || key === "=") { event.preventDefault(); calculate(); return; }
    if (key === "Backspace") { deleteLast(); return; }
    if (key === "Escape") { clearDisplay(); return; }
});
