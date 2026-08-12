import time
import asyncio
from typing import Dict, Any, Type, Optional
from pydantic import BaseModel, ValidationError
from app.core.logging import logger


class ToolExecutionError(Exception):
    pass


class ToolPermissionError(Exception):
    pass


class BaseTool:
    name: str = ""
    description: str = ""
    input_schema: Type[BaseModel] = BaseModel
    output_schema: Type[BaseModel] = BaseModel
    required_permission: str = "analyst"  # analyst, auditor, admin
    timeout_seconds: float = 5.0
    max_retries: int = 2

    async def run(self, input_params: Dict[str, Any], user_role: str = "analyst") -> Dict[str, Any]:
        """
        Executes tool with authorization check, input validation, timeout, and structured audit logging.
        """
        # Permission check
        if not self._check_permission(user_role):
            logger.warning("tool_permission_denied", tool=self.name, role=user_role, required=self.required_permission)
            raise ToolPermissionError(f"Role '{user_role}' is not authorized to execute tool '{self.name}'. Required: {self.required_permission}")

        # Input Schema Validation
        try:
            validated_input = self.input_schema(**input_params)
        except ValidationError as e:
            logger.error("tool_invalid_input_params", tool=self.name, error=str(e))
            raise ValueError(f"Invalid input parameters for tool '{self.name}': {e}")

        # Execution with retries and timeout
        start_time = time.time()
        retries = 0
        last_error = None

        while retries <= self.max_retries:
            try:
                result_data = await asyncio.wait_for(
                    self._execute(validated_input),
                    timeout=self.timeout_seconds
                )
                duration_ms = (time.time() - start_time) * 1000.0

                # Output Schema Validation
                validated_output = self.output_schema(**result_data)
                output_dict = validated_output.model_dump()

                logger.info("tool_execution_success", tool=self.name, duration_ms=round(duration_ms, 2), retries=retries)
                return {
                    "tool_name": self.name,
                    "status": "SUCCESS",
                    "duration_ms": round(duration_ms, 2),
                    "output": output_dict
                }
            except asyncio.TimeoutError:
                retries += 1
                last_error = f"Execution timed out after {self.timeout_seconds}s"
                logger.warning("tool_execution_timeout", tool=self.name, attempt=retries)
            except Exception as e:
                retries += 1
                last_error = str(e)
                logger.warning("tool_execution_retry", tool=self.name, attempt=retries, error=str(e))

        raise ToolExecutionError(f"Tool '{self.name}' failed after {self.max_retries+1} attempts. Last error: {last_error}")

    def _check_permission(self, user_role: str) -> bool:
        role_hierarchy = {"admin": 3, "analyst": 2, "auditor": 1}
        user_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(self.required_permission, 2)
        return user_level >= required_level

    async def _execute(self, input_data: BaseModel) -> Dict[str, Any]:
        raise NotImplementedError("Subclasses must implement _execute method")
