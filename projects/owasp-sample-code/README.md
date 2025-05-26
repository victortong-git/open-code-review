# OWASP Top 10 (2021) Sample Vulnerabilities

This repository contains code examples demonstrating the OWASP Top 10 (2021) vulnerabilities for educational and testing purposes. Each directory contains sample code with intentional vulnerabilities that can be used for testing code review and security scanning tools.

## WARNING

⚠️ **These code samples intentionally contain security vulnerabilities for educational purposes only. DO NOT use this code in production environments.**

## Directory Structure

1. **A01:2021 – Broken Access Control**
   - Examples of missing authentication, insecure direct object references, and permission bypasses
   - File: `admin_controller.js`

2. **A02:2021 – Cryptographic Failures**
   - Examples of weak encryption, hardcoded keys, and insecure storage
   - File: `crypto_utils.py`

3. **A03:2021 – Injection**
   - Examples of SQL injection, command injection, and other injection flaws
   - File: `user_service.php`

4. **A04:2021 – Insecure Design**
   - Examples of design-level security issues and business logic flaws
   - File: `password_reset.java`

5. **A05:2021 – Security Misconfiguration**
   - Examples of default settings, verbose errors, and insecure configurations
   - File: `app_config.py`

6. **A06:2021 – Vulnerable and Outdated Components**
   - Examples of using components with known vulnerabilities
   - Files: `package.json` and `server.js`

7. **A07:2021 – Identification and Authentication Failures**
   - Examples of weak passwords, session management, and credential handling
   - File: `auth_service.rb`

8. **A08:2021 – Software and Data Integrity Failures**
   - Examples of insecure deserialization and code integrity issues
   - File: `updater.go`

9. **A09:2021 – Security Logging and Monitoring Failures**
   - Examples of missing or inadequate logging for security events
   - File: `logger.cs`

10. **A10:2021 – Server-Side Request Forgery (SSRF)**
    - Examples of server making requests based on user input
    - File: `image_proxy.py`

## Testing Purpose

These samples are intended for:

- Security researchers and professionals to understand vulnerabilities
- Testing and developing code scanning tools
- Educational purposes to learn about common security issues
- Code review training exercises

## How to Use

1. Use these samples for testing code scanning tools
2. Study the commented vulnerabilities to understand security issues
3. Use in training sessions for security awareness

## DO NOT:

- Use any of this code in production environments
- Run these examples on publicly accessible servers
- Copy this code into real applications

## License

This code is provided for educational purposes only.
