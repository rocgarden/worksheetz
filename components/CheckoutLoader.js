"use client";

import { useEffect } from "react";
import apiClient from "@/libs/api";
import { useSearchParams } from "next/navigation";

export default function CheckoutLoader() {
  const searchParams = useSearchParams();
  const priceId = searchParams.get("priceId");
  useEffect(() => {
    const startCheckout = async () => {
      try {
        const res = await apiClient.post("/stripe/create-checkout", {
          priceId,
          mode: "subscription",
          successUrl: window.location.origin + "/dashboard",
          cancelUrl: window.location.origin + "/#pricing",
        });
        if (res.url) window.location.href = res.url;
      } catch (e) {
        console.error(e);
      }
    };
    startCheckout();
  }, [priceId]);

  return <p>Redirecting to checkout...</p>;
}
