"use client";

import { useState } from "react";
import { Search, Shield, User, CheckCircle, XCircle, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  verified: boolean;
  subscriptionEndsAt: string | null;
  createdAt: string;
}

export default function UsersClient({ initialUsers }: { initialUsers: UserData[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "pro" ? "free" : "pro";
    setLoading(userId);

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        router.refresh();
      } else {
        const data = await res.json();
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error updating role");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage {users.length} registered accounts</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search email or name..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                        {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                      </div>
                      <div className="max-w-[200px]">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name || "No Name"}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "pro" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {user.role === "pro" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {user.role.toUpperCase()}
                      </span>
                      {user.verified ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                          <CheckCircle className="w-2.5 h-2.5" /> VERIFIED
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                          <XCircle className="w-2.5 h-2.5" /> UNVERIFIED
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === "pro" ? (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt).toLocaleDateString() : "Permanent"}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role === "pro" ? (
                      <button
                        onClick={() => toggleRole(user.id, user.role)}
                        disabled={loading === user.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 disabled:opacity-50"
                      >
                        {loading === user.id ? "Wait..." : "DOWNGRADE"}
                      </button>
                    ) : (
                      <Link
                        href="/payment"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                      >
                        UPGRADE
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
