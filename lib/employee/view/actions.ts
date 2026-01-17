"use server";

import { EmployeeService, Employee } from "@/services/employee/EmployeeService";
import { SessionService } from "@/services/session/SessionService";
import { ActionsHistoryRepository } from "@/database/repositories/Repositories";

const actionsHistoryRepository = new ActionsHistoryRepository();

export async function viewEmployees(): Promise<{
  success: true; employees: Employee[];
} | {
  success: false; error: string;
}> {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Funcionários',
      details: `Tentativa de visualizar funcionários sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        authenticated: false
      }
    });

    return { success: false, error: "User Not Authenticated" };
  }

  const result = await EmployeeService.getAllEmployees();
  if (!result.success) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Funcionários',
      details: `Erro ao buscar funcionários. Erro: ${result.error || "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        error: result.error
      }
    });

    return { success: false, error: result.error || "Erro Ao Buscar Funcionários" };
  }

  await actionsHistoryRepository.create({
    action: 'Funcionários Visualizados',
    details: `Funcionários foram visualizados.`,
    author: session,
    timestamp: new Date(),
    parameters: {
      employeesCount: result.employees?.length || 0
    }
  });

  return { success: true, employees: result.employees! };
}

export async function getEmployeeBySlug(slug: string): Promise<{
  success: true; employee: Employee, error: string;
} | {
  success: false; error: string;
}> {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Funcionário',
      details: `Tentativa de visualizar funcionário sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        slug,
        authenticated: false
      }
    });

    return { success: false, error: "User Not Authenticated" };
  }

  const result = await EmployeeService.getEmployeeBySlug(slug);
  if (!result.success) {
    await actionsHistoryRepository.create({
      action: 'Falha na Visualização de Funcionário',
      details: `Tentativa de visualizar funcionário não encontrado.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: result.error
      }
    });

    return { success: false, error: result.error || "Funcionário Não Encontrado" };
  }

  await actionsHistoryRepository.create({
    action: 'Funcionário Visualizado',
    details: `Funcionário "${result.employee?.name}" foi visualizado.`,
    author: session,
    timestamp: new Date(),
    parameters: {
      slug,
      employeeName: result.employee?.name
    }
  });

  return { success: true, employee: result.employee!, error: "" };
}