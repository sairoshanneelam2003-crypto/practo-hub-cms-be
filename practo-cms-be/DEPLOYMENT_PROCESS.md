# Deployment Process - Code Push & Server Restart

This document explains how to push code changes and restart the backend server.

## 📋 Prerequisites

- SSH access to the server: `ubuntu@154.210.143.193`
- Git repository access
- Docker and docker-compose installed on server

---

## 🚀 Step-by-Step Process

### Step 1: Push Code to GitHub

#### 1.1 Check Current Status
```bash
cd /home/roshan/Pictures/workwithcmdec17\(emailchecking\)/practo-cms-be
git status
```

#### 1.2 Stage Changes
```bash
git add .
# OR for specific files:
git add <file1> <file2>
```

#### 1.3 Commit Changes
```bash
git commit -m "Your descriptive commit message"
```

#### 1.4 Push to GitHub
```bash
git push origin main
```

**Note:** `.env` file is gitignored, so environment variable changes need to be updated on the server separately.

---

### Step 2: Update Environment Variables (if needed)

If you need to update environment variables (like `GOOGLE_CLIENT_ID`, `DATABASE_URL`, etc.):

#### 2.1 SSH into Server
```bash
ssh ubuntu@154.210.143.193
```

#### 2.2 Navigate to Backend Directory
```bash
cd /home/ubuntu/practo-cms-be/practo-cms-be
```

#### 2.3 Update .env File
```bash
# Edit .env file
nano .env
# OR
vim .env

# OR use sed to update specific variable:
sed -i 's/GOOGLE_CLIENT_ID=".*"/GOOGLE_CLIENT_ID="your-new-value"/' .env
```

#### 2.4 Verify Update
```bash
grep GOOGLE_CLIENT_ID .env
```

---

### Step 3: Pull Latest Code on Server (if needed)

If you pushed code changes that need to be pulled:

```bash
# SSH into server
ssh ubuntu@154.210.143.193

# Navigate to backend directory
cd /home/ubuntu/practo-cms-be/practo-cms-be

# Pull latest code
git pull origin main
```

---

### Step 4: Restart Docker Container

#### 4.1 SSH into Server
```bash
ssh ubuntu@154.210.143.193
```

#### 4.2 Navigate to Backend Directory
```bash
cd /home/ubuntu/practo-cms-be/practo-cms-be
```

#### 4.3 Restart Container

**Option A: Simple Restart (if only env vars changed)**
```bash
docker-compose restart app
```

**Option B: Full Restart (if code changed or issues)**
```bash
# Stop and remove old container
docker rm -f practo-cms-be_app_1

# Start fresh
docker-compose up -d app
```

**Option C: Complete Rebuild (if Docker image needs rebuild)**
```bash
docker-compose down
docker-compose up -d --build
```

#### 4.4 Check Container Status
```bash
docker ps | grep app
```

#### 4.5 View Logs
```bash
docker logs practo-cms-be_app_1 --tail=50
# OR
docker-compose logs app --tail=50
```

---

### Step 5: Verify Server is Running

#### 5.1 Health Check
```bash
curl http://154.210.143.193:5000/health
# Should return: {"status":"healthy"}
```

#### 5.2 Test API Endpoint
```bash
curl http://154.210.143.193:5000/
# Should return: {"message":"Practo Hub CMS API","version":"1.0.0","status":"running"}
```

#### 5.3 Test from Local Machine
```bash
curl http://154.210.143.193:5000/health
```

---

## 🔧 Common Scenarios

### Scenario 1: Code Changes Only (No Env Vars)

```bash
# 1. Push code
cd /home/roshan/Pictures/workwithcmdec17\(emailchecking\)/practo-cms-be
git add .
git commit -m "Your changes"
git push origin main

# 2. SSH and pull on server
ssh ubuntu@154.210.143.193
cd /home/ubuntu/practo-cms-be/practo-cms-be
git pull origin main

# 3. Restart container
docker-compose restart app

# 4. Verify
docker logs practo-cms-be_app_1 --tail=20
```

### Scenario 2: Environment Variable Changes Only

```bash
# 1. SSH into server
ssh ubuntu@154.210.143.193
cd /home/ubuntu/practo-cms-be/practo-cms-be

# 2. Update .env file
sed -i 's/VARIABLE_NAME=".*"/VARIABLE_NAME="new-value"/' .env

# 3. Verify
grep VARIABLE_NAME .env

# 4. Restart container
docker-compose restart app

# 5. Verify it's working
curl http://154.210.143.193:5000/health
```

### Scenario 3: Both Code and Env Vars Changed

```bash
# 1. Push code
cd /home/roshan/Pictures/workwithcmdec17\(emailchecking\)/practo-cms-be
git add .
git commit -m "Your changes"
git push origin main

# 2. SSH into server
ssh ubuntu@154.210.143.193
cd /home/ubuntu/practo-cms-be/practo-cms-be

# 3. Pull code
git pull origin main

# 4. Update .env
sed -i 's/VARIABLE_NAME=".*"/VARIABLE_NAME="new-value"/' .env

# 5. Restart container
docker rm -f practo-cms-be_app_1
docker-compose up -d app

# 6. Verify
docker logs practo-cms-be_app_1 --tail=20
curl http://154.210.143.193:5000/health
```

---

## 📝 Important Notes

### Environment Variables

- **`.env` file is gitignored** - Never commit it to GitHub
- Environment variables must be updated **on the server** separately
- After updating `.env`, **always restart the container** for changes to take effect

### Docker Container

- **Container name**: `practo-cms-be_app_1`
- **Port**: `5000`
- **Location**: `/home/ubuntu/practo-cms-be/practo-cms-be`

### Common Environment Variables

```env
GOOGLE_CLIENT_ID="your-client-id"
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
CORS_ORIGIN="https://your-frontend.com"
PORT=5000
NODE_ENV=production
```

### Troubleshooting

#### Container won't start
```bash
# Check logs
docker logs practo-cms-be_app_1

# Check if port is in use
lsof -i :5000

# Check container status
docker ps -a | grep app
```

#### Environment variable not working
```bash
# Verify it's in .env
grep VARIABLE_NAME .env

# Check if container has it
docker exec practo-cms-be_app_1 printenv VARIABLE_NAME

# If missing, restart container
docker-compose restart app
```

#### Code changes not reflecting
```bash
# Make sure you pulled latest code
git pull origin main

# Rebuild container if needed
docker-compose down
docker-compose up -d --build
```

---

## 🔐 Server Access

- **SSH**: `ssh ubuntu@154.210.143.193`
- **Backend URL**: `http://154.210.143.193:5000`
- **Cloudflare Tunnel**: `https://breaks-eating-excited-downloadable.trycloudflare.com`
- **Backend Directory**: `/home/ubuntu/practo-cms-be/practo-cms-be`

---

## ✅ Quick Checklist

Before deploying:
- [ ] Code committed and pushed to GitHub
- [ ] Environment variables updated on server (if needed)
- [ ] Code pulled on server (if needed)
- [ ] Docker container restarted
- [ ] Health check passes
- [ ] Logs show no errors

---

## 📞 Quick Reference Commands

```bash
# Push code
git add . && git commit -m "message" && git push origin main

# SSH and restart
ssh ubuntu@154.210.143.193 "cd /home/ubuntu/practo-cms-be/practo-cms-be && docker-compose restart app"

# Check health
curl http://154.210.143.193:5000/health

# View logs
ssh ubuntu@154.210.143.193 "cd /home/ubuntu/practo-cms-be/practo-cms-be && docker logs practo-cms-be_app_1 --tail=20"
```

---

**Last Updated**: December 22, 2025

