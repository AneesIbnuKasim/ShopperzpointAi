import { generateJson } from './ollama.js';

const schemas = {
  PRODUCT_ANALYSIS: {
    shape: '{"product_name":"string","category":"string","demand_assessment":"Promising|Unclear|Weak","competition_assessment":"Low|Moderate|High|Unclear","opportunity_score":0,"confidence":"High|Medium|Low","reasoning":["string"]}',
    validate: (result) => typeof result.product_name === 'string' && typeof result.category === 'string' && ['Promising', 'Unclear', 'Weak'].includes(result.demand_assessment) && ['Low', 'Moderate', 'High', 'Unclear'].includes(result.competition_assessment) && Number.isInteger(result.opportunity_score) && result.opportunity_score >= 0 && result.opportunity_score <= 100 && ['High', 'Medium', 'Low'].includes(result.confidence) && Array.isArray(result.reasoning)
  },
  COMPETITOR_ANALYSIS: {
    shape: '{"product_name":"string","competitors":[{"name":"string","price_inr":null,"rating":null,"review_count":null,"source_url":null}],"competition_level":"Low|Moderate|High|Unclear","summary":"string","confidence":"High|Medium|Low"}',
    validate: (result) => typeof result.product_name === 'string' && Array.isArray(result.competitors) && ['Low', 'Moderate', 'High', 'Unclear'].includes(result.competition_level) && typeof result.summary === 'string' && ['High', 'Medium', 'Low'].includes(result.confidence)
  },
  PROFITABILITY_ANALYSIS: {
    shape: '{"selling_price_inr":null,"estimated_cost_inr":null,"estimated_profit_inr":null,"profit_margin_percent":null,"risk_level":"Low|Medium|High|Unknown","confidence":"High|Medium|Low","limitations":["string"]}',
    validate: (result) => ['Low', 'Medium', 'High', 'Unknown'].includes(result.risk_level) && ['High', 'Medium', 'Low'].includes(result.confidence) && Array.isArray(result.limitations)
  },
  PRODUCT_DESCRIPTION: {
    shape: '{"title":"string","description":"string","highlights":["string"],"keywords":["string"],"limitations":["string"]}',
    validate: (result) => typeof result.title === 'string' && typeof result.description === 'string' && Array.isArray(result.highlights) && Array.isArray(result.keywords) && Array.isArray(result.limitations)
  },
  PRODUCT_CLASSIFICATION: {
    shape: '{"product_name":"string","category":"string","subcategory":"string","attributes":{},"confidence":"High|Medium|Low","reasoning":["string"]}',
    validate: (result) => typeof result.product_name === 'string' && typeof result.category === 'string' && typeof result.subcategory === 'string' && result.attributes && typeof result.attributes === 'object' && ['High', 'Medium', 'Low'].includes(result.confidence) && Array.isArray(result.reasoning)
  },
  TREND_ANALYSIS: {
    shape: '{"trend_direction":"Rising|Stable|Falling|Unknown","trend_summary":"string","signals":["string"],"confidence":"High|Medium|Low","limitations":["string"]}',
    validate: (result) => ['Rising', 'Stable', 'Falling', 'Unknown'].includes(result.trend_direction) && typeof result.trend_summary === 'string' && Array.isArray(result.signals) && ['High', 'Medium', 'Low'].includes(result.confidence) && Array.isArray(result.limitations)
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function orchestrate(job, { retries = 2, timeoutMs = 90000 } = {}) {
  const definition = schemas[job.type];
  if (!definition) throw new Error(`Unsupported AI job type: ${job.type}`);
  const prompt = [
    'You are CraftTrend AI, a careful local analysis assistant.',
    'Use only the supplied input. Do not claim live marketplace access or invent verified sales data.',
    'Return only valid JSON matching the required shape.',
    `Required shape: ${definition.shape}`,
    `Input: ${JSON.stringify(job.payload)}`
  ].join('\n');

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await generateJson(prompt, { signal: AbortSignal.timeout(timeoutMs) });
      if (!validateStructuredResult(job.type, result)) throw new Error(`Invalid structured output for ${job.type}`);
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(500 * (attempt + 1));
    }
  }
  throw lastError;
}

export const supportedJobTypes = Object.keys(schemas);
export function validateStructuredResult(type, result) {
  return Boolean(schemas[type]?.validate(result));
}
