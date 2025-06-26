import requests
import json
from typing import Any, Dict
import logging
import re
import os
import traceback
from datetime import datetime

BASE_URL = "http://backend:8001"
AIQTOOLKIT_URL = "http://aiqtoolkit:8000"

logger = logging.getLogger(__name__)

TMP_DIR = "/app/logs/"
os.makedirs(TMP_DIR, exist_ok=True)

def get_source_code(file_id: str) -> Any:
    """
    Retrieve source code content for a given file ID from the backend API.
    Args:
        file_id: The ID of the file to retrieve
    Returns:
        The file content as a string, or a dict with error details.
    """
    try:
        file_id_int = int(file_id)
    except ValueError:
        return {"error": "Invalid file ID", "details": f"File ID must be a number, received: {file_id}"}
    api_url = f"{BASE_URL}/api/files/{file_id_int}"
    try:
        response = requests.get(api_url, timeout=30)
        if response.status_code == 200:
            data = response.json()
            # Return the full API payload, not just content
            return data
        else:
            return {"error": f"API request failed with status code: {response.status_code}", "details": f"Could not retrieve file with ID: {file_id}", "response_text": response.text}
    except Exception as e:
        return {"error": f"Unexpected error retrieving source code: {str(e)}", "details": f"Exception occurred while processing file ID: {file_id}"}

