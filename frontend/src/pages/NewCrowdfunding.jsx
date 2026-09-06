import { ArrowLeft, Camera, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, jsonBody } from "../api/client";
import { Alert, PageTitle } from "../components/UI";

export default function NewCrowdfunding() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    target_amount: "",
    proofText: "",
  });
  const [image, setImage] = useState(null);
  const [proof, setProof] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/crowdfundings", {
        method: "POST",
        body: jsonBody({
          name: form.name,
          description: form.description,
          target_amount: Number(form.target_amount),
        }),
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
      <PageTitle
        title="Post New Crowdfunding"
        back={
          <button className="icon-button plain" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </button>
        }
      />
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
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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
            {image ? (
              <img src={URL.createObjectURL(image)} alt="preview" />
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
        {/* <label>
          Proofs
          <div className="proof-row">
            <input
              placeholder="Please tell details of this proof"
              value={form.proofText}
              onChange={(e) => setForm({ ...form, proofText: e.target.value })}
            />
            <label className="button muted upload-button">
              Upload File
              <input
                type="file"
                hidden
                onChange={(e) => setProof(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          {proof && <span className="field-help">Selected: {proof.name}</span>}
        </label>
        <button className="text-add" type="button">
          <Plus size={15} /> Add Another Proof
        </button> */}
        <button className="button primary full" disabled={busy}>
          {busy ? "Submitting..." : "Submit for Approval"}
        </button>
      </form>
    </>
  );
}
