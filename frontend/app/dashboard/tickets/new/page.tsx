"use client";
import { useAuth } from "@/components/auth/AuthContext";
import {
  createTicket,
  getMyEquipment,
  getEquipment,
  Equipment,
  TicketCreate,
} from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTicketPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<TicketCreate>({
    subject: "",
    description: "",
    equipment_id: "",
    request_type: "CORRECTIVE",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchEquipment() {
      try {
        // Admin can select any equipment, users only their own
        const data = isAdmin ? await getEquipment() : await getMyEquipment();
        setEquipment(data.filter((e) => !e.is_scrapped)); // Only non-scrapped
      } catch (err) {
        console.error("Failed to fetch equipment:", err);
      }
    }
    fetchEquipment();
  }, [user, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipment_id) {
      setError("Please select equipment");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createTicket(formData);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isAdmin ? "Create Maintenance Request" : "Report an Issue"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {isAdmin
              ? "Create a new maintenance ticket for any equipment"
              : "Report a problem with your assigned equipment"}
          </p>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the issue"
              />
            </div>

            {/* Equipment Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Equipment *
              </label>
              <select
                required
                value={formData.equipment_id}
                onChange={(e) =>
                  setFormData({ ...formData, equipment_id: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Equipment</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.name} ({eq.category})
                  </option>
                ))}
              </select>
              {equipment.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {isAdmin
                    ? "No equipment found. Create equipment first."
                    : "No equipment assigned to you."}
                </p>
              )}
            </div>

            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maintenance Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="request_type"
                    value="CORRECTIVE"
                    checked={formData.request_type === "CORRECTIVE"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        request_type: e.target.value as
                          | "CORRECTIVE"
                          | "PREVENTIVE",
                      })
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Corrective (Fix issue)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="request_type"
                    value="PREVENTIVE"
                    checked={formData.request_type === "PREVENTIVE"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        request_type: e.target.value as
                          | "CORRECTIVE"
                          | "PREVENTIVE",
                      })
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Preventive (Scheduled)
                  </span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description of the issue or maintenance needed..."
              />
            </div>

            {/* Info box about auto-fill */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Auto-filled:</strong> Team, technician, and company
                will be automatically filled from the selected equipment.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || equipment.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
