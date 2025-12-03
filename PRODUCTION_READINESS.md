# Production Readiness Checklist

This document outlines the steps required to take the Email Automation Dashboard from a prototype to a production-grade application.

## 🚨 Critical Security Risks (High Priority)

- [ ] **Secure SMTP Credentials**: Currently, the password is sent from the frontend.
    - *Action*: Move `smtpConfig` to the backend. Use environment variables (e.g., `SMTP_PASS`) to store secrets.
- [ ] **Implement Authentication**: The API endpoints (`/send-email`, `/email-lists`) are public.
    - *Action*: Implement a login system (JWT or Session) and protect all API routes.
- [ ] **Restrict CORS**: `app.use(cors())` allows all origins.
    - *Action*: Configure CORS to allow requests *only* from your frontend domain.
- [x] **Input Validation**: Request bodies are not strictly validated.
    - *Action*: Use `zod` or `joi` to validate inputs for `/send-email` and other endpoints.

## 🏗️ Architecture & Scalability (Medium Priority)

- [ ] **Migrate to Database**: JSON files (`email_records.json`) cannot handle concurrent writes or scaling.
    - *Action*: Migrate data to a database (SQLite for simple setups, PostgreSQL for scale).
- [ ] **Non-Blocking I/O**: The server uses synchronous file operations (`fs.readFileSync`).
    - *Action*: Replace with asynchronous calls or database queries to prevent blocking the event loop.
- [x] **Refactor Monolith**: `server.js` is too large.
    - *Action*: Split code into `routes/`, `controllers/`, and `services/`.

## 🚀 Reliability & Performance (Medium Priority)

- [ ] **Centralized Logging**: `console.log` is insufficient for production debugging.
    - *Action*: Integrate a logging library like `winston` or `pino`.
- [ ] **Distributed Rate Limiting**: In-memory rate limiting resets on restart.
    - *Action*: Use Redis for persistent and distributed rate limiting.
- [ ] **Environment Configuration**: Config is currently in `config.json`.
    - *Action*: Move all configuration to `.env` files using `dotenv`.

## 💻 Frontend Considerations

- [ ] **Dynamic API URL**: The API URL is hardcoded.
    - *Action*: Use `VITE_API_URL` environment variable to switch between dev/prod backends.
- [ ] **Error Boundaries**: Prevent the entire app from crashing on component errors.
    - *Action*: Wrap main components in React Error Boundaries.

## 📅 Recommended Implementation Roadmap

### Phase 1: Security First (Immediate)
- [x] Create `.env` file for secrets. <!-- id: 5 -->
- [x] Refactor backend to read SMTP credentials from env, not request body. <!-- id: 6 -->
- [x] Lock down CORS. <!-- id: 7 -->

### Phase 2: Stability (Short-term)
- [ ] Replace JSON file storage with SQLite or PostgreSQL.
- [x] Refactor `server.js` into modular files.

### Phase 3: DevOps (Long-term)
- [ ] Set up CI/CD (GitHub Actions).
- [ ] Dockerize the application.
