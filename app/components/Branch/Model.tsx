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

    if (!name || !location) {
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
        className="w-full max-w-md bg-white rounded-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {mode === "add" ? "Add New Branch" : "Update Branch"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Branch Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-2 rounded-lg font-semibold ${
              mode === "add"
                ? "bg-blue-500 hover:bg-blue-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
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
