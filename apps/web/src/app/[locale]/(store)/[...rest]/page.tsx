import { notFound } from "next/navigation";

// Rutas desconocidas bajo /es o /en: muestran el 404 localizado (con header y footer) en vez del genérico
export default function CatchAll() {
  notFound();
}
