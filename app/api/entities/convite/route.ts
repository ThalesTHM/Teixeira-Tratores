"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";
import { NotificationRole } from "@/services/notifications/notifications-service";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getUserFromSession();

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

  writer.write(encoder.encode("retry: 3000\n\n"));

  const emailInvitesRef = await adminFirestore.collection("emailInvites")
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
    const payload = `data: ${JSON.stringify(emailInvites)}\n\n`;
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