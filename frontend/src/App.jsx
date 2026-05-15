/**
 * OKX DeFi Command Center — Main Dashboard
 * Shows: Wallet Overview, Risk Score, Live Signals, NL Swap Chat
 */

import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000";
const MOCK_WALLET = "0x742d35Cc6634C0532925a3b8D4C9E9e5E9b8a123";

function RiskBadge({ level }) {
  const colors = {
    LOW: "#00ff88",
    MEDIUM: "#ffcc00",
    HIGH: "#ff8800",
    CRITICAL: "#ff2244",
  };
  return (
    <span style={{
      background: colors[level] || "#888",
      color: "#000",
      padding: "2px 10px",
      borderRadius: "12px",
      fontWeight: "700",
      fontSize: "0.75rem",
      letterSpacing: "0.08em"
    }}>
      {level}
    </span>
  );
}

function SignalBadge({ signal }) {
  const map = {
    BULLISH: { color: "#00ff88", label: "▲ BULLISH" },
    MILDLY_BULLISH: { color: "#88ffcc", label: "▲ MILD BULL" },
    BEARISH: { color: "#ff2244", label: "▼ BEARISH" },
    MILDLY_BEARISH: { color: "#ff8866", label: "▼ MILD BEAR" },
    NEUTRAL: { color: "#aaa", label: "◆ NEUTRAL" },
  };
  const s = map[signal] || map.NEUTRAL;
  return (
    <span style={{ color: s.color, fontWeight: "700", fontSize: "0.75rem" }}>{s.label}</span>
  );
}

