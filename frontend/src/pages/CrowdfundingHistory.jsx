import { useEffect, useState } from "react";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { API_URL } from "../config";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { money, pct } from "../utils/format";

export default function CrowdfundingHistory() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/crowdfundings/history")
      .then((d) => setCampaigns(d.crowdfundings || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingBlock text="Loading crowdfunding history..." />;
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
                <Link
                  className="button primary full"
                  to={`/app/crowdfundings/${c.id}/spent`}
                >
                  View Spent History
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No completed crowdfunding campaigns"
          text="Completed approved campaigns will be listed here."
        />
      )}
    </div>
  );
}
