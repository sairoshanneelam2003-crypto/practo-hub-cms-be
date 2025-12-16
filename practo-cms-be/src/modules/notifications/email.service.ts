/**
 * Email Service - Development Version (No AWS/Resend Required)
 * 
 * Currently logs emails to console. Easy to swap to Resend/AWS SES later.
 * Just replace the sendEmail function when credentials are available.
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email (Development: logs to console)
 * 
 * TODO: When Resend/AWS SES is available, replace this implementation.
 * 
 * Example Resend implementation:
 * ```typescript
 * import { Resend } from 'resend';
 * const resend = new Resend(process.env.RESEND_API_KEY);
 * await resend.emails.send({
 *   from: process.env.FROM_EMAIL,
 *   to: Array.isArray(options.to) ? options.to : [options.to],
 *   subject: options.subject,
 *   html: options.html,
 * });
 * ```
 * 
 * Example AWS SES implementation:
 * ```typescript
 * import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
 * const sesClient = new SESClient({
 *   region: process.env.AWS_REGION || 'ap-south-1',
 *   credentials: {
 *     accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
 *     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
 *   },
 * });
 * const command = new SendEmailCommand({
 *   Source: `${process.env.SES_FROM_NAME} <${process.env.SES_FROM_EMAIL}>`,
 *   Destination: { ToAddresses: Array.isArray(options.to) ? options.to : [options.to] },
 *   Message: {
 *     Subject: { Data: options.subject, Charset: 'UTF-8' },
 *     Body: {
 *       Html: { Data: options.html, Charset: 'UTF-8' },
 *       ...(options.text && { Text: { Data: options.text, Charset: 'UTF-8' } }),
 *     },
 *   },
 * });
 * await sesClient.send(command);
 * ```
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    // Development: Log email to console
    console.log('\n📧 ============================================');
    console.log('📧 EMAIL NOTIFICATION (Development Mode)');
    console.log('📧 ============================================');
    console.log(`📧 To: ${recipients.join(', ')}`);
    console.log(`📧 Subject: ${options.subject}`);
    console.log('📧 Body (HTML):');
    console.log(options.html);
    if (options.text) {
      console.log('📧 Body (Text):');
      console.log(options.text);
    }
    console.log('📧 ============================================\n');
    
    // In production with Resend/AWS SES, this would actually send the email
    // For now, we just log it so you can see what emails would be sent
    
    return true;
  } catch (error: any) {
    console.error('❌ Error in email service:', error);
    return false;
  }
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

