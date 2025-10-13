"use server";

import { BillsToPayRepository } from "@/database/repositories/Repositories";
import { getUserFromSession } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest, {params}: { params: { slug: string } }) {
  const session = await getUserFromSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const slug = (await params).slug;
  const billsToPayRepository = new BillsToPayRepository();

  const unsubscribe = billsToPayRepository.subscribeBySlug(slug, (bill) => {
    try {
      const payload = `data: ${JSON.stringify(bill)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch (error) {
      console.error('Error sending bill to pay data:', error);
      writer.write(encoder.encode(`data: ${JSON.stringify(null)}\n\n`));
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
