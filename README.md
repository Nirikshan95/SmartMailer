# SmartMailer - Email Automation Tool

An efficient email automation solution built with Node.js, React, and Vite. This tool allows you to send personalized emails at scale while respecting email sending limits to maintain good sender reputation.

## Current Status: Personal/Development Tool → Production Ready

This tool is currently designed for personal use and needs to be scaled for production. This README documents all existing features and provides guidance for production migration.

## Architecture Overview

### Frontend (React + Vite)
- **Framework**: React 19.2.0 with Vite 7.1.9
- **UI Components**: Custom components with Lucide React icons
- **State Management**: React hooks (useState, useEffect, useRef)
- **Styling**: Inline styles with CSS file (index.css)
- **Port**: 5173 (development)

### Backend (Node.js + Express)
- **Framework**: Express 5.1.0
- **Email Service**: Nodemailer 7.0.9
- **Email Validation**: deep-email-validator 0.1.21 + validator 13.15.15
- **CORS**: Enabled for local development
- **Port**: 3001
- **Data Storage**: JSON files (email_records.json, completed_emails.json)

## Current Features

### 1. Multi-Step Workflow
- **Step 1**: Load subject lines from text file (subjects.txt)
- **Step 2**: Load recipient list from CSV with flexible column mapping
- **Step 3**: Load HTML email template with personalization variables
- **Step 4**: Configure SMTP settings (Gmail by default)
- **Step 5**: Validate emails and send with real-time progress tracking

### 2. CSV Processing & Column Mapping
- Automatic detection of standard columns (Email, Name, Company)
- Custom column mapping interface for non-standard CSV formats
- Default values for missing data (configurable in config.json)
- Preview of CSV data before processing

### 3. Email Validation System
- **Format Validation**: Basic email format checking
- **MX Record Validation**: Domain email capability verification
- **SMTP Validation**: Mailbox existence checking
- **Disposable Email Detection**: Blocks temporary email services
- **Batch Processing**: Validates emails in parallel with controlled concurrency (15 emails/batch)
- **Timeout Handling**: 10-second timeout per email, 45-second per batch
- **Retry Logic**: Automatic retry with smaller batch sizes on timeout
- **Progress Tracking**: Real-time validation progress with counts

### 4. Rate Limiting & Sender Reputation Protection
- **Daily Limit**: 400 emails per calendar day (configurable)
- **Hourly Limit**: 50 emails per hour (configurable)
- **Automatic Tracking**: Persistent storage of send counts
- **Real-time Stats**: Dashboard showing current usage vs limits
- **Automatic Cleanup**: Removes records older than 40 days

### 5. Email Sending Features
- **Random Subject Selection**: Picks random subject from loaded list
- **HTML Template Support**: Full HTML email with personalization
- **Variable Replacement**: {{name}} placeholder replacement
- **Deduplication**: Automatically filters already-sent emails
- **Stop/Resume**: Ability to stop sending mid-process
- **Error Handling**: Graceful failure with detailed error messages

### 6. Progress Tracking & Statistics
- Real-time sending progress
- Completed email count
- Pending email count
- Recently sent emails list (last 5)
- Email validation statistics
- Rate limit monitoring

### 7. Data Management
- **Completed Emails**: Stored in completed_emails.json
- **Email Records**: Stored in email_records.json (daily/hourly counts)
- **Download Options**: Export completed and remaining emails as CSV
- **Automatic Cleanup**: Prevents storage bloat

### 8. Security Features
- App Password support for Gmail
- Password field masking
- SMTP connection verification
- No sensitive data in version control (.gitignore configured)

## Current Setup (Development)

### Prerequisites
- Node.js (version 14 or higher)
- A Gmail account (or other SMTP provider)
- Google App Password (for Gmail)

### Installation

```bash
npm install
```

### Running the Application

