/**
 * Notification Worker
 * 
 * Processes notification jobs from Bull queue:
 * - Creates in-app notifications in database
 * - Sends/logs email notifications
 */

import prisma from '../../prisma/client.js';
import { NotificationType } from '../../generated/prisma/index.js';
import { notificationQueue } from './queue.js';

// Add queue event listeners for debugging
notificationQueue.on('waiting', (jobId) => {
  console.log(`⏳ Job ${jobId} is waiting`);
});

notificationQueue.on('active', (job) => {
  console.log(`🔄 Job ${job.id} started processing`);
});

notificationQueue.on('progress', (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${progress}%`);
});
import { sendEmail } from './email.service.js';
import type { NotificationJobData } from './notifications.service.js';

// ============================================================================
// WORKER PROCESSOR
// ============================================================================

/**
 * Process a notification job
 */
async function processNotificationJob(job: any) {
  const data: NotificationJobData = job.data;
  
  console.log(`📬 Processing notification job: ${data.eventType} for ${data.recipientIds.length} recipients`);

  try {
    // Create in-app notifications for each recipient (skip if user doesn't exist)
    const validUsers = await prisma.user.findMany({
      where: { id: { in: data.recipientIds } },
      select: { id: true }
    });
    
    const validUserIds = validUsers.map(u => u.id);
    
    if (validUserIds.length > 0) {
      const notificationPromises = validUserIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            type: NotificationType.IN_APP,
            title: data.title,
            message: data.message,
            metadata: data.metadata || {},
          },
        })
      );

      await Promise.all(notificationPromises);
      console.log(`✅ Created ${validUserIds.length} in-app notifications`);
    } else {
      console.log(`⚠️ No valid users found for notification`);
    }

    // Send/log email notifications if email data is provided
    if (data.emailSubject && data.emailHtml) {
      // Get user emails
      const users = await prisma.user.findMany({
        where: {
          id: { in: data.recipientIds },
        },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      // Send email to each user (or log in dev mode)
      const emailPromises = users
        .filter((user) => user.email) // Only users with email
        .map((user) =>
          sendEmail({
            to: user.email!,
            subject: data.emailSubject!,
            html: data.emailHtml!,
          })
        );

      await Promise.all(emailPromises);
      console.log(`📧 Processed ${emailPromises.length} email notifications`);
    }

    return { success: true, processed: data.recipientIds.length };
  } catch (error: any) {
    console.error(`❌ Error processing notification job:`, error);
    throw error; // Bull will retry
  }
}

// ============================================================================
// START WORKER
// ============================================================================

/**
 * Start the notification worker
 * Call this from your server.ts or a separate worker process
 */
export function startNotificationWorker() {
  console.log('🚀 Starting notification worker...');

  notificationQueue.process('send-notification', async (job) => {
    return await processNotificationJob(job);
  });

  // Process test email jobs
  notificationQueue.process('send-test-email', async (job) => {
    return await processTestEmailJob(job);
  });

  console.log('✅ Notification worker started and listening for jobs');
}

/**
 * Process test email job (sends directly to specified email)
 */
async function processTestEmailJob(job: any) {
  const { to, subject, html, from } = job.data;
  
  console.log(`📧 Processing test email to: ${to}`);

  try {
    const { sendEmail } = await import('./email.service.js');
    
    const success = await sendEmail({
      to: to,
      subject: subject,
      html: html,
      from: from || undefined // Use custom from if provided
    });

    if (success) {
      console.log(`✅ Test email sent successfully to: ${to}`);
      return { success: true, recipient: to };
    } else {
      throw new Error('Email sending failed');
    }
  } catch (error: any) {
    console.error(`❌ Test email failed:`, error);
    throw error;
  }
}

// Auto-start if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startNotificationWorker();
}

export default { startNotificationWorker };