def create_finding_record(finding: Dict[str, Any]) -> Any:
    """
    Create a finding record in the backend system.
    Args:
        finding: A dictionary containing the finding details (must include file_id, type, description, severity, severity_reason, line_number, recommendation, code_content)
    Returns:
        The API response as a dict, or error details.
    """
    api_url = f"{BASE_URL}/api/findings"
    max_retries = 3
    retry_delay = 2  # seconds
    import time
    import copy
    
    # Create a deep copy to avoid modifying the original
    payload = copy.deepcopy(finding)
    
    # Validate required fields
    required_fields = ['file_id', 'type', 'description', 'severity']
    missing_fields = [field for field in required_fields if not payload.get(field)]
    if missing_fields:
        return {
            "error": "Missing required fields", 
            "details": f"The following required fields are missing: {', '.join(missing_fields)}",
            "payload_sent": payload
        }
    
    # Convert file_id to integer
    if 'file_id' in payload:
        try:
            payload['file_id'] = int(payload['file_id'])
        except ValueError:
            return {"error": "Invalid file ID", "details": f"File ID must be a number, received: {payload['file_id']}"}
    
    # Ensure severity_reason is not null or undefined
    if payload.get('severity_reason') is None or payload.get('severity_reason') == "null":
        payload['severity_reason'] = f"This is a {payload.get('severity', 'medium')} severity issue that requires attention."
    
    # Always set status to "new" as per requirement
    payload['status'] = 'new'
    
    # Format recommendation if it's a list
    if isinstance(payload.get('recommendation'), list):
        payload['recommendation'] = ', '.join(payload['recommendation'])
    
    # Log the payload before sending
    print(f"Sending payload to API: {json.dumps(payload)}")
    
    for attempt in range(max_retries):
        try:
            # Log detailed request information
            print(f"API URL: {api_url}")
            print(f"Request headers: {{'Content-Type': 'application/json'}}")
            
            # Send the request
            response = requests.post(api_url, json=payload, timeout=30)
            
            # Log the response
            print(f"API Response status: {response.status_code}")
            print(f"API Response headers: {response.headers}")
            print(f"API Response content: {response.text[:500]}") # First 500 chars to avoid log flooding
            
            if response.status_code in (200, 201):
                try:
                    return response.json()
                except Exception as e:
                    print(f"Failed to parse JSON response: {str(e)}")
                    return {"error": "API response not JSON", "response_text": response.text}
            if attempt < max_retries - 1:
                print(f"Request failed, retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                continue
            else:
                print(f"All {max_retries} attempts failed. Giving up.")
                return {"error": f"API request failed after {max_retries} attempts. Last status code: {response.status_code}", "details": "Could not create finding record.", "response_text": response.text, "payload_sent": payload}
        except requests.exceptions.RequestException as req_err:
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
            else:
                return {"error": f"Request failed after {max_retries} attempts", "details": f"Network or request error: {str(req_err)}", "payload_sent": finding}

def smart_parse(response_text: str) -> dict:
    """
    Parse a response from an LLM into a JSON structure.
    This can handle several different formats including:
    - Clean JSON objects
    - JSON objects surrounded by markdown code blocks
    - Text that contains a JSON object somewhere inside it
    
    Args:
        response_text: The text response from the LLM
    
    Returns:
        A dictionary parsed from the JSON in the response.
        Returns an empty dict if parsing fails.
    """
    # Clean the input string
    text = str(response_text).strip()
    
    # Try finding and extracting a JSON block from markdown
    json_block_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    matches = re.findall(json_block_pattern, text)
    
    if matches:
        # Try each markdown code block that might contain JSON
        for match in matches:
            try:
                return json.loads(match.strip())
            except json.JSONDecodeError:
                continue
    
    # If no code blocks or none contained valid JSON, try the whole text
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Try to find a JSON object embedded in text using regex
    try:
        json_pattern = r"\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}"
        match = re.search(json_pattern, text)
        if match:
            return json.loads(match.group(0))
    except (json.JSONDecodeError, AttributeError):
        pass

    # If all attempts failed, log the issue and return empty dict
    logger.warning(f"Could not parse response as JSON: {text[:200]}...")
    return {}

async def analyze_code(file_id: str, review_type: str):
    """
    Process the input message, extract file ID and review type, retrieve the source code,
    and generate an AI review of the code.
    
    Args:
        file_id: The ID of the file to review
        review_type: The type of review to perform
    
    Returns:
        A JSON string containing the review results
    """
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S_%f")[:-3]

    file_info = get_source_code(file_id)

    with open(os.path.join(TMP_DIR, f'{timestamp}_file_info.json'), 'w') as f:
        f.write(json.dumps(file_info, indent=2) if isinstance(file_info, dict) else str(file_info))

    if isinstance(file_info, dict) and "content" in file_info:
        source_code = file_info["content"]
        file_path = file_info.get("file_path", "Unknown")
        file_name = file_info.get("file_name", "Unknown")
    else:
        error_msg = f"Failed to retrieve source code for file ID: {file_id}"
        if isinstance(file_info, dict) and "error" in file_info:
            error_msg = f"{error_msg}. Error: {file_info['error']}"
        logger.error(error_msg)
        return {
            "error": "Source code retrieval failed",
            "details": error_msg,
            "issues_found": False,
            "findings": []
        }

    current_dir = os.path.dirname(os.path.abspath(__file__))
    prompt_file = os.path.join(current_dir, "prompts", f"{review_type}.txt")
    
    try:
        with open(prompt_file, 'r') as f:
            prompt_content = f.read()
    except FileNotFoundError:
        error_msg = f"Prompt file '{prompt_file}' not found"
        logger.error(error_msg)
        return {
            "error": "Prompt template not found",
            "details": error_msg,
            "issues_found": False,
            "findings": []
        }

    prompt_message = f"File ID: {file_id}\nFile Path: {file_path}\nFile Name: {file_name}\nReview Type: {review_type}\n\n{prompt_content}"
    ai_prompt_message = f"Source Code Review Request:\n\n{prompt_message}\n\nSource Code:\n{source_code}"
    
    with open(os.path.join(TMP_DIR, f'{timestamp}_prompt.txt'), 'w') as f:
        f.write(ai_prompt_message)
    
    try:
        # Call the aiqtoolkit service for LLM response
        llm_api_url = f"{AIQTOOLKIT_URL}/chat"
        llm_payload = {"messages": [{"role": "user", "content": ai_prompt_message}], "max_tokens": 1000, "temperature": 0.7}
        
        logger.info(f"Sending payload to aiqtoolkit: {json.dumps(llm_payload)}")
        llm_response = requests.post(llm_api_url, json=llm_payload, timeout=300) # Increased timeout to 300 seconds
        llm_response.raise_for_status() # Raise an exception for HTTP errors
        
        response_text = llm_response.text
        
        with open(os.path.join(TMP_DIR, f'{timestamp}_response.txt'), 'w') as f:
            f.write(str(response_text))
        
        response_json = response_text.replace("```json", "").replace("```", "").strip()
        
        with open(os.path.join(TMP_DIR, f'{timestamp}_response_json.txt'), 'w') as f:
            f.write(response_json)
        
        json_response = smart_parse(response_text)
        
        with open(os.path.join(TMP_DIR, f'{timestamp}_parsed_response.json'), 'w') as f:
            f.write(json.dumps(json_response, indent=2))
            
        logger.info(f"Response type: {type(json_response).__name__}")
        
        if isinstance(json_response, list):
            logger.info(f"Received array response with {len(json_response)} item(s)")
        elif isinstance(json_response, dict):
            logger.info("Received dictionary response")
        else:
            logger.error(f"Unexpected response type: {type(json_response).__name__}")
            json_response = {}
        
        findings = []
        
        if isinstance(json_response, list):
            logger.info("LLM returned an array at the top level")
            findings = json_response
        
        elif isinstance(json_response, dict) and 'findings' in json_response and isinstance(json_response['findings'], list):
            logger.info("LLM returned findings array in a dictionary")
            findings = json_response['findings']
        
        elif isinstance(json_response, dict) and 'type' in json_response and 'description' in json_response:
            logger.info("LLM returned a single finding object at the root level")
            findings = [json_response]
        
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
                    'status': 'new'
                }]
        
        logger.info(f"Processed findings: Found {len(findings)} finding(s)")
        
        saved_findings = []
        finding_errors = []
        
        with open(os.path.join(TMP_DIR, f'{timestamp}_findings_to_process.json'), 'w') as f:
            f.write(json.dumps(findings, indent=2))
        
        for finding in findings:
            if not isinstance(finding, dict):
                finding_errors.append("Invalid finding format: not a dictionary")
                continue
                
            if 'file_id' not in finding:
                finding['file_id'] = file_id
            
            if 'recommendation' in finding and isinstance(finding['recommendation'], list):
                finding['recommendation'] = ', '.join(finding['recommendation'])
            
            required_fields = {
                'type': 'Code Quality Issue',
                'description': 'Not provided',
                'severity': 'medium',
                'severity_reason': 'This issue affects code quality',
                'line_number': 1,
                'recommendation': 'Not provided',
                'code_content': '',
                'status': 'new'
            }
            
            finding['status'] = 'new'
            
            for field, default_value in required_fields.items():
                if field != 'status' and (field not in finding or finding[field] is None):
                    finding[field] = default_value
            
            try:
                finding['line_number'] = int(finding['line_number'])
            except (ValueError, TypeError):
                finding['line_number'] = 1
            
            if isinstance(finding.get('recommendation'), list):
                finding['recommendation'] = ', '.join(finding['recommendation'])
            elif finding.get('recommendation') is None:
                finding['recommendation'] = 'Not provided'
            
            if finding.get('severity_reason') is None or not isinstance(finding['severity_reason'], str):
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
            
            required_keys = ['file_id', 'type', 'description', 'severity', 'severity_reason', 'line_number', 'recommendation', 'code_content']
            missing_keys = [key for key in required_keys if key not in finding or finding[key] is None]
            
            if missing_keys:
                error_msg = f"Cannot save finding due to missing required fields: {', '.join(missing_keys)}"
                logger.error(error_msg)
                finding_errors.append(error_msg)
                continue
            
            if not finding['severity_reason'] or finding['severity_reason'] == 'null':
                finding['severity_reason'] = f"This is a {finding['severity']} severity issue that requires attention."
            
            logger.info(f"Saving finding with severity_reason: '{finding.get('severity_reason')}'")
            logger.info(f"Full finding payload: {json.dumps(finding)}")
            
            finding_timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S_%f")[:-3]
            
            with open(os.path.join(TMP_DIR, f'{finding_timestamp}_exact_finding_payload.json'), 'w') as f:
                json.dump(finding, f, indent=2)
            
            result = create_finding_record(finding)
            
            if isinstance(result, dict) and 'error' in result:
                error_msg = f"Failed to save finding: {result.get('error', 'Unknown error')}"
                details = result.get('details', '')
                payload = result.get('payload_sent', {})
                
                logger.error(f"{error_msg}\nDetails: {details}\nPayload sent: {json.dumps(payload)}")
                finding_errors.append({
                    "error": error_msg,
                    "details": details,
                    "payload": payload
                })
                
                with open(os.path.join(TMP_DIR, f'{timestamp}_finding_error_{len(finding_errors)}.json'), 'w') as f:
                    f.write(json.dumps(result, indent=2))
            else:
                logger.info(f"Successfully saved finding. Result: {json.dumps(result) if isinstance(result, dict) else str(result)}")
                saved_findings.append(result)
        
        with open(os.path.join(TMP_DIR, f'{timestamp}_saved_findings.json'), 'w') as f:
            f.write(json.dumps(saved_findings, indent=2))
            
        if finding_errors:
            with open(os.path.join(TMP_DIR, f'{timestamp}_finding_errors.json'), 'w') as f:
                f.write(json.dumps(finding_errors, indent=2))
        
        result = {
            "file_id": file_id,
            "issues_found": False,
            "findings": findings,
            "saved_findings": saved_findings,
            "finding_errors": finding_errors,
            "recommendations": [],
            "code_content": "",
            "raw_response": response_text
        }
        
        if isinstance(json_response, dict):
            result["issues_found"] = json_response.get('issues_found', len(findings) > 0)
            result["recommendations"] = json_response.get('recommendations', [])
            result["code_content"] = json_response.get('code_content', '')
        else:
            result["issues_found"] = len(findings) > 0
        
        return result
            
    except Exception as e:
        error_msg = f"Error generating code review: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return {
            "error": "Code review generation failed",
            "details": error_msg,
            "issues_found": False,
            "findings": []
        }