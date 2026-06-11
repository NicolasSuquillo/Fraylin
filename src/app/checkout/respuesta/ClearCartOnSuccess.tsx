"use client";

import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";

export default function ClearCartOnSuccess() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    sessionStorage.removeItem("fraylin_order");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
