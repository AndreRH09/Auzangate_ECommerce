// Punto de entrada de las semillas de desarrollo. Todas son re-ejecutables.
//   pnpm db:seed                  -> todas, en orden
//   pnpm db:seed users catalog    -> solo las indicadas
import { prisma } from './seeds/client.js';
import { seedCatalog } from './seeds/catalog.js';
import { seedConfig } from './seeds/config.js';
import { seedUsers } from './seeds/users.js';

const SEEDS = { users: seedUsers, config: seedConfig, catalog: seedCatalog };
type Name = keyof typeof SEEDS;

const args = process.argv.slice(2);
const unknown = args.filter((a) => !(a in SEEDS));
if (unknown.length) {
  throw new Error(`Semilla desconocida: ${unknown.join(', ')}. Opciones: ${Object.keys(SEEDS).join(', ')}`);
}
const selected = (args.length ? args : Object.keys(SEEDS)) as Name[];

try {
  for (const name of selected) await SEEDS[name]();
} finally {
  await prisma.$disconnect();
}
