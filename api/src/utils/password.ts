import bcrypt from 'bcryptjs';
import { createLogger } from './logger';

const logger = createLogger();

// Salt rounds for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return hashedPassword;
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    if (!password || !hashedPassword) {
      return false;
    }

    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    logger.error('Error verifying password:', error);
    return false;
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
  score: number;
} {
  const errors: string[] = [];
  let score = 0;

  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  // Maximum length
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters long');
  }

  // Contains lowercase
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Contains uppercase
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Contains number
  if (/\d/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must contain at least one number');
  }

  // Contains special character
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    errors.push('Password must contain at least one special character');
  }

  // No common patterns
  const commonPatterns = [
    /123456/, /password/, /qwerty/, /abc123/,
    /admin/, /letmein/, /welcome/, /monkey/
  ];
  
  if (commonPatterns.some(pattern => pattern.test(password.toLowerCase()))) {
    errors.push('Password contains common patterns and is not secure');
    score = Math.max(0, score - 2);
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(5, score)
  };
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}