import { adminFirestore } from "@/firebase/firebase-admin";
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

  const notificationsRef = adminFirestore.collection("notifications")
    .where('role', '>=', rolePriority)
    .orderBy("role", "desc")
    .orderBy("createdAt", "desc");

  const unsubscribe = notificationsRef.onSnapshot(snapshot => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    const payload = `data: ${JSON.stringify(notifications)}\n\n`;
    writer.write(encoder.encode(payload));
  });

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
