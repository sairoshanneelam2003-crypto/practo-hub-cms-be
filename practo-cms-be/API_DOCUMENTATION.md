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

**Request Body:**
```json
{
  "token": "google_id_token_here"
}
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

## 📞 Support

If you encounter any issues:
1. Check the API response status and message
2. Verify the token is being sent correctly
3. Check browser console for CORS errors
4. Verify the API URL is correct

---

**Last Updated:** December 2024  
**API Version:** 1.0.0

