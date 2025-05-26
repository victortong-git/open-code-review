"""
A10:2021 – Server-Side Request Forgery (SSRF)

This example demonstrates Server-Side Request Forgery (SSRF) vulnerabilities where
an application fetches remote resources based on user-provided URLs without 
proper validation, potentially allowing attackers to:
- Access internal services
- Scan internal networks
- Retrieve metadata from cloud instances
- Access local files
- Perform port scanning
- Bypass firewalls
"""

from flask import Flask, request, Response, jsonify
import requests
import urllib.parse
import json
import os
import socket
import xml.etree.ElementTree as ET

app = Flask(__name__)

# Mock metadata service responses
MOCK_AWS_METADATA = {
    "/latest/meta-data/": "ami-id\nami-launch-index\nami-manifest-path\nblock-device-mapping/\nhostname\niam/\ninstance-id\ninstance-type\nlocal-hostname\nlocal-ipv4\nmac\nmetrics/\nnetwork/\nplacement/\nprofile\npublic-hostname\npublic-ipv4\nreservation-id\nsecurity-groups\nservices/",
    "/latest/meta-data/iam/security-credentials/": "admin-role",
    "/latest/meta-data/iam/security-credentials/admin-role": {"AccessKeyId": "AKIA1234567890EXAMPLE", "SecretAccessKey": "secret-key-value", "Token": "security-token-value"}
}

"""
VULNERABILITY: Basic SSRF vulnerability in image proxy
This endpoint takes a URL parameter and fetches the content without validation
"""
@app.route('/proxy/fetch-image')
def fetch_image():
    # Get the URL from the request parameters
    image_url = request.args.get('url')
    
    if not image_url:
        return "No URL provided", 400
    
    try:
        # VULNERABILITY: No URL validation before making the request
        # This could allow accessing internal services or localhost
        response = requests.get(image_url, stream=True)
        
        # Forward the response from the remote server
        return Response(response.raw.read(), 
                       content_type=response.headers['content-type'])
        
    except Exception as e:
        return f"Error fetching image: {str(e)}", 500

"""
VULNERABILITY: SSRF vulnerability in API endpoint
This endpoint makes a request to a remote API without proper validation
"""
@app.route('/api/fetch-data')
def fetch_data():
    # Get the API endpoint from the request
    api_url = request.args.get('endpoint', '')
    
    # VULNERABILITY: Weak validation allows bypassing the check
    # Blocking localhost and 127.0.0.1 but not other local addresses
    if 'localhost' in api_url or '127.0.0.1' in api_url:
        return "Access to local addresses is forbidden", 403
        
    # VULNERABILITY: Could still use 127.0.0.2, 0.0.0.0, 0177.0.0.1, etc.
    # VULNERABILITY: Could still use internal hostnames
    
    try:
        # VULNERABILITY: Making request without proper URL validation
        response = requests.get(api_url)
        return jsonify(response.json())
    except Exception as e:
        return f"Error fetching API data: {str(e)}", 500

"""
VULNERABILITY: SSRF in XML processing (XXE + SSRF)
This endpoint processes XML that could contain external entities
"""
@app.route('/api/process-xml', methods=['POST'])
def process_xml():
    if 'xml' not in request.files:
        return "No XML file provided", 400
        
    xml_file = request.files['xml']
    
    try:
        # VULNERABILITY: Parsing XML with external entities enabled
        # Could allow XXE attacks leading to SSRF
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        # Process the XML and return some result
        result = {"elements": len(list(root.iter()))}
        return jsonify(result)
        
    except Exception as e:
        return f"Error processing XML: {str(e)}", 500

"""
VULNERABILITY: SSRF in webhook configuration
This endpoint lets users configure webhooks without proper validation
"""
@app.route('/api/configure-webhook', methods=['POST'])
def configure_webhook():
    data = request.json
    
    if not data or 'webhook_url' not in data:
        return "Invalid request, webhook_url is required", 400
        
    webhook_url = data['webhook_url']
    
    # VULNERABILITY: Insufficient validation - only checks for http(s) scheme
    if not webhook_url.startswith(('http://', 'https://')):
        return "Invalid webhook URL", 400
        
    # VULNERABILITY: No validation of internal network addresses
    # Store webhook configuration
    with open('webhooks.json', 'a') as f:
        f.write(json.dumps({"url": webhook_url}) + "\n")
    
    # VULNERABILITY: Makes a request to "test" the webhook without validation
    try:
        test_result = requests.post(webhook_url, json={"message": "Webhook test"})
        return jsonify({
            "status": "configured",
            "test_status_code": test_result.status_code
        })
    except Exception as e:
        return jsonify({
            "status": "configured",
            "test_error": str(e)
        })

