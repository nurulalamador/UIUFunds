import { ArrowLeft, Camera, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Alert } from "../components/UI";
import TopbarAlt from "../components/TopbarAlt";

export default function NewCrowdfunding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    target_amount: "",
    proofText: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [proof, setProof] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return undefined;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("description", form.description);
      body.append("target_amount", String(Number(form.target_amount)));
      if (image) body.append("image", image);

      await api("/crowdfundings", {
        method: "POST",
        body,
      });
      navigate("/app/my-crowdfundings");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <TopbarAlt title="Post New Crowdfunding" />
      <div className="content-container">
        <form className="center-form-card crowdfunding-form" onSubmit={submit}>
          <h2>Enter Crowdfunding Details</h2>
          <Alert>{error}</Alert>
          <label>
            Title
            <input
              placeholder="Please Enter Title"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>
          <label>
            Description
            <textarea
              placeholder="Please Enter Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </label>
          <label>
            Target Amount
            <input
              type="number"
              min="1"
              placeholder="Fund goal"
              value={form.target_amount}
              onChange={(e) =>
                setForm({ ...form, target_amount: e.target.value })
              }
              required
            />
          </label>
          <label>
            Image
            <div className="upload-box">
              {imagePreview ? (
                <img src={imagePreview} alt="Selected crowdfunding" />
              ) : (
                <>
                  <Camera size={38} />
                  <span>Add Image</span>
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
            {busy ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      </div>
    </>
  );
}
