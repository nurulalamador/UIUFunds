import { useEffect, useState } from "react";
import { ArrowRight, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { money } from "../utils/format";

export default function ProvidedLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("grid");
  useEffect(() => {
    api("/loans/mine/provided")
      .then((d) => setLoans(d.provided_loans || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingBlock text="Loading provided loans..." />;
  return (
    <div className="content-container">
      <Alert>{error}</Alert>
      <div className="toolbar">
        <div className="filter-row">
          <div className="filter-row-title">
            <SlidersHorizontal size={18} />
            <span>Filter</span>
          </div>
          <select>
            <option>Time Remaining</option>
          </select>
        </div>

        <div className="view-switch">
          <button
            type="button"
            className={view === "grid" ? "active" : ""}
            onClick={() => setView("grid")}
          >
            <LayoutGrid size={17} />
          </button>
          <button
            type="button"
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      {loans.length ? (
        <div className={view === "list" ? "loan-list" : "loan-grid two"}>
          {loans.map((l) => (
            <article className="provided-card" key={l.id}>
              <div className="provided-head">
                <div className="user">
                  <img src="/assets/avatar.jpg" alt="" />
                  <div className="user-details">
                    <div className="user-name">{l.borrower_name}</div>
                    <Link
                      className="user-profile"
                      to={`/app/profile/${l.borrower_id}`}
                    >
                      View Profile
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
                <div className="provided-total">
                  <div className="provided-total-title">Total Amount</div>
                  <div className="provided-total-amount">
                    {money(l.principal_amount)}
                  </div>
                </div>
              </div>
              <div className="loan-info-grid">
                <span>Duration</span>
                <b>{l.total_installments} Installment</b>
                <span>Interest Allowed</span>
                <b>{Number(l.interest_rate) > 0 ? "Yes" : "No"}</b>
                <span>Repayment Plan</span>
                <b>{l.total_installments} Installment</b>
                <span>Accepted Interest</span>
                <b>{l.interest_rate}%</b>
              </div>
              <div className="provided-progress">
                <div className="provided-progress-amount">
                  {l.completed_installments}/{l.total_installments}
                </div>
                <div>Installment Completed</div>
              </div>

              <div className="loan-info-grid border">
                <span>Total Due (with interest)</span>
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
              <Link
                className="button primary full"
                to={`/app/provided-loans/${l.id}`}
              >
                View Loan Details
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No provided loans"
          text="Loans you fund for other users will appear here."
        />
      )}
    </div>
  );
}
