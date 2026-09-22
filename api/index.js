const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB Connection Cache
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set. Please add it in Vercel dashboard.');
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

// Helper to create a wrapper for controller functions
const withDb = (fn) => async (req, res, next) => {
  try {
    await connectToDatabase();
    return fn(req, res, next);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database connection failed', 
      message: error.message 
    });
  }
};

// Import controllers (will work after TypeScript compilation)
let controllers = {};
try {
  controllers = {
    leads: require('../backend/dist/controllers/leads.js'),
    payments: require('../backend/dist/controllers/payments.js'),
    followups: require('../backend/dist/controllers/followups.js'),
    notifications: require('../backend/dist/controllers/notifications.js'),
    courses: require('../backend/dist/controllers/courses.js'),
    dashboard: require('../backend/dist/controllers/dashboard.js'),
    reports: require('../backend/dist/controllers/reports.js'),
  };
} catch (e) {
  console.log('Controllers not yet compiled:', e.message);
}

// ============ ROUTES ============

// Health check
app.get('/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      mongodb: 'connected',
      database: mongoose.connection.db?.databaseName || 'leadflow-crm'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// API info
app.get('/api', (req, res) => {
  res.json({
    message: 'LeadFlow CRM API',
    version: '1.0.0',
    status: 'running',
    mongodb: isConnected ? 'connected' : 'disconnected',
    endpoints: {
      leads: ['GET /api/leads', 'POST /api/leads', 'GET /api/leads/:id', 'PUT /api/leads/:id', 'DELETE /api/leads/:id'],
      payments: ['GET /api/payments'],
      followups: ['GET /api/followups'],
      notifications: ['GET /api/notifications'],
      courses: ['GET /api/courses'],
      dashboard: ['GET /api/dashboard/summary'],
      reports: ['GET /api/reports/lead-status', 'GET /api/reports/bd-performance', 'GET /api/reports/revenue', 'GET /api/reports/source-distribution'],
      health: ['GET /health']
    }
  });
});

// ============ LEADS ROUTES ============
if (controllers.leads) {
  app.get('/api/leads', withDb(controllers.leads.getLeads));
  app.post('/api/leads', withDb(controllers.leads.createLead));
  app.get('/api/leads/stats', withDb(controllers.leads.getLeadStats));
  app.get('/api/leads/:id', withDb(controllers.leads.getLeadById));
  app.put('/api/leads/:id', withDb(controllers.leads.updateLead));
  app.delete('/api/leads/:id', withDb(controllers.leads.deleteLead));
}

// ============ PAYMENTS ROUTES ============
if (controllers.payments) {
  app.get('/api/payments', withDb(controllers.payments.getPayments));
  app.post('/api/payments', withDb(controllers.payments.createPayment));
  app.get('/api/payments/:id', withDb(controllers.payments.getPaymentById));
  app.put('/api/payments/:id', withDb(controllers.payments.updatePayment));
}

// ============ FOLLOW-UPS ROUTES ============
if (controllers.followups) {
  app.get('/api/followups', withDb(controllers.followups.getFollowUps));
  app.post('/api/followups', withDb(controllers.followups.createFollowUp));
  app.get('/api/followups/:id', withDb(controllers.followups.getFollowUpById));
  app.put('/api/followups/:id', withDb(controllers.followups.updateFollowUp));
}

// ============ NOTIFICATIONS ROUTES ============
if (controllers.notifications) {
  app.get('/api/notifications', withDb(controllers.notifications.getNotifications));
  app.post('/api/notifications/:id/read', withDb(controllers.notifications.markAsRead));
  app.post('/api/notifications/read-all', withDb(controllers.notifications.markAllAsRead));
}

// ============ COURSES ROUTES ============
if (controllers.courses) {
  app.get('/api/courses', withDb(controllers.courses.getCourses));
  app.post('/api/courses', withDb(controllers.courses.createCourse));
  app.get('/api/courses/:id', withDb(controllers.courses.getCourseById));
  app.put('/api/courses/:id', withDb(controllers.courses.updateCourse));
}

// ============ DASHBOARD ROUTES ============
if (controllers.dashboard) {
  app.get('/api/dashboard/summary', withDb(controllers.dashboard.getDashboardSummary));
}

// ============ REPORTS ROUTES ============
if (controllers.reports) {
  app.get('/api/reports/lead-status', withDb(controllers.reports.getLeadStatusReport));
  app.get('/api/reports/bd-performance', withDb(controllers.reports.getBDPerformanceReport));
  app.get('/api/reports/revenue', withDb(controllers.reports.getRevenueReport));
  app.get('/api/reports/source-distribution', withDb(controllers.reports.getSourceDistribution));
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    hint: 'Visit /api for available endpoints'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
