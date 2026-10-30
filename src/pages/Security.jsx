import React from "react";

// TODO: replace with real BIP-39 wordlist + real derivation from the user's
// actual wallet seed. This placeholder list is small and NOT cryptographically
// suitable for production — see the same note in Login.jsx.
const WORD_LIST = [
  "anchor", "bridge", "canyon", "delta", "ember", "falcon", "glacier", "harbor",
  "island", "jungle", "kernel", "lantern", "meadow", "nebula", "orbit", "pebble",
  "quartz", "ridge", "summit", "timber", "umbra", "valley", "willow", "zephyr",
];

// TODO: replace with a real call to your backend that re-derives/decrypts
// the user's actual existing recovery phrase after verifying their password
// (never regenerate a new one for an existing wallet — that would orphan
// their funds). This placeholder simulates that verification step.
async function verifyPasswordAndGetPhrase(password) {
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (!password) throw new Error("Password is required");
  // Deterministic mock so repeated calls in this session show the same
  // "phrase" rather than a new random one each time — still fake data,
  // just consistent fake data.
  return WORD_LIST.slice(0, 12);
}

// TODO: replace with a real backend call to update the account password.
async function changePassword({ current, next }) {
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (!current) throw new Error("Current password is required");
  if (next.length < 8) throw new Error("New password must be at least 8 characters");
  return { ok: true };
}

// TODO: replace with a real 2FA enrollment call — e.g. generate a TOTP
// secret + QR code server-side (via a library like speakeasy/otplib), and
// verify the user's first code before marking 2FA as enabled.
async function get2faStatus() {
  return { enabled: false };
}
async function enable2fa() {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { ok: true };
}
async function disable2fa() {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { ok: true };
}

