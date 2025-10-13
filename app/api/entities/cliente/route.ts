"use server";

import { ClientsRepository } from "@/database/repositories/Repositories";
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

  const clientsRepository = new ClientsRepository();

  const unsubscribe = clientsRepository.subscribeToAll((clients) => {
    try {
      const payload = `data: ${JSON.stringify(clients)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch (error) {
      console.error('Error sending clients data:', error);
    }
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
