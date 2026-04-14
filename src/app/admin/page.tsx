import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Users, CreditCard, Shield, Activity, Settings } from "lucide-react";

const ADMIN_EMAILS = ["admin@test.com", "kelvinc997z@gmail.com", "pro@test.com", "hsbbdo13@gmail.com"];

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session?.user || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/login");
  }

  const userCount = await db.user.count();
  const proUserCount = await db.user.count({ where: { role: "pro" } });
  const pendingPayments = await db.payment.count({ where: { status: "pending" } });
  
  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, email: true, role: true, createdAt: true, verified: true }
  });

  const stats = [
    { label: "Total Users", value: userCount, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Pro Users", value: proUserCount, icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Pending Payments", value: pendingPayments, icon: CreditCard, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "System Health", value: "Normal", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Admin <span className="text-emerald-500">Dashboard</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Management and monitoring center</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Navigation Links */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Management</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link 
              href="/admin/users" 
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">User Management</p>
                  <p className="text-xs text-gray-500">Manage roles, subscriptions, and profiles</p>
                </div>
              </div>
              <div className="text-gray-400 group-hover:translate-x-1 transition-transform">→</div>
            </Link>

            <Link 
              href="/admin/payments" 
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">Payment Verification</p>
                  <p className="text-xs text-gray-500">Confirm QRIS and bank transfers</p>
                </div>
              </div>
              <div className="text-gray-400 group-hover:translate-x-1 transition-transform">→</div>
            </Link>
          </div>
        </div>

        {/* Recent Users */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Users</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentUsers.map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 text-gray-900 dark:text-white truncate max-w-[150px]">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === "pro" ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <Link href="/admin/users" className="text-xs text-emerald-500 font-semibold hover:underline">
                View all users →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
