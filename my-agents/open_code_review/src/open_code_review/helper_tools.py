import requests
import json
from typing import Any, Dict

BASE_URL = "http://backend:8001"

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


def get_finding_details(finding_id: str) -> Any:
    """
    Retrieve finding details including source code for a given finding ID from the backend API.
    Args:
        finding_id: The ID of the finding to retrieve
    Returns:
        A dictionary containing finding details, source code, and file info, or error details.
    """
    try:
        finding_id_int = int(finding_id)
    except ValueError:
        return {"error": "Invalid finding ID", "details": f"Finding ID must be a number, received: {finding_id}"}
    
    # Get finding details
    finding_api_url = f"{BASE_URL}/api/findings/{finding_id_int}"
    try:
        finding_response = requests.get(finding_api_url, timeout=30)
        if finding_response.status_code != 200:
            return {"error": f"Finding API request failed with status code: {finding_response.status_code}", 
                   "details": f"Could not retrieve finding with ID: {finding_id}", 
                   "response_text": finding_response.text}
        
        finding_data = finding_response.json()
        
        # Get the file_id from the finding
        file_id = finding_data.get("file_id")
        if not file_id:
            return {"error": "Finding has no associated file", 
                   "details": f"Finding {finding_id} does not have a file_id", 
                   "finding": finding_data}
        
        # Get the source code using the existing function
        file_info = get_source_code(str(file_id))
        if isinstance(file_info, dict) and "error" in file_info:
            return {"error": "Failed to retrieve source code", 
                   "details": file_info.get("details", "Unknown error"), 
                   "finding": finding_data,
                   "file_error": file_info}
        
        # Return combined information
        return {
            "finding": finding_data,
            "source_code": file_info.get("content", ""),
            "file_info": {
                "file_id": file_id,
                "file_name": file_info.get("file_name", "Unknown"),
                "file_path": file_info.get("file_path", "Unknown"),
                "md5": file_info.get("md5", "")
            }
        }
        
    except Exception as e:
        return {"error": f"Unexpected error retrieving finding details: {str(e)}", 
               "details": f"Exception occurred while processing finding ID: {finding_id}"}


def update_finding_status(finding_id: str, status: str, reason: str) -> Any:
    """
    Update a finding's status and QA review reason.
    Args:
        finding_id: The ID of the finding to update
        status: The new status value
        reason: The QA review reason
    Returns:
        The API response as a dict, or error details.
    """
    try:
        finding_id_int = int(finding_id)
    except ValueError:
        return {"error": "Invalid finding ID", "details": f"Finding ID must be a number, received: {finding_id}"}
    
    api_url = f"{BASE_URL}/api/findings/{finding_id_int}"
    payload = {
        "status": status,
        "qa_review_reason": reason
    }
    
    try:
        response = requests.put(api_url, json=payload, timeout=30)
        
        if response.status_code == 200:
            try:
                return response.json()
            except Exception as e:
                return {"error": "API response not JSON", 
                       "response_text": response.text,
                       "details": f"Failed to parse response: {str(e)}"}
        else:
            return {"error": f"API request failed with status code: {response.status_code}", 
                   "details": f"Could not update finding with ID: {finding_id}", 
                   "response_text": response.text,
                   "payload_sent": payload}
                   
    except Exception as e:
        return {"error": f"Unexpected error updating finding: {str(e)}", 
               "details": f"Exception occurred while updating finding ID: {finding_id}",
               "payload_sent": payload}