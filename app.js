
const STORAGE_KEY = "fxJournalTradesV2";
const BALANCE_KEY = "fxJournalStartingBalanceV2";

const els = {
  tabs: document.querySelectorAll("[data-nav]"),
  views: document.querySelectorAll("[data-view]"),
  homeNavCards: document.querySelectorAll("[data-home-nav]"),
  form: document.getElementById("tradeForm"),
  tradeId: document.getElementById("tradeId"),
  formTitle: document.getElementById("formTitle"),
  submitBtn: document.getElementById("submitBtn"),
  resetBtn: document.getElementById("resetBtn"),
  direction: document.getElementById("direction"),
  segmentButtons: document.querySelectorAll("[data-direction]"),
  screenshot: document.getElementById("screenshot"),
  screenshotPreview: document.getElementById("screenshotPreview"),
  statusBar: document.getElementById("statusBar"),
  toast: document.getElementById("toast"),
  quickAddBtn: document.getElementById("quickAddBtn"),

  startingBalance: document.getElementById("startingBalance"),
  saveBalanceBtn: document.getElementById("saveBalanceBtn"),
  todayBadge: document.getElementById("todayBadge"),
  tradesCountBadge: document.getElementById("tradesCountBadge"),
  netBadge: document.getElementById("netBadge"),

  searchText: document.getElementById("searchText"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  filterDirection: document.getElementById("filterDirection"),
  filterSession: document.getElementById("filterSession"),
  sortBy: document.getElementById("sortBy"),

  tradesBody: document.getElementById("tradesBody"),
  tradesCards: document.getElementById("tradesCards"),

  stats: document.getElementById("stats"),
  statCardTpl: document.getElementById("statCardTpl"),
  equityChart: document.getElementById("equityChart"),
  weekdayChart: document.getElementById("weekdayChart"),
  calendarGrid: document.getElementById("calendarGrid"),
  pairStats: document.getElementById("pairStats"),
  sessionStats: document.getElementById("sessionStats"),
  weekdayStats: document.getElementById("weekdayStats"),
  homeTradesCount: document.getElementById("homeTradesCount"),
  homeWinRate: document.getElementById("homeWinRate"),
  homeNetPnl: document.getElementById("homeNetPnl"),

  exportJsonBtn: document.getElementById("exportJsonBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  importBtn: document.getElementById("importBtn"),
  importInput: document.getElementById("importInput"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  installBtn: document.getElementById("installBtn"),
};

const fieldIds = [
  "entryDate", "pair", "direction", "riskAmount", "pnl", "strategy", "session",
  "emotion", "durationMin", "setupScore", "discipline", "commission", "tags", "notes"
];

let trades = loadTrades();
let startingBalance = loadStartingBalance();
let installPromptEvent = null;
let swReloadTriggered = false;
let screenshotDataUrl = "";

init();

function init() {
  els.startingBalance.value = String(startingBalance);
  const nowLabel = new Date().toLocaleDateString("he-IL", { year: "numeric", month: "2-digit", day: "2-digit" });
  els.todayBadge.textContent = `היום: ${nowLabel}`;
  setDefaultForm();
  bindEvents();
  setupPwa();
  activateView("home");
  refreshUI();
}

function bindEvents() {
  els.tabs.forEach((btn) => btn.addEventListener("click", () => activateView(btn.dataset.nav || "home")));
  els.homeNavCards.forEach((card) => {
    card.addEventListener("click", () => activateView(card.dataset.homeNav || "home"));
  });
  els.segmentButtons.forEach((btn) => btn.addEventListener("click", () => setDirection(btn.dataset.direction || "Long")));

  document.querySelectorAll("[data-pair]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("pair").value = String(btn.dataset.pair || "");
      flash("צמד נבחר");
    });
  });

  document.querySelectorAll("[data-pnl]").forEach((btn) => {
    btn.addEventListener("click", () => { document.getElementById("pnl").value = String(btn.dataset.pnl || ""); });
  });

  els.form.addEventListener("submit", onSubmit);
  els.resetBtn.addEventListener("click", resetForm);
  els.saveBalanceBtn.addEventListener("click", saveBalance);
  els.screenshot.addEventListener("change", onScreenshotChange);

  [els.searchText, els.fromDate, els.toDate, els.filterDirection, els.filterSession, els.sortBy].forEach((input) => {
    input.addEventListener("input", refreshUI);
    input.addEventListener("change", refreshUI);
  });

  els.quickAddBtn.addEventListener("click", () => {
    activateView("journal");
    document.getElementById("pair").focus();
  });

  els.exportJsonBtn.addEventListener("click", exportJson);
  els.exportCsvBtn.addEventListener("click", exportCsv);
  els.importBtn.addEventListener("click", () => els.importInput.click());
  els.importInput.addEventListener("change", importData);
  els.clearAllBtn.addEventListener("click", clearAllData);
  els.installBtn.addEventListener("click", installApp);

  els.form.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      els.form.requestSubmit();
    }
  });
}

