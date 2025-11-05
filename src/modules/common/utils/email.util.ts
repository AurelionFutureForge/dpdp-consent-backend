/**
 * @fileoverview Email utility for sending emails using Nodemailer
 * @module modules/common/utils/email
 */

import nodemailer from "nodemailer";
import { env } from "@config/env/env";
import dotenv from "dotenv";
dotenv.config();


/**
 * Email configuration interface
 */
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Cache transporter instance to reuse connections
let transporterInstance: nodemailer.Transporter | null = null;

/**
 * Create a transporter for sending emails
 */
const createTransporter = (): nodemailer.Transporter => {
  // Return cached instance if available
  if (transporterInstance) {
    return transporterInstance;
  }

  // Common connection timeout options (in milliseconds)
  const connectionOptions = {
    connectionTimeout: 60000, // 60 seconds for initial connection
    greetingTimeout: 30000,    // 30 seconds for SMTP greeting
    socketTimeout: 60000,      // 60 seconds for socket operations
    // Additional options for better reliability
    requireTLS: false,
    logger: env.NODE_ENV === "development",
    debug: env.NODE_ENV === "development",
  };

  // For production, validate and use actual SMTP settings
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "❌ Missing email credentials: EMAIL_USER and EMAIL_PASS must be set in production"
    );
  }

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const isGmail = smtpHost.includes("gmail.com");

  // For Gmail, use service name for better compatibility, otherwise use explicit host/port
  if (isGmail && !process.env.SMTP_HOST) {
    // Use Gmail service (simpler, handles all settings automatically)
    transporterInstance = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      ...connectionOptions,
    });
  } else {
    // Use explicit SMTP settings for custom providers
    transporterInstance = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE === "true" || smtpPort === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      ...(isGmail && {
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates if needed
        },
      }),
      ...connectionOptions,
    });
  }

  return transporterInstance;
};

/**
 * Send email function
 * @param options - Email options (to, subject, html, text)
 * @returns Promise with send result
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    // Verify connection before sending (optional but helps catch issues early)
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error("❌ SMTP connection verification failed:", verifyError);
      // Don't throw here, still try to send (some servers don't support verify)
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || "DPDP CMS <noreply@dpdp.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || "",
    };

    const info = await transporter.sendMail(mailOptions);

    if (env.NODE_ENV === "development") {
      console.log("📧 Email sent successfully!");
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    
    // Log more detailed error information
    if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED") {
      console.error(
        `❌ SMTP Connection Error: ${error.code}\n` +
        `   Host: ${process.env.SMTP_HOST || "smtp.gmail.com"}\n` +
        `   Port: ${process.env.SMTP_PORT || "587"}\n` +
        `   Check: 1) SMTP server is reachable, 2) Firewall rules, 3) Network connectivity`
      );
    } else if (error.code === "EAUTH") {
      const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
      const isGmail = smtpHost.includes("gmail.com");
      
      console.error(
        `❌ SMTP Authentication Error: Invalid credentials\n` +
        `   Host: ${smtpHost}\n` +
        `   User: ${process.env.EMAIL_USER || "NOT SET"}\n` +
        `   ${isGmail ? "⚠️  For Gmail:\n" : ""}` +
        `   ${isGmail ? "   1. Enable 2-Step Verification on your Google account\n" : ""}` +
        `   ${isGmail ? "   2. Generate an App Password (not your regular password)\n" : ""}` +
        `   ${isGmail ? "   3. Use the App Password as EMAIL_PASS\n" : ""}` +
        `   ${isGmail ? "   4. Go to: https://myaccount.google.com/apppasswords\n" : ""}` +
        `   Check: EMAIL_USER and EMAIL_PASS environment variables are correct`
      );
    }
    
    // Reset transporter on connection/auth errors to force reconnection
    if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED" || error.code === "ESOCKET" || error.code === "EAUTH") {
      transporterInstance = null;
    }
    
    return false;
  }
};

/**
 * Send OTP email
 * @param email - Recipient email address
 * @param otp - OTP code
 * @param userName - User's name
 * @returns Promise with send result
 */
export const sendOTPEmail = async (
  email: string,
  otp: string,
  userName: string = "User"
): Promise<boolean> => {
  const subject = "Your DPDP Login OTP Code";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-box { background-color: white; border: 2px dashed #4F46E5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .warning { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 DPDP Login Verification</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>
          <p>You have requested to login to your DPDP account. Please use the following OTP code to complete your authentication:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          
          <p><strong>This code will expire in 5 minutes.</strong></p>
          
          <div class="warning">
            ⚠️ <strong>Security Alert:</strong> If you did not request this code, please ignore this email and ensure your account is secure.
          </div>
          
          <p>Best regards,<br>DPDP Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} DPDP Consent Management System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Hello ${userName},
    
    You have requested to login to your DPDP account.
    
    Your OTP Code: ${otp}
    
    This code will expire in 5 minutes.
    
    If you did not request this code, please ignore this email.
    
    Best regards,
    DPDP Team
  `;

  return await sendEmail({ to: email, subject, html, text });
};