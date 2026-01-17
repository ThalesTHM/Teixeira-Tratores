"use server";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

import { ProjectsRepository, ActionsHistoryRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { z } from "zod";
import { projectFormSchema } from "./validation";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const editProject = async (slug: string, data: any) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Projeto',
      details: `Tentativa de editar projeto sem autenticação.`,
      author: null,
      timestamp: new Date(),
      parameters: {
        data,
        slug,
        authenticated: false
      }
    });

    return { success: false, error: 'User not authenticated.' };
  }
  try {
    await projectFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Projeto',
        details: `Falha na validação ao editar projeto "${data.name}".`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug,
          validationErrors: error.flatten().fieldErrors
        }
      });

      return { success: false, error: 'Invalid project data.' };
    }

    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Projeto',
      details: `Erro de validação ao editar projeto.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug,
        error: 'Validation error'
      }
    });

    return { success: false, error: 'Validation error.' };
  }
  try {
    const projectsRepository = new ProjectsRepository();
    
    // Check for duplicates
    const allProjects = await projectsRepository.findAll();
    const duplicateProject = allProjects.find(project => 
      project.name === data.name &&
      project.expectedBudget === data.expectedBudget &&
      project.deadline === data.deadline &&
      project.description === data.description &&
      project.client === data.client &&
      project.slug !== slug
    );
    
    if (duplicateProject) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Projeto',
        details: `Tentativa de editar projeto com dados duplicados.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: 'A project with the same data already exists.' };
    }
    
    const currentData = await projectsRepository.findBySlug(slug);
    
    if (!currentData) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Projeto',
        details: `Tentativa de editar projeto não encontrado.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: 'Project not found.' };
    }
    
    if (
      currentData.name === data.name &&
      currentData.expectedBudget === data.expectedBudget &&
      currentData.deadline === data.deadline &&
      currentData.description === data.description &&
      currentData.client === data.client
    ) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Projeto',
        details: `Tentativa de editar projeto "${currentData.name}" sem alterações.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: 'No changes detected. Please modify at least one field.' };
    }
    
    const updateData: Record<string, any> = {};
    if (typeof data.name !== 'undefined') updateData.name = data.name;
    if (typeof data.expectedBudget !== 'undefined') updateData.expectedBudget = data.expectedBudget;
    if (typeof data.deadline !== 'undefined') updateData.deadline = data.deadline;
    if (typeof data.description !== 'undefined') updateData.description = data.description;
    if (typeof data.client !== 'undefined') updateData.client = data.client;
    
    await projectsRepository.update(currentData.id, updateData);

    await actionsHistoryRepository.create({
      action: 'Projeto Editado',
      details: `Projeto "${currentData.name}" foi editado.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug
      }
    });

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
      await actionsHistoryRepository.create({
        action: 'Falha ao Criar Notificação',
        details: `Erro ao criar notificação para edição de projeto "${name}". Erro: ${notificationRes.error}`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug,
          error: notificationRes.error
        }
      });

      return { success: false, error: 'Error creating notification' };
    }
    return { success: true, error: '' };
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error editing project:", error.message);

      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Projeto',
        details: `Erro ao editar projeto. Erro: ${error.message}`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug,
          error: error.message
        }
      });
    }
    return { success: false, error: 'Error editing the project.' };
  }
};
