# Practo CMS Backend - API Documentation for Frontend

## 🚀 Base URL

**Production:** `https://practo-cms-backend-8.onrender.com`

**Development:** `http://localhost:5000` (if running locally)

---

## 📋 Authentication Endpoints

### 1. **Login (Email/Password)**
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "DOCTOR_CREATOR",
    "specialty": "Cardiology",
    "city": "Mumbai"
  },
  "permissions": {
    "canCreateTopic": true,
    "canReviewScript": false,
    // ... other permissions
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Server error

---

### 2. **Google OAuth Login**
**POST** `/api/auth/oauth/google`

**What is the token?**
The `token` is the **Google ID Token** (JWT) that you get from Google Sign-In on the frontend. This is NOT your backend JWT token - it's the token Google gives you when a user signs in with Google.

**How to get it:**
1. User clicks "Sign in with Google" on your frontend
2. Google Sign-In SDK returns an ID token
3. Send that Google ID token to this endpoint
4. Backend verifies it with Google and returns YOUR app's JWT token

**Request Body:**
```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1NiJ9..." // Google ID Token from Google Sign-In
}
```

**Frontend Example (React with Google Sign-In):**
```javascript
// After user signs in with Google
const response = await google.accounts.oauth2.initTokenClient({
  client_id: 'YOUR_GOOGLE_CLIENT_ID',
  callback: async (response) => {
    // response.credential is the Google ID Token
    const googleIdToken = response.credential;
    
    // Send to your backend
    const loginResponse = await fetch('https://practo-cms-backend-8.onrender.com/api/auth/oauth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleIdToken })
    });
    
    const data = await loginResponse.json();
    // data.token is YOUR app's JWT token - store this!
    localStorage.setItem('authToken', data.token);
  }
});
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "DOCTOR_CREATOR",
    "specialty": "Cardiology",
    "city": "Mumbai"
  },
  "permissions": { /* same as login */ }
}
```

**Error Responses:**
- `400`: Token missing
- `401`: Invalid token
- `403`: User not found or account inactive
- `500`: Server error

---

### 3. **Get Current User**
**GET** `/api/auth/me`

**Headers Required:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "DOCTOR_CREATOR",
    "status": "ACTIVE",
    "specialty": "Cardiology",
    "city": "Mumbai",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLoginAt": "2024-01-15T10:30:00.000Z",
    "name": "John Doe"
  },
  "permissions": { /* user permissions */ }
}
```

---

### 4. **Change Password**
**POST** `/api/auth/change-password`

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Responses:**
- `400`: Missing passwords or password too short (< 8 chars) or old password incorrect
- `401`: Unauthorized (invalid token)
- `404`: User not found

---

### 5. **Set Password (for OAuth users)**
**POST** `/api/auth/set-password`

**Headers Required:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "newPassword": "newpass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password set successfully"
}
```

---

### 6. **Refresh Token**
**POST** `/api/auth/refresh`

**Headers Required:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "new_jwt_token_here"
}
```

---

## 🔐 Authentication Flow

### Token Storage
- Store the JWT token in **localStorage** or **sessionStorage**
- Include token in **every authenticated request** as: `Authorization: Bearer <token>`
- Token expires in **30 days** (configurable)

### Token Usage Example
```javascript
// Store token after login
localStorage.setItem('authToken', response.token);
localStorage.setItem('user', JSON.stringify(response.user));

