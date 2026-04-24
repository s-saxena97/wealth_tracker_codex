import { useEffect, useState } from "react";
import { api } from "../api";

const emptyRule = { keyword: "", category: "", subCategory: "", mandatory: false };

export default function RulesPage({ onDataRefresh, refreshFlag }) {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(emptyRule);

  async function load() {
    const rows = await api.getRules();
    setRules(rows);
  }

  useEffect(() => {
    load();
  }, [refreshFlag]);

  async function addRule(e) {
    e.preventDefault();
    await api.createRule(form);
    setForm(emptyRule);
    onDataRefresh();
    load();
  }

  return (
    <div className="space-y-4">
      <form className="card grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={addRule}>
        <input className="input" placeholder="Keyword" value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} required />
        <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <input className="input" placeholder="SubCategory" value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} required />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.mandatory} onChange={(e) => setForm({ ...form, mandatory: e.target.checked })} />
          Mandatory
        </label>
        <button type="submit" className="btn-primary">Add Rule</button>
      </form>

      <div className="card overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-200">
              <th className="py-2">Keyword</th>
              <th className="py-2">Category</th>
              <th className="py-2">SubCategory</th>
              <th className="py-2">Mandatory</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-2">{r.keyword}</td>
                <td className="py-2">{r.category}</td>
                <td className="py-2">{r.subCategory}</td>
                <td className="py-2">{r.mandatory ? "Yes" : "No"}</td>
                <td className="py-2">
                  <button className="btn-secondary" onClick={async () => { await api.deleteRule(r.id); onDataRefresh(); load(); }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}