import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { money, shortDate } from "../utils/format";

export default function AdminManagement() {
  const [params, setParams] = useSearchParams();
  const initialTab = params.get("tab");
  const [section, setSection] = useState(
    ["crowdfundings", "users", "loans"].includes(initialTab)
      ? initialTab
      : "users",
  );
  const [status, setStatus] = useState("pending");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const path =
        section === "users"
          ? `/admin/users?status=${status}`
          : section === "crowdfundings"
            ? `/admin/crowdfundings?status=${status === "pending" ? "pending" : "active"}`
            : "/admin/loans";
      const data = await api(path);
      setItems(
        section === "users"
          ? data.users || []
          : section === "crowdfundings"
            ? data.crowdfundings || []
            : data.loans || [],
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [section, status]);
  const switchSection = (next) => {
    setSection(next);
    setStatus("pending");
    setParams({ tab: next });
  };
  const act = async (item, action) => {
    setBusy(`${action}-${item.id}`);
    setError("");
    try {
      const path =
        section === "users"
          ? `/admin/users/${item.id}/${action}`
          : `/admin/crowdfundings/${item.id}`;
      await api(path, { method: action === "approve" ? "PATCH" : "DELETE" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <LoadingBlock text="Loading management data..." />;
  return (
    <div className="content-container admin-page">
      <div className="admin-tabs primary-tabs">
        <button
          className={section === "crowdfundings" ? "active" : ""}
          onClick={() => switchSection("crowdfundings")}
        >
          Crowdfundings
        </button>
        <button
          className={section === "users" ? "active" : ""}
          onClick={() => switchSection("users")}
        >
          Users
        </button>
        <button
          className={section === "loans" ? "active" : ""}
          onClick={() => switchSection("loans")}
        >
          Loans
        </button>
      </div>
      {section !== "loans" && (
        <div className="admin-tabs secondary-tabs">
          {(section === "users"
            ? [
                ["pending", "Pending users"],
                ["approved", "Approved users"],
              ]
            : [
                ["pending", "Pending campaigns"],
                ["active", "Ongoing campaigns"],
              ]
          ).map(([value, label]) => (
            <button
              key={value}
              className={status === value ? "active" : ""}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <Alert>{error}</Alert>
      {items.length ? (
        <div className="moderation-list">
          {items.map((item) => (
            <article className="moderation-item" key={item.id}>
              <div>
                <div className="moderation-meta">
                  <strong>
                    {section === "users"
                      ? item.name
                      : section === "crowdfundings"
                        ? item.name
                        : `Loan request #${item.id}`}
                  </strong>
                  <span>
                    {section === "users"
                      ? `@${item.username}`
                      : section === "crowdfundings"
                        ? `by ${item.poster_name}`
                        : `by ${item.requester_name} (@${item.requester_username})`}
                  </span>
                  <span>{shortDate(item.created_at)}</span>
                </div>
                {section === "users" ? (
                  <p>
                    {item.email} · {item.uiuid}
                  </p>
                ) : section === "crowdfundings" ? (
                  <>
                    <p>{item.description}</p>
                    <strong>
                      {money(item.raised_amount)} / {money(item.target_amount)}
                    </strong>
                  </>
                ) : (
                  <>
                    <p>{item.description}</p>
                    <strong>
                      {money(item.amount)} · {item.duration_months} months ·{" "}
                      {item.status}
                    </strong>
                  </>
                )}
              </div>
              <div className="moderation-actions">
                {((section === "users" && status === "pending") ||
                  (section === "crowdfundings" && status === "pending")) && (
                  <button
                    className="button primary"
                    disabled={busy === `approve-${item.id}`}
                    onClick={() => act(item, "approve")}
                  >
                    <Check size={15} /> Approve
                  </button>
                )}
                {(section === "users" ||
                  (section === "crowdfundings" && status === "active")) && (
                  <button
                    className="button danger-soft"
                    disabled={busy === `delete-${item.id}`}
                    onClick={() => act(item, "delete")}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            section === "users"
              ? "No users in this view"
              : section === "crowdfundings"
                ? "No campaigns in this view"
                : "No loan requests"
          }
          text="Everything is up to date."
        />
      )}
    </div>
  );
}
