import { Controller, Get, ServiceUnavailableException, VERSION_NEUTRAL } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

// VERSION_NEUTRAL: queda en /health (sin /v1) para Render y el HEALTHCHECK de Docker.
// /health no toca la BD: si Aiven está apagado, reiniciar la instancia no lo arregla (Render la reiniciaba en bucle).
// ponytail: SELECT 1 a mano en vez de @nestjs/terminus; agregarlo si hay más dependencias que chequear.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  live() {
    return { status: 'ok' };
  }

  @Get('db')
  async db() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
    return { status: 'ok', db: 'up' };
  }
}
