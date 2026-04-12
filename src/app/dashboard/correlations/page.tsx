export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import CorrelationMatrix from "@/components/CorrelationMatrix";

export default async function CorrelationsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "pro") redirect("/pricing");

  return (
    <div className="container mx-auto p-6">
      <CorrelationMatrix />
    </div>
  );
}
