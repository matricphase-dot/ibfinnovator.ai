import { NextResponse, type NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/auth/require-user-http";
import { z } from "zod";

/**
 * Edit or remove one of your own service listings.
 *
 *   PATCH  /api/marketplace/<id>  { title?, description?, skills?, pricing_note?,
 *                                   availability?, status? }  -> the updated listing
 *   DELETE /api/marketplace/<id>                              -> { deleted: true }
 *
 * Only the provider may act. The RLS policy "provider manages services" already
 * grants owners UPDATE/DELETE, so no new policy is needed — the explicit
 * `provider_id` check in the query is what turns a silent 0-row write into a
 * clear 403.
 */

const patchSchema = z
  .object({
    title: z.string().trim().min(3).max(140).optional(),
    description: z.string().trim().min(30).max(3000).optional(),
    skills: z.array(z.string().trim().min(1)).min(1).max(20).optional(),
    pricing_note: z.string().trim().max(200).nullable().optional(),
    availability: z.string().trim().max(120).nullable().optional(),
    status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to change.",
  });

async function loadOwnService(supabase: any, id: string, userId: string) {
  const { data: service, error } = await supabase
    .from("marketplace_services")
    .select("id,provider_id,title,status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("marketplace_services select failed:", error.message);
    return { error: "Unable to load this listing.", status: 500 as const };
  }
  if (!service) return { error: "Listing not found.", status: 404 as const };
  if (service.provider_id !== userId) {
    return { error: "You can only change your own listings.", status: 403 as const };
  }
  return { service };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
    }

    const payload = patchSchema.parse(await request.json());
    const found = await loadOwnService(supabase, id, user.id);
    if ("error" in found) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }

    const { data, error } = await supabase
      .from("marketplace_services")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("provider_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid listing payload." },
        { status: 400 },
      );
    }
    console.error("marketplace/[id] PATCH failed:", e?.message);
    return NextResponse.json({ error: "Unable to update this listing." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.session;

  try {
    const { id } = await params;
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: "Invalid listing id." }, { status: 400 });
    }

    const found = await loadOwnService(supabase, id, user.id);
    if ("error" in found) {
      return NextResponse.json({ error: found.error }, { status: found.status });
    }

    const { error } = await supabase
      .from("marketplace_services")
      .delete()
      .eq("id", id)
      .eq("provider_id", user.id);

    if (error) throw error;
    return NextResponse.json({ deleted: true, id });
  } catch (e: any) {
    console.error("marketplace/[id] DELETE failed:", e?.message);
    return NextResponse.json({ error: "Unable to delete this listing." }, { status: 500 });
  }
}
