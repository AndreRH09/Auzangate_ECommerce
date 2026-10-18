import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env.js';
import type { Admin } from '../contract.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { verifyToken } from './token.js';

export type AdminRequest = Request & { admin: Admin };

// Bearer token + usuario ADMIN activo. El rol se lee de la BD en cada request (no del token):
// si se bloquea al admin, pierde acceso al instante. El tráfico del admin es mínimo, el SELECT no pesa.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const [scheme, token] = req.headers.authorization?.split(' ') ?? [];
    const id = scheme === 'Bearer' && token ? verifyToken(token, this.config.get('JWT_SECRET', { infer: true })) : null;
    const user = id && (await this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, name: true, role: true, status: true } }));
    if (!user || user.role !== 'ADMIN' || user.status !== 'ACTIVE') throw new UnauthorizedException();
    req.admin = { id: user.id, email: user.email, name: user.name };
    return true;
  }
}
