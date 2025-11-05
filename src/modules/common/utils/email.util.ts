/**
 * @fileoverview Email utility for sending emails using Resend
 * @module modules/common/utils/email
 */

import { Resend } from "resend";
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

// Cache Resend instance to reuse connections
let resendInstance: Resend | null = null;

/**
 * Get or create Resend instance
 */
const getResendInstance = (): Resend => {
  if (resendInstance) {
    return resendInstance;
  }

  // Validate Resend API key
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "❌ Missing Resend API key: RESEND_API_KEY must be set in environment variables"
    );
  }

  resendInstance = new Resend(process.env.RESEND_API_KEY);
  return resendInstance;
};

/**
 * Send email function
 * @param options - Email options (to, subject, html, text)
 * @returns Promise with send result
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const resend = getResendInstance();

    const emailFrom = process.env.EMAIL_FROM || "DPDP CMS <noreply@dpdp.com>";

    const result = await resend.emails.send({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (env.NODE_ENV === "development") {
      console.log("📧 Email sent successfully!");
      console.log("Email ID:", result.data?.id);
    }

    return true;
  } catch (error: any) {
    console.error("❌ Error sending email:", error);

    // Log more detailed error information
    if (error.message) {
      console.error(
        `❌ Resend API Error: ${error.message}\n` +
        `   Check: 1) RESEND_API_KEY is valid, 2) Email domain is verified in Resend, 3) From address is authorized`
      );
    }

    // Reset instance on errors to force reconnection
    if (error.statusCode === 401 || error.statusCode === 403) {
      resendInstance = null;
      console.error(
        `❌ Authentication Error: Invalid API key or unauthorized access\n` +
        `   Check: RESEND_API_KEY environment variable is correct`
      );
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