"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";
import { NotificationRole } from "@/services/notifications/NotificationsService";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, {params}: { params: { slug: string } }) {
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

  const slug = (await params).slug;

  const usersRef = await adminFirestore.collection("users");
  const snapshot = await usersRef.where("slug", "==", slug);

  const unsubscribe = await snapshot.onSnapshot(snapshot => {
    if(snapshot.empty){
      writer.write(`data: ${null}\n\n`);
    }
    const doc = snapshot.docs[0]
    
    const client = doc.exists ? 
      {
        id: doc.id,
        ...doc.data()
      }
    :
      null;
    
    const payload = `data: ${JSON.stringify(client)}\n\n`;
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