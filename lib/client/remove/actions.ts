"use server";

import { ClientsRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

export const removeClient = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const clientsRepository = new ClientsRepository();
    const clientData = await clientsRepository.findBySlug(slug);
    
    if (!clientData) {
      return { success: false, error: 'Client not found.' };
    }
    
    const name = clientData.name || "Cliente";
    await clientsRepository.delete(clientData.id);
    
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
      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error excluding the client.' };
  }
};
