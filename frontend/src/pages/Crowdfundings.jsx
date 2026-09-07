import { useEffect, useState } from "react";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { api, jsonBody } from "../api/client";
import { API_URL } from "../config";
import Modal from "../components/Modal";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { money, pct } from "../utils/format";
import { useAuth } from "../contexts/AuthContext";

export default function Crowdfundings() {
  const { refreshUser } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () =>
    api("/crowdfundings")
      .then((d) => setCampaigns(d.crowdfundings || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const donate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const d = await api(`/crowdfundings/${selected.id}/donate`, {
        method: "POST",
        body: jsonBody({ amount: Number(amount) }),
      });
      setSuccess(d.message);
      setAmount("");
      await refreshUser();
      await load();
      setTimeout(() => {
        setSelected(null);
        setSuccess("");
      }, 700);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (loading) return <LoadingBlock text="Loading crowdfundings..." />;
  return (
    <div className="content-container">
      <Alert>{error && !selected ? error : ""}</Alert>
      <div className="toolbar">
        <div className="filter-row">
          <div className="filter-row-title">
            <SlidersHorizontal size={18} />
            <span>Filter</span>
          </div>
          <select>
            <option>Recently Posted</option>
          </select>
        </div>
        <div className="view-switch">
          <button className="active">
            <LayoutGrid size={17} />
          </button>
          <button>
            <List size={17} />
          </button>
        </div>
      </div>
      {campaigns.length ? (
        <div className="campaign-list grid">
          {campaigns.map((c, i) => (
            <div className="campaign-card" key={c.id}>
              <img src={`${API_URL}${c.image_url}`} alt={c.name} />
              <div className="campaign-body">
                <div className="campaign-title-row">
                  <div className="campaign-title">{c.name}</div>
                  <button
                    className="button primary small"
                    onClick={() => {
                      setSelected(c);
                      setError("");
                      setSuccess("");
                    }}
                  >
                    Donate
                  </button>
                </div>
                <p>{c.description}</p>
                <div className="campaign-meta">
                  <div className="compaign-meta-label">Maintaining By</div>
                  <div className="compaign-meta-info">{c.poster_name}</div>
                </div>
                <div className="fund-row">
                  <div>
                    <div className="fund-row-label">Donation Received</div>
                    <div className="fund-row-amount">
                      {money(c.raised_amount)}
                    </div>
                  </div>
                  <div className="right">
                    <div className="fund-row-label">Fund Goal</div>
                    <div className="fund-row-amount">
                      {money(c.target_amount)}
                    </div>
                  </div>
                </div>
                <div className="progress">
                  <span
                    style={{
                      width: `${pct(c.raised_amount, c.target_amount)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No active crowdfunding"
          text="Approved crowdfunding campaigns will appear here."
        />
      )}
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Donate to ${selected.name}` : "Donate"}
      >
        <form className="modal-form" onSubmit={donate}>
          <div className="donation-summary">
            <img src={selected ? `${API_URL}${selected?.image_url}` : ""} alt={selected?.name || ""} />
            <div>
              <strong>{selected?.name}</strong>
              <span>
                {money(selected?.raised_amount)} raised of{" "}
                {money(selected?.target_amount)}
              </span>
            </div>
          </div>
          <label>
            Donation Amount
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </label>
          <p className="field-help">
            The donation will be transferred from your UIUFund wallet balance.
          </p>
          <Alert>{error}</Alert>
          <Alert type="success">{success}</Alert>
          <button className="button primary full" disabled={busy}>
            {busy ? "Processing..." : "Donate Now"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
