import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import adminApi from "../../api/admin.js";
import { errorMessage } from "../../api/client.js";
import AdminTrendChart from "../../components/AdminTrendChart.jsx";

const series = {
  accounts: [
    { key: "signups", label: "New accounts", color: "#1f6f66" },
    { key: "logins", label: "Logins", color: "#5575a6" },
  ],
  consults: [
    { key: "consultPending", label: "Pending", color: "#d39b32" },
    { key: "consultAccepted", label: "Accepted", color: "#1f6f66" },
    { key: "consultDeclined", label: "Declined", color: "#b3402a" },
    { key: "consultCancelled", label: "Cancelled", color: "#5b706b" },
  ],
  activity: [
    { key: "activity", label: "Actions", color: "#5575a6" },
    { key: "approved", label: "Approved", color: "#1f6f66" },
    { key: "deleted", label: "Deleted", color: "#b3402a" },
  ],
};

function countByStatus(counts, key) {
  return counts?.[key] ?? 0;
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-line bg-paper p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-dark">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [range, setRange] = useState("24h");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    setError("");
    const load = (promise, setValue) =>
      promise
        .then((value) => {
          if (active) setValue(value);
        })
        .catch((err) => {
          if (active) setError(errorMessage(err));
        });
    load(adminApi.stats(), setStats);
    load(adminApi.analytics(range), setAnalytics);
    load(adminApi.users(), setAccounts);
    return () => {
      active = false;
    };
  }, [isAdmin, range]);

  return (
    <div className="space-y-7">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          Administration
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-brand-dark">
          {isAdmin ? "Admin overview" : "Moderation"}
        </h1>
        <p className="mt-2 text-muted">
          Review content while keeping authors anonymous.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-lg bg-risk-soft px-4 py-3 text-risk">
          {error}
        </p>
      )}

      {isAdmin && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label="Registered accounts" value={stats?.users.total ?? "—"} />
            <Metric label="Needs review" value={stats?.needsReview ?? "—"} />
            <Metric
              label="Pending consults"
              value={countByStatus(stats?.consults, "pending")}
            />
          </div>

          {analytics && (
            <div className="grid gap-5 xl:grid-cols-2">
              <AdminTrendChart
                title="Sign-ups and logins"
                description="Successful logins recorded from this release onward."
                buckets={analytics.buckets}
                range={range}
                onRangeChange={setRange}
                series={series.accounts}
              />
              <AdminTrendChart
                title="Consult request outcomes"
                description="Requests created in this period, grouped by their current status."
                buckets={analytics.buckets}
                range={range}
                onRangeChange={setRange}
                series={series.consults}
              />
              <AdminTrendChart
                title="Activity log"
                description="Moderation approvals and deletions over time."
                buckets={analytics.buckets}
                range={range}
                onRangeChange={setRange}
                series={series.activity}
              />
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            <Section title="People">
              <dl className="mt-4 divide-y divide-line text-sm">
                <div className="flex justify-between gap-4 py-3">
                  <dt>Accounts</dt>
                  <dd className="font-medium">{stats?.users.total ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt>New in the last 7 days</dt>
                  <dd className="font-medium">{stats?.users.last7Days ?? "—"}</dd>
                </div>
              </dl>
              <Link className="mt-3 inline-block font-medium text-brand underline" to="/admin/people">
                Manage accounts and roles
              </Link>
            </Section>
            <Section title="Review queue">
              <p className="mt-3 text-3xl font-semibold">
                {stats?.needsReview ?? "—"}
                <span className="ml-2 text-base font-normal text-muted">waiting for review</span>
              </p>
              <Link className="mt-3 inline-block font-medium text-brand underline" to="/admin/queue">
                Open review queue
              </Link>
            </Section>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Section title="Registered accounts">
              <p className="mt-1 text-sm text-muted">
                {stats?.users.total ?? "—"} accounts total · showing the latest 30
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase text-muted">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Role</th>
                      <th className="py-2 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {accounts?.map((account) => (
                      <tr key={account._id}>
                        <td className="py-3 pr-4 font-medium">{account.name}</td>
                        <td className="py-3 pr-4">{account.email}</td>
                        <td className="py-3 pr-4">
                          {account.role === "user" ? "User · awaiting staff access" : account.role}
                        </td>
                        <td className="py-3">
                          {new Date(account.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {accounts?.length === 0 && (
                      <tr><td className="py-4 text-muted" colSpan="4">No accounts found.</td></tr>
                    )}
                  </tbody>
                </table>
                {!accounts && <p className="py-4 text-muted">Loading accounts...</p>}
              </div>
            </Section>

            <div className="space-y-5">
              <Section title="Resonance">
                <dl className="mt-3 grid grid-cols-2 gap-x-6 text-sm">
                  <div className="py-2">Posts live <b className="float-right">{countByStatus(stats?.posts, "published")}</b></div>
                  <div className="py-2">Posts held <b className="float-right">{countByStatus(stats?.posts, "held")}</b></div>
                  <div className="py-2">Posts hidden <b className="float-right">{countByStatus(stats?.posts, "hidden")}</b></div>
                  <div className="py-2">Comments live <b className="float-right">{countByStatus(stats?.comments, "published")}</b></div>
                  <div className="py-2">Comments held <b className="float-right">{countByStatus(stats?.comments, "held")}</b></div>
                  <div className="py-2">Comments hidden <b className="float-right">{countByStatus(stats?.comments, "hidden")}</b></div>
                </dl>
              </Section>
              <Section title="Consult requests">
                <dl className="mt-3 grid grid-cols-2 gap-x-6 text-sm">
                  {["pending", "accepted", "declined", "cancelled"].map((status) => (
                    <div key={status} className="py-2 capitalize">
                      {status}<b className="float-right">{countByStatus(stats?.consults, status)}</b>
                    </div>
                  ))}
                </dl>
                <Link className="mt-2 inline-block font-medium text-brand underline" to="/admin/consults">
                  View requests
                </Link>
              </Section>
              <Section title="Activity log">
                <p className="mt-2 text-sm text-muted">Who approved or deleted what.</p>
                <Link className="mt-2 inline-block font-medium text-brand underline" to="/admin/audit">
                  Open activity log
                </Link>
              </Section>
            </div>
          </div>
        </>
      )}

      {!isAdmin && (
        <Section title="Review queue">
          <p className="mt-2 text-muted">Held and hidden Resonance content.</p>
          <Link className="mt-3 inline-block font-medium text-brand underline" to="/admin/queue">
            Open review queue
          </Link>
        </Section>
      )}
    </div>
  );
}
