import { prisma } from "./prisma";
import { createClient } from "./supabase/server";

export async function getCurrentUserWithRole() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  return prisma.user.findUnique({
    where: { email: user.email! },include:{member:true}
  });
}