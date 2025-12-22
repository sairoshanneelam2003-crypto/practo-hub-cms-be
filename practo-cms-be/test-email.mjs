// Quick email test
import { sendEmail } from './src/modules/notifications/email.service.ts';

async function testEmail() {
  console.log('🧪 Testing email monitoring system...');
  
  const result = await sendEmail({
    to: 'doctor@example.com', // This will be redirected to roshan.neelam@gamyam.co
    subject: 'Test: Script Submitted for Review',
    html: `
      <h2>Test Script Submitted for Review</h2>
      <p>This is a test email to verify the monitoring system is working.</p>
      <ul>
        <li><strong>Original Recipient:</strong> doctor@example.com</li>
        <li><strong>Monitoring Email:</strong> roshan.neelam@gamyam.co</li>
        <li><strong>Action:</strong> SCRIPT_SUBMITTED</li>
      </ul>
      <p>If you receive this email at roshan.neelam@gamyam.co, the monitoring is working correctly! 🎉</p>
    `
  });
  
  console.log('📧 Email test result:', result ? '✅ SUCCESS - Check roshan.neelam@gamyam.co' : '❌ FAILED');
}

testEmail();