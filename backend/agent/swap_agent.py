"""
Swap Agent — Natural Language Swap Handler
Parses natural language swap commands and executes via OKX DEX skill.
Example inputs:
  - "swap 10 USDT to ETH"
  - "swap 0.5 ETH to USDC if gas is below 20 gwei"
  - "buy 100 USDT worth of BNB"
"""

import re
import os
import json
import anthropic
from agent.okx_skills import OKXSkills


class SwapAgent:
    """
    Uses Claude to parse natural language swap intent,
    validates conditions (gas, price), then executes via OKX swap skill.
    """

    def __init__(self):
        self.okx = OKXSkills()
        self.anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

    async def execute(self, command: str, wallet_address: str) -> dict:
        """Main entry: parse NL command → validate → execute swap."""
        parsed = await self._parse_command(command)

        if not parsed.get("valid"):
            return {
                "status": "error",
                "message": parsed.get("error", "Could not understand swap command"),
                "original_command": command
            }

        # Check conditions if any
        if parsed.get("condition"):
            condition_met, reason = await self._check_condition(parsed["condition"])
            if not condition_met:
                return {
                    "status": "condition_not_met",
                    "message": f"Swap not executed: {reason}",
                    "parsed": parsed,
                    "will_retry": True
                }

        # Execute swap via OKX skill
        result = await self.okx.execute_swap(
            from_token=parsed["from_token"],
            to_token=parsed["to_token"],
            amount=parsed["amount"],
            chain_id=parsed.get("chain_id", "1")
        )

        return {
            "status": "executed",
            "swap": parsed,
            "okx_result": result,
            "message": f"✅ Swapped {parsed['amount']} {parsed['from_token']} → {parsed['to_token']}"
        }

    async def _parse_command(self, command: str) -> dict:
        """Use Claude to parse NL swap command into structured data."""
        try:
            message = self.anthropic_client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=300,
                system="""You are a DeFi swap command parser. Extract swap intent from natural language.
Return ONLY valid JSON with these fields:
- valid: boolean
- from_token: string (symbol like ETH, USDT, BNB)
- to_token: string
- amount: number
- condition: string or null (e.g. "gas < 20 gwei", "ETH price > 4000")
- error: string (only if valid is false)

Example input: "swap 10 USDT to ETH if gas is below 20 gwei"
Example output: {"valid": true, "from_token": "USDT", "to_token": "ETH", "amount": 10, "condition": "gas < 20 gwei", "error": null}""",
                messages=[{"role": "user", "content": command}]
            )
            text = message.content[0].text.strip()
            return json.loads(text)
        except Exception:
            return self._regex_parse(command)

    def _regex_parse(self, command: str) -> dict:
        """Fallback regex parser if Claude API fails."""
        command_lower = command.lower()
        pattern = r"swap\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)"
        match = re.search(pattern, command_lower)
        if match:
            amount, from_tok, to_tok = match.groups()
            condition = None
            if "if gas" in command_lower:
                gas_match = re.search(r"(\d+)\s*gwei", command_lower)
                if gas_match:
                    condition = f"gas < {gas_match.group(1)} gwei"
            return {
                "valid": True,
                "from_token": from_tok.upper(),
                "to_token": to_tok.upper(),
                "amount": float(amount),
                "condition": condition,
                "error": None
            }
        return {"valid": False, "error": f"Could not parse swap command: '{command}'"}

    async def _check_condition(self, condition: str) -> tuple[bool, str]:
        """Check if a swap condition is met (gas price, token price, etc.)."""
        condition_lower = condition.lower()

        # Gas condition: "gas < 20 gwei"
        if "gas" in condition_lower:
            gas_match = re.search(r"(\d+)\s*gwei", condition_lower)
            if gas_match:
                threshold = int(gas_match.group(1))
                gas_data = await self.okx.get_gas_price("1")
                current_gas = int(gas_data.get("standard", 99))
                if "<" in condition_lower:
                    met = current_gas < threshold
                    return met, f"Gas is {current_gas} gwei (threshold: {threshold} gwei)"
                elif ">" in condition_lower:
                    met = current_gas > threshold
                    return met, f"Gas is {current_gas} gwei (threshold: {threshold} gwei)"

        return True, "Condition check passed"
