"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/notifications-service";

import { adminAuth, adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";

export const removeEmployee = async (slug: string) => {
  const session = await getUserFromSession()

  if(!session){
    return {success: false, error: 'User not authenticated.'}
  }

  let employeesCollection;
  let snapshot;
  let doc;
  
  try {
    employeesCollection = adminFirestore.collection("users");
    snapshot = await employeesCollection.where("slug", "==", slug).limit(1).get();
    doc = snapshot.docs[0]
    
    if (snapshot.empty) {
      return { success: false, error: "Employee Not Found" };
    }
  } catch (error) {
    return { success: false, error: "Error Fetching Employee" };
  }
  
  try {
    const email = doc.data().email;
    const user = await adminAuth.getUserByEmail(email);
    if (user) {
      await adminAuth.deleteUser(user.uid);
    }
  } catch (error) {
    return { success: false, error: "Error Deleting Employee Authentication" };
  }

  try {
    const name = doc.data().name || "Funcionário";
    await doc.ref.delete();
    // Notification
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
