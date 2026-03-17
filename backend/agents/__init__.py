"""
Agent registry for The Drop agent framework.

Usage:
    from agents import register, get_all_agents, get_agent, init_agents, schedule_agents
"""

import logging
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

# Global registry: name -> agent instance
_registry: dict = {}


def register(agent) -> None:
    """Register an agent instance by its name."""
    _registry[agent.name] = agent
    logger.info(f"[AgentRegistry] Registered agent: {agent.name}")


def get_all_agents() -> dict:
    """Return a dict of all registered agents keyed by name."""
    return dict(_registry)


def get_agent(name: str):
    """Look up a registered agent by name. Returns None if not found."""
    return _registry.get(name)


async def init_agents(db, scheduler, clients: dict) -> None:
    """
    Import all agent modules (which triggers self-registration via register()),
    then seed the agent_config collection with defaults for any new agents.

    Missing agent modules are skipped with a warning so the server starts cleanly
    even before the individual agent files have been created.
    """

    agent_modules = [
        "agents.self_healing",
        "agents.source_quality",
        "agents.deduplication",
        "agents.rewrite_qa",
        "agents.sensitivity",
        "agents.trending",
        "agents.smart_curation",
        "agents.coverage_balance",
        "agents.re_engagement",
        "agents.reading_journey",
        "agents.daily_ops_report",
        "agents.anomaly_detection",
    ]

    for module_path in agent_modules:
        try:
            import importlib
            importlib.import_module(module_path)
        except ModuleNotFoundError:
            logger.warning(f"[AgentRegistry] Agent module not found (skipping): {module_path}")
        except Exception as exc:
            logger.warning(f"[AgentRegistry] Failed to import {module_path}: {exc}")

    # Seed agent_config collection — insert defaults for agents that have no config yet
    for name, agent in _registry.items():
        existing = await db.agent_config.find_one({"agent_name": name})
        if not existing:
            await db.agent_config.insert_one({
                "agent_name": name,
                "enabled": agent.default_enabled,
                "description": agent.description,
            })
            logger.info(f"[AgentRegistry] Seeded config for agent: {name}")

    await schedule_agents(db, scheduler, clients)


async def schedule_agents(db, scheduler, clients: dict) -> None:
    """Register all agents with APScheduler using their defined schedules."""

    schedules = {
        "self_healing":      CronTrigger(hour="2,5,8,11,14,17,20,23", minute=30, timezone="UTC"),
        "source_quality":    CronTrigger(hour=6,                        minute=0,  timezone="UTC"),
        "deduplication":     CronTrigger(hour="0,3,6,9,12,15,18,21",   minute=15, timezone="UTC"),
        "rewrite_qa":        CronTrigger(hour="2,5,8,11,14,17,20,23",  minute=0,  timezone="UTC"),
        "sensitivity":       CronTrigger(hour="2,5,8,11,14,17,20,23",  minute=15, timezone="UTC"),
        "trending":          IntervalTrigger(minutes=30),
        "smart_curation":    CronTrigger(hour="0,6,12,18",              minute=45, timezone="UTC"),
        "coverage_balance":  CronTrigger(hour="8,14,20",                minute=0,  timezone="UTC"),
        "re_engagement":     CronTrigger(hour=9,                        minute=0,  timezone="UTC"),
        "reading_journey":   CronTrigger(hour=2,                        minute=0,  timezone="UTC"),
        "daily_ops_report":  CronTrigger(hour=23,                       minute=50, timezone="UTC"),
        "anomaly_detection": IntervalTrigger(minutes=15),
    }

    for name, trigger in schedules.items():
        agent = get_agent(name)
        if agent is None:
            logger.debug(f"[AgentScheduler] Agent '{name}' not registered — skipping schedule")
            continue

        # Capture loop variables in the closure
        _agent = agent
        _clients = clients

        async def _job(agent=_agent, db=db, clients=_clients):
            config = await db.agent_config.find_one({"agent_name": agent.name})
            if config and not config.get("enabled", True):
                logger.debug(f"[AgentScheduler] Agent '{agent.name}' is disabled — skipping run")
                return
            await agent.run(db, clients)

        scheduler.add_job(
            _job,
            trigger,
            id=f"agent_{name}",
            replace_existing=True,
        )
        logger.info(f"[AgentScheduler] Scheduled agent: {name}")
