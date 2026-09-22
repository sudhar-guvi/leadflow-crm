# LeadFlow CRM - Vercel Deployment Guide

This guide will walk you through deploying the LeadFlow CRM application to Vercel.

## Architecture

The application consists of:
- **Frontend**: React + Vite app (deployed as static site on Vercel)
- **Backend**: Express.js API (deployed as a Service or on a separate platform)
- **Database**: MongoDB (use MongoDB Atlas for production)

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (for production database)
3. Git repository (GitHub, GitLab, or Bitbucket)

---

## Option 1: Deploy Frontend to Vercel + Backend to Separate Platform

### Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new project called "LeadFlow CRM"
3. Build a cluster (free tier is fine for development)
4. Create a database user with read/write permissions
5. Whitelist IP addresses (use `0.0.0.0/0` for allowing all, or Vercel's IPs)
6. Get your connection string: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/leadflow-crm?retryWrites=true&w=majority`

### Step 2: Deploy Backend

Choose one of these platforms for your backend:

#### Option A: Deploy to Render (Recommended - Free Tier Available)

1. Go to [Render](https://render.com) and sign up
2. Create a new Web Service
3. Connect your Git repository
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`
5. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: `production`
   - `PORT`: `4000`
   - `CORS_ORIGIN`: Your Vercel frontend URL (after deploying)

#### Option B: Deploy to Railway

1. Go to [Railway](https://railway.app) and sign up
2. Create a new project → Deploy from GitHub repo
3. Select the repository and set root directory to `backend`
4. Add environment variables (same as above)

#### Option C: Deploy to Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Navigate to backend directory: `cd leadflow-crm/backend`
4. Launch: `fly launch`
5. Set secrets: `fly secrets set MONGODB_URI=<your-connection-string>`

### Step 3: Deploy Frontend to Vercel

#### Using Vercel CLI:

```bash
# Navigate to frontend directory
cd leadflow-crm/frontend

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables (use Vercel dashboard or CLI)
vercel env add VITE_API_BASE_URL production
# Enter your backend URL: https://your-backend-app.onrender.com/api
```

#### Using Vercel Dashboard:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_API_BASE_URL`: Your backend API URL (e.g., `https://your-backend.onrender.com/api`)
6. Click "Deploy"

---

## Option 2: Deploy Everything to Vercel (Using Serverless Functions)

You can also deploy the backend as Vercel Serverless Functions.

### Step 1: Push to GitHub

```bash
cd leadflow-crm
git init
git add .
git commit -m "Initial commit - LeadFlow CRM"
git remote add origin https://github.com/YOUR_USERNAME/leadflow-crm.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Vite project

### Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

- `MONGODB_URI`: Your MongoDB Atlas connection string
- `NODE_ENV`: `production`
- `CORS_ORIGIN`: Your Vercel deployment URL

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

---

## Post-Deployment Steps

### 1. Seed the Production Database

After deploying, you need to seed the production database with initial data:

#### Option A: Run seed script locally against production DB:

```bash
# In backend directory
MONGODB_URI=<your-production-mongodb-uri> npm run seed
```

#### Option B: Use MongoDB Compass or Atlas UI to insert initial data manually.

### 2. Update CORS Settings

Make sure your backend's `CORS_ORIGIN` includes your frontend URL.

### 3. Test the Application

- Visit your Vercel frontend URL
- Check if the dashboard loads with data
- Test creating leads, payments, etc.

---

## Environment Variables Summary

### Frontend (Vercel)
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL (e.g., `https://your-backend.onrender.com/api`) |

### Backend (Render/Railway/Fly)
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `NODE_ENV` | `production` |
| `PORT` | Server port (`4000` or auto-assigned) |
| `CORS_ORIGIN` | Frontend URL for CORS |

---

## Troubleshooting

### Frontend shows "Failed to load data"
- Check if backend is running
- Verify `VITE_API_BASE_URL` is correct
- Check browser console for CORS errors
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`

### Backend connection errors
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas cluster is running
- Ensure database user credentials are correct

### Build fails on Vercel
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

---

## Quick Deploy Commands

```bash
# Backend (Render/Railway)
cd backend && vercel --prod

# Frontend
cd frontend && vercel --prod
```

---

## Monitoring & Logs

- **Vercel**: View logs in Dashboard → Project → Deployments → Select deployment → Logs
- **Render**: View logs in Dashboard → Service → Logs
- **MongoDB Atlas**: Monitor in Atlas Dashboard

---

## Cost Estimate (Free Tier)

- **Vercel**: Free tier (100GB bandwidth, 100 builds/day)
- **Render**: Free tier (750 hours/month)
- **MongoDB Atlas**: Free tier (512MB storage)
- **Total**: $0/month for development/demo

For production, consider upgrading to paid tiers for better performance and reliability.
