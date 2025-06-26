import logging
import json
import os
import re
from datetime import datetime

from pydantic import Field

from aiq.builder.builder import Builder
from aiq.builder.framework_enum import LLMFrameworkEnum
from aiq.builder.function_info import FunctionInfo
from aiq.cli.register_workflow import register_function
from aiq.data_models.component_ref import LLMRef
from aiq.data_models.function import FunctionBaseConfig

logger = logging.getLogger(__name__)

TMP_DIR = "/workspace/.tmp/logs/"
os.makedirs(TMP_DIR, exist_ok=True)


class OpenCodeReviewFunctionConfig(FunctionBaseConfig, name="open_code_review"):
    """
    Configuration class for the Open Code Review function.
    """
    _type: str = "open_code_review"
    llm: LLMRef = Field(description="LLM to be used for code review")
    prompt_dir: str = Field(default="prompts", description="Directory containing prompt templates")


@register_function(config_type=OpenCodeReviewFunctionConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def open_code_review_function(
    config: OpenCodeReviewFunctionConfig, builder: Builder
):
    # Implement your function logic here
    async def _response_fn(input_message: str) -> str:
        """
        Process the input message, extract file ID and review type, retrieve the source code,
        and generate an AI review of the code.
        
        Args:
            input_message: A string containing file_id and optional review_type parameters
                           Example: "file_id: 6, review_type: general_review"
        
        Returns:
            A JSON string containing the review results
        """
        
        # Generate timestamp for log files
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S_%f")[:-3]
        
        # Extract file_id and review_type from the input string
        file_id = None
        review_type = None
        
        # Use regex to extract both fields robustly
        file_id_match = re.search(r"file_id\s*:\s*([0-9]+)", input_message)
        review_type_match = re.search(r"review_type\s*:\s*([a-zA-Z0-9_\-]+)", input_message)
        
        if file_id_match:
            file_id = file_id_match.group(1)
        if review_type_match:
            review_type = review_type_match.group(1)

        # Log the input and extracted parameters
        with open(os.path.join(TMP_DIR, f'{timestamp}_input.txt'), 'w') as f:
            f.write(f"Input message: {input_message}\n")
            f.write(f"Extracted file_id: {file_id}\n")
            f.write(f"Extracted review_type: {review_type}\n")

        if not file_id:
            error_msg = f"Invalid input. Please provide file_id. Received: {input_message}"
            logger.error(error_msg)
            return json.dumps({
                "error": "Missing file_id parameter",
                "details": error_msg,
                "issues_found": False,
                "findings": []
            }, indent=2)
            
        if not review_type:
            review_type = "general_review"
            logger.info(f"No review_type specified, defaulting to: {review_type}")

        import requests
        api_url = "http://mcp_server:8002/mcp/analyze"
        payload = {"file_id": file_id, "review_type": review_type}
        response = requests.post(api_url, json=payload)

        return response.text

    try:
        yield FunctionInfo.from_fn(
            _response_fn,
            description=("This tool analyzes source code to detect bugs, security vulnerabilities, "
                       "performance issues, and style problems. It provides recommendations for "
                       "improving code quality and maintainability. "
                       "Provide the file_id to identify which file is being reviewed along with "
                       "an optional review_type parameter to specify the type of review.")
        )
    except GeneratorExit:
        logger.info("Function exited early!")
    finally:
        logger.info("Cleaning up open_code_review workflow.")
