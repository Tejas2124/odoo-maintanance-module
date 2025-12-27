"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Equipment {
  id: number;
  name: string;
  category: string;
  maintenance_team: string;
}

interface Ticket {
    id: string;
    raised_by:string;
    status: string;
    solvedBy: string;
    equipment: string;
    category:string;
    maintanance_type:string
}

interface CreateTicketFormProps {
  onTicketCreated: (ticket: Ticket) => void;
}

export default function CreateTicketForm({
  onTicketCreated,
}: CreateTicketFormProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [equipmentId, setEquipmentId] = useState<number | null>(null);
  const [description, setDescription] = useState("");

  // Fetch equipments from API
  useEffect(() => {
    async function fetchEquipments() {
      const res = await fetch("http://localhost:8000/equipments");
      const data = await res.json();
      setEquipments(data);
    }
    fetchEquipments();
  }, []);

  // Derived values (no extra state)
  const selectedEquipment = equipments.find(
    (e) => e.id === equipmentId
  );

  const autoCategory = selectedEquipment?.category ?? "";
  const autoTeam = selectedEquipment?.maintenance_team ?? "";

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!equipmentId) return;

    const res = await fetch("http://localhost:8000/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        equipment_id: equipmentId,
      }),
    });

    const ticket: Ticket = await res.json();
    onTicketCreated(ticket);

    // Reset form
    setDescription("");
    setEquipmentId(null);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-lg">
      <h2 className="text-lg font-semibold mb-4">Create New Ticket</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <Label>Description</Label>
          <Input
            type="text"
            placeholder="Describe the issue"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Equipment</Label>
          <select
            value={equipmentId ?? ""}
            onChange={(e) => setEquipmentId(Number(e.target.value))}
            className="w-full border rounded px-2 py-1 mt-1"
            required
          >
            <option value="" disabled>
              Select equipment
            </option>
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>

        {equipmentId && (
          <div className="text-sm text-gray-600 space-y-1 mt-1">
            <p>
              <strong>Category:</strong> {autoCategory}
            </p>
            <p>
              <strong>Maintenance Team:</strong> {autoTeam}
            </p>
          </div>
        )}

        <Button type="submit" className="mt-2">
          Create Ticket
        </Button>
      </form>
    </div>
  );
}
