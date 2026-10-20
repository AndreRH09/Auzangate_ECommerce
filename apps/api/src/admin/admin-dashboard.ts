import { Controller, Get, Injectable, Module, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { LocaleQuery } from '../catalog/catalog.dto.js';
import type { AdminDashboard, Locale } from '../contract.js';
import { OrderStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

// Ventas = órdenes cobradas que no se cancelaron ni reembolsaron.
const SOLD: OrderStatus[] = [OrderStatus.PAID, OrderStatus.PREPARING, OrderStatus.SHIPPED, OrderStatus.DELIVERED];
const DAY = 86_400_000;

// Medianoche de hoy en Lima (UTC-5 todo el año, Perú no tiene horario de verano).
const limaMidnight = () => new Date(`${new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })}T00:00:00-05:00`);

@Injectable()
class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // RF-A30. 5 consultas en paralelo, todas por índice o con `take`: nada pesado por visita.
  async get(locale: Locale): Promise<AdminDashboard> {
    const today = limaMidnight();
    const sold = (since: Date) => ({ status: { in: SOLD }, createdAt: { gte: since } });

    const [day, month, toShip, lowStock, recent] = await Promise.all([
      this.prisma.order.aggregate({ where: sold(today), _sum: { totalCents: true } }),
      this.prisma.order.aggregate({ where: sold(new Date(today.getTime() - 29 * DAY)), _sum: { totalCents: true }, _count: true }),
      this.prisma.order.count({ where: { status: { in: [OrderStatus.PAID, OrderStatus.PREPARING] } } }),
      this.prisma.productVariant.findMany({
        // compara dos columnas de la misma fila (field reference de Prisma)
        where: { stock: { lte: this.prisma.productVariant.fields.lowStockAt } },
        orderBy: [{ stock: 'asc' }, { sku: 'asc' }],
        take: 10,
        select: {
          sku: true,
          colorName: true,
          size: true,
          stock: true,
          lowStockAt: true,
          product: { select: { id: true, code: true, translations: { where: { locale }, select: { name: true } } } },
        },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, number: true, email: true, status: true, totalCents: true, createdAt: true },
      }),
    ]);

    const monthCents = month._sum.totalCents ?? 0;
    return {
      salesTodayCents: day._sum.totalCents ?? 0,
      sales30dCents: monthCents,
      avgTicketCents: month._count ? Math.round(monthCents / month._count) : 0,
      ordersToShip: toShip,
      lowStock: lowStock.map((v) => ({
        productId: v.product.id,
        name: v.product.translations[0]?.name ?? v.product.code,
        sku: v.sku,
        color: (v.colorName as Record<Locale, string>)[locale] ?? '',
        size: v.size,
        stock: v.stock,
        lowStockAt: v.lowStockAt,
      })),
      recentOrders: recent.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
    };
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin')
class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('dashboard')
  get(@Query() { locale }: LocaleQuery) {
    return this.dashboard.get(locale);
  }
}

@Module({ controllers: [AdminDashboardController], providers: [AdminDashboardService, AdminGuard] })
export class AdminDashboardModule {}
