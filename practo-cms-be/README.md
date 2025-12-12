# Practo Hub CMS - Backend API

A full-stack workflow management platform for doctor-created medical video content with multi-stage approvals, RBAC, and AI-powered features.

## 🚀 Tech Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Authentication**: JWT (RS256) + bcrypt
- **Validation**: Zod

## 📋 Features

- ✅ Multi-stage approval workflows (Topic → Script → Video → Publish)
- ✅ 8-role RBAC system
- ✅ One-step-back rejection logic
- ✅ Claim-based review queue system
- ✅ Version control for scripts and videos
- ✅ Audit logging
- ✅ Comment system

## 🏗️ Project Structure

```
practo-cms-be/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts            # Seed data
│   └── migrations/        # Database migrations
├── src/
│   ├── app.ts             # Express app setup
│   ├── server.ts          # Server entry point
│   ├── config/
│   │   ├── constants.ts   # Workflow transitions
│   │   └── permissions.ts # RBAC configuration
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── checkPermission.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── workflow.service.ts
│   ├── modules/
│   │   ├── topics/
│   │   ├── scripts/
│   │   ├── videos/
│   │   ├── doctor-pointers/
│   │   └── comments/
│   └── routes/
└── package.json
```

## 🛠️ Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:Gamyam-Info-Tech/practo-cms-be.git
cd practo-cms-be

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed the database (creates test users)
npx prisma db seed

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://username@localhost:5432/practo_cms
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
PORT=3001
```

## 👥 User Roles

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Full system access |
| `MEDICAL_REVIEWER` | Reviews medical accuracy |
| `BRAND_REVIEWER` | Reviews brand compliance |
| `DOCTOR_CREATOR` | Creates content, final approval |
| `AGENCY_POC` | Uploads scripts and videos |
| `CONTENT_APPROVER` | Locks approved content |
| `PUBLISHER` | Publishes to Practo Hub |
| `VIEWER` | Read-only access |

### Test Users (Password: `Admin@123`)

| Email | Role |
|-------|------|
| admin@practo.com | SUPER_ADMIN |
| medical.reviewer@practo.com | MEDICAL_REVIEWER |
| brand.reviewer@practo.com | BRAND_REVIEWER |
| doctor@practo.com | DOCTOR_CREATOR |
| agency@practo.com | AGENCY_POC |
| content.approver@practo.com | CONTENT_APPROVER |
| publisher@practo.com | PUBLISHER |
| viewer@practo.com | VIEWER |

## 🔄 Workflow

### Script Workflow
```
DRAFT → MEDICAL_REVIEW → BRAND_REVIEW → DOCTOR_REVIEW → APPROVED → LOCKED
```

### Video Workflow
```
DRAFT → BRAND_REVIEW → MEDICAL_REVIEW → DOCTOR_REVIEW → APPROVED → LOCKED → PUBLISHED
```

### Rejection Logic (One-Step-Back)
- MEDICAL_REVIEW reject → DRAFT
- BRAND_REVIEW reject → MEDICAL_REVIEW
- DOCTOR_REVIEW reject → BRAND_REVIEW

---

# 📚 API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All protected routes require a Bearer token:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@practo.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@practo.com",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN"
  }
}
```

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "VIEWER"
}
```

---

## User Endpoints

### Get All Users
```http
GET /api/users
Authorization: Bearer <token>
```

### Get Doctors
```http
GET /api/users/doctors
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "doctors": [
    {
      "id": "uuid",
      "firstName": "Dr. Ramesh",
      "lastName": "Kumar",
      "email": "doctor@practo.com",
      "specialty": "Cardiology",
      "city": "Mumbai"
    }
  ]
}
```

---

## Topic Endpoints

### Create Topic
```http
POST /api/topics
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Managing Diabetes in Summer",
  "description": "Educational video about diabetes management",
  "assignedDoctorId": "doctor-uuid"
}
```

### Get All Topics
```http
GET /api/topics
Authorization: Bearer <token>
```

### Get My Assigned Topics (Doctor)
```http
GET /api/topics/my-assignments
Authorization: Bearer <token>
```

### Get Topic by ID
```http
GET /api/topics/:id
Authorization: Bearer <token>
```

---

## Doctor Pointer Endpoints

### Create Doctor Pointer
```http
POST /api/doctor-pointers
Authorization: Bearer <token>
Content-Type: application/json

