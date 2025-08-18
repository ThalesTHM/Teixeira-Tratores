"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/notifications-service";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";
import { supplierFormSchema } from "../create/validation";
import { z } from "zod";

export const editSupplier = async (slug: string, data: any) => {
  const session = await getUserFromSession();
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
    const suppliersCollection = adminFirestore.collection('suppliers');
    const duplicateSnapshot = await suppliersCollection
      .where('name', '==', data.name)
      .where('cnpj', '==', data.cnpj)
      .where('address', '==', data.address)
      .where('pnumber', '==', data.pnumber)
      .get();
    if (duplicateSnapshot.docs.length > 0 && !(duplicateSnapshot.docs.length === 1 && duplicateSnapshot.docs[0].data().slug === slug)) {
      return { success: false, error: 'A supplier with the same data already exists.' };
    }
    const querySnapshot = await suppliersCollection.where('slug', '==', slug).limit(1).get();
    if (querySnapshot.empty) {
      return { success: false, error: 'Supplier not found.' };
    }
    const doc = querySnapshot.docs[0];
    const currentData = doc.data();
    if (
      currentData.name === data.name &&
      currentData.cnpj === data.cnpj &&
      currentData.address === data.address &&
      currentData.pnumber === data.pnumber
    ) {
      return { success: false, error: 'No changes detected. Please modify at least one field.' };
    }
    await doc.ref.update({
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
