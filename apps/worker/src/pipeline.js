import { orchestrate } from './orchestrator.js';

export async function processJob(job) {
  return orchestrate(job);
}
