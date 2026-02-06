const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending verification and password reset emails
 */

// Create transporter
const createTransporter = () => {
  // Resend (Easiest & Modern - RECOMMENDED)
  if (process.env.EMAIL_SERVICE === 'resend') {
    console.log('✓ Using Resend for emails');
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 587,
      secure: false,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY
      }
    });
  }

  // Brevo (formerly Sendinblue) - 300 emails/day free
  if (process.env.EMAIL_SERVICE === 'brevo') {
    console.log('✓ Using Brevo for emails');
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_EMAIL,
        pass: process.env.BREVO_SMTP_KEY
      }
    });
  }
  
  // SendGrid (100 emails/day free)
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    console.log('✓ Using SendGrid for emails');
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // Gmail (Simple, uses your Gmail account)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    console.log('✓ Using Gmail for emails');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Use App Password
      }
    });
  }
  
  // Custom SMTP
  if (process.env.EMAIL_SERVICE === 'smtp') {
    console.log('✓ Using custom SMTP for emails');
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
  
  // Default: Console logging for development
  console.warn('⚠️  EMAIL NOT CONFIGURED: Emails will only be logged to console');
  console.warn('⚠️  Recommended: Use EMAIL_SERVICE=resend (easiest) or brevo');
  return {
    sendMail: async (options) => {
      console.log('\n📧 ========== EMAIL (NOT SENT - DEV MODE) ==========');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.html || options.text);
      console.log('====================================================\n');
      return { messageId: 'dev-' + Date.now() };
    }
  };
};

const transporter = createTransporter();

/**
 * Send verification email
 */
const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'CheckinHQ <noreply@checkinhq.com>',
    to: email,
    subject: 'Verify Your Email - CheckinHQ',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #128C7E 0%, #25D366 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to CheckinHQ!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>Thanks for signing up! Please verify your email address to get started with CheckinHQ.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #128C7E;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CheckinHQ. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('✗ Failed to send verification email:', error);
    return false;
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'CheckinHQ <noreply@checkinhq.com>',
    to: email,
    subject: 'Reset Your Password - CheckinHQ',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #128C7E 0%, #25D366 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>We received a request to reset your password for your CheckinHQ account.</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #128C7E;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour.
              </div>
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} CheckinHQ. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✓ Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('✗ Failed to send password reset email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};
