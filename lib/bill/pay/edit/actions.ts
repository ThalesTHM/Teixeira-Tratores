"use server";

import { getUserFromSession } from "@/lib/auth";
import { billsToPayFormSchema } from "./validation";
import { z } from "zod";
import { BillsToPayRepository } from "@/database/repositories/Repositories";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

export const editBillToPay = async (slug: string, data: any) => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: 'User not authenticated' };
  }

  const billsToPayRepository = new BillsToPayRepository();
  let billDoc;

  try {
    billDoc = await billsToPayRepository.findBySlug(slug);

    if (!billDoc) {     
      return { success: false, error: 'Bill not found' };
    }

    if (billDoc.name === data.name &&
      billDoc.price === data.price &&
      billDoc.expireDate === data.expireDate &&
      billDoc.paymentMethod === data.paymentMethod &&
      billDoc.paymentStatus === data.paymentStatus &&
      billDoc.supplier === data.supplier &&
      billDoc.description === data.description
    ) {
      return { success: false, error: 'A bill with the same data already exists' };
    }
  } catch (error) {
    return { success: false, error: 'Error checking existing bill data' };
  }

  try {
    await billsToPayFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid bill data' };
    }
    return { success: false, error: 'Validation error' };
  }

  try {
    const updateData = {
      name: data.name,
      price: data.price,
      expireDate: data.expireDate,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      supplier: data.supplier,
      description: data.description
    };

    await billsToPayRepository.update(billDoc.id, updateData);

    const name = billDoc.name || "Conta a Pagar";

    const notification = {
      message: `Conta a Pagar "${name}" Foi Editada.`,
      role: NotificationRole.MANAGER,
      slug: slug,
      createdBy: session.name,
      priority: NotificationPriority.LOW,
      notificationSource: NotificationSource.BILL_TO_PAY
    };

    const notificationRes = await NotificationsService.createNotification(notification);

    if (!notificationRes.success) {
      return { success: false, error: 'Error creating notification' };
    }

    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error editing the bill' };
  }
};
