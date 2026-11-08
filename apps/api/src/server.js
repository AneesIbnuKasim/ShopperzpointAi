import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { connectDatabase } from './db.js';
import { createToken, ensureAdminUser, requireAuth, requireWorker } from './auth.js';
import { User } from './models/User.js';
import { ResearchJob } from './models/ResearchJob.js';
import { ResearchObservation } from './models/ResearchObservation.js';
import { ResearchRun } from './models/ResearchRun.js';
import { WorkerHeartbeat } from './models/WorkerHeartbeat.js';
import { parseObservations, providers, runSchema } from './research.js';
import { ResearchProduct } from './models/ResearchProduct.js';
import { ProductObservation } from './models/ProductObservation.js';
import { ProductOpportunity } from './models/ProductOpportunity.js';
import { ProductFeedback } from './models/ProductFeedback.js';
import { SupplierObservation } from './models/SupplierObservation.js';
import { importSchema, normalizeProduct, productKey, scoreProduct } from './productResearch.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'crafttrend-api' }));

app.get('/api/research/providers', requireAuth, (_req, res) => res.json({ providers }));

app.post('/api/product-research/import', requireAuth, async (req, res, next) => {
  try {
    const { products } = importSchema.parse(req.body);
    const saved = [];
    for (const input of products) {
      const normalized = normalizeProduct(input);
      const key = productKey(input.productName, input.category);
      const addToSet = { dataFieldsVerified: { $each: input.dataFieldsVerified }, dataFieldsEstimated: { $each: input.dataFieldsEstimated } };
      if (input.sourceUrl) addToSet.sourceUrls = input.sourceUrl;
      if (['meesho', 'amazon_india', 'flipkart'].includes(input.source)) addToSet.sourceMarketplaces = input.source;
      const product = await ResearchProduct.findOneAndUpdate(
        { productKey: key },
        { $set: { productName: input.productName, category: input.category, description: input.description, confidence: input.confidence }, $addToSet: addToSet },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const observation = await ProductObservation.create({ ...normalized, productId: product.id });
      const score = scoreProduct({ observations: [input] });
      await ProductOpportunity.create({ productId: product.id, researchDate: input.observedAt, marketOpportunityScore: score.marketOpportunityScore, profitabilityScore: score.profitabilityScore, confidence: score.confidence, dataCompleteness: score.dataCompleteness, missingInformation: score.missingInformation, scoreInputs: { source: input.source } });
      saved.push({ product, observation });
    }
    return res.status(201).json({ count: saved.length, products: saved });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/product-research/dashboard', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const products = await ResearchProduct.find().sort({ updatedAt: -1 }).limit(limit).lean();
    const productIds = products.map((item) => item._id);
    const [opportunities, observations] = await Promise.all([
      ProductOpportunity.find({ productId: { $in: productIds } }).sort({ researchDate: -1, marketOpportunityScore: -1 }).lean(),
      ProductObservation.find({ productId: { $in: productIds } }).sort({ observedAt: -1 }).lean()
    ]);
    const latestOpportunity = new Map();
    for (const opportunity of opportunities) if (!latestOpportunity.has(String(opportunity.productId))) latestOpportunity.set(String(opportunity.productId), opportunity);
    const observationMap = new Map();
    for (const observation of observations) { const key = String(observation.productId); if (!observationMap.has(key)) observationMap.set(key, []); observationMap.get(key).push(observation); }
    const results = products.map((product) => ({ ...product, opportunity: latestOpportunity.get(String(product._id)) || null, observations: observationMap.get(String(product._id)) || [] })).sort((a, b) => (b.opportunity?.marketOpportunityScore || 0) - (a.opportunity?.marketOpportunityScore || 0));
    return res.json({ researchDate: new Date().toISOString().slice(0, 10), totalProducts: results.length, sufficientEvidence: results.filter((item) => item.confidence !== 'low').length, needsVerification: results.filter((item) => item.confidence === 'low').length, products: results });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/product-research/:id/feedback', requireAuth, async (req, res, next) => {
  try {
    const feedback = await ProductFeedback.create({ productId: req.params.id, action: req.body?.action, note: req.body?.note });
    await ResearchProduct.findByIdAndUpdate(req.params.id, { $set: { status: req.body?.action === 'interested' ? 'interested' : req.body?.action === 'rejected' ? 'rejected' : 'new', notes: req.body?.note } });
    return res.status(201).json({ feedback });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/product-research/jobs', requireAuth, async (req, res, next) => {
  try {
    const job = await ResearchJob.create({ type: 'PRODUCT_DISCOVERY', payload: { categories: req.body?.categories || [], sources: req.body?.sources || [], requestedAt: new Date() } });
    return res.status(201).json({ job, status: 'queued', note: 'Automatic collection remains disabled until each source adapter is approved and tested.' });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/suppliers/import', requireAuth, async (req, res, next) => {
  try {
    const supplier = await SupplierObservation.create({ supplierName: req.body?.supplierName, productName: req.body?.productName, sourceUrl: req.body?.sourceUrl, contactReference: req.body?.contactReference, quotedPrice: req.body?.quotedPrice, minimumOrderQuantity: req.body?.minimumOrderQuantity, packSize: req.body?.packSize, shippingInformation: req.body?.shippingInformation, verificationStatus: req.body?.verificationStatus || 'unverified' });
    return res.status(201).json({ supplier });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/ai/jobs', requireAuth, async (req, res, next) => {
  try {
    const supportedTypes = ['PRODUCT_ANALYSIS', 'COMPETITOR_ANALYSIS', 'PROFITABILITY_ANALYSIS', 'PRODUCT_DESCRIPTION', 'PRODUCT_CLASSIFICATION', 'TREND_ANALYSIS', 'PRODUCT_DISCOVERY', 'MARKET_DEMAND_ANALYSIS', 'SUPPLIER_ANALYSIS', 'PRODUCT_OPPORTUNITY_SCORING', 'PRODUCT_DEDUPLICATION'];
    const type = String(req.body?.type || '');
    if (!supportedTypes.includes(type)) return res.status(400).json({ error: 'Unsupported AI job type', supportedTypes });
    if (!req.body?.payload || typeof req.body.payload !== 'object') return res.status(400).json({ error: 'Job payload must be an object' });
    const job = await ResearchJob.create({ type, payload: req.body.payload });
    return res.status(201).json({ job });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/research/runs', requireAuth, async (req, res, next) => {
  try {
    const input = runSchema.parse(req.body);
    const run = await ResearchRun.create({ ...input, limitation: 'Automated collection is only enabled for approved sources. Add observations through manual import until an approved integration is configured.' });
    return res.status(201).json({ run });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/research/import', requireAuth, async (req, res, next) => {
  try {
    const run = await ResearchRun.findById(req.body?.runId);
    if (!run) return res.status(404).json({ error: 'Research run not found' });
    const observations = parseObservations(req.body?.observations).map((observation) => ({ ...observation, runId: run.id }));
    const saved = await ResearchObservation.insertMany(observations);
    run.status = 'completed';
    await run.save();
    return res.status(201).json({ count: saved.length, observations: saved });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/research/history', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const runs = await ResearchRun.find().sort({ createdAt: -1 }).limit(limit).lean();
    const observations = await ResearchObservation.find().sort({ observedAt: -1 }).limit(limit * 5).lean();
    return res.json({ runs, observations });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/research/top-opportunities', requireAuth, async (_req, res, next) => {
  try {
    const observations = await ResearchObservation.find({ provider: { $in: ['meesho', 'amazon_india', 'flipkart'] } }).sort({ observedAt: -1 }).lean();
    const latest = new Map();
    for (const observation of observations) {
      const current = latest.get(`${observation.productKey}:${observation.provider}`);
      if (!current || observation.observedAt > current.observedAt) latest.set(`${observation.productKey}:${observation.provider}`, observation);
    }

    const products = new Map();
    for (const observation of latest.values()) {
      const key = observation.productKey;
      const item = products.get(key) || { productName: observation.productName, category: observation.category, providers: [], observations: [], scoreParts: [] };
      item.providers.push(observation.provider);
      item.observations.push(observation);
      const rankSignal = observation.salesRank ? Math.max(0, 30 - Math.min(observation.salesRank, 30)) : 0;
      const ratingSignal = observation.rating ? observation.rating * 5 : 0;
      const reviewSignal = observation.reviewCount ? Math.min(15, Math.log10(observation.reviewCount + 1) * 5) : 0;
      const trendSignal = observation.trendDirection === 'rising' ? 15 : observation.trendDirection === 'stable' ? 8 : 0;
      item.scoreParts.push(rankSignal + ratingSignal + reviewSignal + trendSignal);
      products.set(key, item);
    }

    const ranked = [...products.values()].map((item) => ({
      productName: item.productName,
      category: item.category,
      providers: [...new Set(item.providers)],
      marketplaceCount: new Set(item.providers).size,
      evidenceCount: item.observations.length,
      opportunityScore: Math.min(100, Math.round((item.scoreParts.reduce((sum, value) => sum + value, 0) / item.scoreParts.length) + (new Set(item.providers).size - 1) * 5)),
      confidence: item.observations.length >= 3 ? 'high' : item.observations.length === 2 ? 'medium' : 'low',
      observations: item.observations
    })).sort((a, b) => b.opportunityScore - a.opportunityScore).slice(0, 20);
    return res.json({ products: ranked, generatedAt: new Date().toISOString(), limitation: 'Scores rank observed evidence; they are not sales guarantees.' });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    return res.json({ token: createToken(user), user: { email: user.email, role: user.role } });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/worker/status', requireAuth, async (_req, res, next) => {
  try {
    const heartbeat = await WorkerHeartbeat.findOne().sort({ updatedAt: -1 }).lean();
    const [completedJobs, failedJobs] = await Promise.all([ResearchJob.countDocuments({ status: 'completed' }), ResearchJob.countDocuments({ status: 'failed' })]);
    const online = heartbeat && Date.now() - new Date(heartbeat.updatedAt).getTime() < 90000;
    return res.json({ online: Boolean(online), worker: heartbeat ? { ...heartbeat, status: online ? heartbeat.status : 'offline' } : null, completedJobs, failedJobs });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/worker/heartbeat', requireWorker, async (req, res, next) => {
  try {
    const heartbeat = await WorkerHeartbeat.findOneAndUpdate(
      { workerId: String(req.body?.workerId || 'local-worker').slice(0, 100) },
      { $set: { model: String(req.body?.model || 'unknown').slice(0, 100), status: req.body?.status || 'idle', currentJob: req.body?.currentJob, lastError: req.body?.lastError, lastSuccessAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return res.json({ heartbeat });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/worker/jobs/claim', requireWorker, async (req, res, next) => {
  try {
    const workerId = String(req.body?.workerId || 'local-worker').slice(0, 100);
    const job = await ResearchJob.findOneAndUpdate(
      { status: 'queued' },
      { $set: { status: 'processing', workerId, lockedAt: new Date() } },
      { sort: { createdAt: 1 }, new: true }
    ).lean();
    return res.json({ job });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/worker/jobs/:id/complete', requireWorker, async (req, res, next) => {
  try {
    const job = await ResearchJob.findOneAndUpdate(
      { _id: req.params.id, status: 'processing' },
      { $set: { status: 'completed', result: req.body?.result, completedAt: new Date() }, $unset: { error: 1 } },
      { new: true }
    ).lean();
    if (!job) return res.status(404).json({ error: 'Processing job not found' });
    return res.json({ job });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/worker/jobs/:id/fail', requireWorker, async (req, res, next) => {
  try {
    const job = await ResearchJob.findOneAndUpdate(
      { _id: req.params.id, status: 'processing' },
      { $set: { status: 'failed', error: String(req.body?.error || 'Worker failed') } },
      { new: true }
    ).lean();
    if (!job) return res.status(404).json({ error: 'Processing job not found' });
    return res.json({ job });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select('email role');
    if (!user) return res.status(401).json({ error: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  connectDatabase()
    .then(ensureAdminUser)
    .then(() => app.listen(config.API_PORT, () => console.log(`API listening on ${config.API_PORT}`)))
    .catch((error) => {
      console.error('Unable to start API:', error.message);
      process.exit(1);
    });
}

export { app };