function Security() {
  const [openSection, setOpenSection] = React.useState(null); // "password" | "phrase" | "2fa" | null

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-sec-card:hover { border-color: rgba(61,92,255,0.25) !important; }
        .bf-sec-cta:hover:not(:disabled) { background: #2A47E0 !important; }
        .bf-sec-copy:hover { background: #eef0f4 !important; }
      `}</style>

      <div style={styles.wrap}>
        <div style={styles.header}>
          <a href="/settings" style={styles.backBtn} aria-label="Back to settings">←</a>
          <h1 style={styles.headerTitle}>Security</h1>
        </div>

        <ChangePasswordCard
          open={openSection === "password"}
          onToggle={() => setOpenSection(openSection === "password" ? null : "password")}
        />
        <RecoveryPhraseCard
          open={openSection === "phrase"}
          onToggle={() => setOpenSection(openSection === "phrase" ? null : "phrase")}
        />
        <TwoFactorCard
          open={openSection === "2fa"}
          onToggle={() => setOpenSection(openSection === "2fa" ? null : "2fa")}
        />
      </div>
    </div>
  );
}

function SecuritySectionCard({ icon, title, subtitle, open, onToggle, children }) {
  return (
    <div className="bf-sec-card" style={styles.card}>
      <button style={styles.cardHead} onClick={onToggle}>
        <span style={styles.cardIcon}>{icon}</span>
        <span style={styles.cardHeadText}>
          <span style={styles.cardTitle}>{title}</span>
          <span style={styles.cardSubtitle}>{subtitle}</span>
        </span>
        <span style={{ ...styles.chevron, transform: open ? "rotate(90deg)" : "none" }}>›</span>
      </button>
      {open && <div style={styles.cardBody}>{children}</div>}
    </div>
  );
}

function ChangePasswordCard({ open, onToggle }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);

  const canSubmit = current && next && next === confirm;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (next !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    setSaving(true);
    try {
      await changePassword({ current, next });
      setSuccess(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SecuritySectionCard
      icon="🔑"
      title="Change Password"
      subtitle="Update the password used to unlock your wallet"
      open={open}
      onToggle={onToggle}
    >
      <form style={styles.form} onSubmit={handleSubmit}>
        <label style={styles.label}>
          Current password
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            style={styles.input}
            required
          />
        </label>
        <label style={styles.label}>
          New password
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            style={styles.input}
            minLength={8}
            required
          />
        </label>
        <label style={styles.label}>
          Confirm new password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={styles.input}
            required
          />
        </label>

        {error && <div style={styles.errorText}>{error}</div>}
        {success && <div style={styles.successText}>✓ Password updated</div>}

        <button
          type="submit"
          className="bf-sec-cta"
          style={{ ...styles.primaryBtn, opacity: canSubmit ? 1 : 0.5 }}
          disabled={!canSubmit || saving}
        >
          {saving ? "Updating…" : "Update Password"}
        </button>
      </form>
    </SecuritySectionCard>
  );
}

function RecoveryPhraseCard({ open, onToggle }) {
  const [stage, setStage] = React.useState("verify"); // "verify" | "revealed"
  const [password, setPassword] = React.useState("");
  const [phrase, setPhrase] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [copied, setCopied] = React.useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const words = await verifyPasswordAndGetPhrase(password);
      setPhrase(words);
      setStage("revealed");
    } catch (err) {
      setError(err.message || "Incorrect password");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!phrase) return;
    navigator.clipboard?.writeText(phrase.join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    onToggle();
    setStage("verify");
    setPassword("");
    setPhrase(null);
    setError(null);
  }

  return (
    <SecuritySectionCard
      icon="📝"
      title="Backup Recovery Phrase"
      subtitle="View your 12-word phrase again to re-confirm your backup"
      open={open}
      onToggle={open ? handleClose : onToggle}
    >
      {stage === "verify" ? (
        <form style={styles.form} onSubmit={handleVerify}>
          <p style={styles.warningText}>
            Enter your password to view your recovery phrase. Make sure no one
            else can see your screen.
          </p>
          <label style={styles.label}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </label>
          {error && <div style={styles.errorText}>{error}</div>}
          <button type="submit" className="bf-sec-cta" style={styles.primaryBtn} disabled={loading}>
            {loading ? "Verifying…" : "Reveal Phrase"}
          </button>
        </form>
      ) : (
        <>
          <div style={styles.phraseGrid}>
            {phrase.map((word, i) => (
              <div key={i} style={styles.phraseWord}>
                <span style={styles.phraseWordNum}>{i + 1}</span>
                {word}
              </div>
            ))}
          </div>
          <button type="button" className="bf-sec-copy" style={styles.copyBtn} onClick={handleCopy}>
            {copied ? "✓ Copied" : "📋 Copy to clipboard"}
          </button>
          <p style={styles.warningText}>
            Never share this phrase with anyone. Trust Coin Wallets staff will never ask
            for it.
          </p>
        </>
      )}
    </SecuritySectionCard>
  );
}

function TwoFactorCard({ open, onToggle }) {
  const [enabled, setEnabled] = React.useState(null);
  const [stage, setStage] = React.useState("status"); // "status" | "setup" | "confirm"
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [code, setCode] = React.useState("");

  React.useEffect(() => {
    get2faStatus().then((s) => setEnabled(s.enabled));
  }, []);

  async function handleEnableConfirm(e) {
    e.preventDefault();
    setError(null);
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    try {
      await enable2fa();
      setEnabled(true);
      setStage("status");
      setCode("");
    } catch (err) {
      setError(err.message || "Failed to enable 2FA");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setError(null);
    try {
      await disable2fa();
      setEnabled(false);
    } catch (err) {
      setError(err.message || "Failed to disable 2FA");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SecuritySectionCard
      icon="🛡️"
      title="Two-Factor Authentication"
      subtitle={enabled === null ? "Checking status…" : enabled ? "Enabled" : "Not enabled"}
      open={open}
      onToggle={onToggle}
    >
      {enabled === null ? (
        <div style={styles.loadingRow}>Loading…</div>
      ) : stage === "status" ? (
        <>
          <p style={styles.warningText}>
            {enabled
              ? "Two-factor authentication is protecting your account. You'll need a code from your authenticator app to log in on new devices."
              : "Add an extra layer of security by requiring a code from an authenticator app when logging in."}
          </p>
          {error && <div style={styles.errorText}>{error}</div>}
          {enabled ? (
            <button
              className="bf-sec-cta"
              style={{ ...styles.primaryBtn, background: "#f6465d" }}
              onClick={handleDisable}
              disabled={busy}
            >
              {busy ? "Disabling…" : "Disable 2FA"}
            </button>
          ) : (
            <button className="bf-sec-cta" style={styles.primaryBtn} onClick={() => setStage("setup")}>
              Set Up 2FA
            </button>
          )}
        </>
      ) : (
        <form style={styles.form} onSubmit={handleEnableConfirm}>
          <p style={styles.warningText}>
            Scan this QR code with an authenticator app (Google Authenticator,
            Authy, etc.), then enter the 6-digit code it generates.
          </p>
          <div style={styles.qrPlaceholder}>
            <span style={styles.qrPlaceholderText}>QR code from your backend</span>
          </div>
          <label style={styles.label}>
            6-digit code
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={styles.input}
              placeholder="000000"
              inputMode="numeric"
            />
          </label>
          {error && <div style={styles.errorText}>{error}</div>}
          <button type="submit" className="bf-sec-cta" style={styles.primaryBtn} disabled={busy}>
            {busy ? "Verifying…" : "Confirm & Enable"}
          </button>
        </form>
      )}
    </SecuritySectionCard>
  );
}

const styles = {
  page: { fontFamily: "'Inter', -apple-system, sans-serif", background: "#f4f4f6", minHeight: "100vh", padding: "32px 20px" },
  wrap: { maxWidth: 560, margin: "0 auto" },

  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },
  backBtn: { fontSize: 18, color: "#0b0e0a", textDecoration: "none" },
  headerTitle: { fontSize: 20, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  card: { background: "#fff", borderRadius: 18, border: "1.5px solid rgba(11,14,10,0.06)", marginBottom: 16, overflow: "hidden", transition: "border-color 0.2s" },
  cardHead: {
    width: "100%", display: "flex", alignItems: "center", gap: 14, background: "transparent",
    border: "none", padding: "18px 20px", cursor: "pointer", textAlign: "left",
  },
  cardIcon: { fontSize: 20 },
  cardHeadText: { display: "flex", flexDirection: "column", flex: 1 },
  cardTitle: { fontSize: 14.5, fontWeight: 700, color: "#0b0e0a" },
  cardSubtitle: { fontSize: 12.5, color: "rgba(11,14,10,0.45)", marginTop: 2 },
  chevron: { fontSize: 18, color: "rgba(11,14,10,0.3)", transition: "transform 0.2s" },
  cardBody: { padding: "0 20px 22px" },

  form: { display: "flex", flexDirection: "column", gap: 14 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.6)" },
  input: {
    border: "1.5px solid rgba(11,14,10,0.15)", borderRadius: 10, padding: "12px 14px",
    fontSize: 14, fontFamily: "inherit", color: "#0b0e0a", outline: "none",
  },
  errorText: { fontSize: 12.5, color: "#f6465d", fontWeight: 600 },
  successText: { fontSize: 12.5, color: "#0ecb81", fontWeight: 600 },
  warningText: { fontSize: 12.5, color: "rgba(11,14,10,0.5)", lineHeight: 1.6, margin: "0 0 4px" },
  loadingRow: { fontSize: 13, color: "rgba(11,14,10,0.4)" },

  primaryBtn: {
    background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999, padding: "12px 22px",
    fontSize: 13.5, fontWeight: 700, cursor: "pointer", transition: "background 0.2s",
  },

  phraseGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 },
  phraseWord: {
    display: "flex", alignItems: "center", gap: 8, background: "#f9f9fa", borderRadius: 8,
    padding: "9px 12px", fontSize: 13.5, fontWeight: 600, color: "#0b0e0a",
  },
  phraseWordNum: { fontSize: 10.5, fontWeight: 700, color: "rgba(11,14,10,0.35)", width: 14 },
  copyBtn: {
    width: "100%", background: "#f9f9fa", border: "1.5px solid rgba(11,14,10,0.1)", borderRadius: 999,
    padding: "11px 20px", fontSize: 13, fontWeight: 700, color: "#0b0e0a", cursor: "pointer", marginBottom: 12,
  },

  qrPlaceholder: {
    width: 160, height: 160, margin: "0 auto 16px", background: "#f9f9fa", borderRadius: 12,
    display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 12,
  },
  qrPlaceholderText: { fontSize: 11.5, color: "rgba(11,14,10,0.4)" },
};

export default Security;