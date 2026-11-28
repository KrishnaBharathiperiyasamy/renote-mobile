"use client";

import { useState, useEffect } from "react";
import apiClient from "@utilis/apiClient";
import { safeToastError } from "@utilis/toastHelper";
import { FileText, Receipt, Layers, Lock, Search } from "lucide-react";
import { API_ENDPOINTS } from "@constants/api";

interface UserStats {
  id: string;
  name: string;
  email: string | null;
  posters: number;
  estimations: number;
  invoices: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleUnlock = async () => {
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.ADMIN.VERIFY_ADMIN,
        { password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        setAuthenticated(true);
        localStorage.setItem("admin_authenticated", "true");
      } else {
        safeToastError("Invalid password");
      }
    } catch (err) {
      safeToastError("Server error");
    }
  };

  useEffect(() => {
    const alreadyAuthed = localStorage.getItem("admin_authenticated");
    if (alreadyAuthed === "true") {
      setAuthenticated(true);
    }
  }, []);
  useEffect(() => {
    if (!authenticated) return;

    const fetchUsers = async () => {
      try {
        const resAllUsers = await apiClient.get(API_ENDPOINTS.ADMIN.GET_ALL_USERS);
        const dataAllUsers = resAllUsers.data;

        const resCounts = await apiClient.get(API_ENDPOINTS.ADMIN.GET_USER_COUNTS);
        const dataCounts = resCounts.data;

        const merged: UserStats[] = dataAllUsers.users.map((user: any) => {
          const counts = dataCounts.users.find(
            (c: any) => c.authId === String(user.id)
          );
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            posters: counts?.postersCount || 0,
            estimations: counts?.estimationsCount || 0,
            invoices: counts?.invoicesCount || 0,
          };
        });

        setUsers(merged);
      } catch (error) {
        safeToastError("Error fetching users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [authenticated]);

  // 🔒 Password Gate
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-[90%] max-w-md text-center border border-orange-200">
          <div className="flex justify-center mb-4">
            <div className="bg-orange-100 p-4 rounded-full">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Admin Access Required
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Please enter the admin password to access the dashboard.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-2 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-300 rounded-lg w-full px-4 py-2 text-center outline-none transition mb-4"
            placeholder="••••••••"
          />
          <button
            onClick={handleUnlock}
            className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold shadow-md hover:bg-orange-700 hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            Unlock Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6 text-center text-orange-600 font-semibold">
        Loading users...
      </div>
    );
  }

  // 🔎 Filtered users
  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition"
          />
        </div>
      </div>

      <h1 className="text-3xl font-extrabold text-orange-600 mb-6 text-center drop-shadow-sm">
        reNote Admin Dashboard
      </h1>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-y-auto max-h-[70vh] border border-gray-200 rounded-2xl bg-white shadow-2xl transition-colors">
          <table className="w-full border-collapse">
            <thead className="bg-orange-100 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">
                  Posters
                </th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">
                  Estimations
                </th>
                <th className="p-3 text-center text-sm font-semibold text-gray-700">
                  Invoices
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => (
                <tr
                  key={u.id}
                  className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-orange-50 transition-colors`}
                >
                  <td className="p-3 font-medium text-gray-800">{u.name}</td>
                  <td className="p-3 text-gray-600">{u.email || "-"}</td>
                  <td className="p-3 text-center text-gray-800 font-semibold">{u.posters}</td>
                  <td className="p-3 text-center text-gray-800 font-semibold">{u.estimations}</td>
                  <td className="p-3 text-center text-gray-800 font-semibold">{u.invoices}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-4">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="border border-gray-200 rounded-xl shadow-md p-5 bg-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-orange-100 px-3 py-1 text-xs text-orange-600 font-semibold rounded-bl-lg">
              User
            </div>
            <div className="font-bold text-lg text-gray-800">{u.name}</div>
            <div className="text-sm text-gray-500 mb-4">{u.email || "-"}</div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-orange-50 p-2 rounded-lg">
                <Layers className="w-5 h-5 mx-auto text-orange-500" />
                <div className="text-sm font-semibold text-gray-800">{u.posters}</div>
                <div className="text-xs text-gray-600">Posters</div>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg">
                <FileText className="w-5 h-5 mx-auto text-orange-500" />
                <div className="text-sm font-semibold text-gray-800">{u.estimations}</div>
                <div className="text-xs text-gray-600">Estimations</div>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg">
                <Receipt className="w-5 h-5 mx-auto text-orange-500" />
                <div className="text-sm font-semibold text-gray-800">{u.invoices}</div>
                <div className="text-xs text-gray-600">Invoices</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
