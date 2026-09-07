import { useEffect, useState } from "react";
import { ArrowLeft, Download, Plus, SlidersHorizontal } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api, fetchBlob } from "../api/client";
import { API_URL } from "../config";
import Modal from "../components/Modal";
import { Alert, LoadingBlock, PageTitle } from "../components/UI";
import { money, pct, shortDate } from "../utils/format";
import TopbarAlt from "../components/TopbarAlt";

function img(c) {
  if (c?.image_url && c?.is_approved) return `${API_URL}${c.image_url}`;
  return (c?.name || "").toLowerCase().includes("cancer")
    ? "/assets/cancer.jpg"
    : "/assets/flood.jpg";
}

export default function ManageSpent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price_per_unit: "",
    quantity: 1,
    proof_type: "receipt",
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () =>
    api(`/crowdfundings/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [id]);
  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("proof", file);
      await api(`/crowdfundings/${id}/spend-items`, {
        method: "POST",
        body: fd,
      });
      setSuccess("Spent item added.");
      setForm({
        name: "",
        description: "",
        price_per_unit: "",
        quantity: 1,
        proof_type: "receipt",
      });
      setFile(null);
      await load();
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
  const downloadProof = async (item) => {
    try {
      const blob = await fetchBlob(`/crowdfundings/spend/${item.id}/proof`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.proof_file_name || `proof-${item.id}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (e) {
      setError(e.message);
    }
  };
  if (!data && !error) return <LoadingBlock text="Loading spent history..." />;
  const c = data?.crowdfunding;
  const items = data?.spend_items || [];
  const total = items.reduce((s, x) => s + Number(x.total_amount || 0), 0);
  return (
    <>
      <TopbarAlt title="Manage Spent History" />
      <Alert>{error && !open ? error : ""}</Alert>
      <div className="content-container">
        {c && (
          <div className="campaign-hero-card">
            <img src={img(c)} alt="" />
            <div className="campaign-body">
              <div className="campaign-title-row">
                <div className="campaign-title">{c.name}</div>
              </div>
              <p>{c.description}</p>
              <div className="campaign-meta">
                <span>Total Donor</span>
                <strong>{data.donations?.length || 0}</strong>
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
                  style={{ width: `${pct(c.raised_amount, c.target_amount)}%` }}
                />
              </div>
            </div>
          </div>
        )}
        <div className="toolbar">
          <button
            className="button primary"
            onClick={() => {
              setOpen(true);
              setError("");
            }}
          >
            <Plus size={16} />
            Add New Spent
          </button>
          <div className="filter-row">
            <div className="filter-row-title">
              <SlidersHorizontal size={18} />
              <span>Filter</span>
            </div>
            <select>
              <option>Recently Posted</option>
            </select>
          </div>
        </div>
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>SL</th>
                  <th>Item Name</th>
                  <th>Price Per Unit</th>
                  <th>Quantity</th>
                  <th>Proof Type</th>
                  <th>Proof</th>
                  <th>Final Price</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x, i) => (
                  <tr key={x.id}>
                    <td>{i + 1}</td>
                    <td>{x.name}</td>
                    <td>{money(x.price_per_unit)}</td>
                    <td>{x.quantity}</td>
                    <td>{x.proof_type || "—"}</td>
                    <td>
                      {x.has_proof ? (
                        <button
                          className="text-button"
                          onClick={() => downloadProof(x)}
                        >
                          <Download size={14} />
                          Download
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{money(x.total_amount)}</td>
                    <td>{shortDate(x.spent_at)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="6" className="right">
                    Total
                  </td>
                  <td>{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <Modal open={open} onClose={() => setOpen(false)} title="Add New Spent">
          <form className="modal-form" onSubmit={add}>
            <label>
              Item Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <div className="two-col-fields">
              <label>
                Price Per Unit
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price_per_unit}
                  onChange={(e) =>
                    setForm({ ...form, price_per_unit: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Quantity
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  required
                />
              </label>
            </div>
            <div className="two-col-fields">
              <label>
                Proof Type
                <select
                  value={form.proof_type}
                  onChange={(e) =>
                    setForm({ ...form, proof_type: e.target.value })
                  }
                >
                  <option value="receipt">Money Receipt</option>
                  <option value="image">Photo</option>
                  <option value="pdf">PDF</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Proof File
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <Alert>{error}</Alert>
            <Alert type="success">{success}</Alert>
            <button className="button primary full" disabled={busy}>
              {busy ? "Saving..." : "Save Spent Item"}
            </button>
          </form>
        </Modal>
      </div>
    </>
  );
}
