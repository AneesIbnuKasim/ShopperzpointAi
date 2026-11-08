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

## Phase 2 local worker

Install Ollama from [ollama.com](https://ollama.com), then pull one lightweight model:

```bash
ollama pull qwen3:1.7b
```

Add `WORKER_TOKEN` and the Ollama settings from `.env.example`, then run the worker separately:

```bash
npm run worker
```

The worker makes outbound authenticated requests to claim queued jobs. It never exposes a local port. AI responses are requested in JSON mode and invalid JSON is rejected rather than stored.

Benchmark available models on the Mac:

```bash
npm run benchmark
```

The benchmark reports elapsed time and Ollama token metrics for each configured model. It does not download models automatically.

## Phase 2 local AI engine

Install Ollama for Apple Silicon from [ollama.com](https://ollama.com), start the Ollama app, and verify it:

```bash
ollama list
```

Only install the two benchmark candidates when you want to compare them:

```bash
ollama pull qwen3:1.7b
ollama pull llama3.2:3b
```

The worker processes exactly one job at a time and uses the configured `OLLAMA_MODEL`. It supports `PRODUCT_ANALYSIS`, `COMPETITOR_ANALYSIS`, `PROFITABILITY_ANALYSIS`, `PRODUCT_DESCRIPTION`, `PRODUCT_CLASSIFICATION`, and `TREND_ANALYSIS`. It validates every JSON response, retries bounded failures, applies a timeout, and sends only sanitized error text to the backend.

Start the API, dashboard, and worker in separate terminals:

```bash
npm run dev
npm run worker
```

Run the individual model benchmark without downloading anything:

```bash
npm run benchmark
```

The benchmark reports availability, response time, Ollama token timings, and a best-effort Ollama process RSS measurement. RSS is an observation of the Ollama process, not a complete model-memory accounting. Do not run the benchmark models concurrently.

## Phase 3 research boundary

Research history stores normalized observations with provider, source URL, timestamp, evidence, and data-status fields. Amazon observations also support Best Sellers Rank, rank category, units sold, revenue, and the reporting period. Public BSR is a demand signal; exact period sales must be tagged with their authorized source, such as Seller Central reports or Product Opportunity Explorer. Amazon documents that BSR is relative and sales-weighted, not a direct unit-sales counter. The initial Phase 3 path is manual import because marketplace access rules and API availability vary by account and provider. The API intentionally does not scrape, bypass CAPTCHAs, or invent sales/search data.
