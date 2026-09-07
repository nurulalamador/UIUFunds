import { useEffect, useMemo, useState } from "react";
import { AlignRight, ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { API_URL } from "../config";
import { EmptyState, LoadingBlock, StatCard } from "../components/UI";
import { useAuth } from "../contexts/AuthContext";
import { money, pct } from "../utils/format";
import AdminDashboard from "./AdminDashboard";

function campaignImage(c, index) {
  if (c?.image_url) return `${API_URL}${c.image_url}`;
  const name = (c?.name || "").toLowerCase();
  if (name.includes("cancer")) return "/assets/cancer.jpg";
  if (name.includes("winter")) return "/assets/winter.jpg";
  return index % 2 ? "/assets/cancer.jpg" : "/assets/flood.jpg";
}

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === "admin") return <AdminDashboard />;
  const [data, setData] = useState({
    transactions: [],
    loans: [],
    borrowed: [],
    provided: [],
    crowdfundings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api("/transactions?limit=100"),
      api("/loans/mine/requests"),
      api("/loans/mine/borrowed"),
      api("/loans/mine/provided"),
      api("/crowdfundings"),
    ])
      .then(([tx, loans, borrowed, provided, crowd]) => {
        setData({
          transactions:
            tx.status === "fulfilled" ? tx.value.transactions || [] : [],
          loans: loans.status === "fulfilled" ? loans.value.loans || [] : [],
          borrowed:
            borrowed.status === "fulfilled"
              ? borrowed.value.provided_loans || []
              : [],
          provided:
            provided.status === "fulfilled"
              ? provided.value.provided_loans || []
              : [],
          crowdfundings:
            crowd.status === "fulfilled" ? crowd.value.crowdfundings || [] : [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const donation = data.transactions
      .filter((t) => t.transaction_type === "crowdfunding_donation")
      .reduce((a, t) => a + Number(t.amount || 0), 0);
    const received = data.borrowed.reduce(
      (a, l) => a + Number(l.principal_amount || 0),
      0,
    );
    const provided = data.provided.reduce(
      (a, l) => a + Number(l.principal_amount || 0),
      0,
    );
    return { donation, received, provided };
  }, [data]);

  if (loading) return <LoadingBlock text="Loading dashboard..." />;

  return (
    <div className="content-container">
      <div className="dashboard-welcome-grid">
        <div className="welcome-card">
          <div className="welcome-card-label">Welcome Back</div>
          <div className="welcome-card-name">
            {user?.name || "UIU Student"}!
          </div>
        </div>
        <div className="balance-card">
          <div>
            <div className="balance-card-label">Current Balance</div>
            <div className="balance-card-amount">{money(user?.balance)}</div>
          </div>
          <Link to="/app/transactions" className="button primary">
            Add Balance
          </Link>
        </div>
      </div>
      <div className="stats-grid four">
        <StatCard label="Total Donations" value={money(stats.donation)} />
        <StatCard label="Total Loan Received" value={money(stats.received)} />
        <StatCard label="Total Loan Provided" value={money(stats.provided)} />
        <StatCard
          label="Overall Points"
          value={`★ ${Math.round((stats.donation + stats.provided) / 200 || 0)}`}
        />
      </div>

      <div className="dashboard-columns">
        <div>
          <div className="dashboard-section-row">
            <div className="dashboard-section-title">Current Crowdfundings</div>
            <Link to="/app/crowdfundings">
              See All Crowdfundings <ArrowRight size={18} />
            </Link>
          </div>
          {data.crowdfundings.length ? (
            <div className="campaign-list compact">
              {data.crowdfundings.slice(0, 2).map((c, i) => (
                <article className="campaign-card" key={c.id}>
                  <img src={campaignImage(c, i)} alt="" />
                  <div className="campaign-body">
                    <div className="campaign-title-row">
                      <div className="campaign-title">{c.name}</div>
                      <button
                        className="button primary small"
                        onClick={() => {
                          setSelected(c);
                          setError("");
                          setSuccess("");
                        }}
                      >
                        Donate
                      </button>
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
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No active crowdfunding"
              text="Approved crowdfunding campaigns will appear here."
              action={
                <Link className="button primary" to="/app/crowdfundings/new">
                  <Plus size={16} /> Create Campaign
                </Link>
              }
            />
          )}
        </div>
        <div className="leaderboard">
          <div className="leaderboard-head">
            <div className="leaderboard-title">Leaderboard</div>
            <span className="tiny-tag">This Month</span>
          </div>
          {[
            ["Nahin Intesher", 350],
            ["Moqbul Alam", 230],
            ["Nurul Alam Ador", 160],
            ["Ali Arman Joyed", 150],
            ["Shadhin Nandi", 150],
          ].map(([name, points], i) => (
            <div className="leader-row" key={name}>
              <div className="user">
                <b>{i + 1}.</b>
                <img src="/assets/avatar.jpg" alt="" />
                <div className="user-details">
                  <div className="user-name">{name}</div>
                  <Link className="user-profile" to={`/app/profile/1}`}>
                    View Profile
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="leader-row-points">★ {points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
