import React from "react";

const CATEGORIES = ["All", "DeFi", "NFT", "Gaming", "Social", "Tools"];

// TODO: replace with a real call to your backend/dApp directory service that
// returns curated or trending dApps — e.g. a CMS-managed list, or an
// aggregator API (DappRadar, etc.). Returns an empty array until connected,
// so the page shows an honest "nothing to discover yet" state rather than
// fabricated dApp listings.
async function getDapps() {
  return [];
}

function Discover() {
  const [dapps, setDapps] = React.useState(null); // null = loading
  const [error, setError] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("All");

  React.useEffect(() => {
    let cancelled = false;
    getDapps()
      .then((items) => !cancelled && setDapps(items))
      .catch((err) => !cancelled && setError(err.message || "Failed to load dApps"));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = (dapps || []).filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || d.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-disc-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.08) !important; }
        .bf-disc-chip:hover { border-color: rgba(61,92,255,0.4) !important; }
      `}</style>

      <div style={styles.wrap}>
        <div style={styles.header}>
          <a href="/dashboard" style={styles.backBtn} aria-label="Back to dashboard">←</a>
          <h1 style={styles.headerTitle}>Discover</h1>
        </div>

        {error && <div style={styles.errorBanner}>Couldn't load dApps: {error}</div>}

        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search dApps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className="bf-disc-chip"
              style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {dapps === null ? (
          <div style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={styles.skeletonCard} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🧭</span>
            <h2 style={styles.emptyTitle}>
              {dapps.length === 0 ? "Nothing to discover yet" : "No dApps match your search"}
            </h2>
            <p style={styles.emptyText}>
              {dapps.length === 0
                ? "Featured and trending dApps will appear here once this directory is connected."
                : "Try a different search term or category."}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((dapp) => (
              <a
                key={dapp.id}
                href={dapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bf-disc-card"
                style={styles.card}
              >
                <div style={styles.cardHead}>
                  <img src={dapp.icon} alt={dapp.name} style={styles.cardIcon} />
                  <div>
                    <div style={styles.cardName}>{dapp.name}</div>
                    <div style={styles.cardCategory}>{dapp.category}</div>
                  </div>
                </div>
                <p style={styles.cardDesc}>{dapp.description}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Inter', -apple-system, sans-serif", background: "#f4f4f6", minHeight: "100vh", padding: "32px 20px" },
  wrap: { maxWidth: 1000, margin: "0 auto" },

  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 },
  backBtn: { fontSize: 18, color: "#0b0e0a", textDecoration: "none" },
  headerTitle: { fontSize: 20, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  errorBanner: { background: "#fef3cd", color: "#8a6d1a", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10, marginBottom: 18 },

  searchWrap: {
    display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid rgba(11,14,10,0.1)",
    borderRadius: 12, padding: "12px 16px", marginBottom: 16,
  },
  searchIcon: { fontSize: 14, opacity: 0.5 },
  searchInput: { border: "none", outline: "none", background: "transparent", fontSize: 14, flex: 1, fontFamily: "inherit" },

  chipRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  chip: {
    background: "#fff", border: "1.5px solid rgba(11,14,10,0.1)", borderRadius: 999, padding: "8px 16px",
    fontSize: 13, fontWeight: 700, color: "#0b0e0a", cursor: "pointer", transition: "border-color 0.2s",
  },
  chipActive: { background: "rgba(61,92,255,0.08)", borderColor: "#3D5CFF", color: "#3D5CFF" },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 },
  card: {
    background: "#fff", borderRadius: 16, padding: "18px", textDecoration: "none",
    border: "1px solid rgba(11,14,10,0.06)", transition: "all 0.2s", display: "block",
  },
  cardHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 },
  cardName: { fontSize: 14.5, fontWeight: 700, color: "#0b0e0a" },
  cardCategory: { fontSize: 11.5, color: "#3D5CFF", fontWeight: 600 },
  cardDesc: { fontSize: 12.5, lineHeight: 1.5, color: "rgba(11,14,10,0.55)", margin: 0 },

  skeletonCard: { background: "#e8e8ea", borderRadius: 16, height: 110, opacity: 0.6 },

  emptyState: { textAlign: "center", padding: "70px 20px" },
  emptyIcon: { fontSize: 40, display: "block", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 800, color: "#0b0e0a", margin: "0 0 8px" },
  emptyText: { fontSize: 14, color: "rgba(11,14,10,0.5)", maxWidth: 380, margin: "0 auto", lineHeight: 1.6 },
};

export default Discover;