/**
 * OKX DeFi Command Center — Premium Dashboard
 * Design: Glassmorphism · Bloomberg Terminal · OKX Pro aesthetic
 */

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const API = "http://localhost:8000";
const MOCK_WALLET = "0x742d35Cc6634C0532925a3b8D4C9E9e5E9b8a123";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#06070f",
  surface:   "#0b0d1a",
  surfaceUp: "#10122080",
  border:    "#1c1f3a",
  borderHi:  "#2a2f5a",
  blue:      "#3b82f6",
  cyan:      "#06d6ff",
  green:     "#10f58c",
  red:       "#f5365c",
  amber:     "#f59e0b",
  purple:    "#a78bfa",
  textPri:   "#e8edf8",
  textSec:   "#64748b",
  textMuted: "#2a3050",
};

const PIE_COLORS = ["#3b82f6", "#10f58c", "#f59e0b", "#a78bfa", "#06d6ff", "#f5365c"];

// ─── Global CSS injection ───────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${C.bg};
    color: ${C.textPri};
    font-family: 'Inter', system-ui, sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }

  /* Grid background */
  .grid-bg {
    background-image:
      linear-gradient(${C.border}22 1px, transparent 1px),
      linear-gradient(90deg, ${C.border}22 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* Glassmorphism card */
  .glass {
    background: ${C.surfaceUp};
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid ${C.border};
    border-radius: 16px;
  }

  .glass-hi {
    background: linear-gradient(135deg, #10122099 0%, #0b0d1a88 100%);
    backdrop-filter: blur(32px);
    border: 1px solid ${C.borderHi};
    border-radius: 16px;
  }

  /* Gradient border trick */
  .grad-border {
    position: relative;
    border-radius: 16px;
    background: ${C.surface};
  }
  .grad-border::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(135deg, ${C.blue}44, ${C.cyan}22, ${C.purple}33);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  /* Glow text */
  .glow-blue  { text-shadow: 0 0 20px ${C.blue}88; }
  .glow-green { text-shadow: 0 0 20px ${C.green}88; }
  .glow-red   { text-shadow: 0 0 20px ${C.red}88; }
  .glow-cyan  { text-shadow: 0 0 20px ${C.cyan}88; }

  /* Gradient text */
  .grad-text {
    background: linear-gradient(90deg, ${C.blue}, ${C.cyan});
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Pulse dot */
  @keyframes pulse-ring {
    0%   { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.2); opacity: 0; }
  }
  .pulse-dot {
    position: relative;
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
  }
  .pulse-dot::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: inherit;
    animation: pulse-ring 1.6s ease-out infinite;
  }

  /* Shimmer skeleton */
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .shimmer {
    background: linear-gradient(90deg, ${C.border} 25%, ${C.borderHi} 50%, ${C.border} 75%);
    background-size: 800px 100%;
    animation: shimmer 1.6s infinite;
    border-radius: 6px;
  }

  /* Button glow */
  .btn-primary {
    background: linear-gradient(135deg, ${C.blue}, ${C.cyan}cc);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 0 0 0 ${C.blue}00;
  }
  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px ${C.blue}44, 0 0 0 1px ${C.cyan}44;
  }
  .btn-primary:active { transform: translateY(0); }

  .btn-ghost {
    background: ${C.surfaceUp};
    border: 1px solid ${C.border};
    border-radius: 10px;
    color: ${C.textSec};
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-ghost:hover {
    border-color: ${C.borderHi};
    color: ${C.textPri};
    background: ${C.border}66;
  }

  /* Tab active glow */
  .tab-active {
    background: linear-gradient(135deg, ${C.blue}22, ${C.cyan}11);
    border: 1px solid ${C.blue}66 !important;
    color: ${C.cyan} !important;
    box-shadow: 0 0 12px ${C.blue}22;
  }

  /* Number font */
  .num { font-family: 'JetBrains Mono', monospace; }

  /* Row hover */
  .data-row {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-radius: 10px;
    transition: background 0.15s;
    cursor: default;
  }
  .data-row:hover { background: ${C.border}44; }

  /* Signal bar left accent */
  .signal-bullish  { border-left: 3px solid ${C.green}; }
  .signal-bearish  { border-left: 3px solid ${C.red}; }
  .signal-neutral  { border-left: 3px solid ${C.textMuted}; }
  .signal-mild-bull { border-left: 3px solid ${C.cyan}; }
  .signal-mild-bear { border-left: 3px solid ${C.amber}; }

  /* Alert severity */
  .alert-high {
    background: ${C.red}0a;
    border: 1px solid ${C.red}33;
    border-radius: 10px;
  }
  .alert-medium {
    background: ${C.amber}0a;
    border: 1px solid ${C.amber}33;
    border-radius: 10px;
  }

  /* Input */
  .input-field {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 10px;
    color: ${C.textPri};
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .input-field:focus {
    border-color: ${C.blue}88;
    box-shadow: 0 0 0 3px ${C.blue}11;
  }
  .input-field::placeholder { color: ${C.textMuted}; }

  /* Swap textarea */
  .swap-area {
    background: ${C.surface};
    border: 1px solid ${C.border};
    border-radius: 12px;
    color: ${C.textPri};
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    outline: none;
    resize: vertical;
    transition: border-color 0.2s, box-shadow 0.2s;
    line-height: 1.6;
    width: 100%;
    padding: 14px 16px;
  }
  .swap-area:focus {
    border-color: ${C.blue}88;
    box-shadow: 0 0 0 3px ${C.blue}11;
  }

  /* Chain badge */
  .chain-badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 5px;
    letter-spacing: 0.05em;
  }

  /* Fade-in */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.35s ease both; }

  /* Gradient progress bar */
  .progress-track {
    background: ${C.border};
    border-radius: 99px;
    overflow: hidden;
    height: 4px;
    width: 100%;
  }
  .progress-fill {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, ${C.blue}, ${C.cyan});
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
  }

  /* Tooltip override */
  .recharts-tooltip-wrapper .recharts-default-tooltip {
    background: ${C.surface} !important;
    border: 1px solid ${C.border} !important;
    border-radius: 10px !important;
    color: ${C.textPri} !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.75rem !important;
  }
