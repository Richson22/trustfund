import React from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/dashboard", icon: "🏠", label: "Home" },
  { path: "/send", icon: "↑", label: "Send" },
  { path: "/receive", icon: "↓", label: "Receive" },
  { path: "/swap", icon: "🔄", label: "Swap" },
  { path: "/buy-sell", icon: "💳", label: "Buy & Sell" },
  { path: "/earn", icon: "🪙", label: "Earn" },
  { path: "/nft", icon: "🖼️", label: "NFTs" },
  { path: "/discover", icon: "🧭", label: "Discover" },
  { path: "/transactionhistory", icon: "🧾", label: "Activity" },
];

function Sidebar({ onClose }) {
  const location = useLocation();

  // Treat a path as "active" if the current URL starts with it, so e.g.
  // /nft/123 still highlights "NFTs", /settings/security still highlights
  // "Settings", etc.
  function isActive(path) {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  }

  return (
    <aside style={styles.sidebar}>
      <div style={styles.topRow}>
        <Link to="/dashboard" style={styles.logo}>
          <img src="/bit_funds_logo.png" alt="Bit Funds" style={styles.logoImg} />
          <span style={styles.logoText}>Trust Funds</span>
        </Link>
        {onClose && (
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        )}
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="bf-sidebar-item"
            style={{ ...styles.navItem, ...(isActive(item.path) ? styles.navItemActive : {}) }}
            onClick={onClose}
          >
            <span style={styles.navItemIcon}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={styles.footer}>
        <Link
          to="/settings"
          className="bf-sidebar-item"
          style={{ ...styles.navItem, ...(isActive("/settings") ? styles.navItemActive : {}) }}
          onClick={onClose}
        >
          <span style={styles.navItemIcon}>⚙️</span>
          Settings
        </Link>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 240, background: "#ffffff", borderRight: "1px solid rgba(11,14,10,0.06)",
    padding: "28px 18px", display: "flex", flexDirection: "column",
    position: "sticky", top: 0, height: "100vh", flexShrink: 0,
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 10px", marginBottom: 32 },
  logo: { display: "flex", alignItems: "center", gap: 10, textDecoration: "none" },
  closeBtn: { background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: "rgba(11,14,10,0.5)", padding: 4, display: "none" },
  logoImg: { width: 30, height: 30, objectFit: "contain" },
  logoText: { fontWeight: 800, fontSize: 16, color: "#0b0e0a", letterSpacing: "-0.02em" },

  nav: { display: "flex", flexDirection: "column", gap: 4, flex: 1, overflowY: "auto" },
  navItem: {
    display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none",
    borderRadius: 10, padding: "12px 14px", fontSize: 14, fontWeight: 600, color: "rgba(11,14,10,0.6)",
    cursor: "pointer", textAlign: "left", textDecoration: "none", transition: "background 0.15s",
  },
  navItemActive: { background: "rgba(61,92,255,0.08)", color: "#3D5CFF" },
  navItemIcon: { fontSize: 15, width: 20, textAlign: "center", flexShrink: 0 },

  footer: { borderTop: "1px solid rgba(11,14,10,0.06)", paddingTop: 12 },
};

export default Sidebar;