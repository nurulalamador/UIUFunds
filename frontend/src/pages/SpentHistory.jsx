import { useEffect, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api, fetchBlob } from "../api/client";
import { API_URL } from "../config";
import { Alert, LoadingBlock, PageTitle } from "../components/UI";
import { money, pct } from "../utils/format";
import TopbarAlt from "../components/TopbarAlt";

function img(c) {
  if (c?.image_url && c?.is_approved) return `${API_URL}${c.image_url}`;
  return (c?.name || "").toLowerCase().includes("cancer")
    ? "/assets/cancer.jpg"
    : "/assets/history-flood.jpg";
}
export default function SpentHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api(`/crowdfundings/${id}`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [id]);
  const proof = async (item) => {
    try {
      const blob = await fetchBlob(`/crowdfundings/spend/${item.id}/proof`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
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
      <TopbarAlt title="Spent History" />
      <Alert>{error}</Alert>
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
                          onClick={() => proof(x)}
                        >
                          <Download size={14} />
                          Download
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{money(x.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="6" className="right">
                    Total
                  </td>
                  <td>{money(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
