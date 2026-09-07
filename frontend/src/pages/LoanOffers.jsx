import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock, PageTitle } from "../components/UI";
import TopbarAlt from "../components/TopbarAlt";

export default function LoanOffers() {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const load = () =>
    api(`/loans/${loanId}/offers`)
      .then((d) => setOffers(d.offers || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, [loanId]);
  const accept = async (id) => {
    if (
      !window.confirm(
        "Accept this offer? The loan will be funded immediately from the provider wallet.",
      )
    )
      return;
    setBusy(id);
    setError("");
    try {
      await api(`/loans/offers/${id}/accept`, { method: "PATCH" });
      navigate("/app/my-loans");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };
  if (loading) return <LoadingBlock text="Loading offers..." />;
  return (
    <>
      <TopbarAlt title="Provided Loan" />
      <Alert>{error}</Alert>
      <div className="content-container">
        {offers.length ? (
          <div className="offer-list">
            {offers.map((o, i) => (
              <div className="offer-list-row" key={o.id}>
                <div className="user offer-list-user">
                  <b className="offer-rank">{i + 1}.</b>
                  <img src="/assets/avatar.jpg" alt="" />
                  <div className="user-details">
                    <div className="user-name">{o.offeror_name}</div>
                    <Link className="user-profile" to={`/app/profile/${o.offeror_id}`}>
                      View Profile
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
                <div className="offer-list-right">
                  <div className="offer-meta">
                    <div className="offer-meta-title">Interest Rate</div>
                    <div className="offer-meta-count">{o.interest_rate}%</div>
                  </div>
                  <div className="offer-meta">
                    <div className="offer-meta-title">Proposed Duration</div>
                    <div className="offer-meta-count">
                      {o.asked_duration_months}%
                    </div>
                  </div>
                  <Link to={`/app/messages?user=${o.offeror_id}`} className="button muted">Send Message</Link>
                  <button
                    className="button primary"
                    disabled={busy === o.id || o.status !== "pending"}
                    onClick={() => accept(o.id)}
                  >
                    {o.status === "pending"
                      ? busy === o.id
                        ? "Accepting..."
                        : "Accept"
                      : o.status}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No offers yet"
            text="Loan offers will be shown here when another user sends one."
          />
        )}
      </div>
    </>
  );
}
