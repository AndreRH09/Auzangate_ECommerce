import { Body, Controller, HttpCode, Module, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';
import { LocaleQuery } from '../catalog/catalog.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

class SubscribeDto extends LocaleQuery {
  @IsEmail() @MaxLength(254)
  email: string;
}

// RF-T10. Doble opt-in pospuesto hasta tener proveedor de email.
// ponytail: controller y módulo en un archivo; sin service porque es un solo upsert.
@ApiTags('newsletter')
@Controller('newsletter')
class NewsletterController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(204) // misma respuesta si ya estaba suscrito: no revela qué emails existen
  async subscribe(@Body() { email, locale }: SubscribeDto) {
    const normalized = email.toLowerCase();
    await this.prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      create: { email: normalized, locale },
      update: { locale },
    });
  }
}

@Module({ controllers: [NewsletterController] })
export class NewsletterModule {}
