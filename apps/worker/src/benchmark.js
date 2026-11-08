import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { workerConfig } from './config.js';
import { listModels } from './ollama.js';

const models = (process.env.BENCHMARK_MODELS || 'llama3.2:3b,qwen3:1.7b').split(',').map((model) => model.trim()).filter(Boolean);
const prompt = 'Return JSON only: {"ok":true,"answer":"one short sentence about craft supplies"}';
const installed = await listModels();
const installedNames = new Set(installed.map((model) => model.name));
console.log(JSON.stringify({ installedModels: installed.map((model) => ({ name: model.name, size: model.size })) }));

for (const model of models) {
  const started = performance.now();
  if (!installedNames.has(model)) {
    console.log(JSON.stringify({ model, status: 'not-installed', skipped: true }));
    continue;
  }
  try {
    const response = await fetch(`${workerConfig.ollamaUrl}/api/generate`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false, format: 'json', options: { temperature: 0 } })
    });
    const body = await response.json();
    const elapsed = Math.round(performance.now() - started);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    JSON.parse(body.response);
    console.log(JSON.stringify({ model, elapsedMs: elapsed, loadDurationNs: body.load_duration, evalTokens: body.eval_count, evalDurationNs: body.eval_duration, rssMb: measureOllamaRssMb() }));
  } catch (error) {
    console.error(JSON.stringify({ model, error: error.message }));
  }
}

function measureOllamaRssMb() {
  try {
    const output = execFileSync('ps', ['-axo', 'rss=,command='], { encoding: 'utf8' });
    const rssKb = output.split('\n').filter((line) => line.includes('ollama')).reduce((total, line) => total + Number(line.trim().split(/\s+/)[0] || 0), 0);
    return Math.round(rssKb / 1024);
  } catch { return null; }
}
