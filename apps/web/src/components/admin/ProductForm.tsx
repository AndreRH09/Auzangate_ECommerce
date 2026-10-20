"use client";

import { ArrowLeft, CaretLeft, CaretRight, Check, Plus, Star, Trash, UploadSimple, Warning, X } from "@phosphor-icons/react";
import { useTranslations } from "next-intl";
import { startTransition, useActionState, useRef, useState, useTransition } from "react";
import { deleteColor, deleteImage, saveProduct, type SaveState, uploadImage } from "@/app/actions";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { AdminCatalogOptions, AdminImage, AdminProduct } from "@/lib/api";
import { slugify } from "@/lib/format";

const LOCALES = ["es", "en"] as const;
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const GENDERS = ["UNISEX", "MEN", "WOMEN"] as const;
const KNOWN_ERRORS = ["code_taken", "slug_taken", "invalid_category", "need_variant_price", "need_image_alt", "invalid_tech_specs", "color_taken", "color_in_use", "image_type", "image_size"];

const input = "mt-1 h-10 w-full rounded-md border border-linea bg-nieve px-3 text-sm focus:border-granito";
const area = "mt-1 w-full rounded-md border border-linea bg-nieve p-3 text-sm focus:border-granito";
const label = "block text-xs text-pizarra";

// Ficha técnica: filas propiedad/valor. Los inputs repetidos `${l}.specKey`/`${l}.specValue`
// llegan en orden a la server action, que los empareja con getAll.
function SpecsEditor({ locale: l, initial }: { locale: Locale; initial: Record<string, string> }) {
  const t = useTranslations("Admin");
  const [rows, setRows] = useState(() => Object.entries(initial).map(([k, v]) => ({ id: crypto.randomUUID(), k, v })));
  return (
    <fieldset>
      <legend className={label}>{t("techSpecs")}</legend>
      <ul className="mt-1 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[2fr_3fr_auto] gap-2">
            <input name={`${l}.specKey`} defaultValue={r.k} required maxLength={40} placeholder={t("specKey")} aria-label={t("specKey")} className={input} />
            <input name={`${l}.specValue`} defaultValue={r.v} required maxLength={200} placeholder={t("specValue")} aria-label={t("specValue")} className={`${input} data`} />
            <button type="button" onClick={() => setRows(rows.filter((x) => x.id !== r.id))} aria-label={t("removeSpec")} className="mt-1 grid size-10 place-items-center rounded-md border border-linea text-pizarra hover:text-[#c4384a]">
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setRows([...rows, { id: crypto.randomUUID(), k: "", v: "" }])} className="mt-2 inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline">
        <Plus size={14} aria-hidden /> {t("addSpec")}
      </button>
    </fieldset>
  );
}

// colores sugeridos al crear una variante (paleta de marca); cualquier otro va por HEX
// en mayúsculas, como ProductVariant.colorHex (fotos y variantes se emparejan comparando el texto)
const PRESETS = ["#262527", "#606263", "#E6E8E8", "#FFFFFF", "#9E1B32", "#E9E3D6", "#2F4A3A", "#1F3A5F"];
const HEX = /^#[0-9A-F]{6}$/;
export const MIN_PHOTOS = 3;

// `from` = hex guardado en las variantes (solo grupos de variantes); nombre ES/EN se guarda en ProductVariant.colorName
type Group = { key: string; hex: string; from?: string; nameEs?: string; nameEn?: string };

