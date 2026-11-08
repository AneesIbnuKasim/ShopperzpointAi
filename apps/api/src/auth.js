import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { User } from './models/User.js';
import { timingSafeEqual } from 'node:crypto';

export async function ensureAdminUser() {
  const email = config.ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, 12);
  return User.create({ email, passwordHash });
}

export function requireWorker(req, res, next) {
  const received = req.headers['x-worker-token'];
  if (typeof received !== 'string') return res.status(401).json({ error: 'Worker authentication required' });
  const expected = Buffer.from(config.WORKER_TOKEN);
  const actual = Buffer.from(received);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return res.status(401).json({ error: 'Invalid worker credentials' });
  }
  return next();
}

export function createToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.JWT_SECRET, { expiresIn: '8h' });
}

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }
}
