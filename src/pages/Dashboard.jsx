import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../css/Dashboard.css";

// The API URL points to your backend, not your frontend.
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const TOKEN_META = {
  BTC: {
    name: "Bitcoin",
    icon: "₿",
    color: "#F7931A",
    coingeckoId: "bitcoin",
  },
  ETH: {
    name: "Ethereum",
    icon: "Ξ",
    color: "#627EEA",
    coingeckoId: "ethereum",
  },
  BNB: {
    name: "BNB Smart Chain",
    icon: "◆",
    color: "#F0B90B",
    coingeckoId: "binancecoin",
  },
  SOL: {
    name: "Solana",
    icon: "◎",
    color: "#14F195",
    coingeckoId: "solana",
  },
  USDT: {
    name: "Tether",
    icon: "T",
    color: "#26A17B",
    coingeckoId: "tether",
  },
  XRP: {
    name: "XRP",
    icon: "✕",
    color: "#23292F",
    coingeckoId: "ripple",
  },
};

const RPC = {
  ETH: "https://ethereum-rpc.publicnode.com",
  BSC: "https://bsc-dataseed.bnbchain.org",
};

// USDT on BNB Smart Chain.
const USDT_BSC =
  "0x55d398326f99059fF775485246999027B3197955";

// --------------------------------------------------
// FORMATTING
// --------------------------------------------------

function formatUsd(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "—";
  }

  return Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatAmount(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "—";
  }

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}

// --------------------------------------------------
// LIVE MARKET PRICES
// --------------------------------------------------

async function fetchLivePrices(symbols) {
  const ids = symbols
    .map((symbol) => TOKEN_META[symbol].coingeckoId)
    .join(",");

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  );

  if (!response.ok) {
    throw new Error(
      `Live price request failed (${response.status})`
    );
  }

  const data = await response.json();
  const prices = {};

  symbols.forEach((symbol) => {
    const id = TOKEN_META[symbol].coingeckoId;

    prices[symbol] = {
      price: data[id]?.usd ?? null,
      chg: data[id]?.usd_24h_change ?? 0,
    };
  });

  return prices;
}

// --------------------------------------------------
// BLOCKCHAIN HELPERS
// --------------------------------------------------

