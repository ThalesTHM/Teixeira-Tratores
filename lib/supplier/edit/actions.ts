"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { SuppliersRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { supplierFormSchema } from "../create/validation";
import { z } from "zod";

export const editSupplier = async (slug: string, data: any) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    await supplierFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid supplier data.' };
    }
    return { success: false, error: 'Validation error.' };
  }
  try {
    const suppliersRepository = new SuppliersRepository();
    
    // Check for duplicates
    const allSuppliers = await suppliersRepository.findAll();
    const duplicateSupplier = allSuppliers.find(supplier => 
      supplier.name === data.name &&
      supplier.cnpj === data.cnpj &&
      supplier.address === data.address &&
      supplier.pnumber === data.pnumber &&
      supplier.slug !== slug
    );
    
    if (duplicateSupplier) {
      return { success: false, error: 'A supplier with the same data already exists.' };
    }
    
    const currentData = await suppliersRepository.findBySlug(slug);
    
    if (!currentData) {
      return { success: false, error: 'Supplier not found.' };
    }
    
    if (
      currentData.name === data.name &&
      currentData.cnpj === data.cnpj &&
      currentData.address === data.address &&
      currentData.pnumber === data.pnumber
    ) {
      return { success: false, error: 'No changes detected. Please modify at least one field.' };
    }
    
    await suppliersRepository.update(currentData.id, {
      name: data.name,
      cnpj: data.cnpj,
      address: data.address,
      pnumber: data.pnumber
    });
    
    // Notification
    const name = currentData.name || "Fornecedor";
    const notification = {
      message: `Fornecedor "${name}" foi editado.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      slug: currentData.slug,
      priority: NotificationPriority.LOW,
      notificationSource: NotificationSource.SUPPLIER
    };
    const notificationRes = await NotificationsService.createNotification(notification);
    if (!notificationRes.success) {
      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error editing the supplier.' };
  }
};
