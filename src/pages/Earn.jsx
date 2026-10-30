import React from "react";

const TOKEN_META = {
  ETH: { name: "Ethereum", icon: "Ξ", color: "#627EEA" },
  BNB: { name: "BNB Smart Chain", icon: "◆", color: "#F0B90B" },
  SOL: { name: "Solana", icon: "◎", color: "#14F195" },
  ATOM: { name: "Cosmos", icon: "⚛", color: "#2E3148" },
};

// TODO: replace with a real call to your staking backend/protocol that
// returns current APY per asset. Returns null per asset until connected —
// the UI shows "APY —" rather than a fabricated yield number, since a made
// up rate could mislead someone about real returns.
async function getStakingApy() {
  return Object.fromEntries(Object.keys(TOKEN_META).map((sym) => [sym, null]));
}

// TODO: replace with a real wallet/backend call, same pattern as Dashboard.jsx.
async function getWalletHoldings() {
  return Object.keys(TOKEN_META).map((sym) => ({ sym, amt: 0 }));
}

// TODO: replace with a real call to your backend/protocol returning the
// user's active staking positions (amount staked, rewards accrued, unlock
// date if applicable). Returns an empty list until connected.
async function getStakedPositions() {
  return [];
}

// TODO: replace with a real staking transaction — e.g. a signed on-chain
// stake call via ethers.js/web3.js, or a backend endpoint for custodial
// staking. Simulates network delay and always succeeds for UI review.
async function submitStake({ sym, amount }) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { ok: true };
}

// TODO: replace with a real unstake transaction, same pattern as submitStake.
async function submitUnstake({ positionId }) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return { ok: true };
}

