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

      // Initialize repositories
      const billsToPayRepository = new BillsToPayRepository();
      const billsToReceiveRepository = new BillsToReceiveRepository();
      const projectsRepository = new ProjectsRepository();
      const clientsRepository = new ClientsRepository();
      const suppliersRepository = new SuppliersRepository();
      const usersRepository = new UsersRepository();

      // Store current data
      let billsToPayData: any[] = [];
      let billsToReceiveData: any[] = [];
      let projectsData: any[] = [];
      let clientsData: any[] = [];
      let suppliersData: any[] = [];
      let employeesData: any[] = [];

      const calculateAndSendSummary = () => {
        if (!isActive) return;

        try {
          const totalPay = billsToPayData.reduce((sum, bill) => sum + (bill.price || 0), 0);
          const totalReceive = billsToReceiveData.reduce((sum, bill) => sum + (bill.price || 0), 0);
          const projectPricing = projectsData.reduce((sum, project) => 
            sum + (project.expectedBudget || 0), 0);

          const data: FinanceSummary = {
            billsToPay: billsToPayData.length,
            billsToReceive: billsToReceiveData.length,
            totalPay,
            totalReceive,
            projectPricing,
            grossProfit: totalReceive - totalPay,
            clients: clientsData.length,
            projects: projectsData.length,
            suppliers: suppliersData.length,
            employees: employeesData.length,
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (error) {
          if (isActive) {
            controller.error(error);
            isActive = false;
          }
        }
      };

      // Set up real-time subscriptions - INSTANT UPDATES
      const unsubscribeBillsToPay = billsToPayRepository.subscribeToAll((data) => {
        if (isActive) {
          billsToPayData = data;
          calculateAndSendSummary();
        }
      });

      const unsubscribeBillsToReceive = billsToReceiveRepository.subscribeToAll((data) => {
        if (isActive) {
          billsToReceiveData = data;
          calculateAndSendSummary();
        }
      });

      const unsubscribeProjects = projectsRepository.subscribeToAll((data) => {
        if (isActive) {
          projectsData = data;
          calculateAndSendSummary();
        }
      });

      const unsubscribeClients = clientsRepository.subscribeToAll((data) => {
        if (isActive) {
          clientsData = data;
          calculateAndSendSummary();
        }
      });

      const unsubscribeSuppliers = suppliersRepository.subscribeToAll((data) => {
        if (isActive) {
          suppliersData = data;
          calculateAndSendSummary();
        }
      });

      const unsubscribeEmployees = usersRepository.subscribeToAll((data) => {
        if (isActive) {
          employeesData = data;
          calculateAndSendSummary();
        }
      });

      return () => {
        isActive = false;
        unsubscribeBillsToPay();
        unsubscribeBillsToReceive();
        unsubscribeProjects();
        unsubscribeClients();
        unsubscribeSuppliers();
        unsubscribeEmployees();
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
