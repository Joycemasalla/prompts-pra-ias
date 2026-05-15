import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Allows the current authenticated user to claim the admin role
 * ONLY if no admin exists yet. Used to bootstrap the first admin.
 */
export const claimAdminIfNone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const { data: existing, error: checkErr } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    if (checkErr) throw new Error(checkErr.message);

    if (existing && existing.length > 0) {
      return { granted: false, reason: "admin_exists" as const };
    }

    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (insErr) throw new Error(insErr.message);
    return { granted: true } as const;
  });
