import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const ADMIN_EMAILS = ["admin@test.com", "kelvinc997z@gmail.com", "pro@test.com"]; // Add your admin emails

export default async function AdminPaymentsPage() {
  const session = await getSession();
  if (!session?.user || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/login");
  }

  // Fetch all pending payments with user email
  const pendingPayments = await db.payment.findMany({
    where: { status: "pending" },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Also fetch recent confirmed payments (last 10)
  const confirmedPayments = await db.payment.findMany({
    where: { status: "confirmed" },
    include: { user: { select: { email: true } } },
    orderBy: { confirmedAt: "desc" },
    take: 10,
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Payments</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-orange-600">Pending Payments</h2>
        {pendingPayments.length === 0 ? (
          <p className="text-gray-500">No pending payments.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Amount (IDR)</th>
                  <th>Method</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.id.slice(0, 8)}...</td>
                    <td>{p.user.email}</td>
                    <td>
                      <span className="capitalize">{p.plan}</span>
                    </td>
                    <td>Rp {Number(p.amount).toLocaleString()}</td>
                    <td>{p.method}</td>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                    <td>
                      <form action="/api/payment/confirm" method="POST" className="inline">
                        <input type="hidden" name="requestId" value={p.id} />
                        <button type="submit" className="btn btn-xs btn-success">
                          Confirm
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-green-600">Recently Confirmed</h2>
        {confirmedPayments.length === 0 ? (
          <p className="text-gray-500">No confirmed payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Confirmed At</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {confirmedPayments.map(p => (
                  <tr key={p.id}>
                    <td className="font-mono text-xs">{p.id.slice(0, 8)}...</td>
                    <td>{p.user.email}</td>
                    <td className="capitalize">{p.plan}</td>
                    <td>Rp {Number(p.amount).toLocaleString()}</td>
                    <td>{p.confirmedAt ? new Date(p.confirmedAt).toLocaleString() : "-"}</td>
                    <td>{p.confirmedBy || "system"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
