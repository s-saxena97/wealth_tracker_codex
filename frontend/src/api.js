const API_BASE = "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }
  return res.json();
}

export const api = {
  health: () => request("/health"),
  importCsv: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request("/import-csv", { method: "POST", body: formData });
  },
  getDashboard: (month) => request(`/dashboard${month ? `?month=${month}` : ""}`),
  getInsights: (month) => request(`/insights${month ? `?month=${month}` : ""}`),
  getTransactions: (month, category) => {
    const q = new URLSearchParams();
    if (month) q.set("month", month);
    if (category && category !== "All") q.set("category", category);
    return request(`/transactions${q.toString() ? `?${q.toString()}` : ""}`);
  },
  updateTransaction: (id, payload) =>
    request(`/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  getRules: () => request("/rules"),
  createRule: (payload) =>
    request("/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  updateRule: (id, payload) =>
    request(`/rules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  deleteRule: (id) => request(`/rules/${id}`, { method: "DELETE" }),
  getGoals: () => request("/goals"),
  createGoal: (payload) =>
    request("/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  updateGoal: (id, payload) =>
    request(`/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: "DELETE" })
};