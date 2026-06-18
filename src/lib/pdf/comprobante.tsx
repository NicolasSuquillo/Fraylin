import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Order } from "@/types";
import { BUSINESS } from "@/lib/constants";
import { formatUSD } from "@/lib/money";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

Font.register({ family: "Playfair", src: `${BASE}/fonts/PlayfairDisplay-Bold.woff`, fontWeight: 700 });
Font.register({
  family: "Inter",
  fonts: [
    { src: `${BASE}/fonts/Inter-Regular.woff`, fontWeight: 400 },
    { src: `${BASE}/fonts/Inter-Bold.woff`,    fontWeight: 700 },
  ],
});

const GOLD      = "#C9A84C";
const GOLD_DARK = "#A07830";
const CREAM     = "#FAF7F2";
const TEXT      = "#1C1C1C";
const TEXT_SEC  = "#4A4540";
const BORDER    = "#E8E3DB";

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontWeight: 400, fontSize: 9, color: TEXT, backgroundColor: "#fff", paddingTop: 40, paddingBottom: 40, paddingHorizontal: 44 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  companyName: { fontFamily: "Playfair", fontWeight: 700, fontSize: 20, color: GOLD_DARK, marginBottom: 3 },
  companyDetail: { fontSize: 8, color: TEXT_SEC, marginBottom: 1 },
  docTitle: { fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4, textAlign: "right" },
  docMeta: { fontSize: 8, color: TEXT_SEC, textAlign: "right", marginBottom: 2 },
  paidBadge: { marginTop: 5, borderWidth: 1, borderColor: "#10B981", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-end" },
  paidText: { fontSize: 7, fontWeight: 700, color: "#059669" },
  dividerGold: { borderBottomWidth: 2, borderBottomColor: GOLD, marginVertical: 10 },
  dividerLight: { borderBottomWidth: 0.5, borderBottomColor: BORDER, marginVertical: 8 },
  sectionLabel: { fontSize: 7, fontWeight: 700, color: TEXT_SEC, marginBottom: 5 },
  customerGrid: { flexDirection: "row", gap: 16, marginBottom: 4 },
  customerField: { flex: 1 },
  customerLabel: { fontSize: 7, color: TEXT_SEC, marginBottom: 1 },
  customerValue: { fontSize: 9, color: TEXT },
  tableHeader: { flexDirection: "row", backgroundColor: CREAM, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 2, marginBottom: 2 },
  tableRow: { flexDirection: "row", paddingHorizontal: 8, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#F0EBE3" },
  tableRowAlt: { backgroundColor: "#FAFAFA" },
  thText: { fontSize: 7, fontWeight: 700, color: TEXT_SEC },
  colProduct: { flex: 1 },
  colQty: { width: 36, textAlign: "center" },
  colUnit: { width: 64, textAlign: "right" },
  colTotal: { width: 64, textAlign: "right" },
  totalsWrap: { alignItems: "flex-end", marginTop: 10 },
  totalRow: { flexDirection: "row", minWidth: 210, marginBottom: 2 },
  totalLabel: { flex: 1, fontSize: 8, color: TEXT_SEC, textAlign: "right", marginRight: 12 },
  totalValue: { fontSize: 8, color: TEXT, width: 64, textAlign: "right" },
  grandRow: { flexDirection: "row", minWidth: 210, marginTop: 5, paddingTop: 5, borderTopWidth: 1.5, borderTopColor: GOLD },
  grandLabel: { flex: 1, fontSize: 10, fontWeight: 700, color: TEXT, textAlign: "right", marginRight: 12 },
  grandValue: { fontSize: 10, fontWeight: 700, color: GOLD_DARK, width: 64, textAlign: "right" },
  footer: { marginTop: 22, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: BORDER, alignItems: "center" },
  footerNote: { fontSize: 7, color: TEXT_SEC, textAlign: "center", marginBottom: 3 },
  footerContact: { fontSize: 7, color: GOLD_DARK, textAlign: "center" },
});

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function payLabel(method: string) {
  return method === "transferencia" ? "Transferencia / Deuna" : "Tarjeta (Payphone)";
}

