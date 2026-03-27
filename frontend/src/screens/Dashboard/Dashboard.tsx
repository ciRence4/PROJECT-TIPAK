import React, { useState, useRef, useCallback, useEffect } from "react";
import { Bell, Home } from "lucide-react";
import StatCard from "../../components/StatCard/StatCard";
import DetailPanel from "../../components/DetailPanel/DetailPanel";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useLeaflet } from "../../hooks/useLeaflet";
import { api } from "../../lib/api";
import type { House, NavigateProps, LeafletInstance } from "../../lib/types";
import "./Dashboard.css";

const MAP_CENTER: [number, number] = [14.599, 120.985];
const MAP_ZOOM = 15;

/**
 * Barangay Captain Dashboard.
 * Desktop layout with:
 * - collapsible sidebar navigation
 * - summary stat cards
 * - Leaflet risk map with coloured circle markers
 * - slide-in DetailPanel on marker click
 * TODO: mobile layout
 */
const Dashboard: React.FC<NavigateProps> = ({ navigate }) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef  = useRef<LeafletInstance | null>(null);

  // Fetch houses on component mount
  useEffect(() => {
    const loadHouses = async () => {
      const data = await api.getHouses();
      setHouses(data);
    };
    loadHouses();
  }, []);

  /** build the Leaflet map and plot all house markers. */
  const initMap = useCallback((L: LeafletInstance): void => {
  if (!mapContainerRef.current) return;

  // 1. Initialize the base map ONLY if it doesn't exist yet
  if (!mapInstanceRef.current) {
    const map = L.map(mapContainerRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
  }

  // 2. Plot the markers
  const map = mapInstanceRef.current;
  
  if (houses.length === 0) return;

  // Note: If 'houses' updates frequently, you should clear existing layers here 
  // first using L.layerGroup() so you don't get overlapping markers.
  houses.forEach((house) => {
    L.circleMarker([house.lat, house.lng], {
      radius: 20,
      fillColor: house.color,
      color: house.color,
      weight: 1.5,
      opacity: 0.28,
      fillOpacity: 0.08,
    }).addTo(map);

    const marker = L.circleMarker([house.lat, house.lng], {
      radius: 13,
      fillColor: house.color,
      color: "rgba(14,26,39,0.70)",
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.88,
    }).addTo(map);

    marker.bindTooltip(
      `<strong style="font-family:Sora,sans-serif;font-size:0.78rem;color:#0e1a27">
         ${house.risk} Risk
       </strong><br>
       <span style="font-size:0.68rem;color:#26436c">
         ${house.owner}
       </span>`,
      { direction: "top", offset: [0, -14] },
    );

    marker.on("click", () => {
      setSelectedHouse(house);
      map.panTo([house.lat, house.lng], { animate: true, duration: 0.5 });
    });
  });
}, [houses]);

  useLeaflet(initMap);

  /** clean up the Leaflet instance when the component unmounts. */
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="dash">
      <Sidebar navigate={navigate} />

      <div className="dash__main">
        {/* Topbar */}
        <div className="dash__topbar">
          <div>
            <div className="dash__topbar-title">Risk Map: Barangay ##</div>
            <div className="dash__topbar-meta">
              Legazpi City, NCR &bull; Mar 24, 2026 &bull; {houses.length} properties plotted
            </div>
          </div>

          <div className="dash__topbar-actions">
            <button
              className="dash__topbar-btn"
              onClick={() => navigate("/")}
            >
              <Home size={13} strokeWidth={2} />
              <span>Resident Portal</span>
            </button>
            <button className="dash__topbar-btn dash__topbar-btn--primary">
              <Bell size={13} strokeWidth={2.2} />
              <span>Broadcast SMS</span>
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="dash__stats">
          <StatCard
            value={124}
            label="Total Submissions"
            subtext="+8 mula kahapon"
            variant="total"
          />
          <StatCard
            value={12}
            label="High Risk"
            subtext="3 nangangailangan ng agarang aksyon"
            variant="high"
          />
          <StatCard
            value={8}
            label="Pending Inspections"
            subtext="Susunod: Martes, Mar 26"
            variant="pending"
          />
        </div>

        {/* Map + detail panel */}
        <div className="dash__content">
          <div className="dash__map-wrap">

            {/* Leaflet mount target */}
            <div
              id="tipak-map"
              ref={mapContainerRef}
              aria-label="Risk map ng Barangay 654"
            />
          </div>

          {/* Slide-in detail panel */}
          {selectedHouse && (
            <DetailPanel
              house={selectedHouse}
              onClose={() => setSelectedHouse(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;