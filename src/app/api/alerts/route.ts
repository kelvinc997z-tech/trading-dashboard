import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/alerts - list user's alerts
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await db.alert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(alerts);
}

// POST /api/alerts - create new alert
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, symbol, condition, value, indicator, timeframe, notificationChannel } = body;

  if (!type || !condition) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const alert = await db.alert.create({
    data: {
      userId: session.user.id,
      type,
      symbol: symbol ?? null,
      condition,
      value: value ? parseFloat(JSON.stringify(value)) : null,
      indicator: indicator ?? null,
      timeframe: timeframe ?? null,
      notificationChannel: notificationChannel ?? null,
      isActive: true,
    },
  });

  return NextResponse.json(alert, { status: 201 });
}

// PATCH /api/alerts/[id] - update alert (toggle active, edit)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const alert = await db.alert.update({
    where: { id: params.id, userId: session.user.id },
    data: body,
  });

  return NextResponse.json(alert);
}

// DELETE /api/alerts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.alert.delete({
    where: { id: params.id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
