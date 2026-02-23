import { PrismaClient, Role } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
  //SERVICE_ROLE_KEY have full db access
);

async function main() {
  // 1️⃣ Create auth user
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@company.com",
    password: "Admin@123",
    email_confirm: true,
  });

  if (error) throw error;

  // 2️⃣ Create authorization record
  await prisma.user.upsert({
    where: { id: data.user.id },
    update: {},
    create: {
      id: data.user.id,
      role: Role.ADMIN,
      branchId: null,
    },
  });

  console.log("✅ Admin seeded");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());