function Earn() {
  const [apy, setApy] = React.useState(null);
  const [holdings, setHoldings] = React.useState(null);
  const [positions, setPositions] = React.useState(null);
  const [error, setError] = React.useState(null);

  const [stakingSym, setStakingSym] = React.useState(null);
  const [amount, setAmount] = React.useState("");
  const [step, setStep] = React.useState("form");
  const [actionError, setActionError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [a, h, p] = await Promise.all([getStakingApy(), getWalletHoldings(), getStakedPositions()]);
        if (cancelled) return;
        setApy(a);
        setHoldings(h);
        setPositions(p);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load staking data");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function holdingFor(sym) {
    return (holdings || []).find((h) => h.sym === sym)?.amt ?? 0;
  }

  function openStake(sym) {
    setStakingSym(sym);
    setAmount("");
    setStep("form");
    setActionError(null);
  }
  function closeStake() {
    setStakingSym(null);
  }

  async function handleConfirmStake() {
    setStep("staking");
    setActionError(null);
    try {
      await submitStake({ sym: stakingSym, amount: parseFloat(amount) });
      setStep("done");
    } catch (err) {
      setActionError(err.message || "Failed to stake");
      setStep("form");
    }
  }

  async function handleUnstake(positionId) {
    setPositions((prev) => prev.map((p) => (p.id === positionId ? { ...p, unstaking: true } : p)));
    try {
      await submitUnstake({ positionId });
      setPositions((prev) => prev.filter((p) => p.id !== positionId));
    } catch (err) {
      setError(err.message || "Failed to unstake");
    }
  }

  const amountNum = parseFloat(amount) || 0;
  const stakingHolding = stakingSym ? holdingFor(stakingSym) : 0;
  const insufficientBalance = amountNum > stakingHolding;
  const canStake = amountNum > 0 && !insufficientBalance;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-earn-row:hover { background: rgba(11,14,10,0.02) !important; }
        .bf-earn-stake:hover { background: #2A47E0 !important; }
        .bf-earn-cta:hover:not(:disabled) { background: #2A47E0 !important; }
        .bf-earn-unstake:hover { color: #f6465d !important; }
        @keyframes bf-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.wrap}>
        <div style={styles.header}>
          <a href="/dashboard" style={styles.backBtn} aria-label="Back to dashboard">←</a>
          <h1 style={styles.headerTitle}>Earn</h1>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* My staked positions */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>My Staked Assets</h2>
          {positions === null ? (
            <div style={styles.loadingRow}>Loading…</div>
          ) : positions.length === 0 ? (
            <div style={styles.loadingRow}>You don't have any assets staked yet.</div>
          ) : (
            <div style={styles.positionsList}>
              {positions.map((p) => (
                <div key={p.id} style={styles.positionRow}>
                  <span style={{ ...styles.assetIconCircle, background: TOKEN_META[p.sym]?.color }}>
                    {TOKEN_META[p.sym]?.icon}
                  </span>
                  <div style={styles.positionInfo}>
                    <span style={styles.positionAmt}>{p.amount} {p.sym}</span>
                    <span style={styles.positionRewards}>+{p.rewardsEarned} {p.sym} earned</span>
                  </div>
                  <button
                    className="bf-earn-unstake"
                    style={styles.unstakeBtn}
                    disabled={p.unstaking}
                    onClick={() => handleUnstake(p.id)}
                  >
                    {p.unstaking ? "Unstaking…" : "Unstake"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Available to stake */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Available to Stake</h2>
          <div style={styles.headerRow}>
            <span>Asset</span>
            <span style={styles.right}>APY</span>
            <span style={styles.right}>Your Balance</span>
            <span></span>
          </div>
          {Object.entries(TOKEN_META).map(([sym, meta]) => (
            <div key={sym} className="bf-earn-row" style={styles.row}>
              <span style={styles.assetCell}>
                <span style={{ ...styles.assetIconCircle, background: meta.color }}>{meta.icon}</span>
                <span>
                  <span style={styles.assetSym}>{sym}</span>
                  <span style={styles.assetName}>{meta.name}</span>
                </span>
              </span>
              <span style={styles.right}>
                {apy === null ? "…" : apy[sym] == null ? "—" : `${apy[sym]}%`}
              </span>
              <span style={styles.right}>
                {holdings === null ? "…" : `${holdingFor(sym)} ${sym}`}
              </span>
              <span style={styles.right}>
                <button className="bf-earn-stake" style={styles.stakeBtn} onClick={() => openStake(sym)}>
                  Stake
                </button>
              </span>
            </div>
          ))}
        </section>
      </div>

      {/* Stake modal */}
      {stakingSym && (
        <div style={styles.modalOverlay} onClick={closeStake}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {step === "done" ? (
              <div style={styles.successWrap}>
                <div style={styles.successIcon}>✓</div>
                <h2 style={styles.successTitle}>Staked successfully</h2>
                <p style={styles.successText}>
                  {amountNum} {stakingSym} is now staked and earning rewards.
                </p>
                <button className="bf-earn-cta" style={styles.primaryBtn} onClick={closeStake}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={styles.modalHeader}>
                  <span style={{ ...styles.assetIconCircle, background: TOKEN_META[stakingSym].color }}>
                    {TOKEN_META[stakingSym].icon}
                  </span>
                  <h2 style={styles.modalTitle}>Stake {stakingSym}</h2>
                </div>

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
                  <span style={styles.amountSym}>{stakingSym}</span>
                  <button
                    type="button"
                    style={styles.maxBtn}
                    onClick={() => setAmount(String(stakingHolding))}
                  >
                    Max
                  </button>
                </div>
                <div style={styles.availableText}>Available: {stakingHolding} {stakingSym}</div>
                {insufficientBalance && (
                  <div style={styles.fieldError}>Insufficient balance for this amount.</div>
                )}

                {actionError && <div style={styles.errorBanner}>{actionError}</div>}

                <button
                  className="bf-earn-cta"
                  style={{ ...styles.primaryBtn, opacity: canStake ? 1 : 0.5 }}
                  disabled={!canStake || step === "staking"}
                  onClick={handleConfirmStake}
                >
                  {step === "staking" ? (
                    <>
                      <span style={styles.spinner} /> Staking
                    </>
                  ) : (
                    `Stake ${stakingSym}`
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Inter', -apple-system, sans-serif", background: "#f4f4f6", minHeight: "100vh", padding: "32px 20px" },
  wrap: { maxWidth: 720, margin: "0 auto" },

  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 },
  backBtn: { fontSize: 18, color: "#0b0e0a", textDecoration: "none" },
  headerTitle: { fontSize: 20, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  errorBanner: { background: "#fef3cd", color: "#8a6d1a", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10, marginBottom: 18 },

  section: { background: "#fff", borderRadius: 20, padding: "22px 24px", marginBottom: 20, border: "1px solid rgba(11,14,10,0.06)" },
  sectionTitle: { fontSize: 15.5, fontWeight: 800, color: "#0b0e0a", margin: "0 0 16px" },
  loadingRow: { fontSize: 13.5, color: "rgba(11,14,10,0.4)" },

  positionsList: { display: "flex", flexDirection: "column", gap: 4 },
  positionRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid rgba(11,14,10,0.05)" },
  positionInfo: { display: "flex", flexDirection: "column", flex: 1 },
  positionAmt: { fontSize: 14, fontWeight: 700, color: "#0b0e0a" },
  positionRewards: { fontSize: 12, color: "#0ecb81", fontWeight: 600 },
  unstakeBtn: {
    background: "transparent", border: "1px solid rgba(11,14,10,0.15)", borderRadius: 999,
    padding: "8px 16px", fontSize: 12.5, fontWeight: 700, color: "rgba(11,14,10,0.6)", cursor: "pointer",
  },

  headerRow: {
    display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr", padding: "10px 0",
    fontSize: 11.5, fontWeight: 700, color: "rgba(11,14,10,0.4)", textTransform: "uppercase", letterSpacing: "0.04em",
  },
  right: { textAlign: "right" },
  row: {
    display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr", padding: "12px 0", alignItems: "center",
    borderTop: "1px solid rgba(11,14,10,0.05)",
  },
  assetCell: { display: "flex", alignItems: "center", gap: 10 },
  assetIconCircle: {
    width: 30, height: 30, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0,
  },
  assetSym: { display: "block", fontSize: 13.5, fontWeight: 700, color: "#0b0e0a" },
  assetName: { display: "block", fontSize: 11.5, color: "rgba(11,14,10,0.45)" },
  stakeBtn: {
    background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999, padding: "8px 16px",
    fontSize: 12.5, fontWeight: 700, cursor: "pointer", transition: "background 0.2s",
  },

  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(11,14,10,0.4)", display: "flex",
    alignItems: "center", justifyContent: "center", padding: 20, zIndex: 100,
  },
  modal: { width: "100%", maxWidth: 380, background: "#fff", borderRadius: 20, padding: "28px 24px" },
  modalHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  modalTitle: { fontSize: 17, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  label: { display: "block", fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.6)", marginBottom: 8 },
  amountWrap: {
    display: "flex", alignItems: "center", gap: 8, border: "1.5px solid rgba(11,14,10,0.15)",
    borderRadius: 10, padding: "6px 14px",
  },
  amountInput: {
    flex: 1, border: "none", outline: "none", fontSize: 18, fontWeight: 700, fontFamily: "inherit",
    color: "#0b0e0a", padding: "7px 0", minWidth: 0,
  },
  amountSym: { fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.5)" },
  maxBtn: { background: "transparent", border: "none", color: "#3D5CFF", fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: "4px 0 4px 8px", borderLeft: "1px solid rgba(11,14,10,0.1)" },
  availableText: { fontSize: 12.5, color: "rgba(11,14,10,0.45)", marginTop: 8 },
  fieldError: { fontSize: 12.5, color: "#f6465d", fontWeight: 600, marginTop: 8 },

  primaryBtn: {
    width: "100%", background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999,
    padding: "14px 24px", fontSize: 14.5, fontWeight: 700, cursor: "pointer", marginTop: 20,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "background 0.2s",
  },
  spinner: {
    width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "bf-spin 0.7s linear infinite",
  },

  successWrap: { textAlign: "center" },
  successIcon: {
    width: 52, height: 52, borderRadius: "50%", background: "#0ecb81", color: "#fff",
    fontSize: 24, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
  },
  successTitle: { fontSize: 18, fontWeight: 800, color: "#0b0e0a", margin: "0 0 8px" },
  successText: { fontSize: 13.5, color: "rgba(11,14,10,0.55)", lineHeight: 1.6, margin: "0 0 16px" },
};

export default Earn;