// Selector de color: paleta + nativo + HEX libre.
// Un color ya usado por otro grupo no se aplica (las fotos se agrupan por hex).
function ColorPicker({ hex, isTaken, onChange }: { hex: string; isTaken: (hex: string) => boolean; onChange: (hex: string) => void }) {
  const t = useTranslations("Admin");
  const [text, setText] = useState(hex);
  const v = text.toUpperCase();
  const taken = HEX.test(v) && isTaken(v);
  const set = (next: string) => {
    setText(next);
    const n = next.toUpperCase();
    if (HEX.test(n) && !isTaken(n)) onChange(n);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button key={p} type="button" onClick={() => set(p)} aria-label={p} className={`size-7 rounded-full border border-linea ${p === hex ? "outline-2 outline-offset-2 outline-granito" : ""}`} style={{ background: p }} />
      ))}
      <input type="color" value={hex.toLowerCase()} onChange={(e) => set(e.target.value)} aria-label={t("colorCustom")} className="size-8 cursor-pointer rounded-full" />
      <input value={text} onChange={(e) => set(e.target.value.trim())} maxLength={7} aria-label="HEX" aria-invalid={taken || !HEX.test(v)} className={`${input} data mt-0 w-28 uppercase aria-invalid:border-[#c4384a]`} />
      {taken && <span className="text-xs text-[#c4384a]">{t("colorTaken")}</span>}
    </div>
  );
}

