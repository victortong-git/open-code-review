import logging
import json
import os
import re
import traceback
from datetime import datetime

from open_code_review.utils import smart_parse

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


class QAConsultantFunctionConfig(FunctionBaseConfig, name="qa_consultant"):
    """
    Configuration class for the QA Consultant function.
    """
    _type: str = "qa_consultant"
    llm: LLMRef = Field(description="LLM to be used for QA review")
    prompt_dir: str = Field(default="prompts", description="Directory containing prompt templates")


@register_function(config_type=QAConsultantFunctionConfig, framework_wrappers=[LLMFrameworkEnum.LANGCHAIN])
async def qa_consultant_function(
    config: QAConsultantFunctionConfig, builder: Builder
):
    # Implement QA consultant function logic here
    async def _response_fn(input_message: str) -> str:
        """
        Process the input message, extract finding ID, retrieve the finding details and source code,
        and generate a QA review to validate the finding's accuracy.
        
        Args:
            input_message: A string containing finding_id and review_type parameters
                           Example: "finding_id: 6, review_type: qa_consultant"
        
        Returns:
            A JSON string containing the QA review results
        """
        
        # Generate timestamp for log files
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S_%f")[:-3]
        
        # Parse the input message as JSON first
        try:
            input_data = json.loads(input_message)
            finding_id = input_data.get("finding_id")
            review_type = input_data.get("review_type", "qa_consultant")
        except json.JSONDecodeError:
            # Fallback to regex if not a valid JSON
            finding_id_match = re.search(r"finding_id\s*:\s*([0-9]+)", input_message)
            review_type_match = re.search(r"review_type\s*:\s*([a-zA-Z0-9_\-]+)", input_message)
            
            finding_id = finding_id_match.group(1) if finding_id_match else None
            review_type = review_type_match.group(1) if review_type_match else "qa_consultant"

        # Log the input and extracted parameters
        with open(os.path.join(TMP_DIR, f'{timestamp}_qa_input.txt'), 'w') as f:
            f.write(f"Input message: {input_message}\n")
            f.write(f"Extracted finding_id: {finding_id}\n")
            f.write(f"Extracted review_type: {review_type}\n")

        if not finding_id:
            error_msg = f"Invalid input. Please provide finding_id. Received: {input_message}"
            logger.error(error_msg)
            return json.dumps({
                "error": "Missing finding_id parameter",
                "details": error_msg,
                "status": "error",
                "reason": "Invalid input parameters"
            }, indent=2)

        # Call the helper function to retrieve the finding details
        from open_code_review.helper_tools import get_finding_details
        finding_info = get_finding_details(finding_id)

        # Log the finding info response
        with open(os.path.join(TMP_DIR, f'{timestamp}_finding_info.json'), 'w') as f:
            f.write(json.dumps(finding_info, indent=2) if isinstance(finding_info, dict) else str(finding_info))

        # Validate finding retrieval
        if isinstance(finding_info, dict) and "error" in finding_info:
            error_msg = f"Failed to retrieve finding details for ID: {finding_id}. Error: {finding_info['error']}"
            logger.error(error_msg)
            return json.dumps({
                "error": "Finding retrieval failed",
                "details": error_msg,
                "status": "error",
                "reason": "Could not access finding details"
            }, indent=2)

        if not isinstance(finding_info, dict) or not finding_info.get("finding"):
            error_msg = f"Invalid finding data retrieved for ID: {finding_id}"
            logger.error(error_msg)
            return json.dumps({
                "error": "Invalid finding data",
                "details": error_msg,
                "status": "error",
                "reason": "Finding data is malformed"
            }, indent=2)

        finding = finding_info["finding"]
        source_code = finding_info.get("source_code", "")
        file_info = finding_info.get("file_info", {})

        # Get the QA consultant prompt
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_file = os.path.join(current_dir, "prompts", "qa_consultant_review.txt")
        
        try:
            with open(prompt_file, 'r') as f:
                prompt_content = f.read()
        except FileNotFoundError:
            error_msg = f"QA consultant prompt file '{prompt_file}' not found"
            logger.error(error_msg)
            return json.dumps({
                "error": "QA prompt template not found",
                "details": error_msg,
                "status": "error",
                "reason": "System configuration error"
            }, indent=2)

        # Format finding details for the prompt
        finding_details = f"""
Finding ID: {finding_id}
Type: {finding.get('type', 'Unknown')}
Description: {finding.get('description', 'No description')}
Severity: {finding.get('severity', 'Unknown')}
Severity Reason: {finding.get('severity_reason', 'No reason provided')}
Line Number: {finding.get('line_number', 'Unknown')}
Current Status: {finding.get('status', 'Unknown')}
Recommendation: {finding.get('recommendation', 'No recommendation')}
Code Content: {finding.get('code_content', 'No code content')}
        """

        # Compose the prompt for the AI model
        file_name = file_info.get('file_name', 'Unknown')
        file_path = file_info.get('file_path', 'Unknown')
        
        ai_prompt_message = f"""QA Security Consultant Review Request:

File Information:
- File Name: {file_name}
- File Path: {file_path}

Finding Details:
{finding_details}

{prompt_content}

Full Source Code:
{source_code}
"""
        
        # Log the formatted prompt
        with open(os.path.join(TMP_DIR, f'{timestamp}_qa_prompt.txt'), 'w') as f:
            f.write(ai_prompt_message)
        
        try:
            # Get LLM from builder
            llm = await builder.get_llm(llm_name=config.llm, wrapper_type=LLMFrameworkEnum.LANGCHAIN)
            
            # Get response from LLM
            logger.info(f"Sending QA review request to LLM for finding_id: {finding_id}")
            response = await llm.apredict(ai_prompt_message)
            
            # Log the raw response
            with open(os.path.join(TMP_DIR, f'{timestamp}_qa_response.txt'), 'w') as f:
                f.write(str(response))
            
            # Process the response - clean up markdown code blocks if present
            response_text = str(response).strip()
            response_json = response_text.replace("```json", "").replace("```", "").strip()
            
            # Log the cleaned JSON response
            with open(os.path.join(TMP_DIR, f'{timestamp}_qa_response_json.txt'), 'w') as f:
                f.write(response_json)
            
            # Use smart_parse to extract JSON from the response
            json_response = smart_parse(response_text)
            
            # Log the parsed response for debugging
            with open(os.path.join(TMP_DIR, f'{timestamp}_qa_parsed_response.json'), 'w') as f:
                f.write(json.dumps(json_response, indent=2))
                
            # Validate and process the QA response
            if not isinstance(json_response, dict):
                logger.error(f"QA response is not a valid JSON object: {type(json_response).__name__}")
                return json.dumps({
                    "error": "Invalid QA response format",
                    "details": "QA consultant returned non-JSON response",
                    "status": "error",
                    "reason": "System error in QA analysis",
                    "raw_response": response_text
                }, indent=2)

            # Extract required fields from QA response
            qa_status = json_response.get("status", "confirmed")
            qa_reason = json_response.get("reason", "QA review completed")
            is_false_positive = json_response.get("is_false_positive", False)
            confidence = json_response.get("confidence", "medium")
            
            # Validate status values
            valid_statuses = ["confirmed", "false_positive", "needs_review"]
            if qa_status not in valid_statuses:
                logger.warning(f"Invalid status '{qa_status}' from QA, defaulting to 'confirmed'")
                qa_status = "confirmed"

            # If marked as false positive, set the status accordingly
            if is_false_positive and qa_status != "false_positive":
                qa_status = "false_positive"

            # Update the finding if status changed
            if qa_status != finding.get("status"):
                logger.info(f"Updating finding {finding_id} status from '{finding.get('status')}' to '{qa_status}'")
                
                # Call the helper function to update finding status
                from open_code_review.helper_tools import update_finding_status
                update_result = update_finding_status(finding_id, qa_status, qa_reason)
                
                # Log update result
                with open(os.path.join(TMP_DIR, f'{timestamp}_qa_update_result.json'), 'w') as f:
                    f.write(json.dumps(update_result, indent=2) if isinstance(update_result, dict) else str(update_result))
                
                if isinstance(update_result, dict) and "error" in update_result:
                    logger.error(f"Failed to update finding status: {update_result['error']}")
                    return json.dumps({
                        "error": "Failed to update finding",
                        "details": update_result["error"],
                        "status": qa_status,
                        "reason": qa_reason,
                        "qa_analysis": json_response
                    }, indent=2)
            
            # Format the successful result
            result = {
                "finding_id": finding_id,
                "status": qa_status,
                "reason": qa_reason,
                "is_false_positive": is_false_positive,
                "confidence": confidence,
                "qa_analysis": json_response,
                "original_finding": finding,
                "updated": qa_status != finding.get("status"),
                "raw_response": response_text
            }
            
            logger.info(f"QA review completed for finding {finding_id}: status={qa_status}, confidence={confidence}")
            
            # Return the formatted JSON response
            return json.dumps(result, indent=2)
                
        except Exception as e:
            error_msg = f"Error generating QA review: {str(e)}"
            logger.error(f"{error_msg}\n{traceback.format_exc()}")
            return json.dumps({
                "error": "QA review generation failed",
                "details": error_msg,
                "status": "error",
                "reason": "System error during QA analysis"
            }, indent=2)

    try:
        yield FunctionInfo.from_fn(
            _response_fn,
            description=("This tool performs QA review of security findings to validate their accuracy. "
                       "It acts as an AI Security Consultant that reviews existing findings against "
                       "the source code to determine if they are valid security issues or false positives. "
                       "Provide the finding_id to identify which finding should be reviewed.")
        )
    except GeneratorExit:
        logger.info("QA consultant function exited early!")
    finally:
        logger.info("Cleaning up QA consultant workflow.")