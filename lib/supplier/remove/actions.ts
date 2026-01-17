"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { SuppliersRepository, ActionsHistoryRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const removeSupplier = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Fornecedor',
      details: `Tentativa de remover fornecedor sem autenticação.`,
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
    const suppliersRepository = new SuppliersRepository();
    const supplierData = await suppliersRepository.findBySlug(slug);
    
    if (!supplierData) {
      await actionsHistoryRepository.create({
        action: 'Falha na Remoção de Fornecedor',
        details: `Tentativa de remover fornecedor não encontrado.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug
        }
      });

      return { success: false, error: 'Supplier not found.' };
    }
    
    const name = supplierData.name || "Fornecedor";
    await suppliersRepository.delete(supplierData.id);

    await actionsHistoryRepository.create({
      action: 'Fornecedor Removido',
      details: `Fornecedor "${name}" foi removido.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        supplier: supplierData,
        slug
      }
    });
    
    // Notification
    const notification = {
      message: `Fornecedor "${name}" foi excluído.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      priority: NotificationPriority.MEDIUM,
      notificationSource: NotificationSource.SUPPLIER
    };
    const notificationRes = await NotificationsService.createNotification(notification);
    if (!notificationRes.success) {
      await actionsHistoryRepository.create({
        action: 'Falha ao Criar Notificação',
        details: `Erro ao criar notificação para remoção de fornecedor "${name}". Erro: ${notificationRes.error}`,
        author: session,
        timestamp: new Date(),
        parameters: {
          supplier: supplierData,
          slug,
          error: notificationRes.error
        }
      });

      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Fornecedor',
      details: `Erro ao remover fornecedor. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: error instanceof Error ? error.message : 'Error excluding the supplier'
      }
    });

    return { success: false, error: 'Error excluding the supplier.' };
  }
};