```bash
# Terminal 1: Start backend server
node server.js

# Terminal 2: Start frontend dev server
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Usage Flow

1. **Load Subjects**: Upload subjects.txt with one subject per line
2. **Load Recipients**: Upload CSV with email addresses (auto-maps or manual column mapping)
3. **Load Template**: Upload HTML email template with {{name}} placeholders
4. **Configure SMTP**: Enter Gmail credentials (use App Password, not regular password)
5. **Validate & Send**: Validate emails, then start sending with real-time progress

### File Structure
```
├── server.js                    # Express backend API
├── email_automation_tool.jsx    # Main React component
├── main.jsx                     # React entry point
├── index.html                   # HTML entry
├── index.css                    # Styles
├── config.json                  # Configuration (limits, defaults, retry)
├── email_records.json           # Send tracking (auto-generated)
├── completed_emails.json        # Completed sends (auto-generated)
├── subjects.txt                 # Subject lines (user-provided)
├── emails.csv                   # Recipient list (user-provided)
├── email_template.html          # Email template (user-provided)
├── package.json                 # Dependencies
└── vite.config.js              # Vite configuration
```

## Configuration (config.json)

```json
{
  "emailLimits": {
    "maxPerDay": 400,        // Maximum emails per calendar day
    "maxPerHour": 50         // Maximum emails per hour
  },
  "smtp": {
    "gmail": {
      "server": "smtp.gmail.com",
      "port": 587            // TLS port (587) or SSL port (465)
    }
  },
  "defaultValues": {
    "name": "Hiring Manager",     // Default if name column missing
    "company": "your company"     // Default if company column missing
  },
  "retry": {
    "maxAttempts": 3,        // Not currently implemented
    "delayMs": 5000          // Not currently implemented
  }
}
```

## Known Limitations & Issues

### 1. Storage
- **Issue**: Uses JSON files for data persistence
- **Impact**: Not scalable, no concurrent access control, potential data loss
- **Files**: email_records.json, completed_emails.json

### 2. Email Validation
- **Issue**: Validation can timeout with large lists (>500 emails)
- **Current Workaround**: Assumes emails are valid on timeout
- **Impact**: May send to invalid addresses, affecting sender reputation

### 3. Rate Limiting
- **Issue**: In-memory tracking, resets on server restart
- **Impact**: Could exceed provider limits if server restarts mid-day

### 4. SMTP Configuration
- **Issue**: Hardcoded for Gmail, credentials stored in frontend state
- **Impact**: Not secure, limited to Gmail users

### 5. Concurrency
- **Issue**: Single-threaded, sequential email sending
- **Impact**: Slow for large batches (1-2 emails/second)

### 6. Error Handling
- **Issue**: Basic error handling, no retry mechanism
- **Impact**: Failed emails are lost, no automatic recovery

### 7. Monitoring
- **Issue**: No logging, no error tracking, no analytics
- **Impact**: Difficult to debug issues or track performance

### 8. Authentication
- **Issue**: No user authentication, single-user design
- **Impact**: Cannot support multiple users or teams

### 9. Deployment
- **Issue**: Requires two separate processes (frontend + backend)
- **Impact**: Complex deployment, no production build process

### 10. Testing
- **Issue**: No automated tests
- **Impact**: Risky to make changes, difficult to ensure quality

---

## Production Migration Roadmap

### Phase 1: Infrastructure & Database (Critical)

#### 1.1 Database Migration
**Current**: JSON files (email_records.json, completed_emails.json)

**Recommended Options**:
- **PostgreSQL**: Best for complex queries, ACID compliance, scalability
- **MongoDB**: Good for flexible schema, document storage
- **MySQL**: Solid relational option, widely supported

**Schema Design**:
```sql
-- Users table (for multi-user support)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  smtp_config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email campaigns
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  subject_lines TEXT[],
  template_html TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recipients
