"use client";

import MemberCard from "@/app/components/Branch/MemberCard";
import { getBranchDetails } from "@/app/services/branches.service";
import { Branch } from "@/app/types/branch";
import { Member } from "@/app/types/member";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";





export default function Page() {
  const params = useParams();
  const id = params.id;
  const [data, setData] = useState<Branch | null>(null);

  const getData = async () => {
    const data: Branch = await getBranchDetails(Number(id));
    setData(data);
    console.log(data);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <div>Branch {data?.name}</div>
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </>
  );
}
