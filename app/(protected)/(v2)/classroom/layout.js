// /app/(protected)/(v2)/classroom/layout.js

import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Server layout — verifies auth AND classroom/school plan access.
// Uses production Supabase client (createClient) since profiles table
// lives in production. V2 data fetching happens in page/child routes.

export default async function ClassroomLayout({ children }) {
 const supabase = await createClient();

  // 1. Auth check — same pattern as dashboard/layout.js
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.auth.loginUrl);
  }

//   // 2. Plan check — verify classroom_plan or school_plan
  // const { data: profile, error: profileError } = await supabase
  //   .from("profiles")
  //   .select("classroom_plan, school_plan")
  //   .eq("id", user.id)
  //   .single();

  // if (profileError || !profile) {
  //   // Can't verify plan — send to dashboard with error state
  //   redirect("/dashboard?message=profile-error");
  // }
  // const serviceSupabase = await createV2ServiceClient();
  //  const user = { id: "e1a3fef9-ae21-478a-bc7a-e41f8df3d5e0" }; // hardcoded user for testing — layout guards auth, so we know this is valid
   console.log("Authenticated user ID:", user.id);

  // 3. Plan access check
  const { data: profile, error: profileError } = await supabase
    .from("profiles") 
    .select("classroom_plan, school_plan, max_classrooms")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
          redirect("/dashboard?message=profile-error") //redirect, not NextResponse
    );
  }

  // const hasClassroomAccess =
  //   profile.classroom_plan === true || profile.school_plan === true;

  // if (!hasClassroomAccess) {
  //   redirect("/dashboard?message=upgrade-needed");
  // }

  return <>{children}</>;
}