"use server";

import { getUserFromSession } from '@/lib/auth';
import { adminFirestore } from '@/firebase/firebase-admin';
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from '@/services/notifications/NotificationsService';

export const removeBillToPay = async (slug: string) => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated' };
  }

  let billDoc;

  try {
    const billsCollection = adminFirestore.collection('billsToPay');
    billDoc = await billsCollection
      .where('slug', '==', slug)
      .get();
      
    if (billDoc.empty) {
      return { success: false, error: 'Bill not found' };
    }

    const doc = billDoc.docs[0];
    await doc.ref.delete();

    const name = doc.data().name || 'Conta a Pagar';

    const notification = {
      message: `Conta a Receber "${name}" Foi Excluída.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      priority: NotificationPriority.MEDIUM,
      notificationSource: NotificationSource.BILL_TO_RECEIVE
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