CREATE TABLE recipients (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  is_validated BOOLEAN DEFAULT FALSE,
  validation_result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email sends
CREATE TABLE email_sends (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id),
  recipient_id INTEGER REFERENCES recipients(id),
  subject VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Rate limiting
CREATE TABLE rate_limits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  period_type VARCHAR(20), -- 'hourly' or 'daily'
  period_start TIMESTAMP,
  email_count INTEGER DEFAULT 0,
  UNIQUE(user_id, period_type, period_start)
);
```

#### 1.2 Environment Variables
**Create `.env` file**:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/email_automation
DB_POOL_SIZE=20

# Server
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Authentication
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret

# Rate Limiting
MAX_EMAILS_PER_DAY=400
MAX_EMAILS_PER_HOUR=50

# Email Validation
VALIDATION_TIMEOUT_MS=10000
VALIDATION_BATCH_SIZE=15

# Redis (for caching/queues)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

#### 1.3 Dependencies to Add
```json
{
  "dependencies": {
    "pg": "^8.11.0",                    // PostgreSQL client
    "dotenv": "^16.0.3",                // Environment variables
    "bcrypt": "^5.1.1",                 // Password hashing
    "jsonwebtoken": "^9.0.2",           // JWT authentication
    "express-session": "^1.17.3",       // Session management
    "connect-pg-simple": "^9.0.0",      // PostgreSQL session store
    "bull": "^4.11.5",                  // Job queue (Redis-based)
    "ioredis": "^5.3.2",                // Redis client
    "winston": "^3.11.0",               // Logging
    "helmet": "^7.1.0",                 // Security headers
    "express-rate-limit": "^7.1.5",     // API rate limiting
    "joi": "^17.11.0",                  // Input validation
    "@sentry/node": "^7.91.0"           // Error tracking
  }
}
```

### Phase 2: Backend Refactoring (High Priority)

#### 2.1 Project Structure
```
backend/
├── src/
│   ├── config/
│   │   ├── database.js          // DB connection
│   │   ├── redis.js             // Redis connection
│   │   └── smtp.js              // SMTP configuration
│   ├── models/
│   │   ├── User.js
│   │   ├── Campaign.js
│   │   ├── Recipient.js
│   │   └── EmailSend.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── campaignController.js
│   │   ├── emailController.js
│   │   └── validationController.js
│   ├── services/
│   │   ├── emailService.js      // Email sending logic
│   │   ├── validationService.js // Email validation
│   │   ├── rateLimitService.js  // Rate limiting
│   │   └── queueService.js      // Job queue management
│   ├── middleware/
│   │   ├── auth.js              // Authentication
│   │   ├── errorHandler.js      // Error handling
│   │   ├── validation.js        // Input validation
│   │   └── rateLimiter.js       // API rate limiting
│   ├── routes/
│   │   ├── auth.js
│   │   ├── campaigns.js
│   │   ├── emails.js
│   │   └── validation.js
│   ├── utils/
│   │   ├── logger.js            // Winston logger
│   │   └── helpers.js
│   └── app.js                   // Express app
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
└── server.js                    // Entry point
```

#### 2.2 Queue System (Bull + Redis)
**Why**: Handle email sending asynchronously, retry failed sends, scale horizontally

**Implementation**:
```javascript
// services/queueService.js
const Queue = require('bull');
const emailQueue = new Queue('email-sending', process.env.REDIS_URL);

