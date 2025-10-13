import { 
  BillsToPayRepository, 
  BillsToReceiveRepository, 
  ProjectsRepository, 
  ClientsRepository, 
  SuppliersRepository, 
  UsersRepository 
} from "@/database/repositories/Repositories";
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
          const billsToPayRepository = new BillsToPayRepository();
          const billsToReceiveRepository = new BillsToReceiveRepository();
          const projectsRepository = new ProjectsRepository();
          const clientsRepository = new ClientsRepository();
          const suppliersRepository = new SuppliersRepository();
          const usersRepository = new UsersRepository();

          const [
            billsToPayArr, 
            billsToReceiveArr, 
            projectsArr, 
            clientsArr, 
            suppliersArr, 
            employeesArr
          ] = await Promise.all([
            billsToPayRepository.findAll(),
            billsToReceiveRepository.findAll(),
            projectsRepository.findAll(),
            clientsRepository.findAll(),
            suppliersRepository.findAll(),
            usersRepository.findAll(),
          ]);

          const totalPay = billsToPayArr.reduce((sum, bill) => sum + (bill.price || 0), 0);
          const totalReceive = billsToReceiveArr.reduce((sum, bill) => sum + (bill.price || 0), 0);
          const projectPricing = projectsArr.reduce((sum, project) => 
            sum + (project.expectedBudget || 0), 0);

          const data: FinanceSummary = {
            billsToPay: billsToPayArr.length,
            billsToReceive: billsToReceiveArr.length,
            totalPay,
            totalReceive,
            projectPricing,
            grossProfit: totalReceive - totalPay,
            clients: clientsArr.length,
            projects: projectsArr.length,
            suppliers: suppliersArr.length,
            employees: employeesArr.length,
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

      // Poll for updates every 5 seconds
      const interval = setInterval(debouncedUpdate, 5000);

      return () => {
        isActive = false;
        clearInterval(interval);
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
