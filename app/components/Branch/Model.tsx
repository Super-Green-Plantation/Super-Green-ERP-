"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createBranch, updateBranch } from "@/app/features/branches/actions";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface BranchData {
  id?: number;
  name: string;
  location: string;
}

interface BranchModalProps {
  mode: "add" | "edit";
  initialData?: BranchData;
  onClose: () => void;
}

const BranchModal = ({
  mode,
  initialData,
  onClose,
}: BranchModalProps) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setName(initialData.name);
      setLocation(initialData.location);
    }
  }, [mode, initialData]);

  const mutation = useMutation({
    mutationFn: (data: BranchData) =>
      mode === "add"
        ? createBranch({ name: data.name, location: data.location })
        : updateBranch(data.id!, { name: data.name, location: data.location }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setLoading(false);
      onClose();
    },
    onError: () => {
      setLoading(false);
      alert("Failed to save branch");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      alert("Please fill in all fields!");
      return;
    }

    setLoading(true);

    mutation.mutate({
      id: initialData?.id,
      name,
      location,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-[90%] max-w-md bg-card rounded-2xl p-8 relative border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold text-foreground tracking-tight mb-6">
          {mode === "add" ? "Add New Branch" : "Update Branch"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Branch Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              disabled={loading}
              placeholder="Enter branch name"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              disabled={loading}
              placeholder="Enter branch location"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs transition-all active:scale-95 disabled:opacity-50 hover:opacity-90 shadow-xl shadow-primary/10"
          >
            {loading ? (
              <div className="flex justify-center items-center gap-2">
                {mode === "add" ? "Adding..." : "Updating..."} <Spinner />
              </div>
            ) : mode === "add" ? (
              "Add Branch"
            ) : (
              "Update Branch"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BranchModal;
