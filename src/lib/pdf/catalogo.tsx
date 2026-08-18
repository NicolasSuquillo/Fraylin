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
  section: { marginBottom: 6 },
  sectionTitle: {
    fontFamily: "Playfair",
    fontWeight: 700,
    fontSize: 16,
    color: GOLD_DARK,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingBottom: 4,
    marginBottom: 10,
    marginTop: 8,
  },
  row: { flexDirection: "row", gap: 14, marginBottom: 14 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  cardSpacer: { flex: 1 },
  cardImage: { width: "100%", height: 168, objectFit: "cover" },
  imagePlaceholder: {
    width: "100%",
    height: 168,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutTag: {
    position: "absolute",
    top: 8,
    left: 8,
    fontSize: 6.5,
    color: "#fff",
    backgroundColor: "#B42318",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 3,
  },
  cardBody: { padding: 10 },
  productName: {
    fontSize: 11.5,
    fontWeight: 700,
    color: TEXT,
    marginBottom: 6,
    lineHeight: 1.25,
  },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  priceLabel: {
    fontSize: 6.5,
    color: TEXT_SEC,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 1,
  },
  priceValue: { fontSize: 14, fontWeight: 700, color: GOLD_DARK },
  priceValueAlt: { fontSize: 9.5, color: TEXT_SEC },
  divider: {
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    marginTop: 8,
    marginBottom: 7,
  },
  productDesc: { fontSize: 8, color: TEXT_SEC, lineHeight: 1.45 },
  specs: {
    fontSize: 7.5,
    color: TEXT_SEC,
    lineHeight: 1.4,
    backgroundColor: CREAM,
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 5,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  badge: {
    fontSize: 6.5,
    color: GOLD_DARK,
    backgroundColor: CREAM,
    borderWidth: 0.5,
    borderColor: BORDER,
    paddingHorizontal: 5,
    paddingVertical: 3,
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

function pairs(items: Product[]): Product[][] {
  const out: Product[][] = [];
  for (let i = 0; i < items.length; i += 2) out.push(items.slice(i, i + 2));
  return out;
}

function ProductCard({ product }: { product: Product }) {
  const img = absoluteImageSrc(product.images[0]?.src);
  const transfer = product.transferPriceCents;
  const card = product.priceCents;

  return (
    <View style={s.card}>
      {img ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image
        <Image src={img} style={s.cardImage} />
      ) : (
        <View style={s.imagePlaceholder}>
          <Text style={{ fontSize: 8, color: TEXT_SEC }}>Sin foto</Text>
        </View>
      )}
      {product.stock === 0 ? (
        <Text style={s.soldOutTag}>AGOTADO</Text>
      ) : null}

      <View style={s.cardBody}>
        <Text style={s.productName}>{product.name}</Text>

        <View style={s.priceRow}>
          {transfer != null ? (
            <View>
              <Text style={s.priceLabel}>Transferencia / Deuna</Text>
              <Text style={s.priceValue}>{formatUSD(transfer)}</Text>
            </View>
          ) : null}
          {card != null ? (
            <View>
              <Text style={s.priceLabel}>Tarjeta</Text>
              <Text style={s.priceValueAlt}>{formatUSD(card)}</Text>
            </View>
          ) : null}
          {transfer == null && card == null ? (
            <Text style={s.priceLabel}>Precio a consultar</Text>
          ) : null}
        </View>

        {product.description || product.specs ? (
          <View style={s.divider} />
        ) : null}

        {product.description ? (
          <Text style={s.productDesc}>{product.description}</Text>
        ) : null}
        {product.specs ? <Text style={s.specs}>{product.specs}</Text> : null}

        {product.freeShipping || product.freeInstallation ? (
          <View style={s.badgeRow}>
            {product.freeShipping ? (
              <Text style={s.badge}>Envío gratis</Text>
            ) : null}
            {product.freeInstallation ? (
              <Text style={s.badge}>Instalación gratis</Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
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

      <Page size="A4" style={s.page} wrap>
        {orderedSlugs.map((slug) => {
          const items = byCategory.get(slug) ?? [];
          return (
            <View key={slug} style={s.section}>
              <Text style={s.sectionTitle} minPresenceAhead={220}>
                {labelFor(slug)}
              </Text>
              {pairs(items).map((pair, i) => (
                <View key={`${slug}-${i}`} style={s.row} wrap={false}>
                  {pair.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                  {pair.length === 1 ? <View style={s.cardSpacer} /> : null}
                </View>
              ))}
            </View>
          );
        })}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{BUSINESS.name} · Catálogo</Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function buildCatalogoBuffer(opts: {
  products: Product[];
  categories: Category[];
  categoryFilter?: string;
}): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  const doc = (
    <CatalogDoc
      products={opts.products}
      categories={opts.categories}
      categoryFilter={opts.categoryFilter}
    />
  ) as Parameters<typeof renderToBuffer>[0];
  return renderToBuffer(doc) as Promise<Buffer>;
}
