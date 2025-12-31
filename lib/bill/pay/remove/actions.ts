"use server";

import { getUserFromSession } from '@/lib/auth';
import { BillsToPayRepository } from '@/database/repositories/Repositories';
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from '@/services/notifications/NotificationsService';

export const removeBillToPay = async (slug: string) => {
    const sessionService = new SessionService();
    const session = await sessionService.getUserFromSession();  if (!session) {
    return { success: false, error: 'User not authenticated' };
  }

  const billsToPayRepository = new BillsToPayRepository();
  let billDoc;

  try {
    billDoc = await billsToPayRepository.findBySlug(slug);
      
    if (!billDoc) {
      return { success: false, error: 'Bill not found' };
    }

    await billsToPayRepository.delete(billDoc.id);

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
      return {
        success: false,
        error: "Erro ao criar notificação.",
      };
    }

    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error removing the bill' };
  }
};