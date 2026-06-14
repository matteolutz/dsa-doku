import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './types.js';
import { seedDb } from './seed.js';

export const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
  omit: {
    user: {
      password: true
    }
  }
});

export const initDb = () => {
  seedDb()
    .then(() => console.log('[DB] database seeded'))
    .catch((err) => console.warn('[DB] failed to seed database:', err));
};