"""
VULNERABILITY: SSRF in PDF generation service
This endpoint generates PDFs from HTML content at a URL
"""
@app.route('/api/generate-pdf')
def generate_pdf():
    url = request.args.get('url')
    
    if not url:
        return "No URL provided", 400
    
    # VULNERABILITY: No validation to prevent access to internal services
    # This would pass content to a command-line PDF tool
    
    # Simulating wkhtmltopdf command execution
    command = f"wkhtmltopdf {url} output.pdf"
    
    # In a real app, this would execute the command
    # os.system(command)  # Vulnerable to command injection and SSRF
    
    return jsonify({
        "status": "generated",
        "command": command,
        "output_file": "output.pdf"
    })

"""
VULNERABILITY: SSRF in cloud metadata service access
This endpoint makes it easy to demonstrate cloud metadata service access
"""
@app.route('/api/cloud-status')
def cloud_status():
    # VULNERABILITY: URL can be modified to access metadata service
    check_url = request.args.get('url', 'https://status.cloud-provider.com/status')
    
    try:
        if check_url.startswith('http://169.254.169.254'):
            # This is a mock for demonstration - simulating AWS metadata service
            path = check_url.replace('http://169.254.169.254', '')
            if path in MOCK_AWS_METADATA:
                if isinstance(MOCK_AWS_METADATA[path], str):
                    return MOCK_AWS_METADATA[path]
                else:
                    return jsonify(MOCK_AWS_METADATA[path])
            else:
                return "Not found", 404
                
        # VULNERABILITY: No validation before making the request
        # In a real app, this would allow accessing the metadata service
        response = requests.get(check_url, timeout=3)
        return response.text
    except requests.exceptions.RequestException as e:
        return f"Error checking cloud status: {str(e)}", 500

"""
VULNERABILITY: SSRF in DNS rebinding scenario
This endpoint fetches content for previews but allows hostname resolution
"""
@app.route('/api/preview-content')
def preview_content():
    url = request.args.get('url')
    
    if not url:
        return "No URL provided", 400
        
    # Parse the URL to extract hostname
    parsed_url = urllib.parse.urlparse(url)
    hostname = parsed_url.hostname
    
    # VULNERABILITY: Initial hostname check but no continuous validation
    # Vulnerable to DNS rebinding attacks - hostname could resolve to 
    # an internal IP after this check passes
    
    try:
        ip_address = socket.gethostbyname(hostname)
        
        # VULNERABILITY: Simple blacklist that can be bypassed
        if ip_address.startswith(('127.', '192.168.', '10.')):
            return "Access to internal addresses is forbidden", 403
            
        # VULNERABILITY: Allowing request after initial check
        # In DNS rebinding, the hostname could now resolve to an internal IP
        response = requests.get(url, timeout=5)
        return response.text
    except Exception as e:
        return f"Error fetching preview: {str(e)}", 500

"""
Example of how to fix SSRF vulnerabilities:

1. Implement proper URL validation:
   - Validate URL schemes (only allow http:// and https://)
   - Whitelist allowed domains rather than blacklisting bad ones
   - Don't rely solely on hostname validation (DNS rebinding)

2. Implement network-level controls:
   - Block requests to private IP ranges (127.0.0.0/8, 10.0.0.0/8, etc.)
   - Block requests to link-local addresses (169.254.0.0/16)
   - Block requests to localhost using various formats
   - Use an allow-list for external domains

3. Configure service-level protections:
   - Set low timeouts for requests
   - Disable HTTP redirections or limit them
   - Limit response size
   - Restrict request methods (e.g., only GET)

4. Use dedicated services/proxies for external requests:
   - Image proxies should validate content types
   - API gateways should validate destinations

5. For cloud environments:
   - Use IMDSv2 with token requirement
   - Block access to metadata service IP addresses
"""

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
