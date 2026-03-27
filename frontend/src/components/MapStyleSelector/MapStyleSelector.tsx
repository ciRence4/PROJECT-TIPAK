import React from "react";
import { Satellite, Moon, Map } from "lucide-react";
import "./MapStyleSelector.css";

export type MapStyle = "satellite" | "dark" | "street";

interface MapStyleSelectorProps {
  currentStyle: MapStyle;
  onStyleChange: (style: MapStyle) => void;
}

const MapStyleSelector: React.FC<MapStyleSelectorProps> = ({ currentStyle, onStyleChange }) => {
  return (
    <div className="map-selector">
      <button
        className={`map-selector__btn ${currentStyle === "satellite" ? "map-selector__btn--active" : ""}`}
        onClick={() => onStyleChange("satellite")}
        aria-label="Satellite View"
      >
        <Satellite size={14} />
        <span>Satellite</span>
      </button>
      
      <button
        className={`map-selector__btn ${currentStyle === "dark" ? "map-selector__btn--active" : ""}`}
        onClick={() => onStyleChange("dark")}
        aria-label="Dark Mode View"
      >
        <Moon size={14} />
        <span>Dark</span>
      </button>

      <button
        className={`map-selector__btn ${currentStyle === "street" ? "map-selector__btn--active" : ""}`}
        onClick={() => onStyleChange("street")}
        aria-label="Street View"
      >
        <Map size={14} />
        <span>Street</span>
      </button>
    </div>
  );
};

export default MapStyleSelector;