import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, MessagesSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { API_URL } from "../config";
import { EmptyState, LoadingBlock, StatCard } from "../components/UI";
import { money } from "../utils/format";
import TopbarAlt from "../components/TopbarAlt";

export default function PublicProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    api(`/profile/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);

  if (!data && !error) return <LoadingBlock text="Loading profile..." />;
  if (error) {
    return (
      <div className="content-container">
        <EmptyState
          title="Profile not found"
          text={error}
          action={
            <Link className="button primary" to="/">
              Go home
            </Link>
          }
        />
      </div>
    );
  }

  const { user, stats, campaigns = [] } = data;
  return (
    <>
      <TopbarAlt title="Profile" />
      <div className="content-container">
        <section className="profile-hero public-profile-hero">
          <img src="/assets/avatar.jpg" alt={`${user.name}'s avatar`} />
          <div className="profile-info">
            <div className="profile-name">{user.name}</div>
            <div className="profile-username">@{user.username}</div>
            <div className="profile-verify-container">
              <span className="verified-tag">
                {user.is_verified ? "UIU Verified" : "UIU Member"}
              </span>
              <span>
                <b>UIU ID:</b> {user.uiuid || "0112230170"}
              </span>
            </div>
          </div>
          <Link className="button primary profile-edit" to={`/app/messages?user=${user.id}`}>
            <MessagesSquare size={15} /> Send Message
          </Link>
        </section>
        <div className="stats-grid four">
          <StatCard label="Total Donations" value={money(stats.donations)} />
          <StatCard label="Total Loan Received" value={money(stats.received)} />
          <StatCard label="Total Loan Provided" value={money(stats.provided)} />
          <StatCard label="Overall Points" value={`★ ${data.points}`} />
        </div>
        <section className="profile-contribution">
          <div className="profile-contribution-title">
            Active Crowdfunding Campaigns
          </div>
          {campaigns.length ? (
            <div className="profile-campaign-grid">
              {campaigns.map((campaign) => (
                <div className="profile-campaign-box" key={campaign.id}>
                  {campaign.image_url ? (
                    <img src={`${API_URL}${campaign.image_url}`} alt="" />
                  ) : (
                    <div className="profile-campaign-placeholder" />
                  )}
                  <div className="profile-campaign-body">
                    <div className="profile-campaign-title">
                      {campaign.name}
                    </div>
                    <div className="profile-campaign-amount">
                      <span>{money(campaign.raised_amount)}</span> raised
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active campaigns"
              text="This member has not published an active campaign yet."
            />
          )}
        </section>
      </div>
    </>
  );
}
