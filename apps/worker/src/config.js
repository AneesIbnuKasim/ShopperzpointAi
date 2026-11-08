import 'dotenv/config';

export const workerConfig = {
  apiUrl: process.env.WORKER_API_URL || 'http://localhost:4000/api/worker',
  token: process.env.WORKER_TOKEN,
  pollIntervalMs: Number(process.env.WORKER_POLL_INTERVAL_MS || 30000),
  ollamaUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  model: process.env.OLLAMA_MODEL || 'qwen3:1.7b',
  workerId: process.env.WORKER_ID || `mac-worker-${process.pid}`,
  heartbeatIntervalMs: Number(process.env.WORKER_HEARTBEAT_INTERVAL_MS || 30000)
};

if (!workerConfig.token || workerConfig.token.length < 32) {
  throw new Error('WORKER_TOKEN must be set to at least 32 characters');
}

const apiProtocol = new URL(workerConfig.apiUrl).protocol;
if (apiProtocol !== 'https:' && !workerConfig.apiUrl.includes('localhost') && !workerConfig.apiUrl.includes('127.0.0.1')) {
  throw new Error('WORKER_API_URL must use HTTPS outside local development');
}
