export const dynamic = "force-dynamic";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PredictionsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "pro") redirect("/pricing");

  const PredictionsClient = (await import("./PredictionsClient")).default;
  return <PredictionsClient />;
}
