import mongoose from 'mongoose';
import { LeadModel } from './models.js';
import { PaymentModel } from './models-payment.js';
import { FollowUpModel } from './models-followup.js';
import { NotificationModel } from './models-notification.js';
import { CourseModel } from './models-course.js';
import { LeadStatus, LeadPriority, LeadSource, PaymentStatus, FollowUpStatus } from '../models/index.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leadflow-crm';

// BD Names for reference
const bdUsers = [
  { id: 'bd-001', name: 'Rahul Sharma' },
  { id: 'bd-002', name: 'Priya Patel' },
  { id: 'bd-003', name: 'Amit Kumar' },
  { id: 'bd-004', name: 'Sneha Reddy' },
];

// Course data
const courses = [
  { code: 'FSWD', name: 'Full Stack Web Development', description: 'Complete MERN stack course', duration: '6 months', amount: 45000, category: 'Development' },
  { code: 'DSB', name: 'Data Science Bootcamp', description: 'Python, ML, AI fundamentals', duration: '4 months', amount: 55000, category: 'Data Science' },
  { code: 'AAD', name: 'Android App Development', description: 'Kotlin and Jetpack Compose', duration: '4 months', amount: 40000, category: 'Mobile Development' },
  { code: 'AWS', name: 'Cloud Computing - AWS', description: 'AWS certification track', duration: '3 months', amount: 35000, category: 'Cloud' },
  { code: 'UIUX', name: 'UI/UX Design', description: 'Figma, Adobe XD, User Research', duration: '3 months', amount: 30000, category: 'Design' },
];