function activateView(view) {
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.nav === view));
  els.views.forEach((section) => section.classList.toggle("active", section.dataset.view === view));
}

function setDirection(direction) {
  const normalized = normalizeDirection(direction);
  els.direction.value = normalized;
  els.segmentButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.direction === normalized));
}

function setDefaultForm() {
  const now = new Date();
  document.getElementById("entryDate").value = toLocalDateTime(now);
  document.getElementById("riskAmount").value = "0";
  document.getElementById("commission").value = "0";
  document.getElementById("setupScore").value = "3";
  document.getElementById("discipline").value = "3";
  document.getElementById("durationMin").value = "0";
  document.getElementById("emotion").value = "ניטרלי";
  setDirection("Long");
  clearScreenshotPreview();
}

function onScreenshotChange(event) {
  const file = event.target.files?.[0];
  if (!file) {
    clearScreenshotPreview();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    screenshotDataUrl = String(reader.result || "");
    if (!screenshotDataUrl) {
      clearScreenshotPreview();
      return;
    }
    els.screenshotPreview.src = screenshotDataUrl;
    els.screenshotPreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function clearScreenshotPreview() {
  screenshotDataUrl = "";
  els.screenshot.value = "";
  els.screenshotPreview.src = "";
  els.screenshotPreview.classList.add("hidden");
}

function onSubmit(event) {
  event.preventDefault();
  const trade = collectTradeFromForm();
  if (!trade) return;

  if (els.tradeId.value) {
    const index = trades.findIndex((t) => t.id === els.tradeId.value);
    if (index >= 0) trades[index] = trade;
  } else {
    trades.push(trade);
  }

  persistTrades();
  resetForm();
  refreshUI();
  flash("העסקה נשמרה בהצלחה");
}
function collectTradeFromForm() {
  const data = {};
  for (const id of fieldIds) {
    data[id] = document.getElementById(id).value;
  }

  const entryDate = data.entryDate;
  const pair = data.pair.trim().toUpperCase();
  const direction = normalizeDirection(data.direction);
  const riskAmount = n(data.riskAmount);
  const pnl = n(data.pnl);
  const commission = n(data.commission);

  if (!entryDate || !pair || Number.isNaN(riskAmount) || Number.isNaN(pnl)) {
    alert("חסרים שדות חובה: תאריך, צמד, סיכון ו-PnL.");
    return null;
  }

  const checklist = {
    plan: document.getElementById("chkPlan").checked,
    trend: document.getElementById("chkTrend").checked,
    risk: document.getElementById("chkRisk").checked,
    news: document.getElementById("chkNews").checked,
    execution: document.getElementById("chkExecution").checked,
  };

  const mistakes = [...document.querySelectorAll(".mistake:checked")].map((x) => x.value);

  const tags = data.tags.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

  return {
    id: els.tradeId.value || createId(),
    entryDate,
    pair,
    direction,
    riskAmount: Math.max(0, riskAmount),
    pnl,
    rMultiple: riskAmount > 0 ? pnl / riskAmount : 0,
    strategy: data.strategy.trim(),
    session: data.session,
    emotion: data.emotion,
    durationMin: Math.max(0, i(data.durationMin)),
    setupScore: clamp(i(data.setupScore), 1, 5),
    discipline: clamp(i(data.discipline), 1, 5),
    commission: Number.isNaN(commission) ? 0 : commission,
    tags,
    checklist,
    mistakes,
    notes: data.notes.trim(),
    screenshot: screenshotDataUrl,
    updatedAt: new Date().toISOString(),
  };
}

function resetForm() {
  els.form.reset();
  els.tradeId.value = "";
  els.formTitle.textContent = "עסקה חדשה";
  els.submitBtn.textContent = "שמירת עסקה";
  document.querySelectorAll(".mistake").forEach((box) => (box.checked = false));
  ["chkPlan", "chkTrend", "chkRisk", "chkNews", "chkExecution"].forEach((id) => {
    document.getElementById(id).checked = false;
  });
  setDefaultForm();
}

function loadTradeToForm(id) {
  const trade = trades.find((t) => t.id === id);
  if (!trade) return;

  els.tradeId.value = trade.id;
  document.getElementById("entryDate").value = trade.entryDate || "";
  document.getElementById("pair").value = trade.pair || "";
  setDirection(trade.direction || "Long");
  document.getElementById("riskAmount").value = String(trade.riskAmount ?? 0);
  document.getElementById("pnl").value = String(trade.pnl ?? 0);
  document.getElementById("strategy").value = trade.strategy || "";
  document.getElementById("session").value = trade.session || "";
  document.getElementById("emotion").value = trade.emotion || "ניטרלי";
  document.getElementById("durationMin").value = String(trade.durationMin ?? 0);
  document.getElementById("setupScore").value = String(trade.setupScore ?? 3);
  document.getElementById("discipline").value = String(trade.discipline ?? 3);
  document.getElementById("commission").value = String(trade.commission ?? 0);
  document.getElementById("tags").value = Array.isArray(trade.tags) ? trade.tags.join(", ") : "";
  document.getElementById("notes").value = trade.notes || "";

  document.getElementById("chkPlan").checked = !!trade.checklist?.plan;
  document.getElementById("chkTrend").checked = !!trade.checklist?.trend;
  document.getElementById("chkRisk").checked = !!trade.checklist?.risk;
  document.getElementById("chkNews").checked = !!trade.checklist?.news;
  document.getElementById("chkExecution").checked = !!trade.checklist?.execution;

  const mistakesSet = new Set(Array.isArray(trade.mistakes) ? trade.mistakes : []);
  document.querySelectorAll(".mistake").forEach((box) => { box.checked = mistakesSet.has(box.value); });

  if (trade.screenshot) {
    screenshotDataUrl = trade.screenshot;
    els.screenshotPreview.src = trade.screenshot;
    els.screenshotPreview.classList.remove("hidden");
  } else {
    clearScreenshotPreview();
  }

  els.formTitle.textContent = "עריכת עסקה";
  els.submitBtn.textContent = "עדכון עסקה";
  activateView("journal");
  document.getElementById("formSection")?.scrollIntoView({ behavior: "smooth" });
}

function deleteTrade(id) {
  if (!confirm("למחוק את העסקה?")) return;
  trades = trades.filter((t) => t.id !== id);
  persistTrades();
  refreshUI();
  flash("העסקה נמחקה");
}

function saveBalance() {
  const value = n(els.startingBalance.value);
  if (Number.isNaN(value) || value < 0) {
    alert("הון התחלתי חייב להיות 0 ומעלה");
    return;
  }
  startingBalance = value;
  localStorage.setItem(BALANCE_KEY, String(value));
  refreshUI();
  flash("ההון נשמר");
}

function refreshUI() {
  const visible = filteredTrades();
  renderStats(visible);
  renderTradeList(visible);
  renderEquityChart(visible);
  renderWeekdayChart(visible);
  renderCalendar(visible);
  renderAnalytics(visible);
  updateTopBadges();
  updateHomeKpis();
}

function filteredTrades() {
  const search = els.searchText.value.trim().toLowerCase();
  const from = els.fromDate.value ? new Date(`${els.fromDate.value}T00:00:00`) : null;
  const to = els.toDate.value ? new Date(`${els.toDate.value}T23:59:59`) : null;
  const direction = els.filterDirection.value;
  const session = els.filterSession.value;
  const sortBy = els.sortBy.value;

  const list = trades.filter((trade) => {
    const dt = new Date(trade.entryDate);
    const lookup = [trade.pair, trade.strategy, trade.notes, (trade.tags || []).join(" ")].join(" ").toLowerCase();
    if (search && !lookup.includes(search)) return false;
    if (from && dt < from) return false;
    if (to && dt > to) return false;
    if (direction && trade.direction !== direction) return false;
    if (session && trade.session !== session) return false;
    return true;
  });

  list.sort((a, b) => {
    if (sortBy === "entryDateAsc") return new Date(a.entryDate) - new Date(b.entryDate);
    if (sortBy === "entryDateDesc") return new Date(b.entryDate) - new Date(a.entryDate);
    if (sortBy === "pnlAsc") return a.pnl - b.pnl;
    if (sortBy === "pnlDesc") return b.pnl - a.pnl;
    if (sortBy === "rDesc") return (b.rMultiple || 0) - (a.rMultiple || 0);
    return 0;
  });

  return list;
}

function renderTradeList(list) {
  els.tradesBody.innerHTML = "";
  els.tradesCards.innerHTML = "";

  if (!list.length) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = '<td colspan="8">אין עסקאות להצגה</td>';
    els.tradesBody.appendChild(emptyRow);
    const emptyCard = document.createElement("article");
    emptyCard.className = "trade-card";
    emptyCard.textContent = "אין עסקאות להצגה";
    els.tradesCards.appendChild(emptyCard);
    return;
  }

  for (const trade of list) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${fmtDate(trade.entryDate)}</td>
      <td class="mono">${escapeHtml(trade.pair)}</td>
      <td>${directionLabel(trade.direction)}</td>
      <td>${escapeHtml(trade.strategy || "-")}</td>
      <td class="${trade.pnl >= 0 ? "good" : "bad"}">${fmtMoney(trade.pnl)}</td>
      <td>${fmtNum(trade.rMultiple || 0, 2)}</td>
      <td>${escapeHtml((trade.mistakes || []).join(" | ") || "-")}</td>
      <td>
        <button data-act="edit" data-id="${trade.id}" type="button">עריכה</button>
        <button data-act="del" data-id="${trade.id}" class="danger" type="button">מחיקה</button>
      </td>
    `;
    tr.querySelector('[data-act="edit"]').addEventListener("click", () => loadTradeToForm(trade.id));
    tr.querySelector('[data-act="del"]').addEventListener("click", () => deleteTrade(trade.id));
    els.tradesBody.appendChild(tr);

    const card = document.createElement("article");
    card.className = "trade-card";
    const mistakesTxt = (trade.mistakes || []).join(", ") || "אין";
    card.innerHTML = `
      <div class="trade-head"><strong class="mono">${escapeHtml(trade.pair)}</strong><span class="${trade.pnl >= 0 ? "good" : "bad"}">${fmtMoney(trade.pnl)}</span></div>
      <div class="trade-meta">
        <span>${fmtDate(trade.entryDate)} | ${directionLabel(trade.direction)}</span>
        <span>אסטרטגיה: ${escapeHtml(trade.strategy || "-")} | R: ${fmtNum(trade.rMultiple || 0, 2)}</span>
        <span>טעויות: ${escapeHtml(mistakesTxt)}</span>
      </div>
      <div class="trade-actions"><button data-card="edit" type="button">עריכה</button><button data-card="del" class="danger" type="button">מחיקה</button></div>
    `;
    card.querySelector('[data-card="edit"]').addEventListener("click", () => loadTradeToForm(trade.id));
    card.querySelector('[data-card="del"]').addEventListener("click", () => deleteTrade(trade.id));
    els.tradesCards.appendChild(card);
  }
}
function renderStats(list) {
  const total = list.length;
  const wins = list.filter((t) => t.pnl > 0);
  const losses = list.filter((t) => t.pnl < 0);

  const grossProfit = sum(wins.map((t) => t.pnl));
  const grossLoss = Math.abs(sum(losses.map((t) => t.pnl)));
  const net = sum(list.map((t) => t.pnl));
  const winRate = total ? (wins.length / total) * 100 : 0;
  const avgR = total ? sum(list.map((t) => t.rMultiple || 0)) / total : 0;
  const expectancy = total ? net / total : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const maxDd = calcMaxDrawdown(list);
  const streak = calcStreak(list);
  const best = list.length ? Math.max(...list.map((t) => t.pnl)) : 0;
  const worst = list.length ? Math.min(...list.map((t) => t.pnl)) : 0;
  const checklistScore = total ? (sum(list.map((t) => checklistPercent(t.checklist))) / total) : 0;

  const items = [
    ["עסקאות", String(total)],
    ["רווח נקי", fmtMoney(net)],
    ["אחוז הצלחה", `${fmtNum(winRate, 1)}%`],
    ["פקטור רווח", Number.isFinite(profitFactor) ? fmtNum(profitFactor, 2) : "∞"],
    ["ממוצע R", fmtNum(avgR, 2)],
    ["תוחלת לעסקה", fmtMoney(expectancy)],
    ["משיכה מרבית", fmtMoney(-maxDd)],
    ["רצף נוכחי", streak],
    ["עסקה טובה ביותר", fmtMoney(best)],
    ["עסקה גרועה ביותר", fmtMoney(worst)],
    ["עמידה בצ'קליסט", `${fmtNum(checklistScore, 0)}%`],
    ["הון נוכחי", fmtMoney(startingBalance + net)],
  ];

  els.stats.innerHTML = "";
  for (const [title, value] of items) {
    const card = els.statCardTpl.content.firstElementChild.cloneNode(true);
    card.querySelector("h3").textContent = title;
    const p = card.querySelector("p");
    p.textContent = value;
    if (["רווח נקי", "הון נוכחי", "עסקה טובה ביותר", "עסקה גרועה ביותר"].includes(title)) {
      const isNegative = value.startsWith("-") || value.includes("-$");
      p.className = isNegative ? "bad" : "good";
    }
    els.stats.appendChild(card);
  }
}

function renderEquityChart(list) {
  const ctx = els.equityChart.getContext("2d");
  const w = els.equityChart.width;
  const h = els.equityChart.height;
  ctx.clearRect(0, 0, w, h);
  const ordered = [...list].sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));
  const points = [startingBalance];
  let equity = startingBalance;
  for (const t of ordered) { equity += t.pnl; points.push(equity); }
  drawLineChart(ctx, points, w, h, "#0a84ff");
}

function renderWeekdayChart(list) {
  const ctx = els.weekdayChart.getContext("2d");
  const w = els.weekdayChart.width;
  const h = els.weekdayChart.height;
  ctx.clearRect(0, 0, w, h);

  const days = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
  const map = new Map(days.map((d) => [d, 0]));
  for (const t of list) {
    const label = days[new Date(t.entryDate).getDay()];
    map.set(label, (map.get(label) || 0) + t.pnl);
  }
  const values = days.map((d) => map.get(d) || 0);
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const top = 24;
  const bottom = h - 26;
  const midY = (top + bottom) / 2;

  ctx.strokeStyle = "#d6e1ef";
  ctx.beginPath();
  ctx.moveTo(26, midY);
  ctx.lineTo(w - 14, midY);
  ctx.stroke();

  const barWidth = (w - 60) / days.length;
  days.forEach((day, idx) => {
    const val = values[idx];
    const x = 34 + idx * barWidth;
    const barHeight = ((bottom - top) / 2) * (Math.abs(val) / maxAbs);
    const y = val >= 0 ? midY - barHeight : midY;
    ctx.fillStyle = val >= 0 ? "#0fa15f" : "#d43737";
    ctx.fillRect(x, y, barWidth * 0.58, barHeight);
    ctx.fillStyle = "#4d6280";
    ctx.font = "12px SF Pro Text";
    ctx.fillText(day, x + 5, h - 8);
  });
}

function renderCalendar(list) {
  els.calendarGrid.innerHTML = "";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startOffset = first.getDay();

  const daily = new Map();
  for (const t of list) {
    const d = new Date(t.entryDate);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    const key = d.getDate();
    daily.set(key, (daily.get(key) || 0) + t.pnl);
  }

  for (let i = 0; i < startOffset; i += 1) {
    const empty = document.createElement("div");
    empty.className = "day-cell";
    els.calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= lastDay; day += 1) {
    const pnl = daily.get(day) || 0;
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.innerHTML = `<div class="num">${day}</div><div class="pnl ${pnl >= 0 ? "good" : "bad"}">${pnl ? fmtMoney(pnl) : "-"}</div>`;
    els.calendarGrid.appendChild(cell);
  }
}

function renderAnalytics(list) {
  renderGroupedStats(els.pairStats, list, (t) => t.pair || "-");
  renderGroupedStats(els.sessionStats, list, (t) => t.session || "ללא");
  const weekdays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  renderGroupedStats(els.weekdayStats, list, (t) => weekdays[new Date(t.entryDate).getDay()]);
}

function renderGroupedStats(container, list, keyFn) {
  const map = new Map();
  for (const t of list) {
    const key = keyFn(t);
    if (!map.has(key)) map.set(key, { pnl: 0, total: 0, wins: 0 });
    const row = map.get(key);
    row.pnl += t.pnl;
    row.total += 1;
    if (t.pnl > 0) row.wins += 1;
  }

  const rows = [...map.entries()].sort((a, b) => b[1].pnl - a[1].pnl);
  container.innerHTML = "";
  if (!rows.length) { container.textContent = "אין נתונים"; return; }

  for (const [key, row] of rows) {
    const line = document.createElement("div");
    line.className = "list-row";
    const wr = row.total ? (row.wins / row.total) * 100 : 0;
    line.innerHTML = `<span>${escapeHtml(String(key))} (${row.total})</span><span class="${row.pnl >= 0 ? "good" : "bad"}">${fmtMoney(row.pnl)} | ${fmtNum(wr, 0)}%</span>`;
    container.appendChild(line);
  }
}

function drawLineChart(ctx, points, w, h, color) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);

  ctx.strokeStyle = "#d7e4f3";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = 16 + ((h - 34) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(36, y);
    ctx.lineTo(w - 10, y);
    ctx.stroke();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((v, i) => {
    const x = 36 + ((w - 50) * i) / Math.max(1, points.length - 1);
    const y = 16 + (h - 34) * (1 - (v - min) / range);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "#4d6280";
  ctx.font = "12px SF Pro Text";
  ctx.fillText(`מינימום: ${fmtMoney(min)}`, 38, h - 7);
  ctx.fillText(`מקסימום: ${fmtMoney(max)}`, w - 170, h - 7);
}

function calcMaxDrawdown(list) {
  const ordered = [...list].sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));
  let equity = startingBalance;
  let peak = equity;
  let maxDd = 0;
  for (const t of ordered) {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    maxDd = Math.max(maxDd, peak - equity);
  }
  return maxDd;
}

function calcStreak(list) {
  if (!list.length) return "0";
  const ordered = [...list].sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));
  let sign = 0;
  let count = 0;
  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const val = ordered[i].pnl;
    const current = val > 0 ? 1 : val < 0 ? -1 : 0;
    if (sign === 0) sign = current;
    if (current === sign) count += 1;
    else break;
  }
  if (sign === 1) return `רווח ${count}`;
  if (sign === -1) return `הפסד ${count}`;
  return `אפס ${count}`;
}

function checklistPercent(checklist) {
  if (!checklist) return 0;
  const values = [checklist.plan, checklist.trend, checklist.risk, checklist.news, checklist.execution];
  return (values.filter(Boolean).length / values.length) * 100;
}

function updateTopBadges() {
  const net = sum(trades.map((t) => t.pnl || 0));
  els.tradesCountBadge.textContent = `${trades.length} עסקאות`;
  els.netBadge.textContent = `נטו: ${fmtMoney(net)}`;
  els.netBadge.classList.toggle("good", net >= 0);
  els.netBadge.classList.toggle("bad", net < 0);
}

function updateHomeKpis() {
  if (!els.homeTradesCount || !els.homeWinRate || !els.homeNetPnl) return;
  const total = trades.length;
  const wins = trades.filter((t) => t.pnl > 0).length;
  const net = sum(trades.map((t) => t.pnl || 0));
  const winRate = total ? (wins / total) * 100 : 0;

  els.homeTradesCount.textContent = String(total);
  els.homeWinRate.textContent = `${fmtNum(winRate, 1)}%`;
  els.homeNetPnl.textContent = fmtMoney(net);
  els.homeNetPnl.className = net >= 0 ? "good" : "bad";
}
function exportJson() {
  const payload = { version: 2, exportedAt: new Date().toISOString(), startingBalance, trades };
  download(`journal-${stamp()}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
}

function exportCsv() {
  const headers = ["id", "entryDate", "pair", "direction", "session", "strategy", "emotion", "riskAmount", "pnl", "rMultiple", "durationMin", "setupScore", "discipline", "commission", "tags", "mistakes", "notes"];
  const rows = trades.map((t) => [
    t.id, t.entryDate, t.pair, t.direction, t.session, t.strategy, t.emotion, t.riskAmount, t.pnl, t.rMultiple,
    t.durationMin, t.setupScore, t.discipline, t.commission, (t.tags || []).join("|"), (t.mistakes || []).join("|"), t.notes,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
  download(`journal-${stamp()}.csv`, csv, "text/csv;charset=utf-8");
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const content = String(reader.result || "");
      if (file.name.toLowerCase().endsWith(".json")) importJson(content);
      else importCsv(content);
      persistTrades();
      refreshUI();
      flash("ייבוא הושלם");
    } catch (error) {
      alert(`שגיאת ייבוא: ${error.message}`);
    } finally {
      els.importInput.value = "";
    }
  };
  reader.readAsText(file, "utf-8");
}

function importJson(content) {
  const parsed = JSON.parse(content);
  const list = Array.isArray(parsed) ? parsed : parsed.trades;
  if (!Array.isArray(list)) throw new Error("JSON לא תקין");
  trades = dedupe(list.map(normalizeTrade).filter(Boolean));

  if (!Array.isArray(parsed) && typeof parsed.startingBalance === "number") {
    startingBalance = parsed.startingBalance;
    els.startingBalance.value = String(startingBalance);
    localStorage.setItem(BALANCE_KEY, String(startingBalance));
  }
}

function importCsv(content) {
  const lines = content.split(/\r?\n/).filter((x) => x.trim());
  if (lines.length < 2) throw new Error("CSV ריק");
  const headers = parseCsvLine(lines[0]);
  const imported = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
    return normalizeTrade(obj);
  }).filter(Boolean);
  trades = dedupe(imported);
}

