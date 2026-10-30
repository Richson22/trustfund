import React from "react";

// Same token metadata as Dashboard.jsx / Send.jsx / Receive.jsx / AssetDetail.jsx.
const TOKEN_META = {
  BTC: { name: "Bitcoin", icon: "₿", color: "#F7931A", coingeckoId: "bitcoin" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "#627EEA", coingeckoId: "ethereum" },
  BNB: { name: "BNB Smart Chain", icon: "◆", color: "#F0B90B", coingeckoId: "binancecoin" },
  SOL: { name: "Solana", icon: "◎", color: "#14F195", coingeckoId: "solana" },
  USDT: { name: "Tether", icon: "T", color: "#26A17B", coingeckoId: "tether" },
  XRP: { name: "XRP", icon: "✕", color: "#23292F", coingeckoId: "ripple" },
};

function formatUsd(n) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

// TODO: replace with a real wallet/backend call, same pattern as Dashboard.jsx.
async function getWalletHoldings() {
  return Object.keys(TOKEN_META).map((sym) => ({ sym, amt: 0 }));
}

// TODO: replace with a real swap execution call — e.g. a DEX aggregator API
// (1inch, 0x, Jupiter, etc.) for the quote + on-chain swap transaction, or a
// backend endpoint that handles custody-side swaps. This placeholder
// simulates network delay and always "succeeds" so the UI flow can be
// reviewed end to end. The exchange rate used here is a naive USD-value
// conversion (fromPrice / toPrice) — a real integration should use the
// aggregator's actual quoted rate, which includes liquidity/slippage.
async function submitSwap({ fromSym, toSym, fromAmount, toAmount }) {
  await new Promise((resolve) => setTimeout(resolve, 1400));
  return { txHash: "0x" + Math.random().toString(16).slice(2, 10) + "…" + Math.random().toString(16).slice(2, 6) };
}

const SWAP_FEE_PCT = 0.3; // placeholder protocol fee — replace with your real fee schedule

