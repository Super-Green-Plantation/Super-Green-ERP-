"use client";

import Back from "@/app/components/Back";
import UpdateDocsModal from "@/app/components/Client/UpdateDocsModal";
import UpdateClientModal from "@/app/components/Client/UpdateModel";
import { DetailItem } from "@/app/components/DetailItem";
import { DocPreview } from "@/app/components/DocPreview";
import Error from "@/app/components/Error";
import Loading from "@/app/components/Loading";
import { useClient } from "@/app/hooks/useClient";
import { deleteClient } from "@/app/services/clients.service";
import { updateClientDocuments } from "@/app/services/documents.service";
import { getPlanDetails } from "@/app/services/plans.service";
import { useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Calendar,
  HeartHandshake,
  Mail,
  MapPin,
  Pen,
  Phone,
  ShieldCheck,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ApplicationViewPage = () => {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [plan, setPlan] = useState<any>();
  const [showUpdateModel, setShowUpdateModel] = useState(false);
  const [showDocUpdateModel, setDocShowUpdateModel] = useState(false);

  const { data: formData, isLoading, isError } = useClient(Number(id));

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

  const handleUpdate = async (updatedFiles: Record<string, string | null>) => {
    if (!updatedFiles) return;

    // Merge the uploaded URLs into your existing applicant data
    const finalFormData = {
      ...formData, // whatever your main form data is
      applicant: {
        ...formData?.applicant,
        idFront: updatedFiles.idFront ?? formData?.applicant.idFront,
        idBack: updatedFiles.idBack ?? formData?.applicant.idBack,
        proposal: updatedFiles.proposal ?? formData?.applicant.proposal,
        agreement: updatedFiles.agreement ?? formData?.applicant.agreement,
      },
    };

    try {
      const res = await fetch(`/api/src/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: finalFormData }),
      });

      if (!res.ok) alert("Failed to upload");

      const data = await res.json();
      console.log("Updated client:", data);

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
    } catch (err) {
      console.error(err);
      alert("Failed to update documents");
    }
  };

  const handelDelete = async (nic: any) => {
    const res = await deleteClient(nic);
    queryClient.invalidateQueries({
      queryKey: ["client", Number(id)],
    });

    if (!res) {
      toast.error("Failed to delete client");
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <Error />;

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
              Ref ID: APP-{formData?.applicant.nic}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
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
                    handelDelete(formData?.applicant.nic);
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
                value={formData?.applicant.fullName}
              />
              <DetailItem label="NIC Number" value={formData?.applicant.nic} />
              <DetailItem
                label="Mobile"
                value={formData?.applicant.phoneMobile}
                icon={<Phone className="w-3 h-3" />}
              />
              <DetailItem
                label="Email"
                value={formData?.applicant.email}
                icon={<Mail className="w-3 h-3" />}
              />
              <DetailItem
                label="Date of Birth"
                value={formData?.applicant.dateOfBirth}
                icon={<Calendar className="w-3 h-3" />}
              />
              <DetailItem
                label="Occupation"
                value={formData?.applicant.occupation}
                icon={<Briefcase className="w-3 h-3" />}
              />
              <div className="md:col-span-2">
                <DetailItem
                  label="Residential Address"
                  value={formData?.applicant.address}
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
              <DetailItem label="Name" value={formData?.beneficiary.fullName} />
              <DetailItem
                label="Relationship"
                value={formData?.beneficiary.relationship}
              />
              <DetailItem
                label="Bank Name"
                value={formData?.beneficiary.bankName}
              />
              <DetailItem
                label="Account Number"
                value={formData?.beneficiary.accountNo}
                isCode
              />
              <DetailItem
                label="Bank Branch"
                value={formData?.beneficiary.bankBranch}
              />
              <DetailItem label="Phone" value={formData?.beneficiary.phone} />
            </div>
          </section>

          {/* Section: Nominee */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <User className="w-5 h-5 text-purple-600" />
              <h2 className="font-bold text-gray-800">Nominee Info</h2>
            </div>
            <div className="p-6 space-y-4">
              <DetailItem label="Name" value={formData?.nominee.fullName} />
              <DetailItem
                label="Permanent Address"
                value={formData?.nominee.permanentAddress}
              />
              <DetailItem
                label="Postal Address"
                value={formData?.nominee.postalAddress}
              />
            </div>
          </section>
        </div>
        {/* Section : Documents */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                Compliance & KYC Documents
              </h2>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">
                Verified
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Documents Grid */}
              <DocPreview
                label="ID Card Front"
                url={formData?.applicant.idFront}
              />
              <DocPreview
                label="ID Card Back"
                url={formData?.applicant.idBack}
              />

              {/* Paperwork Grid */}
              <DocPreview
                label="Proposal Form"
                url={formData?.applicant.proposal}
              />
              <DocPreview
                label="Agreement"
                url={formData?.applicant.agreement}
              />

              {/* Signature (Full width) */}
              <div className="md:col-span-2 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Verified Digital Signature
                </p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200 flex items-center justify-center group hover:bg-white hover:border-blue-300 transition-all cursor-crosshair">
                  <img
                    src={formData?.applicant.signature}
                    alt="Signature"
                    className="max-h-20 object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Refined Action Footer */}
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
            <button
              onClick={() => setDocShowUpdateModel(true)}
              className="group relative flex items-center justify-center gap-3 w-full px-6 py-3.5 
        bg-slate-900 hover:bg-slate-800 text-white rounded-xl
        text-[11px] font-black uppercase tracking-[0.15em] 
        transition-all shadow-xl shadow-slate-200 active:scale-[0.98] active:shadow-none"
            >
              Update Regulatory Documents
            </button>
          </div>
        </section>

        <div className="space-y-3">
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
        </div>
      </div>
      {showUpdateModel ? (
        <UpdateClientModal
          id={Number(id)}
          isOpen={showUpdateModel}
          onClose={() => setShowUpdateModel(false)}
          initialData={formData}
          onUpdate={(updatedData) => handleUpdate(updatedData)}
        />
      ) : null}

      {showDocUpdateModel ? (
        <UpdateDocsModal
          isOpen={showDocUpdateModel}
          onClose={() => setDocShowUpdateModel(false)}
          onSave={async (uploadedUrls) => {
            console.log("Uploaded URLs:", uploadedUrls);

            await updateClientDocuments(Number(id), uploadedUrls);
            queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
            setDocShowUpdateModel(false);
          }}
        />
      ) : null}
    </div>
  );
};

export default ApplicationViewPage;
