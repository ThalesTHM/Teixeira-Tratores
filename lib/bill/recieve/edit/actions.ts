"use server";

import { ActionsHistoryRepository, BillsToReceiveRepository } from "@/database/repositories/Repositories";
import { billsToRecieveFormSchema } from "./validation";
import { z } from "zod";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";
import { SessionService } from "@/services/session/SessionService";

const sessionService = new SessionService();
const actionsHistoryRepository = new ActionsHistoryRepository();

export const editBillToReceive = async (slug: string, formData: any) => {
  const session = await sessionService.getUserFromSession();
  
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Conta a Receber',
      details: `Tentativa de editar conta a receber sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        formData,
        slug,
        authenticated: false
      }
    });

    return {
      success: false,
      error: "User Not Authenticated",
    };
  }

  const billsToReceiveRepository = new BillsToReceiveRepository();
  let billDoc;
  
  try {
    await billsToRecieveFormSchema.parseAsync(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;

      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Conta a Receber',
        details: `Falha na validação ao editar conta a receber "${formData.name}".`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...formData,
          slug,
          validationErrors: fieldErrors
        }
      });

      return {
        success: false,
        error: Object.values(fieldErrors).flat().join("; ") || "Validation error."
      };
    }

    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Conta a Receber',
      details: `Erro de validação ao editar conta a receber.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...formData,
        slug
      }
    });

    return {
      success: false,
      error: "Validation error."
    };
  }

  try {
    billDoc = await billsToReceiveRepository.findBySlug(slug);

    if (!billDoc) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Conta a Receber',
        details: `Tentativa de editar conta a receber não encontrada.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...formData,
          slug
        }
      });

      return { success: false, error: 'Bill not found.' };
    }

    if (JSON.stringify(billDoc) === JSON.stringify(formData)) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Conta a Receber',
        details: `Tentativa de editar conta a receber "${billDoc.name}" sem alterações.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...formData,
          slug
        }
      });

      return { success: false, error: 'No changes detected.' };
    }
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Conta a Receber',
      details: `Erro ao buscar conta a receber. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...formData,
        slug,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return {
      success: false,
      error: "Error fetching bill to receive."
    }; 
  }
  
  try {
    await billsToReceiveRepository.update(billDoc.id, formData);

    await actionsHistoryRepository.create({
      action: 'Conta a Receber Editada',
      details: `Conta a receber "${formData.name || billDoc.name}" foi editada.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...formData,
        slug
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error editing bill to receive:", error.message);
    }

    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Conta a Receber',
      details: `Erro ao editar conta a receber "${formData.name}". Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...formData,
        slug,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return {
      success: false,
      error: "Error editing bill to receive.",
    };
  }

  const name = billDoc.name || "Conta a Receber";

  const notification = {
      message: `Conta a Receber "${name}" Foi Editada.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      priority: NotificationPriority.LOW,
      notificationSource: NotificationSource.BILL_TO_RECEIVE
  }
  
  const notificationRes = await NotificationsService.createNotification(notification);

  if (!notificationRes.success) {
    console.error("Error creating notification:", notificationRes.error);

    await actionsHistoryRepository.create({
      action: 'Falha ao Criar Notificação',
      details: `Erro ao criar notificação para edição de conta a receber "${name}". Erro: ${notificationRes.error}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...formData,
        slug,
        error: notificationRes.error
      }
    });

    return {
        success: false,
        error: "Error creating notification"
    };
  }

  return {
    success: true,
    error: ""
  };
}
