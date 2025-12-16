# Notification Service Setup - Complete

## ✅ What Has Been Implemented

### 1. **Queue Infrastructure (Bull + Redis)**
- ✅ Bull queue configured for async notification processing
- ✅ Redis connection setup (supports REDIS_URL or individual config)
- ✅ Retry logic: 3 attempts with exponential backoff
- ✅ Job cleanup: keeps last 100 completed, 500 failed

### 2. **Email Service (Development Mode)**
- ✅ Email service logs to console (no AWS/Resend needed yet)
- ✅ Ready to swap to Resend/AWS SES later (just replace `sendEmail` function)
- ✅ Email templates included for all notification types

### 3. **Notification Service (Event Handlers)**
- ✅ 10 event types supported:
  - `TOPIC_ASSIGNED` - When topic assigned to doctor
  - `SCRIPT_SUBMITTED` - Script uploaded for review
  - `SCRIPT_APPROVED` - Script approved, moves to next stage
  - `SCRIPT_REJECTED` - Script rejected, returns to agency
  - `SCRIPT_LOCKED` - Script locked, ready for video
  - `VIDEO_SUBMITTED` - Video uploaded for review
  - `VIDEO_APPROVED` - Video approved, moves to next stage
  - `VIDEO_REJECTED` - Video rejected, returns to agency
  - `VIDEO_LOCKED` - Video locked, ready for publishing
  - `VIDEO_PUBLISHED` - Video published to Practo Hub

### 4. **Notification Worker**
- ✅ Processes Bull queue jobs
- ✅ Creates in-app notifications in database
- ✅ Logs email payloads (for now)
- ✅ Automatic retries on failure

### 5. **API Endpoints**
- ✅ `GET /api/notifications` - Get user's notifications
- ✅ `GET /api/notifications/unread-count` - Get unread count (for badge)
- ✅ `PATCH /api/notifications/:id/read` - Mark one as read
- ✅ `PATCH /api/notifications/read-all` - Mark all as read

### 6. **Workflow Integration**
- ✅ Notifications triggered automatically on:
  - Script transitions (SUBMIT, APPROVE, REJECT, LOCK)
  - Video transitions (SUBMIT, APPROVE, REJECT, LOCK, PUBLISH)
  - Topic assignment
- ✅ Non-blocking (async, doesn't slow down workflow)

---

## 📁 File Structure

```
src/modules/notifications/
├── queue.ts                    # Bull + Redis setup
├── email.service.ts            # Email service (logs for now)
├── notifications.service.ts   # Event handlers, recipient resolution
├── notifications.worker.ts    # Queue job processor
├── notifications.controller.ts # API endpoints
└── notifications.routes.ts    # Express routes
```

---

## 🔧 Environment Variables Needed

### Required for Queue (Redis):
```bash
# Option 1: Single URL (recommended)
REDIS_URL=redis://localhost:6379

# Option 2: Individual config
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional
```

### Optional (for future email setup):
```bash
# When Resend is ready:
RESEND_API_KEY=re_...

# When AWS SES is ready:
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SES_FROM_EMAIL=notifications@gamyam.co
SES_FROM_NAME=Practo Hub CMS
```

---

## 🚀 How It Works

### Flow Example: Script Approved

1. **User approves script** → `POST /api/scripts/:id/transition` (APPROVE)
2. **Workflow Service** → Updates DB, then calls `NotificationService.enqueueEvent()`
3. **Notification Service** → Determines recipients, builds message, adds job to Bull queue
4. **API returns** → Fast response (notification is async)
5. **Worker processes job** → Creates DB notifications + logs email
6. **User sees notification** → Frontend calls `GET /api/notifications`

---

## 📊 Recipient Rules (Per Event)

| Event | Recipients |
|-------|-----------|
| `TOPIC_ASSIGNED` | Assigned Doctor |
| `SCRIPT_SUBMITTED` | All Medical Reviewers |
| `SCRIPT_APPROVED` | Next stage reviewers + Agency POC |
| `SCRIPT_REJECTED` | Agency POC (with feedback) |
| `SCRIPT_LOCKED` | All stakeholders (Doctor, Agency, Reviewers) |
| `VIDEO_SUBMITTED` | All Brand Reviewers |
| `VIDEO_APPROVED` | Next stage reviewers + Agency POC |
| `VIDEO_REJECTED` | Agency POC (with feedback) |
| `VIDEO_LOCKED` | All stakeholders |
| `VIDEO_PUBLISHED` | Assigned Doctor |

---

## 🧪 Testing

### 1. Start Redis (if local):
```bash
# Docker
docker run -d -p 6379:6379 redis:7

# Or install locally
redis-server
```

### 2. Start Server:
```bash
npm run dev
```

You should see:
```
🚀 Starting notification worker...
✅ Notification worker started and listening for jobs
🚀 Server running on port 5000
```

### 3. Trigger a Notification:
- Create a topic → Doctor gets notification
- Submit a script → Medical reviewers get notification
- Approve a script → Next reviewers + Agency get notification

### 4. Check Results:
- **Database**: Check `notifications` table for new rows
- **Console**: See email logs (📧 EMAIL NOTIFICATION)
- **API**: Call `GET /api/notifications` as the recipient user

---

## 🔄 Future: Adding Real Email (Resend)

When Resend is ready, just update `email.service.ts`:

```typescript
// Replace the sendEmail function with:
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: options.html,
  });
  return true;
}
```

That's it! No other code changes needed.

---

## 📝 Notes

- **In-app notifications work immediately** (stored in DB)
- **Email notifications log to console** (for now)
- **Queue is async** - doesn't block workflow APIs
- **Retries automatically** if job fails
- **All notification logic is centralized** in `notifications.service.ts`

---

## ✅ Setup Complete!

The notification service is fully integrated and ready to use. Just make sure Redis is running, and notifications will work automatically when workflow events occur.
