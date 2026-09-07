import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import { Alert } from "../components/UI";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(form.identifier, form.password);
      navigate(location.state?.from || "/app", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="public-page auth-bg">
      <PublicHeader />
      <main className="auth-wrap">
        <form className="auth-card" onSubmit={submit}>
          <h1>Login</h1>
          <p>Sign in to your account</p>
          <Alert>{error}</Alert>
          <label>
            Username or Email
            <input
              value={form.identifier}
              onChange={(e) => setForm({ ...form, identifier: e.target.value })}
              placeholder="example145"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>
          <div className="auth-options">
            <label className="check">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) =>
                  setForm({ ...form, remember: e.target.checked })
                }
              />{" "}
              Remember me
            </label>
            <span className="text-link">Forgot Password?</span>
          </div>
          <button className="button primary full" disabled={busy}>
            {busy ? "Signing in..." : "Login"}
          </button>
          {/* <div className="or">
            <span />
            or
            <span />
          </div>
          <button type="button" className="button muted full" disabled>
            Continue with Google
          </button> */}
          <p className="auth-foot">
            Don't have an account yet? <Link to="/signup">Sign Up</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
