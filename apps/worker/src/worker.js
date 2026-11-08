import { workerConfig } from './config.js';
import { processJob } from './pipeline.js';

const headers = { 'content-type': 'application/json', 'x-worker-token': workerConfig.token };
let stopping = false;

async function request(path, options = {}) {
  const response = await fetch(`${workerConfig.apiUrl}${path}`, { ...options, signal: options.signal || AbortSignal.timeout(15000), headers: { ...headers, ...options.headers } });
  if (!response.ok) throw new Error(`Worker API returned HTTP ${response.status}`);
  return response.json();
}

async function heartbeat(status, currentJob, lastError) {
  await request('/heartbeat', { method: 'POST', body: JSON.stringify({ workerId: workerConfig.workerId, model: workerConfig.model, status, currentJob, lastError }) });
}

async function pollOnce() {
  const { job } = await request('/jobs/claim', {
    method: 'POST',
    body: JSON.stringify({ workerId: workerConfig.workerId })
  });
  if (!job) return false;

  try {
    await heartbeat('processing', job.type, undefined);
    const result = await processJob(job);
    await request(`/jobs/${job._id}/complete`, { method: 'POST', body: JSON.stringify({ result }) });
    await heartbeat('idle', undefined, undefined);
    console.log(`Completed ${job.type} job ${job._id}`);
  } catch (error) {
    await request(`/jobs/${job._id}/fail`, { method: 'POST', body: JSON.stringify({ error: error.message }) });
    await heartbeat('idle', undefined, error.message);
    console.error(`Failed ${job.type} job ${job._id}: ${error.message}`);
  }
  return true;
}

async function run() {
  console.log(`Local worker ${workerConfig.workerId} polling ${workerConfig.apiUrl}`);
  try { await heartbeat('idle'); } catch (error) { console.error(`Initial heartbeat failed: ${error.message}`); }
  while (!stopping) {
    try {
      const claimed = await pollOnce();
      if (!claimed) await new Promise((resolve) => setTimeout(resolve, workerConfig.pollIntervalMs));
    } catch (error) {
      console.error(`Worker unavailable: ${error.message}`);
      try { await heartbeat('offline', undefined, error.message); } catch { /* retry on next loop */ }
      await new Promise((resolve) => setTimeout(resolve, workerConfig.pollIntervalMs));
    }
  }
}

process.once('SIGINT', () => { stopping = true; });
process.once('SIGTERM', () => { stopping = true; });
run();
