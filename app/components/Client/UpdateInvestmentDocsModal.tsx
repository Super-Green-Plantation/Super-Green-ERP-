"use client";

import React, { useEffect, useState } from "react";
import { X, FileText, CheckCircle2, CloudLightning, Loader2, UploadCloud, Eye } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { usePermission } from "@/app/hooks/usePermission";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { Member } from "@/app/types/member";

interface UpdateInvestmentDocsModalProps {
    user: any | null;
    isOpen: boolean;
    onClose: () => void;
    investmentId: number;
    investmentRef: string;
    currentDocs: {
        proposal?: string | null;
        agreement?: string | null;
        paymentSlip?: string | null;
    };
    onSave: (files: Record<string, string | null>) => void;
}



const BUCKET = "kyc-documents";

const docTypes = [
    { id: "paymentSlip", label: "Payment Slip", description: "Clear photo or scan of the payment slip" },
    { id: "proposal", label: "Proposal Form", description: "Signed digital or scanned copy" },
    { id: "agreement", label: "Legal Agreement", description: "Finalized & stamped document" },
];

const uploadToSupabase = async (investmentId: number, key: string, file: File): Promise<string> => {
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `investment/${investmentId}/${key}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (error) throw new Error(`Upload failed for ${key}: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
};

const isImageUrl = (url: string) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);

