# Express.js + Node.js Backend API

A clean, production-ready Express.js application built with ES Modules, security best practices, and structured routing.

## 🚀 Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and adjust your configuration if needed:
```bash
cp .env.example .env
```

### 3. Development Server
Start the development server with hot-reload (`node --watch`):
```bash
npm run dev
```

### 4. Production Server
Start the production server:
```bash
npm start
```

## 📂 Project Architecture

```text
src/
├── config/           # App & environment configuration
├── controllers/      # Route logic handlers
├── middlewares/      # Error and security middlewares
├── routes/           # Route definitions
├── app.js            # Express app assembly & middleware setup
└── server.js         # HTTP server entrypoint
```

## 📍 API Endpoints

- `GET /` - Root welcoming endpoint
- `GET /api/v1/health` - Server status & health check endpoint
- `GET /api/v1/driving-lessons` - Fetch 20-lesson progress snapshot
- `PUT /api/v1/driving-lessons` - Replace or toggle lesson progress
- `POST /api/v1/driving-lessons/reset` - Reset all lessons to incomplete