{
  "topicId": "topic-uuid",
  "notes": "Focus on hydration and insulin timing...",
  "fileUrl": "https://s3.../file.pdf",
  "fileType": "pdf"
}
```

### Get Pointers by Topic
```http
GET /api/doctor-pointers/topic/:topicId
Authorization: Bearer <token>
```

---

## Script Endpoints

### Create Script
```http
POST /api/scripts
Authorization: Bearer <token>
Content-Type: application/json

{
  "topicId": "topic-uuid",
  "content": "Script content here..."
}
```

### Get Script by ID
```http
GET /api/scripts/:id
Authorization: Bearer <token>
```

### Get Scripts by Topic
```http
GET /api/scripts/topic/:topicId
Authorization: Bearer <token>
```

### Update Script (DRAFT only)
```http
PATCH /api/scripts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content..."
}
```

### Get Review Queue
```http
GET /api/scripts/queue
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "available": [
    { "id": "script-1", "title": "...", "assignedReviewerId": null }
  ],
  "myReviews": [
    { "id": "script-2", "title": "...", "assignedReviewerId": "my-id" }
  ],
  "total": 2
}
```

### Claim Script for Review
```http
POST /api/scripts/:id/claim
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Script claimed successfully. You can now review it.",
  "script": { ... }
}
```

**Response (Already Claimed):**
```json
{
  "success": false,
  "message": "Script is already being reviewed by Dr. Anil Kumar. Please select another script."
}
```

### Release Script
```http
POST /api/scripts/:id/release
Authorization: Bearer <token>
```

### Submit Script for Review
```http
POST /api/scripts/:id/submit
Authorization: Bearer <token>
```
*Moves: DRAFT → MEDICAL_REVIEW*

### Approve Script
```http
POST /api/scripts/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "comments": "Approved. Content is accurate."
}
```

### Reject Script
```http
POST /api/scripts/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "comments": "Please fix the medication dosage mentioned."
}
```
*Moves one step back*

### Lock Script
```http
POST /api/scripts/:id/lock
Authorization: Bearer <token>
```
*Only Content Approver or Super Admin*

### Unlock Script (Emergency)
```http
POST /api/scripts/:id/unlock
Authorization: Bearer <token>
```
*Only Super Admin*

### Get Script Reviews
```http
GET /api/scripts/:id/reviews
Authorization: Bearer <token>
```

---

## Video Endpoints

### Create Video
```http
POST /api/videos
Authorization: Bearer <token>
Content-Type: application/json

{
  "topicId": "topic-uuid",
  "scriptId": "script-uuid",
  "title": "Managing Diabetes in Summer",
  "description": "Dr. Kumar explains diabetes management",
  "videoUrl": "https://s3.../video.mp4",
  "thumbnailUrl": "https://s3.../thumb.jpg",
  "duration": 240,
  "doctorName": "Dr. Ramesh Kumar",
  "specialty": "Cardiology",
  "language": "Hindi",
  "city": "Mumbai",
  "ctaType": "CONSULT",
  "tags": ["diabetes", "summer", "health"]
}
```

### Get Video by ID
```http
GET /api/videos/:id
Authorization: Bearer <token>
```

### Submit Video for Review
```http
POST /api/videos/:id/submit
Authorization: Bearer <token>
```

### Approve Video
```http
POST /api/videos/:id/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "comments": "Video quality is good. Approved."
}
```

### Reject Video
```http
POST /api/videos/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "comments": "Audio quality needs improvement."
}
```

### Lock Video
```http
POST /api/videos/:id/lock
Authorization: Bearer <token>
```

### Publish Video
```http
POST /api/videos/:id/publish
Authorization: Bearer <token>
```
*Only Publisher or Super Admin*

---

## Comment Endpoints

### Add Comment
```http
POST /api/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "scriptId": "script-uuid",  // OR videoId
  "content": "Please review the second paragraph."
}
```

### Get Comments for Script
```http
GET /api/comments/script/:scriptId
Authorization: Bearer <token>
```

### Get Comments for Video
```http
GET /api/comments/video/:videoId
Authorization: Bearer <token>
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🧪 Testing the Complete Workflow

```bash
# 1. Login as Admin
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@practo.com", "password": "Admin@123"}' | jq -r '.token')

# 2. Get Doctors
curl -s http://localhost:3001/api/users/doctors \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Create Topic
curl -s -X POST http://localhost:3001/api/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Diabetes Management",
    "description": "Educational content",
    "assignedDoctorId": "<doctor-id>"
  }' | jq

# 4. Continue with doctor login, agency upload, reviews...
```

---

## 📄 License

Proprietary - Gamyam Info Tech

## 🤝 Contributing

Internal development only.

