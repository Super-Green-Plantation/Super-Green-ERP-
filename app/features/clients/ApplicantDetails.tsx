import React from "react";

const ApplicantDetails = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-xl border border-gray-100 mt-10 pb-15">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Applicant Details</h2>
      
      <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name - Spans 2 columns */}
        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Full Name</label>
          <input type="text" placeholder="Enter full name" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
        </div>

        {/* Identity Row */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">NIC</label>
          <input type="text" placeholder="Identity Card No" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Driving Lic No</label>
          <input type="text" placeholder="License Number" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        {/* Contact Row */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Passport No</label>
          <input type="text" placeholder="Passport Number" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Email Address</label>
          <input type="email" placeholder="email@example.com" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Postal Address</label>
          <input type="text" placeholder="Full residential address" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Phone (Land)</label>
          <input type="text" placeholder="011 2XXX XXX" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Phone (Mobile)</label>
          <input type="text" placeholder="07X XXX XXXX" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Date of Birth</label>
          <input type="date" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Occupation</label>
          <input type="text" placeholder="Your profession" className="p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        {/* Investment Details */}
        <div className="md:col-span-2 mt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Investment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Date of Investment</label>
                    <input type="date" className="p-2.5 border rounded-lg" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Amount</label>
                    <input type="text" placeholder="0.00" className="p-2.5 border rounded-lg" />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Rate (%)</label>
                    <input type="text" placeholder="%" className="p-2.5 border rounded-lg" />
                </div>
            </div>
        </div>

        {/* Checkboxes */}
        <div className="md:col-span-2 p-4 rounded-lg">
          <p className="font-semibold text-gray-700 mb-3">Return Benefits</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Monthly</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Half Yearly</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Yearly</span>
            </label>
          </div>
        </div>

       
      </form>
    </div>
  );
};

export default ApplicantDetails;