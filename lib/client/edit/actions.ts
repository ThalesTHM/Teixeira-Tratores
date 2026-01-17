"use server";

import { ActionsHistoryRepository, ClientsRepository } from "@/database/repositories/Repositories";
import { SessionService } from "@/services/session/SessionService";
import { clientFormSchema } from "./validation";
import { z } from "zod";
import { NotificationPriority, NotificationRole, NotificationSource, NotificationsService } from "@/services/notifications/NotificationsService";

const actionsHistoryRepository = new ActionsHistoryRepository();

export const editClient = async (slug: string, data: any) => {
  const sessionService = new SessionService();
  const session = await sessionService.getUserFromSession();
  
  if (!session) {
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Cliente',
      details: `Tentativa de editar cliente sem autenticação.`,
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
  // Validate with zod
  try {
    await clientFormSchema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Cliente',
        details: `Falha na validação ao editar cliente "${data.name}".`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug,
          validationErrors: error.flatten().fieldErrors
        }
      });

      return { success: false, error: 'Invalid client data.' };
    }

    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Cliente',
      details: `Erro de validação ao editar cliente.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug
      }
    });

    return { success: false, error: 'Validation error.' };
  }
  try {
    const clientsRepository = new ClientsRepository();

    // Check for duplicates
    const allClients = await clientsRepository.findAll();
    const duplicateClient = allClients.find(client => 
      client.name === data.name && 
      client.cpf === data.cpf && 
      client.address === data.address && 
      client.pnumber === data.pnumber &&
      client.slug !== slug
    );

    if (duplicateClient) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Cliente',
        details: `Tentativa de editar cliente com dados duplicados.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: 'A client with the same data already exists.' };
    }

    const clientData = await clientsRepository.findBySlug(slug);

    if (!clientData) {
      await actionsHistoryRepository.create({
        action: 'Falha na Edição de Cliente',
        details: `Tentativa de editar cliente não encontrado.`,
        author: session,
        timestamp: new Date(),
        parameters: {
          ...data,
          slug
        }
      });

      return { success: false, error: 'Client not found.' };
    }

    await clientsRepository.update(clientData.id, {
      name: data.name,
      cpf: data.cpf,
      address: data.address,
      pnumber: data.pnumber
    });

    await actionsHistoryRepository.create({
      action: 'Cliente Editado',
      details: `Cliente "${data.name}" foi editado.`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug
      }
    });

    // Notification
    const name = clientData.name || "Cliente";
    const notification = {
      message: `Cliente "${name}" foi editado.`,
      role: NotificationRole.MANAGER,
      createdBy: session.name,
      slug: clientData.slug,
      priority: NotificationPriority.LOW,
      notificationSource: NotificationSource.CLIENT
    };
    const notificationRes = await NotificationsService.createNotification(notification);
    if (!notificationRes.success) {
      await actionsHistoryRepository.create({
        action: 'Falha ao Criar Notificação',
        details: `Erro ao criar notificação para edição de cliente "${name}". Erro: ${notificationRes.error}`,
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
    await actionsHistoryRepository.create({
      action: 'Falha na Edição de Cliente',
      details: `Erro ao editar cliente "${data.name}". Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      author: session,
      timestamp: new Date(),
      parameters: {
        ...data,
        slug,
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    });

    return { success: false, error: 'Error editing the client.' };
  }
};