// Use in API calls
const token = localStorage.getItem('authToken');
fetch(`${API_URL}/api/auth/me`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📝 User Roles

Available roles in the system:
- `SUPER_ADMIN`
- `MEDICAL_REVIEWER`
- `BRAND_REVIEWER`
- `DOCTOR_CREATOR`
- `AGENCY_POC`
- `CONTENT_APPROVER`
- `PUBLISHER`
- `VIEWER`

---

## 👤 User Data Structure

### User Object (from API responses)

```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique email address
  firstName: string;             // First name
  lastName: string;              // Last name
  name?: string;                // Computed: firstName + lastName (in some responses)
  role: UserRole;                // One of the roles listed above
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  specialty?: string;            // Doctor's specialty (optional, for doctors)
  city?: string;                // User's city (optional)
  createdAt?: string;           // ISO date string (when account was created)
  lastLoginAt?: string;         // ISO date string (last login timestamp)
}
```

### User Status Values

- `ACTIVE` - User can log in and use the system
- `INACTIVE` - User account is disabled
- `SUSPENDED` - User account is temporarily suspended

### User Fields by Role

**Doctor-specific fields:**
- `specialty` - Medical specialty (e.g., "Cardiology", "Endocrinology")
- `city` - Doctor's practice city

**All users have:**
- `id`, `email`, `firstName`, `lastName`, `role`, `status`

**Note:** The `password` field is **never** returned in API responses for security reasons.

---

## ⚠️ Error Handling

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description here"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (user not found, inactive account)
- `404`: Not Found
- `500`: Internal Server Error

---

## 🔧 Frontend Environment Variables

Create a `.env` file in your frontend project:

```env
VITE_API_URL=https://practo-cms-backend-8.onrender.com
# or
REACT_APP_API_URL=https://practo-cms-backend-8.onrender.com
# (depending on your framework)

# For Google OAuth (if implementing on frontend)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 📦 Example Frontend Implementation

### React/Next.js Example:

```typescript
// api/auth.ts
const API_URL = process.env.VITE_API_URL || 'https://practo-cms-backend-8.onrender.com';

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: string;
    specialty?: string;
    city?: string;
  };
  permissions: Record<string, boolean>;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

export async function getCurrentUser(token: string) {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  return response.json();
}
```

---

## ✅ Testing the API

### Quick Test with cURL:

```bash
# Health check
curl https://practo-cms-backend-8.onrender.com/health

# Login
curl -X POST https://practo-cms-backend-8.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get current user (replace TOKEN)
curl https://practo-cms-backend-8.onrender.com/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 🚨 Important Notes for Frontend Dev

1. **CORS**: Currently set to `*` (all origins). For production, update `CORS_ORIGIN` in Render to your frontend domain.

2. **Token Expiry**: Tokens expire in 30 days. Implement token refresh logic or re-login flow.

3. **Error Handling**: Always check `response.success` and handle errors gracefully.

4. **Google OAuth**: 
   - Frontend needs to get Google ID token from Google Sign-In
   - Send that token to `/api/auth/oauth/google`
   - Backend will verify and return JWT token

5. **Password Requirements**: Minimum 8 characters

6. **User Status**: Check `user.status === "ACTIVE"` before allowing access

---

## 🧪 Test Credentials

**Note:** These test users need to be seeded in the database first. Contact backend team to run seed script if needed.

**Default Password for all test users:** `Admin@123`

### Available Test Users:

| Role | Email | Use Case |
|------|-------|----------|
| Super Admin | `admin@practo.com` | Full system access |
| Doctor Creator | `doctor@practo.com` | Create topics, scripts, videos |
| Medical Reviewer | `medical.reviewer@practo.com` | Review medical content |
| Brand Reviewer | `brand.reviewer@practo.com` | Review brand compliance |
| Content Approver | `approver@practo.com` | Approve and lock content |
| Publisher | `publisher@practo.com` | Publish videos |
| Agency POC | `agency@practo.com` | Agency point of contact |
| Viewer | `viewer@practo.com` | View-only access |

### Quick Test Login:

```bash
# Test login with Doctor account
curl -X POST https://practo-cms-backend-8.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@practo.com","password":"Admin@123"}'
```

---

## 📞 Support

If you encounter any issues:
1. Check the API response status and message
2. Verify the token is being sent correctly
3. Check browser console for CORS errors
4. Verify the API URL is correct
5. Ensure test users are seeded in the database

---

**Last Updated:** December 2024  
**API Version:** 1.0.0

