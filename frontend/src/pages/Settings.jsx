import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Alert } from "../components/UI";

export default function Settings() {
  const [darkTheme, setDarkTheme] = useState(
    () => localStorage.getItem("uiufunds-theme") === "dark",
  );
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const theme = darkTheme ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("uiufunds-theme", theme);
  }, [darkTheme]);

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
                placeholder="Enter current password"
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
                placeholder="Enter new password"
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
                placeholder="Confirm new password"
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
              <div className="settings-row-title">Dark theme</div>
              <div className="settings-row-details">
                Eye relaxing energy saving dark theme.
              </div>
            </div>
            <input
              type="checkbox"
              checked={darkTheme}
              onChange={(event) => setDarkTheme(event.target.checked)}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-title">Email notifications</div>
              <div className="settings-row-details">
                Receive important account updates.
              </div>
            </div>
            <input type="checkbox" defaultChecked />
          </div>
        </section>
      </div>
    </div>
  );
}
