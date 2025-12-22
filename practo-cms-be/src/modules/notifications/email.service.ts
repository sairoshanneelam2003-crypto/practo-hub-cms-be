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
  from?: string;
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
    
    // OVERRIDE: Send all emails to monitoring address
    const monitoringEmail = 'roshan.neelam@gmail.com'; // Try Gmail instead
    const originalRecipients = recipients.join(', ');
    
    // Check if we have email service configured
    if (process.env.RESEND_API_KEY) {
      // Override recipients but include original in subject
      const monitoringOptions = {
        ...options,
        to: monitoringEmail,
        subject: `[MONITOR] ${options.subject} (Original: ${originalRecipients})`
      };
      return await sendWithResend(monitoringOptions, [monitoringEmail]);
    } else if (process.env.AWS_ACCESS_KEY_ID && process.env.SES_FROM_EMAIL) {
      const monitoringOptions = {
        ...options,
        to: monitoringEmail,
        subject: `[MONITOR] ${options.subject} (Original: ${originalRecipients})`
      };
      return await sendWithAWSSES(monitoringOptions, [monitoringEmail]);
    } else {
      // Development: Log email to console + send to monitoring email
      console.log('\n📧 ============================================');
      console.log('📧 EMAIL NOTIFICATION (Development Mode)');
      console.log('📧 ============================================');
      console.log(`📧 Original Recipients: ${originalRecipients}`);
      console.log(`📧 Monitoring Email: ${monitoringEmail}`);
      console.log(`📧 Subject: ${options.subject}`);
      console.log('📧 Body (HTML):');
      console.log(options.html);
      console.log('📧 ============================================\n');
      return true;
    }
  } catch (error: any) {
    console.error('❌ Error in email service:', error);
    return false;
  }
}

/**
 * Send email using Resend (easier setup)
 */
async function sendWithResend(options: EmailOptions, recipients: string[]): Promise<boolean> {
  try {
    // Dynamic import to avoid requiring Resend if not used
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: options.from || process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: recipients,
      subject: options.subject,
      html: options.html,
    });
    
    console.log(`✅ Email sent via Resend to: ${recipients.join(', ')}`);
    return true;
  } catch (error: any) {
    console.error('❌ Resend email failed:', error);
    return false;
  }
}

/**
 * Send email using AWS SES (as per technical specs)
 */
async function sendWithAWSSES(options: EmailOptions, recipients: string[]): Promise<boolean> {
  try {
    // Dynamic import to avoid requiring AWS SDK if not used
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');
    
    const sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    
    const command = new SendEmailCommand({
      Source: `${process.env.SES_FROM_NAME || 'Practo CMS'} <${process.env.SES_FROM_EMAIL}>`,
      Destination: { ToAddresses: recipients },
      Message: {
        Subject: { Data: options.subject, Charset: 'UTF-8' },
        Body: {
          Html: { Data: options.html, Charset: 'UTF-8' },
          ...(options.text && { Text: { Data: options.text, Charset: 'UTF-8' } }),
        },
      },
    });
    
    await sesClient.send(command);
    console.log(`✅ Email sent via AWS SES to: ${recipients.join(', ')}`);
    return true;
  } catch (error: any) {
    console.error('❌ AWS SES email failed:', error);
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

