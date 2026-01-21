"use client";

import EmpTable from "@/app/components/Employee/EmpTable";
import { getBranchDetails } from "@/app/services/branches.service";
import { log } from "console";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const page = () => {
  const { branchId } = useParams();
  const [branchName, setBranchName] = useState("");
 
  const getBranchName = async () => {
    const branch = await getBranchDetails(Number(branchId));
    setBranchName(branch.name);
  };
  useEffect(() => {
    getBranchName();
  });
  return (
    <div>
      <h2 className="text-xl mb-5">{branchName} Branch</h2>
      <EmpTable />
    </div>
  );
};

export default page;
