import { Body, Controller, Get, HttpCode, Injectable, Module, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { hash, verify } from '@node-rs/argon2';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import type { Env } from '../config/env.js';
import type { Admin, LoginResponse } from '../contract.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AdminGuard, type AdminRequest } from './admin.guard.js';
import { signToken } from './token.js';

const TOKEN_TTL = 8 * 3600; // una jornada; sin refresh token hasta F2 (cuentas de clientes)

// Se verifica contra este hash cuando el email no existe: el tiempo de respuesta no revela qué emails hay.
const DUMMY_HASH = hash('dummy-password-for-timing');

class LoginDto {
  @IsEmail() @MaxLength(254)
  email: string;

  @IsString() @MaxLength(256)
  password: string;
}

// Límite por email, no por IP: todas las requests llegan desde el Worker (BFF) y compartirían IP.
@Injectable()
class LoginThrottler extends ThrottlerGuard {
  protected getTracker(req: Request) {
    const email = (req.body as { email?: unknown } | undefined)?.email; // el guard corre antes de la validación
    return Promise.resolve(typeof email === 'string' ? email.toLowerCase() : (req.ip ?? ''));
  }
}

@ApiTags('auth')
@Controller('auth')
class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  // ponytail: solo admins por ahora (RF-A33). En F2 los clientes usan el mismo login.
  @Post('login')
  @HttpCode(200)
  @UseGuards(LoginThrottler)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(@Body() { email, password }: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const ok = await verify(user?.passwordHash ?? (await DUMMY_HASH), password);
    if (!user || !ok || user.role !== 'ADMIN' || user.status !== 'ACTIVE') throw new UnauthorizedException();
    return { accessToken: signToken(user.id, this.config.get('JWT_SECRET', { infer: true }), TOKEN_TTL), expiresIn: TOKEN_TTL };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  me(@Req() req: AdminRequest): Admin {
    return req.admin;
  }
}

@Module({ controllers: [AuthController], providers: [AdminGuard], exports: [AdminGuard] })
export class AuthModule {}
