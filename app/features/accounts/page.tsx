import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AccountsView from "./AccountsView";

const ACCOUNT_ROLES = ["ADMIN", "HR", "DEV", "ACC", "CHAIRMAN"];

export default async function AccountsPage() {
  const user = await getCurrentUser();
  if (!ACCOUNT_ROLES.includes(user.role)) redirect("/features/dashboard");

  return <AccountsView/>;
}
