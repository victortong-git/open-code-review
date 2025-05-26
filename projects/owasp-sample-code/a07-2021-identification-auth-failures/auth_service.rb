# A07:2021 – Identification and Authentication Failures
#
# This example demonstrates various authentication failures including:
# - Weak password requirements
# - Lack of MFA
# - Session management issues
# - Credential exposure
# - Default credentials
# - Brute force protection weaknesses

require 'sinatra'
require 'bcrypt'
require 'securerandom'

# In-memory user store (in a real app, this would be a database)
USERS = {
  'admin' => {
    password: '$2a$12$K0ByB.6YI2/OYrB4fQOYLe6Tv0datUVf6VZ/2Jzwm879BW5K1cHey', # plaintext: 'password123'
    role: 'admin',
    failed_attempts: 0
  },
  'user1' => {
    password: '$2a$12$BEs9L7HClsR1RHZ8HQEwnO4tqfPDEwRc5jq9.vLdQgr4KLdvHpqRW', # plaintext: '123456'
    role: 'user',
    failed_attempts: 0
  }
}

# In-memory session storage (in a real app, this would be in Redis or similar)
SESSIONS = {}

# VULNERABILITY: Weak session management
# This creates a simple session ID which is too predictable
def create_session_id
  # VULNERABILITY: Using timestamp as session ID makes it predictable
  return "session_#{Time.now.to_i}"
  
  # Secure alternative would be:
  # return SecureRandom.hex(32)
end

# VULNERABILITY: Weak password validation
def validate_password(password)
  # VULNERABILITY: Extremely weak password requirements
  return password.length >= 3
  
  # A more secure validation would check:
  # - Minimum length (e.g. 12+ characters)
  # - Mix of uppercase and lowercase letters
  # - Numbers
  # - Special characters
  # - Not commonly used or previously breached
end

# VULNERABILITY: No rate limiting for failed login attempts
def should_allow_login_attempt(username)
  # VULNERABILITY: No limit on number of attempts
  return true
  
  # Secure approach would be:
  # if USERS[username] && USERS[username][:failed_attempts] >= 5
  #   return false  # Account locked, too many failed attempts
  # end
  # return true
end

# Routes and handlers

# VULNERABILITY: No HTTPS requirement
configure do
  # VULNERABILITY: Setting insecure cookie settings
  set :sessions, 
      :key => 'session_id',
      :path => '/',
      :expire_after => 14400,      # 4 hours
      :secure => false,            # VULNERABILITY: Cookies sent over HTTP
      :httponly => false           # VULNERABILITY: Cookies accessible via JavaScript
end

get '/' do
  "Authentication Demo"
end

# VULNERABILITY: Insecure login route (no CSRF protection, no rate limiting)
post '/login' do
  content_type :json
  
  username = params[:username]
  password = params[:password]
  
  # VULNERABILITY: No brute force protection
  if !should_allow_login_attempt(username)
    return { error: 'Too many failed attempts, account locked' }.to_json
  end
  
  # Check if user exists and password is correct
  if USERS[username] && BCrypt::Password.new(USERS[username][:password]) == password
    # Reset failed attempts
    USERS[username][:failed_attempts] = 0
    
    # Create a session
    session_id = create_session_id()
    SESSIONS[session_id] = { 
      username: username,
      created_at: Time.now.to_i,
      # VULNERABILITY: No proper session expiration or rotation
    }
    
    # VULNERABILITY: Setting session ID in a cookie without proper flags
    response.set_cookie('session_id', value: session_id, path: '/', secure: false, httponly: false)
    
    return { success: true, username: username, role: USERS[username][:role] }.to_json
  else
    # Increment failed attempts
    if USERS[username]
      USERS[username][:failed_attempts] += 1
    end
    
    # VULNERABILITY: Error message discloses whether the username exists
    if !USERS[username]
      return { error: 'Username not found' }.to_json
    else
      return { error: 'Incorrect password' }.to_json
    end
  end
end

# API to get user profile
get '/api/profile' do
  content_type :json
  
  # Get session ID from cookie
  session_id = request.cookies['session_id']
  
  # VULNERABILITY: No session verification or weak session verification
  if !session_id || !SESSIONS[session_id]
    return { error: 'Unauthorized' }.to_json
  end
  
  username = SESSIONS[session_id][:username]
  
  # VULNERABILITY: Session fixation - no session ID rotation after privilege change
  
  # Return user profile
  return {
    username: username,
    role: USERS[username][:role],
    # VULNERABILITY: Returning sensitive information
    last_login: Time.now.to_s,
    # VULNERABILITY: No remember-me token expiration
  }.to_json
end

# VULNERABILITY: Default admin credentials route
get '/api/admin/reset' do
  content_type :json
  
  # VULNERABILITY: Endpoint to reset admin password to a default value
  USERS['admin'][:password] = BCrypt::Password.create('admin123')
  
  return { message: 'Admin password reset to default' }.to_json
end

# VULNERABILITY: Registration with no password complexity requirements
post '/api/register' do
  content_type :json
  
  username = params[:username]
  password = params[:password]
  
  # VULNERABILITY: Weak password validation
  if !validate_password(password)
    return { error: 'Password does not meet requirements' }.to_json
  end
  
  # VULNERABILITY: No checks for existing usernames
  if USERS[username]
    return { error: 'Username already exists' }.to_json
  end
  
  # VULNERABILITY: No email verification
  # This means anyone can register any email address
  
  # Hash password (this part is actually secure)
  password_hash = BCrypt::Password.create(password)
  
  # Add new user
  USERS[username] = { 
    password: password_hash, 
    role: 'user',
    failed_attempts: 0
  }
  
  return { success: true, message: 'User registered successfully' }.to_json
end

# VULNERABILITY: Password change without current password verification
post '/api/change-password' do
  content_type :json
  
  session_id = request.cookies['session_id']
  
  if !session_id || !SESSIONS[session_id]
    return { error: 'Unauthorized' }.to_json
  end
  
  username = SESSIONS[session_id][:username]
  new_password = params[:new_password]
  
  # VULNERABILITY: No verification of current password
  # VULNERABILITY: Weak password validation
  if !validate_password(new_password)
    return { error: 'Password does not meet requirements' }.to_json
  end
  
  # VULNERABILITY: No password history check
  # This allows reuse of old passwords
  
  # Update password
  USERS[username][:password] = BCrypt::Password.create(new_password)
  
  # VULNERABILITY: No session invalidation across devices after password change
  
  return { success: true, message: 'Password changed successfully' }.to_json
end

# Start the server
if __FILE__ == $0
  run Sinatra::Application
end

# Additional vulnerabilities demonstrated:
# - No multi-factor authentication options
# - No account lockout mechanism
# - No credential rotation requirements
# - No sensitive operation verification
# - No proper session timeout
