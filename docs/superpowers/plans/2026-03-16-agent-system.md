# The Drop — Agent System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 12 autonomous agents that automate, monitor, and optimize every layer of The Drop's content pipeline, quality assurance, editorial curation, user engagement, and operations.

**Architecture:** Modular agent system under `backend/agents/`. Each agent is a standalone Python module with a common base class that handles scheduling, logging to MongoDB (`agent_runs` collection), and error recovery. Agents integrate with the existing APScheduler system and are controllable via the admin dashboard.

**Tech Stack:** Python 3.11+, FastAPI, Motor (async MongoDB), Anthropic SDK (Claude), OpenAI SDK (GPT-4o-mini), APScheduler, existing server.py infrastructure.

---

## File Structure

```
backend/
├── agents/
│   ├── __init__.py                    # Agent registry, init_agents() entry point
│   ├── base.py                        # BaseAgent class (schedule, log, run)
│   ├── self_healing.py                # Agent 1: Self-Healing Pipeline
│   ├── source_quality.py              # Agent 2: Source Quality Monitor
│   ├── deduplication.py               # Agent 3: Smart Deduplication
│   ├── rewrite_qa.py                  # Agent 4: Rewrite QA
│   ├── sensitivity.py                 # Agent 5: Sensitivity & Safety
│   ├── trending.py                    # Agent 6: Trending/Breaking News
│   ├── smart_curation.py             # Agent 7: Smart Curation
│   ├── coverage_balance.py           # Agent 8: Coverage Balance
│   ├── re_engagement.py              # Agent 9: Re-engagement
│   ├── reading_journey.py            # Agent 10: Reading Journey
│   ├── daily_ops_report.py           # Agent 11: Daily Ops Report
│   └── anomaly_detection.py          # Agent 12: Anomaly Detection
├── server.py                          # Modified: import & init agents at startup
├── admin.py                           # Modified: add agent monitoring tab
└── requirements.txt                   # No new deps needed
```

---

Plan saved. Ready to execute.
