/**
 * OKX DeFi Command Center — Enhanced Dashboard v2
 * Features: Auto-Pilot, Strategy Templates, What-If Simulator,
 * Oracle AI with Memory, Portfolio Report Export, MetaMask Connect
 */

import { useState, useEffect, useRef } from "react";
import axios from "axios";

const API = "http://localhost:8000";
const SESSION_ID = "oracle-" + Math.random().toString(36).slice(2, 8);

// ─── THEME ───────────────────────────────────────────────
const C = {
  bg: "#050508",
  surface: "#0a0a14",
  border: "#1a1a2e",
  primary: "#00d4ff",
  green: "#00ff88",
  yellow: "#ffcc00",
  orange: "#ff8800",
  red: "#ff2244",
  text: "#e8eaf0",
  muted: "#555",
  font: "'IBM Plex Mono', 'Courier New', monospace",
};

const risk_color = (level) => ({
  LOW: C.green, MEDIUM: C.yellow, HIGH: C.orange, CRITICAL: C.red
}[level] || C.muted);

// ─── SMALL COMPONENTS ─────────────────────────────────────

function RiskBadge({ level, score }) {
  return (
    <span style={{
      background: risk_color(level),
      color: "#000", padding: "2px 10px",
      borderRadius: "12px", fontWeight: "700",
      fontSize: "0.7rem", letterSpacing: "0.08em"
    }}>
      {level} {score !== undefined && `· ${score}/100`}
    </span>
  );
}

function SignalChip({ signal }) {
  const map = {
    BULLISH: [C.green, "▲ BULL"],
    MILDLY_BULLISH: ["#88ffcc", "▲ mild"],
    BEARISH: [C.red, "▼ BEAR"],
    MILDLY_BEARISH: ["#ff8866", "▼ mild"],
    NEUTRAL: [C.muted, "◆ FLAT"],
  };
  const [color, label] = map[signal] || [C.muted, signal];
  return <span style={{ color, fontWeight: "700", fontSize: "0.7rem" }}>{label}</span>;
}

function Card({ children, style }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: "10px", padding: "20px", ...style
    }}>
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return (
    <p style={{
      fontSize: "0.65rem", color: C.muted, textTransform: "uppercase",
      letterSpacing: "0.12em", margin: "0 0 14px"
    }}>
      {children}
    </p>
  );
}

function Btn({ children, onClick, color, disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: color || C.primary, color: "#000",
      border: "none", borderRadius: "6px", padding: "8px 16px",
      fontWeight: "700", fontFamily: C.font, fontSize: "0.75rem",
      cursor: disabled ? "not-allowed" : "pointer",
      letterSpacing: "0.05em", opacity: disabled ? 0.5 : 1,
      ...style
    }}>
      {children}
    </button>
  );
}

function Input({ value, onChange, placeholder, style, onKeyDown }) {
  return (
    <input value={value} onChange={onChange} placeholder={placeholder}
      onKeyDown={onKeyDown}
      style={{
        background: "#0d0d1a", border: `1px solid ${C.border}`,
        borderRadius: "6px", color: C.text, padding: "8px 12px",
        fontFamily: C.font, fontSize: "0.8rem", outline: "none", ...style
      }}
    />
  );
}

// ─── TABS ─────────────────────────────────────────────────

const TABS = [
  { id: "portfolio", label: "💼 Portfolio" },
  { id: "autopilot", label: "🤖 Auto-Pilot" },
  { id: "signals",   label: "📡 Signals" },
  { id: "alerts",    label: "🔔 Alerts" },
  { id: "simulate",  label: "🔮 What-If" },
  { id: "swap",      label: "⚡ Swap" },
  { id: "oracle",    label: "🧠 Oracle" },
];

