
import React from "react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

const TOKEN_META = {
  BTC: { name: "Bitcoin", icon: "₿", color: "#F7931A" },
  ETH: { name: "Ethereum", icon: "Ξ", color: "#627EEA" },
  BNB: { name: "BNB Smart Chain", icon: "◆", color: "#F0B90B" },
  SOL: { name: "Solana", icon: "◎", color: "#14F195" },
  USDT: { name: "Tether", icon: "T", color: "#26A17B" },
  XRP: { name: "XRP", icon: "✕", color: "#23292F" },
  USD: { name: "Admin Account Credit", icon: "$", color: "#16A36A" },
};

const TX_TYPES = ["All", "Admin Credit", "Send", "Receive", "Swap", "Buy"];
const PAGE_SIZE = 15;

// Get the logged-in wallet address.
function getWalletAddress() {
  const directAddress =
    localStorage.getItem("walletAddress") ||
    localStorage.getItem("address");

  if (directAddress && ADDRESS_RE.test(directAddress)) {
    return directAddress;
  }

  // Also check the saved user object.
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    const address =
      user.address ||
      user.walletAddress ||
      user.wallet?.address;

    if (address && ADDRESS_RE.test(address)) {
      return address;
    }
  } catch {
    console.warn("Could not read saved account details.");
  }

  return "";
}

