import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { adminFirestore } from "@/firebase/firebase-admin";
import type { NextRequest } from "next/server";

interface PasswordRecoveryRequest {
  id: string;
  email: string;
  createdAt: number;
  closed: boolean;
}

export async function GET(req: NextRequest) {
  // Accept header may contain multiple values
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/event-stream")) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Auth check
    const user = await getUserFromSession();
    console.log("user: ", user);
    
    if (!user || user.role !== "admin") {
      writer.write(
        encoder.encode(
          `event: error\ndata: ${JSON.stringify({ error: "Unauthorized" })}\n\n`
        )
      );
      writer.close();
      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }
    

    // Initial send
    const sendSnapshot = async () => {
      const snapshot = await adminFirestore
        .collection("passwordRecoveryRequests")
        .get();
      const requests: PasswordRecoveryRequest[] = snapshot.docs.map((doc) => {
        const data = doc.data() as Omit<PasswordRecoveryRequest, "id">;
        return {
          id: doc.id,
          ...data,
        };
      });
      requests.sort((a, b) => b.createdAt - a.createdAt);
      console.log('requests: ', requests);
      
      writer.write(encoder.encode(`data: ${JSON.stringify(requests)}\n\n`));
    };

    await sendSnapshot();

    // Polling for changes every 2s (Firestore Admin SDK does not support real-time listeners)
    let interval = setInterval(sendSnapshot, 2000);

    // Close connection on client disconnect
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
  const user = await getUserFromSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snapshot = await adminFirestore
    .collection("passwordRecoveryRequests")
    .where("closed", "==", false)
    .get();
  const requests: PasswordRecoveryRequest[] = snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<PasswordRecoveryRequest, "id">;
    return {
      id: doc.id,
      ...data,
    };
  });
  requests.sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json(requests);
}
