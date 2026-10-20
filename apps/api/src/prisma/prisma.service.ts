import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { Env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';
import { connection } from './connection.js';

// Prisma 7 se conecta a MySQL con un driver adapter (el conector mariadb también habla MySQL).
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    super({ adapter: new PrismaMariaDb(connection(config.get('DATABASE_URL', { infer: true }), config.get('DATABASE_CA', { infer: true }))) });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
