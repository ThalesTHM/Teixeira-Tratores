"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { adminAuth, adminFirestore } from "@/firebase/firebase-admin";
import { SessionService } from "@/services/session/SessionService";

export const removeEmailInvite = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession()

  if(!session){
    return {success: false, error: 'User not authenticated.'}
  }

  let emailInvitesCollection;
  let snapshot;
  let doc;
  
  try {
    emailInvitesCollection = adminFirestore.collection("emailInvites");
    snapshot = await emailInvitesCollection.where("slug", "==", slug).limit(1).get();
    doc = snapshot.docs[0]
    
    if (snapshot.empty) {
      return { success: false, error: "Email invite not found" };
    }
  } catch (error) {
    return { success: false, error: "Error fetching email invite" };
  }

  try {
    await doc.ref.delete();
    // Notification
    const name = doc.data().name || "Funcionário";

    const notification = {
      message: `Funcionário "${name}" foi excluído.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      priority: NotificationPriority.MEDIUM,
      notificationSource: NotificationSource.EMPLOYEE
    };
    const notificationRes = await NotificationsService.createNotification(notification);
    if (!notificationRes.success) {
      return { success: false, error: 'Error creating notification' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error Deleting Employee Document" };
  }
};
