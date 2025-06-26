import requests
from typing import Any, Dict

BASE_URL = "http://mcp_server:8002"

def get_source_code(file_id: str) -> Any:
    """
    Retrieve source code content for a given file ID from the MCP server.
    Args:
        file_id: The ID of the file to retrieve
    Returns:
        The file content as a string, or a dict with error details.
    """
    api_url = f"{BASE_URL}/mcp/source_code/{file_id}"
    try:
        response = requests.get(api_url, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status code: {response.status_code}", "details": f"Could not retrieve file with ID: {file_id}", "response_text": response.text}
    except Exception as e:
        return {"error": f"Unexpected error retrieving source code: {str(e)}", "details": f"Exception occurred while processing file ID: {file_id}"}

def create_finding_record(finding: Dict[str, Any]) -> Any:
    """
    Create a finding record in the backend system via the MCP server.
    Args:
        finding: A dictionary containing the finding details
    Returns:
        The API response as a dict, or error details.
    """
    api_url = f"{BASE_URL}/mcp/findings"
    try:
        response = requests.post(api_url, json=finding, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API request failed with status code: {response.status_code}", "details": "Could not create finding record.", "response_text": response.text, "payload_sent": finding}
    except Exception as e:
        return {"error": f"Unexpected error creating finding: {str(e)}", "details": f"Exception occurred while creating finding: {finding}"}