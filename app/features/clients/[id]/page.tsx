"use client";

import Back from "@/app/components/Back";
import UpdateDocsModal from "@/app/components/Client/UpdateDocsModal";
import UpdateClientModal from "@/app/components/Client/UpdateModel";
import ClientInvestmentTable from "@/app/components/ClientInvestmentTable";
import { DetailItem } from "@/app/components/DetailItem";
import { DocPreview } from "@/app/components/DocPreview";
import ErrorMessage from "@/app/components/Error";
import Loading from "@/app/components/Loading";
import { useClient } from "@/app/hooks/useClient";
import { deleteClient, updateClient, updateClientDocuments } from "@/app/features/clients/actions";

import { getFinancialPlanById } from "@/app/features/financial_plans/actions";
import { useQueryClient } from "@tanstack/react-query";
import { generateClientApplicationPDF } from "@/app/utils/pdfGenerator";
import {
  Briefcase,
  Calendar,
  Download,
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
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Heading from "@/app/components/Heading";
import { ProposalTemplate } from "@/app/components/ProposalTemplate";

export default function ApplicationViewPage() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [plan, setPlan] = useState<any>();
  const [showUpdateModel, setShowUpdateModel] = useState(false);
  const [showDocUpdateModel, setDocShowUpdateModel] = useState(false);
  const router = useRouter();

  const proposalRef = useRef<HTMLDivElement>(null);
  
  const { data: formData, isLoading, isError } = useClient(Number(id));

  console.log("formData", formData);
  

  useEffect(() => {
    if (!formData?.investment.planId) return;
    const fetchPlan = async () => {
      const planId = Number(formData.investment.planId);
      const res = await getFinancialPlanById(planId);
      console.log(res);

      setPlan(res);
    };

    fetchPlan();
  }, [formData]);

  const handleDocsUpdate = async (updatedFiles: Record<string, string | null>) => {
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
      const res = await updateClientDocuments(Number(id), updatedFiles);

      if (!res.success) throw new Error(res.error || "Failed to update");

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
      toast.success("Documents updated successfully");
      setDocShowUpdateModel(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update documents");
    }
  };

  const handleDetailsUpdate = async (updatedPayload: any) => {
    try {
      const res = await updateClient(Number(id), updatedPayload);

      if (!res.success) throw new Error(res.error || "Failed to update");

      toast.success("Client details updated successfully");
      queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update client details");
    }
  };

  const handelDelete = async (nic: any) => {
    const res = await deleteClient(nic);
    queryClient.invalidateQueries({
      queryKey: ["client", Number(id)],
    });

    router.push("/features/clients");
    if (!res) {
      toast.error("Failed to delete client");
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorMessage />;

  return (
    <div className="max-w-7xl mx-auto  space-y-8 min-h-screen">
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div ref={proposalRef}>
           {/* Pass your actual data to your Template component */}
           <ProposalTemplate data={formData} plan={plan} />
        </div>
      </div>
      {/* Header Actions */}
      <div className="sm:flex space-y-3 items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Back />
          <div>

            <Heading>
              Application Details
            </Heading>
            <p className="text-sm text-gray-500 font-medium">
              Ref ID: {formData?.investment.refNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {/* Section: Manage Application */}
          <section className="overflow-hidden w-full">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">

              {/* Update Button */}
              <button
                onClick={() => setShowUpdateModel(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95 border border-white/5"
              >
                <Pen className="w-4 h-4 text-blue-400" />
                <span>Update Details</span>
              </button>

              {/* Download PDF Button */}
              <button
                onClick={() => generateClientApplicationPDF(
                  proposalRef.current, 
                  `Proposal_${formData?.applicant?.fullName?.replace(/\s+/g, '_')}`
                )}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-lg active:scale-95 border border-white/5"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download PDF</span>
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
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-500/20 bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
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
                value={
                  formData?.applicant.phoneMobile
                    ? `+94 ${formData.applicant.phoneMobile}`
                    : "—"
                }
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
              <div className="md:col-span-1">
                <DetailItem
                  label="Land Phone"
                  value={
                    formData?.applicant.phoneLand
                      ? `+94 ${formData.applicant.phoneLand}`
                      : "—"
                  }
                  icon={<Phone className="w-3 h-3" />}
                />
              </div>
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

          {/* Investment Table */}
          <ClientInvestmentTable investments={formData?.investments} />
        </div>

        {/* Right Column: Documents & Investment Plan */}
        <div className="space-y-8">
          {/* Compliance & KYC Documents */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700">
                  Documents
                </h2>
              </div>
            
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                {/* ID Documents Grid */}
                <DocPreview
                  label="ID Card Front"
                  url={formData?.applicant.idFront}
                  id={formData?.applicant.nic}
                  docKey="idFront"
                />
                <DocPreview
                  label="ID Card Back"
                  url={formData?.applicant.idBack}
                  id={formData?.applicant.nic}
                  docKey="idBack"
                />

                {/* Paperwork Grid */}
                <DocPreview
                  label="Proposal Form"
                  url={formData?.applicant.proposal}
                  id={formData?.applicant.nic}
                  docKey="proposal"
                />
                <DocPreview
                  label="Agreement"
                  url={formData?.applicant.agreement}
                  id={formData?.applicant.nic}
                  docKey="agreement"
                />

                {/* Signature */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Verified Digital Signature
                  </p>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200 flex items-center justify-center group hover:bg-white hover:border-blue-300 transition-all cursor-crosshair">
                    <img
                      src={formData?.applicant.signature || null}
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
                Update Documents
              </button>
            </div>
          </section>

          {/* Investment Plan Card */}
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
                  Amount
                </p>
                <p className="text-white font-bold text-base">
                  <span className="text-[10px] text-gray-400 mr-0.5">Rs.</span>
                  {formData?.applicant.investmentAmount || "N/A"}
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
          onUpdate={(updatedData) => handleDetailsUpdate(updatedData)}
        />
      ) : null}

      {showDocUpdateModel ? (
        <UpdateDocsModal
          isOpen={showDocUpdateModel}
          onClose={() => setDocShowUpdateModel(false)}
          onSave={handleDocsUpdate}
        />
      ) : null}
    </div>
  );
}
