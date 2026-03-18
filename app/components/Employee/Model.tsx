"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  X,
  Mail,
  Hash,
  DollarSign,
  Phone as PhoneIcon,
  User,
  MapPin,
  Briefcase,
  CreditCard,
  Building2,
  Calendar,
  FileText,
  Users,
  ChevronDown,
  Check,
  Upload,
} from "lucide-react";
import { Member } from "@/app/types/member";
import { getBranchById, getBranches } from "@/app/features/branches/actions";
import { useParams } from "next/navigation";
import { Branch } from "@/app/types/branch";
import { createEmployee, getPositions, getUplineMembers, updateEmployee, uploadProfilePic } from "@/app/features/employees/actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EmpModalProps {
  mode: "add" | "edit";
  initialData?: Member;
  onClose: () => void;
  onSuccess?: () => void;
}

// Positions that can be assigned to multiple branches
const MULTI_BRANCH_POSITION_IDS = [4, 5, 6]; // RM, ZM, AGM
// const POSITION_MAP: Record<string, string> = {
//   "6": "AGM",
//   "5": "ZM",
//   "4": "RM",
//   "3": "BM",
//   "2": "TL",
//   "1": "FA",
// };

const EmpModal = ({ mode, initialData, onClose, onSuccess }: EmpModalProps) => {
  const { branchId } = useParams<{ branchId: string }>();
  const queryClient = useQueryClient();

  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string>("");
  const [uploadingPic, setUploadingPic] = useState(false);

  const [positions, setPositions] = useState<{ id: number; title: string; rank: number }[]>([]);



  useEffect(() => {
    getPositions().then(setPositions);
  }, []);


  useEffect(() => {
    if (mode === "edit" && initialData?.profilePic) {
      setProfilePicPreview(initialData.profilePic);
    }
  }, [mode, initialData]);

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };


  // Active section tab for grouping the many fields
  const [activeTab, setActiveTab] = useState<"basic" | "personal" | "employment">("basic");

  const [formData, setFormData] = useState({
    // --- Core (required) ---
    empNo: "",
    epfNo: "",
    positionId: "",

    // --- Branch(es) ---
    branchIds: [Number(branchId)], // always starts with current branch

    // --- Basic contact ---
    email: "",
    phone: "",
    phone2: "",
    totalCommission: 0,

    // --- Name variants ---
    nameWithInitials: "",

    // --- Personal ---
    nic: "",
    dob: "",
    gender: "",
    civilStatus: "",
    address: "",

    // --- Employment ---
    reportingPerson: "",  // name / empNo of supervisor
    dateOfJoin: "",
    appointmentLetter: "", // file URL or ref
    confirmation: "",      // file URL or ref
    remark: "",

    // --- Banking ---
    accNo: "",
    bank: "",
    bankBranch: "",
    status: "PROBATION" as "PROBATION" | "PERMANENT",
    probationStartDate: "",
    profilePic: "",
  });

  // Fetch current branch info
  useEffect(() => {
    if (!branchId) return;
    getBranchById(Number(branchId)).then(setCurrentBranch);
  }, [branchId]);

  // Fetch all branches for multi-select
  useEffect(() => {
    getBranches().then((branches: Branch[]) => setAllBranches(branches));
  }, []);

  // Populate form in edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      const existingBranchIds =
        initialData.branches?.map((mb: { branchId: number }) => mb.branchId) ?? [Number(branchId)];

      setFormData({
        nameWithInitials: initialData.nameWithInitials ?? "",
        empNo: initialData.empNo ?? "",
        epfNo: initialData.epfNo ?? "",
        positionId: String(initialData.position?.id ?? ""),
        branchIds: existingBranchIds,
        email: initialData.email ?? "",
        phone: initialData.phone ?? "",
        phone2: initialData.phone2 ?? "",
        totalCommission: initialData.totalCommission ?? 0,
        nic: initialData.nic ?? "",
        dob: initialData.dob ? initialData.dob.toString().slice(0, 10) : "",
        gender: initialData.gender ?? "",
        civilStatus: initialData.civilStatus ?? "",
        address: initialData.address ?? "",
        reportingPerson: initialData.reportingPerson ?? "",
        dateOfJoin: initialData.dateOfJoin ? initialData.dateOfJoin.toString().slice(0, 10) : "",
        appointmentLetter: initialData.appointmentLetter ?? "",
        confirmation: initialData.confirmation ?? "",
        remark: initialData.remark ?? "",
        accNo: initialData.accNo ?? "",
        bank: initialData.bank ?? "",
        profilePic: "",
        bankBranch: initialData.bankBranch ?? "",
        status: initialData.status ?? "PROBATION",
        probationStartDate: initialData.probationStartDate
          ? initialData.probationStartDate.toISOString().slice(0, 10)
          : "",
      });
    }

    console.log("initialData dates:", initialData?.probationStartDate, initialData?.dateOfJoin);

  }, [mode, initialData, branchId]);

  const isMultiBranch = MULTI_BRANCH_POSITION_IDS.includes(Number(formData.positionId));


  // When position changes, reset to single branch if not multi-branch role
  const handlePositionChange = (value: string) => {
    const isMulti = MULTI_BRANCH_POSITION_IDS.includes(Number(value));
    setFormData((prev) => ({
      ...prev,
      positionId: value,
      branchIds: isMulti ? prev.branchIds : [Number(branchId)],
    }));
  };

  const toggleBranch = (id: number) => {
    setFormData((prev) => {
      const currentBranchNum = Number(branchId);
      // Current branch cannot be deselected
      if (id === currentBranchNum) return prev;

      const already = prev.branchIds.includes(id);
      return {
        ...prev,
        branchIds: already
          ? prev.branchIds.filter((b) => b !== id)
          : [...prev.branchIds, id],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let profilePicUrl: string | undefined = formData.profilePic;

      // Upload profile pic if a new file was selected
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
        positionId: Number(formData.positionId),
        branchIds: isMultiBranch ? formData.branchIds : [Number(branchId)],
        probationStartDate: formData.status === "PROBATION"
          ? mode === "edit" && formData.probationStartDate
            ? new Date(formData.probationStartDate)
            : (formData.dateOfJoin ? new Date(formData.dateOfJoin) : new Date())
          : null,
      };

      if (mode === "add") {
        const res = await createEmployee(payload);
        if (!res.success) { toast.error(res.error ?? "Failed to add employee"); return; }
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
    } catch {
      toast.error("Error saving employee details");
    } finally {
      setLoading(false);
    }
  };

  const [uplineSuggestions, setUplineSuggestions] = useState<{ id: number; nameWithInitials: string | null; empNo: string; position: { title: string } }[]>([]);

  useEffect(() => {
    if (!formData.positionId) return;
    getUplineMembers(Number(formData.positionId), formData.branchIds)
      .then(setUplineSuggestions);
  }, [formData.positionId, formData.branchIds]);




  // ─── Styles ────────────────────────────────────────────────
  const inputStyles =
    "w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm";
  const inputStylesNoIcon =
    "w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm";
  const labelStyles =
    "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 ml-1";
  const tabBtn = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active
      ? "bg-blue-600 text-white shadow-sm"
      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    }`;

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 overflow-y-auto">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">
            {mode === "add" ? "Create New Employee" : "Edit Employee Details"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 flex gap-2 border-b border-gray-100 pb-3">
          <button type="button" className={tabBtn(activeTab === "basic")} onClick={() => setActiveTab("basic")}>
            Basic Info
          </button>
          <button type="button" className={tabBtn(activeTab === "personal")} onClick={() => setActiveTab("personal")}>
            Personal
          </button>
          <button type="button" className={tabBtn(activeTab === "employment")} onClick={() => setActiveTab("employment")}>
            Employment & Bank
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">

            {/* ── TAB: BASIC INFO ── */}
            {activeTab === "basic" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Name with Initials <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="e.g. J.M. Doe"
                      value={formData.nameWithInitials}
                      onChange={(e) => setFormData({ ...formData, nameWithInitials: e.target.value })}
                      required
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Emp No */}
                <div className="w-full">
                  <label className={labelStyles}>Employee ID <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="EMP-001"
                      value={formData.empNo}
                      onChange={(e) => setFormData({ ...formData, empNo: e.target.value })}
                      required
                      className={inputStyles}
                    />
                  </div>
                </div>


                <div className="w-full">
                  <label className={labelStyles}>EPF Number <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="EPF-001"
                      value={formData.epfNo}
                      onChange={(e) => setFormData({ ...formData, epfNo: e.target.value })}
                      required
                      className={inputStyles}
                    />
                  </div>

                </div>



                {/* Email */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Phone 1 */}
                <div>
                  <label className={labelStyles}>Contact No. 1</label>
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
                  <label className={labelStyles}>Contact No. 2</label>
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

                {/* Commission */}
                <div>
                  <label className={labelStyles}>Commission ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={formData.totalCommission}
                      onChange={(e) => setFormData({ ...formData, totalCommission: Number(e.target.value) })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Designation */}
                <div>
                  <label className={labelStyles}>Designation / Role <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.positionId}
                      onChange={(e) => handlePositionChange(e.target.value)}
                      required
                      className={inputStyles + " appearance-none pr-10"}
                    >
                      <option value="" disabled>Select Position</option>
                      <option value="6">AGM</option>
                      <option value="5">ZM</option>
                      <option value="4">RM</option>
                      <option value="3">BM</option>
                      <option value="2">TL</option>
                      <option value="1">FA</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Employment Status */}
                <div>
                  <label className={labelStyles}>Employment Status</label>
                  <div className="flex gap-2">
                    {(["PROBATION", "PERMANENT"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: s })}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${formData.status === s
                          ? s === "PERMANENT"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        {s === "PERMANENT" ? "✓ Permanent" : "Probation"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Probation Start Date — only show when on probation */}
                {formData.status === "PROBATION" && (
                  <div>
                    <label className={labelStyles}>Probation Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={formData.probationStartDate}
                        onChange={(e) => setFormData({ ...formData, probationStartDate: e.target.value })}
                        className={inputStyles}
                      />
                    </div>
                  </div>
                )}

                {/* ── BRANCH SECTION ── */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>
                    {isMultiBranch ? "Assigned Branches" : "Assigned Branch"}
                    {isMultiBranch && (
                      <select
                        value={formData.positionId}
                        onChange={(e) => handlePositionChange(e.target.value)}
                        required
                        className={inputStyles + " appearance-none pr-10"}
                      >
                        <option value="" disabled>Select Position</option>
                        {positions.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                    )}
                  </label>

                  {!isMultiBranch ? (
                    /* Single branch — read-only display */
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        value={currentBranch?.name ?? "Loading..."}
                        disabled
                        className={inputStyles + " bg-gray-50 text-gray-500 cursor-not-allowed"}
                      />
                    </div>
                  ) : (
                    /* Multi-branch badge selector */
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                      {/* Current branch — always selected, locked */}
                      <p className="text-xs text-gray-400 mb-2">
                        Current branch is pre-selected. Click others to add or remove.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {allBranches.map((b) => {
                          const isCurrentBranch = b.id === Number(branchId);
                          const isSelected = formData.branchIds.includes(b.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => toggleBranch(b.id)}
                              disabled={isCurrentBranch}
                              className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                                ${isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                                }
                                ${isCurrentBranch ? "opacity-80 cursor-not-allowed ring-1 ring-blue-300" : "cursor-pointer"}
                              `}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <MapPin className="w-3 h-3" />
                              {b.name}
                              {isCurrentBranch && (
                                <span className="text-[10px] opacity-70 ml-0.5">(current)</span>
                              )}
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

            {/* ── TAB: PERSONAL ── */}
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

                {/* Birthday reminder */}
                <div>
                  <label className={labelStyles}>Birthday (Reminder Date)</label>
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
                  <label className={labelStyles}>Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <textarea
                      placeholder="No. XX, Street, City"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                      className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Profile Picture */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Profile Picture</label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="w-16 h-16 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {profilePicPreview ? (
                        <img
                          src={profilePicPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-gray-300" />
                      )}
                    </div>

                    {/* Upload button */}
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
                        <Upload className="w-4 h-4" />
                        {profilePicPreview ? "Change Photo" : "Upload Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePicChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 2MB</p>
                    </div>

                    {/* Remove button */}
                    {profilePicPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfilePicPreview("");
                          setProfilePicFile(null);
                          setFormData((prev) => ({ ...prev, profilePic: "" }));
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ── TAB: EMPLOYMENT & BANK ── */}
            {activeTab === "employment" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Reporting Person */}
                <div className="md:col-span-2">
                  <label className={labelStyles}>Reporting Person</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <select
                      value={formData.reportingPerson}
                      onChange={(e) => setFormData({ ...formData, reportingPerson: e.target.value })}
                      className={inputStyles + " appearance-none pr-10"}
                    >
                      <option value="">Select reporting person...</option>
                      {uplineSuggestions.map((m) => (
                        <option key={m.id} value={m.empNo}>
                          {m.nameWithInitials} ({m.position.title} — {m.empNo})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  {uplineSuggestions.length === 0 && formData.positionId && (
                    <p className="text-xs text-gray-400 mt-1">No higher-rank members found in selected branches.</p>
                  )}
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

                {/* Appointment Letter ref */}
                <div>
                  <label className={labelStyles}>Appointment Letter Ref</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="File ref or URL"
                      value={formData.appointmentLetter}
                      onChange={(e) => setFormData({ ...formData, appointmentLetter: e.target.value })}
                      className={inputStyles}
                    />
                  </div>
                </div>

                {/* Confirmation */}
                <div>
                  <label className={labelStyles}>Confirmation Ref</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="File ref or URL"
                      value={formData.confirmation}
                      onChange={(e) => setFormData({ ...formData, confirmation: e.target.value })}
                      className={inputStyles}
                    />
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

                {/* Divider */}
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
                  <label className={labelStyles}>Bank</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
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
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      placeholder="e.g. Colombo 03"
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
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:items-center">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all active:scale-95"
            >
              {loading ? (
                <Spinner className="w-5 h-5" />
              ) : mode === "add" ? (
                "Create Employee"
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpModal;