// app/(protected)/layout.js
import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import ProtectedGuard from "@/components/ProtectedGuard";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ProtectedLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  return <ProtectedGuard>{children}</ProtectedGuard>;
}
export const metadata = {
  // prevent browser back-forward cache
  robots: {
    index: false,
    follow: false,
  },
};

export function generateStaticParams() {
  // prevent static optimization
  return [];
}
