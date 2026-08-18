import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { Product, Category } from "@/types";
import { BUSINESS } from "@/lib/constants";
import { formatUSD } from "@/lib/money";
import { SITE_URL } from "@/lib/site";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL ?? "http://localhost:3000";

Font.register({
  family: "Playfair",
  src: `${BASE}/fonts/PlayfairDisplay-Bold.woff`,
  fontWeight: 700,
});
Font.register({
  family: "Inter",
  fonts: [
    { src: `${BASE}/fonts/Inter-Regular.woff`, fontWeight: 400 },
    { src: `${BASE}/fonts/Inter-Bold.woff`, fontWeight: 700 },
  ],
});

const GOLD = "#C9A84C";
const GOLD_DARK = "#A07830";
const CREAM = "#FAF7F2";
const TEXT = "#1C1C1C";
const TEXT_SEC = "#4A4540";
const BORDER = "#E8E3DB";

const s = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: 9,
    color: TEXT,
    backgroundColor: "#fff",
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
  },
  coverPage: {
    fontFamily: "Inter",
    color: TEXT,
    backgroundColor: CREAM,
    padding: 48,
    justifyContent: "center",
  },
  coverTitle: {
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 36,
    color: GOLD_DARK,
    marginBottom: 8,
  },
  coverSubtitle: { fontSize: 14, color: TEXT_SEC, marginBottom: 24 },
  coverMeta: { fontSize: 10, color: TEXT_SEC, marginBottom: 4 },
  sectionTitle: {
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 16,
    color: GOLD_DARK,
    marginBottom: 12,
    marginTop: 4,
  },
  card: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    marginBottom: 10,
    padding: 8,
    gap: 10,
  },
  thumb: { width: 72, height: 72, borderRadius: 4, objectFit: "cover" },
  thumbPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 4,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, minWidth: 0 },
  productName: { fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 2 },
  productDesc: { fontSize: 8, color: TEXT_SEC, marginBottom: 3 },
  specs: { fontSize: 8, color: TEXT_SEC, marginBottom: 4 },
  priceRow: { flexDirection: "row", gap: 12, marginTop: 2 },
  priceLabel: { fontSize: 7, color: TEXT_SEC },
  priceValue: { fontSize: 10, fontWeight: 700, color: TEXT },
  badgeRow: { flexDirection: "row", gap: 4, marginTop: 4 },
  badge: {
    fontSize: 7,
    color: GOLD_DARK,
    backgroundColor: CREAM,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: TEXT_SEC },
});

function absoluteImageSrc(src: string | undefined): string | null {
  if (!src?.trim()) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${BASE}${src}`;
  return `${BASE}/${src}`;
}

function CatalogDoc({
  products,
  categories,
  categoryFilter,
}: {
  products: Product[];
  categories: Category[];
  categoryFilter?: string;
}) {
  const labelFor = (slug: string) =>
    categories.find((c) => c.slug === slug)?.label ?? slug;

  const byCategory = new Map<string, Product[]>();
  for (const p of products) {
    const list = byCategory.get(p.category) ?? [];
    list.push(p);
    byCategory.set(p.category, list);
  }

  const orderedSlugs = categories
    .map((c) => c.slug)
    .filter((slug) => byCategory.has(slug));
  for (const slug of byCategory.keys()) {
    if (!orderedSlugs.includes(slug)) orderedSlugs.push(slug);
  }

  const filterLabel = categoryFilter
    ? labelFor(categoryFilter)
    : "Catálogo completo";

  const dateLabel = new Date().toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document
      title={`Catálogo Fraylin — ${filterLabel}`}
      author={BUSINESS.name}
      creator="Fraylin"
    >
      <Page size="A4" style={s.coverPage}>
        <Text style={s.coverTitle}>{BUSINESS.name}</Text>
        <Text style={s.coverSubtitle}>{BUSINESS.tagline}</Text>
        <Text style={s.coverMeta}>{filterLabel}</Text>
        <Text style={s.coverMeta}>{dateLabel}</Text>
        <Text style={s.coverMeta}>{products.length} productos</Text>
        <Text style={[s.coverMeta, { marginTop: 24 }]}>{BUSINESS.address}</Text>
        <Text style={s.coverMeta}>{BUSINESS.phones.join(" · ")}</Text>
      </Page>

      {orderedSlugs.map((slug) => {
        const items = byCategory.get(slug) ?? [];
        return (
          <Page key={slug} size="A4" style={s.page} wrap>
            <Text style={s.sectionTitle}>{labelFor(slug)}</Text>
            {items.map((product) => {
              const img = absoluteImageSrc(product.images[0]?.src);
              return (
                <View key={product.id} style={s.card} wrap={false}>
                  {img ? (
                    // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
                    <Image src={img} style={s.thumb} />
                  ) : (
                    <View style={s.thumbPlaceholder}>
                      <Text style={{ fontSize: 8, color: TEXT_SEC }}>Sin foto</Text>
                    </View>
                  )}
                  <View style={s.cardBody}>
                    <Text style={s.productName}>{product.name}</Text>
                    {product.description ? (
                      <Text style={s.productDesc}>{product.description}</Text>
                    ) : null}
                    {product.specs ? (
                      <Text style={s.specs}>{product.specs}</Text>
                    ) : null}
                    <View style={s.priceRow}>
                      {product.transferPriceCents != null ? (
                        <View>
                          <Text style={s.priceLabel}>Transferencia / Deuna</Text>
                          <Text style={s.priceValue}>
                            {formatUSD(product.transferPriceCents)}
                          </Text>
                        </View>
                      ) : null}
                      {product.priceCents != null ? (
                        <View>
                          <Text style={s.priceLabel}>Tarjeta</Text>
                          <Text style={s.priceValue}>
                            {formatUSD(product.priceCents)}
                          </Text>
                        </View>
                      ) : null}
                      {product.transferPriceCents == null &&
                      product.priceCents == null ? (
                        <Text style={s.priceLabel}>Precio a consultar</Text>
                      ) : null}
                    </View>
                    <View style={s.badgeRow}>
                      {product.freeShipping ? (
                        <Text style={s.badge}>Envío gratis</Text>
                      ) : null}
                      {product.freeInstallation ? (
                        <Text style={s.badge}>Instalación gratis</Text>
                      ) : null}
                      {product.stock === 0 ? (
                        <Text style={s.badge}>Agotado</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
            <View style={s.footer} fixed>
              <Text style={s.footerText}>
                {BUSINESS.name} · Catálogo
              </Text>
              <Text
                style={s.footerText}
                render={({ pageNumber, totalPages }) =>
                  `${pageNumber} / ${totalPages}`
                }
              />
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

export async function buildCatalogoBuffer(opts: {
  products: Product[];
  categories: Category[];
  categoryFilter?: string;
}): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(
    (
      <CatalogDoc
        products={opts.products}
        categories={opts.categories}
        categoryFilter={opts.categoryFilter}
      />
    ) as any
  ) as Promise<Buffer>;
}
