"use server";

import { ProjectsRepository } from "@/database/repositories/Repositories";
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

  const projectsRepository = new ProjectsRepository();

  const unsubscribe = projectsRepository.subscribeToAll((projects) => {
    try {
      const serializedProjects = serializeFirestoreData(projects);
      const payload = `data: ${JSON.stringify(serializedProjects)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch (error) {
      console.error('Error sending projects data:', error);
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
