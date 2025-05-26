"""
A05:2021 – Security Misconfiguration
This example demonstrates common security misconfigurations including:
- Default/weak credentials
- Unnecessary features enabled
- Error messages with sensitive information
- Missing security headers
- Outdated software
- Default accounts enabled
- Overly verbose error messages
"""

from flask import Flask, request, jsonify, render_template
import os
import json
import traceback
import logging
import sys

app = Flask(__name__)

# VULNERABILITY: Default or development settings in production
# App is running in debug mode which can leak sensitive information
app.config['DEBUG'] = True  

# VULNERABILITY: Sensitive information in configuration
app.config['SECRET_KEY'] = 'super_secret_key_123'  # Hardcoded secret
app.config['DATABASE_URI'] = 'mysql://admin:password123@localhost/production_db'  

# VULNERABILITY: Default credentials not changed
default_admin_username = "admin"  
default_admin_password = "admin"  # Default credentials should never be used

# VULNERABILITY: Unnecessary features enabled
app.config['ALLOW_REMOTE_ADMINISTRATION'] = True
app.config['ENABLE_DIRECTORY_LISTING'] = True

# VULNERABILITY: Missing security headers configuration
# Should be setting CSP, X-XSS-Protection, etc.

@app.route('/api/user')
def get_user_data():
    user_id = request.args.get('id')
    
    try:
        # Simulating a database query
        user = get_user_by_id(user_id)
        return jsonify(user)
    except Exception as e:
        # VULNERABILITY: Detailed error messages exposed to users
        error_details = {
            'error': str(e),
            'traceback': traceback.format_exc(),
            'server_info': f"{os.uname()[0]} {os.uname()[2]} {os.uname()[4]}",  # OS info
            'python_version': sys.version,
            'app_path': os.path.abspath(__file__)
        }
        
        # VULNERABILITY: Detailed error information sent to client
        return jsonify(error_details), 500

@app.route('/api/system/info')
def get_system_info():
    # VULNERABILITY: Exposing sensitive system information without authentication
    system_info = {
        'os': os.uname(),
        'environment': os.environ,
        'python_version': sys.version,
        'app_path': os.path.abspath(__file__),
        'server_timestamp': os.popen('date').read(),
        'server_users': os.popen('who').read(),
    }
    
    return jsonify(system_info)

@app.route('/admin/console')
def admin_console():
    # VULNERABILITY: No authentication/weak authentication for admin functionality
    # Should check if user is authenticated and has admin permissions
    
    # No authentication check, anyone can access
    return render_template('admin_console.html')

@app.route('/api/logs')
def get_logs():
    # VULNERABILITY: Exposing sensitive logs without proper access control
    log_file = request.args.get('file', 'app.log')
    
    # VULNERABILITY: Directory traversal - allows reading arbitrary files
    log_path = f"logs/{log_file}"
    
    try:
        with open(log_path, 'r') as file:
            logs = file.read()
        return logs
    except:
        return "Log file not found", 404

@app.route('/config/update', methods=['POST'])
def update_config():
    # VULNERABILITY: No CSRF protection on configuration update
    config_data = request.get_json()
    
    # VULNERABILITY: No proper authentication/authorization
    # Update the application config directly from user input
    for key, value in config_data.items():
        app.config[key] = value
    
    return "Configuration updated", 200

# Helper function
def get_user_by_id(user_id):
    # Mock database of users
    users = {
        '1': {'id': 1, 'username': 'admin', 'role': 'admin', 'salary': 100000},
        '2': {'id': 2, 'username': 'user1', 'role': 'user', 'salary': 75000},
    }
    
    if user_id not in users:
        raise Exception(f"User with ID {user_id} not found in database")
    
    return users[user_id]

if __name__ == "__main__":
    # VULNERABILITY: Running with all interfaces (0.0.0.0) may expose the app unnecessarily
    app.run(host='0.0.0.0', port=5000, debug=True)  # debug=True in production is a vulnerability
