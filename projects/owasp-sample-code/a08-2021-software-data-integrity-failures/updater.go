/**
 * A08:2021 – Software and Data Integrity Failures
 *
 * This example demonstrates software and data integrity failures including:
 * - Insecure deserialization
 * - Unsigned code/updates
 * - Auto-update mechanisms without verification
 * - CI/CD pipeline vulnerabilities
 * - Unsigned data in trusted systems
 */

package main

import (
"crypto/md5"
"encoding/base64"
"encoding/json"
"fmt"
"io/ioutil"
"log"
"net/http"
"os"
"os/exec"
"path/filepath"
"strings"
)

// Update info structure
type UpdateInfo struct {
Version     string `json:"version"`
DownloadURL string `json:"download_url"`
Checksum    string `json:"checksum"`  // Just MD5 hash
IsForced    bool   `json:"is_forced"`
ExecCommand string `json:"exec_command"`
}

// Config structure stored locally
type Config struct {
APIEndpoint string            `json:"api_endpoint"`
APIKey      string            `json:"api_key"`
Settings    map[string]string `json:"settings"`
}

// User permissions structure
type UserPermissions struct {
Username    string   `json:"username"`
IsAdmin     bool     `json:"is_admin"`
Permissions []string `json:"permissions"`
}

// Main function showcasing multiple integrity vulnerabilities
func main() {
fmt.Println("Starting application updater service...")

// VULNERABILITY: Loading unsigned configuration
config := loadConfig("config.json")

// VULNERABILITY: Downloading and executing updates without proper validation
checkForUpdates(config.APIEndpoint, config.APIKey)

// VULNERABILITY: Deserializing untrusted data
loadUserPermissions("user_permissions.dat")

http.HandleFunc("/api/update", handleUpdateWebhook)
http.HandleFunc("/api/config", handleConfigUpdate)

fmt.Println("Update server running on :8080")
http.ListenAndServe(":8080", nil)
}

// VULNERABILITY: Loading configuration without integrity verification
func loadConfig(filename string) Config {
var config Config

data, err := ioutil.ReadFile(filename)
if err != nil {
log.Printf("Error reading config file: %v", err)
return Config{
APIEndpoint: "https://updates.example.com/api",
APIKey:      "default_key_123",
Settings:    make(map[string]string),
}
}

// VULNERABILITY: No validation of config file integrity or source
err = json.Unmarshal(data, &config)
if err != nil {
log.Printf("Error parsing config: %v", err)
return Config{
APIEndpoint: "https://updates.example.com/api",
APIKey:      "default_key_123",
Settings:    make(map[string]string),
}
}

return config
}

// VULNERABILITY: Insecure deserialization of user data
func loadUserPermissions(filename string) UserPermissions {
data, err := ioutil.ReadFile(filename)
if err != nil {
log.Printf("Error reading permissions file: %v", err)
return UserPermissions{Username: "guest", IsAdmin: false}
}

// VULNERABILITY: Base64 decoding untrusted data
decodedData, err := base64.StdEncoding.DecodeString(string(data))
if err != nil {
log.Printf("Error decoding permissions data: %v", err)
return UserPermissions{Username: "guest", IsAdmin: false}
}

var perms UserPermissions

// VULNERABILITY: Deserializing untrusted data without validation
err = json.Unmarshal(decodedData, &perms)
if err != nil {
log.Printf("Error parsing permissions: %v", err)
return UserPermissions{Username: "guest", IsAdmin: false}
}

return perms
}

// VULNERABILITY: Auto-update with weak integrity checks
func checkForUpdates(apiEndpoint string, apiKey string) {
url := fmt.Sprintf("%s/check-updates?api_key=%s", apiEndpoint, apiKey)

resp, err := http.Get(url)
if err != nil {
log.Printf("Error checking for updates: %v", err)
return
}
defer resp.Body.Close()

body, err := ioutil.ReadAll(resp.Body)
if err != nil {
log.Printf("Error reading update response: %v", err)
return
}

var updateInfo UpdateInfo
err = json.Unmarshal(body, &updateInfo)
if err != nil {
log.Printf("Error parsing update info: %v", err)
return
}

currentVersion := "1.0.0"
if updateInfo.Version > currentVersion || updateInfo.IsForced {
log.Printf("New version available: %s. Downloading update...", updateInfo.Version)

// VULNERABILITY: Downloading from URL without HTTPS verification
downloadAndInstallUpdate(updateInfo)
} else {
log.Println("No updates available")
}
}

