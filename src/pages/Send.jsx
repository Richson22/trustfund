import React from "react";

// Same token metadata + live-data functions as Dashboard.jsx, kept in sync.
// In a real app these would live in one shared file (e.g. lib/wallet.js) and
// be imported by both Dashboard and Send — duplicated here only so this
// component works standalone.
const TOKEN_META = {
  BTC: { name: "Bitcoin", icon: "₿", color: "#F7931A", coingeckoId: "bitcoin" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "#627EEA", coingeckoId: "ethereum" },
  BNB: { name: "BNB Smart Chain", icon: "◆", color: "#F0B90B", coingeckoId: "binancecoin" },
  SOL: { name: "Solana", icon: "◎", color: "#14F195", coingeckoId: "solana" },
  USDT: { name: "Tether", icon: "T", color: "#26A17B", coingeckoId: "tether" },
  XRP: { name: "XRP", icon: "✕", color: "#23292F", coingeckoId: "ripple" },
};

function formatUsd(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function fetchLivePrices(symbols) {
  const ids = symbols.map((s) => TOKEN_META[s].coingeckoId).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
  );
  if (!res.ok) throw new Error("Failed to fetch live prices");
  const data = await res.json();
  const bySymbol = {};
  symbols.forEach((sym) => {
    bySymbol[sym] = data[TOKEN_META[sym].coingeckoId]?.usd ?? 0;
  });
  return bySymbol;
}

// TODO: replace with a real wallet/backend call, same as Dashboard.jsx.
async function getWalletHoldings() {
  return Object.keys(TOKEN_META).map((sym) => ({ sym, amt: 0 }));
}

// TODO: replace with your actual send transaction call — e.g. a signed
// on-chain transaction via ethers.js/web3.js, or a backend endpoint that
// handles custody-side transfers. This placeholder simulates network delay
// and always "succeeds" so the UI flow can be reviewed end to end.
async function submitSendTransaction({ sym, amount, address }) {
  await new Promise((resolve) => setTimeout(resolve, 1400));
  return { txHash: "0x" + Math.random().toString(16).slice(2, 10) + "…" + Math.random().toString(16).slice(2, 6) };
}

function isValidAddressShape(address) {
  // Minimal placeholder check — real validation should be chain-specific
  // (checksum for ETH/BNB, base58 for BTC, etc.). Swap in a proper validator
  // per asset before going to production.
  return address.trim().length >= 12;
}

