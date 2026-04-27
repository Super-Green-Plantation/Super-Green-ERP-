"use client";

import Back from "@/app/components/Buttons/Back";
import UpdateDocsModal from "@/app/components/Client/UpdateDocsModal";
import UpdateClientModal from "@/app/components/Client/UpdateModel";
import { DetailItem } from "@/app/components/DetailItem";
import ErrorMessage from "@/app/components/Status/Error";
import Loading from "@/app/components/Status/Loading";
import ClientInvestmentTable from "@/app/components/Tables/ClientInvestmentTable";
import { deleteClient, generateUploadUrl, updateClient, updateClientDocuments } from "@/app/features/clients/actions";
import { useClient } from "@/app/hooks/useClient";

import SendDocumentLinkButton from "@/app/components/Buttons/SendDocumentLinkButton";
import UpdateBeneficiary from "@/app/components/Client/UpdateBeneficiary";
import UpdateNominee from "@/app/components/Client/UpdateNominee";
import { DocPreview } from "@/app/components/Doc/DocPreview";
import { ProposalTemplate } from "@/app/components/Doc/ProposalTemplate";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { getFinancialPlanById } from "@/app/features/financial_plans/actions";
import { generateClientApplicationPDF } from "@/app/pdf/ClientApplication";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  Download,
  HeartHandshake,
  Mail,
  MapPin,
  Pen,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  User
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import UpdateInvestmentDocsModal from "@/app/components/Client/UpdateInvestmentDocsModal";
import { updateInvestmentDocuments } from "../../investments/actions";

