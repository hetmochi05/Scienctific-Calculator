/* ==========================================================
   calculator-engine.js
   Pure calculation engine — no DOM references at all.
   Builds continuous expression strings, handles implicit
   multiplication, auto-balances brackets, tokenizes scientific
   notation, and evaluates with correct operator precedence.
   ========================================================== */

const CALC_OPERATORS = ["+", "-", "*", "/", "^", "#"];

function factorial(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function toDeg(rad) { return rad * 180 / Math.PI; }
function toRad(deg) { return deg * Math.PI / 180; }

// Normalize floating-point inaccuracies (e.g. 0.1 + 0.2 = 0.30000000000000004 -> 0.3)
// without truncating small numbers like 1e-12.
function roundPrecision(num, digits = 12) {
    if (typeof num !== "number" || isNaN(num) || !isFinite(num)) return num;
    const rounded = parseFloat(num.toPrecision(digits));
    return Object.is(rounded, -0) ? 0 : rounded;
}

// Calculate a flat expression (no parentheses) without eval().
// Handles ^ / # (power / y-th root) first — including a signed exponent
// like "2^-3" — then folds remaining unary minus signs, then * /, then + -.
// Unary minus is resolved AFTER power/root so that "-2^2" correctly means
// "-(2^2)" = -4, matching standard math convention (and JS itself, which
// refuses to parse "-2**2" for the same reason).
function calculateExpression(expression) {
    // Match numbers (including scientific notation like 1e-5 or 3.2e+4) and operators
    const tokenRegex = /(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[+\-*/^#]/g;
    let tokens = expression.match(tokenRegex);
    if (!tokens) return "Error";

    tokens = tokens.map(token => isNaN(token) ? token : Number(token));

    // A malformed/orphaned operator (no valid left operand, e.g. leading
    // "*5" from mismatched parentheses like ")5(") must never be able to
    // reach splice(i-1, ...) with a negative index — that previously caused
    // an infinite loop. Bail out cleanly instead.
    const hasValidOperandBefore = (i) => i > 0 && typeof tokens[i - 1] === "number";

    // ^ (power) and # (y-th root: a#b = a^(1/b)) — higher precedence than * /.
    // Resolves a signed exponent inline (e.g. "2^-3") without touching the
    // base's own sign, which is handled afterward. Scanned right-to-left so
    // chained operators are right-associative (2^3^2 = 2^(3^2) = 512, the
    // standard math/most-calculators convention), not left-associative.
    for (let i = tokens.length - 1; i >= 0; i--) {
        if (tokens[i] === "^" || tokens[i] === "#") {
            if (!hasValidOperandBefore(i)) return "Error";

            let span = 3; // operator, base, exponent
            let exponent = tokens[i + 1];
            if (exponent === "-") {
                exponent = -Number(tokens[i + 2]);
                span = 4;
            }
            if (typeof exponent !== "number" || isNaN(exponent)) return "Error";

            const base = tokens[i - 1];
            let result;
            if (tokens[i] === "^") {
                result = Math.pow(base, exponent);
            } else if (base < 0 && exponent % 2 !== 0 && Math.floor(exponent) === exponent) {
                // Odd roots of negative numbers: e.g. (-8)#3 = -2
                result = -Math.pow(-base, 1 / exponent);
            } else {
                result = Math.pow(base, 1 / exponent);
            }
            tokens.splice(i - 1, span, result);
        }
    }

    // Fold unary minus now that power/root no longer needs the raw sign
    // (e.g. "-5+3" or "3*-5"). Any "-" still lacking a right-hand number
    // (e.g. trailing "-" from a malformed expression) is left for the
    // final loop below, which safely ignores incomplete operators.
    for (let i = 0; i < tokens.length; i++) {
        if (
            tokens[i] === "-" &&
            (i === 0 || CALC_OPERATORS.includes(tokens[i - 1])) &&
            typeof tokens[i + 1] === "number"
        ) {
            tokens[i + 1] = -tokens[i + 1];
            tokens.splice(i, 1);
            i--;
        }
    }

    // * and /
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === "*" || tokens[i] === "/") {
            if (!hasValidOperandBefore(i) || typeof tokens[i + 1] !== "number") return "Error";
            if (tokens[i] === "/" && tokens[i + 1] === 0) return "Error";
            let result = tokens[i] === "*" ? tokens[i - 1] * tokens[i + 1] : tokens[i - 1] / tokens[i + 1];
            tokens.splice(i - 1, 3, result);
            i--;
        }
    }

    // + and - (any stray non-numeric/operator tokens are ignored rather
    // than crashing, since malformed input is possible via free-typed
    // parentheses)
    if (typeof tokens[0] !== "number") return "Error";
    let result = tokens[0];
    for (let i = 1; i < tokens.length; i += 2) {
        if (typeof tokens[i + 1] !== "number") break;
        if (tokens[i] === "+") result += tokens[i + 1];
        else if (tokens[i] === "-") result -= tokens[i + 1];
        else break;
    }

    return roundPrecision(result);
}

// Preprocess and resolve parentheses safely without infinite loops.
function solveBrackets(expression) {
    if (!expression) return "0";

    // 1. Auto-balance parentheses: close any unclosed opening parentheses
    let openCount = (expression.match(/\(/g) || []).length;
    let closeCount = (expression.match(/\)/g) || []).length;
    while (openCount > closeCount) {
        expression += ")";
        closeCount++;
    }

    // 2. Insert implicit multiplication:
    // e.g. "5(2)" -> "5*(2)", "(2)(3)" -> "(2)*(3)", "(2)3" -> "(2)*3"
    expression = expression.replace(/(\d)\(/g, "$1*(");
    expression = expression.replace(/\)(\d)/g, ")*$1");
    expression = expression.replace(/\)\(/g, ")*(");

    // 3. Resolve inner parentheses innermost first
    let guard = 0;
    while (expression.includes("(") && guard++ < 50) {
        const prev = expression;
        expression = expression.replace(/\(([^()]+)\)/, (match, innerExp) => {
            return calculateExpression(innerExp);
        });
        // If no replacement occurred (e.g. malformed brackets), remove leftover parens
        if (expression === prev) {
            expression = expression.replace(/[()]/g, "");
            break;
        }
    }

    return expression;
}

// Convert "%" the way a real calculator does:
// - "50%" alone            -> 0.5
// - "100+15%" / "100-15%"  -> 15% OF 100 (i.e. 100 + 100*15/100 = 115)
// - "100*15%" / "100/15%"  -> plain fraction (100 * 0.15)
function convertPercents(expression) {
    const percentRegex = /(\d+(\.\d+)?)%/;
    let match;
    let guard = 0;

    while ((match = expression.match(percentRegex)) && guard++ < 50) {
        const idx = match.index;
        const num = Number(match[1]);
        const before = expression.slice(0, idx);
        const after = expression.slice(idx + match[0].length);
        const precedingOp = before.slice(-1);

        let replacement;
        if (precedingOp === "+" || precedingOp === "-") {
            const baseExpr = before.slice(0, -1);
            let baseVal = baseExpr === "" ? NaN : calculateExpression(solveBrackets(baseExpr));
            if (baseExpr === "" || baseVal === "Error" || isNaN(baseVal)) {
                replacement = `(${num}/100)`;
            } else {
                replacement = `(${baseVal}*${num}/100)`;
            }
        } else {
            replacement = `(${num}/100)`;
        }

        expression = before + replacement + after;
    }

    return expression;
}

// Extract the final "operator operand" pair from an expression, for
// repeat-equals (e.g. "5+3" -> {operator:"+", operand:3}).
function extractLastOperation(expr) {
    const tokenRegex = /(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[+\-*/^#]/g;
    let tokens = expr.match(tokenRegex);
    if (!tokens) return null;

    tokens = tokens.map(token => isNaN(token) ? token : Number(token));

    for (let i = 0; i < tokens.length; i++) {
        if (
            tokens[i] === "-" &&
            (i === 0 || CALC_OPERATORS.includes(tokens[i - 1]))
        ) {
            tokens[i + 1] = -Number(tokens[i + 1]);
            tokens.splice(i, 1);
            i--;
        }
    }

    if (tokens.length < 3) return null;

    const operand = tokens[tokens.length - 1];
    const operator = tokens[tokens.length - 2];

    if (typeof operand !== "number" || !CALC_OPERATORS.includes(operator)) return null;

    return { operator, operand };
}
