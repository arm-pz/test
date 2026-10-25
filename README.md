# test

A Claude Code setup for an AI quant research team: a lead (the main session),
four subagents (`scout`, `sweeper`, `skeptic`, `librarian`), a shared ledger
(`research.md`) and team rules (`CLAUDE.md`). Market data and backtests come
from the QuantGPT MCP server.

## Setup

1. Create an account at quantgpt.co and issue a key under
   ACCOUNT -> "Keys for your AI" (the `qg_sk_` value is shown once).
2. Export it; never commit it:
   ```sh
   export QUANTGPT_API_KEY=qg_sk_...
   ```
3. Start Claude Code in this directory and approve the `quantgpt` server from
   `.mcp.json`. Check the connection with `/mcp`.

## Example

> Librarian: find momentum and value strategies in the library.
> Then have the scout test the 200-day moving-average rule from 1999, the
> sweeper sweep the lookback and exit bands, and the skeptic attack every
> DATA VALIDATED cell. Log everything in research.md.

Every result is gross of costs, taxes and slippage. Paper trade before risking money.
