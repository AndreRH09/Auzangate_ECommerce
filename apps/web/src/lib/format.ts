export const formatPrice = (cents: number) => `S/ ${(cents / 100).toFixed(2)}`;

export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3001";
