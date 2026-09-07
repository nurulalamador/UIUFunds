import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  LayoutGrid,
  List,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Alert,
  Badge,
  EmptyState,
  LoadingBlock,
  StatCard,
} from "../components/UI";
import { money } from "../utils/format";

export default function MyLoans() {
  const [requests, setRequests] = useState([]);
  const [borrowed, setBorrowed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  useEffect(() => {
    Promise.allSettled([
      api("/loans/mine/requests"),
      api("/loans/mine/borrowed"),
    ])
      .then(([a, b]) => {
        if (a.status === "fulfilled") setRequests(a.value.loans || []);
        if (b.status === "fulfilled") setBorrowed(b.value.provided_loans || []);
        if (a.status === "rejected" && b.status === "rejected")
          setError(a.reason.message);
      })
      .finally(() => setLoading(false));
  }, []);
  const stats = useMemo(
    () => ({
      count: requests.length,
      received: borrowed.reduce(
        (s, l) => s + Number(l.principal_amount || 0),
        0,
      ),
      cleared: borrowed.filter((l) => l.status === "completed").length,
      due: borrowed.reduce(
        (s, l) =>
          s +
          Math.max(
            0,
            Number(l.total_payable_amount || 0) - Number(l.paid_amount || 0),
          ),
        0,
      ),
    }),
    [requests, borrowed],
  );
  const removeRequest = async (loanId) => {
    if (
      !window.confirm(
        "Remove this loan request? Any pending offers will be withdrawn.",
      )
    ) {
      return;
    }

    setRemovingId(loanId);
    setError("");
    try {
      await api(`/loans/${loanId}`, { method: "DELETE" });
      setRequests((current) => current.filter((loan) => loan.id !== loanId));
    } catch (e) {
      setError(e.message);
    } finally {
      setRemovingId(null);
    }
  };
  if (loading) return <LoadingBlock text="Loading your loans..." />;
  return (
    <div className="content-container">
      <Alert>{error}</Alert>
      <div className="stats-grid four">
        <StatCard
          label="Total Loan Request"
          value={String(stats.count).padStart(2, "0")}
        />
        <StatCard label="Total Money Received" value={money(stats.received)} />
        <StatCard
          label="Total Loan Cleared"
          value={String(stats.cleared).padStart(2, "0")}
        />
        <StatCard label="Total Due" value={money(stats.due)} />
      </div>
      <div className="toolbar">
        <Link className="button primary" to="/app/loans/new">
          <Plus size={16} />
          Post New Loan Request
        </Link>
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
          <div className="view-switch">
            <button className="active">
              <LayoutGrid size={17} />
            </button>
            <button>
              <List size={17} />
            </button>
          </div>
        </div>
      </div>
      {requests.length || borrowed.length ? (
        <div className="loan-grid two">
          {requests.map((l) => (
            <div className="my-loan-card" key={`r-${l.id}`}>
              <div className="card-top">
                <Badge>
                  {Number(l.duration_months) <= 3 ? "Urgent" : "Normal"}
                </Badge>
                <div className="card-top-details">
                  <div className="card-top-details-title">Duration</div>
                  <div className="card-top-details-count">
                    {l.duration_months} Months
                  </div>
                </div>
              </div>
              <div className="loan-amount left">
                <div className="loan-amount-title">Amount Requested</div>
                <div className="loan-amount-count">{money(l.amount)}</div>
              </div>
              <div className="loan-info-grid">
                <span>Interest Allowed</span>
                <b>{l.interest_allowed ? "Yes" : "No"}</b>
                <span>Repayment Plan</span>
                <b>{l.installment} Installment</b>
              </div>
              <div className="offer-count-row">
                <span>
                  Total Offer <b>{l.pending_offer_count || 0}</b>
                </span>
                {Number(l.pending_offer_count) > 0 && (
                  <Link to={`/app/loans/${l.id}/offers`}>
                    See All Offers
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
              <div className="card-button-row">
                {/* <button className="button muted">
                  Edit Details
                </button> */}
                <button
                  className="button danger-soft"
                  onClick={() => removeRequest(l.id)}
                  disabled={removingId === l.id}
                >
                  {removingId === l.id ? "Removing..." : "Remove Loan Request"}
                </button>
              </div>
            </div>
          ))}
          {borrowed.map((l) => (
            <div className="my-loan-card" key={`b-${l.id}`}>
              <div className="card-top">
                <Badge>{l.status}</Badge>
                <div className="card-top-details">
                  <div className="card-top-details-title">Duration</div>
                  <div className="card-top-details-count">
                    {l.total_installments} Payments
                  </div>
                </div>
              </div>
              <div className="loan-amount left">
                <div className="loan-amount-title">Received Amount</div>
                <div className="loan-amount-count">
                  {money(l.principal_amount)}
                </div>
              </div>
              <div className="loan-info-grid">
                <span>Interest</span>
                <b>{l.interest_rate}%</b>
                <span>Repayment Plan</span>
                <b>{l.total_installments} Installment</b>
                <span>Provider</span>
                <b>{l.provider_name}</b>
              </div>
              <div className="loan-info-grid border">
                <span>Total Due</span>
                <b>
                  {money(
                    Math.max(
                      0,
                      Number(l.total_payable_amount) - Number(l.paid_amount),
                    ),
                  )}
                </b>
              </div>
              <div className="progress">
                <span
                  style={{
                    width: `${Math.min(100, (Number(l.paid_amount || 0) / Number(l.total_payable_amount || 1)) * 100)}%`,
                  }}
                />
              </div>
              <div className="card-button-row">
                <Link
                  className="button muted"
                  to={`/app/provided-loans/${l.id}`}
                >
                  View Details
                </Link>
                <Link
                  className="button primary-soft"
                  to={`/app/provided-loans/${l.id}`}
                >
                  Return Money
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No loans yet"
          text="Create your first loan request to start receiving offers."
          action={
            <Link className="button primary" to="/app/loans/new">
              <Plus size={16} />
              Post New Loan Request
            </Link>
          }
        />
      )}
    </div>
  );
}
