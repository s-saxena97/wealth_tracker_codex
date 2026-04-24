import { useState } from "react";
import { api } from "../api";

export default function UploadPage({ onDataRefresh }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.importCsv(file);
      setResult(data);
      onDataRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Upload HDFC CSV</h2>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="input"
        />
        <div className="mt-3">
          <button type="button" className="btn-primary" onClick={handleImport} disabled={!file || loading}>
            {loading ? "Importing..." : "Import CSV"}
          </button>
        </div>
        {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
      </div>

      {result ? (
        <div className="card">
          <h3 className="font-semibold">Import Result</h3>
          <p className="text-sm text-slate-600 mt-1">Imported {result.imported} transactions.</p>
          <div className="overflow-auto mt-3">
            <pre className="text-xs bg-slate-100 p-3 rounded-md">{JSON.stringify(result.sample, null, 2)}</pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}