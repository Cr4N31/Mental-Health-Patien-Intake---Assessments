import { useEffect, useState } from "react";
import adminApi from "../../api/admin.js";
import { errorMessage } from "../../api/client.js";
import AdminTrendChart from "../../components/AdminTrendChart.jsx";

const series = [
  { key: "activity", label: "Actions", color: "#5575a6" },
  { key: "approved", label: "Approved", color: "#1f6f66" },
  { key: "deleted", label: "Deleted", color: "#b3402a" },
];

function actionLabel(row) {
  if (row.action === "role_change") {
    return `${row.admin} changed a user's role (${row.note ?? ""})`;
  }
  return `${row.admin} ${row.action === "approve" ? "approved" : "deleted"} a ${row.targetType}`;
}

export default function AuditPage() {
  const [rows, setRows] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState("24h");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setError("");
    adminApi
      .audit()
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
        <h1 className="mt-1 font-serif text-3xl font-semibold text-brand-dark">Activity log</h1>
        <p className="mt-2 text-muted">The last 50 moderation actions.</p>
      </header>
      {analytics && (
        <AdminTrendChart
          title="Actions over time"
          buckets={analytics.buckets}
          range={range}
          onRangeChange={setRange}
          series={series}
        />
      )}
      {error && <p role="alert" className="rounded-lg bg-risk-soft px-4 py-3 text-risk">{error}</p>}
      {!rows && !error && <p className="text-muted">Loading activity...</p>}
      {rows?.length === 0 && <p className="rounded-xl border border-line bg-paper p-5 text-muted">Nothing yet.</p>}
      {!!rows?.length && (
        <div className="overflow-x-auto rounded-xl border border-line bg-paper shadow-sm">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="border-b border-line bg-page/60 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row._id}>
                  <td className="px-4 py-3">{actionLabel(row)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
