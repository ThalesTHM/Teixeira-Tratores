"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { adminFirestore } from "@/firebase/firebase-admin";
import { getUserFromSession } from "@/lib/auth";
import { z } from "zod";
import { projectFormSchema } from "./validation";

export const editProject = async (slug: string, data: any) => {
  const session = await getUserFromSession();
  if (!session) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    await projectFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid project data.' };
    }
    return { success: false, error: 'Validation error.' };
  }
  try {
    const projectsCollection = adminFirestore.collection('projects');
    const duplicateSnapshot = await projectsCollection
      .where('name', '==', data.name)
      .where('expectedBudget', '==', data.expectedBudget)
      .where('deadline', '==', data.deadline)
      .where('description', '==', data.description)
      .where('client', '==', data.client)
      .get();
    if (duplicateSnapshot.docs.length > 0 && !(duplicateSnapshot.docs.length === 1 && duplicateSnapshot.docs[0].data().slug === slug)) {
      return { success: false, error: 'A project with the same data already exists.' };
    }
    const querySnapshot = await projectsCollection.where('slug', '==', slug).limit(1).get();
    if (querySnapshot.empty) {
      return { success: false, error: 'Project not found.' };
    }
    const doc = querySnapshot.docs[0];
    const currentData = doc.data();
    if (
      currentData.name === data.name &&
      currentData.expectedBudget === data.expectedBudget &&
      currentData.deadline === data.deadline &&
      currentData.description === data.description &&
      currentData.client === data.client
    ) {
      return { success: false, error: 'No changes detected. Please modify at least one field.' };
    }
    
    const updateData: Record<string, any> = {};
    if (typeof data.name !== 'undefined') updateData.name = data.name;
    if (typeof data.expectedBudget !== 'undefined') updateData.expectedBudget = data.expectedBudget;
    if (typeof data.deadline !== 'undefined') updateData.deadline = data.deadline;
    if (typeof data.description !== 'undefined') updateData.description = data.description;
    if (typeof data.client !== 'undefined') updateData.client = data.client;
    await doc.ref.update(updateData);

    const name = currentData.name || "Projeto";
    const notification = {
      message: `Projeto "${name}" foi editado.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      slug: currentData.slug,
      priority: NotificationPriority.LOW,
      notificationSource: NotificationSource.PROJECT
    };
    const notificationRes = await NotificationsService.createNotification(notification);
    if (!notificationRes.success) {
      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error editing project:", error.message);
    }
    return { success: false, error: 'Error editing the project.' };
  }
};
