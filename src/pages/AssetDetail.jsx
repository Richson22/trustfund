import React from "react";

// Same token metadata as Dashboard.jsx / Send.jsx / Receive.jsx.
const TOKEN_META = {
  BTC: { name: "Bitcoin", icon: "₿", color: "#F7931A", coingeckoId: "bitcoin" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "#627EEA", coingeckoId: "ethereum" },
  BNB: { name: "BNB Smart Chain", icon: "◆", color: "#F0B90B", coingeckoId: "binancecoin" },
  SOL: { name: "Solana", icon: "◎", color: "#14F195", coingeckoId: "solana" },
  USDT: { name: "Tether", icon: "T", color: "#26A17B", coingeckoId: "tether" },
  XRP: { name: "XRP", icon: "✕", color: "#23292F", coingeckoId: "ripple" },
};

const RANGES = [
  { key: "1", label: "1D" },
  { key: "7", label: "7D" },
  { key: "30", label: "1M" },
  { key: "365", label: "1Y" },
];

function formatUsd(n, opts = {}) {
  return (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2, ...opts });
}

function formatCompact(n) {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
}

async function fetchCoinStats(coingeckoId) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coingeckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
  );
  if (!res.ok) throw new Error("Failed to fetch asset data");
  const data = await res.json();
  return {
    price: data.market_data?.current_price?.usd ?? 0,
    chg24h: data.market_data?.price_change_percentage_24h ?? 0,
    marketCap: data.market_data?.market_cap?.usd ?? null,
    volume24h: data.market_data?.total_volume?.usd ?? null,
    ath: data.market_data?.ath?.usd ?? null,
    circulatingSupply: data.market_data?.circulating_supply ?? null,
  };
}

