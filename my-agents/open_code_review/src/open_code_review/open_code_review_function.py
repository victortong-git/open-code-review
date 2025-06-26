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
        
        # Parse the input message as JSON first
        try:
            input_data = json.loads(input_message)
            file_id = input_data.get("file_id")
            review_type = input_data.get("review_type")
        except json.JSONDecodeError:
            # Fallback to regex if not a valid JSON (e.g., direct prompt from user)
            file_id_match = re.search(r"file_id\s*:\s*([0-9]+)", input_message)
            review_type_match = re.search(r"review_type\s*:\s*([a-zA-Z0-9_\-]+)", input_message)
            
            file_id = file_id_match.group(1) if file_id_match else None
            review_type = review_type_match.group(1) if review_type_match else None

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

        # Call the helper function to retrieve the full API payload for the file
        from open_code_review.helper_tools import get_source_code
        file_info = get_source_code(file_id)

        # Log the file info response
        with open(os.path.join(TMP_DIR, f'{timestamp}_file_info.json'), 'w') as f:
            f.write(json.dumps(file_info, indent=2) if isinstance(file_info, dict) else str(file_info))

        # Extract the source code content if available
        if isinstance(file_info, dict) and "content" in file_info:
            source_code = file_info["content"]
            file_path = file_info.get("file_path", "Unknown")
            file_name = file_info.get("file_name", "Unknown")
        else:
            error_msg = f"Failed to retrieve source code for file ID: {file_id}"
            if isinstance(file_info, dict) and "error" in file_info:
                error_msg = f"{error_msg}. Error: {file_info['error']}"
            logger.error(error_msg)
            return json.dumps({
                "error": "Source code retrieval failed",
                "details": error_msg,
                "issues_found": False,
                "findings": []
            }, indent=2)

        # Get the prompt from prompts/ folder
        current_dir = os.path.dirname(os.path.abspath(__file__))
        prompt_file = os.path.join(current_dir, "prompts", f"{review_type}.txt")
        
        try:
            with open(prompt_file, 'r') as f:
                prompt_content = f.read()
        except FileNotFoundError:
            error_msg = f"Prompt file '{prompt_file}' not found"
            logger.error(error_msg)
            return json.dumps({
                "error": "Prompt template not found",
                "details": error_msg,
                "issues_found": False,
                "findings": []
            }, indent=2)

        # Compose the prompt for the AI model
        prompt_message = f"File ID: {file_id}\nFile Path: {file_path}\nFile Name: {file_name}\nReview Type: {review_type}\n\n{prompt_content}"
        ai_prompt_message = f"Source Code Review Request:\n\n{prompt_message}\n\nSource Code:\n{source_code}"
        
        # Log the formatted prompt
        with open(os.path.join(TMP_DIR, f'{timestamp}_prompt.txt'), 'w') as f:
            f.write(ai_prompt_message)
        
        try:
            # Get LLM from builder
            llm = await builder.get_llm(llm_name=config.llm, wrapper_type=LLMFrameworkEnum.LANGCHAIN)
            
            # Get response from LLM
            logger.info(f"Sending request to LLM for file_id: {file_id}, review_type: {review_type}")
            response = await llm.apredict(ai_prompt_message)
            
            # Log the raw response
            with open(os.path.join(TMP_DIR, f'{timestamp}_response.txt'), 'w') as f:
                f.write(str(response))
            
            # Process the response - clean up markdown code blocks if present
            response_text = str(response).strip()
            response_json = response_text.replace("```json", "").replace("```", "").strip()
            
            # Log the cleaned JSON response
            with open(os.path.join(TMP_DIR, f'{timestamp}_response_json.txt'), 'w') as f:
                f.write(response_json)
            
            # Use smart_parse to extract JSON from the response
            json_response = smart_parse(response_text)
            
            # Import the create_finding_record function
            from open_code_review.helper_tools import create_finding_record
            
            # Log the raw response for debugging
            with open(os.path.join(TMP_DIR, f'{timestamp}_parsed_response.json'), 'w') as f:
                f.write(json.dumps(json_response, indent=2))
                
            # Log the type of response received
            logger.info(f"Response type: {type(json_response).__name__}")
            
            # Handle both array and object responses correctly
            if isinstance(json_response, list):
                logger.info(f"Received array response with {len(json_response)} item(s)")
            elif isinstance(json_response, dict):
                logger.info("Received dictionary response")
            else:
                logger.error(f"Unexpected response type: {type(json_response).__name__}")
                json_response = {}
            
            # Process findings - handle multiple formats
            findings = []
            
            # Case 1: Direct array response - the LLM returned an array at the top level
            if isinstance(json_response, list):
                logger.info("LLM returned an array at the top level")
                findings = json_response
            
            # Case 2: The LLM returned a 'findings' array nested in a dictionary
            elif isinstance(json_response, dict) and 'findings' in json_response and isinstance(json_response['findings'], list):
                logger.info("LLM returned findings array in a dictionary")
                findings = json_response['findings']
            
            # Case 3: The LLM returned a single finding at the root level
            elif isinstance(json_response, dict) and 'type' in json_response and 'description' in json_response:
                logger.info("LLM returned a single finding object at the root level")
                findings = [json_response]  # Convert to list with one item
            
            # Case 4: Extract findings from recommendations if findings array is empty
            elif isinstance(json_response, dict) and not findings and 'recommendations' in json_response and isinstance(json_response['recommendations'], list):
                logger.info("Creating findings from recommendations")
                recommendations = json_response['recommendations']
                if len(recommendations) > 0:
                    findings = [{
                        'type': 'Code Quality Issue',
                        'description': 'Issue found during code review',
                        'severity': 'medium',
                        'line_number': json_response.get('line_number', None),
                        'recommendation': ', '.join(recommendations) if isinstance(recommendations, list) else recommendations,
                        'code_content': json_response.get('code_content', ''),
                        'status': 'new'  # Adding default status as "new"
                    }]
            
            logger.info(f"Processed findings: Found {len(findings)} finding(s)")
            
            saved_findings = []
            finding_errors = []
            
            # Log the findings we're about to process
            with open(os.path.join(TMP_DIR, f'{timestamp}_findings_to_process.json'), 'w') as f:
                f.write(json.dumps(findings, indent=2))
            
            # Process each finding and save it to the database
            for finding in findings:
                # Ensure the finding has the required fields
                if not isinstance(finding, dict):
                    finding_errors.append("Invalid finding format: not a dictionary")
                    continue
                    
                # Add file_id to the finding if it's not already there
                if 'file_id' not in finding:
                    finding['file_id'] = file_id
                
                # Convert recommendation from list to string if needed
                if 'recommendation' in finding and isinstance(finding['recommendation'], list):
                    finding['recommendation'] = ', '.join(finding['recommendation'])
                
                # Add required fields with defaults if missing
                required_fields = {
                    'type': 'Code Quality Issue',
                    'description': 'Not provided',
                    'severity': 'medium',
                    'severity_reason': 'This issue affects code quality',
                    'line_number': 1,
                    'recommendation': 'Not provided',
                    'code_content': '',
                    'status': 'new'  # Always set status to "new" as requested
                }
                
                # Always set status to "new" regardless of what's in the finding
                finding['status'] = 'new'
                
                # Process other required fields
                for field, default_value in required_fields.items():
                    if field != 'status' and (field not in finding or finding[field] is None):
                        finding[field] = default_value
                
                # Ensure line_number is an integer
                try:
                    finding['line_number'] = int(finding['line_number'])
                except (ValueError, TypeError):
                    finding['line_number'] = 1
                
                # Handle recommendation field - ensure it's always a string
                if isinstance(finding.get('recommendation'), list):
                    finding['recommendation'] = ', '.join(finding['recommendation'])
                elif finding.get('recommendation') is None:
                    finding['recommendation'] = 'Not provided'
                
                # Make sure severity_reason is a string, not null or undefined
                if finding.get('severity_reason') is None or not isinstance(finding['severity_reason'], str):
                    # Generate a default severity reason based on severity
                    severity_descriptions = {
                        'critical': 'This is a critical issue that could lead to system compromise.',
                        'high': 'This is a high severity issue that poses significant security risks.',
                        'medium': 'This is a medium severity issue that should be addressed.',
                        'low': 'This is a low severity issue that represents a minor risk.'
                    }
                    severity = finding.get('severity', 'medium').lower()
                    if severity in severity_descriptions:
                        finding['severity_reason'] = severity_descriptions[severity]
                    else:
                        finding['severity_reason'] = 'This issue should be addressed based on its severity level.'
                
                # Final validation of required fields before saving
                required_keys = ['file_id', 'type', 'description', 'severity', 'severity_reason', 'line_number', 'recommendation', 'code_content']
                missing_keys = [key for key in required_keys if key not in finding or finding[key] is None]
                
                if missing_keys:
                    error_msg = f"Cannot save finding due to missing required fields: {', '.join(missing_keys)}"
                    logger.error(error_msg)
                    finding_errors.append(error_msg)
                    continue
                
                # One more check for empty or null severity_reason
                if not finding['severity_reason'] or finding['severity_reason'] == 'null':
                    finding['severity_reason'] = f"This is a {finding['severity']} severity issue that requires attention."
                
                # Log the finding we're about to save with full details
                logger.info(f"Saving finding with severity_reason: '{finding.get('severity_reason')}'")
                logger.info(f"Full finding payload: {json.dumps(finding)}")
                
                # Create a timestamp for this specific finding
                finding_timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S_%f")[:-3]
                
                # Write the exact finding payload to a file for debugging
                with open(os.path.join(TMP_DIR, f'{finding_timestamp}_exact_finding_payload.json'), 'w') as f:
                    json.dump(finding, f, indent=2)
                
                # Call create_finding_record to save the finding
                result = create_finding_record(finding)
                
                # Check if the finding was saved successfully
                if isinstance(result, dict) and 'error' in result:
                    error_msg = f"Failed to save finding: {result.get('error', 'Unknown error')}"
                    details = result.get('details', '')
                    payload = result.get('payload_sent', {})
                    
                    # Log detailed error information
                    logger.error(f"{error_msg}\nDetails: {details}\nPayload sent: {json.dumps(payload)}")
                    finding_errors.append({
                        "error": error_msg,
                        "details": details,
                        "payload": payload
                    })
                    
                    # Write detailed error to file
                    with open(os.path.join(TMP_DIR, f'{timestamp}_finding_error_{len(finding_errors)}.json'), 'w') as f:
                        f.write(json.dumps(result, indent=2))
                else:
                    logger.info(f"Successfully saved finding. Result: {json.dumps(result) if isinstance(result, dict) else str(result)}")
                    saved_findings.append(result)
            
            # Log the results of saving the findings
            with open(os.path.join(TMP_DIR, f'{timestamp}_saved_findings.json'), 'w') as f:
                f.write(json.dumps(saved_findings, indent=2))
                
            if finding_errors:
                with open(os.path.join(TMP_DIR, f'{timestamp}_finding_errors.json'), 'w') as f:
                    f.write(json.dumps(finding_errors, indent=2))
            
            # Format the result with proper structure
            result = {
                "file_id": file_id,
                "issues_found": False,  # Default value
                "findings": findings,
                "saved_findings": saved_findings,
                "finding_errors": finding_errors,
                "recommendations": [],  # Default value
                "code_content": "",  # Default value
                "raw_response": response_text
            }
            
            # Only try to get attributes from json_response if it's a dictionary
            if isinstance(json_response, dict):
                result["issues_found"] = json_response.get('issues_found', len(findings) > 0)
                result["recommendations"] = json_response.get('recommendations', [])
                result["code_content"] = json_response.get('code_content', '')
            else:
                # If json_response is a list, we already have the findings
                result["issues_found"] = len(findings) > 0
            
            # Return the formatted JSON response
            return json.dumps(result, indent=2)
                
        except Exception as e:
            error_msg = f"Error generating code review: {str(e)}"
            logger.error(f"{error_msg}\n{traceback.format_exc()}")
            return json.dumps({
                "error": "Code review generation failed",
                "details": error_msg,
                "issues_found": False,
                "findings": []
            }, indent=2)

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