import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import leadsRouter from './routes/leads.js';
import paymentsRouter from './routes/payments.js';
import followupsRouter from './routes/followups.js';
import notificationsRouter from './routes/notifications.js';
import coursesRouter from './routes/courses.js';
import dashboardRouter from './routes/dashboard.js';
import reportsRouter from './routes/reports.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/leads', leadsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/followups', followupsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Connect to MongoDB when the app starts (or when the serverless function initializes)
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }
  
  try {
    await connectDB();
    isConnected = true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// Start server (for local development)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const startServer = async () => {
    try {
      await connectToDatabase();
      
      app.listen(PORT, () => {
        console.log(`\n🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
        console.log(`\n📡 API Endpoints:`);
        console.log(`   - GET    /health`);
        console.log(`   - GET    /api/leads`);
        console.log(`   - POST   /api/leads`);
        console.log(`   - GET    /api/payments`);
        console.log(`   - GET    /api/followups`);
        console.log(`   - GET    /api/notifications`);
        console.log(`   - GET    /api/courses`);
        console.log(`   - GET    /api/dashboard/summary`);
        console.log(`   - GET    /api/reports/*`);
        console.log('\n');
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };
  
  startServer();
}

// Export for Vercel serverless functions
export default app;
