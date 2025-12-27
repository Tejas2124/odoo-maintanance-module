"use client";
import { useAuth } from "@/components/auth/AuthContext";
import {
  getEquipment,
  getMyEquipment,
  getMyTickets,
  getTickets,
  Equipment,
  Ticket,
} from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading, isAdmin, logoutAction } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        // Admin sees all, users see their own
        const ticketData = isAdmin ? await getTickets() : await getMyTickets();
        const equipmentData = isAdmin
          ? await getEquipment()
          : await getMyEquipment();
        setTickets(ticketData);
        setEquipment(equipmentData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load data");
      }
    }
    fetchData();
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isAdmin ? "Admin Dashboard" : "My Dashboard"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email} • {user.role}
            </p>
          </div>
          <button
            onClick={logoutAction}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Admin Quick Links */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <a
              href="/dashboard/equipment/new"
              className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <h3 className="text-lg font-semibold">+ New Equipment</h3>
              <p className="text-blue-100 text-sm">
                Add equipment to the system
              </p>
            </a>
            <a
              href="/dashboard/tickets/new"
              className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <h3 className="text-lg font-semibold">+ New Ticket</h3>
              <p className="text-green-100 text-sm">
                Create a maintenance request
              </p>
            </a>
            <a
              href="/dashboard/teams"
              className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <h3 className="text-lg font-semibold">Manage Teams</h3>
              <p className="text-purple-100 text-sm">
                Configure maintenance teams
              </p>
            </a>
          </div>
        )}

        {/* User Create Ticket */}
        {!isAdmin && (
          <div className="mb-8">
            <a
              href="/dashboard/tickets/new"
              className="inline-block p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition"
            >
              <h3 className="text-lg font-semibold">+ Report Issue</h3>
              <p className="text-blue-100 text-sm">
                Create a maintenance request for your equipment
              </p>
            </a>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Total Equipment
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {equipment.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Open Tickets
            </p>
            <p className="text-3xl font-bold text-yellow-500">
              {tickets.filter((t) => t.status === "NEW").length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              In Progress
            </p>
            <p className="text-3xl font-bold text-blue-500">
              {tickets.filter((t) => t.status === "IN_PROGRESS").length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
            <p className="text-gray-500 dark:text-gray-400 text-sm">Resolved</p>
            <p className="text-3xl font-bold text-green-500">
              {tickets.filter((t) => t.status === "REPAIRED").length}
            </p>
          </div>
        </div>

        {/* Equipment Table */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isAdmin ? "All Equipment" : "My Equipment"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Company
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {equipment.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No equipment found
                    </td>
                  </tr>
                ) : (
                  equipment.map((eq) => (
                    <tr
                      key={eq.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                        {eq.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {eq.category}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            eq.is_scrapped
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {eq.is_scrapped ? "Scrapped" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {eq.company || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tickets Table */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isAdmin ? "All Tickets" : "My Tickets"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No tickets found
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                        {ticket.subject}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.status === "NEW"
                              ? "bg-yellow-100 text-yellow-800"
                              : ticket.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-800"
                              : ticket.status === "REPAIRED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {ticket.request_type}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {"★".repeat(Math.min(ticket.priority, 3))}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
