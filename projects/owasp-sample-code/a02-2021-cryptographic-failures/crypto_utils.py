"""
A02:2021 – Cryptographic Failures
This example demonstrates common cryptographic failures including:
- Using outdated/weak cryptographic algorithms
- Hardcoded cryptographic keys
- Improper certificate validation
- Insufficient data protection at rest and in transit
"""

import hashlib
import base64
import ssl
import requests
import sqlite3
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

class InsecureCryptographicImplementation:
    def __init__(self):
        # VULNERABILITY: Hardcoded encryption key in source code
        self.SECRET_KEY = b'0123456789abcdef'  # 128-bit static key
        self.STATIC_IV = b'0000000000000000'   # Static IV, should be random per encryption
        
    def encrypt_user_data(self, plaintext):
        """
        VULNERABILITY: Using outdated encryption algorithm (DES) with static IV
        DES is considered broken and insecure for modern applications
        """
        # Convert input string to bytes
        plaintext_bytes = plaintext.encode('utf-8')
        
        # Using DES (insecure algorithm) with ECB mode (also insecure)
        cipher = Cipher(
            algorithms.TripleDES(self.SECRET_KEY), 
            modes.ECB(),  # VULNERABILITY: ECB mode doesn't provide strong encryption
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(plaintext_bytes) + encryptor.finalize()
        return base64.b64encode(ciphertext).decode('utf-8')
    
    def hash_password(self, password):
        """
        VULNERABILITY: Using weak hashing algorithm (MD5) for password storage
        """
        # MD5 is cryptographically broken and unsuitable for password hashing
        return hashlib.md5(password.encode('utf-8')).hexdigest()
    
    def make_insecure_request(self, url):
        """
        VULNERABILITY: Disabling SSL certificate verification
        """
        # Suppress only the single InsecureRequestWarning
        requests.packages.urllib3.disable_warnings()
        
        # VULNERABILITY: verify=False disables SSL certificate validation
        response = requests.get(url, verify=False)
        return response.text
    
    def store_password_in_database(self, username, password):
        """
        VULNERABILITY: Storing passwords in plaintext or with weak hashing
        """
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        # Creating table with plaintext password storage
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT,
            password TEXT  -- VULNERABILITY: Passwords stored in plaintext
        )
        ''')
        
        # Inserting plaintext password
        cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", 
                      (username, password))
        conn.commit()
        conn.close()
        
        return "User stored successfully"

# Example usage
if __name__ == "__main__":
    crypto = InsecureCryptographicImplementation()
    
    encrypted = crypto.encrypt_user_data("sensitive-data-123")
    print(f"Encrypted: {encrypted}")
    
    hashed = crypto.hash_password("user-password")
    print(f"Hashed password (insecure): {hashed}")
    
    crypto.store_password_in_database("user1", "password123")  # Plaintext storage
