/* ==========================================================
   app.js
   Scientific Calculator Logic
   Works with the provided index.html + style.css
   ========================================================== */

(() => {
  // ---------- DOM references ----------
  const resultEl = document.getElementById('result');
  const exprEl = document.querySelector('.expression');
  const historyList = document.querySelector('.history-list');
  const clearHistoryBtn = document.querySelector('.clear-history');
  const allButtons = document.querySelectorAll('.buttons button');

  // Find the Rad/Deg + 2nd buttons by text (so we can update their labels)
  let radBtn = null;
  let secondBtn = null;
  allButtons.forEach(btn => {
    const t = btn.textContent.trim();
    if (t === 'Rad' || t === 'Deg') radBtn = btn;
    if (t === '2nd') secondBtn = btn;
  });

  // ---------- State ----------
  const state = {
    current: '0',      // string currently being typed / shown
    previous: null,     // number, left operand
    operator: null,      // '+','-','*','/','pow','yroot'
    overwrite: true,    // next digit replaces current
    angleMode: 'deg',    // 'deg' | 'rad'
    secondMode: false,
    memory: 0,
    stack: [],           // for parentheses: {previous, operator}
    lastExprText: ''     // text shown on the small "expression" line
  };

  const history = [];

  // ---------- Helpers ----------
  function formatNumber(n) {
    if (n === null || n === undefined || Number.isNaN(n)) return 'Error';
    if (!Number.isFinite(n)) return 'Error';
    // Trim floating point noise, keep reasonable precision
    let s = parseFloat(n.toPrecision(12)).toString();
    return s;
  }

  function opSymbol(op) {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      case 'pow': return 'xʸ';
      case 'yroot': return 'ʸ√x';
      default: return '';
    }
  }

  function toRadians(x) {
    return state.angleMode === 'deg' ? (x * Math.PI) / 180 : x;
  }

  function fromRadiansResultIsAngle(x) {
    // for inverse trig results, convert back to degrees if needed
    return state.angleMode === 'deg' ? (x * 180) / Math.PI : x;
  }

  function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  }

  function calcBinary(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      case 'pow': return Math.pow(a, b);
      case 'yroot': return Math.pow(b, 1 / a); // a = y (root), b = x (radicand)
      default: return b;
    }
  }

  // ---------- Display ----------
  function updateDisplay() {
    resultEl.textContent = state.current === '' ? '0' : state.current;

    let exprText = '';
    if (state.stack.length > 0) {
      exprText += state.stack.map(() => '(').join('');
    }
    if (state.previous !== null) {
      exprText += `${formatNumber(state.previous)} ${state.operator ? opSymbol(state.operator) : ''}`;
    } else if (state.lastExprText) {
      exprText = state.lastExprText;
    }
    exprEl.textContent = exprText;
  }

  // ---------- History ----------
  function addHistory(exprText, result) {
    history.unshift({ expr: exprText, result: formatNumber(result) });
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = '';

    if (history.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.innerHTML = `<i class="fa-regular fa-clock"></i><p>No calculations yet</p>`;
      historyList.appendChild(empty);
      return;
    }

    history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `<small>${item.expr}</small><h2>${item.result}</h2>`;
      div.addEventListener('click', () => {
        state.current = item.result;
        state.previous = null;
        state.operator = null;
        state.overwrite = true;
        updateDisplay();
        if (historyPanel && historyPanel.classList.contains('history-open')) {
          historyPanel.classList.remove('history-open');
          historyBackdrop.classList.remove('visible');
        }
      });
      historyList.appendChild(div);
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    history.length = 0;
    renderHistory();
  });

  // ---------- Core actions ----------
  function inputDigit(d) {
    if (state.overwrite) {
      state.current = d === '.' ? '0.' : d;
      state.overwrite = false;
    } else {
      if (d === '.' && state.current.includes('.')) return;
      state.current = state.current === '0' && d !== '.' ? d : state.current + d;
    }
    updateDisplay();
  }

  function inputOperator(op) {
    const cur = parseFloat(state.current);
    if (state.operator && !state.overwrite) {
      state.previous = calcBinary(state.previous, cur, state.operator);
    } else {
      state.previous = cur;
    }
    state.operator = op;
    state.overwrite = true;
    state.lastExprText = '';
    updateDisplay();
  }

  function equals() {
    if (state.operator === null || state.previous === null) return;
    const cur = parseFloat(state.current);
    const exprText = `${formatNumber(state.previous)} ${opSymbol(state.operator)} ${formatNumber(cur)}`;
    const result = calcBinary(state.previous, cur, state.operator);

    addHistory(exprText, result);

    state.current = formatNumber(result);
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    state.lastExprText = exprText;
    updateDisplay();
  }

  function clearAll() {
    state.current = '0';
    state.previous = null;
    state.operator = null;
    state.overwrite = true;
    state.stack = [];
    state.lastExprText = '';
    updateDisplay();
  }

  function toggleSign() {
    if (state.current === '0') return;
    state.current = state.current.startsWith('-')
      ? state.current.slice(1)
      : '-' + state.current;
    updateDisplay();
  }

  function backspace() {
    if (state.overwrite || state.current === 'Error') {
      // Nothing actively being typed (fresh entry after =, function, etc.) — just reset to 0
      state.current = '0';
      state.overwrite = true;
      updateDisplay();
      return;
    }
    const trimmed = state.current.slice(0, -1);
    state.current = (trimmed === '' || trimmed === '-') ? '0' : trimmed;
    if (state.current === '0') state.overwrite = true;
    updateDisplay();
  }

  function inputEE() {
    // BUGFIX: previously routed through inputDigit('e'), which could wipe
    // the current value (or produce a lone "e") when pressed on a fresh entry.
    if (state.overwrite) {
      state.current = '1e';
      state.overwrite = false;
    } else if (!state.current.includes('e')) {
      state.current += 'e';
    }
    updateDisplay();
  }

  function percent() {
    const x = parseFloat(state.current);
    state.current = formatNumber(x / 100);
    state.overwrite = true;
    updateDisplay();
  }

  function applyUnary(fn, labelFn) {
    const x = parseFloat(state.current);
    const result = fn(x);
    const exprText = labelFn(x);

    if (Number.isNaN(result)) {
      state.current = 'Error';
      state.overwrite = true;
      updateDisplay();
      return;
    }

    addHistory(exprText, result);
    state.current = formatNumber(result);
    state.overwrite = true;
    state.lastExprText = exprText; // BUGFIX: reflect the function call in the display line
    updateDisplay();
  }

  // Parentheses: simple stack-based nesting
  function openParen() {
    state.stack.push({ previous: state.previous, operator: state.operator });
    state.previous = null;
    state.operator = null;
    state.current = '0';
    state.overwrite = true;
    state.lastExprText = ''; // BUGFIX: don't let a stale "=" result leak into the display
    updateDisplay();
  }

  function closeParen() {
    if (state.stack.length === 0) return;

    // Resolve the sub-expression inside the parens
    let subResult;
    if (state.operator !== null && state.previous !== null) {
      const cur = parseFloat(state.current);
      subResult = calcBinary(state.previous, cur, state.operator);
    } else {
      subResult = parseFloat(state.current);
    }

    const frame = state.stack.pop();
    state.previous = frame.previous;
    state.operator = frame.operator;
    state.current = formatNumber(subResult);
    state.overwrite = false; // allow continuing to type or apply another operator
    updateDisplay();
  }

  // Memory
  function memoryClear() { state.memory = 0; }
  function memoryAdd() { state.memory += parseFloat(state.current); }
  function memorySub() { state.memory -= parseFloat(state.current); }
  function memoryRecall() {
    state.current = formatNumber(state.memory);
    state.overwrite = true;
    updateDisplay();
  }

  // Angle mode toggle
  function toggleAngleMode() {
    state.angleMode = state.angleMode === 'deg' ? 'rad' : 'deg';
    radBtn.textContent = state.angleMode === 'deg' ? 'Rad' : 'Deg';
  }

  // 2nd (inverse trig) toggle
  function toggleSecond() {
    state.secondMode = !state.secondMode;
    secondBtn.classList.toggle('active-second', state.secondMode);
    allButtons.forEach(btn => {
      const t = btn.textContent.trim();
      const map = {
        sin: 'sin⁻¹', cos: 'cos⁻¹', tan: 'tan⁻¹',
        'sin⁻¹': 'sin', 'cos⁻¹': 'cos', 'tan⁻¹': 'tan',
        sinh: 'sinh⁻¹', cosh: 'cosh⁻¹', tanh: 'tanh⁻¹',
        'sinh⁻¹': 'sinh', 'cosh⁻¹': 'cosh', 'tanh⁻¹': 'tanh'
      };
      if (map[t]) btn.textContent = map[t];
    });
  }

  // ---------- Button router ----------
  function handleButton(btn) {
    const label = btn.textContent.trim();

    // Digits
    if (/^[0-9]$/.test(label)) return inputDigit(label);
    if (label === '.') return inputDigit('.');

    // Basic operators
    if (label === '+') return inputOperator('+');
    if (label === '−') return inputOperator('-');
    if (label === '×') return inputOperator('*');
    if (label === '÷') return inputOperator('/');
    if (label === '=') return equals();

    // Control
    if (label === 'AC') return clearAll();
    if (label === '+/-') return toggleSign();
    if (label === '%') return percent();
    if (label === '(') return openParen();
    if (label === ')') return closeParen();

    // Memory
    if (label === 'mc') return memoryClear();
    if (label === 'm+') return memoryAdd();
    if (label === 'm−' || label === 'm-') return memorySub();
    if (label === 'mr') return memoryRecall();

    // Modes
    if (label === 'Rad' || label === 'Deg') return toggleAngleMode();
    if (label === '2nd') return toggleSecond();

    // xʸ / ʸ√x — binary sci operators
    if (label === 'xʸ') return inputOperator('pow');
    if (label === 'ʸ√x') return inputOperator('yroot');

    // Unary sci functions
    if (label === 'x²') return applyUnary(x => Math.pow(x, 2), x => `sqr(${formatNumber(x)})`);
    if (label === 'x³') return applyUnary(x => Math.pow(x, 3), x => `cube(${formatNumber(x)})`);
    if (label === 'eˣ') return applyUnary(x => Math.exp(x), x => `e^${formatNumber(x)}`);
    if (label === '10ˣ') return applyUnary(x => Math.pow(10, x), x => `10^${formatNumber(x)}`);
    if (label === '1/x') return applyUnary(x => 1 / x, x => `1/(${formatNumber(x)})`);
    if (label === '²√x') return applyUnary(x => Math.sqrt(x), x => `√(${formatNumber(x)})`);
    if (label === '³√x') return applyUnary(x => Math.cbrt(x), x => `∛(${formatNumber(x)})`);
    if (label === 'ln') return applyUnary(x => Math.log(x), x => `ln(${formatNumber(x)})`);
    if (label === 'log') return applyUnary(x => Math.log10(x), x => `log(${formatNumber(x)})`);
    if (label === 'x!') return applyUnary(x => factorial(x), x => `${formatNumber(x)}!`);
    if (label === 'π') return applyUnary(() => Math.PI, () => 'π');
    if (label === 'e') return applyUnary(() => Math.E, () => 'e');
    if (label === 'EE') return inputEE(); // scientific notation, e.g. 1.5e3

    // Trig (respects Rad/Deg + 2nd/inverse)
    if (label === 'sin') return applyUnary(x => Math.sin(toRadians(x)), x => `sin(${formatNumber(x)})`);
    if (label === 'cos') return applyUnary(x => Math.cos(toRadians(x)), x => `cos(${formatNumber(x)})`);
    if (label === 'tan') return applyUnary(x => Math.tan(toRadians(x)), x => `tan(${formatNumber(x)})`);
    if (label === 'sin⁻¹') return applyUnary(x => fromRadiansResultIsAngle(Math.asin(x)), x => `sin⁻¹(${formatNumber(x)})`);
    if (label === 'cos⁻¹') return applyUnary(x => fromRadiansResultIsAngle(Math.acos(x)), x => `cos⁻¹(${formatNumber(x)})`);
    if (label === 'tan⁻¹') return applyUnary(x => fromRadiansResultIsAngle(Math.atan(x)), x => `tan⁻¹(${formatNumber(x)})`);

    if (label === 'sinh') return applyUnary(x => Math.sinh(x), x => `sinh(${formatNumber(x)})`);
    if (label === 'cosh') return applyUnary(x => Math.cosh(x), x => `cosh(${formatNumber(x)})`);
    if (label === 'tanh') return applyUnary(x => Math.tanh(x), x => `tanh(${formatNumber(x)})`);
    if (label === 'sinh⁻¹') return applyUnary(x => Math.asinh(x), x => `sinh⁻¹(${formatNumber(x)})`);
    if (label === 'cosh⁻¹') return applyUnary(x => Math.acosh(x), x => `cosh⁻¹(${formatNumber(x)})`);
    if (label === 'tanh⁻¹') return applyUnary(x => Math.atanh(x), x => `tanh⁻¹(${formatNumber(x)})`);

    // Fallback: the icon-only button (row 5, calculator icon) — no-op / could toggle a basic view
    // if you want to wire this up to something specific, do it here.
  }

  // ---------- Keyboard support (optional but handy) ----------
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      return backspace();
    }
    const keyMap = {
      '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
      '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
      '.': '.', '+': '+', '-': '−', '*': '×', '/': '÷',
      'Enter': '=', '=': '=', 'Escape': 'AC', '%': '%'
    };
    const label = keyMap[e.key];
    if (!label) return;
    e.preventDefault();
    // Fake a "button" object with matching textContent to reuse the router
    handleButton({ textContent: label });
  });

  // ---------- Wire up all buttons ----------
  allButtons.forEach(btn => {
    btn.addEventListener('click', () => handleButton(btn));
  });

  // Backspace button is icon-only (no textContent), so it's wired directly
  const backspaceBtn = document.querySelector('.backspace-btn');
  if (backspaceBtn) {
    backspaceBtn.addEventListener('click', backspace);
  }

  // ---------- Mobile history drawer ----------
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
  // Auto-detects from device orientation, but can be overridden any time
  // by tapping the mode-toggle button (useful on desktop browsers too,
  // where you can't physically rotate anything).
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

  // Physically rotating the device re-syncs the mode automatically
  orientationQuery.addEventListener('change', (e) => {
    applyCalcMode(e.matches ? 'basic' : 'scientific');
  });

  // Manual override via the toggle button
  if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
      applyCalcMode(calcMode === 'basic' ? 'scientific' : 'basic');
    });
  }

  // ---------- Init ----------
  clearAll();
  renderHistory(); // BUGFIX: clears the static placeholder rows from index.html so the
                    // visible list matches the real (empty) history array on first load
})();