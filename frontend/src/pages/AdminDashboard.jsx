import { useEffect, useState } from "react";
import { ArrowRight, Flag, HandCoins, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Alert, LoadingBlock, StatCard } from "../components/UI";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ pendingUsers: 0, reports: 0, pendingCrowdfundings: 0, ongoingCrowdfundings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api("/admin/users?status=pending"),
      api("/admin/community/posts?tab=reported"),
      api("/admin/crowdfundings?status=pending"),
      api("/admin/crowdfundings?status=active"),
    ])
      .then(([users, reports, pending, ongoing]) => setCounts({
        pendingUsers: users.users?.length || 0,
        reports: reports.posts?.length || 0,
        pendingCrowdfundings: pending.crowdfundings?.length || 0,
        ongoingCrowdfundings: ongoing.crowdfundings?.length || 0,
      }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock text="Loading admin dashboard..." />;

  return (
    <div className="content-container admin-portal">
      <div className="admin-hero">
        <div>
          <span className="eyebrow">ADMIN PORTAL</span>
          <h1>Overview</h1>
          <p>Keep the UIUFunds community, users, and campaigns healthy.</p>
        </div>
        <ShieldCheck size={54} strokeWidth={1.4} />
      </div>
      <Alert>{error}</Alert>
      <div className="stats-grid four">
        <StatCard label="Pending Users" value={counts.pendingUsers} />
        <StatCard label="Reported Posts" value={counts.reports} tone="red" />
        <StatCard label="Pending Crowdfundings" value={counts.pendingCrowdfundings} />
        <StatCard label="Ongoing Crowdfundings" value={counts.ongoingCrowdfundings} />
      </div>
      <div className="admin-quick-grid">
        <Link className="admin-quick-link" to="/app/admin/community">
          <Flag size={22} /><span><strong>Review community</strong><small>{counts.reports} reported post(s) need attention</small></span><ArrowRight size={18} />
        </Link>
        <Link className="admin-quick-link" to="/app/admin/management">
          <UsersRound size={22} /><span><strong>Manage users</strong><small>{counts.pendingUsers} account(s) waiting for approval</small></span><ArrowRight size={18} />
        </Link>
        <Link className="admin-quick-link" to="/app/admin/management?tab=crowdfundings">
          <HandCoins size={22} /><span><strong>Review campaigns</strong><small>{counts.pendingCrowdfundings} campaign(s) waiting for approval</small></span><ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
