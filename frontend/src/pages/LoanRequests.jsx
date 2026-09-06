import { useEffect, useState } from "react";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { api, jsonBody } from "../api/client";
import Modal from "../components/Modal";
import { Alert, Badge, EmptyState, LoadingBlock } from "../components/UI";
import { useAuth } from "../contexts/AuthContext";
import { money } from "../utils/format";
import { BiRightArrow, BiRightArrowAlt } from "react-icons/bi";

function LoanCard({ loan, onOffer, me }) {
  return (
    <article className="loan-card">
      <div className="user loan-user">
        <img src="/assets/avatar.jpg" alt="" />
        <div className="user-details">
          <div className="user-name">{loan.requester_name}</div>
          <div className="user-profile">
            View Profile
            <BiRightArrowAlt size={14} />
          </div>
        </div>
        <Badge tone={loan.priority == "urgent" ? "orange" : "soft"}>
          {loan.priority == "urgent" ? "Urgent" : "Normal"}
        </Badge>
      </div>
      <div className="loan-amount">
        <div className="loan-amount-title">Amount Requested</div>
        <div className="loan-amount-count">{money(loan.amount)}</div>
      </div>
      <div className="loan-info-grid">
        <span>Duration</span>
        <b>{loan.duration_months} Months</b>
        <span>Interest Allowed</span>
        <b>{loan.interest_allowed ? "Yes" : "No"}</b>
        <span>Repayment Plan</span>
        <b>{loan.installment} Installment</b>
      </div>
      <p className="loan-card-description">{loan.description}</p>
      <button
        className="button primary full"
        onClick={() => onOffer(loan)}
        disabled={me?.id === loan.requester_id}
      >
        {me?.id === loan.requester_id ? "Your Loan Request" : "Send Loan Offer"}
      </button>
    </article>
  );
}

export default function LoanRequests() {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    interest_rate: 0,
    asked_duration_months: 1,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () =>
    api("/loans?status=open")
      .then((d) => setLoans(d.loans || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const openOffer = (loan) => {
    setSelected(loan);
    setError("");
    setSuccess("");
    setForm({
      interest_rate: loan.interest_allowed ? 10 : 0,
      asked_duration_months: Number(loan.duration_months) || 1,
    });
  };
  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/loans/${selected.id}/offers`, {
        method: "POST",
        body: jsonBody({
          interest_rate: Number(form.interest_rate),
          asked_duration_months: Number(form.asked_duration_months),
        }),
      });
      setSuccess("Loan offer sent successfully.");
      setTimeout(() => {
        setSelected(null);
      }, 300);
      setTimeout(() => setSuccess(""), 3500);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock text="Loading loan requests..." />;

  return (
    <div className="content-container">
      {success && (
        <div className="loan-toast" role="status">
          {success}
        </div>
      )}
      <Alert>{error && !selected ? error : ""}</Alert>
      <div className="toolbar">
        <div className="filter-row">
          <div className="filter-row-title">
            <SlidersHorizontal size={18} />
            <span>Filter</span>
          </div>
          <select>
            <option>Recently Posted</option>
            <option>Amount: Low to High</option>
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
      {loans.length ? (
        <div className="loan-grid">
          {loans.map((l) => (
            <LoanCard key={l.id} loan={l} onOffer={openOffer} me={user} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No open loan requests"
          text="New loan requests will appear here automatically; they do not require admin approval."
        />
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => {
          setSelected(null);
          setError(null);
        }}
        title="Send Loan Offer"
      >
        {selected && (
          <form onSubmit={send} className="offer-modal-body">
            <div className="user offer-user">
              <img src="/assets/avatar.jpg" alt="" />
              <div className="user-details">
                <div className="user-name">{selected.requester_name}</div>
                <div className="user-profile">
                  View Profile
                  <BiRightArrowAlt size={14} />
                </div>
              </div>
              <Badge tone={selected.priority == "urgent" ? "orange" : "soft"}>
                {selected.priority == "urgent" ? "Urgent" : "Normal"}
              </Badge>
            </div>
            <div className="offer-summary">
              <div className="offer-summary-left">
                <div className="offer-summary-amount-title">Amount Requested</div>
                <div className="offer-summary-amount">{money(selected.amount)}</div>
              </div>
              <div className="offer-summary-table">
                <div>Duration</div>
                <b>{selected.duration_months} Months</b>
                <div>Interest Allowed</div>
                <b>{selected.interest_allowed ? "Yes" : "No"}</b>
                <div>Repayment Plan</div>
                <b>{selected.installment} Installment</b>
              </div>
            </div>
            <div className="offer-fields">
              <label>
                Interest Rate (%)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!selected.interest_allowed}
                  value={form.interest_rate}
                  onChange={(e) =>
                    setForm({ ...form, interest_rate: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Proposed Duration (months)
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.asked_duration_months}
                  onChange={(e) =>
                    setForm({ ...form, asked_duration_months: e.target.value })
                  }
                  required
                />
              </label>
            </div>
            <Alert>{error}</Alert>
            <button className="button primary full" disabled={busy}>
              {busy ? "Sending..." : "Send Loan Offer"}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