`;

// ─── Helper components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon, glow, badge }) {
  return (
    <div className="grad-border fade-up" style={{ padding: "24px", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          {label}
        </span>
        {icon && <span style={{ fontSize: "1.1rem", opacity: 0.7 }}>{icon}</span>}
      </div>
      <div className={`num ${glow || ""}`}
        style={{ fontSize: "2.1rem", fontWeight: 700, color: color || C.textPri, lineHeight: 1, marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {badge && badge}
        {sub && <span style={{ fontSize: "0.75rem", color: C.textSec }}>{sub}</span>}
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const map = {
    LOW:      { bg: C.green + "22",  border: C.green + "55",  text: C.green,  label: "LOW RISK" },
    MEDIUM:   { bg: C.amber + "22",  border: C.amber + "55",  text: C.amber,  label: "MEDIUM" },
    HIGH:     { bg: C.red + "22",    border: C.red + "55",    text: C.red,    label: "HIGH RISK" },
    CRITICAL: { bg: C.red + "33",    border: C.red + "88",    text: C.red,    label: "CRITICAL" },
    UNKNOWN:  { bg: C.border + "88", border: C.borderHi,      text: C.textSec, label: "UNKNOWN" },
  };
  const d = map[level] || map.UNKNOWN;
  return (
    <span style={{
      background: d.bg, border: `1px solid ${d.border}`, color: d.text,
      padding: "3px 10px", borderRadius: "6px", fontSize: "0.68rem",
      fontWeight: 700, letterSpacing: "0.1em", fontFamily: "'JetBrains Mono', monospace"
    }}>
      {d.label}
    </span>
  );
}

function SignalPill({ signal }) {
  const map = {
    BULLISH:       { color: C.green,  bg: C.green  + "18", dot: C.green,  label: "BULLISH" },
    MILDLY_BULLISH:{ color: C.cyan,   bg: C.cyan   + "18", dot: C.cyan,   label: "MILD BULL" },
    BEARISH:       { color: C.red,    bg: C.red    + "18", dot: C.red,    label: "BEARISH" },
    MILDLY_BEARISH:{ color: C.amber,  bg: C.amber  + "18", dot: C.amber,  label: "MILD BEAR" },
    NEUTRAL:       { color: C.textSec, bg: C.border + "88", dot: C.textSec, label: "NEUTRAL" },
  };
  const d = map[signal] || map.NEUTRAL;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: d.bg, color: d.color, padding: "3px 9px", borderRadius: "6px",
      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em",
      fontFamily: "'JetBrains Mono', monospace"
    }}>
      <span className="pulse-dot" style={{ background: d.dot, width: 6, height: 6 }} />
      {d.label}
    </span>
  );
}

function ChainBadge({ chainId }) {
  const map = {
    "1":   { label: "ETH",  bg: "#627EEA22", color: "#627EEA" },
    "56":  { label: "BNB",  bg: "#F3BA2F22", color: "#F3BA2F" },
    "137": { label: "MATIC", bg: "#8247E522", color: "#8247E5" },
  };
  const d = map[chainId] || { label: `C${chainId}`, bg: C.border, color: C.textSec };
  return (
    <span className="chain-badge" style={{ background: d.bg, color: d.color }}>
      {d.label}
    </span>
  );
}

function TokenIcon({ symbol }) {
  const colors = {
    ETH: ["#627EEA", "#8FA5EE"], USDT: ["#26A17B", "#4FD1A8"],
    MATIC: ["#8247E5", "#A87AEE"], BNB: ["#F3BA2F", "#F8D467"],
    BTC: ["#F7931A", "#FAB04D"], SOL: ["#9945FF", "#C481FF"],
    ARB: ["#12AAFF", "#5EC8FF"], OP: ["#FF0420", "#FF5577"],
    LINK: ["#2A5ADA", "#5080EA"], USDC: ["#2775CA", "#5BA0E8"],
  };
  const [c1, c2] = colors[symbol?.toUpperCase()] || ["#3b82f6", "#06d6ff"];
  const char = symbol?.charAt(0)?.toUpperCase() || "?";
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: `linear-gradient(135deg, ${c1}, ${c2})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: "0.8rem", color: "#fff",
      flexShrink: 0, boxShadow: `0 4px 12px ${c1}44`
    }}>
      {char}
    </div>
  );
}

