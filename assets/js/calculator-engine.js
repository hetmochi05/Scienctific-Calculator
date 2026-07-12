/* ==========================================================
   calculator-engine.js
   Pure calculation engine — no DOM references at all.
   Builds one continuous expression string (e.g. "100+15%*2"),
   then tokenizes + evaluates it with real operator precedence
   when equals is pressed. Ported from the original expression-
   string engine design, adapted to plug into this calculator.
   ========================================================== */

const CALC_OPERATORS = ["+", "-", "*", "/", "^", "#"];

function factorial(n) {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}

function toDeg(rad) { return rad * 180 / Math.PI; }
function toRad(deg) { return deg * Math.PI / 180; }

// Calculate a flat expression (no parentheses) without eval().
// Handles unary minus, then ^ / # (power / y-th root), then * /, then + -.
function calculateExpression(expression) {
    let tokens = expression.match(/\d*\.\d+|\d+|[+\-*/^#]/g);
    if (!tokens) return "Error";

    tokens = tokens.map(token => isNaN(token) ? token : Number(token));

    // Fix unary minus (e.g. "-5+3" or "3*-5")
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

    // ^ (power) and # (y-th root: a#b = a^(1/b)) — higher precedence than * /
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === "^") {
            let result = Math.pow(tokens[i - 1], tokens[i + 1]);
            tokens.splice(i - 1, 3, result);
            i--;
        } else if (tokens[i] === "#") {
            let result = Math.pow(tokens[i - 1], 1 / tokens[i + 1]);
            tokens.splice(i - 1, 3, result);
            i--;
        }
    }

    // * and /
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === "*" || tokens[i] === "/") {
            if (tokens[i] === "/" && tokens[i + 1] === 0) return "Error";
            let result = tokens[i] === "*" ? tokens[i - 1] * tokens[i + 1] : tokens[i - 1] / tokens[i + 1];
            tokens.splice(i - 1, 3, result);
            i--;
        }
    }

    // + and -
    let result = tokens[0];
    for (let i = 1; i < tokens.length; i += 2) {
        if (tokens[i] === "+") result += tokens[i + 1];
        else if (tokens[i] === "-") result -= tokens[i + 1];
    }

    return result;
}

// Recursively resolve parentheses, innermost first.
function solveBrackets(expression) {
    while (expression.includes("(")) {
        expression = expression.replace(/\(([^()]+)\)/, (match, innerExp) => {
            return calculateExpression(innerExp);
        });
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
    let tokens = expr.match(/\d*\.\d+|\d+|[+\-*/^#]/g);
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
