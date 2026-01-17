"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { EmployeeService } from "@/services/employee/EmployeeService";
import { employeeFormSchema } from "./validation";
import { z } from "zod";
import { SessionService } from "@/services/session/SessionService";
import { ActionsHistoryRepository } from "@/database/repositories/Repositories";

const actionsHistoryRepository = new ActionsHistoryRepository();

const checkIfEmployeeIsEqual = (originalEmployee: any, data: any) => {
  return originalEmployee.name === data.name &&
         originalEmployee.email === data.email &&
         originalEmployee.role === data.role &&
         originalEmployee.pnumber === data.pnumber &&
         originalEmployee.cpf === data.cpf &&
         originalEmployee.address === data.address;
}

export const editEmployee = async (slug: string, data: any) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Funcionário',
      details: `Tentativa de editar funcionário sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        data,
        slug,
        authenticated: false
      }
    });

    return { success: false, error: "User Not Authenticated" };
  }

  try {
    await employeeFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;

      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Funcionário',
        details: `Falha na validação ao editar funcionário "${data.name}".`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug,
          validationErrors: fieldErrors
        }
      });

      return {
        success: false,
        error: fieldErrors
      };
    }
  }

  const originalEmployeeRes = await EmployeeService.getEmployeeBySlug(slug);
  
  if (!originalEmployeeRes.success) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Funcionário',
      details: `Tentativa de editar funcionário não encontrado.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug,
        error: originalEmployeeRes.error
      }
    });

    return { success: false, error: originalEmployeeRes.error };
  }

  const originalEmployee = originalEmployeeRes.employee!;

  if (checkIfEmployeeIsEqual(originalEmployee, data)) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Funcionário',
      details: `Tentativa de editar funcionário "${originalEmployee.name}" sem alterações.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug
      }
    });

    return { success: false, error: "An employee with the same data already exists." };
  }

  if(originalEmployee.email !== data.email){
    const emailInUse = await EmployeeService.checkEmailExists(data.email);
    if (emailInUse) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Funcionário',
        details: `Tentativa de editar funcionário com email já em uso: ${data.email}`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: "Email already in use" };
    }
  }

  if(originalEmployee.email !== data.email) {
    const authUpdateResult = await EmployeeService.updateEmployeeAuth(session?.uid as string, data.email);
    if (!authUpdateResult.success) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Funcionário',
        details: `Erro ao atualizar email do funcionário. Erro: ${authUpdateResult.error || "Erro desconhecido"}`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug,
          error: authUpdateResult.error
        }
      });

      return { success: false, error: authUpdateResult.error || "Error Updating User Email" };
    }
  }

  const updateResult = await EmployeeService.updateEmployee(slug, data);
  if (!updateResult.success) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Funcionário',
      details: `Erro ao editar funcionário "${data.name}". Erro: ${updateResult.error || "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug,
        error: updateResult.error
      }
    });

    return { success: false, error: updateResult.error || "Error Editing Employee" };
  }

  await actionsHistoryRepository.create({
    action: 'Funcionário Editado',
    details: `Funcionário "${data.name}" foi editado.`,
    author: session,
    timestamp: new Date(),
    parameters: {
      ...data,
      slug
    }
  });

  // Notification
  const name = originalEmployee.name || "Funcionário";
  const notification = {
    message: `Funcionário "${name}" foi editado.`,
    role: NotificationRole.MANAGER,
    slug: originalEmployee.slug,
    createdBy: session.name,
    priority: NotificationPriority.LOW,
    notificationSource: NotificationSource.EMPLOYEE
  };
  const notificationRes = await NotificationsService.createNotification(notification);
  if (!notificationRes.success) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Criar Notificação',
      details: `Erro ao criar notificação para edição de funcionário "${name}". Erro: ${notificationRes.error}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug,
        error: notificationRes.error
      }
    });

    return { success: false, error: 'Error creating notification' };
  }
  return { success: true, error: ""};
};
