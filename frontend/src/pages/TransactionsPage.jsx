import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

export default function TransactionsPage({ refreshFlag }) {
  const [tx, setTx] = useState([]);
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("All");

  async function load() {
    const rows = await api.getTransactions(month, category);
    setTx(rows);
  }

  useEffect(() => {
    load();
  }, [month, category, refreshFlag]);

  const categories = useMemo(() => ["All", ...new Set(tx.map((t) => t.category))], [tx]);

  async function updateRow(t, patch) {
    await api.updateTransaction(t.id, {
      category: patch.category ?? t.category,
      subCategory: patch.subCategory ?? t.subCategory,
      mandatory: patch.mandatory ?? !!t.mandatory
    });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-col md:flex-row gap-3 md:items-center">
        <h2 className="text-lg font-semibold md:mr-auto">Transactions</h2>
        <input className="input max-w-40" placeholder="YYYY-MM" value={month} onChange={(e) => setMonth(e.target.value)} />
        <select className="input max-w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3">Amount</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Mandatory</th>
            </tr>
          </thead>
          <tbody>
            {tx.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-3">{t.date}</td>
                <td className="py-2 pr-3 max-w-sm break-words">{t.description}</td>
                <td className="py-2 pr-3">{t.amount}</td>
                <td className="py-2 pr-3 capitalize">{t.type}</td>
                <td className="py-2 pr-3">
                  <input
                    className="input"
                    defaultValue={t.category}
                    onBlur={(e) => {
                      if (e.target.value !== t.category) updateRow(t, { category: e.target.value });
                    }}
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={!!t.mandatory}
                    onChange={(e) => updateRow(t, { mandatory: e.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
