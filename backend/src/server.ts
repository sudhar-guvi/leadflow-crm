import express, { Request, Response, NextFunction } from 'express';
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

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
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
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Connect to MongoDB when the app initializes
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

// Start server (for local development only)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
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
}

export default app;
