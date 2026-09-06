import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List, Plus, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Alert,
  Badge,
  EmptyState,
  LoadingBlock,
  StatCard,
} from "../components/UI";
import { money, pct } from "../utils/format";

function img(c) {
  return (c?.name || "").toLowerCase().includes("cancer")
    ? "/assets/cancer.jpg"
    : "/assets/flood.jpg";
}
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
          list.map((c) => api(`/crowdfundings/${c.id}`)),
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
      </div>
      {campaigns.length ? (
        <div className="my-campaign-list">
          {campaigns.map((c) => (
            <article className="my-campaign" key={c.id}>
              <img src={img(c)} alt="" />
              <div className="my-campaign-body">
                <div className="campaign-title-row">
                  <h3>{c.name}</h3>
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
                <div className="card-button-row">
                  <button className="button muted" disabled>
                    Edit Details
                  </button>
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
