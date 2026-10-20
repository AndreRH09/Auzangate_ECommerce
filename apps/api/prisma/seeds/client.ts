import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from 'dotenv';
import { PrismaClient } from '../../src/generated/prisma/client.js';
import { connection } from '../../src/prisma/connection.js';

config({ path: '../../.env', quiet: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Falta DATABASE_URL');

// DATABASE_CA: misma CA que usa la API en producción (TLS verificado)
export const prisma = new PrismaClient({ adapter: new PrismaMariaDb(connection(url, process.env.DATABASE_CA)) });
