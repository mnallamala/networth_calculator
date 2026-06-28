const ITEMS_STORAGE_KEY = "my-net-worth-tracker:items";
const SETTINGS_STORAGE_KEY = "my-net-worth-tracker:settings";
const CATEGORIES_STORAGE_KEY = "my-net-worth-tracker:categories";

const defaultCategories = [
  { id: "savings", label: "Savings Account", type: "asset", icon: "🐷", description: "Emergency savings and cash reserves" },
  { id: "checking", label: "Checking Account", type: "asset", icon: "👛", description: "Everyday banking balance" },
  { id: "401k", label: "401K Account", type: "asset", icon: "🌳", description: "Employer retirement account" },
  { id: "hsa", label: "HSA Account", type: "asset", icon: "💚", description: "Health savings account" },
  { id: "529", label: "529 Account", type: "asset", icon: "🎓", description: "Education savings account" },
  { id: "brokerage", label: "Brokerage Account", type: "asset", icon: "📊", description: "Taxable investment account" },
  { id: "stockPortfolio", label: "Stock Portfolio", type: "asset", icon: "📈", description: "Stocks and marketable securities" },
  { id: "realEstate", label: "Real Estate", type: "asset", icon: "🏠", description: "Property value estimate" },
  { id: "vehicleValue", label: "Vehicle Value", type: "asset", icon: "🚗", description: "Estimated vehicle value" },
  { id: "cash", label: "Cash", type: "asset", icon: "💵", description: "Physical cash on hand" },
  { id: "goldJewelry", label: "Gold / Jewelry", type: "asset", icon: "💎", description: "Precious metals and jewelry" },
  { id: "otherAsset", label: "Other Asset", type: "asset", icon: "📦", description: "Other financial asset" },
  { id: "creditCardDebt", label: "Credit Card Debt", type: "liability", icon: "💳", description: "Revolving credit card balance" },
  { id: "carLoan", label: "Car Loan", type: "liability", icon: "🚘", description: "Vehicle loan balance" },
  { id: "personalLoan", label: "Personal Loan", type: "liability", icon: "📄", description: "Personal loan balance" },
  { id: "homeLoan", label: "Home Loan / Mortgage", type: "liability", icon: "🏛️", description: "Mortgage or home loan balance" },
  { id: "studentLoan", label: "Student Loan", type: "liability", icon: "📚", description: "Education loan balance" },
  { id: "medicalDebt", label: "Medical Debt", type: "liability", icon: "🏥", description: "Medical balance owed" },
  { id: "otherLoan", label: "Other Loan", type: "liability", icon: "🧾", description: "Other liability or debt" },
];

const defaultProfile = {
  age: "",
  gender: "",
  retirementAge: "",
  family: "",
};

const currencies = [
  { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US" },
  { code: "INR", symbol: "₹", label: "Indian Rupee", locale: "en-IN" },
  { code: "EUR", symbol: "€", label: "Euro", locale: "en-IE" },
  { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen", locale: "ja-JP" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", locale: "en-AU" },
];

const defaultSettings = {
  maskNumbers: false,
  currency: "USD",
  goal: {
    targetNetWorth: "",
    targetRetirementAge: "",
    currentAge: "",
    notes: "",
  },
  profile: defaultProfile,
};

let state = {
  items: loadItems(),
  settings: loadSettings(),
  categories: loadCategories(),
  editingId: null,
  showCategoryManager: false,
};

const app = document.querySelector("#app");
let categoryById = getCategoryMap();

function loadItems() {
  try {
    const raw = localStorage.getItem(ITEMS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return structuredClone(defaultSettings);
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      goal: { ...defaultSettings.goal, ...(parsed.goal || {}) },
      profile: { ...defaultSettings.profile, ...(parsed.profile || {}) },
    };
  } catch {
    return structuredClone(defaultSettings);
  }
}

function loadCategories() {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultCategories;
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : structuredClone(defaultCategories);
  } catch {
    return structuredClone(defaultCategories);
  }
}

function saveState() {
  localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(state.items));
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state.settings));
  localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(state.categories));
}

