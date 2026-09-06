import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, jsonBody } from "../api/client";
import { Alert, PageTitle } from "../components/UI";
import TopbarAlt from "../components/TopbarAlt";

export default function NewLoan() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    description: "",
    amount: "",
    duration_months: 1,
    installment: 1,
    interest_allowed: false,
    priority: "urgent",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const description = form.description.trim();

      await api("/loans", {
        method: "POST",
        body: jsonBody({
          amount: Number(form.amount),
          duration_months: Number(form.duration_months),
          description,
          interest_allowed: form.interest_allowed,
          installment: Number(form.installment),
        }),
      });
      navigate("/app/my-loans");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <TopbarAlt title="Post New Loan Request" />
      <div className="content-container">
        <form className="center-form-card" onSubmit={submit}>
          <h2>Enter Details for Loan Request</h2>
          <Alert>{error}</Alert>
          <label>
            Description
            <textarea
              placeholder="Please Enter Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </label>
          <div className="two-col-fields">
            <label>
              Total Amount
              <input
                type="number"
                min="1"
                placeholder="Please Enter Total Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </label>
            <label>
              Duration (Months)
              <input
                type="number"
                min="1"
                value={form.duration_months}
                onChange={(e) =>
                  setForm({ ...form, duration_months: e.target.value })
                }
                required
              />
            </label>
          </div>
          <div className="two-col-fields">
            <label>
              Repayment Plan
              <select
                value={form.installment}
                onChange={(e) =>
                  setForm({ ...form, installment: e.target.value })
                }
              >
                <option value="1">One-Time</option>
                {[2, 3, 4, 5, 6, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} Installment
                  </option>
                ))}
              </select>
            </label>
            <label>
              Interest Allowed
              <select
                value={String(form.interest_allowed)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    interest_allowed: e.target.value === "true",
                  })
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </label>
          </div>
          <label>
            Priority
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="urgent">Urgent</option>
              <option value="normal">Normal</option>
            </select>
          </label>
          <button className="button primary full" disabled={busy}>
            {busy ? "Posting..." : "Post Loan Request"}
          </button>
        </form>
      </div>
    </>
  );
}
