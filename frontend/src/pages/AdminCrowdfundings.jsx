import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { money, shortDate } from "../utils/format";
import { useAuth } from "../contexts/AuthContext";

export default function AdminCrowdfundings() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const load = () =>
    api("/crowdfundings/admin/pending")
      .then((d) => setItems(d.crowdfundings || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const act = async (id, type) => {
    setBusy(`${type}-${id}`);
    setError("");
    try {
      await api(`/crowdfundings/admin/${id}/${type}`, { method: "PATCH" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };
  if (user?.role !== "admin") return <Navigate to="/app" replace />;
  if (loading) return <LoadingBlock text="Loading pending approvals..." />;
  return (
    <>
      <div className="page-title-row">
        <h1>Crowdfunding Approvals</h1>
      </div>
      <Alert>{error}</Alert>
      {items.length ? (
        <div className="admin-list">
          {items.map((c) => (
            <article key={c.id}>
              <div>
                <span className="badge orange">Pending</span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <small>
                  Posted by {c.poster_name} • {shortDate(c.created_at)}
                </small>
              </div>
              <div className="admin-amount">
                <small>Target Amount</small>
                <strong>{money(c.target_amount)}</strong>
                <div>
                  <button
                    className="button danger-soft"
                    onClick={() => act(c.id, "reject")}
                    disabled={Boolean(busy)}
                  >
                    Reject
                  </button>
                  <button
                    className="button primary"
                    onClick={() => act(c.id, "approve")}
                    disabled={Boolean(busy)}
                  >
                    Approve
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No pending campaigns"
          text="All crowdfunding approval requests have been reviewed."
        />
      )}
    </>
  );
}
