import React from "react";

// TODO: replace with a real call to your backend/wallet provider that
// returns the NFTs actually held by this wallet — e.g. via an indexer like
// Alchemy NFT API, Moralis, or a direct on-chain query. Returns an empty
// array until connected, so the gallery renders honestly with no wallet
// data rather than showing fabricated NFTs.
async function getWalletNfts() {
  return [];
}

function NftGallery() {
  const [nfts, setNfts] = React.useState(null); // null = loading
  const [error, setError] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [collection, setCollection] = React.useState("All");

  React.useEffect(() => {
    let cancelled = false;
    getWalletNfts()
      .then((items) => !cancelled && setNfts(items))
      .catch((err) => !cancelled && setError(err.message || "Failed to load NFTs"));
    return () => {
      cancelled = true;
    };
  }, []);

  const collections = React.useMemo(() => {
    if (!nfts) return ["All"];
    return ["All", ...Array.from(new Set(nfts.map((n) => n.collection)))];
  }, [nfts]);

  const filtered = (nfts || []).filter((n) => {
    const matchesSearch =
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.collection.toLowerCase().includes(search.toLowerCase());
    const matchesCollection = collection === "All" || n.collection === collection;
    return matchesSearch && matchesCollection;
  });

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-nft-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.08) !important; }
        .bf-nft-filter:hover { border-color: rgba(61,92,255,0.4) !important; }
      `}</style>

      <div style={styles.wrap}>
        <div style={styles.header}>
          <a href="/dashboard" style={styles.backBtn} aria-label="Back to dashboard">←</a>
          <h1 style={styles.headerTitle}>NFTs</h1>
        </div>

        {error && <div style={styles.errorBanner}>Couldn't load NFTs: {error}</div>}

        <div style={styles.filters}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search NFTs or collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          {nfts && nfts.length > 0 && (
            <select
              className="bf-nft-filter"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              style={styles.selectFilter}
            >
              {collections.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        {nfts === null ? (
          <div style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={styles.skeletonCard} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🖼️</span>
            <h2 style={styles.emptyTitle}>
              {nfts.length === 0 ? "No NFTs yet" : "No NFTs match your search"}
            </h2>
            <p style={styles.emptyText}>
              {nfts.length === 0
                ? "NFTs you own will appear here once your wallet is connected to an indexer."
                : "Try a different search term or collection filter."}
            </p>
            {nfts.length === 0 && (
              <a href="/discover" style={styles.emptyCta}>Explore Collections</a>
            )}
          </div>
        ) : (
          <div style={styles.grid}>
            {filtered.map((nft) => (
              <a key={nft.id} href={`/nft/${nft.id}`} className="bf-nft-card" style={styles.card}>
                <div style={styles.cardImgWrap}>
                  <img src={nft.image} alt={nft.name} style={styles.cardImg} />
                </div>
                <div style={styles.cardInfo}>
                  <span style={styles.cardCollection}>{nft.collection}</span>
                  <span style={styles.cardName}>{nft.name}</span>
                </div>
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

  filters: { display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" },
  searchWrap: {
    flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 10, background: "#fff",
    border: "1.5px solid rgba(11,14,10,0.1)", borderRadius: 10, padding: "10px 14px",
  },
  searchIcon: { fontSize: 13, opacity: 0.5 },
  searchInput: { border: "none", outline: "none", background: "transparent", fontSize: 13.5, flex: 1, fontFamily: "inherit" },
  selectFilter: {
    border: "1.5px solid rgba(11,14,10,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 13.5,
    fontFamily: "inherit", color: "#0b0e0a", background: "#fff", outline: "none", cursor: "pointer",
    transition: "border-color 0.2s",
  },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 18 },

  card: {
    background: "#fff", borderRadius: 16, overflow: "hidden", textDecoration: "none",
    border: "1px solid rgba(11,14,10,0.06)", transition: "all 0.2s", display: "block",
  },
  cardImgWrap: { width: "100%", aspectRatio: "1 / 1", background: "#f4f4f6", overflow: "hidden" },
  cardImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardInfo: { padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3 },
  cardCollection: { fontSize: 11.5, fontWeight: 600, color: "rgba(11,14,10,0.45)" },
  cardName: { fontSize: 14, fontWeight: 700, color: "#0b0e0a" },

  skeletonCard: { background: "#e8e8ea", borderRadius: 16, aspectRatio: "1 / 1.25", opacity: 0.6 },

  emptyState: { textAlign: "center", padding: "70px 20px" },
  emptyIcon: { fontSize: 40, display: "block", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 800, color: "#0b0e0a", margin: "0 0 8px" },
  emptyText: { fontSize: 14, color: "rgba(11,14,10,0.5)", maxWidth: 340, margin: "0 auto 20px", lineHeight: 1.6 },
  emptyCta: {
    display: "inline-block", background: "#3D5CFF", color: "#fff", textDecoration: "none",
    borderRadius: 999, padding: "12px 26px", fontSize: 13.5, fontWeight: 700,
  },
};

export default NftGallery;