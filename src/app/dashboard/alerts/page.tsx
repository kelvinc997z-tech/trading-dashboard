export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AlertsClient from "./AlertsClient";

export default async function AlertsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "pro") redirect("/pricing");

  return <AlertsClient />;
}
