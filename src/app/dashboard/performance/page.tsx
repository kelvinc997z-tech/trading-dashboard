import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PerformanceClient from "./PerformanceClient";

export default async function PerformancePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  // Temporarily allow access for dev/testing
  // if (session.user.role !== "pro") redirect("/pricing");

  return (
    <div className="container mx-auto px-4 py-8">
      <PerformanceClient />
    </div>
  );
}