// F1·5. Fotos agrupadas por variante de color (+ grupo "todos los colores" con colorHex null).
// Subir y borrar es inmediato (R2 + API); alt, color y orden viajan con el formulario (inputs img.*) al guardar:
// el orden del DOM (grupo general, luego cada color) es el orden de la galería.
function ImagesPanel({ productId, initial, colors }: { productId: string; initial: AdminImage[]; colors: AdminProduct["colors"] }) {
  const t = useTranslations("Admin");
  const [images, setImages] = useState(initial);
  // grupos = colores de variantes + colores ya usados en fotos sin variante; "" = todos los colores
  const [groups, setGroups] = useState<Group[]>(() => {
    const known = colors.map((c) => ({ key: c.hex, hex: c.hex, from: c.hex, nameEs: c.nameEs, nameEn: c.nameEn }));
    const orphan = [...new Set(initial.map((i) => i.colorHex).filter((h): h is string => !!h && !colors.some((c) => c.hex === h)))];
    return [{ key: "", hex: "" }, ...known, ...orphan.map((h) => ({ key: h, hex: h }))];
  });
  // abiertos al cargar: los colores a los que les faltan fotos (y el general si tiene alguna); los nuevos se agregan abiertos
  const [opened] = useState(() => {
    const count = (hex: string) => initial.filter((i) => (i.colorHex ?? "") === hex).length;
    return new Set(groups.filter((g) => (g.key === "" ? 0 < count(g.hex) : count(g.hex) < MIN_PHOTOS)).map((g) => g.key));
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, startBusy] = useTransition();
  const of = (hex: string) => images.filter((i) => (i.colorHex ?? "") === hex);

  const upload = (files: File[], hex: string) =>
    startBusy(async () => {
      setErrors([]);
      for (const file of files) {
        const data = new FormData();
        data.set("file", file);
        try {
          const bmp = await createImageBitmap(file); // ancho/alto para el layout de la galería (evita saltos)
          data.set("width", String(bmp.width));
          data.set("height", String(bmp.height));
          bmp.close();
        } catch {
          setErrors((e) => [...e, `${file.name}: ${t("errors.image_type")}`]);
          continue;
        }
        const res = await uploadImage(productId, data);
        if (res.ok) setImages((cur) => [...cur, { ...res.image, colorHex: hex || null }]);
        else setErrors((e) => [...e, ...res.errors.map((c) => `${file.name}: ${KNOWN_ERRORS.includes(c) ? t(`errors.${c}`) : c}`)]);
      }
    });

  const remove = (id: string) => {
    if (!confirm(t("confirmDeleteImage"))) return;
    startBusy(async () => {
      await deleteImage(productId, id);
      setImages((cur) => cur.filter((i) => i.id !== id));
    });
  };

  // intercambia una foto con su vecina dentro del mismo grupo
  const move = (id: string, by: -1 | 1) =>
    setImages((cur) => {
      const img = cur.find((i) => i.id === id)!;
      const group = cur.filter((i) => i.colorHex === img.colorHex);
      const other = group[group.indexOf(img) + by]!;
      return cur.map((i) => (i === img ? other : i === other ? img : i));
    });

  const edit = (key: string, patch: Partial<Group>) => setGroups((cur) => cur.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const recolor = (key: string, hex: string) => {
    const g = groups.find((x) => x.key === key)!;
    setImages((cur) => cur.map((i) => (i.colorHex === g.hex ? { ...i, colorHex: hex } : i)));
    edit(key, { hex });
  };

  const addGroup = () => {
    const hex = PRESETS.find((p) => !groups.some((g) => g.hex === p)) ?? "#000000";
    const key = crypto.randomUUID();
    opened.add(key);
    setGroups([...groups, { key, hex }]);
  };

  // Eliminar color: diálogo modal nativo de confirmación; recién al confirmar se borra en la API y R2.
  const dialog = useRef<HTMLDialogElement>(null);
  const [toDelete, setToDelete] = useState<Group | null>(null);
  const askDelete = (g: Group) => {
    setErrors([]);
    setToDelete(g);
    dialog.current?.showModal();
  };
  const confirmDelete = () => {
    const g = toDelete!;
    dialog.current?.close();
    startBusy(async () => {
      const res = await deleteColor(productId, { hex: g.from ?? null, imageIds: of(g.hex).map((i) => i.id) });
      if (!res.ok) return setErrors(res.errors.map((c) => (KNOWN_ERRORS.includes(c) ? t(`errors.${c}`) : c)));
      setImages((cur) => cur.filter((i) => (i.colorHex ?? "") !== g.hex));
      setGroups((cur) => cur.filter((x) => x.key !== g.key));
    });
  };
  const pendingVariants = toDelete?.from ? (colors.find((c) => c.hex === toDelete.from)?.variants ?? 0) : 0;

  return (
    <section className="mt-6 rounded-panel bg-nieve p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="data tracking-[0.2em] uppercase">{t("images")}</h2>
          <p className="mt-1 text-xs text-pizarra">{t("imagesHint", { min: MIN_PHOTOS })}</p>
        </div>
        <button type="button" onClick={addGroup} className="btn h-10 gap-2 bg-granito text-nieve hover:bg-pizarra">
          <Plus size={16} aria-hidden /> {t("addColor")}
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {groups.map((g) => {
          const list = of(g.hex);
          const general = g.key === "";
          const done = list.length >= MIN_PHOTOS;
          const variant = !!g.from;
          return (
            // acordeón nativo; `open` constante para que React no pise lo que el usuario abre o cierra
            <details key={g.key} open={opened.has(g.key)} className="group rounded-lg border border-linea shadow-xs">
              {!general && <input type="hidden" name="group.color" value={g.hex} />}
              {variant && (
                <>
                  <input type="hidden" name="color.from" value={g.from} />
                  <input type="hidden" name="color.hex" value={g.hex} />
                </>
              )}
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4">
                <CaretRight size={14} aria-hidden className="transition-transform group-open:rotate-90 motion-reduce:transition-none" />
                {general ? (
                  <span className="font-semibold">{t("allColors")}</span>
                ) : (
                  <>
                    <span className="size-5 rounded-full border border-linea" style={{ background: g.hex }} />
                    <span className="font-semibold">{g.nameEs || t("newColor")}</span>
                    <span className="data text-xs text-pizarra uppercase">{g.hex}</span>
                  </>
                )}
                <span className="data ml-auto text-xs text-pizarra">{t("photoCount", { count: list.length })}</span>
                {!general && (
                  <span className={`data flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${done ? "bg-glaciar text-granito" : "bg-[#c4384a]/10 text-[#c4384a]"}`}>
                    {done ? <Check size={12} aria-hidden /> : <Warning size={12} aria-hidden />}
                    {Math.min(list.length, MIN_PHOTOS)}/{MIN_PHOTOS}
                  </span>
                )}
              </summary>

              <div className="border-t border-linea p-4">
                {!general && (
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <ColorPicker hex={g.hex} isTaken={(hex) => groups.some((x) => x.key !== g.key && x.hex === hex)} onChange={(hex) => recolor(g.key, hex)} />
                    {/* el nombre vive en las variantes: un color nuevo lo recibe al crear sus variantes */}
                    {variant ? (
                      <div className="grid grid-cols-2 gap-2">
                        <label className={label}>
                          {t("colorName")} ES
                          <input name="color.nameEs" lang="es" required maxLength={40} value={g.nameEs} onChange={(e) => edit(g.key, { nameEs: e.target.value })} className={input} />
                        </label>
                        <label className={label}>
                          {t("colorName")} EN
                          <input name="color.nameEn" lang="en" required maxLength={40} value={g.nameEn} onChange={(e) => edit(g.key, { nameEn: e.target.value })} className={input} />
                        </label>
                      </div>
                    ) : (
                      <p className="text-xs text-pizarra">{t("colorNameLater")}</p>
                    )}
                    {/* sin nada guardado (color nuevo sin fotos) se quita sin preguntar; si no, confirma en el diálogo */}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => (!variant && list.length === 0 ? setGroups(groups.filter((x) => x.key !== g.key)) : askDelete(g))}
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-linea px-3 text-sm text-pizarra hover:border-[#c4384a] hover:text-[#c4384a] disabled:opacity-50"
                    >
                      <Trash size={14} aria-hidden /> {t("removeColor")}
                    </button>
                  </div>
                )}

                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {list.map((img, i) => (
                    <li key={img.id} className={`space-y-2 rounded-md border p-3 ${i === 0 ? "border-granito" : "border-linea"}`}>
                      <input type="hidden" name="img.id" value={img.id} />
                      <input type="hidden" name="img.color" value={img.colorHex ?? ""} />
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element -- ver ui/ProductPhoto */}
                        <img src={img.url} alt="" width={img.width} height={img.height} loading="lazy" className="aspect-[4/5] w-full rounded bg-glaciar object-contain" />
                        {i === 0 && (
                          <span className="data absolute top-2 left-2 flex items-center gap-1 rounded-full bg-granito px-2 py-0.5 text-xs text-nieve">
                            <Star size={12} weight="fill" aria-hidden /> {t("catalogCover")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="data mr-auto text-xs text-pizarra">#{i + 1}</span>
                        <button type="button" disabled={i === 0} onClick={() => move(img.id, -1)} aria-label={t("moveLeft")} className="grid size-8 place-items-center rounded-md border border-linea disabled:opacity-30">
                          <CaretLeft size={14} aria-hidden />
                        </button>
                        <button type="button" disabled={i === list.length - 1} onClick={() => move(img.id, 1)} aria-label={t("moveRight")} className="grid size-8 place-items-center rounded-md border border-linea disabled:opacity-30">
                          <CaretRight size={14} aria-hidden />
                        </button>
                        <button type="button" disabled={busy} onClick={() => remove(img.id)} aria-label={t("deleteImage")} className="grid size-8 place-items-center rounded-md border border-linea text-pizarra hover:text-[#c4384a]">
                          <Trash size={14} aria-hidden />
                        </button>
                      </div>
                      <label className={label}>
                        Alt ES
                        <input name="img.altEs" lang="es" defaultValue={img.altEs} maxLength={200} className={input} />
                      </label>
                      <label className={label}>
                        Alt EN
                        <input name="img.altEn" lang="en" defaultValue={img.altEn} maxLength={200} className={input} />
                      </label>
                    </li>
                  ))}
                  <li>
                    <label className={`grid aspect-[4/5] cursor-pointer place-items-center rounded-md border border-dashed border-linea text-sm text-pizarra hover:border-granito ${busy ? "pointer-events-none opacity-60" : ""}`}>
                      <span className="flex flex-col items-center gap-2 text-center">
                        <UploadSimple size={20} aria-hidden />
                        {busy ? t("uploading") : t("uploadImages")}
                        {!general && !done && <span className="text-xs">{t("photosMissing", { count: MIN_PHOTOS - list.length })}</span>}
                      </span>
                      {/* sin name: el archivo no viaja con el formulario, se sube aparte */}
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="sr-only"
                        onChange={(e) => {
                          upload([...(e.target.files ?? [])], g.hex);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </li>
                </ul>
              </div>
            </details>
          );
        })}
      </div>
      {errors.length > 0 && (
        <ul role="alert" className="mt-3 text-sm text-[#c4384a]">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}

      {/* <dialog> modal nativo: foco atrapado, Esc cancela, fondo inerte. Botones type="button": está dentro del <form> */}
      <dialog
        ref={dialog}
        aria-labelledby="delete-color-title"
        onClose={() => setToDelete(null)}
        className="m-auto w-[min(92vw,28rem)] rounded-panel border border-linea bg-nieve p-6 text-granito backdrop:bg-granito/40"
      >
        {toDelete && (
          <>
            <h2 id="delete-color-title" className="flex items-center gap-3 text-lg font-semibold">
              <span className="size-5 rounded-full border border-linea" style={{ background: toDelete.hex }} />
              {t("deleteColorTitle", { name: toDelete.nameEs || toDelete.hex })}
            </h2>
            <p className="mt-3 text-sm text-pizarra">
              {t("deleteColorBody", { variants: pendingVariants, photos: of(toDelete.hex).length })}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" autoFocus onClick={() => dialog.current?.close()} className="btn h-10 border border-granito">
                {t("cancel")}
              </button>
              <button type="button" onClick={confirmDelete} className="btn h-10 bg-[#c4384a] text-nieve hover:bg-[#a52f3e]">
                {t("deleteColorConfirm")}
              </button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}

// RF-A02/A03. Se envía con onSubmit (no <form action>) para que React no resetee el formulario:
// si la API rechaza el guardado, lo escrito se conserva. Tras guardar bien, se remonta con lo guardado.
export function ProductForm({ product: initial, options, locale }: { product: AdminProduct; options: AdminCatalogOptions; locale: Locale }) {
  const t = useTranslations("Admin");
  const [state, dispatch, pending] = useActionState<SaveState, FormData>(saveProduct.bind(null, initial.id), null);
  const [missing, setMissing] = useState<string[]>([]);
  const product = state?.ok ? state.product : initial;
  const [names, setNames] = useState({ es: initial.translations.es.name, en: initial.translations.en.name });
  const title = product.translations[locale].name || product.code;

  return (
    <form
      key={product.updatedAt}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        // regla de negocio: para publicar, cada variante de color necesita MIN_PHOTOS fotos (borradores, libres)
        const photoColors = data.getAll("img.color");
        const short = data.getAll("group.color").filter((hex) => photoColors.filter((c) => c === hex).length < MIN_PHOTOS);
        setMissing(data.get("status") === "PUBLISHED" ? short.map(String) : []);
        if (data.get("status") === "PUBLISHED" && short.length) return;
        startTransition(() => dispatch(data));
      }}
      className="pb-24"
    >
      <Link href="/admin/productos" className="inline-flex items-center gap-2 text-sm text-pizarra hover:text-granito">
        <ArrowLeft size={14} aria-hidden /> {t("products")}
      </Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="section-title">{title}</h1>
        {product.status === "PUBLISHED" && (
          <Link href={`/p/${product.translations[locale].slug}`} target="_blank" className="text-sm underline underline-offset-4">
            {t("viewInStore")}
          </Link>
        )}
      </div>

      <section className="mt-8 grid gap-4 rounded-panel bg-nieve p-6 sm:grid-cols-2 lg:grid-cols-6">
        {/* precio único del producto: se aplica a todas sus variantes; sin variantes no hay dónde guardarlo */}
        <label className={label}>
          {t("price")}
          <span className="relative block">
            <span className="data pointer-events-none absolute top-1/2 left-3 mt-0.5 -translate-y-1/2 text-sm text-pizarra">S/</span>
            {product.priceCents === null ? (
              <input disabled placeholder="—" aria-describedby="price-hint" className={`${input} data pl-9 disabled:opacity-60`} />
            ) : (
              <input name="price" type="number" inputMode="decimal" required min={0.01} max={100000} step={0.01} defaultValue={(product.priceCents / 100).toFixed(2)} className={`${input} data pl-9`} />
            )}
          </span>
          {product.priceCents === null && <span id="price-hint" className="mt-1 block">{t("priceNoVariants")}</span>}
        </label>
        <label className={label}>
          {t("code")}
          <input name="code" required defaultValue={product.code} className={`${input} data uppercase`} />
        </label>
        <label className={label}>
          {t("status")}
          <select name="status" defaultValue={product.status} className={input}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`statusName.${s}`)}</option>)}
          </select>
        </label>
        <label className={label}>
          {t("gender")}
          <select name="gender" defaultValue={product.gender} className={input}>
            {GENDERS.map((g) => <option key={g} value={g}>{t(`genderName.${g}`)}</option>)}
          </select>
        </label>
        <label className={label}>
          {t("category")}
          <select name="categoryId" defaultValue={product.categoryId} className={input}>
            {options.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className={label}>
          {t("series")}
          <select name="seriesId" defaultValue={product.seriesId ?? ""} className={input}>
            <option value="">{t("noSeries")}</option>
            {options.series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {LOCALES.map((l) => {
          const tr = product.translations[l];
          return (
            <section key={l} lang={l} className="space-y-4 rounded-panel bg-nieve p-6">
              <h2 className="data tracking-[0.2em] uppercase">{l === "es" ? "Español" : "English"}</h2>
              <label className={label}>
                {t("name")}
                <input name={`${l}.name`} required maxLength={120} value={names[l]} onChange={(e) => setNames({ ...names, [l]: e.target.value })} className={input} />
              </label>
              {/* slug derivado del nombre (lo genera la API al guardar); aquí solo se previsualiza */}
              <label className={label}>
                {t("slug")}
                <input disabled value={slugify(names[l])} aria-describedby={`${l}-slug-hint`} className={`${input} data disabled:bg-glaciar disabled:text-pizarra`} />
                <span id={`${l}-slug-hint`} className="mt-1 block">{t("slugAuto")}</span>
              </label>
              <label className={label}>
                {t("subtitle")}
                <input name={`${l}.subtitle`} maxLength={160} defaultValue={tr.subtitle} className={input} />
              </label>
              <label className={label}>
                {t("description")}
                <textarea name={`${l}.description`} rows={5} maxLength={5000} defaultValue={tr.description} className={area} />
              </label>
              <SpecsEditor locale={l} initial={tr.techSpecs} />
            </section>
          );
        })}
      </div>

      <ImagesPanel productId={product.id} initial={product.images} colors={product.colors} />

      <p className="mt-6 text-sm text-pizarra">{t("variantsNote", { variants: product.variants })}</p>

      <div className="fixed inset-x-0 bottom-0 border-t border-linea bg-nieve/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-end gap-4 px-4 py-3 md:px-8">
          <div role="status" aria-live="polite" className="text-sm">
            {missing.length > 0 && (
              <p className="text-[#c4384a]">{t("needPhotos", { min: MIN_PHOTOS, colors: missing.join(", ").toUpperCase() })}</p>
            )}
            {missing.length === 0 && state?.ok && !pending && (
              <span className="flex items-center gap-2"><Check size={16} aria-hidden /> {t("saved")}</span>
            )}
            {missing.length === 0 && state && !state.ok && (
              <ul className="text-[#c4384a]">
                {state.errors.map((e) => <li key={e}>{KNOWN_ERRORS.includes(e) ? t(`errors.${e}`) : e}</li>)}
              </ul>
            )}
          </div>
          <button disabled={pending} className="btn h-10 bg-granito text-nieve hover:bg-pizarra disabled:opacity-60">
            {pending ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </form>
  );
}
