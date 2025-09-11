"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/notifications-service";

import { adminAuth, adminFirestore } from "@/firebase/firebase-admin";
import { employeeFormSchema } from "./validation";
import { z } from "zod";
import { getUserFromSession } from "@/lib/auth";
import { getEmailInviteBySlug } from "../view/actions";
import { checkIfEmailIsAlreadyInUse } from "../utils";

const checkIfEmailInviteIsEqual = (emailInvite: any, data: any) => {
  return emailInvite.name === data.name &&
         emailInvite.email === data.email &&
         emailInvite.role === data.role &&
         emailInvite.pnumber === data.pnumber &&
         emailInvite.cpf === data.cpf &&
         emailInvite.address === data.address;
}

export const editEmailInvite = async (slug: string, data: any) => {
  const session = await getUserFromSession();

  if (!session) {
    return { success: false, error: "User Not Authenticated" };
  }

  try {
    await employeeFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      return {
        success: false,
        error: fieldErrors
      };
    }
  }

  const originalEmailInviteRes = await getEmailInviteBySlug(slug);
  
  if (!originalEmailInviteRes.success) {
    return { success: false, error: originalEmailInviteRes.error };
  }

  const originalEmailInvite = originalEmailInviteRes.emailInvite;

  if (checkIfEmailInviteIsEqual(originalEmailInvite, data)) {
    return { success: false, error: "An invite with the same data already exists" };
  }

  try {
    const isEmailAlreadyInUse = await checkIfEmailIsAlreadyInUse(data.email);

    if(isEmailAlreadyInUse){
      return { success: false, error: "Email is already in use" };
    }
  } catch (error) {
    if(error instanceof Error){
      console.error("Error checking existing email: ", error);
      return { success: false, error: error.message };
    }
    return { success: false, error: "Error checking existing email" };
  }

  try {
    const employeesCollection = adminFirestore.collection("emailInvites");
    const snapshot = await employeesCollection.where("slug", "==", slug).limit(1).get();
    
    if (snapshot.empty) {
      return { success: false, error: "Invite not found" };
    }
    
    const doc = snapshot.docs[0];
    
    await doc.ref.update({ 
      name: data.name,
      email: data.email,
      role: data.role,
      pnumber: data.pnumber,
      cpf: data.cpf,
      address: data.address,
      updatedAt: Date.now(),
      updatedBy: session.name
   });
  } catch (error) {
    if(error instanceof Error){
      console.error("Error updating email invite: ", error);
      return { success: false, error: error.message };
    }

    return { success: false, error: "Error editing invite" };
  }

  // Notification
  const name = data.name || "Funcionário";
  const notification = {
    message: `Convite referente ao funcionário "${name}" foi editado.`,
    role: NotificationRole.MANAGER,
    createdBy: session.name,
    priority: NotificationPriority.LOW,
    notificationSource: NotificationSource.EMAIL_INVITE
  };
  const notificationRes = await NotificationsService.createNotification(notification);
  if (!notificationRes.success) {
    return { success: false, error: 'Error creating notification' };
  }
  return { success: true, error: ""};
};
