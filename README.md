# 🧮 Smart Calculator Pro

A modern, highly accurate, and responsive multi-function web calculator built with vanilla HTML5, CSS3, and JavaScript. Featuring Standard & Scientific calculation modes, an Age Calculator with leap-year precision, and a Currency Converter with real-time exchange rates and offline caching.

---
## Live Demo

🚀 <a href="https://hetmochi05.github.io/Smart-Calculator/" target="_blank">Smart Calculator — Live Demo</a>

Try the live application directly in your browser.


## ✨ Features

### 🧮 Standard (Basic) Calculator
- Clean 4-column layout optimized for quick day-to-day arithmetic.
- Full support for addition, subtraction, multiplication, and division.
- Real-time percent operations (`100 + 15% = 115`, `50% = 0.5`).
- Sign toggle (`+/-`), backspace, and clear (`AC`).
- Repeat `=` operator execution (e.g. `5 + 3 = 8`, pressing `=` yields `11`).
- Dynamic font scaling so long numbers never get cut off.
- 1-click **Copy to Clipboard** with animated toast feedback.
- Persistent calculation history with timestamps across browser sessions.

### 🔬 Scientific Calculator
- Seamless toggle between Standard and Scientific modes via the title bar or keypad button.
- Advanced trigonometry: `sin`, `cos`, `tan` with `DEG` and `RAD` angle modes.
- `2nd` mode for inverse trigonometric (`sin⁻¹`, `cos⁻¹`, `tan⁻¹`) and hyperbolic (`sinh⁻¹`, `cosh⁻¹`, `tanh⁻¹`) functions.
- Exact trigonometric normalization (`tan(90°)` returns Error, `cos(90°) = 0`, `sin(180°) = 0`).
- Safe bracket resolution with automatic parenthetical balancing and implicit multiplication (`5(3+2) = 25`, `(2)(3) = 6`).
- Exponential functions (`eˣ`, `10ˣ`, `EE`), natural logarithm (`ln`), and common logarithm (`log`).
- Powers (`x²`, `x³`, `xʸ`) and roots (`²√x`, `³√x`, `ʸ√x`), including odd roots of negative numbers (`³√(-8) = -2`).
- Factorial calculation up to `170!`.
- Mathematical constants: `π` (Pi) and `e` (Euler's number).
- Full memory suite: `mc` (clear), `m+` (add), `m−` (subtract), `mr` (recall) with visual `M` indicator badge on screen.

### 🎂 Age Calculator
- Leap-year aware, clamped calendar mathematics ensuring 100% precision (never produces negative days).
- Displays exact years, months, and days lived.
- Detailed breakdown into total months, weeks, days, hours, minutes, and seconds.
- **Next Birthday Countdown**: exact days remaining and day of the week for your next birthday.
- **Zodiac Sign**: automatic Western astrological sign determination.

### 💱 Currency Calculator
- Real-time exchange rate conversions powered by ExchangeRate-API.
- Over 50+ world currencies supported.
- Quick-select chips for top currencies (USD, EUR, GBP, INR, JPY, CAD, AUD).
- Bidirectional rate calculation (`1 USD = X EUR` and `1 EUR = Y USD`).
- **Offline Caching**: stores exchange rates in `localStorage` so conversion works even with intermittent connectivity.
- Instant swap button and auto-conversion as you type.

### 🎨 UI / UX & Responsiveness
- Glassmorphic dark theme inspired by modern desktop interfaces.
- Fluid responsive layout:
  - **Desktop**: Side-by-side history panel and expansive keypad.
  - **Tablet**: Collapsible slide-out history drawer with backdrop overlay.
  - **Mobile**: Touch-optimized compact keypad in Scientific mode and thumb-friendly spacious keys in Standard mode.
- Sound effect toggle in title bar with user preference persistence.
- Complete keyboard accessibility:
  - Digits `0-9`, decimal `.`, operators `+`, `-`, `*`, `/`, `^`, `%`, `(`, `)`.
  - Numpad support (`Numpad0`-`Numpad9`, `NumpadEnter`, etc.).
  - `Enter` or `=` to calculate.
  - `Backspace` to delete, `Escape` to clear.
  - `p` for π, `e` for Euler's constant, `!` for factorial.
  - `m` to toggle Basic/Scientific mode, `h` to toggle calculation history.
  - Smart input protection: typing in tool inputs never triggers calculator keys.

---

## 🚀 Getting Started

No build tools or servers required! Simply open `index.html` in any modern web browser:

```bash
# Option 1: Double-click index.html or open via browser
open index.html

# Option 2: Serve using any local server (e.g. VS Code Live Server or Python)
python -m http.server 8000
```

---

## 📂 Project Architecture

```
├── assets/
│   ├── css/
│   │   ├── colors.css        # Palette variables
│   │   ├── style.css         # Main desktop styling & layout
│   │   ├── tools.css         # Age & Currency tool screens
│   │   └── responsive.css    # Tablet & mobile responsive rules
│   ├── js/
│   │   ├── calculator-engine.js # Pure math engine & parser
│   │   ├── display.js           # Display rendering, history & badges
│   │   ├── ui-controls.js       # State management & operator actions
│   │   ├── keyboard.js          # Keyboard shortcuts & input safety
│   │   ├── tools.js             # Age math & Currency API integration
│   │   └── app.js               # Application bootstrap & event binding
│   ├── favicon/
│   │   └── favicon.png       # Application icon
│   └── sounds/
│       └── Music.mp3         # Button press audio feedback
├── index.html                # Main application markup
└── README.md                 # Project documentation
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
