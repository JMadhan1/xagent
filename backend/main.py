"""
OKX DeFi Command Center — FastAPI Backend
Main entry point for the agent server.
Handles wallet monitoring, risk analysis, DeFi signals, and NL swaps.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
from dotenv import load_dotenv

from agent.okx_skills import OKXSkills
from agent.risk_engine import RiskEngine
from agent.signal_engine import SignalEngine
from agent.swap_agent import SwapAgent
from models.portfolio import PortfolioRequest
from models.alerts import SwapRequest

load_dotenv()

app = FastAPI(
    title="OKX DeFi Command Center",
    description="AI agent for DeFi portfolio monitoring, risk analysis, signals, and NL swaps",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
okx = OKXSkills()
risk_engine = RiskEngine()
signal_engine = SignalEngine()
swap_agent = SwapAgent()


@app.get("/")
async def root():
    return {"status": "OKX DeFi Command Center is live", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy", "okx_connected": okx.is_connected()}


@app.get("/portfolio/{wallet_address}")
async def get_portfolio(wallet_address: str):
    """
    Fetch full portfolio for a wallet address using OKX wallet skill.
    Returns balances, positions, and asset breakdown.
    """
    try:
        portfolio = await okx.get_portfolio(wallet_address)
        risk_score = await risk_engine.analyze(portfolio)
        return {
            "wallet": wallet_address,
            "portfolio": portfolio,
            "risk": risk_score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/signals")
async def get_signals():
    """
    Fetch live DeFi signals using OKX signals skill.
    Returns momentum, volume spikes, and trending assets.
    """
    try:
        signals = await signal_engine.get_live_signals()
        return {"signals": signals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/risk/{wallet_address}")
async def get_risk_report(wallet_address: str):
    """
    Run full risk analysis on a wallet.
    Checks concentration, liquidity, and unusual movements.
    """
    try:
        portfolio = await okx.get_portfolio(wallet_address)
        report = await risk_engine.full_report(portfolio)
        return {"wallet": wallet_address, "risk_report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/swap/nl")
async def natural_language_swap(request: SwapRequest):
    """
    Execute a swap via natural language command.
    Example: "swap 10 USDT to ETH if gas is below 20 gwei"
    Uses OKX swap skill under the hood.
    """
    try:
        result = await swap_agent.execute(request.command, request.wallet_address)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/alerts/{wallet_address}")
async def get_alerts(wallet_address: str):
    """
    Get active alerts for a wallet — risk alerts + signal alerts combined.
    """
    try:
        portfolio = await okx.get_portfolio(wallet_address)
        risk_alerts = await risk_engine.get_alerts(portfolio)
        signal_alerts = await signal_engine.get_alerts()
        return {
            "wallet": wallet_address,
            "alerts": risk_alerts + signal_alerts,
            "total": len(risk_alerts) + len(signal_alerts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
