import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { connectDatabase } from './db.js';
import { createToken, ensureAdminUser, requireAuth } from './auth.js';
import { User } from './models/User.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'crafttrend-api' }));

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
