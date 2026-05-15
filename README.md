# ⬡ OKX DeFi Command Center

> An AI agent that monitors your DeFi portfolio, detects risks, surfaces live signals, and executes swaps via natural language — powered by OKX Agentic Wallet.

**Built for: Build X-Agent Hackathon (Builder Track) | May 15–18, 2026**

---

## ✨ Features

| Feature | OKX Skill Used |
|---|---|
| 💼 Wallet Portfolio Monitor | OKX Wallet Skill — reads balances across ETH, BSC, Polygon |
| 🔴 Risk Analyzer | Risk engine — concentration, liquidity, diversification checks |
| 📡 Live DeFi Signals | OKX Market API — price momentum, volume spikes, trend detection |
| ⚡ Natural Language Swap | OKX Swap Skill + Claude — "swap 10 USDT to ETH if gas < 20 gwei" |
| 🔔 Alert System | Combined risk + signal alerts in real-time |

---

## 🚀 Quick Start

### 1. Clone & setup backend

```bash
git clone https://github.com/YOUR_USERNAME/okx-defi-command-center
cd okx-defi-command-center

# Copy env template and fill in your keys
cp .env.example .env

# Install Python deps
pip install -r requirements.txt

# Start backend
cd backend
python main.py
# → Running at http://localhost:8000
```

### 2. Start frontend

```bash
cd frontend
npm install
npm run dev
# → Dashboard at http://localhost:5173
```

### 3. Set your API keys in `.env`

```env
OKX_API_KEY=your_key
OKX_SECRET_KEY=your_secret
OKX_PASSPHRASE=your_passphrase
ANTHROPIC_API_KEY=your_anthropic_key
WALLET_ADDRESS=0x...
```

> **Note:** Without API keys, the app runs in **demo mode** with realistic mock data — all features are still fully demonstrable.

---

## 📡 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | Server health + OKX connection status |
| `GET /portfolio/{wallet}` | Full portfolio + risk score |
| `GET /signals` | Live DeFi signals for 8 major pairs |
| `GET /risk/{wallet}` | Detailed risk report with recommendations |
| `GET /alerts/{wallet}` | Combined risk + signal alerts |
| `POST /swap/nl` | Natural language swap execution |

### Example NL Swap

```bash
curl -X POST http://localhost:8000/swap/nl \
  -H "Content-Type: application/json" \
  -d '{"command": "swap 10 USDT to ETH if gas is below 20 gwei", "wallet_address": "0x..."}'
```

---

## 🏗 Architecture

```
okx-defi-command-center/
├── backend/
│   ├── main.py              ← FastAPI server
│   ├── agent/
│   │   ├── okx_skills.py    ← OKX API integration (wallet, swap, gas, prices)
│   │   ├── risk_engine.py   ← Portfolio risk analysis
│   │   ├── signal_engine.py ← DeFi market signals
│   │   └── swap_agent.py    ← NL → swap (Claude-powered parsing)
│   └── models/
│       ├── portfolio.py     ← Pydantic models
│       └── alerts.py
└── frontend/
    └── src/
        └── App.jsx          ← React dashboard (4 tabs)
```

---

## 🤖 How the NL Swap Works

1. User types: `"swap 10 USDT to ETH if gas is below 20 gwei"`
2. Claude parses the intent into structured JSON (`from_token`, `to_token`, `amount`, `condition`)
3. Condition is evaluated against live OKX gas data
4. If met → OKX DEX swap is executed
5. Result returned with full status

Falls back to regex parsing if Claude API is unavailable.

---

## 🔑 OKX API Setup

1. Visit [OKX Developer Portal](https://www.okx.com/account/my-api)
2. Create an API key with **Read** and **Trade** permissions
3. Copy `API Key`, `Secret Key`, and `Passphrase` into `.env`

---

## 📦 Tech Stack

- **Backend:** Python 3.12+, FastAPI, Uvicorn, HTTPX, Pydantic
- **AI:** Anthropic Claude (NL swap parsing)
- **Frontend:** React 18, Vite, Axios
- **Blockchain:** OKX Web3 API (multi-chain: ETH, BSC, Polygon)

---

*Built with Claude Code + X-Agent OKX Skill Suite for the Build X-Agent Hackathon.*
