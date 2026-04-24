import express from "express";
import cors from "cors";
import multer from "multer";
import Papa from "papaparse";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import { randomUUID } from "crypto";
import { all, get, initDb, run } from "./db.js";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = 4000;
dayjs.extend(customParseFormat);

const CATEGORY_IDEALS = {
  Food: 0.1,
  Shopping: 0.08,
  Entertainment: 0.05,
  Travel: 0.05
};

app.use(cors());
app.use(express.json());

function normalizeHeader(h = "") {
  return h.toLowerCase().replace(/[^a-z]/g, "");
}

function findColumn(headers, options) {
  for (const h of headers) {
    const n = normalizeHeader(h);
    if (options.some((o) => n.includes(o))) return h;
  }
  return null;
}

function parseAmount(raw) {
  if (raw === null || raw === undefined) return 0;
  const cleaned = String(raw).replace(/,/g, "").trim();
  if (!cleaned) return 0;
  return Number(cleaned) || 0;
}

function normalizeDate(raw) {
  const candidates = ["DD/MM/YYYY", "D/M/YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "MM/DD/YYYY"];
  for (const fmt of candidates) {
    const parsed = dayjs(raw, fmt, true);
    if (parsed.isValid()) return parsed.format("YYYY-MM-DD");
  }
  const fallback = dayjs(raw);
  return fallback.isValid() ? fallback.format("YYYY-MM-DD") : null;
}

async function autoCategorize(description) {
  const rules = await all("SELECT * FROM rules");
  const normalized = String(description || "").toUpperCase();
  for (const rule of rules) {
    if (normalized.includes(String(rule.keyword).toUpperCase())) {
      return {
        category: rule.category,
        subCategory: rule.subCategory,
        mandatory: !!rule.mandatory
      };
    }
  }

  return {
    category: "Uncategorized",
    subCategory: "General",
    mandatory: false
  };
}

async function getMonthlyMetrics(month) {
  const monthFilter = month ? "WHERE month = ?" : "";
  const params = month ? [month] : [];
  const tx = await all(`SELECT * FROM transactions ${monthFilter} ORDER BY date DESC`, params);

  let income = 0;
  let expense = 0;
  let mandatorySpend = 0;
  let optionalSpend = 0;

  const categorySpendMap = {};
  const merchantMap = {};

  for (const t of tx) {
    if (t.type === "credit") income += t.amount;
    if (t.type === "debit") {
      expense += t.amount;
      categorySpendMap[t.category] = (categorySpendMap[t.category] || 0) + t.amount;
      merchantMap[t.description] = (merchantMap[t.description] || 0) + t.amount;
      if (t.mandatory) mandatorySpend += t.amount;
      else optionalSpend += t.amount;
    }
  }

  const savingsRate = income > 0 ? (income - expense) / income : 0;
  const monthlyBurnRate = expense;

  const categoryBreakdown = Object.entries(categorySpendMap)
    .map(([category, spend]) => ({
      category,
      spend,
      percentOfIncome: income > 0 ? spend / income : 0,
      idealPercent: CATEGORY_IDEALS[category] || null,
      overspendPercent: CATEGORY_IDEALS[category] ? spend / income - CATEGORY_IDEALS[category] : 0
    }))
    .sort((a, b) => b.spend - a.spend);

  const topMerchants = Object.entries(merchantMap)
    .map(([merchant, spend]) => ({ merchant, spend }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const months = await all("SELECT DISTINCT month FROM transactions ORDER BY month DESC");

  return {
    income,
    expense,
    savingsRate,
    mandatorySpend,
    optionalSpend,
    monthlyBurnRate,
    categoryBreakdown,
    topMerchants,
    months: months.map((m) => m.month),
    transactions: tx
  };
}

async function goalProgress(month) {
  const goals = await all("SELECT * FROM goals ORDER BY targetDate ASC");
  const investmentRow = await get(
    "SELECT COALESCE(SUM(amount), 0) as invested FROM transactions WHERE type = 'debit' AND month = ? AND (category = 'Investment' OR UPPER(description) LIKE '%SIP%')",
    [month]
  );

  const now = dayjs();
  const actualInvestment = investmentRow?.invested || 0;

  const enriched = goals.map((g) => {
    const target = dayjs(g.targetDate);
    const monthsLeft = Math.max(target.diff(now, "month"), 1);
    const monthlyRequired = g.monthlyRequired > 0 ? g.monthlyRequired : g.targetAmount / monthsLeft;
    return {
      ...g,
      monthlyRequired,
      actualInvestment,
      gap: monthlyRequired - actualInvestment
    };
  });

  return enriched;
}

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value));
}

