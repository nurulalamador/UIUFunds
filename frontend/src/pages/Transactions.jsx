import { useEffect, useState } from "react";
import { Banknote, LayoutGrid, List, Plus, SlidersHorizontal, Wallet } from "lucide-react";
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
  const [action, setAction] = useState("topup");
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
  const submitTransaction = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const isTopup = action === "topup";
      const d = await api(isTopup ? "/transactions/demo-topup" : "/transactions/cash-out", {
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
        <div className="button-group">
          <button className="button primary" onClick={() => {
            setAction("topup");
            setOpen(true);
            setError("");
          }}>
            <Plus size={16} />
            Add Balance
          </button>
          <button className="button primary-soft" onClick={() => {
            setAction("cashout");
            setOpen(true);
            setError("");
          }}>
            <Wallet size={16} />
            Cash Out
          </button>
        </div>
        <div className="toolbar-right">
          <div className="filter-row">
            <div className="filter-row-title">
              <SlidersHorizontal size={17} />
              <span>Filter</span>
            </div>
            <select>
              <option>Recently Posted</option>
            </select>
          </div>
          {/* <div className="view-switch">
            <button className="active">
              <List size={17} />
            </button>
            <button>
              <LayoutGrid size={17} />
            </button>
          </div> */}
        </div>
      </div>
      {items.length ? (
        <div className="transactions-list">
          {items.map((t) => (
            <div className="transaction-row" key={t.id}>
              <div>
                <div className="transaction-row-title">{t.title}</div>
                <div className="transaction-row-message">
                  {shortDate(t.created_at)} •{" "}
                  {String(t.transaction_type || "").replaceAll("_", " ")}
                </div>
              </div>
              <div
                className={`transaction-row-amount ${t.direction === "credit" ? "credit" : "debit"}`}
              >
                {t.direction === "credit" ? "+" : "-"}
                {money(t.amount)}
              </div>
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
        title={action === "topup" ? "Add Balance" : "Cash Out"}
      >
        <form className="modal-form" onSubmit={submitTransaction}>
          <label>
            {action === "topup" ? "Payment Method" : "Cash Out Method"}
            <div className="radio-container">
              <input type="radio" name="payment-method" checked /> bKash
            </div>
            <div className="radio-container">
              <input type="radio" name="payment-method" /> SSLecomerz
            </div>
          </label>
          <label>
            Amount
            <input
              type="number"
              min="1"
              max="1000000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </label>
          <Alert>{error}</Alert>
          <Alert type="success">{success}</Alert>
          <button className="button primary full" disabled={busy}>
            {busy
              ? action === "topup" ? "Adding..." : "Cashing out..."
              : action === "topup" ? "Add Balance" : "Cash Out"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
