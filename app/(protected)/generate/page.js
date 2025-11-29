//app/(protected)/generate/page.js
import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import GenerateClient from "./GenerateClient"; // 👈  new client component

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function GeneratePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signin");

  return <GenerateClient user={user} />;
}
