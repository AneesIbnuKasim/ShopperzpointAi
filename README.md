# CraftTrend AI

CraftTrend AI is a lightweight e-commerce product research and Meesho listing intelligence platform for the Indian market.

## Phase 1 foundation

This repository currently contains the Phase 1 foundation:

- React/Vite responsive dashboard shell.
- Express API with security middleware and health endpoint.
- MongoDB connection and admin user bootstrap.
- JWT-based single-admin authentication.
- Environment-driven configuration.

## Requirements

- Node.js 20+.
- MongoDB local instance or MongoDB Atlas free-tier URI.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

The dashboard runs at `http://localhost:5173` and the API at `http://localhost:4000`.

Set `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` before using authentication. Never commit `.env`.