function normalizeTrade(raw) {
  if (!raw) return null;
  const risk = Number(raw.riskAmount ?? raw.risk ?? 0);
  const pnl = Number(raw.pnl);
  if (!raw.entryDate || !raw.pair || Number.isNaN(pnl)) return null;

  const tags = String(raw.tags || "").split(/[|,]/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  const mistakes = String(raw.mistakes || "").split(/[|,]/).map((x) => x.trim()).filter(Boolean);

  return {
    id: String(raw.id || createId()),
    entryDate: String(raw.entryDate),
    pair: String(raw.pair).toUpperCase(),
    direction: normalizeDirection(raw.direction || "Long"),
    riskAmount: Number.isNaN(risk) ? 0 : Math.max(0, risk),
    pnl,
    rMultiple: raw.rMultiple !== undefined ? Number(raw.rMultiple) : (risk > 0 ? pnl / risk : 0),
    strategy: String(raw.strategy || ""),
    session: String(raw.session || ""),
    emotion: String(raw.emotion || "ניטרלי"),
    durationMin: Math.max(0, Number(raw.durationMin || 0)),
    setupScore: clamp(Number(raw.setupScore || 3), 1, 5),
    discipline: clamp(Number(raw.discipline || 3), 1, 5),
    commission: Number(raw.commission || 0),
    tags,
    checklist: {
      plan: Boolean(raw.checklist?.plan),
      trend: Boolean(raw.checklist?.trend),
      risk: Boolean(raw.checklist?.risk),
      news: Boolean(raw.checklist?.news),
      execution: Boolean(raw.checklist?.execution),
    },
    mistakes,
    notes: String(raw.notes || ""),
    screenshot: String(raw.screenshot || ""),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
  };
}

function clearAllData() {
  if (!confirm("למחוק את כל הנתונים?")) return;
  trades = [];
  persistTrades();
  refreshUI();
  flash("כל הנתונים נמחקו");
}

function setupPwa() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register("./sw.js");

        const triggerActivation = (worker) => {
          if (worker) worker.postMessage({ type: "SKIP_WAITING" });
        };

        if (registration.waiting) triggerActivation(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              triggerActivation(worker);
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (swReloadTriggered) return;
          swReloadTriggered = true;
          window.location.reload();
        });

        setInterval(() => {
          registration.update().catch(() => {});
        }, 60000);

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        });
      } catch {
        // Ignore SW errors to keep core app functional.
      }
    });
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPromptEvent = event;
    els.installBtn.classList.remove("hidden");
  });

  window.addEventListener("appinstalled", () => {
    installPromptEvent = null;
    els.installBtn.classList.add("hidden");
    flash("האפליקציה הותקנה");
  });
}

