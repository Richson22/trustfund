import React from "react";

function GlobeArt() {
  return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      <defs>
        <linearGradient id="globeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3D5CFF" />
          <stop offset="100%" stopColor="#33D9C1" />
        </linearGradient>
        <radialGradient id="globeBg" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a1d29" />
          <stop offset="100%" stopColor="#0b0e0a" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="95" r="75" fill="url(#globeBg)" stroke="url(#globeGrad)" strokeWidth="2" />
      {/* Latitude lines */}
      {[-45, -20, 0, 20, 45].map((dy) => (
        <ellipse key={dy} cx="100" cy={95 + dy * 0.6} rx={75 * Math.cos((dy * Math.PI) / 180)} ry={10} fill="none" stroke="rgba(61,92,255,0.35)" strokeWidth="1" />
      ))}
      {/* Longitude lines */}
      {[0, 30, 60, 90, 120, 150].map((a) => (
        <ellipse key={a} cx="100" cy="95" rx={75 * Math.abs(Math.cos((a * Math.PI) / 180)) + 2} ry="75" fill="none" stroke="rgba(61,92,255,0.25)" strokeWidth="1" transform={`rotate(${a} 100 95)`} />
      ))}
      {/* Orbit ring */}
      <ellipse cx="100" cy="95" rx="95" ry="28" fill="none" stroke="url(#globeGrad)" strokeWidth="3" transform="rotate(-15 100 95)" opacity="0.9" />
      {/* Stars / dots */}
      {[[40, 50], [150, 60], [60, 140], [130, 130], [95, 40], [160, 100]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 4 : 2.5} fill="url(#globeGrad)" opacity="0.85" />
      ))}
      {/* Base / stand */}
      <rect x="55" y="172" width="90" height="16" rx="8" fill="#fff" stroke="rgba(61,92,255,0.4)" strokeWidth="2" />
    </svg>
  );
}

function PhoneMockup() {
  return (
    <svg viewBox="0 0 420 500" width="100%" style={{ maxWidth: 380 }}>
      <defs>
        <linearGradient id="phoneGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3D5CFF" />
          <stop offset="100%" stopColor="#33D9C1" />
        </linearGradient>
      </defs>
      {/* Phone body */}
      <rect x="60" y="20" width="260" height="460" rx="36" fill="#111318" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      <rect x="76" y="52" width="228" height="396" rx="4" fill="#0b0e0a" />

      {/* Status bar */}
      <text x="96" y="80" fill="#fff" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="700">9:41</text>
      <text x="270" y="80" fill="rgba(255,255,255,0.5)" fontSize="12" fontFamily="Inter, sans-serif">100%</text>

      {/* Wallet label */}
      <text x="96" y="112" fill="rgba(255,255,255,0.6)" fontSize="12" fontFamily="Inter, sans-serif" fontWeight="600">My Wallet 1</text>

      {/* Balance */}
      <text x="96" y="150" fill="#fff" fontSize="30" fontFamily="Inter, sans-serif" fontWeight="800">$1,228.20</text>
      <text x="96" y="172" fill="#0ecb81" fontSize="13" fontFamily="Inter, sans-serif" fontWeight="700">↑ $23.58 (+0.6%)</text>

      {/* Action buttons */}
      {["Send", "Receive", "Buy", "Sell"].map((label, i) => (
        <g key={label} transform={`translate(${96 + i * 52}, 196)`}>
          <rect width="42" height="42" rx="12" fill={i === 2 ? "url(#phoneGrad)" : "rgba(255,255,255,0.06)"} />
          <text x="21" y="60" textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9.5" fontFamily="Inter, sans-serif">{label}</text>
        </g>
      ))}

      {/* Asset rows */}
      {[
        { sym: "BTC", amt: "0.0068", val: "$702.43", chg: "-0.66%", neg: true },
        { sym: "BNB", amt: "0.5649", val: "$361.70", chg: "+6.17%", neg: false },
        { sym: "ETH", amt: "0.0554", val: "$133.54", chg: "-4.18%", neg: true },
      ].map((a, i) => (
        <g key={a.sym} transform={`translate(96, ${290 + i * 46})`}>
          <circle cx="10" cy="0" r="10" fill="url(#phoneGrad)" />
          <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="800" fontFamily="Inter, sans-serif">{a.sym[0]}</text>
          <text x="28" y="-2" fill="#fff" fontSize="12.5" fontWeight="700" fontFamily="Inter, sans-serif">{a.sym}</text>
          <text x="28" y="14" fill={a.neg ? "#f6465d" : "#0ecb81"} fontSize="10.5" fontFamily="Inter, sans-serif">{a.chg}</text>
          <text x="228" y="-2" textAnchor="end" fill="#fff" fontSize="12.5" fontWeight="600" fontFamily="Inter, sans-serif">{a.amt}</text>
          <text x="228" y="14" textAnchor="end" fill="rgba(255,255,255,0.45)" fontSize="10.5" fontFamily="Inter, sans-serif">{a.val}</text>
        </g>
      ))}

      {/* Bottom nav */}
      <rect x="76" y="418" width="228" height="30" fill="#0b0e0a" />
      {["Home", "Trending", "Swap", "Discover"].map((l, i) => (
        <text key={l} x={96 + i * 55} y="438" fill={i === 0 ? "#3D5CFF" : "rgba(255,255,255,0.35)"} fontSize="9" fontFamily="Inter, sans-serif">{l}</text>
      ))}
    </svg>
  );
}

