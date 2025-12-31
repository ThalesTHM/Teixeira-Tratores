"use server";

import { ClientsRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { NextRequest } from "next/server";

const sessionService = new SessionService();

export async function GET(req: NextRequest, {params}: { params: { slug: string } }) {
  const session = await sessionService.getUserFromSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const slug = (await params).slug;
  const clientsRepository = new ClientsRepository();

  const unsubscribe = clientsRepository.subscribeBySlug(slug, (client) => {
    try {
      const payload = `data: ${JSON.stringify(client)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch (error) {
      console.error('Error sending client data:', error);
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
