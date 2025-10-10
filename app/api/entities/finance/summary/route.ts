import { adminFirestore } from "@/firebase/firebase-admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

interface Bill {
  id: string;
  price: number;
  createdAt: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  description?: string;
}

interface Project {
  id: string;
  expectedBudget: number;
  name: string;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
}

interface FinanceSummary {
  billsToPay: number;
  billsToReceive: number;
  totalPay: number;
  totalReceive: number;
  projectPricing: number;
  grossProfit: number;
  clients: number;
  projects: number;
  suppliers: number;
  employees: number;
}

export async function GET() {
  const headersList = await headers();
  const accept = headersList.get("accept");

  if (!accept?.includes("text/event-stream")) {
    return NextResponse.json({ error: "Accepts SSE requests only" }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      let isActive = true;
      let updateInProgress = false;
      let updateQueued = false;
      const encoder = new TextEncoder();

      const processUpdate = async () => {
        if (!isActive || updateInProgress) {
          updateQueued = true;
          return;
        }

        updateInProgress = true;
        updateQueued = false;

        try {
          const [
            billsToPaySnap, 
            billsToReceiveSnap, 
            projectsSnap, 
            clientsSnap, 
            suppliersSnap, 
            employeesSnap
          ] = await Promise.all([
            adminFirestore.collection("billsToPay").get(),
            adminFirestore.collection("billsToReceive").get(),
            adminFirestore.collection("projects").get(),
            adminFirestore.collection("clients").get(),
            adminFirestore.collection("suppliers").get(),
            adminFirestore.collection("employees").get(),
          ]);

          const billsToPayArr = billsToPaySnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            price: doc.data().price || 0
          })) as Bill[];

          const totalPay = billsToPayArr.reduce((sum, bill) => sum + bill.price, 0);

          const billsToReceiveArr = billsToReceiveSnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            price: doc.data().price || 0
          })) as Bill[];

          const totalReceive = billsToReceiveArr.reduce((sum, bill) => sum + bill.price, 0);

          const projectsArr = projectsSnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            expectedBudget: doc.data().expectedBudget || 0
          })) as Project[];

          const projectPricing = projectsArr.reduce((sum, project) => 
            sum + project.expectedBudget, 0);

          const data: FinanceSummary = {
            billsToPay: billsToPayArr.length,
            billsToReceive: billsToReceiveArr.length,
            totalPay,
            totalReceive,
            projectPricing,
            grossProfit: totalReceive - totalPay,
            clients: clientsSnap.size,
            projects: projectsSnap.size,
            suppliers: suppliersSnap.size,
            employees: employeesSnap.size,
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error) {
          if (isActive) {
            controller.error(error);
            isActive = false;
          }
        } finally {
          updateInProgress = false;
          if (updateQueued) {
            setTimeout(processUpdate, 0);
          }
        }
      };

      const debouncedUpdate = (() => {
        let timeoutId: NodeJS.Timeout | undefined;
        return () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(processUpdate, 500);
        };
      })();

      processUpdate();

      const unsubscribers = [
        adminFirestore.collection("billsToPay").onSnapshot(debouncedUpdate),
        adminFirestore.collection("billsToReceive").onSnapshot(debouncedUpdate),
        adminFirestore.collection("projects").onSnapshot(debouncedUpdate),
        adminFirestore.collection("clients").onSnapshot(debouncedUpdate),
        adminFirestore.collection("suppliers").onSnapshot(debouncedUpdate),
        adminFirestore.collection("employees").onSnapshot(debouncedUpdate),
      ];

      return () => {
        isActive = false;
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    }
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
