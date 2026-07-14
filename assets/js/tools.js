/* ==========================================================
   tools.js
   Screen switching between the calculator / age calculator /
   currency calculator, plus the logic for both tools.
   ========================================================== */

// ---------- Screen switching ----------
const screens = document.querySelectorAll('.screen');

function showScreen(id) {
    screens.forEach(s => s.classList.toggle('active', s.id === id));
}

const openCurrencyBtn = document.getElementById('openCurrencyScreen');
const openAgeBtn = document.getElementById('openAgeScreen');

if (openCurrencyBtn) openCurrencyBtn.addEventListener('click', () => showScreen('currencyScreen'));
if (openAgeBtn) openAgeBtn.addEventListener('click', () => showScreen('ageScreen'));

document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => showScreen('calcScreen'));
});

// ================= Age Calculator =================
// Pure date math -- no network needed.

const ageBirthDateEl = document.getElementById('ageBirthDate');
const ageAsOfDateEl = document.getElementById('ageAsOfDate');
const ageCalculateBtn = document.getElementById('ageCalculateBtn');
const ageResultEl = document.getElementById('ageResult');
const ageErrorEl = document.getElementById('ageError');
const ageYearsEl = document.getElementById('ageYears');
const ageMonthsEl = document.getElementById('ageMonths');
const ageDaysEl = document.getElementById('ageDays');
const ageTotalMonthsEl = document.getElementById('ageTotalMonths');
const ageTotalMonthsDaysEl = document.getElementById('ageTotalMonthsDays');
const ageTotalWeeksEl = document.getElementById('ageTotalWeeks');
const ageTotalWeeksDaysEl = document.getElementById('ageTotalWeeksDays');
const ageTotalDaysEl = document.getElementById('ageTotalDays');
const ageTotalHoursEl = document.getElementById('ageTotalHours');
const ageTotalMinutesEl = document.getElementById('ageTotalMinutes');
const ageTotalSecondsEl = document.getElementById('ageTotalSeconds');

