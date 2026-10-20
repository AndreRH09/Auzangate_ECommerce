// "Pantalón AV02" -> "pantalon-av02". Lo usan el seed y el admin (slug vacío = se genera del nombre).
export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
