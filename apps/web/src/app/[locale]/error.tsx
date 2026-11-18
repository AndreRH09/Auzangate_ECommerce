"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { startTransition, useEffect, useState } from "react";

// Atrapa errores de los layouts/páginas de [locale]: casi siempre es la API de Render dormida (caché ISR fría).
// Sondea /api/wake hasta que responda 200 (~1-2 min) y re-renderiza. Pasados 3 min ofrece reintentar a mano.
const GIVE_UP_S = 180;

export default function WakeScreen({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const es = useLocale() === "es";
  const [secs, setSecs] = useState(0);
  const [round, setRound] = useState(0); // cambia → reinicia el sondeo

  useEffect(() => {
    let alive = true;
    const start = Date.now();
    const tick = setInterval(() => setSecs(Math.floor((Date.now() - start) / 1000)), 1000);
    (async () => {
      while (alive && Date.now() - start < GIVE_UP_S * 1000) {
        const ok = await fetch("/api/wake", { cache: "no-store" }).then((r) => r.ok, () => false);
        if (ok && alive) return startTransition(() => { router.refresh(); reset(); });
        await new Promise((r) => setTimeout(r, 4000));
      }
    })();
    return () => { alive = false; clearInterval(tick); };
  }, [round, router, reset]);

  const stuck = secs >= GIVE_UP_S;
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-[1600px] flex-col items-center justify-center px-4 text-center" aria-live="polite">
      {!stuck && <div className="size-10 animate-spin rounded-full border-2 border-linea border-t-granito motion-reduce:animate-none" aria-hidden />}
      <p className="data mt-6 tracking-[0.2em] text-pizarra">AUZANGATE · 6384 · PERÚ</p>
      <h1 className="section-title mt-4">
        {stuck ? (es ? "El servidor no responde" : "Server not responding") : es ? "Despertando el servidor…" : "Waking up the server…"}
      </h1>
      <p className="mt-3 text-pizarra">
        {stuck
          ? es ? "Inténtalo de nuevo en un momento." : "Try again in a moment."
          : es ? `Puede tardar 1-2 minutos · ${secs}s` : `This can take 1-2 minutes · ${secs}s`}
      </p>
      {stuck && (
        <button className="btn mt-8 bg-granito text-nieve hover:bg-pizarra" onClick={() => { setSecs(0); setRound((n) => n + 1); }}>
          {es ? "Reintentar" : "Retry"}
        </button>
      )}
    </main>
  );
}
