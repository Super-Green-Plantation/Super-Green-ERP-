"use client";

import Back from "@/app/components/Back";
import UpdateClientModal from "@/app/components/Client/UpdateModel";
import { deleteClient, getClientDetails } from "@/app/services/clients.service";
import { getPlanDetails } from "@/app/services/plans.service";
import {
  Briefcase,
  Calendar,
  HeartHandshake,
  Mail,
  MapPin,
  Pen,
  Phone,
  Printer,
  ShieldCheck,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

// --- Types ---
export interface FormData {
  applicant: {
    fullName?: string;
    nic?: string;
    drivingLicense?: string;
    passportNo?: string;
    email?: string;
    phoneMobile?: string;
    phoneLand?: string;
    dateOfBirth?: string;
    occupation?: string;
    address?: string;
    branchId?: string;
  };
  investment: { planId?: string };
  beneficiary: {
    fullName?: string;
    nic?: string;
    phone?: string;
    bankName?: string;
    bankBranch?: string;
    accountNo?: string;
    relationship?: string;
  };
  nominee: {
    fullName?: string;
    permanentAddress?: string;
    postalAddress?: string;
  };
}

// Mapper: backend client → FormData
const mapClientToFormData = (client: any): FormData => ({
  applicant: {
    fullName: client.fullName || "",
    nic: client.nic || "",
    drivingLicense: client.drivingLicense || "",
    passportNo: client.passportNo || "",
    email: client.email || "",
    phoneMobile: client.phoneMobile ? `+94 ${client.phoneMobile}` : "",
    phoneLand: client.phoneLand ? `+94 ${client.phoneLand}` : "",
    dateOfBirth: client.dateOfBirth
      ? new Date(client.dateOfBirth).toISOString().split("T")[0]
      : "",
    occupation: client.occupation || "",
    address: client.address || "",
    branchId: client.branch?.name || "", // display branch name
  },
  investment: {
    planId: client.investments?.[0]?.planId?.toString() || "N/A",
  },
  beneficiary: client.beneficiary
    ? {
        fullName: client.beneficiary.fullName || "",
        nic: client.beneficiary.nic || "",
        phone: client.beneficiary.phone || "",
        bankName: client.beneficiary.bankName || "",
        bankBranch: client.beneficiary.bankBranch || "",
        accountNo: client.beneficiary.accountNo || "",
        relationship: client.beneficiary.relationship || "",
      }
    : {},
  nominee: client.nominee
    ? {
        fullName: client.nominee.fullName || "",
        permanentAddress: client.nominee.permanentAddress || "",
        postalAddress: client.nominee.postalAddress || "",
      }
    : {},
});

const ApplicationViewPage = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [plan, setPlan] = useState<any>();
  const [showUpdateModel, setShowUpdateModel] = useState(false);

  useEffect(() => {
    const fetchClientDetails = async () => {
      const client = await getClientDetails(Number(id));

      console.log(client);

      setFormData(mapClientToFormData(client));
    };
    fetchClientDetails();
  }, [id]);

  useEffect(() => {
    if (!formData?.investment.planId) return;
    const fetchPlan = async () => {
      const planId = Number(formData.investment.planId);
      const res = await getPlanDetails(planId);
      console.log(res);

      setPlan(res.res[0]); // API returns array
    };

    fetchPlan();
  }, [formData]);

  if (!formData) return <p className="text-center mt-8">Loading...</p>;

  // --- Helper Component ---
  const DetailItem = ({
    label,
    value,
    icon,
    isCode = false,
  }: {
    label: string;
    value?: string;
    icon?: React.ReactNode;
    isCode?: boolean;
  }) => (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p
        className={`text-sm font-semibold text-gray-700 ${
          isCode
            ? "font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100"
            : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );

  const handleUpdate = async (updatedData: any) => {
    console.log(updatedData);
  };

const handelDelete = async(nic:any)=>{
  
  const res = await deleteClient(nic)
  
}

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 min-h-screen">
      {/* Header Actions */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Back />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Application Details
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Ref ID: APP-99283-2024
            </p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Applicant & Investment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Applicant */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-blue-50/50 border-b border-gray-100 flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-800">Applicant Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <DetailItem
                label="Full Name"
                value={formData.applicant.fullName}
              />
              <DetailItem label="NIC Number" value={formData.applicant.nic} />
              <DetailItem
                label="Mobile"
                value={formData.applicant.phoneMobile}
                icon={<Phone className="w-3 h-3" />}
              />
              <DetailItem
                label="Email"
                value={formData.applicant.email}
                icon={<Mail className="w-3 h-3" />}
              />
              <DetailItem
                label="Date of Birth"
                value={formData.applicant.dateOfBirth}
                icon={<Calendar className="w-3 h-3" />}
              />
              <DetailItem
                label="Occupation"
                value={formData.applicant.occupation}
                icon={<Briefcase className="w-3 h-3" />}
              />
              <div className="md:col-span-2">
                <DetailItem
                  label="Residential Address"
                  value={formData.applicant.address}
                  icon={<MapPin className="w-3 h-3" />}
                />
              </div>
            </div>
          </section>

          {/* Section: Beneficiary */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-green-50/50 border-b border-gray-100 flex items-center gap-3">
              <HeartHandshake className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-gray-800">
                Beneficiary Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <DetailItem label="Name" value={formData.beneficiary.fullName} />
              <DetailItem
                label="Relationship"
                value={formData.beneficiary.relationship}
              />
              <DetailItem
                label="Bank Name"
                value={formData.beneficiary.bankName}
              />
              <DetailItem
                label="Account Number"
                value={formData.beneficiary.accountNo}
                isCode
              />
              <DetailItem
                label="Bank Branch"
                value={formData.beneficiary.bankBranch}
              />
              <DetailItem label="Phone" value={formData.beneficiary.phone} />
            </div>
          </section>
        </div>

        {/* Right Column: Investment & Nominee */}
        <div className="space-y-8">
          {/* Section: Investment Plan */}
          <section className="bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden border border-white/10">
            {/* Background Decoration */}
            <TrendingUp className="absolute -right-4 -top-4 w-32 h-32 text-white/5 rotate-12" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                  Investment Plan
                </h2>
              </div>
              <span className="px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-tight">
                Active Plan
              </span>
            </div>

            {/* Main Content */}
            <div className="space-y-1">
              <h3 className="text-3xl font-black tracking-tight bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {plan?.name || "N/A"}
              </h3>
              <p className="text-sm text-gray-400 font-medium">
                Selected Financial Product
              </p>
            </div>

            {/* Stats Divider */}
            <div className="my-6 border-t border-white/5" />

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                  Rate
                </p>
                <p className="text-green-400 font-bold text-base">
                  {plan?.rate}%
                </p>
              </div>

              <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                  Investment
                </p>
                <p className="text-white font-bold text-base">
                  <span className="text-[10px] text-gray-400 mr-0.5">Rs.</span>
                  {plan?.investment?.toLocaleString() || "N/A"}
                </p>
              </div>

              <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                  Period
                </p>
                <p className="text-blue-400 font-bold text-base">
                  {plan?.duration || "N/A"}{" "}
                  <span className="text-[10px] font-normal">mo</span>
                </p>
              </div>
            </div>
          </section>

          {/* Section: Nominee */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <User className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-800">Nominee Info</h2>
            </div>
            <div className="p-6 space-y-4">
              <DetailItem label="Name" value={formData.nominee.fullName} />
              <DetailItem
                label="Permanent Address"
                value={formData.nominee.permanentAddress}
              />
              <DetailItem
                label="Postal Address"
                value={formData.nominee.postalAddress}
              />
            </div>
          </section>

          {/* Section: Manage Application */}
          <section className="overflow-hidden">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Update Button */}
              <button
                onClick={() => setShowUpdateModel(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200 active:scale-95"
              >
                <Pen className="w-4 h-4" />
                Update Details
              </button>

              {/* Delete Button */}
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to delete this application? This action cannot be undone.",
                    )
                  ) {
                    handelDelete(formData.applicant.nic)
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </section>
        </div>
      </div>
      {showUpdateModel ? (
        <UpdateClientModal
          isOpen={showUpdateModel}
          onClose={() => setShowUpdateModel(false)}
          initialData={formData}
          onUpdate={(updatedData) => handleUpdate(updatedData)}
        />
      ) : null}
    </div>
  );
};

export default ApplicationViewPage;
