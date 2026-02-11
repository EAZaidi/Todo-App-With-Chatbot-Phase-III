"""Agent orchestration service.

Creates and runs OpenAI Agent with MCP server connection.
"""

import json
import logging
from typing import AsyncGenerator

from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

from src.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are a task management assistant. You can ONLY help with creating, viewing, updating, and deleting tasks. Politely decline any other requests.

The current user's ID is {user_id}. You MUST pass this user_id to every tool call.

Behavior rules:
- Ask for clarification on ambiguous requests
- Confirm destructive operations (delete) before executing
- Present task lists in a readable formatted list
- For bulk operations, process each item individually
- Never invent task data. Only report information returned by tool calls.
- When showing tasks, format them nicely with title, priority, status, and due date if available.
"""


async def run_agent_streamed(
    user_id: str, message: str, history: list[dict]
) -> AsyncGenerator[dict, None]:
    """Run the agent with streaming and yield SSE events.

    Args:
        user_id: Authenticated user ID to inject into system prompt.
        message: New user message.
        history: Previous conversation messages in OpenAI input format.

    Yields:
        dict: SSE event data with 'event' and 'data' keys.
    """
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(user_id=user_id)
    input_list = history + [{"role": "user", "content": message}]

    async with MCPServerStreamableHttp(
        name="Todo MCP",
        params={
            "url": settings.MCP_SERVER_URL,
            "timeout": 30,
            "sse_read_timeout": 60,
        },
        cache_tools_list=True,
        client_session_timeout_seconds=30,
    ) as mcp_server:
        agent = Agent(
            name="Todo Assistant",
            instructions=system_prompt,
            mcp_servers=[mcp_server],
        )

        result = Runner.run_streamed(agent, input=input_list)
        final_text = ""
        tool_calls_data = []
        tool_results_data = []

        async for event in result.stream_events():
            event_type = type(event).__name__

            if event_type == "RawResponsesStreamEvent":
                # Token delta from the model
                if hasattr(event, 'data') and hasattr(event.data, 'delta'):
                    delta = event.data.delta
                    if hasattr(delta, 'text') and delta.text:
                        final_text += delta.text
                        yield {
                            "event": "token",
                            "data": json.dumps({"delta": delta.text}),
                        }

            elif event_type == "RunItemStreamEvent":
                item = event.item
                item_type = type(item).__name__

                if item_type == "ToolCallItem":
                    tool_call_info = {
                        "tool": item.tool.name if hasattr(item, 'tool') and hasattr(item.tool, 'name') else getattr(item, 'name', 'unknown'),
                        "input": getattr(item, 'arguments', '{}'),
                    }
                    tool_calls_data.append(tool_call_info)
                    yield {
                        "event": "tool_call",
                        "data": json.dumps(tool_call_info),
                    }

                elif item_type == "ToolCallOutputItem":
                    tool_result_info = {
                        "tool": getattr(item, 'tool_name', 'unknown'),
                        "output": getattr(item, 'output', ''),
                    }
                    tool_results_data.append(tool_result_info)
                    yield {
                        "event": "tool_result",
                        "data": json.dumps(tool_result_info),
                    }

                elif item_type == "MessageOutputItem":
                    # Final assistant message
                    if hasattr(item, 'raw_item') and hasattr(item.raw_item, 'content'):
                        for content_part in item.raw_item.content:
                            if hasattr(content_part, 'text'):
                                final_text = content_part.text

        # Yield completion event
        yield {
            "event": "done",
            "data": json.dumps({"final_output": final_text}),
        }

        # Return metadata for persistence
        yield {
            "event": "_metadata",
            "data": json.dumps({
                "final_text": final_text,
                "tool_calls": tool_calls_data,
                "tool_results": tool_results_data,
            }),
        }
