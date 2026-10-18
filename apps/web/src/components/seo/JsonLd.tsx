// Datos estructurados schema.org (plan §8.4).
export function JsonLd({ data }: { data: object }) {
  // "<" escapado: un nombre de producto con "</script>" no puede cerrar la etiqueta
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
