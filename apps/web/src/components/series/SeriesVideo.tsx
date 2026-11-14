"use client";

import { useEffect, useRef } from "react";
import type { SeriesMedia } from "@/lib/series-identity";

// Loop sin sonido de la identidad de serie. Con "reducir movimiento" se queda en el póster (sin autoplay).
// Sin media (video aún no publicado) no pinta nada: la sección muestra su fondo.
export function SeriesVideo({ media, className = "" }: { media?: SeriesMedia; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (!video) return;
      if (reduce.matches) video.pause();
      else void video.play().catch(() => {}); // autoplay bloqueado: queda el póster
    };
    apply();
    reduce.addEventListener("change", apply);
    return () => reduce.removeEventListener("change", apply);
  }, []);

  if (!media) return null;
  return (
    <video
      ref={ref}
      src={media.video}
      poster={media.poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      className={`size-full object-cover ${className}`}
    />
  );
}
