# CheckinHQ

> A mobile-first, WhatsApp-assisted booking CRM for Airbnb hosts and tour companies

CheckinHQ is a simple, production-ready SaaS application designed for non-technical business owners in Uganda and Kenya who manage bookings via WhatsApp. It acts as a memory layer on top of WhatsApp communication, providing essential booking management without the complexity of traditional CRM systems.

## Features

### Core Functionality
- ✅ **Booking Management** - Create, read, update, and delete bookings
- ✅ **Status Workflow** - Track bookings from Inquiry to Checked Out
- ✅ **WhatsApp Integration** - Quick access via wa.me links
- ✅ **Notes Timeline** - Keep conversation history per booking
- ✅ **Follow-up Detection** - Automatic tracking based on last contact
- ✅ **Today Dashboard** - View arrivals, checkouts, follow-ups, and pending payments

### User Experience
- 📱 Mobile-first design with bottom navigation
- 🎨 Clean, simple interface with Vuetify
- ⚡ 3-step booking form (< 60 seconds to complete)
- 🔐 Secure email/password authentication
- 🚀 Zero training required

## Tech Stack

### Frontend
- Vue 3 (Composition API)
- Vuetify 3 (Material Design)
- Pinia (State Management)
- Vue Router
- Axios
- Vite

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing

## Project Structure

```
CheckinHQ/
├── backend/
│   ├── controllers/       # Request handlers
│   ├── database/          # DB connection & schema
│   ├── middleware/        # Auth middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── .env.example       # Environment template
│   ├── package.json
│   └── server.js          # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── views/         # Page components
    │   ├── stores/        # Pinia stores
    │   ├── services/      # API service
    │   ├── plugins/       # Vuetify config
    │   ├── router/        # Vue Router
    │   ├── App.vue
    │   └── main.js
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=checkinhq
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_random_secret_key
```

5. Create PostgreSQL database:
```bash
psql -U postgres
CREATE DATABASE checkinhq;
\q
```

6. Run database migration:
```bash
npm run migrate
```

7. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` if needed:
```env
VITE_API_URL=http://localhost:3000/api
```

5. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Bookings
- `GET /api/bookings` - Get all bookings (protected)
- `GET /api/bookings/:id` - Get single booking (protected)
- `POST /api/bookings` - Create booking (protected)
- `PUT /api/bookings/:id` - Update booking (protected)
- `DELETE /api/bookings/:id` - Delete booking (protected)
- `POST /api/bookings/:id/contact` - Mark as contacted (protected)
- `POST /api/bookings/:id/notes` - Add note (protected)
- `GET /api/bookings/dashboard/today` - Get dashboard data (protected)

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password_hash` - Hashed password
- `business_name` - Optional business name
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Bookings Table
- `id` - Primary key
- `user_id` - Foreign key to users
- `guest_name` - Guest name
- `phone_number` - Phone number (with country code)
- `check_in_date` - Check-in date
- `check_out_date` - Check-out date
- `property_destination` - Property or destination
- `status` - Booking status (Inquiry, Quoted, Deposit Paid, Confirmed, Checked In, Checked Out)
- `total_amount` - Total booking amount
- `deposit_amount` - Deposit paid
- `notes` - Initial notes
- `last_contacted_at` - Last contact timestamp
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Booking Notes Table
- `id` - Primary key
- `booking_id` - Foreign key to bookings
- `note_text` - Note content
- `created_at` - Timestamp

## Deployment

### Backend Deployment (e.g., Heroku, Railway, Render)

1. Set environment variables on your platform
2. Ensure PostgreSQL addon/service is connected
3. Run migration: `npm run migrate`
4. Deploy with: `npm start`

### Frontend Deployment (e.g., Vercel, Netlify)

1. Build production version:
```bash
npm run build
```

2. Deploy the `dist` folder

3. Set environment variable:
```
VITE_API_URL=https://your-backend-url.com/api
```

### Environment Variables for Production

**Backend:**
- `PORT` - Server port (provided by platform)
- `NODE_ENV=production`
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Strong random secret (use generator)
- `FRONTEND_URL` - Your frontend URL for CORS

**Frontend:**
- `VITE_API_URL` - Your backend API URL

## Usage Guide

### For Business Owners

1. **Sign Up** - Create account with email and password
2. **Add Booking** - Click + button, fill 3-step form
3. **Track Status** - Update booking status as it progresses
4. **WhatsApp** - Click WhatsApp button to contact guests
5. **Add Notes** - Keep conversation history in timeline
6. **Dashboard** - Check "Today" view for arrivals, checkouts, follow-ups

### Booking Statuses
- **Inquiry** - Initial contact
- **Quoted** - Price sent to guest
- **Deposit Paid** - Partial payment received
- **Confirmed** - Fully booked
- **Checked In** - Guest arrived
- **Checked Out** - Stay completed

## Development

### Run Backend in Development
```bash
cd backend
npm run dev
```

### Run Frontend in Development
```bash
cd frontend
npm run dev
```

### Database Migrations
```bash
cd backend
npm run migrate
```

## Security Notes

- Passwords are hashed with bcryptjs (10 rounds)
- JWT tokens expire after 30 days
- Authentication required for all booking operations
- SQL injection prevention via parameterized queries
- CORS configured for specific frontend origin

## Out of Scope

The following features are intentionally NOT included in this MVP:
- WhatsApp API integration
- Automatic chat syncing
- Payment gateway integration
- Advanced reporting
- Multi-user/staff accounts
- Push notifications
- Email notifications

## Support

For issues or questions, please open a GitHub issue.

## License

MIT License - feel free to use for your business.

---

**Built for simplicity. Designed for real businesses.**