async function installApp() {
  if (!installPromptEvent) {
    flash("התקנה לא זמינה כרגע");
    return;
  }
  installPromptEvent.prompt();
  await installPromptEvent.userChoice;
}

function persistTrades() { localStorage.setItem(STORAGE_KEY, JSON.stringify(trades)); }

function loadTrades() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.map(normalizeTrade).filter(Boolean);
  } catch {
    return [];
  }
}

function loadStartingBalance() {
  const raw = Number(localStorage.getItem(BALANCE_KEY));
  return Number.isNaN(raw) || raw < 0 ? 10000 : raw;
}

function dedupe(list) {
  const map = new Map();
  for (const t of list) map.set(t.id, t);
  return [...map.values()];
}

function normalizeDirection(value) {
  const v = String(value || "").toLowerCase().trim();
  if (v === "short" || v === "שורט") return "Short";
  return "Long";
}

function directionLabel(value) { return normalizeDirection(value) === "Short" ? "שורט" : "לונג"; }

function flash(message) {
  els.statusBar.textContent = message;
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => {
    els.statusBar.textContent = "";
    els.toast.classList.remove("show");
  }, 2200);
}

function csvCell(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseCsvLine(line) {
  const out = [];
  let curr = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { curr += '"'; i += 1; }
      else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(curr);
      curr = "";
    } else curr += ch;
  }
  out.push(curr);
  return out;
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toLocalDateTime(date) {
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 16);
}

function fmtDate(v) { return new Date(v).toLocaleString("he-IL", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
function fmtMoney(v) { return Number(v || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }); }
function fmtNum(v, d = 2) { return Number(v || 0).toLocaleString("he-IL", { minimumFractionDigits: d, maximumFractionDigits: d }); }
function sum(arr) { return arr.reduce((acc, n) => acc + Number(n || 0), 0); }
function n(v) { return Number(v); }
function i(v) { return Math.round(Number(v)); }
function clamp(v, min, max) { return Number.isNaN(v) ? min : Math.max(min, Math.min(max, v)); }
function createId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function stamp() { return new Date().toISOString().slice(0, 10); }

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
