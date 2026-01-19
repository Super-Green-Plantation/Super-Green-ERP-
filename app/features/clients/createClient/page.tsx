"use client";

import { FormProvider } from "@/app/context/FormContext";
import ApplicantDetails from "./ApplicantDetails";
import BeneficiaryDetails from "./BeneficiaryDetails";
import NomineeDetails from "./NomineeDetails";
import { SubmitButton } from "./SubmitButto";

const Page = () => {
  return (
    <FormProvider>
      <div className="min-h-screen py-5 px-4 md:px-8">
        <div className="mx-auto">
          {/* Optional Header */}
          <div className="mb-3">
            <h1 className="text-3xl font-bold text-gray-800">
              Registration Portal
            </h1>
            <p className="text-gray-600">
              Please complete all sections to proceed with your investment.
            </p>
          </div>

          {/* Main Layout Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Primary Details */}
            <div className="flex-1 lg:w-2/3">
              <ApplicantDetails />
              {/*<BranchDetails/>*/}
            </div>

            {/* Right Column: Supporting Details */}
            <div className="flex-1 lg:w-1/3 flex flex-col gap-3">
              <div>
                <BeneficiaryDetails />
              </div>
              <div>
                <NomineeDetails />
              </div>
            </div>
          </div>

          <SubmitButton />
        </div>
      </div>
    </FormProvider>
  );
};

export default Page;
