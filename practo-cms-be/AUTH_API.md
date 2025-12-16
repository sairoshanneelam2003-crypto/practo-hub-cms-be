# Practo CMS – Auth API (React Frontend Handoff)

## Base URL
- **Production**: `https://practo-cms-backend-8.onrender.com`

## Health
- **GET** `/health`
- **Expected**:
```json
{"status":"healthy"}
```

---

## Authentication model (read this first)
- Backend uses **JWT Bearer token** auth.
- After login, backend returns:
  - `token` = **our app JWT**
  - `user` = user profile fields
  - `permissions` = string array (RBAC)
- For protected APIs, always send:
  - `Authorization: Bearer <token>`

### JWT payload contains
- `userId`
- `role`
- `email`
- plus `iat`, `exp`

---

## TypeScript types (React-friendly)

> Use these interfaces on the frontend to avoid guessing response shapes.

```ts
export type UserRole =
  | "SUPER_ADMIN"
  | "MEDICAL_REVIEWER"
  | "BRAND_REVIEWER"
  | "DOCTOR_CREATOR"
  | "AGENCY_POC"
  | "CONTENT_APPROVER"
  | "PUBLISHER"
  | "VIEWER";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

// Permissions are returned as an array of strings.
// You can type it as string[] for flexibility, or tighten it later to a union.
export type Permission = string;

export interface AuthUser {
  id: string; // UUID
  email: string;
  firstName: string;
  lastName: string;
  name: string; // computed in API response
  role: UserRole;
  specialty: string | null;
  city: string | null;
}

export interface LoginResponse {
  success: true;
  token: string; // our app JWT
  user: AuthUser;
  permissions: Permission[];
}

export interface MeUser extends AuthUser {
  status: UserStatus;
  createdAt: string; // ISO date
  lastLoginAt: string | null; // ISO date or null
}

export interface MeResponse {
  success: true;
  user: MeUser;
  permissions: Permission[];
}

export interface RefreshResponse {
  success: true;
  token: string; // new JWT
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}
```

---

## User table (DB schema reference)

This is the backend **User model** shape from Prisma (for reference). Frontend will mostly use the API `user` object, but this helps understand what exists in DB.

```ts
/**
 * Prisma model: User
 * Table: users
 */
export interface UserTable {
  id: string; // UUID
  email: string; // unique
  password: string; // bcrypt hash (NEVER returned by API)
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus; // default ACTIVE

  // Doctor-specific (nullable)
  specialty: string | null;
  city: string | null;

  // OAuth (nullable, unique)
  googleId: string | null;

  // Timestamps
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  lastLoginAt: string | null; // ISO date or null
}
```

---

## Auth APIs (6 total)

### 1) Email/Password Login
- **POST** `/api/auth/login`

**Body:**
```json
{
  "email": "admin@practo.com",
  "password": "Admin@123"
}
```

**Success (200) – actual response contract:**
```json
{
  "success": true,
  "token": "JWT_HERE",
  "user": {
    "id": "uuid",
    "email": "admin@practo.com",
    "name": "Super Admin",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN",
    "specialty": null,
    "city": null
  },
  "permissions": ["create_user", "edit_user"]
}
```

**Errors:**
- `400` Email/password missing
- `401` Invalid credentials
- `500` Server error

---

### 2) Google OAuth Login
- **POST** `/api/auth/oauth/google`

**Body:**
```json
{
  "token": "GOOGLE_ID_TOKEN_HERE"
}
```

#### What is this `token`?
- This is the **Google ID Token (JWT)** from Google Sign‑In on the frontend.
- It typically starts with `eyJ...`
- Backend verifies this using `GOOGLE_CLIENT_ID` and returns **our app JWT**.

**Success (200) – same structure as login:**
```json
{
  "success": true,
  "token": "OUR_APP_JWT_HERE",
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
  "permissions": ["upload_pointers", "approve_script"]
}
```

**Important behavior:**
- If the Google email **does not exist** in DB → `403 User not found`
- If user exists but `status != ACTIVE` → `403 Account is inactive`

**Frontend needs (public env var):**
- `REACT_APP_GOOGLE_CLIENT_ID=581506113726-5i1dpgj13fq69d08agpjdbrpctc96o56.apps.googleusercontent.com`

---

### 3) Get Current User (session restore)
- **GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Success (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "firstName": "Dr. Ramesh",
    "lastName": "Kumar",
    "email": "doctor@practo.com",
    "role": "DOCTOR_CREATOR",
    "status": "ACTIVE",
    "specialty": "Cardiology",
    "city": "Mumbai",
    "createdAt": "ISO_DATE",
    "lastLoginAt": "ISO_DATE",
    "name": "Dr. Ramesh Kumar"
  },
  "permissions": ["upload_pointers", "approve_script"]
}
```

---

### 4) Refresh Token
- **POST** `/api/auth/refresh`

**Headers:**
```
Authorization: Bearer <token>
```

**Success (200):**
```json
{ "success": true, "token": "NEW_JWT" }
```

> Note: This requires a valid JWT (this is not a separate refresh-token system).

---

### 5) Change Password (email/password users)
- **POST** `/api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "oldPassword": "Admin@123",
  "newPassword": "Admin@1234"
}
```

**Rule:** `newPassword` must be at least 8 characters.

---

### 6) Set Password (intended for OAuth users)
- **POST** `/api/auth/set-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{ "newPassword": "SomeStrongPass123" }
```

**Important note:**
- This does **not** require `oldPassword`.
- Intended as “set initial password” after Google OAuth.
- Email/password users should use **change-password**.

---

## Test credentials (for FE testing)
Password for all seeded users: **Admin@123**
- `admin@practo.com` (SUPER_ADMIN)
- `doctor@practo.com` (DOCTOR_CREATOR)
- `medical.reviewer@practo.com` (MEDICAL_REVIEWER)
- `brand.reviewer@practo.com` (BRAND_REVIEWER)
- `agency@practo.com` (AGENCY_POC)
- `approver@practo.com` (CONTENT_APPROVER)
- `publisher@practo.com` (PUBLISHER)
- `viewer@practo.com` (VIEWER)

---

## React integration (recommended pattern)

### `.env` (React)
```env
REACT_APP_API_URL=https://practo-cms-backend-8.onrender.com
REACT_APP_GOOGLE_CLIENT_ID=581506113726-5i1dpgj13fq69d08agpjdbrpctc96o56.apps.googleusercontent.com
```

### Store token after login
Store `token`, `user`, and `permissions` in `localStorage` or `sessionStorage`.

### Attach token on every request (fetch helper)
```js
const API_URL = process.env.REACT_APP_API_URL;

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}
```

### Session restore on app load
- On app boot, call `GET /api/auth/me` with Bearer token
- If you get `401`, clear token and redirect to login

---

## Postman quick setup (optional)
Environment:
- `baseUrl = https://practo-cms-backend-8.onrender.com`
- `token = (auto set)`

Login request → Tests:
```js
const data = pm.response.json();
pm.environment.set("token", data.token);
```


