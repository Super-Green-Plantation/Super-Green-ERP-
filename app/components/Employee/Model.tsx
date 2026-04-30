"use client";

import { useEffect, useState, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  X,
  Mail,
  Hash,
  Phone as PhoneIcon,
  User,
  MapPin,
  Briefcase,
  CreditCard,
  Building2,
  Calendar,
  Users,
  ChevronDown,
  Check,
  Upload,
  Search,
} from "lucide-react";
import { EmpModalProps, FormData, Member } from "@/app/types/member";
import { getBranchById, getBranches } from "@/app/features/branches/actions";
import { useParams } from "next/navigation";
import { Branch } from "@/app/types/branch";
import {
  createEmployee,
  getPositions,
  getUplineMembers,
  updateEmployee,
  uploadProfilePic,
  searchEmployees,
  getMembersByEmpNos,
} from "@/app/features/employees/actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { inputStyles, inputStylesNoIcon, labelStyles, tabBtn } from "@/app/const/styles";

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberSummary = {
  id: number;
  nameWithInitials: string | null;
  empNo: string;
  position: { title: string };
};

// ─── Component ────────────────────────────────────────────────────────────────

const EmpModal = ({ mode, initialData, onClose, onSuccess }: EmpModalProps) => {
  const { branchId } = useParams<{ branchId: string }>();
  const queryClient = useQueryClient();

  // ── UI State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"basic" | "personal" | "employment">("basic");
  const [loading, setLoading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);

  // ── Data State ────────────────────────────────────────────────────────────
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [positions, setPositions] = useState<{ id: number; title: string; rank: number; type: string; isProbation: boolean }[]>([]);
  const [uplineSuggestions, setUplineSuggestions] = useState<MemberSummary[]>([]);

  // ── Profile Pic ───────────────────────────────────────────────────────────
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>("");

  // ── Reporting Persons ─────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MemberSummary[]>([]);
  const [selectedReportingMembers, setSelectedReportingMembers] = useState<MemberSummary[]>([]);

  // ── Form Data ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>({
    empNo: "",
    epfNo: "",
    etfNo: "",
    positionId: "",
    branchIds: [Number(branchId)],
    email: "",
    phone: "",
    phone2: "",
    totalCommission: 0,
    nameWithInitials: "",
    nic: "",
    dob: "",
    gender: "",
    civilStatus: "",
    address: "",
    reportingPersons: [],
    dateOfJoin: "",
    appointmentLetter: "",
    confirmation: "",
    remark: "",
    accNo: "",
    bank: "",
    bankBranch: "",
    status: "PROBATION" as "PROBATION" | "PERMANENT" | "MANAGEMENT",
    probationStartDate: "",
    profilePic: "",
    isActive: true,
    channel: "Chanel_01" as "Chanel_01" | "Chanel_02" | "Micro",
  });

  // ─── Derived ──────────────────────────────────────────────────────────────

  const selectedPosition = positions.find((p) => p.id === Number(formData.positionId));

  const canHaveMultipleBranches = (pos?: typeof positions[number]) => {
    if (!pos) return false;
    if (pos.type === "PROBATION") return pos.rank >= 4;
    if (pos.type === "PERMANENT") return pos.rank >= 16;
    return false;
  };

  const isMultiBranch = canHaveMultipleBranches(selectedPosition);
  const homeBranch = allBranches.find((b) => b.id === formData.branchIds[0]);

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Load static data
  useEffect(() => { getPositions().then(setPositions); }, []);
  useEffect(() => { if (!branchId) return; getBranchById(Number(branchId)).then(setCurrentBranch); }, [branchId]);
  useEffect(() => { getBranches().then((b: Branch[]) => setAllBranches(b)); }, []);

  // Edit mode — seed profile pic preview
  useEffect(() => {
    if (mode === "edit" && initialData?.profilePic) {
      setProfilePicPreview(initialData.profilePic);
    }
  }, [mode, initialData]);

  // Edit mode — seed selected reporting members from empNos
  useEffect(() => {
    if (mode === "edit" && initialData?.reportingPersons?.length) {
      getMembersByEmpNos(initialData.reportingPersons).then(setSelectedReportingMembers);
    }
  }, [mode, initialData]);

  // Edit mode — populate form
  useEffect(() => {
    if (mode === "edit" && initialData) {
      const existingBranchIds =
        initialData.branches?.map((mb: { branchId: number }) => mb.branchId) ?? [Number(branchId)];

      setFormData({
        nameWithInitials: initialData.nameWithInitials ?? "",
        empNo: initialData.empNo ?? "",
        epfNo: initialData.epfNo ?? "",
        etfNo: initialData.etfNo ?? "",
        positionId: String(initialData.position?.id ?? ""),
        branchIds: existingBranchIds,
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        phone2: initialData.phone2 ?? "",
        totalCommission: initialData.totalCommission ?? 0,
        nic: initialData.nic ?? "",
        dob: initialData.dob ? new Date(initialData.dob).toISOString().slice(0, 10) : "",
        gender: initialData.gender ?? "",
        civilStatus: initialData.civilStatus ?? "",
        address: initialData.address ?? "",
        reportingPersons: initialData.reportingPersons ?? [],
        appointmentLetter: initialData.appointmentLetter ?? "",
        confirmation: initialData.confirmation ?? "",
        remark: initialData.remark ?? "",
        accNo: initialData.accNo ?? "",
        bank: initialData.bank ?? "",
        profilePic: "",
        bankBranch: initialData.bankBranch ?? "",
        status: initialData.status ?? "PROBATION",
        dateOfJoin: initialData.dateOfJoin ? new Date(initialData.dateOfJoin).toISOString().slice(0, 10) : "",
        probationStartDate: initialData.probationStartDate
          ? new Date(initialData.probationStartDate).toISOString().slice(0, 10)
          : "",
        isActive: initialData.isActive ?? true,
        channel: initialData.channel ?? "Chanel_01",
      });
    }
  }, [mode, initialData, branchId]);

  // Load upline suggestions when position or branches change
  useEffect(() => {
    if (!formData.positionId) return;
    getUplineMembers(Number(formData.positionId), formData.branchIds).then(setUplineSuggestions);
  }, [formData.positionId, formData.branchIds]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchText.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchEmployees(searchText);
          setSearchResults(
            results.map((m: any) => ({
              id: m.id,
              nameWithInitials: m.nameWithInitials,
              empNo: m.empNo,
              position: { title: m.position.title },
            }))
          );
        } catch (err) {
          console.error("Search error:", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const handlePositionChange = (value: string) => {
    const pos = positions.find((p) => p.id === Number(value));
    const isMulti = canHaveMultipleBranches(pos);
    setFormData((prev) => ({
      ...prev,
      positionId: value,
      branchIds: isMulti ? prev.branchIds : [Number(branchId)],
    }));
  };

  const toggleBranch = (id: number) => {
    setFormData((prev) => {
      const already = prev.branchIds.includes(id);
      // Prevent deselecting the last branch
      if (already && prev.branchIds.length === 1) return prev;
      return {
        ...prev,
        branchIds: already
          ? prev.branchIds.filter((b) => b !== id)
          : [...prev.branchIds, id],
      };
    });
  };

  const toggleReportingPerson = (member: MemberSummary) => {
    const empNo = String(member.empNo);
    setFormData((prev) => ({
      ...prev,
      reportingPersons: prev.reportingPersons.includes(empNo)
        ? prev.reportingPersons.filter((e) => e !== empNo)
        : [...prev.reportingPersons, empNo],
    }));
    setSelectedReportingMembers((prev) => {
      const exists = prev.find((m) => m.empNo === empNo);
      return exists ? prev.filter((m) => m.empNo !== empNo) : [...prev, member];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const positionId = Number(formData.positionId);
      if (!positionId) {
        toast.error("Please select a position");
        return;
      }

      let profilePicUrl: string | undefined = formData.profilePic;
      if (profilePicFile) {
        setUploadingPic(true);
        const uploadRes = await uploadProfilePic(profilePicFile, formData.empNo);
        setUploadingPic(false);
        if (!uploadRes.success) {
          toast.error(uploadRes.error ?? "Failed to upload profile picture");
          return;
        }
        profilePicUrl = uploadRes.url;
      }

      const payload = {
        ...formData,
        profilePic: profilePicUrl,
        positionId,
        branchIds: formData.branchIds,
        probationStartDate: formData.probationStartDate,
      };

      if (mode === "add") {
        const res = await createEmployee(payload);
        if (!res?.success) { toast.error(res?.error ?? "Failed to add employee"); return; }
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        toast.success("Successfully Added Employee");
        onSuccess?.();
        onClose();
      } else {
        const res = await updateEmployee(initialData!.id, payload);
        if (!res.success) { toast.error(res.error ?? "Failed to update employee"); return; }
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        toast.success("Successfully Updated Employee");
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Error saving employee details";
      if (err instanceof Error) {
        if (err.message.includes("already been registered")) msg = "This email is already used by another employee.";
        else if (err.message.includes("Auth user creation failed")) msg = "Failed to create user in authentication system.";
        else msg = err.message;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  // Members already selected — exclude from suggestions and search results
  const selectedEmpNos = new Set(formData.reportingPersons);

  const filteredUpline = uplineSuggestions.filter((m) => !selectedEmpNos.has(String(m.empNo)));
  const filteredSearch = searchResults.filter((m) => !selectedEmpNos.has(String(m.empNo)));

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-background/80 backdrop-blur-sm px-6 py-6 overflow-y-auto animate-in fade-in duration-300">
      <div
        className="w-full max-w-3xl bg-card rounded-[2.5rem] shadow-2xl border border-border overflow-hidden relative scale-in-center my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">
            {mode === "add" ? "Register Team Member" : "Update Profile Records"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all border border-transparent">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/5 p-1 mx-8 mt-6 rounded-2xl">
          <button type="button" onClick={() => setActiveTab("basic")} className={tabBtn(activeTab === "basic")}>Basic Info</button>
          <button type="button" onClick={() => setActiveTab("personal")} className={tabBtn(activeTab === "personal")}>Personal</button>
          <button type="button" onClick={() => setActiveTab("employment")} className={tabBtn(activeTab === "employment")}>Employment</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">

            {/* ── TAB: BASIC INFO ─────────────────────────────────────────── */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Full Name (with initials)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="e.g. A.B.C. Perera"
                      value={formData.nameWithInitials}
                      onChange={(e) => setFormData({ ...formData, nameWithInitials: e.target.value })}
                      className={inputStyles}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className={labelStyles}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Emp No */}
                <div>
                  <label className={labelStyles}>Employee ID</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="EMP-001"
                      value={formData.empNo}
                      onChange={(e) => setFormData({ ...formData, empNo: e.target.value })}
                      className={inputStyles}
                      required
                    />
                  </div>
                </div>

                {/* Phone 1 */}
                <div>
                  <label className={labelStyles}>Primary Phone</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="07XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Phone 2 */}
                <div>
                  <label className={labelStyles}>Secondary Phone</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="07XXXXXXXX"
                      value={formData.phone2}
                      onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Employment Type */}
                <div>
                  <label className={labelStyles}>Employment Type</label>
                  <div className="flex gap-2">
                    {(["PROBATION", "PERMANENT", "MANAGEMENT"] as const).map((s) => {
                      const isActive = formData.status === s;
                      const activeStyle =
                        s === "PERMANENT" ? "bg-emerald-600 text-white border-emerald-600"
                        : s === "MANAGEMENT" ? "bg-blue-600 text-white border-blue-600"
                        : "bg-amber-500 text-white border-amber-500";
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: s, positionId: "" })}
                          className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${isActive ? activeStyle : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"}`}
                        >
                          {s === "PERMANENT" ? "Permanent" : s === "MANAGEMENT" ? "Management" : "Probation"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Probation Start Date */}
                {formData.status === "PROBATION" && (
                  <div>
                    <label className={labelStyles}>Probation Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.probationStartDate || ""}
                        onChange={(e) => setFormData({ ...formData, probationStartDate: e.target.value })}
                        className={inputStyles}
                      />
                    </div>
                  </div>
                )}

                {/* Position */}
                <div>
                  <label className={labelStyles}>Designation / Position</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.positionId}
                      onChange={(e) => handlePositionChange(e.target.value)}
                      className={inputStyles + " appearance-none pr-10"}
                      required
                    >
                      <option value="">Select Position</option>
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>{p.title} ({p.type})</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Branch(es) */}
                <div>
                  <label className={labelStyles}>Assigned Branch(es)</label>
                  {!isMultiBranch ? (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        value={homeBranch?.name || "Loading..."}
                        readOnly
                        className={inputStyles + " bg-gray-50 text-gray-500 cursor-not-allowed"}
                      />
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                      <p className="text-xs text-gray-400 mb-2">
                        Click branches to assign or remove. At least one must be selected.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allBranches.map((b) => {
                          const isSelected = formData.branchIds.includes(b.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => toggleBranch(b.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <MapPin className="w-3 h-3" />
                              {b.name}
                            </button>
                          );
                        })}
                        {allBranches.length === 0 && (
                          <span className="text-xs text-gray-400">Loading branches...</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {formData.branchIds.length} branch{formData.branchIds.length !== 1 ? "es" : ""} selected
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ── TAB: PERSONAL ───────────────────────────────────────────── */}
            {activeTab === "personal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* NIC */}
                <div>
                  <label className={labelStyles}>NIC</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="XXXXXXXXXV / XXXXXXXXXXXX"
                      value={formData.nic}
                      onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className={labelStyles}>Gender</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className={inputStyles + " appearance-none pr-10"}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Civil Status */}
                <div>
                  <label className={labelStyles}>Civil Status</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.civilStatus}
                      onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
                      className={inputStyles + " appearance-none pr-10"}
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* DOB */}
                <div>
                  <label className={labelStyles}>Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Residential Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-muted-foreground/50" />
                    <textarea
                      placeholder="e.g. No. 123, Galle Road, Colombo 03"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full pl-12 pr-4 py-3 bg-muted/30 border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-foreground resize-none placeholder:text-muted-foreground/30"
                    />
                  </div>
                </div>

                {/* Profile Picture */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {profilePicPreview
                        ? <img src={profilePicPreview} alt="Profile" className="w-full h-full object-cover" />
                        : <User className="w-7 h-7 text-gray-300" />
                      }
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                        <Upload className="w-4 h-4" />
                        {profilePicPreview ? "Change Photo" : "Upload Photo"}
                        <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                      </label>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB</p>
                    </div>
                    {profilePicPreview && (
                      <button
                        type="button"
                        onClick={() => { setProfilePicPreview(""); setProfilePicFile(null); setFormData((prev) => ({ ...prev, profilePic: "" })); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ── TAB: EMPLOYMENT & BANK ──────────────────────────────────── */}
            {activeTab === "employment" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* ── Reporting Persons ─────────────────────────────────── */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Reporting Persons</label>
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 space-y-3">

                    {/* Search Bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by Name, Emp No, or NIC..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className={inputStyles + " pl-10"}
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-2.5">
                          <Spinner className="w-4 h-4 border-primary/30 border-t-primary" />
                        </div>
                      )}
                    </div>

                    {/* ── Currently Selected ─────────────────────────────── */}
                    {selectedReportingMembers.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">
                          Selected ({selectedReportingMembers.length})
                        </p>
                        <div className="flex flex-wrap gap-2 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                          {selectedReportingMembers.map((m) => (
                            <button
                              key={`selected-${m.id}`}
                              type="button"
                              onClick={() => toggleReportingPerson(m)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                            >
                              <Check className="w-3 h-3" />
                              <User className="w-3 h-3" />
                              {m.nameWithInitials}
                              <span className="text-[10px] opacity-75">({m.position.title})</span>
                              <X className="w-3 h-3 ml-0.5 opacity-75" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Search Results ─────────────────────────────────── */}
                    {searchText.trim().length >= 2 && (
                      <div>
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">
                          Search Results
                          {filteredSearch.length === 0 && !isSearching && (
                            <span className="text-gray-400 normal-case font-normal ml-1">— no results</span>
                          )}
                        </p>
                        {filteredSearch.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                            {filteredSearch.map((m) => (
                              <button
                                key={`search-${m.id}`}
                                type="button"
                                onClick={() => toggleReportingPerson(m)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                              >
                                <User className="w-3 h-3" />
                                {m.nameWithInitials}
                                <span className="text-[10px] opacity-70">({m.position.title})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Upline Suggestions (shown when not searching) ──── */}
                    {!searchText && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Suggested Uplines
                        </p>
                        {filteredUpline.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {filteredUpline.map((m) => (
                              <button
                                key={`upline-${m.id}`}
                                type="button"
                                onClick={() => toggleReportingPerson(m)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                              >
                                <User className="w-3 h-3" />
                                {m.nameWithInitials}
                                <span className="text-[10px] opacity-70">({m.position.title})</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            No higher-rank members found. Use search to find others.
                          </span>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* Date of Join */}
                <div>
                  <label className={labelStyles}>Date of Join</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={formData.dateOfJoin}
                      onChange={(e) => setFormData({ ...formData, dateOfJoin: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* EPF */}
                <div>
                  <label className={labelStyles}>EPF Number</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="EPF-001"
                      value={formData.epfNo}
                      onChange={(e) => setFormData({ ...formData, epfNo: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* ETF */}
                <div>
                  <label className={labelStyles}>ETF Number</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="ETF-001"
                      value={formData.etfNo}
                      onChange={(e) => setFormData({ ...formData, etfNo: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Channel */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Employee Channel</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    {(["Chanel_01", "Chanel_02", "Micro"] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setFormData({ ...formData, channel: ch })}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                          formData.channel === ch
                            ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {formData.channel === ch && <Check className="w-3.5 h-3.5" />}
                        {ch.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Status */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Employment Status</label>
                  <div className="flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {formData.isActive ? "Active Employee" : "Inactive Employee"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formData.isActive
                          ? "Employee is currently active in the system"
                          : "Employee is disabled and won't appear in active workflows"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${formData.isActive ? "bg-emerald-600" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all ${formData.isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>

                {/* Remark */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Remark</label>
                  <textarea
                    placeholder="Any additional notes..."
                    value={formData.remark}
                    onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                    rows={2}
                    className={inputStylesNoIcon + " resize-none"}
                  />
                </div>

                {/* Banking Divider */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Banking Details</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                </div>

                {/* Account No */}
                <div>
                  <label className={labelStyles}>Account No.</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="XXXXXXXXXXXXXXXX"
                      value={formData.accNo}
                      onChange={(e) => setFormData({ ...formData, accNo: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Bank */}
                <div>
                  <label className={labelStyles}>Bank Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/50" />
                    <input
                      placeholder="e.g. Commercial Bank"
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Bank Branch */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Bank Branch</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/50" />
                    <input
                      placeholder="e.g. Colombo 03 / Head Office"
                      value={formData.bankBranch}
                      onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-8 py-8 border-t border-border bg-muted/20 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-3 bg-primary text-primary-foreground rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner className="w-4 h-4 border-white/30 border-t-white" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{mode === "add" ? "Register Employee" : "Save Changes"}</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpModal;