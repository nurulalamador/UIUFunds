import { Link, useParams } from "react-router-dom";
import { ArrowLeft, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { API_URL } from "../config";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { money, pct } from "../utils/format";
import TopbarAlt from "../components/TopbarAlt";

export default function CrowdfundingDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    api(`/crowdfundings/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (!data && !error) return <LoadingBlock text="Loading crowdfunding..." />;
  if (error) {
    return (
      <>
        <TopbarAlt title="Crowdfunding" />
        <div className="content-container">
          <EmptyState title="Crowdfunding not found" text={error} />
        </div>
      </>
    );
  }

  const { crowdfunding, donations = [] } = data;
  return (
    <>
      <TopbarAlt title="Crowdfunding Details" />
      <div className="content-container">
        <Link className="text-link crowdfunding-back-link" to="/app/crowdfundings">
          <ArrowLeft size={15} /> Back to crowdfundings
        </Link>
        <article className="crowdfunding-detail">
          {crowdfunding.image_url && (
            <img
              className="crowdfunding-detail-image"
              src={`${API_URL}${crowdfunding.image_url}`}
              alt={crowdfunding.name}
            />
          )}
          <div className="crowdfunding-detail-body">
            <h1>{crowdfunding.name}</h1>
            <p className="crowdfunding-detail-description">{crowdfunding.description}</p>
            <Link className="crowdfunding-detail-owner" to={`/app/profile/${crowdfunding.posted_by}`}>
              <UserRound size={16} />
              <span>Posted by {crowdfunding.poster_name || crowdfunding.poster_username}</span>
            </Link>
            <div className="fund-row">
              <div>
                <div className="fund-row-label">Donation Received</div>
                <div className="fund-row-amount">{money(crowdfunding.raised_amount)}</div>
              </div>
              <div className="right">
                <div className="fund-row-label">Fund Goal</div>
                <div className="fund-row-amount">{money(crowdfunding.target_amount)}</div>
              </div>
            </div>
            <div className="progress">
              <span style={{ width: `${pct(crowdfunding.raised_amount, crowdfunding.target_amount)}%` }} />
            </div>
          </div>
        </article>
        <section className="crowdfunding-donations">
          <h2>Recent Donations</h2>
          {donations.length ? donations.map((donation) => (
            <div className="crowdfunding-donation" key={donation.id}>
              <span>{donation.donor_name || donation.donor_username}</span>
              <strong>{money(donation.amount)}</strong>
            </div>
          )) : <Alert>No donations yet.</Alert>}
        </section>
      </div>
    </>
  );
}
