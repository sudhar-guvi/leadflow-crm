import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: 'production',
    mongodb_uri_set: !!process.env.MONGODB_URI
  });
});

// MongoDB Connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Import routes dynamically after DB connection
app.use('/api/leads', async (req, res, next) => {
  try {
    await connectToDatabase();
    const { default: leadsRouter } = await import('../backend/src/routes/leads.js');
    return leadsRouter(req, res, next);
  } catch (error) {
    console.error('Error in leads route:', error);
    res.status(500).json({ error: 'Database connection failed', message: String(error) });
  }
});

app.use('/api/payments', async (req, res, next) => {
  try {
    await connectToDatabase();
    const { default: paymentsRouter } = await import('../backend/src/routes/payments.js');
    return paymentsRouter(req, res, next);
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', message: String(error) });
  }
});

app.use('/api/followups', async (req, res, next) => {
  try {
    await connectToDatabase();
    const { default: followupsRouter } = await import('../backend/src/routes/followups.js');
    return followupsRouter(req, res, next);
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', message: String(error) });
  }
});

app.use('/api/notifications', async (req, res, next) => {
  try {
    await connectToDatabase();
    const { default: notificationsRouter } = await import('../backend/src/routes/notifications.js');
    return notificationsRouter(req, res, next);
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', message: String(error) });
  }
});

app.use('/api/courses', async (req, res, next) => {
  try {
    await connectToDatabase();
    const { default: coursesRouter } = await import('../backend/src/routes/courses.js');
    return coursesRouter(req, res, next);
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', message: String(error) });
  }
});

app.use('/api/dashboard', async (req, res, next) => {
  try {
    await connectToDatabase();
    const { default: dashboardRouter } = await import('../backend/src/routes/dashboard.js');
    return dashboardRouter(req, res, next);
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', message: String(error) });
  }
});

app.use('/api/reports', async (req, res, next) => {
  try {
    await connectToDatabase();
    const { default: reportsRouter } = await import('../backend/src/routes/reports.js');
    return reportsRouter(req, res, next);
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', message: String(error) });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

export default app;
