/** Script JSON-LD per dati strutturati (SEO). Un solo nodo per `id`. */
export function JsonLd({
  data,
  id,
}: {
  data: Record<string, unknown> | object | object[];
  id?: string;
}) {
  return (
    <script
      id={id}
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
