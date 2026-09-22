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
let db = null;

const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection.db;
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set. Please add it in Vercel dashboard.');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    db = mongoose.connection.db;
    console.log('✅ MongoDB Connected');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// ============ MODELS ============
const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  location: String,
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  courseAmount: { type: Number, required: true },
  bookingAmount: { type: Number, default: 0 },
  bookingPaid: { type: Boolean, default: false },
  paymentLinkGenerated: { type: Boolean, default: false },
  remainingAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'overdue'], default: 'pending' },
  status: { type: String, enum: ['new', 'interested', 'booking_paid', 'demo_scheduled', 'demo_completed', 'negotiating', 'converted', 'lost', 'on_hold'], default: 'new' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'low' },
  source: { type: String, enum: ['website', 'referral', 'social_media', 'direct_call', 'email', 'walk_in', 'other'], default: 'website' },
  bdId: { type: String, required: true },
  bdName: { type: String, required: true },
  expectedConversionDate: Date,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: String,
  duration: String,
  actualPrice: { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  category: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const PaymentSchema = new mongoose.Schema({
  leadId: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer', 'other'] },
  paymentDueDate: Date,
  paidAt: Date,
  transactionId: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

const FollowUpSchema = new mongoose.Schema({
  leadId: { type: String, required: true },
  followUpDate: { type: Date, required: true },
  type: { type: String, enum: ['call', 'email', 'whatsapp', 'meeting', 'demo'], default: 'call' },
  status: { type: String, enum: ['pending', 'completed', 'missed', 'rescheduled'], default: 'pending' },
  outcome: String,
  nextAction: String,
  bdId: { type: String, required: true },
  bdName: String,
  createdAt: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedLeadId: String,
  isRead: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  createdAt: { type: Date, default: Date.now }
});

// Models
let Lead, Course, Payment, FollowUp, Notification;

const getModels = () => {
  if (!Lead) Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
  if (!Course) Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);
  if (!Payment) Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
  if (!FollowUp) FollowUp = mongoose.models.FollowUp || mongoose.model('FollowUp', FollowUpSchema);
  if (!Notification) Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
  return { Lead, Course, Payment, FollowUp, Notification };
};

// Helper to convert MongoDB document to JSON
const leadToJson = (doc) => ({
  _id: doc._id?.toString?.() || doc._id,
  id: doc._id?.toString?.() || doc._id,
  name: doc.name,
  phone: doc.phone,
  email: doc.email,
  location: doc.location,
  courseId: doc.courseId,
  courseName: doc.courseName,
  courseAmount: doc.courseAmount,
  bookingAmount: doc.bookingAmount || 0,
  bookingPaid: doc.bookingPaid || false,
  paymentLinkGenerated: doc.paymentLinkGenerated || false,
  remainingAmount: doc.remainingAmount || 0,
  paymentStatus: doc.paymentStatus,
  status: doc.status,
  priority: doc.priority,
  source: doc.source,
  bdId: doc.bdId,
  bdName: doc.bdName,
  expectedConversionDate: doc.expectedConversionDate,
  notes: doc.notes,
  createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
  updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt
});

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
      health: ['GET /health']
    }
  });
});

