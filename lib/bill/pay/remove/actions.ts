"use server";

import { SessionService } from "@/services/session/SessionService";
import { ActionsHistoryRepository, BillsToPayRepository } from '@/database/repositories/Repositories';
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from '@/services/notifications/NotificationsService';

const actionsHistoryRepository = new ActionsHistoryRepository();
const sessionService = new SessionService();

export const removeBillToPay = async (slug: string) => {
  const session = await sessionService.getUserFromSession();

  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Conta a Pagar',
      details: `Tentativa de remover conta a pagar sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        slug,
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated' };
  }

  const billsToPayRepository = new BillsToPayRepository();
  let billDoc;

  try {
    billDoc = await billsToPayRepository.findBySlug(slug);
      
    if (!billDoc) {
      await actionsHistoryRepository.create({
        action: 'Falha na Remoção de Conta a Pagar',
        details: `Tentativa de remover conta a pagar não encontrada.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug
        }
      });

      return { success: false, error: 'Bill not found' };
    }

    await billsToPayRepository.delete(billDoc.id);

    await actionsHistoryRepository.create({
      action: 'Conta a Pagar Removida',
      details: `Conta a pagar "${billDoc.name || 'Conta a Pagar'}" foi removida.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        billId: billDoc.id,
        billName: billDoc.name
      }
    });

    const name = billDoc.name || 'Conta a Pagar';

    const notification = {
      message: `Conta a Pagar "${name}" Foi Excluída.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      priority: NotificationPriority.MEDIUM,
      notificationSource: NotificationSource.BILL_TO_PAY
    };
    
    const notificationRes = await NotificationsService.createNotification(notification);
    
    if (!notificationRes.success) {
      await actionsHistoryRepository.create({
        action: 'Falha ao Criar Notificação',
        details: `Erro ao criar notificação para remoção de conta a pagar "${name}". Erro: ${notificationRes.error}`,
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

    return { success: true, error: '' };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Conta a Pagar',
      details: `Erro ao remover conta a pagar. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return { success: false, error: 'Error removing the bill' };
  }
};