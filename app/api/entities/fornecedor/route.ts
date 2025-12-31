"use server";

import { SuppliersRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const suppliersRepository = new SuppliersRepository();

  const unsubscribe = suppliersRepository.subscribeToAll((suppliers) => {
    try {
      const payload = `data: ${JSON.stringify(suppliers)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch (error) {
      console.error('Error sending suppliers data:', error);
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