// Add email to queue
async function queueEmail(campaignId, recipientId, subject, htmlContent) {
  await emailQueue.add({
    campaignId,
    recipientId,
    subject,
    htmlContent
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
}

// Process queue
emailQueue.process(async (job) => {
  const { campaignId, recipientId, subject, htmlContent } = job.data;
  // Send email logic here
});
```

#### 2.3 Authentication System
**Implement**:
- User registration/login
- JWT tokens for API authentication
- Password hashing with bcrypt
- Session management
- Role-based access control (admin, user)

#### 2.4 API Rate Limiting
**Protect endpoints**:
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', apiLimiter);
```

### Phase 3: Frontend Improvements (Medium Priority)

#### 3.1 State Management
**Current**: Local useState hooks
**Recommended**: Context API or Redux Toolkit for global state

#### 3.2 API Client
**Create centralized API client**:
```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### 3.3 Build Process
**Production build**:
```bash
npm run build
```

**Serve static files from Express**:
```javascript
app.use(express.static(path.join(__dirname, 'dist')));
```

#### 3.4 Error Boundaries
**Add React error boundaries** for graceful error handling

#### 3.5 Loading States
**Improve UX** with skeleton loaders, spinners, progress bars

### Phase 4: Email Service Improvements (High Priority)

#### 4.1 Multiple SMTP Providers
**Support**:
- Gmail
- SendGrid
- AWS SES
- Mailgun
- Custom SMTP

**Implement provider abstraction**:
```javascript
class EmailProvider {
  async send(to, subject, html) {
    throw new Error('Not implemented');
  }
}

class GmailProvider extends EmailProvider {
  async send(to, subject, html) {
    // Gmail-specific implementation
  }
}

class SendGridProvider extends EmailProvider {
  async send(to, subject, html) {
    // SendGrid-specific implementation
  }
}
```

#### 4.2 Email Validation Service
**Options**:
- **Self-hosted**: Keep current deep-email-validator
- **Third-party**: ZeroBounce, NeverBounce, Hunter.io
- **Hybrid**: Basic validation + paid service for critical campaigns

#### 4.3 Bounce Handling
**Implement**:
- Webhook endpoints for bounce notifications
- Automatic suppression list management
- Bounce rate monitoring

#### 4.4 Email Templates
**Improvements**:
- Template library
- WYSIWYG editor
- Variable preview
- A/B testing support

### Phase 5: Monitoring & Observability (Critical)

#### 5.1 Logging
**Implement structured logging with Winston**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### 5.2 Error Tracking
**Integrate Sentry** for error monitoring and alerting

#### 5.3 Metrics & Analytics
**Track**:
- Emails sent/failed
- Validation success rate
- Average send time
- Queue depth
- API response times

**Tools**: Prometheus + Grafana, or DataDog

#### 5.4 Health Checks
**Implement**:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbHealthCheck(),
    redis: redisHealthCheck(),
    queue: queueHealthCheck()
  });
});
```

### Phase 6: Security Hardening (Critical)

#### 6.1 Security Headers
**Use Helmet.js**:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

#### 6.2 Input Validation
**Validate all inputs with Joi**:
```javascript
const Joi = require('joi');

const emailSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().max(255),
  company: Joi.string().max(255)
});
```

#### 6.3 SQL Injection Prevention
**Use parameterized queries** (already handled by pg library)

#### 6.4 Rate Limiting
**Implement per-user rate limits** in addition to global limits

#### 6.5 CORS Configuration
**Restrict CORS** to specific domains in production

#### 6.6 Secrets Management
**Use**:
- AWS Secrets Manager
- HashiCorp Vault
- Environment variables (minimum)

### Phase 7: Testing (High Priority)

#### 7.1 Unit Tests
**Framework**: Jest
**Coverage**: Aim for 80%+ coverage

#### 7.2 Integration Tests
**Test**:
- API endpoints
- Database operations
- Email sending flow

#### 7.3 E2E Tests
**Framework**: Playwright or Cypress
**Test**: Complete user workflows

#### 7.4 Load Testing
**Tools**: k6, Artillery
**Test**: System behavior under load

### Phase 8: Deployment & DevOps (Critical)

#### 8.1 Containerization
**Create Dockerfile**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "server.js"]
```

**Docker Compose** for local development:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/email_automation
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=email_automation
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 8.2 CI/CD Pipeline
**GitHub Actions example**:
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          # Deploy commands here
```

#### 8.3 Hosting Options
**Backend**:
- AWS EC2 / ECS / EKS
- Google Cloud Run
- DigitalOcean App Platform
- Heroku (simple but expensive)
- Railway (modern alternative)

**Frontend**:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Same server as backend (simpler)

**Database**:
- AWS RDS
- Google Cloud SQL
- DigitalOcean Managed Database
- Supabase (PostgreSQL)

**Redis**:
- AWS ElastiCache
- Redis Cloud
- Upstash (serverless)

#### 8.4 Scaling Strategy
**Horizontal Scaling**:
- Load balancer (AWS ALB, Nginx)
- Multiple app instances
- Shared database and Redis

**Vertical Scaling**:
- Increase server resources as needed

### Phase 9: Additional Features (Optional)

#### 9.1 Scheduled Campaigns
**Allow users to schedule email sends** for specific dates/times

#### 9.2 Email Analytics
**Track**:
- Open rates (requires tracking pixel)
- Click rates (requires link tracking)
- Bounce rates
- Unsubscribe rates

#### 9.3 Unsubscribe Management
**Implement**:
- Unsubscribe links in emails
- Suppression list management
- Compliance with CAN-SPAM, GDPR

#### 9.4 Team Collaboration
**Features**:
- Multiple users per account
- Role-based permissions
- Campaign sharing
- Activity logs

#### 9.5 API Access
**Provide REST API** for programmatic access

#### 9.6 Webhooks
**Allow users to configure webhooks** for events (sent, bounced, opened)

---

## Migration Checklist

### Pre-Migration
- [ ] Backup all JSON data files
- [ ] Document current configuration
- [ ] Set up development environment
- [ ] Create test email accounts

### Database Setup
- [ ] Choose database (PostgreSQL recommended)
- [ ] Design schema
- [ ] Set up database server
- [ ] Create migration scripts
- [ ] Migrate existing data from JSON files

### Backend Migration
- [ ] Set up project structure
- [ ] Implement database models
- [ ] Create authentication system
- [ ] Refactor email sending to use queue
- [ ] Implement rate limiting with database
- [ ] Add logging and error tracking
- [ ] Write unit tests
- [ ] Write integration tests

### Frontend Migration
- [ ] Set up state management
- [ ] Create API client
- [ ] Add authentication UI
- [ ] Implement error boundaries
- [ ] Add loading states
- [ ] Build production bundle
- [ ] Test production build

### Infrastructure
- [ ] Set up Redis server
- [ ] Configure environment variables
- [ ] Create Docker containers
- [ ] Set up CI/CD pipeline
- [ ] Configure monitoring
- [ ] Set up error tracking (Sentry)

### Security
- [ ] Implement authentication
- [ ] Add input validation
- [ ] Configure CORS properly
- [ ] Set up security headers
- [ ] Implement API rate limiting
- [ ] Set up secrets management

### Deployment
- [ ] Choose hosting provider
- [ ] Set up production database
- [ ] Set up production Redis
- [ ] Deploy application
- [ ] Configure domain and SSL
- [ ] Set up backups
- [ ] Configure monitoring alerts

### Post-Deployment
- [ ] Load testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation update
- [ ] User training

---

## Estimated Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Infrastructure & Database | 1-2 weeks | Critical |
| Phase 2: Backend Refactoring | 2-3 weeks | High |
| Phase 3: Frontend Improvements | 1-2 weeks | Medium |
| Phase 4: Email Service Improvements | 1-2 weeks | High |
| Phase 5: Monitoring & Observability | 1 week | Critical |
| Phase 6: Security Hardening | 1 week | Critical |
| Phase 7: Testing | 1-2 weeks | High |
| Phase 8: Deployment & DevOps | 1 week | Critical |
| Phase 9: Additional Features | 2-4 weeks | Optional |

**Total Estimated Time**: 8-12 weeks for core production readiness (Phases 1-8)

---

## Cost Estimates (Monthly)

### Minimal Setup
- **Hosting**: DigitalOcean Droplet ($12-24)
- **Database**: Managed PostgreSQL ($15)
- **Redis**: Managed Redis ($10)
- **Domain**: $1-2
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$40-50/month

### Recommended Setup
- **Hosting**: AWS EC2 t3.medium ($30-50)
- **Database**: AWS RDS PostgreSQL ($50-100)
- **Redis**: AWS ElastiCache ($15-30)
- **Load Balancer**: AWS ALB ($20)
- **Monitoring**: DataDog/Sentry ($50-100)
- **Email Service**: SendGrid/AWS SES ($10-50)
- **Total**: ~$175-350/month

### Enterprise Setup
- **Hosting**: AWS ECS/EKS ($200-500)
- **Database**: AWS RDS Multi-AZ ($200-400)
- **Redis**: AWS ElastiCache Cluster ($100-200)
- **CDN**: CloudFront ($20-100)
- **Monitoring**: Full observability stack ($200-500)
- **Email Service**: Enterprise plan ($100-500)
- **Total**: ~$820-2200/month

---

## Quick Start for Collaborators

### 1. Clone and Install
```bash
git clone <repository-url>
cd email-automation-tool
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Development
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

### 4. Access Application
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### 5. Test Email Sending
- Use a test Gmail account
- Generate App Password: https://myaccount.google.com/apppasswords
- Load test data from test_data.csv

---

## Support & Documentation

### Current Documentation
- This README
- Inline code comments
- config.json structure

### Needed Documentation
- API documentation (Swagger/OpenAPI)
- Database schema documentation
- Deployment guide
- User manual
- Developer guide
- Troubleshooting guide

---

## Questions for Team Discussion

1. **Target Scale**: How many users? How many emails per day?
2. **Budget**: What's the monthly budget for infrastructure?
3. **Timeline**: When does this need to be production-ready?
4. **Features**: Which Phase 9 features are must-haves?
5. **Compliance**: Any specific compliance requirements (GDPR, HIPAA, etc.)?
6. **Email Provider**: Stick with Gmail or migrate to SendGrid/AWS SES?
7. **Hosting**: Cloud preference (AWS, GCP, Azure, DigitalOcean)?
8. **Team Size**: How many developers will work on this?
9. **Monitoring**: What level of monitoring/alerting is needed?
10. **SLA**: What uptime guarantee is required?

