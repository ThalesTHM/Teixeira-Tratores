"use server";

import { BillsToReceiveRepository } from "@/database/repositories/Repositories";
import { getUserFromSession } from "@/lib/auth";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

export const removeBillToReceive = async (slug: string) => {
  const session = await getUserFromSession();

  if (!session) {
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
      return { success: false, error: 'Bill not found.' };
    }
  } catch (error) {
    return {
      success: false,
      error: "Error fetching bill to receive."
    };
  }

  try {
    await billsToReceiveRepository.delete(billDoc.id);
  } catch (error) {
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
