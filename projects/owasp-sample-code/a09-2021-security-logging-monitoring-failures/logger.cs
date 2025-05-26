/**
 * A09:2021 – Security Logging and Monitoring Failures
 * 
 * This example demonstrates various security logging and monitoring failures:
 * - Missing logs for critical events
 * - Lack of audit trails for sensitive operations
 * - Insufficient logging of authentication events
 * - Improper log handling (level, format, storage)
 * - No monitoring or alerting for suspicious activity
 */

using System;
using System.Collections.Generic;
using System.IO;
using System.Data.SqlClient;
using System.Diagnostics;

namespace InsecureLogging
{
    public class SecurityLogger
    {
        private static readonly string logFilePath = "application.log";
        private static readonly string connectionString = "Server=localhost;Database=AppDB;User ID=admin;Password=admin123;"; 

        public static void Main(string[] args)
        {
            // Simulate some application actions that should be logged properly
            var app = new SecurityLogger();
            
            // Login simulation
            app.UserLogin("admin", "password123", "192.168.1.100");
            
            // Admin action simulation
            app.PerformAdminAction("admin", "DELETE", "user_records");
            
            // Failed authentication simulation
            app.UserLogin("admin", "wrong_password", "192.168.1.101");
            
            // Data export simulation
            app.ExportSensitiveData("admin", "customer_financial_data.csv");
            
            // Security configuration change
            app.UpdateSecuritySettings("admin", "DISABLE_2FA");
        }
        
        /**
         * VULNERABILITY: Insufficient authentication logging
         * Missing critical details in authentication logs
         */
        public bool UserLogin(string username, string password, string ipAddress)
        {
            // Mock login logic - assume this validates credentials
            bool loginSuccessful = (username == "admin" && password == "password123");
            
            if (loginSuccessful)
            {
                // VULNERABILITY: Successful logins not logged properly
                // Should log username, source IP, timestamp, and other details
                WriteToConsole("User logged in successfully");
                
                // VULNERABILITY: No audit trail for successful logins
                return true;
            }
            else
            {
                // VULNERABILITY: Failed login attempts not properly logged
                // Missing key fields like IP address, no centralized monitoring
                WriteToConsole("Login failed for user: " + username);
                
                // VULNERABILITY: No mechanism to detect or alert on brute force attempts
                return false;
            }
        }
        
        /**
         * VULNERABILITY: Missing logs for administrative actions
         * Critical activities not properly recorded for audit
         */
        public void PerformAdminAction(string username, string action, string target)
        {
            // Simulate administrative action
            Console.WriteLine($"Admin action '{action}' performed on '{target}'");
            
            // VULNERABILITY: No detailed logging for admin actions
            // Should log who did what, when, and from where
            WriteToFile($"Admin action performed by {username}");
            
            // VULNERABILITY: No integrity controls on admin action logs
            // Logs should be tamper-proof, especially for privileged actions
        }
        
        /**
         * VULNERABILITY: Insufficient logging for sensitive data access
         */
        public void ExportSensitiveData(string username, string dataFile)
        {
            // Simulate data export
            Console.WriteLine($"User {username} exported {dataFile}");
            
            // VULNERABILITY: No logging of sensitive data access
            // Critical operation should be logged in detail
            
            // VULNERABILITY: No alerting for suspicious data access patterns
            // Large data exports should trigger alerts
        }
        
        /**
         * VULNERABILITY: No logging of security-relevant changes
         */
        public void UpdateSecuritySettings(string username, string setting)
        {
            // Simulate updating security settings
            Console.WriteLine($"Security setting {setting} updated by {username}");
            
            // VULNERABILITY: Changes to security controls not logged
            // No way to track who changed what security settings
        }
        
        /**
         * VULNERABILITY: Insecure logging practices
         * Various logging failures including format, storage, and handling
         */
        private void WriteToConsole(string logMessage)
        {
            // VULNERABILITY: Logs only written to console, not persisted
            // No centralized log collection
            Console.WriteLine($"{DateTime.Now}: {logMessage}");
        }
        
        private void WriteToFile(string logMessage)
        {
            try
            {
                // VULNERABILITY: Logs written to local file without protection
                // Logs should be centralized and protected
                File.AppendAllText(logFilePath, $"{DateTime.Now}: {logMessage}\n");
                
                // VULNERABILITY: No log rotation or size limits
                // Could lead to disk space issues or log loss
            }
            catch (Exception ex)
            {
                // VULNERABILITY: Log failures are silently swallowed
                // Should have redundant logging or alerting for log failure
                Console.WriteLine($"Failed to write log: {ex.Message}");
            }
        }
        
        /**
         * VULNERABILITY: Storing sensitive data in logs
         */
        public void ProcessPayment(string username, string creditCardNumber, decimal amount)
        {
            // Process payment logic
            
            // VULNERABILITY: Logging sensitive data
            WriteToFile($"Payment processed for {username}, card: {creditCardNumber}, amount: {amount}");
            
            // Should instead log:
            // WriteToFile($"Payment processed for {username}, card: XXXX-XXXX-XXXX-{creditCardNumber.Substring(12)}, amount: {amount}");
        }
        
        /**
         * VULNERABILITY: No database-level audit logging
         */
        public void DatabaseOperation(string query)
        {
            // VULNERABILITY: No auditing of database access
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                SqlCommand command = new SqlCommand(query, connection);
                connection.Open();
                command.ExecuteNonQuery();
                
                // VULNERABILITY: No logging of database queries or changes
                // Database operations should be logged, especially for sensitive tables
            }
        }
        
        /**
         * VULNERABILITY: Inadequate error logging
         */
        public void HandleException(Exception exception)
        {
            // VULNERABILITY: Insufficient error details logged
            WriteToConsole($"Error occurred: {exception.Message}");
            
            // VULNERABILITY: Stack traces and detailed errors not logged
            // Should log exception details, stack trace and context
            
            // VULNERABILITY: No alerting on application errors
            // Critical errors should generate alerts
        }
        
        /**
         * VULNERABILITY: No monitoring for suspicious activities
         */
        public void CheckForAbnormalBehavior()
        {
            // VULNERABILITY: No mechanism to detect unusual patterns
            // No monitoring or alerting for suspicious activities:
            // - Unusual login times or locations
            // - Excessive failed attempts
            // - Unusual data access patterns
            // - Unexpected system behavior
            // - Security control failures
        }
    }
}

/**
 * Additional vulnerabilities demonstrated in this example:
 * 
 * 1. No centralized log management or SIEM integration
 * 2. No log integrity controls (logs could be tampered with)
 * 3. No separation of logs by severity or type
 * 4. No correlation between different security events
 * 5. Logs not monitored for security incidents in real-time
 * 6. No automated alerting on suspicious patterns
 * 7. Insufficient log retention periods
 * 8. No log backup strategy
 */
