from typing import Dict, Any, Optional
from app.tools.base import BaseTool, ToolPermissionError, ToolExecutionError
from app.tools.transaction_tool import FetchTransactionTool
from app.tools.account_tool import FetchAccountHistoryTool
from app.tools.model_tool import RunFraudModelTool
from app.tools.pattern_tool import DetectPatternsTool
from app.tools.graph_tool import FindLinkedEntitiesTool
from app.tools.policy_tool import SearchPolicyTool
from app.tools.case_tool import FindSimilarCasesTool
from app.tools.verification_tool import VerifyEvidenceTool
from app.core.logging import logger


FORBIDDEN_TOOLS = {"execute_arbitrary_sql", "execute_shell", "call_any_url", "drop_database", "eval"}


class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        tools = [
            FetchTransactionTool(),
            FetchAccountHistoryTool(),
            RunFraudModelTool(),
            DetectPatternsTool(),
            FindLinkedEntitiesTool(),
            SearchPolicyTool(),
            FindSimilarCasesTool(),
            VerifyEvidenceTool()
        ]
        for t in tools:
            self.register(t)

    def register(self, tool: BaseTool):
        if tool.name in FORBIDDEN_TOOLS:
            raise ValueError(f"Tool name '{tool.name}' is forbidden.")
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> Dict[str, str]:
        return {name: tool.description for name, tool in self._tools.items()}

    async def execute_tool(
        self,
        name: str,
        params: Dict[str, Any],
        user_role: str = "analyst"
    ) -> Dict[str, Any]:
        """
        Executes a registered tool by name with parameter validation, permission enforcement, and logging.
        """
        if name in FORBIDDEN_TOOLS:
            logger.error("forbidden_tool_attempt", tool=name, role=user_role)
            raise ToolPermissionError(f"Execution of forbidden tool '{name}' is strictly blocked.")

        tool = self.get_tool(name)
        if not tool:
            logger.error("tool_not_found", tool=name)
            raise KeyError(f"Tool '{name}' is not registered in ToolRegistry.")

        return await tool.run(input_params=params, user_role=user_role)


tool_registry = ToolRegistry()
