import React from "react";
import { X, AlertTriangle, Home, Bell, FileText } from "lucide-react";
import type { DetailPanelProps, RiskLevel } from "../../lib/types";

const RISK_CLASS_MAP: Record<RiskLevel, string> = {
  High: "detail__risk-badge--high",
  Moderate: "detail__risk-badge--moderate",
  Low: "detail__risk-badge--low",
  MATAAS: "detail__risk-badge--high",
  KATAMTAMAN: "detail__risk-badge--moderate",
  MABABA: "detail__risk-badge--low",
};

const DetailPanel: React.FC<DetailPanelProps> = ({ house, onClose }) => {
  const riskClass = RISK_CLASS_MAP[house.risk];

  const handleDownload = () => {
    const reportContent = `PROJECT TIPAK - STRUCTURAL ASSESSMENT
--------------------------------------------------
Petsa: ${house.date}
May-ari: ${house.owner}
Tirahan: ${house.address}
Coordinates: ${house.lat.toFixed(5)}, ${house.lng.toFixed(5)}
Risk Level: ${house.risk.toUpperCase()}

MGA MATERYALES:
${house.materials}

MGA DEPEKTONG NATUKLASAN (YOLOv8):
${house.details}

BUONG ULAT NG AI (Gemini):
${house.full_report}
`;

    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Tipak_Report_${house.owner.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="detail">
      <div className="detail__header">
        <span className="detail__header-title">Detalye ng Bahay</span>
        <button className="detail__close" onClick={onClose} aria-label="Isara ang panel">
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>

      <div className="detail__body">
        <div className="detail__thumb" aria-label="Larawan ng bahay">
          <Home size={36} strokeWidth={1.2} className="detail__thumb-icon" />
          <span className="detail__thumb-text">Larawan ng Bahay</span>
        </div>

        <span className={`detail__risk-badge ${riskClass}`}>
          <AlertTriangle size={10} strokeWidth={2.5} />
          {house.risk} Risk
        </span>

        <div className="detail__field">
          <span className="detail__field-label">May-ari</span>
          <span className="detail__field-value">{house.owner}</span>
        </div>

        <div className="detail__field">
          <span className="detail__field-label">Tirahan</span>
          <span className="detail__field-value">{house.address}</span>
        </div>

        <div className="detail__field">
          <span className="detail__field-label">Mga Materyales</span>
          <span className="detail__field-value">{house.materials}</span>
        </div>

        <div className="detail__field">
          <span className="detail__field-label">Natuklasang Depekto</span>
          <span className="detail__field-value">{house.details}</span>
        </div>

        <div className="detail__coords">
          <div className="detail__coord">
            <div className="detail__coord-label">Latitude</div>
            <div className="detail__coord-value">{house.lat.toFixed(4)}</div>
          </div>
          <div className="detail__coord">
            <div className="detail__coord-label">Longitude</div>
            <div className="detail__coord-value">{house.lng.toFixed(4)}</div>
          </div>
        </div>

        <div className="detail__field">
          <span className="detail__field-label">Petsa ng Pagsusuri</span>
          <span className="detail__field-value">{house.date}</span>
        </div>

        <div className="detail__divider" />

        <div className="detail__actions">
          <button className="detail__notify-btn">
            <Bell size={14} strokeWidth={2.2} />
            Abisuhan ang Engineer
          </button>
          <button className="detail__sec-btn" onClick={handleDownload}>
            <FileText size={13} strokeWidth={2} />
            I-download ang Ulat
          </button>
        </div>
      </div>
    </aside>
  );
};

export default DetailPanel;