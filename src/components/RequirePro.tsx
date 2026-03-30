import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RequirePro({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "pro") {
    redirect("/pricing");
  }
  return <>{children}</>;
}
