"use server";

import { PasswordRecoveryRequestsRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { NextRequest } from "next/server";

interface PasswordRecoveryRequest {
  id: string;
  email: string;
  createdAt: number;
}

export async function GET(req: NextRequest) {
  const sessionService = new SessionService();
  
  // Auth check
  const user = await sessionService.getUserFromSession();
  if (!user || user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const passwordRecoveryRequestsRepository = new PasswordRecoveryRequestsRepository();

  let activeRequests: PasswordRecoveryRequest[] = [];
  let allowedRequests: any[] = [];

  const sendData = () => {
    try {
      const result = {
        passwordRecoveryRequests: activeRequests,
        allowedRecoveries: allowedRequests,
      };

      const payload = `data: ${JSON.stringify(result)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch (error) {
      console.error('Error sending password recovery data:', error);
    }
  };

  // Subscribe to active requests (non-deleted)
  const unsubscribeActive = passwordRecoveryRequestsRepository.subscribeToAll((requests) => {
    activeRequests = requests
      .map((req: any) => ({
        id: req.id,
        email: req.email,
        createdAt: req.createdAt instanceof Date ? req.createdAt.getTime() : req.createdAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
    sendData();
  });

  // Get allowed requests (deleted ones with codes) - we'll poll these since subscribeToAll doesn't include deleted
  const fetchAllowedRequests = async () => {
    try {
      const allowed = await passwordRecoveryRequestsRepository.getAllowedRequests();
      allowedRequests = allowed
        .map((req: any) => ({
          id: req.id,
          email: req.email,
          code: req.code,
          createdAt: req.createdAt instanceof Date ? req.createdAt.getTime() : req.createdAt,
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
      sendData();
    } catch (error) {
      console.error('Error fetching allowed requests:', error);
    }
  };

  // Initial fetch of allowed requests
  fetchAllowedRequests();
  
  // Poll for allowed requests changes (since they're soft deleted, they won't appear in subscribeToAll)
  const allowedInterval = setInterval(fetchAllowedRequests, 2000);

  req.signal.addEventListener("abort", () => {
    unsubscribeActive();
    clearInterval(allowedInterval);
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