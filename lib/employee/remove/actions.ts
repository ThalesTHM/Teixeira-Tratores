"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { EmployeeService } from "@/services/employee/EmployeeService";
import { SessionService } from "@/services/session/SessionService";
import { ActionsHistoryRepository } from "@/database/repositories/Repositories";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const removeEmployee = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession()

  if(!session){
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Funcionário',
      details: `Tentativa de remover funcionário sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        slug,
        authenticated: false
      }
    });

    return {success: false, error: 'User not authenticated.'}
  }

  // Get employee data before deletion for notification
  const employeeResult = await EmployeeService.getEmployeeBySlug(slug);
  if (!employeeResult.success) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Funcionário',
      details: `Tentativa de remover funcionário não encontrado.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: employeeResult.error
      }
    });

    return { success: false, error: employeeResult.error || "Employee Not Found" };
  }

  const employee = employeeResult.employee!;
  const name = employee.name || "Funcionário";

  const deleteResult = await EmployeeService.deleteEmployee(slug);
  if (!deleteResult.success) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Funcionário',
      details: `Erro ao remover funcionário "${employee.name}". Erro: ${deleteResult.error || "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        employee,
        slug,
        error: deleteResult.error
      }
    });

    return { success: false, error: deleteResult.error || "Error Deleting Employee" };
  }

  await actionsHistoryRepository.create({
    action: 'Funcionário Removido',
    details: `Funcionário "${employee.name}" foi removido.`,
    author: session,
    timestamp: new Date(),
    parameters: {
      employee,
      slug
    }
  });

  // Notification
  const notification = {
    message: `Funcionário "${name}" foi excluído.`,
    role: NotificationRole.MANAGER,
    createdBy: session.name,
    priority: NotificationPriority.MEDIUM,
    notificationSource: NotificationSource.EMPLOYEE
  };
  const notificationRes = await NotificationsService.createNotification(notification);
  if (!notificationRes.success) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Criar Notificação',
      details: `Erro ao criar notificação para remoção de funcionário "${employee.name}". Erro: ${notificationRes.error}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        employee,
        slug,
        error: notificationRes.error
      }
    });

    return { success: false, error: 'Error creating notification' };
  }
  return { success: true };
};
