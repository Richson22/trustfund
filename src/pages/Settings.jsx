import React from "react";

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "JPY", "INR"];
const LANGUAGES = ["English", "Español", "Français", "Deutsch", "中文", "日本語"];

// TODO: replace with a real call to your backend — e.g. fetch(`/api/user/profile`).
// Returns null fields until connected, so the form renders honestly empty
// rather than showing fabricated user data.
async function getUserProfile() {
  return { name: "", email: "", phone: "" };
}

// TODO: replace with a real call to your backend — e.g.
// PATCH `/api/user/profile` with the updated fields.
async function updateUserProfile(profile) {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return { ok: true };
}

// TODO: replace with a real call to your backend that lists dApps the user
// has connected their wallet to (via WalletConnect, injected provider, etc.).
async function getConnectedApps() {
  return [];
}

// TODO: replace with a real revoke call to your backend/wallet provider.
async function revokeConnectedApp(appId) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { ok: true };
}

function Settings() {
  const [profile, setProfile] = React.useState(null);
  const [draft, setDraft] = React.useState({ name: "", email: "", phone: "" });
  const [profileSaving, setProfileSaving] = React.useState(false);
  const [profileSaved, setProfileSaved] = React.useState(false);

  const [currency, setCurrency] = React.useState("USD");
  const [language, setLanguage] = React.useState("English");
  const [notifPrice, setNotifPrice] = React.useState(true);
  const [notifTx, setNotifTx] = React.useState(true);
  const [notifMarketing, setNotifMarketing] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false);
  const [biometrics, setBiometrics] = React.useState(false);

  const [apps, setApps] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [p, a] = await Promise.all([getUserProfile(), getConnectedApps()]);
        if (cancelled) return;
        setProfile(p);
        setDraft(p);
        setApps(a);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load settings");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      await updateUserProfile(draft);
      setProfile(draft);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleRevoke(appId) {
    setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, revoking: true } : a)));
    try {
      await revokeConnectedApp(appId);
      setApps((prev) => prev.filter((a) => a.id !== appId));
    } catch (err) {
      setError(err.message || "Failed to revoke app");
    }
  }

  const profileDirty =
    profile && (draft.name !== profile.name || draft.email !== profile.email || draft.phone !== profile.phone);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-settings-toggle { cursor: pointer; }
        .bf-settings-link:hover { background: rgba(11,14,10,0.03) !important; }
        .bf-settings-save:hover:not(:disabled) { background: #2A47E0 !important; }
        .bf-settings-revoke:hover { color: #f6465d !important; }
      `}</style>

      <div style={styles.wrap}>
        <div style={styles.header}>
          <a href="/dashboard" style={styles.backBtn} aria-label="Back to dashboard">←</a>
          <h1 style={styles.headerTitle}>Settings</h1>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* Profile */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Profile</h2>
          {profile === null ? (
            <div style={styles.loadingRow}>Loading…</div>
          ) : (
            <form style={styles.form} onSubmit={handleSaveProfile}>
              <label style={styles.label}>
                Name
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Your name"
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Email
                <input
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                  placeholder="you@example.com"
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Phone number
                <input
                  type="tel"
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  style={styles.input}
                />
              </label>

              <div style={styles.saveRow}>
                <button
                  type="submit"
                  className="bf-settings-save"
                  style={{ ...styles.saveBtn, opacity: profileDirty ? 1 : 0.5 }}
                  disabled={!profileDirty || profileSaving}
                >
                  {profileSaving ? "Saving…" : "Save Changes"}
                </button>
                {profileSaved && <span style={styles.savedText}>✓ Saved</span>}
              </div>
            </form>
          )}
        </section>

        {/* Preferences */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Preferences</h2>

          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Display Currency</div>
              <div style={styles.settingSub}>Prices shown across the app in this currency</div>
            </div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={styles.select}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Language</div>
            </div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={styles.select}>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Dark Mode</div>
            </div>
            <Toggle checked={darkMode} onChange={setDarkMode} />
          </div>
        </section>

        {/* Notifications */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Notifications</h2>

          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Price Alerts</div>
              <div style={styles.settingSub}>Get notified on significant price moves</div>
            </div>
            <Toggle checked={notifPrice} onChange={setNotifPrice} />
          </div>

          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Transaction Updates</div>
              <div style={styles.settingSub}>Send, receive, and swap confirmations</div>
            </div>
            <Toggle checked={notifTx} onChange={setNotifTx} />
          </div>

          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Product & Marketing</div>
              <div style={styles.settingSub}>News, tips, and feature announcements</div>
            </div>
            <Toggle checked={notifMarketing} onChange={setNotifMarketing} />
          </div>
        </section>

        {/* Security */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Security</h2>

          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Biometric Unlock</div>
              <div style={styles.settingSub}>Use Face ID / fingerprint to unlock</div>
            </div>
            <Toggle checked={biometrics} onChange={setBiometrics} />
          </div>

          <a href="/security/change-password" className="bf-settings-link" style={styles.linkRow}>
            <span style={styles.settingLabel}>Change Password</span>
            <span style={styles.chevron}>›</span>
          </a>
          <a href="/security/recovery-phrase" className="bf-settings-link" style={styles.linkRow}>
            <span style={styles.settingLabel}>Backup Recovery Phrase</span>
            <span style={styles.chevron}>›</span>
          </a>
          <a href="/security/2fa" className="bf-settings-link" style={styles.linkRow}>
            <span style={styles.settingLabel}>Two-Factor Authentication</span>
            <span style={styles.chevron}>›</span>
          </a>
        </section>

        {/* Connected apps */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Connected Apps</h2>
          {apps === null ? (
            <div style={styles.loadingRow}>Loading…</div>
          ) : apps.length === 0 ? (
            <div style={styles.loadingRow}>No dApps connected to this wallet yet</div>
          ) : (
            <div style={styles.appsList}>
              {apps.map((app) => (
                <div key={app.id} style={styles.appRow}>
                  <div style={styles.appInfo}>
                    <div style={styles.appName}>{app.name}</div>
                    <div style={styles.appDate}>Connected {app.connectedDate}</div>
                  </div>
                  <button
                    className="bf-settings-revoke"
                    style={styles.revokeBtn}
                    disabled={app.revoking}
                    onClick={() => handleRevoke(app.id)}
                  >
                    {app.revoking ? "Revoking…" : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section style={{ ...styles.section, marginBottom: 40 }}>
          <h2 style={{ ...styles.sectionTitle, color: "#f6465d" }}>Danger Zone</h2>
          <a href="/logout" className="bf-settings-link" style={styles.linkRow}>
            <span style={styles.settingLabel}>Log Out</span>
            <span style={styles.chevron}>›</span>
          </a>
        </section>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      className="bf-settings-toggle"
      onClick={() => onChange(!checked)}
      style={{ ...styles.toggle, background: checked ? "#3D5CFF" : "rgba(11,14,10,0.15)" }}
      role="switch"
      aria-checked={checked}
    >
      <span style={{ ...styles.toggleKnob, transform: checked ? "translateX(18px)" : "translateX(2px)" }} />
    </button>
  );
}

const styles = {
  page: { fontFamily: "'Inter', -apple-system, sans-serif", background: "#f4f4f6", minHeight: "100vh", padding: "32px 20px" },
  wrap: { maxWidth: 620, margin: "0 auto" },

  header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 28 },
  backBtn: { fontSize: 18, color: "#0b0e0a", textDecoration: "none" },
  headerTitle: { fontSize: 20, fontWeight: 800, color: "#0b0e0a", margin: 0 },

  errorBanner: { background: "#fef3cd", color: "#8a6d1a", fontSize: 13, fontWeight: 600, padding: "12px 16px", borderRadius: 10, marginBottom: 20 },

  section: { background: "#fff", borderRadius: 20, padding: "24px", marginBottom: 20, border: "1px solid rgba(11,14,10,0.06)" },
  sectionTitle: { fontSize: 15.5, fontWeight: 800, color: "#0b0e0a", margin: "0 0 18px" },
  loadingRow: { fontSize: 13.5, color: "rgba(11,14,10,0.4)" },

  form: { display: "flex", flexDirection: "column", gap: 16 },
  label: { display: "flex", flexDirection: "column", gap: 7, fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.6)" },
  input: {
    border: "1.5px solid rgba(11,14,10,0.15)", borderRadius: 10, padding: "12px 14px",
    fontSize: 14, fontFamily: "inherit", color: "#0b0e0a", outline: "none",
  },
  saveRow: { display: "flex", alignItems: "center", gap: 14, marginTop: 4 },
  saveBtn: {
    background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999, padding: "11px 24px",
    fontSize: 13.5, fontWeight: 700, cursor: "pointer", transition: "background 0.2s",
  },
  savedText: { fontSize: 13, fontWeight: 700, color: "#0ecb81" },

  settingRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0",
    borderBottom: "1px solid rgba(11,14,10,0.05)",
  },
  settingLabel: { fontSize: 14, fontWeight: 700, color: "#0b0e0a" },
  settingSub: { fontSize: 12.5, color: "rgba(11,14,10,0.45)", marginTop: 2 },
  select: {
    border: "1.5px solid rgba(11,14,10,0.15)", borderRadius: 8, padding: "8px 12px", fontSize: 13,
    fontFamily: "inherit", color: "#0b0e0a", background: "#fff", outline: "none",
  },

  toggle: {
    width: 40, height: 24, borderRadius: 999, border: "none", padding: 0, position: "relative",
    transition: "background 0.2s", flexShrink: 0,
  },
  toggleKnob: {
    position: "absolute", top: 2, left: 0, width: 20, height: 20, borderRadius: "50%",
    background: "#fff", transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },

  linkRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 4px",
    borderBottom: "1px solid rgba(11,14,10,0.05)", textDecoration: "none", borderRadius: 8,
  },
  chevron: { fontSize: 18, color: "rgba(11,14,10,0.3)" },

  appsList: { display: "flex", flexDirection: "column" },
  appRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0",
    borderBottom: "1px solid rgba(11,14,10,0.05)",
  },
  appInfo: {},
  appName: { fontSize: 14, fontWeight: 700, color: "#0b0e0a" },
  appDate: { fontSize: 12, color: "rgba(11,14,10,0.45)", marginTop: 2 },
  revokeBtn: {
    background: "transparent", border: "1px solid rgba(11,14,10,0.15)", borderRadius: 999,
    padding: "7px 16px", fontSize: 12.5, fontWeight: 700, color: "rgba(11,14,10,0.6)", cursor: "pointer",
  },
};

export default Settings;