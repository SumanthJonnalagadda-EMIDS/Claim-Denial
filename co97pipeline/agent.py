from google.adk.agents import SequentialAgent

from co97pipeline.subagents.validator.agent import co97_validator_agent
from co97pipeline.subagents.analyzer.agent import co97_analyzer_agent

root_agent = SequentialAgent(
    name="CO59_97_DenialPipeline",
    sub_agents=[
        co97_validator_agent,
        co97_analyzer_agent
    ],
    description="Combined pipeline for CO59 and CO97 denial logic.",
)
