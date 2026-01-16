import React from "react";

const NomineeDetails = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl border border-gray-100 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        Nominee Details
      </h2>
      
      <form action="" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Full Name - Spans full width for emphasis */}
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter nominee's full name"
            className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        {/* Permanent Address */}
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">
            Permanent Address
          </label>
          <input
            type="text"
            placeholder="House No, Street, City"
            className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        {/* Postal Address */}
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">
            Postal Address
          </label>
          <input
            type="text"
            placeholder="Mailing address (if different from permanent)"
            className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

       
      </form>
    </div>
  );
};

export default NomineeDetails;