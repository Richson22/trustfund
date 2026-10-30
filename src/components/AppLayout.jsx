import React from "react";
import Sidebar from "./Sidebar";

// Wraps every "logged-in" page (Dashboard, Send, Receive, Swap, Settings,
// etc.) with the shared Sidebar. Pages that shouldn't have the sidebar
// (Home, Login, ImportWallet, RecoveryPhrase) are NOT wrapped with this —
// see App.jsx routing.
//
// Sidebar behavior:
// - Desktop (>900px): always visible, no toggle needed.
// - Mobile (<=900px): hidden by default, opens as a slide-in drawer with a
//   hamburger button in the top bar, and a dark overlay behind it that
//   closes it when tapped.
function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div style={styles.wrap}>
      <style>{`
        .bf-sidebar-item:hover { background: rgba(11,14,10,0.04) !important; }
        .bf-hamburger-btn { display: none; }
        @media (max-width: 900px) {
          .bf-app-sidebar {
            position: fixed !important; top: 0; left: 0; height: 100vh; z-index: 200;
            transform: translateX(-100%); transition: transform 0.25s ease;
          }
          .bf-app-sidebar.open { transform: translateX(0); }
          .bf-sidebar-close-btn { display: block !important; }
          .bf-hamburger-btn { display: flex !important; }
          .bf-mobile-topbar { display: flex !important; }
        }
      `}</style>

      {/* Mobile-only top bar with hamburger toggle */}
      <div className="bf-mobile-topbar" style={styles.mobileTopbar}>
        <button
          className="bf-hamburger-btn"
          style={styles.hamburgerBtn}
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <span style={styles.hamburgerBar} />
          <span style={styles.hamburgerBar} />
          <span style={styles.hamburgerBar} />
        </button>
        <span style={styles.mobileTitle}>Trust Funds</span>
      </div>

      {/* Dark overlay behind the drawer, closes it when tapped */}
      {mobileOpen && <div style={styles.overlay} onClick={() => setMobileOpen(false)} />}

      <div style={styles.bodyRow}>
        <div className={`bf-app-sidebar${mobileOpen ? " open" : ""}`}>
          <Sidebar onClose={() => setMobileOpen(false)} />
        </div>
        <main style={styles.main}>{children}</main>
      </div>
    </div>
  );
}

const styles = {
  wrap: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f4f4f6" },
  bodyRow: { display: "flex", flex: 1, minWidth: 0 },
  main: { flex: 1, minWidth: 0 },

  mobileTopbar: {
    display: "none", alignItems: "center", gap: 14, background: "#fff",
    borderBottom: "1px solid rgba(11,14,10,0.06)", padding: "14px 18px",
    position: "sticky", top: 0, zIndex: 50, width: "100%",
  },
  hamburgerBtn: {
    background: "transparent", border: "none", cursor: "pointer", padding: 6,
    flexDirection: "column", gap: 4, alignItems: "flex-start",
  },
  hamburgerBar: { width: 20, height: 2, background: "#0b0e0a", borderRadius: 2 },
  mobileTitle: { fontWeight: 800, fontSize: 15, color: "#0b0e0a" },

  overlay: {
    position: "fixed", inset: 0, background: "rgba(11,14,10,0.4)", zIndex: 150,
  },
};

export default AppLayout;