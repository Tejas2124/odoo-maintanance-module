"use client"
import CreateTicketBox from "@/components/tickets/CreateTicketBox";
import TicketHistoryTable from "@/components/tickets/TicketHistoryTables";
import CreateTicketForm from "@/components/tickets/CreateTicketForm";
import { useEffect, useState } from "react";

export default function DashboardPage() {

  interface Ticket {
    id: string;
    raised_by:string;
    status: string;
    solvedBy: string;
    equipment: string;
    category:string;
    maintanance_type:string
  }

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch tickets from API
useEffect(() => {
  async function fetchTickets() {
    try {
      const res = await fetch("http://localhost:8000/tickets", {
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to fetch tickets:", res.status);
        setTickets([]);
        return;
      }

      const data = await res.json();

      // ✅ HARD GUARANTEE: tickets is ALWAYS an array
      const safeTickets = Array.isArray(data)
        ? data
        : Array.isArray(data?.tickets)
        ? data.tickets
        : [];

      setTickets(safeTickets);
    } catch (err) {
      console.error("Tickets fetch error:", err);
      setTickets([]); // fallback
    }
  }

  fetchTickets();
}, []);



  // Handle new ticket creation
  const handleTicketCreated = (ticket: Ticket) => {
    // Format ticket to match your Ticket interface if needed
    const newTicket: Ticket = {
      id: ticket.id,
      status: ticket.status || "Pending",
      solvedBy: ticket.solvedBy || "-",
      equipment: ticket.equipment || "-",
      raised_by:ticket.raised_by,
      category:ticket.category,
      maintanance_type:ticket.maintanance_type
    };
    setTickets((prev) => [newTicket, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">User Dashboard</h1>

      {/* Create ticket box */}
      <div className="mb-8">
        <div onClick={() => setIsModalOpen(true)}>
          <CreateTicketBox />
        </div>
      </div>

      {/* Ticket creation modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative">
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>

            {/* Ticket Form */}
            <CreateTicketForm onTicketCreated={handleTicketCreated} />
          </div>
        </div>
      )}

      {/* Ticket history table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Previous Tickets</h2>
        <TicketHistoryTable tickets={tickets} />
      </div>
    </div>
  );
}