async function rpcCall(url, method, params) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Blockchain request failed (${response.status})`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error.message || "Blockchain request failed");
  }

  return result.result;
}

function hexToAmount(hex) {
  if (!hex || !/^0x[0-9a-f]+$/i.test(hex)) {
    return 0;
  }

  const amount = BigInt(hex);
  const whole = amount / 10n ** 18n;
  const fraction = amount % 10n ** 18n;

  return Number(
    `${whole}.${fraction.toString().padStart(18, "0")}`
  );
}

// This reads actual ETH, BNB and BSC USDT balances for
// the logged-in EVM address. It does not read your admin ledger.
async function getWalletHoldings(address) {
  const holdings = Object.keys(TOKEN_META).map((sym) => ({
    sym,
    amt: null,
  }));

  const warnings = [];

  if (!address || !ADDRESS_RE.test(address)) {
    warnings.push(
      "No valid wallet address is available for on-chain balance lookup"
    );

    return { holdings, warnings };
  }

  const setAmount = (symbol, amount) => {
    const item = holdings.find((holding) => holding.sym === symbol);

    if (item) {
      item.amt = amount;
    }
  };

  const paddedAddress = address
    .slice(2)
    .toLowerCase()
    .padStart(64, "0");

  const results = await Promise.allSettled([
    rpcCall(RPC.ETH, "eth_getBalance", [
      address,
      "latest",
    ]),

    rpcCall(RPC.BSC, "eth_getBalance", [
      address,
      "latest",
    ]),

    rpcCall(RPC.BSC, "eth_call", [
      {
        to: USDT_BSC,
        data: "0x70a08231" + paddedAddress,
      },
      "latest",
    ]),
  ]);

  if (results[0].status === "fulfilled") {
    setAmount("ETH", hexToAmount(results[0].value));
  } else {
    warnings.push("Could not read ETH balance");
    console.error("ETH balance error:", results[0].reason);
  }

  if (results[1].status === "fulfilled") {
    setAmount("BNB", hexToAmount(results[1].value));
  } else {
    warnings.push("Could not read BNB balance");
    console.error("BNB balance error:", results[1].reason);
  }

  if (results[2].status === "fulfilled") {
    setAmount("USDT", hexToAmount(results[2].value));
  } else {
    warnings.push("Could not read USDT balance");
    console.error("USDT balance error:", results[2].reason);
  }

  // BTC, SOL and XRP require their own networks/address support.
  return { holdings, warnings };
}

// Replace this later with your transaction-history API.
async function getWalletActivity() {
  return [];
}

// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

function Dashboard() {
  // Your AuthContext must provide the logged-in account's EVM address here.
  const { token: address, logout } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("crypto");

  const [assets, setAssets] = React.useState(null);
  const [activity, setActivity] = React.useState(null);

  // The backend returns { address, credits }.
  const [credits, setCredits] = React.useState(null);
  const [creditsLoading, setCreditsLoading] = React.useState(true);

  const [error, setError] = React.useState(null);
  const [creditError, setCreditError] = React.useState(null);
  const [buying, setBuying] = React.useState(false);

  // ------------------------------------------------
  // LOAD LIVE PRICES AND AVAILABLE WALLET DATA
  // ------------------------------------------------

  React.useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      const symbols = Object.keys(TOKEN_META);

      const [priceResult, holdingsResult, activityResult] =
        await Promise.allSettled([
          fetchLivePrices(symbols),
          getWalletHoldings(address),
          getWalletActivity(),
        ]);

      if (cancelled) return;

      const prices =
        priceResult.status === "fulfilled"
          ? priceResult.value
          : {};

      const holdingsData =
        holdingsResult.status === "fulfilled"
          ? holdingsResult.value
          : {
              holdings: symbols.map((sym) => ({
                sym,
                amt: null,
              })),
              warnings: ["Could not read wallet balances"],
            };

      const holdings = holdingsData.holdings || [];

      const merged = holdings.map((holding) => {
        const meta = TOKEN_META[holding.sym];

        return {
          sym: holding.sym,
          amt: holding.amt,
          name: meta.name,
          icon: meta.icon,
          color: meta.color,
          price: prices[holding.sym]?.price ?? null,
          chg: prices[holding.sym]?.chg ?? 0,
        };
      });

      const warnings = [...(holdingsData.warnings || [])];

      if (priceResult.status === "rejected") {
        warnings.push("Could not load live prices");
        console.error(
          "Live price error:",
          priceResult.reason
        );
      }

      if (holdingsResult.status === "rejected") {
        warnings.push("Could not read wallet balances");
        console.error(
          "Wallet holdings error:",
          holdingsResult.reason
        );
      }

      if (activityResult.status === "rejected") {
        console.error(
          "Wallet activity error:",
          activityResult.reason
        );
      }

      setAssets(merged);

      setActivity(
        activityResult.status === "fulfilled"
          ? activityResult.value
          : []
      );

      setError(
        warnings.length
          ? [...new Set(warnings)].join(". ")
          : null
      );
    }

    loadDashboardData().catch((err) => {
      if (cancelled) return;

      console.error("Dashboard loading error:", err);

      setError(
        err.message || "Failed to load dashboard data"
      );

      setAssets(
        Object.keys(TOKEN_META).map((sym) => ({
          sym,
          amt: null,
          name: TOKEN_META[sym].name,
          icon: TOKEN_META[sym].icon,
          color: TOKEN_META[sym].color,
          price: null,
          chg: 0,
        }))
      );

      setActivity([]);
    });

    return () => {
      cancelled = true;
    };
  }, [address]);

  // ------------------------------------------------
  // LOAD ADMIN-CREDITED ACCOUNT BALANCE
  // ------------------------------------------------

  React.useEffect(() => {
    let cancelled = false;

    async function loadAccountCredits() {
      setCreditsLoading(true);
      setCreditError(null);

      if (!address || !ADDRESS_RE.test(address)) {
        setCredits(null);
        setCreditError(
          "No valid account address is available to load admin credits"
        );
        setCreditsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE}/api/credits/${encodeURIComponent(address)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Could not load account credits"
          );
        }

        if (cancelled) return;

        setCredits({
  address: data.address,
  total: Number(data.total) || 0,
});
      } catch (err) {
        if (cancelled) return;

        console.error("Admin credit loading error:", err);

        setCredits(null);
        setCreditError(
          err.message || "Could not load admin credits"
        );
      } finally {
        if (!cancelled) {
          setCreditsLoading(false);
        }
      }
    }

    loadAccountCredits();

    return () => {
      cancelled = true;
    };
  }, [address]);

  // ------------------------------------------------
  // BUY COINS
  // ------------------------------------------------

  async function handleBuy() {
    setBuying(true);

    try {
      // The backend must create this URL using
      // DESTINATION_WALLET_ADDRESS from its private .env.
      // Do not put the private destination configuration in frontend code.
      const response = await fetch(`${API_BASE}/api/buy-url`);

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || "Could not open the purchase provider"
        );
      }

      const purchaseUrl = new URL(data.url);

      if (
        purchaseUrl.protocol !== "https:" ||
        purchaseUrl.hostname !== "buy.moonpay.com"
      ) {
        throw new Error("The purchase URL is not valid");
      }

      window.location.assign(purchaseUrl.toString());
    } catch (err) {
      console.error("Purchase URL error:", err);

      setError((current) =>
        [
          current,
          err.message || "Could not open the purchase provider",
        ]
          .filter(Boolean)
          .join(". ")
      );

      setBuying(false);
    }
  }

  // ------------------------------------------------
  // ACCOUNT BALANCE CALCULATIONS
  // ------------------------------------------------

  const liveAssetBalance = React.useMemo(() => {
    if (!assets) return 0;

    return assets.reduce((sum, asset) => {
      if (asset.amt == null || asset.price == null) {
        return sum;
      }

      return sum + asset.amt * asset.price;
    }, 0);
  }, [assets]);

 const adminCredits = Number(credits?.total || 0);

  // Includes the internal balance entered by your admin.
  // Admin credits are not automatically on-chain funds.
  const totalBalance = liveAssetBalance + adminCredits;

  const totalChangeUsd = React.useMemo(() => {
    if (!assets) return 0;

    return assets.reduce((sum, asset) => {
      if (asset.amt == null || asset.price == null) {
        return sum;
      }

      return (
        sum +
        asset.amt * asset.price * (asset.chg / 100)
      );
    }, 0);
  }, [assets]);

  const previousBalance = totalBalance - totalChangeUsd;

  const totalChangePct =
    previousBalance !== 0
      ? (totalChangeUsd / previousBalance) * 100
      : 0;

  const filteredAssets = (assets || []).filter(
    (asset) =>
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.sym.toLowerCase().includes(search.toLowerCase())
  );

  const errorMessages = [error, creditError]
    .filter(Boolean)
    .join(". ");

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; }

        .bf-dash-action:hover {
          transform: translateY(-2px);
        }

        .bf-dash-asset-row:hover {
          background: rgba(11,14,10,0.02) !important;
        }

        .bf-dash-tab:hover {
          color: #0b0e0a !important;
        }

        @keyframes bf-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 900px) {
          .bf-dash-actions {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .bf-dash-topbar {
            padding: 14px !important;
            gap: 10px !important;
            flex-wrap: wrap;
          }

          .bf-dash-wallet {
            max-width: 100%;
            font-size: 12px !important;
          }

          .bf-dash-search {
            order: 3;
            flex-basis: 100%;
            max-width: none !important;
          }

          .bf-dash-content {
            padding: 16px !important;
          }

          .bf-dash-balance-card {
            padding: 22px 18px !important;
          }

          .bf-dash-asset-row {
            grid-template-columns: 1.5fr 1fr !important;
            padding: 14px !important;
          }

          .bf-dash-col-hide {
            display: none !important;
          }
        }
      `}</style>

      <div style={styles.main}>
        {/* TOP BAR */}
        <header
          className="bf-dash-topbar"
          style={styles.topbar}
        >
          <div
            className="bf-dash-wallet"
            style={styles.walletSelector}
            title={address || ""}
          >
            <span style={styles.walletDot} />

            {address
              ? `${address.slice(0, 6)}…${address.slice(-4)}`
              : "My Wallet"}

            <span style={styles.walletCaret}>▾</span>
          </div>

          <div
            className="bf-dash-search"
            style={styles.topbarSearch}
          >
            <span style={styles.topbarSearchIcon}>🔍</span>

            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={styles.topbarSearchInput}
            />
          </div>

          <div style={styles.topbarRight}>
            <button
              style={styles.iconBtn}
              aria-label="Notifications"
              onClick={() => navigate("/notifications")}
            >
              🔔
            </button>

            <button
              style={{
                ...styles.iconBtn,
                fontSize: 13,
                fontWeight: 700,
              }}
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Log out
            </button>

            <div style={styles.avatar}>B</div>
          </div>
        </header>

        <div
          className="bf-dash-content"
          style={styles.content}
        >
          {/* ERROR MESSAGE */}
          {errorMessages && (
            <div style={styles.errorBanner}>
              Couldn't load live data: {errorMessages}. Showing what's available.
            </div>
          )}

          {/* BALANCE CARD */}
          <div
            className="bf-dash-balance-card"
            style={styles.balanceCard}
          >
            <span style={styles.balanceLabel}>
              Total Balance
            </span>

            {assets === null || creditsLoading ? (
              <div style={styles.balanceSkeleton} />
            ) : (
              <>
                <h1 style={styles.balanceValue}>
                  {formatUsd(totalBalance)}
                </h1>

                <span
                  style={{
                    ...styles.balanceChange,
                    color:
                      totalChangeUsd >= 0
                        ? "#0ecb81"
                        : "#f6465d",
                  }}
                >
                  {totalChangeUsd >= 0 ? "↑" : "↓"}{" "}
                  {formatUsd(Math.abs(totalChangeUsd))} (
                  {totalChangePct >= 0 ? "+" : ""}
                  {totalChangePct.toFixed(2)}%)
                </span>

                <div style={styles.creditNote}>
                  Wallet credited account balance:{" "}
                  <strong>{formatUsd(adminCredits)}</strong>
                </div>
              </>
            )}

            {/* ACTION BUTTONS */}
            <div
              className="bf-dash-actions"
              style={styles.actionsGrid}
            >
              {[
                { icon: "↑", label: "Send", path: "/send" },
                { icon: "↓", label: "Receive", path: "/receive" },
                { icon: "💳", label: "Buy & Sell", path: "/buy-sell" },
                { icon: "⋯", label: "More", path: "/swap" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="bf-dash-action"
                  style={{
                    ...styles.actionBtn,
                    ...(buying && action.label === "Buy & Sell"
                      ? { opacity: 0.65 }
                      : {}),
                  }}
                  disabled={
                    buying && action.label === "Buy & Sell"
                  }
                  onClick={() => {
                    if (action.label === "Buy & Sell") {
                      handleBuy();
                    } else {
                      navigate(action.path);
                    }
                  }}
                >
                  <span style={styles.actionIcon}>
                    {action.icon}
                  </span>

                  {buying && action.label === "Buy & Sell"
                    ? "Opening..."
                    : action.label}
                </button>
              ))}
            </div>
          </div>

          {/* ASSETS / NFTS */}
          <div
            className="bf-dash-assets-section"
            style={styles.assetsSection}
          >
            <div style={styles.tabRow}>
              <button
                className="bf-dash-tab"
                style={{
                  ...styles.tab,
                  ...(activeTab === "crypto"
                    ? styles.tabActive
                    : {}),
                }}
                onClick={() => setActiveTab("crypto")}
              >
                Crypto
              </button>

              <button
                className="bf-dash-tab"
                style={{
                  ...styles.tab,
                  ...(activeTab === "nft"
                    ? styles.tabActive
                    : {}),
                }}
                onClick={() => setActiveTab("nft")}
              >
                NFTs
              </button>
            </div>

            {activeTab === "crypto" ? (
              <div style={styles.assetTable}>
                <div
                  className="bf-dash-asset-row"
                  style={styles.assetHeaderRow}
                >
                  <span>Asset</span>

                  <span
                    className="bf-dash-col-hide"
                    style={styles.assetHeaderRight}
                  >
                    Price
                  </span>

                  <span
                    className="bf-dash-col-hide"
                    style={styles.assetHeaderRight}
                  >
                    24h
                  </span>

                  <span style={styles.assetHeaderRight}>
                    Balance
                  </span>
                </div>

                {assets === null ? (
                  <div style={styles.emptyState}>
                    Loading assets…
                  </div>
                ) : filteredAssets.length === 0 ? (
                  <div style={styles.emptyState}>
                    {search
                      ? `No assets match "${search}"`
                      : "No assets in this wallet yet"}
                  </div>
                ) : (
                  filteredAssets.map((asset) => (
                    <div
                      key={asset.sym}
                      className="bf-dash-asset-row"
                      style={styles.assetRow}
                    >
                      <span style={styles.assetName}>
                        <span
                          style={{
                            ...styles.assetIconCircle,
                            background: asset.color,
                          }}
                        >
                          {asset.icon}
                        </span>

                        <span>
                          <span style={styles.assetSym}>
                            {asset.sym}
                          </span>

                          <span style={styles.assetFullName}>
                            {asset.name}
                          </span>
                        </span>
                      </span>

                      <span
                        className="bf-dash-col-hide"
                        style={styles.assetPrice}
                      >
                        {formatUsd(asset.price)}
                      </span>

                      <span
                        className="bf-dash-col-hide"
                        style={{
                          ...styles.assetChg,
                          color:
                            asset.chg >= 0
                              ? "#0ecb81"
                              : "#f6465d",
                        }}
                      >
                        {asset.chg >= 0 ? "+" : ""}
                        {Number(asset.chg).toFixed(2)}%
                      </span>

                      <span style={styles.assetBalance}>
                        <span style={styles.assetBalanceAmt}>
                          {formatAmount(asset.amt)}
                        </span>

                        <span style={styles.assetBalanceUsd}>
                          {asset.amt == null ||
                          asset.price == null
                            ? "—"
                            : formatUsd(
                                asset.amt * asset.price
                              )}
                        </span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={styles.nftEmpty}>
                <span style={styles.nftEmptyIcon}>🖼️</span>

                <p style={styles.nftEmptyText}>
                  No NFTs yet. Explore collections to get started.
                </p>
              </div>
            )}
          </div>

          {/* RECENT ACTIVITY */}
          <div
            className="bf-dash-activity-section"
            style={styles.activitySection}
          >
            <h3 style={styles.activityTitle}>
              Recent Activity
            </h3>

            <div style={styles.activityList}>
              {activity === null ? (
                <div style={styles.emptyState}>
                  Loading activity…
                </div>
              ) : activity.length === 0 ? (
                <div style={styles.emptyState}>
                  No recent activity yet
                </div>
              ) : (
                activity.map((transaction, index) => (
                  <div
                    key={transaction.id || index}
                    style={styles.activityRow}
                  >
                    <div style={styles.activityLeft}>
                      <span style={styles.activityIcon}>
                        {transaction.type === "Receive"
                          ? "↓"
                          : "🔄"}
                      </span>

                      <div>
                        <div style={styles.activityType}>
                          {transaction.type}

                          {transaction.status && (
                            <span style={styles.activityStatus}>
                              {transaction.status}
                            </span>
                          )}
                        </div>

                        <div style={styles.activityAsset}>
                          {transaction.asset}
                        </div>
                      </div>
                    </div>

                    <div style={styles.activityRight}>
                      <span
                        style={{
                          ...styles.activityAmt,
                          color: String(
                            transaction.amt || ""
                          ).startsWith("+")
                            ? "#0ecb81"
                            : "#0b0e0a",
                        }}
                      >
                        {transaction.amt}
                      </span>

                      <span style={styles.activityDate}>
                        {transaction.date}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = {
  page: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: "#f4f4f6",
    minHeight: "100vh",
  },

  main: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  topbar: {
    background: "#ffffff",
    borderBottom: "1px solid rgba(11,14,10,0.06)",
    padding: "16px 32px",
    display: "flex",
    alignItems: "center",
    gap: 24,
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  walletSelector: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#f4f4f6",
    borderRadius: 999,
    padding: "9px 16px",
    fontSize: 13.5,
    fontWeight: 700,
    color: "#0b0e0a",
    cursor: "pointer",
    flexShrink: 0,
  },

  walletDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#3D5CFF",
  },

  walletCaret: {
    fontSize: 10,
    color: "rgba(11,14,10,0.4)",
  },

  topbarSearch: {
    flex: 1,
    maxWidth: 420,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#f4f4f6",
    borderRadius: 999,
    padding: "10px 16px",
  },

  topbarSearchIcon: {
    fontSize: 13,
    opacity: 0.5,
  },

  topbarSearchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 14,
    flex: 1,
    fontFamily: "inherit",
    minWidth: 0,
  },

  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginLeft: "auto",
  },

  iconBtn: {
    background: "transparent",
    border: "none",
    fontSize: 17,
    cursor: "pointer",
    padding: 4,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#3D5CFF",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
  },

  content: {
    padding: 32,
    maxWidth: 900,
    width: "100%",
    margin: "0 auto",
  },

  balanceCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "32px 36px",
    marginBottom: 24,
    border: "1px solid rgba(11,14,10,0.06)",
  },

  balanceLabel: {
    fontSize: 13.5,
    fontWeight: 600,
    color: "rgba(11,14,10,0.5)",
  },

  balanceValue: {
    fontSize: "clamp(2rem, 4vw, 2.6rem)",
    fontWeight: 800,
    color: "#0b0e0a",
    margin: "6px 0",
    letterSpacing: "-0.02em",
    overflowWrap: "anywhere",
  },

  balanceSkeleton: {
    width: 220,
    maxWidth: "100%",
    height: 44,
    borderRadius: 8,
    background: "rgba(11,14,10,0.06)",
    margin: "10px 0 20px",
    animation: "bf-pulse 1.4s ease-in-out infinite",
  },

  errorBanner: {
    background: "#fef3cd",
    color: "#8a6d1a",
    fontSize: 13.5,
    fontWeight: 600,
    padding: "12px 18px",
    borderRadius: 10,
    marginBottom: 20,
    overflowWrap: "anywhere",
  },

  balanceChange: {
    fontSize: 14,
    fontWeight: 700,
  },

  creditNote: {
    fontSize: 13,
    color: "#4b5563",
    marginTop: 12,
  },

  balanceDisclaimer: {
    fontSize: 11.5,
    lineHeight: 1.6,
    color: "#767b85",
    marginTop: 5,
    maxWidth: 520,
  },

  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginTop: 28,
  },

  actionBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    background: "#f4f4f6",
    border: "none",
    borderRadius: 14,
    padding: "16px 8px",
    fontSize: 13,
    fontWeight: 700,
    color: "#0b0e0a",
    cursor: "pointer",
    transition: "transform 0.15s",
  },

  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#3D5CFF",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 800,
  },

  assetsSection: {
    background: "#ffffff",
    borderRadius: 20,
    border: "1px solid rgba(11,14,10,0.06)",
    marginBottom: 24,
    overflow: "hidden",
  },

  tabRow: {
    display: "flex",
    gap: 4,
    padding: "16px 24px 0",
  },

  tab: {
    background: "transparent",
    border: "none",
    padding: "10px 4px",
    marginRight: 20,
    fontSize: 15,
    fontWeight: 700,
    color: "rgba(11,14,10,0.4)",
    cursor: "pointer",
    borderBottom: "2px solid transparent",
  },

  tabActive: {
    color: "#0b0e0a",
    borderBottom: "2px solid #3D5CFF",
  },

  assetTable: {
    padding: "8px 0",
  },

  assetHeaderRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1.2fr",
    padding: "14px 24px",
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(11,14,10,0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  assetHeaderRight: {
    textAlign: "right",
  },

  assetRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1.2fr",
    padding: "14px 24px",
    alignItems: "center",
    borderTop: "1px solid rgba(11,14,10,0.04)",
    transition: "background 0.15s",
  },

  assetName: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  assetIconCircle: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 800,
    flexShrink: 0,
  },

  assetSym: {
    display: "block",
    fontSize: 14.5,
    fontWeight: 700,
    color: "#0b0e0a",
  },

  assetFullName: {
    display: "block",
    fontSize: 12.5,
    color: "rgba(11,14,10,0.45)",
  },

  assetPrice: {
    textAlign: "right",
    fontSize: 14,
    fontWeight: 600,
    color: "#0b0e0a",
  },

  assetChg: {
    textAlign: "right",
    fontSize: 13.5,
    fontWeight: 700,
  },

  assetBalance: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    minWidth: 0,
  },

  assetBalanceAmt: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0b0e0a",
    overflowWrap: "anywhere",
  },

  assetBalanceUsd: {
    fontSize: 12.5,
    color: "rgba(11,14,10,0.45)",
  },

  emptyState: {
    padding: "40px 24px",
    textAlign: "center",
    fontSize: 14,
    color: "rgba(11,14,10,0.5)",
  },

  nftEmpty: {
    padding: "60px 24px",
    textAlign: "center",
  },

  nftEmptyIcon: {
    fontSize: 32,
    display: "block",
    marginBottom: 12,
  },

  nftEmptyText: {
    fontSize: 14,
    color: "rgba(11,14,10,0.45)",
    margin: 0,
  },

  activitySection: {
    background: "#ffffff",
    borderRadius: 20,
    border: "1px solid rgba(11,14,10,0.06)",
    padding: 24,
  },

  activityTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: "#0b0e0a",
    margin: "0 0 16px",
  },

  activityList: {
    display: "flex",
    flexDirection: "column",
  },

  activityRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "14px 0",
    borderTop: "1px solid rgba(11,14,10,0.04)",
  },

  activityLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(61,92,255,0.08)",
    color: "#3D5CFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
  },

  activityType: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0b0e0a",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  activityStatus: {
    fontSize: 10.5,
    fontWeight: 700,
    background: "#fef3cd",
    color: "#8a6d1a",
    padding: "2px 8px",
    borderRadius: 999,
  },

  activityAsset: {
    fontSize: 12.5,
    color: "rgba(11,14,10,0.45)",
    marginTop: 2,
  },

  activityRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    flexShrink: 0,
  },

  activityAmt: {
    fontSize: 14,
    fontWeight: 700,
  },

  activityDate: {
    fontSize: 12,
    color: "rgba(11,14,10,0.4)",
    marginTop: 2,
  },
};

export default Dashboard;