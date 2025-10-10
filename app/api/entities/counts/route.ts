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

  const collections = [
    { name: "projects", key: "projetos" },
    { name: "clients", key: "clientes" },
    { name: "suppliers", key: "fornecedores" },
    { name: "users", key: "funcionarios" },
    { name: "billsToPay", key: "contasPagar" },
    { name: "billsToReceive", key: "contasReceber" }
  ];

  const unsubscribes = collections.map(({ name, key }) => {
    return adminFirestore.collection(name).onSnapshot(snapshot => {
      const size = snapshot.size;
      const payload = `data: ${JSON.stringify({ [key]: size })}\n\n`;
      writer.write(encoder.encode(payload));
    });
  });

  req.signal.addEventListener("abort", () => {
    unsubscribes.forEach(unsubscribe => unsubscribe());
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
