"use server";

import { NotificationsRepository } from "@/database/repositories/Repositories";
import { getUserFromSession } from "@/lib/auth";
import { NotificationRole } from "@/services/notifications/NotificationsService";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getUserFromSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = session.role;

  const rolePriority = role === 'admin' ? NotificationRole.ADMIN :
      role === 'manager' ? NotificationRole.MANAGER :
      NotificationRole.EMPLOYEE

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const notificationsRepository = new NotificationsRepository();

  const unsubscribe = notificationsRepository.subscribeWithFilter(
    [{ field: 'role', operator: '>=', value: rolePriority }],
    [
      { field: 'role', direction: 'desc' },
      { field: 'createdAt', direction: 'desc' }
    ],
    (allNotifications) => {
      try {
        const notifications = allNotifications.map(docData => {
          const notification = { ...docData };
          notification.read = notification.readBy?.includes(session.uid) || false;
          notification.softRead = notification.softReadBy?.includes(session.uid) || false;

          delete notification.readBy;
          delete notification.softReadBy;
          delete notification.softReadAt;
          delete notification.readAt;

          return notification;
        });
        
        const payload = `data: ${JSON.stringify(notifications)}\n\n`;
        writer.write(encoder.encode(payload));
      } catch (error) {
        console.error('Error sending notifications data:', error);
      }
    }
  );

  req.signal.addEventListener("abort", () => {
    unsubscribe();
    writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
