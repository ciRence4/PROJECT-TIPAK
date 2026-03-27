import React from "react";
import { Map, Bell, Activity, Users, LogOut, Shield } from "lucide-react";
import type { SidebarProps, AppPath } from "../../lib/types";

interface NavItem {
  icon: React.ElementType;
  label: string;
  active: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Map,      label: "Map View",      active: true  },
  { icon: Bell,     label: "SMS Broadcast", active: false },
  { icon: Activity, label: "Reports",       active: false },
  { icon: Users,    label: "Residents",     active: false },
];

/**
 * Dashboard left sidebar.
 * Collapses to icon-only rail at ≤900 px via CSS breakpoints.
 */
const Sidebar: React.FC<SidebarProps> = ({ navigate }) => {
  const handleLogout = () => navigate("/" satisfies AppPath);

  return (
    <aside className="dash__sidebar">
      {}
      <div className="dash__sidebar-head">
        <div className="dash__sidebar-brand">Project Tipak</div>
        <div className="dash__sidebar-sub">Command Center</div>

        <div className="dash__sidebar-role">
          <div className="dash__sidebar-avatar">
            <Shield size={13} color="#e9b26e" strokeWidth={2} />
          </div>
          <div>
            <div className="dash__sidebar-role-name">Kap. Reyes</div>
            <div className="dash__sidebar-role-label">Brgy. Captain</div>
          </div>
        </div>
      </div>

      {}
      <nav className="dash__nav" aria-label="Pangunahing menu">
        <div className="dash__nav-section">Navigation</div>

        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`dash__nav-item${active ? " dash__nav-item--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
            <span>{label}</span>
          </button>
        ))}

        <div className="dash__nav-spacer" />

        <button
          className="dash__nav-item dash__nav-item--logout"
          onClick={handleLogout}
        >
          <LogOut size={15} strokeWidth={1.8} />
          <span>Mag-logout</span>
        </button>
      </nav>

      {}
      <div className="dash__sidebar-footer">
        <div className="dash__sidebar-status">
          <span className="dash__sidebar-status-dot" />
          Live — synced just now
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;