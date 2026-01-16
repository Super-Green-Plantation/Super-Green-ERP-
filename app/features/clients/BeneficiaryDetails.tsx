import React from "react";

const BeneficiaryDetails = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        Beneficiary Details
      </h2>
      
      <form action="" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Name - Spans full width */}
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter beneficiary name"
            className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        {/* Identity & Contact */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">
            NIC / ID Number
          </label>
          <input
            type="text"
            placeholder="NIC"
            className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">
            Phone Number
          </label>
          <input
            type="text"
            placeholder="07X XXX XXXX"
            className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Banking Section */}
        <div className="md:col-span-2 mt-2">
          <h3 className="text-sm font-bold uppercase text-blue-600 tracking-wider mb-2">
            Banking Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">
                Bank Account Number
              </label>
              <input
                type="text"
                placeholder="A/C Number"
                className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">
                Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. Bank of Ceylon"
                className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">
            Branch
          </label>
          <input
            type="text"
            placeholder="Branch name"
            className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">
            Relationship
          </label>
          <input
            type="text"
            placeholder="e.g. Spouse, Child, Parent"
            className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        
      </form>
    </div>
  );
};

export default BeneficiaryDetails;