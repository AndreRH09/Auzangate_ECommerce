"use client";

import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { useRef, useState, type MouseEvent } from "react";
import type { Image } from "@/lib/api";
import { ProductPhoto } from "../ui/ProductPhoto";

// Galería horizontal con scroll-snap (design system §5): fotos de 42vw en desktop, 100vw en mobile
// con contador "1 / 3". La 1ª foto carga con prioridad (LCP de la ficha).
// Clic en una foto: visor a pantalla completa (<dialog> nativo: Esc cierra, foco atrapado); dentro, clic = lupa
// que sigue al puntero. Animación de entrada en globals.css (.zoom).
export function ProductGallery({ images, label }: { images: Image[]; label: string }) {
  const t = useTranslations("Product");
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null); // transform-origin de la lupa; null = sin lupa

  const open = (i: number) => {
    setIndex(i);
    setZoom(null);
    dialog.current?.showModal();
  };
  const go = (step: number) => {
    setIndex((i) => (i + step + images.length) % images.length);
    setZoom(null);
  };
  const origin = (e: MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    return `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  };
  const img = images[index];
  const nav = "grid size-11 place-items-center rounded-full bg-nieve/90 text-granito shadow-sm hover:bg-nieve";

  return (
    <>
      <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto" aria-label={label}>
        {images.map((img, i) => (
          <li key={img.url} className="relative shrink-0 basis-full snap-start md:basis-[42vw]">
            <button type="button" onClick={() => open(i)} aria-label={t("zoom", { n: i + 1 })} className="block w-full cursor-zoom-in">
              <ProductPhoto image={img} pad="p-8" priority={i === 0} className="aspect-[4/5] w-full bg-photo" />
            </button>
            <span className="data absolute bottom-3 left-3 rounded-sm bg-granito/80 px-2 py-1 text-nieve md:hidden">
              {i + 1} / {images.length}
            </span>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        className="zoom m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-photo p-0"
      >
        {img && (
          <div
            onClick={(e) => setZoom(zoom ? null : origin(e))}
            onMouseMove={(e) => zoom && setZoom(origin(e))}
            className={`size-full ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          >
            <ProductPhoto
              image={img}
              pad="p-12"
              priority
              style={{ transformOrigin: zoom ?? "center", scale: zoom ? "2.2" : "1" }}
              className="size-full transition-[scale] duration-300 ease-(--ease-fluid)"
            />
          </div>
        )}
        <button type="button" onClick={() => dialog.current?.close()} aria-label={t("close")} className={`${nav} absolute top-4 right-4`}>
          <X size={18} aria-hidden />
        </button>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t("prev")} className={`${nav} absolute top-1/2 left-4 -translate-y-1/2`}>
              <CaretLeft size={18} aria-hidden />
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t("next")} className={`${nav} absolute top-1/2 right-4 -translate-y-1/2`}>
              <CaretRight size={18} aria-hidden />
            </button>
            <span className="data absolute bottom-4 left-1/2 -translate-x-1/2 rounded-sm bg-granito/80 px-2 py-1 text-nieve">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </dialog>
    </>
  );
}