// Lead samples covering all scenarios
const leads = [
  // 1. New Lead - Fresh inquiry
  { name: 'Vikram Singh', phone: '9876543210', email: 'vikram@email.com', location: 'Mumbai', courseId: '', courseName: 'Full Stack Web Development', courseAmount: 45000, bookingAmount: 0, bookingPaid: false, paymentLinkGenerated: false, remainingAmount: 45000, paymentStatus: PaymentStatus.PENDING, status: LeadStatus.NEW, priority: LeadPriority.LOW, source: LeadSource.WEBSITE, bdId: 'bd-001', bdName: 'Rahul Sharma', notes: 'Interested in career change' },
  
  // 2. Interested lead
  { name: 'Anjali Mehta', phone: '9876543211', email: 'anjali@email.com', location: 'Delhi', courseId: '', courseName: 'Data Science Bootcamp', courseAmount: 55000, bookingAmount: 0, bookingPaid: false, paymentLinkGenerated: false, remainingAmount: 55000, paymentStatus: PaymentStatus.PENDING, status: LeadStatus.INTERESTED, priority: LeadPriority.MEDIUM, source: LeadSource.REFERRAL, bdId: 'bd-002', bdName: 'Priya Patel', notes: 'Referred by alumni, autonomous student' },
  
  // 3. Booking Paid - partial payment done
  { name: 'Rohan Gupta', phone: '9876543212', email: 'rohan@email.com', location: 'Bangalore', courseId: '', courseName: 'Full Stack Web Development', courseAmount: 45000, bookingAmount: 5000, bookingPaid: true, paymentLinkGenerated: false, remainingAmount: 40000, paymentStatus: PaymentStatus.PARTIAL, status: LeadStatus.BOOKING_PAID, priority: LeadPriority.MEDIUM, source: LeadSource.SOCIAL_MEDIA, bdId: 'bd-001', bdName: 'Rahul Sharma', notes: 'Paid booking amount on call' },
  
  // 4. HIGH PRIORITY - booking paid + link generated + pending
  { name: 'Sneha Krishnan', phone: '9876543213', email: 'sneha.k@email.com', location: 'Chennai', courseId: '', courseName: 'Data Science Bootcamp', courseAmount: 55000, bookingAmount: 5000, bookingPaid: true, paymentLinkGenerated: true, remainingAmount: 50000, paymentStatus: PaymentStatus.PARTIAL, status: LeadStatus.BOOKING_PAID, priority: LeadPriority.HIGH, source: LeadSource.WEBSITE, bdId: 'bd-003', bdName: 'Amit Kumar', expectedConversionDate: '2024-02-15', notes: 'HIGH PRIORITY - Payment link sent, awaiting confirmation' },
  
  // 5. Payment Overdue case
  { name: 'Karthik Rao', phone: '9876543214', email: 'karthik@email.com', location: 'Hyderabad', courseId: '', courseName: 'Cloud Computing - AWS', courseAmount: 35000, bookingAmount: 5000, bookingPaid: true, paymentLinkGenerated: true, remainingAmount: 30000, paymentStatus: PaymentStatus.OVERDUE, status: LeadStatus.BOOKING_PAID, priority: LeadPriority.HIGH, source: LeadSource.EVENT, bdId: 'bd-002', bdName: 'Priya Patel', notes: 'Payment due date passed - follow up urgently' },
  
  // 6. Fully Paid - Convert Ready
  { name: 'Pooja Nair', phone: '9876543215', email: 'pooja@email.com', location: 'Pune', courseId: '', courseName: 'Android App Development', courseAmount: 40000, bookingAmount: 5000, bookingPaid: true, paymentLinkGenerated: true, remainingAmount: 0, paymentStatus: PaymentStatus.PAID, status: LeadStatus.CONVERTED, priority: LeadPriority.LOW, source: LeadSource.REFERRAL, bdId: 'bd-004', bdName: 'Sneha Reddy', notes: 'Full payment received' },
  
  // 7. Converted Lead
  { name: 'Arun Jha', phone: '9876543216', email: 'arun@email.com', location: 'Kolkata', courseId: '', courseName: 'Full Stack Web Development', courseAmount: 45000, bookingAmount: 15000, bookingPaid: true, paymentLinkGenerated: true, remainingAmount: 0, paymentStatus: PaymentStatus.PAID, status: LeadStatus.CONVERTED, priority: LeadPriority.LOW, source: LeadSource.COLD_CALL, bdId: 'bd-001', bdName: 'Rahul Sharma', notes: 'Converted - enrolled in batch starting March' },
  
  // 8. Delayed with reason
  { name: 'Meera Pillai', phone: '9876543217', email: 'meera@email.com', location: 'Kochi', courseId: '', courseName: 'UI/UX Design', courseAmount: 30000, bookingAmount: 5000, bookingPaid: true, paymentLinkGenerated: true, remainingAmount: 25000, paymentStatus: PaymentStatus.PARTIAL, status: LeadStatus.BOOKING_PAID, priority: LeadPriority.MEDIUM, source: LeadSource.WEBSITE, bdId: 'bd-003', bdName: 'Amit Kumar', notes: 'Customer requested more time - waiting for salary' },
  
  // 9. Lost Lead
  { name: 'Deepak Verma', phone: '9876543218', email: 'deepak@email.com', location: 'Jaipur', courseId: '', courseName: 'Data Science Bootcamp', courseAmount: 55000, bookingAmount: 0, bookingPaid: false, paymentLinkGenerated: false, remainingAmount: 55000, paymentStatus: PaymentStatus.PENDING, status: LeadStatus.LOST, priority: LeadPriority.LOW, source: LeadSource.SOCIAL_MEDIA, bdId: 'bd-002', bdName: 'Priya Patel', notes: 'Dropped - found cheaper alternative' },
  
  // 10. Multiple scenarios
  { name: 'Priyanka Sharma', phone: '9876543219', email: 'priyanka.s@email.com', location: 'Indore', courseId: '', courseName: 'Full Stack Web Development', courseAmount: 45000, bookingAmount: 45000, bookingPaid: true, paymentLinkGenerated: false, remainingAmount: 0, paymentStatus: PaymentStatus.PAID, status: LeadStatus.CONVERTED, priority: LeadPriority.LOW, source: LeadSource.REFERRAL, bdId: 'bd-004', bdName: 'Sneha Reddy', notes: 'Full payment upfront' },
  
  { name: 'Suresh Yadav', phone: '9876543220', email: 'suresh@email.com', location: 'Lucknow', courseId: '', courseName: 'Cloud Computing - AWS', courseAmount: 35000, bookingAmount: 0, bookingPaid: false, paymentLinkGenerated: false, remainingAmount: 35000, paymentStatus: PaymentStatus.PENDING, status: LeadStatus.NEW, priority: LeadPriority.LOW, source: LeadSource.EVENT, bdId: 'bd-001', bdName: 'Rahul Sharma', notes: 'Collected from job fair' },
  
  { name: 'Nisha Agarwal', phone: '9876543221', email: 'nisha@email.com', location: 'Mumbai', courseId: '', courseName: 'UI/UX Design', courseAmount: 30000, bookingAmount: 5000, bookingPaid: true, paymentLinkGenerated: true, remainingAmount: 25000, paymentStatus: PaymentStatus.PARTIAL, status: LeadStatus.BOOKING_PAID, priority: LeadPriority.HIGH, source: LeadSource.WEBSITE, bdId: 'bd-002', bdName: 'Priya Patel', notes: 'High potential - needs quick follow up' },
  
  { name: 'Manish Thakur', phone: '9876543222', email: 'manish@email.com', location: 'Ahmedabad', courseId: '', courseName: 'Data Science Bootcamp', courseAmount: 55000, bookingAmount: 5000, bookingPaid: true, paymentLinkGenerated: true, remainingAmount: 50000, paymentStatus: PaymentStatus.OVERDUE, status: LeadStatus.BOOKING_PAID, priority: LeadPriority.HIGH, source: LeadSource.COLD_CALL, bdId: 'bd-003', bdName: 'Amit Kumar', notes: 'Payment overdue - needs escalation' },
  
  { name: 'Gayathri Devi', phone: '9876543223', email: 'gayathri@email.com', location: 'Chennai', courseId: '', courseName: 'Android App Development', courseAmount: 40000, bookingAmount: 0, bookingPaid: false, paymentLinkGenerated: false, remainingAmount: 40000, paymentStatus: PaymentStatus.PENDING, status: LeadStatus.INTERESTED, priority: LeadPriority.MEDIUM, source: LeadSource.REFERRAL, bdId: 'bd-004', bdName: 'Sneha Reddy', notes: 'Interested in part-time batch' },
  
  { name: 'Bharath Raja', phone: '9876543224', email: 'bharath@email.com', location: 'Hyderabad', courseId: '', courseName: 'Full Stack Web Development', courseAmount: 45000, bookingAmount: 10000, bookingPaid: true, paymentLinkGenerated: true, remainingAmount: 35000, paymentStatus: PaymentStatus.PARTIAL, status: LeadStatus.IN_PROGRESS, priority: LeadPriority.MEDIUM, source: LeadSource.WEBSITE, bdId: 'bd-001', bdName: 'Rahul Sharma', notes: 'Classes started, paying in installments' },
  
  { name: 'Kavitha Sree', phone: '9876543225', email: 'kavitha@email.com', location: 'Bangalore', courseId: '', courseName: 'Cloud Computing - AWS', courseAmount: 35000, bookingAmount: 0, bookingPaid: false, paymentLinkGenerated: false, remainingAmount: 35000, paymentStatus: PaymentStatus.PENDING, status: LeadStatus.NEW, priority: LeadPriority.LOW, source: LeadSource.SOCIAL_MEDIA, bdId: 'bd-002', bdName: 'Priya Patel', notes: 'Fresh query from LinkedIn' },
  
  { name: 'Sanjay Gupta', phone: '9876543226', email: 'sanjay@email.com', location: 'Delhi', courseId: '', courseName: 'Data Science Bootcamp', courseAmount: 55000, bookingAmount: 55000, bookingPaid: true, paymentLinkGenerated: false, remainingAmount: 0, paymentStatus: PaymentStatus.PAID, status: LeadStatus.CONVERTED, priority: LeadPriority.LOW, source: LeadSource.EVENT, bdId: 'bd-003', bdName: 'Amit Kumar', notes: 'Converted - full payment received' },
  
  { name: 'Lakshmi Devi', phone: '9876543227', email: 'lakshmi@email.com', location: 'Visakhapatnam', courseId: '', courseName: 'UI/UX Design', courseAmount: 30000, bookingAmount: 0, bookingPaid: false, paymentLinkGenerated: false, remainingAmount: 30000, paymentStatus: PaymentStatus.PENDING, status: LeadStatus.NEW, priority: LeadPriority.LOW, source: LeadSource.WEBSITE, bdId: 'bd-004', bdName: 'Sneha Reddy', notes: 'Inquiry about weekend batch' },
  
  { name: 'Hariharan', phone: '9876543228', email: 'hari@email.com', location: 'Coimbatore', courseId: '', courseName: 'Android App Development', courseAmount: 40000, bookingAmount: 5000, bookingPaid: true, paymentLinkGenerated: true, remainingAmount: 35000, paymentStatus: PaymentStatus.PARTIAL, status: LeadStatus.BOOKING_PAID, priority: LeadPriority.HIGH, source: LeadSource.REFERRAL, bdId: 'bd-001', bdName: 'Rahul Sharma', notes: 'HIGH PRIORITY - Payment link sent' },
  
  { name: 'Divya Lakshmi', phone: '9876543229', email: 'divya@email.com', location: 'Mysore', courseId: '', courseName: 'Full Stack Web Development', courseAmount: 45000, bookingAmount: 0, bookingPaid: false, paymentLinkGenerated: false, remainingAmount: 45000, paymentStatus: PaymentStatus.PENDING, status: LeadStatus.INTERESTED, priority: LeadPriority.MEDIUM, source: LeadSource.EVENT, bdId: 'bd-002', bdName: 'Priya Patel', notes: 'Attended demo session, interested' },
];

const seedDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      LeadModel.deleteMany({}),
      PaymentModel.deleteMany({}),
      FollowUpModel.deleteMany({}),
      NotificationModel.deleteMany({}),
      CourseModel.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Insert Courses
    const courseDocs: any[] = [];
    for (const course of courses) {
      const courseDoc = await CourseModel.create(course);
      courseDocs.push({ ...course, _id: courseDoc._id.toString(), id: courseDoc._id.toString() });
    }
    console.log('✅ Inserted courses');

    // Update leads with course IDs
    const leadsWithCourseIds = leads.map((lead: any, index: number) => {
      const courseIndex = index % courses.length;
      const course = courseDocs[courseIndex];
      return {
        ...lead,
        courseId: course._id,
        courseName: course.name,
        courseAmount: course.amount,
      };
    });

    // Insert Leads
    const leadDocs: any[] = [];
    for (const lead of leadsWithCourseIds) {
      const leadDoc = await LeadModel.create(lead);
      leadDocs.push({ ...lead, _id: leadDoc._id.toString(), id: leadDoc._id.toString() });
    }
    console.log('✅ Inserted leads');

    // Insert Payments
    const payments = [
      { leadName: 'Rohan Gupta', amount: 5000, paymentType: 'booking', paymentMethod: 'upi', paymentStatus: PaymentStatus.PAID, paymentDate: new Date().toISOString() },
      { leadName: 'Sneha Krishnan', amount: 5000, paymentType: 'booking', paymentMethod: 'card', paymentStatus: PaymentStatus.PAID, paymentDate: new Date().toISOString() },
      { leadName: 'Karthik Rao', amount: 5000, paymentType: 'booking', paymentMethod: 'bank_transfer', paymentStatus: PaymentStatus.PAID, paymentDate: '2024-01-01', paymentDueDate: '2024-01-15' },
      { leadName: 'Pooja Nair', amount: 40000, paymentType: 'full', paymentMethod: 'upi', paymentStatus: PaymentStatus.PAID, paymentDate: new Date().toISOString() },
      { leadName: 'Arun Jha', amount: 45000, paymentType: 'booking', paymentMethod: 'bank_transfer', paymentStatus: PaymentStatus.PAID, paymentDate: new Date().toISOString() },
      { leadName: 'Meera Pillai', amount: 5000, paymentType: 'booking', paymentMethod: 'upi', paymentStatus: PaymentStatus.PAID, paymentDate: '2024-01-10' },
      { leadName: 'Priyanka Sharma', amount: 45000, paymentType: 'full', paymentMethod: 'card', paymentStatus: PaymentStatus.PAID, paymentDate: new Date().toISOString() },
      { leadName: 'Nisha Agarwal', amount: 5000, paymentType: 'booking', paymentMethod: 'upi', paymentStatus: PaymentStatus.PAID, paymentDate: '2024-01-12' },
      { leadName: 'Manish Thakur', amount: 5000, paymentType: 'booking', paymentMethod: 'card', paymentStatus: PaymentStatus.PAID, paymentDate: '2023-12-15', paymentDueDate: '2024-01-01' },
      { leadName: 'Bharath Raja', amount: 10000, paymentType: 'partial', paymentMethod: 'bank_transfer', paymentStatus: PaymentStatus.PAID, paymentDate: new Date().toISOString() },
    ];

    for (const payment of payments) {
      const lead = leadDocs.find((l: any) => l.name === payment.leadName);
      if (lead) {
        await PaymentModel.create({
          ...payment,
          leadId: lead._id,
          createdBy: lead.bdId,
        });
      }
    }
    console.log('✅ Inserted payments');

    // Insert Follow-ups
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const followUps = [
      { leadName: 'Vikram Singh', followUpDate: tomorrow.toISOString(), followUpType: 'call', status: FollowUpStatus.PENDING, notes: 'First follow-up call to discuss course details' },
      { leadName: 'Anjali Mehta', followUpDate: today.toISOString(), followUpType: 'email', status: FollowUpStatus.PENDING, notes: 'Send detailed course curriculum' },
      { leadName: 'Sneha Krishnan', followUpDate: yesterday.toISOString(), followUpType: 'call', status: FollowUpStatus.PENDING, notes: 'URGENT: Follow up on payment link sent' },
      { leadName: 'Karthik Rao', followUpDate: yesterday.toISOString(), followUpType: 'whatsapp', status: FollowUpStatus.PENDING, notes: 'OVERDUE: Payment reminder', delayReason: 'Waiting for salary credit' },
      { leadName: 'Meera Pillai', followUpDate: nextWeek.toISOString(), followUpType: 'call', status: FollowUpStatus.PENDING, notes: 'Follow-up after delay completes' },
      { leadName: 'Suresh Yadav', followUpDate: tomorrow.toISOString(), followUpType: 'call', status: FollowUpStatus.PENDING, notes: 'Discuss course benefits' },
      { leadName: 'Nisha Agarwal', followUpDate: today.toISOString(), followUpType: 'whatsapp', status: FollowUpStatus.PENDING, notes: 'Payment confirmation follow-up' },
      { leadName: 'Manish Thakur', followUpDate: yesterday.toISOString(), followUpType: 'call', status: FollowUpStatus.PENDING, notes: 'OVERDUE: Escalation call needed', delayReason: 'Considering other options' },
      { leadName: 'Gayathri Devi', followUpDate: nextWeek.toISOString(), followUpType: 'email', status: FollowUpStatus.PENDING, notes: 'Send part-time batch schedule' },
      { leadName: 'Lakshmi Devi', followUpDate: tomorrow.toISOString(), followUpType: 'call', status: FollowUpStatus.PENDING, notes: 'Weekend batch inquiry follow-up' },
      { leadName: 'Bharath Raja', followUpDate: nextWeek.toISOString(), followUpType: 'meeting', status: FollowUpStatus.PENDING, notes: 'Monthly progress review' },
      { leadName: 'Hariharan', followUpDate: today.toISOString(), followUpType: 'call', status: FollowUpStatus.PENDING, notes: 'Payment link follow-up' },
    ];

    for (const followUp of followUps) {
      const lead = leadDocs.find((l: any) => l.name === followUp.leadName);
      if (lead) {
        await FollowUpModel.create({
          ...followUp,
          leadId: lead._id,
          priority: lead.priority,
          createdBy: lead.bdId,
        });
      }
    }
    console.log('✅ Inserted follow-ups');

    // Insert Notifications
    const notifications = [
      { type: 'high_priority', title: 'High Priority Lead Alert', message: 'Sneha Krishnan requires immediate attention - payment link sent', priority: 'high' },
      { type: 'payment_overdue', title: 'Payment Overdue', message: 'Karthik Rao\'s payment is overdue', priority: 'high' },
      { type: 'follow_up_due', title: 'Follow-up Due Today', message: 'You have follow-ups scheduled for today', priority: 'medium' },
      { type: 'lead_converted', title: 'Lead Converted', message: 'Pooja Nair has been converted successfully', priority: 'low' },
      { type: 'payment_overdue', title: 'Payment Overdue', message: 'Manish Thakur\'s payment is now overdue', priority: 'high' },
      { type: 'system', title: 'Welcome to LeadFlow CRM', message: 'Your CRM system is ready to use', priority: 'low' },
      { type: 'high_priority', title: 'High Priority Lead Alert', message: 'Nisha Agarwal requires follow-up', priority: 'high' },
    ];

    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const lead = leadDocs.find((l: any) => l.name.includes(notification.message.split(' ')[0]));
      await NotificationModel.create({
        ...notification,
        relatedLeadId: lead ? lead._id : undefined,
        isRead: i < 2 ? false : true,
      });
    }
    console.log('✅ Inserted notifications');

    console.log('\n🎉 Database seeded successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Courses: ${courseDocs.length}`);
    console.log(`   - Leads: ${leadDocs.length}`);
    console.log(`   - Payments: ${payments.length}`);
    console.log(`   - Follow-ups: ${followUps.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

seedDatabase();
