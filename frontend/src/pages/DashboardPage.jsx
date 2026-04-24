import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { api } from "../api";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0284c7", "#0891b2"];

function formatCurrency(v) {
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(v || 0))}`;
}

export default function DashboardPage({ refreshFlag }) {
  const [data, setData] = useState(null);
  const [insights, setInsights] = useState([]);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [dashboard, insightsResp] = await Promise.all([
        api.getDashboard(month),
        api.getInsights(month)
      ]);
      setData(dashboard);
      setInsights(insightsResp.insights || []);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, [month, refreshFlag]);

  const savingsRatePct = useMemo(() => ((data?.savingsRate || 0) * 100).toFixed(1), [data]);

  if (loading || !data) return <div className="card">Loading dashboard...</div>;

  return (
    <div className="space-y-4">
      <div className="card flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <select className="input max-w-48" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">{data.month}</option>
          {data.months?.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-slate-500">Income</p><p className="text-xl font-bold">{formatCurrency(data.income)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Expense</p><p className="text-xl font-bold">{formatCurrency(data.expense)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Savings Rate</p><p className="text-xl font-bold">{savingsRatePct}%</p></div>
        <div className="card"><p className="text-sm text-slate-500">Burn Rate</p><p className="text-xl font-bold">{formatCurrency(data.monthlyBurnRate)}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-2">Expense by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categoryBreakdown} dataKey="spend" nameKey="category" outerRadius={95} label>
                  {data.categoryBreakdown.map((entry, idx) => (
                    <Cell key={entry.category} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-2">Mandatory vs Optional</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Mandatory", amount: data.mandatorySpend },
                  { name: "Optional", amount: data.optionalSpend }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="amount" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-3">Top 5 Merchants</h3>
          <ul className="space-y-2 text-sm">
            {data.topMerchants.map((m) => (
              <li key={m.merchant} className="flex justify-between border-b border-slate-100 pb-1">
                <span className="truncate max-w-72">{m.merchant}</span>
                <span className="font-semibold">{formatCurrency(m.spend)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Goal Progress</h3>
          <div className="space-y-2 text-sm">
            {data.goals.length === 0 ? <p>No goals added yet.</p> : null}
            {data.goals.map((g) => (
              <div key={g.id} className="rounded-md border border-slate-200 p-2">
                <p className="font-semibold">{g.goal}</p>
                <p>Monthly required: {formatCurrency(g.monthlyRequired)}</p>
                <p>Current investment: {formatCurrency(g.actualInvestment)}</p>
                <p className={g.gap > 0 ? "text-red-600" : "text-green-600"}>
                  Gap: {formatCurrency(g.gap)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Insight Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((txt, idx) => (
            <div key={`${txt}-${idx}`} className="rounded-md border border-brand-100 bg-brand-50 p-3 text-sm">
              {txt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}