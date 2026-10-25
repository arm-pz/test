# Quant research team

This repo turns Claude Code into a small quant research desk. The main session
is the **lead**: it plans the research, delegates, and writes the summary. Four
subagents in `.claude/agents/` do the rest:

| Agent | Job | Model |
|---|---|---|
| `scout` | Runs the first test of one question and reports the verdict | sonnet |
| `sweeper` | Runs parameter sweeps around a candidate rule | sonnet |
| `skeptic` | Tries to break every DATA VALIDATED result | opus |
| `librarian` | Searches the strategy library and the ledger before anything is tested | haiku |

All numbers come from the QuantGPT MCP server (`.mcp.json`). No agent computes
a return, Sharpe ratio or drawdown itself; it sends rules to the server and
quotes what comes back. Every study ends in one of three verdicts:
**DATA VALIDATED**, **TRADE-OFF** or **NO EDGE**.

## Rules every agent obeys

1. Every test is logged in `research.md` with its verdict before any summary.
2. Only DATA VALIDATED results move to the next stage.
3. NO EDGE is a result, not a failure. Log it and never retest it without a new reason.
4. A finding is real only if the skeptic could not break it.

## Workflow

1. Read `research.md` first. If the idea is already there, do not retest it
   unless you can state what is new.
2. Librarian checks the library for prior art.
3. Scout runs the base test (time split at the out-of-sample year, 2015 by default).
4. Sweeper runs neighbouring settings; a real edge holds across them.
5. Skeptic attacks every DATA VALIDATED cell.
6. Survivors go to paper trading before anything else. Backtests are gross of
   costs, taxes and slippage.

AI tool calls are capped per day per account, so give each agent one job and
avoid duplicate calls.
