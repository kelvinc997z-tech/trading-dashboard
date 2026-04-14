export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import UsersClient from "./UsersClient";

const ADMIN_EMAILS = ["admin@test.com", "kelvinc997z@gmail.com", "pro@test.com", "hsbbdo13@gmail.com"];

export default async function AdminUsersPage() {
  const session = await getSession();
  if (!session?.user || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/login");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      verified: true,
      subscriptionEndsAt: true,
      createdAt: true,
    }
  });

  return (
    <div className="container mx-auto p-4 md:p-8">
      <UsersClient initialUsers={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}
