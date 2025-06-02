import { adminDB } from "@/firebase/firebase-admin";
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

  writer.write(encoder.encode("retry: 3000\n\n"));

  const ref = adminDB.ref("/notifications");

  const callback = (snapshot: any) => {
    const rawData = snapshot.val();
    if (!rawData) return;

    const parsed = Object.keys(rawData)
      .filter((key: string) => rawData[key].cpf === "757.485.510-20")
      .map((key: string) => ({
        id: key,
        active: rawData[key].active,
        ...rawData[key],
      })
    );

    const payload = `data: ${JSON.stringify(parsed)}\n\n`;
    writer.write(encoder.encode(payload));
  };

  ref.on("value", callback);

  req.signal.addEventListener("abort", () => {
    ref.off("value", callback);
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
