# Render Deployment Guide

This guide will help you deploy the Practo CMS Backend to Render.

## Prerequisites

1. GitHub account with the repository pushed
2. Render account (sign up at https://render.com)
3. PostgreSQL database (can be created on Render)
4. Redis instance (for notification queue - can be created on Render)
5. AWS S3 credentials (for file storage)

## Step 1: Create PostgreSQL Database on Render

1. Go to your Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `practo-cms-db` (or your preferred name)
   - **Database**: `practo_cms` (or your preferred name)
   - **User**: Auto-generated
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 14 or higher
4. Click "Create Database"
5. **Important**: Copy the **Internal Database URL** (you'll need this)

## Step 2: Create Redis Instance on Render

1. In Render Dashboard, click "New +" → "Redis"
2. Configure:
   - **Name**: `practo-cms-redis` (or your preferred name)
   - **Region**: Same as your database and web service
   - **Plan**: Free tier (or paid for production)
   - **Redis Version**: Latest (7.x recommended)
3. Click "Create Redis"
4. **Important**: Copy the **Internal Redis URL** (you'll need this)
   - Format: `redis://red-xxxxx:6379` or `redis://default:password@red-xxxxx:6379`
   - **Use Internal URL** (not External) for better performance and security

**Note**: If you prefer external Redis (Upstash, Railway, etc.), you can use that too. Just get the connection URL.

## Step 3: Create Web Service on Render

1. In Render Dashboard, click "New +" → "Web Service"
2. Connect your GitHub account if not already connected
3. Select repository: `sai-roshan-dev/practo-cms-backend`
4. Configure the service:

### Basic Settings:
- **Name**: `practo-cms-backend`
- **Region**: Same as your database
- **Branch**: `main`
- **Root Directory**: `practo-cms-be` (important!)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `npm start`

### Seeding default users (incl. OAuth test admins)

This repo includes a seed script (`npm run prisma:seed`) that upserts default users.

- If you have Render Shell access, you can run it manually.
- If you **don’t** have Shell access, configure your Render build command to run the seed automatically after migrations:

`npm install && npm run build && npx prisma generate && npx prisma migrate deploy && npm run prisma:seed`

### Environment Variables:

Add the following environment variables in the Render dashboard:

#### Required Variables:

1. **DATABASE_URL**
   - Value: Your PostgreSQL Internal Database URL from Step 1
   - Format: `postgresql://user:password@host:port/database?sslmode=require`

2. **JWT_SECRET**
   - Value: A strong random string (at least 32 characters)
   - Generate one: `openssl rand -base64 32`
   - Example: `your-super-secret-jwt-key-here-minimum-32-chars`

3. **NODE_ENV**
   - Value: `production`

4. **PORT**
   - Value: `3000` (or leave empty, Render sets this automatically)

#### Optional but Recommended:

5. **CORS_ORIGIN**
   - Value: Your frontend URL (e.g., `https://your-frontend-domain.com`)
   - For development: `*` (allows all origins)
   - For production: Your specific frontend domain

6. **JWT_EXPIRES_IN**
   - Value: `7d` (default) or your preferred expiration

#### AWS S3 Configuration (Required for file uploads):

7. **AWS_REGION**
   - Value: Your AWS region (e.g., `ap-south-1`)

8. **AWS_ACCESS_KEY_ID**
   - Value: Your AWS Access Key ID

9. **AWS_SECRET_ACCESS_KEY**
   - Value: Your AWS Secret Access Key

10. **S3_BUCKET_NAME**
    - Value: Your S3 bucket name (e.g., `practo-hub-videos`)

#### Google OAuth (Required for Google login):

11. **GOOGLE_CLIENT_ID**
    - Value: Your Google OAuth Client ID
    - Get from: https://console.cloud.google.com/apis/credentials

### Advanced Settings:

- **Auto-Deploy**: `Yes` (deploys automatically on git push)
- **Health Check Path**: `/health`

## Step 4: Deploy

1. Click "Create Web Service"
2. Render will start building your application
3. Monitor the build logs for any errors
4. Once deployed, you'll get a URL like: `https://practo-cms-backend.onrender.com`

## Step 5: Verify Deployment

1. Check health endpoint: `https://your-app-url.onrender.com/health`
   - Should return: `{"status":"healthy"}`

2. Check root endpoint: `https://your-app-url.onrender.com/`
   - Should return API information

## Step 6: Run Database Migrations (if needed)

If migrations didn't run during build, you can run them manually:

1. Go to your service in Render
2. Open "Shell" tab
3. Run: `npx prisma migrate deploy`

## Troubleshooting

### Build Fails

- Check build logs for errors
- Ensure `Root Directory` is set to `practo-cms-be`
- Verify all dependencies are in `package.json`

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Use Internal Database URL (not external)
- Check database is running and accessible

### Application Crashes

- Check application logs in Render dashboard
- Verify all required environment variables are set
- Check if PORT is being used correctly (Render sets this automatically)

### Prisma Issues

- Ensure `DATABASE_URL` is set correctly
- Check Prisma migrations are running: `npx prisma migrate deploy`
- Verify Prisma client is generated: `npx prisma generate`

### Redis Connection Issues

- Verify `REDIS_URL` is set correctly
- Use Internal Redis URL (not external) for better performance
- Check Redis instance is running in Render dashboard
- If using external Redis, verify connection string format
- Check application logs for Redis connection errors

## Environment Variables Summary

Copy this checklist when setting up:

- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] NODE_ENV=production
- [ ] PORT (optional, Render sets automatically)
- [ ] CORS_ORIGIN
- [ ] JWT_EXPIRES_IN (optional)
- [ ] AWS_REGION
- [ ] AWS_ACCESS_KEY_ID
- [ ] AWS_SECRET_ACCESS_KEY
- [ ] S3_BUCKET_NAME
- [ ] GOOGLE_CLIENT_ID
- [ ] REDIS_URL (or REDIS_HOST + REDIS_PORT)

## API Endpoints

Once deployed, your API will be available at:

- Health: `GET /health`
- Root: `GET /`
- Auth: `POST /api/auth/login`, `POST /api/auth/google`
- Users: `GET /api/users`, etc.
- Topics: `GET /api/topics`, etc.
- Scripts: `GET /api/scripts`, etc.
- Videos: `GET /api/videos`, etc.

## Next Steps

1. Share the API URL with your frontend team
2. Update frontend `.env` with the new API URL
3. Test all endpoints
4. Set up monitoring and alerts in Render

## Support

If you encounter issues:
1. Check Render logs
2. Verify all environment variables
3. Test database connection
4. Review application logs

