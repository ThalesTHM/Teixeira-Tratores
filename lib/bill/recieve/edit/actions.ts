"use server";

import { BillsToReceiveRepository } from "@/database/repositories/Repositories";
import { billsToRecieveFormSchema } from "./validation";
import { z } from "zod";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";
import { SessionService } from "@/services/session/SessionService";

const sessionService = new SessionService();

export const editBillToReceive = async (slug: string, formData: any) => {
  const session = await sessionService.getUserFromSession();
  
  if (!session) {
    return {
      success: false,
      error: "User Not Authenticated",
    };
  }

  const billsToReceiveRepository = new BillsToReceiveRepository();
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
    billDoc = await billsToReceiveRepository.findBySlug(slug);

    if (!billDoc) {
      return { success: false, error: 'Bill not found.' };
    }

    if (JSON.stringify(billDoc) === JSON.stringify(formData)) {
      return { success: false, error: 'No changes detected.' };
    }
  } catch (error) {
        return {
          success: false,
          error: "Error fetching bill to receive."
    }; 
  }
  
  try {
    await billsToReceiveRepository.update(billDoc.id, formData);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error editing bill to receive:", error.message);
    }
    return {
      success: false,
      error: "Error editing bill to receive.",
    };
  }

  const name = billDoc.name || "Conta a Receber";

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
