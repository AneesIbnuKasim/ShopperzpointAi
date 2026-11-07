import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12)
});
export const config = schema.parse(process.env);
