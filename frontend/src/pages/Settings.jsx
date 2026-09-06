import { useState } from "react";
import { api } from "../api/client";
import { Alert } from "../components/UI";

export default function Settings() {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (form.new_password !== form.confirm)
      return setError("New passwords do not match");
    setBusy(true);
    try {
      const d = await api("/profile/me/password", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: form.current_password,
          new_password: form.new_password,
        }),
      });
      setSuccess(d.message);
      setForm({ current_password: "", new_password: "", confirm: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="content-container">
      <div className="settings-grid">
        <section className="detail-card">
          <h2>Change Password</h2>
          <form className="modal-form" onSubmit={submit}>
            <label>
              Current Password
              <input
                type="password"
                value={form.current_password}
                onChange={(e) =>
                  setForm({ ...form, current_password: e.target.value })
                }
                required
              />
            </label>
            <label>
              New Password
              <input
                type="password"
                minLength="6"
                value={form.new_password}
                onChange={(e) =>
                  setForm({ ...form, new_password: e.target.value })
                }
                required
              />
            </label>
            <label>
              Confirm New Password
              <input
                type="password"
                minLength="6"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
              />
            </label>
            <Alert>{error}</Alert>
            <Alert type="success">{success}</Alert>
            <button className="button primary" disabled={busy}>
              {busy ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
        <section className="detail-card">
          <h2>Application Preferences</h2>
          <div className="settings-row">
            <div>
              <strong>Email notifications</strong>
              <span>Receive important account updates.</span>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="settings-row">
            <div>
              <strong>Compact dashboard</strong>
              <span>Keep the current design spacing.</span>
            </div>
            <input type="checkbox" />
          </div>
        </section>
      </div>
    </div>
  );
}