// ─── MAIN APP ─────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("portfolio");
  const [wallet, setWallet] = useState("0x742d35Cc6634C0532925a3b8D4C9E9e5E9b8a123");
  const [inputWallet, setInputWallet] = useState("0x742d35Cc6634C0532925a3b8D4C9E9e5E9b8a123");
  const [portfolio, setPortfolio] = useState(null);
  const [signals, setSignals] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState(null);

  // Auto-Pilot state
  const [apRunning, setApRunning] = useState(false);
  const [apLogs, setApLogs] = useState([]);
  const [apStats, setApStats] = useState({});
  const [ruleInput, setRuleInput] = useState({ condition: "", action: "" });
  const [activeStrategy, setActiveStrategy] = useState(null);

  // What-If state
  const [simAction, setSimAction] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Swap state
  const [swapCmd, setSwapCmd] = useState("");
  const [swapResult, setSwapResult] = useState(null);

  // Oracle state
  const [oracleMsg, setOracleMsg] = useState("");
  const [oracleHistory, setOracleHistory] = useState([]);
  const [oracleLoading, setOracleLoading] = useState(false);
  const oracleEndRef = useRef(null);

  // ── Data fetching ──────────────────────────────────────

  const fetchAll = async (addr) => {
    setLoading(true);
    try {
      const [pRes, sRes, aRes] = await Promise.all([
        axios.get(`${API}/portfolio/${addr}`).catch(() => null),
        axios.get(`${API}/signals`).catch(() => null),
        axios.get(`${API}/alerts/${addr}`).catch(() => null),
      ]);
      if (pRes?.data) setPortfolio(pRes.data);
      if (sRes?.data) setSignals(sRes.data.signals || []);
      if (aRes?.data) setAlerts(aRes.data.alerts || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchApLogs = async () => {
    try {
      const res = await axios.get(`${API}/autopilot/logs`);
      setApLogs(res.data.logs || []);
      setApStats(res.data.stats || {});
      setApRunning(res.data.running || false);
    } catch { }
  };

  useEffect(() => { fetchAll(wallet); }, [wallet]);
  useEffect(() => {
    if (tab === "autopilot") {
      fetchApLogs();
      const iv = setInterval(fetchApLogs, 10000);
      return () => clearInterval(iv);
    }
  }, [tab]);
  useEffect(() => {
    oracleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [oracleHistory]);

  // ── MetaMask ──────────────────────────────────────────

  const connectWallet = async () => {
    if (!window.ethereum) return alert("MetaMask not found. Please install it.");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setConnectedAccount(accounts[0]);
      setWallet(accounts[0]);
      setInputWallet(accounts[0]);
    } catch {
      alert("MetaMask connection rejected.");
    }
  };

  const disconnectWallet = () => {
    setConnectedAccount(null);
    setWallet("0x742d35Cc6634C0532925a3b8D4C9E9e5E9b8a123");
    setInputWallet("0x742d35Cc6634C0532925a3b8D4C9E9e5E9b8a123");
  };

  // Check if already connected on mount
  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then(accounts => {
      if (accounts.length > 0) {
        setConnectedAccount(accounts[0]);
        setWallet(accounts[0]);
        setInputWallet(accounts[0]);
      }
    }).catch(() => {});
    const onAccounts = (accounts) => {
      if (accounts.length === 0) disconnectWallet();
      else { setConnectedAccount(accounts[0]); setWallet(accounts[0]); }
    };
    window.ethereum.on("accountsChanged", onAccounts);
    return () => window.ethereum.removeListener("accountsChanged", onAccounts);
  }, []); // eslint-disable-line

  // ── Auto-Pilot ────────────────────────────────────────

  const startAutoPilot = async () => {
    try {
      await axios.post(`${API}/autopilot/start`, { wallet_address: wallet });
      setApRunning(true);
      setTimeout(fetchApLogs, 2000);
    } catch { alert("Failed to start Auto-Pilot"); }
  };

  const stopAutoPilot = async () => {
    try {
      await axios.post(`${API}/autopilot/stop`);
      setApRunning(false);
      setTimeout(fetchApLogs, 1000);
    } catch { }
  };

  const activateStrategy = async (name) => {
    try {
      await axios.post(`${API}/strategies/${name}/activate`, { wallet_address: wallet });
      setActiveStrategy(name);
      setTimeout(fetchApLogs, 1000);
    } catch { alert("Failed to activate strategy"); }
  };

  const addCustomRule = async () => {
    if (!ruleInput.condition || !ruleInput.action) return;
    try {
      await axios.post(`${API}/autopilot/rule`, ruleInput);
      setRuleInput({ condition: "", action: "" });
      setTimeout(fetchApLogs, 500);
    } catch { }
  };

  // ── What-If ──────────────────────────────────────────

  const runSimulation = async () => {
    if (!simAction.trim()) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await axios.post(`${API}/simulate`, {
        wallet_address: wallet,
        action: simAction,
      });
      setSimResult(res.data);
    } catch {
      setSimResult({ verdict: "NEUTRAL", recommendation: "Backend error — check server", projected_risk_level: "UNKNOWN", key_risks: [], key_benefits: [] });
    } finally {
      setSimLoading(false);
    }
  };

  // ── Swap ─────────────────────────────────────────────

  const executeSwap = async () => {
    if (!swapCmd.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/swap/nl`, { command: swapCmd, wallet_address: wallet });
      setSwapResult(res.data);
    } catch {
      setSwapResult({ status: "error", message: "Backend unreachable" });
    } finally {
      setLoading(false);
    }
  };

  // ── Oracle ────────────────────────────────────────────

  const sendOracle = async () => {
    if (!oracleMsg.trim()) return;
    const userMsg = oracleMsg;
    setOracleMsg("");
    setOracleHistory(h => [...h, { role: "user", content: userMsg }]);
    setOracleLoading(true);
    try {
      const res = await axios.post(`${API}/ai/chat`, {
        message: userMsg,
        wallet_address: wallet,
        session_id: SESSION_ID
      });
      setOracleHistory(h => [...h, { role: "assistant", content: res.data.reply }]);
    } catch {
      setOracleHistory(h => [...h, { role: "assistant", content: "Oracle offline — check backend." }]);
    } finally {
      setOracleLoading(false);
    }
  };

  // ── Styles ────────────────────────────────────────────

  const s = {
    app: { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: C.font, padding: "20px" },
    header: { borderBottom: `1px solid ${C.border}`, paddingBottom: "14px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" },
    title: { fontSize: "1.3rem", fontWeight: "700", color: C.primary, margin: 0 },
    sub: { color: C.muted, fontSize: "0.7rem", margin: "2px 0 0" },
    tabBar: { display: "flex", gap: "4px", marginBottom: "20px", flexWrap: "wrap" },
    tab: (active) => ({ background: active ? C.primary : C.surface, color: active ? "#000" : C.muted, border: `1px solid ${active ? C.primary : C.border}`, borderRadius: "6px", padding: "6px 14px", fontFamily: C.font, fontSize: "0.7rem", fontWeight: active ? "700" : "400", cursor: "pointer" }),
    grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "16px" },
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid #111` },
    statBig: { fontSize: "1.8rem", fontWeight: "700", color: C.primary, margin: "4px 0" },
    alertBox: (sev) => ({ background: sev === "HIGH" || sev === "CRITICAL" ? "#1a0505" : "#0d0d00", border: `1px solid ${sev === "HIGH" || sev === "CRITICAL" ? "#441111" : "#333300"}`, borderRadius: "6px", padding: "10px 14px", marginBottom: "8px", fontSize: "0.8rem" }),
    logLine: (level) => ({ padding: "4px 0", borderBottom: `1px solid #0d0d0d`, fontSize: "0.72rem", color: level === "ERROR" ? C.red : level === "ALERT" || level === "ACTION" ? C.orange : level === "SIGNAL" ? C.primary : level === "START" || level === "STOP" ? C.green : C.muted }),
    stratCard: (active, color) => ({ background: active ? "#0a1a0a" : C.surface, border: `1px solid ${active ? color : C.border}`, borderRadius: "8px", padding: "14px", marginBottom: "8px", cursor: "pointer", transition: "all 0.2s" }),
    simResult: (verdict) => ({ background: verdict === "GOOD_MOVE" ? "#051a05" : verdict === "BAD_MOVE" ? "#1a0505" : "#0d0d0d", border: `1px solid ${verdict === "GOOD_MOVE" ? "#1a4a1a" : verdict === "BAD_MOVE" ? "#4a1a1a" : C.border}`, borderRadius: "8px", padding: "16px", marginTop: "14px" }),
    chatBubble: (role) => ({ background: role === "user" ? "#0d0d2a" : "#0a1a0a", border: `1px solid ${role === "user" ? "#1a1a4a" : "#1a3a1a"}`, borderRadius: "8px", padding: "10px 14px", marginBottom: "8px", fontSize: "0.82rem", maxWidth: "85%", alignSelf: role === "user" ? "flex-end" : "flex-start" }),
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div style={s.app}>

      {/* HEADER */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>⬡ OKX DeFi Command Center</h1>
          <p style={s.sub}>X-Agent · OKX Agentic Wallet · Auto-Pilot · Oracle AI · Build X-Agent Hackathon 2026</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {!connectedAccount ? (
            <Btn onClick={connectWallet} color="#f6851b">🦊 Connect MetaMask</Btn>
          ) : (
            <>
              <span style={{ color: C.green, fontSize: "0.72rem" }}>
                ● {connectedAccount.slice(0, 6)}...{connectedAccount.slice(-4)}
              </span>
              <Btn onClick={disconnectWallet} color={C.surface} style={{ color: C.muted, border: `1px solid ${C.border}` }}>Disconnect</Btn>
            </>
          )}
          <Input value={inputWallet} onChange={e => setInputWallet(e.target.value)} placeholder="Wallet address..." style={{ width: "260px" }} />
          <Btn onClick={() => setWallet(inputWallet)}>LOAD</Btn>
          <Btn onClick={() => fetchAll(wallet)} color={C.surface} style={{ color: C.primary, border: `1px solid ${C.border}` }}>↻</Btn>
          <Btn onClick={() => window.open(`${API}/report/${wallet}`, "_blank")} color="#1a1a3e" style={{ color: C.yellow, border: `1px solid #2a2a4e` }}>📄 EXPORT PDF</Btn>
        </div>
      </div>

      {/* TABS */}
      <div style={s.tabBar}>
        {TABS.map(t => (
          <button key={t.id} style={s.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
        {loading && <span style={{ color: C.muted, fontSize: "0.7rem", alignSelf: "center" }}>loading...</span>}
        {apRunning && <span style={{ color: C.green, fontSize: "0.7rem", alignSelf: "center" }}>● AUTO-PILOT ACTIVE</span>}
      </div>

      {/* ── PORTFOLIO TAB ── */}
      {tab === "portfolio" && (
        <div>
          {!portfolio && <div style={{ color: C.muted, padding: "20px 0" }}>Loading portfolio...</div>}
          {portfolio && (
            <>
              <div style={s.grid2}>
                <Card>
                  <CardTitle>Total Portfolio Value</CardTitle>
                  <div style={s.statBig}>${portfolio.portfolio?.total_usd?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "—"}</div>
                  <div style={{ color: C.muted, fontSize: "0.72rem" }}>{portfolio.portfolio?.token_count || 0} assets</div>
                </Card>
                <Card>
                  <CardTitle>Risk Score</CardTitle>
                  <div style={{ ...s.statBig, color: risk_color(portfolio.risk?.level) }}>
                    {portfolio.risk?.score ?? "—"} / 100
                  </div>
                  <RiskBadge level={portfolio.risk?.level || "UNKNOWN"} />
                  <div style={{ color: C.muted, fontSize: "0.72rem", marginTop: "6px" }}>{portfolio.risk?.summary}</div>
                </Card>
                <Card>
                  <CardTitle>Auto-Pilot Status</CardTitle>
                  <div style={{ ...s.statBig, fontSize: "1.2rem", color: apRunning ? C.green : C.muted }}>
                    {apRunning ? "● RUNNING" : "○ STOPPED"}
                  </div>
                  <div style={{ color: C.muted, fontSize: "0.72rem" }}>{apStats.ticks || 0} ticks · {apStats.swaps_executed || 0} swaps executed</div>
                </Card>
              </div>
              <Card>
                <CardTitle>Token Holdings</CardTitle>
                {(portfolio.portfolio?.tokens || []).map((t, i) => (
                  <div key={i} style={s.row}>
                    <span style={{ fontWeight: "700", color: C.primary, minWidth: "60px" }}>{t.symbol}</span>
                    <span style={{ color: C.muted, fontSize: "0.8rem" }}>{t.balance?.toFixed(4)}</span>
                    <span>${t.usd_value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span style={{ color: C.muted, fontSize: "0.7rem" }}>
                      {((t.usd_value / (portfolio.portfolio?.total_usd || 1)) * 100).toFixed(1)}%
                    </span>
                    <span style={{ color: C.muted, fontSize: "0.7rem" }}>Chain {t.chain}</span>
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── AUTO-PILOT TAB ── */}
      {tab === "autopilot" && (
        <div>
          <div style={s.grid2}>
            <Card>
              <CardTitle>Agent Control</CardTitle>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <Btn onClick={startAutoPilot} disabled={apRunning} color={C.green} style={{ color: "#000" }}>▶ START</Btn>
                <Btn onClick={stopAutoPilot} disabled={!apRunning} color={C.red} style={{ color: "#fff" }}>■ STOP</Btn>
              </div>
              <div style={{ fontSize: "0.75rem", color: C.muted, marginBottom: "12px" }}>
                Status: <span style={{ color: apRunning ? C.green : C.muted }}>{apRunning ? "● RUNNING (60s cycle)" : "○ STOPPED"}</span>
              </div>
              <div style={{ fontSize: "0.72rem", color: C.muted }}>
                Ticks: {apStats.ticks || 0} · Swaps: {apStats.swaps_executed || 0} · Alerts: {apStats.alerts_triggered || 0}
              </div>
            </Card>

            <Card>
              <CardTitle>Strategy Templates</CardTitle>
              {[
                { id: "conservative", name: "🛡️ Conservative", desc: "Hold stablecoins, exit on HIGH risk", color: C.green },
                { id: "momentum",     name: "⚡ Momentum",     desc: "Buy bullish signals, sell bearish", color: C.primary },
                { id: "yield",        name: "💰 Yield Max",    desc: "Rotate into top performers",         color: C.orange },
              ].map(st => (
                <div key={st.id} style={s.stratCard(activeStrategy === st.id, st.color)}
                  onClick={() => activateStrategy(st.id)}>
                  <div style={{ fontWeight: "700", fontSize: "0.82rem", color: activeStrategy === st.id ? st.color : C.text }}>
                    {st.name} {activeStrategy === st.id && "✓"}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: C.muted, marginTop: "2px" }}>{st.desc}</div>
                </div>
              ))}
            </Card>
          </div>

          <Card style={{ marginBottom: "16px" }}>
            <CardTitle>Custom Rule Builder</CardTitle>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              <Input value={ruleInput.condition}
                onChange={e => setRuleInput(r => ({ ...r, condition: e.target.value }))}
                placeholder="Condition (e.g. ETH bullish > 5%)" style={{ flex: 1, minWidth: "200px" }} />
              <Input value={ruleInput.action}
                onChange={e => setRuleInput(r => ({ ...r, action: e.target.value }))}
                placeholder="Action (e.g. swap 50 USDT to ETH)" style={{ flex: 1, minWidth: "200px" }} />
              <Btn onClick={addCustomRule}>ADD RULE</Btn>
            </div>
            <div style={{ fontSize: "0.7rem", color: C.muted }}>
              {apLogs.filter(l => l.level === "RULE").length} rule(s) triggered so far
            </div>
          </Card>

          <Card>
            <CardTitle>Live Agent Log</CardTitle>
            <div style={{ height: "300px", overflowY: "auto", padding: "4px 0" }}>
              {apLogs.length === 0 && (
                <div style={{ color: C.muted, fontSize: "0.8rem" }}>Start Auto-Pilot to see live logs here.</div>
              )}
              {[...apLogs].reverse().map((log, i) => (
                <div key={i} style={s.logLine(log.level)}>
                  <span style={{ color: "#333", marginRight: "10px" }}>{log.time?.slice(11, 19)}</span>
                  <span style={{ color: C.muted, marginRight: "8px" }}>[{log.level}]</span>
                  {log.msg}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── SIGNALS TAB ── */}
      {tab === "signals" && (
        <Card>
          <CardTitle>Live DeFi Signals — OKX Market Data</CardTitle>
          {signals.length === 0 && <div style={{ color: C.muted }}>No signals. Start the backend server.</div>}
          {signals.map((sig, i) => (
            <div key={i} style={s.row}>
              <span style={{ fontWeight: "700", minWidth: "110px" }}>{sig.pair}</span>
              <span>${sig.last_price?.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
              <span style={{ color: sig.change_24h_pct > 0 ? C.green : C.red, minWidth: "70px", textAlign: "right" }}>
                {sig.change_24h_pct > 0 ? "+" : ""}{sig.change_24h_pct?.toFixed(2)}%
              </span>
              <SignalChip signal={sig.signal} />
            </div>
          ))}
        </Card>
      )}

      {/* ── ALERTS TAB ── */}
      {tab === "alerts" && (
        <Card>
          <CardTitle>Active Alerts ({alerts.length})</CardTitle>
          {alerts.length === 0 && <div style={{ color: C.green }}>✅ No alerts. Portfolio looks healthy.</div>}
          {alerts.map((alert, i) => (
            <div key={i} style={s.alertBox(alert.severity)}>
              <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                <span style={{ color: alert.severity === "HIGH" || alert.severity === "CRITICAL" ? C.red : C.yellow, marginRight: "8px" }}>
                  [{alert.severity}]
                </span>
                {alert.type}
              </div>
              <div style={{ fontSize: "0.82rem" }}>{alert.message}</div>
            </div>
          ))}
        </Card>
      )}

      {/* ── WHAT-IF SIMULATOR TAB ── */}
      {tab === "simulate" && (
        <div>
          <Card style={{ marginBottom: "16px" }}>
            <CardTitle>What-If Portfolio Simulator</CardTitle>
            <div style={{ color: C.muted, fontSize: "0.75rem", marginBottom: "14px" }}>
              Describe a portfolio action — Oracle AI simulates the outcome before you execute.
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Input value={simAction} onChange={e => setSimAction(e.target.value)}
                placeholder="e.g. move 50% of portfolio to ETH"
                style={{ flex: 1, minWidth: "280px" }}
                onKeyDown={e => e.key === "Enter" && runSimulation()} />
              <Btn onClick={runSimulation} disabled={simLoading}>
                {simLoading ? "SIMULATING..." : "🔮 SIMULATE"}
              </Btn>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
              {["move 50% to ETH", "convert all to USDT", "buy 30% ETH 30% BNB 40% USDT", "go all-in on ETH"].map(ex => (
                <span key={ex} onClick={() => setSimAction(ex)}
                  style={{ background: "#0d0d1a", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "4px 10px", fontSize: "0.7rem", color: C.muted, cursor: "pointer" }}>
                  {ex}
                </span>
              ))}
            </div>
          </Card>

          {simResult && (
            <Card style={s.simResult(simResult.verdict)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontWeight: "700", fontSize: "1rem", color: simResult.verdict === "GOOD_MOVE" ? C.green : simResult.verdict === "BAD_MOVE" ? C.red : C.yellow }}>
                  {simResult.verdict === "GOOD_MOVE" ? "✅ GOOD MOVE" : simResult.verdict === "BAD_MOVE" ? "❌ BAD MOVE" : "◆ NEUTRAL"}
                </span>
                <RiskBadge level={simResult.projected_risk_level} score={simResult.projected_risk_score} />
                <span style={{ color: simResult.projected_value_change_pct > 0 ? C.green : C.red, fontWeight: "700" }}>
                  {simResult.projected_value_change_pct > 0 ? "+" : ""}{simResult.projected_value_change_pct?.toFixed(1)}% projected
                </span>
              </div>
              <div style={{ fontSize: "0.85rem", marginBottom: "14px", color: C.text }}>{simResult.recommendation}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.65rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Key Risks</div>
                  {(simResult.key_risks || []).map((r, i) => <div key={i} style={{ fontSize: "0.78rem", color: C.red, marginBottom: "3px" }}>⚠ {r}</div>)}
                </div>
                <div>
                  <div style={{ fontSize: "0.65rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Key Benefits</div>
                  {(simResult.key_benefits || []).map((b, i) => <div key={i} style={{ fontSize: "0.78rem", color: C.green, marginBottom: "3px" }}>✓ {b}</div>)}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── SWAP TAB ── */}
      {tab === "swap" && (
        <Card>
          <CardTitle>Natural Language Swap — OKX DEX Skill</CardTitle>
          <div style={{ color: C.muted, fontSize: "0.75rem", marginBottom: "14px" }}>
            Examples: "swap 10 USDT to ETH" · "swap 0.5 ETH to USDC if gas below 20 gwei" · "buy 100 USDT worth of BNB"
          </div>
          <textarea value={swapCmd} onChange={e => setSwapCmd(e.target.value)}
            placeholder="Type your swap command in plain English..."
            style={{ background: "#0d0d1a", border: `1px solid ${C.border}`, borderRadius: "6px", color: C.text, padding: "12px", fontFamily: C.font, fontSize: "0.85rem", width: "100%", height: "80px", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), executeSwap())}
          />
          <Btn onClick={executeSwap} disabled={loading} style={{ marginTop: "10px", width: "100%" }}>
            {loading ? "PROCESSING..." : "⚡ EXECUTE SWAP"}
          </Btn>
          {swapResult && (
            <pre style={{ background: "#080810", border: `1px solid #1a2a1a`, borderRadius: "8px", padding: "14px", marginTop: "12px", fontSize: "0.78rem", color: "#88ffaa", whiteSpace: "pre-wrap", overflowX: "auto" }}>
              {JSON.stringify(swapResult, null, 2)}
            </pre>
          )}
        </Card>
      )}

      {/* ── ORACLE AI TAB ── */}
      {tab === "oracle" && (
        <div>
          <Card style={{ marginBottom: "14px" }}>
            <CardTitle>Oracle AI — Memory-Enabled DeFi Advisor</CardTitle>
            <div style={{ display: "flex", flexDirection: "column", height: "360px", overflowY: "auto", marginBottom: "12px", gap: "6px" }}>
              {oracleHistory.length === 0 && (
                <div style={{ color: C.muted, fontSize: "0.8rem", padding: "10px 0" }}>
                  Oracle remembers this session. Ask anything about your portfolio, risk, signals, or swaps.
                </div>
              )}
              {oracleHistory.map((msg, i) => (
                <div key={i} style={s.chatBubble(msg.role)}>
                  <div style={{ fontSize: "0.65rem", color: C.muted, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {msg.role === "user" ? "YOU" : "⬡ ORACLE"}
                  </div>
                  <div style={{ lineHeight: "1.5" }}>{msg.content}</div>
                </div>
              ))}
              {oracleLoading && (
                <div style={{ ...s.chatBubble("assistant"), color: C.muted }}>
                  <div style={{ fontSize: "0.65rem", color: C.muted, marginBottom: "4px" }}>⬡ ORACLE</div>
                  thinking...
                </div>
              )}
              <div ref={oracleEndRef} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Input value={oracleMsg} onChange={e => setOracleMsg(e.target.value)}
                placeholder="Ask Oracle anything about your portfolio..."
                style={{ flex: 1 }}
                onKeyDown={e => e.key === "Enter" && sendOracle()} />
              <Btn onClick={sendOracle} disabled={oracleLoading}>SEND</Btn>
              <Btn onClick={() => setOracleHistory([])} color={C.surface} style={{ color: C.muted, border: `1px solid ${C.border}` }}>CLEAR</Btn>
            </div>
          </Card>

          <Card>
            <CardTitle>Quick Prompts</CardTitle>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                "What's my biggest risk right now?",
                "Should I buy more ETH based on signals?",
                "Is my portfolio diversified enough?",
                "What swap should I make today?",
                "Summarize my portfolio health",
                "Is now a good time to rebalance?",
              ].map(p => (
                <span key={p} onClick={() => setOracleMsg(p)}
                  style={{ background: "#0d0d1a", border: `1px solid ${C.border}`, borderRadius: "4px", padding: "6px 12px", fontSize: "0.75rem", color: C.muted, cursor: "pointer" }}>
                  {p}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
