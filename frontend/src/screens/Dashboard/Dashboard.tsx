import React, { useState, useRef, useCallback, useEffect } from "react";
import { Home, LogOut, MessageSquare, Loader2 } from "lucide-react";
import StatCard from "../../components/StatCard/StatCard";
import DetailPanel from "../../components/DetailPanel/DetailPanel";
import { useLeaflet } from "../../hooks/useLeaflet";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import type { House, NavigateProps, LeafletInstance } from "../../lib/types";
import "./Dashboard.css";

const MAP_BOUNDS: [[number, number], [number, number]] = [
  [14.168288025639274, 121.2378119084683], 
  [14.173738857174708, 121.24183522173293] 
];

const FALLBACK_MAP_CENTER: [number, number] = [14.171013, 121.239823];
const MAP_ZOOM = 16;

const Dashboard: React.FC<NavigateProps> = ({ navigate }) => {
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const { logout } = useAuth();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef  = useRef<LeafletInstance | null>(null);

  useEffect(() => {
    const loadHouses = async () => {
      try {
        const data = await api.getHouses();
        setHouses(data || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setHouses([]); 
      } finally {
        setIsLoading(false);
      }
    };
    loadHouses();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const initMap = useCallback((L: LeafletInstance): void => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: FALLBACK_MAP_CENTER, 
      zoom: MAP_ZOOM,
      zoomControl: true,
      maxBounds: MAP_BOUNDS, 
      maxBoundsViscosity: 1.0, 
      minZoom: 16, 
      inertia: false, 
      bounceAtZoomLimits: false, 
    });

    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    }).addTo(map);

    mapInstanceRef.current = map;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], MAP_ZOOM);

          L.circleMarker([latitude, longitude], {
            radius: 18,
            fillColor: "#3b82f6", 
            color: "transparent",
            fillOpacity: 0.2,
          }).addTo(map);

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
  }, []);

  useLeaflet(initMap);

  useEffect(() => {
    const map = mapInstanceRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    
    if (!map || !L) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker && layer.options.fillColor !== "#3b82f6") {
        map.removeLayer(layer);
      }
    });

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

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current){
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const totalSubmissions = houses.length;
  const lowRiskCount = houses.filter(h => h.risk === "MABABA" || h.risk === "Low").length;
  const highRiskCount = houses.filter(h => h.risk === "MATAAS" || h.risk === "High").length;
  const moderateRiskCount = houses.filter(h => h.risk === "KATAMTAMAN" || h.risk === "Moderate").length;
  const currentDate = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="dash">
      <div className="dash__main">
        <div className="dash__topbar">
          <div>
            <div className="dash__topbar-title">Barangay Risk Map</div>
            <div className="dash__topbar-meta">
              {currentDate} &bull; {isLoading ? "Waking up server..." : (totalSubmissions === 0 ? "Walang data sa database" : `${totalSubmissions} properties plotted`)}
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
              onClick={() =>{}}
            >
              <MessageSquare size={13} strokeWidth={2.2} />
              <span>SMS Alert</span>
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

        <div className="dash__stats">
          <StatCard
            value={lowRiskCount}
            label="Low Risk (Mababa)"
            subtext={lowRiskCount === 0 ? "Walang low risk" : "Ligtas sa ngayon"}
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

        <div className="dash__content">
          <div className="dash__map-wrap">
            {isLoading && (
               <div style={{ 
                 position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                 zIndex: 900, color: 'var(--c-cream)', fontFamily: 'var(--ff-body)', 
                 background: 'rgba(14, 26, 39, 0.85)', padding: '12px 20px', 
                 borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px',
                 boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
               }}>
                 <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                 <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Waking up server, please wait...</span>
               </div>
            )}
            <div
              id="tipak-map"
              ref={mapContainerRef}
              aria-label="Risk map ng Barangay"
            />
          </div>

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