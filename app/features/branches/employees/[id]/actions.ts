"use server"

import { prisma } from "@/lib/prisma"; // ඔබේ prisma client path එක නිවැරදිදැයි බලන්න
import { revalidatePath } from "next/cache";

export async function createMember(formData: FormData, branchId: number) {
  // Form එකෙන් දත්ත ලබා ගැනීම
  const name = formData.get("name") as string;
  const positionTitle = formData.get("position") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string;
  const salary = formData.get("salary") as string;

  if (!name || !email || !branchId) {
    return { error: "අවශ්‍ය සියලුම දත්ත ලබා දෙන්න." };
  }

  try {
    // Member සහ Position එකවර නිර්මාණය කිරීම
    await prisma.member.create({
      data: {
        name,
        email,
        phone,
        branch: {
          connect: { id: branchId } // පවතින Branch එකට සම්බන්ධ කරයි
        },
        position: {
          create: {
            title: positionTitle,
            baseSalary: parseFloat(salary) || 0,
          }
        }
      }
    });

    // දත්ත ඇතුළත් කළ පසු පිටුව Refresh කිරීම
    revalidatePath(`/features/branches/employees/${branchId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Database Error:", error);
    
    // Email එක කලින් පද්ධතියේ තිබේ නම් (Unique constraint error)
    if (error.code === 'P2002') {
      return { error: "මෙම Email එක දැනටමත් පද්ධතියේ පවතී." };
    }
    
    return { error: "දත්ත ඇතුළත් කිරීමේදී දෝෂයක් ඇති විය." };
  }
}