export default function App() {
  const [wallet, setWallet] = useState(MOCK_WALLET);
  const [inputWallet, setInputWallet] = useState(MOCK_WALLET);
  const [portfolio, setPortfolio] = useState(null);
  const [signals, setSignals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [swapCommand, setSwapCommand] = useState("");
  const [swapResult, setSwapResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("portfolio");
  const [error, setError] = useState(null);

  const fetchAll = async (addr) => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, sRes, aRes] = await Promise.all([
        axios.get(`${API}/portfolio/${addr}`).catch(() => null),
        axios.get(`${API}/signals`).catch(() => null),
        axios.get(`${API}/alerts/${addr}`).catch(() => null),
      ]);
      if (pRes?.data) setPortfolio(pRes.data);
      if (sRes?.data) setSignals(sRes.data.signals || []);
      if (aRes?.data) setAlerts(aRes.data.alerts || []);
    } catch (e) {
      setError("Could not connect to backend. Make sure the server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(wallet); }, [wallet]);

  const handleSwap = async () => {
    if (!swapCommand.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/swap/nl`, {
        command: swapCommand,
        wallet_address: wallet
      });
      setSwapResult(res.data);
    } catch (e) {
      setSwapResult({ status: "error", message: "Backend not reachable. Check server." });
    } finally {
      setLoading(false);
    }
  };

  const s = {
    app: {
      minHeight: "100vh",
      background: "#050508",
      color: "#e8eaf0",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      padding: "24px"
    },
    header: {
      borderBottom: "1px solid #1a1a2e",
      paddingBottom: "16px",
      marginBottom: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "12px"
    },
    title: { fontSize: "1.4rem", fontWeight: "700", color: "#00d4ff", letterSpacing: "-0.02em", margin: 0 },
    subtitle: { color: "#555", fontSize: "0.75rem", margin: "2px 0 0" },
    walletBar: { display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" },
    input: {
      background: "#0d0d1a", border: "1px solid #1a1a3e", borderRadius: "6px",
      color: "#e8eaf0", padding: "8px 12px", fontFamily: "inherit",
      fontSize: "0.75rem", width: "320px", outline: "none"
    },
    btn: {
      background: "#00d4ff", color: "#000", border: "none", borderRadius: "6px",
      padding: "8px 16px", fontWeight: "700", fontFamily: "inherit",
      fontSize: "0.75rem", cursor: "pointer", letterSpacing: "0.05em"
    },
    tabs: { display: "flex", gap: "4px", marginBottom: "20px", flexWrap: "wrap" },
    tab: (active) => ({
      background: active ? "#00d4ff" : "#0d0d1a",
      color: active ? "#000" : "#888",
      border: `1px solid ${active ? "#00d4ff" : "#1a1a3e"}`,
      borderRadius: "6px", padding: "6px 16px", fontFamily: "inherit",
      fontSize: "0.75rem", fontWeight: active ? "700" : "400",
      cursor: "pointer", letterSpacing: "0.05em"
    }),
    card: {
      background: "#0a0a14", border: "1px solid #1a1a2e",
      borderRadius: "10px", padding: "20px", marginBottom: "16px"
    },
    cardTitle: {
      fontSize: "0.7rem", color: "#444", textTransform: "uppercase",
      letterSpacing: "0.12em", margin: "0 0 14px"
    },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" },
    statBig: { fontSize: "2rem", fontWeight: "700", color: "#00d4ff", margin: "4px 0" },
    row: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 0", borderBottom: "1px solid #111"
    },
    alertBox: (severity) => ({
      background: severity === "HIGH" ? "#1a0505" : "#0d0d00",
      border: `1px solid ${severity === "HIGH" ? "#441111" : "#333300"}`,
      borderRadius: "6px", padding: "10px 14px", marginBottom: "8px", fontSize: "0.8rem"
    }),
    swapInput: {
      background: "#0d0d1a", border: "1px solid #1a1a3e", borderRadius: "6px",
      color: "#e8eaf0", padding: "12px", fontFamily: "inherit",
      fontSize: "0.85rem", width: "100%", outline: "none", boxSizing: "border-box"
    },
    resultBox: {
      background: "#080810", border: "1px solid #1a2a1a", borderRadius: "8px",
      padding: "14px", marginTop: "12px", fontSize: "0.8rem",
      whiteSpace: "pre-wrap", color: "#88ffaa"
    },
    errorBanner: {
      background: "#1a0808", border: "1px solid #441111", borderRadius: "8px",
      padding: "12px 16px", marginBottom: "16px", color: "#ff8888", fontSize: "0.8rem"
    }
  };

  return (
    <div style={s.app}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>⬡ OKX DeFi Command Center</h1>
          <p style={s.subtitle}>Powered by X-Agent OKX Agentic Wallet Skill Suite</p>
        </div>
        <div style={s.walletBar}>
          <input
            style={s.input}
            value={inputWallet}
            onChange={e => setInputWallet(e.target.value)}
            placeholder="Enter wallet address..."
          />
          <button style={s.btn} onClick={() => setWallet(inputWallet)}>LOAD</button>
          <button style={{ ...s.btn, background: "#1a1a3e", color: "#00d4ff" }}
            onClick={() => fetchAll(wallet)}>↻ REFRESH</button>
        </div>
      </div>

      {error && <div style={s.errorBanner}>⚠ {error}</div>}

      {/* Tabs */}
      <div style={s.tabs}>
        {["portfolio", "signals", "alerts", "swap"].map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {t === "portfolio" && "💼 "}
            {t === "signals" && "📡 "}
            {t === "alerts" && "🔔 "}
            {t === "swap" && "⚡ "}
            {t.toUpperCase()}
          </button>
        ))}
        {loading && <span style={{ color: "#555", fontSize: "0.7rem", alignSelf: "center" }}>loading...</span>}
      </div>

      {/* PORTFOLIO TAB */}
      {tab === "portfolio" && (
        <div>
          {portfolio ? (
            <>
              <div style={s.grid}>
                <div style={s.card}>
                  <p style={s.cardTitle}>Total Portfolio Value</p>
                  <div style={s.statBig}>${portfolio.portfolio?.total_usd?.toLocaleString() || "—"}</div>
                  <div style={{ color: "#555", fontSize: "0.75rem" }}>
                    {portfolio.portfolio?.token_count || 0} assets across multiple chains
                    {portfolio.portfolio?.is_mock && <span style={{ color: "#664400", marginLeft: "8px" }}>[DEMO DATA]</span>}
                  </div>
                </div>
                <div style={s.card}>
                  <p style={s.cardTitle}>Risk Score</p>
                  <div style={{ ...s.statBig, color: portfolio.risk?.level === "LOW" ? "#00ff88" : portfolio.risk?.level === "HIGH" || portfolio.risk?.level === "CRITICAL" ? "#ff4444" : "#ffcc00" }}>
                    {portfolio.risk?.score ?? "—"} / 100
                  </div>
                  <RiskBadge level={portfolio.risk?.level || "UNKNOWN"} />
                  <div style={{ color: "#555", fontSize: "0.75rem", marginTop: "6px" }}>{portfolio.risk?.summary}</div>
                </div>
              </div>
              <div style={s.card}>
                <p style={s.cardTitle}>Token Holdings</p>
                {(portfolio.portfolio?.tokens || []).map((token, i) => (
                  <div key={i} style={s.row}>
                    <span style={{ fontWeight: "700", color: "#00d4ff", minWidth: "60px" }}>{token.symbol}</span>
                    <span style={{ color: "#888" }}>{token.balance?.toFixed(4)}</span>
                    <span style={{ color: "#e8eaf0" }}>${token.usd_value?.toLocaleString()}</span>
                    <span style={{ color: "#444", fontSize: "0.7rem" }}>Chain {token.chain}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={s.card}>
              <div style={{ color: "#555" }}>Loading portfolio... Make sure the backend is running at port 8000.</div>
            </div>
          )}
        </div>
      )}

      {/* SIGNALS TAB */}
      {tab === "signals" && (
        <div style={s.card}>
          <p style={s.cardTitle}>Live DeFi Signals — OKX Market Data</p>
          {signals.map((sig, i) => (
            <div key={i} style={s.row}>
              <span style={{ fontWeight: "700", minWidth: "100px" }}>{sig.pair}</span>
              <span style={{ color: "#e8eaf0" }}>${sig.last_price?.toLocaleString()}</span>
              <span style={{ color: sig.change_24h_pct > 0 ? "#00ff88" : "#ff4444", minWidth: "70px", textAlign: "right" }}>
                {sig.change_24h_pct > 0 ? "+" : ""}{sig.change_24h_pct?.toFixed(2)}%
              </span>
              <SignalBadge signal={sig.signal} />
              {sig.is_mock && <span style={{ color: "#333", fontSize: "0.65rem" }}>demo</span>}
            </div>
          ))}
          {signals.length === 0 && <div style={{ color: "#555" }}>No signals loaded. Start the backend server.</div>}
        </div>
      )}

      {/* ALERTS TAB */}
      {tab === "alerts" && (
        <div style={s.card}>
          <p style={s.cardTitle}>Active Alerts ({alerts.length})</p>
          {alerts.length === 0 && <div style={{ color: "#00ff88" }}>✅ No active alerts. Portfolio looks healthy.</div>}
          {alerts.map((alert, i) => (
            <div key={i} style={s.alertBox(alert.severity)}>
              <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                <span style={{ color: alert.severity === "HIGH" ? "#ff4444" : "#ffcc00", marginRight: "8px" }}>
                  [{alert.severity}]
                </span>
                {alert.type}
              </div>
              <div>{alert.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* SWAP TAB */}
      {tab === "swap" && (
        <div style={s.card}>
          <p style={s.cardTitle}>Natural Language Swap — OKX DEX Skill</p>
          <div style={{ color: "#555", fontSize: "0.75rem", marginBottom: "14px" }}>
            Try: "swap 10 USDT to ETH" · "swap 0.5 ETH to USDC if gas is below 20 gwei" · "buy 50 USDT worth of BNB"
          </div>
          <textarea
            style={{ ...s.swapInput, height: "80px", resize: "vertical" }}
            value={swapCommand}
            onChange={e => setSwapCommand(e.target.value)}
            placeholder="Type your swap command in plain English..."
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSwap())}
          />
          <button
            style={{ ...s.btn, marginTop: "10px", width: "100%", opacity: loading ? 0.6 : 1 }}
            onClick={handleSwap}
            disabled={loading}
          >
            {loading ? "PROCESSING..." : "⚡ EXECUTE SWAP"}
          </button>
          {swapResult && (
            <div style={s.resultBox}>
              {JSON.stringify(swapResult, null, 2)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
