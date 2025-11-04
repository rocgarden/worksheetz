// app/Worksheet-Editor/layout.jsx
import { createClient } from "@/libs/supabase/server";
import config from "@/config";
import { redirect } from "next/navigation";
export default async function Layout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("editor user:: ", user);
  if (!user) {
    redirect(config.auth.loginUrl);
  }

  return <>{children}</>;
}
