import { getCurrentUser } from "@/lib/auth";
import EmployeeDetailsPage from "../branches/employees/[branchId]/[empId]/page";

export default async function Profile() {
  const user = await getCurrentUser();
  const member = user?.member;

  if (!user) return <div className="text-white font-bold p-8">Access Denied.</div>;

  return (
    <>
      {member?.id && <EmployeeDetailsPage empId={member.id} readOnly={true} />}
    </>
  );
}
