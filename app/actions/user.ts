"use server";

import { getCurrentUserWithRole } from "@/lib/getCurrentUserWithRole";
import { serializeData } from "@/app/utils/serializers";

export async function getSessionUserAction() {
  try {
    const user = await getCurrentUserWithRole();
    return serializeData(user);
  } catch (error) {
    console.error("Error in getSessionUserAction:", error);
    return null;
  }
}