function ComprobanteDoc({ order, showRuc }: { order: Order; showRuc: boolean }) {
  const items = order.items ?? [];
  return (
    <Document title={`Comprobante ${order.clientTransactionId}`} author="Fraylin" creator="Fraylin">
      <Page size="A4" style={s.page}>

        {/* ── Encabezado ── */}
        <View style={s.headerRow}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={s.companyName}>{BUSINESS.name}</Text>
            <Text style={s.companyDetail}>{BUSINESS.tagline}</Text>
            {showRuc && <Text style={s.companyDetail}>RUC: {BUSINESS.ruc}</Text>}
            <Text style={s.companyDetail}>{BUSINESS.address}</Text>
            <Text style={s.companyDetail}>{BUSINESS.phones[0]}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.docTitle}>COMPROBANTE DE COMPRA</Text>
            <Text style={s.docMeta}>N.° {order.clientTransactionId}</Text>
            <Text style={s.docMeta}>Fecha: {fmtDate(order.createdAt)}</Text>
            <Text style={s.docMeta}>Método: {payLabel(order.paymentMethod)}</Text>
            <View style={s.paidBadge}>
              <Text style={s.paidText}>PAGADO</Text>
            </View>
          </View>
        </View>

        <View style={s.dividerGold} />

        {/* ── Cliente ── */}
        <Text style={s.sectionLabel}>DATOS DEL CLIENTE</Text>
        <View style={s.customerGrid}>
          <View style={s.customerField}>
            <Text style={s.customerLabel}>Nombre</Text>
            <Text style={s.customerValue}>{order.customerName}</Text>
          </View>
          <View style={s.customerField}>
            <Text style={s.customerLabel}>Teléfono</Text>
            <Text style={s.customerValue}>{order.customerPhone}</Text>
          </View>
        </View>
        <View style={s.customerGrid}>
          <View style={s.customerField}>
            <Text style={s.customerLabel}>Email</Text>
            <Text style={s.customerValue}>{order.customerEmail}</Text>
          </View>
          <View style={s.customerField}>
            <Text style={s.customerLabel}>Dirección</Text>
            <Text style={s.customerValue}>{order.customerAddress}</Text>
          </View>
        </View>

        <View style={s.dividerLight} />

        {/* ── Productos ── */}
        <Text style={[s.sectionLabel, { marginTop: 4 }]}>DETALLE DEL PEDIDO</Text>
        <View style={s.tableHeader}>
          <Text style={[s.thText, s.colProduct]}>Producto</Text>
          <Text style={[s.thText, s.colQty]}>Cant.</Text>
          <Text style={[s.thText, s.colUnit]}>P. unitario</Text>
          <Text style={[s.thText, s.colTotal]}>Total</Text>
        </View>
        {items.map((item, i) => (
          <View key={item.id} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
            <Text style={[{ fontSize: 9, color: TEXT }, s.colProduct]}>{item.productName}</Text>
            <Text style={[{ fontSize: 9, color: TEXT_SEC }, s.colQty]}>{item.quantity}</Text>
            <Text style={[{ fontSize: 9, color: TEXT_SEC }, s.colUnit]}>{formatUSD(item.unitPriceCents)}</Text>
            <Text style={[{ fontSize: 9, fontWeight: 700, color: TEXT }, s.colTotal]}>{formatUSD(item.lineTotalCents)}</Text>
          </View>
        ))}

        {/* ── Totales ── */}
        <View style={s.totalsWrap}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal (sin IVA):</Text>
            <Text style={s.totalValue}>{formatUSD(order.subtotalCents)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>IVA 15%:</Text>
            <Text style={s.totalValue}>{formatUSD(order.taxCents)}</Text>
          </View>
          {order.shippingCents > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>
                Envío{order.shippingZoneLabel ? ` (${order.shippingZoneLabel})` : ""}:
              </Text>
              <Text style={s.totalValue}>{formatUSD(order.shippingCents)}</Text>
            </View>
          )}
          {order.installationCents > 0 && (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Instalación:</Text>
              <Text style={s.totalValue}>{formatUSD(order.installationCents)}</Text>
            </View>
          )}
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>TOTAL PAGADO:</Text>
            <Text style={s.grandValue}>{formatUSD(order.totalCents)}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerNote}>
            Este documento es un comprobante de compra interno y no tiene validez tributaria como factura SRI.
          </Text>
          <Text style={s.footerContact}>
            {BUSINESS.name} · {BUSINESS.phones[0]} · @fraylin.acabados
          </Text>
        </View>

      </Page>
    </Document>
  );
}

export async function buildComprobanteBuffer(
  order: Order,
  opts: { showRuc: boolean }
): Promise<Buffer> {
  const { renderToBuffer } = await import("@react-pdf/renderer");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return renderToBuffer(<ComprobanteDoc order={order} showRuc={opts.showRuc} /> as any) as Promise<Buffer>;
}
