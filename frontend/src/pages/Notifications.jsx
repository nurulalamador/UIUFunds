import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { timeAgo } from "../utils/format";

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () =>
    api("/notifications")
      .then((d) => setItems(d.notifications || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const read = async (n) => {
    try {
      if (!n.is_read)
        await api(`/notifications/${n.id}/read`, { method: "PATCH" });
      if (n.onclick) {
        let path = n.onclick
          .replace(/^\/loans\/(\d+)\/offers$/, "/app/loans/$1/offers")
          .replace(/^\/provided-loans\//, "/app/provided-loans/")
          .replace(/^\/crowdfundings\/\d+$/, "/app/my-crowdfundings");
        navigate(path);
      }
    } catch (e) {
      setError(e.message);
    }
  };
  const all = async () => {
    try {
      await api("/notifications/read-all", { method: "PATCH" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  if (loading) return <LoadingBlock text="Loading notifications..." />;
  return (
    <div className="content-container">
      <div className="page-title-row">
        <button className="button muted" onClick={all}>
          <CheckCheck size={16} />
          Mark all read
        </button>
      </div>
      <Alert>{error}</Alert>
      {items.length ? (
        <div className="notification-list">
          {items.map((n) => (
            <button
              className={`notification-row ${n.is_read ? "read" : "unread"}`}
              key={n.id}
              onClick={() => read(n)}
            >
              <span className="notification-icon">
                <Bell size={18} />
              </span>
              <div>
                <strong>{n.title}</strong>
                <p>{n.description}</p>
                <small>{timeAgo(n.created_at)}</small>
              </div>
              {!n.is_read && <i />}
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notifications"
          text="Loan offers, repayments and crowdfunding updates will appear here."
        />
      )}
    </div>
  );
}
