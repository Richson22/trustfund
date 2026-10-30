import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../auth/AuthContext";

// Same token metadata as Dashboard.jsx / Send.jsx — see note there about
// sharing this from one file in a real app.
const TOKEN_META = {
  BTC: { name: "Bitcoin", icon: "₿", color: "#F7931A" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "#627EEA" },
  BNB: { name: "BNB Smart Chain", icon: "◆", color: "#F0B90B" },
  SOL: { name: "Solana", icon: "◎", color: "#14F195" },
  USDT: { name: "Tether", icon: "T", color: "#26A17B" },
  XRP: { name: "XRP", icon: "✕", color: "#23292F" },
};

// TODO: replace with a real call to your backend/wallet provider that
// returns this wallet's actual receive address for the given asset (e.g.
// derived from the user's public key, or an address from your custody
// backend). Returns null until connected, so the UI shows an honest
// "no address yet" state instead of a fabricated one.
// The same 0x address works on Ethereum and BNB Smart Chain. BTC, SOL and XRP
// can't be received by this kind of wallet, so they return null and are hidden.
const SUPPORTED = {
  USDT: "BNB Smart Chain (BEP-20)",
  BNB: "BNB Smart Chain (BEP-20)",
  ETH: "Ethereum (ERC-20)",
};

async function getReceiveAddress(sym, walletAddress) {
  return SUPPORTED[sym] ? walletAddress || null : null;
}

function Receive() {
  const { token: walletAddress } = useAuth(); // login() stored the wallet address
  const [selectedSym, setSelectedSym] = React.useState("USDT");
  const [address, setAddress] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCopied(false);
    getReceiveAddress(selectedSym, walletAddress).then((addr) => {
      if (!cancelled) {
        setAddress(addr);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSym, walletAddress]);

  function handleCopy() {
    if (!address) return;
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }



  const meta = TOKEN_META[selectedSym];

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-receive-chip:hover { background: rgba(11,14,10,0.05) !important; }
        .bf-receive-copy:hover { background: #2A47E0 !important; }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          <a href="/dashboard" style={styles.backBtn} aria-label="Back to dashboard">←</a>
          <h1 style={styles.headerTitle}>Receive</h1>
        </div>

        <label style={styles.label}>Select asset</label>
        <div style={styles.chipRow}>
          {Object.entries(TOKEN_META).filter(([sym]) => SUPPORTED[sym]).map(([sym, m]) => (
            <button
              key={sym}
              className="bf-receive-chip"
              style={{
                ...styles.chip,
                ...(selectedSym === sym ? styles.chipActive : {}),
              }}
              onClick={() => setSelectedSym(sym)}
            >
              <span style={{ ...styles.chipIcon, background: m.color }}>{m.icon}</span>
              {sym}
            </button>
          ))}
        </div>

        <div style={styles.qrWrap}>
          {loading ? (
            <div style={styles.qrSkeleton} />
          ) : address ? (
            <QRCodeSVG value={address} size={200} level="M" includeMargin />
          ) : (
            <div style={styles.qrEmpty}>
              <span style={styles.qrEmptyIcon}>🔗</span>
              <p style={styles.qrEmptyText}>
                No {selectedSym} address yet. Connect your wallet to generate a
                receive address.
              </p>
            </div>
          )}
        </div>

        {address && (
          <>
            <div style={styles.addressBox}>
              <span style={styles.addressText}>{address}</span>
            </div>
            <button className="bf-receive-copy" style={styles.copyBtn} onClick={handleCopy}>
              {copied ? "✓ Copied" : "Copy Address"}
            </button>
            <p style={styles.warning}>
              Only send {selectedSym} on the {SUPPORTED[selectedSym]} network to this
              address. Anything sent on another network, or any other asset, may be lost permanently.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Inter', -apple-system, sans-serif", background: "#f4f4f6", minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  },
  card: {
    width: "100%", maxWidth: 420, background: "#fff", borderRadius: 24, padding: "32px 28px",
    border: "1px solid rgba(11,14,10,0.06)", textAlign: "center",
  },

  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24, textAlign: "left" },
  backBtn: { fontSize: 18, color: "#0b0e0a", textDecoration: "none" },
  headerTitle: { fontSize: 19, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  label: { display: "block", fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.6)", margin: "0 0 10px", textAlign: "left" },

  chipRow: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  chip: {
    display: "flex", alignItems: "center", gap: 6, background: "#f9f9fa", border: "1.5px solid transparent",
    borderRadius: 999, padding: "8px 12px", fontSize: 13, fontWeight: 700, color: "#0b0e0a", cursor: "pointer",
  },
  chipActive: { borderColor: "#3D5CFF", background: "rgba(61,92,255,0.06)" },
  chipIcon: {
    width: 18, height: 18, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 9, fontWeight: 800,
  },

  qrWrap: {
    width: 220, height: 220, margin: "0 auto 24px", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#f9f9fa", borderRadius: 16, overflow: "hidden",
  },
  qrImg: { width: 220, height: 220, display: "block" },
  qrSkeleton: { width: 180, height: 180, borderRadius: 10, background: "rgba(11,14,10,0.06)" },
  qrEmpty: { padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  qrEmptyIcon: { fontSize: 26 },
  qrEmptyText: { fontSize: 12.5, color: "rgba(11,14,10,0.5)", lineHeight: 1.5, margin: 0 },

  addressBox: {
    background: "#f9f9fa", borderRadius: 12, padding: "14px 16px", marginBottom: 14,
    wordBreak: "break-all",
  },
  addressText: { fontSize: 13, fontFamily: "monospace", color: "#0b0e0a" },

  copyBtn: {
    width: "100%", background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999,
    padding: "14px 24px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", transition: "background 0.2s",
  },

  warning: { fontSize: 12, color: "rgba(11,14,10,0.45)", lineHeight: 1.6, marginTop: 16 },
};

export default Receive;