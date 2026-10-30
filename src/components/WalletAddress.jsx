import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function WalletAddress() {
  const { token: address } = useAuth(); // login() stored the wallet address
  const [copied, setCopied] = React.useState(false);

  if (!address) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div style={{ background: "#f4f4f6", borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(11,14,10,0.5)", marginBottom: 6 }}>
        Your wallet address (BNB Smart Chain / Ethereum)
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 13.5, wordBreak: "break-all", color: "#0b0e0a" }}>
        {address}
      </div>
      <button
        onClick={copy}
        style={{
          marginTop: 12, background: "#3D5CFF", color: "#fff", border: "none",
          borderRadius: 999, padding: "10px 20px", fontWeight: 700, cursor: "pointer",
        }}
      >
        {copied ? "✓ Copied" : "Copy address"}
      </button>
    </div>
  );
}