const UpdateInvestmentDocsModal = ({
    user,
    isOpen,
    onClose,
    investmentId,
    investmentRef,
    currentDocs,
    onSave,
}: UpdateInvestmentDocsModalProps) => {
    const [isUploading, setIsUploading] = useState(false);

    const canEdit = usePermission(user?.role, PERMISSIONS.UPDATE_CLIENTS_DOCUMENT);

    // track new files selected by the user
    const [newFiles, setNewFiles] = useState<Record<string, File | null>>({
        paymentSlip: null,
        proposal: null,
        agreement: null,
    });

    // track which existing URLs were explicitly cleared by the user
    const [cleared, setCleared] = useState<Record<string, boolean>>({
        paymentSlip: false,
        proposal: false,
        agreement: false,
    });

    if (!isOpen) return null;

    const handleFileChange = (key: string, file: File | null) => {
        if (!file) { setNewFiles(prev => ({ ...prev, [key]: null })); return; }
        if (file.size > 10 * 1024 * 1024) { toast.error("File too large. Max 10MB."); return; }
        if (file.size > 1 * 1024 * 1024) toast.warning("File is >1MB. A smaller file is recommended.");
        setNewFiles(prev => ({ ...prev, [key]: file }));
        setCleared(prev => ({ ...prev, [key]: false })); // un-clear if they re-upload
    };

    const handleClearExisting = (key: string) => {
        setCleared(prev => ({ ...prev, [key]: true }));
        setNewFiles(prev => ({ ...prev, [key]: null }));
    };

    const handleUpdate = async () => {
        const hasChanges =
            Object.values(newFiles).some(Boolean) ||
            Object.values(cleared).some(Boolean);

        if (!hasChanges) { toast.error("No changes to save."); return; }

        setIsUploading(true);
        try {
            const result: Record<string, string | null> = {};

            for (const key of Object.keys(newFiles)) {
                const file = newFiles[key];
                if (file) {
                    result[key] = await uploadToSupabase(investmentId, key, file);
                } else if (cleared[key]) {
                    result[key] = "";   // signal to server action to set null
                }
                // if neither — omit the key entirely, parent keeps existing value
            }

            await onSave(result);
            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload one or more documents.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-card rounded-[2.5rem] shadow-lg border border-border overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-8 pt-8 pb-6 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                <CloudLightning size={16} className="text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground tracking-tighter">Investment Documents</h2>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            #{investmentRef}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-muted/80 rounded-2xl text-muted-foreground hover:text-foreground transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-8 pb-8 space-y-4">
                    {docTypes.map(doc => {
                        const key = doc.id as keyof typeof currentDocs;
                        const existingUrl = currentDocs[key];
                        const newFile = newFiles[doc.id];
                        const isClearedExisting = cleared[doc.id];

                        const showNewPreview = !!newFile;
                        const showExistingPreview = !newFile && !!existingUrl && !isClearedExisting;
                        const showEmpty = !showNewPreview && !showExistingPreview;

                        const newIsPDF = newFile?.type === "application/pdf";
                        const newPreviewUrl = newFile ? URL.createObjectURL(newFile) : null;
                        const existingIsImage = existingUrl ? isImageUrl(existingUrl) : false;

                        return (
                            <div key={doc.id} className="group relative">
                                <label className="block mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                                    {doc.label}
                                </label>

                                <div className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl transition-all min-h-28 ${showExistingPreview
                                    ? "border-primary/20 bg-emerald-50/30"
                                    : "border-border bg-muted/30 group-hover:bg-card group-hover:border-primary cursor-pointer"
                                    }`}>

                                    {/* file input — only active when not showing existing */}
                                    {!showExistingPreview && canEdit && (
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={e => handleFileChange(doc.id, e.target.files?.[0] || null)}
                                        />
                                    )}

                                    {showNewPreview && (
                                        <div className="flex flex-col items-center gap-2 w-full">
                                            {newIsPDF ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <FileText className="w-9 h-9 text-muted-foreground" />
                                                    <p className="text-[10px] text-muted-foreground font-medium truncate max-w-48">{newFile!.name}</p>
                                                </div>
                                            ) : (
                                                <img src={newPreviewUrl!} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-border" />
                                            )}
                                            {canEdit && (
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); handleFileChange(doc.id, null); }}
                                                    className="mt-1 px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-foreground text-[10px] font-bold rounded-full border border-red-500/20 transition-colors z-20 relative"
                                                >
                                                    Remove
                                                </button>
                                            )}

                                        </div>
                                    )}

                                    {showExistingPreview && (
                                        <div className="flex flex-col items-center gap-2 w-full">
                                            {existingIsImage ? (
                                                <img src={existingUrl!} alt={doc.label} className="w-16 h-16 object-cover rounded-lg border border-border" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    <FileText className="w-9 h-9 text-emerald-400" />
                                                    <p className="text-[10px] text-emerald-600 font-bold">File on record</p>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 mt-1 z-20 relative">
                                                <a
                                                    href={existingUrl!}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary hover:bg-blue-100 text-[10px] font-bold rounded-full border border-blue-200 transition-colors"
                                                >
                                                    <Eye size={10} /> View
                                                </a>
                                                {/* clicking Replace re-activates the file input */}

                                                {canEdit && (
                                                    <div>
                                                        <label className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-muted-foreground hover:bg-slate-200 text-[10px] font-bold rounded-full border border-border transition-colors cursor-pointer">
                                                            <UploadCloud size={10} /> Replace
                                                            <input
                                                                type="file"
                                                                accept="image/*,application/pdf"
                                                                className="hidden"
                                                                onChange={e => handleFileChange(doc.id, e.target.files?.[0] || null)}
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleClearExisting(doc.id)}
                                                            className="px-3 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-foreground text-[10px] font-bold rounded-full border border-red-500/20 transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>

                                                )}

                                            </div>
                                        </div>
                                    )}

                                    {showEmpty && (
                                        <>
                                            <div className="w-9 h-9 rounded-xl bg-card shadow-sm border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mb-2">
                                                <UploadCloud size={16} />
                                            </div>
                                            <p className="text-[11px] font-bold text-muted-foreground">Click to upload</p>
                                            <p className="text-[9px] text-muted-foreground mt-0.5">{doc.description} · Max 10MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}


                </div>
                {canEdit && (
                    <div>
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-orange-500/100 text-white flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold">!</span>
                            </div>
                            <p className="text-[11px] font-bold text-orange-500 leading-relaxed">
                                Uploading replaces existing files for this investment. This action is permanent.
                            </p>
                        </div>

                        < div className="px-8 py-6 bg-muted/30 border-t border-border flex items-center justify-end gap-3">
                            <button onClick={onClose} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                                Cancel
                            </button>
                            <button
                                disabled={isUploading}
                                onClick={handleUpdate}
                                className="flex items-center gap-2 px-8 py-3.5 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground rounded-2xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all shadow-none active:scale-95"
                            >
                                {isUploading ? (
                                    <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                                ) : (
                                    <><CheckCircle2 size={14} /> Commit Changes</>
                                )}
                            </button>
                        </div>
                    </div>

                )}


            </div>
        </div >
    );
};

export default UpdateInvestmentDocsModal;