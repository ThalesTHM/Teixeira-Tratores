"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await getUserFromSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  writer.write(encoder.encode("retry: 3000\n\n"));

  const billsToReceiveRef = await adminFirestore.collection("billsToReceive");

  const unsubscribe = await billsToReceiveRef.onSnapshot(snapshot => {
    const billsToReceive = snapshot.docs.map(doc => {
      const docData = doc.data();
      if (!docData) return null;

      return {
        id: doc.id,
        ...docData
      };
    });
    const payload = `data: ${JSON.stringify(billsToReceive)}\n\n`;
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
