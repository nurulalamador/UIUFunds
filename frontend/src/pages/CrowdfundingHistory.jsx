import { useEffect, useState } from "react";
import { LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Alert, EmptyState, LoadingBlock } from "../components/UI";
import { money, pct } from "../utils/format";

function historyImage(c, i) {
  const n = (c?.name || "").toLowerCase();
  if (n.includes("winter")) return "/assets/winter.jpg";
  if (n.includes("cancer")) return "/assets/cancer.jpg";
  return i % 2 ? "/assets/winter.jpg" : "/assets/history-flood.jpg";
}
export default function CrowdfundingHistory() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/crowdfundings")
      .then((d) =>
        setCampaigns(
          (d.crowdfundings || []).filter(
            (c) =>
              c.status === "completed" ||
              Number(c.raised_amount) >= Number(c.target_amount),
          ),
        ),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <LoadingBlock text="Loading crowdfunding history..." />;
  return (
    <div className="content-container">
      <Alert>{error}</Alert>
      <div className="toolbar">
        <div className="filter-row">
          <SlidersHorizontal size={17} />
          <span>Filter</span>
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
            <article className="campaign-card" key={c.id}>
              <img src={historyImage(c, i)} alt="" />
              <div className="campaign-body">
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="campaign-meta">
                  <span>Maintaining By</span>
                  <strong>{c.poster_name}</strong>
                </div>
                <div className="fund-row">
                  <div>
                    <small>Donation Received</small>
                    <b>{money(c.raised_amount)}</b>
                  </div>
                  <div className="right">
                    <small>Fund Goal</small>
                    <b>{money(c.target_amount)}</b>
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
            </article>
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
