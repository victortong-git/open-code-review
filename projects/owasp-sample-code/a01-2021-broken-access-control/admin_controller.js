/**
 * A01:2021 – Broken Access Control
 * This example demonstrates a broken access control vulnerability where
 * the application fails to properly verify if a user has the necessary permissions
 * before allowing them to access administrative functions.
 */

const express = require('express');
const router = express.Router();

router.get('/api/admin/users', function(req, res) {
  // VULNERABILITY: No authentication check before accessing admin functionality
  // Just retrieves all users without verifying if the requester is an admin
  
  const allUserData = getUserData();
  
  // Returns sensitive information about all users without proper authorization
  res.json({
    status: 'success',
    data: allUserData
  });
});

router.delete('/api/users/:id', function(req, res) {
  // VULNERABILITY: Missing function level access control
  // Should check if the current user is either an admin or the owner of the account
  const userId = req.params.id;
  
  // No verification that the logged-in user has permission to delete this user
  deleteUser(userId);
  
  res.json({
    status: 'success',
    message: 'User deleted successfully'
  });
});

// Insecure direct object reference (IDOR)
router.get('/api/documents/:docId', function(req, res) {
  const docId = req.params.docId;
  
  // VULNERABILITY: No validation that the current user should have access to this document
  const document = getDocument(docId);
  
  // Returns potentially sensitive document without access control check
  res.json({
    status: 'success',
    data: document
  });
});

// Mock functions
function getUserData() {
  return [
    { id: 1, username: "admin", email: "admin@example.com", role: "admin", ssn: "123-45-6789" },
    { id: 2, username: "user1", email: "user1@example.com", role: "user", ssn: "987-65-4321" }
  ];
}

function deleteUser(id) {
  // Implementation not shown
  console.log(`User ${id} deleted`);
}

function getDocument(id) {
  return { id: id, title: "Confidential Report", content: "Sensitive information..." };
}

module.exports = router;
