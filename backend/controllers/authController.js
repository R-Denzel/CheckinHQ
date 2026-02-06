const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

/**
 * Authentication Controller
 * Handles user registration and login
 */

/**
 * Register a new user
 * POST /api/auth/register
 */
exports.register = [
  // Validation
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('businessName').optional().trim(),
  body('businessType').optional().isIn(['airbnb', 'tour']),
  body('preferredCurrency').optional().isIn(['USD', 'UGX', 'KES', 'TZS', 'EUR', 'GBP']),

  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, businessName, businessType, preferredCurrency } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        email,
        passwordHash,
        businessName: businessName || null,
        businessType: businessType || 'airbnb',
        preferredCurrency: preferredCurrency || 'USD'
      });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await User.setVerificationToken(user.id, verificationToken);

      // Send verification email (don't block registration if email fails)
      sendVerificationEmail(email, verificationToken).catch(err => 
        console.error('Failed to send verification email:', err)
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
        token,
        user: {
          id: user.id,
          email: user.email,
          businessName: user.business_name,
          businessType: user.business_type,
          preferredCurrency: user.preferred_currency,
          trialExpiresAt: user.trial_expires_at,
          subscriptionStatus: user.subscription_status,
          emailVerified: false
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
];

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = [
  // Validation
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),

  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findByEmail(email);
      if (!user) {
        // Generic error message to prevent email enumeration
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login timestamp
      await User.updateLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          businessName: user.business_name,
          businessType: user.business_type,
          isAdmin: user.is_admin,
          preferredCurrency: user.preferred_currency,
          trialExpiresAt: user.trial_expires_at,
          subscriptionStatus: user.subscription_status
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
];

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Verify email with token
 * POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await User.verifyEmail(token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.json({ 
      message: 'Email verified successfully!',
      emailVerified: true
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await User.setVerificationToken(user.id, verificationToken);

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, verificationToken);

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = [
  body('email').isEmail().normalizeEmail(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      const user = await User.findByEmail(email);

      // Don't reveal if email exists or not (security best practice)
      if (!user) {
        return res.json({ 
          message: 'If an account with that email exists, a password reset link has been sent.' 
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 3600000); // 1 hour from now

      await User.setResetToken(email, resetToken, expiry);

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(email, resetToken);

      if (!emailSent) {
        console.error('Failed to send password reset email');
        // Still return success to prevent email enumeration
      }

      res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }
];

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
exports.resetPassword = [
  body('token').notEmpty(),
  body('password').isLength({ min: 6 }),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Check if token is valid
      const user = await User.findByResetToken(token);

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      const updatedUser = await User.resetPassword(token, passwordHash);

      if (!updatedUser) {
        return res.status(400).json({ error: 'Failed to reset password' });
      }

      res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
];
