// Usuarios: admin inicial (RF-A33). No hay registro público de admins.
import { hash } from '@node-rs/argon2';
import { prisma } from './client.js';

export async function seedUsers() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 10) {
    throw new Error('Define SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD (mín. 10 caracteres) en .env');
  }
  // upsert: re-ejecutable; si el usuario existe, solo se asegura el rol
  await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: { email, name: 'Admin', role: 'ADMIN', passwordHash: await hash(password) },
  });
  console.log(`✓ admin ${email}`);
}
