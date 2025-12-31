"use server";

import { 
  ProjectsRepository, 
  ClientsRepository, 
  SuppliersRepository, 
  UsersRepository, 
  BillsToPayRepository, 
  BillsToReceiveRepository 
} from "@/database/repositories/Repositories";
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

  const repositories = [
    { repository: new ProjectsRepository(), key: "projetos" },
    { repository: new ClientsRepository(), key: "clientes" },
    { repository: new SuppliersRepository(), key: "fornecedores" },
    { repository: new UsersRepository(), key: "funcionarios" },
    { repository: new BillsToPayRepository(), key: "contasPagar" },
    { repository: new BillsToReceiveRepository(), key: "contasReceber" }
  ];

  const counts: Record<string, number> = {};
  const unsubscribers: Array<() => void> = [];
  let initializedKeys = new Set<string>();

  const sendData = () => {
    try {
      // Only send if we have data for all repositories
      if (initializedKeys.size === repositories.length) {
        const payload = `data: ${JSON.stringify(counts)}\n\n`;
        writer.write(encoder.encode(payload));
      }
    } catch (error) {
      console.error('Error sending counts data:', error);
    }
  };

  // Set up subscriptions for each repository
  repositories.forEach(({ repository, key }) => {
    const unsubscribe = repository.subscribeToAll((data: any[]) => {
      counts[key] = data.length;
      initializedKeys.add(key);
      sendData(); // Send immediately when any data updates
    });
    unsubscribers.push(unsubscribe);
  });

  req.signal.addEventListener("abort", () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
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
