"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, {params}: { params: { slug: string } }) {
  const session = await getUserFromSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  writer.write(encoder.encode("retry: 3000\n\n"));

  const slug = (await params).slug;

  const billsToPayRef = await adminFirestore.collection("billsToPay");
  const snapshot = await billsToPayRef.where("slug", "==", slug);

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