async function fetchPriceHistory(coingeckoId, days) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}`
  );
  if (!res.ok) throw new Error("Failed to fetch price history");
  const data = await res.json();
  return (data.prices || []).map(([ts, price]) => ({ ts, price }));
}

// TODO: replace with a real wallet/backend call, same as Dashboard.jsx.
async function getHoldingForAsset(sym) {
  return { sym, amt: 0 };
}

// TODO: replace with a real backend call, filtered server-side by asset.
async function getActivityForAsset(sym) {
  return [];
}

function Sparkline({ points, positive }) {
  if (!points || points.length < 2) {
    return <div style={styles.chartSkeleton} />;
  }
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 600;
  const h = 200;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p.price - min) / range) * (h - 20) - 10;
    return `${x},${y}`;
  });
  const linePath = `M${coords.join(" L")}`;
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
  const color = positive ? "#0ecb81" : "#f6465d";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={styles.chartSvg} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkFill)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function AssetDetail({ symbol = "BTC" }) {
  const meta = TOKEN_META[symbol] || TOKEN_META.BTC;

  const [stats, setStats] = React.useState(null);
  const [history, setHistory] = React.useState(null);
  const [holding, setHolding] = React.useState(null);
  const [activity, setActivity] = React.useState(null);
  const [range, setRange] = React.useState("7");
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    async function loadCore() {
      try {
        const [s, h, act] = await Promise.all([
          fetchCoinStats(meta.coingeckoId),
          getHoldingForAsset(symbol),
          getActivityForAsset(symbol),
        ]);
        if (cancelled) return;
        setStats(s);
        setHolding(h);
        setActivity(act);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load asset data");
      }
    }
    loadCore();
    return () => {
      cancelled = true;
    };
  }, [symbol, meta.coingeckoId]);

  React.useEffect(() => {
    let cancelled = false;
    setHistory(null);
    fetchPriceHistory(meta.coingeckoId, range)
      .then((h) => !cancelled && setHistory(h))
      .catch((err) => !cancelled && setError(err.message || "Failed to load chart"));
    return () => {
      cancelled = true;
    };
  }, [range, meta.coingeckoId]);

  const holdingValue = holding && stats ? holding.amt * stats.price : 0;
  const chgPositive = (stats?.chg24h ?? 0) >= 0;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-asset-range:hover { color: #0b0e0a !important; }
        .bf-asset-action:hover { background: #f0f0f2 !important; }
      `}</style>

      <div style={styles.wrap}>
        <div style={styles.header}>
          <a href="/dashboard" style={styles.backBtn} aria-label="Back to dashboard">←</a>
          <span style={{ ...styles.headerIcon, background: meta.color }}>{meta.icon}</span>
          <div>
            <h1 style={styles.headerName}>{meta.name}</h1>
            <span style={styles.headerSym}>{symbol}</span>
          </div>
        </div>

        {error && <div style={styles.errorBanner}>Couldn't load live data: {error}</div>}

        {/* Price + chart */}
        <div style={styles.priceCard}>
          {stats === null ? (
            <div style={styles.priceSkeleton} />
          ) : (
            <>
              <h2 style={styles.priceValue}>{formatUsd(stats.price)}</h2>
              <span style={{ ...styles.priceChg, color: chgPositive ? "#0ecb81" : "#f6465d" }}>
                {chgPositive ? "↑" : "↓"} {Math.abs(stats.chg24h).toFixed(2)}% (24h)
              </span>
            </>
          )}

          <div style={styles.chartWrap}>
            <Sparkline points={history} positive={chgPositive} />
          </div>

          <div style={styles.rangeRow}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                className="bf-asset-range"
                style={{ ...styles.rangeBtn, ...(range === r.key ? styles.rangeBtnActive : {}) }}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={styles.actionsRow}>
          {[
            { icon: "↑", label: "Send", href: "/send" },
            { icon: "↓", label: "Receive", href: "/receive" },
            { icon: "💳", label: "Buy", href: "#" },
            { icon: "🔄", label: "Swap", href: "#" },
          ].map((a) => (
            <a key={a.label} href={a.href} className="bf-asset-action" style={styles.actionBtn}>
              <span style={styles.actionIcon}>{a.icon}</span>
              {a.label}
            </a>
          ))}
        </div>

        {/* Your holdings */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Your Balance</h3>
          {holding === null ? (
            <div style={styles.loadingRow}>Loading…</div>
          ) : (
            <div style={styles.holdingRow}>
              <span style={styles.holdingAmt}>
                {holding.amt} {symbol}
              </span>
              <span style={styles.holdingUsd}>{formatUsd(holdingValue)}</span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Market Stats</h3>
          <div style={styles.statsGrid}>
            {[
              { label: "Market Cap", value: stats ? formatUsd(stats.marketCap, { notation: "compact" }) : "—" },
              { label: "24h Volume", value: stats ? formatUsd(stats.volume24h, { notation: "compact" }) : "—" },
              { label: "All-Time High", value: stats ? formatUsd(stats.ath) : "—" },
              { label: "Circulating Supply", value: stats ? `${formatCompact(stats.circulatingSupply)} ${symbol}` : "—" },
            ].map((s) => (
              <div key={s.label} style={styles.statCard}>
                <span style={styles.statLabel}>{s.label}</span>
                <span style={styles.statValue}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity for this asset */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Activity</h3>
          {activity === null ? (
            <div style={styles.loadingRow}>Loading…</div>
          ) : activity.length === 0 ? (
            <div style={styles.loadingRow}>No {symbol} activity yet</div>
          ) : (
            <div style={styles.activityList}>
              {activity.map((tx, i) => (
                <div key={i} style={styles.activityRow}>
                  <span>{tx.type}</span>
                  <span>{tx.amt}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Inter', -apple-system, sans-serif", background: "#f4f4f6", minHeight: "100vh", padding: "32px 20px" },
  wrap: { maxWidth: 640, margin: "0 auto" },

  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 24 },
  backBtn: { fontSize: 18, color: "#0b0e0a", textDecoration: "none" },
  headerIcon: {
    width: 40, height: 40, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 17, fontWeight: 800, flexShrink: 0,
  },
  headerName: { fontSize: 18, fontWeight: 800, color: "#0b0e0a", margin: 0 },
  headerSym: { fontSize: 13, fontWeight: 600, color: "rgba(11,14,10,0.45)" },

  errorBanner: { background: "#fef3cd", color: "#8a6d1a", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10, marginBottom: 20 },

  priceCard: { background: "#fff", borderRadius: 20, padding: "28px 24px", marginBottom: 20, border: "1px solid rgba(11,14,10,0.06)" },
  priceValue: { fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: "#0b0e0a", margin: "0 0 6px", letterSpacing: "-0.02em" },
  priceChg: { fontSize: 14, fontWeight: 700 },
  priceSkeleton: { width: 200, height: 40, borderRadius: 8, background: "rgba(11,14,10,0.06)", marginBottom: 20 },

  chartWrap: { height: 200, margin: "20px 0 8px" },
  chartSvg: { width: "100%", height: "100%", display: "block" },
  chartSkeleton: { width: "100%", height: "100%", borderRadius: 10, background: "rgba(11,14,10,0.04)" },

  rangeRow: { display: "flex", gap: 6, justifyContent: "center" },
  rangeBtn: {
    background: "transparent", border: "none", padding: "6px 14px", borderRadius: 999, fontSize: 12.5,
    fontWeight: 700, color: "rgba(11,14,10,0.4)", cursor: "pointer",
  },
  rangeBtnActive: { background: "rgba(61,92,255,0.08)", color: "#3D5CFF" },

  actionsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 },
  actionBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "#fff",
    border: "1px solid rgba(11,14,10,0.06)", borderRadius: 14, padding: "16px 8px", fontSize: 12.5,
    fontWeight: 700, color: "#0b0e0a", textDecoration: "none", transition: "background 0.15s",
  },
  actionIcon: {
    width: 34, height: 34, borderRadius: "50%", background: "#3D5CFF", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800,
  },

  section: { background: "#fff", borderRadius: 20, padding: "22px 24px", marginBottom: 20, border: "1px solid rgba(11,14,10,0.06)" },
  sectionTitle: { fontSize: 15, fontWeight: 800, color: "#0b0e0a", margin: "0 0 16px" },
  loadingRow: { fontSize: 13.5, color: "rgba(11,14,10,0.4)" },

  holdingRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  holdingAmt: { fontSize: 16, fontWeight: 700, color: "#0b0e0a" },
  holdingUsd: { fontSize: 14, color: "rgba(11,14,10,0.5)" },

  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  statCard: { display: "flex", flexDirection: "column", gap: 4 },
  statLabel: { fontSize: 12, fontWeight: 600, color: "rgba(11,14,10,0.45)" },
  statValue: { fontSize: 15, fontWeight: 700, color: "#0b0e0a" },

  activityList: { display: "flex", flexDirection: "column", gap: 10 },
  activityRow: { display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "#0b0e0a" },
};

export default AssetDetail;