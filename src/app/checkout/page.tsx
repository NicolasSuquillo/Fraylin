import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <CheckoutClient
      payphoneToken={process.env.PAYPHONE_TOKEN ?? ""}
      payphoneStoreId={process.env.PAYPHONE_STORE_ID ?? ""}
    />
  );
}
