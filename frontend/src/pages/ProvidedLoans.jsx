import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { money } from "../utils/format";

export default function ProvidedLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
          <SlidersHorizontal size={17} />
          <span>Filter</span>
          <select>
            <option>Time Remaining</option>
          </select>
        </div>
      </div>
      {loans.length ? (
        <div className="loan-grid two">
          {loans.map((l) => (
            <article className="provided-card" key={l.id}>
              <div className="provided-head">
                <div className="loan-user">
                  <img src="/assets/avatar.jpg" alt="" />
                  <div>
                    <span>Provided To</span>
                    <strong>{l.borrower_name}</strong>
                    <small>View Profile →</small>
                  </div>
                </div>
                <div className="provided-total">
                  <small>Total Amount</small>
                  <strong>{money(l.principal_amount)}</strong>
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
                <strong>
                  {l.completed_installments}/{l.total_installments}
                </strong>
                <span>Installment Completed</span>
                <b>
                  Total Due (with interest){" "}
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