function Home() {
  const [buildOpen, setBuildOpen] = React.useState(false);
  const [featuresOpen, setFeaturesOpen] = React.useState(false);
  const [aboutOpen, setAboutOpen] = React.useState(false);
  const [walletMenuOpen, setWalletMenuOpen] = React.useState(false);
  const [marketsOpen, setMarketsOpen] = React.useState(false);
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [walletTab, setWalletTab] = React.useState("extension");
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .bf-nav-link:hover { color: #0b0e0a !important; }
        .bf-cta:hover { background: #2A47E0 !important; transform: translateY(-2px); }
        .bf-ghost:hover { border-color: rgba(61,92,255,0.5) !important; background: rgba(61,92,255,0.05) !important; }
        .bf-feature-card:hover { border-color: #3D5CFF !important; transform: translateY(-3px); }
        .bf-step-card:hover { border-color: #3D5CFF !important; }
        .bf-market-row:hover { background: rgba(255,255,255,0.03) !important; }

        /* Mobile navigation */
        .bf-hamburger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          padding: 0;
          background: #ffffff;
          color: #0b0e0a;
          border: 1px solid rgba(11,14,10,0.14);
          border-radius: 10px;
          cursor: pointer;
          font-size: 25px;
          line-height: 1;
          flex-shrink: 0;
        }
        .bf-mobile-menu { display: none; }
        .bf-mobile-nav-link {
          display: block;
          padding: 14px 4px;
          color: #0b0e0a;
          text-decoration: none;
          font-size: 15px;
          font-weight: 650;
          border-bottom: 1px solid rgba(11,14,10,0.08);
        }
        .bf-mobile-nav-link:active { color: #3D5CFF; }

        @media (max-width: 860px) {
          .bf-hero-inner { grid-template-columns: 1fr !important; text-align: center !important; }
          .bf-hero-left { text-align: center !important; }
          .bf-hero-buttons { justify-content: center !important; }
        }
        @media (max-width: 760px) {
          .bf-announce-card { grid-template-columns: 1fr !important; text-align: center !important; padding: 36px 24px !important; }
          .bf-dev-banner-card { grid-template-columns: 1fr !important; text-align: center !important; padding: 36px 24px !important; }
          .bf-simple-card { grid-template-columns: 1fr !important; text-align: center !important; padding: 36px 24px !important; }
          .bf-privacy-card { grid-template-columns: 1fr !important; text-align: center !important; padding: 36px 24px !important; }
        }
        @media (max-width: 900px) {
          .bf-privacy-grid { grid-template-columns: 1fr !important; }
          .bf-onestop-card { grid-template-columns: 1fr !important; }
          .bf-footer-columns { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 500px) {
          .bf-footer-columns { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 768px) {
          .bf-nav-inner {
            padding: 12px 16px !important;
            gap: 12px !important;
          }
          .bf-nav-links { display: none !important; }
          .bf-nav-right { display: none !important; }
          .bf-hamburger { display: flex; margin-left: auto; }
          .bf-mobile-menu {
            display: flex;
            flex-direction: column;
            padding: 6px 20px 18px;
            background: #ffffff;
            border-top: 1px solid rgba(11,14,10,0.08);
            box-shadow: 0 16px 28px rgba(0,0,0,0.08);
            max-height: calc(100vh - 68px);
            overflow-y: auto;
          }
          .bf-mobile-menu[hidden] { display: none !important; }
          .bf-mobile-menu-actions {
            display: flex;
            gap: 10px;
            padding-top: 16px;
          }
          .bf-mobile-menu-actions button {
            flex: 1;
            min-height: 44px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 750;
          }
          .bf-mobile-language {
            background: #ffffff !important;
            color: #3D5CFF !important;
            border: 1px solid rgba(61,92,255,0.4) !important;
          }
          .bf-mobile-download {
            background: #3D5CFF !important;
            color: #ffffff !important;
          }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={styles.nav}>
        <div className="bf-nav-inner" style={styles.navInner}>
          <div style={styles.logo}>
            <img src="/bit_funds_logo.png" alt="Trust Funds" style={styles.logoImg} />
            <span style={styles.logoText}>Trust Coin Wallets</span>
          </div>
          <button
            type="button"
            className="bf-hamburger"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="bf-mobile-menu"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? "×" : "☰"}
          </button>
          <div className="bf-nav-links" style={styles.navLinks}>
            <div
              style={styles.navDropdownWrap}
              onMouseEnter={() => setMarketsOpen(true)}
              onMouseLeave={() => setMarketsOpen(false)}
            >
              <a href="#markets" className="bf-nav-link" style={styles.navLink}>Markets</a>
              {marketsOpen && (
                <div style={styles.megaMenu}>
                  <div style={styles.megaMenuInner}>
                    <div style={styles.megaMenuArt}>
                      <img src="/markets-art.png" alt="" style={styles.megaMenuArtImg} />
                    </div>
                    <div style={styles.megaMenuGrid}>
                      {[
                        { icon: "👁️", title: "Prices", badge: "New", desc: "Live crypto prices & market data" },
                        { icon: "🔄", title: "Converter", badge: "New", desc: "Convert crypto to any currency instantly" },
                      ].map((item) => (
                        <a key={item.title} href="#" style={styles.megaMenuItem}>
                          <div style={styles.megaMenuIcon}>{item.icon}</div>
                          <div>
                            <div style={styles.megaMenuTitleRow}>
                              <span style={styles.megaMenuTitle}>{item.title}</span>
                              {item.badge && <span style={styles.megaMenuBadge}>{item.badge}</span>}
                            </div>
                            <p style={styles.megaMenuDesc}>{item.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div
              style={styles.navDropdownWrap}
              onMouseEnter={() => setWalletMenuOpen(true)}
              onMouseLeave={() => setWalletMenuOpen(false)}
            >
              <a href="#wallet" className="bf-nav-link" style={styles.navLink}>Wallet</a>
              {walletMenuOpen && (
                <div style={styles.megaMenu}>
                  <div style={styles.megaMenuInner}>
                    <div style={styles.megaMenuArt}>
                      <img src="/wallet-art.png" alt="" style={styles.megaMenuArtImg} />
                    </div>
                    <div style={styles.megaMenuGrid}>
                      {[
                        { icon: "📱", title: "Mobile App", desc: "The world of Web3 in your pocket" },
                        { icon: "🖥️", title: "Browser Extension", desc: "An optimized Web3 experience for desktop" },
                      ].map((item) => (
                        <a key={item.title} href="#" style={styles.megaMenuItem}>
                          <div style={styles.megaMenuIcon}>{item.icon}</div>
                          <div>
                            <div style={styles.megaMenuTitleRow}>
                              <span style={styles.megaMenuTitle}>{item.title}</span>
                              {item.badge && <span style={styles.megaMenuBadge}>{item.badge}</span>}
                            </div>
                            <p style={styles.megaMenuDesc}>{item.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div
              style={styles.navDropdownWrap}
              onMouseEnter={() => setFeaturesOpen(true)}
              onMouseLeave={() => setFeaturesOpen(false)}
            >
              <a href="#features" className="bf-nav-link" style={styles.navLink}>Features</a>
              {featuresOpen && (
                <div style={styles.megaMenu}>
                  <div style={styles.megaMenuInner}>
                  <div style={styles.megaMenuArt}>
                    <img src="/features-art.png" alt="" style={styles.megaMenuArtImg} />
                  </div>
                  <div style={styles.megaMenuGrid}>
                    {[
                      { icon: "🔄", title: "Swaps", desc: "Swap securely and seamlessly" },
                      { icon: "🖼️", title: "NFTs", desc: "Explore the world of NFTs" },
                      { icon: "💳", title: "Buy Crypto", desc: "Buy crypto in under five minutes" },
                      { icon: "📈", title: "RWAs", badge: "New", desc: "Tokenized real-world assets, on-chain in self-custody" },
                      { icon: "🔮", title: "Prediction Markets", badge: "New", desc: "Trade prediction markets in self-custody" },
                      { icon: "🪙", title: "Staking", desc: "Earn crypto rewards while securing networks" },
                      { icon: "🛡️", title: "Security", desc: "Learn how we keep your assets & Web3 journey safe" },
                      { icon: "⚙️", title: "Smart Contract Wallet", desc: "Explore Web3 easily with account abstraction features" },
                      { icon: "♾️", title: "Perps", badge: "New", desc: "Trade perpetual futures with leverage" },
                    ].map((item) => (
                      <a key={item.title} href="#" style={styles.megaMenuItem}>
                        <div style={styles.megaMenuIcon}>{item.icon}</div>
                        <div>
                          <div style={styles.megaMenuTitleRow}>
                            <span style={styles.megaMenuTitle}>{item.title}</span>
                            {item.badge && <span style={styles.megaMenuBadge}>{item.badge}</span>}
                          </div>
                          <p style={styles.megaMenuDesc}>{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  </div>
                </div>
              )}
            </div>
            <div
              style={styles.navDropdownWrap}
              onMouseEnter={() => setBuildOpen(true)}
              onMouseLeave={() => setBuildOpen(false)}
            >
              <a href="#build" className="bf-nav-link" style={styles.navLink}>Build</a>
              {buildOpen && (
                <div style={styles.megaMenu}>
                  <div style={styles.megaMenuInner}>
                  <div style={styles.megaMenuArt}>
                    <img src="/build-art.png" alt="" style={styles.megaMenuArtImg} />
                  </div>
                  <div style={styles.megaMenuGrid}>
                    {[
                      { icon: "📘", title: "Developer Docs", desc: "Get guides for building powerful Web3 applications" },
                      { icon: "📤", title: "Submit dApp", desc: "Get your dApp in front of millions" },
                      { icon: "🛠️", title: "Trust Funds Agent Kit", badge: "New", desc: "Build on agent skills for wallet operations" },
                      { icon: "🧩", title: "Wallet Core", desc: "Open-source, mobile-focused crypto wallet library" },
                      { icon: "📋", title: "Get Assets Listed", desc: "Elevate your asset's exposure" },
                      { icon: "👥", title: "Trust Funds Labs", desc: "Our accelerator helping Web3 builders launch and scale" },
                    ].map((item) => (
                      <a key={item.title} href="#" style={styles.megaMenuItem}>
                        <div style={styles.megaMenuIcon}>{item.icon}</div>
                        <div>
                          <div style={styles.megaMenuTitleRow}>
                            <span style={styles.megaMenuTitle}>{item.title}</span>
                            {item.badge && <span style={styles.megaMenuBadge}>{item.badge}</span>}
                          </div>
                          <p style={styles.megaMenuDesc}>{item.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  </div>
                </div>
              )}
            </div>
            <div
              style={styles.navDropdownWrap}
              onMouseEnter={() => setSupportOpen(true)}
              onMouseLeave={() => setSupportOpen(false)}
            >
              <a href="#support" className="bf-nav-link" style={styles.navLink}>Support</a>
              {supportOpen && (
                <div style={styles.megaMenu}>
                  <div style={styles.megaMenuInner}>
                    <div style={styles.megaMenuArt}>
                      <img src="/support-art.png" alt="" style={styles.megaMenuArtImg} />
                    </div>
                    <div style={styles.megaMenuGrid}>
                      {[
                        { icon: "📚", title: "FAQ", desc: "Get answers to your most pressing questions" },
                        { icon: "🎧", title: "Contact Us", desc: "Reach out for personalized support" },
                      ].map((item) => (
                        <a key={item.title} href="#" style={styles.megaMenuItem}>
                          <div style={styles.megaMenuIcon}>{item.icon}</div>
                          <div>
                            <div style={styles.megaMenuTitleRow}>
                              <span style={styles.megaMenuTitle}>{item.title}</span>
                              {item.badge && <span style={styles.megaMenuBadge}>{item.badge}</span>}
                            </div>
                            <p style={styles.megaMenuDesc}>{item.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div
              style={styles.navDropdownWrap}
              onMouseEnter={() => setAboutOpen(true)}
              onMouseLeave={() => setAboutOpen(false)}
            >
              <a href="#about" className="bf-nav-link" style={styles.navLink}>About</a>
              {aboutOpen && (
                <div style={styles.megaMenu}>
                  <div style={styles.megaMenuInner}>
                    <div style={styles.megaMenuArt}>
                      <img src="/about-art.png" alt="" style={styles.megaMenuArtImg} />
                    </div>
                    <div style={styles.megaMenuGrid}>
                      {[
                        { icon: "🛡️", title: "About Us", desc: "Discover who we are and what drives us" },
                        { icon: "💼", title: "Careers", desc: "Join us in shaping the future of Web3" },
                        { icon: "📰", title: "Press Kit", desc: "Download our official logo and other media assets" },
                        { icon: "✍️", title: "Blog", desc: "Stay up-to-date on Web3 trends and insights" },
                        { icon: "📖", title: "Glossary", badge: "New", desc: "The words of crypto & key terms explained" },
                        { icon: "👥", title: "Compare Wallets", badge: "New", desc: "See how Trust Funds stacks up" },
                        { icon: "🧑‍🤝‍🧑", title: "Trust Funds Squad", desc: "Lead, learn & launch your Web3 journey" },
                        { icon: "📋", title: "Terms of Service", desc: "What you need to know to use our services" },
                        { icon: "🔒", title: "Privacy Policy", desc: "Your privacy matters, learn how we protect it" },
                      ].map((item) => (
                        <a key={item.title} href="#" style={styles.megaMenuItem}>
                          <div style={styles.megaMenuIcon}>{item.icon}</div>
                          <div>
                            <div style={styles.megaMenuTitleRow}>
                              <span style={styles.megaMenuTitle}>{item.title}</span>
                              {item.badge && <span style={styles.megaMenuBadge}>{item.badge}</span>}
                            </div>
                            <p style={styles.megaMenuDesc}>{item.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bf-nav-right" style={styles.navRight}>
            <button style={styles.navMoon} aria-label="Toggle theme">🌙</button>
            <button className="bf-ghost" style={styles.navLanguage}>🌐 Language</button>
            <button className="bf-cta" style={styles.navCta}>Download</button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div id="bf-mobile-menu" className="bf-mobile-menu">
            {[
              { label: "Markets", href: "#markets" },
              { label: "Wallet", href: "#wallet" },
              { label: "Features", href: "#features" },
              { label: "Build", href: "#build" },
              { label: "Support", href: "#support" },
              { label: "About", href: "#about" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="bf-mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="bf-mobile-menu-actions">
              <button
                type="button"
                className="bf-mobile-language"
                onClick={() => setMobileMenuOpen(false)}
              >
                🌐 Language
              </button>
              <button
                type="button"
                className="bf-mobile-download"
                onClick={() => setMobileMenuOpen(false)}
              >
                Download
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <header style={styles.hero}>
        <div className="bf-hero-inner" style={styles.heroInner}>
          <div className="bf-hero-left" style={styles.heroLeft}>
            <h1 style={styles.title}>
              True crypto ownership.<br />
              <span style={styles.titleAccent}>Powerful Web3 experiences</span>
            </h1>
            <p style={styles.subtitle}>
              Trust coin wallets is a free self-custody crypto wallet supporting 100+ blockchains —
              buy, send, swap, stake, and earn crypto and NFTs while you alone control your
              private keys. Available on iOS, Android, and as a browser extension, with no
              account required.
            </p>
            <div className="bf-hero-buttons" style={styles.heroButtons}>
              <a href="/login" className="bf-cta" style={{ ...styles.cta, display: "inline-block", textDecoration: "none", textAlign: "center" }}>Create Wallet</a>
              <button className="bf-ghost" style={styles.ghost}>Explore Markets</button>
            </div>
          </div>
          <div style={styles.heroRight}>
            <img src="/phone-image.png" alt="Trust Coin Wallets app preview" style={styles.heroImg} />
          </div>
        </div>

        {/* Mock market ticker strip */}
        <div style={styles.tickerWrap}>
          <div style={styles.ticker}>
            {[
              { sym: "BTC", price: "$—", chg: "+0.0%" },
              { sym: "ETH", price: "$—", chg: "+0.0%" },
              { sym: "BNB", price: "$—", chg: "+0.0%" },
              { sym: "SOL", price: "$—", chg: "+0.0%" },
              { sym: "XRP", price: "$—", chg: "+0.0%" },
              { sym: "ADA", price: "$—", chg: "+0.0%" },
            ].map((t) => (
              <div key={t.sym} style={styles.tickerItem}>
                <span style={styles.tickerSym}>{t.sym}</span>
                <span style={styles.tickerPrice}>{t.price}</span>
                <span style={styles.tickerChg}>{t.chg}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Trust bar ── */}
      <div style={styles.trustBar}>
        <div style={styles.trustBarInner}>
          <div style={styles.trustItem}>
            <span style={styles.trustLabel}>Founded in</span>
            <span style={styles.trustValue}>2026</span>
          </div>
          <div style={styles.trustItem}>
            <span style={styles.trustLabel}>Independently</span>
            <span style={styles.trustValue}>Audited</span>
          </div>
          <div style={styles.trustItem}>
            <span style={styles.trustLabel}>Self-Custody</span>
            <span style={styles.trustValue}>Verified</span>
          </div>
          <div style={styles.trustItem}>
            <span style={styles.trustValue}>Top Reviews</span>
            <div style={styles.trustStars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} style={styles.trustStar}>★</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Announcement banner ── */}
      <section style={styles.announceSection}>
        <div className="bf-announce-card" style={styles.announceCard}>
          <div style={styles.announceLeft}>
            <h2 style={styles.announceTitle}>
              PERPS + STAKING<br />
              <span style={styles.announceTitleLight}>are now </span>
              <span style={styles.announceTitleAccent}>LIVE</span>
            </h2>
            <button className="bf-cta" style={{ ...styles.cta, marginTop: 24 }}>Start Trading</button>
          </div>
          <div style={styles.announceRight}>
            <GlobeArt />
            <p style={styles.announcePoweredBy}>Powered by Trust Funds Labs</p>
          </div>
        </div>
      </section>

      {/* ── Developer banner ── */}
      <section style={styles.devBannerSection}>
        <div className="bf-dev-banner-card" style={styles.devBannerCard}>
          <div style={styles.devBannerLeft}>
            <h2 style={styles.devBannerTitle}>Building on Trust</h2>
            <p style={styles.devBannerText}>
              We know that working together as a community is better for everyone. Our
              platform enables blockchain developers to build their dApps and wallets
              natively and connect with millions of users, without having to worry about
              the low-level implementation details.
            </p>
            <a href="#build" style={styles.devBannerBtn}>Check out our Developer Docs</a>
          </div>
          <div style={styles.devBannerRight}>
            <img src="/dev-banner-art.png" alt="Trust Funds developer tools" style={styles.devBannerImg} />
          </div>
        </div>
      </section>

      {/* ── Chains section ── */}
      <section style={styles.chainsSection}>
        <div style={styles.chainsCard}>
          <h2 style={styles.chainsTitle}>One Platform, Millions of Assets</h2>
          <p style={styles.chainsSub}>
            As a leading self-custody multi-chain platform, we support millions of assets
            across 100+ blockchains. From Bitcoin, Ethereum, and Solana, to Cosmos,
            Optimism, and much more.
          </p>
          <div style={styles.chainsSearchWrap}>
            <span style={styles.chainsSearchIcon}>🔍</span>
            <input type="text" placeholder="Search a chain..." style={styles.chainsSearchInput} />
          </div>
          <div style={styles.chainsTable}>
            <div style={styles.chainsHeaderRow}>
              <span>Chain</span>
              <span style={styles.chainsHeaderCenter}>Buy</span>
              <span style={styles.chainsHeaderCenter}>Sell</span>
              <span style={styles.chainsHeaderCenter}>Swap</span>
              <span style={styles.chainsHeaderCenter}>Earn</span>
              <span style={styles.chainsHeaderCenter}>dApps</span>
            </div>
            {[
              { name: "Bitcoin (BTC)", icon: "₿" },
              { name: "Ethereum (ETH)", icon: "Ξ" },
              { name: "BNB Smart Chain (BNB)", icon: "◆" },
              { name: "Solana (SOL)", icon: "◎" },
              { name: "Cosmos (ATOM)", icon: "⚛" },
              { name: "Optimism (OP)", icon: "○" },
            ].map((chain) => (
              <div key={chain.name} className="bf-market-row" style={styles.chainsRow}>
                <span style={styles.chainsAsset}>
                  <span style={styles.chainsIcon}>{chain.icon}</span>
                  {chain.name}
                </span>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} style={styles.chainsCheckWrap}>
                    <span style={styles.chainsCheck}>✓</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Simple Seamless section ── */}
      <section style={styles.simpleSection}>
        <div style={styles.simpleHead}>
          <h2 style={styles.simpleTitle}>Simple. Seamless.</h2>
          <p style={styles.simpleSub}>
            Enjoy a smooth mobile app and desktop experience with easy-to-use, powerful
            tools to support your entire Web3 journey.
          </p>
        </div>
        <div className="bf-simple-card" style={styles.simpleCard}>
          <div style={styles.simpleCardLeft}>
            <h3 style={styles.simpleCardTitle}>Deposit crypto easily from exchanges</h3>
            <p style={styles.simpleCardText}>
              Take control of your crypto. Avoid complicated steps and deposit directly to
              your wallet from exchanges like Binance and Coinbase.
            </p>
            <a href="#wallet" style={styles.simpleCardBtn}>Get started with deposits</a>
          </div>
          <div style={styles.simpleCardRight}>
            <img src="/deposit-art.png" alt="Deposit crypto from exchanges" style={styles.simpleCardImg} />
          </div>
        </div>
      </section>

      {/* ── Stay private and secure section ── */}
      <section style={styles.privacySection}>
        <div style={styles.privacyHead}>
          <h2 style={styles.privacyTitle}>Stay private and secure</h2>
          <p style={styles.privacySub}>
            Rest easy knowing that our privacy and security measures keep you in control
            of your data and digital assets, while also keeping them safe.
          </p>
        </div>
        <div className="bf-privacy-card" style={styles.privacyCard}>
          <div style={styles.privacyCardLeft}>
            <h3 style={styles.privacyCardTitle}>True ownership of your crypto assets</h3>
            <p style={styles.privacyCardText}>
              We secure your wallet, but don't control or have access to your private
              keys or secret phrase — only you do.
            </p>
            <button className="bf-cta" style={styles.cta}>Get Started</button>
          </div>
          <div style={styles.privacyCardRight}>
            <img src="/security-art.png" alt="Wallet security" style={styles.privacyCardImg} />
          </div>
        </div>
        <div className="bf-privacy-grid" style={styles.privacyGrid}>
          {[
            { title: "Added security with encryption", desc: "Use our Encrypted Cloud Backup for increased wallet security.", art: "/security-encryption-art.png" },
            { title: "Zero personal tracking", desc: "We don't track any personal information, including your IP address or balances.", art: "/security-tracking-art.png" },
            { title: "Proactive alerts for risky transactions", desc: "Stay safe with alerts for risky address and dApp connections.", art: "/security-alerts-art.png" },
          ].map((card) => (
            <div key={card.title} style={styles.privacyGridCard}>
              <h4 style={styles.privacyGridTitle}>{card.title}</h4>
              <img src={card.art} alt={card.title} style={styles.privacyGridImg} />
              <p style={styles.privacyGridDesc}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── One-stop Web3 wallet section ── */}
      <section style={styles.oneStopSection}>
        <div className="bf-onestop-card" style={styles.oneStopCard}>
          <div style={styles.oneStopLeft}>
            <h2 style={styles.oneStopTitle}>Your one-stop, Web3 wallet</h2>
            <p style={styles.oneStopText}>
              Buy, sell, and swap crypto, earn rewards, manage NFTs, and discover DApps,
              all in one place.
            </p>
            <div style={styles.oneStopTabs}>
              <button
                style={{ ...styles.oneStopTab, ...(walletTab === "mobile" ? styles.oneStopTabActive : {}) }}
                onClick={() => setWalletTab("mobile")}
              >
                Mobile
              </button>
              <button
                style={{ ...styles.oneStopTab, ...(walletTab === "extension" ? styles.oneStopTabActive : {}) }}
                onClick={() => setWalletTab("extension")}
              >
                Extension
              </button>
            </div>
            <a href="#wallet" style={styles.oneStopDownloadBtn}>
              Download {walletTab === "mobile" ? "Mobile App" : "Extension"}
            </a>
          </div>
          <div style={styles.oneStopRight}>
            {walletTab === "extension" ? (
              <video
                key="extension"
                src="/extension-preview.mp4"
                autoPlay
                muted
                loop
                playsInline
                style={styles.oneStopMedia}
              />
            ) : (
              <video
                key="mobile"
                src="/mobile-preview.mp4"
                autoPlay
                muted
                loop
                playsInline
                style={styles.oneStopMedia}
              />
            )}
          </div>
        </div>
      </section>

      {/* ── Ratings headline ── */}
      <section style={styles.ratingsSection}>
        <h2 style={styles.ratingsTitle}>Trust Funds is one of the highest-rated self-custody crypto wallets</h2>
        <p style={styles.ratingsSub}>
          Rated 4.8 on the App Store and 4.7 on Google Play, across 500K+ verified
          reviews — trusted by users on iOS and Android.
        </p>
        <p style={styles.ratingsDate}>Rating as of August 2026</p>
      </section>

      {/* ── Footer ── */}
      <footer style={styles.footer}>
        <div style={styles.footerTop}>
          <div style={styles.footerBrand}>
            <div style={styles.logo}>
              <img src="/bit_funds_logo.png" alt="Trust Funds" style={styles.logoImg} />
              <span style={styles.logoText}>Trust Funds</span>
            </div>
          </div>

          <div className="bf-footer-columns" style={styles.footerColumns}>
            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Wallet</h4>
              <a href="#" style={styles.footerLink}>Mobile App</a>
              <a href="#" style={styles.footerLink}>Browser Extension</a>
            </div>

            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Features</h4>
              <a href="#" style={styles.footerLink}>Buy Crypto</a>
              <a href="#" style={styles.footerLink}>Swaps</a>
              <a href="#" style={styles.footerLink}>Staking</a>
              <a href="#" style={styles.footerLink}>NFTs</a>
              <a href="#" style={styles.footerLink}>SWIFT: Smart Contract Wallet</a>
              <span style={styles.footerLinkBadgeRow}>
                <a href="#" style={styles.footerLink}>RWAs</a>
                <span style={styles.footerBadge}>New</span>
              </span>
              <span style={styles.footerLinkBadgeRow}>
                <a href="#" style={styles.footerLink}>Perps</a>
                <span style={styles.footerBadge}>New</span>
              </span>
              <span style={styles.footerLinkBadgeRow}>
                <a href="#" style={styles.footerLink}>Prediction Markets</a>
                <span style={styles.footerBadge}>New</span>
              </span>
            </div>

            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Markets</h4>
              <span style={styles.footerLinkBadgeRow}>
                <a href="#markets" style={styles.footerLink}>Prices</a>
                <span style={styles.footerBadge}>New</span>
              </span>
              <a href="#" style={styles.footerLink}>Converter</a>

              <h4 style={{ ...styles.footerColTitle, marginTop: 24 }}>Wallets</h4>
              <a href="#" style={styles.footerLink}>Bitcoin Wallet</a>
              <a href="#" style={styles.footerLink}>USDT Wallet</a>
              <a href="#" style={styles.footerLink}>TRON Wallet</a>
              <a href="#" style={styles.footerLink}>XRP Wallet</a>
              <a href="#" style={styles.footerLink}>TON Wallet</a>
              <a href="#" style={styles.footerLink}>Litecoin Wallet</a>
              <a href="#" style={styles.footerLink}>BEP20 Wallet</a>
            </div>

            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>Build</h4>
              <a href="#build" style={styles.footerLink}>Developer Docs</a>
              <a href="#" style={styles.footerLink}>Wallet Core</a>
              <a href="#" style={styles.footerLink}>Submit dApp</a>
              <a href="#" style={styles.footerLink}>Get Assets Listed</a>
              <span style={styles.footerLinkBadgeRow}>
                <a href="#" style={styles.footerLink}>Agent Kit</a>
                <span style={styles.footerBadge}>New</span>
              </span>
            </div>

            <div style={styles.footerCol}>
              <h4 style={styles.footerColTitle}>About</h4>
              <a href="#" style={styles.footerLink}>About Us</a>
              <a href="#" style={styles.footerLink}>Careers</a>
              <a href="#" style={styles.footerLink}>Press Kit</a>
              <a href="#" style={styles.footerLink}>Security</a>
              <a href="#" style={styles.footerLink}>Blog</a>
              <a href="#" style={styles.footerLink}>Glossary</a>
              <a href="#" style={styles.footerLink}>Compare Wallets</a>
              <a href="#support" style={styles.footerLink}>Support</a>
              <a href="#" style={styles.footerLink}>Terms of Service</a>
              <a href="#" style={styles.footerLink}>Privacy Notice</a>
              <a href="#" style={styles.footerLink}>Cookie Notice</a>
            </div>
          </div>

          <div style={styles.footerBadges}>
            <div style={styles.footerCertBadge}>
              <span style={styles.footerCertLabel}>ISO 27701</span>
              <span style={styles.footerCertSub}>CERTIFIED</span>
            </div>
            <div style={styles.footerCertBadge}>
              <span style={styles.footerCertLabel}>ISO 27001</span>
              <span style={styles.footerCertSub}>CERTIFIED</span>
            </div>
          </div>
        </div>

        <div style={styles.footerBottom}>
          <p style={styles.footerText}>© {new Date().getFullYear()} Trust Funds. Self-custody wallet. Market data for informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Inter', -apple-system, sans-serif", background: "#0b0e0a", color: "#e8e8e8", minHeight: "100vh" },

  nav: { position: "sticky", top: 0, zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(11,14,10,0.08)" },
  navInner: { maxWidth: 1200, margin: "0 auto", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoImg: { width: 34, height: 34, objectFit: "contain" },
  logoText: { fontWeight: 800, fontSize: 17, color: "#0b0e0a", letterSpacing: "-0.02em" },
  navLinks: { display: "flex", gap: 28, alignItems: "center" },
  navDropdownWrap: { position: "relative" },
  megaMenu: {
    position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
    width: 720, paddingTop: 18, zIndex: 60,
  },
  megaMenuInner: {
    background: "#ffffff", border: "1px solid rgba(11,14,10,0.08)", borderRadius: 16,
    padding: "32px 36px", display: "grid", gridTemplateColumns: "180px 1fr", gap: 32,
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  },
  megaMenuArt: { display: "flex", alignItems: "center", justifyContent: "center" },
  megaMenuArtImg: { width: "100%", maxWidth: 160, height: "auto", objectFit: "contain" },
  megaMenuGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 28px" },
  megaMenuItem: { display: "flex", gap: 12, textDecoration: "none", alignItems: "flex-start" },
  megaMenuIcon: {
    width: 34, height: 34, borderRadius: 8, background: "rgba(61,92,255,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0,
  },
  megaMenuTitleRow: { display: "flex", alignItems: "center", gap: 8 },
  megaMenuTitle: { color: "#0b0e0a", fontSize: 14.5, fontWeight: 700 },
  megaMenuBadge: { background: "#3D5CFF", color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999 },
  megaMenuDesc: { color: "rgba(11,14,10,0.55)", fontSize: 12.5, lineHeight: 1.5, margin: "4px 0 0" },
  navRight: { display: "flex", alignItems: "center", gap: 14 },
  navMoon: { background: "transparent", border: "none", color: "rgba(11,14,10,0.6)", fontSize: 17, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" },
  navLanguage: { background: "transparent", color: "#3D5CFF", border: "1px solid rgba(61,92,255,0.4)", borderRadius: 999, padding: "9px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 },
  navLink: { color: "rgba(11,14,10,0.65)", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "color 0.2s" },
  navCta: { background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 999, padding: "10px 26px", fontSize: 14, fontWeight: 800, cursor: "pointer", transition: "background 0.2s" },

  hero: { padding: "110px 32px 0", background: "#ffffff" },

  trustBar: { background: "#ffffff", padding: "36px 32px", borderBottom: "1px solid rgba(11,14,10,0.06)" },
  trustBarInner: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 24 },
  trustItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 140 },
  trustLabel: { fontSize: 15, fontWeight: 700, color: "#0b0e0a" },
  trustValue: { fontSize: 15, fontWeight: 700, color: "#0b0e0a" },
  trustStars: { display: "flex", gap: 2, marginTop: 4 },
  trustStar: { fontSize: 16, color: "#3D5CFF" },

  announceSection: { background: "#ffffff", padding: "0 32px 60px" },
  announceCard: {
    maxWidth: 1100, margin: "0 auto", background: "linear-gradient(135deg, #f4f6ff 0%, #eef0fb 100%)",
    borderRadius: 24, padding: "56px 48px", display: "grid", gridTemplateColumns: "1.3fr 1fr",
    alignItems: "center", gap: 32, border: "1px solid rgba(61,92,255,0.1)",
  },
  announceLeft: { display: "flex", flexDirection: "column" },
  announceTitle: { fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)", fontWeight: 900, lineHeight: 1.05, margin: 0, color: "#2233dd" },
  announceTitleLight: { color: "#2233dd" },
  announceTitleAccent: { background: "linear-gradient(90deg, #3D5CFF, #33D9C1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  announceRight: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  announcePoweredBy: { fontSize: 13, color: "rgba(11,14,10,0.45)", margin: 0 },
  heroInner: { maxWidth: 1200, margin: "0 auto 60px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" },
  heroLeft: { textAlign: "left" },
  heroRight: { display: "flex", justifyContent: "center" },
  heroImg: { width: "100%", maxWidth: 520, height: "auto", objectFit: "contain" },
  badge: { display: "inline-block", background: "rgba(61,92,255,0.12)", border: "1px solid rgba(61,92,255,0.35)", borderRadius: 6, padding: "8px 16px", fontSize: 12.5, fontWeight: 800, letterSpacing: "0.08em", color: "#3D5CFF", marginBottom: 28 },
  title: { fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.03em", color: "#0b0e0a", margin: "0 0 22px" },
  titleAccent: { color: "#0b0e0a" },
  subtitle: { fontSize: 16.5, lineHeight: 1.65, fontWeight: 400, color: "rgba(11,14,10,0.6)", maxWidth: 480, margin: "0 0 36px" },
  darkSubtitle: { fontSize: 16.5, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", maxWidth: 480 },
  heroButtons: { display: "flex", gap: 14, flexWrap: "wrap" },
  cta: { background: "#3D5CFF", color: "#fff", border: "none", borderRadius: 8, padding: "15px 30px", fontSize: 15, fontWeight: 800, cursor: "pointer", transition: "all 0.2s" },
  ghost: { background: "transparent", color: "#0b0e0a", border: "1px solid rgba(11,14,10,0.2)", borderRadius: 8, padding: "15px 30px", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" },

  tickerWrap: { borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "#0b0e0a", overflow: "hidden" },
  ticker: { display: "flex", justifyContent: "center", gap: 40, padding: "16px 32px", flexWrap: "wrap", maxWidth: 1200, margin: "0 auto" },
  tickerItem: { display: "flex", gap: 8, alignItems: "baseline", fontSize: 13.5 },
  tickerSym: { fontWeight: 800, color: "#fff" },
  tickerPrice: { color: "rgba(255,255,255,0.75)" },
  tickerChg: { color: "#0ecb81", fontWeight: 700, fontSize: 12.5 },

  section: { padding: "90px 32px" },

  devBannerSection: { background: "#ffffff", padding: "0 32px 60px" },
  devBannerCard: {
    maxWidth: 1100, margin: "0 auto", background: "linear-gradient(135deg, #4A3DFF 0%, #3D5CFF 100%)",
    borderRadius: 24, padding: "56px 48px", display: "grid", gridTemplateColumns: "1.3fr 1fr",
    alignItems: "center", gap: 32, overflow: "hidden",
  },
  devBannerLeft: { display: "flex", flexDirection: "column" },
  devBannerTitle: { fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)", fontWeight: 800, color: "#fff", margin: "0 0 20px" },
  devBannerText: { fontSize: 15.5, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", maxWidth: 480, margin: "0 0 28px" },
  devBannerBtn: {
    display: "inline-block", background: "#fff", color: "#3D5CFF", textDecoration: "none",
    borderRadius: 999, padding: "14px 28px", fontSize: 14.5, fontWeight: 700, width: "fit-content",
  },
  devBannerRight: { display: "flex", justifyContent: "center" },
  devBannerImg: { width: "100%", maxWidth: 320, height: "auto", objectFit: "contain" },

  chainsSection: { background: "#ffffff", padding: "0 32px 60px" },
  chainsCard: {
    maxWidth: 1100, margin: "0 auto", background: "linear-gradient(135deg, #4A3DFF 0%, #3D5CFF 100%)",
    borderRadius: 24, padding: "56px 48px 0", overflow: "hidden",
  },
  chainsTitle: { fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#fff", textAlign: "center", margin: "0 0 16px" },
  chainsSub: { fontSize: 15.5, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: 640, margin: "0 auto 32px" },
  chainsSearchWrap: {
    display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 999,
    padding: "14px 22px", maxWidth: 700, margin: "0 auto 0",
  },
  chainsSearchIcon: { fontSize: 15, opacity: 0.5 },
  chainsSearchInput: { border: "none", outline: "none", fontSize: 14.5, flex: 1, color: "#0b0e0a", background: "transparent" },
  chainsTable: {
    background: "#fff", borderRadius: 20, marginTop: 32, padding: "8px 0",
    maxHeight: 420, overflowY: "auto",
  },
  chainsHeaderRow: {
    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "18px 28px",
    color: "rgba(11,14,10,0.45)", fontSize: 13, fontWeight: 700, borderBottom: "1px solid rgba(11,14,10,0.06)",
  },
  chainsHeaderCenter: { textAlign: "center" },
  chainsRow: {
    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", padding: "16px 28px",
    alignItems: "center", borderBottom: "1px solid rgba(11,14,10,0.04)",
  },
  chainsAsset: { display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 14.5, color: "#0b0e0a" },
  chainsIcon: {
    width: 28, height: 28, borderRadius: "50%", background: "rgba(61,92,255,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0,
  },
  chainsCheckWrap: { display: "flex", justifyContent: "center" },
  chainsCheck: {
    width: 20, height: 20, borderRadius: "50%", background: "#3D5CFF", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800,
  },

  simpleSection: { background: "linear-gradient(180deg, #fdf3d7 0%, #fcdce8 50%, #f6d5f7 100%)", padding: "80px 32px 0" },
  simpleHead: { maxWidth: 800, margin: "0 auto 56px", textAlign: "center" },
  simpleTitle: { fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", fontWeight: 800, color: "#0b0e0a", margin: "0 0 20px" },
  simpleSub: { fontSize: 16.5, lineHeight: 1.7, color: "rgba(11,14,10,0.65)", margin: 0 },
  simpleCard: {
    maxWidth: 1100, margin: "0 auto", background: "#fff", borderRadius: 28,
    padding: "56px 56px 0", display: "grid", gridTemplateColumns: "1fr 1fr",
    alignItems: "center", gap: 40, overflow: "hidden",
  },
  simpleCardLeft: { paddingBottom: 56 },
  simpleCardTitle: { fontSize: "clamp(1.6rem, 3vw, 2.1rem)", fontWeight: 800, color: "#0b0e0a", margin: "0 0 20px" },
  simpleCardText: { fontSize: 15.5, lineHeight: 1.7, color: "rgba(11,14,10,0.6)", margin: "0 0 28px" },
  simpleCardBtn: {
    display: "inline-block", background: "transparent", color: "#3D5CFF", textDecoration: "none",
    border: "1.5px solid #3D5CFF", borderRadius: 999, padding: "14px 28px", fontSize: 14.5, fontWeight: 700,
  },
  simpleCardRight: { display: "flex", justifyContent: "center", alignSelf: "flex-end" },
  simpleCardImg: { width: "100%", maxWidth: 400, height: "auto", objectFit: "contain", display: "block" },

  privacySection: { background: "linear-gradient(180deg, #7fdff2 0%, #4fb8e8 100%)", padding: "80px 32px" },
  privacyHead: { maxWidth: 800, margin: "0 auto 56px", textAlign: "center" },
  privacyTitle: { fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", fontWeight: 800, color: "#0b0e0a", margin: "0 0 20px" },
  privacySub: { fontSize: 16.5, lineHeight: 1.7, color: "rgba(11,14,10,0.7)", margin: 0 },
  privacyCard: {
    maxWidth: 1100, margin: "0 auto 24px", background: "#fff", borderRadius: 28,
    padding: "56px 56px", display: "grid", gridTemplateColumns: "1fr 1fr",
    alignItems: "center", gap: 40,
  },
  privacyCardLeft: {},
  privacyCardTitle: { fontSize: "clamp(1.6rem, 3vw, 2.1rem)", fontWeight: 800, color: "#0b0e0a", margin: "0 0 20px" },
  privacyCardText: { fontSize: 15.5, lineHeight: 1.7, color: "rgba(11,14,10,0.6)", margin: "0 0 28px" },
  privacyCardRight: { display: "flex", justifyContent: "center" },
  privacyCardImg: { width: "100%", maxWidth: 380, height: "auto", objectFit: "contain" },
  privacyGrid: { maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 },
  privacyGridCard: { background: "#fff", borderRadius: 20, padding: "32px 28px" },
  privacyGridTitle: { fontSize: 20, fontWeight: 800, color: "#0b0e0a", margin: "0 0 24px", lineHeight: 1.25 },
  privacyGridImg: { width: 90, height: 90, objectFit: "contain", display: "block", margin: "0 0 24px" },
  privacyGridDesc: { fontSize: 14.5, lineHeight: 1.65, color: "rgba(11,14,10,0.6)", margin: 0 },

  oneStopSection: { background: "#ffffff", padding: "0 32px 90px" },
  oneStopCard: {
    maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1.2fr",
    borderRadius: 24, overflow: "hidden", border: "1px solid rgba(11,14,10,0.06)",
  },
  oneStopLeft: { background: "#f4f4f6", padding: "56px 48px", display: "flex", flexDirection: "column", justifyContent: "center" },
  oneStopTitle: { fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)", fontWeight: 800, color: "#0b0e0a", margin: "0 0 20px" },
  oneStopText: { fontSize: 15.5, lineHeight: 1.7, color: "rgba(11,14,10,0.6)", margin: "0 0 32px" },
  oneStopTabs: {
    display: "inline-flex", background: "#fff", border: "1.5px solid rgba(11,14,10,0.15)",
    borderRadius: 999, padding: 4, gap: 4, marginBottom: 24, width: "fit-content",
  },
  oneStopTab: {
    background: "transparent", border: "none", borderRadius: 999, padding: "10px 24px",
    fontSize: 14, fontWeight: 700, color: "#0b0e0a", cursor: "pointer", transition: "all 0.2s",
  },
  oneStopTabActive: { background: "#3D5CFF", color: "#fff" },
  oneStopDownloadBtn: {
    display: "inline-block", background: "#3D5CFF", color: "#fff", textDecoration: "none",
    borderRadius: 999, padding: "15px 30px", fontSize: 14.5, fontWeight: 700, width: "fit-content",
  },
  oneStopRight: { background: "#0b0e0a", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420, padding: 40 },
  oneStopMedia: { width: "auto", maxWidth: "70%", height: "auto", maxHeight: 380, objectFit: "contain", display: "block", borderRadius: 12 },

  ratingsSection: { background: "#ffffff", padding: "0 32px 90px", textAlign: "center" },
  ratingsTitle: { fontSize: "clamp(1.6rem, 3.2vw, 2.4rem)", fontWeight: 800, color: "#0b0e0a", maxWidth: 900, margin: "0 auto 20px", lineHeight: 1.25 },
  ratingsSub: { fontSize: 16, lineHeight: 1.7, color: "rgba(11,14,10,0.6)", maxWidth: 620, margin: "0 auto 12px" },
  ratingsDate: { fontSize: 13, color: "rgba(11,14,10,0.4)", margin: 0 },
  sectionInner: { maxWidth: 1200, margin: "0 auto" },
  sectionHead: { textAlign: "center", marginBottom: 56 },
  eyebrow: { display: "block", color: "#3D5CFF", fontSize: 12.5, fontWeight: 800, letterSpacing: "0.14em", marginBottom: 14 },
  sectionTitle: { fontSize: "clamp(1.7rem, 3.2vw, 2.4rem)", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", margin: "0 0 10px" },
  sectionSub: { color: "rgba(255,255,255,0.5)", fontSize: 15, margin: 0 },

  marketTable: { border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" },
  marketHeaderRow: { display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", padding: "16px 24px", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.45)", fontSize: 12.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" },
  marketRow: { display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", padding: "18px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 14.5, transition: "background 0.15s" },
  marketAsset: { fontWeight: 700, color: "#fff" },
  marketChg: { color: "rgba(255,255,255,0.4)" },

  featureGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 },
  featureCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 28, transition: "all 0.2s" },
  featureIcon: { fontSize: 26, marginBottom: 16 },
  featureTitle: { fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 8px" },
  featureDesc: { fontSize: 13.5, lineHeight: 1.65, color: "rgba(255,255,255,0.55)", margin: 0 },

  stepGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 },
  stepCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 28, transition: "border-color 0.2s" },
  stepNum: { fontSize: 13, fontWeight: 800, color: "#3D5CFF", letterSpacing: "0.1em", marginBottom: 14 },
  stepTitle: { fontSize: 17, fontWeight: 700, color: "#fff", margin: "0 0 8px" },
  stepDesc: { fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", margin: 0 },

  securityBanner: { background: "#12140a", padding: "90px 32px" },
  securityInner: { maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 56, alignItems: "center" },
  securityCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 30 },
  securityRow: { display: "flex", alignItems: "center", gap: 14, padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500 },
  checkIcon: { width: 20, height: 20, borderRadius: 5, background: "rgba(61,92,255,0.15)", color: "#3D5CFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 },

  bottomCta: { textAlign: "center", padding: "100px 32px" },
  bottomCtaTitle: { fontSize: "clamp(1.7rem, 3.2vw, 2.4rem)", fontWeight: 800, color: "#fff", margin: "0 0 14px" },
  bottomCtaSub: { fontSize: 15.5, color: "rgba(255,255,255,0.55)", margin: "0 0 32px" },

  footer: { background: "#f4f4f6", padding: "72px 32px 0" },
  footerTop: { maxWidth: 1300, margin: "0 auto", display: "grid", gridTemplateColumns: "280px 1fr auto", gap: 32, alignItems: "start" },
  footerBrand: { display: "flex", flexDirection: "column", gap: 24 },
  footerColumns: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 32 },
  footerCol: { display: "flex", flexDirection: "column", gap: 14 },
  footerColTitle: { fontSize: 15, fontWeight: 800, color: "#0b0e0a", margin: "0 0 4px" },
  footerLink: { color: "rgba(11,14,10,0.7)", textDecoration: "none", fontSize: 14.5 },
  footerLinkBadgeRow: { display: "flex", alignItems: "center", gap: 8 },
  footerBadge: { background: "#3D5CFF", color: "#fff", fontSize: 9.5, fontWeight: 800, padding: "2px 7px", borderRadius: 999 },
  footerBadges: { display: "flex", gap: 12, alignSelf: "start" },
  footerCertBadge: {
    width: 90, height: 100, border: "1.5px solid rgba(11,14,10,0.25)", borderRadius: 10,
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    gap: 4, padding: 8, textAlign: "center",
  },
  footerCertLabel: { fontSize: 11.5, fontWeight: 800, color: "#0b0e0a" },
  footerCertSub: { fontSize: 8, fontWeight: 700, color: "rgba(11,14,10,0.5)", letterSpacing: "0.05em" },
  footerBottom: { maxWidth: 1300, margin: "56px auto 0", borderTop: "1px solid rgba(11,14,10,0.08)", padding: "24px 0" },
  footerText: { color: "rgba(11,14,10,0.45)", fontSize: 12.5, margin: 0 },
};

export default Home;