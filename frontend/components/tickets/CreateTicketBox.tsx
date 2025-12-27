"use client"; // required for client-side interactivity

import { useState } from "react";

export default function CreateTicketBox() {
  const [equipment, setEquipment] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Connect to your FastAPI backend
    const res = await fetch("http://localhost:8000/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ equipment, description }),
      credentials: "include",
    });

    if (res.ok) {
      alert("Ticket created successfully!");
      setEquipment("");
      setDescription("");
    } else {
      alert("Error creating ticket");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-md">
      <h2 className="text-lg font-semibold mb-4">Create New Ticket</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Equipment Name"
          className="border rounded px-3 py-2"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          required
        />
        <textarea
          placeholder="Issue Description"
          className="border rounded px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
        >
          Create Ticket
        </button>
      </form>
    </div>
  );
}
