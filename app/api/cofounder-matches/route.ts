import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
const norm = (x: string) => x.trim().toLowerCase();
const overlap = (a: string[] = [], b: string[] = []) => {
  const A = new Set(a.map(norm)),
    B = new Set(b.map(norm));
  return B.size ? [...B].filter((x) => A.has(x)).length / B.size : 0;
};
export async function GET() {
  try {
    const { supabase, user } = await requireUser();
    const { data: mine } = await supabase
      .from("cofounder_profiles")
      .select(
        "*,user:profiles!user_id(id,name,bio,skills,interests,availability,avatar_url)",
      )
      .eq("user_id", user.id)
      .single();
    if (!mine?.enabled)
      return NextResponse.json(
        { error: "Enable co-founder mode and complete the questionnaire." },
        { status: 400 },
      );
    const { data, error } = await supabase
      .from("cofounder_profiles")
      .select(
        "*,user:profiles!user_id(id,name,bio,skills,interests,availability,avatar_url)",
      )
      .eq("enabled", true)
      .neq("user_id", user.id);
    if (error) throw error;
    const matches = (data || [])
      .map((x: any) => {
        const values = overlap(mine.values, x.values),
          vision = overlap(mine.user.interests, x.user.interests),
          commitment = mine.commitment_level === x.commitment_level ? 1 : 0.5,
          skills = 1 - overlap(mine.user.skills, x.user.skills);
        const score = Math.round(
          values * 40 + vision * 30 + commitment * 20 + skills * 10,
        );
        return {
          ...x,
          match: {
            score,
            breakdown: {
              values: Math.round(values * 40),
              vision: Math.round(vision * 30),
              commitment: Math.round(commitment * 20),
              complementarySkills: Math.round(skills * 10),
            },
            reason:
              [
                values > 0.4 ? "shared values" : null,
                vision > 0.4 ? "aligned domains" : null,
                commitment === 1 ? "matching commitment" : null,
              ]
                .filter(Boolean)
                .join(" · ") || "Potential complementary fit",
          },
        };
      })
      .sort((a: any, b: any) => b.match.score - a.match.score);
    return NextResponse.json({ matches });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "UNAUTHORIZED" ? 401 : 500 },
    );
  }
}
