"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { ProjectsRepository, ActionsHistoryRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const removeProject = async (slug: string) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Projeto',
      details: `Tentativa de remover projeto sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        slug,
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const projectsRepository = new ProjectsRepository();
    const projectData = await projectsRepository.findBySlug(slug);
    
    if (!projectData) {
      await actionsHistoryRepository.create({
        action: 'Falha na Remoção de Projeto',
        details: `Tentativa de remover projeto não encontrado.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          slug
        }
      });

      return { success: false, error: 'Project not found.' };
    }
    
    const name = projectData.name || "Projeto";
    await projectsRepository.delete(projectData.id);

    await actionsHistoryRepository.create({
      action: 'Projeto Removido',
      details: `Projeto "${name}" foi removido.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        project: projectData,
        slug
      }
    });
    
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
      await actionsHistoryRepository.create({
        action: 'Falha ao Criar Notificação',
        details: `Erro ao criar notificação para remoção de projeto "${name}". Erro: ${notificationRes.error}`,
        author: session,
        timestamp: new Date(),
        parameters: {
          project: projectData,
          slug,
          error: notificationRes.error
        }
      });

      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    await actionsHistoryRepository.create({
      action: 'Falha na Remoção de Projeto',
      details: `Erro ao remover projeto. Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        slug,
        error: error instanceof Error ? error.message : 'Error excluding the project'
      }
    });

    return { success: false, error: 'Error excluding the project.' };
  }
};
