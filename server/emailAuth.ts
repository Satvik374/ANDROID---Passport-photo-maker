import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { storage } from './storage';
import { EmailService } from './emailService';
import type { EmailSignup, EmailLogin, User } from '@shared/schema';

export class EmailAuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Register new user with email
  static async registerUser(signupData: EmailSignup): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(signupData.email);
      if (existingUser) {
        return { success: false, message: 'An account with this email already exists' };
      }

      // Hash the password
      const passwordHash = await this.hashPassword(signupData.password);

      // Create user (not verified yet)
      const user = await storage.createUser({
        id: randomUUID(),
        email: signupData.email,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        passwordHash,
        authProvider: 'email',
        isEmailVerified: false,
        isGuest: false,
      });

      // Generate and send verification code
      const verificationCode = EmailService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await storage.saveEmailVerification({
        email: signupData.email,
        verificationCode,
        expiresAt,
        used: false,
      });

      // Send verification email
      const emailSent = await EmailService.sendVerificationEmail(signupData.email, verificationCode);
      
      if (!emailSent) {
        return { success: false, message: 'Failed to send verification email. Please try again.' };
      }

      return { 
        success: true, 
        message: 'Account created! Please check your email for the verification code.',
        userId: user.id 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // Verify email with code
  static async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Find valid verification code
      const verification = await storage.getEmailVerification(email, code);
      if (!verification) {
        return { success: false, message: 'Invalid or expired verification code' };
      }

      // Mark verification as used
      await storage.markEmailVerificationAsUsed(verification.id);

      // Update user as verified
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const updatedUser = await storage.updateUser(user.id, {
        isEmailVerified: true,
      });

      // Send welcome email
      await EmailService.sendWelcomeEmail(email, user.firstName || 'User');

      return { 
        success: true, 
        message: 'Email verified successfully! Welcome to Passport Photo Maker.',
        user: updatedUser 
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, message: 'Verification failed. Please try again.' };
    }
  }

  // Resend verification code
  static async resendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user exists and is not verified
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return { success: false, message: 'No account found with this email address' };
      }

      if (user.isEmailVerified) {
        return { success: false, message: 'This email is already verified' };
      }

      // Generate new verification code
      const verificationCode = EmailService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await storage.saveEmailVerification({
        email,
        verificationCode,
        expiresAt,
        used: false,
      });

      // Send verification email
      const emailSent = await EmailService.sendVerificationEmail(email, verificationCode);
      
      if (!emailSent) {
        return { success: false, message: 'Failed to send verification email. Please try again.' };
      }

      return { 
        success: true, 
        message: 'New verification code sent! Please check your email.' 
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { success: false, message: 'Failed to resend verification code. Please try again.' };
    }
  }

  // Login user
  static async loginUser(loginData: EmailLogin): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // Find user by email
      const user = await storage.getUserByEmail(loginData.email);
      if (!user || user.authProvider !== 'email') {
        return { success: false, message: 'Invalid email or password' };
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        return { success: false, message: 'Please verify your email before logging in' };
      }

      // Verify password
      if (!user.passwordHash) {
        return { success: false, message: 'Invalid email or password' };
      }

      const passwordValid = await this.verifyPassword(loginData.password, user.passwordHash);
      if (!passwordValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      return { 
        success: true, 
        message: 'Login successful!',
        user 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  // Clean up expired verification codes (should be called periodically)
  static async cleanupExpiredVerifications(): Promise<void> {
    try {
      await storage.deleteExpiredVerifications();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}