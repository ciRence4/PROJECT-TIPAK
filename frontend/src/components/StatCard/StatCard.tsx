import React from "react";
import { FileText, AlertTriangle, Clock } from "lucide-react";
import type { StatCardProps } from "../../lib/types";

const ICON_MAP: Record<StatCardProps["variant"], React.ReactElement> = {
  total:   <FileText size={15} strokeWidth={2} />,
  high:    <AlertTriangle size={15} strokeWidth={2} />,
  pending: <Clock size={15} strokeWidth={2} />,
};

/**
 * Summary metric card displayed in the Dashboard top row.
 */
const StatCard: React.FC<StatCardProps> = ({ value, label, subtext, variant }) => (
  <div className={`stat stat--${variant}`}>
    <div className="stat__row">
      <div>
        <div className="stat__value">{value}</div>
        <div className="stat__label">{label}</div>
      </div>
      <div className={`stat__icon stat__icon--${variant}`}>
        {ICON_MAP[variant]}
      </div>
    </div>
    <div className="stat__change">{subtext}</div>
  </div>
);

export default StatCard;