function Swap() {
  const [prices, setPrices] = React.useState(null);
  const [holdings, setHoldings] = React.useState(null);
  const [error, setError] = React.useState(null);

  const [fromSym, setFromSym] = React.useState("ETH");
  const [toSym, setToSym] = React.useState("USDT");
  const [fromAmount, setFromAmount] = React.useState("");
  const [pickerOpen, setPickerOpen] = React.useState(null); // "from" | "to" | null

  const [step, setStep] = React.useState("form"); // "form" | "review" | "swapping" | "success"
  const [txResult, setTxResult] = React.useState(null);
  const [swapError, setSwapError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const symbols = Object.keys(TOKEN_META);
        const [p, h] = await Promise.all([fetchLivePrices(symbols), getWalletHoldings()]);
        if (cancelled) return;
        setPrices(p);
        setHoldings(h);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load market data");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fromHolding = (holdings || []).find((h) => h.sym === fromSym)?.amt ?? 0;
  const fromAmountNum = parseFloat(fromAmount) || 0;
  const fromPrice = prices?.[fromSym] ?? 0;
  const toPrice = prices?.[toSym] ?? 0;

  // Naive rate = relative USD value. A real DEX/aggregator quote would replace this.
  const rate = toPrice > 0 ? fromPrice / toPrice : 0;
  const grossToAmount = fromAmountNum * rate;
  const feeAmount = grossToAmount * (SWAP_FEE_PCT / 100);
  const toAmount = grossToAmount - feeAmount;

  const insufficientBalance = fromAmountNum > fromHolding;
  const canReview = fromSym !== toSym && fromAmountNum > 0 && !insufficientBalance && prices;

  function handleSwapDirection() {
    setFromSym(toSym);
    setToSym(fromSym);
    setFromAmount("");
  }

  async function handleConfirmSwap() {
    setStep("swapping");
    setSwapError(null);
    try {
      const result = await submitSwap({ fromSym, toSym, fromAmount: fromAmountNum, toAmount });
      setTxResult(result);
      setStep("success");
    } catch (err) {
      setSwapError(err.message || "Swap failed. Please try again.");
      setStep("review");
    }
  }

  function resetFlow() {
    setStep("form");
    setFromAmount("");
    setTxResult(null);
    setSwapError(null);
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-swap-token:hover { background: rgba(11,14,10,0.04) !important; }
        .bf-swap-cta:hover:not(:disabled) { background: #2A47E0 !important; }
        .bf-swap-flip:hover { background: #eef0f4 !important; transform: rotate(180deg); }
        .bf-swap-max:hover { text-decoration: underline; }
        @keyframes bf-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          {step !== "form" && step !== "success" && (
            <button style={styles.backBtn} onClick={() => setStep("form")} aria-label="Back">←</button>
          )}
          <h1 style={styles.headerTitle}>
            {step === "form" && "Swap"}
            {step === "review" && "Review Swap"}
            {step === "swapping" && "Swapping…"}
            {step === "success" && "Swap Complete"}
          </h1>
        </div>

        {error && <div style={styles.errorBanner}>Couldn't load market data: {error}</div>}

        {/* ── Step: form ── */}
        {step === "form" && (
          <>
            <div style={styles.swapBox}>
              <div style={styles.swapBoxHead}>
                <span style={styles.swapBoxLabel}>From</span>
                <span style={styles.swapBoxBalance}>
                  Balance: {fromHolding} {fromSym}
                </span>
              </div>
              <div style={styles.swapBoxRow}>
                <input
                  type="number"
                  placeholder="0.00"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  style={styles.swapAmountInput}
                  min="0"
                  step="any"
                />
                <button
                  style={styles.tokenPickerBtn}
                  onClick={() => setPickerOpen(pickerOpen === "from" ? null : "from")}
                >
                  <span style={{ ...styles.tokenIconCircle, background: TOKEN_META[fromSym].color }}>
                    {TOKEN_META[fromSym].icon}
                  </span>
                  {fromSym}
                  <span style={styles.caret}>▾</span>
                </button>
              </div>
              <div style={styles.swapBoxFoot}>
                <span>{fromAmount ? formatUsd(fromAmountNum * fromPrice) : formatUsd(0)}</span>
                <button
                  type="button"
                  className="bf-swap-max"
                  style={styles.maxBtn}
                  onClick={() => setFromAmount(String(fromHolding))}
                >
                  Max
                </button>
              </div>

              {pickerOpen === "from" && (
                <TokenPicker
                  exclude={toSym}
                  onSelect={(sym) => {
                    setFromSym(sym);
                    setPickerOpen(null);
                  }}
                />
              )}
            </div>

            <button className="bf-swap-flip" style={styles.flipBtn} onClick={handleSwapDirection} aria-label="Swap direction">
              ⇅
            </button>

            <div style={styles.swapBox}>
              <div style={styles.swapBoxHead}>
                <span style={styles.swapBoxLabel}>To (estimated)</span>
              </div>
              <div style={styles.swapBoxRow}>
                <span style={styles.swapAmountDisplay}>{toAmount > 0 ? toAmount.toFixed(6) : "0.00"}</span>
                <button
                  style={styles.tokenPickerBtn}
                  onClick={() => setPickerOpen(pickerOpen === "to" ? null : "to")}
                >
                  <span style={{ ...styles.tokenIconCircle, background: TOKEN_META[toSym].color }}>
                    {TOKEN_META[toSym].icon}
                  </span>
                  {toSym}
                  <span style={styles.caret}>▾</span>
                </button>
              </div>
              <div style={styles.swapBoxFoot}>
                <span>{formatUsd(toAmount * toPrice)}</span>
              </div>

              {pickerOpen === "to" && (
                <TokenPicker
                  exclude={fromSym}
                  onSelect={(sym) => {
                    setToSym(sym);
                    setPickerOpen(null);
                  }}
                />
              )}
            </div>

            {fromAmountNum > 0 && !insufficientBalance && rate > 0 && (
              <div style={styles.rateRow}>
                1 {fromSym} ≈ {rate.toFixed(6)} {toSym}
              </div>
            )}
            {insufficientBalance && (
              <span style={styles.fieldError}>Insufficient {fromSym} balance for this amount.</span>
            )}

            <button
              className="bf-swap-cta"
              style={styles.primaryBtn}
              disabled={!canReview}
              onClick={() => canReview && setStep("review")}
            >
              Review Swap
            </button>
          </>
        )}

        {/* ── Step: review / swapping ── */}
        {(step === "review" || step === "swapping") && (
          <>
            <div style={styles.reviewCard}>
              <div style={styles.reviewSwapRow}>
                <div style={styles.reviewToken}>
                  <span style={{ ...styles.tokenIconCircle, background: TOKEN_META[fromSym].color }}>
                    {TOKEN_META[fromSym].icon}
                  </span>
                  <div>
                    <div style={styles.reviewTokenAmt}>{fromAmountNum} {fromSym}</div>
                    <div style={styles.reviewTokenUsd}>{formatUsd(fromAmountNum * fromPrice)}</div>
                  </div>
                </div>
                <span style={styles.reviewArrow}>→</span>
                <div style={styles.reviewToken}>
                  <span style={{ ...styles.tokenIconCircle, background: TOKEN_META[toSym].color }}>
                    {TOKEN_META[toSym].icon}
                  </span>
                  <div>
                    <div style={styles.reviewTokenAmt}>{toAmount.toFixed(6)} {toSym}</div>
                    <div style={styles.reviewTokenUsd}>{formatUsd(toAmount * toPrice)}</div>
                  </div>
                </div>
              </div>
              <div style={styles.reviewDivider} />
              <div style={styles.reviewDetailRow}>
                <span style={styles.reviewLabel}>Rate</span>
                <span style={styles.reviewValue}>1 {fromSym} ≈ {rate.toFixed(6)} {toSym}</span>
              </div>
              <div style={styles.reviewDetailRow}>
                <span style={styles.reviewLabel}>Fee ({SWAP_FEE_PCT}%)</span>
                <span style={styles.reviewValue}>{feeAmount.toFixed(6)} {toSym}</span>
              </div>
              <div style={styles.reviewDetailRow}>
                <span style={styles.reviewLabel}>Network fee</span>
                <span style={styles.reviewValue}>Estimated at broadcast</span>
              </div>
            </div>

            {swapError && <div style={styles.errorBanner}>{swapError}</div>}

            <button
              className="bf-swap-cta"
              style={styles.primaryBtn}
              disabled={step === "swapping"}
              onClick={handleConfirmSwap}
            >
              {step === "swapping" ? (
                <>
                  <span style={styles.spinner} /> Swapping
                </>
              ) : (
                "Confirm Swap"
              )}
            </button>
          </>
        )}

        {/* ── Step: success ── */}
        {step === "success" && (
          <div style={styles.successWrap}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Swap submitted</h2>
            <p style={styles.successText}>
              Swapping {fromAmountNum} {fromSym} for approximately {toAmount.toFixed(6)} {toSym}.
              This may take a few minutes to confirm on-chain.
            </p>
            {txResult && <div style={styles.txHash}>Tx: {txResult.txHash}</div>}
            <button className="bf-swap-cta" style={styles.primaryBtn} onClick={resetFlow}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TokenPicker({ exclude, onSelect }) {
  return (
    <div style={styles.pickerDropdown}>
      {Object.entries(TOKEN_META)
        .filter(([sym]) => sym !== exclude)
        .map(([sym, m]) => (
          <button key={sym} className="bf-swap-token" style={styles.pickerOption} onClick={() => onSelect(sym)}>
            <span style={{ ...styles.tokenIconCircle, background: m.color }}>{m.icon}</span>
            <span style={styles.pickerOptionInfo}>
              <span style={styles.pickerOptionSym}>{sym}</span>
              <span style={styles.pickerOptionName}>{m.name}</span>
            </span>
          </button>
        ))}
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Inter', -apple-system, sans-serif", background: "#f4f4f6", minHeight: "100vh",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
  },
  card: {
    width: "100%", maxWidth: 440, background: "#fff", borderRadius: 24, padding: "32px 28px",
    border: "1px solid rgba(11,14,10,0.06)",
  },

  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 24 },
  backBtn: { background: "transparent", border: "none", fontSize: 18, cursor: "pointer", padding: 4, color: "#0b0e0a" },
  headerTitle: { fontSize: 19, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  errorBanner: { background: "#fef3cd", color: "#8a6d1a", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10, marginBottom: 18 },

  swapBox: { background: "#f9f9fa", borderRadius: 16, padding: "16px 18px", position: "relative" },
  swapBoxHead: { display: "flex", justifyContent: "space-between", marginBottom: 10 },
  swapBoxLabel: { fontSize: 12.5, fontWeight: 700, color: "rgba(11,14,10,0.5)" },
  swapBoxBalance: { fontSize: 12, color: "rgba(11,14,10,0.4)" },
  swapBoxRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  swapAmountInput: {
    flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 24, fontWeight: 800,
    fontFamily: "inherit", color: "#0b0e0a", padding: 0, minWidth: 0,
  },
  swapAmountDisplay: { flex: 1, fontSize: 24, fontWeight: 800, color: "#0b0e0a" },
  swapBoxFoot: { display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "rgba(11,14,10,0.5)", marginTop: 8 },
  maxBtn: { background: "transparent", border: "none", color: "#3D5CFF", fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: 0 },

  tokenPickerBtn: {
    display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid rgba(11,14,10,0.1)",
    borderRadius: 999, padding: "8px 12px", fontSize: 14, fontWeight: 700, color: "#0b0e0a", cursor: "pointer",
    flexShrink: 0,
  },
  tokenIconCircle: {
    width: 24, height: 24, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0,
  },
  caret: { fontSize: 9, color: "rgba(11,14,10,0.4)" },

  flipBtn: {
    width: 36, height: 36, borderRadius: "50%", background: "#f4f4f6", border: "3px solid #fff",
    fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    margin: "-14px auto", position: "relative", zIndex: 2, transition: "all 0.2s",
  },

  pickerDropdown: {
    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff",
    border: "1px solid rgba(11,14,10,0.08)", borderRadius: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
    padding: 6, zIndex: 10, maxHeight: 260, overflowY: "auto",
  },
  pickerOption: {
    display: "flex", alignItems: "center", gap: 10, width: "100%", background: "transparent",
    border: "none", borderRadius: 10, padding: "10px 10px", cursor: "pointer", textAlign: "left",
  },
  pickerOptionInfo: { display: "flex", flexDirection: "column" },
  pickerOptionSym: { fontSize: 13.5, fontWeight: 700, color: "#0b0e0a" },
  pickerOptionName: { fontSize: 11.5, color: "rgba(11,14,10,0.45)" },

  rateRow: { fontSize: 12.5, color: "rgba(11,14,10,0.5)", textAlign: "center", marginTop: 16 },
  fieldError: { display: "block", fontSize: 12.5, color: "#f6465d", marginTop: 12, fontWeight: 600, textAlign: "center" },

  primaryBtn: {
    width: "100%", background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999,
    padding: "15px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 22,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "background 0.2s",
  },
  spinner: {
    width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "bf-spin 0.7s linear infinite",
  },

  reviewCard: { background: "#f9f9fa", borderRadius: 14, padding: "20px 20px 4px" },
  reviewSwapRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 },
  reviewToken: { display: "flex", alignItems: "center", gap: 10 },
  reviewTokenAmt: { fontSize: 14.5, fontWeight: 700, color: "#0b0e0a" },
  reviewTokenUsd: { fontSize: 12, color: "rgba(11,14,10,0.45)" },
  reviewArrow: { fontSize: 16, color: "rgba(11,14,10,0.3)" },
  reviewDivider: { height: 1, background: "rgba(11,14,10,0.06)", marginBottom: 8 },
  reviewDetailRow: { display: "flex", justifyContent: "space-between", padding: "10px 0" },
  reviewLabel: { fontSize: 13, color: "rgba(11,14,10,0.5)" },
  reviewValue: { fontSize: 13, fontWeight: 600, color: "#0b0e0a" },

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

export default Swap;