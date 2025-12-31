"use server";

import { EmployeeService, Employee } from "@/services/employee/EmployeeService";

export async function viewEmployees(): Promise<{
  success: true; employees: Employee[];
} | {
  success: false; error: string;
}> {
  const result = await EmployeeService.getAllEmployees();
  if (!result.success) {
    return { success: false, error: result.error || "Erro Ao Buscar Funcionários" };
  }
  return { success: true, employees: result.employees! };
}

export async function getEmployeeBySlug(slug: string): Promise<{
  success: true; employee: Employee, error: string;
} | {
  success: false; error: string;
}> {
  const result = await EmployeeService.getEmployeeBySlug(slug);
  if (!result.success) {
    return { success: false, error: result.error || "Funcionário Não Encontrado" };
  }
  return { success: true, employee: result.employee!, error: "" };
}