function formatCurrency(value) {
  const selectedCurrency = currencies.find((currency) => currency.code === state.settings.currency) || currencies[0];
  return new Intl.NumberFormat(selectedCurrency.locale, {
    style: "currency",
    currency: selectedCurrency.code,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function money(value) {
  const selectedCurrency = currencies.find((currency) => currency.code === state.settings.currency) || currencies[0];
  return state.settings.maskNumbers ? `${selectedCurrency.symbol}••••••` : formatCurrency(value);
}

function parseMoney(value) {
  const parsed = Number(String(value).replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function createId() {
  return crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function createCategoryId(label) {
  const base =
    String(label)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "category";
  let candidate = base;
  let index = 2;
  while (state.categories.some((category) => category.id === candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function getCategoryMap() {
  return Object.fromEntries(state.categories.map((category) => [category.id, category]));
}

function calculateSummary() {
  const totalAssets = state.items
    .filter((item) => categoryById[item.categoryId]?.type === "asset")
    .reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = state.items
    .filter((item) => categoryById[item.categoryId]?.type === "liability")
    .reduce((sum, item) => sum + item.amount, 0);
  const netWorth = totalAssets - totalLiabilities;
  const yearsToRetirement = Math.max(0, state.settings.goal.targetRetirementAge - state.settings.goal.currentAge);
  const gapToGoal = state.settings.goal.targetNetWorth - netWorth;
  const requiredYearlyProgress = yearsToRetirement > 0 ? Math.max(0, gapToGoal) / yearsToRetirement : 0;
  const goalProgressPercent =
    state.settings.goal.targetNetWorth > 0
      ? Math.min(100, Math.max(0, (netWorth / state.settings.goal.targetNetWorth) * 100))
      : 0;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    yearsToRetirement,
    gapToGoal,
    requiredYearlyProgress,
    goalProgressPercent,
    assetToLiabilityRatio: totalLiabilities > 0 ? totalAssets / totalLiabilities : null,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function categoryIcon(category, size = "md") {
  if (!category) {
    return `<span class="category-icon category-icon-${size} category-icon-asset" aria-hidden="true">?</span>`;
  }
  return `<span class="category-icon category-icon-${size} category-icon-${category.type}" aria-hidden="true">${category.icon}</span>`;
}

function render() {
  categoryById = getCategoryMap();
  const summary = calculateSummary();
  const assets = state.items.filter((item) => categoryById[item.categoryId]?.type === "asset");
  const liabilities = state.items.filter((item) => categoryById[item.categoryId]?.type === "liability");
  const editingItem = state.items.find((item) => item.id === state.editingId) || null;
  const selectedCategory = categoryById[editingItem?.categoryId] || state.categories[0];
  const progressDegrees = Math.round((summary.goalProgressPercent / 100) * 360);
  const goalMet = summary.gapToGoal <= 0 && state.settings.goal.targetNetWorth > 0;

  app.innerHTML = `
    ${renderHeader()}
    ${state.showCategoryManager ? renderCategoryManager() : ""}
    ${renderDashboard(summary, assets.length, liabilities.length, progressDegrees)}
    <section class="dashboard-grid">
      <div class="main-column">
        ${renderForm(editingItem, selectedCategory)}
        <section class="item-lists">
          ${renderList("Assets", "asset", assets, summary.totalAssets)}
          ${renderList("Liabilities", "liability", liabilities, summary.totalLiabilities)}
        </section>
      </div>
      ${renderGoal(summary, goalMet)}
    </section>
    ${renderAnalysis(summary)}
  `;

  bindEvents();
}

function renderHeader() {
  const greeting = getGreeting();
  const selectedCurrency = currencies.find((currency) => currency.code === state.settings.currency) || currencies[0];
  return `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">💰</div>
        <div>
          <p class="greeting">${greeting}, Mahesh</p>
          <h1>Net worth Tracking</h1>
          <p class="subtle">Private local dashboard for family-focused financial clarity.</p>
        </div>
      </div>
      <div class="topbar-actions">
        <div class="topbar-controls">
          <label class="currency-control" for="currencySelector">
            <span class="currency-icon" aria-hidden="true">${selectedCurrency.symbol}</span>
            <select id="currencySelector" aria-label="Currency">
              ${currencies
                .map(
                  (currency) =>
                    `<option value="${currency.code}" ${currency.code === state.settings.currency ? "selected" : ""}>${currency.symbol} ${currency.code}</option>`,
                )
                .join("")}
            </select>
          </label>
          <button class="mask-toggle ${state.settings.maskNumbers ? "is-on" : ""}" type="button" id="maskToggle" aria-pressed="${state.settings.maskNumbers}">
            <span aria-hidden="true">${state.settings.maskNumbers ? "◌" : "◉"}</span>
            <strong>Mask Financial Numbers: ${state.settings.maskNumbers ? "ON" : "OFF"}</strong>
            <span class="switch" aria-hidden="true"></span>
          </button>
        </div>
        <p class="privacy-note">🔒 Your financial data is stored locally in your browser and is not sent anywhere.</p>
      </div>
    </header>
  `;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function renderCategoryManager() {
  return `
    <section class="card category-manager" aria-label="Manage categories">
      <div class="section-head">
        <div>
          <h2>Manage Categories</h2>
          <p class="subtle">Add, rename, or update category type and icon. Used categories cannot be deleted.</p>
        </div>
        <button class="ghost-button" type="button" id="closeCategoryManager">Close</button>
      </div>

      <form class="category-form" id="categoryForm">
        <input type="hidden" name="categoryId" id="categoryId" />
        <div class="field">
          <label for="categoryLabel">Category Name</label>
          <input id="categoryLabel" name="label" placeholder="Example: Crypto Wallet" />
        </div>
        <div class="field">
          <label for="categoryType">Type</label>
          <select id="categoryType" name="type">
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
          </select>
        </div>
        <div class="field">
          <label for="categoryEmoji">Icon</label>
          <input id="categoryEmoji" name="icon" maxlength="4" placeholder="💼" />
        </div>
        <div class="field">
          <label for="categoryDescription">Description</label>
          <input id="categoryDescription" name="description" placeholder="Short helper text" />
        </div>
        <div class="category-actions">
          <button class="primary-button" type="submit">✓ Save Category</button>
          <button class="ghost-button" type="button" id="resetCategoryForm">Clear</button>
        </div>
        <p class="form-error" id="categoryError" hidden></p>
      </form>

      <div class="category-list">
        ${state.categories
          .map((category) => {
            const itemCount = state.items.filter((item) => item.categoryId === category.id).length;
            return `
              <div class="category-row">
                ${categoryIcon(category, "sm")}
                <div class="row-copy">
                  <div class="row-title">${escapeHtml(category.label)}</div>
                  <div class="row-subtitle">${category.type === "asset" ? "Asset" : "Liability"} · ${escapeHtml(category.description)}${itemCount ? ` · ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}</div>
                </div>
                <div class="row-actions">
                  <button class="icon-button" type="button" data-category-edit="${category.id}" aria-label="Edit ${escapeHtml(category.label)}">✎</button>
                  <button class="icon-button danger" type="button" data-category-delete="${category.id}" aria-label="Delete ${escapeHtml(category.label)}" ${itemCount ? "disabled" : ""}>⌫</button>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderDashboard(summary, assetCount, liabilityCount, progressDegrees) {
  return `
    <section class="worth-dashboard" aria-label="Net worth dashboard">
      <article class="worth-hero">
        <div class="worth-copy">
          <div class="worth-title">Total Net Worth <span class="eye-dot" aria-hidden="true"></span></div>
          <span class="worth-amount">${money(summary.netWorth)}</span>
          <div class="monthly-change">🎯 ${
            summary.goalProgressPercent > 0
              ? `${Math.round(summary.goalProgressPercent)}% of target goal`
              : "Set a target goal to track progress"
          }</div>
        </div>
        <div class="goal-ring-wrap" aria-label="Goal progress">
          <div class="goal-ring" style="--progress-degrees: ${progressDegrees}deg">
            <div class="goal-ring-label">
              <strong>${Math.round(summary.goalProgressPercent)}%</strong>
              <span>of goal</span>
            </div>
          </div>
        </div>
      </article>
      <aside class="worth-side">
        <div class="side-metric">
          <div>
            <div class="side-label">Total Assets</div>
            <span class="side-value accent-green">${money(summary.totalAssets)}</span>
          </div>
          <div class="side-icon asset-icon" aria-hidden="true">💼</div>
        </div>
        <div class="side-metric">
          <div>
            <div class="side-label">Total Liabilities</div>
            <span class="side-value accent-red">${money(summary.totalLiabilities)}</span>
          </div>
          <div class="side-icon liability-icon" aria-hidden="true">🏛️</div>
        </div>
      </aside>
    </section>
    <section class="supporting-metrics" aria-label="Financial details">
      <article class="card mini-metric-card">
        <div class="metric-label">Asset-to-Liability Ratio</div>
        <div class="metric-value accent-blue">${summary.assetToLiabilityRatio === null ? "No debt" : summary.assetToLiabilityRatio.toFixed(2)}</div>
        <p class="metric-note">Assets per $1 of debt</p>
      </article>
      <article class="card mini-metric-card">
        <div class="metric-label">Retirement Years</div>
        <div class="metric-value accent-gold">⏳ ${summary.yearsToRetirement}</div>
        <p class="metric-note">Based on current and target ages</p>
      </article>
      <article class="card mini-metric-card">
        <div class="metric-label">Tracked Categories</div>
        <div class="metric-value accent-green">👛 ${assetCount + liabilityCount}</div>
        <p class="metric-note">${assetCount} assets and ${liabilityCount} liabilities</p>
      </article>
    </section>
  `;
}

function renderForm(editingItem, selectedCategory) {
  const item = editingItem || { categoryId: state.categories[0]?.id || "savings", label: "", amount: "", notes: "" };
  return `
    <article class="card form-card">
      <div class="section-head">
        <div>
          <h2>${editingItem ? "Edit Financial Item" : "Add Financial Item"}</h2>
          <p class="subtle">Category determines whether the item is an asset or liability.</p>
        </div>
        <span class="pill ${selectedCategory.type === "asset" ? "accent-green" : "accent-red"}">${selectedCategory.type === "asset" ? "Asset" : "Liability"}</span>
      </div>
      <form id="itemForm">
        <div class="form-grid">
          <div class="field">
            <label for="category">Category</label>
            <select id="category" name="categoryId">
              ${state.categories
                .map(
                  (category) =>
                    `<option value="${category.id}" ${category.id === item.categoryId ? "selected" : ""}>${category.label}</option>`,
                )
                .join("")}
            </select>
          </div>
          <div class="field">
            <label for="amount">Amount</label>
            <input id="amount" name="amount" inputmode="decimal" min="0" placeholder="0" type="number" value="${item.amount || ""}" />
          </div>
          <div class="field">
            <label for="label">Account Name or Label</label>
            <input id="label" name="label" placeholder="Example: Emergency savings" value="${escapeHtml(item.label)}" />
          </div>
          <div class="selected-category" id="selectedCategory">
            ${categoryIcon(selectedCategory, "lg")}
            <div>
              <strong>${selectedCategory.label}</strong>
              <p class="type-tag ${selectedCategory.type === "asset" ? "accent-green" : "accent-red"}">Automatically classified as ${selectedCategory.type === "asset" ? "Asset" : "Liability"}</p>
              <p class="subtle">${selectedCategory.description}</p>
            </div>
          </div>
          <div class="field full">
            <label for="notes">Notes</label>
            <textarea id="notes" name="notes" placeholder="Optional notes">${escapeHtml(item.notes)}</textarea>
          </div>
        </div>
        <p class="form-error" id="formError" hidden></p>
        <div class="form-actions">
          <button class="primary-button" type="submit">✓ ${editingItem ? "Update Item" : "Save Item"}</button>
          <button class="ghost-button" type="button" id="clearForm">↻ Clear</button>
        </div>
      </form>
    </article>
  `;
}

function renderList(title, type, items, total) {
  return `
    <article class="card list-card">
      <div class="list-header">
        <h3>${title}</h3>
        <span class="pill ${type === "asset" ? "accent-green" : "accent-red"}">Total ${money(total)}</span>
      </div>
      ${
        items.length === 0
          ? `<div class="empty-state"><strong>No ${title.toLowerCase()} yet</strong><p>Add an item above to start tracking this section.</p></div>`
          : `<div class="money-list">${items
              .map((item) => {
                const category = categoryById[item.categoryId] || {
                  id: item.categoryId,
                  label: "Unknown Category",
                  type,
                  icon: "?",
                  description: "This category is no longer available",
                };
                return `
                  <div class="money-row">
                    ${categoryIcon(category, "sm")}
                    <div class="row-copy">
                      <div class="row-title">${category.label}</div>
                      <div class="row-subtitle">${escapeHtml(item.label)}</div>
                    </div>
                    <span class="row-amount">${money(item.amount)}</span>
                    <div class="row-actions">
                      <button class="icon-button" type="button" data-edit="${item.id}" aria-label="Edit ${escapeHtml(item.label)}">✎</button>
                      <button class="icon-button danger" type="button" data-delete="${item.id}" aria-label="Delete ${escapeHtml(item.label)}">⌫</button>
                    </div>
                  </div>
                `;
              })
              .join("")}</div>`
      }
      ${
        type === "asset"
          ? `<div class="asset-card-actions"><button class="ghost-button category-corner-button" type="button" id="toggleCategoryManager">⚙ Manage Categories</button></div>`
          : ""
      }
    </article>
  `;
}

function renderGoal(summary, goalMet) {
  const goal = state.settings.goal;
  return `
    <aside class="card goal-card" aria-label="Goal section">
      <div class="section-head">
        <div>
          <h2>Goal</h2>
          <p class="subtle">Track target net worth and retirement timeline.</p>
        </div>
        <span class="pill">🎯 Target</span>
      </div>
      <form class="goal-fields" id="goalForm">
        <div class="goal-primary-fields">
          <div class="field">
            <label for="targetNetWorth">Target Net Worth</label>
            <input id="targetNetWorth" name="targetNetWorth" inputmode="numeric" min="0" type="number" value="${goal.targetNetWorth}" />
            <span class="field-hint">${goal.targetNetWorth === "" ? "" : formatCurrency(goal.targetNetWorth)}</span>
          </div>
          <div class="field">
            <label for="targetRetirementAge">Target Retirement Age</label>
            <input id="targetRetirementAge" name="targetRetirementAge" min="0" type="number" value="${goal.targetRetirementAge}" />
          </div>
          <div class="field">
            <label for="currentAge">Current Age</label>
            <input id="currentAge" name="currentAge" min="0" type="number" value="${goal.currentAge}" />
          </div>
        </div>

        <div class="goal-metrics">
          <div class="goal-row"><span>Current Net Worth</span><strong>${money(summary.netWorth)}</strong></div>
          <div class="goal-row"><span>Target Net Worth</span><strong>${money(goal.targetNetWorth)}</strong></div>
          <div class="goal-row"><span>Gap to Goal</span><strong>${money(Math.max(0, summary.gapToGoal))}</strong></div>
          <div class="goal-row"><span>Years Remaining</span><strong>${summary.yearsToRetirement}</strong></div>
          <div class="goal-row"><span>Required Yearly Progress</span><strong>${money(summary.requiredYearlyProgress)}</strong></div>
        </div>

        <div class="progress-box ${goalMet ? "success" : ""}">
          <div class="progress-head">
            <strong>${goalMet ? "Goal achieved" : "Progress to target"}</strong>
            <span>${goalMet ? "You are above target" : `${Math.round(summary.goalProgressPercent)}% complete`}</span>
          </div>
          <div class="progress-track"><div class="progress-fill" style="width: ${summary.goalProgressPercent}%"></div></div>
          ${goalMet ? `<p class="success-note">✓ Current net worth is above your target.</p>` : ""}
        </div>

        <div class="field">
          <label for="goalNotes">Notes</label>
          <textarea id="goalNotes" name="notes" placeholder="Goal context, family priorities, or planning notes">${escapeHtml(goal.notes)}</textarea>
        </div>
      </form>
    </aside>
  `;
}

function renderAnalysis(summary) {
  const hasPositiveNetWorth = summary.netWorth > 0;
  const hasHighInterestDebt = state.items.some((item) => item.categoryId === "creditCardDebt" && item.amount > 0);
  const hasEducationSavings = state.items.some((item) => item.categoryId === "529" && item.amount > 0);
  const hasRetirementSavings = state.items.some((item) => item.categoryId === "401k" && item.amount > 0);
  const hasLiquidSavings = state.items.some((item) => ["savings", "checking", "cash"].includes(item.categoryId) && item.amount > 0);
  const assetDegrees =
    summary.totalAssets + summary.totalLiabilities > 0
      ? (summary.totalAssets / (summary.totalAssets + summary.totalLiabilities)) * 360
      : 180;

  const statusText = hasPositiveNetWorth
    ? "Your current net worth is positive, which is a constructive foundation for long-term planning."
    : summary.netWorth === 0
      ? "Your dashboard is ready. Add assets and liabilities to generate more specific observations."
      : "Your liabilities are currently above your assets, so debt visibility and cash-flow flexibility deserve attention.";

  const goalSentence =
    summary.gapToGoal <= 0 && summary.goalProgressPercent > 0
      ? "You are currently above your stated net worth target."
      : summary.yearsToRetirement > 0
        ? `With ${summary.yearsToRetirement} years until your target retirement age, required yearly progress is ${formatCurrency(summary.requiredYearlyProgress)} before masking.`
        : "Update the goal ages if you want a future-year progress estimate.";

  return `
    <section class="card analysis-card" aria-label="AI financial expert summary">
      <div class="section-head">
        <div>
          <h2>AI Financial Expert Summary</h2>
          <p class="subtle">General educational observations based on local entries, not investment advice.</p>
        </div>
        <span class="pill">✦ Local analysis</span>
      </div>
      <div class="analysis-grid">
        <div class="agent-panel">
          <div class="agent-title">✨ Professional Summary</div>
          <p class="agent-copy">${statusText} The dashboard emphasizes emergency reserves, future financial goals, retirement savings consistency, and liability management. ${goalSentence}</p>
        </div>
        <div class="chart-panel">
          <div class="donut-wrap">
            <div class="donut" style="--asset-degrees: ${assetDegrees}deg" aria-hidden="true"></div>
            <div>
              <strong>Asset vs Liability View</strong>
              <div class="legend">
                <div class="legend-item"><span class="dot green"></span>Assets total: ${money(summary.totalAssets)}</div>
                <div class="legend-item"><span class="dot red"></span>Liabilities total: ${money(summary.totalLiabilities)}</div>
                <div class="legend-item"><span class="dot blue"></span>Ratio: ${summary.assetToLiabilityRatio === null ? "No debt" : summary.assetToLiabilityRatio.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
        ${insight("✅", "Strengths", hasRetirementSavings ? "Retirement savings are represented, which helps keep long-term planning visible." : "Add retirement balances such as 401K, HSA, or brokerage accounts to improve long-term visibility.")}
        ${insight("⚠️", "Risk Areas", hasHighInterestDebt ? "Credit card debt is present, so high-interest liability management may improve financial flexibility." : "No credit card balance is listed. Continue monitoring debts that can reduce monthly flexibility.")}
        ${insight("👨‍👩‍👧‍👧", "Future Planning", hasEducationSavings ? "Education savings are visible, which supports future goal planning." : "A 529 or other education savings entry can make future education planning easier to monitor.")}
        ${insight("🛡️", "Emergency Fund", hasLiquidSavings ? "Liquid savings are represented, which can support family resilience during unexpected events." : "Consider tracking savings, checking, or cash reserves so emergency fund readiness is visible.")}
        ${insight("🧭", "Improvement Areas", "Useful next metrics may include savings rate, debt payoff progress, annual net worth change, and education funding progress.")}
      </div>
    </section>
  `;
}

function insight(icon, title, text) {
  return `<div class="insight"><span>${icon}</span><div><strong>${title}</strong><p>${text}</p></div></div>`;
}

function bindEvents() {
  document.querySelector("#currencySelector").addEventListener("change", (event) => {
    const currencyCode = String(event.target.value);
    if (!currencies.some((currency) => currency.code === currencyCode)) return;
    state.settings.currency = currencyCode;
    saveState();
    render();
  });

  document.querySelector("#toggleCategoryManager").addEventListener("click", () => {
    state.showCategoryManager = !state.showCategoryManager;
    render();
  });

  document.querySelector("#closeCategoryManager")?.addEventListener("click", () => {
    state.showCategoryManager = false;
    render();
  });

  document.querySelector("#categoryForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const categoryId = String(form.get("categoryId") || "");
    const label = String(form.get("label") || "").trim();
    const type = String(form.get("type") || "asset") === "liability" ? "liability" : "asset";
    const icon = String(form.get("icon") || "").trim() || (type === "asset" ? "💼" : "🧾");
    const description = String(form.get("description") || "").trim() || `${type === "asset" ? "Asset" : "Liability"} category`;
    const error = document.querySelector("#categoryError");

    if (!label) {
      error.hidden = false;
      error.textContent = "Please add a category name.";
      return;
    }

    const duplicate = state.categories.some(
      (category) => category.id !== categoryId && category.label.toLowerCase() === label.toLowerCase(),
    );

    if (duplicate) {
      error.hidden = false;
      error.textContent = "A category with that name already exists.";
      return;
    }

    if (categoryId) {
      state.categories = state.categories.map((category) =>
        category.id === categoryId ? { ...category, label, type, icon, description } : category,
      );
    } else {
      state.categories = [
        ...state.categories,
        {
          id: createCategoryId(label),
          label,
          type,
          icon,
          description,
        },
      ];
    }

    saveState();
    render();
  });

  document.querySelector("#resetCategoryForm")?.addEventListener("click", () => {
    const form = document.querySelector("#categoryForm");
    form.reset();
    form.querySelector("#categoryId").value = "";
    document.querySelector("#categoryError").hidden = true;
  });

  document.querySelectorAll("[data-category-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const category = categoryById[button.dataset.categoryEdit];
      if (!category) return;
      document.querySelector("#categoryId").value = category.id;
      document.querySelector("#categoryLabel").value = category.label;
      document.querySelector("#categoryType").value = category.type;
      document.querySelector("#categoryEmoji").value = category.icon;
      document.querySelector("#categoryDescription").value = category.description;
      document.querySelector("#categoryLabel").focus();
    });
  });

  document.querySelectorAll("[data-category-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const categoryId = button.dataset.categoryDelete;
      const inUse = state.items.some((item) => item.categoryId === categoryId);
      if (inUse || state.categories.length <= 1) return;
      state.categories = state.categories.filter((category) => category.id !== categoryId);
      saveState();
      render();
    });
  });

  document.querySelector("#maskToggle").addEventListener("click", () => {
    state.settings.maskNumbers = !state.settings.maskNumbers;
    saveState();
    render();
  });

  document.querySelector("#category").addEventListener("change", (event) => {
    const category = categoryById[event.target.value];
    if (!category) return;
    document.querySelector("#selectedCategory").innerHTML = `
      ${categoryIcon(category, "lg")}
      <div>
        <strong>${category.label}</strong>
        <p class="type-tag ${category.type === "asset" ? "accent-green" : "accent-red"}">Automatically classified as ${category.type === "asset" ? "Asset" : "Liability"}</p>
        <p class="subtle">${category.description}</p>
      </div>
    `;
  });

  document.querySelector("#itemForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = parseMoney(form.get("amount"));
    const label = String(form.get("label") || "").trim();
    const error = document.querySelector("#formError");

    if (!label) {
      error.hidden = false;
      error.textContent = "Please add an account name or label.";
      return;
    }

    if (amount === null) {
      error.hidden = false;
      error.textContent = "Please enter a valid non-negative amount.";
      return;
    }

    const now = new Date().toISOString();
    const itemInput = {
      categoryId: String(form.get("categoryId")),
      label,
      amount,
      notes: String(form.get("notes") || "").trim(),
    };

    if (state.editingId) {
      state.items = state.items.map((item) =>
        item.id === state.editingId ? { ...item, ...itemInput, updatedAt: now } : item,
      );
      state.editingId = null;
    } else {
      state.items = [...state.items, { ...itemInput, id: createId(), createdAt: now, updatedAt: now }];
    }

    saveState();
    render();
  });

  document.querySelector("#clearForm").addEventListener("click", () => {
    state.editingId = null;
    render();
  });

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingId = button.dataset.edit;
      render();
      document.querySelector("#itemForm").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.items = state.items.filter((item) => item.id !== button.dataset.delete);
      if (state.editingId === button.dataset.delete) {
        state.editingId = null;
      }
      saveState();
      render();
    });
  });

  document.querySelector("#goalForm").addEventListener("change", (event) => {
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentAge = Math.max(0, Number(data.get("currentAge")) || 0);
    const targetRetirementAge = Math.max(0, Number(data.get("targetRetirementAge")) || 0);
    state.settings.goal = {
      targetNetWorth: Math.max(0, Number(data.get("targetNetWorth")) || 0),
      targetRetirementAge,
      currentAge,
      notes: String(data.get("notes") || ""),
    };
    state.settings.profile = {
      ...state.settings.profile,
      age: currentAge,
      retirementAge: targetRetirementAge,
    };
    saveState();
    render();
  });
}

render();
