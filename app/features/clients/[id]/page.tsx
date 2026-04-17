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

import { MaturityBadge } from "@/app/components/Buttons/MaturityBadge";
import SendDocumentLinkButton from "@/app/components/Buttons/SendDocumentLinkButton";
import { DocPreview } from "@/app/components/Doc/DocPreview";
import { ProposalTemplate } from "@/app/components/Doc/ProposalTemplate";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { getFinancialPlanById } from "@/app/features/financial_plans/actions";
import { generateClientApplicationPDF } from "@/app/pdf/ClientApplication";
import { useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Calendar,
  Download,
  HeartHandshake,
  Mail,
  MapPin,
  Pen,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import UpdateBeneficiary from "@/app/components/Client/UpdateBeneficiary";
import UpdateNominee from "@/app/components/Client/UpdateNominee";

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

  console.log("nominee : ", formData?.nominees);


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
        paymentSlip: updatedFiles.paymentSlip ?? formData?.applicant.paymentSlip,
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

            <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
              {formData?.applicant?.fullName || "Application Profile"}
            </h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Ref ID: <span className="font-mono text-primary">{formData?.investment.refNumber}</span>
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
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 hover:opacity-90"
              >
                <Pen className="w-4 h-4 fill-current" />
                <span>Update</span>
              </button>

              {/* Download PDF Button */}
              <button
                onClick={() => generateClientApplicationPDF(
                  proposalRef.current,
                  `Proposal_${formData?.applicant?.fullName?.replace(/\s+/g, '_')}`
                )}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 hover:opacity-90"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>

              <div>
                {/* <MaturityBadge investments={formData?.investments} /> */}
              </div>


            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Applicant & Investment */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Applicant */}
          <section className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-5 bg-primary/5 border-b border-border flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-foreground">Applicant Information</h2>
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
          <section className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-green-500/10 border-b border-border flex items-center gap-3">
              <HeartHandshake className="w-5 h-5 text-green-600" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-foreground">
                Beneficiary Information
              </h2>
            </div>

            {formData?.beneficiaries.map((b: any, index: number) => {
              return (
                <div key={index} className="border-b border-border/50 last:border-none">
                  {/* Data Grid */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <DetailItem label="Name" value={b.fullName} />
                    <DetailItem label="NIC" value={b.nic} />
                    <DetailItem label="Relationship" value={b.relationship} />
                    <DetailItem label="Bank Name" value={b.bankName} />
                    <DetailItem label="Account Number" value={b.accountNo} />
                    <DetailItem label="Bank Branch" value={b.bankBranch} />
                    <DetailItem label="Phone" value={b.phone} />
                  </div>

                  {/* Responsive Edit Button Area */}
                  <div className="px-6 pb-6 flex justify-end">
                    <button
                      onClick={() => {
                        setUpdateBeneficiary(true);
                        setSelectBeneficiary(b);
                      }}
                      className="w-full md:w-auto group flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-green-500/5 hover:bg-green-500 text-green-600 hover:text-white border border-green-500/20 hover:border-green-500 transition-all duration-200 shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Edit Beneficiary
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Section: Nominee */}
          <section className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-5 bg-purple-500/10 border-b border-border flex items-center gap-3">
              <User className="w-5 h-5 text-purple-600" />
              <h2 className="text-[11px] font-black uppercase tracking-widest text-foreground">Nominee Info</h2>
            </div>

            {formData?.nominees.map((n: any, index: number) => (
              <div key={index} className="p-6">
                <div className="space-y-4 mb-6">
                  <DetailItem label="Name" value={n.fullName} />
                  <DetailItem label="NIC" value={n.nic} />
                  <DetailItem label="Permanent Address" value={n.permanentAddress} />
                  <DetailItem label="Postal Address" value={n.postalAddress} />
                </div>

                {/* Responsive Button Container */}
                <div className="pt-4 border-t border-border/50 flex justify-end">
                  <button
                    onClick={() => {
                      setUpdateNominee(true);
                      setSelectNominee(n);
                    }}
                    className="w-full md:w-auto group flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-500/5 hover:bg-purple-500 text-purple-600 hover:text-white border border-purple-500/20 hover:border-purple-500 transition-all duration-200 shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Edit Nominee
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </section>

          {/* Investment Table */}
          <ClientInvestmentTable investments={formData?.investments} />
        </div>

        {/* Right Column: Documents & Investment Plan */}
        <div className="space-y-8">
          {/* Compliance & KYC Documents */}
          <SendDocumentLinkButton clientId={Number(id)} />
          <section className="  bg-card rounded-3xl shadow-sm border border-border overflow-hidden">


            <div className="px-6 py-5 bg-muted/30 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-card rounded-lg border border-border shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                  KYC Documents
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
                <DocPreview
                  label="Payment Slip"
                  url={formData?.applicant.paymentSlip}
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
                <div className="pt-6 border-t border-border">
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mb-4 ml-1">
                    Verified Digital Signature
                  </p>
                  <div className="bg-muted/30 rounded-2xl p-8 border border-dashed border-border flex items-center justify-center group hover:bg-card hover:border-primary/50 transition-all cursor-crosshair shadow-inner">
                    {formData?.applicant.signature ? (
                      <img
                        src={formData?.applicant.signature || null}
                        alt="Signature"
                        className="max-h-20 object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity dark:invert"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                          No Signature Uploaded
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>

            {/* Refined Action Footer */}
            <div className="px-6 py-5 bg-muted/30 border-t border-border">
              <button
                onClick={() => setDocShowUpdateModel(true)}
                className="group relative flex items-center justify-center gap-3 w-full px-6 py-4 
          bg-foreground text-background hover:opacity-90 rounded-2xl
          text-[10px] font-black uppercase tracking-[0.2em] 
          transition-all active:scale-[0.98] shadow-xl shadow-foreground/5"
              >
                Verify & Update Docs
              </button>
            </div>
          </section>

        </div>
      </div>


      <div className="mb-20 w-full p-6 border border-destructive/20 bg-destructive/5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h4 className="text-destructive font-black text-[13px] uppercase tracking-wider">Terminate Application</h4>
          <p className="text-muted-foreground/60 text-[10px] font-bold uppercase tracking-tight mt-1">Once deleted, this data is gone forever from the ecosystem.</p>
        </div>

        <button
          onClick={() => setDeleteDialog(true)}
          className="flex items-center gap-2 px-8 py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-2xl hover:bg-destructive hover:text-white active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-destructive/5"
        >
          <Trash2 className="w-4 h-4" />
          Delete Profile
        </button>

        <ConfirmDialog
          open={deleteDialog}
          onClose={() => setDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Client"
          description={`This will permanently delete ${formData?.applicant?.fullName} and all associated investments, documents and records. This cannot be undone.`}
          confirmLabel="Delete Client"
          cancelLabel="Keep it"
          variant="danger"
        />


      </div>
      {showUpdateModel && (
        <UpdateClientModal
          id={Number(id)}
          isOpen={showUpdateModel}
          onClose={() => setShowUpdateModel(false)}
          initialData={formData}
          onUpdate={(updatedData) => handleDetailsUpdate(updatedData)}
        />
      )}

      {showDocUpdateModel && (
        <UpdateDocsModal
          isOpen={showDocUpdateModel}
          onClose={() => setDocShowUpdateModel(false)}
          onSave={handleDocsUpdate}
        />
      )}

      {
        updateBeneficiary && (
          <UpdateBeneficiary
            onClose={() => setUpdateBeneficiary(false)}
            initialData={selectBeneficiary}
          />
        )
      }

      {updateNominee && (
        <UpdateNominee
          initialData={selectNominee}
          onClose={() => setUpdateNominee(false)}
        />
      )}
    </div>
  );
}
