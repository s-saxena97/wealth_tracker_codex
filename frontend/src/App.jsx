import { useMemo, useState } from "react";
import UploadPage from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";
import TransactionsPage from "./pages/TransactionsPage";
import RulesPage from "./pages/RulesPage";
import GoalsPage from "./pages/GoalsPage";

const tabs = ["Upload", "Dashboard", "Transactions", "Rules", "Goals"];

export default function App() {
  const [activeTab, setActiveTab] = useState("Upload");
  const [refreshFlag, setRefreshFlag] = useState(0);

  const page = useMemo(() => {
    const common = { onDataRefresh: () => setRefreshFlag((v) => v + 1), refreshFlag };
    if (activeTab === "Upload") return <UploadPage {...common} />;
    if (activeTab === "Dashboard") return <DashboardPage {...common} />;
    if (activeTab === "Transactions") return <TransactionsPage {...common} />;
    if (activeTab === "Rules") return <RulesPage {...common} />;
    return <GoalsPage {...common} />;
  }, [activeTab, refreshFlag]);

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Wealth Tracker</h1>
            <p className="text-sm text-slate-500">Are my expenses aligned with my investment goals?</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={
                  tab === activeTab
                    ? "btn-primary"
                    : "btn-secondary"
                }
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">{page}</main>
    </div>
  );
}