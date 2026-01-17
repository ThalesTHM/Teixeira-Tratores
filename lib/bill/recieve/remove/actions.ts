"use server";

import { ActionsHistoryRepository, BillsToReceiveRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const removeBillToReceive = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Conta a Receber',
      details: `Tentativa de remover conta a receber sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
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
    billDoc = await billsToReceiveRepository.findBySlug(slug);

    if (!billDoc) {
      await actionsHistoryRepository.create({
        action: 'Falha na Remoção de Conta a Receber',
        details: `Tentativa de remover conta a receber não encontrada.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug
        }
      });

      return { success: false, error: 'Bill not found.' };
    }
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Conta a Receber',
      details: `Erro ao buscar conta a receber. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
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
    await billsToReceiveRepository.delete(billDoc.id);

    await actionsHistoryRepository.create({
      action: 'Conta a Receber Removida',
      details: `Conta a receber "${billDoc.name || 'Conta a Receber'}" foi removida.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        billId: billDoc.id,
        billName: billDoc.name
      }
    });
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Conta a Receber',
      details: `Erro ao remover conta a receber. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        billId: billDoc.id,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return {
      success: false,
      error: "Erro ao excluir conta a receber.",
    };
  }

  const name = billDoc.name || "Conta a Receber";
  
  const notification = {
    message: `Conta a Receber "${name}" Foi Excluída.`,
    role: NotificationRole.MANAGER,
    createdBy: session.name,
    priority: NotificationPriority.MEDIUM,
    notificationSource: NotificationSource.BILL_TO_RECEIVE
  };
  
  const notificationRes = await NotificationsService.createNotification(notification);
  
  if (!notificationRes.success) {
    await actionsHistoryRepository.create({
      action: 'Falha ao Criar Notificação',
      details: `Erro ao criar notificação para remoção de conta a receber "${name}". Erro: ${notificationRes.error}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        billId: billDoc.id,
        billName: name,
        error: notificationRes.error
      }
    });

    return {
      success: false,
      error: "Erro ao criar notificação.",
    };
  }

  return {
    success: true,
    error: ""
  };
}
