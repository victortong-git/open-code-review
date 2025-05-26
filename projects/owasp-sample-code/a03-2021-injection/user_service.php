<?php
/**
 * A03:2021 – Injection
 * This sample demonstrates various types of injection vulnerabilities:
 * - SQL Injection
 * - Command Injection
 * - LDAP Injection
 * - XPath Injection
 */

class UserService {
    private $db_connection;
    
    public function __construct($host, $username, $password, $database) {
        // Connect to database
        $this->db_connection = new mysqli($host, $username, $password, $database);
        
        if ($this->db_connection->connect_error) {
            die("Database connection failed: " . $this->db_connection->connect_error);
        }
    }
    
    /**
     * VULNERABILITY: SQL Injection
     * This function is vulnerable to SQL injection because it directly 
     * concatenates user input into the SQL query without proper sanitization
     */
    public function getUserByUsername($username) {
        // VULNERABILITY: Direct concatenation of user input in SQL query
        $query = "SELECT * FROM users WHERE username = '" . $username . "'";
        
        $result = $this->db_connection->query($query);
        
        if ($result) {
            return $result->fetch_assoc();
        }
        
        return null;
    }
    
    /**
     * VULNERABILITY: SQL Injection in a different context
     */
    public function searchUsers($searchTerm) {
        // VULNERABILITY: User input in LIKE clause without proper escaping
        $query = "SELECT * FROM users WHERE username LIKE '%" . $searchTerm . "%' OR 
                  email LIKE '%" . $searchTerm . "%'";
        
        return $this->db_connection->query($query);
    }
    
    /**
     * VULNERABILITY: Command Injection
     */
    public function pingUser($ipAddress) {
        // VULNERABILITY: User-provided data directly used in system command
        $command = "ping -c 4 " . $ipAddress;
        
        // Executes the command with user input without sanitization
        $output = shell_exec($command);
        return $output;
    }
    
    /**
     * VULNERABILITY: LDAP Injection
     */
    public function ldapSearch($username) {
        $ldapConnection = ldap_connect("ldap://ldap.example.com");
        ldap_set_option($ldapConnection, LDAP_OPT_PROTOCOL_VERSION, 3);
        ldap_bind($ldapConnection, "cn=admin,dc=example,dc=com", "admin_password");
        
        // VULNERABILITY: Unsanitized input directly used in LDAP filter
        $filter = "(uid=" . $username . ")";
        
        $searchResult = ldap_search($ldapConnection, "ou=users,dc=example,dc=com", $filter);
        $entries = ldap_get_entries($ldapConnection, $searchResult);
        
        ldap_close($ldapConnection);
        return $entries;
    }
    
    /**
     * VULNERABILITY: XPath Injection
     */
    public function findUserFromXml($username, $password) {
        $xmlDoc = new DOMDocument();
        $xmlDoc->load('users.xml');
        
        $xpath = new DOMXPath($xmlDoc);
        
        // VULNERABILITY: User input directly concatenated into XPath query
        $query = "//users/user[username='" . $username . "' and password='" . $password . "']";
        
        $nodes = $xpath->query($query);
        
        if ($nodes->length > 0) {
            return true; // Authentication successful
        }
        
        return false; // Authentication failed
    }
    
    /**
     * VULNERABILITY: NoSQL Injection (MongoDB example)
     */
    public function findMongoUser($username, $password) {
        // Imagine this connects to MongoDB
        
        // VULNERABILITY: Using unsanitized variables in a query structure
        $query = [
            "username" => $username,
            "password" => $password
        ];
        
        // Simulated MongoDB query
        // In a real NoSQL injection, attackers could manipulate the query structure
        return $this->mongoCollection->find($query);
    }
}

// Usage example
$userService = new UserService("localhost", "root", "password", "app_db");

// Examples of vulnerable calls that could be exploited:
// SQL Injection: $userService->getUserByUsername("admin' OR '1'='1");
// Command Injection: $userService->pingUser("127.0.0.1; rm -rf /");
// LDAP Injection: $userService->ldapSearch("*)(|(objectClass=*)");