// Load actual admin ledger entries from the backend.
async function fetchTransactions({ address, page, type, asset, query }) {
  if (!address || !ADDRESS_RE.test(address)) {
    throw new Error(
      "Your wallet address was not found. Please log in again."
    );
  }

  const sessionToken =
    localStorage.getItem("sessionToken") || "";

  const response = await fetch(
    `${API_BASE}/api/credits/${encodeURIComponent(address)}`,
    {
      headers: {
        ...(sessionToken
          ? { Authorization: `Bearer ${sessionToken}` }
          : {}),
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Could not load account transactions."
    );
  }

  // The server returns admin credits in data.entries.
  const allTransactions = (data.entries || []).map(
    (entry, index) => {
      const amount = Number(entry.amount);

      return {
        id: entry.id || `${entry.date}-${index}`,
        type: "Admin Credit",
        sym: "USD",
        amt: `+$${amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        amount,
        date: entry.date,
        note: entry.note || "Credit added by administrator",
        address,
      };
    }
  );

  // Apply filters.
  const filtered = allTransactions.filter((tx) => {
    const matchesType =
      type === "All" || tx.type === type;

    const matchesAsset =
      asset === "All" || tx.sym === asset;

    const search = query.toLowerCase();

    const matchesQuery =
      !search ||
      tx.address.toLowerCase().includes(search) ||
      tx.note.toLowerCase().includes(search) ||
      tx.id.toLowerCase().includes(search);

    return matchesType && matchesAsset && matchesQuery;
  });

  const total = filtered.length;

  const start = (page - 1) * PAGE_SIZE;

  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    total,
  };
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function TransactionHistory() {
  const [type, setType] = React.useState("All");
  const [asset, setAsset] = React.useState("All");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const address = getWalletAddress();

  React.useEffect(() => {
    let cancelled = false;

    async function loadTransactions() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchTransactions({
          address,
          page,
          type,
          asset,
          query,
        });

        if (!cancelled) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Failed to load transactions."
          );

          setResult({
            items: [],
            total: 0,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [address, page, type, asset, query]);

  // Reset pagination when filters change.
  React.useEffect(() => {
    setPage(1);
  }, [type, asset, query]);

  const totalPages = result
    ? Math.max(1, Math.ceil(result.total / PAGE_SIZE))
    : 1;

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; }

        .bf-tx-filter:hover {
          border-color: rgba(61,92,255,0.4) !important;
        }

        .bf-tx-row:hover {
          background: rgba(11,14,10,0.02) !important;
        }

        .bf-tx-page:hover:not(:disabled) {
          background: rgba(11,14,10,0.05) !important;
        }

        .bf-tx-page:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media(max-width: 600px) {
          .bf-tx-row,
          .bf-tx-header {
            grid-template-columns: 1.3fr 1fr 1fr !important;
            padding: 12px !important;
          }

          .bf-tx-date {
            display: none !important;
          }
        }
      `}</style>

      <div style={styles.wrap}>

        {/* HEADER */}

        <div style={styles.header}>
          <a
            href="/dashboard"
            style={styles.backBtn}
            aria-label="Back to dashboard"
          >
            ←
          </a>

          <h1 style={styles.headerTitle}>
            Transaction History
          </h1>
        </div>

        {/* ACCOUNT ADDRESS */}

        <div style={styles.accountCard}>
          <span style={styles.accountLabel}>
            Account wallet
          </span>

          <span style={styles.accountAddress}>
            {address
              ? `${address.slice(0, 8)}...${address.slice(-6)}`
              : "Wallet address unavailable"}
          </span>
        </div>

        {/* FILTERS */}

        <div style={styles.filters}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>

            <input
              type="text"
              placeholder="Search address or credit note..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <select
            className="bf-tx-filter"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={styles.selectFilter}
          >
            {TX_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            className="bf-tx-filter"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            style={styles.selectFilter}
          >
            <option value="All">All Assets</option>

            <option value="USD">USD Admin Credits</option>
          </select>
        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.errorBanner}>
            Couldn't load transactions: {error}
          </div>
        )}

        {/* CREDIT SUMMARY */}

        {result && (
          <div style={styles.summaryCard}>
            <div>
              <span style={styles.summaryLabel}>
                Admin credit transactions
              </span>

              <h2 style={styles.summaryValue}>
                {result.total}
              </h2>
            </div>

            <span style={styles.summaryIcon}>↓</span>
          </div>
        )}

        {/* TABLE */}

        <div style={styles.tableCard}>
          <div
            className="bf-tx-header"
            style={styles.headerRow}
          >
            <span>Type</span>
            <span>Asset</span>
            <span style={styles.right}>Amount</span>

            <span
              className="bf-tx-date"
              style={styles.right}
            >
              Date
            </span>
          </div>

          {loading ? (
            <div style={styles.emptyState}>
              Loading transactions…
            </div>
          ) : result?.items.length === 0 ? (
            <div style={styles.emptyState}>
              {query || type !== "All" || asset !== "All"
                ? "No transactions match your filters."
                : "No credits yet. When your administrator credits your account, the transaction will appear here."}
            </div>
          ) : (
            result.items.map((tx) => (
              <div
                key={tx.id}
                className="bf-tx-row"
                style={styles.row}
              >
                {/* TYPE */}

                <span style={styles.typeCell}>
                  <span style={styles.typeIcon}>
                    ↓
                  </span>

                  <span>
                    {tx.type}
                  </span>
                </span>

                {/* ASSET */}

                <span style={styles.assetCell}>
                  <span
                    style={{
                      ...styles.assetIconCircle,
                      background: TOKEN_META[tx.sym].color,
                    }}
                  >
                    {TOKEN_META[tx.sym].icon}
                  </span>

                  {tx.sym}
                </span>

                {/* AMOUNT */}

                <span
                  style={{
                    ...styles.right,
                    ...styles.amountCell,
                    color: "#0ecb81",
                  }}
                >
                  {tx.amt}
                </span>

                {/* DATE */}

                <span
                  className="bf-tx-date"
                  style={{
                    ...styles.right,
                    ...styles.dateCell,
                  }}
                >
                  {formatDate(tx.date)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION */}

        {result && result.total > 0 && (
          <div style={styles.pagination}>
            <button
              className="bf-tx-page"
              style={styles.pageBtn}
              disabled={page <= 1 || loading}
              onClick={() =>
                setPage((p) => Math.max(1, p - 1))
              }
            >
              ← Prev
            </button>

            <span style={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>

            <button
              className="bf-tx-page"
              style={styles.pageBtn}
              disabled={page >= totalPages || loading}
              onClick={() =>
                setPage((p) => Math.min(totalPages, p + 1))
              }
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = {
  page: {
    fontFamily: "'Inter', -apple-system, sans-serif",
    background: "#f4f4f6",
    minHeight: "100vh",
    padding: "32px 20px",
  },

  wrap: {
    maxWidth: 800,
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },

  backBtn: {
    fontSize: 18,
    color: "#0b0e0a",
    textDecoration: "none",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0b0e0a",
    margin: 0,
  },

  accountCard: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "#fff",
    borderRadius: 12,
    border: "1px solid rgba(11,14,10,0.06)",
    padding: "15px 18px",
    marginBottom: 18,
  },

  accountLabel: {
    fontSize: 11,
    color: "rgba(11,14,10,0.45)",
    fontWeight: 700,
    textTransform: "uppercase",
  },

  accountAddress: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0b0e0a",
    overflowWrap: "anywhere",
  },

  filters: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },

  searchWrap: {
    flex: 1,
    minWidth: 220,
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#fff",
    border: "1.5px solid rgba(11,14,10,0.1)",
    borderRadius: 10,
    padding: "10px 14px",
  },

  searchIcon: {
    fontSize: 13,
    opacity: 0.5,
  },

  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 13.5,
    flex: 1,
    fontFamily: "inherit",
    minWidth: 0,
  },

  selectFilter: {
    border: "1.5px solid rgba(11,14,10,0.1)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13.5,
    fontFamily: "inherit",
    color: "#0b0e0a",
    background: "#fff",
    outline: "none",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },

  errorBanner: {
    background: "#fef3cd",
    color: "#8a6d1a",
    fontSize: 13,
    fontWeight: 600,
    padding: "12px 16px",
    borderRadius: 10,
    marginBottom: 18,
    overflowWrap: "anywhere",
  },

  summaryCard: {
    background: "#fff",
    border: "1px solid rgba(11,14,10,0.06)",
    borderRadius: 14,
    padding: "18px 20px",
    marginBottom: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(11,14,10,0.5)",
  },

  summaryValue: {
    fontSize: 24,
    fontWeight: 800,
    margin: "5px 0 0",
    color: "#0b0e0a",
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "rgba(14,203,129,0.1)",
    color: "#0ecb81",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 800,
  },

  tableCard: {
    background: "#fff",
    borderRadius: 18,
    border: "1px solid rgba(11,14,10,0.06)",
    overflow: "hidden",
  },

  headerRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    padding: "14px 22px",
    fontSize: 12,
    fontWeight: 700,
    color: "rgba(11,14,10,0.4)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },

  right: {
    textAlign: "right",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    padding: "14px 22px",
    alignItems: "center",
    borderTop: "1px solid rgba(11,14,10,0.04)",
    fontSize: 13.5,
  },

  typeCell: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 700,
    color: "#0b0e0a",
  },

  typeIcon: {
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: "rgba(14,203,129,0.1)",
    color: "#0ecb81",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    flexShrink: 0,
  },

  assetCell: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 600,
    color: "#0b0e0a",
  },

  assetIconCircle: {
    width: 22,
    height: 22,
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 800,
    flexShrink: 0,
  },

  amountCell: {
    fontWeight: 700,
  },

  dateCell: {
    color: "rgba(11,14,10,0.5)",
  },

  emptyState: {
    padding: "50px 24px",
    textAlign: "center",
    fontSize: 14,
    color: "rgba(11,14,10,0.4)",
  },

  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 20,
  },

  pageBtn: {
    background: "#fff",
    border: "1px solid rgba(11,14,10,0.1)",
    borderRadius: 999,
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 700,
    color: "#0b0e0a",
    cursor: "pointer",
    transition: "background 0.15s",
  },

  pageInfo: {
    fontSize: 13,
    color: "rgba(11,14,10,0.5)",
  },
};

export default TransactionHistory;
