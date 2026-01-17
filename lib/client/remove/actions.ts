"use server";

import { ActionsHistoryRepository, ClientsRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const removeClient = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Cliente',
      details: `Tentativa de remover cliente sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        slug,
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const clientsRepository = new ClientsRepository();
    const clientData = await clientsRepository.findBySlug(slug);
    
    if (!clientData) {
      await actionsHistoryRepository.create({
        action: 'Falha na Remoção de Cliente',
        details: `Tentativa de remover cliente não encontrado.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug
        }
      });

      return { success: false, error: 'Client not found.' };
    }
    
    const name = clientData.name || "Cliente";
    await clientsRepository.delete(clientData.id);

    await actionsHistoryRepository.create({
      action: 'Cliente Removido',
      details: `Cliente "${name}" foi removido.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        clientId: clientData.id,
        clientName: name
      }
    });
    
    // Notification
    const notification = {
      message: `Cliente "${name}" foi excluído.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      priority: NotificationPriority.MEDIUM,
      notificationSource: NotificationSource.CLIENT
    };
    const notificationRes = await NotificationsService.createNotification(notification);
    if (!notificationRes.success) {
      await actionsHistoryRepository.create({
        action: 'Falha ao Criar Notificação',
        details: `Erro ao criar notificação para remoção de cliente "${name}". Erro: ${notificationRes.error}`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug,
          clientName: name,
          error: notificationRes.error
        }
      });

      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Cliente',
      details: `Erro ao remover cliente. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return { success: false, error: 'Error excluding the client.' };
  }
};
