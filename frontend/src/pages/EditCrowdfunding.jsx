import { Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { API_URL } from "../config";
import { Alert, LoadingBlock } from "../components/UI";
import TopbarAlt from "../components/TopbarAlt";

export default function EditCrowdfunding() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    name: "",
    description: "",
    target_amount: "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/crowdfundings/mine/${id}`)
      .then(({ crowdfunding }) => {
        setForm({
          name: crowdfunding.name || "",
          description: crowdfunding.description || "",
          target_amount: crowdfunding.target_amount || "",
        });
        if (crowdfunding.image_url) {
          setImagePreview(`${API_URL}${crowdfunding.image_url}`);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!image) return undefined;
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

      await api(`/crowdfundings/${id}`, { method: "PATCH", body });
      navigate("/app/my-crowdfundings");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingBlock text="Loading crowdfunding details..." />;

  return (
    <>
      <TopbarAlt title="Edit Crowdfunding" />
      <div className="content-container">
        <form className="center-form-card crowdfunding-form" onSubmit={submit}>
          <h2>Edit Crowdfunding Details</h2>
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
            {busy ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </>
  );
}
