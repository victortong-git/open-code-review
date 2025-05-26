import json
import logging
import re

logger = logging.getLogger(__name__)

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
