"use client";

import Back from "@/app/components/Buttons/Back";
import UpdateDocsModal from "@/app/components/Client/UpdateDocsModal";
import UpdateClientModal from "@/app/components/Client/UpdateModel";
import { DetailItem } from "@/app/components/DetailItem";
import ErrorMessage from "@/app/components/Status/Error";
import Loading from "@/app/components/Status/Loading";
import ClientInvestmentTable from "@/app/components/Tables/ClientInvestmentTable";
import { deleteBeneficiaryAction, deleteClient, deleteNomineeAction, generateUploadUrl, updateClient, updateClientDocuments } from "@/app/features/clients/actions";
import { useClient } from "@/app/hooks/useClient";
import SendDocumentLinkButton from "@/app/components/Buttons/SendDocumentLinkButton";
import UpdateBeneficiary from "@/app/components/Client/UpdateBeneficiary";
import UpdateInvestmentDocsModal from "@/app/components/Client/UpdateInvestmentDocsModal";
import UpdateNominee from "@/app/components/Client/UpdateNominee";
import { DocPreview } from "@/app/components/Doc/DocPreview";
import { ProposalTemplate } from "@/app/components/Doc/ProposalTemplate";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { getFinancialPlanById } from "@/app/features/financial_plans/actions";
import { generateClientApplicationPDF } from "@/app/pdf/ClientApplication";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CheckCircle2,
  Download,
  HeartHandshake,
  Mail,
  MapPin,
  Pen,
  Phone,
  ShieldCheck,
  Trash2,
  User
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateInvestmentDocuments } from "../../investments/actions";
import { getCurrentUser } from "@/lib/auth";

