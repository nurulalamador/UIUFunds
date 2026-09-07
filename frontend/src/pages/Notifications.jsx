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
      <div className="notification-head">
        <button className="button primary" onClick={all}>
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
                <div className="notification-row-title">{n.title}</div>
                <div className="notification-row-details">{n.description}</div>
                <div className="notification-row-time">{timeAgo(n.created_at)}</div>
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
