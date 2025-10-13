"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { ProjectsRepository } from "@/database/repositories/Repositories";
import { getUserFromSession } from "@/lib/auth";

export const removeProject = async (slug: string) => {
  const session = await getUserFromSession();
  if (!session) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const projectsRepository = new ProjectsRepository();
    const projectData = await projectsRepository.findBySlug(slug);
    
    if (!projectData) {
      return { success: false, error: 'Project not found.' };
    }
    
    const name = projectData.name || "Projeto";
    await projectsRepository.delete(projectData.id);
    
    // Notification
    const notification = {
      message: `Projeto "${name}" foi excluído.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      priority: NotificationPriority.MEDIUM,
      notificationSource: NotificationSource.PROJECT
    };
    const notificationRes = await NotificationsService.createNotification(notification);
    if (!notificationRes.success) {
      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    return { success: false, error: 'Error excluding the project.' };
  }
};
