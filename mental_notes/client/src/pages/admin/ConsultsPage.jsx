import { useEffect, useState } from "react";
import adminApi from "../../api/admin.js";
import { errorMessage } from "../../api/client.js";
import AdminTrendChart from "../../components/AdminTrendChart.jsx";

const series = [
  { key: "consultPending", label: "Pending", color: "#d39b32" },
  { key: "consultAccepted", label: "Accepted", color: "#1f6f66" },
  { key: "consultDeclined", label: "Declined", color: "#b3402a" },
  { key: "consultCancelled", label: "Cancelled", color: "#5b706b" },
];

export default function ConsultsPage() {
  const [rows, setRows] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState("24h");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setError("");
    adminApi
      .consults()
      .then((value) => {
        if (active) setRows(value);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    adminApi
      .analytics(range)
      .then((value) => {
        if (active) setAnalytics(value);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [range]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Administration</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-brand-dark">Consult requests</h1>
        <p className="mt-2 text-muted">Names and messages are private, so only the basics show here.</p>
      </header>
      {analytics && (
        <AdminTrendChart
          title="Requests by current status"
          description="Requests created in the selected period."
          buckets={analytics.buckets}
          range={range}
          onRangeChange={setRange}
          series={series}
        />
      )}
      {error && <p role="alert" className="rounded-lg bg-risk-soft px-4 py-3 text-risk">{error}</p>}
      {!rows && !error && <p className="text-muted">Loading consult requests...</p>}
      {rows?.length === 0 && <p className="rounded-xl border border-line bg-paper p-5 text-muted">No requests yet.</p>}
      {!!rows?.length && (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper shadow-sm">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-line bg-page/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Professional</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Preferred time</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row._id}>
                  <td className="px-4 py-3 font-medium">{row.professional}</td>
                  <td className="px-4 py-3 capitalize text-brand">{row.status}</td>
                  <td className="px-4 py-3">{row.preferredTime || "—"}</td>
                  <td className="px-4 py-3">{new Date(row.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
