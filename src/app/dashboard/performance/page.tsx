import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PerformanceClient from "./PerformanceClient";

export default async function PerformancePage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "pro") redirect("/pricing");

  return <PerformanceClient />;
}

