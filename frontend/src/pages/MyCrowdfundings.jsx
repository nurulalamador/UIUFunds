import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, Plus, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { API_URL } from "../config";
import {
  Alert,
  Badge,
  EmptyState,
  LoadingBlock,
  StatCard,
} from "../components/UI";
import { money, pct } from "../utils/format";

export default function MyCrowdfundings() {
  const [campaigns, setCampaigns] = useState([]);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/crowdfundings/mine")
      .then(async (d) => {
        const list = d.crowdfundings || [];
        setCampaigns(list);
        const rs = await Promise.allSettled(
          list.map((c) => api(`/crowdfundings/mine/${c.id}`)),
        );
        const m = {};
        rs.forEach((r, i) => {
          if (r.status === "fulfilled") m[list[i].id] = r.value;
        });
        setDetails(m);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const stats = useMemo(() => {
    let received = 0,
      spent = 0,
      approved = 0;
    campaigns.forEach((c) => {
      if (c.approval_status === "approved") approved++;
      received += Number(c.raised_amount || 0);
      spent += (details[c.id]?.spend_items || []).reduce(
        (s, x) => s + Number(x.total_amount || 0),
        0,
      );
    });
    return { approved, received, spent };
  }, [campaigns, details]);
  if (loading) return <LoadingBlock text="Loading your crowdfundings..." />;
  return (
    <div className="content-container">
      <Alert>{error}</Alert>
      <div className="stats-grid three">
        <StatCard
          label="Approved Crowdfunding Post"
          value={String(stats.approved).padStart(2, "0")}
        />
        <StatCard
          label="Total Donation Received"
          value={money(stats.received)}
        />
        <StatCard label="Total Spent on Work" value={money(stats.spent)} />
      </div>
      <div className="toolbar">
        <Link className="button primary" to="/app/crowdfundings/new">
          <Plus size={16} />
          Post New Crowdfunding
        </Link>
        <div className="toolbar-right">
          <div className="filter-row">
            <div className="filter-row-title">
              <SlidersHorizontal size={18} />
              <span>Filter</span>
            </div>
            <select>
              <option>Recently Posted</option>
            </select>
          </div>
          {/* <div className="view-switch">
            <button className="active">
              <LayoutGrid size={17} />
            </button>
            <button>
              <List size={17} />
            </button>
          </div> */}
        </div>
      </div>
      {campaigns.length ? (
        <div className="my-campaign-list">
          {campaigns.map((c) => (
            <article className="my-campaign" key={c.id}>
              <img src={`${API_URL}${c.image_url}`} alt="" />
              <div className="campaign-body">
                <div className="campaign-title-row">
                  <div className="campaign-title">{c.name}</div>
                  <Badge
                    tone={
                      c.approval_status === "approved"
                        ? "green"
                        : c.approval_status === "rejected"
                          ? "red"
                          : "orange"
                    }
                  >
                    {c.approval_status}
                  </Badge>
                </div>
                <p>{c.description}</p>
                <div className="campaign-meta">
                  <span>Total Donor</span>
                  <strong>{details[c.id]?.donations?.length || 0}</strong>
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
                <div className="card-button-row">
                  <Link
                    className="button muted"
                    to={`/app/crowdfundings/${c.id}/edit`}
                  >
                    Edit Details
                  </Link>
                  {c.approval_status === "approved" ? (
                    <Link
                      className="button primary-soft"
                      to={`/app/crowdfundings/${c.id}/manage-spent`}
                    >
                      Manage Spent List
                    </Link>
                  ) : (
                    <button className="button primary-soft" disabled>
                      Await Approval
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No crowdfunding campaigns"
          text="Create your first campaign and submit it for admin approval."
          action={
            <Link className="button primary" to="/app/crowdfundings/new">
              <Plus size={16} />
              Post New Crowdfunding
            </Link>
          }
        />
      )}
    </div>
  );
}
