/**
 * A04:2021 – Insecure Design
 * 
 * This sample demonstrates insecure design vulnerabilities including:
 * - Insecure password reset functionality
 * - Predictable resource location
 * - Lack of rate limiting
 * - Business logic flaws
 */

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.time.LocalDateTime;

public class PasswordReset {
    
    // Store of user reset tokens (in real app, this would be in a database)
    private static Map<String, String> resetTokens = new HashMap<>(); // email -> token
    private static Map<String, Integer> loginAttempts = new HashMap<>(); // username -> count
    
    /**
     * VULNERABILITY: Insecure design in password reset flow
     * - Uses predictable tokens
     * - No rate limiting
     * - No expiration on tokens
     * - No verification of token ownership
     */
    public String generatePasswordResetToken(String email) {
        // VULNERABILITY: Using predictable tokens instead of cryptographically secure ones
        long timestamp = System.currentTimeMillis();
        Random random = new Random(timestamp);  // Seeded with timestamp, making it predictable
        int tokenNumber = random.nextInt(10000);  // Small range, can be brute-forced
        
        // VULNERABILITY: Token is based on user input and easily guessable pattern
        String token = email.substring(0, 3) + tokenNumber;
        
        // Store token (without expiration)
        resetTokens.put(email, token);
        
        // In a real system, this would be sent to the user's email
        System.out.println("Reset token for " + email + ": " + token);
        
        return token;
    }
    
    /**
     * VULNERABILITY: Insecure design in password reset verification
     * - No rate limiting allows brute forcing
     * - No token expiration
     */
    public boolean verifyPasswordResetToken(String email, String token) {
        // Get stored token for email
        String storedToken = resetTokens.get(email);
        
        if (storedToken != null && storedToken.equals(token)) {
            return true;  // Token is valid
        }
        
        return false;  // Token is invalid
    }
    
    /**
     * VULNERABILITY: Insecurely designed "security questions" mechanism
     * - Uses common, easily guessable questions
     * - Allows unlimited attempts
     * - Questions likely have answers that can be found on social media
     */
    public boolean verifySecurityQuestion(String username, String question, String answer) {
        // VULNERABILITY: Common security questions with answers that could be found online
        Map<String, String> securityQuestions = new HashMap<>();
        securityQuestions.put("What is your mother's maiden name?", "Smith");
        securityQuestions.put("What was your first pet's name?", "Fluffy");
        securityQuestions.put("In what city were you born?", "Boston");
        
        // VULNERABILITY: Case-insensitive comparison means fewer guesses needed
        return answer.equalsIgnoreCase(securityQuestions.get(question));
    }
    
    /**
     * VULNERABILITY: No rate limiting for login attempts
     * - Allows unlimited attempts to guess passwords
     */
    public boolean handleLoginAttempt(String username, String password) {
        // VULNERABILITY: No limit on number of login attempts
        // Increment attempt counter
        Integer attempts = loginAttempts.getOrDefault(username, 0);
        loginAttempts.put(username, attempts + 1);
        
        // Check password (simplified)
        boolean passwordCorrect = checkPassword(username, password);
        
        // VULNERABILITY: Even if there are hundreds of attempts, still allow login
        return passwordCorrect;
    }
    
    /**
     * VULNERABILITY: Business logic flaw in discount application
     * - Allows multiple discounts to be stacked without validation
     * - No check for negative total price
     */
    public double calculateOrderTotal(double orderAmount, String[] discountCodes) {
        // VULNERABILITY: Applies all discounts without any validation
        double finalAmount = orderAmount;
        
        for (String code : discountCodes) {
            // Apply discount based on code (simplified)
            if (code.equals("SAVE10")) {
                finalAmount = finalAmount * 0.9;  // 10% off
            } else if (code.equals("SAVE20")) {
                finalAmount = finalAmount * 0.8;  // 20% off
            } else if (code.equals("SAVE50")) {
                finalAmount = finalAmount * 0.5;  // 50% off
            }
            
            // VULNERABILITY: Special discount code that subtracts an amount
            if (code.equals("MINUS100")) {
                finalAmount = finalAmount - 100;
            }
        }
        
        // VULNERABILITY: No check for negative total, could result in "cash back"
        return finalAmount;
    }
    
    // Helper methods (implementations not shown)
    private boolean checkPassword(String username, String password) {
        // Implementation not shown
        return password.equals("password123");
    }
    
    public static void main(String[] args) {
        PasswordReset resetService = new PasswordReset();
        
        // Example of exploitation
        String email = "user@example.com";
        String generatedToken = resetService.generatePasswordResetToken(email);
        
        // Let's assume an attacker could brute force or predict the token
        boolean resetSuccessful = resetService.verifyPasswordResetToken(email, generatedToken);
        System.out.println("Password reset successful: " + resetSuccessful);
        
        // Example of abusing business logic flaw
        String[] discountCodes = {"SAVE50", "MINUS100", "SAVE20", "MINUS100"};
        double finalPrice = resetService.calculateOrderTotal(150.00, discountCodes);
        System.out.println("Final price after applying discounts: $" + finalPrice);
        // Could result in negative amount, effectively getting paid to order
    }
}
