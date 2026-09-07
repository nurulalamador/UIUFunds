import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api, jsonBody } from "../api/client";
import { Alert, LoadingBlock, PageTitle } from "../components/UI";
import { useAuth } from "../contexts/AuthContext";
import { money, shortDate } from "../utils/format";
import TopbarAlt from "../components/TopbarAlt";

export default function ProvidedLoanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () =>
    api(`/loans/provided/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);
  const repay = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const d = await api(`/loans/provided/${id}/repay`, {
        method: "POST",
        body: jsonBody({ amount: Number(amount) }),
      });
      setSuccess(d.message);
      setAmount("");
      await load();
      await refreshUser();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!data && !error) return <LoadingBlock text="Loading loan details..." />;
  const l = data?.provided_loan;
  const remaining = l
    ? Math.max(0, Number(l.total_payable_amount) - Number(l.paid_amount))
    : 0;
  const isBorrower = l && user?.id === l.borrower_id;
  return (
    <>
      <Alert>{error}</Alert>
      <TopbarAlt title="Loan Details" />
      <div className="content-container">
        {l && (
          <div className="detail-grid">
            <section className="detail-card">
              <h2>
                {isBorrower ? "Loan from" : "Loan provided to"}{" "}
                {isBorrower ? l.provider_name : l.borrower_name}
              </h2>
              <div className="detail-pairs">
                <span>Principal</span>
                <b>{money(l.principal_amount)}</b>
                <span>Interest rate</span>
                <b>{l.interest_rate}%</b>
                <span>Total payable</span>
                <b>{money(l.total_payable_amount)}</b>
                <span>Paid</span>
                <b>{money(l.paid_amount)}</b>
                <span>Remaining</span>
                <b>{money(remaining)}</b>
                <span>Status</span>
                <b>{l.status}</b>
              </div>
              <div className="progress">
                <span
                  style={{
                    width: `${Math.min(100, (Number(l.paid_amount || 0) / Number(l.total_payable_amount || 1)) * 100)}%`,
                  }}
                />
              </div>
              {isBorrower && l.status === "active" && (
                <form onSubmit={repay} className="repay-form">
                  <label>
                    Repayment amount
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={remaining}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      required
                    />
                  </label>
                  <button className="button primary" disabled={busy}>
                    {busy ? "Paying..." : "Repay Loan"}
                  </button>
                </form>
              )}
              <Alert type="success">{success}</Alert>
            </section>
            <section className="detail-card">
              <h2>Repayment History</h2>
              {data.repayments?.length ? (
                <div className="simple-list">
                  {data.repayments.map((r) => (
                    <div className="simple-list-item" key={r.id}>
                      <div>
                        <div className="simple-list-item-title">Installment #{r.installment_no || "—"}</div>
                        <div className="simple-list-item-details">{shortDate(r.paid_at)}</div>
                      </div>
                      <div className="simple-list-item-amount">{money(r.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted-text">
                  No repayment has been recorded yet.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
