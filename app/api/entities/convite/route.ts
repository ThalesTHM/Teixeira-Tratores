"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { SessionService } from "@/services/session/SessionService";
import { NotificationRole } from "@/services/notifications/NotificationsService";
import { NextRequest } from "next/server";
import { serializeFirestoreData } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = session.role;

  const rolePriority = role === 'admin' ? NotificationRole.ADMIN :
      role === 'manager' ? NotificationRole.MANAGER :
      NotificationRole.EMPLOYEE;

  if (rolePriority > NotificationRole.MANAGER) {
    return new Response("Forbidden", { status: 403 });
  }


  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const emailInvitesRef = await adminFirestore.collection("users")
    .where("used", "==", false);

  const unsubscribe = await emailInvitesRef.onSnapshot(snapshot => {
    const emailInvites = snapshot.docs.map(doc => {
      const docData = doc.data();
      if (!docData) return null;

      return {
        id: doc.id,
        ...docData
      };
    });
    const serializedInvites = serializeFirestoreData(emailInvites);
    const payload = `data: ${JSON.stringify(serializedInvites)}\n\n`;
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