import React from "react";

// TODO: replace with a real call to your backend/NFT indexer (Alchemy,
// Moralis, etc.) that fetches full metadata for this specific NFT — image,
// description, attributes/traits, contract address, token ID, and current
// owner. Returns null until connected, so the page shows an honest
// "not found" state rather than fabricated NFT data.
async function getNftById(id) {
  return null;
}

function NftDetail({ id = "" }) {
  const [nft, setNft] = React.useState(undefined); // undefined = loading, null = not found
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    setNft(undefined);
    getNftById(id)
      .then((data) => !cancelled && setNft(data))
      .catch((err) => !cancelled && setError(err.message || "Failed to load NFT"));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-nftd-cta:hover { background: #2A47E0 !important; }
        .bf-nftd-copy:hover { background: #eef0f4 !important; }
      `}</style>

      <div style={styles.wrap}>
        <div style={styles.header}>
          <a href="/nfts" style={styles.backBtn} aria-label="Back to NFTs">←</a>
          <h1 style={styles.headerTitle}>NFT Details</h1>
        </div>

        {error && <div style={styles.errorBanner}>Couldn't load NFT: {error}</div>}

        {nft === undefined ? (
          <div style={styles.loadingWrap}>
            <div style={styles.imageSkeleton} />
            <div style={styles.textSkeleton} />
            <div style={{ ...styles.textSkeleton, width: "60%" }} />
          </div>
        ) : nft === null ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🖼️</span>
            <h2 style={styles.emptyTitle}>NFT not found</h2>
            <p style={styles.emptyText}>
              This NFT couldn't be found in your wallet, or your wallet isn't
              connected to an NFT indexer yet.
            </p>
            <a href="/nfts" style={styles.emptyCta}>Back to Gallery</a>
          </div>
        ) : (
          <>
            <div style={styles.imageWrap}>
              <img src={nft.image} alt={nft.name} style={styles.image} />
            </div>

            <div style={styles.infoCard}>
              <span style={styles.collection}>{nft.collection}</span>
              <h2 style={styles.name}>{nft.name}</h2>
              {nft.description && <p style={styles.description}>{nft.description}</p>}

              <div style={styles.actionsRow}>
                <button className="bf-nftd-cta" style={styles.primaryBtn}>Send NFT</button>
              </div>
            </div>

            {nft.attributes && nft.attributes.length > 0 && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Attributes</h3>
                <div style={styles.attrGrid}>
                  {nft.attributes.map((attr, i) => (
                    <div key={i} style={styles.attrCard}>
                      <span style={styles.attrType}>{attr.trait_type}</span>
                      <span style={styles.attrValue}>{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Details</h3>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Contract Address</span>
                <span style={styles.detailValueMono}>{nft.contractAddress}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Token ID</span>
                <span style={styles.detailValueMono}>{nft.tokenId}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Blockchain</span>
                <span style={styles.detailValue}>{nft.chain}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Owner</span>
                <span style={styles.detailValueMono}>{nft.owner}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Inter', -apple-system, sans-serif", background: "#f4f4f6", minHeight: "100vh", padding: "32px 20px" },
  wrap: { maxWidth: 560, margin: "0 auto" },

  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 },
  backBtn: { fontSize: 18, color: "#0b0e0a", textDecoration: "none" },
  headerTitle: { fontSize: 19, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  errorBanner: { background: "#fef3cd", color: "#8a6d1a", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10, marginBottom: 18 },

  loadingWrap: { display: "flex", flexDirection: "column", gap: 14 },
  imageSkeleton: { width: "100%", aspectRatio: "1 / 1", borderRadius: 20, background: "rgba(11,14,10,0.06)" },
  textSkeleton: { height: 18, width: "80%", borderRadius: 6, background: "rgba(11,14,10,0.06)" },

  imageWrap: { width: "100%", aspectRatio: "1 / 1", borderRadius: 20, overflow: "hidden", background: "#fff", border: "1px solid rgba(11,14,10,0.06)", marginBottom: 20 },
  image: { width: "100%", height: "100%", objectFit: "cover", display: "block" },

  infoCard: { background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 20, border: "1px solid rgba(11,14,10,0.06)" },
  collection: { fontSize: 12.5, fontWeight: 700, color: "#3D5CFF" },
  name: { fontSize: 20, fontWeight: 800, color: "#0b0e0a", margin: "6px 0 12px" },
  description: { fontSize: 14, lineHeight: 1.6, color: "rgba(11,14,10,0.6)", margin: "0 0 20px" },

  actionsRow: { display: "flex", gap: 10 },
  primaryBtn: {
    background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999, padding: "13px 26px",
    fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.2s",
  },

  section: { background: "#fff", borderRadius: 20, padding: "22px 24px", marginBottom: 20, border: "1px solid rgba(11,14,10,0.06)" },
  sectionTitle: { fontSize: 15, fontWeight: 800, color: "#0b0e0a", margin: "0 0 16px" },

  attrGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  attrCard: { background: "#f9f9fa", borderRadius: 10, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 3 },
  attrType: { fontSize: 11, fontWeight: 600, color: "rgba(11,14,10,0.45)", textTransform: "uppercase" },
  attrValue: { fontSize: 13.5, fontWeight: 700, color: "#0b0e0a" },

  detailRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid rgba(11,14,10,0.05)" },
  detailLabel: { fontSize: 13, color: "rgba(11,14,10,0.5)" },
  detailValue: { fontSize: 13, fontWeight: 600, color: "#0b0e0a" },
  detailValueMono: { fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: "#0b0e0a" },

  emptyState: { textAlign: "center", padding: "70px 20px" },
  emptyIcon: { fontSize: 40, display: "block", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 800, color: "#0b0e0a", margin: "0 0 8px" },
  emptyText: { fontSize: 14, color: "rgba(11,14,10,0.5)", maxWidth: 340, margin: "0 auto 20px", lineHeight: 1.6 },
  emptyCta: {
    display: "inline-block", background: "#3D5CFF", color: "#fff", textDecoration: "none",
    borderRadius: 999, padding: "12px 26px", fontSize: 13.5, fontWeight: 700,
  },
};

export default NftDetail;