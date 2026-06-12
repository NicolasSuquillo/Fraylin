import { getAllProducts } from "@/lib/products";
import CartSync from "@/components/cart/CartSync";
import CheckoutClient from "./CheckoutClient";

// Precios siempre frescos al momento de pagar (el carrito se reconcilia vía CartSync)
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const products = await getAllProducts();

  return (
    <>
      <CartSync products={products} />
      <CheckoutClient
        payphoneToken={process.env.PAYPHONE_TOKEN ?? ""}
        payphoneStoreId={process.env.PAYPHONE_STORE_ID ?? ""}
      />
    </>
  );
}
