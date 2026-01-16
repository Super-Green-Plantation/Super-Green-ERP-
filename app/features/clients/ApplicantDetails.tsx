"use client";


import { useFormContext } from "@/app/context/FormContext";

const ApplicantDetails = () => {
  const { form } = useFormContext();
  const { register } = form;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl border border-gray-100 mt-10 pb-15">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Applicant Details</h2>

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 flex flex-col gap-1">
          <label>Full Name</label>
          <input type="text" {...register("applicant.fullName")} placeholder="Enter full name" className="p-2.5 border rounded-lg" />
        </div>
        <div className="flex flex-col gap-1">
          <label>NIC</label>
          <input type="text" {...register("applicant.nic")} placeholder="NIC" className="p-2.5 border rounded-lg" />
        </div>
        <div className="flex flex-col gap-1">
          <label>Driving License</label>
          <input type="text" {...register("applicant.drivingLicense")} placeholder="Driving License" className="p-2.5 border rounded-lg" />
        </div>
        <div className="flex flex-col gap-1">
          <label>Passport No</label>
          <input type="text" {...register("applicant.passportNo")} placeholder="Passport No" className="p-2.5 border rounded-lg" />
        </div>
        <div className="flex flex-col gap-1">
          <label>Email</label>
          <input type="email" {...register("applicant.email")} placeholder="Email" className="p-2.5 border rounded-lg" />
        </div>
        <div className="flex flex-col gap-1">
          <label>Mobile Phone</label>
          <input type="text" {...register("applicant.phoneMobile")} placeholder="Mobile" className="p-2.5 border rounded-lg" />
        </div>
        <div className="flex flex-col gap-1">
          <label>Land Phone</label>
          <input type="text" {...register("applicant.phoneLand")} placeholder="Landline" className="p-2.5 border rounded-lg" />
        </div>
        <div className="flex flex-col gap-1">
          <label>Date of Birth</label>
          <input type="date" {...register("applicant.dateOfBirth")} className="p-2.5 border rounded-lg" />
        </div>
        <div className="flex flex-col gap-1">
          <label>Occupation</label>
          <input type="text" {...register("applicant.occupation")} placeholder="Occupation" className="p-2.5 border rounded-lg" />
        </div>
        <div className="md:col-span-2 flex flex-col gap-1">
          <label>Address</label>
          <input type="text" {...register("applicant.address")} placeholder="Full Address" className="p-2.5 border rounded-lg" />
        </div>
      </form>
    </div>
  );
};

export default ApplicantDetails;
