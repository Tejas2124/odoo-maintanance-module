"use client";
import { useAuth } from "@/components/auth/AuthContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function Home() {
  const { user, loading, isAdmin } = useAuth();

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center px-4">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            GearGuard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
            Equipment Maintenance Management System
          </p>

          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : user ? (
            // Logged in - show role-based buttons
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Welcome, <span className="font-semibold">{user.email}</span> (
                {user.role})
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Dashboard - Everyone */}
                <Link
                  href="/dashboard"
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition"
                >
                  📊 Dashboard
                </Link>

                {isAdmin ? (
                  // Admin buttons
                  <>
                    <Link
                      href="/dashboard/equipment/new"
                      className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 shadow-lg hover:shadow-xl transition"
                    >
                      ➕ New Equipment
                    </Link>
                    <Link
                      href="/dashboard/teams"
                      className="px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 shadow-lg hover:shadow-xl transition"
                    >
                      👥 Manage Teams
                    </Link>
                  </>
                ) : (
                  // User button
                  <Link
                    href="/dashboard/tickets/new"
                    className="px-8 py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 shadow-lg hover:shadow-xl transition"
                  >
                    🎫 Report Issue
                  </Link>
                )}
              </div>
            </div>
          ) : (
            // Not logged in
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transition"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-gray-800 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
