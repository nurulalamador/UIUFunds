import { useEffect, useState } from "react";
import { LayoutGrid, List, Plus, SlidersHorizontal } from "lucide-react";
import { api, jsonBody } from "../api/client";
import Modal from "../components/Modal";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { useAuth } from "../contexts/AuthContext";
import { money, shortDate } from "../utils/format";

export default function Transactions() {
  const { refreshUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () =>
    api("/transactions?limit=100")
      .then((d) => setItems(d.transactions || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const topup = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const d = await api("/transactions/demo-topup", {
        method: "POST",
        body: jsonBody({ amount: Number(amount) }),
      });
      setSuccess(d.message);
      setAmount("");
      await refreshUser();
      await load();
      setTimeout(() => {
        setOpen(false);
        setSuccess("");
      }, 700);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <LoadingBlock text="Loading transactions..." />;
  return (
    <div className="content-container">
      <Alert>{error && !open ? error : ""}</Alert>
      <div className="toolbar">
        <button
          className="button primary"
          onClick={() => {
            setOpen(true);
            setError("");
          }}
        >
          <Plus size={16} />
          Add Balance
        </button>
        <div className="toolbar-right">
          <div className="filter-row">
            <SlidersHorizontal size={17} />
            <span>Filter</span>
            <select>
              <option>Recently Posted</option>
            </select>
          </div>
          <div className="view-switch">
            <button className="active">
              <List size={17} />
            </button>
            <button>
              <LayoutGrid size={17} />
            </button>
          </div>
        </div>
      </div>
      {items.length ? (
        <div className="transactions-list">
          {items.map((t) => (
            <div className="transaction-row" key={t.id}>
              <div>
                <h3>{t.title}</h3>
                <span>
                  {shortDate(t.created_at)} •{" "}
                  {String(t.transaction_type || "").replaceAll("_", " ")}
                </span>
              </div>
              <strong className={t.direction === "credit" ? "credit" : "debit"}>
                {t.direction === "credit" ? "+" : "-"}
                {money(t.amount)}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No transactions yet"
          text="Wallet activity, loans and crowdfunding transactions will appear here."
        />
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add Balance for Local Testing"
      >
        <form className="modal-form" onSubmit={topup}>
          <p className="field-help">
            This uses the backend demo top-up endpoint. Keep
            ENABLE_DEMO_TOPUP=true only for local development.
          </p>
          <label>
            Amount
            <input
              type="number"
              min="1"
              max="1000000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <Alert>{error}</Alert>
          <Alert type="success">{success}</Alert>
          <button className="button primary full" disabled={busy}>
            {busy ? "Adding..." : "Add Balance"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