export default function ApplicationViewPage() {
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [plan, setPlan] = useState<any>();
  const [showUpdateModel, setShowUpdateModel] = useState(false);
  const [showDocUpdateModel, setDocShowUpdateModel] = useState(false);
  const router = useRouter();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [updateBeneficiary, setUpdateBeneficiary] = useState(false);
  const [deleteBeneficiary, setDeleteBeneficiary] = useState(false);
  const [selectBeneficiary, setSelectBeneficiary] = useState<any>(null);
  const [updateNominee, setUpdateNominee] = useState(false);
  const [deleteNominee, setDeleteNominee] = useState(false);
  const [selectNominee, setSelectNominee] = useState<any>(null);
  const [user, setUser] = useState<any | null>(null);

  const proposalRef = useRef<HTMLDivElement>(null);

  const { data: formData, isLoading, isError } = useClient(Number(id));


  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, []);


  useEffect(() => {
    if (!formData?.investment.planId) return;
    const fetchPlan = async () => {
      const planId = Number(formData.investment.planId);
      const res = await getFinancialPlanById(planId);
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
    if (deleteBeneficiary && selectBeneficiary) {
      const res = await deleteBeneficiaryAction(selectBeneficiary.id);
      if (!res?.success) { toast.error("Failed to delete beneficiary"); return; }
      toast.success("Beneficiary deleted");
      queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
      setDeleteBeneficiary(false);
      setSelectBeneficiary(null);
    } else if (deleteNominee && selectNominee) {
      const res = await deleteNomineeAction(selectNominee.id);
      if (!res?.success) { toast.error("Failed to delete nominee"); return; }
      toast.success("Nominee deleted");
      queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
      setDeleteNominee(false);
      setSelectNominee(null);
    } else {
      const res = await deleteClient(Number(id));
      if (!res) { toast.error("Failed to delete client"); return; }
      queryClient.invalidateQueries({ queryKey: ["client", Number(id)] });
      router.push("/features/clients");
    }
    setDeleteDialog(false);
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

  return (
    <div className="max-w-7xl mx-auto space-y-10 min-h-screen p-4 md:p-8 pb-24">
      {/* Hidden Proposal Template for PDF Generation */}
      <div className="hidden">
        <div ref={proposalRef}>
          <ProposalTemplate data={formData} />
        </div>
      </div>

      {/* 1. HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border pb-8">
        <div className="flex items-center gap-5">
          <Back />
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
              {formData?.applicant?.fullName || "Application Profile"}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData?.investment?.refNumber?.map((ref: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-primary/10 text-primary font-mono text-xs font-bold rounded border border-primary/20">
                  {ref}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowUpdateModel(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-muted border border-border text-foreground hover:bg-muted/80 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-muted/80 transition-all active:scale-95 shadow-none"
          >
            <Pen className="w-4 h-4" />
            Update Profile
          </button>
          <button
            onClick={() => generateClientApplicationPDF(proposalRef.current, `Proposal_${formData?.applicant?.fullName?.replace(/\s+/g, '_')}`)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-none"
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
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Active Investment Summary</h3>
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
                className="flex-1 min-w-85 max-w-105 bg-card rounded-[2rem] p-8 text-foreground shadow-sm border border-border relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />

                <div className="flex justify-between items-center mb-8 relative">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-border">
                    <Banknote className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-muted-foreground font-bold tracking-widest uppercase mb-1">Ref: {inv.refNumber}</span>
                    <span className="bg-primary text-primary-foreground text-[13px] py-1 px-3 rounded-full uppercase tracking-tighter">Rs. {(inv.amount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 relative">
                  <div>
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Monthly</p>
                    <p className="font-bold text-xl leading-none">
                      <span className="text-muted-foreground text-xs mr-1">LKR</span>
                      {monthlyHarvest.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="text-right border-l border-border pl-4">
                    <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider mb-1">Total Harvest</p>
                    <p className="font-bold text-xl leading-none">
                      <span className="text-muted-foreground text-xs mr-1">LKR</span>
                      {totalHarvest.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-border relative">
                  <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-2">Projected Maturity Return</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground text-lg font-bold">LKR</span>
                    <span className="text-4xl font-black tracking-tighter">
                      {totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="pt-5 mt-5 border-t border-border flex items-center justify-between gap-3 relative">
                  <div className="flex gap-2 flex-wrap">
                    {(["proposal", "agreement", "paymentSlip"] as const).map(key => {
                      const labels = { proposal: "Proposal", agreement: "Agreement", paymentSlip: "Slip" };
                      const present = !!inv[key];
                      return (
                        <span
                          key={key}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${present
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted/30 text-muted-foreground border border-border"
                            }`}
                        >
                          {present ? (
                            <CheckCircle2 size={9} />
                          ) : (
                            <span className="w-2 h-2 rounded-full border border-border/50 inline-block" />
                          )}
                          {labels[key]}
                        </span>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setDocsModal({ open: true, investmentId: inv.id, investmentRef: inv.refNumber, currentDocs: { proposal: inv.proposal, agreement: inv.agreement, paymentSlip: inv.paymentSlip } })}
                    className="shrink-0 px-3 py-1.5 bg-primary/10 border border-border text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors"
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
          <section className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-8 py-5 bg-muted/30 border-b border-border flex items-center gap-3">
              <User className="w-5 h-5 text-foreground" />
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
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Transaction History</h3>
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <ClientInvestmentTable formData={formData} />
            </div>
          </section>

          {/* Beneficiary & Nominee Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-muted/30 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Beneficiary</span>
                </div>
              </div>
              {formData?.beneficiaries.map((b: any, idx: number) => (
                <div key={idx} className="p-6 space-y-4">
                  <DetailItem label="Name" value={b.fullName} />
                  <DetailItem label="NIC" value={b.nic} />

                  <div className="sm:flex gap-3">
                    <button onClick={() => { setUpdateBeneficiary(true); setSelectBeneficiary(b); }} className="w-full py-2 text-[10px] font-bold uppercase tracking-widest border border-emerald-200 text-primary rounded-lg hover:bg-emerald-600 hover:text-white transition-colors">
                      Edit
                    </button>

                    <button onClick={() => { setDeleteBeneficiary(true); setSelectBeneficiary(b); setDeleteDialog(true) }} className="w-full py-2 text-[10px] font-bold uppercase tracking-widest border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/10 hover:text-red-500 bg-red-500/5 transition-colors">
                      Delete
                    </button>
                  </div>


                </div>
              ))}
            </section>

            <section className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-muted/30 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Nominee</span>
                </div>
              </div>
              {formData?.nominees.map((n: any, idx: number) => (
                <div key={idx} className="p-6 space-y-4">
                  <DetailItem label="Name" value={n.fullName} />
                  <DetailItem label="NIC" value={n.nic} />

                  <div className="sm:flex gap-3">
                    <button onClick={() => { setUpdateNominee(true); setSelectNominee(n); }} className="w-full py-2 text-[10px] font-bold uppercase tracking-widest border border-purple-200 text-primary rounded-lg hover:bg-purple-600 hover:text-white transition-colors">
                      Edit
                    </button>

                    <button onClick={() => { setDeleteNominee(true); setSelectNominee(n); setDeleteDialog(true) }} className="w-full py-2 text-[10px] font-bold uppercase tracking-widest border border-red-500/20 text-red-500 rounded-lg hover:bg-red-500/10 hover:text-red-500 bg-red-500/5 transition-colors">
                      Delete
                    </button>
                  </div>


                </div>
              ))}
            </section>
          </div>
        </div>

        {/* RIGHT COLUMN: COMPLIANCE SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <SendDocumentLinkButton clientId={Number(id)} />

          <div className="sticky top-8 space-y-6">
            <section className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden">
              <div className="px-6 py-5 bg-muted border border-border text-foreground hover:bg-muted/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Documents</h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <DocPreview label="ID Front" url={formData?.applicant.idFront} id={formData?.applicant.nic} docKey="idFront" />
                <DocPreview label="ID Back" url={formData?.applicant.idBack} id={formData?.applicant.nic} docKey="idBack" />
                {/* <DocPreview label="Agreement" url={formData?.applicant.agreement} id={formData?.applicant.nic} docKey="agreement" /> */}

                <div className="pt-6 border-t border-border">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-4">Digital Signature</p>
                  <div className="bg-muted/30 rounded-2xl p-6 border border-dashed border-border flex items-center justify-center min-h-25">
                    {formData?.applicant.signature ? (
                      <img src={formData?.applicant.signature} alt="Signature" className="max-h-16 object-contain mix-blend-multiply opacity-80" />
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Pending Signature</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setDocShowUpdateModel(true)}
                  className="w-full py-4 bg-primary hover:opacity-90 text-primary-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
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
        <div className="w-full p-8 border border-red-500/20 bg-red-500/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-red-500 font-black text-sm uppercase tracking-wider">Account Termination</h4>
            <p className="text-muted-foreground text-xs font-medium mt-1">Permanently remove this client and all associated financial records.</p>
          </div>
          <button
            onClick={() => setDeleteDialog(true)}
            className="flex items-center gap-2 px-8 py-4 bg-card text-red-500 border border-red-200 rounded-2xl hover:bg-red-600 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Profile
          </button>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <ConfirmDialog
        open={deleteDialog}
        onClose={() => {
          setDeleteDialog(false);
          setDeleteBeneficiary(false);
          setSelectBeneficiary(null);
          setDeleteNominee(false);
          setSelectNominee(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={
          deleteBeneficiary ? "Delete Beneficiary" :
            deleteNominee ? "Delete Nominee" :
              "Delete Client"
        }
        description={
          deleteBeneficiary
            ? `This will permanently delete beneficiary ${selectBeneficiary?.fullName}.`
            : deleteNominee
              ? `This will permanently delete nominee ${selectNominee?.fullName}.`
              : `This will permanently delete ${formData?.applicant?.fullName}. This action is irreversible.`
        }
        variant="danger"
      />

      <UpdateInvestmentDocsModal
        user={user}
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
