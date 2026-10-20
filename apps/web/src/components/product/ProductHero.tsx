"use client";

import { useState } from "react";
import type { Product } from "@/lib/api";
import { ProductBuyBox } from "./ProductBuyBox";
import { ProductGallery } from "./ProductGallery";

// Galería + buy-box comparten el color elegido: la galería muestra las fotos de ese color
// más las compartidas (colorHex null). Si el color aún no tiene fotos, se muestran todas.
export function ProductHero({ p }: { p: Product }) {
  const [color, setColor] = useState((p.variants.find((v) => v.stock > 0) ?? p.variants[0])!.colorHex);
  const ofColor = p.images.filter((img) => !img.colorHex || img.colorHex === color);
  const images = ofColor.length ? ofColor : p.images;

  return (
    // buy-box flotante encima de la 2ª foto en desktop; debajo de la galería en mobile
    <div className="relative mt-4">
      <ProductGallery key={color} images={images} label={p.name} />
      <div className="md:absolute md:top-6 md:right-8 md:max-h-[calc(100svh-112px)] md:w-[min(564px,39vw)] md:overflow-y-auto md:rounded-panel md:bg-glaciar/90 md:backdrop-blur-md">
        <ProductBuyBox
          name={p.name}
          subtitle={p.subtitle}
          variants={p.variants}
          seriesPatch={p.series && { src: `/brand/parche-serie-${p.series.code.toLowerCase()}.svg`, name: p.series.name }}
          color={color}
          onColorChange={setColor}
        />
      </div>
    </div>
  );
}
