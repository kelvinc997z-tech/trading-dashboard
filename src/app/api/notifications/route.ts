import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/notifications
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const unreadOnly = searchParams.get("unread") === "true";

  const where: any = { userId: session.user.id };
  if (unreadOnly) {
    where.read = false;
  }

  const notifications = await db.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  // Parse JSON data fields
  const parsedNotifications = notifications.map(n => ({
    ...n,
    data: n.data ? (() => {
      try { return typeof n.data === "string" ? JSON.parse(n.data) : n.data; } catch { return null; }
    })() : null,
  }));

  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, read: false },
  });

  return NextResponse.json({
    notifications: parsedNotifications,
    unreadCount,
  });
}

// PATCH /api/notifications - mark as read
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { notificationIds, markAll } = body;

  try {
    if (markAll) {
      await db.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await db.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.user.id,
        },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notification error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// POST /api/notifications - create (for system use)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, title, message, data } = body;

  if (!type || !title || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Store data as JSON string
  const notification = await db.notification.create({
    data: {
      userId: session.user.id,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null,
    },
  });

  // Return parsed version
  const parsedNotification = {
    ...notification,
    data: notification.data ? (() => {
      try { return typeof notification.data === "string" ? JSON.parse(notification.data) : notification.data; } catch { return null; }
    })() : null,
  };

  return NextResponse.json(parsedNotification, { status: 201 });
}

// DELETE /api/notifications - delete all read or specific ones
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const deleteAll = searchParams.get("all") === "true";
  const deleteRead = searchParams.get("read") === "true";

  try {
    if (deleteAll) {
      await db.notification.deleteMany({
        where: { userId: session.user.id },
      });
    } else if (deleteRead) {
      await db.notification.deleteMany({
        where: { userId: session.user.id, read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
