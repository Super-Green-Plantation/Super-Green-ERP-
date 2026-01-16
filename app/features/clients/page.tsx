import React from "react";
import ApplicantDetails from "./ApplicantDetails";
import BeneficiaryDetails from "./BeneficiaryDetails";
import NomineeDetails from "./NomineeDetails";

const Page = () => {
  return (
    <div className="min-h-screen py-10 px-4 md:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Optional Header */}
        <div className="mb-3">
          <h1 className="text-3xl font-bold text-gray-800">
            Registration Portal
          </h1>
          <p className="text-gray-600">
            Please complete all sections to proceed with investment.
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Primary Details */}
          <div className="flex-1 lg:w-2/3">
            <ApplicantDetails />
          </div>

          {/* Right Column: Supporting Details */}
          <div className="flex-1 lg:w-1/3 flex flex-col gap-3">
            <div>
              <NomineeDetails />
            </div>
            <div>
              <BeneficiaryDetails />
            </div>
          </div>
        </div>

        {/* Final Submission Card - Now Full Width Below Columns */}
        <div className="mt-10 w-full p-6 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
          <h3 className="text-blue-800 font-bold mb-2">Final Step</h3>
          <p className="text-sm text-blue-700 mb-4">
            By clicking submit, you confirm that all nominee and beneficiary
            information is correct.
          </p>
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition-transform active:scale-95">
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;