function Send() {
  const [step, setStep] = React.useState("select"); // "select" | "review" | "sending" | "success" | "error"
  const [assets, setAssets] = React.useState(null);
  const [error, setError] = React.useState(null);

  const [selectedSym, setSelectedSym] = React.useState(null);
  const [amount, setAmount] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [addressTouched, setAddressTouched] = React.useState(false);
  const [txResult, setTxResult] = React.useState(null);
  const [sendError, setSendError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const symbols = Object.keys(TOKEN_META);
        const [prices, holdings] = await Promise.all([fetchLivePrices(symbols), getWalletHoldings()]);
        if (cancelled) return;
        const merged = holdings.map((h) => ({
          sym: h.sym,
          amt: h.amt,
          name: TOKEN_META[h.sym].name,
          icon: TOKEN_META[h.sym].icon,
          color: TOKEN_META[h.sym].color,
          price: prices[h.sym] ?? 0,
        }));
        setAssets(merged);
        setSelectedSym((prev) => prev ?? merged[0]?.sym ?? null);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load wallet data");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAsset = (assets || []).find((a) => a.sym === selectedSym) || null;
  const amountNum = parseFloat(amount) || 0;
  const amountUsd = selectedAsset ? amountNum * selectedAsset.price : 0;
  const insufficientBalance = selectedAsset ? amountNum > selectedAsset.amt : false;
  const addressValid = isValidAddressShape(address);

  const canReview =
    selectedAsset && amountNum > 0 && !insufficientBalance && addressValid;

  async function handleConfirmSend() {
    setStep("sending");
    setSendError(null);
    try {
      const result = await submitSendTransaction({ sym: selectedSym, amount: amountNum, address });
      setTxResult(result);
      setStep("success");
    } catch (err) {
      setSendError(err.message || "Transaction failed. Please try again.");
      setStep("review");
    }
  }

  function resetFlow() {
    setStep("select");
    setAmount("");
    setAddress("");
    setAddressTouched(false);
    setTxResult(null);
    setSendError(null);
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-send-asset:hover { background: rgba(11,14,10,0.03) !important; }
        .bf-send-cta:hover:not(:disabled) { background: #2A47E0 !important; }
        .bf-send-max:hover { text-decoration: underline; }
        @keyframes bf-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          {step !== "select" && step !== "success" && (
            <button
              style={styles.backBtn}
              onClick={() => setStep(step === "review" ? "select" : "select")}
              aria-label="Back"
            >
              ←
            </button>
          )}
          <h1 style={styles.headerTitle}>
            {step === "select" && "Send"}
            {step === "review" && "Review Transaction"}
            {step === "sending" && "Sending…"}
            {step === "success" && "Sent"}
          </h1>
        </div>

        {error && <div style={styles.errorBanner}>Couldn't load wallet data: {error}</div>}

        {/* ── Step: select asset, amount, address ── */}
        {step === "select" && (
          <>
            <label style={styles.label}>Asset</label>
            <div style={styles.assetList}>
              {assets === null ? (
                <div style={styles.loadingRow}>Loading your assets…</div>
              ) : (
                assets.map((a) => (
                  <button
                    key={a.sym}
                    className="bf-send-asset"
                    style={{
                      ...styles.assetOption,
                      ...(selectedSym === a.sym ? styles.assetOptionActive : {}),
                    }}
                    onClick={() => setSelectedSym(a.sym)}
                  >
                    <span style={{ ...styles.assetIconCircle, background: a.color }}>{a.icon}</span>
                    <span style={styles.assetOptionInfo}>
                      <span style={styles.assetOptionSym}>{a.sym}</span>
                      <span style={styles.assetOptionBalance}>
                        {a.amt} {a.sym} · {formatUsd(a.amt * a.price)}
                      </span>
                    </span>
                    {selectedSym === a.sym && <span style={styles.checkMark}>✓</span>}
                  </button>
                ))
              )}
            </div>

            <label style={styles.label}>Recipient address</label>
            <input
              type="text"
              placeholder={`Enter ${selectedSym || "wallet"} address`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onBlur={() => setAddressTouched(true)}
              style={{
                ...styles.input,
                ...(addressTouched && address && !addressValid ? styles.inputError : {}),
              }}
            />
            {addressTouched && address && !addressValid && (
              <span style={styles.fieldError}>This doesn't look like a valid address.</span>
            )}

            <label style={styles.label}>Amount</label>
            <div style={styles.amountWrap}>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.amountInput}
                min="0"
                step="any"
              />
              <span style={styles.amountSym}>{selectedSym}</span>
              <button
                type="button"
                className="bf-send-max"
                style={styles.maxBtn}
                onClick={() => selectedAsset && setAmount(String(selectedAsset.amt))}
                disabled={!selectedAsset}
              >
                Max
              </button>
            </div>
            <div style={styles.amountUsdRow}>
              <span>{amount ? formatUsd(amountUsd) : formatUsd(0)}</span>
              {selectedAsset && (
                <span style={styles.availableText}>
                  Available: {selectedAsset.amt} {selectedAsset.sym}
                </span>
              )}
            </div>
            {insufficientBalance && (
              <span style={styles.fieldError}>Insufficient balance for this amount.</span>
            )}

            <button
              className="bf-send-cta"
              style={styles.primaryBtn}
              disabled={!canReview}
              onClick={() => canReview && setStep("review")}
            >
              Review Send
            </button>
          </>
        )}

        {/* ── Step: review ── */}
        {(step === "review" || step === "sending") && selectedAsset && (
          <>
            <div style={styles.reviewCard}>
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>You're sending</span>
                <span style={styles.reviewValueBig}>
                  {amountNum} {selectedAsset.sym}
                </span>
                <span style={styles.reviewValueSub}>{formatUsd(amountUsd)}</span>
              </div>
              <div style={styles.reviewDivider} />
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>To</span>
                <span style={styles.reviewValueMono}>{address}</span>
              </div>
              <div style={styles.reviewDivider} />
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>Network fee</span>
                <span style={styles.reviewValue}>Estimated at broadcast</span>
              </div>
            </div>

            {sendError && <div style={styles.errorBanner}>{sendError}</div>}

            <button
              className="bf-send-cta"
              style={styles.primaryBtn}
              disabled={step === "sending"}
              onClick={handleConfirmSend}
            >
              {step === "sending" ? (
                <>
                  <span style={styles.spinner} /> Sending
                </>
              ) : (
                "Confirm & Send"
              )}
            </button>
          </>
        )}

        {/* ── Step: success ── */}
        {step === "success" && (
          <div style={styles.successWrap}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Transaction submitted</h2>
            <p style={styles.successText}>
              Your {selectedAsset?.sym} is on its way. It may take a few minutes to confirm
              on-chain.
            </p>
            {txResult && <div style={styles.txHash}>Tx: {txResult.txHash}</div>}
            <button className="bf-send-cta" style={styles.primaryBtn} onClick={resetFlow}>
              Done
            </button>
          </div>
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
    width: "100%", maxWidth: 460, background: "#fff", borderRadius: 24, padding: "32px 28px",
    border: "1px solid rgba(11,14,10,0.06)",
  },

  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
  backBtn: { background: "transparent", border: "none", fontSize: 18, cursor: "pointer", padding: 4, color: "#0b0e0a" },
  headerTitle: { fontSize: 19, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  errorBanner: { background: "#fef3cd", color: "#8a6d1a", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10, marginBottom: 18 },

  label: { display: "block", fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.6)", margin: "18px 0 8px" },

  assetList: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" },
  loadingRow: { padding: "16px 4px", fontSize: 13.5, color: "rgba(11,14,10,0.4)" },
  assetOption: {
    display: "flex", alignItems: "center", gap: 12, background: "#f9f9fa", border: "1.5px solid transparent",
    borderRadius: 12, padding: "10px 14px", cursor: "pointer", textAlign: "left", width: "100%",
  },
  assetOptionActive: { borderColor: "#3D5CFF", background: "rgba(61,92,255,0.05)" },
  assetIconCircle: {
    width: 32, height: 32, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0,
  },
  assetOptionInfo: { display: "flex", flexDirection: "column", flex: 1 },
  assetOptionSym: { fontSize: 14, fontWeight: 700, color: "#0b0e0a" },
  assetOptionBalance: { fontSize: 12, color: "rgba(11,14,10,0.45)" },
  checkMark: { color: "#3D5CFF", fontWeight: 800 },

  input: {
    width: "100%", border: "1.5px solid rgba(11,14,10,0.15)", borderRadius: 10, padding: "13px 14px",
    fontSize: 14.5, fontFamily: "inherit", color: "#0b0e0a", outline: "none",
  },
  inputError: { borderColor: "#f6465d" },
  fieldError: { display: "block", fontSize: 12.5, color: "#f6465d", marginTop: 6, fontWeight: 600 },

  amountWrap: {
    display: "flex", alignItems: "center", gap: 8, border: "1.5px solid rgba(11,14,10,0.15)",
    borderRadius: 10, padding: "6px 14px",
  },
  amountInput: {
    flex: 1, border: "none", outline: "none", fontSize: 18, fontWeight: 700, fontFamily: "inherit",
    color: "#0b0e0a", padding: "7px 0",
  },
  amountSym: { fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.5)" },
  maxBtn: { background: "transparent", border: "none", color: "#3D5CFF", fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: "4px 0 4px 8px", borderLeft: "1px solid rgba(11,14,10,0.1)" },
  amountUsdRow: { display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "rgba(11,14,10,0.5)", marginTop: 8 },
  availableText: { color: "rgba(11,14,10,0.4)" },

  primaryBtn: {
    width: "100%", background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999,
    padding: "15px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 26,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    transition: "background 0.2s", opacity: 1,
  },
  spinner: {
    width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "bf-spin 0.7s linear infinite",
  },

  reviewCard: { background: "#f9f9fa", borderRadius: 14, padding: "20px 20px 8px" },
  reviewRow: { display: "flex", flexDirection: "column", padding: "10px 0" },
  reviewLabel: { fontSize: 12.5, fontWeight: 600, color: "rgba(11,14,10,0.5)", marginBottom: 4 },
  reviewValue: { fontSize: 14, fontWeight: 600, color: "#0b0e0a" },
  reviewValueBig: { fontSize: 22, fontWeight: 800, color: "#0b0e0a" },
  reviewValueSub: { fontSize: 13, color: "rgba(11,14,10,0.45)", marginTop: 2 },
  reviewValueMono: { fontSize: 13, fontFamily: "monospace", color: "#0b0e0a", wordBreak: "break-all" },
  reviewDivider: { height: 1, background: "rgba(11,14,10,0.06)" },

  successWrap: { textAlign: "center", padding: "8px 0" },
  successIcon: {
    width: 56, height: 56, borderRadius: "50%", background: "#0ecb81", color: "#fff",
    fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 18px",
  },
  successTitle: { fontSize: 19, fontWeight: 800, color: "#0b0e0a", margin: "0 0 8px" },
  successText: { fontSize: 14, color: "rgba(11,14,10,0.55)", lineHeight: 1.6, margin: "0 0 16px" },
  txHash: {
    fontSize: 12, fontFamily: "monospace", color: "rgba(11,14,10,0.5)", background: "#f9f9fa",
    borderRadius: 8, padding: "10px 14px", marginBottom: 8, wordBreak: "break-all",
  },
};

export default Send;