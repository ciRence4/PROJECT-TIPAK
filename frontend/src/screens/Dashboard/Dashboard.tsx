import React, { useState, useRef, useCallback, useEffect } from "react";
import { Home, LogOut } from "lucide-react";
import StatCard from "../../components/StatCard/StatCard";
import DetailPanel from "../../components/DetailPanel/DetailPanel";
import { useLeaflet } from "../../hooks/useLeaflet";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import type { House, NavigateProps, LeafletInstance } from "../../lib/types";
import "./Dashboard.css";

const FALLBACK_MAP_CENTER: [number, number] = [14.599, 120.985];
const MAP_ZOOM = 15;

const Dashboard: React.FC<NavigateProps> = ({ navigate }) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  
  const { logout } = useAuth();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef  = useRef<LeafletInstance | null>(null);

  // Fetch real data from the backend database on mount
  useEffect(() => {
    const loadHouses = async () => {
      try {
        const data = await api.getHouses();
        setHouses(data || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setHouses([]); 
      }
    };
    loadHouses();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Inside src/screens/Dashboard/Dashboard.tsx

  /** build the Leaflet map and plot all house markers. */
  const initMap = useCallback((L: LeafletInstance): void => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: FALLBACK_MAP_CENTER, // Start with fallback
        zoom: MAP_ZOOM,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // 📍 Access user location, center the map, and add a location marker
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.setView([latitude, longitude], MAP_ZOOM);

            // Outer semi-transparent blue pulse
            L.circleMarker([latitude, longitude], {
              radius: 18,
              fillColor: "#3b82f6", // Blue
              color: "transparent",
              fillOpacity: 0.2,
            }).addTo(map);

            // Inner solid blue dot for precise location
            L.circleMarker([latitude, longitude], {
              radius: 7,
              fillColor: "#3b82f6",
              color: "#ffffff",
              weight: 2,
              opacity: 1,
              fillOpacity: 1,
            })
            .addTo(map)
            .bindTooltip(
              `<span style="font-family:var(--ff-body);font-size:0.75rem;font-weight:600;color:#0e1a27">
                 Iyong Lokasyon
               </span>`,
              { direction: "top", offset: [0, -8] }
            );
          },
          (err) => console.warn("Hindi makuha ang lokasyon ng dashboard:", err.message),
          { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
        );
      }
    }

    const map = mapInstanceRef.current;
    
    if (houses.length === 0) return;

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
        radius: 30,
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

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // --- Dynamic calculations based purely on backend database ---
  const totalSubmissions = houses.length;
  const highRiskCount = houses.filter(h => h.risk === "MATAAS" || h.risk === "High").length;
  const moderateRiskCount = houses.filter(h => h.risk === "KATAMTAMAN" || h.risk === "Moderate").length;
  const currentDate = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="dash">
      <div className="dash__main">
        {/* Topbar */}
        <div className="dash__topbar">
          <div>
            <div className="dash__topbar-title">Barangay Risk Map</div>
            <div className="dash__topbar-meta">
              {currentDate} &bull; {totalSubmissions === 0 ? "Walang data sa database" : `${totalSubmissions} properties plotted`}
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
            <button 
              className="dash__topbar-btn dash__topbar-btn--primary"
              onClick={handleLogout}
            >
              <LogOut size={13} strokeWidth={2.2} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* ── Stat cards driven by backend data ── */}
        <div className="dash__stats">
          <StatCard
            value={totalSubmissions}
            label="Total Submissions"
            subtext={totalSubmissions === 0 ? "Walang naitala" : "Galing sa database"}
            variant="total"
          />
          <StatCard
            value={highRiskCount}
            label="High Risk (Mataas)"
            subtext={highRiskCount === 0 ? "Walang high risk" : "Nangangailangan ng aksyon"}
            variant="high"
          />
          <StatCard
            value={moderateRiskCount}
            label="Moderate Risk (Katamtaman)"
            subtext={moderateRiskCount === 0 ? "Walang moderate risk" : "Kailangang bantayan"}
            variant="pending" 
          />
        </div>

        {/* Map + detail panel */}
        <div className="dash__content">
          <div className="dash__map-wrap">
            {houses.length === 0 && (
               <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 900, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--ff-body)' }}>
                 Walang data na makita.
               </div>
            )}
            {/* Leaflet mount target */}
            <div
              id="tipak-map"
              ref={mapContainerRef}
              aria-label="Risk map ng Barangay"
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