// VULNERABILITY: Downloading and installing updates without proper validation
func downloadAndInstallUpdate(updateInfo UpdateInfo) {
// VULNERABILITY: No TLS validation when downloading update
resp, err := http.Get(updateInfo.DownloadURL)
if err != nil {
log.Printf("Error downloading update: %v", err)
return
}
defer resp.Body.Close()

updateData, err := ioutil.ReadAll(resp.Body)
if err != nil {
log.Printf("Error reading update data: %v", err)
return
}

// VULNERABILITY: Using weak hash (MD5) for integrity check
checksum := fmt.Sprintf("%x", md5.Sum(updateData))

// VULNERABILITY: Simple string comparison instead of secure comparison
if checksum != updateInfo.Checksum {
log.Println("Update checksum verification failed!")
return
}

// Save the update file
updateFile := filepath.Join(os.TempDir(), "update.zip")
err = ioutil.WriteFile(updateFile, updateData, 0644)
if err != nil {
log.Printf("Error writing update file: %v", err)
return
}

// VULNERABILITY: Blindly trusting command from update server
if updateInfo.ExecCommand != "" {
// VULNERABILITY: Command injection risk - executing commands from update server
log.Printf("Running update command: %s", updateInfo.ExecCommand)

// VULNERABILITY: Executing commands received from server
cmd := exec.Command("bash", "-c", updateInfo.ExecCommand)
output, err := cmd.CombinedOutput()
if err != nil {
log.Printf("Error executing update command: %v", err)
log.Printf("Command output: %s", string(output))
return
}
}

log.Println("Update installed successfully!")
}

// VULNERABILITY: API endpoint that accepts unsigned updates
func handleUpdateWebhook(w http.ResponseWriter, r *http.Request) {
if r.Method != "POST" {
http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
return
}

body, err := ioutil.ReadAll(r.Body)
if err != nil {
http.Error(w, "Error reading request body", http.StatusBadRequest)
return
}

// VULNERABILITY: No verification of webhook source
// Should validate signature/HMAC of the incoming webhook

var updateInfo UpdateInfo
err = json.Unmarshal(body, &updateInfo)
if err != nil {
http.Error(w, "Error parsing update info", http.StatusBadRequest)
return
}

// VULNERABILITY: Trusting data from webhook without verification
log.Printf("Received update notification for version %s", updateInfo.Version)

// Process the update
go downloadAndInstallUpdate(updateInfo)

w.WriteHeader(http.StatusOK)
w.Write([]byte("Update scheduled"))
}

// VULNERABILITY: API endpoint that accepts config changes without verification
func handleConfigUpdate(w http.ResponseWriter, r *http.Request) {
if r.Method != "POST" {
http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
return
}

body, err := ioutil.ReadAll(r.Body)
if err != nil {
http.Error(w, "Error reading request body", http.StatusBadRequest)
return
}

var newConfig Config
err = json.Unmarshal(body, &newConfig)
if err != nil {
http.Error(w, "Error parsing config", http.StatusBadRequest)
return
}

// VULNERABILITY: No validation of config source or integrity
// Should verify the sender's identity and authorization

// VULNERABILITY: Saving untrusted configuration without validation
configData, err := json.MarshalIndent(newConfig, "", "  ")
if err != nil {
http.Error(w, "Error encoding config", http.StatusInternalServerError)
return
}

// VULNERABILITY: Writing to a security-critical file without proper checks
err = ioutil.WriteFile("config.json", configData, 0644)
if err != nil {
http.Error(w, "Error saving config", http.StatusInternalServerError)
return
}

log.Println("Configuration updated successfully")

w.WriteHeader(http.StatusOK)
w.Write([]byte("Configuration updated"))
}
