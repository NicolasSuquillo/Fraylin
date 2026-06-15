import { getAllProducts } from "@/lib/products";
import { getPricingSettings, getTransferSettings } from "@/lib/pricing";
import CartSync from "@/components/cart/CartSync";
import CheckoutClient from "./CheckoutClient";

// Precios siempre frescos al momento de pagar (el carrito se reconcilia vía CartSync)
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [products, pricing, transfer] = await Promise.all([
    getAllProducts(),
    getPricingSettings(),
    getTransferSettings(),
  ]);

  return (
    <>
      <CartSync products={products} />
      <CheckoutClient
        payphoneToken={process.env.PAYPHONE_TOKEN ?? ""}
        payphoneStoreId={process.env.PAYPHONE_STORE_ID ?? ""}
        shippingZones={pricing.zones}
        installationCents={pricing.installationCents}
        shippingEnabled={pricing.shippingEnabled}
        installationEnabled={pricing.installationEnabled}
        shippingDescription={pricing.shippingDescription}
        installationDescription={pricing.installationDescription}
        transfer={transfer}
      />
    </>
  );
}
