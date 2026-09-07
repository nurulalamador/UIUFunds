import { useEffect, useMemo, useState } from "react";
import { Edit3 } from "lucide-react";
import { api } from "../api/client";
import Modal from "../components/Modal";
import { Alert, LoadingBlock, StatCard } from "../components/UI";
import { useAuth } from "../contexts/AuthContext";
import { money } from "../utils/format";
import { API_URL } from "../config";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    donations: 0,
    received: 0,
    provided: 0,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", email: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.allSettled([
      api("/profile/me"),
      api("/transactions?limit=100"),
      api("/loans/mine/borrowed"),
      api("/loans/mine/provided"),
      api("/crowdfundings/mine"),
    ]).then(([p, t, b, pr, c]) => {
      if (p.status === "fulfilled") {
        setProfile(p.value.user);
        setForm({
          name: p.value.user.name,
          username: p.value.user.username,
          email: p.value.user.email,
        });
      }
      const tx = t.status === "fulfilled" ? t.value.transactions || [] : [];
      const borrowed =
        b.status === "fulfilled" ? b.value.provided_loans || [] : [];
      const provided =
        pr.status === "fulfilled" ? pr.value.provided_loans || [] : [];
      setStats({
        donations: tx
          .filter((x) => x.transaction_type === "crowdfunding_donation")
          .reduce((s, x) => s + Number(x.amount || 0), 0),
        received: borrowed.reduce(
          (s, x) => s + Number(x.principal_amount || 0),
          0,
        ),
        provided: provided.reduce(
          (s, x) => s + Number(x.principal_amount || 0),
          0,
        ),
      });
      if (c.status === "fulfilled") setCampaigns(c.value.crowdfundings || []);
    });
  }, []);
  const points = useMemo(
    () => Math.round((stats.donations + stats.provided) / 200 || 0),
    [stats],
  );
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const d = await api("/profile/me", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setProfile(d.user);
      updateUser(d.user);
      setSuccess("Profile updated.");
      setTimeout(() => {
        setOpen(false);
        setSuccess("");
      }, 600);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!profile) return <LoadingBlock text="Loading profile..." />;
  return (
    <div className="content-container">
      <section className="profile-hero">
        <img src="/assets/avatar.jpg" alt="" />
        <div className="profile-info">
          <div className="profile-name">{profile.name}</div>
          <div className="profile-username">@{profile.username}</div>
          <div className="profile-verify-container">
            <span className="verified-tag">
              {profile.is_verified ? "UIU Verified" : "Not Verified"}
            </span>
            <span><b>UIU ID:</b> {profile.uiuid || "0112230170"}</span>
          </div>
        </div>
        <button
          className="button primary-soft profile-edit"
          onClick={() => {
            setOpen(true);
            setError("");
          }}
        >
          <Edit3 size={15} />
          Edit Profile
        </button>
      </section>
      <div className="stats-grid four">
        <StatCard label="Total Donations" value={money(stats.donations)} />
        <StatCard label="Total Loan Received" value={money(stats.received)} />
        <StatCard label="Total Loan Provided" value={money(stats.provided)} />
        <StatCard label="Overall Points" value={`★ ${points}`} />
      </div>
      <section className="profile-contribution">
        <div className="profile-contribution-title">Contributions and Donations</div>
        <div className="profile-campaign-grid">
          {campaigns.slice(0, 2).map((c, i) => (
            <div className="profile-campaign-box" key={c.id}>
              <img
                src={API_URL+c.image_url}
                alt=""
              />
              <div className="profile-campaign-body">
                <div className="profile-campaign-title">{c.name}</div>
                <div className="profile-campaign-amount"><span>{money(c.raised_amount)}</span> Raised</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title="Edit Profile">
        <form className="modal-form" onSubmit={save}>
          <label>
            Full Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Username
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <Alert>{error}</Alert>
          <Alert type="success">{success}</Alert>
          <button className="button primary full" disabled={busy}>
            {busy ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
