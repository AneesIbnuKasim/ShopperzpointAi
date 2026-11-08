import { workerConfig } from './config.js';

export async function generateJson(prompt, { model = workerConfig.model, signal } = {}) {
  const response = await fetch(`${workerConfig.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal,
    body: JSON.stringify({ model, prompt, stream: false, format: 'json', options: { temperature: 0.2 } })
  });

  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`);
  const body = await response.json();
  if (typeof body.response !== 'string') throw new Error('Ollama response did not contain text');
  try {
    return JSON.parse(body.response);
  } catch {
    throw new Error('Ollama returned invalid JSON');
  }
}

export async function listModels() {
  const response = await fetch(`${workerConfig.ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Ollama tags returned HTTP ${response.status}`);
  return (await response.json()).models || [];
}
