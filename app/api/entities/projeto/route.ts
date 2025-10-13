"use server";

import { ProjectsRepository } from "@/database/repositories/Repositories";
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

  const projectsRepository = new ProjectsRepository();

  const unsubscribe = projectsRepository.subscribeToAll((projects) => {
    try {
      const payload = `data: ${JSON.stringify(projects)}\n\n`;
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
