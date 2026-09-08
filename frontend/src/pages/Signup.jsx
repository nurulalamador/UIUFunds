import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";
import { Alert } from "../components/UI";
import { useAuth } from "../contexts/AuthContext";
import { Camera } from "lucide-react";

export default function Signup() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    uiuid: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  if (isAuthenticated) return <Navigate to="/app" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm)
      return setError("Passwords do not match");
    setBusy(true);
    try {
      await register({
        name: form.name,
        username: form.username,
        uiuid: form.uiuid,
        email: form.email,
        password: form.password,
      });
      navigate("/app");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  return (
    <div className="public-page auth-bg">
      <PublicHeader />
      <main className="auth-wrap auth-wrap-tall">
        <form className="auth-card signup-card" onSubmit={submit}>
          <h1>Create Account</h1>
          <p>Join the UIUFund community</p>
          <Alert>{error}</Alert>
          <label>
            Full Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </label>
          <label>
            Username
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter a username"
              required
            />
          </label>
          <label>
            UIU ID
            <input
              value={form.uiuid}
              onChange={(e) => setForm({ ...form, uiuid: e.target.value })}
              placeholder="Your UIU student ID"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Enter your email address"
              required
            />
          </label>
          <div className="two-col-fields">
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength="6"
                placeholder="Enter your password"
                required
              />
            </label>
            <label>
              Confirm Password
              <input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                minLength="6"
                placeholder="Confirm your password"
                required
              />
            </label>
          </div>
          <label>
            UIU ID Card Image
            <div className="upload-box">
              {imagePreview ? (
                <img src={imagePreview} alt="Selected crowdfunding" />
              ) : (
                <>
                  <Camera size={38} />
                  <span>Add ID Card Image</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </div>
          </label>
          <button className="button primary full" disabled={busy}>
            {busy ? "Creating..." : "Create Account"}
          </button>
          <p className="auth-foot">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
