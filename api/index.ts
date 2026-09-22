import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { connectDB } from '../backend/src/config/database.js';
import leadsRouter from '../backend/src/routes/leads.js';
import paymentsRouter from '../backend/src/routes/payments.js';
import followupsRouter from '../backend/src/routes/followups.js';
import notificationsRouter from '../backend/src/routes/notifications.js';
import coursesRouter from '../backend/src/routes/courses.js';
import dashboardRouter from '../backend/src/routes/dashboard.js';
import reportsRouter from '../backend/src/routes/reports.js';

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
    environment: 'production'
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

// Connect to MongoDB
connectDB().catch(console.error);

// Export for Vercel
export default app;
