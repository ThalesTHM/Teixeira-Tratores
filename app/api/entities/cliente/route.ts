"use server";

import { ClientsRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { NextRequest } from "next/server";
import { serializeFirestoreData } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const clientsRepository = new ClientsRepository();

  const unsubscribe = clientsRepository.subscribeToAll((clients) => {
    try {
      const serializedClients = serializeFirestoreData(clients);
      const payload = `data: ${JSON.stringify(serializedClients)}\n\n`;
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
