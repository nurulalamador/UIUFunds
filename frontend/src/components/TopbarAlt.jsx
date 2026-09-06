import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TopbarAlt({title}) {
  const navigate = useNavigate();

  return (
    <div className="topbar-small">
      <button className="" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} />
      </button>
      <div className="topbar-small-title">{title}</div>
    </div>
  );
}
