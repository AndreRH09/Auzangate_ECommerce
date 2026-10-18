// Configuración de la tienda: zonas de envío (RF-A31). Editables luego desde el admin.
import { prisma } from './client.js';

const DEPARTMENTS_OUTSIDE_LIMA = [
  'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Cusco', 'Huancavelica',
  'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Loreto', 'Madre de Dios', 'Moquegua',
  'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali',
];

export async function seedConfig() {
  if ((await prisma.shippingZone.count()) > 0) {
    console.log('· zonas de envío ya existen, se omiten');
    return;
  }
  await prisma.shippingZone.createMany({
    data: [
      { name: 'Lima Metropolitana y Callao', regions: ['Lima', 'Callao'], priceCents: 1500, freeOverCents: 29900, sort: 0 },
      { name: 'Provincias', regions: DEPARTMENTS_OUTSIDE_LIMA, priceCents: 2500, freeOverCents: 49900, sort: 1 },
    ],
  });
  console.log('✓ 2 zonas de envío');
}
