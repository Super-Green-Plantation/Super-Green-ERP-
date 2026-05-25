"use client";
import { PrivilegedView } from "@/app/components/Dashboard/PrivilegedView";
import { RestrictedView } from "@/app/components/Dashboard/RestrictedView";
import Error from "@/app/components/Status/Error";
import Loading from "@/app/components/Status/Loading";
import { useDashboard } from "@/app/hooks/useDashboard";
import { useIsMounted } from "@/app/hooks/useIsMounted";

const DashboardPage = () => {
  const { data, isLoading, isError } = useDashboard();
  const isMounted = useIsMounted();

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  if (!data) return null;

  const target = 500000000;
  const achieved = data.investmentSum._sum.amount || 0;
  const percentage = Math.min(Math.round((achieved / target) * 100), 100);

  const userName = data.user?.name || data.user?.member?.nameWithInitials || "Administrator";
  const userRole = data.user?.role || "EMPLOYEE";

  const isPrivileged = ["ADMIN", "HR", "DEV"].includes(userRole);

  if (isPrivileged) {
    return <PrivilegedView data={data} userName={userName} userRole={userRole} achieved={achieved} target={target} percentage={percentage} isMounted={isMounted} />;
  }

  return <RestrictedView data={data} 
  userName={userName} 
  userRole={userRole} 
  achieved={achieved} 
  target={target} 
  percentage={percentage} 
  isMounted={isMounted} 
  memberId={data.user?.member?.id}
  />;
};


export default DashboardPage;