// ============ LEADS ============
app.get('/api/leads', async (req, res) => {
  try {
    await connectToDatabase();
    const { Lead } = getModels();
    const { page = 1, limit = 20, status, priority, source, bdId, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;
    if (bdId) query.bdId = bdId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();

    res.json({
      data: leads.map(leadToJson),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads', message: error.message });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    await connectToDatabase();
    const { Lead, Notification } = getModels();
    
    const lead = await Lead.create({
      ...req.body,
      remainingAmount: req.body.courseAmount - (req.body.bookingPaid ? req.body.bookingAmount : 0),
      paymentStatus: req.body.bookingPaid ? 'partial' : 'pending',
      status: req.body.bookingPaid ? 'booking_paid' : 'new',
      priority: 'low'
    });

    await Notification.create({
      type: 'system',
      title: 'New Lead Created',
      message: `New lead ${req.body.name} has been added`,
      relatedLeadId: lead._id.toString(),
      isRead: false,
      priority: 'low'
    });

    res.status(201).json(leadToJson(lead));
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead', message: error.message });
  }
});

app.get('/api/leads/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const { Lead, Payment, FollowUp } = getModels();
    
    const lead = await Lead.findById(req.params.id).lean();
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const payments = await Payment.find({ leadId: req.params.id }).lean();
    const followUps = await FollowUp.find({ leadId: req.params.id }).lean();

    res.json({
      ...leadToJson(lead),
      payments: payments.map(p => ({ ...p, id: p._id.toString() })),
      followUps: followUps.map(f => ({ ...f, id: f._id.toString() }))
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead', message: error.message });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const { Lead } = getModels();
    
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).lean();

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(leadToJson(lead));
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead', message: error.message });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const { Lead, Payment, FollowUp, Notification } = getModels();
    
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await Promise.all([
      Payment.deleteMany({ leadId: req.params.id }),
      FollowUp.deleteMany({ leadId: req.params.id }),
      Notification.deleteMany({ relatedLeadId: req.params.id }),
      Lead.findByIdAndDelete(req.params.id)
    ]);

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead', message: error.message });
  }
});

// ============ PAYMENTS ============
app.get('/api/payments', async (req, res) => {
  try {
    await connectToDatabase();
    const { Payment } = getModels();
    const { leadId, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (leadId) query.leadId = leadId;
    if (status) query.paymentStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();

    res.json({
      data: payments.map(p => ({ ...p, id: p._id.toString() })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments', message: error.message });
  }
});

// ============ FOLLOWUPS ============
app.get('/api/followups', async (req, res) => {
  try {
    await connectToDatabase();
    const { FollowUp } = getModels();
    const { leadId, status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (leadId) query.leadId = leadId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await FollowUp.countDocuments(query);
    const followups = await FollowUp.find(query).sort({ followUpDate: 1 }).skip(skip).limit(parseInt(limit)).lean();

    res.json({
      data: followups.map(f => ({ ...f, id: f._id.toString() })),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching followups:', error);
    res.status(500).json({ error: 'Failed to fetch followups', message: error.message });
  }
});

// ============ NOTIFICATIONS ============
app.get('/api/notifications', async (req, res) => {
  try {
    await connectToDatabase();
    const { Notification } = getModels();
    
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50).lean();
    const unreadCount = await Notification.countDocuments({ isRead: false });

    res.json({
      data: notifications.map(n => ({ ...n, id: n._id.toString() })),
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message });
  }
});

// ============ COURSES ============
app.get('/api/courses', async (req, res) => {
  try {
    await connectToDatabase();
    const { Course } = getModels();
    
    const courses = await Course.find({ isActive: true }).sort({ name: 1 }).lean();

    res.json({
      data: courses.map(c => ({ ...c, id: c._id.toString() }))
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses', message: error.message });
  }
});

// ============ DASHBOARD ============
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    await connectToDatabase();
    const { Lead, Payment, FollowUp, Notification } = getModels();
    
    const [
      totalLeads,
      newLeads,
      interestedLeads,
      convertedLeads,
      highPriorityLeads,
      overdueFollowUps,
      overduePayments,
      revenueResult,
      pendingPaymentsResult,
      followUpsToday,
      unreadNotifications
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'new' }),
      Lead.countDocuments({ status: 'interested' }),
      Lead.countDocuments({ status: 'converted' }),
      Lead.countDocuments({ priority: 'high' }),
      FollowUp.countDocuments({ followUpDate: { $lt: new Date() }, status: 'pending' }),
      Payment.countDocuments({ paymentDueDate: { $lt: new Date() }, paymentStatus: 'pending' }),
      Payment.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { paymentStatus: { $in: ['pending', 'partial'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      FollowUp.countDocuments({ followUpDate: { $gte: new Date(new Date().setHours(0,0,0,0)), $lt: new Date(new Date().setHours(23,59,59,999)) } }),
      Notification.countDocuments({ isRead: false })
    ]);

    res.json({
      totalLeads,
      newLeads,
      interestedLeads,
      convertedLeads,
      highPriorityLeads,
      overdueFollowUps,
      overduePayments,
      totalRevenue: revenueResult[0]?.total || 0,
      pendingPayments: pendingPaymentsResult[0]?.total || 0,
      followUpsToday,
      unreadNotifications
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary', message: error.message });
  }
});

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
    message: err.message
  });
});

module.exports = app;
