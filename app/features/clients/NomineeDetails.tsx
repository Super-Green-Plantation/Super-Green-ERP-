"use client";

import { useFormContext } from "@/app/context/FormContext";
import { getBranches } from "@/app/services/branches.service";
import { Branch } from "@/app/types/branch";
import { useEffect, useState } from "react";

const NomineeDetails = () => {
  const { form } = useFormContext();
  const { register } = form;

  

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        Nominee Details
      </h2>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label>Full Name</label>
          <input
            type="text"
            {...register("nominee.fullName")}
            placeholder="Full Name"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1">
          <label>Permanent Address</label>
          <input
            type="text"
            {...register("nominee.permanentAddress")}
            placeholder="Permanent Address"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1">
          <label>Postal Address</label>
          <input
            type="text"
            {...register("nominee.postalAddress")}
            placeholder="Postal Address"
            className="p-2.5 border rounded-lg"
          />
        </div>

        
      </form>
    </div>
  );
};

export default NomineeDetails;
