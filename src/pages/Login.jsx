
import React from "react";
import { ethers } from "ethers";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "https://trustfund-backend-wp3n.onrender.com"
).replace(/\/+$/, "");

// --------------------------------------------------
// PASSWORD-DERIVED LOGIN KEY
// Must match the browser derivation expected by server.js.
// The original password never goes to the server.
// --------------------------------------------------

async function deriveAuthKey(password, email) {
  if (!window.crypto?.subtle) {
    throw new Error(
      "Secure browser connection required. Use HTTPS or localhost."
    );
  }

  const encoder = new TextEncoder();
  const normalizedEmail = email.trim().toLowerCase();

  const passwordMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await window.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(
        `richson-wallet-login-v1:${normalizedEmail}`
      ),
      iterations: 310000,
      hash: "SHA-256",
    },
    passwordMaterial,
    256
  );

  return Array.from(new Uint8Array(bits))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// --------------------------------------------------
// RECOVERY PHRASE HELPERS
// --------------------------------------------------

function pickConfirmIndexes(length) {
  const indexes = new Set();

  while (indexes.size < 3) {
    indexes.add(Math.floor(Math.random() * length));
  }

  return Array.from(indexes).sort((a, b) => a - b);
}


// ==================================================
// LOGIN COMPONENT
// ==================================================