function LiveDot() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span className="pulse-dot" style={{ background: C.green }} />
      <span style={{ fontSize: "0.65rem", color: C.green, fontWeight: 600, letterSpacing: "0.1em" }}>LIVE</span>
    </div>
  );
}

function SectionHeader({ title, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.textSec, textTransform: "uppercase", letterSpacing: "0.14em" }}>
        {title}
      </span>
      {right}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: `linear-gradient(90deg, ${C.border}, transparent)`, margin: "4px 0" }} />;
}

// Mock sparkline data
function makeSparkline(base, pct) {
  const pts = [];
  let v = base * (1 - pct / 200);
  for (let i = 0; i < 12; i++) {
    v += (Math.random() - 0.48) * base * 0.015;
    pts.push({ v: parseFloat(v.toFixed(2)) });
  }
  pts[pts.length - 1] = { v: base };
  return pts;
}

function Sparkline({ data, color, positive }) {
  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color.replace("#", "")})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────
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
  const [backendOk, setBackendOk] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

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
      setBackendOk(true);
      setLastRefresh(new Date());
    } catch {
      setBackendOk(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(wallet); }, [wallet]);

  // Auto-refresh signals every 30s
  useEffect(() => {
    const id = setInterval(() => {
      axios.get(`${API}/signals`).then(r => setSignals(r.data.signals || [])).catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, []);

  const handleSwap = async () => {
    if (!swapCommand.trim()) return;
    setLoading(true);
    setSwapResult(null);
    try {
      const res = await axios.post(`${API}/swap/nl`, { command: swapCommand, wallet_address: wallet });
      setSwapResult(res.data);
    } catch {
      setSwapResult({ status: "error", message: "Backend unreachable." });
    } finally {
      setLoading(false);
    }
  };

  // Pie data from portfolio
  const pieData = portfolio?.portfolio?.tokens?.map(t => ({
    name: t.symbol, value: t.usd_value
  })) || [];

  const totalUsd = portfolio?.portfolio?.total_usd || 0;
  const riskScore = portfolio?.risk?.score ?? null;
  const riskLevel = portfolio?.risk?.level || "UNKNOWN";

  const tabs = [
    { id: "portfolio", label: "Portfolio",  icon: "◈" },
    { id: "signals",   label: "Signals",    icon: "◉" },
    { id: "alerts",    label: "Alerts",     icon: "◬", count: alerts.length },
    { id: "swap",      label: "AI Swap",    icon: "⟁" },
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div className="grid-bg" style={{ minHeight: "100vh", padding: "0" }}>

        {/* ── Top nav bar ─────────────────────────────────────────── */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          background: `${C.bg}e8`,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 60
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", fontWeight: 900, color: "#fff",
              boxShadow: `0 4px 16px ${C.blue}55`
            }}>⬡</div>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                <span className="grad-text">OKX DeFi</span>
                <span style={{ color: C.textPri }}> Command Center</span>
              </div>
              <div style={{ fontSize: "0.62rem", color: C.textSec, letterSpacing: "0.08em", fontWeight: 500 }}>
                POWERED BY X-AGENT · OKX AGENTIC WALLET
              </div>
            </div>
          </div>

          {/* Wallet input */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {backendOk !== null && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
                <span className="pulse-dot" style={{
                  background: backendOk ? C.green : C.red,
                  width: 7, height: 7
                }} />
                <span style={{ fontSize: "0.68rem", color: backendOk ? C.green : C.red, fontWeight: 600 }}>
                  {backendOk ? "CONNECTED" : "OFFLINE"}
                </span>
              </div>
            )}
            <input
              className="input-field"
              style={{ width: 300, padding: "8px 14px" }}
              value={inputWallet}
              onChange={e => setInputWallet(e.target.value)}
              placeholder="0x wallet address..."
            />
            <button className="btn-primary" style={{ padding: "9px 18px" }}
              onClick={() => setWallet(inputWallet)}>
              LOAD
            </button>
            <button className="btn-ghost" style={{ padding: "9px 12px" }}
              onClick={() => fetchAll(wallet)} title="Refresh">
              {loading ? "⟳" : "↻"}
            </button>
          </div>
        </nav>

        {/* ── Main layout ─────────────────────────────────────────── */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px" }}>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
            {tabs.map(t => (
              <button key={t.id}
                className={`btn-ghost ${tab === t.id ? "tab-active" : ""}`}
                style={{ padding: "9px 20px", display: "flex", alignItems: "center", gap: 7, borderRadius: 10, fontSize: "0.8rem", fontWeight: 600 }}
                onClick={() => setTab(t.id)}>
                <span style={{ fontSize: "0.95rem" }}>{t.icon}</span>
                {t.label}
                {t.count > 0 && (
                  <span style={{
                    background: C.red + "33", color: C.red,
                    border: `1px solid ${C.red}44`,
                    borderRadius: "99px", padding: "0px 6px", fontSize: "0.65rem", fontWeight: 800
                  }}>{t.count}</span>
                )}
              </button>
            ))}
            {lastRefresh && (
              <span style={{ marginLeft: "auto", fontSize: "0.68rem", color: C.textMuted, alignSelf: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* ══ PORTFOLIO TAB ══════════════════════════════════════ */}
          {tab === "portfolio" && (
            <div className="fade-up">
              {/* Stat row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
                <StatCard
                  label="Portfolio Value"
                  value={totalUsd ? `$${totalUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—"}
                  sub={`${portfolio?.portfolio?.token_count || 0} assets · multi-chain`}
                  icon="◈" color={C.cyan} glow="glow-cyan"
                />
                <StatCard
                  label="Risk Score"
                  value={riskScore !== null ? `${riskScore}` : "—"}
                  sub={portfolio?.risk?.summary?.slice(0, 42) || ""}
                  icon="◉"
                  color={riskLevel === "LOW" ? C.green : riskLevel === "MEDIUM" ? C.amber : C.red}
                  glow={riskLevel === "LOW" ? "glow-green" : "glow-red"}
                  badge={<RiskBadge level={riskLevel} />}
                />
                <StatCard
                  label="Active Alerts"
                  value={alerts.length}
                  sub={`${alerts.filter(a => a.severity === "HIGH").length} HIGH · ${alerts.filter(a => a.severity === "MEDIUM").length} MEDIUM`}
                  icon="◬"
                  color={alerts.some(a => a.severity === "HIGH") ? C.red : C.amber}
                />
                <StatCard
                  label="Signals Tracked"
                  value={signals.length}
                  sub={`${signals.filter(s => s.signal?.includes("BULLISH")).length} bullish · ${signals.filter(s => s.signal?.includes("BEARISH")).length} bearish`}
                  icon="⟁" color={C.purple}
                  badge={<LiveDot />}
                />
              </div>

              {/* Holdings + Allocation */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
                {/* Token table */}
                <div className="grad-border" style={{ padding: "24px" }}>
                  <SectionHeader title="Token Holdings" right={
                    <span style={{ fontSize: "0.68rem", color: C.textSec }}>
                      {portfolio?.portfolio?.is_mock && (
                        <span style={{ color: C.amber, background: C.amber + "18", border: `1px solid ${C.amber}33`, borderRadius: 5, padding: "2px 8px", fontSize: "0.65rem" }}>
                          DEMO DATA
                        </span>
                      )}
                    </span>
                  } />

                  {/* Header row */}
                  <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 100px 100px 80px 100px", gap: 12, padding: "0 16px 10px", fontSize: "0.65rem", color: C.textSec, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    <span />
                    <span>Asset</span>
                    <span style={{ textAlign: "right" }}>Balance</span>
                    <span style={{ textAlign: "right" }}>Value</span>
                    <span style={{ textAlign: "right" }}>Alloc.</span>
                    <span style={{ textAlign: "right" }}>Chain</span>
                  </div>
                  <Divider />

                  {(portfolio?.portfolio?.tokens || []).map((token, i) => {
                    const pct = totalUsd ? (token.usd_value / totalUsd * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="data-row" style={{ display: "grid", gridTemplateColumns: "36px 1fr 100px 100px 80px 100px", gap: 12, alignItems: "center" }}>
                          <TokenIcon symbol={token.symbol} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{token.symbol}</div>
                            <div style={{ fontSize: "0.68rem", color: C.textSec, fontFamily: "'JetBrains Mono', monospace" }}>
                              {token.contract === "native" ? "Native" : token.contract.slice(0, 10) + "…"}
                            </div>
                          </div>
                          <div className="num" style={{ textAlign: "right", fontSize: "0.85rem" }}>
                            {token.balance?.toFixed(4)}
                          </div>
                          <div className="num" style={{ textAlign: "right", fontWeight: 600 }}>
                            ${token.usd_value?.toLocaleString()}
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div className="num" style={{ fontSize: "0.8rem", color: C.textSec, marginBottom: 4 }}>{pct.toFixed(1)}%</div>
                            <div className="progress-track">
                              <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <ChainBadge chainId={token.chain} />
                          </div>
                        </div>
                        {i < (portfolio?.portfolio?.tokens?.length - 1) && <Divider />}
                      </div>
                    );
                  })}

                  {!portfolio && (
                    <div style={{ padding: "20px 0" }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", alignItems: "center" }}>
                          <div className="shimmer" style={{ width: 36, height: 36, borderRadius: "50%" }} />
                          <div style={{ flex: 1 }}>
                            <div className="shimmer" style={{ height: 14, width: "40%", marginBottom: 6 }} />
                            <div className="shimmer" style={{ height: 10, width: "60%" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Donut chart */}
                <div className="grad-border" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                  <SectionHeader title="Allocation" />
                  {pieData.length > 0 ? (
                    <>
                      <PieChart width={290} height={200}>
                        <Pie data={pieData} cx={145} cy={100} innerRadius={60} outerRadius={90}
                          dataKey="value" strokeWidth={0} paddingAngle={2}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => [`$${v.toLocaleString()}`, ""]}
                          contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem" }}
                        />
                      </PieChart>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                        {pieData.map((d, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 600 }}>{d.name}</span>
                            <span className="num" style={{ fontSize: "0.78rem", color: C.textSec }}>
                              {(d.value / totalUsd * 100).toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textSec, fontSize: "0.8rem" }}>
                      No data
                    </div>
                  )}
                </div>
              </div>

              {/* Risk detail */}
              {portfolio?.risk && (
                <div className="grad-border" style={{ padding: "24px", marginTop: 16 }}>
                  <SectionHeader title="Risk Analysis" right={<RiskBadge level={riskLevel} />} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {[
                      { label: "Risk Score", value: `${riskScore} / 100`, color: riskLevel === "LOW" ? C.green : riskLevel === "MEDIUM" ? C.amber : C.red },
                      { label: "Summary", value: portfolio.risk.summary },
                    ].map((item, i) => (
                      <div key={i} style={{ padding: "14px 16px", background: C.border + "33", borderRadius: 10 }}>
                        <div style={{ fontSize: "0.65rem", color: C.textSec, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{item.label}</div>
                        <div className="num" style={{ fontSize: "0.9rem", fontWeight: 700, color: item.color || C.textPri }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ SIGNALS TAB ════════════════════════════════════════ */}
          {tab === "signals" && (
            <div className="fade-up">
              <div className="grad-border" style={{ padding: "24px" }}>
                <SectionHeader title="Live DeFi Signals — OKX Market Feed" right={<LiveDot />} />

                {/* Column headers */}
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 90px 90px 100px 90px", gap: 12, padding: "0 16px 10px", fontSize: "0.65rem", color: C.textSec, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <span>Pair</span>
                  <span>Chart</span>
                  <span style={{ textAlign: "right" }}>Price</span>
                  <span style={{ textAlign: "right" }}>24h</span>
                  <span style={{ textAlign: "right" }}>Signal</span>
                  <span style={{ textAlign: "right" }}>Volume</span>
                </div>
                <Divider />

                {signals.map((sig, i) => {
                  const pos = sig.change_24h_pct >= 0;
                  const accentColor = pos ? C.green : C.red;
                  const sparkData = makeSparkline(sig.last_price, sig.change_24h_pct);
                  const sigClass = sig.signal === "BULLISH" ? "signal-bullish"
                    : sig.signal === "BEARISH" ? "signal-bearish"
                    : sig.signal === "MILDLY_BULLISH" ? "signal-mild-bull"
                    : sig.signal === "MILDLY_BEARISH" ? "signal-mild-bear"
                    : "signal-neutral";

                  return (
                    <div key={i}>
                      <div className={`data-row ${sigClass}`}
                        style={{ display: "grid", gridTemplateColumns: "160px 1fr 90px 90px 100px 90px", gap: 12, alignItems: "center", paddingLeft: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <TokenIcon symbol={sig.pair.replace("-USDT", "")} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>{sig.pair.replace("-USDT", "")}</div>
                            <div style={{ fontSize: "0.65rem", color: C.textSec }}>/USDT</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <Sparkline data={sparkData} color={accentColor} positive={pos} />
                        </div>
                        <div className="num" style={{ textAlign: "right", fontWeight: 600, fontSize: "0.85rem" }}>
                          ${sig.last_price?.toLocaleString("en-US", { maximumFractionDigits: sig.last_price > 10 ? 2 : 4 })}
                        </div>
                        <div className="num" style={{ textAlign: "right", fontWeight: 700, color: accentColor, fontSize: "0.88rem" }}>
                          {pos ? "+" : ""}{sig.change_24h_pct?.toFixed(2)}%
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <SignalPill signal={sig.signal} />
                        </div>
                        <div className="num" style={{ textAlign: "right", fontSize: "0.78rem", color: C.textSec }}>
                          ${(sig.volume_24h / 1e6).toFixed(1)}M
                        </div>
                      </div>
                      {i < signals.length - 1 && <Divider />}
                    </div>
                  );
                })}

                {signals.length === 0 && (
                  <div style={{ padding: "40px 0", textAlign: "center", color: C.textSec, fontSize: "0.85rem" }}>
                    No signal data. Start the backend: <code style={{ color: C.cyan }}>python main.py</code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ALERTS TAB ═════════════════════════════════════════ */}
          {tab === "alerts" && (
            <div className="fade-up">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
                <div className="grad-border" style={{ padding: "24px" }}>
                  <SectionHeader
                    title={`Active Alerts (${alerts.length})`}
                    right={
                      alerts.length > 0
                        ? <span style={{ fontSize: "0.68rem", color: C.red, background: C.red + "18", border: `1px solid ${C.red}33`, borderRadius: 5, padding: "3px 9px", fontWeight: 700 }}>
                            {alerts.filter(a => a.severity === "HIGH").length} CRITICAL
                          </span>
                        : <span style={{ fontSize: "0.68rem", color: C.green }}>All Clear</span>
                    }
                  />

                  {alerts.length === 0 && (
                    <div style={{ padding: "32px 0", textAlign: "center" }}>
                      <div style={{ fontSize: "2rem", marginBottom: 8 }}>✓</div>
                      <div style={{ color: C.green, fontWeight: 700, marginBottom: 4 }}>No active alerts</div>
                      <div style={{ color: C.textSec, fontSize: "0.8rem" }}>Portfolio risk profile is healthy</div>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {alerts.map((alert, i) => (
                      <div key={i}
                        className={alert.severity === "HIGH" ? "alert-high" : "alert-medium"}
                        style={{ padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: alert.severity === "HIGH" ? C.red + "22" : C.amber + "22",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.9rem"
                        }}>
                          {alert.type === "CONCENTRATION" ? "⊗" : alert.type === "PRICE_MOVEMENT" ? "⟁" : "◬"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{
                              fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em",
                              color: alert.severity === "HIGH" ? C.red : C.amber,
                              fontFamily: "'JetBrains Mono', monospace"
                            }}>
                              {alert.severity}
                            </span>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.textSec, letterSpacing: "0.08em" }}>
                              {alert.type}
                            </span>
                            {alert.asset && (
                              <span style={{ background: C.border, padding: "1px 7px", borderRadius: 4, fontSize: "0.65rem", fontWeight: 700 }}>
                                {alert.asset}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: C.textPri, lineHeight: 1.5 }}>
                            {alert.message}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert summary sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="grad-border" style={{ padding: "20px" }}>
                    <SectionHeader title="Severity Breakdown" />
                    {[
                      { label: "HIGH", count: alerts.filter(a => a.severity === "HIGH").length, color: C.red },
                      { label: "MEDIUM", count: alerts.filter(a => a.severity === "MEDIUM").length, color: C.amber },
                      { label: "LOW", count: alerts.filter(a => a.severity === "LOW").length, color: C.cyan },
                    ].map(s => (
                      <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                          <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{s.label}</span>
                        </div>
                        <span className="num" style={{ fontSize: "0.9rem", fontWeight: 700, color: s.count ? s.color : C.textMuted }}>
                          {s.count}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grad-border" style={{ padding: "20px" }}>
                    <SectionHeader title="Alert Types" />
                    {["CONCENTRATION", "PRICE_MOVEMENT", "NO_STABLECOIN", "LOW_VALUE"].map(type => {
                      const c = alerts.filter(a => a.type === type).length;
                      return (
                        <div key={type} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}33` }}>
                          <span style={{ fontSize: "0.73rem", color: C.textSec, fontFamily: "'JetBrains Mono', monospace" }}>{type}</span>
                          <span className="num" style={{ fontSize: "0.8rem", fontWeight: 700, color: c ? C.textPri : C.textMuted }}>{c}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ SWAP TAB ═══════════════════════════════════════════ */}
          {tab === "swap" && (
            <div className="fade-up">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>
                {/* Main swap card */}
                <div className="grad-border" style={{ padding: "28px" }}>
                  <SectionHeader title="Natural Language Swap · OKX DEX" right={
                    <span style={{ fontSize: "0.68rem", color: C.blue, background: C.blue + "18", border: `1px solid ${C.blue}33`, borderRadius: 5, padding: "3px 9px", fontWeight: 700 }}>
                      AI POWERED
                    </span>
                  } />

                  {/* Examples */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                    {[
                      "swap 10 USDT to ETH",
                      "swap 0.5 ETH to USDC if gas < 20 gwei",
                      "buy 50 USDT worth of BNB",
                    ].map(ex => (
                      <button key={ex}
                        onClick={() => setSwapCommand(ex)}
                        className="btn-ghost"
                        style={{ padding: "6px 12px", fontSize: "0.75rem", borderRadius: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                        {ex}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="swap-area"
                    style={{ minHeight: 100, marginBottom: 16 }}
                    value={swapCommand}
                    onChange={e => setSwapCommand(e.target.value)}
                    placeholder="Describe your swap in plain English…&#10;Example: swap 10 USDT to ETH if gas is below 20 gwei"
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSwap())}
                  />

                  <button
                    className="btn-primary"
                    style={{ width: "100%", padding: "14px", fontSize: "0.88rem", borderRadius: 12, letterSpacing: "0.08em", opacity: loading ? 0.7 : 1 }}
                    onClick={handleSwap}
                    disabled={loading}>
                    {loading ? "⟳  PROCESSING…" : "⟁  EXECUTE SWAP VIA OKX DEX"}
                  </button>

                  {/* Result */}
                  {swapResult && (
                    <div style={{
                      marginTop: 20, padding: "18px", borderRadius: 12,
                      background: swapResult.result?.status === "executed" ? C.green + "08" : C.red + "08",
                      border: `1px solid ${swapResult.result?.status === "executed" ? C.green + "33" : C.red + "33"}`,
                    }}>
                      <div style={{ fontSize: "0.7rem", color: C.textSec, marginBottom: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        Execution Result
                      </div>
                      {swapResult.result?.message && (
                        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: swapResult.result?.status === "executed" ? C.green : C.red, marginBottom: 12 }}>
                          {swapResult.result.message}
                        </div>
                      )}
                      <pre style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "0.72rem",
                        color: C.textSec, lineHeight: 1.7, overflow: "auto",
                        maxHeight: 220, background: "transparent"
                      }}>
                        {JSON.stringify(swapResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Swap sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="grad-border" style={{ padding: "20px" }}>
                    <SectionHeader title="How It Works" />
                    {[
                      { n: "01", label: "Parse Intent", desc: "Claude AI extracts tokens, amount & conditions" },
                      { n: "02", label: "Validate",     desc: "Gas price, balance & condition checks" },
                      { n: "03", label: "Execute",      desc: "OKX DEX Aggregator finds best route & swaps" },
                    ].map(step => (
                      <div key={step.n} style={{ display: "flex", gap: 14, padding: "10px 0", borderBottom: `1px solid ${C.border}33` }}>
                        <div className="num" style={{ fontSize: "0.7rem", color: C.blue, fontWeight: 800, minWidth: 24 }}>{step.n}</div>
                        <div>
                          <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: 3 }}>{step.label}</div>
                          <div style={{ fontSize: "0.73rem", color: C.textSec, lineHeight: 1.5 }}>{step.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grad-border" style={{ padding: "20px" }}>
                    <SectionHeader title="Supported Conditions" />
                    {[
                      { label: "Gas limit",   ex: "if gas < 20 gwei" },
                      { label: "Price gate",  ex: "if ETH > $4000" },
                      { label: "Immediate",   ex: "(no condition)" },
                    ].map(c => (
                      <div key={c.label} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}33` }}>
                        <div style={{ fontSize: "0.73rem", color: C.textSec, marginBottom: 3 }}>{c.label}</div>
                        <div className="num" style={{ fontSize: "0.75rem", color: C.cyan }}>{c.ex}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grad-border" style={{ padding: "20px" }}>
                    <SectionHeader title="Current Gas" right={<LiveDot />} />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                      {[
                        { label: "Standard", value: "15", color: C.green },
                        { label: "Fast",     value: "25", color: C.amber },
                        { label: "Instant",  value: "40", color: C.red },
                      ].map(g => (
                        <div key={g.label} style={{ textAlign: "center", padding: "10px 8px", background: C.border + "33", borderRadius: 8 }}>
                          <div className="num" style={{ fontSize: "1.1rem", fontWeight: 700, color: g.color }}>{g.value}</div>
                          <div style={{ fontSize: "0.6rem", color: C.textSec, marginTop: 2, fontWeight: 600 }}>{g.label} GWEI</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{
          borderTop: `1px solid ${C.border}`,
          padding: "14px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.65rem",
          color: C.textMuted,
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          <span>OKX DEFI COMMAND CENTER · BUILD X-AGENT HACKATHON 2026</span>
          <span>POWERED BY X-AGENT · OKX AGENTIC WALLET SKILL SUITE · ANTHROPIC CLAUDE</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </>
  );
}