function todayISO() {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

if (ageAsOfDateEl) ageAsOfDateEl.value = todayISO();

function calculateAge() {
    ageErrorEl.hidden = true;
    ageResultEl.hidden = true;

    const birthStr = ageBirthDateEl.value;
    const asOfStr = ageAsOfDateEl.value || todayISO();

    if (!birthStr) {
        ageErrorEl.textContent = 'Please enter a date of birth.';
        ageErrorEl.hidden = false;
        return;
    }

    const birth = new Date(birthStr + 'T00:00:00');
    const asOf = new Date(asOfStr + 'T00:00:00');

    if (isNaN(birth.getTime()) || isNaN(asOf.getTime())) {
        ageErrorEl.textContent = 'Please enter valid dates.';
        ageErrorEl.hidden = false;
        return;
    }

    if (birth > asOf) {
        ageErrorEl.textContent = 'Date of birth must be on or before the "as of" date.';
        ageErrorEl.hidden = false;
        return;
    }

    let years = asOf.getFullYear() - birth.getFullYear();
    let months = asOf.getMonth() - birth.getMonth();
    let days = asOf.getDate() - birth.getDate();

    if (days < 0) {
        months -= 1;
        // Number of days in the month just before asOf's month
        const prevMonthLastDay = new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate();
        days += prevMonthLastDay;
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.round((asOf - birth) / msPerDay);

    ageYearsEl.textContent = years;
    ageMonthsEl.textContent = months;
    ageDaysEl.textContent = days;

    // Alternate breakdowns -- all derived from the same exact totalDays,
    // so they always agree with the years/months/days figure above.
    const totalMonths = years * 12 + months;
    const totalWeeks = Math.floor(totalDays / 7);
    const weeksRemainderDays = totalDays % 7;
    const totalHours = totalDays * 24;
    const totalMinutes = totalHours * 60;
    const totalSeconds = totalMinutes * 60;

    ageTotalMonthsEl.textContent = totalMonths.toLocaleString();
    ageTotalMonthsDaysEl.textContent = days.toLocaleString();
    ageTotalWeeksEl.textContent = totalWeeks.toLocaleString();
    ageTotalWeeksDaysEl.textContent = weeksRemainderDays.toLocaleString();
    ageTotalDaysEl.textContent = totalDays.toLocaleString();
    ageTotalHoursEl.textContent = totalHours.toLocaleString();
    ageTotalMinutesEl.textContent = totalMinutes.toLocaleString();
    ageTotalSecondsEl.textContent = totalSeconds.toLocaleString();

    ageResultEl.hidden = false;
}

if (ageCalculateBtn) ageCalculateBtn.addEventListener('click', calculateAge);




// ================= Currency Calculator =================
// API: ExchangeRate-API (open.er-api.com)
// Purpose: Fetch live currency exchange rates for conversion
// Features: Free access, no API key, HTTPS, CORS enabled
// Rates are updated daily and optimized for web applications

const CURRENCY_NAMES = {
    AUD: 'Australian Dollar', BGN: 'Bulgarian Lev', BRL: 'Brazilian Real', CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc', CNY: 'Chinese Yuan', CZK: 'Czech Koruna', DKK: 'Danish Krone',
    EUR: 'Euro', GBP: 'British Pound', HKD: 'Hong Kong Dollar', HUF: 'Hungarian Forint',
    IDR: 'Indonesian Rupiah', ILS: 'Israeli Shekel', INR: 'Indian Rupee', ISK: 'Icelandic Krona',
    JPY: 'Japanese Yen', KRW: 'South Korean Won', MXN: 'Mexican Peso', MYR: 'Malaysian Ringgit',
    NOK: 'Norwegian Krone', NZD: 'New Zealand Dollar', PHP: 'Philippine Peso', PLN: 'Polish Zloty',
    RON: 'Romanian Leu', SEK: 'Swedish Krona', SGD: 'Singapore Dollar', THB: 'Thai Baht',
    TRY: 'Turkish Lira', USD: 'US Dollar', ZAR: 'South African Rand'
};

const currencyAmountEl = document.getElementById('currencyAmount');
const currencyFromEl = document.getElementById('currencyFrom');
const currencyToEl = document.getElementById('currencyTo');
const currencySwapBtn = document.getElementById('currencySwapBtn');
const currencyConvertBtn = document.getElementById('currencyConvertBtn');
const currencyResultEl = document.getElementById('currencyResult');
const currencyResultMainEl = document.getElementById('currencyResultMain');
const currencyResultSubEl = document.getElementById('currencyResultSub');
const currencyErrorEl = document.getElementById('currencyError');
const currencyLoadingEl = document.getElementById('currencyLoading');

function populateCurrencyDropdowns() {
    const codes = Object.keys(CURRENCY_NAMES).sort();
    codes.forEach(code => {
        const label = `${code} — ${CURRENCY_NAMES[code]}`;

        const opt1 = document.createElement('option');
        opt1.value = code;
        opt1.textContent = label;
        currencyFromEl.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = code;
        opt2.textContent = label;
        currencyToEl.appendChild(opt2);
    });
    currencyFromEl.value = 'USD';
    currencyToEl.value = 'EUR';
}

// Auto Convert (300ms delay)

let convertTimeout;

function autoConvert() {

    clearTimeout(convertTimeout);

    convertTimeout = setTimeout(() => {

        const amount = parseFloat(currencyAmountEl.value);

        if (!isNaN(amount) && amount > 0) {
            convertCurrency();
        } else {
            currencyResultEl.hidden = true;
            currencyErrorEl.hidden = true;
        }

    }, 300);

}
if (currencyFromEl && currencyToEl) populateCurrencyDropdowns();

async function convertCurrency() {
    currencyErrorEl.hidden = true;
    currencyResultEl.hidden = true;

    const amount = parseFloat(currencyAmountEl.value);
    const from = currencyFromEl.value;
    const to = currencyToEl.value;

    if (isNaN(amount) || amount <= 0) {
        currencyErrorEl.textContent = "Please enter a valid amount greater than 0.";
        currencyErrorEl.hidden = false;
        return;
    }

    if (from === to) {
        currencyResultMainEl.textContent = `${amount.toLocaleString()} ${from} = ${amount.toLocaleString()} ${to}`;
        currencyResultSubEl.textContent = "Both currencies are the same.";
        currencyResultEl.hidden = false;
        return;
    }

    currencyLoadingEl.hidden = false;
    currencyConvertBtn.disabled = true;

    try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);

        if (!res.ok) {
            throw new Error("Request failed");
        }

        const data = await res.json();

        if (data.result !== "success") {
            throw new Error("API Error");
        }

        const rate = data.rates[to];

        if (typeof rate !== "number") {
            throw new Error("Rate unavailable");
        }

        const converted = amount * rate;

        // Last updated
        const updatedAt = new Date(data.time_last_update_unix * 1000);

        const formattedDate = updatedAt.toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        const formattedTime = updatedAt.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit"
        });

        currencyResultMainEl.textContent =
            `${amount.toLocaleString()} ${from} = ${converted.toLocaleString(undefined, {
                maximumFractionDigits: 4
            })} ${to}`;

        currencyResultSubEl.innerHTML = `
            <div>1 ${from} = ${rate.toLocaleString(undefined,{
                maximumFractionDigits:6
            })} ${to}</div>

            <div class="currency-update">
                <i class="fa-solid fa-clock"></i>
                Last Updated: ${formattedDate} • ${formattedTime}
            </div>
        `;

        currencyResultEl.hidden = false;

    } catch (err) {

        currencyErrorEl.textContent =
            "Could not fetch exchange rates. Please check your internet connection.";

        currencyErrorEl.hidden = false;

    } finally {

        currencyLoadingEl.hidden = true;
        currencyConvertBtn.disabled = false;

    }
}
if (currencyConvertBtn) currencyConvertBtn.addEventListener('click', convertCurrency);
currencyAmountEl.addEventListener("input", autoConvert);

currencyFromEl.addEventListener("change", autoConvert);

currencyToEl.addEventListener("change", autoConvert);

if (currencySwapBtn) {

    currencySwapBtn.addEventListener("click", () => {

        [currencyFromEl.value, currencyToEl.value] = [
            currencyToEl.value,
            currencyFromEl.value
        ];

        autoConvert();

    });

}