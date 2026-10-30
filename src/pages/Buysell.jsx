import React from "react";
import { useAuth } from "../auth/AuthContext";
import { loadMoonPay } from "@moonpay/moonpay-js";

const TOKEN_META = {
  BTC: { name: "Bitcoin", icon: "₿", color: "#F7931A", coingeckoId: "bitcoin" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "#627EEA", coingeckoId: "ethereum" },
  BNB: { name: "BNB Smart Chain", icon: "◆", color: "#F0B90B", coingeckoId: "binancecoin" },
  SOL: { name: "Solana", icon: "◎", color: "#14F195", coingeckoId: "solana" },
  USDT: { name: "Tether", icon: "T", color: "#26A17B", coingeckoId: "tether" },
  XRP: { name: "XRP", icon: "✕", color: "#23292F", coingeckoId: "ripple" },
};

const FIAT_CURRENCIES = ["USD", "EUR", "GBP", "NGN"];

const PAYMENT_METHODS = [
  { id: "card", label: "Debit/Credit Card", icon: "💳" },
  { id: "bank", label: "Bank Transfer", icon: "🏦" },
  { id: "applepay", label: "Apple Pay", icon: "" },
];

function formatMoney(n, currency) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function fetchLivePrices(symbols) {
  const ids = symbols.map((s) => TOKEN_META[s].coingeckoId).join(",");
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,eur,gbp,ngn`
  );
  if (!res.ok) throw new Error("Failed to fetch live prices");
  const data = await res.json();
  const bySymbol = {};
  symbols.forEach((sym) => {
    bySymbol[sym] = data[TOKEN_META[sym].coingeckoId] ?? {};
  });
  return bySymbol;
}

// TODO: replace with a real wallet/backend call, same pattern as Dashboard.jsx.
async function getWalletHoldings() {
  return Object.keys(TOKEN_META).map((sym) => ({ sym, amt: 0 }));
}

// MoonPay does the payment and identity checks, then sends the coins to the wallet.
// The key here is the publishable one (pk_...), which is safe in the front end.
const MOONPAY_KEY = import.meta.env.VITE_MOONPAY_API_KEY;
const MOONPAY_ENV = (import.meta.env.VITE_MOONPAY_ENV || "sandbox").toLowerCase();
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// MoonPay's code for each coin. "bnb_bsc" and "eth" are confirmed in MoonPay's docs.
// "usdt_bsc" is my best guess, so check the exact USDT code in your MoonPay Dashboard.
const MOONPAY_CODES = { USDT: "usdt_bsc", BNB: "bnb_bsc", ETH: "eth" };
const NETWORKS = MOONPAY_CODES; // the asset picker below uses this list

// Test setting: send purchases to this address (your Trust Wallet).
// Leave it empty to send them to the logged-in user's own wallet.
const DESTINATION_OVERRIDE = import.meta.env.VITE_DESTINATION_ADDRESS || "";
const QUICK_AMOUNTS = [50, 100, 250, 500];

function BuySell() {
  const { token: walletAddress } = useAuth(); // login() stored the wallet address
  const [mode, setMode] = React.useState("buy"); // "buy" | "sell"
  const [selectedSym, setSelectedSym] = React.useState("USDT");
  const [currency, setCurrency] = React.useState("EUR");
  const [fiatAmount, setFiatAmount] = React.useState("100");
  const [paymentMethod, setPaymentMethod] = React.useState("card");
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const [prices, setPrices] = React.useState(null);
  const [holdings, setHoldings] = React.useState(null);
  const [error, setError] = React.useState(null);

  const [step, setStep] = React.useState("form"); // "form" | "review" | "processing" | "success"
  const [orderResult, setOrderResult] = React.useState(null);
  const [orderError, setOrderError] = React.useState(null);

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

  const price = prices?.[selectedSym]?.[currency.toLowerCase()] ?? 0;
  const fiatNum = parseFloat(fiatAmount) || 0;
  const cryptoAmount = price > 0 ? fiatNum / price : 0;
  const holding = (holdings || []).find((h) => h.sym === selectedSym)?.amt ?? 0;
  const sellValueAvailable = holding * price;

  const insufficientForSell = mode === "sell" && fiatNum > sellValueAvailable;
  const canReview = fiatNum > 0 && !insufficientForSell;

      async function handleConfirm() {
    setOrderError(null);
    if (!MOONPAY_KEY) {
      setOrderError("Payment key missing. Add VITE_MOONPAY_API_KEY to your React .env and restart the dev server.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress || "")) {
      setOrderError("No wallet found. Please log in again.");
      return;
    }
    if (DESTINATION_OVERRIDE && !/^0x[a-fA-F0-9]{40}$/.test(DESTINATION_OVERRIDE)) {
      setOrderError("VITE_DESTINATION_ADDRESS is not a valid 0x address.");
      return;
    }
    const amount = Math.round(fiatNum);
    if (amount < 1) {
      setOrderError("Enter an amount of at least 1.");
      return;
    }

    setStep("processing");
    try {
      const moonPay = await loadMoonPay();
      const sdk = moonPay({
        flow: "buy",
        environment: MOONPAY_ENV,
        variant: "overlay",
        params: {
          apiKey: MOONPAY_KEY,
          walletAddress: DESTINATION_OVERRIDE || walletAddress,
          defaultCurrencyCode: MOONPAY_CODES[selectedSym],
          baseCurrencyCode: currency.toLowerCase(),
          baseCurrencyAmount: String(amount),
        },
        handlers: {
          async onTransactionCompleted() {
            setStep("success");
          },
          async onCloseOverlay() {
            setStep((s) => (s === "processing" ? "review" : s));
          },
        },
      });

      // MoonPay needs the link signed on the server because it carries a wallet address
      const urlForSignature = sdk.generateUrlForSigning();
      const res = await fetch(`${API_URL}/api/moonpay-sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlForSignature }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not prepare the payment window. Is the server running?");
      }
      const data = await res.json();
      sdk.updateSignature(data.signature);
      sdk.show();
    } catch (err) {
      setOrderError(err.message || "Could not open the payment window. Please try again.");
      setStep("review");
    }
  }

  function resetFlow() {
    setStep("form");
    setOrderResult(null);
    setOrderError(null);
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-bs-mode:hover { color: #0b0e0a !important; }
        .bf-bs-quick:hover { border-color: rgba(61,92,255,0.4) !important; }
        .bf-bs-pay:hover { border-color: rgba(61,92,255,0.4) !important; }
        .bf-bs-cta:hover:not(:disabled) { background: #2A47E0 !important; }
        .bf-bs-token:hover { background: rgba(11,14,10,0.04) !important; }
        @keyframes bf-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          {step !== "form" && step !== "success" && (
            <button style={styles.backBtn} onClick={() => setStep("form")} aria-label="Back">←</button>
          )}
          <h1 style={styles.headerTitle}>
            {step === "form" && "Buy & Sell"}
            {step === "review" && "Review Order"}
            {step === "processing" && "Processing…"}
            {step === "success" && "Payment Submitted"}
          </h1>
        </div>

        {error && <div style={styles.errorBanner}>Couldn't load market data: {error}</div>}

        {/* ── Step: form ── */}
        {step === "form" && (
          <>
            <div style={styles.modeRow}>
              <button
                className="bf-bs-mode"
                style={{ ...styles.modeTab, ...(mode === "buy" ? styles.modeTabActive : {}) }}
                onClick={() => setMode("buy")}
              >
                Buy
              </button>
              <button
                className="bf-bs-mode"
                style={{ ...styles.modeTab, ...(mode === "sell" ? styles.modeTabActiveSell : {}) }}
                onClick={() => {}}
                disabled
                title="Selling is coming soon"
              >
                Sell (soon)
              </button>
            </div>

            <div style={styles.amountBox}>
              <div style={styles.amountRow}>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={styles.currencySelect}>
                  {FIAT_CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={fiatAmount}
                  onChange={(e) => setFiatAmount(e.target.value)}
                  style={styles.amountInput}
                  min="0"
                  step="any"
                  placeholder="0"
                />
                <button style={styles.tokenPickerBtn} onClick={() => setPickerOpen((o) => !o)}>
                  <span style={{ ...styles.tokenIconCircle, background: TOKEN_META[selectedSym].color }}>
                    {TOKEN_META[selectedSym].icon}
                  </span>
                  {selectedSym}
                  <span style={styles.caret}>▾</span>
                </button>
              </div>

              <div style={styles.quickRow}>
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    className="bf-bs-quick"
                    style={styles.quickBtn}
                    onClick={() => setFiatAmount(String(amt))}
                  >
                    {currency} {amt}
                  </button>
                ))}
              </div>

              <div style={styles.estimateRow}>
                {prices === null
                  ? (error ? "Estimate unavailable. The final amount is shown in the payment window." : "Loading price…")
                  : `≈ ${cryptoAmount.toFixed(6)} ${selectedSym}`}
              </div>

              {mode === "sell" && (
                <div style={styles.availableRow}>
                  Available to sell: {formatMoney(sellValueAvailable, currency)} ({holding} {selectedSym})
                </div>
              )}

              {pickerOpen && (
                <div style={styles.pickerDropdown}>
                  {Object.entries(TOKEN_META).filter(([sym]) => NETWORKS[sym]).map(([sym, m]) => (                    <button
                      key={sym}
                      className="bf-bs-token"
                      style={styles.pickerOption}
                      onClick={() => {
                        setSelectedSym(sym);
                        setPickerOpen(false);
                      }}
                    >
                      <span style={{ ...styles.tokenIconCircle, background: m.color }}>{m.icon}</span>
                      <span>
                        <span style={styles.pickerOptionSym}>{sym}</span>
                        <span style={styles.pickerOptionName}>{m.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>


            {insufficientForSell && (
              <div style={styles.fieldError}>You don't have enough {selectedSym} to sell this amount.</div>
            )}

            <button
              className="bf-bs-cta"
              style={{ ...styles.primaryBtn, opacity: canReview ? 1 : 0.5, background: mode === "sell" ? "#f6465d" : "#3D5CFF" }}
              disabled={!canReview}
              onClick={() => canReview && setStep("review")}
            >
              Review {mode === "buy" ? "Purchase" : "Sale"}
            </button>
          </>
        )}

        {/* ── Step: review / processing ── */}
        {(step === "review" || step === "processing") && (
          <>
            <div style={styles.reviewCard}>
              <div style={styles.reviewMainRow}>
                <span style={styles.reviewMainLabel}>You {mode === "buy" ? "pay" : "receive"}</span>
                <span style={styles.reviewMainValue}>{formatMoney(fiatNum, currency)}</span>
              </div>
              <div style={styles.reviewDivider} />
              <div style={styles.reviewMainRow}>
                <span style={styles.reviewMainLabel}>You {mode === "buy" ? "receive" : "sell"}</span>
                <span style={styles.reviewMainValue}>{cryptoAmount.toFixed(6)} {selectedSym}</span>
              </div>
              <div style={styles.reviewDivider} />

              <div style={styles.reviewDetailRow}>
                <span style={styles.reviewLabel}>Rate</span>
                <span style={styles.reviewValue}>1 {selectedSym} ≈ {formatMoney(price, currency)}</span>
              </div>
              <div style={styles.reviewDetailRow}>
                <span style={styles.reviewLabel}>Fees</span>
                <span style={styles.reviewValue}>Calculated by payment provider</span>
              </div>
            </div>

            {orderError && <div style={styles.errorBanner}>{orderError}</div>}

            <button
              className="bf-bs-cta"
              style={{ ...styles.primaryBtn, background: mode === "sell" ? "#f6465d" : "#3D5CFF" }}
              disabled={step === "processing"}
              onClick={handleConfirm}
            >
              {step === "processing" ? (
                <>
                  <span style={styles.spinner} /> Processing
                </>
              ) : (
                "Continue to secure payment"
              )}
            </button>
          </>
        )}

        {/* ── Step: success ── */}
        {step === "success" && (
          <div style={styles.successWrap}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>
              Payment submitted
            </h2>
            <p style={styles.successText}>
              Your coins are sent to your wallet once the payment is confirmed, usually
              within a few minutes. Refresh your dashboard to see them.
            </p>           <button className="bf-bs-cta" style={styles.primaryBtn} onClick={resetFlow}>
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

  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  backBtn: { background: "transparent", border: "none", fontSize: 18, cursor: "pointer", padding: 4, color: "#0b0e0a" },
  headerTitle: { fontSize: 19, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  errorBanner: { background: "#fef3cd", color: "#8a6d1a", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10, marginBottom: 18 },

  modeRow: { display: "flex", gap: 4, background: "#f4f4f6", borderRadius: 999, padding: 4, marginBottom: 20 },
  modeTab: {
    flex: 1, background: "transparent", border: "none", borderRadius: 999, padding: "10px", fontSize: 13.5,
    fontWeight: 700, color: "rgba(11,14,10,0.5)", cursor: "pointer",
  },
  modeTabActive: { background: "#fff", color: "#3D5CFF", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  modeTabActiveSell: { background: "#fff", color: "#f6465d", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },

  amountBox: { background: "#f9f9fa", borderRadius: 16, padding: "18px", position: "relative", marginBottom: 20 },
  amountRow: { display: "flex", alignItems: "center", gap: 10 },
  currencySelect: {
    border: "1px solid rgba(11,14,10,0.12)", borderRadius: 8, padding: "6px 8px", fontSize: 12.5,
    fontFamily: "inherit", color: "#0b0e0a", background: "#fff", outline: "none", flexShrink: 0,
  },
  amountInput: {
    flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 26, fontWeight: 800,
    fontFamily: "inherit", color: "#0b0e0a", minWidth: 0, padding: 0,
  },
  tokenPickerBtn: {
    display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid rgba(11,14,10,0.1)",
    borderRadius: 999, padding: "8px 12px", fontSize: 14, fontWeight: 700, color: "#0b0e0a", cursor: "pointer",
    flexShrink: 0,
  },
  tokenIconCircle: {
    width: 22, height: 22, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0,
  },
  caret: { fontSize: 9, color: "rgba(11,14,10,0.4)" },

  quickRow: { display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" },
  quickBtn: {
    background: "#fff", border: "1.5px solid rgba(11,14,10,0.1)", borderRadius: 999, padding: "6px 12px",
    fontSize: 12, fontWeight: 700, color: "#0b0e0a", cursor: "pointer", transition: "border-color 0.2s",
  },

  estimateRow: { fontSize: 12.5, color: "rgba(11,14,10,0.5)", marginTop: 12 },
  availableRow: { fontSize: 12, color: "rgba(11,14,10,0.4)", marginTop: 4 },

  pickerDropdown: {
    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff",
    border: "1px solid rgba(11,14,10,0.08)", borderRadius: 14, boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
    padding: 6, zIndex: 10, maxHeight: 240, overflowY: "auto",
  },
  pickerOption: {
    display: "flex", alignItems: "center", gap: 10, width: "100%", background: "transparent",
    border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", textAlign: "left",
  },
  pickerOptionSym: { display: "block", fontSize: 13.5, fontWeight: 700, color: "#0b0e0a" },
  pickerOptionName: { display: "block", fontSize: 11.5, color: "rgba(11,14,10,0.45)" },

  label: { display: "block", fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.6)", marginBottom: 10 },
  paymentGrid: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 },
  paymentOption: {
    display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1.5px solid rgba(11,14,10,0.1)",
    borderRadius: 12, padding: "12px 14px", fontSize: 13.5, fontWeight: 600, color: "#0b0e0a", cursor: "pointer",
    transition: "border-color 0.2s", textAlign: "left",
  },
  paymentOptionActive: { borderColor: "#3D5CFF", background: "rgba(61,92,255,0.04)" },
  paymentIcon: { fontSize: 17 },

  fieldError: { fontSize: 12.5, color: "#f6465d", fontWeight: 600, marginBottom: 16, textAlign: "center" },

  primaryBtn: {
    width: "100%", color: "#fff", border: "none", borderRadius: 999, padding: "15px 24px", fontSize: 15,
    fontWeight: 700, cursor: "pointer", marginTop: 8, display: "flex", alignItems: "center",
    justifyContent: "center", gap: 10, transition: "background 0.2s",
  },
  spinner: {
    width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "bf-spin 0.7s linear infinite",
  },

  reviewCard: { background: "#f9f9fa", borderRadius: 14, padding: "20px 20px 4px", marginBottom: 20 },
  reviewMainRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" },
  reviewMainLabel: { fontSize: 13, color: "rgba(11,14,10,0.55)" },
  reviewMainValue: { fontSize: 16, fontWeight: 800, color: "#0b0e0a" },
  reviewDivider: { height: 1, background: "rgba(11,14,10,0.06)" },
  reviewDetailRow: { display: "flex", justifyContent: "space-between", padding: "10px 0" },
  reviewLabel: { fontSize: 12.5, color: "rgba(11,14,10,0.5)" },
  reviewValue: { fontSize: 12.5, fontWeight: 600, color: "#0b0e0a" },

  successWrap: { textAlign: "center", padding: "8px 0" },
  successIcon: {
    width: 56, height: 56, borderRadius: "50%", background: "#0ecb81", color: "#fff",
    fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 18px",
  },
  successTitle: { fontSize: 19, fontWeight: 800, color: "#0b0e0a", margin: "0 0 8px" },
  successText: { fontSize: 14, color: "rgba(11,14,10,0.55)", lineHeight: 1.6, margin: "0 0 16px" },
  orderIdBox: {
    fontSize: 12, fontFamily: "monospace", color: "rgba(11,14,10,0.5)", background: "#f9f9fa",
    borderRadius: 8, padding: "10px 14px", marginBottom: 8,
  },
};

export default BuySell;