export default function ApplicationViewPage() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [plan, setPlan] = useState<any>();
  const [showUpdateModel, setShowUpdateModel] = useState(false);
  const [showDocUpdateModel, setDocShowUpdateModel] = useState(false);
  const router = useRouter();

  const proposalRef = useRef<HTMLDivElement>(null);

  const { data: formData, isLoading, isError } = useClient(Number(id));

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [updateBeneficiary, setUpdateBeneficiary] = useState(false);
  const [selectBeneficiary, setSelectBeneficiary] = useState<any>(null);
  const [updateNominee, setUpdateNominee] = useState(false);
  const [selectNominee, setSelectNominee] = useState<any>(null);

  console.log("investments : ", formData?.investments);


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

  const getUrl = async () => {
    try {
      const res = await generateUploadUrl(Number(id));
      console.log(res);
    } catch (error) {
      console.log(error);

    }
  }

  useEffect(() => {
    getUrl();
  }, [])

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

  const handleDeleteConfirm = async () => {
    const res = await deleteClient(Number(id));
    if (!res) {
      toast.error("Failed to delete client");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
    router.push("/features/clients");
  };

  const [docsModal, setDocsModal] = useState<{
    open: boolean;
    investmentId: number;
    investmentRef: string;
    currentDocs: { proposal?: string | null; agreement?: string | null; paymentSlip?: string | null };
  }>({ open: false, investmentId: 0, investmentRef: "", currentDocs: {} });

  const handleSaveInvestmentDocs = async (files: Record<string, string | null>) => {
    // only send keys that actually have a new upload
    const updates = Object.fromEntries(
      Object.entries(files).filter(([, v]) => v !== null)
    );
    if (!Object.keys(updates).length) return;

    await updateInvestmentDocuments(docsModal.investmentId, updates); // your server action
    queryClient.invalidateQueries({ queryKey: ["client", Number(id)] }); // refresh client data
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorMessage />;

  console.log(formData);
  

  return (
    <div className="max-w-7xl mx-auto space-y-10 min-h-screen p-4 md:p-8 pb-24">
      {/* Hidden Proposal Template for PDF Generation */}
      <div className="hidden">
        <div ref={proposalRef}>
          <ProposalTemplate data={formData} />
        </div>
      </div>

      {/* 1. HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-8">
        <div className="flex items-center gap-5">
          <Back />
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {formData?.applicant?.fullName || "Application Profile"}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData?.investment?.refNumber?.map((ref: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-600 font-mono text-xs font-bold rounded border border-blue-100">
                  {ref}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowUpdateModel(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            <Pen className="w-4 h-4" />
            Update Profile
          </button>
          <button
            onClick={() => generateClientApplicationPDF(proposalRef.current, `Proposal_${formData?.applicant?.fullName?.replace(/\s+/g, '_')}`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </header>

      {/* 2. FINANCIAL HERO SECTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Active Investment Summary</h3>
        </div>
        <div className="flex flex-wrap gap-6">
          {formData?.investments.map((inv: any, index: number) => {
            const totalHarvest = parseFloat(inv.totalHarvest) || 0;
            const monthlyHarvest = parseFloat(inv.monthlyHarvest) || 0;
            const principal = parseFloat(inv.amount) || 0;
            const totalReturn = totalHarvest + principal;

            return (
              <div
                key={inv.id || index}
                className="flex-1 min-w-85 max-w-105 bg-[#0f172a] rounded-[2rem] p-8 text-white shadow-2xl border border-slate-800 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/10 transition-colors" />

                <div className="flex justify-between items-center mb-8 relative">
                  <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <Banknote className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-1">Ref: {inv.refNumber}</span>
                    <span className="bg-blue-500 text-white text-[13px] py-1 px-3 rounded-full uppercase tracking-tighter">Rs. {(inv.amount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 relative">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Monthly</p>
                    <p className="font-bold text-xl leading-none">
                      <span className="text-slate-500 text-xs mr-1">LKR</span>
                      {monthlyHarvest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-right border-l border-slate-800 pl-4">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Harvest</p>
                    <p className="font-bold text-xl leading-none">
                      <span className="text-slate-500 text-xs mr-1">LKR</span>
                      {totalHarvest.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 relative">
                  <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Projected Maturity Return</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-500 text-lg font-bold">LKR</span>
                    <span className="text-4xl font-black tracking-tighter">
                      {totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="pt-5 mt-5 border-t border-slate-800 flex items-center justify-between gap-3 relative">
                  <div className="flex gap-2 flex-wrap">
                    {(["proposal", "agreement", "paymentSlip"] as const).map(key => {
                      const labels = { proposal: "Proposal", agreement: "Agreement", paymentSlip: "Slip" };
                      const present = !!inv[key];
                      return (
                        <span
                          key={key}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${present
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-800 text-slate-500 border-slate-700"
                            }`}
                        >
                          {present ? (
                            <CheckCircle2 size={9} />
                          ) : (
                            <span className="w-2 h-2 rounded-full border border-slate-600 inline-block" />
                          )}
                          {labels[key]}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setDocsModal({ open: true, investmentId: inv.id, investmentRef: inv.refNumber, currentDocs: { proposal: inv.proposal, agreement: inv.agreement, paymentSlip: inv.paymentSlip } })}
                    className="shrink-0 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
                  >
                    Docs
                  </button>
                </div>
              </div>

            );
          })}

        </div>
      </section>

      {/* 3. MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* LEFT COLUMN: PRIMARY INFO */}
        <div className="lg:col-span-8 space-y-10">

          {/* Applicant Info */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
              <User className="w-5 h-5 text-slate-900" />
              <h2 className="text-[11px] font-black uppercase tracking-widest">Personal Identification</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <DetailItem label="Full Name" value={formData?.applicant.fullName} />
              <DetailItem label="NIC Number" value={formData?.applicant.nic} />
              <DetailItem label="Mobile" value={formData?.applicant.phoneMobile ? `+94 ${formData.applicant.phoneMobile}` : "—"} icon={<Phone className="w-3 h-3" />} />
              <DetailItem label="Email" value={formData?.applicant.email} icon={<Mail className="w-3 h-3" />} />
              <div className="md:col-span-2">
                <DetailItem label="Residential Address" value={formData?.applicant.address} icon={<MapPin className="w-3 h-3" />} />
              </div>
            </div>
          </section>

          {/* Investment History */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Transaction History</h3>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <ClientInvestmentTable formData={formData} />
            </div>
          </section>

          {/* Beneficiary & Nominee Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-emerald-50/50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Beneficiary</span>
                </div>
              </div>
              {formData?.beneficiaries.map((b: any, idx: number) => (
                <div key={idx} className="p-6 space-y-4">
                  <DetailItem label="Name" value={b.fullName} />
                  <DetailItem label="NIC" value={b.nic} />
                  <button onClick={() => { setUpdateBeneficiary(true); setSelectBeneficiary(b); }} className="w-full py-2 text-[10px] font-bold uppercase tracking-widest border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors">
                    Edit Details
                  </button>
                </div>
              ))}
            </section>

            <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-purple-50/50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Nominee</span>
                </div>
              </div>
              {formData?.nominees.map((n: any, idx: number) => (
                <div key={idx} className="p-6 space-y-4">
                  <DetailItem label="Name" value={n.fullName} />
                  <DetailItem label="NIC" value={n.nic} />
                  <button onClick={() => { setUpdateNominee(true); setSelectNominee(n); }} className="w-full py-2 text-[10px] font-bold uppercase tracking-widest border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-colors">
                    Edit Details
                  </button>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* RIGHT COLUMN: COMPLIANCE SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <SendDocumentLinkButton clientId={Number(id)} />

          <div className="sticky top-8 space-y-6">
            <section className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Documents</h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <DocPreview label="ID Front" url={formData?.applicant.idFront} id={formData?.applicant.nic} docKey="idFront" />
                <DocPreview label="ID Back" url={formData?.applicant.idBack} id={formData?.applicant.nic} docKey="idBack" />
                {/* <DocPreview label="Agreement" url={formData?.applicant.agreement} id={formData?.applicant.nic} docKey="agreement" /> */}

                <div className="pt-6 border-t border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Digital Signature</p>
                  <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200 flex items-center justify-center min-h-[100px]">
                    {formData?.applicant.signature ? (
                      <img src={formData?.applicant.signature} alt="Signature" className="max-h-16 object-contain mix-blend-multiply opacity-80" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Signature</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setDocShowUpdateModel(true)}
                  className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  Verify & Update KYC
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* 4. DANGER ZONE */}
      <footer className="pt-20">
        <div className="w-full p-8 border border-red-100 bg-red-50/50 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-red-600 font-black text-sm uppercase tracking-wider">Account Termination</h4>
            <p className="text-slate-500 text-xs font-medium mt-1">Permanently remove this client and all associated financial records.</p>
          </div>
          <button
            onClick={() => setDeleteDialog(true)}
            className="flex items-center gap-2 px-8 py-4 bg-white text-red-600 border border-red-200 rounded-2xl hover:bg-red-600 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Profile
          </button>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <ConfirmDialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        description={`This will permanently delete ${formData?.applicant?.fullName}. This action is irreversible.`}
        variant="danger"
      />

      <UpdateInvestmentDocsModal
  isOpen={docsModal.open}
  onClose={() => setDocsModal(prev => ({ ...prev, open: false }))}
  investmentId={docsModal.investmentId}
  investmentRef={docsModal.investmentRef}
  currentDocs={docsModal.currentDocs}
  onSave={handleSaveInvestmentDocs}
/>
      {showUpdateModel && <UpdateClientModal id={Number(id)} isOpen={showUpdateModel} onClose={() => setShowUpdateModel(false)} initialData={formData} onUpdate={handleDetailsUpdate} />}
      {showDocUpdateModel && <UpdateDocsModal isOpen={showDocUpdateModel} onClose={() => setDocShowUpdateModel(false)} onSave={handleDocsUpdate} />}
      {updateBeneficiary && <UpdateBeneficiary onClose={() => setUpdateBeneficiary(false)} initialData={selectBeneficiary} />}
      {updateNominee && <UpdateNominee initialData={selectNominee} onClose={() => setUpdateNominee(false)} />}
    </div>
  );
}
