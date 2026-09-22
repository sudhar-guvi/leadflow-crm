# LeadFlow CRM

A full-stack CRM application for internal Business Development teams, built with Node.js, Express, MongoDB, React, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Lead Management**: Full CRUD operations for leads with automatic priority and status calculation
- **Payment Tracking**: Record and track payments with automatic conversion detection
- **Follow-up Scheduling**: Schedule and manage follow-ups with overdue alerts
- **Dashboard**: Real-time overview of key metrics
- **Reports**: Visual analytics with charts for BD performance, revenue, and lead sources
- **Notifications**: Real-time notifications for important events
- **Calendar View**: Visual calendar for scheduled follow-ups

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- npm or yarn

## 🛠️ Setup

### 1. Clone and Install

```bash
# Install backend dependencies
cd leadflow-crm/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Backend `.env` (already configured):
```env
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/leadflow-crm
JWT_SECRET=changeme
```

Frontend `.env` (already configured):
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_APP_NAME=LeadFlow CRM
VITE_APP_SUBTITLE=Lead Follow-up & Payment Tracking
```

### 3. Start MongoDB

Make sure MongoDB is running locally:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

### 4. Seed the Database

```bash
cd backend
npm run seed
```

This will populate the database with:
- 5 courses
- 20 leads (covering all scenarios)
- 10+ payments
- 12+ follow-ups
- 7 notifications

### 5. Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api
- Health Check: http://localhost:4000/health

## 📁 Project Structure

```
leadflow-crm/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── data/           # Mongoose models
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # TypeScript interfaces
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.ts       # Express app entry
│   ├── .env
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # Axios API clients
│   │   ├── components/     # React components
│   │   ├── hooks/          # TanStack Query hooks
│   │   ├── lib/            # Utilities
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env
│   ├── .env.example
│   └── package.json
└── README.md
```

## 🔌 API Endpoints

### Leads
- `GET /api/leads` - List all leads (paginated)
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `PATCH /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Follow-ups
- `GET /api/followups` - List follow-ups
- `GET /api/followups/today` - Today's follow-ups
- `GET /api/followups/overdue` - Overdue follow-ups
- `POST /api/followups` - Schedule follow-up
- `PATCH /api/followups/:id` - Update follow-up

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `PATCH /api/courses/:id` - Update course

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all read

### Dashboard & Reports
- `GET /api/dashboard/summary` - Dashboard metrics
- `GET /api/reports/lead-status` - Lead status distribution
- `GET /api/reports/bd-performance` - BD performance
- `GET /api/reports/revenue` - Monthly revenue
- `GET /api/reports/source-distribution` - Lead source breakdown

## 🧠 Business Rules

### HIGH PRIORITY (Automatic)
A lead is marked high priority when:
- `bookingPaid === true`
- `remainingAmount > 0`
- `paymentLinkGenerated === true`
- `paymentStatus !== "paid"`

### OVERDUE (Automatic)
- **Follow-up**: `followUpDate < today AND status !== completed`
- **Payment**: `paymentDueDate < today AND paymentStatus !== paid`

### CONVERTED (Automatic)
When `remainingAmount === 0`:
1. Set `paymentStatus = PAID`
2. Set `leadStatus = CONVERTED`
3. Auto-close open follow-ups

## 🛠️ Tech Stack

**Backend:**
- Node.js 18+
- Express.js
- TypeScript
- MongoDB with Mongoose
- Zod (validation)
- CORS, dotenv

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query (React Query)
- React Router
- Recharts
- React Hook Form + Zod
- Lucide Icons
- date-fns

## 🔧 Development

### Backend Scripts
```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Start production server
npm run seed     # Seed database with sample data
```

### Frontend Scripts
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📝 Notes

- All business logic is computed server-side to ensure consistency
- Frontend only renders what the API returns (no duplicate calculations)
- MongoDB indexes are created automatically for performance
- CORS configured for development environment

## 📄 License

MIT

---

Built with ❤️ for Business Development teams.
