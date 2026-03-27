export type RiskLevel = "High" | "Moderate" | "Low" | "MATAAS" | "KATAMTAMAN" | "MABABA";
export type UserRole = "resident" | "captain";
export type AppPath = "/" | "/submission" | "/result" | "/dashboard" | "/auth";

export interface House {
  id: number | string;
  lat: number;
  lng: number;
  risk: RiskLevel;
  color: string;
  owner: string;
  address: string;
  materials: string;
  details: string;
  date: string;
  full_report?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  confidence: number;
  location: BoundingBox;
}

export interface AnalysisResult {
  valid: boolean;
  risk_level: RiskLevel;
  material_findings: string;
  rust_detected: Detection[];
  cracks_detected: Detection[];
  old_wood_detected: Detection[];
  image_url: string;
  id: string;
}

// Ensure these match your existing prop types
export interface StatCardProps { value: number; label: string; subtext: string; variant: "total" | "high" | "pending"; }
export interface DetailPanelProps { house: House; onClose: () => void; }
export interface SidebarProps { navigate: (to: AppPath) => void; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LeafletInstance = any;
export type LeafletReadyCallback = (L: LeafletInstance) => void;

// Define the options React Router expects
export interface NavigateOptions {
  replace?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state?: any;
}

// ... (keep your existing House, BoundingBox, Detection, AnalysisResult interfaces here) ...

export interface RouteContextValue {
  path: AppPath;
  navigate: (to: AppPath, options?: NavigateOptions) => void;
}

export interface NavigateProps {
  navigate: (to: AppPath, options?: NavigateOptions) => void;
}

// ... (keep StatCardProps, DetailPanelProps, SidebarProps, Leaflet interfaces) ...