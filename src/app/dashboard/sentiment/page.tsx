import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SentimentClient from "./SentimentClient";

export default async function SentimentPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "pro") redirect("/pricing");

  return <SentimentClient />;
}
