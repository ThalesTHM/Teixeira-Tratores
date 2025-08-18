"use server";

import { adminFirestore } from "@/firebase/firebase-admin";
import { billsToRecieveFormSchema } from "./validation";
import { z } from "zod";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/notifications-service";
import { getUserFromSession } from "@/lib/auth";

export const editBillToReceive = async (slug: string, formData: any) => {
  const session = await getUserFromSession();
  
  if (!session) {
    return {
      success: false,
      error: "User Not Authenticated",
    };
  }

  let billDoc;
  
  try {
    await billsToRecieveFormSchema.parseAsync(formData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
          return {
            success: false,
            error: Object.values(fieldErrors).flat().join("; ") || "Validation error."
      };
    }
        return {
          success: false,
          error: "Validation error."
    };
  }

  try {
    billDoc = await adminFirestore.collection("billsToReceive")
    .where("slug", "==", slug)
    .get();

    if (billDoc.empty) {
      return { success: false, error: 'Bill not found.' };
    }

    const doc = billDoc.docs[0].data();

    if (JSON.stringify(doc) === JSON.stringify(formData)) {
      return { success: false, error: 'No changes detected.' };
    }
  } catch (error) {
        return {
          success: false,
          error: "Error fetching bill to receive."
    }; 
  }
  
  try {
    const billCollection = adminFirestore.collection("billsToReceive");
    const snapshot = await billCollection.where("slug", "==", slug).limit(1).get();
    console.log(slug);
    
    if (snapshot.empty) {
      return { success: false, error: 'Bill not found.' };
    }
    const billDoc = snapshot.docs[0].ref;
    
    billDoc.update({
      ...formData,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error editing bill to receive:", error.message);
    }
    return {
      success: false,
      error: "Error editing bill to receive.",
    };
  }

  const name = billDoc.docs[0].data().name || "Conta a Receber";

  const notification = {
      message: `Conta a Receber "${name}" Foi Editada.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      priority: NotificationPriority.LOW,
      notificationSource: NotificationSource.BILL_TO_RECEIVE
  }
  
  const notificationRes = await NotificationsService.createNotification(notification);

  if (!notificationRes.success) {
    console.error("Error creating notification:", notificationRes.error);
    return {
        success: false,
        error: "Error creating notification"
    };
  }

  return {
    success: true,
    error: ""
  };
}
