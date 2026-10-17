import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';
import { PrismaClient } from '../../src/generated/prisma/client.js';

config({ path: '../../.env', quiet: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Falta DATABASE_URL');

export const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
