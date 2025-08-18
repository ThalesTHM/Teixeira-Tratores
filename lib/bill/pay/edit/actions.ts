"use server";

import { getUserFromSession } from "@/lib/auth";
import { billsToPayFormSchema } from "./validation";
import { z } from "zod";
import { adminFirestore } from "@/firebase/firebase-admin";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/notifications-service";

export const editBillToPay = async (slug: string, data: any) => {
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

    if (!billDoc.empty) {
      return { success: false, error: 'A bill with the same data already exists' };
    }

    const doc = billDoc.docs[0].data();

    if (JSON.stringify(doc) === JSON.stringify(data)) {
      return { success: false, error: "Bill not edited." };
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
    const billsCollection = adminFirestore.collection('billsToPay');
    const querySnapshot = await billsCollection.where('slug', '==', slug).limit(1).get();
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Bill not found' };
    }

    const bill = querySnapshot.docs[0];

    await bill.ref.update({
      name: data.name,
      price: data.price,
      expireDate: data.expireDate,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      supplier: data.supplier,
      description: data.description
    });

    const name = bill.data().name || "Conta a Pagar";

    const notification = {
      message: `Conta a Pagar "${name}" Foi Editada.`,
      role: NotificationRole.MANAGER,
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
