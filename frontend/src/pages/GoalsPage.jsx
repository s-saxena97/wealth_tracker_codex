import { useEffect, useState } from "react";
import { api } from "../api";

const emptyGoal = { goal: "", targetAmount: "", targetDate: "", monthlyRequired: "" };

export default function GoalsPage({ refreshFlag, onDataRefresh }) {
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(emptyGoal);

  async function load() {
    const rows = await api.getGoals();
    setGoals(rows);
  }

  useEffect(() => {
    load();
  }, [refreshFlag]);

  async function addGoal(e) {
    e.preventDefault();
    await api.createGoal(form);
    setForm(emptyGoal);
    onDataRefresh();
    load();
  }

  return (
    <div className="space-y-4">
      <form className="card grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={addGoal}>
        <input className="input" placeholder="Goal" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} required />
        <input className="input" placeholder="Target Amount" type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required />
        <input className="input" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} required />
        <input className="input" placeholder="Monthly Required (optional)" type="number" value={form.monthlyRequired} onChange={(e) => setForm({ ...form, monthlyRequired: e.target.value })} />
        <button type="submit" className="btn-primary">Add Goal</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {goals.map((g) => (
          <div key={g.id} className="card">
            <h3 className="font-semibold">{g.goal}</h3>
            <p className="text-sm">Target: {g.targetAmount}</p>
            <p className="text-sm">Date: {g.targetDate}</p>
            <p className="text-sm">Monthly Required: {g.monthlyRequired || "Auto"}</p>
            <button className="btn-secondary mt-2" onClick={async () => { await api.deleteGoal(g.id); onDataRefresh(); load(); }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}