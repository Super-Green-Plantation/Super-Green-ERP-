"use client";

import { useFormContext } from "@/app/context/FormContext";

const BeneficiaryDetails = () => {
  const { form } = useFormContext();
  const { register } = form;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        Beneficiary Details
      </h2>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label>Full Name</label>
          <input
            type="text"
            {...register("beneficiary.fullName")}
            placeholder="Full Name"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>NIC</label>
          <input
            type="text"
            {...register("beneficiary.nic")}
            placeholder="NIC"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Phone</label>
          <input
            type="text"
            {...register("beneficiary.phone")}
            placeholder="Phone Number"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Bank Name</label>
          <input
            type="text"
            {...register("beneficiary.bankName")}
            placeholder="Bank Name"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Bank Branch</label>
          <input
            type="text"
            {...register("beneficiary.bankBranch")}
            placeholder="Branch"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Account No</label>
          <input
            type="text"
            {...register("beneficiary.accountNo")}
            placeholder="A/C No"
            className="p-2.5 border rounded-lg"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label>Relationship</label>
          <input
            type="text"
            {...register("beneficiary.relationship")}
            placeholder="Relationship"
            className="p-2.5 border rounded-lg"
          />
        </div>
      </form>
    </div>
  );
};

export default BeneficiaryDetails;