function Login() {
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from =
    location.state?.from?.pathname || "/dashboard";

  const [mode, setMode] = React.useState("login");

  const [showPassword, setShowPassword] =
    React.useState(false);

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] =
    React.useState("");

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");

  const [signupStep, setSignupStep] =
    React.useState("form");

  // Generate wallet in the browser.
  const [wallet] = React.useState(() =>
    ethers.Wallet.createRandom()
  );

  const recoveryPhrase = React.useMemo(
    () => wallet.mnemonic.phrase.split(" "),
    [wallet]
  );

  const [phraseRevealed, setPhraseRevealed] =
    React.useState(false);

  const [phraseCopied, setPhraseCopied] =
    React.useState(false);

  const [savedConfirmed, setSavedConfirmed] =
    React.useState(false);

  const [confirmWords, setConfirmWords] =
    React.useState({});

  const [creatingWallet, setCreatingWallet] =
    React.useState(false);

  const [loggingIn, setLoggingIn] =
    React.useState(false);

  const [loginError, setLoginError] =
    React.useState("");

  const confirmIndexes = React.useMemo(
    () => pickConfirmIndexes(recoveryPhrase.length),
    [recoveryPhrase]
  );

  // ------------------------------------------------
  // SIGNUP FORM
  // ------------------------------------------------

  function handleSignupSubmit(e) {
    e.preventDefault();

    setLoginError("");

    if (!name.trim()) {
      setLoginError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setLoginError("Please enter your email.");
      return;
    }

    if (!phone.trim()) {
      setLoginError("Please enter your phone number.");
      return;
    }

    if (password.length < 8) {
      setLoginError(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setLoginError(
        "Passwords do not match. Please try again."
      );
      return;
    }

    setSignupStep("recovery");
  }

  // ------------------------------------------------
  // LOGIN
  // ------------------------------------------------

  async function handleLoginSubmit(e) {
    e.preventDefault();

    setLoginError("");
    setLoggingIn(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail || !password) {
        throw new Error("Enter your email and password.");
      }

      // Generate the same login key used during signup.
      const authKey = await deriveAuthKey(
        password,
        normalizedEmail
      );

      // Authenticate against the backend.
      const response = await fetch(
        `${API_BASE}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
            authKey,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Email or password is incorrect."
        );
      }

      if (
        !data.token ||
        !data.address ||
        !data.keystore
      ) {
        throw new Error(
          "Invalid login response from the server."
        );
      }

      // Unlock the encrypted wallet locally.
      // The original password never reaches the backend.
      const decrypted = await ethers.Wallet.fromEncryptedJson(
        data.keystore,
        password
      );

      // Verify the decrypted wallet matches the account.
      if (
        decrypted.address.toLowerCase() !==
        data.address.toLowerCase()
      ) {
        throw new Error(
          "Wallet address verification failed."
        );
      }

      // Save server session separately from wallet address.
      localStorage.setItem(
        "sessionToken",
        data.token
      );

      localStorage.setItem(
        "walletAddress",
        data.address
      );

      localStorage.setItem(
        "bf_active_address",
        data.address
      );

      // Save encrypted wallet locally.
      localStorage.setItem(
        `bf_wallet_${data.address}`,
        data.keystore
      );

      // Save basic account information for existing components.
      localStorage.setItem(
        "user",
        JSON.stringify({
          address: data.address,
          email: normalizedEmail,
        })
      );

      // Update AuthContext.
     login(decrypted.address, data.token);

      navigate(from, { replace: true });

    } catch (err) {
      console.error("Login error:", err);

      setLoginError(
        err.message || "Unable to log in."
      );

    } finally {
      setLoggingIn(false);
    }
  }

  // ------------------------------------------------
  // RECOVERY PHRASE
  // ------------------------------------------------

  function handleCopyPhrase() {
    navigator.clipboard
      ?.writeText(recoveryPhrase.join(" "));

    setPhraseCopied(true);
  }

  // ------------------------------------------------
  // CONFIRM PHRASE AND CREATE ACCOUNT
  // ------------------------------------------------

  async function handleConfirmSubmit(e) {
    e.preventDefault();

    setLoginError("");

    const allCorrect = confirmIndexes.every(
      (idx) =>
        (confirmWords[idx] || "")
          .trim()
          .toLowerCase() === recoveryPhrase[idx].toLowerCase()
    );

    if (!allCorrect) {
      setLoginError(
        "One or more words don't match. Please check your recovery phrase."
      );
      return;
    }

    setCreatingWallet(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Encrypt wallet using the password locally.
      const encryptedKeystore =
        await wallet.encrypt(password);

      // Derive login key using the same process as login.
      const authKey = await deriveAuthKey(
        password,
        normalizedEmail
      );

      // Register account with the server.
      const response = await fetch(
        `${API_BASE}/api/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            address: wallet.address,
            authKey,
            keystore: encryptedKeystore,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not create your account."
        );
      }

      if (!data.token || !data.address) {
        throw new Error(
          "The server did not return a valid account session."
        );
      }

      // Store login session.
      localStorage.setItem(
        "sessionToken",
        data.token
      );

      // Store public wallet address.
      localStorage.setItem(
        "walletAddress",
        data.address
      );

      localStorage.setItem(
        "bf_active_address",
        data.address
      );

      // Store encrypted keystore, never the password or phrase.
      localStorage.setItem(
        `bf_wallet_${data.address}`,
        encryptedKeystore
      );

      // Save public account details.
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          address: data.address,
        })
      );

      // Update AuthContext.
     login(wallet.address, data.token);

      navigate("/dashboard", {
        replace: true,
      });

    } catch (err) {
      console.error("Signup error:", err);

      setLoginError(
        err.message || "Failed to create your account."
      );

      alert(
        "Failed to create your account: " + err.message
      );

    } finally {
      setCreatingWallet(false);
    }
  }

  // ------------------------------------------------
  // SWITCH BETWEEN LOGIN AND SIGNUP
  // ------------------------------------------------

  function switchMode(nextMode) {
    setMode(nextMode);

    setPassword("");
    setConfirmPassword("");

    setEmail("");
    setName("");
    setPhone("");

    setLoginError("");

    setSignupStep("form");
    setPhraseRevealed(false);
    setPhraseCopied(false);
    setSavedConfirmed(false);
    setConfirmWords({});
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }
        body { margin: 0; }

        .bf-login-cta:hover {
          background: #2A47E0 !important;
        }

        .bf-login-input:focus {
          border-color: #3D5CFF !important;
        }

        .bf-login-switch:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .bf-login-split {
            grid-template-columns: 1fr !important;
          }

          .bf-login-brand {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="bf-login-split"
        style={styles.split}
      >

        {/* BRAND PANEL */}

        <div
          className="bf-login-brand"
          style={styles.brandPanel}
        >
          <a href="/" style={styles.brandLogo}>
            <img
              src="/bit_funds_logo.png"
              alt="Trust Funds"
              style={styles.brandLogoImg}
            />

            <span style={styles.brandLogoText}>
              Trust Funds
            </span>
          </a>

          <div style={styles.brandBody}>
            <h1 style={styles.brandTitle}>
              Your Web3 wallet, wherever you are.
            </h1>

            <p style={styles.brandText}>
              Access your portfolio, swap assets, and
              manage your crypto from any browser — with
              the same self-custody security as the app.
            </p>
          </div>

          <div style={styles.brandBlob} />
        </div>

        {/* FORM PANEL */}

        <div style={styles.formPanel}>
          <div style={styles.formWrap}>

            {/* LOGIN OR SIGNUP FORM */}

            {mode === "login" || signupStep === "form" ? (
              <>
                <div style={styles.formHead}>
                  <h2 style={styles.formTitle}>
                    {mode === "login"
                      ? "Log in"
                      : "Create your account"}
                  </h2>

                  <p style={styles.formSub}>
                    {mode === "login"
                      ? "Enter your details to access your wallet."
                      : "Tell us a bit about you and set a password to secure your wallet."}
                  </p>
                </div>

                <form
                  style={styles.form}
                  onSubmit={
                    mode === "login"
                      ? handleLoginSubmit
                      : handleSignupSubmit
                  }
                >

                  {/* LOGIN EMAIL */}

                  {mode === "login" && (
                    <label style={styles.label}>
                      Email

                      <input
                        type="email"
                        className="bf-login-input"
                        placeholder="you@example.com"
                        style={styles.input}
                        value={email}
                        onChange={(e) =>
                          setEmail(e.target.value)
                        }
                        autoComplete="email"
                        required
                      />
                    </label>
                  )}

                  {/* PASSWORD */}

                  <label style={styles.label}>
                    Password

                    <div style={styles.passwordWrap}>
                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        className="bf-login-input"
                        placeholder="Enter your password"
                        style={{
                          ...styles.input,
                          paddingRight: 46,
                        }}
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        autoComplete={
                          mode === "login"
                            ? "current-password"
                            : "new-password"
                        }
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((v) => !v)
                        }
                        style={styles.showPasswordBtn}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </label>

                  {/* SIGNUP FIELDS */}

                  {mode === "signup" && (
                    <>
                      <label style={styles.label}>
                        Confirm Password

                        <div style={styles.passwordWrap}>
                          <input
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            className="bf-login-input"
                            placeholder="Confirm your password"
                            style={{
                              ...styles.input,
                              paddingRight: 46,
                            }}
                            value={confirmPassword}
                            onChange={(e) =>
                              setConfirmPassword(
                                e.target.value
                              )
                            }
                            autoComplete="new-password"
                            required
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((v) => !v)
                            }
                            style={styles.showPasswordBtn}
                          >
                            {showPassword ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </label>

                      <label style={styles.label}>
                        Name

                        <input
                          type="text"
                          className="bf-login-input"
                          placeholder="Your full name"
                          style={styles.input}
                          value={name}
                          onChange={(e) =>
                            setName(e.target.value)
                          }
                          autoComplete="name"
                          required
                        />
                      </label>

                      <label style={styles.label}>
                        Email

                        <input
                          type="email"
                          className="bf-login-input"
                          placeholder="you@example.com"
                          style={styles.input}
                          value={email}
                          onChange={(e) =>
                            setEmail(e.target.value)
                          }
                          autoComplete="email"
                          required
                        />
                      </label>

                      <label style={styles.label}>
                        Phone number

                        <input
                          type="tel"
                          className="bf-login-input"
                          placeholder="+1 (555) 000-0000"
                          style={styles.input}
                          value={phone}
                          onChange={(e) =>
                            setPhone(e.target.value)
                          }
                          autoComplete="tel"
                          required
                        />
                      </label>
                    </>
                  )}

                  {/* FORGOT PASSWORD */}

                  {mode === "login" && (
                    <a
                      href="#forgot"
                      style={styles.forgotLink}
                    >
                      Forgot password?
                    </a>
                  )}

                  {/* ERROR */}

                  {loginError && (
                    <p style={styles.loginErrorText}>
                      {loginError}
                    </p>
                  )}

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    className="bf-login-cta"
                    style={{
                      ...styles.submitBtn,
                      opacity:
                        (mode === "login" && loggingIn)
                          ? 0.7
                          : 1,
                    }}
                    disabled={
                      loggingIn || creatingWallet
                    }
                  >
                    {mode === "login"
                      ? loggingIn
                        ? "Logging in…"
                        : "Log In"
                      : "Continue"}
                  </button>
                </form>

                <div style={styles.divider}>
                  <span style={styles.dividerLine} />
                  <span style={styles.dividerText}>
                    or
                  </span>
                  <span style={styles.dividerLine} />
                </div>

                <button
                  type="button"
                  style={styles.walletBtn}
                  onClick={() =>
                    setLoginError(
                      "Existing wallet import is not connected yet."
                    )
                  }
                >
                  <span style={styles.walletBtnIcon}>
                    🔗
                  </span>

                  Continue with an existing wallet
                </button>

                <p style={styles.switchText}>
                  {mode === "login" ? (
                    <>
                      Don't have an account?{" "}

                      <button
                        type="button"
                        className="bf-login-switch"
                        style={styles.switchBtn}
                        onClick={() => switchMode("signup")}
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}

                      <button
                        type="button"
                        className="bf-login-switch"
                        style={styles.switchBtn}
                        onClick={() => switchMode("login")}
                      >
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </>

            ) : signupStep === "recovery" ? (

              /* RECOVERY PHRASE SCREEN */

              <>
                <div style={styles.formHead}>
                  <h2 style={styles.formTitle}>
                    Save your recovery phrase
                  </h2>

                  <p style={styles.formSub}>
                    These 12 words are the only way to
                    recover your wallet. Write them down
                    and store them somewhere safe — we
                    can't recover them for you.
                  </p>
                </div>

                <div style={styles.phraseCard}>
                  {!phraseRevealed ? (
                    <div style={styles.phraseBlur}>
                      <p style={styles.phraseBlurText}>
                        Make sure no one is watching your screen
                      </p>

                      <button
                        type="button"
                        className="bf-login-cta"
                        style={{
                          ...styles.submitBtn,
                          width: "auto",
                          padding: "12px 24px",
                        }}
                        onClick={() =>
                          setPhraseRevealed(true)
                        }
                      >
                        Reveal phrase
                      </button>
                    </div>
                  ) : (
                    <div style={styles.phraseGrid}>
                      {recoveryPhrase.map((word, i) => (
                        <div
                          key={i}
                          style={styles.phraseWord}
                        >
                          <span style={styles.phraseWordNum}>
                            {i + 1}
                          </span>

                          {word}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {phraseRevealed && (
                  <>
                    <button
                      type="button"
                      style={styles.copyBtn}
                      onClick={handleCopyPhrase}
                    >
                      {phraseCopied
                        ? "✓ Copied"
                        : "📋 Copy to clipboard"}
                    </button>

                    <label style={styles.confirmCheckRow}>
                      <input
                        type="checkbox"
                        checked={savedConfirmed}
                        onChange={(e) =>
                          setSavedConfirmed(e.target.checked)
                        }
                        style={styles.checkbox}
                      />

                      I've saved my recovery phrase somewhere safe
                    </label>

                    <button
                      type="button"
                      className="bf-login-cta"
                      style={{
                        ...styles.submitBtn,
                        opacity: savedConfirmed ? 1 : 0.5,
                      }}
                      disabled={!savedConfirmed}
                      onClick={() =>
                        savedConfirmed &&
                        setSignupStep("confirm")
                      }
                    >
                      Continue
                    </button>
                  </>
                )}
              </>

            ) : (

              /* CONFIRM RECOVERY PHRASE SCREEN */

              <>
                <div style={styles.formHead}>
                  <h2 style={styles.formTitle}>
                    Confirm your recovery phrase
                  </h2>

                  <p style={styles.formSub}>
                    Enter the missing words below to
                    confirm you've saved your phrase correctly.
                  </p>
                </div>

                <form
                  style={styles.form}
                  onSubmit={handleConfirmSubmit}
                >
                  {confirmIndexes.map((idx) => (
                    <label
                      key={idx}
                      style={styles.label}
                    >
                      Word #{idx + 1}

                      <input
                        type="text"
                        className="bf-login-input"
                        style={styles.input}
                        value={confirmWords[idx] || ""}
                        onChange={(e) =>
                          setConfirmWords((prev) => ({
                            ...prev,
                            [idx]: e.target.value,
                          }))
                        }
                        autoComplete="off"
                        required
                      />
                    </label>
                  ))}

                  {loginError && (
                    <p style={styles.loginErrorText}>
                      {loginError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="bf-login-cta"
                    style={styles.submitBtn}
                    disabled={creatingWallet}
                  >
                    {creatingWallet
                      ? "Securing your wallet…"
                      : "Confirm & Create Account"}
                  </button>
                </form>

                <button
                  type="button"
                  className="bf-login-switch"
                  style={{
                    ...styles.switchBtn,
                    display: "block",
                    margin: "20px auto 0",
                  }}
                  onClick={() => {
                    setLoginError("");
                    setSignupStep("recovery");
                  }}
                  disabled={creatingWallet}
                >
                  ← Back to recovery phrase
                </button>
              </>
            )}
          </div>
        </div>
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
    background: "#ffffff",
    minHeight: "100vh",
  },

  split: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    minHeight: "100vh",
  },

  brandPanel: {
    background: "#0b0e0a",
    padding: "48px 56px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },

  brandLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    zIndex: 2,
    position: "relative",
  },

  brandLogoImg: {
    width: 34,
    height: 34,
    objectFit: "contain",
  },

  brandLogoText: {
    fontWeight: 800,
    fontSize: 17,
    color: "#fff",
    letterSpacing: "-0.02em",
  },

  brandBody: {
    maxWidth: 440,
    zIndex: 2,
    position: "relative",
  },

  brandTitle: {
    fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    color: "#fff",
    margin: "0 0 18px",
  },

  brandText: {
    fontSize: 15.5,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.6)",
    margin: 0,
  },

  brandBlob: {
    position: "absolute",
    bottom: -120,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(61,92,255,0.35) 0%, rgba(51,217,193,0.1) 60%, transparent 80%)",
    zIndex: 1,
  },

  formPanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 32px",
  },

  formWrap: {
    width: "100%",
    maxWidth: 380,
  },

  formHead: {
    marginBottom: 32,
  },

  formTitle: {
    fontSize: "clamp(1.6rem, 2.6vw, 2rem)",
    fontWeight: 700,
    color: "#0b0e0a",
    letterSpacing: "-0.02em",
    margin: "0 0 10px",
  },

  formSub: {
    fontSize: 14.5,
    lineHeight: 1.6,
    color: "rgba(11,14,10,0.55)",
    margin: 0,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontSize: 13.5,
    fontWeight: 600,
    color: "#0b0e0a",
  },

  input: {
    border: "1.5px solid rgba(11,14,10,0.15)",
    borderRadius: 10,
    padding: "13px 14px",
    fontSize: 14.5,
    fontFamily: "inherit",
    color: "#0b0e0a",
    outline: "none",
    transition: "border-color 0.2s",
    width: "100%",
  },

  passwordWrap: {
    position: "relative",
    display: "flex",
    width: "100%",
  },

  showPasswordBtn: {
    position: "absolute",
    right: 4,
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    padding: 8,
  },

  forgotLink: {
    fontSize: 13,
    color: "#3D5CFF",
    textDecoration: "none",
    alignSelf: "flex-end",
    marginTop: -8,
  },

  loginErrorText: {
    fontSize: 13,
    color: "#d93025",
    margin: "-8px 0 0",
    lineHeight: 1.5,
  },

  submitBtn: {
    background: "#3D5CFF",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "14px 24px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.2s",
    marginTop: 6,
    width: "100%",
  },

  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "24px 0",
  },

  dividerLine: {
    flex: 1,
    height: 1,
    background: "rgba(11,14,10,0.1)",
  },

  dividerText: {
    fontSize: 13,
    color: "rgba(11,14,10,0.4)",
  },

  walletBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "#fff",
    color: "#0b0e0a",
    border: "1.5px solid rgba(11,14,10,0.15)",
    borderRadius: 999,
    padding: "13px 24px",
    fontSize: 14.5,
    fontWeight: 600,
    cursor: "pointer",
  },

  walletBtnIcon: {
    fontSize: 15,
  },

  switchText: {
    textAlign: "center",
    fontSize: 14,
    color: "rgba(11,14,10,0.6)",
    marginTop: 28,
  },

  phraseCard: {
    background: "#f4f4f6",
    border: "1.5px solid rgba(11,14,10,0.08)",
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  phraseBlur: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },

  phraseBlurText: {
    fontSize: 13.5,
    color: "rgba(11,14,10,0.5)",
    margin: 0,
  },

  phraseGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    width: "100%",
  },

  phraseWord: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 600,
    color: "#0b0e0a",
  },

  phraseWordNum: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(11,14,10,0.35)",
    width: 16,
  },

  copyBtn: {
    width: "100%",
    background: "#fff",
    border: "1.5px solid rgba(11,14,10,0.15)",
    borderRadius: 999,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#0b0e0a",
    cursor: "pointer",
    marginBottom: 20,
  },

  confirmCheckRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13.5,
    color: "rgba(11,14,10,0.7)",
    marginBottom: 20,
  },

  checkbox: {
    width: 16,
    height: 16,
    accentColor: "#3D5CFF",
    cursor: "pointer",
  },

  switchBtn: {
    background: "none",
    border: "none",
    padding: 0,
    color: "#3D5CFF",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

export default Login;
