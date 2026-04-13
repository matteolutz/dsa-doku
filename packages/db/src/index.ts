import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './types.js';

export const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL!),
  omit: {
    user: {
      password: true
    }
  }
});
