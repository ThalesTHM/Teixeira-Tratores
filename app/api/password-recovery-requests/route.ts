import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { adminFirestore } from "@/firebase/firebase-admin";
import type { NextRequest } from "next/server";

interface PasswordRecoveryRequest {
  id: string;
  email: string;
  createdAt: number;
}

interface AllowedRecovery {
  id: string;
  email: string;
  code: string;
  createdAt: number;
}

export async function GET(req: NextRequest) {
  // Accept header may contain multiple values
  const accept = req.headers.get("accept") || "";
  // Auth check
  const user = await getUserFromSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch both collections in parallel
  const [requestsSnap, allowedSnap] = await Promise.all([
    adminFirestore.collection("passwordRecoveryRequests").get(),
    adminFirestore.collection("passwordRecoveryAllowed").get(),
  ]);

  // Map allowed recoveries by email for quick lookup
  const allowedByEmail = new Map<string, AllowedRecovery>();
  allowedSnap.docs.forEach((doc) => {
    const data = doc.data() as Omit<AllowedRecovery, "id">;
    allowedByEmail.set(data.email, {
      id: doc.id,
      ...data,
    });
  });

  // Filter requests: only those not already allowed
  const pendingRequests: PasswordRecoveryRequest[] = requestsSnap.docs
    .map((doc) => {
      const data = doc.data() as Omit<PasswordRecoveryRequest, "id">;
      return {
        id: doc.id,
        ...data,
      };
    })
    .filter((req) => !allowedByEmail.has(req.email));

  // Prepare allowed recoveries list
  const allowedRecoveries: AllowedRecovery[] = Array.from(allowedByEmail.values());

  // Sort both lists by createdAt desc
  pendingRequests.sort((a, b) => b.createdAt - a.createdAt);
  allowedRecoveries.sort((a, b) => b.createdAt - a.createdAt);

  // Combine for response
  const result = {
    pendingRequests,
    allowedRecoveries,
  };

  // SSE support
  if (accept.includes("text/event-stream")) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Initial send
    const sendSnapshot = async () => {
      // Re-fetch both collections for polling
      const [requestsSnap, allowedSnap] = await Promise.all([
        adminFirestore.collection("passwordRecoveryRequests").get(),
        adminFirestore.collection("passwordRecoveryAllowed").get(),
      ]);
      const allowedByEmail = new Map<string, AllowedRecovery>();
      allowedSnap.docs.forEach((doc) => {
        const data = doc.data() as Omit<AllowedRecovery, "id">;
        allowedByEmail.set(data.email, {
          id: doc.id,
          ...data,
        });
      });
      const pendingRequests: PasswordRecoveryRequest[] = requestsSnap.docs
        .map((doc) => {
          const data = doc.data() as Omit<PasswordRecoveryRequest, "id">;
          return {
            id: doc.id,
            ...data,
          };
        })
        .filter((req) => !allowedByEmail.has(req.email));
      const allowedRecoveries: AllowedRecovery[] = Array.from(allowedByEmail.values());
      pendingRequests.sort((a, b) => b.createdAt - a.createdAt);
      allowedRecoveries.sort((a, b) => b.createdAt - a.createdAt);
      const result = {
        pendingRequests,
        allowedRecoveries,
      };
      writer.write(encoder.encode(`data: ${JSON.stringify(result)}\n\n`));
    };

    await sendSnapshot();
    let interval = setInterval(sendSnapshot, 60000); // Poll every 60 seconds
    const close = () => {
      clearInterval(interval);
      writer.close();
    };
    // @ts-ignore
    req.signal?.addEventListener("abort", close);
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Fallback: normal GET (one-shot)
  return NextResponse.json(result);
}
