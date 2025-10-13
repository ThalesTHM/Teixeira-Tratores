"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { SuppliersRepository } from "@/database/repositories/Repositories";
import { getUserFromSession } from "@/lib/auth";

export const removeSupplier = async (slug: string) => {
  const session = await getUserFromSession();
  if (!session) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const suppliersRepository = new SuppliersRepository();
    const supplierData = await suppliersRepository.findBySlug(slug);
    
    if (!supplierData) {
      return { success: false, error: 'Supplier not found.' };
    }
    
    const name = supplierData.name || "Fornecedor";
    await suppliersRepository.delete(supplierData.id);
    
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
      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error excluding the supplier.' };
  }
};
