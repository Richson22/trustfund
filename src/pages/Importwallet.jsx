import React from "react";

// TODO: replace with real BIP-39 wordlist validation (2048 official words).
// This placeholder is just for basic format checks, not real cryptographic
// wallet import — see the same note in Login.jsx and Security.jsx.
function isPlausibleWord(word) {
  return /^[a-z]+$/i.test(word.trim());
}

// TODO: replace with a real wallet import — e.g. derive the wallet's keys
// from the phrase using a library like ethers.js/bip39, encrypt them with
// the user's chosen password, and store them (locally or via your backend,
// depending on your custody model). This placeholder simulates network
// delay and always succeeds, and never actually touches real keys —
// wiring this up correctly is critical since a mistake here can lose funds.
async function submitImportWallet({ phraseWords, password }) {
  await new Promise((resolve) => setTimeout(resolve, 1400));
  return { ok: true };
}

function ImportWallet() {
  const [wordCount, setWordCount] = React.useState(12); // 12 | 24
  const [words, setWords] = React.useState(Array(12).fill(""));
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [step, setStep] = React.useState("phrase"); // "phrase" | "password" | "importing" | "success"
  const [error, setError] = React.useState(null);

  function handleWordCountChange(count) {
    setWordCount(count);
    setWords(Array(count).fill(""));
  }

  function handleWordChange(index, value) {
    const cleaned = value.trim().split(/\s+/)[0] || ""; // in case someone pastes the whole phrase into one box
    setWords((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
  }

  function handlePaste(e, startIndex) {
    const pasted = e.clipboardData.getData("text").trim().split(/\s+/);
    if (pasted.length > 1) {
      e.preventDefault();
      setWords((prev) => {
        const next = [...prev];
        pasted.forEach((w, i) => {
          if (startIndex + i < next.length) next[startIndex + i] = w;
        });
        return next;
      });
    }
  }

  const allWordsFilled = words.every((w) => w.length > 0);
  const allWordsPlausible = words.every((w) => isPlausibleWord(w));
  const canContinueFromPhrase = allWordsFilled && allWordsPlausible;

  const passwordsMatch = password.length >= 8 && password === confirmPassword;

  async function handleImport() {
    setStep("importing");
    setError(null);
    try {
      await submitImportWallet({ phraseWords: words, password });
      setStep("success");
    } catch (err) {
      setError(err.message || "Failed to import wallet. Please check your recovery phrase and try again.");
      setStep("password");
    }
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-import-word:focus { border-color: #3D5CFF !important; }
        .bf-import-cta:hover:not(:disabled) { background: #2A47E0 !important; }
        .bf-import-toggle:hover { background: rgba(11,14,10,0.04) !important; }
        @keyframes bf-spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={styles.card}>
        <div style={styles.header}>
          {step !== "phrase" && step !== "success" && (
            <button
              style={styles.backBtn}
              onClick={() => setStep(step === "password" ? "phrase" : "phrase")}
              aria-label="Back"
            >
              ←
            </button>
          )}
          <h1 style={styles.headerTitle}>
            {step === "phrase" && "Import Wallet"}
            {step === "password" && "Secure Your Wallet"}
            {step === "importing" && "Importing…"}
            {step === "success" && "Wallet Imported"}
          </h1>
        </div>

        {step === "phrase" && (
          <>
            <p style={styles.subtitle}>
              Enter your existing 12 or 24-word recovery phrase to import your
              wallet.
            </p>

            <div style={styles.toggleRow}>
              <button
                className="bf-import-toggle"
                style={{ ...styles.toggleBtn, ...(wordCount === 12 ? styles.toggleBtnActive : {}) }}
                onClick={() => handleWordCountChange(12)}
              >
                12 words
              </button>
              <button
                className="bf-import-toggle"
                style={{ ...styles.toggleBtn, ...(wordCount === 24 ? styles.toggleBtnActive : {}) }}
                onClick={() => handleWordCountChange(24)}
              >
                24 words
              </button>
            </div>

            <div style={styles.wordGrid}>
              {words.map((word, i) => (
                <div key={i} style={styles.wordInputWrap}>
                  <span style={styles.wordNum}>{i + 1}</span>
                  <input
                    type="text"
                    className="bf-import-word"
                    value={word}
                    onChange={(e) => handleWordChange(i, e.target.value)}
                    onPaste={(e) => handlePaste(e, i)}
                    style={styles.wordInput}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
              ))}
            </div>

            <p style={styles.hint}>
              Tip: you can paste your whole phrase into the first box.
            </p>

            <button
              className="bf-import-cta"
              style={{ ...styles.primaryBtn, opacity: canContinueFromPhrase ? 1 : 0.5 }}
              disabled={!canContinueFromPhrase}
              onClick={() => canContinueFromPhrase && setStep("password")}
            >
              Continue
            </button>
          </>
        )}

        {(step === "password" || step === "importing") && (
          <>
            <p style={styles.subtitle}>
              Set a password to secure this wallet on this device.
            </p>

            <label style={styles.label}>
              Password
              <div style={styles.passwordWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...styles.input, paddingRight: 46 }}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.showPasswordBtn}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <label style={styles.label}>
              Confirm password
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={styles.input}
              />
            </label>

            {password && confirmPassword && password !== confirmPassword && (
              <div style={styles.errorText}>Passwords don't match.</div>
            )}
            {error && <div style={styles.errorText}>{error}</div>}

            <button
              className="bf-import-cta"
              style={{ ...styles.primaryBtn, opacity: passwordsMatch ? 1 : 0.5 }}
              disabled={!passwordsMatch || step === "importing"}
              onClick={handleImport}
            >
              {step === "importing" ? (
                <>
                  <span style={styles.spinner} /> Importing
                </>
              ) : (
                "Import Wallet"
              )}
            </button>
          </>
        )}

        {step === "success" && (
          <div style={styles.successWrap}>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Wallet imported</h2>
            <p style={styles.successText}>
              Your wallet has been imported and secured on this device.
            </p>
            <a href="/dashboard" className="bf-import-cta" style={styles.primaryBtn}>
              Go to Dashboard
            </a>
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
    width: "100%", maxWidth: 480, background: "#fff", borderRadius: 24, padding: "32px 28px",
    border: "1px solid rgba(11,14,10,0.06)",
  },

  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8 },
  backBtn: { background: "transparent", border: "none", fontSize: 18, cursor: "pointer", padding: 4, color: "#0b0e0a" },
  headerTitle: { fontSize: 19, fontWeight: 800, color: "#0b0e0a", margin: 0 },
  subtitle: { fontSize: 13.5, color: "rgba(11,14,10,0.55)", lineHeight: 1.6, margin: "0 0 20px" },

  toggleRow: { display: "flex", gap: 8, marginBottom: 18 },
  toggleBtn: {
    flex: 1, background: "#f9f9fa", border: "1.5px solid transparent", borderRadius: 10, padding: "10px",
    fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.6)", cursor: "pointer", transition: "all 0.2s",
  },
  toggleBtnActive: { borderColor: "#3D5CFF", background: "rgba(61,92,255,0.06)", color: "#3D5CFF" },

  wordGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14, maxHeight: 320, overflowY: "auto" },
  wordInputWrap: {
    display: "flex", alignItems: "center", gap: 6, border: "1.5px solid rgba(11,14,10,0.12)",
    borderRadius: 8, padding: "6px 8px",
  },
  wordNum: { fontSize: 10.5, fontWeight: 700, color: "rgba(11,14,10,0.35)", width: 14 },
  wordInput: {
    flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: "inherit", color: "#0b0e0a",
    minWidth: 0, padding: "4px 0",
  },
  hint: { fontSize: 12, color: "rgba(11,14,10,0.4)", marginBottom: 20 },

  label: { display: "flex", flexDirection: "column", gap: 8, fontSize: 13, fontWeight: 700, color: "rgba(11,14,10,0.6)", marginBottom: 16 },
  input: {
    border: "1.5px solid rgba(11,14,10,0.15)", borderRadius: 10, padding: "12px 14px",
    fontSize: 14, fontFamily: "inherit", color: "#0b0e0a", outline: "none",
  },
  passwordWrap: { position: "relative", display: "flex" },
  showPasswordBtn: {
    position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
    background: "transparent", border: "none", cursor: "pointer", fontSize: 15, padding: 8,
  },
  errorText: { fontSize: 12.5, color: "#f6465d", fontWeight: 600, marginBottom: 14 },

  primaryBtn: {
    width: "100%", background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999,
    padding: "15px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 6,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "background 0.2s",
    textDecoration: "none", boxSizing: "border-box",
  },
  spinner: {
    width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "bf-spin 0.7s linear infinite",
  },

  successWrap: { textAlign: "center", padding: "8px 0" },
  successIcon: {
    width: 56, height: 56, borderRadius: "50%", background: "#0ecb81", color: "#fff",
    fontSize: 26, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 18px",
  },
  successTitle: { fontSize: 19, fontWeight: 800, color: "#0b0e0a", margin: "0 0 8px" },
  successText: { fontSize: 14, color: "rgba(11,14,10,0.55)", lineHeight: 1.6, margin: "0 0 20px" },
};

export default ImportWallet;