async function generateInsights(month) {
  const metrics = await getMonthlyMetrics(month);
  const goals = await goalProgress(month || dayjs().format("YYYY-MM"));
  const insights = [];

  const food = metrics.categoryBreakdown.find((c) => c.category === "Food");
  if (food && metrics.income > 0) {
    const spentPct = food.percentOfIncome * 100;
    insights.push(
      `You spent Rs ${formatINR(food.spend)} on food this month (${spentPct.toFixed(1)}% of income). Ideal is 10%.`
    );
  }

  const biggestOverspend = metrics.categoryBreakdown
    .filter((c) => c.idealPercent !== null && c.overspendPercent > 0)
    .sort((a, b) => b.overspendPercent - a.overspendPercent)[0];

  if (biggestOverspend && metrics.income > 0) {
    const overspendAmount = biggestOverspend.overspendPercent * metrics.income;
    insights.push(
      `You are overspending in ${biggestOverspend.category} by about Rs ${formatINR(overspendAmount)} this month versus your ideal allocation.`
    );

    const futureLoss = overspendAmount * 12 * 10 * Math.pow(1.12, 10);
    insights.push(
      `Current overspend pattern can cost approximately Rs ${formatINR(futureLoss)} in 10 years at 12% returns.`
    );
  }

  const firstGoalGap = goals.find((g) => g.gap > 0);
  if (firstGoalGap) {
    insights.push(
      `Reducing optional spending by Rs ${formatINR(firstGoalGap.gap)} helps you stay on track for ${firstGoalGap.goal}.`
    );
  }

  if (!insights.length) {
    insights.push("Great discipline this month. Spending and investment patterns are aligned with your goals.");
  }

  return insights;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/import-csv", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "CSV file is required" });

    const csvText = req.file.buffer.toString("utf-8");
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors?.length) {
      return res.status(400).json({ error: parsed.errors[0].message });
    }

    const rows = parsed.data;
    if (!rows.length) return res.status(400).json({ error: "No rows found in CSV" });

    const headers = Object.keys(rows[0]);
    const dateCol = findColumn(headers, ["date", "txn", "transactiondate"]);
    const narrationCol = findColumn(headers, ["narration", "description", "particular", "remarks"]);
    const debitCol = findColumn(headers, ["debit", "withdrawal"]);
    const creditCol = findColumn(headers, ["credit", "deposit"]);

    if (!dateCol || !narrationCol || !debitCol || !creditCol) {
      return res.status(400).json({
        error: "Unable to detect required columns (Date, Narration, Debit, Credit)."
      });
    }

    let imported = 0;

    for (const row of rows) {
      const date = normalizeDate(row[dateCol]);
      const description = String(row[narrationCol] || "").trim();
      const debit = parseAmount(row[debitCol]);
      const credit = parseAmount(row[creditCol]);

      if (!date || !description || (!debit && !credit)) continue;

      const type = debit > 0 ? "debit" : "credit";
      const amount = debit > 0 ? debit : credit;
      const month = dayjs(date).format("YYYY-MM");
      const categorized = await autoCategorize(description);

      await run(
        `INSERT INTO transactions(id, date, description, amount, type, category, subCategory, mandatory, month)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          randomUUID(),
          date,
          description,
          amount,
          type,
          categorized.category,
          categorized.subCategory,
          categorized.mandatory ? 1 : 0,
          month
        ]
      );

      imported += 1;
    }

    return res.json({ imported, sample: rows.slice(0, 5) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    const { month, category } = req.query;
    const clauses = [];
    const params = [];

    if (month) {
      clauses.push("month = ?");
      params.push(month);
    }

    if (category && category !== "All") {
      clauses.push("category = ?");
      params.push(category);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await all(`SELECT * FROM transactions ${where} ORDER BY date DESC`, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category, subCategory, mandatory } = req.body;

    await run(
      "UPDATE transactions SET category = ?, subCategory = ?, mandatory = ? WHERE id = ?",
      [category, subCategory || "General", mandatory ? 1 : 0, id]
    );

    const row = await get("SELECT * FROM transactions WHERE id = ?", [id]);
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/rules", async (_req, res) => {
  const rows = await all("SELECT * FROM rules ORDER BY id DESC");
  res.json(rows);
});

app.post("/api/rules", async (req, res) => {
  const { keyword, category, subCategory, mandatory } = req.body;
  const result = await run(
    "INSERT INTO rules(keyword, category, subCategory, mandatory) VALUES(?, ?, ?, ?)",
    [keyword, category, subCategory, mandatory ? 1 : 0]
  );
  const row = await get("SELECT * FROM rules WHERE id = ?", [result.lastID]);
  res.json(row);
});

app.put("/api/rules/:id", async (req, res) => {
  const { id } = req.params;
  const { keyword, category, subCategory, mandatory } = req.body;
  await run(
    "UPDATE rules SET keyword = ?, category = ?, subCategory = ?, mandatory = ? WHERE id = ?",
    [keyword, category, subCategory, mandatory ? 1 : 0, id]
  );
  const row = await get("SELECT * FROM rules WHERE id = ?", [id]);
  res.json(row);
});

app.delete("/api/rules/:id", async (req, res) => {
  const { id } = req.params;
  await run("DELETE FROM rules WHERE id = ?", [id]);
  res.json({ ok: true });
});

app.get("/api/goals", async (_req, res) => {
  const rows = await all("SELECT * FROM goals ORDER BY targetDate ASC");
  res.json(rows);
});

app.post("/api/goals", async (req, res) => {
  const { goal, targetAmount, targetDate, monthlyRequired } = req.body;
  const result = await run(
    "INSERT INTO goals(goal, targetAmount, targetDate, monthlyRequired) VALUES(?, ?, ?, ?)",
    [goal, Number(targetAmount), targetDate, Number(monthlyRequired || 0)]
  );
  const row = await get("SELECT * FROM goals WHERE id = ?", [result.lastID]);
  res.json(row);
});

app.put("/api/goals/:id", async (req, res) => {
  const { id } = req.params;
  const { goal, targetAmount, targetDate, monthlyRequired } = req.body;
  await run(
    "UPDATE goals SET goal = ?, targetAmount = ?, targetDate = ?, monthlyRequired = ? WHERE id = ?",
    [goal, Number(targetAmount), targetDate, Number(monthlyRequired || 0), id]
  );
  const row = await get("SELECT * FROM goals WHERE id = ?", [id]);
  res.json(row);
});

app.delete("/api/goals/:id", async (req, res) => {
  const { id } = req.params;
  await run("DELETE FROM goals WHERE id = ?", [id]);
  res.json({ ok: true });
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const month = req.query.month;
    const effectiveMonth = month || dayjs().format("YYYY-MM");
    const metrics = await getMonthlyMetrics(effectiveMonth);
    const goals = await goalProgress(effectiveMonth);
    res.json({ ...metrics, goals, month: effectiveMonth });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/insights", async (req, res) => {
  try {
    const month = req.query.month || dayjs().format("YYYY-MM");
    const insights = await generateInsights(month);
    res.json({ insights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});
